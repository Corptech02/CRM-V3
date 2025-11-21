#!/usr/bin/env python3
"""
Simple API endpoint to update lead stage in vanguard.db
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json

app = Flask(__name__)
CORS(app)

DB_PATH = "/var/www/vanguard/vanguard.db"

@app.route('/api/update_lead', methods=['POST'])
def update_lead():
    """Update lead stage or other fields in vanguard.db"""
    try:
        data = request.json
        lead_id = data.get('lead_id')
        updates = data.get('updates', {})

        if not lead_id:
            return jsonify({'success': False, 'error': 'No lead_id provided'}), 400

        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Get current lead data
        cursor.execute("SELECT data FROM leads WHERE id = ?", (lead_id,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({'success': False, 'error': 'Lead not found'}), 404

        # Parse current data
        lead_data = json.loads(row[0])

        # Update fields
        for key, value in updates.items():
            lead_data[key] = value

        # Save back to database
        cursor.execute("UPDATE leads SET data = ? WHERE id = ?",
                      (json.dumps(lead_data), lead_id))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Lead updated'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/get_lead/<lead_id>', methods=['GET'])
def get_lead(lead_id):
    """Get lead data from vanguard.db"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT data FROM leads WHERE id = ?", (lead_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'success': False, 'error': 'Lead not found'}), 404

        lead_data = json.loads(row[0])
        return jsonify({'success': True, 'data': lead_data})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)