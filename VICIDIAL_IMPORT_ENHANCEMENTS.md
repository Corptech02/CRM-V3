# ViciDial Import Enhancements

## Overview
Enhanced the ViciDial import system to extract additional lead information and calculate premiums based on fleet size.

## New Features Added

### 1. Fleet Size Extraction & Premium Calculation
- **Source**: Comments field in ViciDial leads
- **Premium Rate**: $14,400 per unit
- **Extraction Patterns**:
  - `Insurance Expires: xxxx-xx-xx | Fleet Size: X`
  - `Fleet Size: X` / `Fleet Size: X trucks`
  - `X vehicles` / `Fleet of X`
  - `Units: X` / `X units`
  - `X trucks` / `X power units`
  - `Truck count: X` / `Total vehicles: X`

### 2. Insurance Company Extraction
- **Source**: Address1 or Address2 fields in ViciDial leads
- **Extraction Patterns**:
  - Major carriers: State Farm, Progressive, Nationwide, Geico, Allstate, Liberty, USAA, Farmers, Travelers
  - Generic patterns: `[Company] Insurance`, `[Company] Mutual`, `[Company] General`

### 3. New CRM Fields Populated
- **Fleet Size**: Extracted number from comments
- **Premium**: Calculated as Fleet Size × $14,400
- **Insurance Company**: New field populated from address fields
- **Current Carrier**: Same as Insurance Company for consistency
- **Current Premium**: Extracted premium info from comments if available

## Examples

### Fleet Size Examples:
- "Fleet Size: 5" → 5 units, $72,000 premium
- "3 trucks" → 3 units, $43,200 premium
- "Fleet of 7 vehicles" → 7 units, $100,800 premium
- "Units: 4" → 4 units, $57,600 premium

### Insurance Company Examples:
- "Progressive Commercial" → "Progressive"
- "State Farm Insurance" → "State Farm"
- "ABC Insurance Company" → "Abc Insurance"

## Technical Implementation
- **File Modified**: `/var/www/vanguard/vanguard_vicidial_sync.py`
- **Functions Enhanced**:
  - `extract_policy_from_comments()` - Fleet size extraction
  - `create_lead_record()` - Insurance company extraction and field population
- **Premium Calculation**: Changed from $15,600 to $14,400 per unit as requested

## Testing
Successfully tested with multiple comment patterns and address formats. All extraction patterns working correctly with proper premium calculations.