const imaps = require('imap-simple');
const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');

class OutlookIMAPService {
    constructor() {
        // Debug environment variables
        console.log('🔍 DEBUG - Environment check:');
        console.log('  OUTLOOK_EMAIL from env:', process.env.OUTLOOK_EMAIL);
        console.log('  OUTLOOK_PASSWORD from env:', process.env.OUTLOOK_PASSWORD ? `Found (${process.env.OUTLOOK_PASSWORD.length} chars)` : 'NOT FOUND');

        // Default to grant@vigagency.com
        this.email = process.env.OUTLOOK_EMAIL || 'grant@vigagency.com';
        this.password = process.env.OUTLOOK_PASSWORD || '';

        console.log('📧 Outlook Service Initialized:');
        console.log('  Email:', this.email);
        console.log('  Password configured:', this.password ? `Yes (${this.password.length} chars)` : 'NO - NOT SET');

        this.imapConfig = {
            imap: {
                user: this.email,
                password: this.password,
                host: process.env.OUTLOOK_IMAP_HOST || 'outlook.office365.com',
                port: parseInt(process.env.OUTLOOK_IMAP_PORT) || 993,
                tls: true,
                authTimeout: 20000,
                tlsOptions: {
                    rejectUnauthorized: false
                },
                connTimeout: 30000,
                debug: console.log
            }
        };

        this.smtpTransporter = null;
        this.connection = null;
    }

