# Leads Database Analyzer Usage Guide

This script replicates the EXACT scanning process used to analyze the 380k+ leads database and pull Ohio monthly expiration data.

## Database Details
- **Location**: `/home/corp06/vanguard-vps-package/vanguard_system.db`
- **Table**: `fmcsa_enhanced`
- **Total Records**: 379,132
- **Ohio Records**: 16,106 (all with expiration dates)

## Usage Examples

### 1. Get Database Information
```bash
python3 /home/corp06/leads_analyzer.py --info
```

### 2. Get Monthly Breakdown (Ohio)
```bash
python3 /home/corp06/leads_analyzer.py --monthly
```
Results match the original analysis:
- September: 1,752 leads (highest)
- December: 958 leads (lowest)

### 3. Filter by Expiration Days
```bash
# Get all leads expiring within 30 days
python3 /home/corp06/leads_analyzer.py --days 30

# Get leads expiring within 60 days and export to CSV
python3 /home/corp06/leads_analyzer.py --days 60 --export
```

### 4. Filter by Insurance Company
```bash
# Get all Progressive leads
python3 /home/corp06/leads_analyzer.py --company "PROGRESSIVE"

# Get all Geico leads
python3 /home/corp06/leads_analyzer.py --company "GEICO"
```

### 5. Combine Filters (PULL ALL ASSOCIATED DATA)
```bash
# Progressive leads expiring within 30 days
python3 /home/corp06/leads_analyzer.py --company "PROGRESSIVE" --days 30

# Canal Insurance leads expiring within 60 days, export results
python3 /home/corp06/leads_analyzer.py --company "CANAL" --days 60 --export
```

### 6. Different States
```bash
# Get Texas leads expiring within 45 days
python3 /home/corp06/leads_analyzer.py --days 45 --state TX

# Get California Progressive leads
python3 /home/corp06/leads_analyzer.py --company "PROGRESSIVE" --state CA
```

### 7. List All Insurance Companies
```bash
python3 /home/corp06/leads_analyzer.py --companies
```

## Data Fields Retrieved (ALL ASSOCIATED DATA)

When you filter by expiration days and/or company, the script pulls ALL of these fields:

**Contact Information:**
- legal_name, dba_name
- street, city, state, zip_code
- phone, email_address, fax, cell_phone
- contact_person, contact_title

**Business Details:**
- mc_number, dot_number
- power_units, drivers
- business_type, cargo_carried
- operating_status, entity_type
- website

**Insurance Information:**
- insurance_carrier, insurance_company_name
- bipd_insurance_on_file_amount
- insurance_expiration_date
- policy_renewal_date
- days_until_expiry
- insurance_record_raw

**Safety & Compliance:**
- safety_rating, safety_review_date
- out_of_service_date

**Financial:**
- annual_revenue, credit_score, payment_history

**System Data:**
- last_updated, updated_by, data_source, verified
- internal_notes, interaction_history
- custom_data

## Export Files

Exported CSV files are timestamped and saved in the current directory:
- Format: `leads_[STATE]_YYYYMMDD_HHMMSS.csv`
- Example: `leads_OH_20251028_045843.csv`

## Key Features

1. **Exact Replication**: Uses the same database, table, and queries as the original analysis
2. **Complete Data Extraction**: Pulls ALL 40+ fields for each matching record
3. **Flexible Filtering**: Combine any combination of state, days, and company filters
4. **Export Ready**: All results can be exported to CSV for further processing
5. **Performance Optimized**: Uses indexed fields for fast queries

## Original Analysis Verification

The script reproduces the exact Ohio monthly breakdown:
- January: 1,131 | February: 1,067 | March: 1,351 | April: 1,352
- May: 1,315 | June: 1,474 | July: 1,553 | August: 1,574
- September: 1,752 | October: 1,528 | November: 1,051 | December: 958
- **Total**: 16,106 Ohio leads with expiration dates