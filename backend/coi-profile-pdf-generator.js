const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Find the most recent COI profile PDF for a policy
 */
function findCOIProfilePDF(policyData) {
    try {
        const vanguardDir = '/var/www/vanguard';

        // Try to find by company name or policy number
        const companyName = policyData.insured?.['Name/Business Name'] ||
                           policyData.clientName ||
                           policyData.insuredName || '';

        // Search patterns
        const searchPatterns = [
            `${companyName.replace(/\s+/g, '-')}-COI-Profile.pdf`,
            `${companyName.replace(/\s+/g, '_')}-COI-Profile.pdf`,
            `*${companyName.split(' ')[0]}*-COI-Profile.pdf`,
            `*COI-Profile.pdf`
        ];

        console.log('🔍 Searching for COI profile PDF for:', companyName);

        for (const pattern of searchPatterns) {
            const files = fs.readdirSync(vanguardDir).filter(file => {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
                    return regex.test(file);
                }
                return file.toLowerCase() === pattern.toLowerCase();
            });

            if (files.length > 0) {
                // Get the most recent file
                const mostRecent = files.map(file => ({
                    name: file,
                    path: path.join(vanguardDir, file),
                    mtime: fs.statSync(path.join(vanguardDir, file)).mtime
                })).sort((a, b) => b.mtime - a.mtime)[0];

                console.log('✅ Found COI profile PDF:', mostRecent.name);
                return mostRecent.path;
            }
        }

        console.log('❌ No COI profile PDF found for:', companyName);
        return null;

    } catch (error) {
        console.error('Error finding COI profile PDF:', error);
        return null;
    }
}

/**
 * Add text overlay to PDF (certificate holder info)
 */
async function addTextOverlayToPDF(pdfPath, certificateHolderText) {
    try {
        console.log('📝 Adding certificate holder overlay to PDF:', pdfPath);

        // Read the existing PDF
        const existingPdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Get first page
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Embed font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Position for certificate holder (bottom left area)
        const overlayX = 50;
        const overlayY = 100; // From bottom

        // Parse certificate holder text
        const lines = certificateHolderText.split('\n').filter(line => line.trim());

        // Add text overlay
        let currentY = overlayY;
        lines.forEach((line, index) => {
            const useFont = index === 0 ? boldFont : font; // First line bold
            const fontSize = index === 0 ? 11 : 10;

            firstPage.drawText(line.trim(), {
                x: overlayX,
                y: currentY,
                size: fontSize,
                font: useFont,
                color: rgb(0, 0, 0)
            });

            currentY -= 15; // Line spacing
        });

        // Add timestamp in small text
        const timestamp = new Date().toLocaleDateString();
        firstPage.drawText(`Generated: ${timestamp}`, {
            x: width - 120,
            y: 20,
            size: 8,
            font: font,
            color: rgb(0.5, 0.5, 0.5)
        });

        // Save modified PDF
        const modifiedPdfBytes = await pdfDoc.save();
        return modifiedPdfBytes;

    } catch (error) {
        console.error('Error adding text overlay to PDF:', error);
        throw error;
    }
}

/**
 * Generate COI PDF using stored profile with overlay
 * POST /api/coi/generate-profile-pdf
 */
router.post('/generate-profile-pdf', async (req, res) => {
    try {
        const { policyData, certificateHolder } = req.body;
        console.log('🎯 Generating COI from stored profile for:', policyData?.policyNumber);

        // Find the stored COI profile PDF
        const profilePdfPath = findCOIProfilePDF(policyData);

        if (!profilePdfPath) {
            return res.status(404).json({
                error: 'No stored COI profile found',
                details: 'Please save a COI profile first using the "Save to Profile" feature'
            });
        }

        // Prepare certificate holder text
        let certificateHolderText = '';
        if (typeof certificateHolder === 'string') {
            certificateHolderText = certificateHolder;
        } else if (certificateHolder && certificateHolder.name) {
            certificateHolderText = certificateHolder.name;
            if (certificateHolder.address) {
                certificateHolderText += '\n' + certificateHolder.address;
            }
        } else {
            certificateHolderText = 'Certificate Holder\nAddress Line 1\nCity, State ZIP';
        }

        // Add text overlay to the stored PDF
        const modifiedPdfBytes = await addTextOverlayToPDF(profilePdfPath, certificateHolderText);

        // Convert to base64
        const pdfBase64 = Buffer.from(modifiedPdfBytes).toString('base64');

        console.log('✅ COI profile PDF generated successfully with certificate holder overlay');

        res.json({
            success: true,
            pdf: pdfBase64,
            filename: `COI_${policyData.policyNumber || 'Certificate'}_${Date.now()}.pdf`,
            source: 'stored_profile'
        });

    } catch (error) {
        console.error('Error generating profile PDF:', error);
        res.status(500).json({
            error: 'Failed to generate PDF from profile',
            details: error.message
        });
    }
});

