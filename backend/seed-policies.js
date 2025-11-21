const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'vanguard.db'));

// REAL CLIENT DATA - exact clients from your policies
const clients = [
    { id: 'CLI-001', name: 'FREDDYKAY LOGISTICS LLC', email: 'info@freddykay.com' },
    { id: 'CLI-002', name: 'APPROVED FREIGHT LLC', email: 'info@approvedfreight.com' },
    { id: 'CLI-003', name: 'E And V Services Inc', email: 'info@eandhvservices.com' },
    { id: 'CLI-004', name: 'AL\'S TOWING LLC', email: 'info@alstowing.com' },
    { id: 'CLI-005', name: 'SJW FARMS LLC', email: 'info@sjwfarms.com' },
    { id: 'CLI-006', name: 'THR TRANSPORT LLC', email: 'info@thrtransport.com' },
    { id: 'CLI-007', name: 'RIVERA TRUCKING LLC', email: 'info@riveratrucking.com' },
    { id: 'CLI-008', name: 'SLAMMIN TRANSPORT LLC', email: 'info@slammin.com' },
    { id: 'CLI-009', name: 'DU ROAD TRUCKING LLC', email: 'JA2OHIO@GMAIL.COM' },
    { id: 'CLI-010', name: 'A-VINO LTD', email: 'RANDYANZEVINO@YAHOO.COM' },
    { id: 'CLI-011', name: 'ARB Transport LLC', email: 'info@arbtransport.com' },
    { id: 'CLI-012', name: 'ADAM 1 LOGISTICS LLC', email: 'info@adam1logistics.com' },
    { id: 'CLI-013', name: 'Chris Stevens', email: 'chris@stevens.com' }
];

