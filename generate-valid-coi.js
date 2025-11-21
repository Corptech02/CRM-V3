// Generate a valid COI PDF for testing
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function generateValidCOI() {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();

    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title
    page.drawText('ACORD 25 CERTIFICATE OF LIABILITY INSURANCE', {
        x: 50,
        y: height - 50,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0),
    });

    // Date
    const today = new Date().toISOString().split('T')[0];
    page.drawText(`DATE: ${today}`, {
        x: 50,
        y: height - 80,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    // Producer section
    page.drawText('PRODUCER', {
        x: 50,
        y: height - 120,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
    });

    page.drawText('Vanguard Insurance Group', {
        x: 50,
        y: height - 140,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('123 Main Street, Suite 100', {
        x: 50,
        y: height - 155,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('New York, NY 10001', {
        x: 50,
        y: height - 170,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('Phone: (555) 123-4567', {
        x: 50,
        y: height - 185,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    // Insured section
    page.drawText('INSURED', {
        x: 50,
        y: height - 230,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
    });

    page.drawText('Test Client - Policy 864709702', {
        x: 50,
        y: height - 250,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('456 Business Ave', {
        x: 50,
        y: height - 265,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('Los Angeles, CA 90001', {
        x: 50,
        y: height - 280,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    // Coverages section
    page.drawText('COVERAGES', {
        x: 50,
        y: height - 320,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
    });

    page.drawText('Policy Number: 864709702', {
        x: 50,
        y: height - 340,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('Policy Type: GENERAL LIABILITY', {
        x: 50,
        y: height - 355,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('Effective Date: 01/01/2024', {
        x: 50,
        y: height - 370,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('Expiration Date: 01/01/2025', {
        x: 50,
        y: height - 385,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    page.drawText('Coverage Limit: $1,000,000', {
        x: 50,
        y: height - 400,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    // Certificate holder placeholder
    page.drawText('CERTIFICATE HOLDER', {
        x: 50,
        y: height - 450,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
    });

    // Draw a box for certificate holder
    page.drawRectangle({
        x: 50,
        y: height - 550,
        width: 300,
        height: 80,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
    });

    page.drawText('[Certificate holder information will be added on request]', {
        x: 55,
        y: height - 490,
        size: 9,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
    });

    // Footer
    page.drawText('ACORD 25 (2016/03) © 1988-2015 ACORD CORPORATION. All rights reserved.', {
        x: 50,
        y: 50,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Save to file
    const outputPath = path.join(__dirname, 'coi-templates', '864709702_template.pdf');
    fs.writeFileSync(outputPath, pdfBytes);

    console.log('✅ Valid COI PDF generated');
    console.log('   Path:', outputPath);
    console.log('   Size:', pdfBytes.length, 'bytes');

    // Also save as base64 for testing
    const base64 = Buffer.from(pdfBytes).toString('base64');
    console.log('   Base64 length:', base64.length);
    console.log('   First 100 chars:', base64.substring(0, 100));

    // Upload to backend
    const axios = require('axios');
    try {
        const response = await axios.post('http://localhost:3001/api/coi/save-template', {
            policy_number: '864709702',
            pdf_base64: base64,
            filename: 'COI_864709702_valid.pdf'
        });
        console.log('✅ Uploaded to backend:', response.data);
    } catch (error) {
        console.error('❌ Upload error:', error.message);
    }
}

generateValidCOI().catch(console.error);