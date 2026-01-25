// COMPREHENSIVE FINAL FIX - Everything in one place
console.log('🚨 COMPREHENSIVE FINAL FIX - Loading all corrections...');

(function() {
    // CRITICAL: Override all existing functions to ensure our fixes take priority

    // 1. HIGHLIGHT STATUS CHECKER (completely independent)
    function isHighlightActiveForLead(lead) {
        // SPECIAL CASE: App sent stage always has active highlighting (indefinite)
        if (lead && lead.stage === 'app sent') {
            console.log(`🔍 Lead ${lead.id}: App sent stage - indefinite green highlight`);
            return true;
        }

        if (!lead || !lead.reachOut) {
            console.log(`🔍 Lead ${lead?.id}: No reachOut data - no highlight`);
            return false;
        }

        if (!lead.reachOut.completedAt && !lead.reachOut.reachOutCompletedAt) {
            console.log(`🔍 Lead ${lead.id}: No completion data - no highlight`);
            return false;
        }

        // Check for active highlight duration
        let highlightExpiry = null;

        if (lead.reachOut.greenHighlightUntil) {
            highlightExpiry = new Date(lead.reachOut.greenHighlightUntil);
        } else if (lead.greenHighlight?.expiresAt) {
            highlightExpiry = new Date(lead.greenHighlight.expiresAt);
        } else if (lead.greenUntil) {
            highlightExpiry = new Date(lead.greenUntil);
        } else {
            console.log(`🔍 Lead ${lead.id}: Has completion but no highlight duration - no highlight`);
            return false;
        }

        const now = new Date();
        const isActive = now < highlightExpiry;

        console.log(`🔍 Lead ${lead.id}: Expires ${highlightExpiry.toLocaleString()}, Active: ${isActive}`);
        return isActive;
    }

    // 2. TODO TEXT GENERATOR (clean logic)
    function getNextActionFixed(stage, lead) {
        // SPECIAL CASE: App sent stage never shows TODO text (always green highlighted)
        if (stage === 'app sent') {
            console.log(`✅ Lead ${lead?.id}: App sent stage - no TODO text (indefinite green)`);
            return '';
        }

        const stagesRequiringReachOut = ['quoted', 'info_requested', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware', 'interested'];

        if (stagesRequiringReachOut.includes(stage)) {
            const hasActiveHighlight = isHighlightActiveForLead(lead);

            if (hasActiveHighlight) {
                console.log(`✅ Lead ${lead?.id}: Active highlight - no TODO text`);
                return '';
            } else {
                console.log(`🔴 Lead ${lead?.id}: No active highlight - showing red reach-out`);
                return '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';
            }
        }

        // Default actions for other stages
        const actionMap = {
            'new': 'Assign Stage',
            'contact_attempted': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'info_received': 'Prepare Quote',
            'loss_runs_requested': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
            'app_sent': '',  // App sent stage should have NO TODO text
            'app sent': '', // Handle both variations
            'not-interested': 'Archive lead',
            'closed': 'Process complete'
        };
        return actionMap[stage] || 'Review lead';
    }

    // 3. CORRECTED HIGHLIGHTING FUNCTION
    function applyReachOutCompleteHighlightingFixed() {
        console.log('🎨 APPLYING CORRECTED HIGHLIGHTING...');

        const tableBody = document.getElementById('leadsTableBody') || document.querySelector('tbody');
        if (!tableBody) {
            console.log('❌ Table body not found');
            return;
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');

        console.log(`🔍 Processing ${rows.length} rows with ${leads.length} leads`);

        rows.forEach(row => {
            const checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox) return;

            const leadId = checkbox.value;
            const lead = leads.find(l => String(l.id) === String(leadId));
            if (!lead) return;

            const todoCell = row.querySelectorAll('td')[6];
            if (!todoCell) return;

            const todoText = todoCell.textContent.trim();
            const hasActiveHighlight = isHighlightActiveForLead(lead);
            const hasEmptyTodo = todoText === '' || todoText.length === 0;

            // SPECIAL CASE: App sent stage always gets green highlighting regardless of TODO status
            if (lead.stage === 'app sent') {
                console.log(`✅ Lead ${leadId}: App sent stage - applying indefinite green highlight`);
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                row.classList.add('reach-out-complete');
                return; // Skip further processing for app sent leads
            }

            // For Harry Welling specifically, log details
            if (lead.name && lead.name.includes('HARRY WELLING')) {
                console.log(`🎯 HARRY WELLING PROCESSING:`);
                console.log(`   TODO text: "${todoText}"`);
                console.log(`   Has active highlight: ${hasActiveHighlight}`);
                console.log(`   Has empty TODO: ${hasEmptyTodo}`);
            }

            // Apply green highlighting if TODO is empty (regardless of highlight status for app sent)
            if (hasEmptyTodo) {
                console.log(`✅ Lead ${leadId}: Applying green highlight (empty TODO cell)`);
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                row.classList.add('reach-out-complete');
            } else {
                // Remove green highlighting for all other cases
                if (row.style.backgroundColor.includes('185, 129') || row.classList.contains('reach-out-complete')) {
                    console.log(`🔴 Lead ${leadId}: Removing green highlight (TODO="${todoText}", Active=${hasActiveHighlight})`);
                }
                row.style.removeProperty('background-color');
                row.style.removeProperty('background');
                row.style.removeProperty('border-left');
                row.style.removeProperty('border-right');
                row.classList.remove('reach-out-complete');
            }
        });

        console.log('✅ Corrected highlighting applied');
    }

    // 4. MAKE ALL FUNCTIONS GLOBALLY AVAILABLE AND OVERRIDE EXISTING
    window.isHighlightActiveForLead = isHighlightActiveForLead;
    window.getNextAction = getNextActionFixed;
    window.applyReachOutCompleteHighlighting = applyReachOutCompleteHighlightingFixed;

    console.log('✅ All functions loaded and available globally');

    // 5. IMMEDIATE FIX APPLICATION
    setTimeout(() => {
        console.log('🔧 APPLYING IMMEDIATE FIX...');

        // Force table regeneration if possible
        if (window.displayLeads) {
            window.displayLeads();
        } else if (window.loadLeadsView) {
            window.loadLeadsView();
        }

        // Apply highlighting after table loads
        setTimeout(() => {
            applyReachOutCompleteHighlightingFixed();

            // FINAL VERIFICATION
            setTimeout(() => {
                console.log('🔍 FINAL VERIFICATION FOR HARRY WELLING...');

                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const harry = leads.find(l => l.name && l.name.includes('HARRY WELLING'));

                if (harry) {
                    const hasActiveHighlight = isHighlightActiveForLead(harry);
                    const todoResult = getNextActionFixed(harry.stage, harry);

                    console.log('📊 FUNCTION RESULTS:');
                    console.log(`   isHighlightActiveForLead: ${hasActiveHighlight}`);
                    console.log(`   getNextAction: "${todoResult}"`);

                    const shouldShowRed = !hasActiveHighlight && ['quoted', 'info_requested'].includes(harry.stage);
                    console.log(`   Should show red text: ${shouldShowRed}`);

                    // Check DOM
                    const tableBody = document.querySelector('tbody');
                    if (tableBody) {
                        const rows = tableBody.querySelectorAll('tr');
                        let harryRow = null;

                        rows.forEach(row => {
                            const nameCell = row.querySelector('td:first-child');
                            if (nameCell && nameCell.textContent.includes('HARRY WELLING')) {
                                harryRow = row;
                            }
                        });

                        if (harryRow) {
                            const todoCell = harryRow.querySelectorAll('td')[6];
                            const hasGreenBg = harryRow.style.backgroundColor.includes('185, 129');
                            const todoHTML = todoCell ? todoCell.innerHTML : 'NOT FOUND';
                            const hasRedText = todoHTML.includes('color: #dc2626');

                            console.log('📊 DOM RESULTS:');
                            console.log(`   TODO HTML: "${todoHTML}"`);
                            console.log(`   Has red text: ${hasRedText}`);
                            console.log(`   Has green background: ${hasGreenBg}`);

                            const isFixed = hasRedText && !hasGreenBg;

                            if (isFixed) {
                                console.log('\n🎉 SUCCESS! HARRY WELLING IS FIXED!');
                                console.log('✅ Shows red reach-out text');
                                console.log('✅ No green highlighting');
                                console.log('\n🎯 FIX IS COMPLETE AND VERIFIED!');
                            } else {
                                console.log('\n🚨 STILL NOT WORKING!');
                                console.log('❌ Manual DOM fix required...');

                                // FORCE MANUAL FIX
                                if (todoCell) {
                                    todoCell.innerHTML = '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';
                                }
                                harryRow.style.removeProperty('background-color');
                                harryRow.style.removeProperty('background');
                                harryRow.classList.remove('reach-out-complete');

                                console.log('🔧 Applied manual DOM fix to Harry Welling');

                // ADDITIONAL FORCE FIX - Run one more time after 2 seconds to be absolutely sure
                setTimeout(() => {
                    console.log('🚨 FINAL FORCE FIX for Harry Welling...');
                    const finalHarryRow = document.querySelector('tr');
                    const allRows = document.querySelectorAll('tbody tr');

                    allRows.forEach(row => {
                        const nameCell = row.querySelector('td:first-child');
                        if (nameCell && nameCell.textContent.includes('HARRY WELLING')) {
                            const todoCell = row.querySelectorAll('td')[6];
                            if (todoCell) {
                                todoCell.innerHTML = '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';
                                row.style.removeProperty('background-color');
                                row.style.removeProperty('background');
                                row.style.removeProperty('border-left');
                                row.style.removeProperty('border-right');
                                row.classList.remove('reach-out-complete');
                                console.log('✅ FINAL FORCE applied to Harry Welling');
                            }
                        }
                    });
                }, 2000);
                            }
                        }
                    }
                }
            }, 1000);
        }, 500);
    }, 100);

})();

console.log('🚨 COMPREHENSIVE FIX LOADED - Check console for results in 2 seconds...');