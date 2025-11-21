// Debug Lead Not Found Issues
console.log('Debug script loaded to investigate "lead not found" issues');

// Override viewLead to debug the issue
(function() {
    const originalViewLead = window.viewLead;

    window.viewLead = function(leadId) {
        console.log('🔍 DEBUG: viewLead called with:', leadId, '(type:', typeof leadId, ')');

        // Get all leads from different sources
        const localStorageLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadsAlt = JSON.parse(localStorage.getItem('leads') || '[]');

        console.log('📊 LocalStorage insurance_leads count:', localStorageLeads.length);
        console.log('📊 LocalStorage leads count:', leadsAlt.length);

        // Log first few lead IDs for comparison
        console.log('🔍 First 5 insurance_leads IDs:', localStorageLeads.slice(0, 5).map(l => ({ id: l.id, type: typeof l.id, name: l.name })));

        // Try to find the lead with different ID matching strategies
        let foundLead = null;
        let searchStrategy = null;

        // Strategy 1: Exact string match
        foundLead = localStorageLeads.find(l => String(l.id) === String(leadId));
        if (foundLead) {
            searchStrategy = 'exact string match';
        }

        // Strategy 2: Exact match without conversion
        if (!foundLead) {
            foundLead = localStorageLeads.find(l => l.id === leadId);
            if (foundLead) {
                searchStrategy = 'exact match no conversion';
            }
        }

        // Strategy 3: Check both integer and string versions
        if (!foundLead) {
            const numericId = parseInt(leadId);
            foundLead = localStorageLeads.find(l => l.id === numericId || l.id === String(numericId));
            if (foundLead) {
                searchStrategy = 'numeric conversion match';
            }
        }

        // Strategy 4: Try alternative leads storage
        if (!foundLead && leadsAlt.length > 0) {
            foundLead = leadsAlt.find(l => String(l.id) === String(leadId));
            if (foundLead) {
                searchStrategy = 'alternative storage exact match';
            }
        }

        if (!foundLead) {
            console.error('❌ LEAD NOT FOUND with ID:', leadId);
            console.log('🔍 Searching for partial matches...');

            // Look for any leads that might match partially
            const partialMatches = localStorageLeads.filter(l => {
                return String(l.id).includes(String(leadId)) ||
                       String(leadId).includes(String(l.id)) ||
                       l.name.toLowerCase().includes('fast arrow') ||
                       l.name.toLowerCase().includes('pinpoint') ||
                       l.name.toLowerCase().includes('bma capital');
            });

            console.log('🔍 Partial matches found:', partialMatches.map(l => ({ id: l.id, name: l.name })));

            // Try to fetch from server
            console.log('🌐 Attempting to fetch lead from server...');
            fetchLeadFromServer(leadId).then(serverLead => {
                if (serverLead) {
                    console.log('✅ Found lead on server:', serverLead);
                    // Add to localStorage and show profile
                    localStorageLeads.push(serverLead);
                    localStorage.setItem('insurance_leads', JSON.stringify(localStorageLeads));

                    // Now try to show the profile
                    if (window.showLeadProfile) {
                        window.showLeadProfile(leadId);
                    }
                } else {
                    alert('Lead not found. The lead may have been deleted or there may be a data synchronization issue.');
                }
            }).catch(error => {
                console.error('Server fetch failed:', error);
                alert('Lead not found in local storage or on server. Please refresh the page to sync data.');
            });

            return; // Don't call original function
        }

        console.log('✅ LEAD FOUND using strategy:', searchStrategy);
        console.log('📝 Lead details:', { id: foundLead.id, name: foundLead.name, stage: foundLead.stage });

        // Call the original function or showLeadProfile
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        } else if (originalViewLead) {
            originalViewLead.call(this, leadId);
        } else {
            console.error('No lead profile function available!');
        }
    };

    // Function to fetch lead from server
    async function fetchLeadFromServer(leadId) {
        try {
            const response = await fetch(`http://localhost:3001/api/leads/${leadId}`);
            if (response.ok) {
                const data = await response.json();
                return data.lead || data;
            }
        } catch (error) {
            console.error('Failed to fetch from server:', error);
        }
        return null;
    }

    console.log('🔧 Lead not found debug override installed');
})();

// Also add a function to manually sync leads
window.debugSyncLeads = function() {
    console.log('🔄 Manually syncing leads from server...');

    fetch('http://localhost:3001/api/leads')
        .then(response => response.json())
        .then(data => {
            console.log('📥 Received leads from server:', data.length || 'unknown count');

            if (data.leads && Array.isArray(data.leads)) {
                localStorage.setItem('insurance_leads', JSON.stringify(data.leads));
                console.log('✅ Leads synced to localStorage');
                location.reload(); // Reload page to show updated data
            } else if (Array.isArray(data)) {
                localStorage.setItem('insurance_leads', JSON.stringify(data));
                console.log('✅ Leads synced to localStorage');
                location.reload();
            } else {
                console.error('Unexpected data format:', data);
            }
        })
        .catch(error => {
            console.error('❌ Failed to sync leads:', error);
        });
};

// Run sync on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🔄 Auto-syncing leads on page load...');
        window.debugSyncLeads();
    }, 2000);
});