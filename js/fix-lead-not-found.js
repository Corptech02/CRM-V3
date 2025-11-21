// FIX FOR LEAD NOT FOUND ERROR
// Ensure leads list only shows leads that actually exist

(function() {
    'use strict';

    console.log('🔧 FIX-LEAD-NOT-FOUND: Initializing...');

    // Override the renderLeads function to only show valid leads
    const originalRenderLeads = window.renderLeads;
    window.renderLeads = function(leads) {
        console.log(`🔍 Validating ${leads.length} leads before rendering...`);

        // Get actual storage data
        const storedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const storedLeads2 = JSON.parse(localStorage.getItem('leads') || '[]');

        // Create a map of all valid lead IDs
        const validIds = new Set();
        [...storedLeads, ...storedLeads2].forEach(lead => {
            if (!lead.archived) {
                validIds.add(String(lead.id));
            }
        });

        // Filter leads to only include those that exist in storage
        const validLeads = leads.filter(lead => {
            const exists = validIds.has(String(lead.id));
            if (!exists) {
                console.warn(`❌ Removing non-existent lead from list: ${lead.name} (ID: ${lead.id})`);
            }
            return exists;
        });

        console.log(`✅ Showing ${validLeads.length} valid leads (removed ${leads.length - validLeads.length} invalid)`);

        // Call original function with filtered leads
        if (originalRenderLeads) {
            return originalRenderLeads.call(this, validLeads);
        }

        // Fallback if original doesn't exist
        return renderLeadsTable(validLeads);
    };

    // Override viewLead to handle both number and string IDs
    const originalViewLead = window.viewLead;
    window.viewLead = function(leadId) {
        // Ensure leadId is a string for consistent comparison
        leadId = String(leadId);

        console.log(`👀 Attempting to view lead with ID: ${leadId}`);

        // Try to find lead in both storage keys
        let allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let lead = allLeads.find(l => String(l.id) === leadId);

        if (!lead) {
            allLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            lead = allLeads.find(l => String(l.id) === leadId);
        }

        if (!lead) {
            console.error(`❌ Lead not found: ${leadId}`);

            // Instead of showing error, try to reload leads and find it again
            console.log('🔄 Attempting to sync and find lead...');

            // Sync storage
            syncLeadStorageNow();

            // Try one more time
            allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            lead = allLeads.find(l => String(l.id) === leadId);

            if (!lead) {
                // Remove this lead from the view since it doesn't exist
                console.log('🗑️ Lead truly does not exist, refreshing view...');
                loadLeadsView();
                return;
            }
        }

        // Lead found, proceed with viewing
        console.log(`✅ Lead found: ${lead.name}`);

        // Use the enhanced profile if available
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        } else if (originalViewLead) {
            originalViewLead.call(this, leadId);
        }
    };

    // Sync function to ensure storage consistency
    function syncLeadStorageNow() {
        console.log('🔄 SYNCING LEAD STORAGE...');

        const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');

        // Create map of all non-archived leads
        const allLeadsMap = new Map();

        // Process insurance_leads first (primary)
        insuranceLeads.forEach(lead => {
            if (!lead.archived) {
                // Ensure ID is consistent
                lead.id = String(lead.id);
                allLeadsMap.set(lead.id, lead);
            }
        });

        // Add any missing from regular leads
        regularLeads.forEach(lead => {
            if (!lead.archived && !allLeadsMap.has(String(lead.id))) {
                lead.id = String(lead.id);
                allLeadsMap.set(lead.id, lead);
            }
        });

        // Convert back to array
        const syncedLeads = Array.from(allLeadsMap.values());

        console.log(`✅ Synced ${syncedLeads.length} active leads`);

        // Save to both keys with consistent IDs
        localStorage.setItem('insurance_leads', JSON.stringify(syncedLeads));
        localStorage.setItem('leads', JSON.stringify(syncedLeads));

        return syncedLeads;
    }

    // Run initial sync
    syncLeadStorageNow();

    // Also fix the renderLeadsTable function to ensure consistent IDs
    const originalRenderLeadsTable = window.renderLeadsTable;
    window.renderLeadsTable = function(leads) {
        if (!leads || leads.length === 0) {
            return '<tr><td colspan="10" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
        }

        // Ensure all lead IDs are strings in the onclick handlers
        return leads.map(lead => {
            // Ensure ID is string
            lead.id = String(lead.id);

            const displayName = lead.name && lead.name.length > 15 ?
                lead.name.substring(0, 15) + '...' : lead.name || '';

            return `
                <tr>
                    <td>
                        <input type="checkbox" class="lead-checkbox" value="${lead.id}" data-lead='${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                    </td>
                    <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                onclick="viewLead('${lead.id}')" title="${lead.name}">${displayName}</strong>
                    </td>
                    <td>
                        <div class="contact-info" style="display: flex; gap: 10px; align-items: center;">
                            <a href="tel:${lead.phone}" title="${lead.phone}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-phone"></i>
                            </a>
                            <a href="mailto:${lead.email}" title="${lead.email}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </td>
                    <td>${lead.product}</td>
                    <td>$${(lead.premium || 0).toLocaleString()}</td>
                    <td>${window.getStageHtml ? window.getStageHtml(lead.stage) : lead.stage}</td>
                    <td>${lead.renewalDate || 'N/A'}</td>
                    <td>${lead.assignedTo || 'Unassigned'}</td>
                    <td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="viewLead('${lead.id}')" title="View Lead">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="archiveLead('${lead.id}')" title="Archive Lead" style="color: #f59e0b;">
                                <i class="fas fa-archive"></i>
                            </button>
                            <button class="btn-icon" onclick="convertLead('${lead.id}')" title="Convert to Client">
                                <i class="fas fa-user-check"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Monitor for any lead view clicks
    document.addEventListener('click', function(e) {
        // Check if clicked element has onclick with viewLead
        const onclick = e.target.getAttribute('onclick');
        if (onclick && onclick.includes('viewLead')) {
            console.log('📍 Lead view click detected:', onclick);
        }
    }, true);

    console.log('✅ FIX-LEAD-NOT-FOUND: Initialized successfully');

    // Expose sync function globally
    window.syncLeadStorageNow = syncLeadStorageNow;
})();