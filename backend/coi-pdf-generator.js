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

/**
 * Send COI with stored profile PDF (updated format for vigagency.com)
 * POST /api/coi/send-profile-pdf
 */
router.post('/send-profile-pdf', async (req, res) => {
    try {
        const { to, cc, bcc, subject, body, policyData, certificateHolder, provider } = req.body;

        console.log('🚀 Processing send-profile-pdf request:', {
            to,
            subject,
            policyData: policyData ? 'provided' : 'missing',
            certificateHolder: certificateHolder ? 'provided' : 'missing',
            provider: provider || 'gmail'
        });

        // Validate required fields
        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Recipient email is required'
            });
        }

        if (!policyData) {
            return res.status(400).json({
                success: false,
                error: 'Policy data is required'
            });
        }

        // Create enhanced policy data with certificate holder information
        const enhancedPolicyData = {
            ...policyData,
            certificateHolder: certificateHolder || 'As requested\nPer policyholder request'
        };

        // Generate PDF with certificate holder information
        console.log('📄 Generating PDF with certificate holder info...');
        const pdfBytes = await generateACORD25PDFWithCertificateHolder(enhancedPolicyData);
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

        // Determine which email service to use
        const emailProvider = provider || 'gmail';
        const emailService = emailProvider === 'outlook' ?
            require('./outlook-service') :
            require('./gmail-service');

        // Prepare attachment
        const filename = `ACORD_25_${policyData.policyNumber || 'COI'}_${new Date().toISOString().split('T')[0]}.pdf`;
        const attachment = {
            filename,
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
                console.error('❌ Email credentials not found:', { provider: emailProvider, key: credKey });
                return res.status(500).json({
                    success: false,
                    error: 'Email Service Not Configured',
                    details: `${emailProvider.charAt(0).toUpperCase() + emailProvider.slice(1)} email service is not set up yet. Please contact your administrator to configure email credentials for sending COI documents.`
                });
            }

            try {
                const credentials = JSON.parse(row.value);
                await emailServiceInstance.initialize(credentials);

                console.log('📧 Sending email with PDF attachment...');
                const result = await emailServiceInstance.sendEmail({
                    to,
                    cc: cc || '',
                    bcc: bcc || '',
                    subject: subject || `Certificate of Insurance - ${policyData.clientName || 'Policyholder'}`,
                    body: body || 'Please find attached your Certificate of Insurance.',
                    attachments: [attachment]
                });

                console.log('✅ Email sent successfully:', { messageId: result.id || result.messageId });

                res.json({
                    success: true,
                    messageId: result.id || result.messageId,
                    message: 'Certificate of Insurance sent successfully'
                });

            } catch (sendError) {
                console.error('❌ Error sending email:', sendError);
                res.status(500).json({
                    success: false,
                    error: 'Failed to send email',
                    details: sendError.message
                });
            }

            db.close();
        });

    } catch (error) {
        console.error('❌ Error in send-profile-pdf:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process request',
            details: error.message
        });
    }
});

/**
 * Enhanced PDF generator that includes certificate holder information
 */
async function generateACORD25PDFWithCertificateHolder(policyData) {
    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Letter size
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const { width, height } = page.getSize();

        // Draw ACORD 25 header
        page.drawText('ACORD CERTIFICATE OF LIABILITY INSURANCE', {
            x: 150,
            y: height - 50,
            size: 14,
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        page.drawText(new Date().toLocaleDateString('en-US'), {
            x: 450,
            y: height - 50,
            size: 10,
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
            font: boldFont,
        });
        page.drawText('Vanguard Insurance Agency', {
            x: 120,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('2888 Nationwide Pkwy, Brunswick, OH 44212', {
            x: 120,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('Phone: (330) 460-0872', {
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
            font: boldFont,
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

        // Certificate Holder section (NEW)
        if (policyData.certificateHolder) {
            page.drawText('CERTIFICATE HOLDER:', {
                x: 50,
                y: currentY,
                size: 10,
                font: boldFont,
            });

            const certificateHolderLines = policyData.certificateHolder.split('\n');
            certificateHolderLines.forEach((line, index) => {
                page.drawText(line, {
                    x: 180,
                    y: currentY - (index * 15),
                    size: 10,
                    font: font,
                });
            });

            currentY -= lineHeight * (certificateHolderLines.length + 1);
        }

        // Insurance companies
        page.drawText('INSURER(S) AFFORDING COVERAGE', {
            x: 50,
            y: currentY,
            size: 10,
            font: boldFont,
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
            font: boldFont,
        });

        currentY -= lineHeight;

        // Policy details
        page.drawText(`Policy Number: ${policyData.policyNumber || 'N/A'}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('Commercial Auto Liability', {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
        });

        // Add policy limits and other standard ACORD 25 information
        currentY -= lineHeight;
        page.drawText('Each Accident: $1,000,000', {
            x: 200,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('Each Person: $1,000,000', {
            x: 200,
            y: currentY,
            size: 10,
            font: font,
        });

        currentY -= lineHeight;
        page.drawText('Each Occurrence: $1,000,000', {
            x: 200,
            y: currentY,
            size: 10,
            font: font,
        });

        // Footer with signature
        page.drawText('Authorized Representative', {
            x: 50,
            y: 100,
            size: 10,
            font: font,
        });

        page.drawText('Vanguard Insurance Agency', {
            x: 50,
            y: 80,
            size: 10,
            font: font,
        });

        return await pdfDoc.save();
    } catch (error) {
        console.error('Error generating ACORD 25 PDF with certificate holder:', error);
        throw error;
    }
}

module.exports = router;