// PROTECTED Final Profile Fix - Loads last and prevents overrides
console.log('🔥 PROTECTED-FINAL-PROFILE-FIX: Enhanced profile loading with protection...');

// Store references to prevent overriding
let protectedFunctions = {};

// Create the enhanced profile function with exact working UI
protectedFunctions.createEnhancedProfile = function(lead) {
    console.log('🔥 Enhanced Profile: Creating profile for:', lead.name);

    // Remove any existing modals
    const existing = document.getElementById('lead-profile-container');
    if (existing) {
        existing.remove();
    }

    // Initialize data if needed
    if (!lead.vehicles || !Array.isArray(lead.vehicles)) lead.vehicles = [];
    if (!lead.trailers || !Array.isArray(lead.trailers)) lead.trailers = [];
    if (!lead.drivers || !Array.isArray(lead.drivers)) lead.drivers = [];
    if (!lead.transcriptText) lead.transcriptText = '';
    if (!lead.reachOut) lead.reachOut = {
        callAttempts: 0,
        callsConnected: 0,
        emailCount: 0,
        textCount: 0,
        voicemailCount: 0
    };
    if (!lead.applications || !Array.isArray(lead.applications)) lead.applications = [];
    if (!lead.quotes || !Array.isArray(lead.quotes)) lead.quotes = [];

    // Create modal container with exact working styling
    const modalContainer = document.createElement('div');
    modalContainer.id = 'lead-profile-container';
    modalContainer.dataset.leadId = lead.id;
    modalContainer.style.cssText = `
        position: fixed !important;
        top: 0px !important;
        left: 0px !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.5) !important;
        display: flex;
        justify-content: center !important;
        align-items: center !important;
        z-index: 1000000;
        animation: 0.3s ease 0s 1 normal none running fadeIn !important;
        visibility: visible;
        opacity: 1;
    `;

    modalContainer.innerHTML = `
        <div class="modal-content" style="background: white; border-radius: 12px; max-width: 1200px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 60px; position: relative; transform: none; top: auto; left: auto;">
            <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h2 style="margin: 0; font-size: 24px;"><i class="fas fa-truck"></i> Commercial Auto Lead Profile</h2>
                <button class="close-btn" id="profile-close-btn" onclick="document.getElementById('lead-profile-container').remove()" style="position: absolute; top: 20px; right: 20px; font-size: 30px; background: none; border: none; cursor: pointer;">×</button>
            </div>

            <div style="padding: 20px;">
                <!-- Lead Stage (standalone at top) -->
                <div class="profile-section" style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-chart-line"></i> Lead Stage</h3>
                    <div>
                        <label style="font-weight: 600; font-size: 12px;">Current Stage:</label>
                        <select id="lead-stage-${lead.id}" onchange="updateLeadStage('${lead.id}', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                            <option value="New" ${lead.stage === 'New' ? 'selected' : ''}>New</option>
                            <option value="Contact Attempted" ${lead.stage === 'Contact Attempted' ? 'selected' : ''}>Contact Attempted</option>
                            <option value="Info Requested" ${lead.stage === 'Info Requested' ? 'selected' : ''}>Info Requested</option>
                            <option value="Info Received" ${lead.stage === 'Info Received' ? 'selected' : ''}>Info Received</option>
                            <option value="Loss Runs Requested" ${lead.stage === 'Loss Runs Requested' ? 'selected' : ''}>Loss Runs Requested</option>
                            <option value="Loss Runs Received" ${lead.stage === 'Loss Runs Received' ? 'selected' : ''}>Loss Runs Received</option>
                            <option value="App Prepared" ${lead.stage === 'App Prepared' ? 'selected' : ''}>App Prepared</option>
                            <option value="App Sent" ${lead.stage === 'App Sent' ? 'selected' : ''}>App Sent</option>
                            <option value="Quote Sent" ${lead.stage === 'Quote Sent' ? 'selected' : ''}>Quote Sent</option>
                            <option value="Interested" ${lead.stage === 'Interested' ? 'selected' : ''}>Interested</option>
                            <option value="Not Interested" ${lead.stage === 'Not Interested' ? 'selected' : ''}>Not Interested</option>
                            <option value="Closed" ${lead.stage === 'Closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                    <!-- Stage Timestamp with Color Coding -->
                    <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px; text-align: center;">
                        <div id="lead-age-${lead.id}" style="display: flex; justify-content: center;">
                            ${(function() {
                                // Use stage update timestamp if available, otherwise lead creation date
                                const stageDate = lead.stageUpdatedAt || lead.createdDate || lead.created_at || new Date().toISOString();
                                const now = new Date();
                                const updated = new Date(stageDate);
                                const daysDiff = Math.floor((now - updated) / (1000 * 60 * 60 * 24));

                                // Calculate color based on stage age - URGENT TIMELINE
                                let ageColor;
                                if (daysDiff >= 3) ageColor = 'red';    // 3+ days = RED (urgent)
                                else if (daysDiff >= 2) ageColor = 'orange';  // 2 days = ORANGE
                                else if (daysDiff >= 1) ageColor = 'yellow';  // 1 day = YELLOW
                                else ageColor = 'green';  // Today = GREEN

                                // Map color names to background colors for pills
                                const colorMap = {
                                    'green': '#10b981',
                                    'yellow': '#eab308',
                                    'orange': '#f59e0b',
                                    'red': '#dc2626'
                                };

                                const backgroundColor = colorMap[ageColor] || '#10b981';

                                // Show actual date/time instead of relative time
                                const timeText = updated.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: updated.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                });

                                return `<span id="stage-timestamp-${lead.id}" style="
                                    background-color: ${backgroundColor};
                                    color: white;
                                    padding: 6px 12px;
                                    border-radius: 20px;
                                    font-size: 11px;
                                    font-weight: bold;
                                    display: inline-block;
                                    white-space: nowrap;
                                ">${timeText}</span>`;
                            })()}
                        </div>
                    </div>
                </div>

                <!-- Reach Out Checklist -->
                <div class="profile-section" style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <!-- Header with TO DO message -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0; font-weight: bold;" id="reach-out-header-title-${lead.id}"><i class="fas fa-tasks"></i> <span style="color: #dc2626;">Reach Out</span></h3>
                        <div id="reach-out-todo-${lead.id}" style="font-weight: bold; font-size: 18px; color: #dc2626;">
                            TO DO: Call
                        </div>
                    </div>

                    <!-- Completion Timestamp -->
                    <div id="reach-out-completion-${lead.id}" style="text-align: center; margin-bottom: 10px; display: none;">
                        <div style="background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block;">
                            Completed: <span id="completion-timestamp-${lead.id}"></span>
                        </div>
                    </div>

                    <!-- Separator Line -->
                    <div id="reach-out-separator-${lead.id}" style="border-bottom: 2px solid #f59e0b; margin-bottom: 15px; padding-bottom: 10px;"></div>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="email-sent-${lead.id}" ${lead.reachOut.emailCount > 0 ? 'checked' : ''} onchange="updateReachOut('${lead.id}', 'email', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
                                <label for="email-sent-${lead.id}" style="font-weight: 600; cursor: pointer;">Email Sent</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-weight: 600;">Sent:</span>
                                <span id="email-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">${lead.reachOut.emailCount}</span>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="text-sent-${lead.id}" ${lead.reachOut.textCount > 0 ? 'checked' : ''} onchange="updateReachOut('${lead.id}', 'text', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
                                <label for="text-sent-${lead.id}" style="font-weight: 600; cursor: pointer;">Text Sent</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-weight: 600;">Sent:</span>
                                <span id="text-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">${lead.reachOut.textCount}</span>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="call-made-${lead.id}" ${lead.reachOut.callAttempts > 0 ? 'checked' : ''} onchange="updateReachOut('${lead.id}', 'call', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
                                <label for="call-made-${lead.id}" style="font-weight: 600; cursor: pointer;">Called</label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 600;">Attempts:</span>
                                    <span id="call-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #0066cc; min-width: 30px; text-align: center;">${lead.reachOut.callAttempts}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 600;">Connected:</span>
                                    <span id="call-connected-${lead.id}" style="font-weight: bold; font-size: 18px; color: #10b981; min-width: 30px; text-align: center;">${lead.reachOut.callsConnected}</span>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 10px; padding-left: 30px;">
                            <span style="font-weight: 600;">Voicemail Sent:</span>
                            <span id="voicemail-count-${lead.id}" style="font-weight: bold; font-size: 18px; color: #f59e0b; min-width: 30px; text-align: center;">${lead.reachOut.voicemailCount}</span>
                        </div>
                    </div>
                </div>

                <!-- Other Lead Details -->
                <div class="profile-section" style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-info-circle"></i> Lead Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Lead Status:</label>
                            <select onchange="updateLeadStatus('${lead.id}', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="Active" ${(lead.status === 'Active' || !lead.status) ? 'selected' : ''}>Active</option>
                                <option value="Inactive" ${lead.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                <option value="Pending" ${lead.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Converted" ${lead.status === 'Converted' ? 'selected' : ''}>Converted</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Premium:</label>
                            <input type="text" id="lead-premium-${lead.id}" value="${lead.premium || ''}" placeholder="Enter premium amount" onchange="updateLeadField('${lead.id}', 'premium', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Win/Loss:</label>
                            <select id="lead-winloss-${lead.id}" onchange="updateWinLossStatus('${lead.id}', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="neutral" ${(lead.winLoss === 'neutral' || !lead.winLoss) ? 'selected' : ''}>Neutral</option>
                                <option value="win" ${lead.winLoss === 'win' ? 'selected' : ''}>Win</option>
                                <option value="loss" ${lead.winLoss === 'loss' ? 'selected' : ''}>Loss</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Assigned To:</label>
                            <select id="lead-assignedTo-${lead.id}" onchange="updateLeadAssignedTo('${lead.id}', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                <option value="" ${!lead.assignedTo ? 'selected' : ''}>Unassigned</option>
                                <option value="Grant" ${lead.assignedTo === 'Grant' ? 'selected' : ''}>Grant</option>
                                <option value="Hunter" ${lead.assignedTo === 'Hunter' ? 'selected' : ''}>Hunter</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Company Information -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Company Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Company Name:</label>
                            <input type="text" value="${lead.name || ''}" onchange="updateLeadField('${lead.id}', 'name', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Contact:</label>
                            <input type="text" value="${lead.contact || ''}" onchange="updateLeadField('${lead.id}', 'contact', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Phone:</label>
                            <input type="text" value="${lead.phone || ''}" onchange="updateLeadField('${lead.id}', 'phone', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Email:</label>
                            <input type="text" value="${lead.email || ''}" onchange="updateLeadField('${lead.id}', 'email', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">DOT Number:</label>
                            <input type="text" value="${lead.dotNumber || ''}" onchange="updateLeadField('${lead.id}', 'dotNumber', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">MC Number:</label>
                            <input type="text" value="${lead.mcNumber || ''}" onchange="updateLeadField('${lead.id}', 'mcNumber', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Years in Business:</label>
                            <input type="text" value="${lead.yearsInBusiness || ''}" onchange="updateLeadField('${lead.id}', 'yearsInBusiness', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Renewal Date:</label>
                            <input type="text" value="${lead.renewalDate || ''}" placeholder="MM/DD/YYYY" onchange="updateLeadField('${lead.id}', 'renewalDate', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>

                <!-- Operation Details -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Operation Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Radius of Operation:</label>
                            <input type="text" value="${lead.radiusOfOperation || ''}" placeholder="e.g., 500 miles" onchange="updateLeadField('${lead.id}', 'radiusOfOperation', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Commodity Hauled:</label>
                            <input type="text" value="${lead.commodityHauled || ''}" placeholder="e.g., General Freight" onchange="updateLeadField('${lead.id}', 'commodityHauled', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Operating States:</label>
                            <input type="text" value="${lead.operatingStates || ''}" placeholder="e.g., TX, LA, OK" onchange="updateLeadField('${lead.id}', 'operatingStates', this.value)" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        </div>
                    </div>
                </div>

                <!-- Vehicles -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-truck"></i> Vehicles (${lead.vehicles ? lead.vehicles.length : 0})</h3>
                        <button class="btn-small btn-primary" onclick="addVehicleToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Vehicle
                        </button>
                    </div>
                    <div id="vehicles-container-${lead.id}">
                        ${lead.vehicles && lead.vehicles.length > 0 ?
                            lead.vehicles.map((vehicle, index) => `
                                <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <h4 style="margin: 0; color: #374151;">Vehicle ${index + 1}</h4>
                                        <button onclick="removeVehicle('${lead.id}', ${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Year:</label>
                                            <input type="text" value="${vehicle.year || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'year', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Make:</label>
                                            <input type="text" value="${vehicle.make || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'make', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Model:</label>
                                            <input type="text" value="${vehicle.model || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'model', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">VIN:</label>
                                            <input type="text" value="${vehicle.vin || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'vin', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Value ($):</label>
                                            <input type="text" value="${vehicle.value || ''}" onchange="updateVehicle('${lead.id}', ${index}, 'value', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Type:</label>
                                            <select onchange="updateVehicle('${lead.id}', ${index}, 'type', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                                <option value="">Select Type</option>
                                                <option value="Box Truck" ${vehicle.type === 'Box Truck' ? 'selected' : ''}>Box Truck</option>
                                                <option value="Semi Truck" ${vehicle.type === 'Semi Truck' ? 'selected' : ''}>Semi Truck</option>
                                                <option value="Flatbed" ${vehicle.type === 'Flatbed' ? 'selected' : ''}>Flatbed</option>
                                                <option value="Pickup" ${vehicle.type === 'Pickup' ? 'selected' : ''}>Pickup</option>
                                                <option value="Van" ${vehicle.type === 'Van' ? 'selected' : ''}>Van</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            `).join('') :
                            '<p style="color: #9ca3af; text-align: center; padding: 20px;">No vehicles added yet</p>'
                        }
                    </div>
                </div>

                <!-- Trailers -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-trailer"></i> Trailers (${lead.trailers ? lead.trailers.length : 0})</h3>
                        <button class="btn-small btn-primary" onclick="addTrailerToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Trailer
                        </button>
                    </div>
                    <div id="trailers-container-${lead.id}">
                        ${lead.trailers && lead.trailers.length > 0 ?
                            lead.trailers.map((trailer, index) => `
                                <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <h4 style="margin: 0; color: #374151;">Trailer ${index + 1}</h4>
                                        <button onclick="removeTrailer('${lead.id}', ${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Year:</label>
                                            <input type="text" value="${trailer.year || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'year', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Make:</label>
                                            <input type="text" value="${trailer.make || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'make', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Type:</label>
                                            <input type="text" value="${trailer.type || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'type', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">VIN:</label>
                                            <input type="text" value="${trailer.vin || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'vin', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Length:</label>
                                            <input type="text" value="${trailer.length || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'length', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Value ($):</label>
                                            <input type="text" value="${trailer.value || ''}" onchange="updateTrailer('${lead.id}', ${index}, 'value', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                    </div>
                                </div>
                            `).join('') :
                            '<p style="color: #9ca3af; text-align: center; padding: 20px;">No trailers added yet</p>'
                        }
                    </div>
                </div>

                <!-- Drivers -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-id-card"></i> Drivers (${lead.drivers ? lead.drivers.length : 0})</h3>
                        <button class="btn-small btn-primary" onclick="addDriverToLead('${lead.id}')" style="padding: 8px 16px;">
                            <i class="fas fa-plus"></i> Add Driver
                        </button>
                    </div>
                    <div id="drivers-container-${lead.id}">
                        ${lead.drivers && lead.drivers.length > 0 ?
                            lead.drivers.map((driver, index) => `
                                <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <h4 style="margin: 0; color: #374151;">Driver ${index + 1}</h4>
                                        <button onclick="removeDriver('${lead.id}', ${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Name:</label>
                                            <input type="text" value="${driver.name || ''}" onchange="updateDriver('${lead.id}', ${index}, 'name', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">License #:</label>
                                            <input type="text" value="${driver.license || ''}" onchange="updateDriver('${lead.id}', ${index}, 'license', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Date of Birth:</label>
                                            <input type="date" value="${driver.dob || ''}" onchange="updateDriver('${lead.id}', ${index}, 'dob', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Hire Date:</label>
                                            <input type="date" value="${driver.hireDate || ''}" onchange="updateDriver('${lead.id}', ${index}, 'hireDate', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Years Experience:</label>
                                            <input type="text" value="${driver.experience || ''}" onchange="updateDriver('${lead.id}', ${index}, 'experience', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                        <div>
                                            <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Violations/Accidents:</label>
                                            <input type="text" value="${driver.violations || ''}" onchange="updateDriver('${lead.id}', ${index}, 'violations', this.value)" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                        </div>
                                    </div>
                                </div>
                            `).join('') :
                            '<p style="color: #9ca3af; text-align: center; padding: 20px;">No drivers added yet</p>'
                        }
                    </div>
                </div>

                <!-- Call Transcript -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-microphone"></i> Call Transcript</h3>
                    <textarea onchange="updateLeadField('${lead.id}', 'transcriptText', this.value)" style="width: 100%; min-height: 150px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace;">${lead.transcriptText || ''}</textarea>
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
                        <div id="quotes-container-${lead.id}" style="padding: 20px; text-align: center;">
                            <p style="color: #9ca3af; text-align: center; padding: 20px;">No quotes submitted yet</p>
                        </div>
                    </div>
                </div>

                <!-- Application Submissions -->
                <div class="profile-section" style="background: #f0f9f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-signature"></i> Application Submissions</h3>
                    </div>
                    <div id="application-submissions-container-${lead.id}">
                        <p style="color: #9ca3af; text-align: center; padding: 20px;">No applications submitted yet</p>
                    </div>
                </div>

                <!-- Loss Runs -->
                <div class="profile-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><i class="fas fa-file-pdf"></i> Loss Runs and Other Documentation</h3>
                        <div style="display: flex; gap: 10px;">
                            <button id="email-doc-btn-${lead.id}" onclick="checkFilesAndOpenEmail('${lead.id}')" style="background: rgb(0, 102, 204); color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px; opacity: 1;" title="Send email with attached documentation">
                                <i class="fas fa-envelope"></i> Email Documentation
                            </button>
                            <button onclick="openLossRunsUpload('${lead.id}')" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-upload"></i> Upload Documentation
                            </button>
                        </div>
                    </div>
                    <div id="loss-runs-container-${lead.id}">
                        <p style="color: #9ca3af; text-align: center; padding: 20px;">Loading loss runs...</p>
                    </div>
                </div>

                <!-- Notes -->
                <div class="profile-section" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                    <textarea onchange="updateLeadField('${lead.id}', 'notes', this.value)" style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;">${lead.notes || ''}</textarea>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    // Apply reach-out styling based on lead's to-do status
    setTimeout(() => {
        // Check if this stage requires reach-out based on stage name
        const stagesRequiringReachOut = [
            'Info Requested', 'info_requested',
            'Loss Runs Requested', 'loss_runs_requested',
            'Quote Sent', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware',
            'App Sent', 'app_sent',
            'Interested', 'interested'
        ];

        const stageRequiresReachOut = stagesRequiringReachOut.includes(lead.stage);

        // Also check getActionText as backup
        let actionTextCheck = false;
        if (window.getActionText) {
            const actionText = window.getActionText(lead.stage, lead.reachOut);
            actionTextCheck = actionText === 'Reach out';
            console.log(`🔍 Profile load - Lead ${lead.id} stage: ${lead.stage}, actionText: "${actionText}", stageRequiresReachOut: ${stageRequiresReachOut}, actionTextCheck: ${actionTextCheck}`);
        }

        // Use stage-based check as primary method
        const hasReachOutTodo = stageRequiresReachOut || actionTextCheck;
        console.log(`🎯 Final hasReachOutTodo: ${hasReachOutTodo}`);

        applyReachOutStyling(lead.id, hasReachOutTodo);
    }, 100);

    // Add click-outside-to-close functionality
    modalContainer.addEventListener('click', function(e) {
        // Only close if clicking the background (not the modal content)
        if (e.target === modalContainer) {
            console.log('🖱️ Clicked outside modal, closing...');
            modalContainer.remove();

            // Refresh the leads table to show any changes made
            refreshLeadsTable();
        }
    });

    // Initialize dynamic elements after modal is created
    setTimeout(() => {
        // Load saved quote applications
        protectedFunctions.loadQuoteApplications(lead.id);

        // Load loss runs from server
        protectedFunctions.loadLossRuns(lead.id);
    }, 100);

    console.log('🔥 Enhanced Profile: Modal created successfully');
};

// Auto-save function for company information fields
protectedFunctions.updateLeadField = function(leadId, field, value) {
    console.log('Updating lead field:', leadId, field, value);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        leads[leadIndex][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('Field updated and saved to localStorage:', field, value);

        // Save to server database
        const updateData = {};
        updateData[field] = value;

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Field updated on server:', field, value);
            } else {
                console.error('❌ Server update failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Server update error:', error);
        });

        // Update the table display immediately
        refreshLeadsTable();
    }
};

