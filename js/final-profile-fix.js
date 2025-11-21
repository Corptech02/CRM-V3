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
    const reachOut = lead.reachOut || {
        callAttempts: 0,
        callsConnected: 0,
        emailCount: 0,
        textCount: 0,
        voicemailCount: 0
    };

    // Check if connected call was made - if yes, reach out is complete
    if (reachOut.callsConnected > 0) {
        return '<span style="color: #10b981; font-size: 18px;">REACH OUT COMPLETE!</span>';
    }

    // Check if stage requires reach out (NOT info_received - that needs quote preparation)
    if (lead.stage === 'quoted' || lead.stage === 'info_requested' ||
        lead.stage === 'quote_sent' || lead.stage === 'interested') {

        // Determine next action based on what's been done
        if (reachOut.callAttempts === 0) {
            return '<span style="color: #dc2626;">TO DO - Call Lead</span>';
        } else if (reachOut.emailCount === 0) {
            return '<span style="color: #dc2626;">TO DO - Email Lead</span>';
        } else if (reachOut.textCount === 0) {
            return '<span style="color: #dc2626;">TO DO - Text Lead</span>';
        } else {
            // All outreach methods attempted
            return '<span style="color: #10b981; font-size: 18px;">REACH OUT COMPLETE!</span>';
        }
    }

    return ''; // No TO DO for other stages
}

// Function to update reach out status display
window.updateReachOutStatus = function(leadId) {
    // Re-fetch the leads to get the most current data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (lead) {
        const statusDiv = document.getElementById(`reach-out-status-${leadId}`);
        if (statusDiv) {
            statusDiv.innerHTML = getReachOutStatus(lead);
        }
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
                            <label style="font-weight: 600; font-size: 12px;">Fleet Size:</label>
                            <input type="text" value="${lead.fleetSize || ''}"
                                   onchange="updateLeadField('${lead.id}', 'fleetSize', this.value)"
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

        // Save to server
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
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

        // If the leads view is active, refresh it
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                setTimeout(() => {
                    window.loadLeadsView();
                }, 500);
            }
        }
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

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
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

        // If the leads view is active, refresh it
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                setTimeout(() => {
                    window.loadLeadsView();
                }, 500);
            }
        }
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

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
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

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
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

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
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

        // Refresh the leads view if active
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                setTimeout(() => {
                    window.loadLeadsView();
                }, 500);
            }
        }
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

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
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
        
        // If the leads view is active, refresh it
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            if (window.loadLeadsView) {
                setTimeout(() => {
                    window.loadLeadsView();
                }, 500);
            }
        }
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
    console.log('Updating reach out:', { leadId, type, checked });

    // Get current leads
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
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
        }

        // Update the specific checkbox and increment counter if checked
        if (type === 'email') {
            if (checked && !leads[leadIndex].reachOut.emailSent) {
                // Increment counter only if it wasn't already checked
                leads[leadIndex].reachOut.emailCount = (leads[leadIndex].reachOut.emailCount || 0) + 1;
            }
            leads[leadIndex].reachOut.emailSent = checked;

            // Update the display
            const countDisplay = document.getElementById(`email-count-${leadId}`);
            if (countDisplay) {
                countDisplay.textContent = leads[leadIndex].reachOut.emailCount;
            }

            // Update reach out status
            updateReachOutStatus(leadId);
        } else if (type === 'text') {
            if (checked && !leads[leadIndex].reachOut.textSent) {
                // Increment counter only if it wasn't already checked
                leads[leadIndex].reachOut.textCount = (leads[leadIndex].reachOut.textCount || 0) + 1;
            }
            leads[leadIndex].reachOut.textSent = checked;

            // Update the display
            const countDisplay = document.getElementById(`text-count-${leadId}`);
            if (countDisplay) {
                countDisplay.textContent = leads[leadIndex].reachOut.textCount;
            }

            // Update reach out status
            updateReachOutStatus(leadId);
        } else if (type === 'call') {
            if (checked) {
                // Always show popup when checkbox is checked (not just first time)
                // Show popup to ask about call outcome
                showCallOutcomePopup(leadId);

                // Don't increment counter here - let the popup handle it based on outcome
                // Don't save here either - let the popup handle saving
                return; // Exit early - let popup handle everything
            }
            leads[leadIndex].reachOut.callMade = checked;
        }

        // Save to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

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
    console.log('Call outcome:', { leadId, answered });

    // Get current leads
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
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

        // Always increment attempts counter (for every call)
        leads[leadIndex].reachOut.callAttempts = (leads[leadIndex].reachOut.callAttempts || 0) + 1;
        leads[leadIndex].reachOut.callMade = true;

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

            // Save to localStorage
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));

            // Update reach out status - will show COMPLETE since connected
            updateReachOutStatus(leadId);

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
            // Save to localStorage first so status update works
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));

            // Update reach out status now that call attempt is recorded
            updateReachOutStatus(leadId);

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

