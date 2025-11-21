#!/usr/bin/env python3
"""
FINAL FIXED Matched Carriers Leads API - Proper Calendar Logic
Fixed date calculation issue and improved performance
"""

import sqlite3
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

# Database path
DB_PATH = '/home/corp06/vanguard-vps-package/vanguard_system.db'
COMPLETE_DB_PATH = '/var/www/vanguard/fmcsa_complete.db'

def get_db_connection():
    """Get database connection with Row factory for dict-like access"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_representative_data(dot_number):
    """Get representative name and title from complete database - checks all available fields"""
    try:
        conn = sqlite3.connect(COMPLETE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT representative_1_name, representative_1_title,
                   representative_2_name, representative_2_title,
                   principal_name, principal_title, officers_data
            FROM carriers WHERE dot_number = ?
        """, (dot_number,))
        row = cursor.fetchone()
        conn.close()

        if row:
            rep1_name, rep1_title, rep2_name, rep2_title, principal_name, principal_title, officers_data = row

            # Priority: representative_1 > representative_2 > principal > officers_data
            if rep1_name and rep1_name.strip():
                return rep1_name.strip(), rep1_title or 'Representative'
            elif rep2_name and rep2_name.strip():
                return rep2_name.strip(), rep2_title or 'Representative'
            elif principal_name and principal_name.strip():
                return principal_name.strip(), principal_title or 'Principal'
            elif officers_data:
                # Try to extract from JSON officers data
                try:
                    import json
                    officers = json.loads(officers_data)
                    if 'representatives' in officers and officers['representatives']:
                        first_rep = officers['representatives'][0]
                        name = first_rep.get('name', '').strip()
                        title = first_rep.get('title', 'Representative')
                        if name:
                            return name, title
                except:
                    pass

        return '', ''
    except:
        return '', ''


def generate_day_list(start_date, days, skip_days=0):
    """
    Generate exact list of calendar days to match (MM-DD format)
    This fixes the date calculation issue
    """
    actual_start = start_date + timedelta(days=skip_days)
    day_list = []

    for i in range(days):
        current_day = actual_start + timedelta(days=i)
        day_list.append(f"{current_day.month:02d}-{current_day.day:02d}")

    print(f"Looking for exact days: {day_list[:5]}...{day_list[-5:]} ({len(day_list)} days)")
    return day_list