// NEW: Dedicated Email Composer for Lead Documentation
protectedFunctions.openEmailDocumentation = async function(leadId) {
    console.log('📧 Opening dedicated email composer for lead:', leadId);

    // Get lead data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        alert('Lead not found');
        return;
    }

    // Prepare subject with lead data (use NULL if not found)
    const companyName = lead.name || 'NULL';
    const renewalDate = lead.renewalDate || 'NULL';
    const usdot = lead.dotNumber || 'NULL';
    const subject = `Renewal: ${renewalDate} - USDOT: ${usdot} - ${companyName}`;

    // Get loss runs files for attachments
    const lossRuns = JSON.parse(localStorage.getItem('loss_runs') || '{}');
    const leadLossRuns = lossRuns[leadId] || [];

    // Create the email composer modal
    protectedFunctions.createEmailComposer(lead, subject, leadLossRuns);
};

// NEW: Create dedicated email composer modal
protectedFunctions.createEmailComposer = function(lead, subject, attachments) {
    console.log('✉️ Creating email composer for:', lead.name);

    // Remove any existing email composer
    const existing = document.getElementById('email-composer-modal');
    if (existing) {
        existing.remove();
    }

    // Create email composer modal with high z-index (above lead profile)
    const emailModal = document.createElement('div');
    emailModal.id = 'email-composer-modal';
    emailModal.style.cssText = `
        position: fixed !important;
        top: 0px !important;
        left: 0px !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex;
        justify-content: center !important;
        align-items: center !important;
        z-index: 2000000 !important;
        visibility: visible;
        opacity: 1;
    `;

    // Broker-focused email body template
    const emailBody = `Hello,

We are looking to get a quote for the following commercial auto account:

ACCOUNT DETAILS:
• Company: ${lead.name || 'NULL'}
• USDOT Number: ${lead.dotNumber || 'NULL'}
• MC Number: ${lead.mcNumber || 'NULL'}
• Renewal Date: ${lead.renewalDate || 'NULL'}
• Contact: ${lead.contact || 'NULL'}
• Phone: ${lead.phone || 'NULL'}
• Email: ${lead.email || 'NULL'}

OPERATION DETAILS:
• Radius of Operation: ${lead.radiusOfOperation || 'NULL'}
• Commodity Hauled: ${lead.commodityHauled || 'NULL'}
• Operating States: ${lead.operatingStates || 'NULL'}
• Years in Business: ${lead.yearsInBusiness || 'NULL'}

${attachments.length > 0 ? `ATTACHED DOCUMENTATION:\n${attachments.map(file => `• ${file.originalName || file.filename}`).join('\n')}\n\n` : 'Please let us know what additional documentation you may need for quoting.\n\n'}Please provide your most competitive rates and let us know if you need any additional information.

Thank you,

VIG Insurance Agency
Grant Corp
contact@vigagency.com
Phone: (555) 123-4567`;

    emailModal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 95%; max-width: 1200px; max-height: 95vh; overflow-y: auto; box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 60px; position: relative;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; background: #f8fafc; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0; font-size: 20px; color: #1f2937;">
                    <i class="fas fa-paper-plane" style="color: #2563eb; margin-right: 10px;"></i>
                    Compose Email - ${lead.name || 'NULL'}
                </h2>
                <button onclick="document.getElementById('email-composer-modal').remove()" style="position: absolute; top: 15px; right: 15px; font-size: 24px; background: none; border: none; cursor: pointer; color: #6b7280;">×</button>
            </div>

            <div style="padding: 20px;">
                <!-- To Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">To:</label>
                    <input type="email" id="email-to-field" value="${lead.email || ''}" placeholder="recipient@example.com" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                </div>

                <!-- Subject Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">Subject:</label>
                    <input type="text" id="email-subject-field" value="${subject}" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                </div>

                <!-- Attachments Section -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">
                        Attachments (${attachments.length} files):
                    </label>
                    <div id="attachments-list" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background: #f9fafb; max-height: 150px; overflow-y: auto;">
                        ${attachments.length > 0 ?
                            attachments.map(file => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; margin-bottom: 5px; background: white; border-radius: 4px; border: 1px solid #e5e7eb;">
                                    <div style="display: flex; align-items: center;">
                                        <i class="fas fa-paperclip" style="color: #6b7280; margin-right: 8px;"></i>
                                        <span style="font-size: 13px; font-weight: 500;">${file.originalName || file.filename}</span>
                                        <span style="font-size: 11px; color: #6b7280; margin-left: 8px;">(${file.size || 'Unknown size'})</span>
                                    </div>
                                    <button onclick="removeAttachment('${file.filename}')" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('') :
                            '<p style="color: #6b7280; text-align: center; margin: 0; font-size: 13px;">No files attached</p>'
                        }
                    </div>
                </div>

                <!-- Message Body -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; color: #374151;">Message:</label>
                    <textarea id="email-body-field" style="width: 100%; min-height: 400px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; resize: vertical;">${emailBody}</textarea>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <div>
                        <button onclick="addMoreAttachments('${lead.id}')" style="background: #6b7280; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-plus"></i> Add Files
                        </button>
                        <span style="font-size: 12px; color: #6b7280;">Click to add more files from device</span>
                    </div>
                    <div>
                        <button onclick="document.getElementById('email-composer-modal').remove()" style="background: #6b7280; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                            Cancel
                        </button>
                        <button onclick="sendEmail('${lead.id}')" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-paper-plane"></i> Send Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(emailModal);
    console.log('✅ Email composer created with', attachments.length, 'attachments');
};

// Add checkFilesAndOpenEmail function
protectedFunctions.checkFilesAndOpenEmail = function(leadId) {
    console.log('📧 Checking files and opening email for lead:', leadId);
    protectedFunctions.openEmailDocumentation(leadId);
};

// Upload loss runs function with full server integration
protectedFunctions.openLossRunsUpload = function(leadId) {
    console.log('📄 Opening loss runs upload for lead:', leadId);

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    fileInput.multiple = true;

    fileInput.onchange = function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            protectedFunctions.uploadLossRunsFiles(leadId, files);
        }
    };

    // Trigger file selection
    fileInput.click();
};

