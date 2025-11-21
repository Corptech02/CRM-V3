#!/usr/bin/env python3
"""
Save COI - Server-side script to save filled ACORD forms
This will be called via API to save the form data
"""

import json
import os
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
import sqlite3

app = Flask(__name__)
CORS(app)

# Database path
DB_PATH = '/var/www/vanguard/vanguard.db'

@app.route('/api/save-coi-pdf', methods=['POST'])
def save_coi_pdf():
    """Save COI form data and generate filled PDF"""
    try:
        data = request.json
        policy_id = data.get('policyId')
        form_data = data.get('formData', {})

        if not policy_id:
            return jsonify({'error': 'Policy ID required'}), 400

        # Create a filled PDF with the form data
        output_path = f'/var/www/vanguard/saved_cois/COI_{policy_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'

        # Ensure directory exists
        os.makedirs('/var/www/vanguard/saved_cois', exist_ok=True)

        # Read the base ACORD form
        existing_pdf = PdfReader('/var/www/vanguard/ACORD_25_fillable.pdf')
        output = PdfWriter()

        # Create overlay with form data
        packet = BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        can.setFont("Helvetica", 10)

        # Add form data to specific positions
        # Producer
        if form_data.get('producer'):
            can.drawString(45, 640, form_data['producer'])

        # Insured
        if form_data.get('insured'):
            can.drawString(45, 480, form_data['insured'])

        # Policy Number
        if form_data.get('policyNumber'):
            can.drawString(400, 380, form_data['policyNumber'])

        # Carrier - apply Progressive transformation if needed
        carrier_name = form_data.get('carrier', '')
        if carrier_name:
            if carrier_name.lower().startswith('progressive') and 'preferred' not in carrier_name.lower():
                carrier_name = 'Progressive Preferred Insurance Company'
            can.drawString(320, 340, carrier_name)

            # NAIC Code for Progressive
            if carrier_name.lower().startswith('progressive'):
                can.drawString(580, 340, '37834')  # NAIC code position

        # Authorized Rep (Grant Corp)
        can.setFont("Helvetica-Bold", 10)
        can.drawString(420, 115, form_data.get('authorizedRep', 'Grant Corp'))

        # Save the overlay
        can.save()
        packet.seek(0)
        overlay_pdf = PdfReader(packet)

        # Merge with original
        page = existing_pdf.pages[0]
        page.merge_page(overlay_pdf.pages[0])
        output.add_page(page)

        # Add remaining pages
        for i in range(1, len(existing_pdf.pages)):
            output.add_page(existing_pdf.pages[i])

        # Save the filled PDF
        with open(output_path, 'wb') as output_file:
            output.write(output_file)

        # Save to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Extract carrier and policy_number from form_data
        carrier = form_data.get('carrier', '')
        policy_number = form_data.get('policyNumber', '')

        cursor.execute("""
            INSERT OR REPLACE INTO coi_data
            (policy_id, policy_number, carrier, form_type, form_data, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (policy_id, policy_number, carrier, 'ACORD_25', json.dumps(form_data), 'saved'))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'COI saved successfully',
            'filename': os.path.basename(output_path)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-saved-coi/<policy_id>', methods=['GET'])
def get_saved_coi(policy_id):
    """Get the most recent saved COI for a policy"""
    try:
        # Find the most recent saved COI file
        coi_dir = '/var/www/vanguard/saved_cois'
        if not os.path.exists(coi_dir):
            return jsonify({'error': 'No saved COIs found'}), 404

        # Find files matching this policy
        matching_files = [f for f in os.listdir(coi_dir) if f.startswith(f'COI_{policy_id}_')]

        if not matching_files:
            return jsonify({'error': 'No saved COI for this policy'}), 404

        # Get the most recent file
        matching_files.sort(reverse=True)
        latest_file = matching_files[0]

        return send_file(
            os.path.join(coi_dir, latest_file),
            mimetype='application/pdf',
            as_attachment=False
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8898, debug=True)