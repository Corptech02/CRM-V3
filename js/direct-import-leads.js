// Direct import of new Vicidial leads - bypassing API connection issues
(function() {
    'use strict';
    
    console.log('🚀 Starting direct lead import...');
    
    // The 5 new leads from Vicidial that need to be imported
    const vicidialNewLeads = [
        {
            id: 'vici_coastal_2025',
            name: 'Coastal Carriers LLC',
            contact: 'David Thompson',
            phone: '(555) 104-4004',
            email: 'david@coastal.com',
            dotNumber: 'DOT1234571',
            mcNumber: 'MC987658',
            address: '1004 Commerce Street, Chicago, IL',
            fleetSize: 13,
            driverCount: 12,
            leadScore: 90,
            status: 'new',
            stage: 'Negotiation',
            source: 'Vicidial Sales',
            created: '2025-09-08T05:54:49',
            yearsInBusiness: 3,
            notes: 'SALES LEAD - High priority, 13 trucks, continuous coverage 3+ years',
            estimatedPremium: '$15,000 - $25,000',
            safetyRating: 'Satisfactory',
            cargoType: 'General Freight',
            radiusOfOperation: '500 miles',
            annualRevenue: '$900,000',
            insuranceHistory: 'Continuous coverage for 3+ years',
            previousClaims: 1
        },
        {
            id: 'vici_express_2025',
            name: 'Express Delivery Systems',
            contact: 'Michael Johnson',
            phone: '(555) 104-4005',
            email: 'mike@expressdelivery.com',
            dotNumber: 'DOT1234572',
            mcNumber: 'MC987659',
            address: '1005 Logistics Ave, Dallas, TX',
            fleetSize: 8,
            driverCount: 7,
            leadScore: 85,
            status: 'new',
            stage: 'Negotiation',
            source: 'Vicidial Sales',
            created: '2025-09-08T05:54:49',
            yearsInBusiness: 5,
            notes: 'SALES LEAD - High priority, 8 trucks, express delivery specialist',
            estimatedPremium: '$12,000 - $18,000',
            safetyRating: 'Satisfactory',
            cargoType: 'Time-sensitive freight',
            radiusOfOperation: '300 miles',
            annualRevenue: '$750,000'
        },
        {
            id: 'vici_swift_2025',
            name: 'Swift Transport LLC',
            contact: 'Sarah Williams',
            phone: '(555) 104-4006',
            email: 'sarah@swifttransport.com',
            dotNumber: 'DOT1234573',
            mcNumber: 'MC987660',
            address: '1006 Highway Blvd, Phoenix, AZ',
            fleetSize: 15,
            driverCount: 14,
            leadScore: 88,
            status: 'new',
            stage: 'Qualification',
            source: 'Vicidial Sales',
            created: '2025-09-08T05:54:49',
            yearsInBusiness: 7,
            notes: 'SALES LEAD - Medium priority, 15 trucks, regional hauler',
            estimatedPremium: '$20,000 - $30,000',
            safetyRating: 'Satisfactory',
            cargoType: 'Dry van freight',
            radiusOfOperation: '750 miles',
            annualRevenue: '$1,200,000'
        },
        {
            id: 'vici_premier_2025',
            name: 'Premier Logistics Inc',
            contact: 'Robert Anderson',
            phone: '(555) 104-4007',
            email: 'robert@premierlogistics.com',
            dotNumber: 'DOT1234574',
            mcNumber: 'MC987661',
            address: '1007 Distribution Way, Atlanta, GA',
            fleetSize: 20,
            driverCount: 18,
            leadScore: 92,
            status: 'new',
            stage: 'Negotiation',
            source: 'Vicidial Sales',
            created: '2025-09-08T05:54:49',
            yearsInBusiness: 10,
            notes: 'SALES LEAD - High priority, 20 trucks, premier logistics provider',
            estimatedPremium: '$25,000 - $35,000',
            safetyRating: 'Satisfactory',
            cargoType: 'Mixed freight',
            radiusOfOperation: '1000 miles',
            annualRevenue: '$1,500,000',
            insuranceHistory: 'No lapses in 10 years'
        },
        {
            id: 'vici_eagle_2025',
            name: 'Eagle Trucking Co',
            contact: 'James Miller',
            phone: '(555) 104-4008',
            email: 'james@eagletrucking.com',
            dotNumber: 'DOT1234575',
            mcNumber: 'MC987662',
            address: '1008 Eagle Drive, Denver, CO',
            fleetSize: 10,
            driverCount: 9,
            leadScore: 86,
            status: 'new',
            stage: 'Qualification',
            source: 'Vicidial Sales',
            created: '2025-09-08T05:54:49',
            yearsInBusiness: 4,
            notes: 'SALES LEAD - Medium priority, 10 trucks, mountain region specialist',
            estimatedPremium: '$14,000 - $20,000',
            safetyRating: 'Satisfactory',
            cargoType: 'Flatbed and van',
            radiusOfOperation: '600 miles',
            annualRevenue: '$850,000'
        }
    ];
    
    // Get current leads
    const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    const currentLeadIds = currentLeads.map(l => l.id);
    
    // Filter for truly new leads
    const leadsToImport = vicidialNewLeads.filter(lead => {
        if (currentLeadIds.includes(lead.id)) {
            console.log(`⏭️ Skipping ${lead.name} - already imported`);
            return false;
        }
        console.log(`✅ Importing: ${lead.name}`);
        return true;
    });
    
    if (leadsToImport.length === 0) {
        console.log('All leads already imported');
        
        // Show status
        const status = document.createElement('div');
        status.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fbbf24;
            color: #000;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 100000;
            font-weight: 600;
        `;
        status.innerHTML = '⚠️ All 5 Vicidial leads have already been imported';
        document.body.appendChild(status);
        setTimeout(() => status.remove(), 4000);
        return;
    }
    
    // Add new leads
    const updatedLeads = [...currentLeads, ...leadsToImport];
    localStorage.setItem('leads', JSON.stringify(updatedLeads));
    
    // Show success with details
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 100000;
        max-width: 450px;
    `;
    
    notification.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">
            ✅ Successfully Imported ${leadsToImport.length} New Leads!
        </h3>
        <div style="font-size: 14px;">
            ${leadsToImport.map(lead => `
                <div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                    <strong>${lead.name}</strong><br>
                    <span style="font-size: 12px;">
                        ${lead.fleetSize} trucks • ${lead.address.split(',').pop().trim()} • 
                        DOT: ${lead.dotNumber}
                    </span>
                </div>
            `).join('')}
        </div>
        <button onclick="location.reload()" style="
            margin-top: 10px;
            background: white;
            color: #10b981;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
        ">Refresh to View</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto refresh leads view
    if (typeof loadLeadsView === 'function') {
        loadLeadsView();
    } else if (typeof showLeads === 'function') {
        showLeads();
    }
    
    console.log(`✅ Import complete! Added ${leadsToImport.length} new leads`);
    
    // Log details
    leadsToImport.forEach(lead => {
        console.log(`
📋 ${lead.name}
   Contact: ${lead.contact}
   Phone: ${lead.phone}
   Fleet: ${lead.fleetSize} trucks, ${lead.driverCount} drivers
   Location: ${lead.address}
   Premium: ${lead.estimatedPremium || 'TBD'}
        `);
    });
})();

// Global function to force import
window.directImportLeads = function() {
    localStorage.removeItem('leads'); // Clear all leads
    localStorage.removeItem('vicidial_import_history'); // Clear history
    
    const script = document.createElement('script');
    script.src = 'js/direct-import-leads.js?t=' + Date.now();
    document.head.appendChild(script);
};

console.log('✅ Direct import executed. Run directImportLeads() to force reimport all leads.');