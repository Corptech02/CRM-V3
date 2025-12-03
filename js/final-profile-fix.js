// Working Enhanced Profile - Exact Working UI Design
console.log('🔥 FINAL-PROFILE-FIX: Enhanced profile loading...');

// Create the enhanced profile function with exact working UI
window.createEnhancedProfile = function(lead) {
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
                        <div id="stage-timestamp-${lead.id}">
                            <!-- Stage timestamp will be dynamically inserted here -->
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
                        <h3><i class="fas fa-truck"></i> Vehicles (${lead.vehicles.length})</h3>
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
                        <h3><i class="fas fa-trailer"></i> Trailers (${lead.trailers.length})</h3>
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
                        <h3><i class="fas fa-id-card"></i> Drivers (${lead.drivers.length})</h3>
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
                            <button id="email-doc-btn-${lead.id}" onclick="openEmailDocumentation('${lead.id}')" style="background: rgb(0, 102, 204); color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 12px; opacity: 1;" title="Send email with attached documentation">
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
        // Update reach-out status
        updateReachOutStatus(lead.id);
    }, 100);

    // Prevent modal from closing accidentally
    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer || e.target.id === 'profile-close-btn' || e.target.textContent === '×') {
            modalContainer.remove();
        } else {
            e.stopPropagation();
        }
    });

    console.log('🔥 Enhanced Profile: Modal created successfully');
};

// Auto-save function for company information fields
window.updateLeadField = function(leadId, field, value) {
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

        // Update the table if visible
        if (window.displayLeads) {
            window.displayLeads();
        }
    }
};

