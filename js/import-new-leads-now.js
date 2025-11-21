// Force import new leads from Vicidial RIGHT NOW
(async function() {
    'use strict';
    
    console.log('🔄 Starting immediate lead import from Vicidial...');
    
    try {
        // Fetch leads from the Lead Transfer API
        const response = await fetch('http://localhost:8903/api/leads');
        if (!response.ok) {
            throw new Error('Failed to fetch leads from API');
        }
        
        const apiLeads = await response.json();
        console.log(`📊 Found ${apiLeads.length} total leads in Vicidial`);
        
        // Get current leads in the system
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        // Get list of permanently imported lead IDs (won't re-import even if deleted)
        const importedHistory = JSON.parse(localStorage.getItem('vicidial_import_history') || '[]');
        
        // Track current lead IDs
        const currentLeadIds = currentLeads.map(l => l.id);
        
        // Filter for truly new leads
        const newLeads = apiLeads.filter(lead => {
            // Skip if already in current leads
            if (currentLeadIds.includes(lead.id)) {
                console.log(`⏭️ Skipping ${lead.company} - already in system`);
                return false;
            }
            
            // Skip if previously imported (even if deleted)
            if (importedHistory.includes(lead.id)) {
                console.log(`⏭️ Skipping ${lead.company} - previously imported`);
                return false;
            }
            
            console.log(`✅ Will import: ${lead.company}`);
            return true;
        });
        
        if (newLeads.length === 0) {
            console.log('❌ No new leads to import');
            alert('No new leads found. All Vicidial leads have already been imported.');
            return;
        }
        
        // Transform and import new leads
        const transformedLeads = newLeads.map(lead => ({
            id: lead.id,
            name: lead.company || lead.contact || 'Unknown Company',
            contact: lead.contact || '',
            phone: lead.phone || '',
            email: lead.email || '',
            dotNumber: lead.dotNumber || '',
            mcNumber: lead.mcNumber || '',
            address: [lead.address, lead.city, lead.state].filter(Boolean).join(', '),
            status: 'new',
            stage: lead.priority === 'high' ? 'Negotiation' : 'Qualification',
            source: 'Vicidial Import',
            created: lead.dateAdded || new Date().toISOString(),
            fleetSize: lead.fleetSize || 0,
            yearsInBusiness: lead.yearsInBusiness || 0,
            notes: lead.notes || '',
            driverCount: lead.driverCount || 0,
            leadScore: lead.leadScore || 0,
            safetyRating: lead.safetyRating || '',
            coverageType: lead.coverageType || 'Commercial Auto',
            estimatedPremium: lead.estimatedPremium || '',
            // Additional Vicidial fields
            cargoType: lead.cargoType || '',
            radiusOfOperation: lead.radiusOfOperation || '',
            annualRevenue: lead.annualRevenue || '',
            insuranceHistory: lead.insuranceHistory || '',
            previousClaims: lead.previousClaims || 0
        }));
        
        // Add new leads to current leads
        const updatedLeads = [...currentLeads, ...transformedLeads];
        
        // Save updated leads
        localStorage.setItem('leads', JSON.stringify(updatedLeads));
        
        // Update import history
        const newImportedIds = newLeads.map(l => l.id);
        const updatedHistory = [...importedHistory, ...newImportedIds];
        localStorage.setItem('vicidial_import_history', JSON.stringify(updatedHistory));
        
        console.log(`✅ Successfully imported ${newLeads.length} new leads!`);
        
        // Show success notification
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
            font-size: 16px;
            font-weight: 600;
            max-width: 400px;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">✅</span>
                <div>
                    <div>Successfully imported ${newLeads.length} new leads!</div>
                    <div style="font-size: 14px; font-weight: normal; margin-top: 5px;">
                        ${newLeads.map(l => l.company).join(', ')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => notification.remove(), 5000);
        
        // Refresh the leads view if it's visible
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        } else if (typeof showLeads === 'function') {
            showLeads();
        }
        
        // Log imported companies
        console.log('📋 Imported leads:');
        transformedLeads.forEach(lead => {
            console.log(`  - ${lead.name} (${lead.phone})`);
        });
        
    } catch (error) {
        console.error('❌ Error importing leads:', error);
        alert('Error importing leads. Check console for details.');
    }
})();

// Also expose as a global function
window.importNewLeadsNow = async function() {
    console.log('Manual import triggered...');
    
    // Clear and re-run the import
    const script = document.createElement('script');
    script.src = 'js/import-new-leads-now.js?t=' + Date.now();
    document.head.appendChild(script);
};

console.log('💡 Run importNewLeadsNow() to manually import new leads');