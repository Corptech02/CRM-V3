// Final fix for the lead profile modal issue
console.log('Applying final profile fix...');
console.log('✅ Enhanced profile with transcription, vehicles, and full details is loading...');

// Store the original functions
const originalViewLead = window.viewLead;
const originalShowLeadProfile = window.showLeadProfile;

// Create a flag to prevent multiple opens
let profileIsOpen = false;

// Function to get reach out status based on current progress
function getReachOutStatus(lead) {
    console.log(`🐛 DEBUG getReachOutStatus called for lead:`, lead.id, lead.name);

    const reachOut = lead.reachOut || {
        callAttempts: 0,
        callsConnected: 0,
        emailCount: 0,
        textCount: 0,
        voicemailCount: 0
    };

    console.log(`🐛 DEBUG getReachOutStatus - reachOut data:`, reachOut);
    console.log(`🐛 DEBUG getReachOutStatus - lead stage: ${lead.stage}`);

    // FIRST: Check if stage requires reach out (NOT info_received - that needs quote preparation)
    // If stage doesn't require reach out, return empty (no TO DO and no REACH OUT COMPLETE)
    if (!(lead.stage === 'quoted' || lead.stage === 'info_requested' ||
        lead.stage === 'quote_sent' || lead.stage === 'interested')) {
        console.log(`🐛 DEBUG getReachOutStatus - stage ${lead.stage} doesn't require reach out`);
        return ''; // No TO DO for stages that don't require reach out
    }

    // SECOND: Check if connected call was made - if yes, reach out is complete
    if (reachOut.callsConnected > 0) {
        console.log(`🐛 DEBUG getReachOutStatus - connected call found (${reachOut.callsConnected}), complete!`);

        // If no completion timestamp exists, assign one NOW to freeze the time
        if (!reachOut.reachOutCompletedAt) {
            const frozenTimestamp = new Date().toISOString();
            console.log(`🧊 LEGACY COMPLETION - Freezing timestamp for lead ${lead.id}: ${frozenTimestamp}`);

            // Update the lead with frozen timestamp
            assignFrozenTimestamp(lead.id, frozenTimestamp);
            reachOut.reachOutCompletedAt = frozenTimestamp;
        }

        // NEW: Check if reach out has expired (older than 2 days)
        const completedTime = new Date(reachOut.reachOutCompletedAt);
        const currentTime = new Date();
        const timeDifferenceMs = currentTime.getTime() - completedTime.getTime();
        const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);

        if (timeDifferenceDays > 2) {
            console.log(`🔄 PROFILE VIEW - REACH OUT EXPIRED: Lead ${lead.id}, completed ${timeDifferenceDays.toFixed(1)} days ago`);
            return `<span style="color: #f59e0b; font-size: 18px;">REACH OUT EXPIRED! (${timeDifferenceDays.toFixed(1)} days ago) - Needs New Reach Out</span>`;
        }

        const completedTimestamp = new Date(reachOut.reachOutCompletedAt).toLocaleString();
        return `<span style="color: #10b981; font-size: 18px;">REACH OUT COMPLETE! - ${completedTimestamp}</span>`;
    }

    // THIRD: Stage requires reach out, determine what needs to be done
    // Determine next action based on what's been done - SIMPLE SEQUENCE
    if (reachOut.textCount > 0) {
        console.log(`🐛 DEBUG getReachOutStatus - text sent (${reachOut.textCount}), complete!`);

        // If no completion timestamp exists, assign one NOW to freeze the time
        if (!reachOut.reachOutCompletedAt) {
            const frozenTimestamp = new Date().toISOString();
            console.log(`🧊 LEGACY COMPLETION - Freezing timestamp for lead ${lead.id}: ${frozenTimestamp}`);

            // Update the lead with frozen timestamp
            assignFrozenTimestamp(lead.id, frozenTimestamp);
            reachOut.reachOutCompletedAt = frozenTimestamp;
        }

        // NEW: Check if reach out has expired (older than 2 days)
        const completedTime = new Date(reachOut.reachOutCompletedAt);
        const currentTime = new Date();
        const timeDifferenceMs = currentTime.getTime() - completedTime.getTime();
        const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);

        if (timeDifferenceDays > 2) {
            console.log(`🔄 PROFILE VIEW - REACH OUT EXPIRED: Lead ${lead.id}, completed ${timeDifferenceDays.toFixed(1)} days ago`);
            return `<span style="color: #f59e0b; font-size: 18px;">REACH OUT EXPIRED! (${timeDifferenceDays.toFixed(1)} days ago) - Needs New Reach Out</span>`;
        }

        // All outreach methods attempted
        const completedTimestamp = new Date(reachOut.reachOutCompletedAt).toLocaleString();
        return `<span style="color: #10b981; font-size: 18px;">REACH OUT COMPLETE! - ${completedTimestamp}</span>`;
    } else if (reachOut.emailCount > 0) {
        console.log(`🐛 DEBUG getReachOutStatus - email sent (${reachOut.emailCount}) but no texts (${reachOut.textCount}), returning Text Lead`);
        return '<span style="color: #dc2626;">TO DO - Text Lead</span>';
    } else if (reachOut.callAttempts > 0) {
        console.log(`🐛 DEBUG getReachOutStatus - call made (${reachOut.callAttempts}) but no emails (${reachOut.emailCount}), returning Email Lead`);
        return '<span style="color: #dc2626;">TO DO - Email Lead</span>';
    } else {
        console.log(`🐛 DEBUG getReachOutStatus - nothing done yet, returning Call Lead`);
        return '<span style="color: #dc2626;">TO DO - Call Lead</span>';
    }
}

// Function to assign a frozen timestamp to legacy completed reach outs
function assignFrozenTimestamp(leadId, frozenTimestamp) {
    try {
        // Update insurance_leads
        let insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const insuranceIndex = insuranceLeads.findIndex(l => String(l.id) === String(leadId));
        if (insuranceIndex !== -1 && insuranceLeads[insuranceIndex].reachOut) {
            insuranceLeads[insuranceIndex].reachOut.reachOutCompletedAt = frozenTimestamp;
            localStorage.setItem('insurance_leads', JSON.stringify(insuranceLeads));
            console.log(`🧊 FROZEN - Updated insurance_leads for lead ${leadId}`);
        }

        // Update regular leads
        let regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const regularIndex = regularLeads.findIndex(l => String(l.id) === String(leadId));
        if (regularIndex !== -1 && regularLeads[regularIndex].reachOut) {
            regularLeads[regularIndex].reachOut.reachOutCompletedAt = frozenTimestamp;
            localStorage.setItem('leads', JSON.stringify(regularLeads));
            console.log(`🧊 FROZEN - Updated regular leads for lead ${leadId}`);
        }

        // Also update memory store if it exists
        if (window.leadStore && window.leadStore[leadId] && window.leadStore[leadId].reachOut) {
            window.leadStore[leadId].reachOut.reachOutCompletedAt = frozenTimestamp;
            console.log(`🧊 FROZEN - Updated memory store for lead ${leadId}`);
        }

    } catch (error) {
        console.error(`❌ Error assigning frozen timestamp for lead ${leadId}:`, error);
    }
}

// Function to update reach out status display
window.updateReachOutStatus = function(leadId) {
    console.log(`🐛 DEBUG updateReachOutStatus called for leadId: ${leadId}`);

    // Re-fetch the leads to get the most current data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    console.log(`🐛 DEBUG updateReachOutStatus - found lead:`, lead?.reachOut);

    if (lead) {
        const statusDiv = document.getElementById(`reach-out-status-${leadId}`);
        if (statusDiv) {
            const newStatus = getReachOutStatus(lead);
            console.log(`🐛 DEBUG updateReachOutStatus - setting new status:`, newStatus);
            statusDiv.innerHTML = newStatus;
        } else {
            console.log(`🐛 DEBUG updateReachOutStatus - status div not found: reach-out-status-${leadId}`);
        }
    } else {
        console.log(`🐛 DEBUG updateReachOutStatus - lead not found for id: ${leadId}`);
    }
};

// DON'T override viewLead - let fix-viewlead-proper.js handle it
// Just provide the createEnhancedProfile function
console.log('Skipping viewLead override - using fix-viewlead-proper.js version instead');

