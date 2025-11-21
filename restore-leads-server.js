const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';

// The missing leads that need to be restored
const missingLeads = [
    {
        id: 'RAMSDELLS_GARAGE_' + Date.now(),
        name: "RAMSDELL'S GARAGE INC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Hunter',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'JERNIGAN_TRANSPORT_' + Date.now(),
        name: "JERNIGAN TRANSPORT LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'Info Requested',
        stage: 'qualified',
        assignedTo: 'Grant',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'MID_OHIO_TRANSPORT_' + Date.now(),
        name: "MID-OHIO TRANSPORT LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'Quote Sent',
        stage: 'quoted',
        assignedTo: 'Hunter',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'FOF_CARGO_' + Date.now(),
        name: "FOF CARGO LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'Info Requested',
        stage: 'qualified',
        assignedTo: 'Hunter',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'DMA_LOGISTICS_' + Date.now(),
        name: "DMA LOGISTICS INC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Grant',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'DELUGUCCI_ENTERPRISES_' + Date.now(),
        name: "DELUGUCCI ENTERPRISES INC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Grant',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'KEPLINGER_TRUCKING_' + Date.now(),
        name: "KEPLINGER TRUCKING LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Grant',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'MSY_TRANSPORT_' + Date.now(),
        name: "MSY TRANSPORT LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Grant',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'BLUE_THUNDER_' + Date.now(),
        name: "BLUE THUNDER INC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'DNJ_KENDALL_TRANSPORT_' + Date.now(),
        name: "DNJ KENDALL TRANSPORT LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'Info Requested',
        stage: 'qualified',
        assignedTo: 'Hunter',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'FAST_ARROW_TRANSPORT_' + Date.now(),
        name: "FAST ARROW TRANSPORT LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'Closed',
        stage: 'closed',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'D_AND_D_NYE_TRUCKING_' + Date.now(),
        name: "D & D NYE TRUCKING LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'PINPOINT_LOGISTICS_' + Date.now(),
        name: "PINPOINT LOGISTICS LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'KAYA_TRUCKING_' + Date.now(),
        name: "KAYA TRUCKING LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'MASTER_TRUCKS_' + Date.now(),
        name: "MASTER TRUCKS ENTERPRISES LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'EXPRESS_LANE_' + Date.now(),
        name: "EXPRESS LANE INC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'KCH_CONSTRUCTION_' + Date.now(),
        name: "KCH CONSTRUCTION LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'BMA_CAPITAL_' + Date.now(),
        name: "BMA CAPITAL LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'EMINENT_CARGO_' + Date.now(),
        name: "EMINENT CARGO INC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'STUBBLEFIELD_TRANSPORT_' + Date.now(),
        name: "STUBBLEFIELD TRANSPORT LLC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    },
    {
        id: 'JIB_TRANSPORT_' + Date.now(),
        name: "JIB TRANSPORT INC",
        product: 'Commercial Auto',
        premium: '$0',
        status: 'New',
        stage: 'new',
        assignedTo: 'Unassigned',
        created: '11/19/2025',
        contact: '',
        phone: '',
        email: '',
        notes: 'Restored lead - original data lost due to sync issue'
    }
];

async function restoreLeads() {
    console.log(`🔄 Restoring ${missingLeads.length} missing leads to server...`);

    let savedCount = 0;
    let errors = [];

    for (const lead of missingLeads) {
        try {
            const response = await fetch(`${API_URL}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lead)
            });

            if (response.ok) {
                savedCount++;
                console.log(`✅ Restored: ${lead.name}`);
            } else {
                const errorText = await response.text();
                console.error(`❌ Failed to restore: ${lead.name} - ${errorText}`);
                errors.push(`${lead.name}: ${errorText}`);
            }
        } catch (error) {
            console.error(`❌ Error restoring ${lead.name}:`, error.message);
            errors.push(`${lead.name}: ${error.message}`);
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 RESTORATION SUMMARY:`);
    console.log(`✅ Successfully restored: ${savedCount}/${missingLeads.length} leads`);
    console.log(`❌ Failed: ${errors.length} leads`);

    if (errors.length > 0) {
        console.log('\n❌ ERRORS:');
        errors.forEach(error => console.log(`  - ${error}`));
    }

    // Verify the count
    try {
        const response = await fetch(`${API_URL}/leads`);
        if (response.ok) {
            const leads = await response.json();
            console.log(`\n📈 Total leads in database: ${leads.length}`);
        }
    } catch (error) {
        console.log('Could not verify final count:', error.message);
    }

    return savedCount;
}

// Run the restoration
restoreLeads().catch(console.error);