// Direct profile fix - ensures lead profile opens
console.log('🔧 Loading direct profile fix...');

// Simple profile creator
function createSimpleProfile(leadId, lead) {
    console.log('🔧 Creating simple working profile for:', lead.name);

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'simple-lead-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 99999;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 8px;
            padding: 20px;
            position: relative;
        ">
            <button onclick="closeSimpleProfile()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: #ff4444;
                color: white;
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
            ">×</button>

            <h2 style="margin-top: 0; color: #333;">
                <i class="fas fa-truck"></i> Lead Profile: ${lead.name || 'Unknown'}
            </h2>

            <!-- Company Information -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #0066cc;">Company Information</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Company Name:</label>
                        <input type="text" id="company-name" value="${lead.name || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contact:</label>
                        <input type="text" id="contact" value="${lead.contact || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Phone:</label>
                        <input type="text" id="phone" value="${lead.phone || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email:</label>
                        <input type="text" id="email" value="${lead.email || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">DOT Number:</label>
                        <input type="text" id="dot-number" value="${lead.dotNumber || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">MC Number:</label>
                        <input type="text" id="mc-number" value="${lead.mcNumber || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Years in Business:</label>
                        <input type="text" id="years-business" value="${lead.yearsInBusiness || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Renewal Date:</label>
                        <input type="text" id="renewal-date" value="${lead.renewalDate || ''}"
                               placeholder="MM/DD/YYYY"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
            </div>

            <!-- Operation Details -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #0066cc;">Operation Details</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Radius of Operation:</label>
                        <input type="text" id="radius" value="${lead.radiusOfOperation || ''}"
                               placeholder="e.g., 500 miles"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Commodity Hauled:</label>
                        <input type="text" id="commodity" value="${lead.commodityHauled || ''}"
                               placeholder="e.g., General Freight"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Operating States:</label>
                        <input type="text" id="operating-states" value="${lead.operatingStates || ''}"
                               placeholder="e.g., TX, LA, OK"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
            </div>

            <!-- Stage and Notes -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #0066cc;">Stage & Notes</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Stage:</label>
                        <select id="stage" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
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
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Premium:</label>
                        <input type="text" id="premium" value="${lead.premium || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Notes:</label>
                    <textarea id="notes" style="width: 100%; height: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${lead.notes || ''}</textarea>
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: right; margin-top: 20px;">
                <button onclick="saveProfileData('${leadId}')" style="
                    background: #0066cc;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 10px;
                    font-weight: bold;
                ">Save Changes</button>
                <button onclick="closeSimpleProfile()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    console.log('✅ Simple profile created and displayed');
}

// Close function
window.closeSimpleProfile = function() {
    const modal = document.getElementById('simple-lead-modal');
    if (modal) {
        modal.remove();
        console.log('Simple profile closed');
    }
};

// Save function
window.saveProfileData = function(leadId) {
    console.log('💾 Saving profile data for:', leadId);

    const modal = document.getElementById('simple-lead-modal');
    if (!modal) return;

    // Get lead data
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        leads = JSON.parse(localStorage.getItem('leads') || '[]');
        lead = leads.find(l => String(l.id) === String(leadId));
    }

    if (!lead) return;

    // Update lead with form values
    const getValue = (id) => modal.querySelector(`#${id}`)?.value?.trim() || '';

    lead.name = getValue('company-name') || lead.name;
    lead.contact = getValue('contact') || lead.contact;
    lead.phone = getValue('phone') || lead.phone;
    lead.email = getValue('email') || lead.email;
    lead.dotNumber = getValue('dot-number') || lead.dotNumber;
    lead.mcNumber = getValue('mc-number') || lead.mcNumber;
    lead.yearsInBusiness = getValue('years-business') || lead.yearsInBusiness;
    lead.renewalDate = getValue('renewal-date') || lead.renewalDate;
    lead.radiusOfOperation = getValue('radius') || lead.radiusOfOperation;
    lead.commodityHauled = getValue('commodity') || lead.commodityHauled;
    lead.operatingStates = getValue('operating-states') || lead.operatingStates;
    lead.stage = getValue('stage') || lead.stage;
    lead.premium = getValue('premium') || lead.premium;
    lead.notes = getValue('notes') || lead.notes;
    lead.lastModified = new Date().toISOString();

    // Save to localStorage
    localStorage.setItem('insurance_leads', JSON.stringify(leads));
    localStorage.setItem('leads', JSON.stringify(leads));

    console.log('✅ Profile saved');
    alert('Changes saved successfully!');

    // Refresh leads view if available
    if (typeof loadLeadsView === 'function') {
        loadLeadsView();
    }
};

// Immediately override any existing viewLead function - FORCE ORIGINAL ENHANCED PROFILE ONLY
window.viewLead = function(leadId) {
    console.log('🔧 DIRECT viewLead override called for ORIGINAL ENHANCED PROFILE:', leadId);

    // Remove any existing profiles first
    const existingModals = document.querySelectorAll('.modal-overlay, #lead-profile-container, #simple-lead-modal');
    existingModals.forEach(modal => modal.remove());

    // Get lead data from localStorage
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        leads = JSON.parse(localStorage.getItem('leads') || '[]');
        lead = leads.find(l => String(l.id) === String(leadId));
    }

    if (!lead) {
        console.error('Lead not found:', leadId);
        alert('Lead not found');
        return;
    }

    console.log('✅ Lead found:', lead.name);

    // FORCE WAIT FOR createEnhancedProfile - DO NOT USE FALLBACK
    if (typeof window.createEnhancedProfile === 'function') {
        console.log('🔧 Using ORIGINAL createEnhancedProfile from final-profile-fix.js');
        window.createEnhancedProfile(lead);
        return;
    }

    // FORCE LOAD the enhanced profile function if not available
    console.log('⏳ createEnhancedProfile not found, force loading...');

    // Try to manually execute final-profile-fix.js code
    if (!window.createEnhancedProfile) {
        console.log('🔧 Attempting to force load createEnhancedProfile function...');

        // Load the script dynamically
        const script = document.createElement('script');
        script.src = 'js/final-profile-fix.js?t=' + Date.now();
        script.onload = function() {
            console.log('🔧 final-profile-fix.js force loaded');
            if (typeof window.createEnhancedProfile === 'function') {
                console.log('✅ createEnhancedProfile now available - using it');
                window.createEnhancedProfile(lead);
            } else {
                console.error('❌ Still no createEnhancedProfile after force load');
                alert('Could not load original enhanced profile. Please refresh the page.');
            }
        };
        script.onerror = function() {
            console.error('❌ Failed to load final-profile-fix.js');
            alert('Could not load profile script. Please refresh the page.');
        };
        document.head.appendChild(script);
    }
};

// Wait for enhanced profile to load and update if available
setTimeout(() => {
    if (typeof window.createEnhancedProfile === 'function') {
        console.log('✅ ORIGINAL Enhanced profile found - ready to use');
    } else {
        console.error('❌ ORIGINAL Enhanced profile STILL not found after 2 seconds');
        console.log('Available window functions:', Object.keys(window).filter(key => key.includes('profile') || key.includes('Profile')));
    }
}, 2000);

// More aggressive check - wait longer if needed
setTimeout(() => {
    if (typeof window.createEnhancedProfile !== 'function') {
        console.error('❌ CRITICAL: Original enhanced profile never loaded!');
        console.log('This should not happen. Checking final-profile-fix.js loading...');
    }
}, 5000);

console.log('✅ Direct profile fix loaded and viewLead overridden');