// Upload files function with Base64 storage (same as working version)
protectedFunctions.uploadLossRunsFiles = function(leadId, files) {
    console.log('📤 Uploading loss runs files to server:', files.length, 'files for lead:', leadId);

    // Show uploading message
    const container = document.getElementById(`loss-runs-container-${leadId}`);
    if (container) {
        container.innerHTML = '<p style="color: #3b82f6; text-align: center; padding: 20px;">📤 Uploading files to server...</p>';
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('leadId', leadId);

    // Add all files to FormData
    Array.from(files).forEach((file, index) => {
        formData.append('files', file);
    });

    // Upload to server
    fetch('/api/loss-runs-upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Files uploaded successfully to server:', data.count, 'files');
            // Reload the loss runs display
            setTimeout(() => {
                protectedFunctions.loadLossRuns(leadId);
            }, 300);
        } else {
            console.error('❌ Upload failed:', data.error);
            alert('Upload failed: ' + data.error);
            protectedFunctions.loadLossRuns(leadId);
        }
    })
    .catch(error => {
        console.error('❌ Upload error:', error);
        alert('Upload error. Please try again.');
        protectedFunctions.loadLossRuns(leadId);
    });
};

// Load loss runs from server
protectedFunctions.loadLossRuns = function(leadId) {
    console.log('🔄 Loading loss runs from server for lead:', leadId);

    const container = document.getElementById(`loss-runs-container-${leadId}`);
    if (!container) return;

    // Show loading message
    container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">⏳ Loading documents...</p>';

    // Load from server
    fetch(`/api/loss-runs-upload?leadId=${encodeURIComponent(leadId)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success && data.files.length > 0) {
            // Display existing loss runs from server
            container.innerHTML = data.files.map(lossRun => {
                const uploadDate = new Date(lossRun.uploaded_date).toLocaleDateString();
                const fileSize = Math.round(lossRun.file_size / 1024) + ' KB';
                const originalName = lossRun.file_name.replace(/^[a-f0-9]+_[0-9]+_/, ''); // Remove unique prefix

                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px;">
                        <div>
                            <div style="display: flex; align-items: center; margin-bottom: 4px;">
                                <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 8px;"></i>
                                <strong style="font-size: 14px;">${originalName}</strong>
                                <span style="background: #10b981; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">SERVER</span>
                            </div>
                            <div style="font-size: 12px; color: #6b7280;">
                                Uploaded: ${uploadDate} • Size: ${fileSize}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="view-loss-runs-btn"
                                    data-file-id="${lossRun.id}"
                                    onclick="viewLossRuns('${leadId}', '${lossRun.id}', '${originalName}')"
                                    style="background: #0066cc; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="remove-loss-runs-btn"
                                    data-file-id="${lossRun.id}"
                                    onclick="removeLossRuns('${leadId}', '${lossRun.id}')"
                                    style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No loss runs uploaded yet</p>';
        }
    })
    .catch(error => {
        console.error('❌ Error loading loss runs:', error);
        container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading documents</p>';
    });
};

// View loss runs function (server version)
protectedFunctions.viewLossRuns = function(leadId, fileId, originalName) {
    console.log('👁️ Viewing loss runs from server:', leadId, fileId, originalName);

    // Open file from server in new window
    const fileUrl = `/api/loss-runs-download?fileId=${encodeURIComponent(fileId)}`;
    const newWindow = window.open(fileUrl, '_blank');

    if (!newWindow) {
        alert('Pop-up blocked. Please allow pop-ups and try again.');
    } else {
        console.log('✅ File opened from server:', originalName);
    }
};

// Remove loss runs function (server version)
protectedFunctions.removeLossRuns = function(leadId, fileId) {
    if (!confirm('Are you sure you want to remove this loss run document from the server?')) {
        return;
    }

    console.log('🗑️ Removing loss runs from server:', leadId, fileId);

    // Remove from server
    fetch('/api/loss-runs-upload', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId: fileId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Loss run removed successfully from server');
            // Reload the loss runs list
            protectedFunctions.loadLossRuns(leadId);
        } else {
            alert('Error removing file: ' + data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error removing file:', error);
        alert('Error removing file. Please try again.');
    });
};

// Reach-out update function
protectedFunctions.updateReachOut = function(leadId, type, checked) {
    console.log(`🐛 DEBUG updateReachOut called: leadId=${leadId}, type=${type}, checked=${checked}`);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex === -1) {
        console.log('🐛 DEBUG updateReachOut - lead not found');
        return;
    }

    if (!leads[leadIndex].reachOut) {
        leads[leadIndex].reachOut = {
            emailCount: 0,
            textCount: 0,
            callAttempts: 0,
            callsConnected: 0,
            voicemailCount: 0
        };
    }

    if (type === 'email') {
        if (checked) {
            leads[leadIndex].reachOut.emailCount++;
        } else {
            leads[leadIndex].reachOut.emailCount = Math.max(0, leads[leadIndex].reachOut.emailCount - 1);
        }
        const emailCountDisplay = document.getElementById(`email-count-${leadId}`);
        if (emailCountDisplay) {
            emailCountDisplay.textContent = leads[leadIndex].reachOut.emailCount;
        }

        // Update TO DO display immediately after email checkbox change
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        applyReachOutStyling(leadId, true);
        console.log('🔄 Updated TO DO display after email checkbox change');
    } else if (type === 'text') {
        if (checked) {
            leads[leadIndex].reachOut.textCount++;

            // Mark reach-out as COMPLETE when text is sent (final step in sequence)
            if (leads[leadIndex].reachOut.textCount > 0) {
                leads[leadIndex].reachOut.completedAt = new Date().toISOString();
                leads[leadIndex].reachOut.reachOutCompletedAt = new Date().toISOString();

                // Mark as complete with green styling
                markReachOutComplete(leadId, leads[leadIndex].reachOut.completedAt);

                showNotification('Text sent! Reach-out sequence completed.', 'success');

                // Refresh main table to remove red "Reach out" text - AGGRESSIVE APPROACH
                setTimeout(() => {
                    console.log('🔄 Text completion: Immediate localStorage update');
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));

                    // Force multiple refresh methods
                    if (window.displayLeads) window.displayLeads();
                    if (window.loadLeadsView) window.loadLeadsView();
                    refreshLeadsTable();
                    console.log('✅ Text completion: Multiple table refresh methods called');
                }, 100);

                setTimeout(() => {
                    loadLeadsFromServerAndRefresh();
                    console.log('🔄 Text completion: Secondary server reload');
                }, 1500);
            }
        } else {
            leads[leadIndex].reachOut.textCount = Math.max(0, leads[leadIndex].reachOut.textCount - 1);
        }
        const textCountDisplay = document.getElementById(`text-count-${leadId}`);
        if (textCountDisplay) {
            textCountDisplay.textContent = leads[leadIndex].reachOut.textCount;
        }
    } else if (type === 'call') {
        if (checked) {
            // Show popup when call checkbox is checked
            showCallOutcomePopup(leadId);
            return; // Exit early - let popup handle everything
        } else {
            leads[leadIndex].reachOut.callAttempts = Math.max(0, leads[leadIndex].reachOut.callAttempts - 1);
        }
        const callCountDisplay = document.getElementById(`call-count-${leadId}`);
        if (callCountDisplay) {
            callCountDisplay.textContent = leads[leadIndex].reachOut.callAttempts;
        }
    }

    localStorage.setItem('insurance_leads', JSON.stringify(leads));

    // Save reach-out data to server
    const updateData = {
        reachOut: leads[leadIndex].reachOut
    };

    fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Reach-out data updated on server');
        } else {
            console.error('❌ Server reach-out update failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error updating reach-out data:', error);
    });

    // Update the sequential to-do display after every action
    // Check if the lead is completed first, otherwise update the sequential display
    if (!leads[leadIndex].reachOut.completedAt && !leads[leadIndex].reachOut.reachOutCompletedAt) {
        // Only update sequential display if not completed
        if (window.getActionText) {
            const actionText = window.getActionText(leads[leadIndex].stage, leads[leadIndex].reachOut);
            if (actionText === 'Reach out') {
                applyReachOutStyling(leadId, true);
            }
        }
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
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1000001;
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
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        z-index: 1000002;
        min-width: 400px;
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

    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {
                emailCount: 0,
                textCount: 0,
                callAttempts: 0,
                callsConnected: 0,
                voicemailCount: 0
            };
        }

        // Always increment attempts counter
        leads[leadIndex].reachOut.callAttempts = (leads[leadIndex].reachOut.callAttempts || 0) + 1;

        // Update attempts display
        const attemptsDisplay = document.getElementById(`call-count-${leadId}`);
        if (attemptsDisplay) {
            attemptsDisplay.textContent = leads[leadIndex].reachOut.callAttempts;
        }

        if (answered) {
            // Lead answered - increment connected counter AND mark reach-out as COMPLETE
            leads[leadIndex].reachOut.callsConnected = (leads[leadIndex].reachOut.callsConnected || 0) + 1;
            leads[leadIndex].reachOut.completedAt = new Date().toISOString();
            leads[leadIndex].reachOut.reachOutCompletedAt = new Date().toISOString(); // BOTH fields for compatibility

            // Update connected display
            const connectedDisplay = document.getElementById(`call-connected-${leadId}`);
            if (connectedDisplay) {
                connectedDisplay.textContent = leads[leadIndex].reachOut.callsConnected;
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

            // Save to localStorage and server
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            // Save the complete lead with reachOut data to server
            const updateData = {
                reachOut: leads[leadIndex].reachOut
            };

            fetch(`/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('✅ Lead completion data saved to server - triggering final refresh');

                    // FINAL refresh after confirmed server save
                    setTimeout(() => {
                        loadLeadsFromServerAndRefresh();
                        console.log('🔄 FINAL refresh after confirmed server save');
                    }, 300);
                } else {
                    console.error('❌ Server completion update failed:', data.error);
                }
            })
            .catch(error => {
                console.error('❌ Error saving completion data:', error);
            });

            // Update checkbox to checked
            const checkbox = document.getElementById(`call-made-${leadId}`);
            if (checkbox) {
                checkbox.checked = true;
            }

            // Mark reach-out as COMPLETE with green styling and timestamp
            markReachOutComplete(leadId, leads[leadIndex].reachOut.completedAt);

            showNotification('Call connected! Reach-out completed.', 'success');

            // Refresh the leads table to remove the red "Reach out" from TO DO column
            // CRITICAL: Must wait for server save to complete first
            setTimeout(() => {
                console.log('🔄 Step 1: Updating localStorage for immediate effect');
                // Update localStorage immediately for instant local refresh
                localStorage.setItem('insurance_leads', JSON.stringify(leads));

                // Force table refresh with updated localStorage
                if (window.displayLeads) {
                    window.displayLeads();
                    console.log('✅ Forced displayLeads refresh');
                }
                if (window.loadLeadsView) {
                    window.loadLeadsView();
                    console.log('✅ Forced loadLeadsView refresh');
                }
                refreshLeadsTable();
                console.log('✅ Forced refreshLeadsTable');
            }, 100);

            // Secondary refresh after server save completes
            setTimeout(() => {
                console.log('🔄 Step 2: Server reload after save completion');
                loadLeadsFromServerAndRefresh();
                console.log('🔄 FORCED SERVER RELOAD after completion');
            }, 2000);
        } else {
            // Lead didn't pick up - save and show voicemail question
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            saveReachOutToServer(leadId, leads[leadIndex].reachOut);

            // Update checkbox to checked
            const checkbox = document.getElementById(`call-made-${leadId}`);
            if (checkbox) {
                checkbox.checked = true;
            }

            // Show voicemail question
            const voicemailQuestion = document.getElementById('voicemail-question');
            if (voicemailQuestion) {
                voicemailQuestion.style.display = 'block';
            }

            // Update the sequential to-do display - FORCE UPDATE since we know this is a reach-out stage
            applyReachOutStyling(leadId, true);
            console.log('🔄 Updated TO DO display after call attempt (no answer)');
        }
    }
};

