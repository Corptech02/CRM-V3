/**
 * Restore Missing Leads - Recreate the leads that disappeared
 */

console.log('🔄 Restoring missing leads from user data...');

(function() {
    'use strict';

    // The leads that the user reported as missing
    const missingLeads = [
        {
            id: 'RAMSDELLS_GARAGE_' + Date.now(),
            name: "RAMSDELL'S GARAGE INC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Hunter',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'JERNIGAN_TRANSPORT_' + Date.now(),
            name: "JERNIGAN TRANSPORT LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'Info Requested',
            assignedTo: 'Grant',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'MID_OHIO_TRANSPORT_' + Date.now(),
            name: "MID-OHIO TRANSPORT LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'Quote Sent',
            assignedTo: 'Hunter',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'FOF_CARGO_' + Date.now(),
            name: "FOF CARGO LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'Info Requested',
            assignedTo: 'Hunter',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'DMA_LOGISTICS_' + Date.now(),
            name: "DMA LOGISTICS INC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Grant',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'DELUGUCCI_ENTERPRISES_' + Date.now(),
            name: "DELUGUCCI ENTERPRISES INC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Grant',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'KEPLINGER_TRUCKING_' + Date.now(),
            name: "KEPLINGER TRUCKING LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Grant',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'MSY_TRANSPORT_' + Date.now(),
            name: "MSY TRANSPORT LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Grant',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'BLUE_THUNDER_' + Date.now(),
            name: "BLUE THUNDER INC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'DNJ_KENDALL_TRANSPORT_' + Date.now(),
            name: "DNJ KENDALL TRANSPORT LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'Info Requested',
            assignedTo: 'Hunter',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'FAST_ARROW_TRANSPORT_' + Date.now(),
            name: "FAST ARROW TRANSPORT LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'Closed',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'D_AND_D_NYE_TRUCKING_' + Date.now(),
            name: "D & D NYE TRUCKING LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'PINPOINT_LOGISTICS_' + Date.now(),
            name: "PINPOINT LOGISTICS LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'KAYA_TRUCKING_' + Date.now(),
            name: "KAYA TRUCKING LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'MASTER_TRUCKS_' + Date.now(),
            name: "MASTER TRUCKS ENTERPRISES LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'EXPRESS_LANE_' + Date.now(),
            name: "EXPRESS LANE INC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'KCH_CONSTRUCTION_' + Date.now(),
            name: "KCH CONSTRUCTION LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'BMA_CAPITAL_' + Date.now(),
            name: "BMA CAPITAL LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'EMINENT_CARGO_' + Date.now(),
            name: "EMINENT CARGO INC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'STUBBLEFIELD_TRANSPORT_' + Date.now(),
            name: "STUBBLEFIELD TRANSPORT LLC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        },
        {
            id: 'JIB_TRANSPORT_' + Date.now(),
            name: "JIB TRANSPORT INC",
            product: 'Commercial Auto',
            premium: '$0',
            status: 'New',
            assignedTo: 'Unassigned',
            created: '11/19/2025',
            contact: '',
            phone: '',
            email: ''
        }
    ];

    async function restoreLeadsToServer() {
        console.log(`🔄 Restoring ${missingLeads.length} leads to server...`);

        try {
            // First, restore to localStorage
            const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const currentInsuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

            // Add missing leads to localStorage
            const updatedLeads = [...currentLeads];
            const updatedInsuranceLeads = [...currentInsuranceLeads];

            missingLeads.forEach(lead => {
                // Add to both arrays if not already present
                if (!updatedLeads.some(l => l.name === lead.name)) {
                    updatedLeads.push(lead);
                }
                if (!updatedInsuranceLeads.some(l => l.name === lead.name)) {
                    updatedInsuranceLeads.push(lead);
                }
            });

            localStorage.setItem('leads', JSON.stringify(updatedLeads));
            localStorage.setItem('insurance_leads', JSON.stringify(updatedInsuranceLeads));

            console.log(`✅ Added ${missingLeads.length} leads to localStorage`);

            // Now save each lead to the server
            let savedCount = 0;
            for (const lead of missingLeads) {
                try {
                    const response = await fetch('/api/leads', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(lead)
                    });

                    if (response.ok) {
                        savedCount++;
                        console.log(`✅ Saved lead: ${lead.name}`);
                    } else {
                        console.error(`❌ Failed to save lead: ${lead.name}`, await response.text());
                    }
                } catch (error) {
                    console.error(`❌ Error saving lead ${lead.name}:`, error);
                }

                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`✅ Restoration complete: ${savedCount}/${missingLeads.length} leads saved to server`);

            // Refresh the display
            if (typeof refreshLeadsList === 'function') {
                refreshLeadsList();
            }
            if (typeof loadInsuranceData === 'function') {
                loadInsuranceData();
            }

            // Notify user
            if (window.showNotification) {
                showNotification(`Restored ${savedCount} missing leads`, 'success');
            }

            return savedCount;

        } catch (error) {
            console.error('❌ Error restoring leads:', error);
            if (window.showNotification) {
                showNotification('Error restoring leads: ' + error.message, 'error');
            }
            return 0;
        }
    }

    // Run the restoration
    restoreLeadsToServer();

    // Expose function for manual use
    window.restoreMissingLeads = restoreLeadsToServer;

    console.log('🔄 Lead restoration script loaded. Use restoreMissingLeads() to run manually.');

})();