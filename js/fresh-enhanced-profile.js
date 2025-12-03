// Fresh enhanced profile with all original sections
console.log('🔧 LOADING FRESH ENHANCED PROFILE...');
console.log('🔧 Current timestamp:', new Date().toISOString());

window.createEnhancedProfile = function(lead) {
    console.log('✅ ENHANCED PROFILE CALLED FOR:', lead.name);
    console.log('✅ Lead data:', lead);

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
        z-index: 10000;
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
                    <div class="form-group">
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Company Name</label>
                        <input type="text" id="company-name-${lead.id}" value="${lead.name || ''}"
                               onchange="updateLeadField('${lead.id}', 'name', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Contact Person</label>
                        <input type="text" id="contact-person-${lead.id}" value="${lead.contact || ''}"
                               onchange="updateLeadField('${lead.id}', 'contact', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Phone</label>
                        <input type="text" id="phone-${lead.id}" value="${lead.phone || ''}"
                               onchange="updateLeadField('${lead.id}', 'phone', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Email</label>
                        <input type="email" id="email-${lead.id}" value="${lead.email || ''}"
                               onchange="updateLeadField('${lead.id}', 'email', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">DOT Number</label>
                        <input type="text" id="dot-number-${lead.id}" value="${lead.dotNumber || ''}"
                               onchange="updateLeadField('${lead.id}', 'dotNumber', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">MC Number</label>
                        <input type="text" id="mc-number-${lead.id}" value="${lead.mcNumber || ''}"
                               onchange="updateLeadField('${lead.id}', 'mcNumber', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Years in Business</label>
                        <input type="text" id="years-business-${lead.id}" value="${lead.yearsInBusiness || ''}"
                               onchange="updateLeadField('${lead.id}', 'yearsInBusiness', this.value)"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Renewal Date</label>
                        <input type="text" id="renewal-date-${lead.id}" value="${lead.renewalDate || ''}"
                               onchange="updateLeadField('${lead.id}', 'renewalDate', this.value)"
                               placeholder="MM/DD/YYYY"
                               style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
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
                    <div>
                        <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Stage</label>
                        <select id="lead-stage-${lead.id}" onchange="updateLeadStage('${lead.id}', this.value)"
                                style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                            <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                            <option value="info_requested" ${lead.stage === 'info_requested' ? 'selected' : ''}>Info Requested</option>
                            <option value="info_received" ${lead.stage === 'info_received' ? 'selected' : ''}>Info Received</option>
                            <option value="loss_runs_requested" ${lead.stage === 'loss_runs_requested' ? 'selected' : ''}>Loss Runs Requested</option>
                            <option value="loss_runs_received" ${lead.stage === 'loss_runs_received' ? 'selected' : ''}>Loss Runs Received</option>
                            <option value="app_prepared" ${lead.stage === 'app_prepared' ? 'selected' : ''}>App Prepared</option>
                            <option value="app_sent" ${lead.stage === 'app_sent' ? 'selected' : ''}>App Sent</option>
                            <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                            <option value="quote_sent" ${lead.stage === 'quote_sent' ? 'selected' : ''}>Quote Sent</option>
                            <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                            <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                            <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
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
                    <select onchange="updateLeadField('${lead.id}', 'lossRunsStatus', this.value)"
                            style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="" ${!lead.lossRunsStatus ? 'selected' : ''}>Select Status</option>
                        <option value="not_requested" ${lead.lossRunsStatus === 'not_requested' ? 'selected' : ''}>Not Requested</option>
                        <option value="requested" ${lead.lossRunsStatus === 'requested' ? 'selected' : ''}>Requested</option>
                        <option value="received" ${lead.lossRunsStatus === 'received' ? 'selected' : ''}>Received</option>
                        <option value="incomplete" ${lead.lossRunsStatus === 'incomplete' ? 'selected' : ''}>Incomplete</option>
                    </select>
                </div>
                <div style="margin-bottom: 20px;">
                    <button onclick="openEmailDocumentation && openEmailDocumentation('${lead.id}')" style="
                        background: #0066cc;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        margin-right: 12px;
                    ">📧 Email Documentation</button>
                    <button onclick="window.uploadLossRuns && uploadLossRuns('${lead.id}')" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                    ">📁 Upload Loss Runs</button>
                </div>
                <div id="loss-runs-files-${lead.id}" style="margin-top: 15px;">
                    <!-- Loss runs files will be displayed here -->
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
                <div style="margin-bottom: 20px;">
                    <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Call Transcript</label>
                    <textarea id="transcript-${lead.id}" onchange="updateLeadField('${lead.id}', 'transcriptText', this.value)"
                              placeholder="Call transcription will appear here..."
                              style="width: 100%; height: 200px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: monospace;">${lead.transcriptText || ''}</textarea>
                </div>
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
                <div id="vehicles-${lead.id}" style="margin-bottom: 20px;">
                    ${(lead.vehicles || []).length > 0 ? lead.vehicles.map((vehicle, index) => \`
                        <div style="border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
                            <h4>Vehicle \${index + 1}</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                <input type="text" placeholder="Year" value="\${vehicle.year || ''}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <input type="text" placeholder="Make" value="\${vehicle.make || ''}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <input type="text" placeholder="Model" value="\${vehicle.model || ''}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <input type="text" placeholder="VIN" value="\${vehicle.vin || ''}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        </div>
                    \`).join('') : '<p>No vehicles added yet.</p>'}
                </div>
                <button onclick="alert('Add Vehicle functionality')" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                ">+ Add Vehicle</button>
            </div>
        </div>
    `;

    // Prevent modal from closing - very defensive approach
    modalContent.onclick = function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    };

    // Only allow close via close button
    modalContainer.onclick = function(e) {
        if (e.target === modalContainer) {
            if (confirm('Close lead profile?')) {
                modalContainer.remove();
            }
        }
        e.stopPropagation();
        return false;
    };

    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    // Make the modal "sticky" - prevent removal
    const originalRemove = modalContainer.remove;
    modalContainer.remove = function() {
        console.log('🛡️ Modal removal blocked - use close button');
    };

    // Add close button functionality
    const closeBtn = modalContainer.querySelector('.close-btn, button[onclick*="remove"]');
    if (closeBtn) {
        closeBtn.onclick = function() {
            console.log('✅ Close button clicked - removing modal');
            originalRemove.call(modalContainer);
        };
    }

    // Diagnostic check
    setTimeout(() => {
        const modal = document.getElementById('lead-profile-container');
        if (modal) {
            console.log('✅ Modal still exists after 1 second - WORKING!');
        } else {
            console.error('❌ Modal was removed - something is closing it');
        }
    }, 1000);

    // Additional protection against other scripts
    window.closeLeadProfile = function() {
        console.log('🛡️ closeLeadProfile blocked');
    };

    console.log('✅ Fresh enhanced lead profile created and displayed');
};

// Placeholder email documentation function
window.openEmailDocumentation = function(leadId) {
    alert('Email Documentation feature - Lead ID: ' + leadId);
};

// Aggressive override - force our modal function
function forceModalOverride() {
    console.log('🔧 FORCING viewLead override...');

    window.viewLead = function(leadId) {
        console.log('🔧 FORCED OVERRIDE: viewLead called for:', leadId);

        // CRITICAL: Prevent hash navigation that triggers page routing
        const currentHash = window.location.hash;

        // Prevent any navigation or page changes
        if (window.event) {
            window.event.preventDefault();
            window.event.stopPropagation();
            window.event.stopImmediatePropagation();
        }

        // Temporarily disable hashchange listener
        const originalOnHashChange = window.onhashchange;
        window.onhashchange = null;

        // Prevent hash from changing
        setTimeout(() => {
            if (window.location.hash !== currentHash) {
                window.location.hash = currentHash;
            }
            window.onhashchange = originalOnHashChange;
        }, 10);

        // Get lead data from localStorage
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let lead = leads.find(l => String(l.id) === String(leadId));

        if (!lead) {
            leads = JSON.parse(localStorage.getItem('leads') || '[]');
            lead = leads.find(l => String(l.id) === String(leadId));
        }

        if (lead && window.createEnhancedProfile) {
            console.log('✅ Found lead and function, opening modal:', lead.name);
            window.createEnhancedProfile(lead);
        } else {
            console.error('❌ Lead or function not found');
            console.log('Available leads:', leads.map(l => ({id: l.id, name: l.name})));
        }

        return false;
    };

    // Block all other functions that might redirect
    window.showLeadDetails = window.viewLead;
    window.showLead = window.viewLead;

    console.log('✅ Aggressive override complete');
}

// Override immediately
forceModalOverride();

// Override again after other scripts load
setTimeout(forceModalOverride, 500);
setTimeout(forceModalOverride, 1000);
setTimeout(forceModalOverride, 2000);

// Add hash change interceptor to prevent navigation while modal is open
let modalBlocking = false;
const originalHashChangeHandler = window.addEventListener;

window.interceptHashChange = function() {
    const modal = document.getElementById('lead-profile-container');
    if (modal) {
        console.log('🔧 BLOCKING hash change - modal is open');
        return false;
    }
    return true;
};

// Override hashchange events when modal is present
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type, listener, options) {
    if (type === 'hashchange') {
        console.log('🔧 Intercepting hashchange listener registration');
        const wrappedListener = function(e) {
            if (!window.interceptHashChange()) {
                console.log('🔧 Blocked hashchange event');
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            return listener.call(this, e);
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// Also override eye icon clicks directly
function overrideEyeIcons() {
    console.log('🔧 Overriding eye icon clicks...');

    // Find all eye icons and override their click handlers
    const eyeIcons = document.querySelectorAll('[onclick*="viewLead"], .fa-eye, [title*="View"], [onclick*="showLead"]');
    console.log('👁️ Found', eyeIcons.length, 'eye icons to override');

    eyeIcons.forEach(icon => {
        const leadId = icon.getAttribute('onclick')?.match(/viewLead\(\'?(\d+)\'?\)/)?.[1] ||
                      icon.getAttribute('onclick')?.match(/showLead\(\'?(\d+)\'?\)/)?.[1];

        if (leadId) {
            console.log('🎯 Found eye icon for lead:', leadId);

            // Remove existing onclick
            icon.removeAttribute('onclick');

            // Add our custom click handler
            icon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // Store current hash to prevent navigation
                const currentHash = window.location.hash;

                console.log('🔧 Eye icon clicked - forcing modal for:', leadId);
                window.viewLead(leadId);

                // Ensure hash doesn't change after modal opens
                setTimeout(() => {
                    if (window.location.hash !== currentHash) {
                        console.log('🔧 Preventing hash change, restoring:', currentHash);
                        window.location.hash = currentHash;
                    }
                }, 0);

                return false;
            }, true);

            // Also override parent button if it exists
            const button = icon.closest('button');
            if (button) {
                button.removeAttribute('onclick');
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    const currentHash = window.location.hash;
                    console.log('🔧 Button clicked - forcing modal for:', leadId);
                    window.viewLead(leadId);

                    setTimeout(() => {
                        if (window.location.hash !== currentHash) {
                            console.log('🔧 Preventing hash change from button, restoring:', currentHash);
                            window.location.hash = currentHash;
                        }
                    }, 0);

                    return false;
                }, true);
            }
        }
    });
}

// Override eye icons multiple times
setTimeout(overrideEyeIcons, 100);
setTimeout(overrideEyeIcons, 1000);
setTimeout(overrideEyeIcons, 3000);

console.log('✅ FRESH ENHANCED PROFILE LOADED SUCCESSFULLY');
console.log('✅ viewLead override installed');
console.log('✅ createEnhancedProfile function available:', typeof window.createEnhancedProfile);

// Test the function is available
if (typeof window.createEnhancedProfile === 'function') {
    console.log('✅ SUCCESS: createEnhancedProfile is ready to use');
} else {
    console.error('❌ ERROR: createEnhancedProfile not available after script load');
}

// Force function availability
window.createEnhancedProfileReady = true;