// Function to handle voicemail outcome
window.handleVoicemailOutcome = function(leadId, leftVoicemail) {
    console.log('Voicemail outcome:', { leadId, leftVoicemail });

    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        if (leftVoicemail) {
            leads[leadIndex].reachOut.voicemailCount = (leads[leadIndex].reachOut.voicemailCount || 0) + 1;

            // Update voicemail display
            const voicemailDisplay = document.getElementById(`voicemail-count-${leadId}`);
            if (voicemailDisplay) {
                voicemailDisplay.textContent = leads[leadIndex].reachOut.voicemailCount;
            }
        }

        // Save to localStorage and server
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        saveReachOutToServer(leadId, leads[leadIndex].reachOut);
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

    showNotification(leftVoicemail ? 'Voicemail recorded!' : 'Call attempt recorded!', 'success');

    // Update the sequential to-do display - FORCE UPDATE since we know this is a reach-out stage
    applyReachOutStyling(leadId, true);
    console.log('🔄 Updated TO DO display after voicemail outcome');
};

// Helper function to save reach-out data to server
function saveReachOutToServer(leadId, reachOutData) {
    const updateData = {
        reachOut: reachOutData
    };

    fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Reach-out data updated on server');
        } else {
            console.error('❌ Server reach-out update failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Error updating reach-out data:', error);
    });
}

// Function to apply styling to reach-out section based on lead's to-do requirements
function applyReachOutStyling(leadId, hasReachOutTodo) {
    // Update the TO DO message in the header
    const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
    const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
    const separator = document.getElementById(`reach-out-separator-${leadId}`);
    const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);

    if (todoDiv) {
        const lead = JSON.parse(localStorage.getItem('insurance_leads') || '[]').find(l => String(l.id) === String(leadId));
        if (lead) {
            // Initialize reachOut if it doesn't exist
            if (!lead.reachOut) {
                lead.reachOut = {
                    emailCount: 0,
                    textCount: 0,
                    callAttempts: 0,
                    callsConnected: 0,
                    voicemailCount: 0
                };
            }

            // Check if reach-out is already completed first (regardless of stage requirement)
            if (lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt) {
                // COMPLETED REACH-OUT - Always show green regardless of current stage requirement
                const completedTime = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;
                markReachOutComplete(leadId, completedTime);
            } else if (hasReachOutTodo) {
                // STAGE REQUIRES REACH-OUT AND NOT COMPLETED - Show red styling
                todoDiv.style.display = 'block'; // Show TO DO text

                // Show sequential to-do system: call → email → text
                let nextAction = '';
                if (!lead.reachOut.callAttempts || lead.reachOut.callAttempts === 0) {
                    nextAction = 'TO DO: Call';
                } else if (!lead.reachOut.emailCount || lead.reachOut.emailCount === 0) {
                    nextAction = 'TO DO: Email';
                } else if (!lead.reachOut.textCount || lead.reachOut.textCount === 0) {
                    nextAction = 'TO DO: Text';
                } else {
                    nextAction = 'All methods completed';
                }

                // Show red to-do message for active reach-out requirements
                todoDiv.innerHTML = `<span style="color: #dc2626; font-weight: bold; font-size: 18px;">${nextAction}</span>`;

                // Change header to red
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #dc2626;">Reach Out</span>';
                }

                // Change separator line to orange
                if (separator) {
                    separator.style.borderBottom = '2px solid #f59e0b';
                }

                // Hide completion timestamp if not completed
                if (completionDiv) {
                    completionDiv.style.display = 'none';
                }
            } else {
                // STAGE DOESN'T REQUIRE REACH-OUT AND NOT COMPLETED - Show neutral black styling
                todoDiv.style.display = 'none'; // Hide TO DO text completely

                // Change header to neutral black
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #374151;">Reach Out</span>';
                }

                // Change separator line to neutral black
                if (separator) {
                    separator.style.borderBottom = '2px solid #374151';
                }

                // Hide completion timestamp
                if (completionDiv) {
                    completionDiv.style.display = 'none';
                }
            }
            console.log(`✅ Applied reach-out styling for lead ${leadId}, hasReachOutTodo: ${hasReachOutTodo}, completed: ${!!(lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt)}`);
        }
    }
}

