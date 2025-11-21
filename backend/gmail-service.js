const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GmailService {
    constructor() {
        this.gmail = null;
        this.auth = null;
    }

    /**
     * Initialize Gmail API with OAuth2
     * Includes automatic token refresh
     */
    async initialize(credentials) {
        try {
            const auth = new google.auth.OAuth2(
                credentials.client_id,
                credentials.client_secret,
                credentials.redirect_uri
            );

            // Set credentials (including refresh token)
            auth.setCredentials({
                refresh_token: credentials.refresh_token,
                access_token: credentials.access_token,
                token_type: 'Bearer',
                expiry_date: credentials.expiry_date
            });

            // Set up automatic token refresh
            auth.on('tokens', (tokens) => {
                console.log('Gmail tokens refreshed');
                // Update stored credentials with new tokens
                if (tokens.refresh_token) {
                    credentials.refresh_token = tokens.refresh_token;
                }
                if (tokens.access_token) {
                    credentials.access_token = tokens.access_token;
                }
                if (tokens.expiry_date) {
                    credentials.expiry_date = tokens.expiry_date;
                }

                // Save updated credentials (this will be handled by the calling code)
                this.credentials = credentials;
            });

            this.auth = auth;
            this.gmail = google.gmail({ version: 'v1', auth });
            this.credentials = credentials;

            console.log('Gmail API initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Gmail API:', error);
            throw error;
        }
    }

    /**
     * Get authorization URL for OAuth2
     */
    getAuthUrl(credentials) {
        const auth = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret,
            credentials.redirect_uri
        );

        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.modify'
        ];

        return auth.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code, credentials) {
        const auth = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret,
            credentials.redirect_uri
        );

        const { tokens } = await auth.getToken(code);
        return tokens;
    }

    /**
     * List messages from inbox
     */
    async listMessages(query = '', maxResults = 20) {
        try {
            if (!this.gmail) {
                throw new Error('Gmail API not initialized');
            }

            // Build query for COI-related emails
            let finalQuery = query || 'subject:(COI OR "certificate of insurance" OR "insurance certificate" OR ACORD)';

            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: finalQuery,
                maxResults: maxResults
            });

            if (!response.data.messages) {
                return [];
            }

            // Get full message details for each message
            const messages = await Promise.all(
                response.data.messages.map(async (message) => {
                    return await this.getMessage(message.id);
                })
            );

            return messages;
        } catch (error) {
            console.error('Error listing messages:', error);
            throw error;
        }
    }

    /**
     * Get a single message by ID
     */
    async getMessage(messageId) {
        try {
            const response = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full'
            });

            const message = response.data;
            const headers = message.payload.headers;

            // Extract important headers
            const from = headers.find(h => h.name === 'From')?.value || '';
            const to = headers.find(h => h.name === 'To')?.value || '';
            const subject = headers.find(h => h.name === 'Subject')?.value || '';
            const date = headers.find(h => h.name === 'Date')?.value || '';

            // Extract body
            const body = this.extractBody(message.payload);

            // Extract attachments
            const attachments = this.extractAttachments(message.payload);

            return {
                id: message.id,
                threadId: message.threadId,
                from,
                to,
                subject,
                date: new Date(date),
                snippet: message.snippet,
                body,
                attachments,
                labelIds: message.labelIds || []
            };
        } catch (error) {
            console.error('Error getting message:', error);
            throw error;
        }
    }

    /**
     * Extract body from message payload
     */
    extractBody(payload) {
        let body = '';

        if (payload.body && payload.body.data) {
            body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        } else if (payload.parts) {
            for (const part of payload.parts) {
                if (part.mimeType === 'text/plain' && part.body.data) {
                    body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    break;
                } else if (part.mimeType === 'text/html' && part.body.data && !body) {
                    body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                } else if (part.parts) {
                    body = this.extractBody(part);
                    if (body) break;
                }
            }
        }

        return body;
    }

    /**
     * Extract attachments from message
     */
    extractAttachments(payload, attachments = []) {
        if (payload.parts) {
            for (const part of payload.parts) {
                if (part.filename && part.body.attachmentId) {
                    attachments.push({
                        filename: part.filename,
                        mimeType: part.mimeType,
                        size: part.body.size,
                        attachmentId: part.body.attachmentId
                    });
                } else if (part.parts) {
                    this.extractAttachments(part, attachments);
                }
            }
        }
        return attachments;
    }

    /**
     * Download attachment
     */
    async getAttachment(messageId, attachmentId) {
        try {
            const response = await this.gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: messageId,
                id: attachmentId
            });

            return Buffer.from(response.data.data, 'base64');
        } catch (error) {
            console.error('Error downloading attachment:', error);
            throw error;
        }
    }

    /**
     * Send email
     */
    async sendEmail({ to, subject, body, cc = '', bcc = '', attachments = [] }) {
        try {
            console.log(`Sending email to ${to} with ${attachments.length} attachments`);
            // Create email in RFC 2822 format
            const boundary = '----=_Part_0_1234567890';
            let emailParts = [
                `To: ${to}`,
                cc ? `Cc: ${cc}` : '',
                bcc ? `Bcc: ${bcc}` : '',
                `Subject: ${subject}`,
                'MIME-Version: 1.0',
                `Content-Type: multipart/mixed; boundary="${boundary}"`
            ].filter(line => line !== '');

            // Add the main headers and first boundary
            let email = emailParts.join('\r\n') + '\r\n\r\n';

            // Add HTML body part with proper encoding
            email += [
                `--${boundary}`,
                'Content-Type: text/html; charset=UTF-8',
                'Content-Transfer-Encoding: quoted-printable',
                '',
                body,
                ''
            ].join('\r\n');

            // Add attachments if any
            for (const attachment of attachments) {
                console.log(`Adding attachment: ${attachment.filename}, size: ${attachment.data.length} chars`);
                // Base64 data should be split into lines of 76 characters for MIME
                const base64Lines = attachment.data.match(/.{1,76}/g) || [];

                email += [
                    `--${boundary}`,
                    `Content-Type: ${attachment.mimeType || 'application/octet-stream'}`,
                    'Content-Transfer-Encoding: base64',
                    `Content-Disposition: attachment; filename="${attachment.filename}"`,
                    '',
                    ...base64Lines,
                    ''
                ].join('\r\n');
            }

            email += `--${boundary}--`;

            // Encode email
            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    /**
     * Search for COI-related emails
     */
    async searchCOIEmails(clientName = '', days = 30) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const dateString = date.toISOString().split('T')[0];

        let query = `after:${dateString} `;
        query += '(subject:(COI OR "certificate of insurance" OR "insurance certificate" OR ACORD) ';
        query += 'OR from:(agent OR broker OR insurance) ';
        query += 'OR has:attachment)';

        if (clientName) {
            query += ` "${clientName}"`;
        }

        return await this.listMessages(query);
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId) {
        try {
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });
            return true;
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }

    /**
     * Add label to message
     */
    async addLabel(messageId, labelName) {
        try {
            // First, get or create the label
            const labels = await this.gmail.users.labels.list({ userId: 'me' });
            let label = labels.data.labels.find(l => l.name === labelName);

            if (!label) {
                // Create label if it doesn't exist
                const response = await this.gmail.users.labels.create({
                    userId: 'me',
                    requestBody: {
                        name: labelName,
                        labelListVisibility: 'labelShow',
                        messageListVisibility: 'show'
                    }
                });
                label = response.data;
            }

            // Add label to message
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    addLabelIds: [label.id]
                }
            });

            return true;
        } catch (error) {
            console.error('Error adding label:', error);
            throw error;
        }
    }
}

module.exports = GmailService;