    // Initialize SMTP transporter
    initSMTP() {
        if (!this.smtpTransporter) {
            const smtpPort = parseInt(process.env.OUTLOOK_SMTP_PORT) || 465;
            this.smtpTransporter = nodemailer.createTransport({
                host: process.env.OUTLOOK_SMTP_HOST || 'smtpout.secureserver.net',
                port: smtpPort,
                secure: smtpPort === 465, // true for 465, false for 587
                auth: {
                    user: this.email,
                    pass: this.password
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        }
        return this.smtpTransporter;
    }

    // Connect to IMAP
    async connect() {
        try {
            console.log(`📧 Connecting to Outlook IMAP for ${this.email}...`);
            this.connection = await imaps.connect(this.imapConfig);
            console.log('✅ Connected to Outlook IMAP');
            return this.connection;
        } catch (error) {
            console.error('❌ IMAP connection error:', error.message);

            // Provide helpful error messages
            if (error.message.includes('LOGIN failed') || error.message.includes('AUTHENTICATIONFAILED')) {
                const helpfulError = new Error('Exchange Server blocking IMAP - authentication failed');
                helpfulError.help = `Your email trunks through Exchange Server which typically blocks IMAP.

OPTION 1 - Ask IT to enable IMAP:
Your Exchange administrator needs to enable IMAP access for ${this.email}
This is often disabled by default in Exchange environments.

OPTION 2 - Use App Password (if available):
1. Go to: https://mysignins.microsoft.com/security-info
2. Sign in with ${this.email}
3. Add method > App password
4. Create password named "Vanguard COI"
5. Update OUTLOOK_PASSWORD in .env

OPTION 3 - Use OAuth2/Modern Auth (Exchange Online):
Exchange often requires OAuth2 instead of passwords.
This requires registering an app in Azure AD.

OPTION 4 - Use a different email account:
Consider using a regular email account (Gmail, Outlook.com, etc.)
that supports standard IMAP access.

Current issue: Exchange Server is rejecting IMAP login with password authentication.`;
                throw helpfulError;
            } else if (error.message.includes('ENOTFOUND')) {
                throw new Error('Cannot connect to Outlook server. Please check your internet connection.');
            } else if (error.message.includes('ETIMEDOUT')) {
                throw new Error('Connection timed out. The server may be blocking IMAP access.');
            }

            throw error;
        }
    }

    // Disconnect from IMAP
    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }

    // Fetch emails
    async getEmails(filter = 'UNSEEN', maxEmails = 50) {
        let connection = null;
        try {
            connection = await this.connect();
            await connection.openBox('INBOX');

            // Search for emails
            const searchCriteria = filter === 'ALL' ? ['ALL'] : [filter];

            // Add COI-related search if needed
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT'],
                markSeen: false,
                struct: true
            };

            const messages = await connection.search(searchCriteria, fetchOptions);

            // Process messages
            const emails = [];
            for (let i = 0; i < Math.min(messages.length, maxEmails); i++) {
                const msg = messages[i];
                const header = msg.parts.find(part => part.which === 'HEADER');
                const body = msg.parts.find(part => part.which === 'TEXT');

                if (header && header.body) {
                    const from = header.body.from ? header.body.from[0] : '';
                    const subject = header.body.subject ? header.body.subject[0] : '';
                    const date = header.body.date ? header.body.date[0] : '';

                    // Only include COI-related emails
                    if (subject.toLowerCase().includes('coi') ||
                        subject.toLowerCase().includes('certificate') ||
                        subject.toLowerCase().includes('insurance')) {

                        emails.push({
                            id: msg.attributes.uid,
                            messageId: header.body['message-id'] ? header.body['message-id'][0] : '',
                            subject: subject,
                            from: from,
                            fromName: from.split('<')[0].trim(),
                            fromEmail: from.match(/<(.+)>/)?.[1] || from,
                            date: date,
                            preview: body?.body?.substring(0, 200) || '',
                            isRead: !msg.attributes.flags.includes('\\Seen'),
                            hasAttachments: msg.attributes.struct?.some(s => s.disposition?.type === 'attachment')
                        });
                    }
                }
            }

            console.log(`📬 Found ${emails.length} COI-related emails`);
            return emails;

        } catch (error) {
            console.error('Error fetching emails:', error);
            throw error;
        } finally {
            if (connection) {
                await this.disconnect();
            }
        }
    }

    // Get single email with full content
    async getEmail(uid) {
        let connection = null;
        try {
            connection = await this.connect();
            await connection.openBox('INBOX');

            const messages = await connection.search([['UID', uid]], {
                bodies: '',
                markSeen: false
            });

            if (messages.length === 0) {
                throw new Error('Email not found');
            }

            const msg = messages[0];
            const parsed = await simpleParser(msg.parts[0].body);

            return {
                id: uid,
                subject: parsed.subject,
                from: parsed.from?.text || '',
                to: parsed.to?.text || '',
                date: parsed.date,
                body: parsed.html || parsed.text || '',
                bodyType: parsed.html ? 'html' : 'text',
                attachments: parsed.attachments?.map(att => ({
                    filename: att.filename,
                    size: att.size,
                    contentType: att.contentType
                })) || []
            };

        } catch (error) {
            console.error('Error fetching email:', error);
            throw error;
        } finally {
            if (connection) {
                await this.disconnect();
            }
        }
    }

    // Send email
    async sendEmail(to, subject, html, attachments = []) {
        try {
            const transporter = this.initSMTP();

            const mailOptions = {
                from: `"${this.email.split('@')[0]}" <${this.email}>`,
                to: to,
                subject: subject,
                html: html,
                attachments: attachments.map(att => ({
                    filename: att.name || att.filename,
                    content: att.content,
                    contentType: att.contentType,
                    encoding: att.encoding || 'base64'  // Specify encoding for nodemailer
                }))
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent:', result.messageId);

            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            console.error('Error sending email:', error);

            if (error.responseCode === 535) {
                throw new Error('SMTP authentication failed. Please check credentials or use an app password.');
            }

            throw error;
        }
    }

    // Mark email as read
    async markAsRead(uid) {
        let connection = null;
        try {
            connection = await this.connect();
            await connection.openBox('INBOX');

            await connection.addFlags(uid, '\\Seen');
            console.log(`✅ Marked email ${uid} as read`);

            return { success: true };

        } catch (error) {
            console.error('Error marking email as read:', error);
            throw error;
        } finally {
            if (connection) {
                await this.disconnect();
            }
        }
    }

    // Test connection
    async testConnection() {
        try {
            await this.connect();
            await this.disconnect();

            // Also test SMTP
            const transporter = this.initSMTP();
            await transporter.verify();

            return {
                success: true,
                email: this.email,
                imap: 'Connected',
                smtp: 'Connected'
            };

        } catch (error) {
            return {
                success: false,
                email: this.email,
                error: error.message,
                help: 'You may need to: 1) Enable IMAP in Outlook settings, 2) Use an app password instead of regular password, 3) Check firewall settings'
            };
        }
    }

    // Check if configured
    isConfigured() {
        return !!(this.email && this.password);
    }
}

module.exports = OutlookIMAPService;