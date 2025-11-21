# Ohio Leads Analysis - 380k+ Database

## Database Overview
- **Database**: `/var/www/vanguard/vanguard_system.db` (fmcsa_enhanced table)
- **Total Records**: 379,132
- **Ohio Records**: 16,106
- **Active Ohio Carriers**: 15,670

## Insurance Expiration Data Analysis

### Current Situation with 380k+ Database:
- **30 Days**: 50 leads with valid future expiration dates
- **60 Days**: 54 leads with valid future expiration dates
- **120 Days**: 55 leads with valid future expiration dates

### Data Quality Issues:
1. **Outdated Expiration Dates**: Most records (15,615 out of 15,670) have expiration dates from 1980-2024
2. **Missing Representative Data**: Contact_person field is empty for most records
3. **Limited Future Dates**: Only 55 Ohio records have expiration dates in 2025

### Sample 30-Day Expiring Leads (from 380k+ database):
```
Company: IMRANTRANSPORTATIONLLC
Phone: 2168019218
Email: NELLIALIR@GMAIL.COM
Insurance: PROGRESSIVE PREFERRED INSURANCE CO.
Expires: 2025-10-15

Company: 303 LOGISTICS LLC
Phone: 5137766670
Email: PANASHEMADZINGA@GMAIL.COM
Insurance: PROGRESSIVE PREFERRED INSURANCE CO.
Expires: 2025-10-15
```

## Comparison with CSV Data:
- **CSV Files**: 593 Ohio leads with representative names
- **Database**: 16,106 Ohio records but only 55 with future expiration dates
- **Recommendation**: Use CSV data for immediate campaigns, database for comprehensive contact info

## Analysis Summary:
The 380k+ database has extensive contact information but severely outdated insurance expiration dates. The CSV files provide better representative data and more realistic lead counts for insurance renewals.

For effective lead generation:
1. **Immediate Use**: CSV files (593 OH leads with rep names)
2. **Long-term**: Update database with current insurance expiration dates
3. **Hybrid Approach**: Merge database contact info with CSV representative data