// Function to mark reach-out as complete
function markReachOutComplete(leadId, completedAt) {
    // Update the TO DO text to show COMPLETED
    const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
    if (todoDiv) {
        todoDiv.innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>`;
    }

    // Change "Reach Out" title to green
    const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
    if (headerTitle) {
        headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #10b981;">Reach Out</span>';
    }

    // Change separator line to green
    const separator = document.getElementById(`reach-out-separator-${leadId}`);
    if (separator) {
        separator.style.borderBottom = '2px solid #10b981';
    }

    // Show completion timestamp
    const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);
    const timestampSpan = document.getElementById(`completion-timestamp-${leadId}`);

    if (completionDiv && timestampSpan) {
        const completedDate = new Date(completedAt);
        timestampSpan.textContent = completedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        completionDiv.style.display = 'block';
    }

    console.log(`✅ Marked reach-out as complete for lead ${leadId} at ${completedAt}`);
}

// Update stage function
protectedFunctions.updateLeadStage = function(leadId, stage) {
    console.log('Updating lead stage:', leadId, stage);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        const now = new Date().toISOString();

        // Update stage and timestamp
        leads[leadIndex].stage = stage;
        leads[leadIndex].stageUpdatedAt = now;

        // Reset reach-out data when stage changes
        console.log('🔄 Stage changed - resetting reach-out data for lead:', leadId);
        if (leads[leadIndex].reachOut) {
            // Reset all reach-out completion data
            leads[leadIndex].reachOut.completedAt = null;
            leads[leadIndex].reachOut.reachOutCompletedAt = null;
            leads[leadIndex].reachOut.callsConnected = 0;
            leads[leadIndex].reachOut.textCount = 0;
            leads[leadIndex].reachOut.emailSent = false;
            leads[leadIndex].reachOut.textSent = false;
            leads[leadIndex].reachOut.callMade = false;
            leads[leadIndex].reachOut.emailCount = 0;
            leads[leadIndex].reachOut.callAttempts = 0;
            leads[leadIndex].reachOut.voicemailCount = 0;
            console.log('✅ Reach-out data reset for lead:', leadId);
        }

        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Save stage change to server (including reset reach-out data)
        const updateData = {
            stage: stage,
            stageUpdatedAt: now,
            reachOut: leads[leadIndex].reachOut // Include the reset reach-out data
        };

        fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Stage updated on server:', stage);
            } else {
                console.error('❌ Server stage update failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Server stage update error:', error);
        });

        // Update the stage dropdown immediately
        const stageDropdown = document.getElementById(`lead-stage-${leadId}`);
        if (stageDropdown) {
            stageDropdown.value = stage;
            console.log('✅ Stage dropdown updated immediately:', stage);
        }

        // Update the timestamp display in the current profile if open
        updateStageTimestampDisplay(leadId, now);

        // Update reach-out styling based on new stage requirements
        const stagesRequiringReachOut = [
            'Info Requested', 'info_requested',
            'Loss Runs Requested', 'loss_runs_requested',
            'Quote Sent', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware',
            'App Sent', 'app_sent',
            'Interested', 'interested'
        ];

        const hasReachOutTodo = stagesRequiringReachOut.includes(stage);
        applyReachOutStyling(leadId, hasReachOutTodo);
        console.log(`🎨 Stage change: ${stage}, hasReachOut: ${hasReachOutTodo}`);

        // Update the table display immediately
        refreshLeadsTable();
    }
};

// Override viewLead to use enhanced profile
protectedFunctions.viewLead = function(leadId) {
    console.log('🔥 viewLead override called for:', leadId);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (lead) {
        protectedFunctions.createEnhancedProfile(lead);
    } else {
        console.error('Lead not found:', leadId);
    }
};

// Create showLeadProfile alias for compatibility
protectedFunctions.showLeadProfile = function(leadId) {
    console.log('🔥 showLeadProfile called, redirecting to enhanced profile for:', leadId);
    protectedFunctions.viewLead(leadId);
};

// Notification function
protectedFunctions.showNotification = function(message, type) {
    console.log(`[${type}] ${message}`);
};

// Additional lead update functions
protectedFunctions.updateLeadStatus = function(leadId, status) {
    protectedFunctions.updateLeadField(leadId, 'status', status);
};

protectedFunctions.updateWinLossStatus = function(leadId, winLoss) {
    protectedFunctions.updateLeadField(leadId, 'winLoss', winLoss);
};

protectedFunctions.updateLeadAssignedTo = function(leadId, assignedTo) {
    protectedFunctions.updateLeadField(leadId, 'assignedTo', assignedTo);
};

// Vehicle, Trailer, Driver management functions - Use existing card functions
protectedFunctions.addVehicleToLead = function(leadId) {
    console.log('Add vehicle for lead:', leadId);
    // Use the existing addVehicle function that creates cards
    if (window.addVehicle) {
        window.addVehicle(leadId);
    } else {
        // Fallback: create the vehicle manually
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        if (lead) {
            if (!lead.vehicles) lead.vehicles = [];
            lead.vehicles.push({
                year: '',
                make: '',
                model: '',
                vin: '',
                value: '',
                deductible: '',
                type: '',
                gvwr: ''
            });
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            // Refresh lead profile
            if (window.showLeadProfile) {
                window.showLeadProfile(leadId);
            }
        }
    }
};

protectedFunctions.addTrailerToLead = function(leadId) {
    console.log('Add trailer for lead:', leadId);
    // Use the existing addTrailer function that creates cards
    if (window.addTrailer) {
        window.addTrailer(leadId);
    } else {
        // Fallback: create the trailer manually
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        if (lead) {
            if (!lead.trailers) lead.trailers = [];
            lead.trailers.push({
                year: '',
                make: '',
                type: '',
                vin: '',
                length: '',
                value: '',
                deductible: ''
            });
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            // Refresh lead profile
            if (window.showLeadProfile) {
                window.showLeadProfile(leadId);
            }
        }
    }
};

protectedFunctions.addDriverToLead = function(leadId) {
    console.log('Add driver for lead:', leadId);
    // Use the existing addDriver function that creates cards
    if (window.addDriver) {
        window.addDriver(leadId);
    } else {
        // Fallback: create the driver manually
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        if (lead) {
            if (!lead.drivers) lead.drivers = [];
            lead.drivers.push({
                name: '',
                license: '',
                dob: '',
                hireDate: '',
                experience: '',
                violations: ''
            });
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            // Refresh lead profile
            if (window.showLeadProfile) {
                window.showLeadProfile(leadId);
            }
        }
    }
};

// Quote and Application management functions
protectedFunctions.createQuoteApplication = function(leadId) {
    console.log('Create quote application for lead:', leadId);

    // Use the enhanced quote application modal
    if (typeof window.createQuoteApplicationSimple === 'function') {
        window.createQuoteApplicationSimple(leadId);
        return;
    }

    console.error('Enhanced quote application not available');
    alert('Quote application feature is loading. Please try again in a moment.');

    // End of function - enhanced modal will be used instead
};

protectedFunctions.loadQuoteApplications = function(leadId) {
    console.log('📋 Loading quote applications for lead:', leadId);

    const applicationsContainer = document.getElementById(`application-submissions-container-${leadId}`);
    if (!applicationsContainer) {
        console.log('❌ Applications container not found');
        return;
    }

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 12px;
        width: 90vw;
        height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 60px;
    `;

    content.innerHTML = `
        <div style="position: relative;">
            <button onclick="document.getElementById('quote-application-modal').remove();"
                    style="position: absolute; top: -10px; right: -10px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 35px; height: 35px; font-size: 24px; cursor: pointer; color: #666; z-index: 10; display: flex; align-items: center; justify-content: center; line-height: 1;"
                    onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'"
                    onmouseout="this.style.backgroundColor='white'; this.style.color='#666'"
                    title="Close">
                <span style="margin-top: -2px;">&times;</span>
            </button>
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #0066cc;">Vanguard Insurance Group LLC</h2>
                <p style="margin: 5px 0;">Brunswick, OH 44256 • 330-460-0872</p>
                <h3 style="margin: 10px 0 0 0;">TRUCKING APPLICATION</h3>
            </div>
        </div>

        <form style="font-size: 14px;">
            <!-- GENERAL INFORMATION -->
            <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
                <h4 style="margin: 0 0 15px 0; color: #0066cc;">GENERAL INFORMATION</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Effective Date:</label>
                        <input type="date" value="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Insured's Name:</label>
                        <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">USDOT Number:</label>
                        <input type="text" value="${lead.dotNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">MC Number:</label>
                        <input type="text" value="${lead.mcNumber || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Contact Person:</label>
                        <input type="text" value="${lead.contact || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Phone:</label>
                        <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Email:</label>
                        <input type="email" value="${lead.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>
                </div>
            </div>

            <!-- DESCRIPTION OF OPERATION SECTION -->
            <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
                <h4 style="margin: 0 0 15px 0; color: #0066cc;">DESCRIPTION OF OPERATION</h4>

                <!-- Haul for Hire Section -->
                <div style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: bold;">Operation Type:</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Haul for Hire:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Non-Trucking:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Other:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                    </div>
                </div>

                <!-- Percentage of Loads by Distance -->
                <div style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: bold;">PERCENTAGE OF LOADS:</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">0-100 miles:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">101-300 miles:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">301-500 miles:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">500+ miles:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                    </div>
                </div>

                <!-- Class of Risk -->
                <div style="margin-bottom: 15px;">
                    <h5 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: bold;">CLASS OF RISK:</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Dry Van:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Dump Truck:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Flat Bed:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Van/Buses:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Auto Hauler:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Box Truck:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Reefer:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Other:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- COMMODITIES SECTION -->
            <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: #0066cc;">COMMODITIES</h4>
                    <button type="button" onclick="addCommodityRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
                        <i class="fas fa-plus"></i> Add Commodity
                    </button>
                </div>
                <div id="commodities-container">
                    <div class="commodity-row" style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Commodity:</label>
                            <select style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                                <option value="">Select Commodity</option>
                                <option value="General Freight">General Freight</option>
                                <option value="Machinery">Machinery</option>
                                <option value="Building Materials">Building Materials</option>
                                <option value="Food Products">Food Products</option>
                                <option value="Chemicals">Chemicals</option>
                                <option value="Automobiles">Automobiles</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Textiles">Textiles</option>
                                <option value="Paper Products">Paper Products</option>
                                <option value="Metal Products">Metal Products</option>
                                <option value="Coal/Minerals">Coal/Minerals</option>
                                <option value="Petroleum Products">Petroleum Products</option>
                                <option value="Lumber">Lumber</option>
                                <option value="Grain/Agricultural">Grain/Agricultural</option>
                                <option value="Waste Materials">Waste Materials</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">% of Loads:</label>
                            <input type="text" placeholder="%" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div style="display: flex; align-items: end;">
                            <button type="button" onclick="removeCommodityRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DRIVERS SECTION -->
            <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: #0066cc;">DRIVERS INFORMATION</h4>
                    <button type="button" onclick="addDriverRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
                        <i class="fas fa-plus"></i> Add Driver
                    </button>
                </div>
                <div id="drivers-container">
                    <div class="driver-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Name:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Date of Birth:</label>
                            <input type="date" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">License #:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">State:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Years Exp:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Hire Date:</label>
                            <input type="date" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Accidents/Violations:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div style="display: flex; align-items: end;">
                            <button type="button" onclick="removeDriverRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TRUCKS SECTION -->
            <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: #0066cc;">TRUCKS</h4>
                    <button type="button" onclick="addTruckRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
                        <i class="fas fa-plus"></i> Add Truck
                    </button>
                </div>
                <div id="trucks-container">
                    <div class="truck-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Year:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Make/Model:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Type:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">VIN:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Value:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Radius:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div style="display: flex; align-items: end;">
                            <button type="button" onclick="removeTruckRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TRAILERS SECTION -->
            <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: #0066cc;">TRAILERS</h4>
                    <button type="button" onclick="addTrailerRow()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
                        <i class="fas fa-plus"></i> Add Trailer
                    </button>
                </div>
                <div id="trailers-container">
                    <div class="trailer-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Year:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Make/Model:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Type:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">VIN:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Value:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Radius:</label>
                            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                        </div>
                        <div style="display: flex; align-items: end;">
                            <button type="button" onclick="removeTrailerRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COVERAGES SECTION -->
            <div style="background: #f0f4f8; padding: 15px; margin-bottom: 15px; border-left: 4px solid #0066cc; border-radius: 6px;">
                <h4 style="margin: 0 0 15px 0; color: #0066cc;">COVERAGE INFORMATION</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Auto Liability:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Limit</option>
                            <option value="$1,000,000">$1,000,000</option>
                            <option value="$2,000,000">$2,000,000</option>
                            <option value="$5,000,000">$5,000,000</option>
                            <option value="$10,000,000">$10,000,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Medical Payments:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Amount</option>
                            <option value="$5,000">$5,000</option>
                            <option value="$10,000">$10,000</option>
                            <option value="$15,000">$15,000</option>
                            <option value="$25,000">$25,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Uninsured/Underinsured Bodily Injury:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Coverage</option>
                            <option value="$1,000,000">$1,000,000</option>
                            <option value="$2,000,000">$2,000,000</option>
                            <option value="$5,000,000">$5,000,000</option>
                            <option value="Match Liability">Match Auto Liability</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Uninsured Motorist Property Damage:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Coverage</option>
                            <option value="$100,000">$100,000</option>
                            <option value="$250,000">$250,000</option>
                            <option value="$500,000">$500,000</option>
                            <option value="$1,000,000">$1,000,000</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Comprehensive Deductible:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Deductible</option>
                            <option value="$500">$500</option>
                            <option value="$1,000">$1,000</option>
                            <option value="$2,500">$2,500</option>
                            <option value="$5,000">$5,000</option>
                            <option value="$10,000">$10,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Collision Deductible:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Deductible</option>
                            <option value="$500">$500</option>
                            <option value="$1,000">$1,000</option>
                            <option value="$2,500">$2,500</option>
                            <option value="$5,000">$5,000</option>
                            <option value="$10,000">$10,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Non-Owned Trailer Phys Dam:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Coverage</option>
                            <option value="$50,000">$50,000</option>
                            <option value="$100,000">$100,000</option>
                            <option value="$250,000">$250,000</option>
                            <option value="$500,000">$500,000</option>
                            <option value="Not Needed">Not Needed</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Trailer Interchange:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Coverage</option>
                            <option value="$50,000">$50,000</option>
                            <option value="$100,000">$100,000</option>
                            <option value="$250,000">$250,000</option>
                            <option value="$500,000">$500,000</option>
                            <option value="Not Needed">Not Needed</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Roadside Assistance:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Coverage</option>
                            <option value="Yes">Yes - Include</option>
                            <option value="No">No - Decline</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">General Liability:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Limit</option>
                            <option value="$1,000,000">$1,000,000</option>
                            <option value="$2,000,000">$2,000,000</option>
                            <option value="$5,000,000">$5,000,000</option>
                            <option value="$10,000,000">$10,000,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Cargo Limit:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Limit</option>
                            <option value="$50,000">$50,000</option>
                            <option value="$100,000">$100,000</option>
                            <option value="$250,000">$250,000</option>
                            <option value="$500,000">$500,000</option>
                            <option value="$1,000,000">$1,000,000</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Deductible:</label>
                        <select style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">Select Deductible</option>
                            <option value="$1,000">$1,000</option>
                            <option value="$2,500">$2,500</option>
                            <option value="$5,000">$5,000</option>
                            <option value="$10,000">$10,000</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px; color: #374151;">Additional Coverage Notes:</label>
                    <textarea style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; resize: vertical;" placeholder="Enter any special coverage requirements, exclusions, or additional notes..."></textarea>
                </div>
            </div>

            <!-- SAVE BUTTON -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                <button type="button" onclick="saveQuoteApplication('${leadId}')" style="background: #0066cc; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600;">
                    <i class="fas fa-save"></i> Save Quote Application
                </button>
                <button type="button" onclick="document.getElementById('quote-application-modal').remove();" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; margin-left: 15px;">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </form>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    console.log('✅ Quote application modal created for lead:', lead.name);
};

protectedFunctions.loadQuoteApplications = function(leadId) {
    console.log('📋 Loading quote applications for lead:', leadId);
    console.log('🆕 PROFILE LOAD - UPDATED CARD FORMAT - NO EDIT BUTTON, NO DATES, NO STATUS');

    const applicationsContainer = document.getElementById(`application-submissions-container-${leadId}`);
    if (!applicationsContainer) {
        console.log('❌ Applications container not found');
        return;
    }

    // Show loading message
    applicationsContainer.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">⏳ Loading applications...</p>';

    // Get saved applications for this lead from server
    fetch(`/api/quote-applications?leadId=${encodeURIComponent(leadId)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const leadApplications = data.applications;

            if (leadApplications.length === 0) {
                applicationsContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No applications submitted yet</p>';
                return;
            }

            displayApplications(leadApplications, applicationsContainer);
        } else {
            applicationsContainer.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading applications</p>';
        }
    })
    .catch(error => {
        console.error('Error loading applications:', error);
        applicationsContainer.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading applications</p>';
    });

    function displayApplications(leadApplications, container) {
        // Display applications using clean format - same as showApplicationSubmissions
        let applicationsHTML = '';
        leadApplications.forEach((app, index) => {
        applicationsHTML += `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #374151; font-size: 14px;">
                            <i class="fas fa-file-signature" style="color: #10b981; margin-right: 8px;"></i>
                            Quote Application #${app.id}
                        </h4>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="viewQuoteApplication('${app.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button onclick="downloadQuoteApplication('${app.id}')" style="background: #10b981; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button onclick="deleteQuoteApplication('${app.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; font-size: 12px; color: #6b7280;">
                    <div>
                        <strong style="color: #374151;">Commodities:</strong> ${app.formData?.commodities?.length || app.commodities?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Drivers:</strong> ${app.formData?.drivers?.length || app.drivers?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Trucks:</strong> ${app.formData?.trucks?.length || app.trucks?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Trailers:</strong> ${app.formData?.trailers?.length || app.trailers?.length || 0}
                    </div>
                </div>
            </div>
        `;
    });

        container.innerHTML = applicationsHTML;
        console.log(`✅ Loaded ${leadApplications.length} quote applications for lead ${leadId}`);
    }
};