/**
 * Send COI with stored profile PDF
 * POST /api/coi/send-profile-pdf
 */
router.post('/send-profile-pdf', async (req, res) => {
    try {
        const { to, cc, bcc, subject, body, policyData, certificateHolder, provider } = req.body;

        console.log('🎯 Sending COI using stored profile for:', policyData?.policyNumber);

        // Find the stored COI profile PDF
        const profilePdfPath = findCOIProfilePDF(policyData);

        if (!profilePdfPath) {
            return res.status(404).json({
                error: 'No stored COI profile found',
                details: 'Please save a COI profile first using the "Save to Profile" feature'
            });
        }

        // Prepare certificate holder text
        let certificateHolderText = '';
        if (typeof certificateHolder === 'string') {
            certificateHolderText = certificateHolder;
        } else if (certificateHolder && certificateHolder.name) {
            certificateHolderText = certificateHolder.name;
            if (certificateHolder.address) {
                certificateHolderText += '\n' + certificateHolder.address;
            }
        } else {
            certificateHolderText = 'Certificate Holder\nAddress Line 1\nCity, State ZIP';
        }

        // Add text overlay to the stored PDF
        const modifiedPdfBytes = await addTextOverlayToPDF(profilePdfPath, certificateHolderText);

        // Convert to base64 for email attachment
        const pdfBase64 = Buffer.from(modifiedPdfBytes).toString('base64');

        console.log('✅ COI profile PDF prepared successfully with certificate holder overlay');

        // Use the provider-specific email system
        console.log('📧 Using provider-specific email system:', provider);

        try {
            let emailResponse;

            if (provider === 'outlook') {
                // Use Outlook IMAP system
                const OutlookIMAPService = require('./outlook-imap-service');
                const emailService = new OutlookIMAPService();

                if (!emailService.isConfigured()) {
                    throw new Error('Outlook IMAP service not configured');
                }

                const attachment = {
                    filename: `COI_${policyData.policyNumber || 'Certificate'}_${Date.now()}.pdf`,
                    content: pdfBase64,
                    contentType: 'application/pdf',
                    encoding: 'base64'
                };

                const result = await emailService.sendEmail(to, subject, body, [attachment], cc, bcc);

                res.json({
                    success: true,
                    messageId: result.messageId,
                    message: 'COI sent successfully with stored profile PDF via Outlook',
                    source: 'stored_profile'
                });

            } else {
                // Use Gmail/Titan system (default)
                emailResponse = await fetch('http://162-220-14-239.nip.io/api/gmail/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify({
                        to: to,
                        cc: cc || '',
                        bcc: bcc || '',
                        subject: subject,
                        body: body.replace(/\n/g, '<br>'),
                        attachments: [{
                            filename: `COI_${policyData.policyNumber || 'Certificate'}_${Date.now()}.pdf`,
                            mimeType: 'application/pdf',
                            data: pdfBase64
                        }]
                    })
                });

                const emailResult = await emailResponse.json();

                if (!emailResponse.ok) {
                    throw new Error(emailResult.error || `Gmail/Titan send failed: ${emailResult.message || 'Unknown error'}`);
                }

                res.json({
                    success: true,
                    messageId: emailResult.messageId,
                    message: 'COI sent successfully with stored profile PDF via Gmail/Titan',
                    source: 'stored_profile'
                });
            }

            console.log('✅ COI email sent successfully using stored profile');

        } catch (sendError) {
            console.error('Error sending email:', sendError);
            res.status(500).json({
                error: 'Failed to send email',
                details: sendError.message
            });
        }

    } catch (error) {
        console.error('Error in send-profile-pdf:', error);
        res.status(500).json({
            error: 'Failed to process request',
            details: error.message
        });
    }
});

/**
 * List available COI profiles
 * GET /api/coi/profiles
 */
router.get('/profiles', (req, res) => {
    try {
        const vanguardDir = '/var/www/vanguard';
        const files = fs.readdirSync(vanguardDir)
            .filter(file => file.includes('COI-Profile.pdf'))
            .map(file => ({
                name: file,
                path: path.join(vanguardDir, file),
                size: fs.statSync(path.join(vanguardDir, file)).size,
                modified: fs.statSync(path.join(vanguardDir, file)).mtime,
                company: file.replace('-COI-Profile.pdf', '').replace(/_/g, ' ')
            }))
            .sort((a, b) => b.modified - a.modified);

        res.json({
            success: true,
            profiles: files
        });

    } catch (error) {
        console.error('Error listing COI profiles:', error);
        res.status(500).json({
            error: 'Failed to list profiles',
            details: error.message
        });
    }
});

/**
 * Save COI template to profile (from "Save to Profile" button)
 * POST /api/coi/save-template
 */
