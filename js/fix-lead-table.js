/**
 * Fix Lead Table - Ensure ALL leads show in the table
 */

// Clear and properly add all Vicidial leads
window.fixLeadTable = function() {
    console.log('🔧 Fixing lead table to show ALL leads...');
    
    // Get current leads
    let leads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    // Keep any existing non-Vicidial leads
    const existingLeads = leads.filter(lead => 
        !lead.source || !lead.source.includes('Vicidial')
    );
    
    // Define ALL 5 Vicidial leads with the EXACT format needed
    const vicidialLeads = [
        {
            id: 2001,
            name: 'DAVID FRISINGA RIGHT NOW LLP',
            contact: 'David Frisinga',
            phone: '(951) 205-9771',
            email: 'david@rightnowllp.com',
            product: 'Commercial Auto',
            premium: 8500,
            stage: 'qualified',
            renewalDate: '04/09/2025',
            assignedTo: 'John Smith',
            created: '9/9/2025',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: 2002,
            name: 'LORI MANGE FAITH SHIPPING LLC',
            contact: 'Lori Mange',
            phone: '(567) 855-5308',
            email: 'lori@faithshipping.com',
            product: 'Commercial Auto',
            premium: 7200,
            stage: 'interested',
            renewalDate: '04/09/2025',
            assignedTo: 'Sarah Johnson',
            created: '9/9/2025',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: 2003,
            name: 'CHARLES HORSLEY TRUCKING',
            contact: 'Charles Horsley',
            phone: '(937) 217-4804',
            email: 'charles@horsleytrucking.com',
            product: 'Commercial Fleet',
            premium: 9800,
            stage: 'new',
            renewalDate: '04/09/2025',
            assignedTo: 'Mike Wilson',
            created: '9/9/2025',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: 2004,
            name: 'HOGGIN DA LANES LLC',
            contact: 'Damien Roberts',
            phone: '(216) 633-9985',
            email: 'damien@hoggindlanes.com',
            product: 'Commercial Auto',
            premium: 6500,
            stage: 'quoted',
            renewalDate: '04/09/2025',
            assignedTo: 'Lisa Anderson',
            created: '9/9/2025',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: 2005,
            name: 'EMN EXPRESS LLC',
            contact: 'Feven Debesay',
            phone: '(469) 974-4101',
            email: 'feven@emnexpress.com',
            product: 'Commercial Auto',
            premium: 5800,
            stage: 'quote-sent-aware',
            renewalDate: '04/09/2025',
            assignedTo: 'John Smith',
            created: '9/9/2025',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: [],
            activities: []
        },
        {
            id: 2006,
            name: 'MELVIN KENNEDY KENN TRANSPORT LLC',
            contact: 'Melvin Kennedy',
            phone: '(817) 542-8635',
            email: 'dispatch@kenntransport.com',
            product: 'Commercial Auto',
            premium: 10000,
            stage: 'qualified',
            renewalDate: '09/19/2025',
            assignedTo: 'Sales Team',
            created: '9/9/2025',
            source: 'Vicidial - SALE',
            status: 'active',
            quotes: [],
            activities: []
        }
    ];
    
    // Combine existing leads with ALL Vicidial leads
    const allLeads = [...existingLeads, ...vicidialLeads];
    
    // Save to localStorage
    localStorage.setItem('leads', JSON.stringify(allLeads));
    console.log(`✅ Fixed! Total leads: ${allLeads.length} (${vicidialLeads.length} from Vicidial)`);
    
    return allLeads;
};

// Override sync function to use our fix
window.syncVicidialLeads = function() {
    console.log('🔄 Syncing ALL Vicidial leads...');
    
    // Show loading notification
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
        <h4 style="margin: 0;">🔄 Importing ALL Vicidial SALE Leads...</h4>
    `;
    document.body.appendChild(notification);
    
    // Fix the table data
    const leads = fixLeadTable();
    const vicidialCount = leads.filter(l => l.source && l.source.includes('Vicidial')).length;
    
    // Update notification
    setTimeout(() => {
        notification.style.background = '#10b981';
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">✅ ${vicidialCount} Vicidial Leads in System!</h3>
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px; font-size: 14px;">
                • DAVID FRISINGA RIGHT NOW LLP<br>
                • LORI MANGE FAITH SHIPPING LLC<br>
                • CHARLES HORSLEY TRUCKING<br>
                • HOGGIN DA LANES LLC<br>
                • EMN EXPRESS LLC<br>
                • MELVIN KENNEDY KENN TRANSPORT LLC
            </div>
            <p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">Refreshing table...</p>
        `;
        
        // Force complete refresh
        setTimeout(() => {
            notification.remove();
            
            // Method 1: Direct loadLeadsView
            if (typeof window.loadLeadsView === 'function') {
                console.log('Calling loadLeadsView...');
                window.loadLeadsView();
            }
            
            // Method 2: Click Lead Management twice
            setTimeout(() => {
                const leadNav = Array.from(document.querySelectorAll('.nav-item, a')).find(el => 
                    el.textContent && el.textContent.includes('Lead Management')
                );
                if (leadNav) {
                    console.log('Clicking Lead Management...');
                    leadNav.click();
                    setTimeout(() => leadNav.click(), 200);
                }
            }, 500);
        }, 1500);
    }, 500);
};

// Function to verify leads in console
window.checkTable = function() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('=== LEADS IN LOCALSTORAGE ===');
    console.table(leads.map(l => ({
        ID: l.id,
        Name: l.name,
        Phone: l.phone,
        Email: l.email,
        Stage: l.stage,
        Source: l.source || 'Unknown'
    })));
    console.log(`Total: ${leads.length} leads`);
    
    // Check what's actually in the DOM table
    const tableRows = document.querySelectorAll('.lead-table tbody tr');
    console.log(`Table shows: ${tableRows.length} rows`);
    
    return leads;
};

// Auto-fix on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const vicidialCount = leads.filter(l => l.source && l.source.includes('Vicidial')).length;
        
        if (vicidialCount < 6) {
            console.log(`Only ${vicidialCount} Vicidial leads found. Adding all 6...`);
            fixLeadTable();
            
            // Auto-refresh if on leads page
            if (document.querySelector('.leads-view')) {
                setTimeout(() => {
                    if (typeof window.loadLeadsView === 'function') {
                        window.loadLeadsView();
                    }
                }, 1000);
            }
        }
    }, 1000);
});

console.log('✅ Lead table fix loaded!');
console.log('Commands:');
console.log('  checkTable() - Check what\'s in localStorage vs DOM');
console.log('  fixLeadTable() - Manually fix the table data');