protectedFunctions.addQuoteSubmission = function(leadId) {
    console.log('Add quote submission for lead:', leadId);
    // Placeholder - can be expanded later
    alert('Quote submission functionality coming soon');
};

// PROTECTION: Assign functions to window and protect from overriding
Object.keys(protectedFunctions).forEach(funcName => {
    // Set initial value
    window[funcName] = protectedFunctions[funcName];

    // Protect from overriding using defineProperty
    try {
        Object.defineProperty(window, funcName, {
            value: protectedFunctions[funcName],
            writable: false,
            configurable: false
        });
        console.log(`✅ Protected: ${funcName}`);
    } catch (e) {
        // Fallback: use regular assignment and monitor
        window[funcName] = protectedFunctions[funcName];
        console.log(`⚠️ Fallback protection: ${funcName}`);
    }
});

// Monitor for override attempts
const monitorInterval = setInterval(() => {
    Object.keys(protectedFunctions).forEach(funcName => {
        if (window[funcName] !== protectedFunctions[funcName]) {
            console.log(`🚨 Override detected for ${funcName}, restoring...`);
            window[funcName] = protectedFunctions[funcName];
        }
    });
}, 1000);

// Stop monitoring after 30 seconds
setTimeout(() => {
    clearInterval(monitorInterval);
    console.log('🛡️ Protection monitoring complete');
}, 30000);

// Email Composer Supporting Functions
protectedFunctions.removeAttachment = function(filename) {
    console.log('🗑️ Removing attachment:', filename);
    const attachmentsList = document.getElementById('attachments-list');
    if (attachmentsList) {
        // Find and remove the attachment element
        const attachmentElements = attachmentsList.querySelectorAll('[onclick*="removeAttachment"]');
        attachmentElements.forEach(element => {
            if (element.getAttribute('onclick').includes(filename)) {
                element.parentElement.remove();
            }
        });

        // Update attachment count
        const remainingAttachments = attachmentsList.querySelectorAll('[onclick*="removeAttachment"]').length;
        const label = document.querySelector('label[for="attachments-list"]');
        if (label) {
            label.textContent = `Attachments (${remainingAttachments} files):`;
        }

        console.log('✅ Attachment removed from display');
    }
};

protectedFunctions.addMoreAttachments = function(leadId) {
    console.log('📎 Adding more attachments for lead:', leadId);

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt';
    fileInput.multiple = true;

    fileInput.onchange = function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            // Process and add files to the attachments list
            const attachmentsList = document.getElementById('attachments-list');
            if (attachmentsList) {
                Array.from(files).forEach(file => {
                    const fileDiv = document.createElement('div');
                    fileDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 5px; margin-bottom: 5px; background: white; border-radius: 4px; border: 1px solid #e5e7eb;';

                    const fileName = `temp_${Date.now()}_${file.name}`;
                    fileDiv.innerHTML = `
                        <div style="display: flex; align-items: center;">
                            <i class="fas fa-paperclip" style="color: #6b7280; margin-right: 8px;"></i>
                            <span style="font-size: 13px; font-weight: 500;">${file.name}</span>
                            <span style="font-size: 11px; color: #6b7280; margin-left: 8px;">(${(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button onclick="removeAttachment('${fileName}')" style="background: #ef4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-times"></i>
                        </button>
                    `;

                    // Remove "No files attached" message if it exists
                    const noFilesMsg = attachmentsList.querySelector('p');
                    if (noFilesMsg && noFilesMsg.textContent.includes('No files attached')) {
                        noFilesMsg.remove();
                    }

                    attachmentsList.appendChild(fileDiv);
                });

                console.log('✅ Added', files.length, 'new attachments');
            }
        }
    };

    // Trigger file selection
    fileInput.click();
};

