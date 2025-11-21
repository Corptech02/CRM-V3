#!/usr/bin/env python3
import sqlite3
import csv
from datetime import datetime, timedelta

def generate_30_day_excel():
    # Calculate dates
    today = datetime(2024, 10, 7)
    start_date = today + timedelta(days=25)  # November 1, 2024
    end_date = today + timedelta(days=40)    # November 16, 2024

    print("Generating Excel file for carriers expiring in 30 days...")

    conn = sqlite3.connect('/var/www/vanguard/fmcsa_complete.db')
    cursor = conn.cursor()

    # Find ALL carriers expiring in ~30 days WITH representative data
    query = """
        SELECT
            dot_number,
            legal_name,
            dba_name,
            city,
            state,
            phone,
            email_address,
            policy_renewal_date,
            representative_1_name,
            representative_1_title,
            representative_2_name,
            representative_2_title,
            street,
            zip_code,
            vehicle_count
        FROM carriers
        WHERE policy_renewal_date BETWEEN ? AND ?
        AND representative_1_name IS NOT NULL
        ORDER BY policy_renewal_date, state, city
    """

    # Format dates for SQL query
    start_str = start_date.strftime('%Y-%m-%d')
    end_str = end_date.strftime('%Y-%m-%d')

    cursor.execute(query, (start_str, end_str))
    results = cursor.fetchall()

    # Create CSV file (Excel-compatible)
    output_file = '/var/www/vanguard/30_Day_Expiring_Carriers_Nov2024.csv'

    with open(output_file, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.writer(csvfile)

        # Write headers
        headers = [
            'DOT Number',
            'Legal Name',
            'DBA Name',
            'Street Address',
            'City',
            'State',
            'ZIP Code',
            'Phone',
            'Email',
            'Policy Expiration Date',
            'Days Until Expiration',
            'Representative 1 Name',
            'Representative 1 Title',
            'Representative 2 Name',
            'Representative 2 Title',
            'Vehicle Count',
            'Contact Priority'
        ]
        writer.writerow(headers)

        # Write data rows
        for row in results:
            dot, legal_name, dba, city, state, phone, email, renewal, rep1_name, rep1_title, rep2_name, rep2_title, street, zip_code, vehicles = row

            # Calculate days until expiration
            renewal_date = datetime.strptime(renewal, '%Y-%m-%d')
            days_until = (renewal_date - today).days

            # Format renewal date for Excel
            renewal_formatted = renewal_date.strftime('%m/%d/%Y')

            # Determine contact priority
            if vehicles and vehicles > 10:
                priority = 'HIGH - Large Fleet'
            elif state == 'OH':
                priority = 'HIGH - Ohio'
            elif rep2_name:
                priority = 'MEDIUM - Multiple Reps'
            else:
                priority = 'STANDARD'

            # Clean up phone number
            if phone:
                phone = phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')
                if len(phone) == 10:
                    phone = f'({phone[:3]}) {phone[3:6]}-{phone[6:]}'

            # Write row
            writer.writerow([
                dot,
                legal_name,
                dba or '',
                street or '',
                city,
                state,
                zip_code or '',
                phone or '',
                email or '',
                renewal_formatted,
                days_until,
                rep1_name,
                rep1_title,
                rep2_name or '',
                rep2_title or '',
                vehicles or '',
                priority
            ])

    # Also create a summary sheet
    summary_file = '/var/www/vanguard/30_Day_Summary_Nov2024.csv'

    with open(summary_file, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.writer(csvfile)

        # Summary statistics
        writer.writerow(['30-DAY EXPIRATION SUMMARY REPORT'])
        writer.writerow(['Generated:', datetime.now().strftime('%B %d, %Y at %I:%M %p')])
        writer.writerow([])
        writer.writerow(['STATISTICS'])
        writer.writerow(['Total Carriers Expiring:', len(results)])

        # Count by state
        state_counts = {}
        for row in results:
            state = row[4]
            state_counts[state] = state_counts.get(state, 0) + 1

        writer.writerow([])
        writer.writerow(['BY STATE'])
        for state, count in sorted(state_counts.items(), key=lambda x: x[1], reverse=True):
            writer.writerow([state, count])

        # Count by date
        date_counts = {}
        for row in results:
            date = row[7]
            date_counts[date] = date_counts.get(date, 0) + 1

        writer.writerow([])
        writer.writerow(['BY EXPIRATION DATE'])
        for date, count in sorted(date_counts.items()):
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            writer.writerow([date_obj.strftime('%B %d, %Y'), count])

    conn.close()

    print(f"✅ Generated: {output_file}")
    print(f"✅ Generated: {summary_file}")
    print(f"Total records: {len(results)}")

    return output_file, len(results)

if __name__ == "__main__":
    file_path, count = generate_30_day_excel()
    print(f"\n📊 Excel file ready with {count} carriers expiring in 30 days!")
    print(f"📁 File location: {file_path}")
    print(f"🌐 Download URL: http://162-220-14-239.nip.io:3001/download/30_Day_Expiring_Carriers_Nov2024.csv")