// Email Documentation function with real lead info
window.openEmailDocumentation = async function(leadId) {
    console.log('📧 Opening email documentation for lead:', leadId);

    // Find lead data from the profile (since leads variable might not be available)
    let leadName = 'Customer';
    let leadEmail = '';
    let leadData = { expirationDate: '', usdot: '' };

    // Try to extract lead info from the profile modal
    const profileModal = document.querySelector('[id*="profile-modal"]');
    if (profileModal) {
        const nameElement = profileModal.querySelector('h2, h1, .lead-name, .profile-title');
        if (nameElement) {
            leadName = nameElement.textContent.replace(/lead profile/i, '').trim() || leadName;
        }

        // Try to find email in the profile
        const emailElements = profileModal.querySelectorAll('input[type="email"], [href^="mailto:"]');
        for (let element of emailElements) {
            const email = element.value || element.href?.replace('mailto:', '') || element.textContent;
            if (email && email.includes('@')) {
                leadEmail = email;
                break;
            }
        }
    }

    // Try to fetch lead data from API as fallback
    try {
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`;

        const response = await fetch(`${apiUrl}/api/leads/${leadId}`);
        if (response.ok) {
            const apiLead = await response.json();
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

    // Create email subject with real lead info
    const companyName = leadName || 'Customer';
    const renewalDate = leadData.expirationDate || 'TBD';
    const subject = `Insurance Quote Documentation Request - ${companyName} (Exp: ${renewalDate})`;

    console.log(`Email Documentation for: ${leadName}, Subject: ${subject}`);
};

// Add missing checkFilesAndOpenEmail function (this is what the button actually calls)
window.checkFilesAndOpenEmail = function(leadId) {
    console.log('📧 Checking files and opening email for lead:', leadId);
    // Call the main email documentation function
    openEmailDocumentation(leadId);
};

// Update reach-out status display
function updateReachOutStatus(leadId) {
    console.log('🐛 DEBUG updateReachOutStatus called for leadId:', leadId);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        console.log('🐛 DEBUG updateReachOutStatus - lead not found');
        return;
    }

    console.log('🐛 DEBUG updateReachOutStatus - found lead:', lead);

    const statusContainer = document.getElementById(`reach-out-status-${leadId}`);
    console.log('🐛 DEBUG updateReachOutStatus - statusContainer found:', !!statusContainer);

    if (!statusContainer) {
        console.log('🚨 DOM ELEMENT MISSING: reach-out-status-' + leadId);
        return;
    }

    const status = getReachOutStatus(lead);
    statusContainer.innerHTML = status;

    console.log('🐛 DEBUG updateReachOutStatus - setting new status:', status);
}

// Get reach-out status based on stage and progress
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

// Assign frozen timestamp helper function
function assignFrozenTimestamp(leadId, timestamp) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        if (!leads[leadIndex].reachOut) {
            leads[leadIndex].reachOut = {};
        }
        leads[leadIndex].reachOut.reachOutCompletedAt = timestamp;
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
    }
}

// Handle call outcome (from popup)
function handleCallOutcome(leadId, answered) {
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
            if (buttons.length >= 2) {
                buttons[0].style.display = 'none';
                buttons[1].style.display = 'none';
            }
        }
    }
}

// Show call outcome popup
function showCallOutcomePopup(leadId) {
    console.log(`🐛 DEBUG CALL - showing popup for leadId: ${leadId}`);

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'popup-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Create popup
    const popup = document.createElement('div');
    popup.id = 'call-outcome-popup';
    popup.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        width: 90%;
        text-align: center;
    `;

    popup.innerHTML = `
        <h3>Call Outcome</h3>
        <p>Did the lead answer the phone?</p>
        <button onclick="handleCallOutcome('${leadId}', true)" style="background: #10b981; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer;">Yes, they answered</button>
        <button onclick="handleCallOutcome('${leadId}', false)" style="background: #ef4444; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer;">No, they didn't answer</button>

        <div id="voicemail-question" style="display: none; margin-top: 20px;">
            <p>Did you leave a voicemail?</p>
            <button onclick="handleVoicemailOutcome('${leadId}', true)" style="background: #f59e0b; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer;">Yes, left voicemail</button>
            <button onclick="handleVoicemailOutcome('${leadId}', false)" style="background: #6b7280; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer;">No voicemail</button>
        </div>
    `;

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
}

// Handle voicemail outcome
function handleVoicemailOutcome(leadId, leftVoicemail) {
    console.log('Voicemail outcome:', {leadId, leftVoicemail});

    if (leftVoicemail) {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

        if (leadIndex !== -1) {
            if (!leads[leadIndex].reachOut) {
                leads[leadIndex].reachOut = {};
            }
            leads[leadIndex].reachOut.voicemailCount = (leads[leadIndex].reachOut.voicemailCount || 0) + 1;

            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            // Update voicemail display
            const voicemailDisplay = document.getElementById(`voicemail-count-${leadId}`);
            if (voicemailDisplay) {
                voicemailDisplay.textContent = leads[leadIndex].reachOut.voicemailCount;
            }
        }
    }


    // Close popup
    const popup = document.getElementById('call-outcome-popup');
    if (popup) {
        popup.remove();
    }
    const backdrop = document.getElementById('popup-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

// Reach-out update function
window.updateReachOut = function(leadId, type, checked) {
    console.log(`🐛 DEBUG updateReachOut called: leadId=${leadId}, type=${type}, checked=${checked}`);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex === -1) {
        console.log('🐛 DEBUG updateReachOut - lead not found');
        return;
    }

    console.log(`🐛 DEBUG found lead at index: ${leadIndex}`);

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

    console.log(`🐛 DEBUG BEFORE changes - lead reachOut:`, leads[leadIndex].reachOut);

    if (type === 'call') {
        // Handle call checkbox - show popup
        if (checked) {
            console.log(`🐛 DEBUG CALL - showing popup for leadId: ${leadId}`);
            showCallOutcomePopup(leadId);
            return; // Don't update checkbox state yet - popup will handle it
        } else {
            // Unchecking call - reset call data
            leads[leadIndex].reachOut.callMade = false;
            leads[leadIndex].reachOut.callAttempts = Math.max(0, leads[leadIndex].reachOut.callAttempts - 1);
        }
    } else if (type === 'email') {
        const wasAlreadyChecked = leads[leadIndex].reachOut.emailSent;
        console.log(`🐛 DEBUG EMAIL - wasAlreadyChecked: ${wasAlreadyChecked}, newState: ${checked}`);
        console.log(`🐛 DEBUG EMAIL - current emailCount: ${leads[leadIndex].reachOut.emailCount}`);

        if (checked && !wasAlreadyChecked) {
            leads[leadIndex].reachOut.emailCount++;
            console.log(`🐛 DEBUG EMAIL - INCREMENTED counter from ${leads[leadIndex].reachOut.emailCount - 1} to ${leads[leadIndex].reachOut.emailCount}`);
        } else if (!checked && wasAlreadyChecked) {
            leads[leadIndex].reachOut.emailCount = Math.max(0, leads[leadIndex].reachOut.emailCount - 1);
            console.log(`🐛 DEBUG EMAIL - DECREMENTED counter from ${leads[leadIndex].reachOut.emailCount + 1} to ${leads[leadIndex].reachOut.emailCount}`);
        }

        leads[leadIndex].reachOut.emailSent = checked;

        // Update display
        const emailCountDisplay = document.getElementById(`email-count-${leadId}`);
        if (emailCountDisplay) {
            emailCountDisplay.textContent = leads[leadIndex].reachOut.emailCount;
            console.log(`🐛 DEBUG EMAIL - updated display to show: ${leads[leadIndex].reachOut.emailCount}`);
        }
    } else if (type === 'text') {
        const wasAlreadyChecked = leads[leadIndex].reachOut.textSent;
        console.log(`🐛 DEBUG TEXT - wasAlreadyChecked: ${wasAlreadyChecked}, newState: ${checked}`);
        console.log(`🐛 DEBUG TEXT - current textCount: ${leads[leadIndex].reachOut.textCount}`);

        if (checked && !wasAlreadyChecked) {
            leads[leadIndex].reachOut.textCount++;
            console.log(`🐛 DEBUG TEXT - INCREMENTED counter from ${leads[leadIndex].reachOut.textCount - 1} to ${leads[leadIndex].reachOut.textCount}`);
        } else if (!checked && wasAlreadyChecked) {
            leads[leadIndex].reachOut.textCount = Math.max(0, leads[leadIndex].reachOut.textCount - 1);
            console.log(`🐛 DEBUG TEXT - DECREMENTED counter from ${leads[leadIndex].reachOut.textCount + 1} to ${leads[leadIndex].reachOut.textCount}`);
        }

        leads[leadIndex].reachOut.textSent = checked;

        // Update display
        const textCountDisplay = document.getElementById(`text-count-${leadId}`);
        if (textCountDisplay) {
            textCountDisplay.textContent = leads[leadIndex].reachOut.textCount;
            console.log(`🐛 DEBUG TEXT - updated display to show: ${leads[leadIndex].reachOut.textCount}`);
        }

        // Check for completion when text is sent
        if (checked && leads[leadIndex].reachOut.textCount > 0 && !leads[leadIndex].reachOut.reachOutCompletedAt) {
            leads[leadIndex].reachOut.reachOutCompletedAt = new Date().toISOString();
            console.log(`🎯 REACH OUT COMPLETION - Set timestamp: ${leads[leadIndex].reachOut.reachOutCompletedAt}`);
        }
    }

    console.log(`🐛 DEBUG AFTER changes - lead reachOut:`, leads[leadIndex].reachOut);

    // Save to localStorage
    console.log(`🐛 DEBUG - saving to localStorage...`);
    localStorage.setItem('insurance_leads', JSON.stringify(leads));
    localStorage.setItem('leads', JSON.stringify(leads));

    // Verification
    const savedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const savedLead = savedLeads.find(l => String(l.id) === String(leadId));
    console.log(`🐛 DEBUG - verification - saved lead reachOut:`, savedLead?.reachOut);

    // Update reach out status
    console.log(`🐛 DEBUG ${type.toUpperCase()} - calling updateReachOutStatus AFTER save`);
    updateReachOutStatus(leadId);


    console.log(`🐛 DEBUG ${type.toUpperCase()} - SKIPPING table refresh to prevent server data overwrite`);

        // Save to database
        fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leads[leadIndex])
        }).catch(error => console.error('Error saving reach out status:', error));

        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} ${checked ? 'marked' : 'unmarked'}`, 'success');
    }
};

// Stage timestamp display function
function updateStageTimestamp(leadId, lead) {
    const timestampContainer = document.getElementById(`stage-timestamp-${leadId}`);
    if (!timestampContainer) return;

    // Get the timestamp for the current stage
    const stageTimestamps = lead.stageTimestamps || {};
    const currentStageTimestamp = stageTimestamps[lead.stage];

    if (!currentStageTimestamp) {
        timestampContainer.innerHTML = '';
        return;
    }

    // Calculate time difference
    const now = new Date();
    const stageDate = new Date(currentStageTimestamp);
    const diffMs = now - stageDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    // Format the date display
    const formattedDate = stageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) + ' at ' + stageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Determine color based on age
    let backgroundColor, color, ageText;

    if (diffDays === 0) {
        // Green - same day
        backgroundColor = '#10b981';
        color = 'white';
        ageText = diffHours < 1 ? 'Just now' : `${diffHours} hours ago`;
    } else if (diffDays <= 7) {
        // Yellow - 1-7 days
        backgroundColor = '#f59e0b';
        color = 'white';
        ageText = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays <= 30) {
        // Orange - 1-4 weeks
        backgroundColor = '#f97316';
        color = 'white';
        ageText = `${diffDays} days ago`;
    } else {
        // Red - over 30 days
        backgroundColor = '#ef4444';
        color = 'white';
        ageText = `${diffDays} days ago`;
    }

    // Create the timestamp display
    timestampContainer.innerHTML = `
        <div style="margin-top: 8px;">
            <span style="
                background-color: ${backgroundColor};
                color: ${color};
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                display: inline-block;
            " title="Updated ${ageText}">
                <i class="fas fa-clock" style="margin-right: 4px;"></i>${formattedDate}
            </span>
        </div>
    `;
}

// Update stage function
window.updateLeadStage = function(leadId, stage) {
    console.log('Updating lead stage:', leadId, stage);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex !== -1) {
        leads[leadIndex].stage = stage;

        // Update stage timestamps
        if (!leads[leadIndex].stageTimestamps) {
            leads[leadIndex].stageTimestamps = {};
        }
        leads[leadIndex].stageTimestamps[stage] = new Date().toISOString();
        leads[leadIndex].stageUpdatedAt = new Date().toISOString();

        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        // Update the timestamp display in the modal
        updateStageTimestamp(leadId, leads[leadIndex]);

        // Update the reach-out status display
        updateReachOutStatus(leadId);

        // Update the table if visible
        if (window.displayLeads) {
            window.displayLeads();
        }
    }
};

// Placeholder functions for buttons
window.updateLeadStatus = function(leadId, status) {
    updateLeadField(leadId, 'status', status);
};

window.updateWinLossStatus = function(leadId, winLoss) {
    updateLeadField(leadId, 'winLoss', winLoss);
};

window.updateLeadAssignedTo = function(leadId, assignedTo) {
    updateLeadField(leadId, 'assignedTo', assignedTo);
};

window.addVehicleToLead = function(leadId) {
    console.log('Add vehicle for lead:', leadId);
};

window.addTrailerToLead = function(leadId) {
    console.log('Add trailer for lead:', leadId);
};

window.addDriverToLead = function(leadId) {
    console.log('Add driver for lead:', leadId);
};

window.createQuoteApplication = function(leadId) {
    console.log('Create quote application for lead:', leadId);
};

window.addQuoteSubmission = function(leadId) {
    console.log('Add quote submission for lead:', leadId);
};

// Load loss runs from server
function loadLossRuns(leadId) {
    console.log('🔄 Loading loss runs for lead:', leadId);

    const container = document.getElementById(`loss-runs-container-${leadId}`);
    if (!container) return;

    // Use the same API endpoint pattern as your existing system
    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001/api';

    fetch(`${API_URL}/loss-runs/${leadId}`)
        .then(response => response.json())
        .then(data => {
            console.log('📄 Loss runs loaded:', data);

            if (data.success && data.lossRuns && data.lossRuns.length > 0) {
                // Display existing loss runs
                container.innerHTML = data.lossRuns.map(lossRun => `
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
        })
        .catch(error => {
            console.error('Error loading loss runs:', error);
            container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">Error loading loss runs</p>';
        });
}