// Create the enhanced profile modal
window.createEnhancedProfile = function createEnhancedProfile(lead) {
    // Remove any existing modals
    const existing = document.getElementById('lead-profile-container');
    if (existing) {
        existing.remove();
    }
    
    // Initialize data if needed - ensure arrays are properly created
    if (!lead.vehicles || !Array.isArray(lead.vehicles)) lead.vehicles = [];
    if (!lead.trailers || !Array.isArray(lead.trailers)) lead.trailers = [];
    if (!lead.drivers || !Array.isArray(lead.drivers)) lead.drivers = [];
    if (!lead.transcriptText) lead.transcriptText = '';

    console.log('Lead data initialized:', {
        vehiclesCount: lead.vehicles.length,
        trailersCount: lead.trailers.length,
        driversCount: lead.drivers.length
    });
    
    // Always show the enhanced profile for ALL leads
    const isCommercialAuto = true; // Force enhanced profile for all leads
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'lead-profile-container';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 1200px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    // Build the HTML based on whether it's commercial auto
    let profileHTML = '';
    
    if (isCommercialAuto) {
        profileHTML = `
            <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h2 style="margin: 0; font-size: 24px;"><i class="fas fa-truck"></i> Commercial Auto Lead Profile</h2>
                <button class="close-btn" id="profile-close-btn" style="position: absolute; top: 20px; right: 20px; font-size: 30px; background: none; border: none; cursor: pointer;">&times;</button>
            </div>
            
            <div style="padding: 20px;">
                <!-- Lead Stage (standalone at top) -->
                <div class="profile-section" style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-chart-line"></i> Lead Stage</h3>
                    <div>
                        <label style="font-weight: 600; font-size: 12px;">Current Stage:</label>
                            <select id="lead-stage-${lead.id}" onchange="updateLeadStage('${lead.id}', this.value)"
                                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                                <option value="contact_attempted" ${lead.stage === 'contact_attempted' ? 'selected' : ''}>Contact Attempted</option>
                                <option value="info_requested" ${lead.stage === 'info_requested' || lead.stage === 'qualified' ? 'selected' : ''}>Info Requested</option>
                                <option value="info_received" ${lead.stage === 'info_received' ? 'selected' : ''}>Info Received</option>
                                <option value="loss_runs_requested" ${lead.stage === 'loss_runs_requested' ? 'selected' : ''}>Loss Runs Requested</option>
                                <option value="loss_runs_received" ${lead.stage === 'loss_runs_received' ? 'selected' : ''}>Loss Runs Received</option>
                                <option value="app_prepared" ${lead.stage === 'app_prepared' ? 'selected' : ''}>App Prepared</option>
                                <option value="app_sent" ${lead.stage === 'app_sent' ? 'selected' : ''}>App Sent</option>
                                <option value="app_quote_received" ${lead.stage === 'app_quote_received' ? 'selected' : ''}>App Quote Received</option>
                                <option value="app_quote_sent" ${lead.stage === 'app_quote_sent' ? 'selected' : ''}>App Quote Sent</option>
                                <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                                <option value="quote_sent" ${lead.stage === 'quote_sent' || lead.stage === 'quoted sent' ? 'selected' : ''}>Quote Sent</option>
                                <option value="interested" ${lead.stage === 'interested' || lead.stage === 'intested' ? 'selected' : ''}>Interested</option>
                                <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                                <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                            </select>
                            <div id="stage-timestamp-${lead.id}">
                            ${(() => {
                                // Display stage timestamp
                                let timestamp = null;
                                const stage = lead.stage || 'new';

                                console.log('Checking timestamp for lead:', lead.id, 'Stage:', stage);
                                console.log('stageTimestamps:', lead.stageTimestamps);

                                // Ensure stageTimestamps exists
                                if (!lead.stageTimestamps) {
                                    console.log('No stageTimestamps object, initializing...');
                                    // Initialize and save if missing
                                    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                                    const leadIndex = leads.findIndex(l => l.id == lead.id);
                                    if (leadIndex !== -1) {
                                        leads[leadIndex].stageTimestamps = {};
                                        // Set current stage timestamp to creation date or now
                                        const defaultTimestamp = lead.createdAt || lead.created || new Date().toISOString();
                                        leads[leadIndex].stageTimestamps[stage] = defaultTimestamp;
                                        localStorage.setItem('insurance_leads', JSON.stringify(leads));
                                        lead.stageTimestamps = leads[leadIndex].stageTimestamps;
                                        timestamp = defaultTimestamp;
                                    }
                                } else if (lead.stageTimestamps[stage]) {
                                    timestamp = lead.stageTimestamps[stage];
                                    console.log('Found stage timestamp:', timestamp);
                                } else {
                                    // No timestamp for this stage, use creation date
                                    timestamp = lead.createdAt || lead.created;
                                    console.log('No stage timestamp, using creation date:', timestamp);
                                }

                                if (timestamp) {
                                    const now = new Date();
                                    let stageDate = new Date(timestamp);

                                    // Check if date is valid
                                    if (isNaN(stageDate.getTime())) {
                                        console.log('Invalid timestamp:', timestamp);
                                        return '<div style="margin-top: 8px; color: #6b7280; font-size: 12px;">No valid timestamp</div>';
                                    }

                                    // Only fix future dates if they're truly in the future
                                    const originalYear = stageDate.getFullYear();
                                    const currentYear = new Date().getFullYear();
                                    if (originalYear > currentYear) {
                                        console.log(`Fixing future year ${originalYear} to ${currentYear}`);
                                        stageDate.setFullYear(currentYear);
                                    }

                                    // Calculate difference in days properly (ignoring time)
                                    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                    const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
                                    const diffTime = nowDate - compareDate;
                                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                                    console.log('Date comparison:', {
                                        stageDate: stageDate.toISOString(),
                                        now: now.toISOString(),
                                        diffDays: diffDays
                                    });

                                    let timestampColor;
                                    if (diffDays === 0) {
                                        timestampColor = '#10b981'; // Green for today
                                    } else if (diffDays === 1) {
                                        timestampColor = '#f59e0b'; // Yellow for yesterday
                                    } else if (diffDays < 7) {
                                        timestampColor = '#fb923c'; // Orange for 2-6 days
                                    } else {
                                        timestampColor = '#ef4444'; // Red for 7+ days
                                    }

                                    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                                    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
                                    const dateStr = stageDate.toLocaleDateString('en-US', dateOptions);
                                    const timeStr = stageDate.toLocaleTimeString('en-US', timeOptions);

                                    // Show actual date, not "Today"
                                    const timestampText = dateStr + ' at ' + timeStr;

                                    const tooltipText = diffDays === 0 ? 'Updated today' : diffDays === 1 ? 'Updated yesterday' : 'Updated ' + diffDays + ' days ago';
                                    return '<div style="margin-top: 8px;">' +
                                        '<span style="' +
                                        'background-color: ' + timestampColor + ';' +
                                        'color: white;' +
                                        'padding: 4px 10px;' +
                                        'border-radius: 12px;' +
                                        'font-size: 12px;' +
                                        'font-weight: 500;' +
                                        'display: inline-block;' +
                                        '" title="' + tooltipText + '">' +
                                        '<i class="fas fa-clock" style="margin-right: 4px;"></i>' +
                                        timestampText +
                                        '</span>' +
                                        '</div>';
                                } else {
                                    return '<div style="margin-top: 8px; color: #6b7280; font-size: 12px;">No timestamp available</div>';
                                }
                            })()}
                            </div>
                    </div>
                </div>

                <!-- Other Lead Details -->
                <div class="profile-section" style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-info-circle"></i> Lead Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Lead Status:</label>
                            <select onchange="updateLeadStatus('${lead.id}', this.value)"
                                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="Active" ${lead.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Inactive" ${lead.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                <option value="Pending" ${lead.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Converted" ${lead.status === 'Converted' ? 'selected' : ''}>Converted</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Premium:</label>
                            <input type="text" id="lead-premium-${lead.id}"
                                   value="${lead.premium || ''}"
                                   placeholder="Enter premium amount"
                                   onchange="updateLeadPremium('${lead.id}', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Win/Loss:</label>
                            <select id="lead-winloss-${lead.id}"
                                    onchange="updateWinLossStatus('${lead.id}', this.value)"
                                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="neutral" ${(!lead.win_loss || lead.win_loss === 'neutral') ? 'selected' : ''}>Neutral</option>
                                <option value="win" ${lead.win_loss === 'win' ? 'selected' : ''}>Win</option>
                                <option value="loss" ${lead.win_loss === 'loss' ? 'selected' : ''}>Loss</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Assigned To:</label>
                            <select id="lead-assignedTo-${lead.id}"
                                    onchange="updateLeadAssignedTo('${lead.id}', this.value)"
                                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="">Unassigned</option>
                                <option value="Grant" ${lead.assignedTo === 'Grant' ? 'selected' : ''}>Grant</option>
                                <option value="Hunter" ${lead.assignedTo === 'Hunter' ? 'selected' : ''}>Hunter</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Reach Out Checklist -->
                <div class="profile-section" style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;"><i class="fas fa-tasks"></i> Reach Out</h3>
                        <div id="reach-out-status-${lead.id}" style="font-weight: bold; font-size: 16px;">
                            ${getReachOutStatus(lead)}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="email-sent-${lead.id}"
                                       onchange="updateReachOut('${lead.id}', 'email', this.checked)"
                                       ${lead.reachOut && lead.reachOut.emailSent ? 'checked' : ''}
                                       style="width: 20px; height: 20px; cursor: pointer;">
                                <label for="email-sent-${lead.id}" style="font-weight: 600; cursor: pointer;">Email Sent</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-weight: 600;">Sent:</span>
                                <span id="email-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">
                                    ${lead.reachOut ? lead.reachOut.emailCount || 0 : 0}
                                </span>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="text-sent-${lead.id}"
                                       onchange="updateReachOut('${lead.id}', 'text', this.checked)"
                                       ${lead.reachOut && lead.reachOut.textSent ? 'checked' : ''}
                                       style="width: 20px; height: 20px; cursor: pointer;">
                                <label for="text-sent-${lead.id}" style="font-weight: 600; cursor: pointer;">Text Sent</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-weight: 600;">Sent:</span>
                                <span id="text-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">
                                    ${lead.reachOut ? lead.reachOut.textCount || 0 : 0}
                                </span>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="call-made-${lead.id}"
                                       onchange="updateReachOut('${lead.id}', 'call', this.checked)"
                                       ${lead.reachOut && lead.reachOut.callMade ? 'checked' : ''}
                                       style="width: 20px; height: 20px; cursor: pointer;">
                                <label for="call-made-${lead.id}" style="font-weight: 600; cursor: pointer;">Called</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 600;">Attempts:</span>
                                    <span id="call-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">
                                        ${lead.reachOut ? lead.reachOut.callAttempts || 0 : 0}
                                    </span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 600;">Connected:</span>
                                    <span id="call-connected-${lead.id}" style="font-weight: bold; font-size: 18px; color: #10b981; min-width: 30px; text-align: center;">
                                        ${lead.reachOut ? lead.reachOut.callsConnected || 0 : 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 10px; padding-left: 30px;">
                            <span style="font-weight: 600;">Voicemail Sent:</span>
                            <span id="voicemail-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #f59e0b; min-width: 30px; text-align: center;">
                                ${lead.reachOut ? lead.reachOut.voicemailCount || 0 : 0}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Company Information -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Company Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Company Name:</label>
                            <input type="text" value="${lead.name || ''}"
                                   onchange="updateLeadField('${lead.id}', 'name', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Contact:</label>
                            <input type="text" value="${lead.contact || ''}"
                                   onchange="updateLeadField('${lead.id}', 'contact', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Phone:</label>
                            <input type="text" value="${lead.phone || ''}"
                                   onchange="updateLeadField('${lead.id}', 'phone', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Email:</label>
                            <input type="text" value="${lead.email || ''}"
                                   onchange="updateLeadField('${lead.id}', 'email', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">DOT Number:</label>
                            <input type="text" value="${lead.dotNumber || ''}"
                                   onchange="updateLeadField('${lead.id}', 'dotNumber', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">MC Number:</label>
                            <input type="text" value="${lead.mcNumber || ''}"
                                   onchange="updateLeadField('${lead.id}', 'mcNumber', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Years in Business:</label>
                            <input type="text" value="${lead.yearsInBusiness || ''}"
                                   onchange="updateLeadField('${lead.id}', 'yearsInBusiness', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Renewal Date:</label>
                            <input type="text" value="${lead.renewalDate || lead.expirationDate || ''}" placeholder="MM/DD/YYYY"
                                   onchange="updateLeadField('${lead.id}', 'renewalDate', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>
                
                <!-- Operation Details -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Operation Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Radius of Operation:</label>
                            <input type="text" value="${lead.radiusOfOperation || ''}" placeholder="e.g., 500 miles"
                                   onchange="updateLeadField('${lead.id}', 'radiusOfOperation', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Commodity Hauled:</label>
                            <input type="text" value="${lead.commodityHauled || ''}" placeholder="e.g., General Freight"
                                   onchange="updateLeadField('${lead.id}', 'commodityHauled', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Operating States:</label>
                            <input type="text" value="${lead.operatingStates || ''}" placeholder="e.g., TX, LA, OK"
                                   onchange="updateLeadField('${lead.id}', 'operatingStates', this.value)"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>
                
                <!-- Vehicles -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-truck"></i> Vehicles (${(lead.vehicles && lead.vehicles.length) || 0})</h3>
                        <button class="btn-small btn-primary" onclick="addVehicleToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Vehicle
                        </button>
                    </div>
                    ${(lead.vehicles && lead.vehicles.length > 0) ? lead.vehicles.map((v, i) => `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px; position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong>Vehicle #${i + 1}</strong>
                                <button onclick="deleteVehicleFromLead('${lead.id}', ${i})"
                                        style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                        title="Delete Vehicle">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                                <input type="text" value="${v.year || ''}" placeholder="Year" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.make || ''}" placeholder="Make" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.model || ''}" placeholder="Model" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.vin || ''}" placeholder="VIN" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.value || ''}" placeholder="Value" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.type || ''}" placeholder="Type" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${v.gvwr || ''}" placeholder="GVWR" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                        </div>
                    `).join('') : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No vehicles added yet</p>'}
                </div>
                
                <!-- Trailers -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-trailer"></i> Trailers (${(lead.trailers && lead.trailers.length) || 0})</h3>
                        <button class="btn-small btn-primary" onclick="addTrailerToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Trailer
                        </button>
                    </div>
                    ${(lead.trailers && lead.trailers.length > 0) ? lead.trailers.map((t, i) => `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px; position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong>Trailer #${i + 1}</strong>
                                <button onclick="deleteTrailerFromLead('${lead.id}', ${i})"
                                        style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                        title="Delete Trailer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                                <input type="text" value="${t.year || ''}" placeholder="Year" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.make || ''}" placeholder="Make" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.type || ''}" placeholder="Type" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.vin || ''}" placeholder="VIN" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.length || ''}" placeholder="Length" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${t.value || ''}" placeholder="Value" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                        </div>
                    `).join('') : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No trailers added yet</p>'}
                </div>
                
                <!-- Drivers -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-id-card"></i> Drivers (${(lead.drivers && lead.drivers.length) || 0})</h3>
                        <button class="btn-small btn-primary" onclick="addDriverToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Driver
                        </button>
                    </div>
                    ${(lead.drivers && lead.drivers.length > 0) ? lead.drivers.map((d, i) => `
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px; position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong>Driver #${i + 1}</strong>
                                <button onclick="deleteDriverFromLead('${lead.id}', ${i})"
                                        style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                        title="Delete Driver">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                                <input type="text" value="${d.name || ''}" placeholder="Name" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.license || ''}" placeholder="License #" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.cdlType || ''}" placeholder="CDL Type" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.experience || ''}" placeholder="Experience" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.endorsements || ''}" placeholder="Endorsements" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.mvr || ''}" placeholder="MVR Status" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" value="${d.violations || ''}" placeholder="Violations" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                        </div>
                    `).join('') : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No drivers added yet</p>'}
                </div>
                
                <!-- Call Transcript -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-microphone"></i> Call Transcript</h3>
                    <textarea onchange="updateLeadField('${lead.id}', 'transcriptText', this.value)"
                              style="width: 100%; min-height: 150px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace;">${lead.transcriptText || ''}</textarea>
                </div>
                
                <!-- Quote Submissions -->
                <div class="profile-section" style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-contract"></i> Quote Submissions</h3>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="createQuoteApplication('${lead.id}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-file-alt"></i> Quote Application
                            </button>
                            <button onclick="addQuoteSubmission('${lead.id}')" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-plus"></i> Add Quote
                            </button>
                        </div>
                    </div>
                    <div id="quote-submissions-container">
                        ${generateQuoteSubmissionsHTML(lead)}
                    </div>
                </div>

                <!-- Application Submissions -->
                <div class="profile-section" style="background: #f0f9f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-signature"></i> Application Submissions</h3>
                    </div>
                    <div id="application-submissions-container-${lead.id}">
                        <p style="color: #9ca3af; text-align: center; padding: 20px;">No quote applications yet</p>
                    </div>
                </div>

                <!-- Loss Runs -->
                <div class="profile-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-pdf"></i> Loss Runs and Other Documentation</h3>
                        <div style="display: flex; gap: 10px;">
                            <button id="email-doc-btn-${lead.id}" onclick="checkFilesAndOpenEmail('${lead.id}')"
                                    style="background: #0066cc; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-envelope"></i> Email Documentation
                            </button>
                            <button onclick="openLossRunsUpload('${lead.id}')"
                                    style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-upload"></i> Upload Documentation
                            </button>
                        </div>
                    </div>
                    <div id="loss-runs-container-${lead.id}">
                        <p style="color: #9ca3af; text-align: center; padding: 20px;">No loss runs uploaded yet</p>
                    </div>
                </div>

                <!-- Notes -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                    <textarea onchange="updateLeadField('${lead.id}', 'notes', this.value)"
                              style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;">${lead.notes || ''}</textarea>
                </div>
            </div>
        `;
    } else {
        // Standard lead profile
        profileHTML = `
            <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h2 style="margin: 0; font-size: 24px;"><i class="fas fa-user"></i> Lead Profile</h2>
                <button class="close-btn" id="profile-close-btn" style="position: absolute; top: 20px; right: 20px; font-size: 30px; background: none; border: none; cursor: pointer;">&times;</button>
            </div>
            
            <div style="padding: 20px;">
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                    <h3>Contact Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Name:</label>
                            <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Phone:</label>
                            <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Email:</label>
                            <input type="text" value="${lead.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Product:</label>
                            <input type="text" value="${lead.product || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    modalContent.innerHTML = profileHTML;
    modalContainer.appendChild(modalContent);

    // Add to page
    document.body.appendChild(modalContainer);

    // Auto-load loss runs files immediately after profile creation
    console.log('🎯 Profile created, loading loss runs for lead:', lead.id);
    setTimeout(() => {
        console.log('🔄 First attempt: refreshLossRunsDisplay for:', lead.id);
        refreshLossRunsDisplay(lead.id);
    }, 200);

    // Additional attempts to ensure loading
    setTimeout(() => {
        console.log('🔄 Second attempt: refreshLossRunsDisplay for:', lead.id);
        refreshLossRunsDisplay(lead.id);
    }, 1000);

    setTimeout(() => {
        console.log('🔄 Third attempt: refreshLossRunsDisplay for:', lead.id);
        refreshLossRunsDisplay(lead.id);
    }, 2000);

    // Execute auto-loading script for Application Submissions (since inline scripts don't execute via innerHTML)
    setTimeout(() => {
        const leadId = lead.id;
        console.log('🔄🔄🔄 AUTO-LOADING SCRIPT STARTING for lead:', leadId);
        console.log('🕒 Timestamp:', new Date().toLocaleTimeString());
        console.log('🔍 Checking window.showApplicationSubmissions:', typeof window.showApplicationSubmissions);
        console.log('🔍 Available functions:', Object.keys(window).filter(k => k.includes('Application')));

        // Load applications immediately without delay
        if (window.showApplicationSubmissions) {
            console.log('✅ showApplicationSubmissions function found, calling immediately');
            console.log('🎯 About to call showApplicationSubmissions with leadId:', leadId);
            try {
                const result = showApplicationSubmissions(leadId);
                console.log('📞 showApplicationSubmissions call result:', result);
            } catch (error) {
                console.error('💥 Error calling showApplicationSubmissions:', error);
            }
        } else {
            console.log('⏱️ showApplicationSubmissions not available yet, waiting 50ms...');
            // If function not available yet, wait a bit and try again
            setTimeout(() => {
                console.log('🔄 Retry - Checking window.showApplicationSubmissions:', typeof window.showApplicationSubmissions);
                if (window.showApplicationSubmissions) {
                    console.log('✅ showApplicationSubmissions found on retry, calling now');
                    try {
                        const result = showApplicationSubmissions(leadId);
                        console.log('📞 showApplicationSubmissions retry call result:', result);
                    } catch (error) {
                        console.error('💥 Error calling showApplicationSubmissions on retry:', error);
                    }
                } else {
                    console.log('❌ showApplicationSubmissions still not available after 50ms');
                    console.log('🔍 Available functions now:', Object.keys(window).filter(k => k.includes('Application')));

                    // Try one more time after a longer delay
                    setTimeout(() => {
                        console.log('🔄 Final retry - Checking window.showApplicationSubmissions:', typeof window.showApplicationSubmissions);
                        if (window.showApplicationSubmissions) {
                            console.log('✅ showApplicationSubmissions found on final retry');
                            try {
                                const result = showApplicationSubmissions(leadId);
                                console.log('📞 showApplicationSubmissions final retry result:', result);
                            } catch (error) {
                                console.error('💥 Error calling showApplicationSubmissions on final retry:', error);
                            }
                        } else {
                            console.log('❌ FAILED: showApplicationSubmissions never became available');
                            console.log('🔍 Final available functions:', Object.keys(window).filter(k => k.includes('app') || k.includes('App')));
                        }
                    }, 200);
                }
            }, 50);
        }
    }, 100);
    
    // Set up close handlers
    setTimeout(() => {
        // Close button
        const closeBtn = document.getElementById('profile-close-btn');
        if (closeBtn) {
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                closeLeadProfile();
            };
        }
        
        // Click outside to close
        modalContainer.onclick = function(e) {
            if (e.target === modalContainer) {
                closeLeadProfile();
            }
        };
        
        // Prevent clicks inside modal from closing
        modalContent.onclick = function(e) {
            e.stopPropagation();
        };
    }, 100);
}

// Override close function
window.closeLeadProfile = function() {
    console.log('Closing lead profile');
    const container = document.getElementById('lead-profile-container');
    if (container) {
        container.remove();
    }
    profileIsOpen = false;
};

// Fix all eye icon buttons when DOM changes
function fixAllEyeIcons() {
    const buttons = document.querySelectorAll('button[onclick*="viewLead"]');
    console.log(`Fixing ${buttons.length} eye icon buttons`);
    
    buttons.forEach(btn => {
        // Get the lead ID from onclick attribute
        const onclickStr = btn.getAttribute('onclick');
        if (onclickStr) {
            const match = onclickStr.match(/viewLead\((\d+)\)/);
            if (match) {
                const leadId = parseInt(match[1]);
                
                // Remove old onclick
                btn.removeAttribute('onclick');
                
                // Add new handler
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.log('Eye button clicked for lead:', leadId);
                    window.viewLead(leadId);
                    return false;
                };
            }
        }
    });
}

// Run fix after page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixAllEyeIcons, 1000);
});

// Monitor for DOM changes and reapply fixes
const observer = new MutationObserver(function(mutations) {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if leads table was added
            for (let node of mutation.addedNodes) {
                if (node.nodeType === 1 && (node.id === 'leadsTableBody' || node.querySelector && node.querySelector('#leadsTableBody'))) {
                    console.log('Leads table detected, fixing eye icons');
                    setTimeout(fixAllEyeIcons, 100);
                    break;
                }
            }
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Quote submission functions
function generateQuoteSubmissionsHTML(lead) {
    if (!lead.quoteSubmissions) {
        lead.quoteSubmissions = [];
    }
    
    if (lead.quoteSubmissions.length === 0) {
        return '<p style="color: #9ca3af; text-align: center; padding: 20px;">No quotes submitted yet</p>';
    }
    
    return lead.quoteSubmissions.map((quote, index) => `
        <div class="quote-submission" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #1f2937;">Quote #${index + 1}</h4>
                <button onclick="deleteQuoteSubmission('${lead.id}', ${index})" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Insurance Company:</label>
                    <input type="text" value="${quote.insuranceCompany || ''}" onchange="updateQuoteField('${lead.id}', ${index}, 'insuranceCompany', this.value)" 
                           style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Premium ($):</label>
                    <input type="number" value="${quote.premium || ''}" onchange="updateQuoteField('${lead.id}', ${index}, 'premium', this.value)" 
                           style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;" placeholder="0.00">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Deductible ($):</label>
                    <input type="number" value="${quote.deductible || ''}" onchange="updateQuoteField('${lead.id}', ${index}, 'deductible', this.value)" 
                           style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;" placeholder="0.00">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Coverage Amount ($):</label>
                    <input type="text" value="${quote.coverageAmount || ''}" onchange="updateQuoteField('${lead.id}', ${index}, 'coverageAmount', this.value)" 
                           style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;" placeholder="e.g., $1,000,000">
                </div>
            </div>
            <div style="margin-top: 10px;">
                <label style="font-weight: 600; font-size: 12px; color: #374151;">Quote File:</label>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
                    <input type="file" id="quote-file-${lead.id}-${index}" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                           onchange="handleQuoteFileUpload('${lead.id}', ${index}, this)" 
                           style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                    ${quote.fileName ? `
                        <span style="color: #10b981; font-size: 12px;">
                            <i class="fas fa-file"></i> ${quote.fileName}
                        </span>
                        <button onclick="downloadQuoteFile('${lead.id}', ${index})" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div style="margin-top: 10px;">
                <label style="font-weight: 600; font-size: 12px; color: #374151;">Notes:</label>
                <textarea onchange="updateQuoteField('${lead.id}', ${index}, 'notes', this.value)" 
                          style="width: 100%; min-height: 60px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; margin-top: 5px;" 
                          placeholder="Add any notes about this quote...">${quote.notes || ''}</textarea>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                Submitted: ${quote.dateSubmitted || new Date().toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

window.addQuoteSubmission = function(leadId) {
    console.log('Adding quote submission for lead:', leadId);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex === -1) {
        alert('Lead not found');
        return;
    }
    
    // Initialize quoteSubmissions if not exists
    if (!leads[leadIndex].quoteSubmissions) {
        leads[leadIndex].quoteSubmissions = [];
    }
    
    // Add new quote submission
    const newQuote = {
        id: Date.now(),
        insuranceCompany: '',
        premium: '',
        deductible: '',
        coverageAmount: '',
        fileName: '',
        fileData: '',
        notes: '',
        dateSubmitted: new Date().toLocaleDateString()
    };
    
    leads[leadIndex].quoteSubmissions.push(newQuote);
    
    // Save back to localStorage
    localStorage.setItem('leads', JSON.stringify(leads));
    
    // Refresh the quote submissions section
    const container = document.getElementById('quote-submissions-container');
    if (container) {
        container.innerHTML = generateQuoteSubmissionsHTML(leads[leadIndex]);
    }
};

window.deleteQuoteSubmission = function(leadId, quoteIndex) {
    if (confirm('Are you sure you want to delete this quote submission?')) {
        console.log('Deleting quote submission:', leadId, quoteIndex);
        
        // Get leads from localStorage
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(l => l.id == leadId);
        
        if (leadIndex !== -1 && leads[leadIndex].quoteSubmissions) {
            leads[leadIndex].quoteSubmissions.splice(quoteIndex, 1);
            
            // Save back to localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Refresh the quote submissions section
            const container = document.getElementById('quote-submissions-container');
            if (container) {
                container.innerHTML = generateQuoteSubmissionsHTML(leads[leadIndex]);
            }
        }
    }
};

window.updateQuoteField = function(leadId, quoteIndex, field, value) {
    console.log('Updating quote field:', leadId, quoteIndex, field, value);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex !== -1 && leads[leadIndex].quoteSubmissions && leads[leadIndex].quoteSubmissions[quoteIndex]) {
        leads[leadIndex].quoteSubmissions[quoteIndex][field] = value;
        
        // Save back to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));
    }
};

window.handleQuoteFileUpload = function(leadId, quoteIndex, input) {
    const file = input.files[0];
    if (!file) return;
    
    console.log('Uploading quote file:', file.name);
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        input.value = '';
        return;
    }
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = function(e) {
        // Get leads from localStorage
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(l => l.id == leadId);
        
        if (leadIndex !== -1 && leads[leadIndex].quoteSubmissions && leads[leadIndex].quoteSubmissions[quoteIndex]) {
            leads[leadIndex].quoteSubmissions[quoteIndex].fileName = file.name;
            leads[leadIndex].quoteSubmissions[quoteIndex].fileData = e.target.result;
            leads[leadIndex].quoteSubmissions[quoteIndex].fileSize = file.size;
            
            // Save back to localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Refresh the quote submissions section
            const container = document.getElementById('quote-submissions-container');
            if (container) {
                container.innerHTML = generateQuoteSubmissionsHTML(leads[leadIndex]);
            }
            
            alert('File uploaded successfully!');
        }
    };
    
    reader.readAsDataURL(file);
};

// Function to create quote application from lead
window.createQuoteApplication = function(leadId) {
    console.log('Creating quote application for lead:', leadId);
    
    // Get the lead data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
        alert('Lead not found');
        return;
    }
    
    // Use the QuoteApplication class if available
    if (typeof QuoteApplication !== 'undefined') {
        const app = new QuoteApplication();
        app.createApplicationFromLead(lead);
    } else {
        console.error('QuoteApplication class not loaded');
        alert('Quote Application feature is not available yet. Please refresh the page.');
    }
};

window.downloadQuoteFile = function(leadId, quoteIndex) {
    console.log('Downloading quote file:', leadId, quoteIndex);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);
    
    if (leadIndex !== -1 && leads[leadIndex].quoteSubmissions && leads[leadIndex].quoteSubmissions[quoteIndex]) {
        const quote = leads[leadIndex].quoteSubmissions[quoteIndex];
        
        if (quote.fileData && quote.fileName) {
            // Create download link
            const link = document.createElement('a');
            link.href = quote.fileData;
            link.download = quote.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('No file available for download');
        }
    }
};

// Lead stage and status update functions
window.updateLeadStage = async function(leadId, newStage) {
    console.log('🔄 updateLeadStage called - Lead ID:', leadId, 'New Stage:', newStage);

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);

    if (leadIndex !== -1) {
        const oldStage = leads[leadIndex].stage;

        // Always update timestamp when stage changes, regardless of old vs new
        if (!leads[leadIndex].stageTimestamps) {
            leads[leadIndex].stageTimestamps = {};
        }

        // Update the stage
        leads[leadIndex].stage = newStage;

        // ALWAYS set current timestamp for the new stage when it's selected
        const currentTimestamp = new Date().toISOString();
        leads[leadIndex].stageTimestamps[newStage] = currentTimestamp;
        leads[leadIndex].updatedAt = currentTimestamp;

        console.log(`Stage updated to ${newStage}, timestamp set to ${currentTimestamp}`);

        // Update the timestamp display immediately
        const timestampContainer = document.getElementById(`stage-timestamp-${leadId}`);
        if (timestampContainer) {
            // Re-render the timestamp
            const now = new Date();
            const stageDate = new Date(currentTimestamp);

            // Since it's just updated, it should always be "today" with green color
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
        }

        // Save back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

        // Immediately update the row highlighting without waiting for full refresh
        console.log(`🎨 IMMEDIATE: Removing green highlight for lead ${leadId} stage change to ${newStage}`);

        // Find the specific row and handle highlighting immediately
        const leadRow = document.querySelector(`tr[data-lead-id="${leadId}"]`);
        if (leadRow) {
            console.log(`🎨 Found row for lead ${leadId}, handling highlight change`);

            // Check if new stage requires reach out
            const stageRequiresReachOut = (newStage === 'quoted' || newStage === 'info_requested' ||
                                         newStage === 'quote_sent' || newStage === 'interested');

            if (stageRequiresReachOut) {
                // Clear the flag so highlighting can work normally
                delete leadRow.dataset.noGreenHighlight;
                console.log(`🎨 IMMEDIATE: Cleared noGreenHighlight flag for reach-out stage ${newStage}`);
            } else {
                // Remove green highlight classes and styles immediately - FORCE OVERRIDE
                leadRow.classList.remove('reach-out-complete', 'nuclear-highlight');
                leadRow.style.setProperty('background-color', 'transparent', 'important');
                leadRow.style.setProperty('border-left', 'none', 'important');
                leadRow.style.setProperty('border-right', 'none', 'important');
                leadRow.style.setProperty('opacity', '1', 'important');
                leadRow.style.setProperty('filter', 'none', 'important');

                // Add a flag to prevent re-highlighting for non-reach-out stages
                leadRow.dataset.noGreenHighlight = 'true';
                console.log(`🎨 IMMEDIATE: Added noGreenHighlight flag for non-reach-out stage ${newStage}`);
            }

            console.log(`🎨 IMMEDIATE: Handled highlighting for lead ${leadId} stage ${newStage}`);
        } else {
            console.log(`🎨 Could not find row for lead ${leadId}`);
        }

        // Also do full table refresh as backup
        if (window.loadLeadsView && document.getElementById('leadsTableBody')) {
            setTimeout(() => {
                console.log('🔄 Calling loadLeadsView to refresh highlighting after stage change');
                window.loadLeadsView();
            }, 100);
        }

        // Save to server
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const response = fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ stage: newStage })
            });

            if (response.ok) {
                console.log('Stage updated in server');
                showNotification('Lead stage updated to: ' + newStage, 'success');
            } else {
                console.error('Failed to update stage in server');
                showNotification('Stage saved locally but server update failed', 'warning');
            }
        } catch (error) {
            console.error('Error updating stage in server:', error);
            showNotification('Stage saved locally but server update failed', 'warning');
        }

        // If the leads view is active, refresh it - DISABLED to prevent duplicate tables
        // if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
        //     if (window.loadLeadsView) {
        //         setTimeout(() => {
        //             window.loadLeadsView();
        //         }, 500);
        //     }
        // }
    }
};

window.updateLeadStatus = async function(leadId, newStatus) {
    console.log('Updating lead status:', leadId, newStatus);

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);

    if (leadIndex !== -1) {
        leads[leadIndex].status = newStatus;

        // Save back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

        // Save to server
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const response = fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                console.log('Status updated in server');
                showNotification('Lead status updated to: ' + newStatus, 'success');
            } else {
                console.error('Failed to update status in server');
                showNotification('Status saved locally but server update failed', 'warning');
            }
        } catch (error) {
            console.error('Error updating status in server:', error);
            showNotification('Status saved locally but server update failed', 'warning');
        }

        // If the leads view is active, refresh it - DISABLED to prevent duplicate tables
        // if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
        //     if (window.loadLeadsView) {
        //         setTimeout(() => {
        //             window.loadLeadsView();
        //         }, 500);
        //     }
        // }
    }
};

// Universal function to update any lead field
window.updateLeadField = async function(leadId, fieldName, value) {
    console.log(`Updating lead field: ${fieldName} = ${value} for lead ${leadId}`);

    // Map frontend field names to API field names
    const fieldMapping = {
        'name': 'company_name',
        'contact': 'contact_name',
        'dotNumber': 'dot_number',
        'mcNumber': 'mc_number',
        'yearsInBusiness': 'years_in_business',
        'fleetSize': 'fleet_size',
        'radiusOfOperation': 'radius_of_operation',
        'commodityHauled': 'commodity_hauled',
        'operatingStates': 'operating_states'
    };

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        // Update in localStorage
        leads[leadIndex][fieldName] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));
        console.log(`Updated ${fieldName} in localStorage`);

        // Update in API
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const apiFieldName = fieldMapping[fieldName] || fieldName;
            const updateData = {};
            updateData[apiFieldName] = value;

            const response = fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                console.log(`${fieldName} updated in API`);
                showNotification(`${fieldName} updated successfully`, 'success');
            } else {
                console.error(`Failed to update ${fieldName} in API`);
                showNotification(`${fieldName} saved locally but API update failed`, 'warning');
            }
        } catch (error) {
            console.error('Error updating API:', error);
            showNotification(`${fieldName} saved locally but API update failed`, 'warning');
        }
    } else {
        console.error('Lead not found in localStorage with ID:', leadId);
        showNotification('Could not find lead to update', 'error');
    }
};

window.updateLeadPremium = async function(leadId, newPremium) {
    console.log('Updating lead premium:', leadId, newPremium);

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    console.log('Found', leads.length, 'leads in localStorage');

    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
    console.log('Lead index:', leadIndex);

    if (leadIndex !== -1) {
        leads[leadIndex].premium = newPremium;
        console.log('Updated lead object:', leads[leadIndex]);

        // Save back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));
        console.log('Saved to localStorage');

        // Also update in API
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const response = fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ premium: newPremium })
            });

            if (response.ok) {
                console.log('Premium updated in API');
                // Show success message
                showNotification('Lead premium updated to: $' + newPremium, 'success');

                // Refresh the leads table to show updated premium with correct color
                const lead = leads[leadIndex];
                refreshLeadsTable(leadId, newPremium, lead.win_loss);
            } else {
                console.error('Failed to update premium in API');
                showNotification('Premium saved locally but API update failed', 'warning');
            }
        } catch (error) {
            console.error('Error updating API:', error);
            showNotification('Premium saved locally but API update failed', 'warning');
            // Still refresh the table with local changes
            const lead = leads[leadIndex];
            refreshLeadsTable(leadId, newPremium, lead.win_loss);
        }
    } else {
        console.error('Lead not found in localStorage with ID:', leadId);
        showNotification('Could not find lead to update', 'error');
    }
};

window.updateLeadPriority = function(leadId, newPriority) {
    console.log('Updating lead priority:', leadId, newPriority);

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);

    if (leadIndex !== -1) {
        leads[leadIndex].priority = newPriority;

        // Save back to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));

        // Show success message
        showNotification('Lead priority updated to: ' + newPriority, 'success');
    }
};

window.updateLeadAssignedTo = async function(leadId, assignedTo) {
    console.log('Updating lead assigned to:', leadId, assignedTo);

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        leads[leadIndex].assignedTo = assignedTo;

        // Save back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

        // Save to server
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const response = fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assignedTo: assignedTo })
            });

            if (response.ok) {
                console.log('Assigned To updated in server');
                showNotification('Lead assigned to: ' + (assignedTo || 'Unassigned'), 'success');
            } else {
                console.error('Failed to update Assigned To in server');
                showNotification('Assigned To saved locally but server update failed', 'warning');
            }
        } catch (error) {
            console.error('Error updating Assigned To in server:', error);
            showNotification('Assigned To saved locally but server update failed', 'warning');
        }

        // Refresh the leads view if active - DISABLED to prevent tab switching issues
        // if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
        //     if (window.loadLeadsView) {
        //         setTimeout(() => {
        //             window.loadLeadsView();
        //         }, 500);
        //     }
        // }
    }
};

window.updateWinLossStatus = async function(leadId, status) {
    console.log('Updating win/loss status:', leadId, status);

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    console.log('Found', leads.length, 'leads in localStorage');

    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
    console.log('Lead index:', leadIndex);

    if (leadIndex !== -1) {
        leads[leadIndex].win_loss = status;
        console.log('Updated lead object:', leads[leadIndex]);

        // Save back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));
        console.log('Saved to localStorage');

        // Also update in API
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const response = fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ win_loss: status })
            });

            if (response.ok) {
                console.log('Win/Loss status updated in API');
                // Show success message
                showNotification('Win/Loss status updated to: ' + status, 'success');

                // Refresh the leads table to show updated color
                const lead = leads[leadIndex];
                refreshLeadsTable(leadId, lead.premium, status);
            } else {
                console.error('Failed to update win/loss in API');
                showNotification('Win/Loss saved locally but API update failed', 'warning');
            }
        } catch (error) {
            console.error('Error updating API:', error);
            showNotification('Win/Loss saved locally but API update failed', 'warning');

            // Still refresh the table with local changes
            const lead = leads[leadIndex];
            refreshLeadsTable(leadId, lead.premium, status);
        }
    } else {
        console.error('Lead not found in localStorage with ID:', leadId);
        showNotification('Could not find lead to update', 'error');
    }
};

window.updateLeadScore = function(leadId, newScore) {
    console.log('Updating lead score:', leadId, newScore);

    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id == leadId);

    if (leadIndex !== -1) {
        leads[leadIndex].leadScore = parseInt(newScore);

        // Save back to localStorage
        localStorage.setItem('leads', JSON.stringify(leads));

        // Show success message
        showNotification('Lead score updated to: ' + newScore + '%', 'success');
        
        // If the leads view is active, refresh it - DISABLED to prevent duplicate tables
        // if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
        //     if (window.loadLeadsView) {
        //         setTimeout(() => {
        //             window.loadLeadsView();
        //         }, 500);
        //     }
        // }
    }
};

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.getElementById('notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'notification-toast';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    notification.innerHTML = `<span style="font-size: 18px;">${icon}</span> ${message}`;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animation styles if not already present
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Function to update Reach Out checkbox status
window.updateReachOut = function(leadId, type, checked) {
    console.log(`🐛 DEBUG updateReachOut called: leadId=${leadId}, type=${type}, checked=${checked}`);

    // Get current leads
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    console.log(`🐛 DEBUG found lead at index: ${leadIndex}`);

    if (leadIndex !== -1) {
        // Log current state BEFORE changes
        console.log(`🐛 DEBUG BEFORE changes - lead reachOut:`, leads[leadIndex].reachOut);

        // Initialize reachOut object if it doesn't exist
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {
                emailSent: false,
                emailCount: 0,
                textSent: false,
                textCount: 0,
                callMade: false,
                callAttempts: 0
            };
            console.log(`🐛 DEBUG initialized reachOut object`);
        }

        // Update the specific checkbox and increment counter if checked
        if (type === 'email') {
            const wasAlreadyChecked = leads[leadIndex].reachOut.emailSent;
            console.log(`🐛 DEBUG EMAIL - wasAlreadyChecked: ${wasAlreadyChecked}, newState: ${checked}`);
            console.log(`🐛 DEBUG EMAIL - current emailCount: ${leads[leadIndex].reachOut.emailCount}`);

            leads[leadIndex].reachOut.emailSent = checked;

            if (checked && !wasAlreadyChecked) {
                // Increment counter only if going from unchecked to checked
                const oldCount = leads[leadIndex].reachOut.emailCount || 0;
                leads[leadIndex].reachOut.emailCount = oldCount + 1;
                console.log(`🐛 DEBUG EMAIL - INCREMENTED counter from ${oldCount} to ${leads[leadIndex].reachOut.emailCount}`);
            } else if (!checked && wasAlreadyChecked) {
                // Decrement counter if going from checked to unchecked
                const oldCount = leads[leadIndex].reachOut.emailCount || 0;
                leads[leadIndex].reachOut.emailCount = Math.max(0, oldCount - 1);
                console.log(`🐛 DEBUG EMAIL - DECREMENTED counter from ${oldCount} to ${leads[leadIndex].reachOut.emailCount}`);
            } else {
                console.log(`🐛 DEBUG EMAIL - NO COUNTER CHANGE needed (wasChecked=${wasAlreadyChecked}, newState=${checked})`);
            }

            // Update the display
            const countDisplay = document.getElementById(`email-count-${leadId}`);
            if (countDisplay) {
                countDisplay.textContent = leads[leadIndex].reachOut.emailCount;
                console.log(`🐛 DEBUG EMAIL - updated display to show: ${leads[leadIndex].reachOut.emailCount}`);
            } else {
                console.log(`🐛 DEBUG EMAIL - count display element not found: email-count-${leadId}`);
            }

        } else if (type === 'text') {
            const wasAlreadyChecked = leads[leadIndex].reachOut.textSent;
            console.log(`🐛 DEBUG TEXT - wasAlreadyChecked: ${wasAlreadyChecked}, newState: ${checked}`);
            console.log(`🐛 DEBUG TEXT - current textCount: ${leads[leadIndex].reachOut.textCount}`);

            leads[leadIndex].reachOut.textSent = checked;

            if (checked && !wasAlreadyChecked) {
                // Increment counter only if going from unchecked to checked
                const oldCount = leads[leadIndex].reachOut.textCount || 0;
                leads[leadIndex].reachOut.textCount = oldCount + 1;
                console.log(`🐛 DEBUG TEXT - INCREMENTED counter from ${oldCount} to ${leads[leadIndex].reachOut.textCount}`);
            } else if (!checked && wasAlreadyChecked) {
                // Decrement counter if going from checked to unchecked
                const oldCount = leads[leadIndex].reachOut.textCount || 0;
                leads[leadIndex].reachOut.textCount = Math.max(0, oldCount - 1);
                console.log(`🐛 DEBUG TEXT - DECREMENTED counter from ${oldCount} to ${leads[leadIndex].reachOut.textCount}`);
            } else {
                console.log(`🐛 DEBUG TEXT - NO COUNTER CHANGE needed (wasChecked=${wasAlreadyChecked}, newState=${checked})`);
            }

            // Update the display
            const countDisplay = document.getElementById(`text-count-${leadId}`);
            if (countDisplay) {
                countDisplay.textContent = leads[leadIndex].reachOut.textCount;
                console.log(`🐛 DEBUG TEXT - updated display to show: ${leads[leadIndex].reachOut.textCount}`);
            } else {
                console.log(`🐛 DEBUG TEXT - count display element not found: text-count-${leadId}`);
            }
        } else if (type === 'call') {
            if (checked) {
                // Always show popup when checkbox is checked (not just first time)
                // Show popup to ask about call outcome
                console.log(`🐛 DEBUG CALL - showing popup for leadId: ${leadId}`);
                showCallOutcomePopup(leadId);

                // Don't increment counter here - let the popup handle it based on outcome
                // Don't save here either - let the popup handle saving
                return; // Exit early - let popup handle everything
            }
            leads[leadIndex].reachOut.callMade = checked;
            console.log(`🐛 DEBUG CALL - set callMade to: ${checked}`);
        }

        // Log state AFTER changes but BEFORE save
        console.log(`🐛 DEBUG AFTER changes - lead reachOut:`, leads[leadIndex].reachOut);

        // Save to localStorage
        console.log(`🐛 DEBUG - saving to localStorage...`);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

        // Verify the save worked
        const savedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const savedLead = savedLeads.find(l => String(l.id) === String(leadId));
        console.log(`🐛 DEBUG - verification - saved lead reachOut:`, savedLead?.reachOut);

        // Check if reach out is now completed and set completion timestamp if needed
        const reachOut = leads[leadIndex].reachOut || {};
        const wasCompleted = reachOut.reachOutCompletedAt;
        const isNowCompleted = (reachOut.callsConnected > 0) || (reachOut.textCount > 0);

        if (isNowCompleted && !wasCompleted) {
            // Just became completed - set the completion timestamp
            leads[leadIndex].reachOut.reachOutCompletedAt = new Date().toISOString();
            console.log(`🎯 REACH OUT COMPLETION - Set timestamp: ${leads[leadIndex].reachOut.reachOutCompletedAt}`);

            // Re-save with the completion timestamp
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));
        } else if (!isNowCompleted && wasCompleted) {
            // No longer completed - remove the completion timestamp
            delete leads[leadIndex].reachOut.reachOutCompletedAt;
            console.log(`🎯 REACH OUT UN-COMPLETION - Removed timestamp`);

            // Re-save without the completion timestamp
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));
        }

        // NOW update reach out status AFTER data is saved
        if (type === 'email' || type === 'text') {
            console.log(`🐛 DEBUG ${type.toUpperCase()} - calling updateReachOutStatus AFTER save`);
            updateReachOutStatus(leadId);

            // DON'T refresh table for email/text - it overwrites data with server sync!
            // The status update above is sufficient to update the modal display
            console.log(`🐛 DEBUG ${type.toUpperCase()} - SKIPPING table refresh to prevent server data overwrite`);
        }

        // Save to database
        fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leads[leadIndex])
        }).catch(error => console.error('Error saving reach out status:', error));

        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} ${checked ? 'marked' : 'unmarked'}`, 'success');
    }
};

