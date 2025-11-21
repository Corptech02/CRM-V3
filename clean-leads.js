const fs = require('fs');

// Read leads from data file
let leads = [];
try {
    leads = JSON.parse(fs.readFileSync('/var/www/vanguard/data/leads.json', 'utf8'));
} catch (e) {
    console.log('No leads.json file found');
}

console.log('Total leads in file:', leads.length);

// Identify mock/test leads
const mockPatterns = [
    'Test',
    'Robert Thompson',
    'Jennifer Martin',
    'Michael Chen',
    'Davis Construct',
    'ABC Corp',
    'Tech Startup',
    'ABC Trucking'
];

const mockLeads = leads.filter(l => {
    // Check if name contains any mock patterns
    if (l.name) {
        for (const pattern of mockPatterns) {
            if (l.name.includes(pattern)) return true;
        }
    }

    // Check for invalid stage
    if (l.stage === 'qualified') return true;

    // Check for missing phone
    if (!l.phone || l.phone === 'N/A') return true;

    return false;
});

console.log('\nMock/Test leads found:', mockLeads.length);
mockLeads.forEach(l => {
    console.log(`  - ${l.name} (stage: ${l.stage}, phone: ${l.phone})`);
});

// Clean leads - remove mock data and fix qualified status
const cleanLeads = leads.filter(l => {
    // Skip mock data
    if (l.name) {
        for (const pattern of mockPatterns) {
            if (l.name.includes(pattern)) {
                console.log(`Removing mock lead: ${l.name}`);
                return false;
            }
        }
    }

    // Skip leads without phone
    if (!l.phone || l.phone === 'N/A') {
        console.log(`Removing lead without phone: ${l.name}`);
        return false;
    }

    return true;
}).map(l => {
    // Fix qualified status to quoted
    if (l.stage === 'qualified') {
        l.stage = 'quoted';
    }
    return l;
});

console.log('\nClean leads remaining:', cleanLeads.length);

// Save cleaned leads
fs.writeFileSync('/var/www/vanguard/data/leads.json', JSON.stringify(cleanLeads, null, 2));
console.log('Saved cleaned leads to file');