// UNIFIED stage saving fix - ensures ALL leads save stage changes properly
(function() {
    'use strict';

    console.log('🔧 Loading unified stage saving fix...');

    // Override updateLeadStage to work for ALL leads (Vicidial and manual)
    window.updateLeadStage = async function(leadId, newStage) {
        console.log(`📝 Updating lead stage: ${leadId} → ${newStage}`);

        if (!leadId || !newStage) {
            console.error('Missing leadId or stage');
            return;
        }

        // Ensure leadId is a string
        leadId = String(leadId);

        try {
            // Update in ALL localStorage locations
            let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

            let foundInInsurance = false;
            let foundInRegular = false;

            // Update in insurance_leads
            const insuranceIndex = insurance_leads.findIndex(l => String(l.id) === leadId);
            if (insuranceIndex !== -1) {
                const currentTimestamp = new Date().toISOString();
                insurance_leads[insuranceIndex].stage = newStage;
                insurance_leads[insuranceIndex].stageUpdatedAt = currentTimestamp;
                insurance_leads[insuranceIndex].updatedAt = currentTimestamp;

                // Initialize stageTimestamps if not exists
                if (!insurance_leads[insuranceIndex].stageTimestamps) {
                    insurance_leads[insuranceIndex].stageTimestamps = {};
                }
                // ALWAYS update the timestamp for the current stage
                insurance_leads[insuranceIndex].stageTimestamps[newStage] = currentTimestamp;

                // CRITICAL: Clear reach-out completion when moving to non-reach-out stages
                const reachOutStages = ['quoted', 'info_requested', 'quote_sent', 'interested'];
                if (!reachOutStages.includes(newStage)) {
                    // Stage doesn't require reach out - clear completion data
                    if (insurance_leads[insuranceIndex].reachOut) {
                        console.log('🔄 Clearing reach-out completion data - stage no longer requires reach out');
                        insurance_leads[insuranceIndex].reachOut.callsConnected = 0;
                        insurance_leads[insuranceIndex].reachOut.callAttempts = 0;
                        insurance_leads[insuranceIndex].reachOut.emailCount = 0;
                        insurance_leads[insuranceIndex].reachOut.textCount = 0;
                        insurance_leads[insuranceIndex].reachOut.voicemailCount = 0;
                    }
                }

                foundInInsurance = true;
                console.log('✅ Updated in insurance_leads with timestamp:', currentTimestamp);
            }

            // Update in regular leads
            const regularIndex = regular_leads.findIndex(l => String(l.id) === leadId);
            if (regularIndex !== -1) {
                const currentTimestamp = new Date().toISOString();
                regular_leads[regularIndex].stage = newStage;
                regular_leads[regularIndex].stageUpdatedAt = currentTimestamp;
                regular_leads[regularIndex].updatedAt = currentTimestamp;

                // Initialize stageTimestamps if not exists
                if (!regular_leads[regularIndex].stageTimestamps) {
                    regular_leads[regularIndex].stageTimestamps = {};
                }
                // ALWAYS update the timestamp for the current stage
                regular_leads[regularIndex].stageTimestamps[newStage] = currentTimestamp;

                // CRITICAL: Clear reach-out completion when moving to non-reach-out stages
                const reachOutStages = ['quoted', 'info_requested', 'quote_sent', 'interested'];
                if (!reachOutStages.includes(newStage)) {
                    // Stage doesn't require reach out - clear completion data
                    if (regular_leads[regularIndex].reachOut) {
                        console.log('🔄 Clearing reach-out completion data - stage no longer requires reach out');
                        regular_leads[regularIndex].reachOut.callsConnected = 0;
                        regular_leads[regularIndex].reachOut.callAttempts = 0;
                        regular_leads[regularIndex].reachOut.emailCount = 0;
                        regular_leads[regularIndex].reachOut.textCount = 0;
                        regular_leads[regularIndex].reachOut.voicemailCount = 0;
                    }
                }

                foundInRegular = true;
                console.log('✅ Updated in leads with timestamp:', currentTimestamp);
            }

            // If not found in either, add to both
            if (!foundInInsurance && !foundInRegular) {
                console.warn('Lead not found in localStorage, checking memory store...');

                // Check memory store
                if (window.leadStore && window.leadStore[leadId]) {
                    const lead = window.leadStore[leadId];
                    lead.stage = newStage;
                    lead.stageUpdatedAt = new Date().toISOString();

                    // Add to both arrays
                    insurance_leads.push(lead);
                    regular_leads.push(lead);

                    console.log('✅ Added from memory store to localStorage');
                } else {
                    console.error('Lead not found anywhere!');
                    showNotification('Error: Lead not found', 'error');
                    return;
                }
            }

            // Save to BOTH localStorage keys
            localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
            localStorage.setItem('leads', JSON.stringify(regular_leads));
            console.log('💾 Saved to both localStorage keys');

            // Update in memory store if it exists
            if (window.leadStore && window.leadStore[leadId]) {
                window.leadStore[leadId].stage = newStage;
                window.leadStore[leadId].stageUpdatedAt = new Date().toISOString();

                // Clear reach-out completion in memory store too
                const reachOutStages = ['quoted', 'info_requested', 'quote_sent', 'interested'];
                if (!reachOutStages.includes(newStage) && window.leadStore[leadId].reachOut) {
                    console.log('🔄 Clearing reach-out completion data in memory store');
                    window.leadStore[leadId].reachOut.callsConnected = 0;
                    window.leadStore[leadId].reachOut.callAttempts = 0;
                    window.leadStore[leadId].reachOut.emailCount = 0;
                    window.leadStore[leadId].reachOut.textCount = 0;
                    window.leadStore[leadId].reachOut.voicemailCount = 0;
                }
            }

            // CRITICAL: Save to server API using PUT method
            try {
                const apiUrl = window.VANGUARD_API_URL ||
                             (window.location.hostname === 'localhost'
                               ? 'http://localhost:3001'
                               : `http://${window.location.hostname}:3001`);

                // Use PUT to update stage field AND timestamps
                const currentTimestamp = new Date().toISOString();

                // Get the updated lead data with timestamps from localStorage
                const updatedLeadData = insurance_leads.find(l => String(l.id) === leadId) ||
                                       regular_leads.find(l => String(l.id) === leadId);

                const updateData = {
                    stage: newStage,
                    stageUpdatedAt: currentTimestamp,
                    updatedAt: currentTimestamp
                };

                // CRITICAL: Include stageTimestamps to persist timestamps on server
                if (updatedLeadData && updatedLeadData.stageTimestamps) {
                    updateData.stageTimestamps = updatedLeadData.stageTimestamps;
                    console.log('💾 Including stageTimestamps in server update:', updateData.stageTimestamps);
                }

                // Include reach out data clearing if needed
                if (updatedLeadData && updatedLeadData.reachOut) {
                    updateData.reachOut = updatedLeadData.reachOut;
                    console.log('💾 Including reachOut data in server update');
                }

                const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    console.log('✅ Stage and timestamps updated in API via PUT');
                    console.log('✅ Server now has persistent timestamps that survive page refresh');
                } else {
                    console.warn('API update failed (status: ' + response.status + '), but saved locally');
                }
            } catch (error) {
                console.log('API not available, saved locally only:', error);
            }

            // Update the display immediately
            updateStageDisplay(leadId, newStage);

            // Update the timestamp display in the profile modal if it's open
            const timestampContainer = document.getElementById(`stage-timestamp-${leadId}`);
            if (timestampContainer) {
                const currentTimestamp = new Date().toISOString();
                const stageDate = new Date(currentTimestamp);
                const timestampColor = '#10b981'; // Green for today

                const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
                const dateStr = stageDate.toLocaleDateString('en-US', dateOptions);
                const timeStr = stageDate.toLocaleTimeString('en-US', timeOptions);
                const timestampText = dateStr + ' at ' + timeStr;

                timestampContainer.innerHTML = '<div style="margin-top: 8px;">' +
                    '<span style="' +
                    'background-color: ' + timestampColor + ';' +
                    'color: white;' +
                    'padding: 4px 10px;' +
                    'border-radius: 12px;' +
                    'font-size: 12px;' +
                    'font-weight: 500;' +
                    'display: inline-block;' +
                    '" title="Updated today">' +
                    '<i class="fas fa-clock" style="margin-right: 4px;"></i>' +
                    timestampText +
                    '</span>' +
                    '</div>';
                console.log('✅ Timestamp display updated to:', timestampText);
            }

            // Show success message
            if (window.showNotification) {
                showNotification(`Stage updated to "${newStage}"`, 'success');
            }

            // Update TO DO text in profile and table immediately after stage change
            setTimeout(() => {
                console.log('🔄 Updating TO DO text after stage change...');

                // Update profile TO DO text
                if (window.updateReachOutStatus) {
                    console.log('🔄 Calling updateReachOutStatus from stage update...');
                    window.updateReachOutStatus(leadId);
                } else {
                    console.log('❌ updateReachOutStatus function not found');
                }

                // Update leads table if on leads view
                const currentHash = window.location.hash;
                if (currentHash === '#leads') {
                    console.log('🔄 Refreshing leads table after stage change...');
                    if (window.refreshLeadsTable) {
                        window.refreshLeadsTable(leadId);
                    } else {
                        console.log('❌ refreshLeadsTable function not found');
                    }

                    // CRITICAL: Apply user assignment dulling after any stage change
                    setTimeout(() => {
                        if (window.applyUserAssignmentDulling) {
                            console.log('👤 Applying user assignment dulling after stage change...');
                            window.applyUserAssignmentDulling();

                            // FINAL GREEN HIGHLIGHT CLEANUP after this dulling call too
                            setTimeout(() => {
                                console.log('🧹 STAGE CHANGE CLEANUP: Starting green highlight removal for all rows with TO DO text');

                                const allLeadRows = document.querySelectorAll('tr[data-lead-id]');
                                let cleanupCount = 0;

                                allLeadRows.forEach(row => {
                                    const todoCell = row.cells[6];
                                    if (todoCell) {
                                        const todoText = todoCell.textContent.trim();
                                        console.log('🔍 STAGE CLEANUP DEBUG: Checking TO DO cell text:', `"${todoText}"`, 'Length:', todoText.length);

                                        if (todoText && todoText.length > 0 && todoText !== 'Reach out complete') {
                                            const hasGreenHighlight = row.classList.contains('reach-out-complete') ||
                                                                     row.style.backgroundColor.includes('16, 185, 129') ||
                                                                     row.style.backgroundColor.includes('rgb(16, 185, 129)') ||
                                                                     row.classList.contains('force-green-highlight');

                                            if (hasGreenHighlight) {
                                                console.log('🧹 STAGE CHANGE CLEANUP: Removing green highlight from row with TO DO text:', todoText);

                                                row.classList.remove('reach-out-complete');
                                                row.classList.remove('force-green-highlight');
                                                row.style.removeProperty('background-color');
                                                row.style.removeProperty('background');
                                                row.style.removeProperty('border-left');
                                                row.style.removeProperty('border-right');

                                                const currentStyle = row.style.cssText;
                                                if (currentStyle.includes('rgb(16, 185, 129)') || currentStyle.includes('16, 185, 129')) {
                                                    row.style.cssText = '';
                                                    console.log('🧹 STAGE CHANGE CLEANUP: Cleared inline styles containing green highlight');
                                                }

                                                cleanupCount++;
                                            }
                                        }
                                    }
                                });

                                console.log(`🧹 STAGE CHANGE CLEANUP: Complete - cleaned ${cleanupCount} rows`);
                            }, 50);
                        }
                    }, 300); // Delay to ensure all updates are complete
                }

                // DISABLED: Lead highlighting now handled by refreshLeadsTable() function
                // console.log('🎨 Updating lead highlighting after stage change...');
                // if (window.applyLeadHighlighting) {
                //     console.log('🎨 Calling applyLeadHighlighting from stage update...');
                //     window.applyLeadHighlighting();
                // } else if (window.reapplyHighlighting) {
                //     console.log('🎨 Calling reapplyHighlighting from stage update...');
                //     window.reapplyHighlighting();
                // } else {
                //     console.log('❌ Lead highlighting function not found');
                // }
            }, 100);

            // Refresh the view if needed - DISABLED to prevent tab switching issues
            // if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            //     setTimeout(() => {
            //         if (window.loadLeadsView) {
            //             window.loadLeadsView();
            //         }
            //     }, 500);
            // }

            return true;

        } catch (error) {
            console.error('Error updating stage:', error);
            if (window.showNotification) {
                showNotification('Error updating stage', 'error');
            }
            return false;
        }
    };

    // Helper function to update stage display in the UI
    function updateStageDisplay(leadId, newStage) {
        // Update in the table if visible
        const tableRows = document.querySelectorAll('#leadsTableBody tr');
        tableRows.forEach(row => {
            const checkbox = row.querySelector('.lead-checkbox');
            if (checkbox && checkbox.value === leadId) {
                const stageTd = row.cells[5]; // Stage column
                if (stageTd && window.getStageHtml) {
                    stageTd.innerHTML = window.getStageHtml(newStage);
                }
            }
        });

        // Update in the profile dropdown if open
        const stageSelect = document.getElementById(`lead-stage-${leadId}`);
        if (stageSelect) {
            stageSelect.value = newStage;
        }
    }

    // Also create an alias that maps to the same function
    window.updateLeadField = async function(leadId, fieldName, value) {
        console.log(`📝 updateLeadField called: ${fieldName} = ${value}`);

        // If it's a stage field, use the stage update function
        if (fieldName === 'stage') {
            return window.updateLeadStage(leadId, value);
        }

        // Otherwise, handle other fields
        leadId = String(leadId);

        try {
            // Update in both localStorage locations
            let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

            // Map field names if needed
            const fieldMapping = {
                'name': 'name',
                'company_name': 'name',
                'contact': 'contact',
                'contact_name': 'contact',
                'dotNumber': 'dotNumber',
                'dot_number': 'dotNumber',
                'mcNumber': 'mcNumber',
                'mc_number': 'mcNumber',
                'yearsInBusiness': 'yearsInBusiness',
                'years_in_business': 'yearsInBusiness',
                'fleetSize': 'fleetSize',
                'fleet_size': 'fleetSize',
                'radiusOfOperation': 'radiusOfOperation',
                'radius_of_operation': 'radiusOfOperation',
                'commodityHauled': 'commodityHauled',
                'commodity_hauled': 'commodityHauled',
                'operatingStates': 'operatingStates',
                'operating_states': 'operatingStates',
                'phone': 'phone',
                'email': 'email',
                'premium': 'premium',
                'notes': 'notes',
                'transcriptText': 'transcriptText',
                'status': 'status'
            };

            const mappedField = fieldMapping[fieldName] || fieldName;

            // Update in insurance_leads
            const insuranceIndex = insurance_leads.findIndex(l => String(l.id) === leadId);
            if (insuranceIndex !== -1) {
                insurance_leads[insuranceIndex][mappedField] = value;
                console.log(`✅ Updated ${mappedField} in insurance_leads`);
            }

            // Update in regular leads
            const regularIndex = regular_leads.findIndex(l => String(l.id) === leadId);
            if (regularIndex !== -1) {
                regular_leads[regularIndex][mappedField] = value;
                console.log(`✅ Updated ${mappedField} in leads`);
            }

            // Save to both localStorage keys
            localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
            localStorage.setItem('leads', JSON.stringify(regular_leads));

            // Update in memory store
            if (window.leadStore && window.leadStore[leadId]) {
                window.leadStore[leadId][mappedField] = value;
            }

            // CRITICAL: Save to server API with full lead object
            try {
                // Get the full lead object
                let leadToUpdate = insurance_leads.find(l => String(l.id) === leadId) ||
                                  regular_leads.find(l => String(l.id) === leadId);

                // If not in localStorage, fetch from server
                if (!leadToUpdate) {
                    const apiUrl = window.VANGUARD_API_URL ||
                                 (window.location.hostname === 'localhost'
                                   ? 'http://localhost:3001'
                                   : `http://${window.location.hostname}:3001`);

                    const getResponse = await fetch(`${apiUrl}/api/leads`);
                    const allLeads = await getResponse.json();
                    leadToUpdate = allLeads.find(l => String(l.id) === leadId);
                }

                if (leadToUpdate) {
                    // Update the field in the lead object (already done above in localStorage)
                    leadToUpdate[mappedField] = value;
                    leadToUpdate.updatedAt = new Date().toISOString();

                    // Use the correct API URL and POST method
                    const apiUrl = window.VANGUARD_API_URL ||
                                 (window.location.hostname === 'localhost'
                                   ? 'http://localhost:3001'
                                   : `http://${window.location.hostname}:3001`);

                    const response = await fetch(`${apiUrl}/api/leads`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(leadToUpdate)
                    });

                    if (response.ok) {
                        console.log(`✅ ${fieldName} updated in API`);
                    } else {
                        console.warn('API update failed, but saved locally');
                    }
                } else {
                    console.error('Lead not found for update');
                }
            } catch (error) {
                console.log('API not available, saved locally only:', error);
            }

            // Show success notification
            if (window.showNotification) {
                showNotification(`${fieldName} updated`, 'success');
            }

        } catch (error) {
            console.error('Error updating field:', error);
            if (window.showNotification) {
                showNotification('Error updating field', 'error');
            }
        }
    };

    console.log('✅ Unified stage saving fix loaded - all leads will now save properly!');

    // Override the premium update function to save to server
    window.updateLeadPremium = async function(leadId, newPremium) {
        console.log(`💰 Updating lead premium: ${leadId} → ${newPremium}`);

        // Use the existing updateLeadField function which already saves to server
        return window.updateLeadField(leadId, 'premium', newPremium);
    };

    console.log('✅ Premium field will now save to server!');
})();