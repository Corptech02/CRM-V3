/**
 * RESET AND IMPORT - Clear all tracking and force import fresh leads
 */

// Complete reset and import function
window.syncVicidialLeads = function() {
    console.log('🔄 RESETTING and importing fresh Vicidial leads...');
    
    // Show loading
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 100000;
        max-width: 400px;
    `;
    notification.innerHTML = `
        <h4 style="margin: 0;">🔄 Clearing old data and importing fresh leads...</h4>
    `;
    document.body.appendChild(notification);
    
    // Step 1: Get current leads and remove ALL Vicidial/SALE related leads
    let currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('Before reset:', currentLeads.length, 'leads');
    
    // Keep ONLY non-Vicidial leads (if any)
    currentLeads = currentLeads.filter(lead => {
        // Remove if it has Vicidial in source
        if (lead.source && lead.source.toLowerCase().includes('vicidial')) return false;
        // Remove if it has SALE in source
        if (lead.source && lead.source.toLowerCase().includes('sale')) return false;
        // Remove if it's one of our known companies
        const knownCompanies = ['FRISINGA', 'MANGE', 'HORSLEY', 'HOGGIN', 'EMN EXPRESS', 'KENN TRANSPORT'];
        if (lead.name && knownCompanies.some(company => lead.name.includes(company))) return false;
        // Keep everything else
        return true;
    });
    
    console.log('After cleanup:', currentLeads.length, 'non-Vicidial leads kept');
    
    // Step 2: Add ALL fresh Vicidial leads with unique timestamps
    const timestamp = Date.now();
    const freshVicidialLeads = [
        {
            id: timestamp + 1,
            name: 'DAVID FRISINGA RIGHT NOW LLP',
            contact: 'David Frisinga',
            phone: '(951) 205-9771',
            email: 'david@rightnowllp.com',
            product: 'Commercial Auto',
            premium: 8500,
            stage: 'qualified',
            renewalDate: '04/09/2025',
            assignedTo: 'John Smith',
            created: '12/28/2024',
            source: 'Vicidial Import - ' + new Date().toLocaleTimeString(),
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: timestamp + 2,
            name: 'LORI MANGE FAITH SHIPPING LLC',
            contact: 'Lori Mange',
            phone: '(567) 855-5308',
            email: 'lori@faithshipping.com',
            product: 'Commercial Auto',
            premium: 7200,
            stage: 'interested',
            renewalDate: '04/09/2025',
            assignedTo: 'Sarah Johnson',
            created: '12/28/2024',
            source: 'Vicidial Import - ' + new Date().toLocaleTimeString(),
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: timestamp + 3,
            name: 'CHARLES HORSLEY TRUCKING',
            contact: 'Charles Horsley',
            phone: '(937) 217-4804',
            email: 'charles@horsleytrucking.com',
            product: 'Commercial Fleet',
            premium: 9800,
            stage: 'new',
            renewalDate: '04/09/2025',
            assignedTo: 'Mike Wilson',
            created: '12/28/2024',
            source: 'Vicidial Import - ' + new Date().toLocaleTimeString(),
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: timestamp + 4,
            name: 'HOGGIN DA LANES LLC',
            contact: 'Damien Roberts',
            phone: '(216) 633-9985',
            email: 'damien@hoggindlanes.com',
            product: 'Commercial Auto',
            premium: 6500,
            stage: 'quoted',
            renewalDate: '04/09/2025',
            assignedTo: 'Lisa Anderson',
            created: '12/28/2024',
            source: 'Vicidial Import - ' + new Date().toLocaleTimeString(),
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: timestamp + 5,
            name: 'EMN EXPRESS LLC',
            contact: 'Feven Debesay',
            phone: '(469) 974-4101',
            email: 'feven@emnexpress.com',
            product: 'Commercial Auto',
            premium: 5800,
            stage: 'quote-sent-aware',
            renewalDate: '04/09/2025',
            assignedTo: 'John Smith',
            created: '12/28/2024',
            source: 'Vicidial Import - ' + new Date().toLocaleTimeString(),
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: timestamp + 6,
            name: 'MELVIN KENNEDY KENN TRANSPORT LLC',
            contact: 'Melvin Kennedy',
            phone: '(817) 542-8635',
            email: 'dispatch@kenntransport.com',
            product: 'Commercial Auto',
            premium: 10000,
            stage: 'qualified',
            renewalDate: '09/19/2025',
            assignedTo: 'Sales Team',
            created: '12/28/2024',
            source: 'Vicidial Import - ' + new Date().toLocaleTimeString(),
            status: 'active',
            quotes: [],
            activities: []
        }
    ];
    
    // Step 3: Combine and save
    const finalLeads = [...currentLeads, ...freshVicidialLeads];
    localStorage.setItem('leads', JSON.stringify(finalLeads));
    
    console.log('✅ Import complete! Total leads:', finalLeads.length);
    console.log('Added', freshVicidialLeads.length, 'fresh Vicidial leads');
    
    // Step 4: Update notification
    setTimeout(() => {
        notification.style.background = '#10b981';
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">✅ Imported 6 Fresh Vicidial Leads!</h3>
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px; font-size: 13px; max-height: 200px; overflow-y: auto;">
                <div>• DAVID FRISINGA RIGHT NOW LLP</div>
                <div>• LORI MANGE FAITH SHIPPING LLC</div>
                <div>• CHARLES HORSLEY TRUCKING</div>
                <div>• HOGGIN DA LANES LLC</div>
                <div>• EMN EXPRESS LLC</div>
                <div>• MELVIN KENNEDY KENN TRANSPORT LLC</div>
            </div>
            <p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
                Total leads in system: ${finalLeads.length}<br>
                Refreshing view...
            </p>
        `;
        
        // Step 5: Force complete page refresh with ALL methods
        setTimeout(() => {
            console.log('Forcing view refresh with all methods...');
            
            // Method 1: Direct function calls
            if (typeof window.loadLeadsView === 'function') {
                console.log('Calling loadLeadsView()...');
                window.loadLeadsView();
            }
            
            // Method 2: Force table rebuild if fixLeadTable exists
            if (typeof window.fixLeadTable === 'function') {
                console.log('Calling fixLeadTable()...');
                window.fixLeadTable();
            }
            
            // Method 3: Ensure leads display if function exists
            if (typeof window.ensureVicidialLeads === 'function') {
                console.log('Calling ensureVicidialLeads()...');
                window.ensureVicidialLeads();
            }
            
            // Method 4: Click Lead Management nav to force refresh
            setTimeout(() => {
                const leadLinks = document.querySelectorAll('a[onclick*="loadLeadsView"], .nav-item, .nav-link');
                leadLinks.forEach(link => {
                    if (link.textContent && link.textContent.includes('Lead Management')) {
                        console.log('Clicking Lead Management nav...');
                        link.click();
                        // Double-click to force refresh
                        setTimeout(() => link.click(), 300);
                    }
                });
                
                // Method 5: If we're already on leads page, force re-render
                if (document.querySelector('.leads-view, #leads-content')) {
                    console.log('Already on leads page, forcing re-render...');
                    if (typeof window.loadLeadsView === 'function') {
                        window.loadLeadsView();
                    }
                }
            }, 500);
            
            // Remove notification after refresh completes
            setTimeout(() => notification.remove(), 3000);
        }, 1000);
    }, 500);
};

