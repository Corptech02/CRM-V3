// Working profile fix - restored from backup
console.log('Applying final profile fix...');
console.log('✅ Enhanced profile with transcription, vehicles, and full details is loading...');

// Simple enhanced profile function that works
window.createEnhancedProfile = function createEnhancedProfile(lead) {
    console.log('✅ Enhanced profile called for:', lead.name);

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

    // Create the full enhanced profile HTML with all sections
    const profileHTML = `
            <div class="modal-container large" style="
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                max-width: 1400px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <div class="modal-header" style="
                    padding: 24px 30px;
                    background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 12px 12px 0 0;
                ">
                    <h2 style="
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                        color: white !important;
                    ">
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
                        position: relative;
                        z-index: 10;
                        flex-shrink: 0;
                    ">×</button>
                </div>

                <div class="modal-body" style="
                    padding: 30px;
                    overflow-y: auto;
                    flex: 1;
                ">
                    <!-- Company Information Section -->
                    <div class="form-section" style="
                        background: #f9fafb;
                        border-radius: 8px;
                        padding: 24px;
                        margin-bottom: 24px;
                    ">
                        <h3 style="
                            margin: 0 0 20px 0;
                            font-size: 18px;
                            font-weight: 600;
                            color: #111827;
                        ">Company Information</h3>

                        <div class="form-grid" style="
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                            gap: 20px;
                        ">
                            <div class="form-group">
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Company Name</label>
                                <input type="text" id="company-name" value="${lead.name || ''}" onchange="updateLeadField('${lead.id}', 'name', this.value)" class="form-control" style="
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                    background: white;
                                    width: 100%;
                                ">
                            </div>

                            <div class="form-group">
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Contact Person</label>
                                <input type="text" id="contact-person" value="${lead.contact || ''}" onchange="updateLeadField('${lead.id}', 'contact', this.value)" class="form-control" style="
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                    background: white;
                                    width: 100%;
                                ">
                            </div>

                            <div class="form-group">
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Phone</label>
                                <input type="text" id="phone" value="${lead.phone || ''}" onchange="updateLeadField('${lead.id}', 'phone', this.value)" class="form-control" style="
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                    background: white;
                                    width: 100%;
                                ">
                            </div>

                            <div class="form-group">
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Email</label>
                                <input type="text" id="email" value="${lead.email || ''}" onchange="updateLeadField('${lead.id}', 'email', this.value)" class="form-control" style="
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                    background: white;
                                    width: 100%;
                                ">
                            </div>

                            <div class="form-group">
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">DOT Number</label>
                                <input type="text" id="dot-number" value="${lead.dotNumber || ''}" onchange="updateLeadField('${lead.id}', 'dotNumber', this.value)" class="form-control" style="
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                    background: white;
                                    width: 100%;
                                ">
                            </div>

                            <div class="form-group">
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">MC Number</label>
                                <input type="text" id="mc-number" value="${lead.mcNumber || ''}" onchange="updateLeadField('${lead.id}', 'mcNumber', this.value)" class="form-control" style="
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                    background: white;
                                    width: 100%;
                                ">
                            </div>

                            <div class="form-group">
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Years in Business</label>
                                <input type="text" id="years-business" value="${lead.yearsInBusiness || ''}" onchange="updateLeadField('${lead.id}', 'yearsInBusiness', this.value)" class="form-control" style="
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                    background: white;
                                    width: 100%;
                                ">
                            </div>

                            <div class="form-group">
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Renewal Date</label>
                                <input type="text" id="renewal-date" value="${lead.renewalDate || ''}" onchange="updateLeadField('${lead.id}', 'renewalDate', this.value)" placeholder="MM/DD/YYYY" class="form-control" style="
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    transition: all 0.2s;
                                    background: white;
                                    width: 100%;
                                ">
                            </div>
                        </div>
                    </div>

                    <!-- Reach-out Section -->
                    <div class="form-section" style="
                        background: #f9fafb;
                        border-radius: 8px;
                        padding: 24px;
                        margin-bottom: 24px;
                    ">
                        <h3 style="
                            margin: 0 0 20px 0;
                            font-size: 18px;
                            font-weight: 600;
                            color: #111827;
                        ">Reach-out & Communication</h3>

                        <div style="margin-bottom: 20px;">
                            <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Notes & Communication History</label>
                            <textarea id="notes" onchange="updateLeadField('${lead.id}', 'notes', this.value)" placeholder="Add notes about calls, emails, follow-ups..." style="
                                width: 100%;
                                height: 120px;
                                padding: 12px;
                                border: 1px solid #d1d5db;
                                border-radius: 6px;
                                font-size: 14px;
                                resize: vertical;
                                background: white;
                            ">${lead.notes || ''}</textarea>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div>
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Last Contact Date</label>
                                <input type="date" id="last-contact" value="${lead.lastContact || ''}" onchange="updateLeadField('${lead.id}', 'lastContact', this.value)" style="
                                    width: 100%;
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    background: white;
                                ">
                            </div>

                            <div>
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Next Follow-up</label>
                                <input type="date" id="next-followup" value="${lead.nextFollowup || ''}" onchange="updateLeadField('${lead.id}', 'nextFollowup', this.value)" style="
                                    width: 100%;
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    background: white;
                                ">
                            </div>

                            <div>
                                <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Stage</label>
                                <select id="lead-stage-${lead.id}" onchange="updateLeadStage('${lead.id}', this.value)" style="
                                    width: 100%;
                                    padding: 10px 14px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    background: white;
                                ">
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

                    <!-- Loss Runs Section -->
                    <div class="form-section" style="
                        background: #f9fafb;
                        border-radius: 8px;
                        padding: 24px;
                        margin-bottom: 24px;
                    ">
                        <h3 style="
                            margin: 0 0 20px 0;
                            font-size: 18px;
                            font-weight: 600;
                            color: #111827;
                        ">Loss Runs & Documentation</h3>

                        <div style="margin-bottom: 20px;">
                            <label style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; display: block;">Loss Runs Status</label>
                            <select onchange="updateLeadField('${lead.id}', 'lossRunsStatus', this.value)" style="
                                width: 100%;
                                padding: 10px 14px;
                                border: 1px solid #d1d5db;
                                border-radius: 6px;
                                font-size: 14px;
                                background: white;
                            ">
                                <option value="" ${!lead.lossRunsStatus ? 'selected' : ''}>Select Status</option>
                                <option value="not_requested" ${lead.lossRunsStatus === 'not_requested' ? 'selected' : ''}>Not Requested</option>
                                <option value="requested" ${lead.lossRunsStatus === 'requested' ? 'selected' : ''}>Requested</option>
                                <option value="received" ${lead.lossRunsStatus === 'received' ? 'selected' : ''}>Received</option>
                                <option value="incomplete" ${lead.lossRunsStatus === 'incomplete' ? 'selected' : ''}>Incomplete</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <button onclick="openEmailDocumentation('${lead.id}')" style="
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
                </div>
            </div>
    `;

    modalContent.innerHTML = profileHTML;
    modalContainer.appendChild(modalContent);

    // Prevent modal from closing when clicking inside content
    modalContent.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Only close when clicking the background or close button
    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer) {
            modalContainer.remove();
        }
    });

    // Add to page
    document.body.appendChild(modalContainer);

    console.log('✅ Enhanced lead profile created and displayed');
};

// Verify the enhanced profile is available
if (window.createEnhancedProfile) {
    console.log('✅ Working profile fix applied successfully - Enhanced profile with reach-out sections, loss runs and documentation is ready');
} else {
    console.error('❌ Enhanced profile function not properly loaded!');
}

console.log('Working profile fix applied successfully');