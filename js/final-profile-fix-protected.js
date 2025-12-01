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
        <div style="background: white; border-radius: 12px; max-width: 1200px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 60px; position: relative; transform: none; top: auto; left: auto;">
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
                            <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                            <option value="contact_attempted" ${lead.stage === 'contact_attempted' ? 'selected' : ''}>Contact Attempted</option>
                            <option value="info_requested" ${lead.stage === 'info_requested' ? 'selected' : ''}>Info Requested</option>
                            <option value="info_received" ${lead.stage === 'info_received' ? 'selected' : ''}>Info Received</option>
                            <option value="loss_runs_requested" ${lead.stage === 'loss_runs_requested' ? 'selected' : ''}>Loss Runs Requested</option>
                            <option value="loss_runs_received" ${lead.stage === 'loss_runs_received' ? 'selected' : ''}>Loss Runs Received</option>
                            <option value="app_prepared" ${lead.stage === 'app_prepared' ? 'selected' : ''}>App Prepared</option>
                            <option value="app_sent" ${lead.stage === 'app_sent' ? 'selected' : ''}>App Sent</option>
                            <option value="app_quote_received" ${lead.stage === 'app_quote_received' ? 'selected' : ''}>App Quote Received</option>
                            <option value="app_quote_sent" ${lead.stage === 'app_quote_sent' ? 'selected' : ''}>App Quote Sent</option>
                            <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                            <option value="quote_sent" ${lead.stage === 'quote_sent' ? 'selected' : ''}>Quote Sent</option>
                            <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                            <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                            <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                </div>

                <!-- Reach Out Checklist -->
                <div class="profile-section" style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;"><i class="fas fa-tasks"></i> Reach Out</h3>
                        <div id="reach-out-status-${lead.id}" style="font-weight: bold; font-size: 16px;">
                            <!-- Reach-out status will be dynamically updated here -->
                        </div>
                    </div>
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
                                <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
                                    <strong>Vehicle ${index + 1}:</strong> ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}<br>
                                    <small>VIN: ${vehicle.vin || 'Not provided'}</small>
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
                                <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
                                    <strong>Trailer ${index + 1}:</strong> ${trailer.year || ''} ${trailer.make || ''} ${trailer.model || ''}<br>
                                    <small>VIN: ${trailer.vin || 'Not provided'}</small>
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
                                <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
                                    <strong>Driver ${index + 1}:</strong> ${driver.name || 'Unknown'}<br>
                                    <small>License: ${driver.license || 'Not provided'} | Experience: ${driver.experience || 'Not provided'}</small>
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
        console.log('Field updated and saved:', field, value);

        // Update the table if visible
        if (window.displayLeads) {
            window.displayLeads();
        }
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
    console.log('📤 Uploading loss runs files:', files.length, 'files for lead:', leadId);

    // Show uploading message
    const container = document.getElementById(`loss-runs-container-${leadId}`);
    if (container) {
        container.innerHTML = '<p style="color: #3b82f6; text-align: center; padding: 20px;">Processing files...</p>';
    }

    // Store files with Base64 data (same as working version)
    const lossRuns = JSON.parse(localStorage.getItem('loss_runs') || '{}');
    if (!lossRuns[leadId]) {
        lossRuns[leadId] = [];
    }

    let processedFiles = 0;

    // Process each file with Base64 encoding
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = {
                filename: `${leadId}_${Date.now()}_${index}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
                originalName: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                uploadedDate: new Date().toISOString(),
                type: file.type || 'application/octet-stream',
                data: e.target.result, // Base64 data (same as working version)
                isLocalOnly: true
            };

            lossRuns[leadId].push(fileData);
            processedFiles++;

            // Try to save after each file
            try {
                localStorage.setItem('loss_runs', JSON.stringify(lossRuns));

                // If this is the last file, reload display
                if (processedFiles === files.length) {
                    setTimeout(() => {
                        protectedFunctions.loadLossRuns(leadId);
                        console.log('✅ Files stored locally with viewing capability (same as working version)');
                    }, 300);
                }
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    // Remove this file and show error
                    lossRuns[leadId].pop();
                    alert(`Storage quota exceeded. Could not store "${file.name}". Try uploading smaller files or clearing storage with window.clearLossRunsStorage()`);

                    // Still reload to show files that were successfully stored
                    if (processedFiles === files.length) {
                        setTimeout(() => protectedFunctions.loadLossRuns(leadId), 300);
                    }
                } else {
                    console.error('Error storing file:', error);
                    alert('Error storing file: ' + file.name);
                }
            }
        };

        reader.onerror = function() {
            console.error('Error reading file:', file.name);
            alert('Error reading file: ' + file.name);
        };

        reader.readAsDataURL(file);
    });
};

// Load loss runs from localStorage (temporary until server endpoint is ready)
protectedFunctions.loadLossRuns = function(leadId) {
    console.log('🔄 Loading loss runs for lead:', leadId);

    const container = document.getElementById(`loss-runs-container-${leadId}`);
    if (!container) return;

    // Load from localStorage temporarily
    const lossRuns = JSON.parse(localStorage.getItem('loss_runs') || '{}');
    const leadLossRuns = lossRuns[leadId] || [];

    if (leadLossRuns.length > 0) {
        // Display existing loss runs
        container.innerHTML = leadLossRuns.map(lossRun => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px;">
                <div>
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                        <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 8px;"></i>
                        <strong style="font-size: 14px;">${lossRun.originalName || lossRun.filename}</strong>
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">
                        Uploaded: ${new Date(lossRun.uploadedDate).toLocaleDateString()} • Size: ${lossRun.size || 'Unknown'}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="view-loss-runs-btn"
                            data-lead-id="${leadId}"
                            data-filename="${lossRun.filename}"
                            data-original-name="${lossRun.originalName || lossRun.filename}"
                            onclick="viewLossRuns('${leadId}', '${lossRun.filename}', '${lossRun.originalName || lossRun.filename}')"
                            style="background: #0066cc; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="remove-loss-runs-btn"
                            data-lead-id="${leadId}"
                            data-filename="${lossRun.filename}"
                            onclick="removeLossRuns('${leadId}', '${lossRun.filename}')"
                            style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No loss runs uploaded yet</p>';
    }
};

// View loss runs function (restored working functionality)
protectedFunctions.viewLossRuns = function(leadId, filename, originalName) {
    console.log('👁️ Viewing loss runs:', leadId, filename, originalName);

    // Get file from localStorage
    const lossRuns = JSON.parse(localStorage.getItem('loss_runs') || '{}');
    const leadLossRuns = lossRuns[leadId] || [];
    const file = leadLossRuns.find(lr => lr.filename === filename);

    if (file && file.data) {
        try {
            // Create blob from Base64 data
            const byteCharacters = atob(file.data.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Determine MIME type
            const mimeType = file.type || 'application/octet-stream';
            const blob = new Blob([byteArray], { type: mimeType });

            // Create URL and open in new window
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');

            // Clean up the URL after a delay
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 60000); // Clean up after 1 minute

            console.log('✅ File opened in new window:', originalName);
        } catch (error) {
            console.error('Error opening file:', error);
            alert('Error opening file: ' + originalName);
        }
    } else {
        alert('File data not found. The file may not have been stored properly.');
    }
};

// Remove loss runs function
protectedFunctions.removeLossRuns = function(leadId, filename) {
    if (!confirm('Are you sure you want to remove this loss run document?')) {
        return;
    }

    console.log('🗑️ Removing loss runs:', leadId, filename);

    // Remove from localStorage
    const lossRuns = JSON.parse(localStorage.getItem('loss_runs') || '{}');
    if (lossRuns[leadId]) {
        lossRuns[leadId] = lossRuns[leadId].filter(lr => lr.filename !== filename);
        localStorage.setItem('loss_runs', JSON.stringify(lossRuns));
        console.log('✅ Loss run removed successfully');
        // Reload the loss runs list
        protectedFunctions.loadLossRuns(leadId);
    }
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
    } else if (type === 'text') {
        if (checked) {
            leads[leadIndex].reachOut.textCount++;
        } else {
            leads[leadIndex].reachOut.textCount = Math.max(0, leads[leadIndex].reachOut.textCount - 1);
        }
        const textCountDisplay = document.getElementById(`text-count-${leadId}`);
        if (textCountDisplay) {
            textCountDisplay.textContent = leads[leadIndex].reachOut.textCount;
        }
    } else if (type === 'call') {
        if (checked) {
            leads[leadIndex].reachOut.callAttempts++;
        } else {
            leads[leadIndex].reachOut.callAttempts = Math.max(0, leads[leadIndex].reachOut.callAttempts - 1);
        }
        const callCountDisplay = document.getElementById(`call-count-${leadId}`);
        if (callCountDisplay) {
            callCountDisplay.textContent = leads[leadIndex].reachOut.callAttempts;
        }
    }

    localStorage.setItem('insurance_leads', JSON.stringify(leads));
};

// Update stage function
protectedFunctions.updateLeadStage = function(leadId, stage) {
    console.log('Updating lead stage:', leadId, stage);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        leads[leadIndex].stage = stage;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Update the table if visible
        if (window.displayLeads) {
            window.displayLeads();
        }
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

// Vehicle, Trailer, Driver management functions
protectedFunctions.addVehicleToLead = function(leadId) {
    console.log('Add vehicle for lead:', leadId);
    // Placeholder - can be expanded later
    alert('Vehicle management coming soon');
};

protectedFunctions.addTrailerToLead = function(leadId) {
    console.log('Add trailer for lead:', leadId);
    // Placeholder - can be expanded later
    alert('Trailer management coming soon');
};

protectedFunctions.addDriverToLead = function(leadId) {
    console.log('Add driver for lead:', leadId);
    // Placeholder - can be expanded later
    alert('Driver management coming soon');
};

// Quote and Application management functions
protectedFunctions.createQuoteApplication = function(leadId) {
    console.log('Create quote application for lead:', leadId);

    // Get the lead data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        console.error('Lead not found with ID:', leadId);
        alert('Lead not found. Please refresh and try again.');
        return;
    }

    // Remove any existing quote modal first
    const existingModal = document.getElementById('quote-application-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create quote application modal
    const modal = document.createElement('div');
    modal.id = 'quote-application-modal';
    modal.dataset.leadId = leadId;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 3000000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

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

    const applicationsContainer = document.getElementById(`application-submissions-container-${leadId}`);
    if (!applicationsContainer) {
        console.log('❌ Applications container not found');
        return;
    }

    // Get saved applications for this lead
    const allApplications = JSON.parse(localStorage.getItem('quote_applications') || '[]');
    const leadApplications = allApplications.filter(app => String(app.leadId) === String(leadId));

    if (leadApplications.length === 0) {
        applicationsContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No applications submitted yet</p>';
        return;
    }

    // Display applications
    let applicationsHTML = '';
    leadApplications.forEach((app, index) => {
        const createdDate = new Date(app.createdDate).toLocaleDateString();
        const createdTime = new Date(app.createdDate).toLocaleTimeString();

        applicationsHTML += `
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #374151; font-size: 14px;">
                            <i class="fas fa-file-signature" style="color: #10b981; margin-right: 8px;"></i>
                            Quote Application #${app.id}
                        </h4>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                            <i class="fas fa-clock" style="margin-right: 5px;"></i>
                            ${createdDate} at ${createdTime}
                        </p>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="viewQuoteApplication('${app.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button onclick="editQuoteApplication('${app.id}')" style="background: #f59e0b; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteQuoteApplication('${app.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; font-size: 12px; color: #6b7280;">
                    <div>
                        <strong style="color: #374151;">Commodities:</strong> ${app.commodities?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Drivers:</strong> ${app.drivers?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Trucks:</strong> ${app.trucks?.length || 0}
                    </div>
                    <div>
                        <strong style="color: #374151;">Trailers:</strong> ${app.trailers?.length || 0}
                    </div>
                </div>
                <div style="margin-top: 8px;">
                    <span style="display: inline-block; background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                        ${app.status?.toUpperCase() || 'DRAFT'}
                    </span>
                </div>
            </div>
        `;
    });

    applicationsContainer.innerHTML = applicationsHTML;
    console.log(`✅ Loaded ${leadApplications.length} quote applications for lead ${leadId}`);
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

// Make email composer functions globally available for onclick handlers
window.removeAttachment = protectedFunctions.removeAttachment;
window.addMoreAttachments = protectedFunctions.addMoreAttachments;
window.sendEmail = protectedFunctions.sendEmail;

// Quote Application Management Functions
window.viewQuoteApplication = function(appId) {
    console.log('📄 Viewing quote application:', appId);
    alert('View application functionality coming soon');
};

window.editQuoteApplication = function(appId) {
    console.log('✏️ Editing quote application:', appId);
    alert('Edit application functionality coming soon');
};

window.deleteQuoteApplication = function(appId) {
    console.log('🗑️ Deleting quote application:', appId);
    if (confirm('Are you sure you want to delete this quote application?')) {
        const applications = JSON.parse(localStorage.getItem('quote_applications') || '[]');
        const updatedApplications = applications.filter(app => String(app.id) !== String(appId));
        localStorage.setItem('quote_applications', JSON.stringify(updatedApplications));

        // Refresh the current lead profile
        const leadProfileModal = document.getElementById('lead-profile-modal');
        if (leadProfileModal) {
            const leadId = leadProfileModal.dataset.leadId;
            if (leadId) {
                protectedFunctions.loadQuoteApplications(leadId);
            }
        }

        alert('Quote application deleted successfully');
    }
};

// Quote Application Supporting Functions
window.addDriverRow = function() {
    const container = document.getElementById('drivers-container');
    if (!container) return;

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
    console.log('💾 Saving quote application for lead:', leadId);

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

    // Save to localStorage
    const applications = JSON.parse(localStorage.getItem('quote_applications') || '[]');
    applications.unshift(applicationData);
    localStorage.setItem('quote_applications', JSON.stringify(applications));

    console.log('✅ Quote application saved:', applicationData);

    // Show success message
    alert(`Quote application saved successfully!\n\nCommodities: ${commodities.length}\nDrivers: ${drivers.length}\nTrucks: ${trucks.length}\nTrailers: ${trailers.length}`);

    // Close quote application modal
    modal.remove();

    // Refresh the lead profile to show the new application
    const leadProfileModal = document.getElementById('lead-profile-modal');
    if (leadProfileModal) {
        // Close and reopen the lead profile to refresh the Application Submissions section
        const leadData = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const currentLead = leadData.find(l => String(l.id) === String(leadId));

        if (currentLead) {
            // Close current profile modal
            leadProfileModal.remove();

            // Reopen with updated data
            setTimeout(() => {
                protectedFunctions.showLeadProfile(leadId);
            }, 100);
        }
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

// Ensure our protected functions override any others
window.viewLead = protectedFunctions.viewLead;
window.createEnhancedProfile = protectedFunctions.createEnhancedProfile;
window.showLeadProfile = protectedFunctions.showLeadProfile;

console.log('🔥 PROTECTED FUNCTIONS NOW ACTIVE - Enhanced profile with Reach Out section should load');