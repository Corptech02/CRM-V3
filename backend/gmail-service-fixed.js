const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GmailService {
    constructor() {
        this.gmail = null;
        this.oauth2Client = null;
    }

    async initialize(credentials) {
        if (!credentials.access_token) {
            throw new Error('Access token required');
        }

        this.oauth2Client = new google.auth.OAuth2(
            credentials.client_id || process.env.GMAIL_CLIENT_ID,
            credentials.client_secret || process.env.GMAIL_CLIENT_SECRET,
            credentials.redirect_uri || process.env.GMAIL_REDIRECT_URI
        );

        this.oauth2Client.setCredentials({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
            token_type: credentials.token_type,
            expiry_date: credentials.expiry_date
        });

        // Handle token refresh automatically
        this.oauth2Client.on('tokens', (tokens) => {
            console.log('Gmail tokens refreshed');
            if (tokens.refresh_token) {
                this.oauth2Client.setCredentials(tokens);
            }
        });

        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        console.log('Gmail API initialized successfully');
    }

    /**
     * FIXED: Send email with proper PDF attachment handling
     */
    async sendEmail({ to, subject, body, cc = '', bcc = '', attachments = [] }) {
        try {
            console.log(`Sending email to ${to} with ${attachments.length} attachments`);

            // Use nodemailer-like approach with proper MIME structure
            const nodemailer = require('nodemailer');

            // Create a test transporter just to build the message
            const testTransporter = nodemailer.createTransport({
                streamTransport: true
            });

            const mailOptions = {
                from: 'vanguard@gmail.com',
                to: to,
                cc: cc || undefined,
                bcc: bcc || undefined,
                subject: subject,
                html: body,
                attachments: attachments.map(att => ({
                    filename: att.filename,
                    content: Buffer.from(att.data, 'base64'),
                    contentType: att.mimeType || 'application/pdf'
                }))
            };

            // Build the message using nodemailer
            return new Promise((resolve, reject) => {
                testTransporter.sendMail(mailOptions, async (error, info) => {
                    if (error) {
                        return reject(error);
                    }

                    try {
                        // Get the raw message from nodemailer
                        const rawMessage = info.message.toString();

                        // Encode for Gmail API
                        const encodedMessage = Buffer.from(rawMessage)
                            .toString('base64')
                            .replace(/\+/g, '-')
                            .replace(/\//g, '_')
                            .replace(/=+$/, '');

                        const response = await this.gmail.users.messages.send({
                            userId: 'me',
                            requestBody: {
                                raw: encodedMessage
                            }
                        });

                        resolve(response.data);
                    } catch (sendError) {
                        reject(sendError);
                    }
                });
            });

        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    // Keep all other methods the same as the original service
    async listMessages(query = '', maxResults = 50) {
        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: query,
                maxResults: maxResults
            });

            if (!response.data.messages) {
                return [];
            }

            const messages = await Promise.all(
                response.data.messages.map(async (message) => {
                    const messageData = await this.getMessage(message.id);
                    return messageData;
                })
            );

            return messages;
        } catch (error) {
            console.error('Error listing messages:', error);
            return [];
        }
    }

    async getMessage(messageId) {
        try {
            const response = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId
            });

            const message = response.data;
            const headers = message.payload.headers;

            // Extract basic info
            const subject = headers.find(h => h.name === 'Subject')?.value || '';
            const from = headers.find(h => h.name === 'From')?.value || '';
            const to = headers.find(h => h.name === 'To')?.value || '';
            const date = headers.find(h => h.name === 'Date')?.value || '';

            // Extract body
            let body = '';
            const payload = message.payload;

            if (payload.body && payload.body.data) {
                body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
            } else if (payload.parts) {
                for (const part of payload.parts) {
                    if (part.mimeType === 'text/html' && part.body.data) {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                        break;
                    } else if (part.mimeType === 'text/plain' && part.body.data) {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    }
                }
            }

            // Extract attachments
            const attachments = this.extractAttachments(message.payload);

            return {
                id: message.id,
                threadId: message.threadId,
                subject,
                from,
                to,
                date,
                body,
                snippet: message.snippet,
                labelIds: message.labelIds,
                attachments,
                isRead: !message.labelIds.includes('UNREAD')
            };
        } catch (error) {
            console.error('Error getting message:', error);
            return null;
        }
    }

    extractAttachments(payload, attachments = []) {
        if (payload.parts) {
            payload.parts.forEach(part => {
                if (part.filename && part.body.attachmentId) {
                    attachments.push({
                        filename: part.filename,
                        mimeType: part.mimeType,
                        size: part.body.size,
                        attachmentId: part.body.attachmentId
                    });
                } else {
                    this.extractAttachments(part, attachments);
                }
            });
        }

        return attachments;
    }

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
            return false;
        }
    }
}

module.exports = GmailService;