#!/usr/bin/env python3
"""
Matched Carriers Leads API - Database Version
Serves filtered leads from the SQLite database (exactly like the analysis script)
"""

import sqlite3
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

# Database path - exactly as used in the analysis
DB_PATH = '/home/corp06/vanguard-vps-package/vanguard_system.db'

def get_db_connection():
    """Get database connection with Row factory for dict-like access"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/matched-carriers-leads', methods=['GET'])
def get_matched_carriers_leads():
    """
    Get matched carriers leads from database
    Replicates the exact logic used in the analysis script
    """
    try:
        # Get query parameters
        state = request.args.get('state', '').strip().upper()
        days = int(request.args.get('days', 30))
        skip_days = int(request.args.get('skip_days', 0))
        limit = int(request.args.get('limit', 10000))
        min_fleet = int(request.args.get('min_fleet', 1))
        max_fleet = int(request.args.get('max_fleet', 9999))
        insurance_companies = request.args.get('insurance_companies', '')
        require_email = request.args.get('require_email', 'false').lower() == 'true'
        require_phone = request.args.get('require_phone', 'false').lower() == 'true'

        print(f"Database query: state={state}, days={days}, skip_days={skip_days}")

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Build the same query structure as the analysis script
            query = """
                SELECT
                    dot_number, legal_name, dba_name, street, city, state, zip_code,
                    phone, email_address, power_units, drivers, mc_number,
                    insurance_carrier, bipd_insurance_on_file_amount, policy_renewal_date,
                    website, fax, cell_phone, contact_person, contact_title,
                    business_type, cargo_carried, operating_status, entity_type,
                    safety_rating, safety_review_date, out_of_service_date,
                    annual_revenue, credit_score, payment_history,
                    custom_data, last_updated, updated_by, data_source, verified,
                    internal_notes, interaction_history, insurance_company_name,
                    insurance_expiration_date, insurance_record_raw, days_until_expiry
                FROM fmcsa_enhanced
                WHERE insurance_expiration_date IS NOT NULL
                AND days_until_expiry IS NOT NULL
            """
            params = []

            # Handle skip_days logic
            if skip_days > 0:
                query += " AND days_until_expiry > ?"
                params.append(skip_days)
            else:
                query += " AND days_until_expiry >= 0"

            # Add days filter (days until expiration)
            query += " AND days_until_expiry <= ?"
            params.append(days)

            # State filter - exact match from analysis
            if state and state != 'ALL':
                query += " AND state = ?"
                params.append(state)

            # Fleet size filters
            if min_fleet > 0:
                query += " AND power_units >= ?"
                params.append(min_fleet)

            if max_fleet < 9999:
                query += " AND power_units <= ?"
                params.append(max_fleet)

            # Insurance companies filter with LIKE matching
            if insurance_companies:
                companies = [c.strip() for c in insurance_companies.split(',') if c.strip()]
                if companies:
                    like_conditions = []
                    for company in companies:
                        like_conditions.append("(insurance_company_name LIKE ? OR insurance_carrier LIKE ?)")
                        params.extend([f"%{company}%", f"%{company}%"])

                    if like_conditions:
                        query += f" AND ({' OR '.join(like_conditions)})"

            # Email/phone requirements
            if require_email:
                query += " AND email_address IS NOT NULL AND email_address != ''"

            if require_phone:
                query += " AND phone IS NOT NULL AND phone != ''"

            # Order by expiration urgency and fleet size (prioritize larger fleets)
            query += " ORDER BY days_until_expiry ASC, power_units DESC"

            # Apply limit
            if limit > 0:
                query += " LIMIT ?"
                params.append(limit)

            print(f"Executing query with {len(params)} parameters")
            cursor.execute(query, params)
            results = cursor.fetchall()

            # Convert to list of dictionaries for JSON response
            leads = []
            for row in results:
                lead = dict(row)

                # Format for frontend compatibility (matching the expected structure)
                formatted_lead = {
                    "dot_number": lead.get("dot_number", ""),
                    "mc_number": lead.get("mc_number", ""),
                    "legal_name": lead.get("legal_name", ""),
                    "dba_name": lead.get("dba_name", ""),
                    "company_name": lead.get("legal_name", ""),  # Alias for compatibility
                    "street": lead.get("street", ""),
                    "city": lead.get("city", ""),
                    "state": lead.get("state", ""),
                    "zip_code": lead.get("zip_code", ""),
                    "phone": lead.get("phone", ""),
                    "email": lead.get("email_address", ""),
                    "email_address": lead.get("email_address", ""),  # Keep both for compatibility
                    "power_units": lead.get("power_units", 0),
                    "fleet_size": lead.get("power_units", 0),  # Alias for compatibility
                    "drivers": lead.get("drivers", 0),
                    "insurance_company": lead.get("insurance_company_name", ""),
                    "insurance_carrier": lead.get("insurance_carrier", ""),
                    "insurance_expiry": lead.get("insurance_expiration_date", ""),
                    "insurance_expiration_date": lead.get("insurance_expiration_date", ""),
                    "days_until_expiry": lead.get("days_until_expiry", None),
                    "days_until_renewal": lead.get("days_until_expiry", None),  # Alias for compatibility
                    "operating_status": lead.get("operating_status", ""),
                    "entity_type": lead.get("entity_type", ""),
                    "website": lead.get("website", ""),
                    "fax": lead.get("fax", ""),
                    "cell_phone": lead.get("cell_phone", ""),
                    "contact_person": lead.get("contact_person", ""),
                    "contact_title": lead.get("contact_title", ""),
                    "business_type": lead.get("business_type", ""),
                    "cargo_carried": lead.get("cargo_carried", ""),
                    "safety_rating": lead.get("safety_rating", ""),
                }
                leads.append(formatted_lead)

            print(f"Found {len(leads)} leads")

            # Return response in expected format
            return jsonify({
                "success": True,
                "total": len(leads),
                "leads": leads,
                "data_source": "fmcsa_enhanced database table",  # Updated to show database source
                "processed_records": len(leads),
                "date_range": {
                    "start_date": datetime.now().strftime("%Y-%m-%d"),
                    "end_date": (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
                },
                "filters": {
                    "state": state or "All",
                    "days": days,
                    "skip_days": skip_days,
                    "limit": limit,
                    "min_fleet": min_fleet,
                    "max_fleet": max_fleet,
                    "insurance_companies": insurance_companies.split(',') if insurance_companies else [],
                    "require_email": require_email,
                    "require_phone": require_phone
                }
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "matched-carriers-leads-db",
        "database": DB_PATH,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API Health check endpoint"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced WHERE state = 'OH'")
            ohio_count = cursor.fetchone()[0]

        return jsonify({
            "status": "healthy",
            "service": "matched-carriers-leads-db",
            "database": DB_PATH,
            "ohio_records": ohio_count,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print(f"Starting Matched Carriers Leads API (Database Version)")
    print(f"Database: {DB_PATH}")
    print(f"Server will run on http://localhost:5002")

    # Test database connection
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced")
            total_records = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced WHERE state = 'OH'")
            ohio_records = cursor.fetchone()[0]
            print(f"Database connected successfully:")
            print(f"  Total records: {total_records:,}")
            print(f"  Ohio records: {ohio_records:,}")
    except Exception as e:
        print(f"Database connection error: {e}")
        exit(1)

    app.run(debug=True, host='0.0.0.0', port=5002)