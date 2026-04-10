/**
 * Enhanced Lead Management System
 * Adds proper DELETE functionality alongside existing ARCHIVE system
 * Provides separate buttons for ARCHIVE vs DELETE operations
 */

(function() {
    console.log('🔧 Enhanced Lead Management System initializing...');
    console.log('📍 Script location: enhanced-lead-management.js');
    console.log('🕐 Load time:', new Date().toISOString());

    // Permanent DELETE function for complete server removal
    window.permanentlyDeleteActiveLead = function(leadId) {
        if (!confirm('⚠️ PERMANENT DELETE WARNING ⚠️\n\nThis will completely and permanently delete this lead from the server database. This action CANNOT be undone.\n\nAre you absolutely sure you want to permanently delete this lead?')) {
            return;
        }

        console.log('🗑️ Permanently deleting active lead:', leadId);

        // First remove from localStorage
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

        let lead = null;
        if (leadIndex === -1) {
            console.warn('Lead not found in localStorage, forcing server deletion:', leadId);
            // Lead might be stale in display but deleted from storage, force server deletion
            lead = { id: leadId, name: 'Unknown' }; // Create minimal lead object for deletion
        } else {
            // Get lead before removing it
            lead = leads[leadIndex];
            leads.splice(leadIndex, 1);
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            console.log('✅ Lead removed from localStorage:', leadId);
        }

        console.log('Lead to permanently delete:', lead);

        // Add to deleted lead IDs to prevent re-addition
        const deletedLeadIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
        if (!deletedLeadIds.includes(String(leadId))) {
            deletedLeadIds.push(String(leadId));
            localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedLeadIds));
        }

        // Mark as user-deleted to bypass ViciDial protection
        const userDeletedLeads = JSON.parse(localStorage.getItem('USER_DELETED_LEADS') || '[]');
        if (!userDeletedLeads.includes(String(leadId))) {
            userDeletedLeads.push(String(leadId));
            localStorage.setItem('USER_DELETED_LEADS', JSON.stringify(userDeletedLeads));
            console.log('🏷️ Marked as user-deleted to bypass ViciDial protection:', leadId);
        }

        // Record deletion timestamp for smart ViciDial protection
        const deletedLeadTimestamps = JSON.parse(localStorage.getItem('DELETED_LEAD_TIMESTAMPS') || '{}');
        deletedLeadTimestamps[String(leadId)] = Date.now();
        localStorage.setItem('DELETED_LEAD_TIMESTAMPS', JSON.stringify(deletedLeadTimestamps));
        console.log('⏰ Recorded deletion timestamp for:', leadId);

        // Delete from server permanently
        fetch(`/api/leads/${leadId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                console.log('✅ Lead permanently deleted from server:', leadId);
                showNotification(`Lead "${lead.name}" permanently deleted from server`, 'success');
            } else {
                console.warn('⚠️ Server deletion failed:', response.status, response.statusText);
                showNotification('Server deletion failed - lead removed locally', 'warning');
            }
        })
        .catch(error => {
            console.error('❌ Error deleting lead from server:', error);
            showNotification('Error deleting from server - lead removed locally', 'warning');
        });

        // Force clear cache and update UI - full refresh to avoid table corruption
        setTimeout(() => {
            localStorage.removeItem('insurance_leads');
            localStorage.removeItem('insurance_clients');
            console.log('🧹 Cleared localStorage cache after individual deletion');

            if (typeof loadLeadsView === 'function') {
                loadLeadsView();
                console.log('✅ Full leads view refreshed after deletion');
            } else {
                // Fallback: regenerate table content properly
                updateLeadsTableAfterDeletion(leadId);
            }
        }, 50);
    };

    // Mass delete function for selected leads
    window.massDeleteLeads = function() {
        const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
        const selectedLeadIds = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (selectedLeadIds.length === 0) {
            showNotification('No leads selected for deletion', 'warning');
            return;
        }

        if (!confirm(`⚠️ MASS PERMANENT DELETE WARNING ⚠️\n\nThis will permanently delete ${selectedLeadIds.length} lead(s) from the server database. This action CANNOT be undone.\n\nAre you absolutely sure you want to permanently delete these ${selectedLeadIds.length} leads?`)) {
            return;
        }

        console.log(`🗑️ Mass deleting ${selectedLeadIds.length} leads:`, selectedLeadIds);

        // IMMEDIATE LOCAL DELETION - Don't wait for server
        let successfulLocalDeletes = 0;
        const totalToDelete = selectedLeadIds.length;

        // First, delete all leads from localStorage immediately
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const deletedLeadIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');

        selectedLeadIds.forEach(leadId => {
            const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
            if (leadIndex !== -1) {
                console.log(`🗑️ Removing lead ${leadId} from localStorage`);
                leads.splice(leadIndex, 1);
                successfulLocalDeletes++;

                // Add to deleted lead IDs
                if (!deletedLeadIds.includes(String(leadId))) {
                    deletedLeadIds.push(String(leadId));
                }
            } else {
                console.warn(`⚠️ Lead ${leadId} not found in localStorage`);
            }
        });

        // Save updated localStorage immediately
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedLeadIds));

        // Mark all as user-deleted to bypass ViciDial protection
        const userDeletedLeads = JSON.parse(localStorage.getItem('USER_DELETED_LEADS') || '[]');
        selectedLeadIds.forEach(leadId => {
            if (!userDeletedLeads.includes(String(leadId))) {
                userDeletedLeads.push(String(leadId));
            }
        });
        localStorage.setItem('USER_DELETED_LEADS', JSON.stringify(userDeletedLeads));
        console.log('🏷️ Marked as user-deleted to bypass ViciDial protection:', selectedLeadIds);

        // Record deletion timestamps for smart ViciDial protection
        const deletedLeadTimestamps = JSON.parse(localStorage.getItem('DELETED_LEAD_TIMESTAMPS') || '{}');
        const now = Date.now();
        selectedLeadIds.forEach(leadId => {
            deletedLeadTimestamps[String(leadId)] = now;
        });
        localStorage.setItem('DELETED_LEAD_TIMESTAMPS', JSON.stringify(deletedLeadTimestamps));
        console.log('⏰ Recorded deletion timestamps for:', selectedLeadIds);

        console.log(`✅ Locally deleted ${successfulLocalDeletes}/${totalToDelete} leads`);

        // Show immediate success notification
        showNotification(`${successfulLocalDeletes} leads deleted locally`, 'success');

        // Refresh the view immediately
        setTimeout(() => {
            if (typeof loadLeadsView === 'function') {
                loadLeadsView();
                console.log('✅ Leads view refreshed after mass deletion');
            }
        }, 100);

        // Background server deletion — sequential with delays to avoid nginx rate limit (10r/s)
        (async () => {
            let serverDeletionCount = 0;
            for (const leadId of selectedLeadIds) {
                try {
                    const response = await fetch(`/api/leads/${leadId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    serverDeletionCount++;
                    if (response.ok) {
                        console.log('✅ Lead permanently deleted from server:', leadId);
                    } else {
                        console.warn('⚠️ Server deletion failed for lead:', leadId, response.status);
                    }
                } catch (error) {
                    serverDeletionCount++;
                    console.error('❌ Error deleting lead from server:', leadId, error.message);
                }
                await new Promise(r => setTimeout(r, 120)); // ~8 req/s, under nginx 10r/s limit
            }
            console.log(`✅ Server deletion complete: ${serverDeletionCount}/${selectedLeadIds.length} processed`);
        })();
    };

    // Mass archive function for selected leads
    window.massArchiveLeads = async function() {
        const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
        const selectedLeadIds = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (selectedLeadIds.length === 0) {
            showNotification('No leads selected for archiving', 'warning');
            return;
        }

        if (!confirm(`Archive ${selectedLeadIds.length} selected lead(s)? Archived leads can be restored later.`)) {
            return;
        }

        console.log(`📦 Mass archiving ${selectedLeadIds.length} leads:`, selectedLeadIds);

        const u = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
        const archivedBy = u.username
            ? u.username.charAt(0).toUpperCase() + u.username.slice(1).toLowerCase()
            : 'System';

        const results = await Promise.all(selectedLeadIds.map(id =>
            fetch(`/api/archive-lead/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archivedBy })
            }).then(r => r.json()).catch(() => ({ success: false }))
        ));

        const ok = results.filter(r => r.success).length;
        const failed = results.length - ok;

        // Remove ALL selected leads from localStorage regardless of server result.
        // Leads that got 404 (localStorage-only, not in server DB) need to be cleared too.
        // Leads that succeeded are now in archived_leads on server; ViciDial sync is blocked from re-inserting them.
        try {
            const allSelectedIds = new Set(selectedLeadIds.map(String));
            const stored = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const filtered = stored.filter(l => !allSelectedIds.has(String(l.id)));
            localStorage.setItem('insurance_leads', JSON.stringify(filtered));
        } catch(e) {}

        if (ok > 0 || failed < selectedLeadIds.length) {
            const msg = ok > 0
                ? `${ok} lead(s) archived successfully${failed ? ` (${failed} not found on server — removed locally)` : ''}`
                : `${failed} lead(s) removed from local list (not found on server)`;
            showNotification(msg, ok > 0 ? 'success' : 'warning');
            if (typeof window.loadLeadsView === 'function') {
                window.loadLeadsView();
            }
        } else {
            showNotification('Failed to archive leads. Please try again.', 'error');
        }
    };

    // Helper function to update table after deletion
    function updateLeadsTableAfterDeletion(deletedLeadId) {
        console.log('🔄 Updating table after deletion:', deletedLeadId);
        const leadsTableBody = document.getElementById('leadsTableBody');

        if (leadsTableBody) {
            // Get updated leads list (excluding deleted lead)
            const updatedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            console.log('📊 Updated leads count:', updatedLeads.length);

            // Regenerate the entire table body to ensure proper structure
            if (typeof generateSimpleLeadRows === 'function') {
                const newTableHTML = generateSimpleLeadRows(updatedLeads);
                console.log('📝 Generated HTML sample:', newTableHTML.substring(0, 200) + '...');

                // Count columns in first row to verify structure
                const firstRowMatch = newTableHTML.match(/<tr[^>]*>(.*?)<\/tr>/s);
                if (firstRowMatch) {
                    const columnCount = (firstRowMatch[1].match(/<td/g) || []).length;
                    console.log('📊 Column count in generated row:', columnCount);
                    console.log('📊 Expected column count: 11');

                    if (columnCount !== 11 && !firstRowMatch[1].includes('colspan')) {
                        console.warn('⚠️ COLUMN MISMATCH! Expected 11, got', columnCount);
                    }
                }

                leadsTableBody.innerHTML = newTableHTML;
                console.log('✅ Table body regenerated with', updatedLeads.length, 'leads');

                // Check for layout issues after regeneration
                setTimeout(() => {
                    const table = leadsTableBody.closest('table');
                    if (table) {
                        console.log('📏 Table width after regeneration:', table.offsetWidth + 'px');
                        console.log('📏 Table scroll width:', table.scrollWidth + 'px');
                        console.log('📏 Table overflow:', table.scrollWidth > table.offsetWidth ? 'YES' : 'NO');

                        // Force complete table recalculation and redraw
                        table.style.display = 'none';
                        table.offsetHeight; // Trigger reflow
                        table.style.display = '';

                        // Force table layout recalculation
                        table.style.tableLayout = 'fixed';
                        table.style.width = '100%';

                        // CRITICAL: Clear any residual background or layout artifacts
                        const container = table.closest('.data-table-container');
                        if (container) {
                            container.style.width = '100%';
                            container.style.maxWidth = '100%';
                            container.style.overflow = 'hidden';
                            // Force container reflow
                            container.offsetWidth;
                        }

                        // Ensure all table cells are properly reset
                        const allCells = table.querySelectorAll('td, th');
                        allCells.forEach(cell => {
                            cell.style.background = '';
                            cell.style.backgroundColor = '';
                        });


                        // Check row consistency
                        const headerCells = table.querySelectorAll('thead th').length;
                        const firstRowCells = table.querySelectorAll('tbody tr:first-child td').length;
                        console.log('📊 Header cells:', headerCells, 'Body cells:', firstRowCells);

                        if (headerCells !== firstRowCells && firstRowCells > 0) {
                            console.warn('⚠️ Column count mismatch detected! Forcing full view reload...');
                            setTimeout(() => {
                                if (typeof loadLeadsView === 'function') {
                                    loadLeadsView();
                                }
                            }, 50);
                        }
                    }
                }, 50);
            } else if (typeof generateSimpleLeadRowsWithDividers === 'function') {
                const newTableHTML = generateSimpleLeadRowsWithDividers(updatedLeads);
                leadsTableBody.innerHTML = newTableHTML;
                console.log('✅ Table body regenerated with dividers');
            } else {
                console.warn('⚠️ No table generation function available, falling back to row removal');
                // Fallback: just remove the specific row
                const leadRows = leadsTableBody.querySelectorAll('tr');
                leadRows.forEach(row => {
                    const checkbox = row.querySelector('.lead-checkbox');
                    if (checkbox && checkbox.value === String(deletedLeadId)) {
                        row.remove();
                        console.log('🗑️ Removed deleted lead row:', deletedLeadId);
                    }
                });
            }

            // Update bulk actions visibility after table update
            if (typeof updateBulkActionsVisibility === 'function') {
                updateBulkActionsVisibility();
            }
        } else {
            console.warn('⚠️ leadsTableBody not found');
        }
    }

    // Enhanced action buttons generation for leads
    window.generateLeadActionButtons = function(leadId) {
        return `
            <div class="action-buttons">
                <button class="btn-icon" onclick="viewLead('${leadId}')" title="View Lead Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="archiveLead('${leadId}')" title="Archive Lead" style="color: #f59e0b;">
                    <i class="fas fa-archive"></i>
                </button>
                <button class="btn-icon btn-icon-danger" onclick="permanentlyDeleteActiveLead('${leadId}')" title="Delete Permanently" style="color: #ef4444;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    };

    // Enhanced bulk action buttons - simplified version
    window.generateBulkActionButtons = function() {
        const bulkHTML = '<div class="bulk-actions" id="leadBulkActions" style="display: none; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">' +
            '<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">' +
                '<span id="selectedCount" style="font-weight: 600; color: #374151;">0 leads selected</span>' +
                '<button onclick="massArchiveLeads()" style="background: #f59e0b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">' +
                    '<i class="fas fa-archive"></i> Archive Selected' +
                '</button>' +
                '<button onclick="massDeleteLeads()" style="background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">' +
                    '<i class="fas fa-trash"></i> Delete Selected' +
                '</button>' +
                '<div class="stage-change-container" style="display: flex; align-items: center; gap: 0.5rem;">' +
                    '<button id="stageChangeBtn" onclick="toggleStageSelection()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">' +
                        '<i class="fas fa-tasks"></i> Change Stage' +
                    '</button>' +
                    '<div id="stageDropdownContainer" style="display: none; position: relative;">' +
                        '<select id="bulkStageSelect" style="padding: 0.5rem; border-radius: 6px; border: 1px solid #d1d5db; background: white;">' +
                            '<option value="">Select Stage...</option>' +
                            '<option value="new">New</option>' +
                            '<option value="contact_attempted">Contact Attempted</option>' +
                            '<option value="info_requested">Info Requested</option>' +
                            '<option value="info_received">Info Received</option>' +
                            '<option value="loss_runs_requested">Loss Runs Requested</option>' +
                            '<option value="loss_runs_received">Loss Runs Received</option>' +
                            '<option value="app_prepared">App Prepared</option>' +
                            '<option value="app_sent">Waiting on Markets</option>' +
                            '<option value="app_quote_received">App Quote Received</option>' +
                            '<option value="app_quote_sent">App Quote Sent</option>' +
                            '<option value="quoted">Quoted</option>' +
                            '<option value="quote_sent">Quote Sent</option>' +
                            '<option value="quote-sent-unaware">Quote Sent (Unaware)</option>' +
                            '<option value="quote-sent-aware">Quote Sent (Aware)</option>' +
                            '<option value="interested">Interested</option>' +
                            '<option value="not-interested">Not Interested</option>' +
                            '<option value="closed">Closed</option>' +
                        '</select>' +
                        '<button onclick="applyBulkStageChange()" style="background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-left: 0.5rem;">' +
                            'Apply' +
                        '</button>' +
                        '<button onclick="cancelStageSelection()" style="background: #6b7280; color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; margin-left: 0.25rem;">' +
                            '×' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<button onclick="clearSelection()" style="background: #6b7280; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">' +
                    'Clear Selection' +
                '</button>' +
            '</div>' +
        '</div>';

        console.log('📝 Generated bulk actions HTML:', bulkHTML.length, 'characters');
        return bulkHTML;
    };

    // Stage selection functions
    window.toggleStageSelection = function() {
        const container = document.getElementById('stageDropdownContainer');
        const button = document.getElementById('stageChangeBtn');

        if (container) {
            const isHidden = container.style.display === 'none';
            container.style.display = isHidden ? 'flex' : 'none';

            if (isHidden) {
                button.style.background = '#1d4ed8'; // Darker blue when active
                // Reset dropdown to default
                const select = document.getElementById('bulkStageSelect');
                if (select) select.value = '';
            } else {
                button.style.background = '#3b82f6'; // Original blue
            }
        }
    };

    window.cancelStageSelection = function() {
        const container = document.getElementById('stageDropdownContainer');
        const button = document.getElementById('stageChangeBtn');

        if (container) {
            container.style.display = 'none';
            button.style.background = '#3b82f6'; // Reset to original blue

            // Reset dropdown
            const select = document.getElementById('bulkStageSelect');
            if (select) select.value = '';
        }
    };

    window.applyBulkStageChange = function() {
        const select = document.getElementById('bulkStageSelect');
        const selectedStage = select ? select.value : '';

        if (!selectedStage) {
            showNotification('Please select a stage', 'warning');
            return;
        }

        const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
        const selectedLeadIds = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (selectedLeadIds.length === 0) {
            showNotification('No leads selected for stage change', 'warning');
            return;
        }

        const stageText = select.options[select.selectedIndex].text;

        if (!confirm(`Change stage to "${stageText}" for ${selectedLeadIds.length} selected lead(s)?`)) {
            return;
        }

        console.log(`📋 Bulk changing stage to "${selectedStage}" for ${selectedLeadIds.length} leads:`, selectedLeadIds);

        massBulkStageChange(selectedLeadIds, selectedStage, stageText);

        // Hide dropdown after applying
        cancelStageSelection();
    };

    // Mass stage change function
    window.massBulkStageChange = function(leadIds, newStage, stageText) {
        console.log(`🔄 Mass stage change to "${newStage}" for leads:`, leadIds);

        let updateCount = 0;
        const totalToUpdate = leadIds.length;

        leadIds.forEach(leadId => {
            // Update localStorage
            let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

            if (leadIndex !== -1) {
                const lead = leads[leadIndex];
                const oldStage = lead.stage || 'new';

                // Update stage
                lead.stage = newStage;
                lead.stageUpdatedAt = new Date().toISOString();

                // Initialize or update stage timestamps
                if (!lead.stageTimestamps) {
                    lead.stageTimestamps = {};
                }
                lead.stageTimestamps[newStage] = lead.stageUpdatedAt;

                leads[leadIndex] = lead;
                localStorage.setItem('insurance_leads', JSON.stringify(leads));

                // Update server
                fetch(`/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: leadId,
                        stage: newStage,
                        stageUpdatedAt: lead.stageUpdatedAt,
                        stageTimestamps: lead.stageTimestamps
                    })
                })
                .then(response => {
                    updateCount++;
                    if (response.ok) {
                        console.log(`✅ Stage updated on server for lead ${leadId}: ${oldStage} → ${newStage}`);
                    } else {
                        console.warn(`⚠️ Server update failed for lead ${leadId}`);
                    }

                    // Check if all updates are complete
                    if (updateCount === totalToUpdate) {
                        showNotification(`Stage changed to "${stageText}" for ${totalToUpdate} leads`, 'success');

                        // Refresh the view to show updated stages
                        setTimeout(() => {
                            if (typeof loadLeadsView === 'function') {
                                loadLeadsView();
                                console.log('✅ Leads view refreshed after bulk stage change');
                            }

                            // Clear selection after refresh
                            setTimeout(() => {
                                clearSelection();
                            }, 500);
                        }, 200);
                    }
                })
                .catch(error => {
                    updateCount++;
                    console.error('❌ Error updating stage on server for lead:', leadId, error);

                    if (updateCount === totalToUpdate) {
                        showNotification(`Stage changed locally for ${totalToUpdate} leads (some server errors)`, 'warning');

                        // Still refresh the view
                        setTimeout(() => {
                            if (typeof loadLeadsView === 'function') {
                                loadLeadsView();
                                console.log('✅ Leads view refreshed after bulk stage change (with errors)');
                            }

                            // Clear selection after refresh
                            setTimeout(() => {
                                clearSelection();
                            }, 500);
                        }, 200);
                    }
                });
            } else {
                console.warn('⚠️ Lead not found for stage update:', leadId);
                updateCount++;

                // Still check if all updates are done
                if (updateCount === totalToUpdate) {
                    showNotification(`Stage update completed with some errors`, 'warning');
                }
            }
        });
    };

    // Selection management functions
    window.clearSelection = function() {
        const checkboxes = document.querySelectorAll('.lead-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        updateBulkActionsVisibility();

        // Also hide stage selection if visible
        cancelStageSelection();
    };

    window.updateBulkActionsVisibility = function() {
        console.log('🔍 updateBulkActionsVisibility called');
        const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
        console.log('📊 Selected checkboxes:', selectedCheckboxes.length);

        let bulkActions = document.querySelector('.bulk-actions') || document.getElementById('leadBulkActions');
        console.log('📋 Bulk actions element found:', !!bulkActions);

        // If bulk actions don't exist, try to create them
        if (!bulkActions) {
            console.log('🔨 Creating bulk actions element...');

            // Try multiple possible container selectors
            const leadsTable = document.querySelector('.data-table-container') ||
                              document.querySelector('.leads-table') ||
                              document.querySelector('.data-table') ||
                              document.querySelector('#leadsTable') ||
                              document.querySelector('.leads-view .table');

            console.log('📊 Found table container:', !!leadsTable);

            if (leadsTable) {
                // Try inserting before the table container, or before the table itself
                const insertTarget = leadsTable.closest('.data-table-container') || leadsTable.parentElement || leadsTable;
                console.log('📍 Insert target:', insertTarget?.className || insertTarget?.tagName);

                const bulkHTML = generateBulkActionButtons();
                insertTarget.insertAdjacentHTML('beforebegin', bulkHTML);

                // Check multiple ways to find the element
                bulkActions = document.querySelector('.bulk-actions') || document.getElementById('leadBulkActions');
                console.log('✅ Bulk actions created:', !!bulkActions);

                if (!bulkActions) {
                    console.log('🔍 DOM check - all .bulk-actions:', document.querySelectorAll('.bulk-actions').length);
                    console.log('🔍 DOM check - leadBulkActions ID:', !!document.getElementById('leadBulkActions'));
                    console.log('🔍 DOM check - inserted HTML preview:', insertTarget.previousElementSibling?.className);
                }
            } else {
                // Fallback: try to find any table and insert before its parent
                const anyTable = document.querySelector('table');
                if (anyTable) {
                    console.log('🔄 Fallback: Using any table found');
                    const bulkHTML = generateBulkActionButtons();
                    anyTable.parentElement.insertAdjacentHTML('beforebegin', bulkHTML);
                    bulkActions = document.querySelector('.bulk-actions') || document.getElementById('leadBulkActions');
                    console.log('✅ Bulk actions created (fallback):', !!bulkActions);
                }
            }

            // Ultimate fallback: create the element programmatically
            if (!bulkActions) {
                console.log('🆘 Ultimate fallback: Creating element programmatically');
                bulkActions = document.createElement('div');
                bulkActions.className = 'bulk-actions';
                bulkActions.id = 'leadBulkActions';
                bulkActions.style.cssText = 'display: none; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;';

                const container = document.createElement('div');
                container.style.cssText = 'display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;';

                const countSpan = document.createElement('span');
                countSpan.id = 'selectedCount';
                countSpan.style.cssText = 'font-weight: 600; color: #374151;';
                countSpan.textContent = '0 leads selected';

                const archiveBtn = document.createElement('button');
                archiveBtn.onclick = () => massArchiveLeads();
                archiveBtn.style.cssText = 'background: #f59e0b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;';
                archiveBtn.innerHTML = '<i class="fas fa-archive"></i> Archive Selected';

                const deleteBtn = document.createElement('button');
                deleteBtn.onclick = () => massDeleteLeads();
                deleteBtn.style.cssText = 'background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Selected';

                // Stage change container
                const stageContainer = document.createElement('div');
                stageContainer.className = 'stage-change-container';
                stageContainer.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

                const stageBtn = document.createElement('button');
                stageBtn.id = 'stageChangeBtn';
                stageBtn.onclick = () => toggleStageSelection();
                stageBtn.style.cssText = 'background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;';
                stageBtn.innerHTML = '<i class="fas fa-tasks"></i> Change Stage';

                const dropdownContainer = document.createElement('div');
                dropdownContainer.id = 'stageDropdownContainer';
                dropdownContainer.style.cssText = 'display: none; position: relative;';

                const stageSelect = document.createElement('select');
                stageSelect.id = 'bulkStageSelect';
                stageSelect.style.cssText = 'padding: 0.5rem; border-radius: 6px; border: 1px solid #d1d5db; background: white;';

                const stages = [
                    {value: '', text: 'Select Stage...'},
                    {value: 'new', text: 'New'},
                    {value: 'contact_attempted', text: 'Contact Attempted'},
                    {value: 'info_requested', text: 'Info Requested'},
                    {value: 'info_received', text: 'Info Received'},
                    {value: 'loss_runs_requested', text: 'Loss Runs Requested'},
                    {value: 'loss_runs_received', text: 'Loss Runs Received'},
                    {value: 'app_prepared', text: 'App Prepared'},
                    {value: 'app_sent', text: 'Waiting on Markets'},
                    {value: 'app_quote_received', text: 'App Quote Received'},
                    {value: 'app_quote_sent', text: 'App Quote Sent'},
                    {value: 'quoted', text: 'Quoted'},
                    {value: 'quote_sent', text: 'Quote Sent'},
                    {value: 'quote-sent-unaware', text: 'Quote Sent (Unaware)'},
                    {value: 'quote-sent-aware', text: 'Quote Sent (Aware)'},
                    {value: 'interested', text: 'Interested'},
                    {value: 'not-interested', text: 'Not Interested'},
                    {value: 'closed', text: 'Closed'}
                ];

                stages.forEach(stage => {
                    const option = document.createElement('option');
                    option.value = stage.value;
                    option.textContent = stage.text;
                    stageSelect.appendChild(option);
                });

                const applyBtn = document.createElement('button');
                applyBtn.onclick = () => applyBulkStageChange();
                applyBtn.style.cssText = 'background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-left: 0.5rem;';
                applyBtn.textContent = 'Apply';

                const cancelBtn = document.createElement('button');
                cancelBtn.onclick = () => cancelStageSelection();
                cancelBtn.style.cssText = 'background: #6b7280; color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; margin-left: 0.25rem;';
                cancelBtn.textContent = '×';

                dropdownContainer.appendChild(stageSelect);
                dropdownContainer.appendChild(applyBtn);
                dropdownContainer.appendChild(cancelBtn);

                stageContainer.appendChild(stageBtn);
                stageContainer.appendChild(dropdownContainer);

                const clearBtn = document.createElement('button');
                clearBtn.onclick = () => clearSelection();
                clearBtn.style.cssText = 'background: #6b7280; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;';
                clearBtn.textContent = 'Clear Selection';

                container.appendChild(countSpan);
                container.appendChild(archiveBtn);
                container.appendChild(deleteBtn);
                container.appendChild(stageContainer);
                container.appendChild(clearBtn);
                bulkActions.appendChild(container);

                // Insert at the very top of the document body as last resort
                const leadsView = document.querySelector('.leads-view') || document.querySelector('.dashboard-content') || document.body;
                leadsView.insertBefore(bulkActions, leadsView.firstChild);

                console.log('🔥 Created bulk actions programmatically with stage change:', !!bulkActions);
            }
        }

        const selectedCount = document.getElementById('selectedCount');

        if (bulkActions) {
            if (selectedCheckboxes.length > 0) {
                bulkActions.style.display = 'block';
                console.log('👀 Showing bulk actions for', selectedCheckboxes.length, 'leads');
                if (selectedCount) {
                    selectedCount.textContent = `${selectedCheckboxes.length} lead${selectedCheckboxes.length !== 1 ? 's' : ''} selected`;
                }
            } else {
                bulkActions.style.display = 'none';
                console.log('🙈 Hiding bulk actions');
            }
        } else {
            console.warn('⚠️ Could not find or create bulk actions element');
        }
    };

    // Override the existing generateSimpleLeadRows to use enhanced action buttons
    const originalGenerateSimpleLeadRows = window.generateSimpleLeadRows;

    window.generateSimpleLeadRows = function(leads) {
        if (!leads || leads.length === 0) {
            return '<tr><td colspan="11" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
        }

        // Use the original function logic but replace action buttons
        const originalHTML = originalGenerateSimpleLeadRows(leads);

        // Replace the old action buttons with enhanced ones
        const enhancedHTML = originalHTML.replace(
            /<div class="action-buttons">.*?<\/div>/gs,
            (match, offset, string) => {
                // Extract lead ID from the surrounding context
                const beforeMatch = string.substring(0, offset);
                const leadIdMatch = beforeMatch.match(/data-lead-id="([^"]+)"/);
                if (leadIdMatch) {
                    const leadId = leadIdMatch[1];
                    return generateLeadActionButtons(leadId);
                }
                return match;
            }
        );

        return enhancedHTML;
    };

    // Add checkbox selection handling when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Add event delegation for checkbox changes
        document.addEventListener('change', function(e) {
            if (e.target.classList.contains('lead-checkbox')) {
                updateBulkActionsVisibility();
            }
        });
    });


    function getCurrentUser() {
        const userData = sessionStorage.getItem('vanguard_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                // Capitalize username to match assignedTo format (grant -> Grant)
                return user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
            } catch (e) {
                console.warn('Error parsing user data:', e);
            }
        }
        return '';
    }

    // DISABLED: "My Leads Only" toggle - now handled by my-leads-toggle-direct.js
    // window.myLeadsOnlyFilter = false; // Global state for the toggle

    function createMyLeadsToggle_DISABLED() {
        return `
            <div class="my-leads-toggle" style="display: flex; align-items: center; gap: 8px; margin-right: 15px;">
                <label class="toggle-switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                    <input type="checkbox" id="myLeadsToggle" onchange="toggleMyLeadsFilter(this.checked)" style="opacity: 0; width: 0; height: 0;">
                    <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; border-radius: 20px; transition: .4s;">
                        <span class="toggle-dot" style="position: absolute; content: ''; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; border-radius: 50%; transition: .4s;"></span>
                    </span>
                </label>
                <span style="font-weight: 500; color: #374151; font-size: 0.875rem; white-space: nowrap;">
                    <i class="fas fa-user" style="margin-right: 4px; color: #3b82f6;"></i>
                    My Leads
                </span>
                <span id="myLeadsCount" style="font-size: 0.75rem; color: #6b7280;"></span>
            </div>
            <style>
                .toggle-switch input:checked + .toggle-slider {
                    background-color: #3b82f6;
                }
                .toggle-switch input:checked + .toggle-slider .toggle-dot {
                    transform: translateX(20px);
                }
            </style>
        `;
    }

    window.toggleMyLeadsFilter = function(isEnabled) {
        // DISABLED - Using my-leads-toggle-direct.js instead
        console.log('ℹ️ Enhanced lead management toggle disabled - using my-leads-toggle-direct.js');
        return;
    };

    function filterLeadsTable() {
        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        const currentUser = getCurrentUser();
        const rows = tableBody.querySelectorAll('tr');

        if (!window.myLeadsOnlyFilter) {
            // Show all rows
            rows.forEach(row => {
                row.style.display = '';
            });
            return;
        }

        // Hide/show rows based on assigned user
        rows.forEach(row => {
            const assignedCell = row.querySelector('td:nth-child(9)'); // Assigned column
            if (assignedCell) {
                const assignedTo = assignedCell.textContent.trim();
                const isMyLead = assignedTo === currentUser || assignedTo === 'Unassigned';
                row.style.display = isMyLead ? '' : 'none';
            }
        });
    }

    function updateMyLeadsCount() {
        const countElement = document.getElementById('myLeadsCount');
        if (!countElement) return;

        if (!window.myLeadsOnlyFilter) {
            countElement.textContent = '';
            return;
        }

        const currentUser = getCurrentUser();
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]')
            .filter(lead => !lead.archived); // Only count active leads

        const myLeads = leads.filter(lead => {
            const assignedTo = lead.assignedTo || 'Unassigned';
            return assignedTo === currentUser || assignedTo === 'Unassigned';
        });

        countElement.textContent = `(${myLeads.length} of ${leads.length} leads)`;
    }

    // Function to add toggle to header actions
    function addToggleToHeaderActions() {
        // DISABLED - Using my-leads-toggle-direct.js instead to avoid conflicts
        console.log('ℹ️ Toggle creation disabled - using my-leads-toggle-direct.js');
        return;
    }

    // Override loadLeadsView to inject toggle directly into HTML generation
    const originalLoadLeadsView = window.loadLeadsView;
    window.loadLeadsView = async function() {
        console.log('🔄 Enhanced loadLeadsView with My Leads toggle');

        // Call original function first
        if (originalLoadLeadsView) {
            await originalLoadLeadsView();
        }

        // Add enhancements after table is built
        setTimeout(() => {
            // DISABLED: addToggleToHeaderActions(); // Add toggle to header actions
            // DISABLED: addMyLeadsToggleToTable();
            addBulkActionsToTable();
        }, 500); // Increased delay to ensure table is fully rendered
    };

    function addMyLeadsToggleToTable() {
        console.log('🔍 Looking for leads table to add toggle...');

        // Try multiple selectors to find the table
        const selectors = [
            '#leadsTable thead tr th:nth-child(2)', // Original leads table
            '.data-table thead tr th:nth-child(2)',  // General data table
            '.leads-view table thead tr th:nth-child(2)', // Table in leads view
            '#active-leads-tab table thead tr th:nth-child(2)' // Table in active tab
        ];

        let nameHeader = null;
        for (const selector of selectors) {
            nameHeader = document.querySelector(selector);
            if (nameHeader) {
                console.log('✅ Found name header with selector:', selector);
                break;
            }
        }

    }

    function addBulkActionsToTable() {
        const leadsView = document.querySelector('.leads-view');
        const leadsTable = document.querySelector('.data-table-container, #leadsTable, table');

        if (leadsView && leadsTable && !document.querySelector('.bulk-actions')) {
            // Insert bulk actions before the table
            leadsTable.insertAdjacentHTML('beforebegin', generateBulkActionButtons());
            console.log('✅ Bulk action buttons added to leads view');
        }
    }

    // Fallback: Watch for DOM changes to catch table creation
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Check if a leads table was added
                const addedNodes = Array.from(mutation.addedNodes);
                const hasLeadsTable = addedNodes.some(node =>
                    node.nodeType === 1 && (
                        node.querySelector && (
                            node.querySelector('#leadsTable') ||
                            node.querySelector('.data-table') ||
                            node.querySelector('.leads-view')
                        )
                    )
                );

                if (hasLeadsTable) {
                    console.log('🔄 Detected leads table creation, adding toggle...');
                    setTimeout(() => {
                        // DISABLED: addToggleToHeaderActions(); // Add toggle to header actions
                        // DISABLED: addMyLeadsToggleToTable();
                        addBulkActionsToTable();
                    }, 200);
                }
            }
        });
    });

    // Start observing
    if (typeof window !== 'undefined' && window.document) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('👁️ DOM observer started for leads table detection');
    }

    // Listen for hash changes to detect navigation to leads tab
    window.addEventListener('hashchange', function(e) {
        if (window.location.hash === '#leads') {
            console.log('🔄 Navigated to leads tab, checking for toggle...');
            setTimeout(() => {
                // DISABLED: addToggleToHeaderActions(); // Add toggle to header actions
                // DISABLED: addMyLeadsToggleToTable();
                addBulkActionsToTable();
            }, 1000); // Longer delay for navigation
        }
    });

    // Check immediately if we're already on leads page
    if (window.location.hash === '#leads') {
        console.log('🔄 Already on leads tab, checking for toggle...');
        setTimeout(() => {
            // DISABLED: addToggleToHeaderActions(); // Add toggle to header actions
            // DISABLED: addMyLeadsToggleToTable();
            addBulkActionsToTable();
        }, 2000);
    }

    // Toggle all leads selection
    window.toggleAllLeads = function() {
        const selectAll = document.getElementById('selectAll');
        const leadCheckboxes = document.querySelectorAll('.lead-checkbox');

        leadCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });

        updateBulkActionsVisibility();
    };

    // Override compatibility functions from app.js for seamless integration
    window.updateBulkDeleteButton = updateBulkActionsVisibility;

    // Fix the selectAll checkbox reference issue
    const originalToggleAllLeads = window.toggleAllLeads;
    window.toggleAllLeads = function() {
        console.log('🔄 toggleAllLeads called');
        const selectAllCheckbox = document.getElementById('selectAllLeads') || document.getElementById('selectAll');
        const leadCheckboxes = document.querySelectorAll('.lead-checkbox');

        console.log('📋 Select all checkbox:', !!selectAllCheckbox);
        console.log('📊 Lead checkboxes found:', leadCheckboxes.length);

        if (selectAllCheckbox && leadCheckboxes.length > 0) {
            console.log('✅ Setting all checkboxes to:', selectAllCheckbox.checked);
            leadCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateBulkActionsVisibility();
        } else {
            console.warn('⚠️ Missing select all checkbox or lead checkboxes');
        }
    };

    console.log('✅ Enhanced Lead Management System loaded');
    console.log('Available functions:');
    console.log('- permanentlyDeleteActiveLead(id) - Permanent server deletion');
    console.log('- massDeleteLeads() - Bulk permanent deletion');
    console.log('- massArchiveLeads() - Bulk archiving');
    console.log('- massBulkStageChange(ids, stage, stageText) - Bulk stage change');
    console.log('- toggleStageSelection() - Show/hide stage dropdown');
    console.log('- archiveLead(id) - Single lead archiving (existing)');

})();