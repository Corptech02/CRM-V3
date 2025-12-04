// NUCLEAR HIGHLIGHTING FIX - Bulletproof highlighting that cannot be removed
(function() {
    'use strict';

    console.log('🚀 NUCLEAR HIGHLIGHTING FIX LOADING...');

    // Auto-refresh leads table on login
    function setupLoginListener() {
        let lastUser = null;

        // Check for user changes every 1 second
        setInterval(() => {
            const sessionData = sessionStorage.getItem('vanguard_user');
            let currentUser = null;

            if (sessionData) {
                try {
                    const user = JSON.parse(sessionData);
                    currentUser = user.username;
                } catch (e) {
                    // Ignore parse errors
                }
            }

            // If user changed (including login/logout), refresh leads
            if (currentUser !== lastUser) {
                console.log(`🔄 USER CHANGED: "${lastUser}" -> "${currentUser}"`);
                lastUser = currentUser;

                // Only refresh if someone is now logged in and we're on a page with leads
                if (currentUser && window.loadLeadsView && document.getElementById('leadsTableBody')) {
                    console.log('🔄 AUTO-REFRESHING leads table for new user...');
                    setTimeout(() => {
                        window.loadLeadsView();
                    }, 500);
                }
            }
        }, 1000);

        console.log('✅ Login listener setup - will auto-refresh leads on user change');
    }

    // Start login listener
    setupLoginListener();

    // Wait for app.js to load, then override generateSimpleLeadRows completely
    function setupNuclearHighlighting() {
        if (typeof window.generateSimpleLeadRows !== 'function') {
            console.log('⏳ Waiting for generateSimpleLeadRows to load...');
            setTimeout(setupNuclearHighlighting, 100);
            return;
        }

        console.log('💣 OVERRIDING generateSimpleLeadRows with NUCLEAR highlighting');

        // Store original function
        const originalGenerateSimpleLeadRows = window.generateSimpleLeadRows;

        // COMPLETELY OVERRIDE with bulletproof highlighting
        window.generateSimpleLeadRows = function(leads) {
            console.log('🚀 NUCLEAR generateSimpleLeadRows called with', leads.length, 'leads');

            // DEBUG: Show all leads being processed
            leads.forEach((lead, idx) => {
                console.log(`📋 Lead ${idx}: ${lead.name} - assignedTo: "${lead.assignedTo}" - stage: "${lead.stage}"`);
            });

            if (!leads || leads.length === 0) {
                return '<tr><td colspan="11" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
            }

            return leads.map((lead, index) => {
                // DATA INTEGRITY CHECK
                if (!lead.id) {
                    console.error(`🚨 LEAD WITHOUT ID: ${lead.name}`, lead);
                }
                if (!lead.name) {
                    console.error(`🚨 LEAD WITHOUT NAME: ID ${lead.id}`, lead);
                }

                // Truncate name to 15 characters max
                const displayName = lead.name && lead.name.length > 15 ? lead.name.substring(0, 15) + '...' : lead.name || '';

                // NUCLEAR HIGHLIGHTING LOGIC - ALWAYS WORKS
                let rowStyle = '';
                let rowClass = '';
                let highlightColor = 'none';

                // Get TO DO text
                const todoText = (typeof getNextAction === 'function' ? getNextAction(lead.stage || 'new', lead) :
                                 (window.getNextAction ? window.getNextAction(lead.stage || 'new', lead) : 'Review lead'));

                // Find timestamp - COMPREHENSIVE search
                let timestamp = null;
                if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                    timestamp = lead.stageTimestamps[lead.stage];
                } else if (lead.stageUpdatedAt) {
                    timestamp = lead.stageUpdatedAt;
                } else if (lead.updatedAt) {
                    timestamp = lead.updatedAt;
                } else if (lead.createdAt) {
                    timestamp = lead.createdAt;
                } else if (lead.created) {
                    // Convert MM/DD/YYYY to proper date
                    const parts = lead.created.split('/');
                    if (parts.length === 3) {
                        timestamp = new Date(parts[2], parts[0] - 1, parts[1]).toISOString();
                    } else {
                        timestamp = lead.created;
                    }
                }


                // Apply timestamp highlighting to ALL leads (including Hunter's)
                if (timestamp) {
                    const date = new Date(timestamp);
                    const now = new Date();
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    const diffMs = todayStart - dateStart;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    console.log(`💣 NUCLEAR: ${lead.name} - ${diffDays} days old (assignedTo: ${lead.assignedTo})`);

                    if (diffDays === 1) {
                        // YELLOW
                        rowStyle = 'style="background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important; border-right: 2px solid #f59e0b !important;"';
                        rowClass = 'timestamp-yellow nuclear-highlight';
                        highlightColor = 'yellow';
                        console.log(`🟡 NUCLEAR: ${lead.name} -> YELLOW`);
                    } else if (diffDays === 2) {
                        // ORANGE
                        rowStyle = 'style="background-color: #fed7aa !important; border-left: 4px solid #fb923c !important; border-right: 2px solid #fb923c !important;"';
                        rowClass = 'timestamp-orange nuclear-highlight';
                        highlightColor = 'orange';
                        console.log(`🟠 NUCLEAR: ${lead.name} -> ORANGE`);
                    } else if (diffDays >= 3) {
                        // RED
                        rowStyle = 'style="background-color: #fecaca !important; border-left: 4px solid #ef4444 !important; border-right: 2px solid #ef4444 !important;"';
                        rowClass = 'timestamp-red nuclear-highlight';
                        highlightColor = 'red';
                        console.log(`🔴 NUCLEAR: ${lead.name} -> RED`);
                    }
                }

                // Override with GREY for Process complete TODO - works for ANY stage including closed
                const stageRequiresReachOut = (lead.stage === 'quoted' || lead.stage === 'info_requested' ||
                                             lead.stage === 'loss_runs_requested' || lead.stage === 'app_sent' || lead.stage === 'quote_sent' || lead.stage === 'interested');

                const isProcessComplete = (todoText && todoText.toLowerCase().includes('process complete'));
                const isReachOutComplete = (!todoText || todoText.trim() === '');

                // Check if this row has been flagged to prevent completion highlighting
                const preventCompletionHighlight = document.querySelector(`tr[data-lead-id="${lead.id}"]`)?.dataset?.noCompletionHighlight === 'true';

                if (preventCompletionHighlight) {
                    console.log(`🚫 NUCLEAR: ${lead.name} -> BLOCKED from completion highlighting due to noCompletionHighlight flag`);
                } else if (isProcessComplete) {
                    // GREY highlighting for "Process complete" TODO - overrides timestamp highlighting
                    rowStyle = 'style="background-color: rgba(156, 163, 175, 0.3) !important; border-left: 4px solid #9ca3af !important; border-right: 2px solid #9ca3af !important;"';
                    rowClass = 'process-complete nuclear-highlight';
                    highlightColor = 'grey';
                    console.log(`⚫ NUCLEAR: ${lead.name} -> GREY (Process complete)`);
                } else if (stageRequiresReachOut && isReachOutComplete) {
                    // GREEN highlighting for empty TODO (reach out complete) - overrides timestamp highlighting
                    rowStyle = 'style="background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important; border-right: 2px solid #10b981 !important;"';
                    rowClass = 'reach-out-complete nuclear-highlight';
                    highlightColor = 'green';
                    console.log(`🟢 NUCLEAR: ${lead.name} -> GREEN (Empty TODO - completed reach out)`);
                } else if (!stageRequiresReachOut) {
                    // If stage doesn't require reach out, no special highlighting
                    console.log(`⚫ NUCLEAR: ${lead.name} -> NO SPECIAL HIGHLIGHTING (stage "${lead.stage}" doesn't require reach out)`);
                }

                // BULLETPROOF data attributes
                const dataAttributes = `data-nuclear-highlight="${highlightColor}" data-lead-name="${lead.name}" data-lead-id="${lead.id}" data-nuclear-applied="true"`;

                return `
                    <tr ${rowClass ? `class="${rowClass}"` : ''} ${rowStyle} ${dataAttributes}>
                        <td>
                            <input type="checkbox" class="lead-checkbox" value="${lead.id}" onchange="updateBulkDeleteButton()" data-lead='${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                        </td>
                        <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onclick="viewLead('${lead.id}')" title="${lead.name}">${displayName}</strong>
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
                        <td>${lead.product || 'Commercial Auto'}</td>
                        <td>$${(lead.premium || 0).toLocaleString()}</td>
                        <td>${window.getStageHtml ? window.getStageHtml(lead.stage || 'new') : lead.stage || 'new'}</td>
                        <td><strong class="${(() => {
                            if (todoText && todoText.toLowerCase().includes('process complete')) return 'todo-process-complete';
                            if (todoText && todoText.toLowerCase().includes('reach out to lead')) return 'todo-reach-out';
                            return '';
                        })()}">${todoText}</strong></td>
                        <td>${lead.renewalDate || 'N/A'}</td>
                        <td>${lead.assignedTo || 'Unassigned'}</td>
                        <td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon" onclick="viewLead('${lead.id}')" title="View Lead">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon" onclick="deleteLead('${lead.id}')" title="Delete Lead" style="color: #dc2626;">
                                    <i class="fas fa-trash"></i>
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

        console.log('✅ NUCLEAR highlighting override complete');

        // Force refresh if we're on leads page
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            setTimeout(() => {
                if (typeof window.loadLeadsView === 'function') {
                    console.log('🔄 NUCLEAR: Force refresh leads view');
                    window.loadLeadsView();
                }
            }, 500);
        }
    }

    // Function to check and debug filters
    function debugFilters() {
        const filterAssigned = document.getElementById('filterAssigned')?.value;
        const filterStage = document.getElementById('filterStage')?.value;
        const filterPremium = document.getElementById('filterPremium')?.value;

        console.log('🔍 CURRENT FILTERS:');
        console.log(`  - assignedTo: "${filterAssigned}"`);
        console.log(`  - stage: "${filterStage}"`);
        console.log(`  - premium: "${filterPremium}"`);

        // Check localStorage for leads
        const allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log(`📊 Total leads in localStorage: ${allLeads.length}`);

        // Show assignedTo breakdown
        const assignedToCounts = {};
        allLeads.forEach(lead => {
            const assignedTo = lead.assignedTo || 'Unassigned';
            assignedToCounts[assignedTo] = (assignedToCounts[assignedTo] || 0) + 1;
        });

        console.log('👥 Leads by assignment:');
        Object.entries(assignedToCounts).forEach(([assignedTo, count]) => {
            console.log(`  - ${assignedTo}: ${count} leads`);
        });
    }

    // Expose debug function globally
    window.debugFilters = debugFilters;

    // Function to clear all filters and show all leads
    window.clearAllFilters = function() {
        console.log('🧹 Clearing all filters...');

        const filterElements = ['filterStage', 'filterPremium', 'filterRenewal', 'filterAssigned', 'filterProduct'];
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.value = '';
                console.log(`✅ Cleared ${filterId}`);
            }
        });

        // Refresh the leads view
        if (typeof window.loadLeadsView === 'function') {
            console.log('🔄 Refreshing leads view after clearing filters');
            window.loadLeadsView();
        }
    };

    // Start the override process
    setupNuclearHighlighting();

    // DEBUG PROFILE LOADING ISSUES
    const originalViewLead = window.viewLead;
    if (originalViewLead) {
        window.viewLead = function(leadId) {
            console.log('🔍 viewLead called with ID:', leadId, 'Type:', typeof leadId);

            // Check if lead exists in localStorage
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const foundLead = leads.find(l => String(l.id) === String(leadId) || l.id === leadId);

            if (foundLead) {
                console.log('✅ Lead found in localStorage:', foundLead.name);
            } else {
                console.error('❌ Lead NOT FOUND in localStorage! ID:', leadId);
                console.log('Available lead IDs:', leads.map(l => `${l.id} (${l.name})`));

                // Show notification
                if (window.showNotification) {
                    window.showNotification(`Lead with ID ${leadId} not found in data`, 'error');
                }
            }

            // Call original function
            return originalViewLead.apply(this, arguments);
        };
        console.log('✅ Hooked into viewLead for debugging');
    }

    // Function to check data integrity
    window.checkLeadDataIntegrity = function() {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log('🔍 CHECKING LEAD DATA INTEGRITY');
        console.log(`Total leads: ${leads.length}`);

        let issuesFound = 0;

        leads.forEach((lead, idx) => {
            if (!lead.id) {
                console.error(`Issue ${++issuesFound}: Lead ${idx} has no ID:`, lead);
            }
            if (!lead.name) {
                console.error(`Issue ${++issuesFound}: Lead ${idx} has no name:`, lead);
            }
            if (typeof lead.id !== 'string' && typeof lead.id !== 'number') {
                console.warn(`Issue ${++issuesFound}: Lead ${idx} has weird ID type:`, typeof lead.id, lead.id);
            }
        });

        if (issuesFound === 0) {
            console.log('✅ No data integrity issues found');
        } else {
            console.error(`❌ Found ${issuesFound} data integrity issues`);
        }

        return { totalLeads: leads.length, issuesFound };
    };

    // Function to clear stuck loading overlays
    window.clearLoadingOverlays = function() {
        console.log('🧹 Clearing all stuck loading overlays...');

        let removedCount = 0;

        // Text-based search for loading elements
        const elementsWithLoadingText = [];
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent && (
                el.textContent.includes('Loading Lead Profile') ||
                el.textContent.includes('Please wait') ||
                el.textContent.includes('Loading...')
            )) {
                elementsWithLoadingText.push(el);
            }
        });

        console.log(`Found ${elementsWithLoadingText.length} elements with loading text`);

        // Remove elements with loading text
        elementsWithLoadingText.forEach((el, idx) => {
            console.log(`Removing loading element ${idx}:`, el.textContent.substring(0, 50));
            el.remove();
            removedCount++;
        });

        // Common selectors for loading overlays
        const loadingSelectors = [
            '.loading-overlay',
            '.loading',
            '#loadingOverlay',
            '#loading',
            '.modal-overlay',
            '.overlay'
        ];

        // Remove by common selectors
        loadingSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.style.display !== 'none' && el.style.visibility !== 'hidden') {
                    console.log(`Removing element with selector ${selector}`);
                    el.remove();
                    removedCount++;
                }
            });
        });

        // Remove any high z-index overlays with loading content
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            if (zIndex > 1000 && style.position !== 'static') {
                if (el.textContent && (el.textContent.includes('Loading') || el.textContent.includes('Please wait'))) {
                    console.log('Removing high z-index loading element:', el.textContent.substring(0, 50));
                    el.remove();
                    removedCount++;
                }
            }
        });

        console.log(`✅ Removed ${removedCount} loading overlays`);
        return removedCount;
    };

    // Function to check for lost leads and attempt recovery
    window.checkForLostLeads = function() {
        console.log('🔍 CHECKING FOR LOST LEADS...');

        // Check multiple localStorage keys
        const insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');

        console.log(`insurance_leads: ${insurance_leads.length} leads`);
        console.log(`leads: ${leads.length} leads`);

        // Check if one has more than the other
        if (insurance_leads.length !== leads.length) {
            console.log('⚠️ MISMATCH between localStorage keys!');

            const moreLeads = insurance_leads.length > leads.length ? insurance_leads : leads;
            const lessLeads = insurance_leads.length > leads.length ? leads : insurance_leads;

            console.log(`Using larger dataset: ${moreLeads.length} leads`);

            // Sync both to the larger dataset
            localStorage.setItem('insurance_leads', JSON.stringify(moreLeads));
            localStorage.setItem('leads', JSON.stringify(moreLeads));

            console.log('✅ Synced both localStorage keys');

            if (typeof window.loadLeadsView === 'function') {
                window.loadLeadsView();
            }
        }

        // Look for backup data
        const backupKeys = ['insurance_leads_backup', 'leads_backup', 'vicidial_leads'];
        backupKeys.forEach(key => {
            const backup = JSON.parse(localStorage.getItem(key) || '[]');
            if (backup.length > 0) {
                console.log(`Found backup in ${key}: ${backup.length} leads`);
            }
        });
    };

    // Auto-debug filters on load
    setTimeout(debugFilters, 1000);

    // Auto-clear loading overlays and run recovery checks
    setTimeout(() => {
        window.clearLoadingOverlays();  // Clear stuck loading overlays first
        window.checkForLostLeads();
        window.checkLeadDataIntegrity();
    }, 2000);

    // Also clear overlays periodically in case they appear again
    setInterval(() => {
        const removed = window.clearLoadingOverlays();
        if (removed > 0) {
            console.log('🧹 Auto-cleared loading overlays');
        }
    }, 10000); // Every 10 seconds

    // Listen for stage changes to refresh highlighting immediately
    window.addEventListener('leadStageChanged', (event) => {
        const { leadId, newStage, lead } = event.detail;
        console.log(`🎨 NUCLEAR: Received stage change event for lead ${leadId} -> ${newStage}`);

        // Force immediate refresh of the specific lead row
        setTimeout(() => {
            if (window.loadLeadsView && document.getElementById('leadsTableBody')) {
                console.log('🔄 NUCLEAR: Refreshing table after stage change');
                window.loadLeadsView();
            }
        }, 50);
    });

    console.log('💥 NUCLEAR HIGHLIGHTING FIX LOADED');
    console.log('🔧 Use window.debugFilters() to see current filters');
    console.log('🧹 Use window.clearAllFilters() to clear all filters');
    console.log('🔍 Use window.checkLeadDataIntegrity() to check for data issues');
    console.log('🔄 Use window.checkForLostLeads() to check for lost leads');
    console.log('🗑️ Use window.clearLoadingOverlays() to remove stuck loading screens');
    console.log('🎨 NUCLEAR: Listening for stage changes to refresh highlighting');
})();