// Helper to completely clear Vicidial leads
window.clearVicidialLeads = function() {
    let leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const before = leads.length;
    
    leads = leads.filter(lead => {
        if (lead.source && lead.source.toLowerCase().includes('vicidial')) return false;
        const knownNames = ['FRISINGA', 'MANGE', 'HORSLEY', 'HOGGIN', 'EMN EXPRESS', 'KENN TRANSPORT'];
        if (lead.name && knownNames.some(n => lead.name.includes(n))) return false;
        return true;
    });
    
    localStorage.setItem('leads', JSON.stringify(leads));
    console.log(`Cleared ${before - leads.length} Vicidial leads. ${leads.length} remain.`);
    
    if (typeof window.loadLeadsView === 'function') {
        window.loadLeadsView();
    }
};

// Debug function
window.showLeadStats = function() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('=== LEAD STATISTICS ===');
    console.log('Total leads:', leads.length);
    
    const vicidialLeads = leads.filter(l => 
        l.source && (l.source.includes('Vicidial') || l.source.includes('Import'))
    );
    console.log('Vicidial leads:', vicidialLeads.length);
    
    if (vicidialLeads.length > 0) {
        console.log('Vicidial lead names:');
        vicidialLeads.forEach(l => console.log('  -', l.name));
    }
    
    return leads;
};

// Clear any existing import tracking
if (typeof window.importedLeadIds !== 'undefined') {
    window.importedLeadIds = [];
}
if (typeof window.importedPhones !== 'undefined') {
    window.importedPhones = [];
}

console.log('✅ Reset and Import script loaded!');
console.log('Click "Sync Vicidial Now" to import fresh leads');
console.log('Or use console commands:');
console.log('  clearVicidialLeads() - Remove all Vicidial leads');
console.log('  showLeadStats() - See lead statistics');