// View loss runs function
window.viewLossRuns = function(leadId, filename, originalName) {
    console.log('👁️ Viewing loss runs:', leadId, filename, originalName);

    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001/api';
    const url = `${API_URL}/loss-runs/${leadId}/${filename}`;

    // Open in new window
    window.open(url, '_blank');
};

// Remove loss runs function
window.removeLossRuns = function(leadId, filename) {
    if (!confirm('Are you sure you want to remove this loss run document?')) {
        return;
    }

    console.log('🗑️ Removing loss runs:', leadId, filename);

    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001/api';

    fetch(`${API_URL}/loss-runs/${leadId}/${filename}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Loss run removed successfully');
            // Reload the loss runs list
            loadLossRuns(leadId);
        } else {
            alert('Error removing loss run: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error removing loss runs:', error);
        alert('Error removing loss run');
    });
};

// Upload loss runs function - opens file upload dialog
window.openLossRunsUpload = function(leadId) {
    console.log('📄 Opening loss runs upload for lead:', leadId);

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    fileInput.multiple = true;

    fileInput.onchange = function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            uploadLossRunsFiles(leadId, files);
        }
    };

    // Trigger file selection
    fileInput.click();
};

// Upload files function
function uploadLossRunsFiles(leadId, files) {
    console.log('📤 Uploading loss runs files:', files.length, 'files for lead:', leadId);

    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001/api';

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    formData.append('leadId', leadId);

    // Show uploading message
    const container = document.getElementById(`loss-runs-container-${leadId}`);
    if (container) {
        container.innerHTML = '<p style="color: #3b82f6; text-align: center; padding: 20px;">Uploading files...</p>';
    }

    fetch(`${API_URL}/loss-runs/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('📄 Upload response:', data);

        if (data.success) {
            console.log('✅ Files uploaded successfully');
            // Reload the loss runs list to show new files
            loadLossRuns(leadId);
        } else {
            alert('Error uploading files: ' + (data.error || 'Unknown error'));
            loadLossRuns(leadId); // Reload to show current state
        }
    })
    .catch(error => {
        console.error('Error uploading files:', error);
        alert('Error uploading files');
        loadLossRuns(leadId); // Reload to show current state
    });
};

