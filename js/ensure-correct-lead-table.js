// Ensure Correct Lead Table - Make sure only the properly highlighted table loads AND updates in real-time

// IMMEDIATE DEBUG LOG
console.log('🔥🔥🔥 ENSURE CORRECT LEAD TABLE SCRIPT IS LOADING 🔥🔥🔥');

// IMMEDIATE GLOBAL FUNCTION DEFINITION - Test if script loads at all
window.scriptLoadTest = function() {
    console.log('✅ Script definitely loaded!');
    return 'LOADED';
};

// MAIN HIGHLIGHTING FUNCTION - Will be overridden by IIFE version
window.forceHighlightNow = function() {
    console.log('🔥 INITIAL forceHighlightNow (will be overridden by IIFE)');
    return 'INITIAL_VERSION';
};

(function() {
    'use strict';

    console.log('✅ Ensuring correct lead table loads with real-time highlighting...');

    // Manual highlighting function as fallback - DEFINED FIRST to avoid reference errors
    function manualHighlighting() {
        console.log('🔧 Running manual highlighting approach');

        const table = document.getElementById('leadsTableBody');
        if (!table) {
            console.log('❌ No leadsTableBody found');
            console.log('Available elements with "lead" in id:');
            document.querySelectorAll('[id*="lead"]').forEach(el => {
                console.log(`  - ${el.id}: ${el.tagName}`);
            });
            return;
        }

        console.log('✅ Found leadsTableBody table');

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        console.log(`Found ${rows.length} rows and ${leads.length} leads`);
        console.log('First few rows structure:');
        rows.forEach((row, idx) => {
            if (idx < 3) {
                const cells = row.querySelectorAll('td');
                console.log(`  Row ${idx}: ${cells.length} cells`);
                if (cells.length >= 7) {
                    console.log(`    - Name: "${(cells[1].textContent || '').trim()}"`);
                    console.log(`    - TODO: "${(cells[6].textContent || '').trim()}"`);
                }
            }
        });

        let yellowCount = 0, orangeCount = 0, redCount = 0, greenCount = 0;

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Get TO DO text (column 7 is To Do)
            const todoCell = cells[6];
            const todoText = (todoCell.textContent || '').trim();

            // Get name (column 2)
            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim().replace('...', '');

            // Only highlight if there's a TO DO and it's not empty/complete
            if (todoText && todoText !== '' && !todoText.toLowerCase().includes('complete')) {

                // Find matching lead
                const lead = leads.find(l => l.name && (
                    l.name.startsWith(nameText) || nameText.startsWith(l.name.substring(0, 15))
                ));

                if (lead) {
                    // Get timestamp
                    let timestamp = null;
                    if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                        timestamp = lead.stageTimestamps[lead.stage];
                    } else if (lead.updatedAt) {
                        timestamp = lead.updatedAt;
                    } else if (lead.createdAt) {
                        timestamp = lead.createdAt;
                    }

                    if (timestamp) {
                        const date = new Date(timestamp);
                        const now = new Date();
                        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        const diffMs = todayStart - dateStart;
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                        if (diffDays === 1) {
                            // Yellow
                            console.log(`  🟡 Applying YELLOW to ${lead.name} (${diffDays} days old)`);
                            row.style.setProperty('background-color', '#fef3c7', 'important');
                            row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                            row.style.setProperty('border-right', '2px solid #f59e0b', 'important');
                            yellowCount++;
                        } else if (diffDays > 1 && diffDays < 7) {
                            // Orange
                            console.log(`  🟠 Applying ORANGE to ${lead.name} (${diffDays} days old)`);
                            row.style.setProperty('background-color', '#fed7aa', 'important');
                            row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                            row.style.setProperty('border-right', '2px solid #fb923c', 'important');
                            orangeCount++;
                        } else if (diffDays >= 7) {
                            // Red
                            console.log(`  🔴 Applying RED to ${lead.name} (${diffDays} days old)`);
                            row.style.setProperty('background-color', '#fecaca', 'important');
                            row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                            row.style.setProperty('border-right', '2px solid #ef4444', 'important');
                            redCount++;
                        } else {
                            console.log(`  ⚪ No highlight for ${lead.name} (${diffDays} days old - today or future)`);
                        }
                    }
                }
            } else {
                // Green for empty/complete TO DO
                console.log(`  🟢 Applying GREEN to row ${idx} (empty/complete TODO: "${todoText}")`);
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                greenCount++;
            }
        });

        console.log(`🎨 Applied manual highlighting: ${greenCount} green, ${yellowCount} yellow, ${orangeCount} orange, ${redCount} red`);
    }

    // Function to force table refresh with highlighting
    function refreshLeadTableWithHighlighting() {
        console.log('🎨 Refreshing lead table with highlighting...');

        // First, load the table content
        if (typeof window.loadLeadsView === 'function') {
            console.log('🔄 Loading leads view...');
            window.loadLeadsView();
        }

        // Apply highlighting with multiple attempts
        setTimeout(() => {
            console.log('💥 Applying highlighting - 100ms attempt');
            if (typeof window.ultimateHighlight === 'function') {
                window.ultimateHighlight();
            } else {
                manualHighlighting();
            }
        }, 100);

        setTimeout(() => {
            console.log('💥 Applying highlighting - 500ms attempt');
            if (typeof window.ultimateHighlight === 'function') {
                window.ultimateHighlight();
            } else {
                manualHighlighting();
            }
        }, 500);

        setTimeout(() => {
            console.log('💥 Applying highlighting - 1000ms attempt');
            if (typeof window.ultimateHighlight === 'function') {
                window.ultimateHighlight();
            } else {
                manualHighlighting();
            }
        }, 1000);

        setTimeout(() => {
            console.log('💥 Applying highlighting - 2000ms attempt');
            if (typeof window.ultimateHighlight === 'function') {
                window.ultimateHighlight();
            } else {
                manualHighlighting();
            }
        }, 2000);
    }

    // Wait for page to load, then ensure we're using the correct table generation
    setTimeout(() => {
        // Check if we're on the leads page
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            console.log('🔄 On leads page - ensuring correct table is displayed');
            refreshLeadTableWithHighlighting();
        }
    }, 1500);

    // Listen for clicks on the leads tab
    document.addEventListener('click', function(e) {
        if (e.target.closest('a[href="#leads"]')) {
            console.log('🖱️ Leads tab clicked directly - will regenerate table with highlighting');

            // SINGLE table regeneration with IMMEDIATE highlighting
            setTimeout(() => {
                console.log('🔄 Clicked leads tab - regenerating table ONCE with immediate highlighting');

                if (typeof window.loadLeadsView === 'function') {
                    window.loadLeadsView(); // Regenerate table once
                }

                // Apply highlighting IMMEDIATELY and repeatedly
                if (typeof window.forceAllHighlighting === 'function') {
                    console.log('🎨 IMMEDIATE highlighting application');
                    window.forceAllHighlighting(); // Immediate

                    // Apply multiple times in quick succession to combat any interference
                    setTimeout(() => window.forceAllHighlighting(), 10);
                    setTimeout(() => window.forceAllHighlighting(), 50);
                    setTimeout(() => window.forceAllHighlighting(), 100);
                    setTimeout(() => window.forceAllHighlighting(), 200);
                    setTimeout(() => window.forceAllHighlighting(), 500);
                }
            }, 100); // Faster initial delay
        }
    });

    // Also ensure proper table on hash changes to leads
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            console.log('🔄 Hash changed to leads - regenerating table');

            // SINGLE table regeneration with IMMEDIATE highlighting
            setTimeout(() => {
                console.log('🔄 Hash change - regenerating table ONCE with immediate highlighting');

                if (typeof window.loadLeadsView === 'function') {
                    window.loadLeadsView(); // Regenerate table once
                }

                // Apply highlighting IMMEDIATELY and repeatedly
                if (typeof window.forceAllHighlighting === 'function') {
                    console.log('🎨 IMMEDIATE highlighting application after hash change');
                    window.forceAllHighlighting(); // Immediate

                    // Apply multiple times in quick succession to combat any interference
                    setTimeout(() => window.forceAllHighlighting(), 10);
                    setTimeout(() => window.forceAllHighlighting(), 50);
                    setTimeout(() => window.forceAllHighlighting(), 100);
                    setTimeout(() => window.forceAllHighlighting(), 200);
                    setTimeout(() => window.forceAllHighlighting(), 500);
                }
            }, 100); // Faster initial delay
        }
    });

    // REAL-TIME HIGHLIGHTING UPDATES - Listen for status/stage changes
    const originalUpdateStageInServer = window.updateStageInServer;
    if (originalUpdateStageInServer) {
        window.updateStageInServer = async function(leadId, newStage) {
            console.log(`🔄 Stage updated for lead ${leadId} to ${newStage} - will refresh highlighting`);

            // Call original function
            const result = await originalUpdateStageInServer.apply(this, arguments);

            // Refresh table highlighting after stage update if on leads page
            if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
                setTimeout(() => {
                    console.log('🎨 Refreshing highlighting after stage update');
                    if (typeof window.forceHighlightNow === 'function') {
                        window.forceHighlightNow();
                    }
                }, 500);
            }

            return result;
        };
        console.log('✅ Hooked into stage updates for real-time highlighting');
    }

    // Also hook into reach out updates
    const originalUpdateReachOut = window.updateReachOut;
    if (originalUpdateReachOut) {
        window.updateReachOut = async function() {
            console.log('🔄 Reach out updated - will refresh highlighting');

            // Call original function
            const result = await originalUpdateReachOut.apply(this, arguments);

            // Refresh table highlighting after reach out update if on leads page
            if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
                setTimeout(() => {
                    console.log('🎨 Refreshing highlighting after reach out update');
                    if (typeof window.forceHighlightNow === 'function') {
                        window.forceHighlightNow();
                    }
                }, 500);
            }

            return result;
        };
        console.log('✅ Hooked into reach out updates for real-time highlighting');
    }

    // Hook into lead editing (where timestamps are updated)
    const originalEditLead = window.editLead;
    if (originalEditLead) {
        window.editLead = function(leadId) {
            console.log(`🔄 Lead ${leadId} being edited - will refresh highlighting after`);

            // Call original function
            const result = originalEditLead.apply(this, arguments);

            // Refresh table highlighting after lead edit if on leads page
            if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
                setTimeout(() => {
                    console.log('🎨 Refreshing highlighting after lead edit');
                    if (typeof window.forceHighlightNow === 'function') {
                        window.forceHighlightNow();
                    }
                }, 500);
            }

            return result;
        };
        console.log('✅ Hooked into lead editing for real-time highlighting');
    }

    // Hook into sorting to maintain highlighting
    const originalSortLeads = window.sortLeads;
    if (originalSortLeads) {
        window.sortLeads = function(field) {
            console.log(`🔄 Sorting by ${field} - will maintain highlighting`);

            // Call original sort function
            originalSortLeads.apply(this, arguments);

            // Refresh highlighting after sort
            setTimeout(() => {
                const tableBody = document.getElementById('leadsTableBody');
                if (tableBody && typeof window.generateSimpleLeadRows === 'function') {
                    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

                    // Apply current sort
                    // Re-generate table with highlighting
                    tableBody.innerHTML = window.generateSimpleLeadRows(leads);
                    console.log('🎨 Maintained highlighting after sort');
                }
            }, 100);
        };
        console.log('✅ Hooked into sorting for highlighting maintenance');
    }

    // Hook into filtering as well
    const originalApplyAdvancedFilters = window.applyAdvancedFilters;
    if (originalApplyAdvancedFilters) {
        window.applyAdvancedFilters = function() {
            console.log('🔄 Applying filters - will maintain highlighting');

            // Call original filter function
            originalApplyAdvancedFilters.apply(this, arguments);

            // Refresh highlighting after filter
            setTimeout(() => {
                console.log('🎨 Maintained highlighting after filter');
                // The filter function already updates the table, highlighting should be preserved
            }, 100);
        };
        console.log('✅ Hooked into filtering for highlighting maintenance');
    }

    // Expose the refresh function globally for manual use
    window.refreshLeadHighlighting = refreshLeadTableWithHighlighting;

    // Expose comprehensive highlighting trigger - OVERRIDES simpler versions
    window.forceHighlightNow = function() {
        console.log('🔥 COMPREHENSIVE highlighting trigger activated from IIFE');

        const table = document.getElementById('leadsTableBody');
        if (!table) {
            console.log('❌ No leadsTableBody found');
            return 'NO_TABLE';
        }

        console.log('✅ Table found - checking for existing highlighting functions');
        console.log('Available functions:', {
            ultimateHighlight: typeof window.ultimateHighlight,
            forceColors: typeof window.forceColors,
            automaticTimestampColors: typeof window.automaticTimestampColors,
            forceAllHighlighting: typeof window.forceAllHighlighting
        });

        // Try existing functions first - FORCE ultimateHighlight (yellow/orange system)
        if (typeof window.ultimateHighlight === 'function') {
            console.log('💥 FORCING ULTIMATE HIGHLIGHT (yellow/orange system)');
            window.ultimateHighlight();
            // Run it multiple times to make sure it works
            setTimeout(() => window.ultimateHighlight(), 100);
            setTimeout(() => window.ultimateHighlight(), 500);
            return 'USED_ULTIMATE';
        } else if (typeof window.forceColors === 'function') {
            console.log('💥 Using forceColors function');
            window.forceColors();
            return 'USED_FORCE_COLORS';
        } else if (typeof window.automaticTimestampColors === 'function') {
            console.log('💥 Using automaticTimestampColors function');
            window.automaticTimestampColors();
            return 'USED_AUTOMATIC';
        } else if (typeof window.forceAllHighlighting === 'function') {
            console.log('💥 forceAllHighlighting exists but may have anti-blinking logic - using manual instead');
            manualHighlighting();
            return 'BYPASSED_FORCE_ALL';
        } else {
            console.log('⚠️ No highlighting functions found - using IIFE manual approach');
            manualHighlighting();
            return 'USED_MANUAL';
        }
    };


    // AGGRESSIVE TABLE MONITORING - Watch for any table changes and immediately re-apply highlighting
    function setupTableMutationObserver() {
        console.log('🔍 Setting up table mutation observer for persistent highlighting...');

        const tableContainer = document.getElementById('leadsTableBody');
        if (!tableContainer) {
            // Try again later if table doesn't exist yet
            setTimeout(setupTableMutationObserver, 1000);
            return;
        }

        const observer = new MutationObserver(function(mutations) {
            let shouldReapplyHighlighting = false;

            mutations.forEach(function(mutation) {
                // Check if table content was modified
                if (mutation.type === 'childList' && mutation.target === tableContainer) {
                    shouldReapplyHighlighting = true;
                    console.log('🔄 Table content changed - will re-apply highlighting');
                }

                // Check if any row styles were modified
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    if (target.tagName === 'TR' && target.getAttribute('data-highlight-applied')) {
                        const highlight = target.getAttribute('data-highlight');
                        const currentStyle = target.getAttribute('style') || '';

                        // Check if highlighting was removed
                        if (highlight === 'yellow' && !currentStyle.includes('#fef3c7')) {
                            shouldReapplyHighlighting = true;
                            console.log('🚨 Yellow highlight was removed - will restore');
                        } else if (highlight === 'orange' && !currentStyle.includes('#fed7aa')) {
                            shouldReapplyHighlighting = true;
                            console.log('🚨 Orange highlight was removed - will restore');
                        } else if (highlight === 'red' && !currentStyle.includes('#fecaca')) {
                            shouldReapplyHighlighting = true;
                            console.log('🚨 Red highlight was removed - will restore');
                        }
                    }
                }
            });

            if (shouldReapplyHighlighting && typeof window.forceAllHighlighting === 'function') {
                // Apply highlighting with a delay to avoid blinking
                setTimeout(() => {
                    console.log('🎨 MUTATION OBSERVER: Re-applying highlighting due to table changes');
                    window.forceAllHighlighting();
                }, 200); // Longer delay to reduce blinking
            }
        });

        // Start observing the table for changes
        observer.observe(tableContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // Also observe the parent container in case the entire table gets replaced
        const tableParent = tableContainer.parentElement;
        if (tableParent) {
            observer.observe(tableParent, {
                childList: true,
                subtree: true
            });
        }

        console.log('✅ Table mutation observer active - will detect and counter any highlighting removal');
    }

    // HOOK INTO ALL LOADLEADSVIEW CALLS - This ensures highlighting applies NO MATTER WHO calls loadLeadsView()
    const originalLoadLeadsView = window.loadLeadsView;
    let loadLeadsViewCallCount = 0;

    window.loadLeadsView = function(...args) {
        loadLeadsViewCallCount++;
        console.log(`🔄 LOADLEADSVIEW CALL #${loadLeadsViewCallCount} - WILL FORCE HIGHLIGHTING`);

        // Call the original function
        let result;
        if (originalLoadLeadsView) {
            result = originalLoadLeadsView.apply(this, args);
        }

        // AGGRESSIVELY apply highlighting after EVERY loadLeadsView call
        const applyHighlightingAggressively = () => {
            if (typeof window.forceAllHighlighting === 'function') {
                console.log(`🎨 FORCING HIGHLIGHTING after loadLeadsView call #${loadLeadsViewCallCount}`);
                window.forceAllHighlighting();
            }
        };

        // Apply highlighting just once, but with proper timing
        setTimeout(applyHighlightingAggressively, 100);

        return result;
    };

    // Start the observer
    setupTableMutationObserver();

    // SMART HIGHLIGHTING CHECK - Only re-apply if truly missing
    setInterval(() => {
        if ((window.location.hash === '#leads' || window.location.hash === '#leads-management') &&
            typeof window.forceAllHighlighting === 'function') {

            const table = document.getElementById('leadsTableBody');
            if (table && table.querySelectorAll('tr').length > 0) {
                // Check if data attributes are missing (more reliable than style check)
                const attributedRows = table.querySelectorAll('tr[data-highlight]');
                const totalRows = table.querySelectorAll('tr').length;

                // Only re-apply if no data attributes exist AND there are rows
                if (attributedRows.length === 0 && totalRows > 0) {
                    console.log('🔥 SMART HIGHLIGHTING: No data attributes found - applying once');
                    window.forceAllHighlighting();
                }
            }
        }
    }, 5000); // Reduced frequency

    // Run highlighting on page load if we're already on the leads page
    setTimeout(() => {
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            console.log('🚀 Already on leads page - running initial highlighting');
            if (typeof window.forceHighlightNow === 'function') {
                window.forceHighlightNow();
            }
        }
    }, 2000);

    console.log('✅ Real-time lead highlighting system loaded');
    console.log('🔧 Use window.forceHighlightNow() to manually trigger highlighting');
    console.log('🔧 Use window.refreshLeadHighlighting() to refresh table with highlighting');
    console.log('🔧 Use window.scriptLoadTest() to verify script loaded');
})();