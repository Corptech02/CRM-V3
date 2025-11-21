/**
 * Simple fix for Gmail PDF attachment corruption
 * Replaces the problematic sendEmail method only
 */

const fs = require('fs');
const originalGmailService = require('./gmail-service');

class FixedGmailService extends originalGmailService {
    /**
     * FIXED: Send email with properly formatted PDF attachments
     */
    async sendEmail({ to, subject, body, cc = '', bcc = '', attachments = [] }) {
        try {
            console.log(`Sending email to ${to} with ${attachments.length} attachments`);

            // Create email in proper RFC 2822 format with corrected base64 handling
            const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;

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

            // Add HTML body part
            email += [
                `--${boundary}`,
                'Content-Type: text/html; charset=UTF-8',
                'Content-Transfer-Encoding: quoted-printable',
                '',
                body,
                ''
            ].join('\r\n');

            // Add attachments with PROPER base64 handling
            for (const attachment of attachments) {
                console.log(`Adding attachment: ${attachment.filename}, size: ${attachment.data.length} chars`);

                // CRITICAL FIX: Don't split base64 data arbitrarily
                // Let the email client handle line wrapping
                const cleanBase64 = attachment.data.replace(/\s/g, ''); // Remove any existing whitespace

                email += [
                    `--${boundary}`,
                    `Content-Type: ${attachment.mimeType || 'application/pdf'}; name="${attachment.filename}"`,
                    'Content-Transfer-Encoding: base64',
                    `Content-Disposition: attachment; filename="${attachment.filename}"`,
                    '',
                    cleanBase64, // Keep base64 intact - don't force line breaks
                    ''
                ].join('\r\n');
            }

            email += `--${boundary}--`;

            // Encode email for Gmail API (this part stays the same)
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
}

module.exports = FixedGmailService;