// Override viewLead to use enhanced profile
window.viewLead = function(leadId) {
    console.log('🔥 viewLead override called for:', leadId);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (lead) {
        window.createEnhancedProfile(lead);
    } else {
        console.error('Lead not found:', leadId);
    }
};

// Create showLeadProfile alias for compatibility
window.showLeadProfile = function(leadId) {
    console.log('🔥 showLeadProfile called, redirecting to enhanced profile for:', leadId);
    window.viewLead(leadId);
};

// Add missing showNotification function to match working version
window.showNotification = function(message, type) {
    // Only log to console, don't show popup
    console.log(`[${type}] ${message}`);
};


// Add simplified uploadLossRuns function (only what exists in working version)
window.uploadLossRuns = function() {
    console.log('📄 Starting loss runs upload...');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    fileInput.multiple = true;

    fileInput.onchange = function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            console.log('Files selected for upload:', files.length);
            showNotification(`${files.length} files selected for upload`, 'info');
        }
    };

    fileInput.click();
};

// Add missing openLossRunsUpload function
window.openLossRunsUpload = function(leadId) {
    console.log('📤 Opening loss runs upload for lead:', leadId);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    fileInput.multiple = true;

    fileInput.onchange = function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            uploadLossRunsFiles(leadId, files);
        }
    };

    fileInput.click();
};


console.log('🔥 FINAL-PROFILE-FIX: Enhanced profile with all features loaded successfully');
console.log('🔥 Available functions:', {
    'createEnhancedProfile': typeof window.createEnhancedProfile,
    'viewLead': typeof window.viewLead,
    'showLeadProfile': typeof window.showLeadProfile,
    'updateLeadField': typeof window.updateLeadField,
    'openEmailDocumentation': typeof window.openEmailDocumentation
});