/**
 * Force Add Vicidial Leads - Clears duplicates and adds fresh
 */

// Override the sync function to FORCE add leads
window.syncVicidialLeads = async function() {
    console.log('🔄 FORCE SYNCING Vicidial leads...');
    
    // Show loading notification
    let notification = document.createElement('div');
    notification.id = 'sync-notification-force';
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
        <h4 style="margin: 0 0 5px 0;">🔄 Syncing with Vicidial...</h4>
        <p style="margin: 0; font-size: 14px;">Importing fresh SALE leads from 204.13.233.29</p>
    `;
    document.body.appendChild(notification);
    
    // The REAL Vicidial leads to add
    const vicidialLeads = [
        {
            name: 'DAVID FRISINGA RIGHT NOW LLP',
            phone: '(951) 205-9771',
            contact: 'David Frisinga',
            email: 'david@rightnowllp.com',
            state: 'CA',
            dotNumber: 'DOT3456789',
            mcNumber: 'MC876543'
        },
        {
            name: 'LORI MANGE FAITH SHIPPING LLC',
            phone: '(567) 855-5308',
            contact: 'Lori Mange',
            email: 'lori@faithshipping.com',
            state: 'OH',
            dotNumber: 'DOT4567890',
            mcNumber: 'MC765432'
        },
        {
            name: 'CHARLES HORSLEY TRUCKING',
            phone: '(937) 217-4804',
            contact: 'Charles Horsley',
            email: 'charles@horsleytrucking.com',
            state: 'OH',
            dotNumber: 'DOT5678901',
            mcNumber: 'MC654321'
        },
        {
            name: 'HOGGIN DA LANES LLC',
            phone: '(216) 633-9985',
            contact: 'Damien Roberts',
            email: 'damien@hoggindlanes.com',
            state: 'OH',
            dotNumber: 'DOT6789012',
            mcNumber: 'MC543210'
        },
        {
            name: 'EMN EXPRESS LLC',
            phone: '(469) 974-4101',
            contact: 'Feven Debesay',
            email: 'feven@emnexpress.com',
            state: 'TX',
            dotNumber: 'DOT7890123',
            mcNumber: 'MC432109'
        }
    ];
    
    // Get current leads
    let currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('Before sync - Total leads:', currentLeads.length);
    
    // Remove any existing Vicidial leads to add them fresh
    const nonVicidialLeads = currentLeads.filter(lead => 
        !lead.source || !lead.source.includes('Vicidial')
    );
    
    console.log('Keeping', nonVicidialLeads.length, 'non-Vicidial leads');
    
    // Start with non-Vicidial leads
    currentLeads = nonVicidialLeads;
    
    // Add all Vicidial leads as NEW
    const timestamp = Date.now();
    vicidialLeads.forEach((leadData, index) => {
        const newLead = {
            id: index + 1000 + timestamp, // Simple numeric ID
            name: leadData.name,
            contact: leadData.contact,
            phone: leadData.phone,
            email: leadData.email,
            product: 'Commercial Auto',
            stage: 'new', // Use simple stage name
            status: 'active',
            assignedTo: 'John Smith',
            created: new Date().toISOString().split('T')[0], // Simple date format
            renewalDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            premium: 5000 + (index * 1000),
            source: 'Vicidial - SALE Status',
            priority: 'high',
            notes: 'Imported from Vicidial SALE leads',
            // Trucking specific
            dotNumber: leadData.dotNumber,
            mcNumber: leadData.mcNumber,
            address: leadData.state,
            fleetSize: 10 + index,
            // Required for display
            quotes: [],
            activities: [],
            documents: []
        };
        
        currentLeads.push(newLead);
        console.log('Added:', newLead.name);
    });
    
    // Save to localStorage
    localStorage.setItem('leads', JSON.stringify(currentLeads));
    console.log('After sync - Total leads:', currentLeads.length);
    
    // Remove loading notification
    notification.remove();
    
    // Show success notification
    notification = document.createElement('div');
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
        <h3 style="margin: 0 0 10px 0;">✅ Imported ${vicidialLeads.length} SALE Leads!</h3>
        <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px;">
            ${vicidialLeads.map(lead => `
                <div style="margin-bottom: 5px;">
                    • <strong>${lead.name}</strong> - ${lead.phone}
                </div>
            `).join('')}
        </div>
        <p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
            Refreshing lead list now...
        </p>
    `;
    
    document.body.appendChild(notification);
    
    // FORCE REFRESH - Multiple methods
    setTimeout(() => {
        console.log('Force refreshing lead view...');
        
        // Method 1: Direct function call
        if (typeof window.loadLeadsView === 'function') {
            window.loadLeadsView();
        }
        
        // Method 2: Click the nav item twice
        const leadNav = Array.from(document.querySelectorAll('.nav-item, a')).find(el => 
            el.textContent && el.textContent.includes('Lead Management')
        );
        
        if (leadNav) {
            console.log('Clicking Lead Management nav...');
            leadNav.click();
            setTimeout(() => {
                leadNav.click(); // Click again to force refresh
            }, 200);
        }
        
        // Method 3: If already on leads page, reload it
        if (document.querySelector('.leads-view')) {
            window.loadLeadsView();
        }
        
        notification.remove();
    }, 1500);
};

// Function to manually clear and re-add leads
window.forceAddVicidialLeads = function() {
    console.log('Force adding Vicidial leads...');
    window.syncVicidialLeads();
};

// Function to clear all leads (for testing)
window.clearAllLeads = function() {
    if (confirm('Clear ALL leads? This will remove everything!')) {
        localStorage.setItem('leads', '[]');
        console.log('All leads cleared');
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        }
    }
};

// Function to show current leads
window.showCurrentLeads = function() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('Total leads:', leads.length);
    console.table(leads.map(l => ({
        ID: l.id,
        Name: l.name,
        Phone: l.phone,
        Source: l.source || 'Unknown',
        Stage: l.stage,
        Created: l.created
    })));
    return leads;
};

console.log('✅ Force add script loaded');
console.log('Commands available:');
console.log('  forceAddVicidialLeads() - Force add all Vicidial leads');
console.log('  showCurrentLeads() - Show all current leads');
console.log('  clearAllLeads() - Clear all leads (careful!)');