// EXACT REAL POLICY DATA from your list
const policies = [
    {
        id: '9300183971',
        client_id: 'CLI-001',
        data: JSON.stringify({
            policyNumber: '9300183971',
            clientName: 'FREDDYKAY LOGISTICS LLC',
            type: 'Commercial Auto',
            carrier: 'GEICO',
            effectiveDate: '2025-07-24',
            expirationDate: '2026-07-24',
            premium: 19714,
            annualPremium: 19714,
            status: 'Active'
        })
    },
    {
        id: '950956091',
        client_id: 'CLI-002',
        data: JSON.stringify({
            policyNumber: '950956091',
            clientName: 'APPROVED FREIGHT LLC',
            type: 'Commercial Auto',
            carrier: 'Progressive',
            effectiveDate: '2025-07-20',
            expirationDate: '2026-07-20',
            premium: 12860,
            annualPremium: 12860,
            status: 'Active'
        })
    },
    {
        id: '988543504',
        client_id: 'CLI-003',
        data: JSON.stringify({
            policyNumber: '988543504',
            clientName: 'E And V Services Inc',
            type: 'Commercial Auto',
            carrier: 'Progressive',
            effectiveDate: '2024-11-01',
            expirationDate: '2025-11-01',
            premium: 20012,
            annualPremium: 20012,
            status: 'UPDATE POLICY'
        })
    },
    {
        id: '988530110',
        client_id: 'CLI-004',
        data: JSON.stringify({
            policyNumber: '988530110',
            clientName: 'AL\'S TOWING LLC',
            type: 'Commercial Auto',
            carrier: 'Progressive',
            effectiveDate: '2024-10-31',
            expirationDate: '2025-10-31',
            premium: 11803,
            annualPremium: 11803,
            status: 'UPDATE POLICY'
        })
    },
    {
        id: '989001395',
        client_id: 'CLI-005',
        data: JSON.stringify({
            policyNumber: '989001395',
            clientName: 'SJW FARMS LLC',
            type: 'Commercial Auto',
            carrier: 'Progressive',
            effectiveDate: '2024-11-03',
            expirationDate: '2025-11-03',
            premium: 6190,
            annualPremium: 6190,
            status: 'UPDATE POLICY'
        })
    },
    {
        id: '987258065',
        client_id: 'CLI-006',
        data: JSON.stringify({
            policyNumber: '987258065',
            clientName: 'THR TRANSPORT LLC',
            type: 'Commercial Auto',
            carrier: 'GEICO',
            effectiveDate: '2025-09-26',
            expirationDate: '2026-09-26',
            premium: 10705,
            annualPremium: 10705,
            status: 'Active'
        })
    },
    {
        id: '988968190',
        client_id: 'CLI-006',
        data: JSON.stringify({
            policyNumber: '988968190',
            clientName: 'THR TRANSPORT LLC',
            type: 'Commercial Auto',
            carrier: 'Progressive',
            effectiveDate: '2024-11-08',
            expirationDate: '2025-11-08',
            premium: 18392,
            annualPremium: 18392,
            status: 'UPDATE POLICY'
        })
    },
    {
        id: '9300090556',
        client_id: 'CLI-007',
        data: JSON.stringify({
            policyNumber: '9300090556',
            clientName: 'RIVERA TRUCKING LLC',
            type: 'Commercial Auto',
            carrier: 'GEICO',
            effectiveDate: '2024-11-30',
            expirationDate: '2025-11-30',
            premium: 6805,
            annualPremium: 6805,
            status: 'Active'
        })
    },
    {
        id: '9300089736',
        client_id: 'CLI-008',
        data: JSON.stringify({
            policyNumber: '9300089736',
            clientName: 'SLAMMIN TRANSPORT LLC',
            type: 'Commercial Auto',
            carrier: 'GEICO',
            effectiveDate: '2024-11-30',
            expirationDate: '2025-11-30',
            premium: 7391,
            annualPremium: 7391,
            status: 'Active'
        })
    },
    {
        id: '9300117261',
        client_id: 'CLI-009',
        data: JSON.stringify({
            policyNumber: '9300117261',
            clientName: 'DU ROAD TRUCKING LLC',
            type: 'Commercial Auto',
            carrier: 'GEICO',
            effectiveDate: '2025-02-26',
            expirationDate: '2026-02-26',
            premium: 7397,
            annualPremium: 7397,
            status: 'Active'
        })
    },
    {
        id: '9300107451',
        client_id: 'CLI-010',
        data: JSON.stringify({
            policyNumber: '9300107451',
            clientName: 'A-VINO LTD',
            type: 'Commercial Auto',
            carrier: 'GEICO',
            effectiveDate: '2025-02-19',
            expirationDate: '2026-02-19',
            premium: 7430,
            annualPremium: 7430,
            status: 'Active'
        })
    },
    {
        id: '864709702',
        client_id: 'CLI-011',
        data: JSON.stringify({
            policyNumber: '864709702',
            clientName: 'ARB Transport LLC',
            type: 'Commercial Auto',
            carrier: 'Progressive',
            effectiveDate: '2025-10-25',
            expirationDate: '2026-10-25',
            premium: 14628,
            annualPremium: 14628,
            status: 'Active'
        })
    },
    {
        id: '9300092320',
        client_id: 'CLI-012',
        data: JSON.stringify({
            policyNumber: '9300092320',
            clientName: 'ADAM 1 LOGISTICS LLC',
            type: 'Commercial Auto',
            carrier: 'GEICO',
            effectiveDate: '2024-12-05',
            expirationDate: '2025-12-05',
            premium: 18319,
            annualPremium: 18319,
            status: 'Active'
        })
    },
    {
        id: '864564216',
        client_id: 'CLI-013',
        data: JSON.stringify({
            policyNumber: '864564216',
            clientName: 'Chris Stevens',
            type: 'Commercial Auto',
            carrier: 'Progressive',
            effectiveDate: '2025-10-22',
            expirationDate: '2026-10-22',
            premium: 0,
            annualPremium: 0,
            status: 'Active'
        })
    }
];

// Insert clients
db.serialize(() => {
    // Check if data already exists - only seed once
    db.get('SELECT COUNT(*) as count FROM policies', (err, row) => {
        if (row && row.count > 0) {
            console.log('Database already has policies, skipping seeding');
            db.close();
            return;
        }

        seedData();
    });
});

function seedData() {
    // Clear existing data only if we're seeding
    db.run('DELETE FROM policies');
    db.run('DELETE FROM clients');

    // Insert clients
    const clientStmt = db.prepare('INSERT OR REPLACE INTO clients (id, data) VALUES (?, ?)');
    clients.forEach(client => {
        const clientData = JSON.stringify({
            name: client.name,
            email: client.email
        });
        clientStmt.run(client.id, clientData);
    });
    clientStmt.finalize();

    // Insert policies
    const policyStmt = db.prepare('INSERT OR REPLACE INTO policies (id, client_id, data) VALUES (?, ?, ?)');
    policies.forEach(policy => {
        policyStmt.run(policy.id, policy.client_id, policy.data);
    });
    policyStmt.finalize();

    console.log('Database seeded with real policy data!');

    // Verify the data
    db.all('SELECT COUNT(*) as count FROM clients', (err, rows) => {
        console.log('Total clients:', rows[0].count);
    });

    db.all('SELECT COUNT(*) as count FROM policies', (err, rows) => {
        console.log('Total policies:', rows[0].count);
        db.close();
    });
}