// Function to show call outcome popup
window.showCallOutcomePopup = function(leadId) {
    // Remove any existing popup
    const existingPopup = document.getElementById('call-outcome-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    const existingBackdrop = document.getElementById('popup-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'popup-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999999;
    `;
    document.body.appendChild(backdrop);

    // Create popup
    const popup = document.createElement('div');
    popup.id = 'call-outcome-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 1000000;
        width: 350px;
    `;

    popup.innerHTML = `
        <div style="text-align: center;">
            <h3 style="margin-top: 0;">Call Outcome</h3>
            <p style="font-size: 16px; margin: 20px 0;">Did they answer?</p>

            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
                <button onclick="handleCallOutcome('${leadId}', true)" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">Yes</button>
                <button onclick="handleCallOutcome('${leadId}', false)" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">No</button>
            </div>

            <div id="voicemail-question" style="display: none;">
                <p style="font-size: 16px; margin: 20px 0;">Did you leave a voicemail?</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="handleVoicemailOutcome('${leadId}', true)" style="
                        background: #f59e0b;
                        color: white;
                        border: none;
                        padding: 10px 30px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    ">Yes</button>
                    <button onclick="handleVoicemailOutcome('${leadId}', false)" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 30px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    ">No</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(popup);
};

// Function to handle call outcome
window.handleCallOutcome = function(leadId, answered) {
    console.log(`🐛 DEBUG handleCallOutcome called: leadId=${leadId}, answered=${answered}`);

    // Get current leads
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        console.log(`🐛 DEBUG handleCallOutcome - BEFORE changes:`, leads[leadIndex].reachOut);

        // Initialize reachOut object if it doesn't exist
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {
                emailSent: false,
                emailCount: 0,
                textSent: false,
                textCount: 0,
                callMade: false,
                callAttempts: 0,
                callsConnected: 0,
                voicemailCount: 0
            };
            console.log(`🐛 DEBUG handleCallOutcome - initialized reachOut object`);
        }

        // Always increment attempts counter (for every call)
        const oldCallAttempts = leads[leadIndex].reachOut.callAttempts || 0;
        leads[leadIndex].reachOut.callAttempts = oldCallAttempts + 1;
        leads[leadIndex].reachOut.callMade = true;

        console.log(`🐛 DEBUG handleCallOutcome - INCREMENTED callAttempts from ${oldCallAttempts} to ${leads[leadIndex].reachOut.callAttempts}`);
        console.log(`🐛 DEBUG handleCallOutcome - AFTER changes:`, leads[leadIndex].reachOut);

        // Update the attempts display
        const attemptsDisplay = document.getElementById(`call-count-${leadId}`);
        if (attemptsDisplay) {
            attemptsDisplay.textContent = leads[leadIndex].reachOut.callAttempts;
        }

        if (answered) {
            // Lead answered - increment connected counter
            leads[leadIndex].reachOut.callsConnected = (leads[leadIndex].reachOut.callsConnected || 0) + 1;

            // Update the display
            const connectedDisplay = document.getElementById(`call-connected-${leadId}`);
            if (connectedDisplay) {
                connectedDisplay.textContent = leads[leadIndex].reachOut.callsConnected;
            }

            // Set completion timestamp when call connects (reach out becomes complete)
            if (!leads[leadIndex].reachOut.reachOutCompletedAt) {
                leads[leadIndex].reachOut.reachOutCompletedAt = new Date().toISOString();
                console.log(`🎯 REACH OUT COMPLETION (CALL CONNECTED) - Set timestamp: ${leads[leadIndex].reachOut.reachOutCompletedAt}`);
            }

            // Save to localStorage
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));

            // Update reach out status - will show COMPLETE since connected
            updateReachOutStatus(leadId);

            // Refresh leads table to update TO DO column
            if (window.loadLeadsView) {
                setTimeout(() => window.loadLeadsView(), 100);
            }

            // Save to database
            fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leads[leadIndex])
            }).catch(error => console.error('Error saving call outcome:', error));

            showNotification('Call connected successfully logged', 'success');

            // Close popup and backdrop
            const popup = document.getElementById('call-outcome-popup');
            if (popup) {
                popup.remove();
            }
            const backdrop = document.getElementById('popup-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        } else {
            // Lead didn't pick up - save current state and update status
            console.log(`🐛 DEBUG handleCallOutcome - answered=false, saving call attempt data`);

            // Save to localStorage first so status update works
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));

            // Verify the save worked
            const savedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const savedLead = savedLeads.find(l => String(l.id) === String(leadId));
            console.log(`🐛 DEBUG handleCallOutcome - VERIFIED save, callAttempts now:`, savedLead?.reachOut?.callAttempts);

            // Update reach out status now that call attempt is recorded
            console.log(`🐛 DEBUG handleCallOutcome - calling updateReachOutStatus`);
            updateReachOutStatus(leadId);

            // Refresh leads table to update TO DO column
            if (window.loadLeadsView) {
                setTimeout(() => window.loadLeadsView(), 100);
            }

            // Show voicemail question
            const voicemailQuestion = document.getElementById('voicemail-question');
            if (voicemailQuestion) {
                voicemailQuestion.style.display = 'block';
            }

            // Hide the first question buttons
            const buttons = document.querySelectorAll('#call-outcome-popup button');
            buttons[0].style.display = 'none';
            buttons[1].style.display = 'none';
        }
    }
};

// Function to handle voicemail outcome
window.handleVoicemailOutcome = function(leadId, leftVoicemail) {
    console.log('Voicemail outcome:', { leadId, leftVoicemail });

    // Get current leads
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        if (leftVoicemail) {
            // Initialize reachOut object if it doesn't exist
            if (!leads[leadIndex].reachOut) {
                leads[leadIndex].reachOut = {
                    emailSent: false,
                    emailCount: 0,
                    textSent: false,
                    textCount: 0,
                    callMade: false,
                    callAttempts: 0,
                    callsConnected: 0,
                    voicemailCount: 0
                };
            }

            // Increment voicemail counter
            leads[leadIndex].reachOut.voicemailCount = (leads[leadIndex].reachOut.voicemailCount || 0) + 1;

            // Update the display
            const voicemailDisplay = document.getElementById(`voicemail-count-${leadId}`);
            if (voicemailDisplay) {
                voicemailDisplay.textContent = leads[leadIndex].reachOut.voicemailCount;
            }

            // Save to localStorage first
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));

            // Save to database
            fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leads[leadIndex])
            }).catch(error => console.error('Error saving voicemail outcome:', error));

            showNotification('Voicemail sent logged', 'success');
        } else {
            // No voicemail left, just log the notification
            showNotification('Call attempt logged', 'success');
        }

        // Don't update reach out status here - it was already updated when they said "No" to answering
        // We already have the correct status showing "TO DO - Email Lead"
    }

    // Close popup and backdrop
    const popup = document.getElementById('call-outcome-popup');
    if (popup) {
        popup.remove();
    }
    const backdrop = document.getElementById('popup-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
};

// Function no longer needed since counters are read-only and updated by checkboxes
// Kept for backwards compatibility but does nothing
window.updateReachOutCount = function(leadId, type, count) {
    // This function is deprecated - counters are now updated automatically by checkboxes
};

// Function to apply user assignment dulling to entire leads table
window.applyUserAssignmentDulling = function() {
    console.log('👤👤👤 Applying user assignment dulling to entire table');

    // Get current user from auth service
    let currentUser = 'Grant'; // Default fallback
    try {
        const userInfo = authService?.getCurrentUser() || JSON.parse(localStorage.getItem('userInfo') || '{}');
        currentUser = userInfo.name || userInfo.username || userInfo.email || 'Grant';
        console.log('👤 Current user for dulling:', currentUser);
    } catch (error) {
        console.log('👤 Using fallback current user for dulling:', currentUser);
    }

    // Get all lead data from localStorage
    const insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const allLeads = [...insurance_leads, ...regular_leads];

    // Find all rows in leads table
    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) {
        console.log('👤 Leads table not found for dulling');
        return;
    }

    const rows = tableBody.querySelectorAll('tr');
    console.log(`👤 Processing ${rows.length} rows for user assignment dulling`);

    rows.forEach(row => {
        // Find lead ID for this row
        let leadId = null;
        const buttons = row.querySelectorAll('button[onclick*="viewLead"]');
        buttons.forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            const match = onclick?.match(/viewLead\(['"]([^'"]+)['"]\)/);
            if (match) {
                leadId = match[1];
            }
        });

        if (!leadId) return;

        // Find lead data
        const leadData = allLeads.find(l => String(l.id) === String(leadId));
        if (!leadData) return;

        // Check if lead belongs to current user
        const isAssignedToCurrentUser = !leadData.assignedTo ||
                                      leadData.assignedTo === currentUser ||
                                      leadData.assignedTo === 'Unassigned';

        console.log(`👤 Lead ${leadData.name} (${leadId}) - assignedTo: ${leadData.assignedTo} - isCurrentUser: ${isAssignedToCurrentUser}`);

        if (!isAssignedToCurrentUser) {
            // DULL other users' leads
            row.style.setProperty('opacity', '0.5', 'important');
            row.style.setProperty('filter', 'brightness(0.7)', 'important');
            row.classList.add('lead-dull', 'other-user-lead');
            row.setAttribute('data-user-assignment', 'other');
            console.log(`🔒 Dulled lead: ${leadData.name}`);
        } else {
            // BRIGHTEN current user's leads
            row.style.removeProperty('opacity');
            row.style.removeProperty('filter');
            row.classList.remove('lead-dull', 'other-user-lead');
            row.setAttribute('data-user-assignment', 'current');
            console.log(`🔓 Brightened lead: ${leadData.name}`);
        }
    });

    console.log('👤👤👤 User assignment dulling complete');

    // FINAL GREEN HIGHLIGHT CLEANUP PASS - Run AFTER all other highlighting systems
    setTimeout(() => {
        console.log('🧹 FINAL CLEANUP: Starting green highlight removal for all rows with TO DO text');

        const allLeadRows = document.querySelectorAll('tr[data-lead-id]');
        let cleanupCount = 0;

        allLeadRows.forEach(row => {
            // Find the TO DO cell (column 6 based on logs)
            const todoCell = row.cells[6];
            if (todoCell) {
                const todoText = todoCell.textContent.trim();
                console.log('🔍 CLEANUP DEBUG: Checking TO DO cell text:', `"${todoText}"`, 'Length:', todoText.length);

                // If there's TO DO text, remove any green highlighting
                if (todoText && todoText.length > 0 && todoText !== 'Reach out complete') {
                    const hasGreenHighlight = row.classList.contains('reach-out-complete') ||
                                             row.style.backgroundColor.includes('16, 185, 129') ||
                                             row.style.backgroundColor.includes('rgb(16, 185, 129)') ||
                                             row.classList.contains('force-green-highlight');

                    if (hasGreenHighlight) {
                        console.log('🧹 FINAL CLEANUP: Removing green highlight from row with TO DO text:', todoText);

                        // Remove all green highlighting classes and styles
                        row.classList.remove('reach-out-complete');
                        row.classList.remove('force-green-highlight');
                        row.style.removeProperty('background-color');
                        row.style.removeProperty('background');
                        row.style.removeProperty('border-left');
                        row.style.removeProperty('border-right');

                        // Force remove inline styles that might contain green
                        const currentStyle = row.style.cssText;
                        if (currentStyle.includes('rgb(16, 185, 129)') || currentStyle.includes('16, 185, 129')) {
                            row.style.cssText = '';
                            console.log('🧹 FINAL CLEANUP: Cleared inline styles containing green highlight');
                        }

                        cleanupCount++;
                    }
                }
            }
        });

        console.log(`🧹 FINAL CLEANUP: Complete - cleaned ${cleanupCount} rows`);
    }, 50); // Small delay to ensure this runs after all other highlighting systems
};

// Function to refresh leads table with updated premium and/or win/loss status
window.refreshLeadsTable = function(leadId, newPremium, winLossStatus) {
    console.log('🔄🔄 Refreshing leads table for lead:', leadId, 'Premium:', newPremium, 'Win/Loss:', winLossStatus);

    // If no leadId provided, can't refresh specific lead
    if (!leadId) {
        console.log('❌ No leadId provided to refreshLeadsTable');
        return;
    }

    // Get updated lead data from localStorage for TO DO calculation
    const insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const leadData = insurance_leads.find(l => String(l.id) === String(leadId)) ||
                    regular_leads.find(l => String(l.id) === String(leadId));

    if (!leadData) {
        console.log('❌ Lead data not found in localStorage for:', leadId);
        return;
    }

    console.log('✅ Found lead data for refresh:', leadData.name, 'Stage:', leadData.stage);
    console.log('🔍 FULL lead data for debugging:', JSON.stringify(leadData, null, 2));

    // If we don't have the win/loss status, get it from lead data
    if (!winLossStatus) {
        winLossStatus = leadData.win_loss;
    }

    // Find the row in the leads table
    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) {
        console.log('Leads table not found');
        return;
    }

    // Find all rows and look for the one with this lead ID
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        // Check if this row is for our lead
        const cells = row.querySelectorAll('td');
        let foundLead = false;

        // Look for the lead ID in the row (might be in a button onclick)
        const buttons = row.querySelectorAll('button[onclick*="viewLead"]');
        buttons.forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            if (onclick && onclick.includes(`viewLead('${leadId}')`)) {
                foundLead = true;
            }
        });

        if (foundLead) {
            console.log('Found lead row, updating premium display and TO DO text');

            // Get the updated lead data from localStorage to refresh TO DO text
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
            const leadData = leads.find(l => String(l.id) === String(leadId));

            // User assignment dulling is now handled by applyUserAssignmentDulling() function

            // Find the premium cell (column 4) and TO DO cell (column 6) separately
            cells.forEach((cell, index) => {
                console.log(`🔍 Checking cell ${index}: "${cell.textContent.substring(0, 30)}"`);

                // PREMIUM CELL UPDATE (Column 4 ONLY) - Only if we have premium data to update
                if (index === 4 && newPremium !== undefined && (cell.textContent.includes('$') || cell.textContent.match(/^\d+\.?\d*$/))) {
                    console.log('💰 Found premium cell at column:', index, 'Updating to:', newPremium);

                    cell.textContent = '$' + (newPremium || '0.00');

                    // Apply color based on win/loss status
                    if (winLossStatus === 'win') {
                        cell.style.color = '#059669'; // Green for win
                    } else if (winLossStatus === 'loss') {
                        cell.style.color = '#dc2626'; // Red for loss
                    } else {
                        cell.style.color = '#000000'; // Black for neutral/default
                    }

                    cell.style.fontWeight = 'bold';

                    // Add a brief highlight effect
                    cell.style.backgroundColor = '#fef3c7';
                    setTimeout(() => {
                        cell.style.backgroundColor = '';
                    }, 2000);
                }
                // TO DO CELL UPDATE (Column 6 ONLY)
                else if (index === 6) {
                    console.log('🎯 Found TO DO cell for lead:', leadId, 'Column:', index, 'Current HTML:', cell.innerHTML);

                    // Use getNextAction function like the original table generation
                    let updatedTodoHtml;
                    try {
                        if (typeof getNextAction === 'function') {
                            updatedTodoHtml = `<div style="font-weight: bold; color: black;">${getNextAction(leadData.stage || 'new', leadData)}</div>`;
                        } else if (window.getNextAction) {
                            updatedTodoHtml = `<div style="font-weight: bold; color: black;">${window.getNextAction(leadData.stage || 'new', leadData)}</div>`;
                        } else {
                            // Fallback to our getReachOutStatus if getNextAction not available
                            updatedTodoHtml = `<div style="font-weight: bold; color: black;">${getReachOutStatus(leadData)}</div>`;
                        }
                    } catch (error) {
                        console.error('🚨 ERROR in TO DO cell update:', error);
                        // Simple fallback
                        updatedTodoHtml = `<div style="font-weight: bold; color: black;">Assign Stage</div>`;
                    }

                    cell.innerHTML = updatedTodoHtml;
                    console.log('✅ TO DO cell updated to:', updatedTodoHtml);

                    // IMMEDIATE GREEN HIGHLIGHT REMOVAL: If TO DO text exists, remove green highlighting immediately
                    const row = cell.parentNode;
                    const todoText = cell.textContent.trim();
                    console.log('🔍 DEBUG: Checking for green removal - todoText:', todoText);
                    console.log('🔍 DEBUG: Row background:', row.style.backgroundColor);
                    console.log('🔍 DEBUG: Row classes:', row.className);

                    if (todoText && todoText.length > 0 && todoText !== 'Reach out complete') {
                        console.log('✅ DEBUG: Row has incomplete TO DO text, removing green highlighting');

                        // Check for any highlighting (green or timestamp colors)
                        const hasGreenHighlight = row.classList.contains('reach-out-complete') ||
                                                 row.classList.contains('nuclear-highlight') ||
                                                 row.classList.contains('force-green-highlight') ||
                                                 row.style.backgroundColor.includes('16, 185, 129') ||
                                                 row.style.backgroundColor.includes('rgb(16, 185, 129)') ||
                                                 row.style.backgroundColor.includes('rgba(16, 185, 129');

                        const hasTimestampHighlight = row.classList.contains('timestamp-yellow') ||
                                                     row.classList.contains('timestamp-orange') ||
                                                     row.classList.contains('timestamp-red') ||
                                                     row.classList.contains('timestamp-highlight') ||
                                                     row.style.backgroundColor.includes('255, 193, 7') || // yellow
                                                     row.style.backgroundColor.includes('255, 152, 0') || // orange
                                                     row.style.backgroundColor.includes('244, 67, 54');   // red

                        const hasAnyHighlight = hasGreenHighlight || hasTimestampHighlight;

                        if (hasAnyHighlight) {
                            if (hasGreenHighlight) {
                                console.log('🔴 IMMEDIATE REMOVAL: Green highlight removed - row has TO DO text:', todoText);
                            }
                            if (hasTimestampHighlight) {
                                console.log('🟡 IMMEDIATE REMOVAL: Timestamp highlight removed - stage updated:', todoText);
                            }

                            // Remove ALL possible highlighting classes
                            row.classList.remove('reach-out-complete');
                            row.classList.remove('nuclear-highlight');
                            row.classList.remove('force-green-highlight');
                            row.classList.remove('timestamp-yellow');
                            row.classList.remove('timestamp-orange');
                            row.classList.remove('timestamp-red');
                            row.classList.remove('timestamp-highlight');

                            // Remove ALL possible styling properties
                            row.style.removeProperty('background-color');
                            row.style.removeProperty('background');
                            row.style.removeProperty('border-left');
                            row.style.removeProperty('border-right');

                            // Force clear any inline styles containing highlighting colors
                            const currentStyle = row.style.cssText;
                            if (currentStyle.includes('rgb(16, 185, 129)') || currentStyle.includes('16, 185, 129') ||
                                currentStyle.includes('255, 193, 7') || currentStyle.includes('255, 152, 0') ||
                                currentStyle.includes('244, 67, 54')) {
                                row.style.cssText = '';
                                console.log('🔴 IMMEDIATE REMOVAL: Cleared inline styles containing highlight colors');
                            }

                            console.log('🔴 HIGHLIGHT REMOVAL COMPLETE: All highlighting cleared');

                            // PERSISTENT REMOVAL: Set a flag and add CSS override
                            row.setAttribute('data-prevent-green-highlight', 'true');

                            // Add CSS override style that takes priority over all other highlighting
                            if (!document.getElementById('prevent-green-highlight-style')) {
                                const style = document.createElement('style');
                                style.id = 'prevent-green-highlight-style';
                                style.textContent = `
                                    tr[data-prevent-green-highlight="true"] {
                                        background-color: transparent !important;
                                        background: transparent !important;
                                        border-left: none !important;
                                        border-right: none !important;
                                        opacity: 1 !important;
                                        filter: none !important;
                                    }
                                    tr[data-prevent-green-highlight="true"].reach-out-complete,
                                    tr[data-prevent-green-highlight="true"].nuclear-highlight,
                                    tr[data-prevent-green-highlight="true"].force-green-highlight,
                                    tr[data-prevent-green-highlight="true"].timestamp-yellow,
                                    tr[data-prevent-green-highlight="true"].timestamp-orange,
                                    tr[data-prevent-green-highlight="true"].timestamp-red,
                                    tr[data-prevent-green-highlight="true"].timestamp-highlight,
                                    tr[data-prevent-green-highlight="true"].lead-dull,
                                    tr[data-prevent-green-highlight="true"].other-user-lead {
                                        background-color: transparent !important;
                                        background: transparent !important;
                                        border-left: none !important;
                                        border-right: none !important;
                                        opacity: 1 !important;
                                        filter: none !important;
                                    }
                                `;
                                document.head.appendChild(style);
                                console.log('🎨 Added CSS override to prevent green highlighting');
                            }

                            // Schedule multiple removal attempts to override any other systems
                            setTimeout(() => {
                                if (row.getAttribute('data-prevent-green-highlight') === 'true') {
                                    row.classList.remove('reach-out-complete', 'nuclear-highlight', 'force-green-highlight',
                                                        'timestamp-yellow', 'timestamp-orange', 'timestamp-red', 'timestamp-highlight');
                                    row.style.removeProperty('background-color');
                                    row.style.removeProperty('background');
                                    row.style.removeProperty('border-left');
                                    row.style.removeProperty('border-right');
                                    const currentStyle = row.style.cssText;
                                    if (currentStyle.includes('rgb(16, 185, 129)') || currentStyle.includes('16, 185, 129') ||
                                        currentStyle.includes('255, 193, 7') || currentStyle.includes('255, 152, 0') ||
                                        currentStyle.includes('244, 67, 54')) {
                                        row.style.cssText = '';
                                    }
                                    console.log('🔴 PERSISTENT REMOVAL: All highlights removed again (100ms)');
                                }
                            }, 100);

                            setTimeout(() => {
                                if (row.getAttribute('data-prevent-green-highlight') === 'true') {
                                    row.classList.remove('reach-out-complete', 'nuclear-highlight', 'force-green-highlight',
                                                        'timestamp-yellow', 'timestamp-orange', 'timestamp-red', 'timestamp-highlight');
                                    row.style.removeProperty('background-color');
                                    row.style.removeProperty('background');
                                    row.style.removeProperty('border-left');
                                    row.style.removeProperty('border-right');
                                    const currentStyle = row.style.cssText;
                                    if (currentStyle.includes('rgb(16, 185, 129)') || currentStyle.includes('16, 185, 129') ||
                                        currentStyle.includes('255, 193, 7') || currentStyle.includes('255, 152, 0') ||
                                        currentStyle.includes('244, 67, 54')) {
                                        row.style.cssText = '';
                                    }
                                    console.log('🔴 PERSISTENT REMOVAL: All highlights removed again (500ms)');
                                }
                            }, 500);
                        } else {
                            console.log('ℹ️ DEBUG: Row has TO DO text but no green highlighting detected');
                        }
                    } else if (todoText === 'Reach out complete') {
                        console.log('🟢 DEBUG: Row has "Reach out complete" - should be green');
                        // Clear the prevention flag and ensure green highlighting
                        row.removeAttribute('data-prevent-green-highlight');
                        console.log('✅ Cleared prevention flag - allowing green highlighting for completed reach out');
                    } else {
                        console.log('ℹ️ DEBUG: Row has empty TO DO text');
                        // If TO DO text is empty, clear the prevention flag
                        row.removeAttribute('data-prevent-green-highlight');
                        console.log('✅ Cleared prevention flag - allowing normal highlighting');
                    }

                    // CRITICAL: Update lead highlighting RIGHT AFTER TO DO update (only for current user)
                    console.log('🎨🎨🎨 ALSO updating lead highlighting for:', leadId);

                    // Check if this lead was marked as current user's lead (dulling logic already ran above)
                    // row already defined above
                    const isCurrentUserLead = row.getAttribute('data-user-assignment') === 'current';

                    if (!isCurrentUserLead) {
                        console.log('🔒 Lead belongs to other user - skipping highlighting update');
                        return; // Don't apply highlighting to other users' leads
                    }

                    // Calculate highlight color based on fresh timestamp from localStorage
                    const now = new Date();
                    const stageDate = leadData.stageTimestamps && leadData.stageTimestamps[leadData.stage]
                        ? new Date(leadData.stageTimestamps[leadData.stage])
                        : leadData.createdAt ? new Date(leadData.createdAt) : new Date();

                    console.log('🎨 Using timestamp:', stageDate);
                    console.log('🎨 Current time:', now);

                    const timeDiff = now - stageDate;
                    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                    console.log('🎨 Days difference:', daysDiff);

                    // Determine highlight color - MATCH BUILT-IN TIMESTAMP COLORS EXACTLY
                    let highlightColor = '';
                    if (daysDiff === 1) {
                        highlightColor = '#fef3c7'; // Yellow - 1 day old (matches built-in)
                        console.log('🟡 Yellow highlight: 1 day old');
                    } else if (daysDiff > 1 && daysDiff < 7) {
                        highlightColor = '#fed7aa'; // Orange - 2-6 days old (matches built-in)
                        console.log('🟠 Orange highlight: 2-6 days old');
                    } else if (daysDiff >= 7) {
                        highlightColor = '#fecaca'; // Red - 7+ days old (matches built-in)
                        console.log('🔴 Red highlight: 7+ days old');
                    } else {
                        // daysDiff === 0 (today) - no highlighting
                        highlightColor = '';
                        console.log('⚪ No highlight: Today');
                    }

                    console.log('🎨 About to apply background color:', highlightColor);
                    console.log('🎨 Target row element:', cell.parentNode);
                    console.log('🎨 Row current background:', cell.parentNode.style.backgroundColor);

                    // Apply highlight to the entire row (row is accessible from cell.parentNode)
                    // Use !important to override other CSS rules
                    cell.parentNode.style.setProperty('background-color', highlightColor, 'important');

                    // CRITICAL: Update nuclear highlighting data attributes to prevent override
                    // Use the existing row variable from above
                    let nuclearColor = 'green'; // Default to green for today
                    if (daysDiff === 0) {
                        nuclearColor = 'green';
                    } else if (daysDiff <= 7) {
                        nuclearColor = 'yellow';
                    } else {
                        nuclearColor = 'red';
                    }

                    // Update the data attributes that other highlighting systems use
                    cell.parentNode.setAttribute('data-nuclear-highlight', nuclearColor);
                    cell.parentNode.setAttribute('data-nuclear-applied', 'true');
                    console.log('🎨 Updated nuclear highlighting data to:', nuclearColor);

                    // Also remove and re-add nuclear highlighting classes
                    cell.parentNode.classList.remove('nuclear-highlight-green', 'nuclear-highlight-yellow', 'nuclear-highlight-red');
                    cell.parentNode.classList.add(`nuclear-highlight-${nuclearColor}`);
                    console.log('🎨 Updated nuclear highlighting class to:', `nuclear-highlight-${nuclearColor}`);

                    console.log('🎨 Row background AFTER setting:', cell.parentNode.style.backgroundColor);
                    console.log('✅✅✅ Lead highlighting updated to:', highlightColor);
                }
            });
        }
    });

    // CRITICAL: Apply user assignment dulling after any lead update
    setTimeout(() => {
        window.applyUserAssignmentDulling();
    }, 200); // Small delay to ensure DOM updates are complete

    // Alternative: if loadLeadsView function exists, call it - DISABLED to prevent tab switching issues
    // if (window.loadLeadsView) {
    //     console.log('Calling loadLeadsView to refresh entire table');
    //     window.loadLeadsView();
    // }
}

// Show Application Submissions function
window.showApplicationSubmissions = async function(leadId) {
    console.log('🚨🚨🚨 SHOW APPLICATION SUBMISSIONS FUNCTION CALLED 🚨🚨🚨');
    console.log('📋 showApplicationSubmissions called for lead:', leadId);
    console.log('🕒 Called at:', new Date().toLocaleTimeString());
    console.log('📍 Function entry point reached successfully');

    const containerId = `application-submissions-container-${leadId}`;
    console.log('🔍 Looking for container with ID:', containerId);

    const container = document.getElementById(containerId);

    console.log('🎯 Container search result:', container ? 'FOUND ✅' : 'NOT FOUND ❌');

    if (!container) {
        console.error('❌ Application submissions container not found:', containerId);
        console.log('🔍 All elements with "application" in ID:',
            Array.from(document.querySelectorAll('[id*="application"]')).map(el => ({ id: el.id, element: el })));

        // Check if lead profile modal exists and is visible
        const leadProfileModal = document.getElementById('lead-profile-modal');
        if (leadProfileModal && leadProfileModal.style.display !== 'none') {
            console.log('🔄 Lead profile modal exists and is visible, but container missing');
            console.log('🔄 This might mean the lead profile needs to be reloaded');
            // Try to reload the lead profile which should recreate the container
            if (window.showLeadProfile) {
                console.log('🔄 Attempting to reload lead profile to recreate container...');
                window.showLeadProfile(leadId);
                return;
            }
        } else {
            console.log('❌ Lead profile modal not found or not visible');
            console.log('📦 Lead profile modal state:', {
                exists: !!leadProfileModal,
                display: leadProfileModal?.style.display,
                visible: leadProfileModal && leadProfileModal.style.display !== 'none'
            });
        }
        return;
    }

    console.log('📦 Container element:', container);
    console.log('📦 Container parent:', container.parentElement);
    console.log('📦 Container current content:', container.innerHTML.substring(0, 100) + '...');

    // Try loading from server first, then fallback to localStorage
    try {
        console.log(`📂 Loading application submissions from server for lead ${leadId}`);

        // Use the same API URL logic as the save function
        const API_URL = window.VANGUARD_API_URL || (window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`);

        // Construct the correct URL (avoid double /api/ if API_URL already includes it)
        const serverUrl = API_URL.includes('/api')
            ? `${API_URL}/app-submissions/${leadId}`
            : `${API_URL}/api/app-submissions/${leadId}`;

        console.log('📡 API_URL used:', API_URL);
        console.log('📡 Fetching from server URL:', serverUrl);
        console.log('📡 window.VANGUARD_API_URL:', window.VANGUARD_API_URL);

        const response = fetch(serverUrl);
        let applications = [];

        console.log('📡 Server fetch response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url
        });

        if (response.ok) {
            const data = response.json();
            console.log('📡 Raw server data:', data);
            applications = data.submissions || [];
            console.log(`✅ Loaded ${applications.length} applications from server for lead ${leadId}`);

            if (applications.length > 0) {
                console.log('📝 Server applications:', applications.map(app => ({
                    id: app.id,
                    leadId: app.leadId,
                    created: app.created,
                    formDataKeys: Object.keys(app.formData || {})
                })));
            }
        } else {
            console.log('⚠️ Server load failed, falling back to localStorage');

            // Fallback to localStorage
            const rawData = localStorage.getItem('appSubmissions') || '[]';
            console.log('🗂️ Raw localStorage data length:', rawData.length);
            console.log('🗂️ Raw data preview:', rawData.substring(0, 200) + '...');

            const allSubmissions = JSON.parse(rawData);
            console.log('📊 Total submissions in localStorage:', allSubmissions.length);
            console.log('📊 All submission leadIds:', allSubmissions.map(app => ({ leadId: app.leadId, id: app.id })));

            // Filter submissions for this specific lead (handle both string and number comparison)
            applications = allSubmissions.filter(app => app.leadId === leadId || app.leadId == leadId || String(app.leadId) === String(leadId));

            console.log(`🎯 Found ${applications.length} application submissions in localStorage for lead ${leadId}`);
            console.log(`🎯 Searching for leadId: "${leadId}" (type: ${typeof leadId})`);
            console.log('🎯 Available leadIds:', allSubmissions.map(app => `"${app.leadId}" (type: ${typeof app.leadId})`));
        }

        if (applications.length > 0) {
            console.log('📝 Applications:', applications.map(app => ({ id: app.id, created: app.created })));
        }

        if (applications.length === 0) {
            console.log('📭 No applications found, showing empty message');
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No quote applications yet</p>';
            return;
        }

        // Generate HTML for application submissions
        container.innerHTML = applications.map((app, index) => {
            const formData = app.formData || {};
            // Use the saved vehicleCount, or fallback to calculating it from various field patterns
            let vehicleCount = formData.vehicleCount || 0;
            if (vehicleCount === 0) {
                // Fallback: try different patterns
                vehicleCount = Object.keys(formData).filter(key =>
                    (key.includes('vehicle') && key.includes('Year')) ||
                    (key.includes('Year') && formData[key]) ||
                    key.includes('truck') ||
                    key.includes('trailer')
                ).length;
            }
            const createdDate = new Date(app.created).toLocaleDateString();

            console.log('📊 Application card data:', {
                appId: app.id,
                name: formData.name,
                dotNumber: formData.dotNumber,
                vehicleCount: vehicleCount,
                allKeys: Object.keys(formData),
                createdDate: createdDate
            });

            return `
                <div class="application-submission" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #1f2937;">Trucking Application #${index + 1}</h4>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button onclick="viewApplicationDetails('${app.id}', '${leadId}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            <button onclick="deleteApplicationSubmission('${app.id}', '${leadId}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                            <span style="color: #059669; font-weight: 600; font-size: 12px;">
                                <i class="fas fa-check-circle"></i> ${app.status || 'Saved'}
                            </span>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px; color: #374151;">Company:</label>
                            <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">${formData.name || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px; color: #374151;">DOT Number:</label>
                            <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">${formData.dotNumber || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px; color: #374151;">Vehicles:</label>
                            <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">${vehicleCount} vehicles</div>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px; color: #374151;">Created:</label>
                            <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">${createdDate}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('✅ Application submissions HTML updated successfully');

    } catch (error) {
        console.error('❌ Error loading application submissions:', error);
        container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">Error loading application submissions</p>';
    }
};

// Add new application to display without refreshing all
window.addNewApplicationToDisplay = function(leadId, applicationData) {
    console.log('➕ Adding new application to display for lead:', leadId);

    // Check if lead profile modal is visible
    const leadProfileModal = document.getElementById('lead-profile-modal');
    console.log('🔍 Lead profile modal status:', {
        exists: !!leadProfileModal,
        visible: leadProfileModal?.style.display !== 'none',
        display: leadProfileModal?.style.display
    });

    const containerId = `application-submissions-container-${leadId}`;
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('❌ Application submissions container not found:', containerId);
        console.log('🔍 Available containers with "application" in ID:',
            Array.from(document.querySelectorAll('[id*="application"]')).map(el => ({id: el.id, element: el}))
        );
        console.log('🔍 All containers with ID:',
            Array.from(document.querySelectorAll('[id]')).map(el => el.id)
        );
        return;
    }

    console.log('✅ Found container:', container);

    const formData = applicationData.formData || {};
    // Use the saved vehicleCount, or fallback to calculating it
    let vehicleCount = formData.vehicleCount || 0;
    if (vehicleCount === 0) {
        // Fallback: try different patterns
        vehicleCount = Object.keys(formData).filter(key =>
            (key.includes('vehicle') && key.includes('Year')) ||
            (key.includes('Year') && formData[key]) ||
            key.includes('truck') ||
            key.includes('trailer')
        ).length;
    }
    const createdDate = new Date(applicationData.created).toLocaleDateString();

    console.log('📋 Adding application with data:', {
        name: formData.name,
        dotNumber: formData.dotNumber,
        vehicleCount: vehicleCount,
        allKeys: Object.keys(formData)
    });

    // Check if container currently shows "No quote applications yet"
    const currentContent = container.innerHTML;
    let currentApplications = [];

    if (currentContent.includes('No quote applications yet')) {
        // First application - replace the "no applications" message
        console.log('📝 First application - replacing empty message');
    } else {
        // There are existing applications, just add to the list
        console.log('📝 Adding to existing applications');
    }

    // Get current count of applications displayed for numbering
    const existingApps = container.querySelectorAll('.application-submission').length;
    const appIndex = existingApps; // 0-based for the array, but will show as #(index+1)

    const newApplicationHTML = `
        <div class="application-submission" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #1f2937;">Trucking Application #${appIndex + 1}</h4>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="viewApplicationDetails('${applicationData.id}', '${leadId}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button onclick="deleteApplicationSubmission('${applicationData.id}', '${leadId}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <span style="color: #059669; font-weight: 600; font-size: 12px;">
                        <i class="fas fa-check-circle"></i> ${applicationData.status || 'Saved'}
                    </span>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Company:</label>
                    <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">${formData.name || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">DOT Number:</label>
                    <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">${formData.dotNumber || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Vehicles:</label>
                    <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">${vehicleCount} vehicles</div>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Created:</label>
                    <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">${createdDate}</div>
                </div>
            </div>
        </div>
    `;

    if (currentContent.includes('No quote applications yet')) {
        // Replace the empty message with the first application
        container.innerHTML = newApplicationHTML;
    } else {
        // Add to existing applications
        container.insertAdjacentHTML('beforeend', newApplicationHTML);
    }

    console.log('✅ New application added to display successfully');
};

// Delete application submission function (renamed to avoid conflict with quote-applications-view.js)
window.deleteApplicationSubmission = async function(applicationId, leadId) {
    console.log('🗑️ Deleting application:', applicationId, 'from lead:', leadId);

    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
        return;
    }

    try {
        // Delete from server first
        const API_URL = window.VANGUARD_API_URL || (window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`);

        // Construct the correct URL (avoid double /api/ if API_URL already includes it)
        const deleteUrl = API_URL.includes('/api')
            ? `${API_URL}/app-submissions/${leadId}/${applicationId}`
            : `${API_URL}/api/app-submissions/${leadId}/${applicationId}`;

        console.log('🌐 API_URL:', API_URL);
        console.log('🌐 Attempting server delete:', deleteUrl);

        let serverDeleted = false;
        try {
            const response = fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = response.json();
                console.log('✅ Server delete successful:', result);
                serverDeleted = true;
            } else {
                console.warn('⚠️ Server delete failed:', response.status, response.statusText);
            }
        } catch (serverError) {
            console.warn('⚠️ Server delete error:', serverError);
        }

        // Delete from localStorage (backup/fallback)
        let submissions = JSON.parse(localStorage.getItem('appSubmissions') || '[]');
        const originalLength = submissions.length;
        submissions = submissions.filter(app => app.id !== applicationId);
        localStorage.setItem('appSubmissions', JSON.stringify(submissions));

        const localDeleted = submissions.length < originalLength;
        console.log('💾 localStorage delete:', localDeleted ? 'SUCCESS' : 'NOT FOUND');

        if (serverDeleted || localDeleted) {
            // Refresh the display
            console.log('🔄 Refreshing application display after delete');
            showApplicationSubmissions(leadId);

            console.log('✅ Application deleted successfully');
            alert('Application deleted successfully');
        } else {
            console.error('❌ Application not found in server or localStorage');
            alert('Application not found');
        }

    } catch (error) {
        console.error('❌ Error deleting application:', error);
        alert('Error deleting application: ' + error.message);
    }
};

