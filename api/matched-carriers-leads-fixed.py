#!/usr/bin/env python3
"""
FIXED Matched Carriers Leads API - Calendar-Based Date Matching
Properly pulls ALL leads based on calendar date patterns (ignoring year)
Handles: State, Expiration Days, Company Filter, Skip Days - EXACTLY as requested
"""

import sqlite3
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

# Database path
DB_PATH = '/home/corp06/vanguard-vps-package/vanguard_system.db'

def get_db_connection():
    """Get database connection with Row factory for dict-like access"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_calendar_date_conditions(start_date, days, skip_days=0):
    """
    Generate SQL conditions for calendar-based date matching (ignoring years)
    This replicates the successful manual scan logic
    """
    # Adjust start date by skip_days
    actual_start = start_date + timedelta(days=skip_days)
    end_date = actual_start + timedelta(days=days - 1)  # -1 because we include start day

    conditions = []
    params = []

    print(f"Calendar range: {actual_start.strftime('%m-%d')} to {end_date.strftime('%m-%d')}")

    # Handle same-month case
    if actual_start.month == end_date.month:
        conditions.append(
            "(strftime('%m', insurance_expiration_date) = ? AND " +
            "CAST(strftime('%d', insurance_expiration_date) AS INTEGER) >= ? AND " +
            "CAST(strftime('%d', insurance_expiration_date) AS INTEGER) <= ?)"
        )
        params.extend([f"{actual_start.month:02d}", actual_start.day, end_date.day])

    # Handle month-crossing case (e.g., Oct 28 to Nov 27)
    else:
        # First month (start date to end of month)
        last_day_start_month = (datetime(actual_start.year, actual_start.month + 1, 1) - timedelta(days=1)).day if actual_start.month < 12 else 31
        conditions.append(
            "(strftime('%m', insurance_expiration_date) = ? AND " +
            "CAST(strftime('%d', insurance_expiration_date) AS INTEGER) >= ?)"
        )
        params.extend([f"{actual_start.month:02d}", actual_start.day])

        # Middle months (if any) - full months
        current_month = actual_start.month + 1
        while current_month < end_date.month:
            if current_month > 12:
                current_month = 1
            conditions.append(f"strftime('%m', insurance_expiration_date) = '{current_month:02d}'")
            current_month += 1
            if current_month > 12:  # Prevent infinite loop
                break

        # End month (1st to end date)
        conditions.append(
            "(strftime('%m', insurance_expiration_date) = ? AND " +
            "CAST(strftime('%d', insurance_expiration_date) AS INTEGER) <= ?)"
        )
        params.extend([f"{end_date.month:02d}", end_date.day])

    return " OR ".join(conditions), params

@app.route('/api/matched-carriers-leads', methods=['GET'])
def get_matched_carriers_leads():
    """
    FIXED: Get matched carriers leads using calendar-based date matching
    Properly handles: State, Expiration Days, Company Filter, Skip Days
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

        print(f"FIXED API Query - State: {state}, Days: {days}, Skip: {skip_days}, Company: {insurance_companies}")

        # Use today as base date
        today = datetime.now()

        # Generate calendar-based date conditions (ignoring years)
        date_condition, date_params = generate_calendar_date_conditions(today, days, skip_days)

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Build query with calendar-based date matching
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
                AND ({date_condition})
            """
            params = date_params.copy()

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

            print(f"Executing FIXED query with {len(params)} parameters")
            cursor.execute(query, params)
            results = cursor.fetchall()

            # Convert to list of dictionaries for JSON response
            leads = []
            for row in results:
                lead = dict(row)

                # Calculate calendar-based days until expiry for display
                try:
                    exp_date_str = lead.get("insurance_expiration_date", "")
                    if exp_date_str:
                        exp_date = datetime.strptime(exp_date_str, "%Y-%m-%d")
                        # Calculate days until this month/day occurs (ignoring year)
                        today_month_day = (today.month, today.day)
                        exp_month_day = (exp_date.month, exp_date.day)

                        # Simple calculation for display purposes
                        if exp_month_day >= today_month_day:
                            days_diff = (datetime(today.year, exp_date.month, exp_date.day) - today).days
                        else:
                            days_diff = (datetime(today.year + 1, exp_date.month, exp_date.day) - today).days

                        calendar_days_until_expiry = max(0, days_diff)
                    else:
                        calendar_days_until_expiry = None
                except:
                    calendar_days_until_expiry = None

                # Format for frontend compatibility
                formatted_lead = {
                    "dot_number": lead.get("dot_number", ""),
                    "mc_number": lead.get("mc_number", ""),
                    "legal_name": lead.get("legal_name", ""),
                    "dba_name": lead.get("dba_name", ""),
                    "company_name": lead.get("legal_name", ""),
                    "street": lead.get("street", ""),
                    "city": lead.get("city", ""),
                    "state": lead.get("state", ""),
                    "zip_code": lead.get("zip_code", ""),
                    "phone": lead.get("phone", ""),
                    "email": lead.get("email_address", ""),
                    "email_address": lead.get("email_address", ""),
                    "power_units": lead.get("power_units", 0),
                    "fleet_size": lead.get("power_units", 0),
                    "drivers": lead.get("drivers", 0),
                    "insurance_company": lead.get("insurance_company_name", ""),
                    "insurance_carrier": lead.get("insurance_carrier", ""),
                    "insurance_expiry": lead.get("insurance_expiration_date", ""),
                    "insurance_expiration_date": lead.get("insurance_expiration_date", ""),
                    "days_until_expiry": calendar_days_until_expiry,
                    "days_until_renewal": calendar_days_until_expiry,
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

            print(f"FIXED API Found {len(leads)} leads (vs old API's ~60)")

            # Return response in expected format
            return jsonify({
                "success": True,
                "total": len(leads),
                "leads": leads,
                "data_source": "fmcsa_enhanced database table (CALENDAR-BASED MATCHING)",
                "processed_records": len(leads),
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
        print(f"FIXED API Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "matched-carriers-leads-FIXED (calendar-based)",
        "database": DB_PATH,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API Health check endpoint"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Test the calendar-based logic
            today = datetime.now()
            date_condition, date_params = generate_calendar_date_conditions(today, 30, 0)

            cursor.execute(f"""
                SELECT COUNT(*) FROM fmcsa_enhanced
                WHERE state = 'OH' AND insurance_expiration_date IS NOT NULL
                AND ({date_condition})
            """, date_params)
            ohio_30_day_count = cursor.fetchone()[0]

        return jsonify({
            "status": "healthy",
            "service": "matched-carriers-leads-FIXED",
            "database": DB_PATH,
            "ohio_30_day_leads": ohio_30_day_count,
            "method": "calendar-based date matching",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print(f"🚀 Starting FIXED Matched Carriers Leads API")
    print(f"📊 Database: {DB_PATH}")
    print(f"🗓️  Method: Calendar-based date matching (ignoring years)")
    print(f"🌐 Server: http://localhost:5002")

    # Test database connection and calendar logic
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

            # Test calendar-based 30-day Ohio leads
            date_condition, date_params = generate_calendar_date_conditions(today, 30, 0)
            cursor.execute(f"""
                SELECT COUNT(*) FROM fmcsa_enhanced
                WHERE state = 'OH' AND insurance_expiration_date IS NOT NULL
                AND ({date_condition})
            """, date_params)
            ohio_30_day = cursor.fetchone()[0]

            print(f"✅ Database connected successfully:")
            print(f"   📈 Total records: {total_records:,}")
            print(f"   🏢 Ohio records: {ohio_records:,}")
            print(f"   📅 Ohio 30-day calendar matches: {ohio_30_day:,}")
            print(f"   🎯 This should match our manual scan of 1,143!")

    except Exception as e:
        print(f"❌ Database connection error: {e}")
        exit(1)

    app.run(debug=True, host='0.0.0.0', port=5002)