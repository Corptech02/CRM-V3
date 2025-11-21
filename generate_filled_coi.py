#!/usr/bin/env python3
"""
Generate Filled COI - Creates ACORD 25 PDFs with data filled in
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
import os
import json
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database path
DB_PATH = '/var/www/vanguard/vanguard.db'

def get_policy_data(policy_id):
    """Fetch policy data from the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get policy data
        cursor.execute("SELECT * FROM policies WHERE id = ?", (policy_id,))
        row = cursor.fetchone()

        if row:
            policy_data = json.loads(row['data'])
            policy_data['id'] = row['id']
            policy_data['client_id'] = row['client_id']

            # Get client data if available
            if row['client_id']:
                cursor.execute("SELECT * FROM clients WHERE id = ?", (row['client_id'],))
                client_row = cursor.fetchone()
                if client_row:
                    client_data = json.loads(client_row['data'])
                    policy_data['clientName'] = client_data.get('name', '')
                    policy_data['clientAddress'] = client_data.get('address', '')

            conn.close()
            return policy_data

        conn.close()
        return None

    except Exception as e:
        print(f"Error fetching policy data: {e}")
        return None

def get_saved_coi_form(policy_id):
    """Load saved COI form data from CRM"""
    try:
        form_data_path = f'/var/www/vanguard/coi-forms/{policy_id}_form_data.json'
        if os.path.exists(form_data_path):
            with open(form_data_path, 'r') as f:
                coi_data = json.load(f)
                return coi_data.get('formData', {})
        return None
    except Exception as e:
        print(f"Error loading saved COI form: {e}")
        return None

