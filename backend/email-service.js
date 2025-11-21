// Email Service for Vanguard Insurance
// Supports multiple providers: SendGrid, Mailgun, SMTP

const nodemailer = require('nodemailer');

class EmailService {
    constructor(config) {
        this.config = config;
        this.transporter = null;
        this.provider = config.provider || 'smtp';
        this.initializeTransporter();
    }

    initializeTransporter() {
        switch(this.provider) {
            case 'sendgrid':
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.sendgrid.net',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'apikey',
                        pass: this.config.sendgridApiKey
                    }
                });
                break;

            case 'mailgun':
                this.transporter = nodemailer.createTransporter({
                    host: 'smtp.mailgun.org',
                    port: 587,
                    secure: false,
                    auth: {
                        user: this.config.mailgunUsername,
                        pass: this.config.mailgunPassword
                    }
                });
                break;

            case 'gmail':
                // For Gmail OAuth2 (already configured in your app)
                this.transporter = nodemailer.createTransporter({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: this.config.gmailUser,
                        clientId: this.config.gmailClientId,
                        clientSecret: this.config.gmailClientSecret,
                        refreshToken: this.config.gmailRefreshToken
                    }
                });
                break;

            default:
                // Generic SMTP
                this.transporter = nodemailer.createTransporter({
                    host: this.config.smtpHost,
                    port: this.config.smtpPort || 587,
                    secure: this.config.smtpSecure || false,
                    auth: {
                        user: this.config.smtpUser,
                        pass: this.config.smtpPass
                    }
                });
        }
    }

    // Send quote email
    async sendQuoteEmail(to, quoteData) {
        const mailOptions = {
            from: this.config.fromEmail || 'info@vigagency.com',
            to: to,
            subject: `Insurance Quote - ${quoteData.companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
                        <h1>Vanguard Insurance Agency</h1>
                    </div>
                    <div style="padding: 20px; background: #f9fafb;">
                        <h2>Your Insurance Quote is Ready</h2>
                        <p>Dear ${quoteData.contactName || 'Valued Customer'},</p>
                        <p>Thank you for your interest in Vanguard Insurance Agency. We've prepared a customized insurance quote for ${quoteData.companyName}.</p>

                        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
                            <h3>Quote Details:</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li><strong>Coverage Type:</strong> ${quoteData.coverageType || 'Commercial Auto'}</li>
                                <li><strong>Premium:</strong> $${quoteData.premium || 'TBD'}/month</li>
                                <li><strong>Effective Date:</strong> ${quoteData.effectiveDate || 'Upon Approval'}</li>
                                <li><strong>Coverage Limit:</strong> ${quoteData.coverageLimit || '$1,000,000'}</li>
                            </ul>
                        </div>

                        <div style="background: #fee; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                            <strong>Next Steps:</strong>
                            <ol>
                                <li>Review the attached quote document</li>
                                <li>Contact your agent with any questions</li>
                                <li>Reply to this email to proceed with coverage</li>
                            </ol>
                        </div>

                        <p>Your dedicated agent: <strong>${quoteData.agentName || 'Sales Team'}</strong></p>
                        <p>Phone: <strong>${quoteData.agentPhone || '1-800-VANGUARD'}</strong></p>

                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

                        <p style="color: #6b7280; font-size: 12px; text-align: center;">
                            Vanguard Insurance Agency<br>
                            162-220-14-239.nip.io<br>
                            This email contains confidential information
                        </p>
                    </div>
                </div>
            `,
            attachments: quoteData.attachments || []
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Quote email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending quote email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send follow-up email
    async sendFollowUpEmail(to, leadData) {
        const mailOptions = {
            from: this.config.fromEmail || 'info@vigagency.com',
            to: to,
            subject: `Following up - Insurance Coverage for ${leadData.companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
                        <h1>Vanguard Insurance Agency</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hi ${leadData.contactName || 'there'},</p>
                        <p>I wanted to follow up on the insurance quote we sent for ${leadData.companyName}.</p>
                        <p>Have you had a chance to review it? I'm here to answer any questions you might have about:</p>
                        <ul>
                            <li>Coverage options</li>
                            <li>Premium pricing</li>
                            <li>Policy terms</li>
                            <li>Claims process</li>
                        </ul>
                        <p>Your current insurance expires on <strong>${leadData.expirationDate || 'N/A'}</strong>, and we want to ensure continuous coverage.</p>
                        <p>Please reply to this email or call me directly at ${leadData.agentPhone || '1-800-VANGUARD'}.</p>
                        <p>Best regards,<br>${leadData.agentName || 'Your Vanguard Team'}</p>
                    </div>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Follow-up email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending follow-up email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send COI (Certificate of Insurance)
    async sendCOI(to, coiData, pdfBuffer) {
        const mailOptions = {
            from: this.config.fromEmail || 'info@vigagency.com',
            to: to,
            subject: `Certificate of Insurance - ${coiData.companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
                        <h1>Certificate of Insurance</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Dear ${coiData.contactName || 'Valued Client'},</p>
                        <p>Your Certificate of Insurance for ${coiData.companyName} is attached to this email.</p>
                        <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
                            <h3>Certificate Details:</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li><strong>Policy Number:</strong> ${coiData.policyNumber}</li>
                                <li><strong>Effective Date:</strong> ${coiData.effectiveDate}</li>
                                <li><strong>Expiration Date:</strong> ${coiData.expirationDate}</li>
                                <li><strong>Coverage Type:</strong> ${coiData.coverageType}</li>
                            </ul>
                        </div>
                        <p>Please keep this certificate for your records. If you need additional copies or have any questions, please don't hesitate to contact us.</p>
                        <p>Thank you for choosing Vanguard Insurance Agency.</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `COI_${coiData.companyName.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
                    content: pdfBuffer
                }
            ]
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('COI email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending COI email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send welcome email for new clients
    async sendWelcomeEmail(to, clientData) {
        const mailOptions = {
            from: this.config.fromEmail || 'info@vigagency.com',
            to: to,
            subject: `Welcome to Vanguard Insurance Agency`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center;">
                        <h1>Welcome to Vanguard Insurance!</h1>
                    </div>
                    <div style="padding: 30px;">
                        <h2>Thank you for choosing us, ${clientData.name}!</h2>
                        <p>We're thrilled to have you as our newest client. Your trust in us means everything.</p>

                        <div style="background: #f0f9ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                            <h3>What's Next?</h3>
                            <ol>
                                <li>Your policy documents will arrive within 24 hours</li>
                                <li>Save our contact information for quick access</li>
                                <li>Download our mobile app for policy management</li>
                                <li>Set up your online account at vigagency.com</li>
                            </ol>
                        </div>

                        <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Your Dedicated Team:</h3>
                            <p><strong>Agent:</strong> ${clientData.agentName || 'Sales Team'}</p>
                            <p><strong>Direct Line:</strong> ${clientData.agentPhone || '1-800-VANGUARD'}</p>
                            <p><strong>Email:</strong> ${clientData.agentEmail || 'support@vigagency.com'}</p>
                        </div>

                        <p>We're here for you 24/7. Don't hesitate to reach out with any questions!</p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://vigagency.com" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Your Account</a>
                        </div>
                    </div>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Welcome email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return { success: false, error: error.message };
        }
    }

    // Test email configuration
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('Email server connection successful');
            return { success: true, message: 'Email configuration is working' };
        } catch (error) {
            console.error('Email server connection failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = EmailService;