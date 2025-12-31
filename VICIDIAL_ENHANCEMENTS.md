# ViciDial Integration Enhancements

## Overview
Enhanced the ViciDial lead import system to extract insurance company information and attach audio recordings during lead sync.

## New Features Added

### 1. Current Insurance Company Extraction
**Location**: `vanguard_vicidial_sync.py` - `extract_insurance_company()` function

**Functionality**:
- Scans ViciDial address1, address2, and address3 fields for insurance company information
- Detects common insurance indicators: insurance, mutual, progressive, geico, state farm, etc.
- Automatically cleans prefixes like "Current Insurance:", "Insurance:", etc.
- Validates to avoid extracting generic phrases like "unknown", "n/a"

**Field Added to Lead Data**:
```python
"currentInsuranceCompany": "Progressive Insurance"  # Extracted from address fields
```

### 2. Audio Recording Attachment
**Location**: `vanguard_vicidial_sync.py` - `get_recording_url_for_lead()` & `download_recording_file()` functions

**Functionality**:
- Automatically detects recording URLs in ViciDial lead pages
- Downloads audio files (WAV, MP3, GSM formats) to `/var/www/vanguard/recordings/`
- Creates web-accessible paths for audio playback
- Handles file validation (minimum size checks)

**Fields Added to Lead Data**:
```python
"audioUrl": "/recordings/lead_123456_recording.mp3",     # Web path for playbook
"audioFileName": "lead_123456_recording.mp3",           # Original filename
"recordingUrl": "http://204.13.233.29/recordings/..."   # Original ViciDial URL
```

### 3. Enhanced Lead Profile UI
**Location**: `js/final-profile-fix-protected.js`

**Functionality**:
- Added "Current Insurance Company" input field in Company Information section
- Added audio player with file upload capability in Call Transcript section
- Includes controls for playing, pausing, and removing audio files

## Technical Implementation

### Insurance Company Detection Algorithm
```python
# Checks address1, address2, address3 fields for insurance indicators
insurance_indicators = [
    'insurance', 'ins.', 'assurance', 'mutual', 'underwriters',
    'progressive', 'geico', 'state farm', 'allstate', 'farmers',
    # ... plus major insurance companies
]
```

### Audio Recording Download Process
1. Parse ViciDial lead modification page HTML
2. Extract recording URLs using regex pattern matching
3. Download audio files to local storage
4. Create web-accessible paths for frontend playback
5. Store metadata in lead record

### File Structure
```
/var/www/vanguard/
├── recordings/                    # Downloaded audio files
│   ├── lead_123456_recording.mp3
│   └── lead_789012_recording.wav
├── vanguard_vicidial_sync.py      # Enhanced sync script
├── js/final-profile-fix-protected.js  # Enhanced UI
└── test-vicidial-enhancements.py # Test suite
```

## Usage

### Manual Sync
```bash
cd /var/www/vanguard
python3 vanguard_vicidial_sync.py
```

### Automated Sync
The sync runs automatically via PM2 service `vicidial-proxy`.

### Testing
```bash
cd /var/www/vanguard
python3 test-vicidial-enhancements.py
```

## Data Flow

1. **ViciDial Lead Import**:
   - Extracts basic lead data (name, phone, company, etc.)
   - **NEW**: Scans address1/2/3 for insurance company
   - **NEW**: Looks for recording URLs in lead page

2. **Audio Processing**:
   - Downloads recording files to local storage
   - Creates web-accessible paths
   - Adds audio metadata to lead record

3. **Lead Storage**:
   - Saves enhanced lead data to Vanguard database
   - Includes insurance company and audio information

4. **UI Display**:
   - Shows insurance company in editable field
   - Provides audio player for call recordings

## Benefits

- **Complete Lead Information**: Insurance company context helps agents understand current coverage
- **Audio Context**: Agents can listen to original sales calls for better follow-up
- **Seamless Integration**: Works with existing ViciDial workflow
- **Automated Process**: No manual intervention required for data extraction

## File Permissions
- Audio files: `644` (readable by web server)
- Recordings directory: `755` (web accessible)

## Supported Audio Formats
- WAV (primary)
- MP3 (compressed)
- GSM (VoIP format)

## Error Handling
- Graceful fallback when recordings unavailable
- Validation to prevent downloading corrupted files
- Logging for troubleshooting
- Retry logic for network issues

---
*Updated: December 13, 2025*
*Author: Claude Code Assistant*