// View application details function
window.viewApplicationDetails = async function(applicationId, leadId) {
    console.log('👁️ Viewing application details:', applicationId, 'for lead:', leadId);

    try {
        let application = null;

        // Try to load from server first
        try {
            const API_URL = window.VANGUARD_API_URL || (window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`);

            // Construct the correct URL (avoid double /api/ if API_URL already includes it)
            const serverUrl = API_URL.includes('/api')
                ? `${API_URL}/app-submissions/${leadId}`
                : `${API_URL}/api/app-submissions/${leadId}`;

            console.log('🌐 Loading application from server:', serverUrl);

            const response = fetch(serverUrl);
            if (response.ok) {
                const data = response.json();
                const serverApplications = data.submissions || [];
                application = serverApplications.find(app => app.id === applicationId);

                if (application) {
                    console.log('✅ Found application on server:', application.id);
                } else {
                    console.log('⚠️ Application not found on server, checking localStorage');
                }
            } else {
                console.log('⚠️ Server request failed, checking localStorage');
            }
        } catch (serverError) {
            console.log('⚠️ Server error, checking localStorage:', serverError);
        }

        // Fallback to localStorage if not found on server
        if (!application) {
            console.log('💾 Searching localStorage for application');
            const submissions = JSON.parse(localStorage.getItem('appSubmissions') || '[]');
            application = submissions.find(app => app.id === applicationId);
        }

        if (!application) {
            console.error('❌ Application not found in server or localStorage');
            alert('Application not found. It may have been deleted or is not accessible from this device.');
            return;
        }

        console.log('📋 Found application:', application);

        // Use our enhanced quote modal but populated with saved data
        showEnhancedQuoteApplicationWithData(leadId, application);

    } catch (error) {
        console.error('❌ Error viewing application:', error);
        alert('Error loading application details');
    }
};

// Show read-only application function
window.showReadOnlyApplication = function(application) {
    console.log('📖 Showing read-only application');

    // Remove any existing modal
    const existingModal = document.getElementById('readonly-app-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const data = application.formData || {};

    // Create modal using similar structure but read-only
    const modal = document.createElement('div');
    modal.id = 'readonly-app-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 95%;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    content.innerHTML = `
        <button onclick="document.getElementById('readonly-app-modal').remove();"
                style="position: absolute; top: 15px; right: 15px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; color: #666; z-index: 10; display: flex; align-items: center; justify-content: center; line-height: 1;"
                onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'"
                onmouseout="this.style.backgroundColor='white'; this.style.color='#666'">
            ×
        </button>

        <div style="padding: 40px; background: white;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0066cc; padding-bottom: 20px;">
                <div style="background: #0066cc; color: white; padding: 15px; margin: -40px -40px 20px -40px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold;">VANGUARD INSURANCE GROUP</h1>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">2888 Nationwide Pkwy, Brunswick, OH 44212 • (330) 460-0872</p>
                </div>
                <div style="text-align: left; margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; color: #0066cc; font-size: 28px;">TRUCKING APPLICATION</h2>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Application ID: ${application.id}</p>
                    </div>
                    <button onclick="editApplicationDirect(${JSON.stringify(application).replace(/"/g, '&quot;')})" style="background: #f59e0b; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                        <i class="fas fa-edit"></i> Edit Application
                    </button>
                </div>
            </div>

            <!-- GENERAL INFORMATION (READ-ONLY) -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">GENERAL INFORMATION</h3>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Insured's Name:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.name || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contact Person:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.contact || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Business Phone:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.phone || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.email || 'N/A'}</div>
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Mailing Address:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.address || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">US DOT #:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.dotNumber || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">MC #:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.mcNumber || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Years in Business:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.yearsInBusiness || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- VEHICLES SUMMARY -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">SCHEDULE OF AUTOS</h3>
                <div style="padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Year</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Make/Model</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Type</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Trailer</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">VIN</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Value</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Radius</th>
                        </tr>
                        ${Array.from({length: 35}, (_, i) => i + 1).map(i => {
                            const hasData = data[`vehicle${i}Year`] || data[`vehicle${i}Make`] || data[`vehicle${i}Type`] ||
                                           data[`vehicle${i}TrailerType`] || data[`vehicle${i}VIN`] || data[`vehicle${i}Value`] ||
                                           data[`vehicle${i}Radius`];
                            return hasData ? `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`vehicle${i}Year`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`vehicle${i}Make`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`vehicle${i}Type`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`vehicle${i}TrailerType`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`vehicle${i}VIN`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`vehicle${i}Value`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`vehicle${i}Radius`] || ''}</td>
                                </tr>
                            ` : '';
                        }).join('')}
                        ${!Array.from({length: 35}, (_, i) => i + 1).some(i =>
                            data[`vehicle${i}Year`] || data[`vehicle${i}Make`] || data[`vehicle${i}Type`] ||
                            data[`vehicle${i}TrailerType`] || data[`vehicle${i}VIN`] || data[`vehicle${i}Value`] ||
                            data[`vehicle${i}Radius`]
                        ) ? '<tr><td colspan="7" style="text-align: center; color: #999; padding: 20px;">No vehicle information</td></tr>' : ''}
                    </table>
                </div>
            </div>

            <!-- SCHEDULE OF DRIVERS -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">SCHEDULE OF DRIVERS</h3>
                <div style="padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Name</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">DOB</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">License #</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Experience</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Violations</th>
                        </tr>
                        ${Array.from({length: 25}, (_, i) => i + 1).map(i => {
                            const hasData = data[`driver${i}Name`] || data[`driver${i}DOB`] || data[`driver${i}License`] ||
                                           data[`driver${i}Experience`] || data[`driver${i}Violations`];
                            return hasData ? `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`driver${i}Name`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`driver${i}DOB`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`driver${i}License`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`driver${i}Experience`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`driver${i}Violations`] || ''}</td>
                                </tr>
                            ` : '';
                        }).join('')}
                        ${!Array.from({length: 25}, (_, i) => i + 1).some(i =>
                            data[`driver${i}Name`] || data[`driver${i}DOB`] || data[`driver${i}License`] ||
                            data[`driver${i}Experience`] || data[`driver${i}Violations`]
                        ) ? '<tr><td colspan="5" style="text-align: center; color: #999; padding: 20px;">No driver information</td></tr>' : ''}
                    </table>
                </div>
            </div>

            <!-- COVERAGES -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">COVERAGES</h3>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Auto Liability:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.autoLiability || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Medical Payments:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.medicalPayments || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Comprehensive Deductible:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.comprehensiveDeductible || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Collision Deductible:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.collisionDeductible || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">General Liability:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.generalLiability || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo Limit:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.cargoLimit || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo Deductible:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.cargoDeductible || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Roadside Assistance:</label>
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">${data.roadsideAssistance || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ADDITIONAL INTERESTS -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">ADDITIONAL INTERESTS</h3>
                <div style="padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Name & Address</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Type</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">% Interest</th>
                        </tr>
                        ${Array.from({length: 5}, (_, i) => i + 1).map(i => {
                            const hasData = data[`additionalInterestName${i}`] || data[`additionalInterestAddress${i}`] ||
                                           data[`additionalInterestType${i}`] || data[`additionalInterestPercent${i}`];
                            return hasData ? `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">
                                        <div style="font-weight: bold;">${data[`additionalInterestName${i}`] || ''}</div>
                                        <div style="font-size: 10px; color: #666; margin-top: 2px;">${data[`additionalInterestAddress${i}`] || ''}</div>
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`additionalInterestType${i}`] || ''}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px;">${data[`additionalInterestPercent${i}`] || ''}</td>
                                </tr>
                            ` : '';
                        }).join('')}
                        ${!Array.from({length: 5}, (_, i) => i + 1).some(i =>
                            data[`additionalInterestName${i}`] || data[`additionalInterestAddress${i}`] ||
                            data[`additionalInterestType${i}`] || data[`additionalInterestPercent${i}`]
                        ) ? '<tr><td colspan="3" style="text-align: center; color: #999; padding: 20px;">No additional interests</td></tr>' : ''}
                    </table>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
                <button onclick="editApplicationDirect(${JSON.stringify(application).replace(/"/g, '&quot;')})" style="background: #f59e0b; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    <i class="fas fa-edit"></i> Edit Application
                </button>
                <button onclick="document.getElementById('readonly-app-modal').remove();" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    console.log('✅ Read-only application modal displayed');
};


