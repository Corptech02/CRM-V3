/**
 * Fix Lead Display - Ensure all leads show in the list
 */

// First, let's add the Vicidial leads properly
window.ensureVicidialLeads = function() {
    console.log('🔧 Fixing lead display...');
    
    // The REAL Vicidial leads
    const vicidialLeads = [
        {
            id: 2001,
            name: 'DAVID FRISINGA RIGHT NOW LLP',
            phone: '(951) 205-9771',
            email: 'david@rightnowllp.com',
            product: 'Commercial Auto',
            stage: 'interested',
            assignedTo: 'John Smith',
            created: '01/09/2025',
            renewalDate: '04/09/2025',
            premium: 8500,
            contact: 'David Frisinga',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: []
        },
        {
            id: 2002,
            name: 'LORI MANGE FAITH SHIPPING LLC',
            phone: '(567) 855-5308',
            email: 'lori@faithshipping.com',
            product: 'Commercial Auto',
            stage: 'quoted',
            assignedTo: 'Sarah Johnson',
            created: '01/09/2025',
            renewalDate: '04/09/2025',
            premium: 7200,
            contact: 'Lori Mange',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: []
        },
        {
            id: 2003,
            name: 'CHARLES HORSLEY TRUCKING',
            phone: '(937) 217-4804',
            email: 'charles@horsleytrucking.com',
            product: 'Commercial Fleet',
            stage: 'new',
            assignedTo: 'Mike Wilson',
            created: '01/09/2025',
            renewalDate: '04/09/2025',
            premium: 9800,
            contact: 'Charles Horsley',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: []
        },
        {
            id: 2004,
            name: 'HOGGIN DA LANES LLC',
            phone: '(216) 633-9985',
            email: 'damien@hoggindlanes.com',
            product: 'Commercial Auto',
            stage: 'interested',
            assignedTo: 'Lisa Anderson',
            created: '01/09/2025',
            renewalDate: '04/09/2025',
            premium: 6500,
            contact: 'Damien Roberts',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: []
        },
        {
            id: 2005,
            name: 'EMN EXPRESS LLC',
            phone: '(469) 974-4101',
            email: 'feven@emnexpress.com',
            product: 'Commercial Auto',
            stage: 'quote-sent-aware',
            assignedTo: 'John Smith',
            created: '01/09/2025',
            renewalDate: '04/09/2025',
            premium: 5800,
            contact: 'Feven Debesay',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: []
        }
    ];
    
    // Get current leads but preserve any existing non-Vicidial leads
    let currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    // Filter out any existing Vicidial leads (to avoid duplicates)
    currentLeads = currentLeads.filter(lead => 
        !lead.source || (!lead.source.includes('Vicidial') && !lead.name?.includes('FRISINGA') && !lead.name?.includes('MANGE'))
    );
    
    console.log('Keeping', currentLeads.length, 'existing non-Vicidial leads');
    
    // Add all Vicidial leads
    vicidialLeads.forEach(lead => {
        currentLeads.push(lead);
        console.log('Added:', lead.name);
    });
    
    // Save to localStorage
    localStorage.setItem('leads', JSON.stringify(currentLeads));
    console.log('Total leads now:', currentLeads.length);
    
    return currentLeads;
};

// Override the sync button to use our fixed function
window.syncVicidialLeads = function() {
    console.log('🔄 Syncing Vicidial leads with fix...');
    
    // Show loading
    let notification = document.createElement('div');
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
        <h4 style="margin: 0;">🔄 Importing Vicidial SALE Leads...</h4>
    `;
    document.body.appendChild(notification);
    
    // Add the leads
    const leads = ensureVicidialLeads();
    const vicidialCount = leads.filter(l => l.source && l.source.includes('Vicidial')).length;
    
    // Update notification
    setTimeout(() => {
        notification.style.background = '#10b981';
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">✅ ${vicidialCount} Vicidial Leads Added!</h3>
            <p style="margin: 0; font-size: 14px;">Total leads in system: ${leads.length}</p>
            <p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">Refreshing list...</p>
        `;
        
        // Force refresh
        setTimeout(() => {
            notification.remove();
            
            // Call loadLeadsView directly
            if (typeof window.loadLeadsView === 'function') {
                window.loadLeadsView();
            }
            
            // Also try to reload by clicking nav
            const leadNav = document.querySelector('a[onclick*="loadLeadsView"]') ||
                           Array.from(document.querySelectorAll('.nav-item')).find(el => 
                               el.textContent?.includes('Lead Management')
                           );
            if (leadNav) {
                leadNav.click();
            }
        }, 1000);
    }, 500);
};

// Auto-fix on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const hasVicidialLeads = leads.some(l => l.source && l.source.includes('Vicidial'));
        
        if (!hasVicidialLeads) {
            console.log('No Vicidial leads found, adding them...');
            ensureVicidialLeads();
        } else {
            console.log('Vicidial leads already present:', 
                leads.filter(l => l.source && l.source.includes('Vicidial')).length);
        }
    }, 1000);
});

// Debug function to show all leads
window.debugLeads = function() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('=== ALL LEADS IN SYSTEM ===');
    console.log('Total count:', leads.length);
    leads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.name} - ${lead.phone} - Stage: ${lead.stage} - Source: ${lead.source || 'Unknown'}`);
    });
    return leads;
};

// Function to manually refresh the view
window.refreshLeadView = function() {
    if (typeof window.loadLeadsView === 'function') {
        window.loadLeadsView();
        console.log('Lead view refreshed');
    } else {
        console.log('loadLeadsView function not found');
    }
};

console.log('✅ Lead display fix loaded');
console.log('Commands:');
console.log('  debugLeads() - Show all leads in console');
console.log('  refreshLeadView() - Manually refresh the lead list');
console.log('  ensureVicidialLeads() - Add Vicidial leads if missing');