#!/usr/bin/env python3
"""
Fix existing call logs by updating durations from actual recording files
"""
import os
import json
import subprocess
import re
from datetime import datetime

def get_audio_duration(file_path):
    """Get the actual duration of an audio file using ffprobe"""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', file_path
        ], capture_output=True, text=True)

        if result.returncode == 0:
            duration_seconds = float(result.stdout.strip())
            minutes = int(duration_seconds // 60)
            seconds = int(duration_seconds % 60)

            if minutes > 0:
                return f"{minutes} min {seconds} sec"
            else:
                return f"{int(duration_seconds)} sec"
    except Exception as e:
        print(f"Error getting duration for {file_path}: {e}")

    return None

def fix_call_durations():
    """Fix call durations for leads with recordings"""
    recordings_dir = "/var/www/vanguard/recordings"

    if not os.path.exists(recordings_dir):
        print(f"Recordings directory not found: {recordings_dir}")
        return

    # Find all recording files
    recording_files = []
    for file in os.listdir(recordings_dir):
        if file.endswith('.mp3'):
            match = re.search(r'recording_(\d+)\.mp3', file)
            if match:
                lead_id = match.group(1)
                file_path = os.path.join(recordings_dir, file)
                recording_files.append((lead_id, file_path))

    print(f"Found {len(recording_files)} recording files to process")

    updates = []

    for lead_id, file_path in recording_files:
        actual_duration = get_audio_duration(file_path)
        if actual_duration:
            updates.append({
                'lead_id': lead_id,
                'file_path': file_path,
                'actual_duration': actual_duration
            })
            print(f"Lead {lead_id}: {actual_duration}")
        else:
            print(f"Could not get duration for lead {lead_id}")

    # Generate JavaScript to update frontend
    js_code = f"""
// Auto-generated script to fix call log durations
console.log('🔧 Fixing call log durations for {len(updates)} leads...');

const updates = {json.dumps(updates, indent=4)};

// Get existing leads from localStorage
let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

let updated_count = 0;

updates.forEach(update => {{
    const lead = leads.find(l => l.id === update.lead_id);
    if (lead && lead.reachOut && lead.reachOut.callLogs) {{
        lead.reachOut.callLogs.forEach(log => {{
            // Update any call logs with "20 sec" or similar short durations
            if (log.duration && (log.duration.includes('20 sec') || log.duration === '20 sec' || log.duration.includes('Recording available'))) {{
                log.duration = update.actual_duration;
                log.notes = `ViciDial Call - Duration: ${{update.actual_duration}}`;
                updated_count++;
                console.log(`✅ Updated lead ${{update.lead_id}}: ${{update.actual_duration}}`);
            }}
        }});
    }}
}});

// Save updated leads back to localStorage
localStorage.setItem('insurance_leads', JSON.stringify(leads));
console.log(`🎉 Fixed call durations for ${{updated_count}} call logs!`);

// Reload the page to see changes
if (updated_count > 0) {{
    console.log('🔄 Reloading page to show updated durations...');
    setTimeout(() => window.location.reload(), 2000);
}}
"""

    # Save the JavaScript fix
    with open('/var/www/vanguard/js/fix-call-durations.js', 'w') as f:
        f.write(js_code)

    print(f"\n✅ Generated fix script: /var/www/vanguard/js/fix-call-durations.js")
    print("📋 To apply the fix:")
    print("1. Open the browser console on the Vanguard app")
    print("2. Load the script: copy and paste the contents of fix-call-durations.js")
    print("3. The script will automatically update call log durations and reload the page")

if __name__ == "__main__":
    fix_call_durations()