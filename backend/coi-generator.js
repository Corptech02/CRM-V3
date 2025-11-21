// COI Generator - Generate filled ACORD PDFs
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Function to generate filled COI PDF
async function generateFilledCOI(policyId, formData) {
    try {
        // Create Python script to generate filled PDF
        const pythonScript = `
import sys
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
import json

# Get data from arguments
policy_id = "${policyId}"
# Properly escape the JSON for Python - use triple quotes to handle newlines
json_str = """${JSON.stringify(formData).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"""
form_data = json.loads(json_str)

# Read the blank ACORD form
template_path = '/var/www/vanguard/ACORD_25_fillable.pdf'
existing_pdf = PdfReader(template_path)
output = PdfWriter()

# Create overlay with form data
packet = BytesIO()
can = canvas.Canvas(packet, pagesize=letter)

# ACORD 25 CORRECTED POSITIONING based on actual measurements
# Reference: "CERTIFICATE" C at x=327, y=126 (bottom area)
# My overlay was placing text ~600 points too high!

# Import datetime for date formatting
from datetime import datetime

# Correction factor: subtract ~600 from my Y coordinates
can.setFont("Helvetica", 9)

# DATE field (MM/DD/YYYY) - top right
# Was y=710, should be around y=110 from top (682 from bottom)
can.drawString(485, 682, datetime.now().strftime('%m/%d/%Y'))

# PRODUCER section (top left) - Agency info
# Was y=690-666, should be y=662-638
can.drawString(35, 662, form_data.get('producer', 'Vanguard Insurance Agency'))
can.drawString(35, 650, form_data.get('producerAddress', '123 Insurance Blvd, Suite 100'))
can.drawString(35, 638, 'New York, NY 10001')

# CONTACT section (Phone, Fax, Email)
can.drawString(220, 662, form_data.get('producerPhone', '(555) 123-4567'))
can.drawString(220, 650, '(555) 123-4568')
can.drawString(220, 638, 'coi@vanguard.com')

# INSURED section - Name and Address
# Was y=570, should be around y=542
can.setFont("Helvetica-Bold", 9)
can.drawString(35, 542, form_data.get('insured', ''))
can.setFont("Helvetica", 9)
insured_addr = form_data.get('insuredAddress', '')
if insured_addr:
    can.drawString(35, 530, insured_addr)

# INSURER A (carrier name) - right side
# Was y=505, should be around y=477
can.drawString(360, 477, form_data.get('carrier', ''))

# COVERAGES section - General Liability row
# Was y=385, should be around y=357
can.setFont("Helvetica", 8)

if form_data.get('generalLiability'):
    # X mark for GL checkbox
    can.drawString(35, 357, 'X')

# GL Policy Number column
policy_num = form_data.get('glPolicyNumber', '') or form_data.get('policyNumber', '')
if policy_num:
    can.drawString(350, 357, policy_num)

# Effective Date column
eff_date = form_data.get('effectiveDate', '')
if eff_date and '-' in eff_date:
    parts = eff_date.split('-')
    eff_date = f"{parts[1]}/{parts[2]}/{parts[0]}"
    can.drawString(463, 357, eff_date)

# Expiration Date column
exp_date = form_data.get('expirationDate', '')
if exp_date and '-' in exp_date:
    parts = exp_date.split('-')
    exp_date = f"{parts[1]}/{parts[2]}/{parts[0]}"
    can.drawString(525, 357, exp_date)

# AUTOMOBILE LIABILITY row
# Was y=355, should be around y=327
if form_data.get('autoLiability'):
    can.drawString(35, 327, 'X')
    auto_policy = form_data.get('alPolicyNumber', '')
    if auto_policy:
        can.drawString(350, 327, auto_policy)

# LIMITS section - Each Occurrence
if form_data.get('glEachOccurrence'):
    can.drawString(493, 357, '$' + str(form_data.get('glEachOccurrence', '')))

# LIMITS section - General Aggregate
if form_data.get('glGeneralAggregate'):
    can.drawString(493, 337, '$' + str(form_data.get('glGeneralAggregate', '')))

# CERTIFICATE HOLDER section (bottom left)
# Was y=200, should be around y=172
can.setFont("Helvetica", 9)
cert_holder = form_data.get('certificateHolder', '')
if cert_holder:
    lines = cert_holder.replace('\\r\\n', '\\n').replace('\\r', '\\n').split('\\n')
    y_pos = 172
    for line in lines[:4]:
        if line.strip():
            can.drawString(35, y_pos, line.strip())
            y_pos -= 12

# DESCRIPTION OF OPERATIONS (middle section)
# Was y=265, should be around y=237
can.setFont("Helvetica", 8)
description = form_data.get('description', '')
if description:
    lines = description.replace('\\r\\n', '\\n').replace('\\r', '\\n').split('\\n')
    y_pos = 237
    for line in lines[:3]:
        if line.strip():
            can.drawString(35, y_pos, line.strip())
            y_pos -= 10

# AUTHORIZED REPRESENTATIVE - This is the critical one!
# Based on your measurement, "CERTIFICATE" C is at y=126
# The signature line is just below that, around y=64
can.setFont("Helvetica-Bold", 10)
auth_rep = form_data.get('authorizedRep', 'Grant Corp')
can.drawString(385, 64, auth_rep)

# Save the overlay
can.save()
packet.seek(0)
overlay_pdf = PdfReader(packet)

# Merge overlay with the original PDF
page = existing_pdf.pages[0]
page.merge_page(overlay_pdf.pages[0])
output.add_page(page)

# Add remaining pages if any
for i in range(1, len(existing_pdf.pages)):
    output.add_page(existing_pdf.pages[i])

# Save the filled PDF
import os
from datetime import datetime

saved_dir = '/var/www/vanguard/saved_cois'
os.makedirs(saved_dir, exist_ok=True)

filename = f'ACORD_25_{policy_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
filepath = os.path.join(saved_dir, filename)

with open(filepath, 'wb') as f:
    output.write(f)

print(filepath)
`;

        // Write script to temp file
        const tempScriptPath = `/tmp/generate_coi_${Date.now()}.py`;
        fs.writeFileSync(tempScriptPath, pythonScript);

        // Execute Python script
        const { stdout, stderr } = await execPromise(`python3 ${tempScriptPath}`);

        // Clean up temp file
        fs.unlinkSync(tempScriptPath);

        if (stderr) {
            console.error('Python script error:', stderr);
        }

        const filePath = stdout.trim();
        console.log('Generated PDF at:', filePath);

        return filePath;
    } catch (error) {
        console.error('Error generating filled COI:', error);
        throw error;
    }
}

// Function to get saved COI
function getSavedCOI(policyId) {
    const savedDir = '/var/www/vanguard/saved_cois';

    if (!fs.existsSync(savedDir)) {
        return null;
    }

    // Find files for this policy
    const files = fs.readdirSync(savedDir)
        .filter(f => f.startsWith(`ACORD_25_${policyId}_`))
        .sort()
        .reverse();

    if (files.length === 0) {
        return null;
    }

    return path.join(savedDir, files[0]);
}

module.exports = {
    generateFilledCOI,
    getSavedCOI
};