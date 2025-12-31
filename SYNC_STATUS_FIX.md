# Vicidial Sync Status Fix

## Issue
The "SYNC VICIDIAL" button was getting stuck in an infinite polling loop showing "idle" status, even though the sync was actually running successfully.

## Root Cause
The `/api/vicidial/sync-with-premium` endpoint (our enhanced sync) was not updating the global `syncStatus` variable that the frontend polls for progress updates.

## Solution
Updated the `/api/vicidial/sync-with-premium` endpoint to properly track sync status:

### 1. Start Status
```javascript
syncStatus = {
    status: 'running',
    percentage: 10,
    message: 'Starting enhanced sync with insurance and audio extraction...',
    // ...other fields
};
```

### 2. Progress Updates
Added real-time status updates based on Python script output:
- Insurance extraction: 40% - "Extracting insurance company information..."
- Audio downloads: 60% - "Downloading audio recordings..."
- Lead processing: 80% - "Processing and saving leads with enhanced data..."

### 3. Completion Status
```javascript
syncStatus = {
    status: 'completed',
    percentage: 100,
    message: `Enhanced sync completed: ${result.imported} leads imported with insurance and audio data`,
    transcriptionsProcessed: true,
    // ...other fields
};
```

## Result
- ✅ Frontend no longer gets stuck in "idle" status loop
- ✅ Real-time progress updates during sync
- ✅ Clear completion messages
- ✅ Enhanced sync with insurance + audio still works perfectly

## Files Modified
- `/var/www/vanguard/backend/server.js` - Added sync status tracking to the enhanced endpoint

## Testing
```bash
# Check status before sync
curl http://localhost:3001/api/vicidial/sync-status

# Start sync
curl -X POST http://localhost:3001/api/vicidial/sync-with-premium

# Check status during sync
curl http://localhost:3001/api/vicidial/sync-status
# Shows: {"status":"running","percentage":40,"message":"Extracting insurance company information..."}

# Check status after completion
curl http://localhost:3001/api/vicidial/sync-status
# Shows: {"status":"completed","percentage":100,"message":"Enhanced sync completed: 39 leads imported with insurance and audio data"}
```

---
*Fixed: December 13, 2025*