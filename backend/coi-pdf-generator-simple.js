const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generate ACORD 25 PDF from policy data
 * This version creates a simple PDF without template
 */
async function generateSimpleACORD25PDF(policyData) {
    try {
        // Always create new PDF (avoiding template issues)
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Letter size
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const { width, height } = page.getSize();

        // Draw ACORD 25 header
        page.drawText('CERTIFICATE OF LIABILITY INSURANCE', {
            x: 150,
            y: height - 50,
            size: 16,
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        page.drawText('ACORD 25 (2016/03)', {
            x: 450,
            y: height - 50,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Draw a line
        page.drawLine({
            start: { x: 50, y: height - 70 },
            end: { x: width - 50, y: height - 70 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Producer section
        let currentY = height - 100;
        const lineHeight = 20;

        page.drawText('PRODUCER', {
            x: 50,
            y: currentY,
            size: 10,
            font: boldFont,
        });

        currentY -= lineHeight;
        page.drawText('Vanguard Insurance Agency', {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('123 Insurance Way', {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('Insurance City, ST 12345', {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        // Insured section
        currentY = height - 100;
        page.drawText('INSURED', {
            x: 320,
            y: currentY,
            size: 10,
            font: boldFont,
        });

        currentY -= lineHeight;
        page.drawText(policyData.insuredName || policyData.clientName || 'N/A', {
            x: 320,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        const address = policyData.insuredAddress || '123 Main St';
        page.drawText(address, {
            x: 320,
            y: currentY,
            size: 10,
            font: font,
        });

        // Insurer section
        currentY = height - 220;
        page.drawText('INSURERS AFFORDING COVERAGE', {
            x: 50,
            y: currentY,
            size: 10,
            font: boldFont,
        });

        currentY -= lineHeight;
        page.drawText('INSURER A: ' + (policyData.carrier || 'Insurance Carrier'), {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        // Coverage section
        currentY -= lineHeight * 2;

        // Draw coverage table headers
        page.drawText('TYPE OF INSURANCE', {
            x: 50,
            y: currentY,
            size: 9,
            font: boldFont,
        });

        page.drawText('POLICY NUMBER', {
            x: 250,
            y: currentY,
            size: 9,
            font: boldFont,
        });

        page.drawText('LIMITS', {
            x: 450,
            y: currentY,
            size: 9,
            font: boldFont,
        });

        // General Liability
        currentY -= lineHeight;
        page.drawText('GENERAL LIABILITY', {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        page.drawText(policyData.policyNumber || 'N/A', {
            x: 250,
            y: currentY,
            size: 10,
            font: font,
        });

        // Coverage limits
        currentY -= lineHeight;
        page.drawText('Each Occurrence:', {
            x: 350,
            y: currentY,
            size: 9,
            font: font,
        });

        page.drawText('$' + (policyData.occurrenceLimit || '1,000,000'), {
            x: 450,
            y: currentY,
            size: 9,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('General Aggregate:', {
            x: 350,
            y: currentY,
            size: 9,
            font: font,
        });

        page.drawText('$' + (policyData.aggregateLimit || '2,000,000'), {
            x: 450,
            y: currentY,
            size: 9,
            font: font,
        });

        // Policy dates
        currentY -= lineHeight * 2;
        page.drawText('POLICY EFFECTIVE DATE: ' + (policyData.effectiveDate || new Date().toISOString().split('T')[0]), {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('POLICY EXPIRATION DATE: ' + (policyData.expirationDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]), {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        // Certificate Holder
        currentY -= lineHeight * 3;
        page.drawText('CERTIFICATE HOLDER', {
            x: 50,
            y: currentY,
            size: 10,
            font: boldFont,
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

        // Footer disclaimer
        page.drawText('This certificate is issued as a matter of information only and confers no rights upon the certificate holder.', {
            x: 50,
            y: 50,
            size: 8,
            font: font,
        });

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;

    } catch (error) {
        console.error('Error generating simple ACORD 25 PDF:', error);
        throw error;
    }
}

/**
 * Generate COI PDF endpoint
 * POST /api/coi/generate-pdf
 */
router.post('/generate-pdf', async (req, res) => {
    try {
        const policyData = req.body;
        console.log('Generating simple ACORD 25 PDF for policy:', policyData.policyNumber);

        const pdfBytes = await generateSimpleACORD25PDF(policyData);

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

        // Generate PDF using simple method
        console.log('Generating simple PDF for email attachment...');
        const pdfBytes = await generateSimpleACORD25PDF(policyData);
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
                    messageId: result.id,
                    message: 'Email sent with ACORD 25 PDF attachment'
                });
            } catch (sendError) {
                console.error('Email send error:', sendError);
                res.status(500).json({
                    error: 'Failed to send email',
                    details: sendError.message
                });
            } finally {
                db.close();
            }
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