@app.route('/api/generate-filled-coi', methods=['POST'])
def generate_filled_coi():
    """Generate a filled ACORD 25 PDF using saved CRM form data"""
    try:
        data = request.json
        policy_id = data.get('policyId')
        form_data = data.get('formData', {})

        # Debug logging to understand data structure
        print(f"DEBUG: Full request data keys: {list(data.keys())}")
        print(f"DEBUG: Form data keys: {list(form_data.keys())}")
        print(f"DEBUG: Policy ID: {policy_id}")

        # Check for certificate holder data - OUR format
        cert_fields = ['certHolder', 'certAddress1', 'certAddress2', 'certCity', 'certState', 'certZip']
        for field in cert_fields:
            if field in form_data:
                print(f"DEBUG: Found {field} = {form_data.get(field)}")
            else:
                print(f"DEBUG: {field} NOT FOUND in form_data")

        # Check for OTHER AI's format (nested object)
        if 'certificate_holder' in data:
            print(f"DEBUG: Found certificate_holder object from other system: {data.get('certificate_holder')}")
            cert_obj = data.get('certificate_holder', {})
            if 'name' in cert_obj:
                print(f"DEBUG: Other system - name: {cert_obj.get('name')}")
            if 'address_line1' in cert_obj:
                print(f"DEBUG: Other system - address_line1: {cert_obj.get('address_line1')}")

        # Check for insured address data
        insured_fields = ['insured', 'insuredAddress', 'insuredAddress1', 'insuredAddress2', 'insuredCity', 'insuredState', 'insuredZip']
        for field in insured_fields:
            if field in form_data:
                print(f"DEBUG: Found {field} = {form_data.get(field)}")

        # Handle OTHER AI's certificate_holder format if present
        if 'certificate_holder' in data and isinstance(data['certificate_holder'], dict):
            cert_obj = data['certificate_holder']
            # Map their format to our format
            if 'name' in cert_obj:
                form_data['certHolder'] = cert_obj['name']
            if 'address_line1' in cert_obj:
                form_data['certAddress1'] = cert_obj['address_line1']
            if 'address_line2' in cert_obj:
                form_data['certAddress2'] = cert_obj['address_line2']
            if 'city' in cert_obj:
                form_data['certCity'] = cert_obj['city']
            if 'state' in cert_obj:
                form_data['certState'] = cert_obj['state']
            if 'zip' in cert_obj:
                form_data['certZip'] = cert_obj['zip']
            print(f"DEBUG: Mapped other system's certificate_holder to our format")

        # Store certificate holder data if it was mapped from other system
        cert_holder_data = {}
        if 'certHolder' in form_data:
            cert_holder_data = {
                'certHolder': form_data.get('certHolder'),
                'certAddress1': form_data.get('certAddress1'),
                'certAddress2': form_data.get('certAddress2'),
                'certCity': form_data.get('certCity'),
                'certState': form_data.get('certState'),
                'certZip': form_data.get('certZip')
            }
            print(f"DEBUG: Preserved certificate holder data: {cert_holder_data}")

        # First try to use saved CRM form data (this is the prepared COI)
        saved_form_data = get_saved_coi_form(policy_id)
        if saved_form_data:
            print(f"✅ Using saved CRM form data for policy {policy_id}")
            # Use the saved form data from CRM's "Prepare COI" function
            form_data = saved_form_data

            # Re-apply certificate holder data if it was provided
            if cert_holder_data:
                form_data.update(cert_holder_data)
                print(f"DEBUG: Re-applied certificate holder data after loading saved form")

            # Also check for certificate holder in formData from frontend
            if data.get('formData', {}).get('certHolder'):
                form_data['certHolder'] = data['formData']['certHolder']
            elif data.get('formData', {}).get('certificateHolder'):
                form_data['certHolder'] = data['formData']['certificateHolder']

            if data.get('formData', {}).get('certAddress1'):
                form_data['certAddress1'] = data['formData']['certAddress1']
            elif data.get('formData', {}).get('certificateHolderAddress'):
                form_data['certAddress1'] = data['formData']['certificateHolderAddress']

            if data.get('formData', {}).get('certAddress2'):
                form_data['certAddress2'] = data['formData']['certAddress2']

            if data.get('formData', {}).get('certCity'):
                form_data['certCity'] = data['formData']['certCity']

            if data.get('formData', {}).get('certState'):
                form_data['certState'] = data['formData']['certState']

            if data.get('formData', {}).get('certZip'):
                form_data['certZip'] = data['formData']['certZip']
        else:
            print(f"⚠️ No saved CRM form data found for policy {policy_id}, using fallback method")
            # Fallback to original method if no saved data exists
            policy_data = get_policy_data(policy_id)
            if policy_data:
                # Map carrier names to full names
                carrier_name = policy_data.get('carrier', '')
                if carrier_name.lower().startswith('progressive') and 'preferred' not in carrier_name.lower():
                    carrier_name = 'Progressive Preferred Insurance Company'

                # Merge database data with form data (form data takes precedence)
                form_data = {
                    'producer': form_data.get('producer', 'VANGUARD INSURANCE GROUP LLC'),
                    'producerAddress': form_data.get('producerAddress', '2888 Nationwide Pkwy, Brunswick'),
                    'producerPhone': form_data.get('producerPhone', '330-241-7570'),
                    'producerFax': form_data.get('producerFax', '330-281-4025'),
                    'insured': form_data.get('insured', policy_data.get('clientName', '')),
                    'insuredAddress': form_data.get('insuredAddress', policy_data.get('clientAddress', '')),
                    'carrier': form_data.get('carrier', carrier_name),
                    'policyNumber': form_data.get('policyNumber', policy_data.get('policyNumber', '')),
                    'effectiveDate': form_data.get('effectiveDate', policy_data.get('effectiveDate', '')),
                    'expirationDate': form_data.get('expirationDate', policy_data.get('expirationDate', '')),
                    'policyStatus': policy_data.get('policyStatus', ''),
                    'policyType': policy_data.get('policyType', ''),
                }

        # Read the blank ACORD form
        template_path = '/var/www/vanguard/ACORD_25_fillable.pdf'
        existing_pdf = PdfReader(template_path)
        output = PdfWriter()

        # Fill the actual form fields instead of creating overlay
        if len(existing_pdf.pages) > 0:
            page = existing_pdf.pages[0]
            output.add_page(page)  # Add page to output first

            # Create field mapping from CRM form data to PDF field names
            # The CRM saves form data with field names that need to be mapped to actual PDF fields
            field_mappings = {
                'Form_CompletionDate_A[0]': form_data.get('date', datetime.now().strftime('%m/%d/%Y')),
                'Producer_FullName_A[0]': form_data.get('producer', 'VANGUARD INSURANCE GROUP LLC'),
                'Producer_MailingAddress_LineOne_A[0]': form_data.get('producerAddress1', '2888 Nationwide Pkwy, Brunswick'),
                'Producer_MailingAddress_LineTwo_A[0]': form_data.get('producerAddress2', 'Brunswick, OH 44212'),
                'Producer_MailingAddress_CityName_A[0]': form_data.get('producerCity', 'Brunswick'),
                'Producer_MailingAddress_StateOrProvinceCode_A[0]': form_data.get('producerState', 'OH'),
                'Producer_MailingAddress_PostalCode_A[0]': form_data.get('producerZip', '44212'),
                'Producer_ContactPerson_FullName_A[0]': form_data.get('contactName', 'VANGUARD INSURANCE GROUP LLC'),
                'Producer_ContactPerson_PhoneNumber_A[0]': form_data.get('phone', '330-241-7570'),
                'Producer_FaxNumber_A[0]': form_data.get('fax', '330-281-4025'),
                'Producer_ContactPerson_EmailAddress_A[0]': form_data.get('email', 'Grant@Vigagency.com'),

                'NamedInsured_FullName_A[0]': form_data.get('insured', ''),
                'NamedInsured_MailingAddress_LineOne_A[0]': form_data.get('insuredAddress1', ''),
                'NamedInsured_MailingAddress_LineTwo_A[0]': form_data.get('insuredAddress2', ''),
                'NamedInsured_MailingAddress_CityName_A[0]': form_data.get('insuredCity', ''),
                'NamedInsured_MailingAddress_StateOrProvinceCode_A[0]': form_data.get('insuredState', ''),
                'NamedInsured_MailingAddress_PostalCode_A[0]': form_data.get('insuredZip', ''),

                'Insurer_FullName_A[0]': form_data.get('insurerA', ''),
                'Insurer_NAICCode_A[0]': form_data.get('insurerANaic', ''),

                # Coverage details - these are the properly aligned fields from CRM
                'Policy_PolicyNumber_A[0]': form_data.get('glPolicyNum', form_data.get('autoPolicyNum', form_data.get('otherPolicyNum1', ''))),
                'Policy_EffectiveDate_A[0]': form_data.get('glEffDate', form_data.get('autoEffDate', form_data.get('otherEffDate1', ''))),
                'Policy_ExpirationDate_A[0]': form_data.get('glExpDate', form_data.get('autoExpDate', form_data.get('otherExpDate1', ''))),

                # Limits and coverage amounts
                'Limit_EachOccurrence_A[0]': form_data.get('eachOccurrence', ''),
                'Limit_GeneralAggregate_A[0]': form_data.get('generalAgg', ''),
                'Limit_ProductsCompletedOperationsAggregate_A[0]': form_data.get('productsOps', ''),
                'Limit_PersonalAdvertisingInjury_A[0]': form_data.get('personalAdv', ''),
                'Limit_DamageToRentedPremises_A[0]': form_data.get('damageRented', ''),
                'Limit_MedicalExpense_A[0]': form_data.get('medExp', ''),
                'Limit_CombinedSingleLimit_A[0]': form_data.get('autoCombinedSingle', ''),
                'Limit_BodilyInjuryPerPerson_A[0]': form_data.get('autoBodilyInjuryPerson', ''),
                'Limit_BodilyInjuryPerAccident_A[0]': form_data.get('autoBodilyInjuryAccident', ''),
                'Limit_PropertyDamage_A[0]': form_data.get('autoPropertyDamage', ''),

                'Description_A[0]': form_data.get('description', ''),
                'AuthorizedRepresentative_Signature_A[0]': form_data.get('authRep', 'Grant Corp'),
                # Certificate holder fields - FIXED WITH REAL DATA
                'CertificateHolder_FullName_A[0]': form_data.get('certHolder', form_data.get('certificateHolder', '')),
                'CertificateHolder_MailingAddress_LineOne_A[0]': form_data.get('certAddress1', form_data.get('certificateHolderAddress', '')),
                'CertificateHolder_MailingAddress_LineTwo_A[0]': form_data.get('certAddress2', ''),
                'CertificateHolder_MailingAddress_CityName_A[0]': form_data.get('certCity', ''),
                'CertificateHolder_MailingAddress_StateOrProvinceCode_A[0]': form_data.get('certState', ''),
                'CertificateHolder_MailingAddress_PostalCode_A[0]': form_data.get('certZip', '')
            }

            # Add checkbox fields for coverage types (these use 'X' values in CRM data)
            checkbox_mappings = {
                'GeneralLiability_Claims_Made_A[0]': form_data.get('glCheck', ''),
                'GeneralLiability_Occurrence_A[0]': form_data.get('glOccurrence', ''),
                'AutoLiability_ScheduledAutos_A[0]': form_data.get('autoScheduled', ''),
                'Policy_Occurrence_A[0]': form_data.get('glOccurrence', ''),
                'Policy_ClaimsMade_A[0]': form_data.get('glCheck', ''),
                'GeneralAggregate_Policy_A[0]': form_data.get('aggPolicy', ''),
            }

            # Merge checkbox mappings with regular field mappings
            field_mappings.update(checkbox_mappings)

            # Use PyPDF2 3.0.1 to fill form fields properly
            try:
                # Update form field values directly on the page we just added
                filled_count = 0
                for field_name, field_value in field_mappings.items():
                    if field_value:
                        try:
                            # Try both with and without the full prefix
                            output.update_page_form_field_values(output.pages[0], {field_name: str(field_value)})
                            print(f"Filling field {field_name}: {field_value}")
                            filled_count += 1
                        except:
                            # Also try with full prefix
                            try:
                                full_field_name = f"F[0].P1[0].{field_name}"
                                output.update_page_form_field_values(output.pages[0], {full_field_name: str(field_value)})
                                print(f"Filling field {full_field_name}: {field_value}")
                                filled_count += 1
                            except:
                                pass  # Field doesn't exist, skip it

                if filled_count > 0:
                    print(f"Successfully filled {filled_count} form fields")
                else:
                    print("No form fields could be filled, using overlay method")
                    raise Exception("No fields filled")

            except Exception as form_error:
                print(f"Form filling failed: {form_error}, falling back to text overlay")
                # Fallback to original overlay method
                packet = BytesIO()
                can = canvas.Canvas(packet, pagesize=letter)
                can.setFont("Helvetica", 10)
                can.drawString(45, 640, form_data.get('producer', 'VANGUARD INSURANCE GROUP LLC'))
                can.drawString(45, 628, form_data.get('producerAddress', '2888 Nationwide Pkwy, Brunswick'))
                can.drawString(45, 616, 'Brunswick, OH 44212')
                can.drawString(230, 640, form_data.get('producerPhone', '330-241-7570'))
                can.drawString(230, 628, form_data.get('producerFax', '330-281-4025'))
                can.drawString(500, 680, form_data.get('certificateDate', datetime.now().strftime('%m/%d/%Y')))
                can.setFont("Helvetica-Bold", 10)
                can.drawString(45, 480, form_data.get('insured', ''))
                can.setFont("Helvetica", 10)

                # Split address into street and city/state/zip
                full_address = form_data.get('insuredAddress', '')
                if full_address:
                    # Try to intelligently split the address
                    # Look for patterns like "street, city, state zip" or "street city state zip"
                    parts = full_address.replace('\n', ', ').split(',')
                    if len(parts) >= 2:
                        # First part is street address
                        street_address = parts[0].strip()
                        # Rest is city/state/zip
                        city_state_zip = ', '.join(parts[1:]).strip()
                    else:
                        # Try to split by finding state abbreviation pattern
                        import re
                        # Match pattern like "OH 44212" or "Ohio 44212"
                        state_zip_pattern = r'\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*$'
                        match = re.search(state_zip_pattern, full_address)
                        if match:
                            # Split at the start of the state
                            split_pos = match.start()
                            # Find the last word before the state (should be city)
                            before_state = full_address[:split_pos].rstrip()
                            # Find last space to separate street from city
                            last_space = before_state.rfind(' ')
                            if last_space > 0 and last_space < len(before_state) - 3:
                                # Check if what comes before might be a city name
                                potential_city = before_state[last_space+1:]
                                if len(potential_city) > 2:  # Reasonable city name length
                                    street_address = before_state[:last_space].strip()
                                    city_state_zip = before_state[last_space+1:].strip() + full_address[split_pos:].strip()
                                else:
                                    street_address = before_state
                                    city_state_zip = full_address[split_pos:].strip()
                            else:
                                street_address = before_state
                                city_state_zip = full_address[split_pos:].strip()
                        else:
                            # Fallback: put entire address on first line
                            street_address = full_address
                            city_state_zip = ''

                    # Draw the address in two lines
                    can.drawString(45, 468, street_address)
                    if city_state_zip:
                        can.drawString(45, 456, city_state_zip)
                else:
                    can.drawString(45, 468, '')

                can.drawString(320, 400, form_data.get('carrier', ''))
                if form_data.get('carrier', '').lower().startswith('progressive'):
                    can.drawString(580, 400, '37834')
                can.setFont("Helvetica", 9)
                can.drawString(400, 350, form_data.get('policyNumber', ''))
                can.drawString(480, 350, form_data.get('effectiveDate', ''))
                can.drawString(560, 350, form_data.get('expirationDate', ''))

                # Add certificate holder information
                # ACORD 25 Certificate Holder box is typically around y=170-100 from bottom
                can.setFont("Helvetica", 9)
                cert_name = form_data.get('certHolder', form_data.get('certificateHolder', ''))
                cert_addr1 = form_data.get('certAddress1', form_data.get('certificateHolderAddress', ''))
                cert_addr2 = form_data.get('certAddress2', '')
                cert_city = form_data.get('certCity', '')
                cert_state = form_data.get('certState', '')
                cert_zip = form_data.get('certZip', '')

                # Certificate Holder section with REAL DATA
                # The certificate holder section is in the lower left of the form
                # Using coordinates that should work based on standard ACORD 25 layout

                # Box 1: Name
                if cert_name:
                    can.drawString(70, 195, cert_name)
                    print(f"DEBUG: Drew certificate holder name at y=195: {cert_name}")

                # Box 2: Street address line 1
                if cert_addr1:
                    can.drawString(70, 183, cert_addr1)
                    print(f"DEBUG: Drew certificate holder address line 1 at y=183: {cert_addr1}")

                # Box 3: Street address line 2 (if exists)
                if cert_addr2:
                    can.drawString(70, 171, cert_addr2)
                    print(f"DEBUG: Drew certificate holder address line 2 at y=171: {cert_addr2}")

                # Box 4: City, State ZIP
                if cert_city or cert_state or cert_zip:
                    # Combine city, state, zip on one line
                    city_state_zip = f"{cert_city}, {cert_state} {cert_zip}".strip().replace(', ,', ',')
                    if city_state_zip and city_state_zip != ',':
                        y_pos = 171 if not cert_addr2 else 159  # Use line 3 if no addr2, else line 4
                        can.drawString(70, y_pos, city_state_zip)
                        print(f"DEBUG: Drew certificate holder city/state/zip at y={y_pos}: {city_state_zip}")

                can.setFont("Helvetica-Bold", 11)
                can.drawString(420, 115, form_data.get('authRep', 'Grant Corp'))
                can.save()
                packet.seek(0)
                overlay_pdf = PdfReader(packet)
                page.merge_page(overlay_pdf.pages[0])
                output.add_page(page)
        else:
            print("Error: No pages found in PDF template")

        # Add remaining pages if any
        for i in range(1, len(existing_pdf.pages)):
            output.add_page(existing_pdf.pages[i])

        # Save to BytesIO
        output_stream = BytesIO()
        output.write(output_stream)
        output_stream.seek(0)

        # Also save a copy on server
        saved_dir = '/var/www/vanguard/saved_cois'
        os.makedirs(saved_dir, exist_ok=True)

        filename = f'ACORD_25_{policy_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        filepath = os.path.join(saved_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(output_stream.getvalue())

        output_stream.seek(0)

        # Return the filled PDF
        return send_file(
            output_stream,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'ACORD_25_{policy_id}_filled.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-saved-coi/<policy_id>', methods=['GET'])