@app.route('/api/matched-carriers-leads', methods=['GET'])
def get_matched_carriers_leads():
    """
    FINAL FIXED: Get matched carriers leads with proper calendar logic
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

        print(f"FINAL API Query - State: {state}, Days: {days}, Skip: {skip_days}, Company: {insurance_companies}")

        # Generate exact list of calendar days to match
        today = datetime.now()
        target_days = generate_day_list(today, days, skip_days)

        # Convert to SQL IN clause with MM-DD format
        day_placeholders = ','.join(['?' for _ in target_days])

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Build query with exact day matching
            query = f"""
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
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders})
            """
            params = target_days.copy()

            # State filter
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

            # Insurance companies filter
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

            # Order by calendar proximity and fleet size
            query += """
                ORDER BY
                    strftime('%m', insurance_expiration_date),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER),
                    power_units DESC
            """

            # Apply limit
            if limit > 0:
                query += " LIMIT ?"
                params.append(limit)

            print(f"Executing FINAL query with {len(params)} parameters")
            cursor.execute(query, params)
            results = cursor.fetchall()

            # Convert to list of dictionaries (simplified - no full lead list for performance)
            lead_count = len(results)

            # Calculate stats without loading full data
            progressive_count = 0
            email_count = 0
            phone_count = 0

            sample_leads = []  # Only return a small sample

            for i, row in enumerate(results):
                lead = dict(row)

                # Count stats
                insurance_name = str(lead.get("insurance_company_name", "")).upper()
                insurance_carrier = str(lead.get("insurance_carrier", "")).upper()

                if "PROGRESSIVE" in insurance_name or "PROGRESSIVE" in insurance_carrier:
                    progressive_count += 1

                if lead.get("email_address"):
                    email_count += 1

                if lead.get("phone"):
                    phone_count += 1

                # Include leads up to the specified limit (default 10000)
                if len(sample_leads) < limit:
                    # Calculate calendar days for display
                    try:
                        exp_date_str = lead.get("insurance_expiration_date", "")
                        if exp_date_str:
                            exp_date = datetime.strptime(exp_date_str, "%Y-%m-%d")
                            today_start = today + timedelta(days=skip_days)
                            target_date = datetime(today.year, exp_date.month, exp_date.day)

                            if target_date < today_start:
                                target_date = datetime(today.year + 1, exp_date.month, exp_date.day)

                            calendar_days_until_expiry = (target_date - today).days
                        else:
                            calendar_days_until_expiry = None
                    except:
                        calendar_days_until_expiry = None

                    # Get representative name from complete FMCSA database
                    dot_number = lead.get("dot_number", "")
                    rep_name, rep_title = get_representative_data(dot_number) if dot_number else ("", "")

                    sample_lead = {
                        "dot_number": dot_number,
                        "mc_number": lead.get("mc_number", ""),
                        "legal_name": lead.get("legal_name", ""),
                        "company_name": lead.get("legal_name", ""),
                        "representative_name": rep_name,
                        "representative_title": rep_title,
                        "city": lead.get("city", ""),
                        "state": lead.get("state", ""),
                        "phone": lead.get("phone", ""),
                        "email": lead.get("email_address", ""),
                        "power_units": lead.get("power_units", 0),
                        "insurance_company": lead.get("insurance_company_name", ""),
                        "insurance_expiry": lead.get("insurance_expiration_date", ""),
                        "days_until_expiry": calendar_days_until_expiry,
                        "days_until_renewal": calendar_days_until_expiry,
                    }
                    sample_leads.append(sample_lead)

            print(f"FINAL API Results: {lead_count} total, {progressive_count} Progressive, {email_count} with email")

            # Return response with summary stats and sample only
            return jsonify({
                "success": True,
                "total": lead_count,
                "leads": sample_leads,  # Up to limit parameter (default 10000)
                "stats": {
                    "total_leads": lead_count,
                    "progressive_leads": progressive_count,
                    "with_email": email_count,
                    "with_phone": phone_count
                },
                "data_source": "fmcsa_enhanced database (FIXED CALENDAR LOGIC)",
                "note": f"Showing first {min(limit, lead_count)} leads - full count in stats",
                "processed_records": lead_count,
                "date_range": {
                    "start_date": (today + timedelta(days=skip_days)).strftime("%Y-%m-%d"),
                    "end_date": (today + timedelta(days=skip_days + days - 1)).strftime("%Y-%m-%d")
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
        print(f"FINAL API Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/matched-carriers-leads/export', methods=['GET'])
def export_leads():
    """
    Export endpoint - returns full lead data for Vicidial integration
    """
    try:
        # Get parameters
        days = int(request.args.get('days', 30))
        state = request.args.get('state', 'OH').upper()
        skip_days = int(request.args.get('skip_days', 0))
        min_fleet = int(request.args.get('min_fleet', 0))
        max_fleet = int(request.args.get('max_fleet', 99999))
        limit = int(request.args.get('limit', 1000))

        # Get insurance companies parameter
        insurance_companies_param = request.args.get('insurance_companies', '')
        if not insurance_companies_param:
            return jsonify({"success": False, "error": "No insurance companies specified", "leads": []})

        insurance_companies = [comp.strip().upper() for comp in insurance_companies_param.split(',')]

        today = datetime.now()
        target_days = generate_day_list(today, days, skip_days)
        day_placeholders = ','.join(['?' for _ in target_days])

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Build insurance company conditions
            insurance_conditions = []
            query_params = []

            for company in insurance_companies:
                if company == 'PROGRESSIVE':
                    insurance_conditions.append("insurance_company_name LIKE '%PROGRESSIVE%'")
                else:
                    insurance_conditions.append("insurance_company_name LIKE ?")
                    query_params.append(f"%{company}%")

            insurance_clause = ' OR '.join(insurance_conditions)

            # Query with complete lead data including all required fields
            query = f"""
                SELECT
                    dot_number, mc_number, legal_name, contact_person, contact_title,
                    street, city, state, zip_code,
                    (CASE WHEN street IS NOT NULL AND city IS NOT NULL AND state IS NOT NULL
                          THEN COALESCE(street, '') || ', ' || COALESCE(city, '') || ', ' || COALESCE(state, '') || ' ' || COALESCE(zip_code, '')
                          ELSE '' END) as full_address,
                    phone, cell_phone, fax, email_address,
                    power_units, drivers, bipd_insurance_on_file_amount,
                    insurance_expiration_date, insurance_company_name,
                    safety_rating, operating_status, business_type, cargo_carried
                FROM fmcsa_enhanced
                WHERE state = ?
                AND insurance_expiration_date IS NOT NULL
                AND ({insurance_clause})
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders})
                AND power_units >= ? AND power_units <= ?
                LIMIT ?
            """

            all_params = [state] + query_params + target_days + [min_fleet, max_fleet, limit]
            cursor.execute(query, all_params)
            rows = cursor.fetchall()

            leads = []
            for row in rows:
                # Get representative data from complete database
                rep_name, rep_title = get_representative_data(row[0])

                leads.append({
                    'usdot_number': row[0] or '',
                    'mc_number': row[1] or '',
                    'company_name': row[2] or '',  # legal_name
                    'representative_name': rep_name or row[3] or '',  # Use complete db first, fallback to contact_person
                    'representative_title': rep_title or row[4] or '',  # Use complete db first, fallback to contact_title
                    'street_address': row[5] or '',
                    'city': row[6] or '',
                    'state': row[7] or '',
                    'zip_code': row[8] or '',
                    'full_address': row[9] or '',
                    'phone': row[10] or '',
                    'cell_phone': row[11] or '',
                    'fax': row[12] or '',
                    'email': row[13] or '',  # email_address
                    'fleet_size': row[14] or 0,  # power_units
                    'drivers': row[15] or 0,
                    'insurance_amount': row[16] or '',  # bipd_insurance_on_file_amount
                    'insurance_expiry': row[17] or '',
                    'insurance_company': row[18] or '',  # insurance_company_name
                    'safety_rating': row[19] or '',
                    'operating_status': row[20] or '',
                    'business_type': row[21] or '',
                    'cargo_carried': row[22] or ''
                })

            return jsonify({
                "success": True,
                "leads": leads,
                "total": len(leads),
                "criteria": {
                    "days": days,
                    "state": state,
                    "insurance_companies": insurance_companies,
                    "skip_days": skip_days,
                    "limit": limit
                }
            })

    except Exception as e:
        return jsonify({"success": False, "error": str(e), "leads": []})

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "matched-carriers-leads-FINAL (fixed calendar + performance)",
        "database": DB_PATH,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API Health check endpoint"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Test the fixed calendar logic
            today = datetime.now()
            target_days_30 = generate_day_list(today, 30, 0)
            target_days_60 = generate_day_list(today, 60, 0)

            day_placeholders_30 = ','.join(['?' for _ in target_days_30])
            day_placeholders_60 = ','.join(['?' for _ in target_days_60])

            cursor.execute(f"""
                SELECT COUNT(*) FROM fmcsa_enhanced
                WHERE state = 'OH' AND insurance_expiration_date IS NOT NULL
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders_30})
            """, target_days_30)
            ohio_30_count = cursor.fetchone()[0]

            cursor.execute(f"""
                SELECT COUNT(*) FROM fmcsa_enhanced
                WHERE state = 'OH' AND insurance_expiration_date IS NOT NULL
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders_60})
            """, target_days_60)
            ohio_60_count = cursor.fetchone()[0]

        return jsonify({
            "status": "healthy",
            "service": "matched-carriers-leads-FINAL",
            "database": DB_PATH,
            "ohio_30_day_leads": ohio_30_count,
            "ohio_60_day_leads": ohio_60_count,
            "method": "FIXED calendar-based date matching",
            "performance": "Only returns first 10 leads + stats",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print(f"🚀 Starting FINAL FIXED Matched Carriers Leads API")
    print(f"📊 Database: {DB_PATH}")
    print(f"🗓️  Method: FIXED calendar-based date matching")
    print(f"⚡ Performance: Only returns sample leads + stats")
    print(f"🌐 Server: http://localhost:5002")

    # Test database connection and fixed logic
    try:
        today = datetime.now()
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Test total records
            cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced")
            total_records = cursor.fetchone()[0]

            # Test Ohio records
            cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced WHERE state = 'OH'")
            ohio_records = cursor.fetchone()[0]

            # Test FIXED calendar logic
            target_days_30 = generate_day_list(today, 30, 0)
            target_days_60 = generate_day_list(today, 60, 0)

            day_placeholders_30 = ','.join(['?' for _ in target_days_30])
            day_placeholders_60 = ','.join(['?' for _ in target_days_60])

            cursor.execute(f"""
                SELECT COUNT(*) FROM fmcsa_enhanced
                WHERE state = 'OH' AND insurance_expiration_date IS NOT NULL
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders_30})
            """, target_days_30)
            ohio_30 = cursor.fetchone()[0]

            cursor.execute(f"""
                SELECT COUNT(*) FROM fmcsa_enhanced
                WHERE state = 'OH' AND insurance_expiration_date IS NOT NULL
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders_60})
            """, target_days_60)
            ohio_60 = cursor.fetchone()[0]

            print(f"✅ Database connected with FIXED logic:")
            print(f"   📈 Total records: {total_records:,}")
            print(f"   🏢 Ohio records: {ohio_records:,}")
            print(f"   📅 Ohio 30-day FIXED: {ohio_30:,}")
            print(f"   📅 Ohio 60-day FIXED: {ohio_60:,}")
            print(f"   🎯 Should be reasonable progression now!")

    except Exception as e:
        print(f"❌ Database connection error: {e}")
        exit(1)

    app.run(debug=True, host='0.0.0.0', port=5002)