// Direct edit function that receives the full application object
window.editApplicationDirect = function(application) {
    console.log('✏️ Direct edit application:', application);

    try {
        // Close the read-only modal
        const readOnlyModal = document.getElementById('readonly-app-modal');
        if (readOnlyModal) {
            readOnlyModal.remove();
        }

        // Check if the edit function exists
        if (typeof window.showComprehensiveApplicationForEdit === 'function') {
            console.log('✅ Calling showComprehensiveApplicationForEdit directly');
            window.showComprehensiveApplicationForEdit(application.leadId, application);
        } else if (typeof window.showComprehensiveApplicationWithData === 'function') {
            console.log('✅ Using showComprehensiveApplicationWithData directly');
            // Merge application data with form data
            const leadData = { ...application.formData, ...application };
            window.showComprehensiveApplicationWithData(application.leadId, leadData, application.id);
        } else {
            console.log('✅ Using built-in edit function');
            // Use our own built-in edit functionality
            window.showEditApplicationModal(application);
        }

    } catch (error) {
        console.error('❌ Error in direct edit:', error);
        alert('Error opening application for editing: ' + error.message);
    }
};

// Built-in edit application modal (fallback)
window.showEditApplicationModal = function(application) {
    console.log('🔧 Opening built-in edit modal for application:', application.id);

    const data = application.formData || {};

    // Remove any existing modal
    const existingModal = document.getElementById('edit-app-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'edit-app-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 95%;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    content.innerHTML = `
        <button onclick="document.getElementById('edit-app-modal').remove();"
                style="position: absolute; top: 15px; right: 15px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; color: #666; z-index: 10; display: flex; align-items: center; justify-content: center; line-height: 1;"
                onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'"
                onmouseout="this.style.backgroundColor='white'; this.style.color='#666'">
            ×
        </button>

        <div style="padding: 40px; background: white;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0066cc; padding-bottom: 20px;">
                <div style="background: #0066cc; color: white; padding: 15px; margin: -40px -40px 20px -40px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold;">VANGUARD INSURANCE GROUP</h1>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">2888 Nationwide Pkwy, Brunswick, OH 44212 • (330) 460-0872</p>
                </div>
                <div style="text-align: left; margin-top: 20px;">
                    <h2 style="margin: 0; color: #0066cc; font-size: 28px;">TRUCKING APPLICATION (EDITING)</h2>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Professional Commercial Auto Insurance Application • Application ID: ${application.id}</p>
                </div>
            </div>

            <!-- GENERAL INFORMATION -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">GENERAL INFORMATION</h3>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Insured's Name:</label>
                            <input type="text" id="name" value="${data.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contact Person:</label>
                            <input type="text" id="contact" value="${data.contact || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Business Phone:</label>
                            <input type="text" id="phone" value="${data.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email:</label>
                            <input type="email" id="email" value="${data.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Mailing Address:</label>
                            <input type="text" id="address" value="${data.address || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">US DOT #:</label>
                            <input type="text" id="dotNumber" value="${data.dotNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">MC #:</label>
                            <input type="text" id="mcNumber" value="${data.mcNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Years in Business:</label>
                            <input type="text" id="yearsInBusiness" value="${data.yearsInBusiness || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- SCHEDULE OF DRIVERS -->
            <div class="uig-view-section" style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">SCHEDULE OF DRIVERS</h3>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <button onclick="window.addDriverRow()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-plus"></i> Add Driver
                        </button>
                    </div>
                    <table id="driversTable" style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Name</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">DOB</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">License #</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Experience</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Violations</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: center; font-size: 12px; width: 40px;">Action</th>
                        </tr>
                        ${Array.from({length: 25}, (_, i) => i + 1).map(i => {
                            const hasData = data[`driver${i}Name`] || data[`driver${i}DOB`] || data[`driver${i}License`] || data[`driver${i}Experience`] || data[`driver${i}Violations`];
                            const shouldShow = i <= 2 || hasData;
                            return `
                            <tr id="driverRow${i}" style="display: ${shouldShow ? 'table-row' : 'none'};">
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="driver${i}Name" value="${data[`driver${i}Name`] || ''}"
                                           placeholder="Full Name" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="date" id="driver${i}DOB" value="${data[`driver${i}DOB`] || ''}"
                                           style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="driver${i}License" value="${data[`driver${i}License`] || ''}"
                                           placeholder="License #" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="driver${i}Experience" value="${data[`driver${i}Experience`] || ''}"
                                           placeholder="Years" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="driver${i}Violations" value="${data[`driver${i}Violations`] || ''}"
                                           placeholder="Violations" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5; text-align: center;">
                                    <button onclick="window.removeDriverRow(${i})" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </table>
                </div>
            </div>

            <!-- SCHEDULE OF AUTOS - THE COMPREHENSIVE 35 VEHICLE SECTION -->
            <div class="uig-view-section" style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">SCHEDULE OF AUTOS</h3>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <button onclick="window.addVehicleRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-plus"></i> Add Vehicle
                        </button>
                    </div>
                    <table id="vehiclesTable" style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Year</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Make/Model</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Type of Truck</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Trailer Type</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">VIN</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Value</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Radius</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: center; font-size: 12px; width: 40px;">Action</th>
                        </tr>
                        ${Array.from({length: 35}, (_, i) => i + 1).map(i => {
                            const hasData = data[`vehicle${i}Year`] || data[`vehicle${i}Make`] || data[`vehicle${i}Type`] || data[`vehicle${i}TrailerType`] || data[`vehicle${i}VIN`] || data[`vehicle${i}Value`] || data[`vehicle${i}Radius`];
                            const shouldShow = i <= 3 || hasData;
                            return `
                            <tr id="vehicleRow${i}" style="display: ${shouldShow ? 'table-row' : 'none'};">
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="vehicle${i}Year" value="${data[`vehicle${i}Year`] || ''}"
                                           placeholder="Year" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="vehicle${i}Make" value="${data[`vehicle${i}Make`] || ''}"
                                           placeholder="Make/Model" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <select id="vehicle${i}Type" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                        <option value="">Select Type</option>
                                        <option value="Tractor" ${data[`vehicle${i}Type`] === 'Tractor' ? 'selected' : ''}>Tractor</option>
                                        <option value="Truck" ${data[`vehicle${i}Type`] === 'Truck' ? 'selected' : ''}>Truck</option>
                                        <option value="Box Truck" ${data[`vehicle${i}Type`] === 'Box Truck' ? 'selected' : ''}>Box Truck</option>
                                        <option value="Dump Truck" ${data[`vehicle${i}Type`] === 'Dump Truck' ? 'selected' : ''}>Dump Truck</option>
                                        <option value="Other" ${data[`vehicle${i}Type`] === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <select id="vehicle${i}TrailerType" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                        <option value="">Select Trailer</option>
                                        <option value="Dry Van" ${data[`vehicle${i}TrailerType`] === 'Dry Van' ? 'selected' : ''}>Dry Van</option>
                                        <option value="Reefer" ${data[`vehicle${i}TrailerType`] === 'Reefer' ? 'selected' : ''}>Reefer</option>
                                        <option value="Flatbed" ${data[`vehicle${i}TrailerType`] === 'Flatbed' ? 'selected' : ''}>Flatbed</option>
                                        <option value="Tank" ${data[`vehicle${i}TrailerType`] === 'Tank' ? 'selected' : ''}>Tank</option>
                                        <option value="Auto Hauler" ${data[`vehicle${i}TrailerType`] === 'Auto Hauler' ? 'selected' : ''}>Auto Hauler</option>
                                        <option value="Other" ${data[`vehicle${i}TrailerType`] === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="vehicle${i}VIN" value="${data[`vehicle${i}VIN`] || ''}"
                                           placeholder="VIN Number" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="vehicle${i}Value" value="${data[`vehicle${i}Value`] || ''}"
                                           placeholder="$85,000" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <select id="vehicle${i}Radius" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                        <option value="">Select Radius</option>
                                        <option value="Local (50 miles)" ${data[`vehicle${i}Radius`] === 'Local (50 miles)' ? 'selected' : ''}>Local (50 miles)</option>
                                        <option value="Intermediate (51-200 miles)" ${data[`vehicle${i}Radius`] === 'Intermediate (51-200 miles)' ? 'selected' : ''}>Intermediate (51-200 miles)</option>
                                        <option value="Long Haul (201-500 miles)" ${data[`vehicle${i}Radius`] === 'Long Haul (201-500 miles)' ? 'selected' : ''}>Long Haul (201-500 miles)</option>
                                        <option value="500+ miles" ${data[`vehicle${i}Radius`] === '500+ miles' ? 'selected' : ''}>500+ miles</option>
                                    </select>
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5; text-align: center;">
                                    <button onclick="window.removeVehicleRow(${i})" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </table>
                </div>
            </div>

            <!-- COVERAGES -->
            <div style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">COVERAGES</h3>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Auto Liability:</label>
                            <input type="text" id="autoLiability" value="${data.autoLiability || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Medical Payments:</label>
                            <input type="text" id="medicalPayments" value="${data.medicalPayments || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Comprehensive Deductible:</label>
                            <input type="text" id="comprehensiveDeductible" value="${data.comprehensiveDeductible || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Collision Deductible:</label>
                            <input type="text" id="collisionDeductible" value="${data.collisionDeductible || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">General Liability:</label>
                            <input type="text" id="generalLiability" value="${data.generalLiability || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo Limit:</label>
                            <input type="text" id="cargoLimit" value="${data.cargoLimit || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo Deductible:</label>
                            <input type="text" id="cargoDeductible" value="${data.cargoDeductible || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Roadside Assistance:</label>
                            <input type="text" id="roadsideAssistance" value="${data.roadsideAssistance || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- ADDITIONAL INTERESTS -->
            <div class="uig-view-section" style="margin-bottom: 30px; border: 2px solid #e5e5e5; border-radius: 8px;">
                <h3 style="background: #f8f9fa; margin: 0; padding: 15px; color: #0066cc; font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">ADDITIONAL INTERESTS</h3>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <button onclick="window.addAdditionalInterestRow()" style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-plus"></i> Add Additional Interest
                        </button>
                    </div>
                    <p style="margin: 0 0 10px 0; font-size: 10px;"><strong>AI</strong>-Additional insured &nbsp;&nbsp; <strong>LP</strong>-Loss Payee &nbsp;&nbsp; <strong>AL</strong>-Additional Insured & Loss Payee</p>
                    <table id="additionalInterestsTable" style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Name & Address</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">Type</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 12px;">% Interest</th>
                            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: center; font-size: 12px; width: 40px;">Action</th>
                        </tr>
                        ${Array.from({length: 5}, (_, i) => i + 1).map(i => {
                            const hasData = data[`additionalInterestName${i}`] || data[`additionalInterestAddress${i}`] || data[`additionalInterestType${i}`] || data[`additionalInterestPercent${i}`];
                            const shouldShow = i <= 1 || hasData;
                            return `
                            <tr id="additionalInterestRow${i}" style="display: ${shouldShow ? 'table-row' : 'none'};">
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="additionalInterestName${i}" value="${data[`additionalInterestName${i}`] || ''}"
                                           placeholder="Name" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px; margin-bottom: 4px;">
                                    <input type="text" id="additionalInterestAddress${i}" value="${data[`additionalInterestAddress${i}`] || ''}"
                                           placeholder="Address" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <select id="additionalInterestType${i}" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                        <option value="">Select Type</option>
                                        <option value="AI" ${data[`additionalInterestType${i}`] === 'AI' ? 'selected' : ''}>AI - Additional Insured</option>
                                        <option value="LP" ${data[`additionalInterestType${i}`] === 'LP' ? 'selected' : ''}>LP - Loss Payee</option>
                                        <option value="AL" ${data[`additionalInterestType${i}`] === 'AL' ? 'selected' : ''}>AL - Additional Insured & Loss Payee</option>
                                    </select>
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5;">
                                    <input type="text" id="additionalInterestPercent${i}" value="${data[`additionalInterestPercent${i}`] || ''}"
                                           placeholder="%" style="width: 100%; padding: 4px; border: 1px solid #ccc; font-size: 12px;">
                                </td>
                                <td style="padding: 4px; border: 1px solid #e5e5e5; text-align: center;">
                                    <button onclick="window.removeAdditionalInterestRow(${i})" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </table>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
                <button onclick="window.saveEditedApplication('${application.leadId}', '${application.id}')"
                        style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    <i class="fas fa-save"></i> Update Application
                </button>
                <button onclick="document.getElementById('edit-app-modal').remove();"
                        style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    console.log('✅ Built-in edit modal displayed');
};

// Vehicle management functions for edit modal
window.addVehicleRow = function() {
    const table = document.getElementById('vehiclesTable');
    if (!table) return;

    // Find the next hidden row and show it
    for (let i = 1; i <= 35; i++) {
        const row = document.getElementById(`vehicleRow${i}`);
        if (row && row.style.display === 'none') {
            row.style.display = 'table-row';
            break;
        }
    }
};

window.removeVehicleRow = function(rowNum) {
    const row = document.getElementById(`vehicleRow${rowNum}`);
    if (row) {
        // Clear all fields in the row
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => input.value = '');

        // Hide the row if it's beyond the default visible rows
        if (rowNum > 3) {
            row.style.display = 'none';
        }
    }
};

// Driver management functions for edit modal
window.addDriverRow = function() {
    const table = document.getElementById('driversTable');
    if (!table) return;

    // Find the next hidden row and show it
    for (let i = 1; i <= 25; i++) {
        const row = document.getElementById(`driverRow${i}`);
        if (row && row.style.display === 'none') {
            row.style.display = 'table-row';
            break;
        }
    }
};

window.removeDriverRow = function(rowNum) {
    const row = document.getElementById(`driverRow${rowNum}`);
    if (row) {
        // Clear all fields in the row
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => input.value = '');

        // Hide the row if it's beyond the default visible rows
        if (rowNum > 2) {
            row.style.display = 'none';
        }
    }
};

// Additional Interest management functions for edit modal
window.addAdditionalInterestRow = function() {
    const table = document.getElementById('additionalInterestsTable');
    if (!table) return;

    // Find the next hidden row and show it
    for (let i = 1; i <= 5; i++) {
        const row = document.getElementById(`additionalInterestRow${i}`);
        if (row && row.style.display === 'none') {
            row.style.display = 'table-row';
            break;
        }
    }
};

window.removeAdditionalInterestRow = function(rowNum) {
    const row = document.getElementById(`additionalInterestRow${rowNum}`);
    if (row) {
        // Clear all fields in the row
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => input.value = '');

        // Hide the row if it's beyond the default visible rows
        if (rowNum > 1) {
            row.style.display = 'none';
        }
    }
};

// Save edited application function
window.saveEditedApplication = async function(leadId, applicationId) {
    console.log('💾 Saving edited application:', applicationId);

    try {
        // Collect all form data
        const formData = {};

        // General information
        formData.name = document.getElementById('name')?.value || '';
        formData.contact = document.getElementById('contact')?.value || '';
        formData.phone = document.getElementById('phone')?.value || '';
        formData.email = document.getElementById('email')?.value || '';
        formData.address = document.getElementById('address')?.value || '';
        formData.dotNumber = document.getElementById('dotNumber')?.value || '';
        formData.mcNumber = document.getElementById('mcNumber')?.value || '';
        formData.yearsInBusiness = document.getElementById('yearsInBusiness')?.value || '';

        // Coverage information
        formData.autoLiability = document.getElementById('autoLiability')?.value || '';
        formData.medicalPayments = document.getElementById('medicalPayments')?.value || '';
        formData.comprehensiveDeductible = document.getElementById('comprehensiveDeductible')?.value || '';
        formData.collisionDeductible = document.getElementById('collisionDeductible')?.value || '';
        formData.generalLiability = document.getElementById('generalLiability')?.value || '';
        formData.cargoLimit = document.getElementById('cargoLimit')?.value || '';
        formData.cargoDeductible = document.getElementById('cargoDeductible')?.value || '';
        formData.roadsideAssistance = document.getElementById('roadsideAssistance')?.value || '';

        // Driver information
        for (let i = 1; i <= 25; i++) {
            formData[`driver${i}Name`] = document.getElementById(`driver${i}Name`)?.value || '';
            formData[`driver${i}DOB`] = document.getElementById(`driver${i}DOB`)?.value || '';
            formData[`driver${i}License`] = document.getElementById(`driver${i}License`)?.value || '';
            formData[`driver${i}Experience`] = document.getElementById(`driver${i}Experience`)?.value || '';
            formData[`driver${i}Violations`] = document.getElementById(`driver${i}Violations`)?.value || '';
        }

        // Vehicle information
        for (let i = 1; i <= 35; i++) {
            formData[`vehicle${i}Year`] = document.getElementById(`vehicle${i}Year`)?.value || '';
            formData[`vehicle${i}Make`] = document.getElementById(`vehicle${i}Make`)?.value || '';
            formData[`vehicle${i}Type`] = document.getElementById(`vehicle${i}Type`)?.value || '';
            formData[`vehicle${i}TrailerType`] = document.getElementById(`vehicle${i}TrailerType`)?.value || '';
            formData[`vehicle${i}VIN`] = document.getElementById(`vehicle${i}VIN`)?.value || '';
            formData[`vehicle${i}Value`] = document.getElementById(`vehicle${i}Value`)?.value || '';
            formData[`vehicle${i}Radius`] = document.getElementById(`vehicle${i}Radius`)?.value || '';
        }

        // Additional interests
        for (let i = 1; i <= 5; i++) {
            formData[`additionalInterestName${i}`] = document.getElementById(`additionalInterestName${i}`)?.value || '';
            formData[`additionalInterestAddress${i}`] = document.getElementById(`additionalInterestAddress${i}`)?.value || '';
            formData[`additionalInterestType${i}`] = document.getElementById(`additionalInterestType${i}`)?.value || '';
            formData[`additionalInterestPercent${i}`] = document.getElementById(`additionalInterestPercent${i}`)?.value || '';
        }

        // Create updated application object
        const updatedApplication = {
            id: applicationId,
            leadId: leadId,
            created: new Date().toISOString(),
            status: 'saved',
            type: 'comprehensive-trucking',
            formData: formData
        };

        console.log('📝 Collected form data:', updatedApplication);

        // Save to server
        try {
            const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001';
            const cleanUrl = API_URL.replace(/\/api$/, '');

            console.log('🔄 Saving to server...');
            const response = fetch(`${cleanUrl}/api/app-submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify(updatedApplication)
            });

            if (response.ok) {
                console.log('✅ Application updated on server');
            } else {
                console.error('❌ Server save failed:', response.status);
            }
        } catch (serverError) {
            console.error('❌ Server save error:', serverError);
        }

        // Save to localStorage as backup
        try {
            const submissions = JSON.parse(localStorage.getItem('appSubmissions') || '[]');
            const existingIndex = submissions.findIndex(app => app.id === applicationId);

            if (existingIndex !== -1) {
                submissions[existingIndex] = updatedApplication;
            } else {
                submissions.push(updatedApplication);
            }

            localStorage.setItem('appSubmissions', JSON.stringify(submissions));
            console.log('✅ Application updated in localStorage');
        } catch (localError) {
            console.error('❌ localStorage save error:', localError);
        }

        // Close the edit modal
        const editModal = document.getElementById('edit-app-modal');
        if (editModal) {
            editModal.remove();
        }

        // Refresh the application submissions list to show updated data
        const currentLeadId = leadId;
        if (window.showApplicationSubmissions) {
            setTimeout(() => {
                window.showApplicationSubmissions(currentLeadId);
            }, 500);
        }

        console.log('✅ Application update completed');

    } catch (error) {
        console.error('❌ Error saving application:', error);
        alert('Error saving application: ' + error.message);
    }
};

// Edit application function
window.editApplication = async function(applicationId) {
    console.log('✏️ Editing application:', applicationId);

    try {
        let application = null;

        // First try to get from server (more reliable)
        console.log('🔍 Starting server lookup for application:', applicationId);
        try {
            // Extract leadId from applicationId (format: app_timestamp or similar)
            const leadIds = [...new Set([
                ...JSON.parse(localStorage.getItem('leads') || '[]').map(l => l.id),
                ...JSON.parse(localStorage.getItem('insurance_leads') || '[]').map(l => l.id)
            ])];

            console.log('📋 Available lead IDs:', leadIds.length, leadIds.slice(0, 5));

            // Try each lead to find the application
            for (const leadId of leadIds) {
                try {
                    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001';
                    const cleanUrl = API_URL.replace(/\/api$/, '');

                    console.log(`🔍 Checking lead ${leadId} for application ${applicationId}`);
                    const response = fetch(`${cleanUrl}/api/app-submissions/${leadId}`);

                    if (response.ok) {
                        const submissions = response.json();
                        console.log(`📝 Found ${submissions.length} applications for lead ${leadId}`);
                        const foundApp = submissions.find(app => app.id === applicationId);
                        if (foundApp) {
                            application = foundApp;
                            console.log('✅ Found application on server:', application.id);
                            break;
                        }
                    } else {
                        console.log(`❌ Server response not OK for lead ${leadId}:`, response.status);
                    }
                } catch (err) {
                    console.log(`Could not check lead ${leadId}:`, err.message);
                }
            }
        } catch (serverError) {
            console.log('Server lookup failed, trying localStorage:', serverError.message);
        }

        // Fallback to localStorage
        if (!application) {
            console.log('🔄 Trying localStorage fallback...');
            const submissions = JSON.parse(localStorage.getItem('appSubmissions') || '[]');
            console.log('📋 localStorage submissions:', submissions.length, submissions.map(s => s.id));
            application = submissions.find(app => app.id === applicationId);

            if (application) {
                console.log('✅ Found application in localStorage:', application.id);
            } else {
                console.log('❌ Application not found in localStorage either');
            }
        }

        if (!application) {
            console.error('❌ Application not found');
            alert('Application not found');
            return;
        }

        // Close the read-only modal
        const readOnlyModal = document.getElementById('readonly-app-modal');
        if (readOnlyModal) {
            readOnlyModal.remove();
        }

        // Open the comprehensive application with pre-filled data
        console.log('🔄 Opening editable application modal');

        // Check if the edit function exists
        console.log('Checking if showComprehensiveApplicationForEdit exists:', typeof window.showComprehensiveApplicationForEdit);

        if (typeof window.showComprehensiveApplicationForEdit === 'function') {
            console.log('✅ Calling showComprehensiveApplicationForEdit with:', application.leadId, application);
            window.showComprehensiveApplicationForEdit(application.leadId, application);
        } else if (typeof window.showComprehensiveApplicationWithData === 'function') {
            console.log('✅ Using showComprehensiveApplicationWithData instead');
            // Merge application data with form data
            const leadData = { ...application.formData, ...application };
            window.showComprehensiveApplicationWithData(application.leadId, leadData, application.id);
        } else {
            console.error('❌ Edit functions not found');
            console.log('Available window functions:', Object.keys(window).filter(key => key.includes('Comprehensive')));
            alert('Edit functionality not available. Please refresh the page and try again.');
        }

    } catch (error) {
        console.error('❌ Error editing application:', error);
        alert('Error opening application for editing: ' + error.message);
    }
};

// Add vehicle/trailer/driver functions for lead profiles
window.addVehicleToLead = function(leadId) {
    console.log('Adding vehicle to lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        const lead = leads[leadIndex];

        // Ensure all arrays exist and are valid
        if (!lead.vehicles || !Array.isArray(lead.vehicles)) lead.vehicles = [];
        if (!lead.trailers || !Array.isArray(lead.trailers)) lead.trailers = [];
        if (!lead.drivers || !Array.isArray(lead.drivers)) lead.drivers = [];

        const newVehicle = {
            year: '',
            make: '',
            model: '',
            vin: '',
            value: '',
            type: '',
            gvwr: ''
        };

        lead.vehicles.push(newVehicle);
        leads[leadIndex] = lead; // Ensure the reference is updated

        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('Vehicle added. New counts:', {
            vehicles: lead.vehicles.length,
            trailers: lead.trailers.length,
            drivers: lead.drivers.length
        });

        // Refresh the lead profile display
        setTimeout(() => window.viewLead(leadId), 100);

        showNotification('Vehicle added successfully', 'success');
    }
};

window.addTrailerToLead = function(leadId) {
    console.log('Adding trailer to lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        const lead = leads[leadIndex];

        // Ensure all arrays exist and are valid
        if (!lead.vehicles || !Array.isArray(lead.vehicles)) lead.vehicles = [];
        if (!lead.trailers || !Array.isArray(lead.trailers)) lead.trailers = [];
        if (!lead.drivers || !Array.isArray(lead.drivers)) lead.drivers = [];

        const newTrailer = {
            year: '',
            make: '',
            type: '',
            vin: '',
            length: '',
            value: ''
        };

        lead.trailers.push(newTrailer);
        leads[leadIndex] = lead; // Ensure the reference is updated

        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('Trailer added. New counts:', {
            vehicles: lead.vehicles.length,
            trailers: lead.trailers.length,
            drivers: lead.drivers.length
        });

        // Refresh the lead profile display
        setTimeout(() => window.viewLead(leadId), 100);

        showNotification('Trailer added successfully', 'success');
    }
};

window.addDriverToLead = function(leadId) {
    console.log('Adding driver to lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        const lead = leads[leadIndex];

        // Ensure all arrays exist and are valid
        if (!lead.vehicles || !Array.isArray(lead.vehicles)) lead.vehicles = [];
        if (!lead.trailers || !Array.isArray(lead.trailers)) lead.trailers = [];
        if (!lead.drivers || !Array.isArray(lead.drivers)) lead.drivers = [];

        const newDriver = {
            name: '',
            license: '',
            cdlType: '',
            experience: '',
            endorsements: '',
            mvr: '',
            violations: ''
        };

        lead.drivers.push(newDriver);
        leads[leadIndex] = lead; // Ensure the reference is updated

        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('Driver added. New counts:', {
            vehicles: lead.vehicles.length,
            trailers: lead.trailers.length,
            drivers: lead.drivers.length
        });

        // Refresh the lead profile display
        setTimeout(() => window.viewLead(leadId), 100);

        showNotification('Driver added successfully', 'success');
    }
};

// Delete functions for vehicles, trailers, and drivers
window.deleteVehicleFromLead = function(leadId, vehicleIndex) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
        console.log('Deleting vehicle from lead:', leadId, 'index:', vehicleIndex);
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));

        if (lead && lead.vehicles && lead.vehicles[vehicleIndex]) {
            lead.vehicles.splice(vehicleIndex, 1);
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            // Refresh the lead profile display
            window.viewLead(leadId);

            showNotification('Vehicle deleted successfully', 'success');
        }
    }
};

window.deleteTrailerFromLead = function(leadId, trailerIndex) {
    if (confirm('Are you sure you want to delete this trailer?')) {
        console.log('Deleting trailer from lead:', leadId, 'index:', trailerIndex);
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));

        if (lead && lead.trailers && lead.trailers[trailerIndex]) {
            lead.trailers.splice(trailerIndex, 1);
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            // Refresh the lead profile display
            window.viewLead(leadId);

            showNotification('Trailer deleted successfully', 'success');
        }
    }
};

window.deleteDriverFromLead = function(leadId, driverIndex) {
    if (confirm('Are you sure you want to delete this driver?')) {
        console.log('Deleting driver from lead:', leadId, 'index:', driverIndex);
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));

        if (lead && lead.drivers && lead.drivers[driverIndex]) {
            lead.drivers.splice(driverIndex, 1);
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            // Refresh the lead profile display
            window.viewLead(leadId);

            showNotification('Driver deleted successfully', 'success');
        }
    }
};

// Check for files and open email or show message
window.checkFilesAndOpenEmail = function(leadId) {
    console.log('📧 Checking files for lead:', leadId);

    // Check if files exist
    const hasFiles = checkExistingFiles(leadId);

    if (!hasFiles) {
        alert('No files found in the Loss Runs and Other Documentation section. Please upload files first before sending an email.');
        return;
    }

    // Files exist, open email modal
    openEmailDocumentation(leadId);
};

// Check if files exist in loss runs section
window.checkExistingFiles = function(leadId) {
    console.log('🔍 DEBUG: Checking files for lead:', leadId);

    const lossRunsContainer = document.querySelector(`#loss-runs-container-${leadId}`);
    console.log('🔍 DEBUG: Container found:', !!lossRunsContainer);

    if (!lossRunsContainer) {
        console.log('❌ DEBUG: No container found');
        return false;
    }

    console.log('🔍 DEBUG: Container HTML:', lossRunsContainer.innerHTML);

    // Look for ALL elements, not just specific selectors
    const allElements = lossRunsContainer.querySelectorAll('*');
    console.log('🔍 DEBUG: Total elements in container:', allElements.length);

    // Check for common text patterns that indicate files
    const containerText = lossRunsContainer.textContent || '';
    console.log('🔍 DEBUG: Container text:', containerText);

    // Check if container text indicates files exist
    const hasFileIndicators = containerText.includes('.pdf') ||
                              containerText.includes('.doc') ||
                              containerText.includes('.xls') ||
                              containerText.includes('KB') ||
                              containerText.includes('MB') ||
                              containerText.includes('View') ||
                              containerText.includes('Download');

    if (hasFileIndicators) {
        console.log('✅ DEBUG: Found file indicators in text');
        return true;
    }

    // Original comprehensive selector check
    const selectors = [
        'a[href*="blob:"]',
        'a[download]',
        '.file-item',
        '.uploaded-file',
        'a[href*=".pdf"]',
        'a[href*=".doc"]',
        'a[href*=".xls"]',
        '[data-file-name]',
        '.file-link',
        'a:not([href="#"]):not([href=""])',
        'button[onclick*="view"]',
        'button[onclick*="download"]',
        'span',
        'div',
        'p'
    ];

    const fileElements = lossRunsContainer.querySelectorAll(selectors.join(', '));
    console.log('🔍 DEBUG: Found elements with selectors:', fileElements.length);

    for (let i = 0; i < fileElements.length; i++) {
        const element = fileElements[i];
        let fileName = '';

        if (element.hasAttribute('data-file-name')) {
            fileName = element.getAttribute('data-file-name');
        } else if (element.hasAttribute('download')) {
            fileName = element.getAttribute('download');
        } else if (element.textContent.trim()) {
            fileName = element.textContent.trim();
        } else if (element.href) {
            fileName = element.href.split('/').pop().split('?')[0];
        }

        console.log(`🔍 DEBUG: Element ${i}:`, {
            tag: element.tagName,
            text: element.textContent?.trim() || '',
            href: element.href || '',
            onclick: element.onclick || element.getAttribute('onclick') || '',
            fileName: fileName
        });

        if (fileName &&
            fileName !== 'No loss runs uploaded yet' &&
            fileName !== 'Upload Loss Runs' &&
            fileName !== 'Upload Documentation' &&
            fileName.length > 0 &&
            !fileName.includes('javascript:') &&
            (fileName.includes('.') ||
             fileName.includes('pdf') ||
             fileName.includes('doc') ||
             fileName.includes('KB') ||
             fileName.includes('MB') ||
             element.href?.includes('blob:'))) {
            console.log('✅ DEBUG: Found valid file:', fileName);
            return true; // Found at least one valid file
        }
    }

    console.log('❌ DEBUG: No valid files found');
    return false; // No valid files found
};

// Update button state based on file availability
window.updateEmailDocumentationButton = function(leadId) {
    const button = document.querySelector(`#email-doc-btn-${leadId}`);
    if (!button) return;

    const hasFiles = checkExistingFiles(leadId);

    if (hasFiles) {
        // Enable button
        button.style.background = '#0066cc';
        button.style.cursor = 'pointer';
        button.style.opacity = '1';
        button.disabled = false;
        button.title = 'Send email with attached documentation';
    } else {
        // Disable button (gray out)
        button.style.background = '#9ca3af';
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.6';
        button.disabled = true;
        button.title = 'No files available. Upload documentation first.';
    }

    console.log('📧 Email button updated for lead', leadId, 'hasFiles:', hasFiles);
};

// Loss Runs Upload and Management Functions
window.openEmailDocumentation = function(leadId) {
    console.log('📧 Opening email documentation for lead:', leadId);
        leadEmail = leadObject.email || '';
        leadData.expirationDate = leadObject.renewalDate || leadObject.expirationDate || '';
        leadData.dotNumber = leadObject.dotNumber || '';
        leadData.mcNumber = leadObject.mcNumber || '';
        leadData.contact = leadObject.contact || '';
        leadData.phone = leadObject.phone || '';
    }

    // Also try to extract current values from the profile form fields
    const profileModal = document.querySelector('.modal-overlay, #lead-profile-container');
    if (profileModal) {
        // Get company name from input
        const companyInput = profileModal.querySelector('#company-name, input[id*="company"], input[placeholder*="Company"]');
        if (companyInput && companyInput.value.trim()) {
            leadName = companyInput.value.trim();
        }

        // Get email from input
        const emailInput = profileModal.querySelector('#email, input[type="email"], input[id*="email"]');
        if (emailInput && emailInput.value.trim()) {
            leadEmail = emailInput.value.trim();
        }

        // Get DOT number from input
        const dotInput = profileModal.querySelector('#dot-number, input[id*="dot"], input[placeholder*="DOT"]');
        if (dotInput && dotInput.value.trim()) {
            leadData.dotNumber = dotInput.value.trim();
        }

        // Get MC number from input
        const mcInput = profileModal.querySelector('#mc-number, input[id*="mc"], input[placeholder*="MC"]');
        if (mcInput && mcInput.value.trim()) {
            leadData.mcNumber = mcInput.value.trim();
        }

        // Get renewal date from input
        const renewalInput = profileModal.querySelector('#renewal-date, input[id*="renewal"], input[placeholder*="renewal"]');
        if (renewalInput && renewalInput.value.trim()) {
            leadData.expirationDate = renewalInput.value.trim();
        }

        // Get contact person from input
        const contactInput = profileModal.querySelector('#contact-person, input[id*="contact"], input[placeholder*="Contact"]');
        if (contactInput && contactInput.value.trim()) {
            leadData.contact = contactInput.value.trim();
        }

        // Get phone from input
        const phoneInput = profileModal.querySelector('#phone, input[type="tel"], input[id*="phone"]');
        if (phoneInput && phoneInput.value.trim()) {
            leadData.phone = phoneInput.value.trim();
        }
    }

    // Try to fetch lead data from API as fallback
    try {
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`;

        const response = fetch(`${apiUrl}/api/leads/${leadId}`);
        if (response.ok) {
            const apiLead = response.json();
            if (apiLead.success && apiLead.lead) {
                leadData.expirationDate = apiLead.lead.expirationDate || apiLead.lead.renewal_date || leadData.expirationDate;
                leadData.usdot = apiLead.lead.usdot || apiLead.lead.dot_number || apiLead.lead.usdot_number || leadData.usdot;
                leadName = apiLead.lead.legal_name || apiLead.lead.company_name || leadName;
                leadEmail = apiLead.lead.email || apiLead.lead.email_address || leadEmail;
            }
        }
    } catch (error) {
        console.log('⚠️ Could not fetch lead data from API:', error.message);
    }

    // Collect existing files from loss runs section AND server
    const existingFiles = [];

    // First, try to get files from server
    console.log('🌐 EMAIL: Fetching files from server for lead:', leadId);
    try {
        const response = fetch(`/api/loss-runs/${leadId}`);
        if (response.ok) {
            const serverFiles = response.json();
            console.log('🌐 EMAIL: Server files:', serverFiles);

            if (Array.isArray(serverFiles)) {
                serverFiles.forEach(file => {
                    const serverFile = {
                        name: file.filename || file.name || 'Unknown file',
                        size: file.size || 0,
                        type: file.mimetype || (file.filename?.includes('.pdf') ? 'application/pdf' : 'application/octet-stream'),
                        isExisting: true,
                        url: file.url || file.path || '#',
                        serverFile: true
                    };
                    existingFiles.push(serverFile);
                    console.log('✅ EMAIL: Added server file:', serverFile.name);
                });
            }
        } else {
            console.log('📂 EMAIL: Server files not available, falling back to DOM search');
        }
    } catch (error) {
        console.log('📂 EMAIL: Server fetch failed, falling back to DOM search:', error.message);
    }

    // If no server files found, try DOM extraction
    if (existingFiles.length === 0) {
        const lossRunsContainer = document.querySelector(`#loss-runs-container-${leadId}`);
        console.log('📎 EMAIL: Looking for loss runs container:', `#loss-runs-container-${leadId}`);
        console.log('📎 EMAIL: Container found:', !!lossRunsContainer);

        if (lossRunsContainer) {
            console.log('📎 EMAIL: Container HTML:', lossRunsContainer.innerHTML);
            console.log('📎 EMAIL: Container text:', lossRunsContainer.textContent);

            const containerText = lossRunsContainer.textContent || '';

            // Enhanced pattern matching for the visible file format
            const lines = containerText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            console.log('📎 EMAIL: Text lines:', lines);

            lines.forEach((line, index) => {
                // Look for PDF files in the format: "Progressive Loss Runs for CK Roadline Inc.pdf"
                if (line.includes('.pdf') || line.includes('.doc') || line.includes('.xls')) {
                    // Clean up the filename
                    let fileName = line.trim();

                    // Remove common prefixes/suffixes
                    fileName = fileName.replace(/^(Progressive\s+)?Loss\s+Runs\s+for\s+/i, '');
                    fileName = fileName.replace(/\s*(Uploaded|Size|View|Remove).*$/i, '');

                    // If it still looks like a filename
                    if (fileName.includes('.') && fileName.length > 4) {
                        console.log('📎 EMAIL: Found filename in line:', fileName);

                        const domFile = {
                            name: fileName,
                            size: 0,
                            type: fileName.toLowerCase().includes('.pdf') ? 'application/pdf' : 'application/octet-stream',
                            isExisting: true,
                            url: '#',
                            domFile: true
                        };

                        // Avoid duplicates
                        if (!existingFiles.some(f => f.name === fileName)) {
                            existingFiles.push(domFile);
                            console.log('✅ EMAIL: Added DOM file:', fileName);
                        }
                    }
                }
            });

            // Also look for the exact pattern you showed: "Progressive Loss Runs for CK Roadline Inc.pdf"
            const pdfPattern = /([^\\n]+\.pdf)/gi;
            const docPattern = /([^\\n]+\.docx?)/gi;
            const xlsPattern = /([^\\n]+\.xlsx?)/gi;

            [pdfPattern, docPattern, xlsPattern].forEach(pattern => {
                const matches = containerText.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let fileName = match.trim();
                        if (fileName &&
                            !fileName.includes('Upload') &&
                            !fileName.includes('Email') &&
                            !fileName.includes('Size:') &&
                            !fileName.includes('Uploaded:')) {

                            console.log('📎 EMAIL: Found pattern match:', fileName);

                            const patternFile = {
                                name: fileName,
                                size: 0,
                                type: fileName.toLowerCase().includes('.pdf') ? 'application/pdf' : 'application/octet-stream',
                                isExisting: true,
                                url: '#',
                                patternFile: true
                            };

                            // Avoid duplicates
                            if (!existingFiles.some(f => f.name === fileName)) {
                                existingFiles.push(patternFile);
                                console.log('✅ EMAIL: Added pattern file:', fileName);
                            }
                        }
                    });
                }
            });
        }
    }

    console.log('📎 EMAIL: Total existing files found:', existingFiles.length);
    console.log('📎 EMAIL: Files list:', existingFiles.map(f => f.name));
    console.log('📧 EMAIL: Lead data collected:', { leadName, leadEmail, leadData });

    // Create email compose modal
    try {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'documentationEmailModal';
        modal.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.95) !important; z-index: 99999999 !important; display: flex !important; align-items: center !important; justify-content: center !important;';

        console.log('📧 EMAIL: Creating modal HTML...');
        modal.innerHTML = `
        <div class="modal-container" style="max-width: 800px; width: 90%; background: white; border-radius: 12px; overflow: hidden;">
            <div class="modal-header" style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 20px;"><i class="fas fa-envelope"></i> Email Documentation</h2>
                <button class="close-btn" onclick="closeDocumentationEmailModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 30px;">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">To</label>
                    <input type="email" id="docEmailTo" class="form-control" value="${leadEmail}" placeholder="broker@agency.com" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">Subject</label>
                    <input type="text" id="docEmailSubject" class="form-control" value="Insurance Quote Documentation Request" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">Message</label>
                    <textarea id="docEmailMessage" class="form-control" rows="14" style="width: 100%; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-family: Arial, sans-serif; line-height: 1.5;">Hello,

We are preparing an insurance quote for your company and need the following documentation to proceed with market submissions:

REQUIRED DOCUMENTATION:
• Quote Application (signed and completed)
• Loss Runs (past 3-5 years)
• Current certificates of insurance
• Additional supporting documentation as requested

ACCOUNT DETAILS:
• Business Name: [Company Name]
• Contact Person: [Contact Name]
• Phone: [Phone Number]
• Expiration Date: [Current Expiration]
• USDOT Number: [If applicable]
• MC Number: [If applicable]

This information will allow us to prepare comprehensive quotes from our carrier markets. Please reply with the requested documents attached, or let me know if you have any questions about specific requirements.

We appreciate your prompt attention to this request.

Best regards,
VIG Agency Team
contact@vigagency.com
(555) 123-4567</textarea>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">Attach Files</label>
                    <div style="border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; background: #f9fafb;">
                        <input type="file" id="docEmailFiles" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif" style="display: none;" onchange="handleDocumentationFiles(event)">
                        <button type="button" onclick="document.getElementById('docEmailFiles').click()" style="background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-bottom: 10px;">
                            <i class="fas fa-paperclip"></i> Select Files
                        </button>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Select documents to attach (PDF, DOC, XLS, Images)</p>
                    </div>

                    <!-- File preview area -->
                    <div id="selectedFiles" style="margin-top: 15px; display: none;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #374151;">Selected Files:</h4>
                        <div id="filesList" style="display: flex; flex-direction: column; gap: 8px;"></div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 15px;">
                    <button onclick="closeDocumentationEmailModal()" class="btn-secondary" style="padding: 12px 24px; background: #fff; border: 2px solid #d1d5db; color: #374151; border-radius: 8px; font-weight: 500; cursor: pointer;">
                        Cancel
                    </button>
                    <button onclick="sendDocumentationEmail('${leadId}')" class="btn-primary" style="padding: 12px 24px; background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-paper-plane"></i> Send Email
                    </button>
                </div>
            </div>
        </div>
        `;

        console.log('📧 EMAIL: Appending modal to document body...');
        document.body.appendChild(modal);

        console.log('✅ EMAIL: Modal created and appended successfully!');

    } catch (error) {
        console.error('❌ EMAIL: Error creating modal:', error);
        alert('Error opening email documentation window. Check console for details.');
        return;
    }

    // Auto-populate existing files if any
    if (existingFiles.length > 0) {
        // Note: Existing files are displayed but not included in email attachments
        // Only newly uploaded files will be attached to emails
        window.selectedDocumentationFiles = [];

        // Show the existing files
        const selectedFilesDiv = document.getElementById('selectedFiles');
        const filesList = document.getElementById('filesList');

        selectedFilesDiv.style.display = 'block';

        existingFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #e8f5e8; border-radius: 6px; border: 1px solid #22c55e;';

            const fileName = typeof file === 'string' ? file : file.name;
            const fileIcon = getFileIcon(fileName);
            const fileSize = '(Available on server - not attached)';

            fileItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="${fileIcon}" style="color: #22c55e;"></i>
                    <span style="font-size: 14px; color: #374151;">${fileName}</span>
                    <span style="font-size: 12px; color: #22c55e; font-weight: bold;">${fileSize}</span>
                </div>
                <button onclick="removeDocumentationFile(${index})" style="background: #ef4444; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;">
                    &times;
                </button>
            `;

            filesList.appendChild(fileItem);
        });

        console.log('📎 Displayed', existingFiles.length, 'existing files (available on server, not attached to email)');
    }
};

// Close documentation email modal
window.closeDocumentationEmailModal = function() {
    const modal = document.getElementById('documentationEmailModal');
    if (modal) {
        modal.remove();
    }
};

// Handle file selection for documentation email
window.handleDocumentationFiles = function(event) {
    const files = event.target.files;
    const selectedFilesDiv = document.getElementById('selectedFiles');
    const filesList = document.getElementById('filesList');

    if (files.length === 0) {
        selectedFilesDiv.style.display = 'none';
        return;
    }

    // Show selected files area
    selectedFilesDiv.style.display = 'block';

    // Store files globally for later use
    window.selectedDocumentationFiles = Array.from(files);

    // Clear previous list
    filesList.innerHTML = '';

    // Add each file to the list
    Array.from(files).forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #d1d5db;';

        const fileIcon = getFileIcon(file.name);
        const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';

        fileItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="${fileIcon}" style="color: #6b7280;"></i>
                <span style="font-size: 14px; color: #374151;">${file.name}</span>
                <span style="font-size: 12px; color: #9ca3af;">(${fileSize})</span>
            </div>
            <button onclick="removeDocumentationFile(${index})" style="background: #ef4444; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;">
                &times;
            </button>
        `;

        filesList.appendChild(fileItem);
    });
};

