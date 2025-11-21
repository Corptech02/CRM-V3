#!/usr/bin/env python3
import csv

print("=" * 80)
print("OHIO PROGRESSIVE INSURANCE LEADS ANALYSIS")
print("From Recently Scanned MCMIS Documents (Sept 2025)")
print("=" * 80)

# Count Progressive entries in each file
progressive_mc_numbers = set()
progressive_companies = {}

print("\n📁 ANALYZING PROGRESSIVE IN MCMIS FILES...")
print("-" * 60)

# 1. Count in actpendins.txt
actpendins_count = 0
with open('actpendins.txt', 'r') as f:
    for line in f:
        if 'PROGRESSIVE' in line.upper():
            actpendins_count += 1
            parts = line.split(',')
            if len(parts) >= 5:
                mc = parts[0].strip('"')
                company = parts[4].strip('"')
                progressive_mc_numbers.add(mc)
                if 'PROGRESSIVE' in company.upper():
                    progressive_companies[company] = progressive_companies.get(company, 0) + 1

print(f"✅ actpendins.txt: {actpendins_count} Progressive policies")

# 2. Count in insur.txt
insur_count = 0
with open('insur.txt', 'r') as f:
    for line in f:
        if 'PROGRESSIVE' in line.upper():
            insur_count += 1
            parts = line.split(',')
            if len(parts) >= 9:
                mc = parts[0].strip('"')
                company = parts[8].strip('"')
                progressive_mc_numbers.add(mc)
                if 'PROGRESSIVE' in company.upper():
                    progressive_companies[company] = progressive_companies.get(company, 0) + 1

print(f"✅ insur.txt: {insur_count} Progressive policies")

# 3. Count in inshist.txt (historical)
inshist_count = 0
with open('inshist.txt', 'r') as f:
    for line in f:
        if 'PROGRESSIVE' in line.upper():
            inshist_count += 1
            parts = line.split(',')
            if len(parts) >= 17:
                mc = parts[0].strip('"')
                company = parts[16].strip('"') if len(parts) > 16 else ''
                progressive_mc_numbers.add(mc)
                if company and 'PROGRESSIVE' in company.upper():
                    progressive_companies[company] = progressive_companies.get(company, 0) + 1

print(f"✅ inshist.txt: {inshist_count} Progressive policies (historical)")

# Show Progressive companies
print("\n🏢 PROGRESSIVE INSURANCE COMPANIES FOUND:")
print("-" * 60)
sorted_companies = sorted(progressive_companies.items(), key=lambda x: x[1], reverse=True)[:10]
for company, count in sorted_companies:
    print(f"  • {company}: {count} policies")

# Total summary
total_progressive = actpendins_count + insur_count + inshist_count
print("\n" + "=" * 80)
print("📊 PROGRESSIVE INSURANCE SUMMARY:")
print("-" * 60)
print(f"Total Progressive policies found: {total_progressive:,}")
print(f"  - Active/Pending: {actpendins_count}")
print(f"  - Current: {insur_count}")
print(f"  - Historical: {inshist_count:,}")
print(f"\nUnique MC numbers with Progressive: {len(progressive_mc_numbers):,}")

# Estimate Ohio Progressive
# Assuming ~2.3% of carriers are in Ohio (51,296 out of 2.2M)
ohio_percentage = 51296 / 2202016  # 2.3%
estimated_ohio_progressive = int(len(progressive_mc_numbers) * ohio_percentage)

print(f"\n🎯 ESTIMATED OHIO PROGRESSIVE LEADS:")
print(f"  Based on Ohio having 2.3% of all carriers:")
print(f"  → Approximately {estimated_ohio_progressive} Ohio carriers with Progressive")

# Show market share
total_records_in_files = 3840 + 5640  # actpendins + insur (active files)
progressive_in_active = actpendins_count + insur_count
market_share = (progressive_in_active / total_records_in_files) * 100

print(f"\n📈 PROGRESSIVE MARKET SHARE:")
print(f"  {progressive_in_active} out of {total_records_in_files} active policies")
print(f"  = {market_share:.1f}% market share in MCMIS data")

# Apply market share to Ohio's 23,479 carriers expiring in 2025
ohio_2025_progressive = int(23479 * (market_share / 100))
print(f"\n✅ ESTIMATED OHIO PROGRESSIVE EXPIRING IN 2025:")
print(f"  {ohio_2025_progressive:,} carriers")
print(f"  (23,479 Ohio carriers × {market_share:.1f}% Progressive share)")

print("=" * 80)