def get_saved_coi(policy_id):
    """Get the most recent saved COI for a policy"""
    try:
        saved_dir = '/var/www/vanguard/saved_cois'

        if not os.path.exists(saved_dir):
            return jsonify({'error': 'No saved COIs found'}), 404

        # Find the most recent file for this policy
        files = [f for f in os.listdir(saved_dir) if f.startswith(f'ACORD_25_{policy_id}_')]

        if not files:
            # Generate a new one with default data
            return generate_default_coi(policy_id)

        # Sort by timestamp and get the latest
        files.sort(reverse=True)
        latest_file = files[0]

        return send_file(
            os.path.join(saved_dir, latest_file),
            mimetype='application/pdf',
            as_attachment=False
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_default_coi(policy_id):
    """Generate a default filled COI when no saved version exists"""
    # Try to get policy data from database first
    policy_data = get_policy_data(policy_id)

    # Use database data if available, otherwise use defaults
    if policy_data:
        # Map carrier names to full names
        carrier_name = policy_data.get('carrier', '')
        if carrier_name.lower().startswith('progressive') and 'preferred' not in carrier_name.lower():
            carrier_name = 'Progressive Preferred Insurance Company'

        form_data = {
            'producer': 'VANGUARD INSURANCE GROUP LLC',
            'producerAddress': '2888 Nationwide Pkwy, Brunswick, OH 44212',
            'producerPhone': '330-241-7570',
            'authorizedRep': 'Grant Corp',
            'insured': policy_data.get('clientName', ''),
            'insuredAddress': policy_data.get('clientAddress', ''),
            'carrier': carrier_name,
            'policyNumber': policy_data.get('policyNumber', ''),
            'effectiveDate': policy_data.get('effectiveDate', ''),
            'expirationDate': policy_data.get('expirationDate', '')
        }
    else:
        form_data = {
            'producer': 'VANGUARD INSURANCE GROUP LLC',
            'producerAddress': '2888 Nationwide Pkwy, Brunswick, OH 44212',
            'producerPhone': '330-241-7570',
            'authorizedRep': 'Grant Corp'
        }

    default_data = {
        'policyId': policy_id,
        'formData': form_data
    }

    # Simulate a POST request to generate_filled_coi
    with app.test_request_context(json=default_data):
        return generate_filled_coi()

@app.route('/api/test-policy-data/<policy_id>', methods=['GET'])
def test_policy_data(policy_id):
    """Test endpoint to verify policy data retrieval"""
    try:
        policy_data = get_policy_data(policy_id)
        if policy_data:
            # Map carrier names to full names for display
            carrier_name = policy_data.get('carrier', '')
            if carrier_name.lower() == 'progressive':
                carrier_name = 'Progressive Preferred Insurance Company'

            return jsonify({
                'success': True,
                'data': {
                    'policyId': policy_data.get('id'),
                    'policyNumber': policy_data.get('policyNumber'),
                    'carrier': carrier_name,
                    'clientName': policy_data.get('clientName'),
                    'effectiveDate': policy_data.get('effectiveDate'),
                    'expirationDate': policy_data.get('expirationDate'),
                    'policyStatus': policy_data.get('policyStatus'),
                    'policyType': policy_data.get('policyType')
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Policy not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8899, debug=True)