// Get appropriate icon for file type
function getFileIcon(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'pdf': return 'fas fa-file-pdf';
        case 'doc':
        case 'docx': return 'fas fa-file-word';
        case 'xls':
        case 'xlsx': return 'fas fa-file-excel';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return 'fas fa-file-image';
        default: return 'fas fa-file';
    }
}

// Remove file from selection
window.removeDocumentationFile = function(index) {
    if (!window.selectedDocumentationFiles) return;

    // Remove file from array
    window.selectedDocumentationFiles.splice(index, 1);

    // Update file input
    const fileInput = document.getElementById('docEmailFiles');
    const dt = new DataTransfer();

    window.selectedDocumentationFiles.forEach(file => {
        dt.items.add(file);
    });

    fileInput.files = dt.files;

    // Refresh display
    handleDocumentationFiles({ target: { files: dt.files } });
};

// Send documentation email (FIXED VERSION 888)
window.sendDocumentationEmail = async function(leadId) {
    console.log('🚀🚀🚀 FIXED VERSION 1002 LOADED - EMAIL BUG SHOULD BE FIXED NOW 🚀🚀🚀');

    // Show loading indicator immediately
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'emailLoadingIndicator';
    loadingIndicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    loadingIndicator.innerHTML = `
        <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #3b82f6;"></i>
        <span>Preparing email with attachments...</span>
    `;
    document.body.appendChild(loadingIndicator);

    const to = document.getElementById('docEmailTo').value.trim();
    const subject = document.getElementById('docEmailSubject').value.trim();
    const message = document.getElementById('docEmailMessage').value.trim();

    if (!to) {
        // Hide loading indicator on validation error
        const loadingIndicator = document.getElementById('emailLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        alert('Please enter recipient email');
        return;
    }

    if (!subject) {
        // Hide loading indicator on validation error
        const loadingIndicator = document.getElementById('emailLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        alert('Please enter email subject');
        return;
    }

    if (!message) {
        // Hide loading indicator on validation error
        const loadingIndicator = document.getElementById('emailLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        alert('Please enter email message');
        return;
    }

    // Show loading state
    const sendButton = event.target;
    const originalText = sendButton.innerHTML;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendButton.disabled = true;

    try {
        console.log('🔍 DEBUG: Starting sendDocumentationEmail with params:', { to, subject, message, leadId });

        // Prepare form data for file attachments
        const formData = new FormData();

        console.log('🔍 DEBUG: FormData created successfully');

        formData.append('from', 'contact@vigagency.com');
        formData.append('to', to);
        formData.append('subject', subject);
        formData.append('message', message);
        formData.append('leadId', leadId);
        formData.append('type', 'documentation_request');

        // Add existing documentation files from the server
        const existingFiles = [];
        if (window.currentLead && window.currentLead.documentationFiles) {
            console.log('🔍 DEBUG: Found existing documentation files:', window.currentLead.documentationFiles);
            window.currentLead.documentationFiles.forEach(file => {
                if (file && file.filename) {
                    existingFiles.push(file.filename);
                }
            });
        }

        // Also check for files in the loss runs directory by scanning the modal
        // Look for all file display elements that contain "Available on server"
        const modalFiles = document.querySelectorAll('#docSelectedFiles div, #docSelectedFiles .file-item');
        modalFiles.forEach(item => {
            // Check if this item contains "Available on server" text
            if (item.textContent && item.textContent.includes('Available on server')) {
                const fileNameSpan = item.querySelector('span');
                if (fileNameSpan && fileNameSpan.textContent) {
                    let fileName = fileNameSpan.textContent.trim();
                    // Remove any extra text and get just the filename
                    fileName = fileName.split('\n')[0].trim(); // Take first line if multiline
                    if (fileName && fileName.endsWith('.pdf') && !existingFiles.includes(fileName)) {
                        // Look for the actual file with timestamp prefix in the server directory
                        const serverFileName = '1764190855509_' + fileName; // Use known timestamp prefix for now
                        existingFiles.push(serverFileName);
                        console.log('🔍 DEBUG: Found server file:', serverFileName);
                    }
                }
            }
        });

        // Dynamic approach - get all uploaded files for this lead from server
        try {
            console.log('🔍 DEBUG: Fetching uploaded files for lead:', leadId);
            const response = fetch(`/api/leads/${leadId}/files`);
            if (response.ok) {
                const leadFiles = response.json();
                if (leadFiles && leadFiles.success && leadFiles.files) {
                    console.log('🔍 DEBUG: API returned files:', leadFiles.files);
                    leadFiles.files.forEach(file => {
                        if (!existingFiles.includes(file)) {
                            existingFiles.push(file);
                            console.log('🔍 DEBUG: Added server file from API:', file);
                        }
                    });
                } else {
                    console.log('🔍 DEBUG: No files found for lead:', leadId);
                }
            } else {
                console.error('🔍 DEBUG: API request failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('🔍 DEBUG: Error fetching lead files:', error);
        }

        if (existingFiles.length > 0) {
            formData.append('serverFiles', JSON.stringify(existingFiles));
            console.log('🔍 DEBUG: Added server files:', existingFiles);
        }

        console.log('🔍 DEBUG: Basic form fields appended successfully');

        // Add file attachments if any
        console.log('🔍 DEBUG: selectedDocumentationFiles:', window.selectedDocumentationFiles);
        if (window.selectedDocumentationFiles && window.selectedDocumentationFiles.length > 0) {
            console.log('🔍 DEBUG: Processing', window.selectedDocumentationFiles.length, 'files for attachment');
            window.selectedDocumentationFiles.forEach((file, index) => {
                console.log(`🔍 DEBUG: File ${index}:`, {
                    name: file.name || 'unnamed',
                    type: file.constructor?.name,
                    size: file.size || 'unknown',
                    isFile: file instanceof File
                });
                formData.append('attachment', file);
            });
            formData.append('attachmentCount', window.selectedDocumentationFiles.length);
        } else {
            console.log('🔍 DEBUG: No files to attach');
        }

        // Send via the same API endpoint used by COI management
        console.log('🔍 DEBUG: About to send fetch request to /api/coi/send-request');
        console.log('🔍 DEBUG: FormData contents check...');

        // Log FormData contents
        for (let pair of formData.entries()) {
            console.log(`🔍 FormData: ${pair[0]} = `, typeof pair[1] === 'string' ? pair[1] : pair[1].constructor?.name);
        }

        const response = fetch('/api/coi/send-request', {
            method: 'POST',
            body: formData // No Content-Type header when using FormData
        });

        console.log('🔍 DEBUG: Fetch response received:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        // Hide loading indicator
        const loadingIndicator = document.getElementById('emailLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        if (response.ok) {
            alert('Documentation request sent successfully!');
            closeDocumentationEmailModal();
        } else {
            throw new Error('Failed to send email');
        }

    } catch (error) {
        console.error('🚨 DETAILED ERROR sending documentation email:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause,
            fullError: error
        });
        alert('Failed to send email. Please try again. Error: ' + error.message);

        // Hide loading indicator on error
        const loadingIndicator = document.getElementById('emailLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    } finally {
        // Restore button state
        sendButton.innerHTML = originalText;
        sendButton.disabled = false;
    }
};

window.openLossRunsUpload = function(leadId) {
    console.log('📄 Opening loss runs upload for lead:', leadId);

    // Create upload modal
    const uploadModalHTML = `
        <div id="loss-runs-upload-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000001; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #dc3545;">
                        <i class="fas fa-file-pdf"></i> Upload Loss Runs PDF
                    </h3>
                    <button onclick="closeLossRunsUpload()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #555;">
                        Select PDF File:
                    </label>
                    <input type="file" id="loss-runs-file-input" accept=".pdf"
                           style="width: 100%; padding: 10px; border: 2px dashed #ddd; border-radius: 6px; background: #f9f9f9;">
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        Maximum file size: 10MB. PDF files only.
                    </div>
                </div>

                <div id="loss-runs-upload-status" style="display: none; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 14px;">
                    <!-- Status messages appear here -->
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeLossRunsUpload()"
                            style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Cancel
                    </button>
                    <button onclick="submitLossRuns('${leadId}')"
                            style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-upload"></i> Upload
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', uploadModalHTML);
};

window.closeLossRunsUpload = function() {
    const modal = document.getElementById('loss-runs-upload-modal');
    if (modal) {
        modal.remove();
    }
};

window.submitLossRuns = function(leadId) {
    console.log('📤 Submitting loss runs for lead:', leadId);

    const fileInput = document.getElementById('loss-runs-file-input');
    const statusDiv = document.getElementById('loss-runs-upload-status');

    if (!fileInput.files.length) {
        showLossRunsUploadStatus('Please select a PDF file to upload.', 'error');
        return;
    }

    const file = fileInput.files[0];

    // Validate file type
    if (file.type !== 'application/pdf') {
        showLossRunsUploadStatus('Please select a PDF file only.', 'error');
        return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showLossRunsUploadStatus('File size must be less than 10MB.', 'error');
        return;
    }

    // Show uploading status with file size info
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    showLossRunsUploadStatus(`Uploading ${fileSizeMB}MB file... This may take up to 2 minutes for large files.`, 'info');
    console.log('⏳ Starting upload attempt for', fileSizeMB, 'MB file');

    // Create FormData for upload
    const formData = new FormData();
    formData.append('lossRunsPdf', file);
    formData.append('leadId', leadId);
    formData.append('uploadType', 'loss_runs');

    // Set up immediate timeout fallback (2 seconds)
    let uploadCompleted = false;
    const fallbackTimeout = setTimeout(() => {
        if (!uploadCompleted) {
            console.log('⏰ Timeout reached, falling back to local save');
            uploadCompleted = true;

            showLossRunsUploadStatus('Upload taking longer than expected - saved locally. File will sync to server when connection improves.', 'warning');

            // Fallback: Save file info to localStorage only
            const fileInfo = {
                filename: file.name,
                originalName: file.name,
                uploadDate: new Date().toISOString(),
                size: file.size,
                localOnly: true
            };
            console.log('💾 Saving file info locally:', fileInfo);
            saveLossRunsToProfile(leadId, fileInfo);

            showLossRunsUploadStatus('File saved locally successfully!', 'success');

            setTimeout(() => {
                console.log('🔄 Closing modal and refreshing display for lead:', leadId);
                closeLossRunsUpload();
                refreshLossRunsDisplay(leadId);
            }, 1500);
        }
    }, 120000); // 120 second timeout (2 minutes)

    // Attempt server upload
    console.log('🌐 Attempting fetch to: /api/upload-loss-runs');
    console.log('📦 FormData contents:', [...formData.entries()]);
    // Create AbortController for fetch timeout (increased to 90 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second fetch timeout

    fetch('/api/upload-loss-runs', {
        method: 'POST',
        body: formData,
        signal: controller.signal
    })
    .then(response => {
        console.log('📡 Got server response:', response.status);
        if (uploadCompleted) {
            console.log('⚠️ Upload completed after timeout, ignoring response');
            return;
        }

        if (!response.ok) {
            console.log('❌ Server returned error status:', response.status);
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        clearTimeout(fallbackTimeout);
        clearTimeout(timeoutId);
        uploadCompleted = true;
        return response.json();
    })
    .then(data => {
        if (uploadCompleted && data) {
            console.log('📡 Server upload successful:', data);
            if (data.success) {
                showLossRunsUploadStatus('Loss runs PDF uploaded successfully!', 'success');

                // Store in localStorage for persistence
                saveLossRunsToProfile(leadId, {
                    filename: data.filename,
                    originalName: file.name,
                    uploadDate: data.uploadDate,
                    size: file.size
                });

                // Refresh the loss runs display
                setTimeout(() => {
                    closeLossRunsUpload();
                    refreshLossRunsDisplay(leadId);
                }, 1500);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        }
    })
    .catch(error => {
        console.log('❌ Server upload failed:', error.message);
        console.log('🔍 Upload completed status:', uploadCompleted);
        console.log('🔍 Error type:', error.name);

        if (!uploadCompleted) {
            console.log('✅ Proceeding with local fallback');
            clearTimeout(fallbackTimeout);
            clearTimeout(timeoutId);
            uploadCompleted = true;

            showLossRunsUploadStatus('Server unavailable - saving locally instead', 'warning');

            // Fallback: Save file info to localStorage only
            const fileInfo = {
                filename: file.name,
                originalName: file.name,
                uploadDate: new Date().toISOString(),
                size: file.size,
                localOnly: true
            };
            console.log('💾 Saving file info locally:', fileInfo);
            saveLossRunsToProfile(leadId, fileInfo);

            showLossRunsUploadStatus('File saved locally successfully!', 'success');

            setTimeout(() => {
                console.log('🔄 Closing modal and refreshing display for lead:', leadId);
                closeLossRunsUpload();
                refreshLossRunsDisplay(leadId);
            }, 1500);
        }
    });
};

function showLossRunsUploadStatus(message, type) {
    const statusDiv = document.getElementById('loss-runs-upload-status');
    if (!statusDiv) return;

    const colors = {
        success: '#d4edda',
        error: '#f8d7da',
        warning: '#fff3cd',
        info: '#d1ecf1'
    };

    const textColors = {
        success: '#155724',
        error: '#721c24',
        warning: '#856404',
        info: '#0c5460'
    };

    statusDiv.style.display = 'block';
    statusDiv.style.backgroundColor = colors[type] || colors.info;
    statusDiv.style.color = textColors[type] || textColors.info;
    statusDiv.style.border = `1px solid ${colors[type] || colors.info}`;
    statusDiv.textContent = message;
}

function saveLossRunsToProfile(leadId, fileInfo) {
    try {
        console.log('💾 Starting save to localStorage for lead:', leadId, 'file:', fileInfo);
        let lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
        console.log('📊 Existing data:', lossRunsData);

        if (!lossRunsData[leadId]) {
            lossRunsData[leadId] = [];
            console.log('📝 Created new array for lead:', leadId);
        }

        lossRunsData[leadId].push(fileInfo);
        localStorage.setItem('lossRunsData', JSON.stringify(lossRunsData));
        console.log('✅ Saved loss runs data to localStorage:', lossRunsData);

        // Verify the save worked
        const verification = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
        console.log('✔️ Verification - data in localStorage:', verification);
    } catch (error) {
        console.error('❌ Error saving loss runs data:', error);
    }
}

window.refreshLossRunsDisplay = function(leadId) {
    console.log('🔄 refreshLossRunsDisplay called for lead:', leadId);
    const container = document.getElementById(`loss-runs-container-${leadId}`);

    if (!container) {
        console.error('❌ Container not found:', `loss-runs-container-${leadId}`);
        return;
    }

    console.log('✅ Container found:', container);

    // First, load existing files from server, then display
    loadServerLossRuns(leadId)
        .then(() => {
            console.log('✅ Server loading completed, displaying files for lead:', leadId);
            displayLossRunsFiles(leadId, container);
        })
        .catch((error) => {
            console.error('❌ Server loading failed, displaying local files only:', error);
            displayLossRunsFiles(leadId, container);
        });
};

async function loadServerLossRuns(leadId) {
    try {
        console.log('🌐 Loading server loss runs for lead:', leadId);

        // Add timeout to the list request as well
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.warn('⏰ List request timeout for lead:', leadId);
            controller.abort();
        }, 30000); // 30 second timeout for list requests

        const response = fetch(`/api/list-loss-runs/${leadId}`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`⚠️ Server response not OK: ${response.status} ${response.statusText}`);
            return;
        }

        const data = response.json();
        console.log('📡 Server response data:', data);

        if (data.success && data.files.length > 0) {
            console.log(`📁 Found ${data.files.length} server files for lead ${leadId}`);

            // Get existing localStorage data
            const lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');

            // Merge server files with localStorage (server files take precedence)
            const existingFiles = lossRunsData[leadId] || [];
            const serverFilenames = data.files.map(f => f.filename);

            // Remove any localStorage files that exist on server (avoid duplicates)
            const localOnlyFiles = existingFiles.filter(file =>
                !serverFilenames.includes(file.filename) && file.localOnly === true
            );

            // Create a Map to avoid duplicates by filename
            const fileMap = new Map();

            // Add server files first (they take precedence)
            data.files.forEach(file => {
                fileMap.set(file.filename, file);
            });

            // Add local-only files if they don't already exist
            localOnlyFiles.forEach(file => {
                if (!fileMap.has(file.filename)) {
                    fileMap.set(file.filename, file);
                }
            });

            // Convert map back to array
            const allFiles = Array.from(fileMap.values());

            // Update localStorage with combined data
            lossRunsData[leadId] = allFiles;
            localStorage.setItem('lossRunsData', JSON.stringify(lossRunsData));

            console.log(`💾 Updated localStorage with ${allFiles.length} total files for lead ${leadId}`);
        } else {
            console.log('📭 No server files found for lead:', leadId);
        }
    } catch (error) {
        console.error('❌ Error loading server loss runs for lead', leadId, ':', error.message);
        console.error('❌ Error details:', error);
        // Continue anyway - display any local files that might exist
    }
}

function displayLossRunsFiles(leadId, container) {
    try {
        const lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
        console.log('📊 All loss runs data:', lossRunsData);
        const leadFiles = lossRunsData[leadId] || [];
        console.log('📋 Files for lead', leadId, ':', leadFiles);

        if (leadFiles.length === 0) {
            console.log('📝 No files found, showing empty message');
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No loss runs uploaded yet</p>';
            return;
        }

        // Helper function to escape strings for HTML attributes
        const escapeForAttribute = (str) => {
            return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/\\/g, '\\\\');
        };

        const filesHTML = leadFiles.map(file => {
            const date = new Date(file.uploadDate).toLocaleDateString();
            const localLabel = file.localOnly ? ' (Local)' : '';
            const sizeKB = Math.round(file.size / 1024);

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px;">
                    <div>
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 8px;"></i>
                            <strong style="font-size: 14px;">${file.originalName}${localLabel}</strong>
                        </div>
                        <div style="font-size: 12px; color: #6b7280;">
                            Uploaded: ${date} • Size: ${sizeKB} KB
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="view-loss-runs-btn" data-lead-id="${leadId}" data-filename="${file.filename}" data-original-name="${file.originalName}" data-local-only="${file.localOnly || false}"
                                style="background: #0066cc; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="remove-loss-runs-btn" data-lead-id="${leadId}" data-filename="${file.filename}"
                                style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = filesHTML;

        // Add event listeners for the buttons
        container.querySelectorAll('.view-loss-runs-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const leadId = this.getAttribute('data-lead-id');
                const filename = this.getAttribute('data-filename');
                const originalName = this.getAttribute('data-original-name');
                const isLocalOnly = this.getAttribute('data-local-only') === 'true';
                window.viewLossRunsPDF(leadId, filename, originalName, isLocalOnly);
            });
        });

        container.querySelectorAll('.remove-loss-runs-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const leadId = this.getAttribute('data-lead-id');
                const filename = this.getAttribute('data-filename');
                window.removeLossRunsFromProfile(leadId, filename);
            });
        });

        console.log(`✅ Refreshed loss runs display for lead ${leadId}: ${leadFiles.length} files`);

        // Update email documentation button state after refreshing
        setTimeout(() => {
            updateEmailDocumentationButton(leadId);
        }, 100);
    } catch (error) {
        console.error('❌ Error refreshing loss runs display:', error);
        container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">Error loading loss runs</p>';

        // Update button state even on error (no files)
        setTimeout(() => {
            updateEmailDocumentationButton(leadId);
        }, 100);
    }
};

window.viewLossRunsPDF = function(leadId, filename, originalName, isLocalOnly) {
    console.log('👁️ Opening PDF viewer for:', filename, 'localOnly:', isLocalOnly);

    if (isLocalOnly) {
        // For local files, show enhanced options modal
        const localFileModalHTML = `
            <div id="local-file-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000002; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 24px; margin-right: 12px;"></i>
                        <h3 style="margin: 0; color: #374151;">Local File Information</h3>
                    </div>

                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-size: 14px; color: #92400e;">
                            <strong>File:</strong> ${originalName}<br>
                            <strong>Status:</strong> Saved locally due to server upload failure<br>
                            <strong>Note:</strong> Only file information was saved (name, date, size)
                        </p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #374151; margin-bottom: 10px;">Available Options:</h4>
                        <div style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                <i class="fas fa-upload" style="color: #0066cc; width: 20px; margin-right: 8px;"></i>
                                Re-upload the file when server becomes available
                            </div>
                            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                <i class="fas fa-file-pdf" style="color: #dc3545; width: 20px; margin-right: 8px;"></i>
                                Locate the original file on your computer to view
                            </div>
                            <div style="display: flex; align-items: center;">
                                <i class="fas fa-sync" style="color: #10b981; width: 20px; margin-right: 8px;"></i>
                                Try uploading again if server is now working
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="retryUploadLocalFile('${leadId}', '${originalName}')"
                                style="background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-retry"></i> Try Upload Again
                        </button>
                        <button onclick="closeLocalFileModal()"
                                style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', localFileModalHTML);
        return;
    }

    // For server files, try to open the PDF
    const pdfUrl = `/api/view-loss-runs/${leadId}/${filename}`;

    // Create a modal to display the PDF
    const pdfModalHTML = `
        <div id="pdf-viewer-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000002; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; width: 95%; height: 95%; border-radius: 8px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb;">
                    <h3 style="margin: 0; color: #374151;">
                        <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 8px;"></i>
                        ${originalName}
                    </h3>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="downloadLossRunsPDF('${leadId}', '${filename}', '${originalName}')"
                                style="background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button onclick="closePDFViewer()"
                                style="background: #6b7280; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
                <div style="flex: 1; padding: 0;">
                    <iframe src="${pdfUrl}"
                            style="width: 100%; height: 100%; border: none;"
                            title="Loss Runs PDF">
                        <p style="padding: 20px;">
                            Your browser doesn't support PDF viewing.
                            <a href="${pdfUrl}" target="_blank" style="color: #0066cc;">Click here to download the file</a>
                        </p>
                    </iframe>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', pdfModalHTML);
};

window.closePDFViewer = function() {
    const modal = document.getElementById('pdf-viewer-modal');
    if (modal) {
        modal.remove();
    }
};

window.downloadLossRunsPDF = function(leadId, filename, originalName) {
    console.log('📥 Downloading PDF:', filename);

    const downloadUrl = `/api/download-loss-runs/${leadId}/${filename}`;

    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = originalName || filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ Download initiated for:', originalName);
};

window.closeLocalFileModal = function() {
    const modal = document.getElementById('local-file-modal');
    if (modal) {
        modal.remove();
    }
};

window.retryUploadLocalFile = function(leadId, originalName) {
    console.log('🔄 Retrying upload for local file:', originalName);
    closeLocalFileModal();

    // Show a message asking user to select the file again
    const retryMessage = `To retry uploading "${originalName}", please:\n\n1. Close this dialog\n2. Click "Upload Loss Runs" button again\n3. Select the same file from your computer\n\nThe system will attempt to upload to the server again.`;

    alert(retryMessage);
};

window.removeLossRunsFromProfile = function(leadId, filename) {
    if (confirm('Are you sure you want to remove this loss runs file?')) {
        // Remove from localStorage
        try {
            let lossRunsData = JSON.parse(localStorage.getItem('lossRunsData') || '{}');
            if (lossRunsData[leadId]) {
                lossRunsData[leadId] = lossRunsData[leadId].filter(file => file.filename !== filename);
                localStorage.setItem('lossRunsData', JSON.stringify(lossRunsData));
            }
        } catch (error) {
            console.error('❌ Error removing from localStorage:', error);
        }

        // Try to remove from server
        fetch('/api/remove-loss-runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, filename })
        }).catch(error => {
            console.warn('⚠️ Server removal failed:', error);
        });

        // Refresh display
        refreshLossRunsDisplay(leadId);
    }
};

// Auto-load loss runs when profile opens
document.addEventListener('DOMContentLoaded', function() {
    // Set up observer to load loss runs when profile modal opens
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && (node.id && node.id.includes('lead-profile-modal') || node.classList && node.classList.contains('profile-modal'))) {
                        // Find lead ID from the modal content
                        const lossRunsContainer = node.querySelector('[id^="loss-runs-container-"]');
                        if (lossRunsContainer) {
                            const leadId = lossRunsContainer.id.replace('loss-runs-container-', '');
                            console.log('🎯 Profile modal detected for lead:', leadId);
                            setTimeout(() => {
                                console.log('🔄 Auto-triggering refreshLossRunsDisplay for:', leadId);
                                refreshLossRunsDisplay(leadId);
                            }, 500);
                        }

                        // Also check for loss runs sections being added
                        const lossRunsSection = node.querySelector('.profile-section');
                        if (lossRunsSection && lossRunsSection.textContent.includes('Loss Runs and Other Documentation')) {
                            // Extract lead ID from nearby elements or URL
                            const leadIdMatch = document.location.hash.match(/lead[_-]?(\w+)/) ||
                                               node.innerHTML.match(/lead[_-]?(\w+)/) ||
                                               node.innerHTML.match(/'([^']+)'/);
                            if (leadIdMatch && leadIdMatch[1]) {
                                const leadId = leadIdMatch[1];
                                console.log('🎯 Loss runs section detected for lead:', leadId);
                                setTimeout(() => refreshLossRunsDisplay(leadId), 500);
                            }
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

// Add viewLead wrapper to ensure loss runs are always loaded
if (typeof originalViewLead === 'function') {
    window.viewLead = function(leadId) {
        console.log('🎯 ViewLead called for:', leadId);

        // Call the original function
        const result = originalViewLead(leadId);

        // Ensure loss runs are loaded with multiple attempts
        setTimeout(() => {
            console.log('🔄 ViewLead wrapper: First attempt refreshLossRunsDisplay for:', leadId);
            if (window.refreshLossRunsDisplay) {
                refreshLossRunsDisplay(leadId);
            }
        }, 500);

        setTimeout(() => {
            console.log('🔄 ViewLead wrapper: Second attempt refreshLossRunsDisplay for:', leadId);
            if (window.refreshLossRunsDisplay) {
                refreshLossRunsDisplay(leadId);
            }
        }, 1500);

        setTimeout(() => {
            console.log('🔄 ViewLead wrapper: Third attempt refreshLossRunsDisplay for:', leadId);
            if (window.refreshLossRunsDisplay) {
                refreshLossRunsDisplay(leadId);
            }
        }, 3000);

        return result;
    };
    console.log('✅ ViewLead wrapper installed for loss runs auto-loading');
}

// Verify the enhanced profile is available
if (window.createEnhancedProfile) {
    console.log('✅ Final profile fix applied successfully - Enhanced profile with transcription area, vehicles, trailers, drivers, and quote submissions is ready');
} else {
    console.error('❌ Enhanced profile function not properly loaded!');
}
console.log('Final profile fix applied successfully');
