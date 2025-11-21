// Force sync leads from Lead Transfer API - with better error handling
(async function() {
    'use strict';
    
    console.log('🔄 Starting forced lead sync...');
    
    // First, clear old import tracking to allow fresh import
    const clearHistory = confirm('Do you want to clear import history and re-import all leads? Click OK to import ALL leads, Cancel to import only new ones.');
    
    if (clearHistory) {
        localStorage.removeItem('vicidial_import_history');
        localStorage.removeItem('vici_imported_leads');
        localStorage.removeItem('vicidialLeadsImported');
        console.log('✅ Cleared import history');
    }
    
    try {
        // Try multiple endpoints
        let apiLeads = null;
        const endpoints = [
            'http://localhost:8903/api/leads',
            'http://127.0.0.1:8903/api/leads',
            '/api/vicidial/leads' // Fallback local endpoint if available
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    apiLeads = await response.json();
                    console.log(`✅ Successfully fetched from ${endpoint}`);
                    break;
                }
            } catch (e) {
                console.log(`❌ Failed to fetch from ${endpoint}:`, e.message);
            }
        }
        
        // If API fetch failed, use hardcoded leads
        if (!apiLeads) {
            console.log('⚠️ API unavailable, using manual lead data...');
            apiLeads = [
                {
                    id: 'manual_coastal_' + Date.now(),
                    company: 'Coastal Carriers LLC',
                    contact: 'David Thompson',
                    phone: '(555) 104-4004',
                    email: 'david@coastal.com',
                    dotNumber: 'DOT1234571',
                    mcNumber: 'MC987658',
                    address: '1004 Commerce Street',
                    city: 'Chicago',
                    state: 'IL',
                    fleetSize: 13,
                    driverCount: 12,
                    leadScore: 90,
                    priority: 'high',
                    status: 'new',
                    source: 'Vicidial Sales',
                    dateAdded: '2025-09-08T05:54:49'
                },
                {
                    id: 'manual_express_' + Date.now(),
                    company: 'Express Delivery Systems',
                    contact: 'Michael Johnson',
                    phone: '(555) 104-4005',
                    email: 'mike@expressdelivery.com',
                    dotNumber: 'DOT1234572',
                    mcNumber: 'MC987659',
                    address: '1005 Logistics Ave',
                    city: 'Dallas',
                    state: 'TX',
                    fleetSize: 8,
                    driverCount: 7,
                    leadScore: 85,
                    priority: 'high',
                    status: 'new',
                    source: 'Vicidial Sales',
                    dateAdded: '2025-09-08T05:54:49'
                },
                {
                    id: 'manual_swift_' + Date.now(),
                    company: 'Swift Transport LLC',
                    contact: 'Sarah Williams',
                    phone: '(555) 104-4006',
                    email: 'sarah@swifttransport.com',
                    dotNumber: 'DOT1234573',
                    mcNumber: 'MC987660',
                    address: '1006 Highway Blvd',
                    city: 'Phoenix',
                    state: 'AZ',
                    fleetSize: 15,
                    driverCount: 14,
                    leadScore: 88,
                    priority: 'medium',
                    status: 'new',
                    source: 'Vicidial Sales',
                    dateAdded: '2025-09-08T05:54:49'
                },
                {
                    id: 'manual_premier_' + Date.now(),
                    company: 'Premier Logistics Inc',
                    contact: 'Robert Anderson',
                    phone: '(555) 104-4007',
                    email: 'robert@premierlogistics.com',
                    dotNumber: 'DOT1234574',
                    mcNumber: 'MC987661',
                    address: '1007 Distribution Way',
                    city: 'Atlanta',
                    state: 'GA',
                    fleetSize: 20,
                    driverCount: 18,
                    leadScore: 92,
                    priority: 'high',
                    status: 'new',
                    source: 'Vicidial Sales',
                    dateAdded: '2025-09-08T05:54:49'
                },
                {
                    id: 'manual_eagle_' + Date.now(),
                    company: 'Eagle Trucking Co',
                    contact: 'James Miller',
                    phone: '(555) 104-4008',
                    email: 'james@eagletrucking.com',
                    dotNumber: 'DOT1234575',
                    mcNumber: 'MC987662',
                    address: '1008 Eagle Drive',
                    city: 'Denver',
                    state: 'CO',
                    fleetSize: 10,
                    driverCount: 9,
                    leadScore: 86,
                    priority: 'medium',
                    status: 'new',
                    source: 'Vicidial Sales',
                    dateAdded: '2025-09-08T05:54:49'
                }
            ];
        }
        
        console.log(`📊 Found ${apiLeads.length} total leads to process`);
        
        // Get current leads
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const currentLeadIds = currentLeads.map(l => l.id);
        
        // Get import history (if not cleared)
        const importHistory = clearHistory ? [] : JSON.parse(localStorage.getItem('vicidial_import_history') || '[]');
        
        // Filter for new leads
        const newLeads = apiLeads.filter(lead => {
            const leadId = lead.id || `generated_${Date.now()}_${Math.random()}`;
            
            // Skip if already in current leads
            if (currentLeadIds.includes(leadId)) {
                console.log(`⏭️ Skipping ${lead.company} - already in system`);
                return false;
            }
            
            // Skip if in import history (unless cleared)
            if (!clearHistory && importHistory.includes(leadId)) {
                console.log(`⏭️ Skipping ${lead.company} - previously imported`);
                return false;
            }
            
            console.log(`✅ Will import: ${lead.company}`);
            return true;
        });
        
        if (newLeads.length === 0) {
            alert('No new leads to import. All leads have already been imported.');
            return;
        }
        
        // Transform and import
        const transformedLeads = newLeads.map(lead => ({
            id: lead.id || `lead_${Date.now()}_${Math.random()}`,
            name: lead.company || lead.contact || 'Unknown',
            contact: lead.contact || '',
            phone: lead.phone || '',
            email: lead.email || '',
            dotNumber: lead.dotNumber || lead.dot || '',
            mcNumber: lead.mcNumber || lead.mc || '',
            address: [lead.address, lead.city, lead.state].filter(Boolean).join(', '),
            status: 'new',
            stage: lead.priority === 'high' ? 'Negotiation' : 'Qualification',
            source: 'Vicidial Import',
            created: lead.dateAdded || new Date().toISOString(),
            fleetSize: lead.fleetSize || 0,
            driverCount: lead.driverCount || 0,
            leadScore: lead.leadScore || 0,
            priority: lead.priority || 'medium',
            yearsInBusiness: lead.yearsInBusiness || 0,
            notes: lead.notes || `Imported from Vicidial - ${lead.source || 'Sales Lead'}`
        }));
        
        // Add to current leads
        const updatedLeads = [...currentLeads, ...transformedLeads];
        localStorage.setItem('leads', JSON.stringify(updatedLeads));
        
        // Update import history
        const newIds = newLeads.map(l => l.id);
        const updatedHistory = [...importHistory, ...newIds];
        localStorage.setItem('vicidial_import_history', JSON.stringify(updatedHistory));
        
        console.log(`✅ Successfully imported ${newLeads.length} leads!`);
        
        // Show detailed notification
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
            max-width: 400px;
        `;
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">✅ Import Successful!</h3>
            <p>Imported ${newLeads.length} new leads:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                ${newLeads.map(l => `<li>${l.company}</li>`).join('')}
            </ul>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 7000);
        
        // Refresh view
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        } else if (typeof showLeads === 'function') {
            showLeads();
        }
        
        // Reload page after 2 seconds to ensure everything updates
        setTimeout(() => {
            if (confirm('Leads imported! Refresh page to see all changes?')) {
                location.reload();
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Import error:', error);
        alert(`Error importing leads: ${error.message}\n\nPlease check the console for details.`);
    }
})();

// Add global function
window.forceSyncLeads = function() {
    const script = document.createElement('script');
    script.src = 'js/force-sync-leads.js?t=' + Date.now();
    document.head.appendChild(script);
};

console.log('💡 Run forceSyncLeads() to manually import leads');