#!/usr/bin/env python3
"""
Simple HTTP server to serve CSV lead data
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import csv
import os
from urllib.parse import urlparse, parse_qs

class CSVLeadHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/csv-leads'):
            self.serve_csv_leads()
        else:
            self.send_error(404)

    def serve_csv_leads(self):
        """Serve leads from CSV files"""
        try:
            # Parse query parameters
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            state = params.get('state', [None])[0]
            limit = int(params.get('limit', [1000])[0])

            # CSV files with working representative data
            csv_files = [
                "/var/www/vanguard/30_Day_Expiring_Carriers_Nov2024.csv",
                "/var/www/vanguard/public/30_Day_Expiring_Carriers_Nov2024.csv",
                "/var/www/vanguard/public/august_insurance_expirations.csv",
                "/var/www/vanguard/download-portal/ohio_progressive_30days.csv"
            ]

            results = []

            for csv_file in csv_files:
                if not os.path.exists(csv_file):
                    continue

                try:
                    with open(csv_file, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            # Filter by state if specified
                            if state and row.get('State', '').upper() != state.upper():
                                continue

                            # Extract representative name
                            rep_name = (
                                row.get('Representative 1 Name', '') or
                                row.get('Representative_Name', '') or
                                row.get('Representative Name', '') or
                                ''
                            ).strip()

                            # Extract fields
                            lead = {
                                'dot_number': row.get('DOT Number', '') or row.get('DOT_Number', ''),
                                'legal_name': row.get('Legal Name', '') or row.get('Company_Name', ''),
                                'city': row.get('City', ''),
                                'state': row.get('State', ''),
                                'phone': row.get('Phone', ''),
                                'email_address': row.get('Email', ''),
                                'representative_name': rep_name,
                                'policy_renewal_date': row.get('Policy Expiration Date', '') or row.get('Policy_Expiration_Date', ''),
                                'insurance_carrier': row.get('Current_Insurance_Carrier', '') or row.get('insurance_carrier', ''),
                                'power_units': row.get('Fleet_Size', 0) or row.get('Vehicle Count', 0),
                                'operating_status': 'Active',
                                'quality_score': 'HIGH' if rep_name else 'MEDIUM'
                            }

                            results.append(lead)

                except Exception as e:
                    continue

            # Apply limit
            results = results[:limit]

            # Send response
            response = {
                "leads": results,
                "total": len(results),
                "success": True
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.send_error(500, str(e))

if __name__ == "__main__":
    server = HTTPServer(('0.0.0.0', 8898), CSVLeadHandler)
    print("🚀 CSV Lead Server running on port 8898")
    print("Test: http://localhost:8898/api/csv-leads?state=OH&limit=5")
    server.serve_forever()