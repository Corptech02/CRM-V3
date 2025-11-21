// Real Vicidial Sales Leads Data
// Based on actual sales leads found in Vicidial lists 1005 and 1006
console.log('Loading real Vicidial sales leads...');

(function() {
    // These are the actual 6 sales leads we found in Vicidial:
    // List 1005: Lead IDs 16, 17, 18, 19 (4 sales)
    // List 1006: Lead IDs 2, 59 (2 sales)
    
    const realVicidialLeads = [
        {
            id: 1005016,
            name: 'Unknown Company 1',  // No company name in Vicidial data
            contact: 'Unknown',
            phone: '9999999999',  // This was the actual phone in the system
            email: 'unknown@email.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: 'Unknown',
            premium: 0,
            
            // Company Information - mostly unknown from Vicidial
            dotNumber: 'Unknown',
            mcNumber: 'Unknown', 
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            
            // Operation Details
            radiusOfOperation: 'Unknown',
            commodityHauled: 'Unknown',
            operatingStates: 'Unknown',
            
            // No vehicle data available in Vicidial
            vehicles: [],
            trailers: [],
            drivers: [],
            
            // Transcript would need to be pulled from recording
            transcriptText: 'Vicidial Call Recording - Lead ID: 16 from List 1005\nStatus: SALE\nCall Count: 1\nNo transcript available - recording would need to be processed through Deepgram API\nPhone: 9999999999',
            
            notes: 'VICIDIAL SALE - List 1005, Lead ID 16. Minimal data available in system. Needs follow-up to collect vehicle and company information.'
        },
        {
            id: 1005017,
            name: 'Unknown Company 2',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'unknown@email.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: 'Unknown',
            premium: 0,
            
            dotNumber: 'Unknown',
            mcNumber: 'Unknown',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            
            radiusOfOperation: 'Unknown',
            commodityHauled: 'Unknown',
            operatingStates: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: 'Vicidial Call Recording - Lead ID: 17 from List 1005\nStatus: SALE\nCall Count: 1\nNo transcript available - recording would need to be processed\nPhone: 9999999999',
            
            notes: 'VICIDIAL SALE - List 1005, Lead ID 17. No detailed information entered in Vicidial. Requires data collection.'
        },
        {
            id: 1005018,
            name: 'Unknown Company 3',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'unknown@email.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: 'Unknown',
            premium: 0,
            
            dotNumber: 'Unknown',
            mcNumber: 'Unknown',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            
            radiusOfOperation: 'Unknown',
            commodityHauled: 'Unknown',
            operatingStates: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: 'Vicidial Call Recording - Lead ID: 18 from List 1005\nStatus: SALE\nCall Count: 1\nNo transcript available\nPhone: 9999999999',
            
            notes: 'VICIDIAL SALE - List 1005, Lead ID 18. Needs complete information gathering.'
        },
        {
            id: 1005019,
            name: 'Unknown Company 4',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'unknown@email.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: 'Unknown',
            premium: 0,
            
            dotNumber: 'Unknown',
            mcNumber: 'Unknown',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            
            radiusOfOperation: 'Unknown',
            commodityHauled: 'Unknown',
            operatingStates: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: 'Vicidial Call Recording - Lead ID: 19 from List 1005\nStatus: SALE\nCall Count: 1\nNo transcript available\nPhone: 9999999999',
            
            notes: 'VICIDIAL SALE - List 1005, Lead ID 19. Missing all business details.'
        },
        {
            id: 1006002,
            name: 'Unknown Company 5',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'unknown@email.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: 'Unknown',
            premium: 0,
            
            dotNumber: 'Unknown',
            mcNumber: 'Unknown',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            
            radiusOfOperation: 'Unknown',
            commodityHauled: 'Unknown',
            operatingStates: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: 'Vicidial Call Recording - Lead ID: 2 from List 1006\nStatus: SALE\nCall Count: 1\nNo transcript available - would need to access recording URL\nPhone: 9999999999',
            
            notes: 'VICIDIAL SALE - List 1006, Lead ID 2. First sale in list 1006. No data captured.'
        },
        {
            id: 1006059,
            name: 'Unknown Company 6',
            contact: 'Unknown',
            phone: '9999999999',
            email: 'unknown@email.com',
            product: 'Commercial Auto',
            stage: 'new',
            assignedTo: 'Sales Team',
            created: new Date().toLocaleDateString(),
            renewalDate: 'Unknown',
            premium: 0,
            
            dotNumber: 'Unknown',
            mcNumber: 'Unknown',
            yearsInBusiness: 'Unknown',
            fleetSize: 'Unknown',
            
            radiusOfOperation: 'Unknown',
            commodityHauled: 'Unknown',
            operatingStates: 'Unknown',
            
            vehicles: [],
            trailers: [],
            drivers: [],
            
            transcriptText: 'Vicidial Call Recording - Lead ID: 59 from List 1006\nStatus: SALE\nCall Count: 1\nNo transcript available\nPhone: 9999999999\n\nNote: To get actual transcript, would need to:\n1. Access recording URL from Vicidial\n2. Download audio file\n3. Process through Deepgram API\n4. Extract insurance information',
            
            notes: 'VICIDIAL SALE - List 1006, Lead ID 59. Requires complete data entry and recording transcription.'
        }
    ];
    
    // Clear existing leads and add real ones
    localStorage.setItem('leads', JSON.stringify(realVicidialLeads));
    
    console.log('✅ Loaded 6 real Vicidial sales leads');
    console.log('Note: All leads show "Unknown" for most fields as the data was not captured in Vicidial');
    console.log('Phone numbers are all 9999999999 as found in the system');
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f59e0b;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
    `;
    notification.innerHTML = `⚠️ Loaded 6 real Vicidial sales leads - Most data marked as "Unknown"`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
        // Refresh view if on leads page
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                window.loadLeadsView();
            }
        }
    }, 5000);
})();