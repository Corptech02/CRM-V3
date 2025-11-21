#!/usr/bin/env python3
"""
Matched Carriers Leads API - COUNTS ONLY
Simple scan and filter based on criteria - returns ONLY accurate counts
No sample leads, no clutter - just pure numbers
"""

import sqlite3
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

# Database paths
DB_PATH = '/home/corp06/vanguard-vps-package/vanguard_system.db'
FMCSA_COMPLETE_DB_PATH = '/var/www/vanguard/fmcsa_complete.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_complete_db_connection():
    """Get connection to fmcsa_complete database for address data"""
    conn = sqlite3.connect(FMCSA_COMPLETE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_day_list(start_date, days, skip_days=0):
    """Generate exact list of calendar days to match (MM-DD format)"""
    actual_start = start_date + timedelta(days=skip_days)
    day_list = []

    for i in range(days):
        current_day = actual_start + timedelta(days=i)
        day_list.append(f"{current_day.month:02d}-{current_day.day:02d}")

    return day_list

@app.route('/api/matched-carriers-leads', methods=['GET'])
def get_matched_carriers_leads():
    """
    COUNTS ONLY: Scan database and return accurate filtered counts
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

        print(f"COUNTS ONLY API - State: {state}, Days: {days}, Skip: {skip_days}, Company: {insurance_companies}")

        # Generate exact list of calendar days
        today = datetime.now()
        target_days = generate_day_list(today, days, skip_days)
        day_placeholders = ','.join(['?' for _ in target_days])

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Build base query for counting
            base_query = f"""
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
                base_query += " AND state = ?"
                params.append(state)

            # Fleet size filters (handle NULL and 0 values properly)
            if min_fleet > 0:
                base_query += " AND COALESCE(power_units, 0) >= ?"
                params.append(min_fleet)

            if max_fleet < 99999:
                base_query += " AND COALESCE(power_units, 0) <= ?"
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
                        base_query += f" AND ({' OR '.join(like_conditions)})"

            # Email/phone requirements
            if require_email:
                base_query += " AND email_address IS NOT NULL AND email_address != ''"

            if require_phone:
                base_query += " AND phone IS NOT NULL AND phone != ''"

            # Execute counting queries
            print(f"Executing counts with {len(params)} parameters")

            # Total count
            cursor.execute(f"SELECT COUNT(*) {base_query}", params)
            total_count = cursor.fetchone()[0]

            # Progressive count
            progressive_params = params.copy()
            progressive_query = base_query + " AND (insurance_company_name LIKE '%PROGRESSIVE%' OR insurance_carrier LIKE '%PROGRESSIVE%')"
            cursor.execute(f"SELECT COUNT(*) {progressive_query}", progressive_params)
            progressive_count = cursor.fetchone()[0]

            # Email count
            email_params = params.copy()
            email_query = base_query + " AND email_address IS NOT NULL AND email_address != ''"
            cursor.execute(f"SELECT COUNT(*) {email_query}", email_params)
            email_count = cursor.fetchone()[0]

            # Phone count
            phone_params = params.copy()
            phone_query = base_query + " AND phone IS NOT NULL AND phone != ''"
            cursor.execute(f"SELECT COUNT(*) {phone_query}", phone_params)
            phone_count = cursor.fetchone()[0]

            # Urgent count (expires within 7 days)
            if skip_days == 0:  # Only calculate urgent if not skipping days
                urgent_target_days = generate_day_list(today, min(7, days), 0)
                urgent_day_placeholders = ','.join(['?' for _ in urgent_target_days])
                urgent_params = params.copy()
                # Replace the day placeholders in the query
                urgent_query = base_query.replace(day_placeholders, urgent_day_placeholders)
                urgent_params[:len(target_days)] = urgent_target_days  # Replace first N params
                cursor.execute(f"SELECT COUNT(*) {urgent_query}", urgent_params)
                urgent_count = cursor.fetchone()[0]
            else:
                urgent_count = 0

            print(f"COUNTS ONLY Results: {total_count} total, {progressive_count} Progressive")

            # Return ONLY counts - no lead data
            return jsonify({
                "success": True,
                "total": total_count,
                "leads": [],  # Empty - no lead data returned
                "stats": {
                    "total_leads": total_count,
                    "progressive_leads": progressive_count,
                    "with_email": email_count,
                    "with_phone": phone_count,
                    "urgent_leads": urgent_count
                },
                "data_source": "fmcsa_enhanced database (COUNTS ONLY - NO SAMPLE DATA)",
                "processed_records": total_count,
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
        print(f"COUNTS ONLY API Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/matched-carriers-leads/export', methods=['GET'])
def export_leads():
    """
    Export endpoint - returns full lead data for export functionality
    Uses same filtering as counts-only but returns actual lead records
    """
    try:
        # Get same query parameters as main endpoint
        state = request.args.get('state', '').strip().upper()
        days = int(request.args.get('days', 30))
        skip_days = int(request.args.get('skip_days', 0))
        limit = int(request.args.get('limit', 50000))  # Higher limit for export
        min_fleet = int(request.args.get('min_fleet', 0))  # Allow 0 for export
        max_fleet = int(request.args.get('max_fleet', 99999))
        insurance_companies = request.args.get('insurance_companies', '')
        require_email = request.args.get('require_email', 'false').lower() == 'true'
        require_phone = request.args.get('require_phone', 'false').lower() == 'true'

        print(f"EXPORT API - State: {state}, Days: {days}, Company: {insurance_companies}")

        # Generate exact list of calendar days
        today = datetime.now()
        target_days = generate_day_list(today, days, skip_days)
        day_placeholders = ','.join(['?' for _ in target_days])

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Build query for full lead data
            query = f"""
                SELECT
                    dot_number, mc_number, legal_name, dba_name, street, city, state, zip_code,
                    phone, email_address, power_units, drivers,
                    insurance_carrier, bipd_insurance_on_file_amount, policy_renewal_date,
                    website, fax, cell_phone, contact_person, contact_title,
                    business_type, cargo_carried, operating_status, entity_type,
                    safety_rating, safety_review_date, out_of_service_date,
                    insurance_company_name, insurance_expiration_date
                FROM fmcsa_enhanced
                WHERE insurance_expiration_date IS NOT NULL
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders})
            """
            params = target_days.copy()

            # Same filters as counts-only endpoint
            if state and state != 'ALL':
                query += " AND state = ?"
                params.append(state)

            if min_fleet > 0:
                query += " AND COALESCE(power_units, 0) >= ?"
                params.append(min_fleet)

            if max_fleet < 99999:
                query += " AND COALESCE(power_units, 0) <= ?"
                params.append(max_fleet)

            if insurance_companies:
                companies = [c.strip() for c in insurance_companies.split(',') if c.strip()]
                if companies:
                    like_conditions = []
                    for company in companies:
                        like_conditions.append("(insurance_company_name LIKE ? OR insurance_carrier LIKE ?)")
                        params.extend([f"%{company}%", f"%{company}%"])

                    if like_conditions:
                        query += f" AND ({' OR '.join(like_conditions)})"

            if require_email:
                query += " AND email_address IS NOT NULL AND email_address != ''"

            if require_phone:
                query += " AND phone IS NOT NULL AND phone != ''"

            # Order and limit
            query += """
                ORDER BY
                    strftime('%m', insurance_expiration_date),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER),
                    power_units DESC
            """

            if limit > 0:
                query += " LIMIT ?"
                params.append(limit)

            print(f"Executing EXPORT query for {len(params)} parameters")
            cursor.execute(query, params)
            results = cursor.fetchall()

            # Convert to format expected by export functions and enhance with address data
            export_leads = []
            address_lookup = {}

            # First, get address data from the complete database for matching DOT numbers
            # FIX: Convert DOT numbers to integers for proper join (TEXT -> INTEGER data type mismatch)
            dot_numbers = []
            for row in results:
                dot_num = dict(row).get("dot_number")
                if dot_num:
                    try:
                        dot_numbers.append(int(dot_num))  # Convert TEXT to INTEGER
                    except (ValueError, TypeError):
                        continue  # Skip invalid DOT numbers

            if dot_numbers:
                with get_complete_db_connection() as complete_conn:
                    complete_cursor = complete_conn.cursor()
                    dot_placeholders = ','.join(['?' for _ in dot_numbers])
                    address_query = f"""
                        SELECT dot_number, street, city, state, zip_code, phone,
                               representative_1_name, representative_1_title,
                               representative_2_name, representative_2_title
                        FROM carriers
                        WHERE dot_number IN ({dot_placeholders})
                    """
                    complete_cursor.execute(address_query, dot_numbers)
                    address_results = complete_cursor.fetchall()

                    # DEBUG: Print first few results
                    print(f"🔍 DEBUG: Queried {len(dot_numbers)} DOT numbers, found {len(address_results)} with address data")
                    for addr_row in address_results[:3]:  # Show first 3 matches
                        addr_data = dict(addr_row)
                        if addr_data.get("representative_1_name"):
                            print(f"   ✅ Found representative: DOT {addr_data['dot_number']} = {addr_data['representative_1_name']}")

                    # Build lookup dictionary for address data
                    for addr_row in address_results:
                        addr_data = dict(addr_row)
                        address_lookup[addr_data["dot_number"]] = addr_data

            for row in results:
                lead = dict(row)
                dot_number = lead.get("dot_number", "")

                # Get enhanced address data if available (convert to int for lookup)
                try:
                    dot_int = int(dot_number) if dot_number else 0
                    address_data = address_lookup.get(dot_int, {})
                except (ValueError, TypeError):
                    address_data = {}

                # Choose the best representative name/title (prioritize representative_1 over representative_2)
                rep_name = address_data.get("representative_1_name") or address_data.get("representative_2_name") or lead.get("contact_person", "")
                rep_title = address_data.get("representative_1_title") or address_data.get("representative_2_title") or lead.get("contact_title", "")

                # Use address from complete database if available, otherwise fall back to fmcsa_enhanced
                street = address_data.get("street") or lead.get("street", "")
                city = address_data.get("city") or lead.get("city", "")
                state = address_data.get("state") or lead.get("state", "")
                zip_code = address_data.get("zip_code") or lead.get("zip_code", "")
                phone = address_data.get("phone") or lead.get("phone", "")
                fax = lead.get("fax", "")  # Only from fmcsa_enhanced since carriers table doesn't have fax

                # Map database fields to export format expected by app.js
                export_lead = {
                    "usdot_number": dot_number,
                    "mc_number": lead.get("mc_number", ""),
                    "legal_name": lead.get("legal_name", ""),
                    "representative_name": rep_name,                        # Enhanced representative data
                    "representative_title": rep_title,                      # Enhanced representative title
                    "street": street,                                       # Enhanced street address
                    "city": city,
                    "state": state,
                    "zip_code": zip_code,                                   # Enhanced zip code
                    "full_address": f"{street} {city} {state} {zip_code}".replace("  ", " ").strip(),  # Complete enhanced address
                    "phone": phone,                                         # Enhanced phone
                    "cell_phone": lead.get("cell_phone", ""),
                    "fax": fax,                                            # Enhanced fax
                    "email": lead.get("email_address", ""),
                    "fleet_size": lead.get("power_units", 0),
                    "drivers": lead.get("drivers", 0),
                    "insurance_amount": lead.get("bipd_insurance_on_file_amount", ""),
                    "insurance_expiry": lead.get("insurance_expiration_date", ""),
                    "insurance_company": lead.get("insurance_company_name", ""),
                    "safety_rating": lead.get("safety_rating", ""),
                    "operating_status": lead.get("operating_status", ""),
                    "business_type": lead.get("business_type", ""),
                    "cargo_carried": lead.get("cargo_carried", "")
                }
                export_leads.append(export_lead)

            print(f"EXPORT API Results: {len(export_leads)} leads ready for export")

            return jsonify({
                "success": True,
                "leads": export_leads,
                "total": len(export_leads),
                "export_ready": True,
                "data_source": "fmcsa_enhanced + fmcsa_complete (ENHANCED WITH ADDRESS DATA)",
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
        print(f"EXPORT API Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "matched-carriers-leads-COUNTS-ONLY",
        "database": DB_PATH,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API Health check endpoint"""
    try:
        today = datetime.now()
        target_days_30 = generate_day_list(today, 30, 0)
        target_days_60 = generate_day_list(today, 60, 0)

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Test 30-day Ohio count
            day_placeholders_30 = ','.join(['?' for _ in target_days_30])
            cursor.execute(f"""
                SELECT COUNT(*) FROM fmcsa_enhanced
                WHERE state = 'OH' AND insurance_expiration_date IS NOT NULL
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders_30})
            """, target_days_30)
            ohio_30_count = cursor.fetchone()[0]

            # Test 60-day Ohio count
            day_placeholders_60 = ','.join(['?' for _ in target_days_60])
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
            "service": "matched-carriers-leads-COUNTS-ONLY",
            "database": DB_PATH,
            "ohio_30_day_leads": ohio_30_count,
            "ohio_60_day_leads": ohio_60_count,
            "method": "Calendar-based counting only",
            "performance": "Returns counts only - no lead data",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print(f"🔢 Starting COUNTS ONLY Matched Carriers API")
    print(f"📊 Database: {DB_PATH}")
    print(f"🎯 Method: Scan and filter - return accurate counts only")
    print(f"⚡ Performance: No lead data returned - counts only")
    print(f"🌐 Server: http://localhost:5002")

    # Test database connection
    try:
        today = datetime.now()
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Test total records
            cursor.execute("SELECT COUNT(*) FROM fmcsa_enhanced")
            total_records = cursor.fetchone()[0]

            # Test Ohio 30-day count
            target_days_30 = generate_day_list(today, 30, 0)
            day_placeholders_30 = ','.join(['?' for _ in target_days_30])
            cursor.execute(f"""
                SELECT COUNT(*) FROM fmcsa_enhanced
                WHERE state = 'OH' AND insurance_expiration_date IS NOT NULL
                AND printf('%02d-%02d',
                    CAST(strftime('%m', insurance_expiration_date) AS INTEGER),
                    CAST(strftime('%d', insurance_expiration_date) AS INTEGER)
                ) IN ({day_placeholders_30})
            """, target_days_30)
            ohio_30 = cursor.fetchone()[0]

            print(f"✅ Database connected - COUNTS ONLY mode:")
            print(f"   📈 Total records: {total_records:,}")
            print(f"   📊 Ohio 30-day count: {ohio_30:,}")
            print(f"   🎯 Ready to provide accurate counts without lead data")

    except Exception as e:
        print(f"❌ Database connection error: {e}")
        exit(1)

    app.run(debug=True, host='0.0.0.0', port=5002)