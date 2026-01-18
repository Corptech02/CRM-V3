from datetime import datetime, timedelta

# Test the date logic
today = datetime.now().date()
print(f"Today: {today}")
print(f"30 days from now: {today + timedelta(days=30)}")

test_dates = [
    "2020-09-23",  # KENDRICK FARMS
    "2023-09-25",  # THOMAS TRANSPORT
    "2024-09-23",  # CLAYTON CROWDER
]

for renewal_date in test_dates:
    month_day = renewal_date[5:10]  # MM-DD
    print(f"\nTesting {renewal_date} (month-day: {month_day})")
    
    # Check current year and next year
    for year in [today.year, today.year + 1]:
        test_date_str = f"{year}-{month_day}"
        test_date = datetime.strptime(test_date_str, '%Y-%m-%d').date()
        days_diff = (test_date - today).days
        print(f"  As {test_date_str}: {days_diff} days from today")
        if 0 <= days_diff <= 30:
            print(f"    ✅ WOULD BE INCLUDED")