router.post('/save-template', async (req, res) => {
    try {
        const { policy_number, pdf_base64, filename, uploaded_by } = req.body;

        console.log('💾 Saving COI template to profile:', {
            policy_number,
            filename,
            pdf_size: pdf_base64 ? pdf_base64.length : 0,
            uploaded_by
        });

        if (!policy_number || !pdf_base64) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'policy_number and pdf_base64 are required'
            });
        }

        // Find policy data to get company name
        const vanguardDb = '/var/www/vanguard/vanguard.db';
        let companyName = 'Unknown-Company';

        try {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(vanguardDb, sqlite3.OPEN_READONLY);

            await new Promise((resolve, reject) => {
                db.get(
                    "SELECT data FROM policies WHERE id LIKE ? OR data LIKE ?",
                    [`%${policy_number}%`, `%${policy_number}%`],
                    (err, row) => {
                        if (err) {
                            console.warn('Error querying policy data:', err);
                            resolve(); // Continue with default name
                            return;
                        }

                        if (row && row.data) {
                            try {
                                const policyData = JSON.parse(row.data);
                                const businessName = policyData.insured?.['Name/Business Name'] ||
                                                   policyData.clientName ||
                                                   policyData.insuredName ||
                                                   policyData.overview?.['Insured'] ||
                                                   'Unknown-Company';

                                // Convert to filename-safe format
                                companyName = businessName
                                    .replace(/[^a-zA-Z0-9\s-]/g, '')  // Remove special chars
                                    .replace(/\s+/g, '-')            // Replace spaces with hyphens
                                    .replace(/-+/g, '-')             // Collapse multiple hyphens
                                    .replace(/^-|-$/g, '');          // Remove leading/trailing hyphens

                                console.log('✅ Found company name:', businessName, '→', companyName);
                            } catch (parseError) {
                                console.warn('Error parsing policy data:', parseError);
                            }
                        }
                        resolve();
                    }
                );
                db.close();
            });
        } catch (dbError) {
            console.warn('Database error, using default company name:', dbError);
        }

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(pdf_base64, 'base64');

        // Validate PDF
        const pdfHeader = pdfBuffer.toString('ascii', 0, 8);
        if (pdfBuffer.length < 100 || !pdfHeader.startsWith('%PDF')) {
            console.error('PDF validation failed:', {
                size: pdfBuffer.length,
                header: pdfHeader,
                firstBytes: pdfBuffer.toString('hex', 0, 20)
            });
            return res.status(400).json({
                error: 'Invalid PDF data',
                details: `The provided base64 data does not appear to be a valid PDF. Header: "${pdfHeader}"`
            });
        }

        // REMOVE ALL existing COI profiles for this policy/company
        const vanguardDir = '/var/www/vanguard';
        const existingProfiles = fs.readdirSync(vanguardDir)
            .filter(file => file.includes('COI-Profile.pdf'))
            .filter(file => {
                // Check if this profile matches the current policy/company
                const profileCompany = file.replace('-COI-Profile.pdf', '').replace(/_/g, ' ').toLowerCase();
                const currentCompany = companyName.replace(/-/g, ' ').toLowerCase();

                // Match if company names are similar or if policy number is in filename
                return profileCompany.includes(currentCompany.split('-')[0]) ||
                       currentCompany.includes(profileCompany.split('-')[0]) ||
                       file.includes(policy_number);
            });

        console.log('🗑️ Found existing profiles to remove:', existingProfiles);

        // Remove all existing profiles for this policy
        existingProfiles.forEach(profileFile => {
            const oldProfilePath = path.join(vanguardDir, profileFile);
            try {
                // Create backup before removing
                const backupPath = oldProfilePath.replace('.pdf', `_backup_${Date.now()}.pdf`);
                console.log('📋 Backing up old profile:', profileFile, '→', path.basename(backupPath));
                fs.copyFileSync(oldProfilePath, backupPath);

                // Remove old profile
                fs.unlinkSync(oldProfilePath);
                console.log('❌ Removed old profile:', profileFile);
            } catch (error) {
                console.warn('Warning: Could not remove old profile:', profileFile, error.message);
            }
        });

        // Generate NEW profile filename (consistent format)
        const profileFilename = `${companyName}-COI-Profile.pdf`;
        const profilePath = path.join(vanguardDir, profileFilename);

        console.log('📁 New profile will be saved as:', profileFilename);

        // Write new profile
        fs.writeFileSync(profilePath, pdfBuffer);
        console.log('✅ COI profile saved successfully:', {
            path: profilePath,
            size: pdfBuffer.length,
            company: companyName
        });

        // Verify file was written
        const stats = fs.statSync(profilePath);

        res.json({
            success: true,
            message: 'COI template saved to profile successfully',
            profile: {
                filename: profileFilename,
                path: profilePath,
                size: stats.size,
                modified: stats.mtime,
                company: companyName,
                policy_number: policy_number
            }
        });

    } catch (error) {
        console.error('Error saving COI template:', error);
        res.status(500).json({
            error: 'Failed to save COI template',
            details: error.message
        });
    }
});

module.exports = router;