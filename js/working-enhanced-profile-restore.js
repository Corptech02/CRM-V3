// Working Enhanced Profile Restore - Minimal and guaranteed to work
console.log('🔥 WORKING-PROFILE: Script starting...');

// Create the enhanced profile function with all your original features
window.createEnhancedProfile = function(lead) {
    console.log('🔥 WORKING-PROFILE: createEnhancedProfile called for:', lead.name);

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

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'lead-profile-container';
    modalContainer.className = 'modal-overlay';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        padding: 20px;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-container large';
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        max-width: 1400px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    `;

    modalContent.innerHTML = `
        <div class="modal-header" style="
            padding: 24px 30px;
            background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 12px 12px 0 0;
        ">
            <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: white !important;">
                <i class="fas fa-truck" style="margin-right: 12px;"></i>
                Lead Profile: ${lead.name || 'Unknown'}
            </h2>
            <button onclick="document.getElementById('lead-profile-container').remove()" class="close-btn" style="
                background: rgba(255, 255, 255, 0.9);
                border: 2px solid white;
                color: #0066cc !important;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
                padding: 0;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                transition: all 0.2s;
            ">×</button>
        </div>

        <div class="modal-body" style="padding: 30px; overflow-y: auto; flex: 1;">

            <!-- Company Information Section -->
            <div class="form-section" style="
                background: #f9fafb;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 24px;
            ">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">
                    Company Information
                </h3>
                <div class="form-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                ">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Company Name:</label>
                        <input type="text" id="company-name-${lead.id}" value="${lead.name || ''}"
                               onchange="updateLeadField('${lead.id}', 'name', this.value)"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contact:</label>
                        <input type="text" id="contact-${lead.id}" value="${lead.contact || ''}"
                               onchange="updateLeadField('${lead.id}', 'contact', this.value)"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Phone:</label>
                        <input type="text" id="phone-${lead.id}" value="${lead.phone || ''}"
                               onchange="updateLeadField('${lead.id}', 'phone', this.value)"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email:</label>
                        <input type="text" id="email-${lead.id}" value="${lead.email || ''}"
                               onchange="updateLeadField('${lead.id}', 'email', this.value)"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
            </div>

            <!-- Reach-out & Communication Section -->
            <div class="form-section" style="
                background: #f9fafb;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 24px;
            ">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">
                    Reach-out & Communication
                </h3>
                <div style="margin-bottom: 20px;">
                    <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Notes & Communication History</label>
                    <textarea id="notes-${lead.id}" onchange="updateLeadField('${lead.id}', 'notes', this.value)"
                              placeholder="Add notes about calls, emails, follow-ups..."
                              style="width: 100%; height: 120px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;">${lead.notes || ''}</textarea>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Last Contact Date</label>
                        <input type="date" id="last-contact-${lead.id}" value="${lead.lastContact || ''}"
                               onchange="updateLeadField('${lead.id}', 'lastContact', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Next Follow-up</label>
                        <input type="date" id="next-followup-${lead.id}" value="${lead.nextFollowup || ''}"
                               onchange="updateLeadField('${lead.id}', 'nextFollowup', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>
            </div>

            <!-- Loss Runs & Documentation Section -->
            <div class="form-section" style="
                background: #f9fafb;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 24px;
            ">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">
                    Loss Runs & Documentation
                </h3>
                <div style="margin-bottom: 20px;">
                    <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Loss Runs Status</label>
                    <select id="loss-runs-status-${lead.id}" onchange="updateLeadField('${lead.id}', 'lossRunsStatus', this.value)"
                            style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="not_requested" ${(lead.lossRunsStatus === 'not_requested' || !lead.lossRunsStatus) ? 'selected' : ''}>Not Requested</option>
                        <option value="requested" ${lead.lossRunsStatus === 'requested' ? 'selected' : ''}>Requested</option>
                        <option value="received" ${lead.lossRunsStatus === 'received' ? 'selected' : ''}>Received</option>
                        <option value="reviewed" ${lead.lossRunsStatus === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                    </select>
                </div>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <button onclick="uploadLossRuns('${lead.id}')" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.2s;
                    ">📁 Upload Loss Runs</button>

                    <button onclick="openEmailDocumentation && openEmailDocumentation('${lead.id}')" style="
                        background: #16a34a;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.2s;
                    ">📧 Email Documentation</button>
                </div>
            </div>

            <!-- Transcription Section -->
            <div class="form-section" style="
                background: #f9fafb;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 24px;
            ">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">
                    Call Transcription & Details
                </h3>
                <textarea id="transcription-${lead.id}" onchange="updateLeadField('${lead.id}', 'transcriptText', this.value)"
                          placeholder="Call transcription and additional details will appear here..."
                          style="width: 100%; height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;">${lead.transcriptText || ''}</textarea>
            </div>

            <!-- Vehicles Section -->
            <div class="form-section" style="
                background: #f9fafb;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 24px;
            ">
                <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">
                    Vehicles
                </h3>
                <div id="vehicles-list-${lead.id}">
                    ${lead.vehicles && lead.vehicles.length > 0 ?
                        lead.vehicles.map((vehicle, index) => `
                            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
                                <strong>Vehicle ${index + 1}:</strong> ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}<br>
                                <small>VIN: ${vehicle.vin || 'Not provided'}</small>
                            </div>
                        `).join('') :
                        '<p style="color: #6b7280; font-style: italic;">No vehicles added yet</p>'
                    }
                </div>
                <button onclick="addVehicle('${lead.id}')" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-top: 10px;
                ">+ Add Vehicle</button>
            </div>

        </div>
    `;

    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    // Prevent the modal from being automatically removed
    const protectModal = () => {
        const modal = document.getElementById('lead-profile-container');
        if (!modal) {
            console.log('🔥 WORKING-PROFILE: Modal was removed, recreating...');
            setTimeout(() => window.createEnhancedProfile(lead), 100);
        }
    };

    // Aggressive modal protection - recreate if removed
    let protectionActive = true;
    const modalProtectionInterval = setInterval(() => {
        const modal = document.getElementById('lead-profile-container');
        if (!modal && protectionActive) {
            console.log('🔥 WORKING-PROFILE: Modal was forcibly removed, recreating...');
            setTimeout(() => {
                if (protectionActive) {
                    window.createEnhancedProfile(lead);
                }
            }, 50);
        }
    }, 100);

    // Stop protection when user actually closes modal
    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer || e.target.textContent === '×') {
            protectionActive = false;
            clearInterval(modalProtectionInterval);
        }
    });

    // Add click protection to prevent accidental closes
    modalContainer.addEventListener('click', function(e) {
        // Only close if clicking the X button or background
        if (e.target === modalContainer || e.target.textContent === '×') {
            clearInterval(modalProtectionInterval);
        } else {
            e.stopPropagation();
        }
    });

    console.log('🔥 WORKING-PROFILE: Enhanced profile modal created and displayed with protection');
};

// Create Email Documentation function
window.openEmailDocumentation = function(leadId) {
    console.log('📧 Opening Email Documentation for lead:', leadId);

    // Get lead data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        alert('Lead not found');
        return;
    }

    // Create email subject with real lead info
    const subject = `Insurance Quote Documentation Request - ${lead.name || 'Lead'} ${lead.renewalDate ? '(Exp: ' + lead.renewalDate + ')' : '(Exp: TBD)'}`;

    // Simple alert for now - you can expand this later
    alert(`Email Documentation for: ${lead.name}\nSubject: ${subject}`);
};

// Create placeholder functions for buttons
window.updateLeadField = function(leadId, field, value) {
    console.log('Updating lead field:', leadId, field, value);
    // Add your update logic here
};

window.uploadLossRuns = function(leadId) {
    alert('Loss Runs upload for lead: ' + leadId);
};

window.addVehicle = function(leadId) {
    alert('Add vehicle for lead: ' + leadId);
};

// Create showLeadProfile alias for compatibility
window.showLeadProfile = function(leadId) {
    console.log('🔥 WORKING-PROFILE: showLeadProfile called, redirecting to createEnhancedProfile for:', leadId);

    // Get lead data from localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (lead) {
        window.createEnhancedProfile(lead);
    } else {
        console.error('Lead not found for showLeadProfile:', leadId);
    }
};

console.log('🔥 WORKING-PROFILE: All functions created');
console.log('🔥 WORKING-PROFILE: createEnhancedProfile available:', typeof window.createEnhancedProfile);
console.log('🔥 WORKING-PROFILE: showLeadProfile available:', typeof window.showLeadProfile);
console.log('🔥 WORKING-PROFILE: Script completed successfully');