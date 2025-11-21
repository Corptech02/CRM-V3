const axios = require('axios');
const qs = require('querystring');

class OutlookService {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.email = null;
    }

    /**
     * Initialize with OAuth tokens
     */
    async initialize(credentials) {
        try {
            this.clientId = credentials.client_id;
            this.clientSecret = credentials.client_secret;
            this.redirectUri = credentials.redirect_uri;
            this.refreshToken = credentials.refresh_token;
            this.accessToken = credentials.access_token;
            this.tokenExpiry = credentials.expiry_date;
            this.email = credentials.email;

            // Check if token needs refresh
            if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
                await this.refreshAccessToken();
            }

            console.log('Outlook service initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Outlook service:', error);
            throw error;
        }
    }

    /**
     * Get authorization URL
     */
    getAuthUrl(credentials) {
        const params = {
            client_id: credentials.client_id,
            response_type: 'code',
            redirect_uri: credentials.redirect_uri,
            response_mode: 'query',
            scope: 'openid offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
            state: 'outlook_auth'
        };

        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${qs.stringify(params)}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code, credentials) {
        try {
            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

            const params = {
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
                code: code,
                redirect_uri: credentials.redirect_uri,
                grant_type: 'authorization_code'
            };

            const response = await axios.post(tokenUrl, qs.stringify(params), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                token_type: response.data.token_type,
                expiry_date: Date.now() + (response.data.expires_in * 1000)
            };
        } catch (error) {
            console.error('Error exchanging code for tokens:', error.response?.data || error);
            throw error;
        }
    }

    /**
     * Refresh the access token
     */
    async refreshAccessToken() {
        try {
            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

            const params = {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: this.refreshToken,
                grant_type: 'refresh_token'
            };

            const response = await axios.post(tokenUrl, qs.stringify(params), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

            console.log('Outlook access token refreshed');
            return response.data;
        } catch (error) {
            console.error('Error refreshing token:', error.response?.data || error);
            throw error;
        }
    }

    /**
     * List emails from inbox
     */
    async listMessages(filter = '', maxResults = 20) {
        try {
            // Refresh token if needed
            if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
                await this.refreshAccessToken();
            }

            // Build query for COI-related emails
            let query = filter || "subject eq 'COI' or subject eq 'certificate' or subject eq 'insurance' or subject eq 'ACORD'";

            const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=contains(subject,'COI') or contains(subject,'certificate') or contains(subject,'insurance')&$top=${maxResults}&$orderby=receivedDateTime desc`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Transform Outlook messages to match our format
            const messages = response.data.value.map(msg => ({
                id: msg.id,
                threadId: msg.conversationId,
                from: msg.from?.emailAddress?.address || '',
                to: msg.toRecipients?.map(r => r.emailAddress.address).join(', ') || '',
                subject: msg.subject,
                date: new Date(msg.receivedDateTime),
                snippet: msg.bodyPreview,
                body: msg.body?.content || '',
                attachments: msg.hasAttachments ? [] : [], // Will need separate call to get attachments
                labelIds: msg.categories || []
            }));

            return messages;
        } catch (error) {
            console.error('Error listing Outlook messages:', error.response?.data || error);
            throw error;
        }
    }

    /**
     * Get a single message by ID
     */
    async getMessage(messageId) {
        try {
            // Refresh token if needed
            if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
                await this.refreshAccessToken();
            }

            const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$expand=attachments`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const msg = response.data;

            return {
                id: msg.id,
                threadId: msg.conversationId,
                from: msg.from?.emailAddress?.address || '',
                to: msg.toRecipients?.map(r => r.emailAddress.address).join(', ') || '',
                subject: msg.subject,
                date: new Date(msg.receivedDateTime),
                snippet: msg.bodyPreview,
                body: msg.body?.content || '',
                attachments: msg.attachments?.map(att => ({
                    filename: att.name,
                    mimeType: att.contentType,
                    size: att.size,
                    attachmentId: att.id
                })) || [],
                labelIds: msg.categories || []
            };
        } catch (error) {
            console.error('Error getting Outlook message:', error.response?.data || error);
            throw error;
        }
    }

    /**
     * Send email
     */
    async sendEmail({ to, subject, body, cc = '', bcc = '', attachments = [] }) {
        try {
            // Refresh token if needed
            if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
                await this.refreshAccessToken();
            }

            const message = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: body
                },
                toRecipients: to.split(',').map(email => ({
                    emailAddress: { address: email.trim() }
                }))
            };

            if (cc) {
                message.ccRecipients = cc.split(',').map(email => ({
                    emailAddress: { address: email.trim() }
                }));
            }

            if (bcc) {
                message.bccRecipients = bcc.split(',').map(email => ({
                    emailAddress: { address: email.trim() }
                }));
            }

            // Handle attachments if needed
            if (attachments && attachments.length > 0) {
                message.attachments = attachments.map(att => ({
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: att.filename,
                    contentType: att.mimeType,
                    contentBytes: att.data
                }));
            }

            const response = await axios.post(
                'https://graph.microsoft.com/v1.0/me/sendMail',
                { message },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return { success: true, messageId: response.headers['message-id'] };
        } catch (error) {
            console.error('Error sending email:', error.response?.data || error);
            throw error;
        }
    }

    /**
     * Search for COI-related emails
     */
    async searchCOIEmails(searchTerm = '', days = 30) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const dateString = date.toISOString();

        let filter = `receivedDateTime ge ${dateString}`;

        if (searchTerm) {
            filter += ` and (contains(subject,'${searchTerm}') or contains(body/content,'${searchTerm}'))`;
        } else {
            filter += ` and (contains(subject,'COI') or contains(subject,'certificate') or contains(subject,'insurance'))`;
        }

        return await this.listMessages(filter);
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId) {
        try {
            // Refresh token if needed
            if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
                await this.refreshAccessToken();
            }

            await axios.patch(
                `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
                { isRead: true },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return true;
        } catch (error) {
            console.error('Error marking message as read:', error.response?.data || error);
            throw error;
        }
    }
}

module.exports = OutlookService;