protectedFunctions.sendEmail = async function(leadId) {
    console.log('📤 Sending email for lead:', leadId);

    // Get form values
    const toField = document.getElementById('email-to-field');
    const subjectField = document.getElementById('email-subject-field');
    const bodyField = document.getElementById('email-body-field');

    const to = toField ? toField.value : '';
    const subject = subjectField ? subjectField.value : '';
    const body = bodyField ? bodyField.value : '';

    if (!to) {
        alert('Please enter a recipient email address');
        return;
    }

    if (!subject) {
        alert('Please enter a subject line');
        return;
    }

    // Get attachment information
    const attachmentsList = document.getElementById('attachments-list');
    const attachmentElements = attachmentsList ? attachmentsList.querySelectorAll('[onclick*="removeAttachment"]') : [];
    const attachmentCount = attachmentElements.length;

    // Show confirmation
    const confirmMsg = `Send email via Vanguard Insurance?\n\nTo: ${to}\nSubject: ${subject}\nAttachments: ${attachmentCount} files\n\nProceed?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    // Get the send button and show loading state
    const sendBtn = document.querySelector('button[onclick*="sendEmail"]');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }

    try {
        // Get lead data for attachments
        const lossRuns = JSON.parse(localStorage.getItem('loss_runs') || '{}');
        const leadLossRuns = lossRuns[leadId] || [];

        // Prepare attachments from loss runs
        const attachments = [];

        for (const file of leadLossRuns) {
            if (file.data) {
                // Convert Base64 data to proper format for API
                const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;

                attachments.push({
                    filename: file.originalName || file.filename,
                    name: file.originalName || file.filename,
                    content: base64Data,
                    contentType: file.type || 'application/pdf',
                    encoding: 'base64'
                });
                console.log('📎 Added attachment:', file.originalName || file.filename);
            }
        }

        // Convert body to HTML format
        const htmlBody = body.replace(/\n/g, '<br>') + `
            <br><br>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                <strong>Vanguard Insurance Agency</strong><br>
                Email: contact@vigagency.com<br>
                Phone: (555) 123-4567
                ${attachments.length > 0 ? `<br><br><strong>Attachments:</strong> ${attachments.length} file(s)` : ''}
            </div>
        `;

        console.log('📧 Sending email via Titan API with', attachments.length, 'attachments');

        // Send email via Titan API (same as COI system)
        const response = await fetch('/api/outlook/send-smtp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                cc: '', // CC field not implemented yet
                bcc: 'contact@vigagency.com', // Always BCC ourselves
                subject: subject,
                body: htmlBody,
                attachments: attachments
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send email');
        }

        const result = await response.json();
        console.log('✅ Email sent successfully:', result.messageId);

        // Update reach out count
        protectedFunctions.updateReachOut(leadId, 'email', true);

        // Show success message
        alert(`Email sent successfully!\n\nTo: ${to}\nSubject: ${subject}\nAttachments: ${attachments.length} files\nMessage ID: ${result.messageId}`);

        // Close composer
        document.getElementById('email-composer-modal').remove();

        console.log('✅ Email sent via Titan API with attachments');

    } catch (error) {
        console.error('❌ Error sending email:', error);
        alert(`Failed to send email: ${error.message}`);

        // Restore send button
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Email';
        }
    }
};

// Storage management function
protectedFunctions.clearLossRunsStorage = function() {
    if (confirm('Clear all locally stored loss runs metadata? This will free up storage space but remove file tracking.')) {
        localStorage.removeItem('loss_runs');
        console.log('✅ Loss runs storage cleared');
        alert('Storage cleared. Refresh any open profiles to see updated loss runs sections.');
    }
};

console.log('🔥 PROTECTED-FINAL-PROFILE-FIX: All functions protected and available');
console.log('🔥 Available functions:', {
    'createEnhancedProfile': typeof window.createEnhancedProfile,
    'viewLead': typeof window.viewLead,
    'showLeadProfile': typeof window.showLeadProfile,
    'updateLeadField': typeof window.updateLeadField,
    'openEmailDocumentation': typeof window.openEmailDocumentation,
    'checkFilesAndOpenEmail': typeof window.checkFilesAndOpenEmail,
    'openLossRunsUpload': typeof window.openLossRunsUpload,
    'updateReachOut': typeof window.updateReachOut,
    'updateLeadStage': typeof window.updateLeadStage,
    'showNotification': typeof window.showNotification,
    'clearLossRunsStorage': typeof window.clearLossRunsStorage,
    'createEmailComposer': typeof window.createEmailComposer,
    'removeAttachment': typeof window.removeAttachment,
    'addMoreAttachments': typeof window.addMoreAttachments,
    'sendEmail': typeof window.sendEmail
});

// Function to refresh the leads table when modal closes
function refreshLeadsTable() {
    console.log('🔄 Refreshing leads table after profile changes...');

    // Try multiple methods to refresh the leads display
    if (window.displayLeads && typeof window.displayLeads === 'function') {
        window.displayLeads();
        console.log('✅ Refreshed using displayLeads()');
    } else if (window.loadLeadsView && typeof window.loadLeadsView === 'function') {
        window.loadLeadsView();
        console.log('✅ Refreshed using loadLeadsView()');
    } else if (document.querySelector('.data-table tbody')) {
        // Force reload leads from localStorage and server
        loadLeadsFromServerAndRefresh();
        console.log('✅ Forced reload from server');
    } else {
        console.log('❌ No refresh method available');
    }
}

// Function to load leads from server and refresh display
async function loadLeadsFromServerAndRefresh() {
    try {
        // Load fresh data from server
        const response = await fetch('/api/leads');
        if (response.ok) {
            const serverLeads = await response.json();

            // Update localStorage with fresh server data
            localStorage.setItem('insurance_leads', JSON.stringify(serverLeads));

            // Trigger display refresh
            if (window.displayLeads) {
                window.displayLeads();
            } else if (window.loadLeadsView) {
                window.loadLeadsView();
            }

            console.log('✅ Leads refreshed from server');
        }
    } catch (error) {
        console.error('❌ Error refreshing leads from server:', error);
    }
}

// Function to update stage timestamp display in real-time
function updateStageTimestampDisplay(leadId, stageUpdatedAt) {
    const timestampElement = document.getElementById(`stage-timestamp-${leadId}`);
    if (timestampElement) {
        const now = new Date();
        const updated = new Date(stageUpdatedAt);
        const daysDiff = Math.floor((now - updated) / (1000 * 60 * 60 * 24));

        // Calculate color based on stage age - URGENT TIMELINE
        let ageColor;
        if (daysDiff >= 3) ageColor = 'red';    // 3+ days = RED (urgent)
        else if (daysDiff >= 2) ageColor = 'orange';  // 2 days = ORANGE
        else if (daysDiff >= 1) ageColor = 'yellow';  // 1 day = YELLOW
        else ageColor = 'green';  // Today = GREEN

        // Map color names to background colors for pills
        const colorMap = {
            'green': '#10b981',
            'yellow': '#eab308',
            'orange': '#f59e0b',
            'red': '#dc2626'
        };

        const backgroundColor = colorMap[ageColor] || '#10b981';

        // Show actual date/time instead of relative time
        const timeText = updated.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: updated.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Update the pill appearance
        timestampElement.style.backgroundColor = backgroundColor;
        timestampElement.textContent = timeText;

        console.log('✅ Stage timestamp display updated:', timeText);
    }
}

// Helper function to sync lead data to server
function syncLeadToServer(leadId, leadData) {
    fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Lead data synced to server');
        } else {
            console.error('❌ Server sync failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Server sync error:', error);
    });
}

// Make functions globally available for onclick handlers
window.updateLeadField = protectedFunctions.updateLeadField;
window.updateLeadStage = protectedFunctions.updateLeadStage;
window.removeAttachment = protectedFunctions.removeAttachment;
window.addMoreAttachments = protectedFunctions.addMoreAttachments;
window.sendEmail = protectedFunctions.sendEmail;

// Vehicle, Trailer, Driver management functions
window.addVehicleToLead = protectedFunctions.addVehicleToLead;
window.addTrailerToLead = protectedFunctions.addTrailerToLead;
window.addDriverToLead = protectedFunctions.addDriverToLead;

// Define the individual card management functions directly
window.addVehicle = function(leadId) {
    console.log('addVehicle called for lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        if (!lead.vehicles) lead.vehicles = [];
        const newVehicle = {
            year: '',
            make: '',
            model: '',
            vin: '',
            value: '',
            deductible: '',
            type: '',
            gvwr: ''
        };
        lead.vehicles.push(newVehicle);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Sync to server
        syncLeadToServer(leadId, { vehicles: lead.vehicles });

        // Refresh the lead profile to show new card
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Vehicle added successfully');
    }
};

window.addTrailer = function(leadId) {
    console.log('addTrailer called for lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        if (!lead.trailers) lead.trailers = [];
        const newTrailer = {
            year: '',
            make: '',
            type: '',
            vin: '',
            length: '',
            value: '',
            deductible: ''
        };
        lead.trailers.push(newTrailer);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Sync to server
        syncLeadToServer(leadId, { trailers: lead.trailers });

        // Refresh the lead profile to show new card
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Trailer added successfully');
    }
};

window.addDriver = function(leadId) {
    console.log('addDriver called for lead:', leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead) {
        if (!lead.drivers) lead.drivers = [];
        lead.drivers.push({
            name: '',
            license: '',
            dob: '',
            hireDate: '',
            experience: '',
            violations: ''
        });
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        // Refresh the lead profile to show new card
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Driver added successfully');
    }
};

// Update functions for the cards
window.updateVehicle = function(leadId, vehicleIndex, field, value) {
    console.log('updateVehicle:', leadId, vehicleIndex, field, value);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.vehicles && lead.vehicles[vehicleIndex]) {
        lead.vehicles[vehicleIndex][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('✅ Vehicle updated');
    }
};

window.updateTrailer = function(leadId, trailerIndex, field, value) {
    console.log('updateTrailer:', leadId, trailerIndex, field, value);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.trailers && lead.trailers[trailerIndex]) {
        lead.trailers[trailerIndex][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('✅ Trailer updated');
    }
};

window.updateDriver = function(leadId, driverIndex, field, value) {
    console.log('updateDriver:', leadId, driverIndex, field, value);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.drivers && lead.drivers[driverIndex]) {
        lead.drivers[driverIndex][field] = value;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('✅ Driver updated');
    }
};

// Remove functions for the cards
window.removeVehicle = function(leadId, vehicleIndex) {
    console.log('removeVehicle:', leadId, vehicleIndex);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.vehicles && lead.vehicles[vehicleIndex] !== undefined) {
        lead.vehicles.splice(vehicleIndex, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        // Refresh the lead profile
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Vehicle removed');
    }
};

window.removeTrailer = function(leadId, trailerIndex) {
    console.log('removeTrailer:', leadId, trailerIndex);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.trailers && lead.trailers[trailerIndex] !== undefined) {
        lead.trailers.splice(trailerIndex, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        // Refresh the lead profile
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Trailer removed');
    }
};

window.removeDriver = function(leadId, driverIndex) {
    console.log('removeDriver:', leadId, driverIndex);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (lead && lead.drivers && lead.drivers[driverIndex] !== undefined) {
        lead.drivers.splice(driverIndex, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        // Refresh the lead profile
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
        console.log('✅ Driver removed');
    }
};

// Quote Application Display Function
window.showApplicationSubmissions = function(leadId) {
    console.log('📋 showApplicationSubmissions called for lead:', leadId);
    console.log('🆕 UPDATED CARD FORMAT - VERSION 1003 - NO EDIT BUTTON, NO DATES, NO STATUS');

    const containerId = `application-submissions-container-${leadId}`;
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('❌ Application submissions container not found:', containerId);
        return;
    }

    // Get saved applications for this lead
    // Show loading message
    container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">⏳ Loading applications...</p>';

    // Get saved applications for this lead from server
    fetch(`/api/quote-applications?leadId=${encodeURIComponent(leadId)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const leadApplications = data.applications;
            console.log('📋 Found', leadApplications.length, 'applications for lead', leadId);

            if (leadApplications.length === 0) {
                container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No applications submitted yet</p>';
                return;
            }

            displayDetailedApplications(leadApplications, container);
        } else {
            container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading applications</p>';
        }
    })
    .catch(error => {
        console.error('Error loading applications:', error);
        container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading applications</p>';
    });

    function displayDetailedApplications(leadApplications, container) {
        // Display applications using detailed format
    let applicationsHTML = '';
    leadApplications.forEach((app, index) => {
        applicationsHTML += `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #374151; font-size: 14px;">
                            <i class="fas fa-file-signature" style="color: #10b981; margin-right: 8px;"></i>
                            Quote Application #${app.id}
                        </h4>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="viewQuoteApplication('${app.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button onclick="downloadQuoteApplication('${app.id}')" style="background: #10b981; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button onclick="deleteQuoteApplication('${app.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; font-size: 12px; color: #6b7280;">
                    <div>
                        <strong style="color: #374151;">Commodities:</strong> ${app.formData?.commodities?.length || app.commodities?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Drivers:</strong> ${app.formData?.drivers?.length || app.drivers?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Trucks:</strong> ${app.formData?.trucks?.length || app.trucks?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Trailers:</strong> ${app.formData?.trailers?.length || app.trailers?.length || 0}
                    </div>
                </div>
            </div>
        `;
    });

        container.innerHTML = applicationsHTML;
        console.log('✅ Applications display updated successfully');
    }
};

// Quote Application Management Functions
window.viewQuoteApplication = function(appId) {
    console.log('📄 Viewing quote application:', appId);

    // Get the application data from server
    fetch(`/api/quote-applications/${appId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const application = data.application;
                console.log('📄 Found application data:', application);

                // Set up editing mode and global data for the form to access
                window.editingApplicationId = appId;
                window.editingApplicationData = application;

                // Open the original quote application form
                if (typeof window.createQuoteApplicationSimple === 'function') {
                    window.createQuoteApplicationSimple(application.leadId);
                } else {
                    console.error('createQuoteApplicationSimple function not available');
                    alert('Unable to open application form');
                }
            } else {
                alert('Application not found');
            }
        })
        .catch(error => {
            console.error('❌ View error:', error);
            alert('Error loading application. Please try again.');
        });
};

window.downloadQuoteApplication = function(appId) {
    console.log('📥 Downloading quote application:', appId);

    // Get the application data from server
    fetch(`/api/quote-applications/${appId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const application = data.application;
                console.log('📥 Found application data for download:', application);

                // Set up editing mode and global data for the form to access
                window.editingApplicationId = appId;
                window.editingApplicationData = application;

                // Open the application first
                if (typeof window.createQuoteApplicationSimple === 'function') {
                    window.createQuoteApplicationSimple(application.leadId);

                    // Wait a moment for the modal to open, then trigger direct download
                    setTimeout(() => {
                        console.log('📥 Triggering direct download after modal opened...');

                        // Call the application download directly, bypassing any ACORD conflicts
                        const modal = document.getElementById('quote-application-modal');
                        if (modal && typeof window.downloadQuoteApplicationPDF === 'function') {
                            // Temporarily disable any ACORD functions that might interfere
                            const originalDownloadACORD = window.downloadACORD;
                            window.downloadACORD = function() {
                                console.log('🚫 ACORD download blocked during application download');
                                return false;
                            };

                            // Call the application download
                            window.downloadQuoteApplicationPDF();

                            // Restore ACORD function after a delay
                            setTimeout(() => {
                                window.downloadACORD = originalDownloadACORD;
                            }, 3000);
                        } else {
                            console.error('Quote application modal not found or download function not available');
                            alert('Download function not available. Please try viewing the application first.');
                        }
                    }, 500);
                } else {
                    console.error('createQuoteApplicationSimple function not available');
                    alert('Unable to open application for download');
                }
            } else {
                alert('Application not found');
            }
        })
        .catch(error => {
            console.error('❌ Download error:', error);
            alert('Error loading application for download. Please try again.');
        });
};

window.editQuoteApplication = function(appId) {
    console.log('✏️ Editing quote application:', appId);
    alert('Edit application functionality coming soon');
};

