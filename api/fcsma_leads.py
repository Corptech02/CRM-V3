#!/usr/bin/env python3
"""
FCSMA Leads API - Python Flask endpoint for Vanguard system
Connects to the FCSMA SQLite database and returns leads data
"""

import sqlite3
import json
import sys
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

FCSMA_DB_PATH = '/home/corp06/fcsma_leads.db'

@app.route('/api/fcsma-leads', methods=['POST', 'GET'])
def get_fcsma_leads():
    try:
        # Get request data
        if request.method == 'POST':
            data = request.get_json() or {}
        else:
            data = request.args.to_dict()

        expiry_days = int(data.get('expiryDays', 30))
        limit = int(data.get('limit', 100))
        carrier = data.get('carrier', '').strip()
        state = data.get('state', '').strip()

        # Connect to FCSMA database
        conn = sqlite3.connect(FCSMA_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Build query
        query = """
        SELECT DISTINCT
            mc_number,
            dot_number,
            insurance_carrier,
            policy_number,
            policy_start_date,
            policy_end_date,
            primary_coverage_amount,
            coverage_level,
            (julianday(policy_end_date) - julianday(date('now'))) as days_until_expiry
        FROM insurance_policies
        WHERE policy_end_date IS NOT NULL
            AND policy_end_date != ''
            AND julianday(policy_end_date) - julianday(date('now')) BETWEEN 0 AND ?
        """

        params = [expiry_days]

        # Add carrier filter
        if carrier:
            query += " AND UPPER(insurance_carrier) LIKE UPPER(?)"
            params.append(f"%{carrier}%")

        query += " ORDER BY policy_end_date ASC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        results = cursor.fetchall()

        # Format results
        leads = []
        for row in results:
            leads.append({
                'mc_number': row['mc_number'],
                'dot_number': row['dot_number'],
                'insurance_carrier': row['insurance_carrier'],
                'policy_number': row['policy_number'],
                'policy_start_date': row['policy_start_date'],
                'policy_end_date': row['policy_end_date'],
                'primary_coverage_amount': int(row['primary_coverage_amount']) if row['primary_coverage_amount'] else 0,
                'coverage_level': row['coverage_level'],
                'days_until_expiry': int(round(row['days_until_expiry'])) if row['days_until_expiry'] else 0,
                'coverage_amount_formatted': f"${(row['primary_coverage_amount'] * 1000):,.2f}" if row['primary_coverage_amount'] else '$0',
                'source': 'FCSMA Database'
            })

        # Get database stats
        cursor.execute("""
            SELECT
                COUNT(*) as total_policies,
                COUNT(CASE WHEN julianday(policy_end_date) - julianday(date('now')) BETWEEN 0 AND 30 THEN 1 END) as expiring_30_days,
                COUNT(CASE WHEN primary_coverage_amount >= 1000 THEN 1 END) as high_value_policies
            FROM insurance_policies
            WHERE policy_end_date IS NOT NULL AND policy_end_date != ''
        """)

        stats = dict(cursor.fetchone())
        conn.close()

        return jsonify({
            'success': True,
            'leads': leads,
            'count': len(leads),
            'criteria': {
                'expiryDays': expiry_days,
                'limit': limit,
                'carrier': carrier,
                'state': state
            },
            'stats': stats,
            'message': f"Found {len(leads)} FCSMA leads expiring within {expiry_days} days" if leads else "No FCSMA leads found matching criteria"
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'leads': [],
            'count': 0
        }), 500

@app.route('/api/fcsma-stats', methods=['GET'])
def get_fcsma_stats():
    try:
        conn = sqlite3.connect(FCSMA_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Overall stats
        cursor.execute("""
            SELECT
                COUNT(*) as total_policies,
                COUNT(DISTINCT insurance_carrier) as unique_carriers,
                COUNT(DISTINCT dot_number) as unique_dots,
                COUNT(CASE WHEN julianday(policy_end_date) - julianday(date('now')) BETWEEN 0 AND 30 THEN 1 END) as expiring_30_days,
                COUNT(CASE WHEN primary_coverage_amount >= 1000 THEN 1 END) as high_value_policies
            FROM insurance_policies
            WHERE policy_end_date IS NOT NULL AND policy_end_date != ''
        """)

        stats = dict(cursor.fetchone())

        # Top carriers
        cursor.execute("""
            SELECT insurance_carrier, COUNT(*) as count
            FROM insurance_policies
            WHERE policy_end_date IS NOT NULL
            GROUP BY insurance_carrier
            ORDER BY count DESC
            LIMIT 10
        """)

        top_carriers = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({
            'success': True,
            'stats': stats,
            'top_carriers': top_carriers
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Test the database connection
    try:
        conn = sqlite3.connect(FCSMA_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM insurance_policies')
        count = cursor.fetchone()[0]
        conn.close()
        print(f"✅ FCSMA database connected successfully - {count:,} policies")
    except Exception as e:
        print(f"❌ FCSMA database connection failed: {e}")
        sys.exit(1)

    app.run(host='0.0.0.0', port=5001, debug=True)