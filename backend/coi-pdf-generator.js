const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generate ACORD 25 PDF from policy data
 */
async function generateACORD25PDF(policyData) {
    try {
        // Always create a new PDF - template appears corrupted
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Letter size
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const { width, height } = page.getSize();

        // Draw ACORD 25 header
        page.drawText('ACORD CERTIFICATE OF LIABILITY INSURANCE', {
            x: 150,
            y: height - 50,
            size: 14,
            font: font,
            color: rgb(0, 0, 0),
        });

        // Draw policy information
        const startY = height - 100;
        const lineHeight = 20;
        let currentY = startY;

        // Producer section
        page.drawText('PRODUCER:', {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });
        page.drawText('Vanguard Insurance Agency', {
            x: 120,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight * 2;

        // Insured section
        page.drawText('INSURED:', {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });
        page.drawText(policyData.insuredName || policyData.clientName || 'N/A', {
            x: 120,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText(policyData.insuredAddress || '123 Main St, City, State 12345', {
            x: 120,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight * 2;

        // Insurance companies
        page.drawText('INSURER(S) AFFORDING COVERAGE', {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('INSURER A: ' + (policyData.carrier || 'Insurance Company'), {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight * 2;

        // Coverages section
        page.drawText('COVERAGES', {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight;

            // Policy details
            const policyType = policyData.policyType || 'general-liability';
            const policyTypeDisplay = policyType.replace(/-/g, ' ').toUpperCase();

            page.drawText('TYPE OF INSURANCE:', {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });
            page.drawText(policyTypeDisplay, {
                x: 180,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight;
            page.drawText('POLICY NUMBER: ' + (policyData.policyNumber || 'N/A'), {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight;
            page.drawText('POLICY EFF DATE: ' + (policyData.effectiveDate || 'N/A'), {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            page.drawText('POLICY EXP DATE: ' + (policyData.expirationDate || 'N/A'), {
                x: 250,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight * 2;

            // Limits
            page.drawText('LIMITS', {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight;
            page.drawText('EACH OCCURRENCE: $' + (policyData.occurrenceLimit || '1,000,000'), {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight;
            page.drawText('AGGREGATE: $' + (policyData.aggregateLimit || '2,000,000'), {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight * 3;

            // Certificate holder
            page.drawText('CERTIFICATE HOLDER:', {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight;
            page.drawText(policyData.certificateHolder || 'Certificate Holder Name', {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            currentY -= lineHeight;
            page.drawText(policyData.certificateHolderAddress || 'Certificate Holder Address', {
                x: 50,
                y: currentY,
                size: 10,
                font: font,
            });

            // Footer
        page.drawText('This certificate is issued as a matter of information only and confers no rights upon the certificate holder.', {
            x: 50,
            y: 50,
            size: 8,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // No form fields to fill since we're creating a new PDF

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;

    } catch (error) {
        console.error('Error generating ACORD 25 PDF:', error);
        throw error;
    }
}

/**
 * Generate COI PDF endpoint
 * POST /api/coi/generate-pdf
 */
router.post('/generate-pdf', async (req, res) => {
    try {
        const { policyData } = req.body;
        console.log('Generating ACORD 25 PDF for policy:', policyData?.policyNumber);

        const pdfBytes = await generateACORD25PDF(policyData || {});

        // Return PDF as base64
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

        res.json({
            success: true,
            pdf: pdfBase64,
            filename: `ACORD_25_${policyData.policyNumber || 'COI'}_${Date.now()}.pdf`
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message
        });
    }
});

/**
 * Send COI with PDF attachment
 * POST /api/coi/send-with-pdf
 */
router.post('/send-with-pdf', async (req, res) => {
    try {
        const { to, cc, bcc, subject, body, policyData, provider } = req.body;

        // Generate PDF
        console.log('Generating PDF for email attachment...');
        const pdfBytes = await generateACORD25PDF(policyData);
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

        // Determine which email service to use
        const emailProvider = provider || 'gmail';
        const emailService = emailProvider === 'outlook' ?
            require('./outlook-service') :
            require('./gmail-service');

        // Prepare attachment
        const attachment = {
            filename: `ACORD_25_${policyData.policyNumber || 'COI'}.pdf`,
            mimeType: 'application/pdf',
            data: pdfBase64
        };

        // Send email with attachment
        const emailServiceInstance = new emailService();

        // Load credentials based on provider
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./vanguard.db');

        const credKey = emailProvider === 'outlook' ? 'outlook_tokens' : 'gmail_tokens';

        db.get('SELECT value FROM settings WHERE key = ?', [credKey], async (err, row) => {
            if (err || !row) {
                return res.status(500).json({
                    error: 'Email service not configured',
                    details: `${emailProvider} credentials not found`
                });
            }

            try {
                const credentials = JSON.parse(row.value);
                await emailServiceInstance.initialize(credentials);

                const result = await emailServiceInstance.sendEmail({
                    to,
                    cc,
                    bcc,
                    subject,
                    body,
                    attachments: [attachment]
                });

                res.json({
                    success: true,
                    messageId: result.id || result.messageId,
                    message: 'COI sent successfully with PDF attachment'
                });

            } catch (sendError) {
                console.error('Error sending email:', sendError);
                res.status(500).json({
                    error: 'Failed to send email',
                    details: sendError.message
                });
            }

            db.close();
        });

    } catch (error) {
        console.error('Error in send-with-pdf:', error);
        res.status(500).json({
            error: 'Failed to process request',
            details: error.message
        });
    }
});

module.exports = router;