// Function to refresh leads table with updated premium and/or win/loss status
window.refreshLeadsTable = function(leadId, newPremium, winLossStatus) {
    console.log('Refreshing leads table for lead:', leadId, 'Premium:', newPremium, 'Win/Loss:', winLossStatus);

    // If we don't have the win/loss status, get it from localStorage
    if (!winLossStatus) {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        if (lead) {
            winLossStatus = lead.win_loss;
        }
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
            console.log('Found lead row, updating premium display');
            // Find the premium cell (usually one of the last cells)
            cells.forEach(cell => {
                // Check if this cell contains a dollar amount
                if (cell.textContent.includes('$') || cell.textContent.match(/^\d+\.?\d*$/)) {
                    // Update the premium if provided
                    if (newPremium !== undefined) {
                        cell.textContent = '$' + (newPremium || '0.00');
                    }

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
            });
        }
    });

    // Alternative: if loadLeadsView function exists, call it
    if (window.loadLeadsView) {
        console.log('Calling loadLeadsView to refresh entire table');
        window.loadLeadsView();
    }
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
    if (container) {
        console.log('📦 Container element:', container);
        console.log('📦 Container parent:', container.parentElement);
        console.log('📦 Container current content:', container.innerHTML.substring(0, 100) + '...');
    } else {
        console.error('❌ Application submissions container not found:', containerId);
        console.log('🔍 All elements with "application" in ID:',
            Array.from(document.querySelectorAll('[id*="application"]')).map(el => ({ id: el.id, element: el })));
        console.log('🔍 All elements in document:',
            Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }

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

        const response = await fetch(serverUrl);
        let applications = [];

        console.log('📡 Server fetch response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url
        });

        if (response.ok) {
            const data = await response.json();
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
            const vehicleCount = Object.keys(formData).filter(key => key.includes('vehicle') && key.includes('Year') && formData[key]).length;
            const createdDate = new Date(app.created).toLocaleDateString();

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

    const containerId = `application-submissions-container-${leadId}`;
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('❌ Application submissions container not found:', containerId);
        return;
    }

    const formData = applicationData.formData || {};
    const vehicleCount = Object.keys(formData).filter(key => key.includes('vehicle') && key.includes('Year') && formData[key]).length;
    const createdDate = new Date(applicationData.created).toLocaleDateString();

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
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
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

            const response = await fetch(serverUrl);
            if (response.ok) {
                const data = await response.json();
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

        // Create a read-only version of the comprehensive application
        showReadOnlyApplication(application);

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
            const response = await fetch(`${cleanUrl}/api/app-submissions`, {
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
                    const response = await fetch(`${cleanUrl}/api/app-submissions/${leadId}`);

                    if (response.ok) {
                        const submissions = await response.json();
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

// Verify the enhanced profile is available
if (window.createEnhancedProfile) {
    console.log('✅ Final profile fix applied successfully - Enhanced profile with transcription area, vehicles, trailers, drivers, and quote submissions is ready');
} else {
    console.error('❌ Enhanced profile function not properly loaded!');
}
console.log('Final profile fix applied successfully');
