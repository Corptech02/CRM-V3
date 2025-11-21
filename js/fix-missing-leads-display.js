// Fix Missing Leads Display Issue
console.log('🔧 Fixing missing leads display issue...');

// Function to force reload leads from database and display them
window.forceReloadLeads = async function() {
    console.log('🔄 Force reloading leads from database...');

    try {
        // Get leads directly from API
        const response = await fetch('/api/leads');
        if (response.ok) {
            const leads = await response.json();
            console.log(`📊 Loaded ${leads.length} leads from database:`, leads);

            // Update localStorage immediately
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));

            // Show notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-weight: 500;
            `;
            notification.innerHTML = `<i class="fas fa-check-circle"></i> Reloaded ${leads.length} leads from database`;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);

            // Force refresh the leads view
            if (typeof loadLeadsView === 'function') {
                console.log('🔄 Refreshing leads view...');
                loadLeadsView();
            }

            return leads;
        } else {
            throw new Error('Failed to load leads from API');
        }
    } catch (error) {
        console.error('❌ Error reloading leads:', error);
        alert('Error reloading leads: ' + error.message);
    }
};

// Function to check current leads in localStorage
window.checkCurrentLeads = function() {
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');

    console.log('📋 Current leads in localStorage:');
    console.log(`   insurance_leads: ${insuranceLeads.length} leads`);
    console.log(`   leads: ${regularLeads.length} leads`);

    if (insuranceLeads.length > 0) {
        console.log('   Sample insurance_leads:', insuranceLeads.slice(0, 3).map(l => l.name));
    }
    if (regularLeads.length > 0) {
        console.log('   Sample leads:', regularLeads.slice(0, 3).map(l => l.name));
    }

    return { insuranceLeads, regularLeads };
};

// Override the sync function to prevent it from clearing leads
const originalSyncVicidialLeads = window.syncVicidialLeads;
window.syncVicidialLeads = async function() {
    console.log('🚫 Intercepting Sync Vicidial - checking leads first...');

    // Check current leads before syncing
    const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    console.log(`📊 Current leads before sync: ${currentLeads.length}`);

    // If we have leads, ask user if they want to proceed
    if (currentLeads.length > 0) {
        const proceed = confirm(`You currently have ${currentLeads.length} leads. Syncing may affect your lead data. Do you want to proceed?`);
        if (!proceed) {
            console.log('🛑 User cancelled sync to preserve leads');
            return;
        }
    }

    // Call original sync function if user agrees or no leads exist
    if (originalSyncVicidialLeads) {
        console.log('🔄 Proceeding with original sync function...');
        const result = await originalSyncVicidialLeads();

        // After sync, reload leads to ensure they're displayed
        setTimeout(() => {
            console.log('🔄 Reloading leads after sync...');
            window.forceReloadLeads();
        }, 2000);

        return result;
    } else {
        console.log('⚠️  No original sync function found');
    }
};

// Add a button to the lead management view to force reload
function addForceReloadButton() {
    // Wait for the lead management view to load
    setTimeout(() => {
        const headerActions = document.querySelector('.content-header .header-actions');
        if (headerActions && !document.getElementById('forceReloadBtn')) {
            const reloadBtn = document.createElement('button');
            reloadBtn.id = 'forceReloadBtn';
            reloadBtn.className = 'btn-secondary';
            reloadBtn.style.marginLeft = '10px';
            reloadBtn.innerHTML = '<i class="fas fa-database"></i> Force Reload Leads';
            reloadBtn.onclick = () => {
                window.forceReloadLeads();
            };
            headerActions.appendChild(reloadBtn);
            console.log('✅ Added force reload button to header');
        }
    }, 1000);
}

// Monitor for lead management view loading
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            const leadsHeader = document.querySelector('.content-header h1');
            if (leadsHeader && leadsHeader.textContent.includes('Lead Management')) {
                addForceReloadButton();
            }
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Auto-check leads when this script loads
setTimeout(() => {
    console.log('🔍 Auto-checking leads status...');
    window.checkCurrentLeads();

    // If no leads found, automatically try to reload
    const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    if (currentLeads.length === 0) {
        console.log('📭 No leads found in localStorage, attempting auto-reload...');
        window.forceReloadLeads();
    }

    // Also check and reload certificate holders
    autoCheckCertificateHolders();
}, 2000);

// Function to auto-check and reload certificate holders
async function autoCheckCertificateHolders() {
    try {
        console.log('📋 Auto-checking certificate holders...');

        const currentHolders = JSON.parse(localStorage.getItem('certificate_holders') || '{}');
        const totalHolders = Object.keys(currentHolders).reduce((total, key) => {
            return total + (currentHolders[key] ? currentHolders[key].length : 0);
        }, 0);

        console.log(`💾 Found ${totalHolders} certificate holders in localStorage`);

        // If few or no holders, try to load from server
        if (totalHolders === 0) {
            console.log('📭 No certificate holders in localStorage, loading from server...');
            if (window.loadCertificateHoldersFromServer) {
                await window.loadCertificateHoldersFromServer();
            }
        }
    } catch (error) {
        console.error('❌ Error checking certificate holders:', error);
    }
}

// Function to force refresh certificate holders data
window.forceRefreshCertificateHolders = async function() {
    console.log('🔄 Force refreshing certificate holders...');

    // Clear localStorage
    localStorage.removeItem('certificate_holders');
    console.log('✅ Cleared certificate holders localStorage');

    // Reload from server
    if (window.loadCertificateHoldersFromServer) {
        try {
            await window.loadCertificateHoldersFromServer();
            console.log('✅ Reloaded certificate holders from server');

            // Show notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-weight: 500;
            `;
            notification.innerHTML = '<i class="fas fa-check-circle"></i> Certificate holders refreshed from server';
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);

        } catch (error) {
            console.error('❌ Error refreshing certificate holders:', error);
        }
    }
};

console.log('✅ Lead display fix loaded. Available functions:');
console.log('   - window.forceReloadLeads() - Force reload from database');
console.log('   - window.checkCurrentLeads() - Check current localStorage data');
console.log('   - window.forceRefreshCertificateHolders() - Force refresh certificate holders');

<system-reminder>
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Also consider cleaning up the todo list if has become stale and no longer matches what you are working on. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.


Here are the existing contents of your todo list:

[1. [completed] Investigate missing leads in lead management tab
2. [completed] Check what Sync Vicidial button does to leads data
3. [in_progress] Restore leads data if possible]
</system-reminder>