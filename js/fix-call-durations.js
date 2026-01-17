
// Auto-generated script to fix call log durations
console.log('🔧 Fixing call log durations for 32 leads...');

const updates = [
    {
        "lead_id": "8124478",
        "file_path": "/var/www/vanguard/recordings/recording_8124478.mp3",
        "actual_duration": "4 min 34 sec"
    },
    {
        "lead_id": "8123092",
        "file_path": "/var/www/vanguard/recordings/recording_8123092.mp3",
        "actual_duration": "6 min 44 sec"
    },
    {
        "lead_id": "8126258",
        "file_path": "/var/www/vanguard/recordings/recording_8126258.mp3",
        "actual_duration": "1 min 39 sec"
    },
    {
        "lead_id": "8126257",
        "file_path": "/var/www/vanguard/recordings/recording_8126257.mp3",
        "actual_duration": "51 sec"
    },
    {
        "lead_id": "8124828",
        "file_path": "/var/www/vanguard/recordings/recording_8124828.mp3",
        "actual_duration": "1 min 2 sec"
    },
    {
        "lead_id": "8125697",
        "file_path": "/var/www/vanguard/recordings/recording_8125697.mp3",
        "actual_duration": "2 min 50 sec"
    },
    {
        "lead_id": "8123122",
        "file_path": "/var/www/vanguard/recordings/recording_8123122.mp3",
        "actual_duration": "6 min 48 sec"
    },
    {
        "lead_id": "8125000",
        "file_path": "/var/www/vanguard/recordings/recording_8125000.mp3",
        "actual_duration": "3 min 24 sec"
    },
    {
        "lead_id": "8124940",
        "file_path": "/var/www/vanguard/recordings/recording_8124940.mp3",
        "actual_duration": "1 min 41 sec"
    },
    {
        "lead_id": "8123145",
        "file_path": "/var/www/vanguard/recordings/recording_8123145.mp3",
        "actual_duration": "21 min 54 sec"
    },
    {
        "lead_id": "8126147",
        "file_path": "/var/www/vanguard/recordings/recording_8126147.mp3",
        "actual_duration": "5 min 29 sec"
    },
    {
        "lead_id": "8126125",
        "file_path": "/var/www/vanguard/recordings/recording_8126125.mp3",
        "actual_duration": "5 min 9 sec"
    },
    {
        "lead_id": "8124596",
        "file_path": "/var/www/vanguard/recordings/recording_8124596.mp3",
        "actual_duration": "3 min 54 sec"
    },
    {
        "lead_id": "8129999",
        "file_path": "/var/www/vanguard/recordings/recording_8129999.mp3",
        "actual_duration": "12 min 8 sec"
    },
    {
        "lead_id": "8126168",
        "file_path": "/var/www/vanguard/recordings/recording_8126168.mp3",
        "actual_duration": "5 min 41 sec"
    },
    {
        "lead_id": "8129955",
        "file_path": "/var/www/vanguard/recordings/recording_8129955.mp3",
        "actual_duration": "1 min 21 sec"
    },
    {
        "lead_id": "8122809",
        "file_path": "/var/www/vanguard/recordings/recording_8122809.mp3",
        "actual_duration": "19 min 6 sec"
    },
    {
        "lead_id": "8122860",
        "file_path": "/var/www/vanguard/recordings/recording_8122860.mp3",
        "actual_duration": "7 min 55 sec"
    },
    {
        "lead_id": "8130246",
        "file_path": "/var/www/vanguard/recordings/recording_8130246.mp3",
        "actual_duration": "22 min 2 sec"
    },
    {
        "lead_id": "8125277",
        "file_path": "/var/www/vanguard/recordings/recording_8125277.mp3",
        "actual_duration": "15 min 2 sec"
    },
    {
        "lead_id": "8122933",
        "file_path": "/var/www/vanguard/recordings/recording_8122933.mp3",
        "actual_duration": "10 min 58 sec"
    },
    {
        "lead_id": "8129932",
        "file_path": "/var/www/vanguard/recordings/recording_8129932.mp3",
        "actual_duration": "12 min 16 sec"
    },
    {
        "lead_id": "8125728",
        "file_path": "/var/www/vanguard/recordings/recording_8125728.mp3",
        "actual_duration": "1 min 32 sec"
    },
    {
        "lead_id": "8129998",
        "file_path": "/var/www/vanguard/recordings/recording_8129998.mp3",
        "actual_duration": "3 min 47 sec"
    },
    {
        "lead_id": "8122971",
        "file_path": "/var/www/vanguard/recordings/recording_8122971.mp3",
        "actual_duration": "1 min 52 sec"
    },
    {
        "lead_id": "8124582",
        "file_path": "/var/www/vanguard/recordings/recording_8124582.mp3",
        "actual_duration": "4 min 1 sec"
    },
    {
        "lead_id": "8126102",
        "file_path": "/var/www/vanguard/recordings/recording_8126102.mp3",
        "actual_duration": "5 min 20 sec"
    },
    {
        "lead_id": "8126277",
        "file_path": "/var/www/vanguard/recordings/recording_8126277.mp3",
        "actual_duration": "57 sec"
    },
    {
        "lead_id": "8105663",
        "file_path": "/var/www/vanguard/recordings/recording_8105663.mp3",
        "actual_duration": "43 min 37 sec"
    },
    {
        "lead_id": "8122666",
        "file_path": "/var/www/vanguard/recordings/recording_8122666.mp3",
        "actual_duration": "24 min 36 sec"
    },
    {
        "lead_id": "8123150",
        "file_path": "/var/www/vanguard/recordings/recording_8123150.mp3",
        "actual_duration": "8 min 5 sec"
    },
    {
        "lead_id": "8125456",
        "file_path": "/var/www/vanguard/recordings/recording_8125456.mp3",
        "actual_duration": "8 min 55 sec"
    }
];

// Get existing leads from localStorage
let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

let updated_count = 0;

updates.forEach(update => {
    const lead = leads.find(l => l.id === update.lead_id);
    if (lead && lead.reachOut && lead.reachOut.callLogs) {
        lead.reachOut.callLogs.forEach(log => {
            // Update any call logs with "20 sec" or similar short durations
            if (log.duration && (log.duration.includes('20 sec') || log.duration === '20 sec' || log.duration.includes('Recording available'))) {
                log.duration = update.actual_duration;
                log.notes = `ViciDial Call - Duration: ${update.actual_duration}`;
                updated_count++;
                console.log(`✅ Updated lead ${update.lead_id}: ${update.actual_duration}`);
            }
        });
    }
});

// Save updated leads back to localStorage
localStorage.setItem('insurance_leads', JSON.stringify(leads));
console.log(`🎉 Fixed call durations for ${updated_count} call logs!`);

// Reload the page to see changes
if (updated_count > 0) {
    console.log('🔄 Reloading page to show updated durations...');
    setTimeout(() => window.location.reload(), 2000);
}