window.deleteQuoteApplication = function(appId) {
    console.log('🗑️ DELETE FUNCTION CALLED:', appId);
    if (confirm('Are you sure you want to delete this quote application?')) {
        console.log('🗑️ User confirmed delete, proceeding...');

        // Delete from server
        fetch(`/api/quote-applications/${appId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Quote application deleted from server');
                // Refresh the applications display
                const leadProfileModal = document.getElementById('lead-profile-container');
                const currentLead = window.currentViewingLead || (leadProfileModal && leadProfileModal.dataset.leadId);
                if (currentLead) {
                    protectedFunctions.loadQuoteApplications(currentLead);
                }
            } else {
                alert('Error deleting application: ' + data.error);
            }
        })
        .catch(error => {
            console.error('❌ Delete error:', error);
            alert('Error deleting application. Please try again.');
        });
    } else {
        console.log('🗑️ Delete cancelled by user');
    }
};

// Quote Application Supporting Functions
window.addDriverRow = function() {
    console.log('🚛 addDriverRow called');
    const container = document.getElementById('drivers-container');
    if (!container) {
        console.log('❌ drivers-container not found');
        return;
    }
    console.log('✅ Found drivers-container, adding row...');

    const newRow = document.createElement('div');
    newRow.className = 'driver-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Name:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Date of Birth:</label>
            <input type="date" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">License #:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">State:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Years Exp:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Hire Date:</label>
            <input type="date" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Accidents/Violations:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div style="display: flex; align-items: end;">
            <button type="button" onclick="removeDriverRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(newRow);
    console.log('✅ Added new driver row');
};

window.removeDriverRow = function(button) {
    const row = button.closest('.driver-row');
    if (row) {
        row.remove();
        console.log('✅ Removed driver row');
    }
};

window.addTruckRow = function() {
    const container = document.getElementById('trucks-container');
    if (!container) return;

    const newRow = document.createElement('div');
    newRow.className = 'truck-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Year:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Make/Model:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Type:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">VIN:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Value:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Radius:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div style="display: flex; align-items: end;">
            <button type="button" onclick="removeTruckRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(newRow);
    console.log('✅ Added new truck row');
};

window.removeTruckRow = function(button) {
    const row = button.closest('.truck-row');
    if (row) {
        row.remove();
        console.log('✅ Removed truck row');
    }
};

window.addTrailerRow = function() {
    const container = document.getElementById('trailers-container');
    if (!container) return;

    const newRow = document.createElement('div');
    newRow.className = 'trailer-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Year:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Make/Model:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Type:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">VIN:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Value:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Radius:</label>
            <input type="text" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div style="display: flex; align-items: end;">
            <button type="button" onclick="removeTrailerRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(newRow);
    console.log('✅ Added new trailer row');
};

window.removeTrailerRow = function(button) {
    const row = button.closest('.trailer-row');
    if (row) {
        row.remove();
        console.log('✅ Removed trailer row');
    }
};

// Commodity Management Functions
window.addCommodityRow = function() {
    const container = document.getElementById('commodities-container');
    if (!container) return;

    // Check if we already have 4 commodities
    const existingRows = container.querySelectorAll('.commodity-row');
    if (existingRows.length >= 4) {
        alert('Maximum of 4 commodities allowed');
        return;
    }

    const newRow = document.createElement('div');
    newRow.className = 'commodity-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;';

    newRow.innerHTML = `
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">Commodity:</label>
            <select style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <option value="">Select Commodity</option>
                <option value="General Freight">General Freight</option>
                <option value="Machinery">Machinery</option>
                <option value="Building Materials">Building Materials</option>
                <option value="Food Products">Food Products</option>
                <option value="Chemicals">Chemicals</option>
                <option value="Automobiles">Automobiles</option>
                <option value="Electronics">Electronics</option>
                <option value="Textiles">Textiles</option>
                <option value="Paper Products">Paper Products</option>
                <option value="Metal Products">Metal Products</option>
                <option value="Coal/Minerals">Coal/Minerals</option>
                <option value="Petroleum Products">Petroleum Products</option>
                <option value="Lumber">Lumber</option>
                <option value="Grain/Agricultural">Grain/Agricultural</option>
                <option value="Waste Materials">Waste Materials</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #374151;">% of Loads:</label>
            <input type="text" placeholder="%" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
        </div>
        <div style="display: flex; align-items: end;">
            <button type="button" onclick="removeCommodityRow(this)" style="background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(newRow);
    console.log('✅ Added new commodity row');
};

window.removeCommodityRow = function(button) {
    const row = button.closest('.commodity-row');
    if (row) {
        row.remove();
        console.log('✅ Removed commodity row');
    }
};

window.saveQuoteApplication = function(leadId) {
    console.log('🚀 SAVE FUNCTION CALLED - VERSION 24 - NO ALERT!', leadId);

    const modal = document.getElementById('quote-application-modal');
    if (!modal) {
        alert('Quote application modal not found');
        return;
    }

    // Collect form data
    const formData = {};

    // Get all input fields
    const inputs = modal.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
        if (input.value) {
            const label = input.closest('div').querySelector('label');
            const fieldName = label ? label.textContent.replace(':', '') : `Field_${index}`;
            formData[fieldName] = input.value;
        }
    });

    // Collect commodities data
    const commodities = [];
    modal.querySelectorAll('#commodities-container .commodity-row').forEach((row, index) => {
        const select = row.querySelector('select');
        const input = row.querySelector('input');
        const commodity = {
            type: select?.value || '',
            percentage: input?.value || ''
        };
        if (commodity.type || commodity.percentage) {
            commodities.push(commodity);
        }
    });

    // Collect drivers data
    const drivers = [];
    modal.querySelectorAll('#drivers-container .driver-row').forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const driver = {
            name: inputs[0]?.value || '',
            dob: inputs[1]?.value || '',
            license: inputs[2]?.value || '',
            state: inputs[3]?.value || '',
            experience: inputs[4]?.value || '',
            hireDate: inputs[5]?.value || '',
            accidents: inputs[6]?.value || ''
        };
        if (driver.name || driver.license) {
            drivers.push(driver);
        }
    });

    // Collect trucks data
    const trucks = [];
    modal.querySelectorAll('#trucks-container .truck-row').forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const truck = {
            year: inputs[0]?.value || '',
            make: inputs[1]?.value || '',
            type: inputs[2]?.value || '',
            vin: inputs[3]?.value || '',
            value: inputs[4]?.value || '',
            radius: inputs[5]?.value || ''
        };
        if (truck.year || truck.make || truck.vin) {
            trucks.push(truck);
        }
    });

    // Collect trailers data
    const trailers = [];
    modal.querySelectorAll('#trailers-container .trailer-row').forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const trailer = {
            year: inputs[0]?.value || '',
            make: inputs[1]?.value || '',
            type: inputs[2]?.value || '',
            vin: inputs[3]?.value || '',
            value: inputs[4]?.value || '',
            radius: inputs[5]?.value || ''
        };
        if (trailer.year || trailer.make || trailer.vin) {
            trailers.push(trailer);
        }
    });

    // Prepare application data
    const applicationData = {
        id: Date.now(),
        leadId: leadId,
        createdDate: new Date().toISOString(),
        formData: formData,
        commodities: commodities,
        drivers: drivers,
        trucks: trucks,
        trailers: trailers,
        status: 'draft'
    };

    // Save to server
    fetch('/api/quote-applications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            leadId: leadId,
            applicationData: applicationData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Quote application saved to server:', data.applicationId);
            // Close quote application modal
            modal.remove();
            // Refresh the applications display
            protectedFunctions.loadQuoteApplications(leadId);
        } else {
            console.error('❌ Save failed:', data.error);
            alert('Error saving quote application: ' + data.error);
        }
    })
    .catch(error => {
        console.error('❌ Save error:', error);
        alert('Error saving quote application. Please try again.');
    });

    // Return early - async operation will handle modal closing
    return;

    // Close quote application modal
    modal.remove();

    // Refresh the lead profile to show the new application
    console.log('🔄 Refreshing lead profile to show saved application...');
    const leadProfileModal = document.getElementById('lead-profile-container');
    if (leadProfileModal) {
        console.log('✅ Found lead profile modal, refreshing...');
        // Close and reopen the lead profile to refresh the Application Submissions section
        const leadData = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const currentLead = leadData.find(l => String(l.id) === String(leadId));

        if (currentLead) {
            console.log('✅ Found current lead, closing and reopening profile...');
            // Close current profile modal
            leadProfileModal.remove();

            // Reopen with updated data
            setTimeout(() => {
                console.log('🔄 Reopening lead profile...');
                protectedFunctions.showLeadProfile(leadId);
            }, 100);
        } else {
            console.log('❌ Current lead not found');
        }
    } else {
        console.log('❌ Lead profile modal not found for refresh');
    }
};

// Check storage usage
try {
    const storageUsed = JSON.stringify(localStorage).length;
    const maxStorage = 10 * 1024 * 1024; // 10MB typical limit
    const percentUsed = Math.round((storageUsed / maxStorage) * 100);

    if (percentUsed > 80) {
        console.warn(`⚠️ Storage ${percentUsed}% full. Consider running window.clearLossRunsStorage() if experiencing issues.`);
    } else {
        console.log(`💾 Storage usage: ~${percentUsed}% (${(storageUsed/1024).toFixed(0)}KB)`);
    }
} catch (e) {
    console.log('💾 Storage usage check failed:', e.message);
}

// Ensure our protected functions override any others - ULTRA AGGRESSIVE OVERRIDE
window.viewLead = protectedFunctions.viewLead;
window.createEnhancedProfile = protectedFunctions.createEnhancedProfile;
window.showLeadProfile = protectedFunctions.showLeadProfile;

console.log('🔥 PROTECTED FUNCTIONS NOW ACTIVE - Enhanced profile with Reach Out section should load');
console.log('🚨 FINAL-PROFILE-FIX-PROTECTED SCRIPT LOADED - VERSION 1000');
console.log('🔍 Current functions on window:', {
    viewLead: typeof window.viewLead,
    showLeadProfile: typeof window.showLeadProfile,
    createEnhancedProfile: typeof window.createEnhancedProfile
});

// ULTIMATE PROTECTION: Use Object.defineProperty to make functions non-configurable and non-writable
function lockFunctions() {
    try {
        Object.defineProperty(window, 'viewLead', {
            value: protectedFunctions.viewLead,
            writable: false,
            configurable: false
        });
        Object.defineProperty(window, 'createEnhancedProfile', {
            value: protectedFunctions.createEnhancedProfile,
            writable: false,
            configurable: false
        });
        Object.defineProperty(window, 'showLeadProfile', {
            value: protectedFunctions.showLeadProfile,
            writable: false,
            configurable: false
        });
        console.log('🔒 FUNCTIONS LOCKED: Protected functions are now non-configurable and non-writable');
    } catch (error) {
        console.warn('⚠️ Could not lock functions, falling back to aggressive override:', error.message);
        // Fallback to aggressive override
        window.viewLead = protectedFunctions.viewLead;
        window.createEnhancedProfile = protectedFunctions.createEnhancedProfile;
        window.showLeadProfile = protectedFunctions.showLeadProfile;
    }
}

// Lock functions immediately
lockFunctions();

// Set up aggressive protection against function override
setTimeout(() => {
    console.log('🛡️ AGGRESSIVE OVERRIDE: Ensuring protected functions stay active');
    lockFunctions();
}, 100);

// Also protect against any late-loading scripts
setTimeout(() => {
    console.log('🛡️ FINAL OVERRIDE: Last chance protection of functions');
    lockFunctions();
}, 1000);

// Set up periodic monitoring to detect and prevent function override
setInterval(() => {
    // Check if functions are still ours
    if (window.showLeadProfile !== protectedFunctions.showLeadProfile ||
        window.viewLead !== protectedFunctions.viewLead ||
        window.createEnhancedProfile !== protectedFunctions.createEnhancedProfile) {

        console.warn('🚨 FUNCTION OVERRIDE DETECTED! Re-establishing protection...');
        lockFunctions();
    }
}, 2000);