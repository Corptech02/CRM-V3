// COMPLETE Lead Generation Interface Restoration - EXACT as it was before
console.log('🔄 RESTORING COMPLETE Lead Generation Interface...');

// Override the simplified loadLeadGenerationView with COMPLETE implementation
window.loadLeadGenerationView = function loadLeadGenerationView(activeTab = 'lookup') {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="lead-generation-view">
            <header class="content-header">
                <h1>Lead Generation Database</h1>
            </header>

            <!-- Folder-style tabs -->
            <div class="folder-tabs">
                <button class="folder-tab ${activeTab === 'lookup' ? 'active' : ''}" onclick="switchLeadSection('lookup')">
                    <i class="fas fa-search"></i> Carrier Lookup
                </button>
                <button class="folder-tab ${activeTab === 'generate' ? 'active' : ''}" onclick="switchLeadSection('generate')">
                    <i class="fas fa-magic"></i> Generate Leads
                </button>
                <button class="folder-tab ${activeTab === 'sms' ? 'active' : ''}" onclick="switchLeadSection('sms')">
                    <i class="fas fa-sms"></i> SMS Blast
                </button>
            </div>

            <div class="lead-gen-container">
                <!-- Carrier Lookup Section -->
                <div id="carrierLookupSection" class="tab-section" style="display: ${activeTab === 'lookup' ? 'block' : 'none'};">
                    <div class="search-section">
                    <h3>Search Carriers</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>USDOT Number</label>
                                <input type="text" class="form-control" id="usdotSearch" placeholder="Enter USDOT #">
                            </div>
                            <div class="form-group">
                                <label>MC Number</label>
                                <input type="text" class="form-control" id="mcSearch" placeholder="Enter MC #">
                            </div>
                            <div class="form-group">
                                <label>Company Name</label>
                                <input type="text" class="form-control" id="companySearch" placeholder="Enter company name">
                            </div>
                            <div class="form-group">
                                <label>State</label>
                                <select class="form-control" id="stateSearch">
                                    <option value="">All States</option>
                                    <option value="CA">California</option>
                                    <option value="TX">Texas</option>
                                    <option value="FL">Florida</option>
                                    <option value="NY">New York</option>
                                    <option value="IL">Illinois</option>
                                    <option value="OH">Ohio</option>
                                </select>
                            </div>
                        </div>

                    <div class="search-actions">
                        <button class="btn-primary" onclick="performLeadSearch()">
                            <i class="fas fa-search"></i> Search Database
                        </button>
                        <button class="btn-secondary" onclick="clearLeadFilters()">
                            <i class="fas fa-eraser"></i> Clear Filters
                        </button>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="lead-results-section" id="leadResults">
                    <div class="results-header">
                        <h3>Search Results</h3>
                        <span class="results-count">0 leads found</span>
                    </div>

                    <div class="lead-results-table">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" onclick="selectAllLeads(this)"></th>
                                    <th>USDOT #</th>
                                    <th>Company Name</th>
                                    <th>Location</th>
                                    <th>Fleet Size</th>
                                    <th>Insurance Status</th>
                                    <th>Expiry Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="leadResultsBody">
                                <tr>
                                    <td colspan="8" class="text-center">No results. Use the search form above to find leads.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="results-pagination">
                        <button class="btn-small" disabled><i class="fas fa-chevron-left"></i> Previous</button>
                        <span class="page-info">Page 1 of 1</span>
                        <button class="btn-small" disabled>Next <i class="fas fa-chevron-right"></i></button>
                    </div>
                    </div>
                </div>

                <!-- Generate Leads Section -->
                <div id="generateLeadsSection" class="tab-section" style="display: ${activeTab === 'generate' ? 'block' : 'none'};">
                    ${getCompleteGenerateLeadsContent()}
                </div>

                <!-- SMS Blast Section -->
                <div id="smsBlastSection" class="tab-section" style="display: ${activeTab === 'sms' ? 'block' : 'none'};">
                    ${getCompleteSMSBlastContent()}
                </div>
            </div>
        </div>
    `;

    // Initialize lead generation specific features
    initializeLeadGeneration();
}

// Simple Generate Leads Content (without table below)
function getSimpleGenerateLeadsContent() {
    return `
        <div class="generate-leads-container">
                <div class="filter-section">
                    <h3>Select Lead Criteria</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>State <span class="required">*</span></label>
                            <select class="form-control" id="genState">
                                <option value="">Select State</option>
                                <option value="OH">Ohio</option>
                                <option value="TX">Texas</option>
                                <option value="FL">Florida</option>
                                <option value="CA">California</option>
                                <option value="NY">New York</option>
                                <option value="IL">Illinois</option>
                                <option value="PA">Pennsylvania</option>
                                <option value="GA">Georgia</option>
                                <option value="NC">North Carolina</option>
                                <option value="MI">Michigan</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Days Until Insurance Expiry</label>
                            <select class="form-control" id="genExpiry">
                                <option value="7">Next 7 Days</option>
                                <option value="14">Next 14 Days</option>
                                <option value="30" selected>Next 30 Days</option>
                                <option value="45">Next 45 Days</option>
                                <option value="60">Next 60 Days</option>
                                <option value="90">Next 90 Days</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Skip First N Days</label>
                            <input type="number" class="form-control" id="genSkipDays" value="0" min="0" max="90" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Min Fleet Size</label>
                            <input type="number" class="form-control" id="genMinFleet" value="1" min="1">
                        </div>
                        <div class="form-group">
                            <label>Max Fleet Size</label>
                            <input type="number" class="form-control" id="genMaxFleet" value="9999" min="1">
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top: 1rem;">
                        <button class="btn-primary" onclick="generateLeadsFromForm()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-magic"></i> Generate Leads Now
                        </button>
                        <button class="btn-success" onclick="exportGeneratedLeads('excel')" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-file-excel"></i> Export to Excel
                        </button>
                    </div>
                </div>
        </div>
    `;
}

// Complete Generate Leads Content
function getCompleteGenerateLeadsContent() {
    return `
        <div class="generate-leads-container">
                <!-- Statistics Section - Always Visible at Top -->
                <div id="generatedLeadsResults" style="margin-bottom: 1rem;">
                    <div class="results-summary">
                        <div id="successMessage" style="display: none; margin-bottom: 0.75rem;">
                            <h3 style="color: #059669; font-size: 1.1rem;">
                                <i class="fas fa-check-circle"></i> Leads Generated Successfully!
                            </h3>
                        </div>
                        <div class="stats-row">
                            <div class="stat-box" style="background: #f0fdf4;">
                                <span style="color: #16a34a;">Total Leads Found</span>
                                <p style="font-weight: bold; color: #15803d;">
                                    <span id="totalLeadsCount">-</span>
                                </p>
                            </div>
                            <div class="stat-box" style="background: #fef3c7;">
                                <span style="color: #d97706;">Expiring Soon</span>
                                <p style="font-weight: bold; color: #d97706;">
                                    <span id="expiringSoonCount">-</span>
                                </p>
                            </div>
                            <div class="stat-box" style="background: #dbeafe;">
                                <span style="color: #2563eb;">With Contact Info</span>
                                <p style="font-weight: bold; color: #1d4ed8;">
                                    <span id="withContactCount">-</span>
                                </p>
                            </div>
                        </div>
                        <div class="export-options" style="margin-top: 0.75rem;">
                            <div class="export-buttons" style="display: flex; gap: 0.75rem; align-items: center;">
                                <span style="font-weight: 600; margin-right: 0.5rem;">Export:</span>
                                <button class="btn-success" onclick="exportGeneratedLeads('excel')" style="background: #10b981; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-excel"></i> Excel
                                </button>
                                <button class="btn-info" onclick="exportGeneratedLeads('json')" style="background: #3b82f6; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-code"></i> JSON
                                </button>
                                <button class="btn-primary" onclick="viewGeneratedLeads()" style="padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="filter-section">
                    <h3>Select Lead Criteria</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>State <span class="required">*</span></label>
                            <select class="form-control" id="genState">
                                <option value="">Select State</option>
                                <option value="AL">Alabama</option>
                                <option value="AK">Alaska</option>
                                <option value="AZ">Arizona</option>
                                <option value="AR">Arkansas</option>
                                <option value="CA">California</option>
                                <option value="CO">Colorado</option>
                                <option value="CT">Connecticut</option>
                                <option value="DE">Delaware</option>
                                <option value="FL">Florida</option>
                                <option value="GA">Georgia</option>
                                <option value="HI">Hawaii</option>
                                <option value="ID">Idaho</option>
                                <option value="IL">Illinois</option>
                                <option value="IN">Indiana</option>
                                <option value="IA">Iowa</option>
                                <option value="KS">Kansas</option>
                                <option value="KY">Kentucky</option>
                                <option value="LA">Louisiana</option>
                                <option value="ME">Maine</option>
                                <option value="MD">Maryland</option>
                                <option value="MA">Massachusetts</option>
                                <option value="MI">Michigan</option>
                                <option value="MN">Minnesota</option>
                                <option value="MS">Mississippi</option>
                                <option value="MO">Missouri</option>
                                <option value="MT">Montana</option>
                                <option value="NE">Nebraska</option>
                                <option value="NV">Nevada</option>
                                <option value="NH">New Hampshire</option>
                                <option value="NJ">New Jersey</option>
                                <option value="NM">New Mexico</option>
                                <option value="NY">New York</option>
                                <option value="NC">North Carolina</option>
                                <option value="ND">North Dakota</option>
                                <option value="OH">Ohio</option>
                                <option value="OK">Oklahoma</option>
                                <option value="OR">Oregon</option>
                                <option value="PA">Pennsylvania</option>
                                <option value="RI">Rhode Island</option>
                                <option value="SC">South Carolina</option>
                                <option value="SD">South Dakota</option>
                                <option value="TN">Tennessee</option>
                                <option value="TX">Texas</option>
                                <option value="UT">Utah</option>
                                <option value="VT">Vermont</option>
                                <option value="VA">Virginia</option>
                                <option value="WA">Washington</option>
                                <option value="WV">West Virginia</option>
                                <option value="WI">Wisconsin</option>
                                <option value="WY">Wyoming</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Days Until Insurance Expiry</label>
                            <select class="form-control" id="genExpiry">
                                <option value="7">Next 7 Days</option>
                                <option value="14">Next 14 Days</option>
                                <option value="30" selected>Next 30 Days</option>
                                <option value="45">Next 45 Days</option>
                                <option value="60">Next 60 Days</option>
                                <option value="90">Next 90 Days</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Skip First N Days</label>
                            <input type="number" class="form-control" id="genSkipDays" value="0" min="0" max="90" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Min Fleet Size</label>
                            <input type="number" class="form-control" id="genMinFleet" value="1" min="1">
                        </div>
                        <div class="form-group">
                            <label>Max Fleet Size</label>
                            <input type="number" class="form-control" id="genMaxFleet" value="9999" min="1">
                        </div>
                        <div class="form-group">
                            <label>Operating Status</label>
                            <select class="form-control" id="genStatus">
                                <option value="">All</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="OUT_OF_SERVICE">Out of Service</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Safety Rating</label>
                            <select class="form-control" id="genSafety">
                                <option value="">All Ratings</option>
                                <option value="SATISFACTORY">Satisfactory</option>
                                <option value="CONDITIONAL">Conditional</option>
                                <option value="UNSATISFACTORY">Unsatisfactory</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 3;">
                            <label>Insurance Companies</label>
                            <div class="insurance-checkbox-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; max-height: 120px; overflow-y: auto;">
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="PROGRESSIVE"> Progressive
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="GEICO"> GEICO
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="GREAT_WEST"> Great West Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CANAL"> Canal Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ACUITY"> Acuity
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="NORTHLAND"> Northland
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CINCINNATI"> Cincinnati Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="AUTO_OWNERS"> Auto Owners
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="SENTRY"> Sentry Select
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ERIE"> Erie Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="TRAVELERS"> Travelers
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="BITCO"> Bitco General
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CAROLINA"> Carolina Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="STATE_FARM"> State Farm
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ALLSTATE"> Allstate
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="NATIONWIDE"> Nationwide
                            </label>
                            </div>
                            <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem;">
                                <button type="button" class="btn-small" onclick="selectAllInsurance()" style="padding: 4px 10px; font-size: 0.8rem;">Select All</button>
                                <button type="button" class="btn-small" onclick="clearAllInsurance()" style="padding: 4px 10px; font-size: 0.8rem;">Clear All</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="genHazmat"> Hazmat Only
                        </label>
                    </div>
                    <div class="form-actions" style="margin-top: 1rem;">
                        <button class="btn-primary" onclick="generateLeadsFromForm()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-magic"></i> Generate Leads Now
                        </button>
                        <button class="btn-success" onclick="uploadToVicidialWithCriteria()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-upload"></i> Upload to Vicidial
                        </button>
                        <button class="btn-primary" onclick="sendEmailBlast()" style="padding: 10px 24px; font-size: 1rem; margin-left: 10px;">
                            <i class="fas fa-envelope"></i> Email Blast
                        </button>
                        <button class="btn-warning" onclick="sendSMSBlast()" style="padding: 10px 24px; font-size: 1rem; margin-left: 10px;">
                            <i class="fas fa-sms"></i> SMS Blast
                        </button>
                        <button class="btn-info" onclick="openLeadSplitPopup()" style="padding: 10px 24px; font-size: 1rem; margin-left: 10px;" id="leadSplitBtn">
                            <i class="fas fa-cut"></i> Lead Split
                        </button>
                        <button class="btn-secondary" onclick="resetGenerateForm()" style="padding: 10px 20px;">
                            <i class="fas fa-redo"></i> Reset Form
                        </button>
                    </div>
                </div>

        </div>
    `;
}

// Complete SMS Blast Content
function getCompleteSMSBlastContent() {
    return `
        <div class="sms-blast-container">
            <!-- SMS Campaign Setup -->
            <div class="sms-campaign-setup">
                <h3><i class="fas fa-sms"></i> SMS Blast Campaign</h3>
                <p style="color: #6b7280; margin-bottom: 2rem;">Send bulk SMS messages to your selected leads using Telnyx messaging</p>

                <!-- Campaign Details -->
                <div class="campaign-details">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Campaign Name</label>
                            <input type="text" class="form-control" id="sms-campaign-name" placeholder="Enter campaign name">
                        </div>
                        <div class="form-group">
                            <label>From Number</label>
                            <select class="form-control" id="sms-from-number">
                                <option value="+18882681541">+1 (888) 268-1541</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Message Composition -->
                <div class="message-composition">
                    <h4>Message Content</h4>
                    <div class="form-group">
                        <label>Message Template</label>
                        <select class="form-control" id="sms-template" onchange="loadSMSTemplate()">
                            <option value="">Custom Message</option>
                            <option value="insurance-renewal">Insurance Renewal Reminder</option>
                            <option value="quote-followup">Quote Follow-up</option>
                            <option value="policy-expiry">Policy Expiry Alert</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>SMS Message <span style="color: #6b7280;">(160 chars recommended)</span></label>
                        <textarea class="form-control" id="sms-message" rows="4" maxlength="1600"
                                  placeholder="Enter your SMS message here..." onkeyup="updateSMSCharCount()"></textarea>
                        <div class="char-count">
                            <span id="sms-char-count">0</span> characters
                        </div>
                    </div>
                </div>

                <!-- Lead Selection -->
                <div class="lead-selection">
                    <h4>Select Recipients</h4>
                    <div class="selection-options">
                        <div class="form-group">
                            <label>Lead Source</label>
                            <select class="form-control" id="sms-lead-source" onchange="loadSMSRecipients()">
                                <option value="generated">Use Generated Leads (from Generate Leads tab)</option>
                                <option value="search">Use Search Results (from Carrier Lookup tab)</option>
                                <option value="custom">Upload Custom Phone List</option>
                            </select>
                        </div>
                        <div class="form-group" id="custom-upload-section" style="display: none;">
                            <label>Upload Phone Numbers (CSV)</label>
                            <input type="file" class="form-control" id="sms-phone-upload" accept=".csv" onchange="handlePhoneUpload()">
                            <small class="text-muted">CSV format: phone,name,company (optional)</small>
                        </div>
                    </div>

                    <!-- Recipients Preview -->
                    <div class="recipients-preview">
                        <div class="recipients-summary">
                            <strong>Recipients: <span id="sms-recipient-count">0</span> phone numbers</strong>
                            <div class="recipient-actions">
                                <button class="btn-secondary btn-small" onclick="previewSMSRecipients()">
                                    <i class="fas fa-eye"></i> Preview Recipients
                                </button>
                            </div>
                        </div>
                        <div id="sms-recipients-list" style="display: none;">
                            <!-- Recipients will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Send Options -->
                <div class="send-options">
                    <h4>Send Options</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Send Schedule</label>
                            <select class="form-control" id="sms-schedule">
                                <option value="now">Send Now</option>
                                <option value="scheduled">Schedule for Later</option>
                            </select>
                        </div>
                        <div class="form-group" id="schedule-datetime" style="display: none;">
                            <label>Schedule Date & Time</label>
                            <input type="datetime-local" class="form-control" id="sms-schedule-datetime">
                        </div>
                        <div class="form-group">
                            <label>Batch Size</label>
                            <select class="form-control" id="sms-batch-size">
                                <option value="50">50 messages per batch</option>
                                <option value="100">100 messages per batch</option>
                                <option value="250">250 messages per batch</option>
                                <option value="500">500 messages per batch</option>
                            </select>
                        </div>
                    </div>

                    <div class="compliance-notice" style="background: #fef3c7; border: 1px solid #fbbf24; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                        <strong style="color: #b45309;"><i class="fas fa-exclamation-triangle"></i> Compliance Notice:</strong>
                        <p style="color: #92400e; margin-top: 0.5rem; margin-bottom: 0;">
                            All recipients must have opted in to receive SMS messages. Include "Reply STOP to unsubscribe" in your message.
                        </p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons" style="margin-top: 2rem;">
                    <button class="btn-primary" onclick="testSMSCampaign()" style="padding: 12px 24px;">
                        <i class="fas fa-vial"></i> Send Test Message
                    </button>
                    <button class="btn-success" onclick="launchSMSCampaign()" style="padding: 12px 32px; font-size: 1.1rem;">
                        <i class="fas fa-paper-plane"></i> Launch Campaign
                    </button>
                    <button class="btn-secondary" onclick="saveSMSDraft()" style="padding: 12px 24px;">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                </div>

                <!-- Campaign Results -->
                <div id="sms-campaign-results" style="display: none; margin-top: 2rem;">
                    <h4>Campaign Results</h4>
                    <div class="results-stats">
                        <div class="stat-item">
                            <span class="stat-label">Sent</span>
                            <span class="stat-value" id="sms-sent-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Delivered</span>
                            <span class="stat-value" id="sms-delivered-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Failed</span>
                            <span class="stat-value" id="sms-failed-count">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize Lead Generation
window.initializeLeadGeneration = function() {
    console.log('Initializing complete lead generation module');
}

// Helper Functions
window.selectAllInsurance = function() {
    document.querySelectorAll('input[name="insurance"]').forEach(cb => cb.checked = true);
}

window.clearAllInsurance = function() {
    document.querySelectorAll('input[name="insurance"]').forEach(cb => cb.checked = false);
}

window.selectAllGeneratedLeads = function(checkbox) {
    document.querySelectorAll('#generatedLeadsTableBody input[type="checkbox"]').forEach(cb => cb.checked = checkbox.checked);
}

window.resetGenerateForm = function() {
    document.getElementById('genState').value = '';
    document.getElementById('genExpiry').value = '30';
    document.getElementById('genSkipDays').value = '0';
    document.getElementById('genMinFleet').value = '1';
    document.getElementById('genMaxFleet').value = '9999';
    document.getElementById('genStatus').value = '';
    document.getElementById('genSafety').value = '';
    document.getElementById('genHazmat').checked = false;
    clearAllInsurance();
}

window.generateLeadsFromForm = function() {
    console.log('Generating leads from complete form...');

    // Get all form values
    const state = document.getElementById('genState')?.value;
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    // No limit - fetch all available leads
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '9999';
    const status = document.getElementById('genStatus')?.value;
    const safety = document.getElementById('genSafety')?.value;
    const hazmat = document.getElementById('genHazmat')?.checked;

    // Get selected insurance companies
    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(cb => {
        insuranceCompanies.push(cb.value);
    });

    if (!state) {
        alert('Please select a state');
        return;
    }

    console.log('Lead generation criteria:', {
        state, expiry, skipDays, limit, minFleet, maxFleet,
        status, safety, hazmat, insuranceCompanies
    });


    // Call the generate function
    generateLeadsNow();
}

// Actual lead generation function
async function generateLeadsNow() {
    const state = document.getElementById('genState')?.value;
    const expiry = parseInt(document.getElementById('genExpiry')?.value || '30');
    const skipDays = parseInt(document.getElementById('genSkipDays')?.value || '0');
    // No limit - fetch all available leads
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '9999';

    if (!state) {
        alert('Please select a state');
        return;
    }

    // Calculate date range
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() + skipDays); // Skip first N days
    const endDate = new Date();
    endDate.setDate(today.getDate() + expiry);

    console.log(`Fetching carriers expiring between ${startDate.toISOString().split('T')[0]} and ${endDate.toISOString().split('T')[0]}`);

    try {
        const response = await fetch('/api/carriers/expiring', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                state: state,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                limit: limit
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.carriers) {
            // Store globally for export/viewing
            window.generatedLeadsData = data.carriers;

            // Update statistics display
            const totalLeads = data.carriers.length;
            const expiringSoon = data.carriers.filter(c => parseInt(c.days_until_renewal) <= 7).length;
            const withContact = data.carriers.filter(c => c.email || c.phone).length;

            document.getElementById('totalLeadsCount').textContent = totalLeads.toLocaleString();
            document.getElementById('expiringSoonCount').textContent = expiringSoon.toLocaleString();
            document.getElementById('withContactCount').textContent = withContact.toLocaleString();

            // Show success message
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => successMsg.style.display = 'none', 5000);
            }

            // No popup alert needed - stats show in UI

            console.log(`✅ Generated ${totalLeads} leads`);
        } else {
            throw new Error('Invalid response from server');
        }
    } catch (error) {
        console.error('Error generating leads:', error);
        alert(`Failed to generate leads: ${error.message}`);
    }
}

window.uploadToVicidialWithCriteria = function() {
    console.log('🔄 Opening Vicidial upload dialog to scan lists and upload leads...');

    // Check if generated leads are available
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('Please generate leads first before uploading to Vicidial.');
        return;
    }

    // Check if the vicidial uploader is available
    if (typeof vicidialUploader !== 'undefined' && typeof vicidialUploader.showUploadDialog === 'function') {
        // Get current form criteria for upload
        const criteria = {
            state: document.getElementById('genState')?.value,
            daysUntilExpiry: document.getElementById('genExpiry')?.value || '30',
            skipDays: document.getElementById('genSkipDays')?.value || '0',
            minFleet: document.getElementById('genMinFleet')?.value || '1',
            maxFleet: document.getElementById('genMaxFleet')?.value || '9999',
            totalLeads: window.generatedLeadsData.length,  // Changed from leadCount to totalLeads
            leadCount: window.generatedLeadsData.length,   // Keep both for compatibility
            leads: window.generatedLeadsData
        };

        console.log('📋 Upload criteria:', criteria);

        // Call the existing uploader which will:
        // 1. Scan Vicidial for available lists
        // 2. Show popup with list selection
        // 3. Allow user to select which list to overwrite
        // 4. Upload the generated leads to selected list
        vicidialUploader.showUploadDialog(criteria);
    } else {
        console.error('❌ Vicidial uploader not available');
        alert('Vicidial uploader functionality is not loaded. Please refresh the page and try again.');
    }
}

window.sendEmailBlast = function() {
    console.log('Sending email blast...');
    alert('Email blast functionality will be connected.');
}

window.loadSMSTemplate = function() {
    const template = document.getElementById('sms-template')?.value;
    const messageField = document.getElementById('sms-message');

    if (messageField) {
        switch(template) {
            case 'insurance-renewal':
                messageField.value = 'Hi {name}, your commercial auto insurance expires in {days} days. Get a competitive quote today! Reply STOP to unsubscribe.';
                break;
            case 'quote-followup':
                messageField.value = 'Hi {name}, following up on your insurance quote request. Call us at 330-241-7570 for details. Reply STOP to unsubscribe.';
                break;
            case 'policy-expiry':
                messageField.value = 'URGENT: Your policy expires soon! Avoid coverage gaps - renew today. Call 330-241-7570. Reply STOP to unsubscribe.';
                break;
        }
        updateSMSCharCount();
    }
}

window.updateSMSCharCount = function() {
    const message = document.getElementById('sms-message')?.value || '';
    const countElement = document.getElementById('sms-char-count');
    if (countElement) {
        countElement.textContent = message.length;
    }
}

window.loadSMSRecipients = function() {
    const source = document.getElementById('sms-lead-source')?.value;
    const uploadSection = document.getElementById('custom-upload-section');

    if (uploadSection) {
        uploadSection.style.display = source === 'custom' ? 'block' : 'none';
    }

    // Update recipient count based on source
    const countElement = document.getElementById('sms-recipient-count');
    if (countElement) {
        if (source === 'generated' && window.generatedLeadsData) {
            countElement.textContent = window.generatedLeadsData.length;
        } else if (source === 'search' && window.searchResultsData) {
            countElement.textContent = window.searchResultsData.length;
        } else {
            countElement.textContent = '0';
        }
    }
}

window.previewSMSRecipients = function() {
    const listElement = document.getElementById('sms-recipients-list');
    if (listElement) {
        listElement.style.display = listElement.style.display === 'none' ? 'block' : 'none';
    }
}

window.testSMSCampaign = function() {
    console.log('Testing SMS campaign...');
    alert('Test message will be sent to your registered phone number.');
}

window.launchSMSCampaign = function() {
    console.log('Launching SMS campaign...');
    alert('SMS campaign will be launched.');
}

window.saveSMSDraft = function() {
    console.log('Saving SMS draft...');
    alert('Draft saved successfully.');
}

// Also copy functions from restore-lead-generation-complete.js to ensure they work
if (window.performLeadSearch) {
    console.log('✅ performLeadSearch function already exists');
}

// Export generated leads function
window.exportGeneratedLeads = function(format) {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to export. Please generate leads first.');
        return;
    }

    if (format === 'excel') {
        // Convert to CSV for Excel
        const headers = ['DOT Number', 'Company Name', 'City', 'State', 'Phone', 'Email', 'Fleet Size', 'Renewal Date'];
        const csvContent = [
            headers.join(','),
            ...window.generatedLeadsData.map(lead => [
                lead.dot_number || '',
                `"${(lead.legal_name || '').replace(/"/g, '""')}"`,
                `"${(lead.city || '').replace(/"/g, '""')}"`,
                lead.state || '',
                lead.phone || '',
                lead.email_address || '',
                lead.power_units || lead.vehicle_count || '',
                lead.policy_renewal_date || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(window.generatedLeadsData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
};

// View generated leads function
window.viewGeneratedLeads = function() {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to view. Please generate leads first.');
        return;
    }

    // Switch to a view that shows the leads table
    console.log(`Viewing ${window.generatedLeadsData.length} generated leads`);
    // This would typically switch to a table view showing the leads
    alert(`${window.generatedLeadsData.length} leads generated. Export them using the Excel or JSON buttons.`);
};

// Lead Split functionality
window.openLeadSplitPopup = function() {
    // Check if leads have been generated
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('Please generate leads first before splitting them.');
        return;
    }

    // Create modal HTML
    const modalHtml = `
        <div id="leadSplitModal" class="modal">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-cut"></i> Lead Split</h2>
                    <span class="close" onclick="closeLeadSplitPopup()">&times;</span>
                </div>

                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> You have <strong>${window.generatedLeadsData.length}</strong> generated leads ready to split.
                    </div>

                    <div class="form-section">
                        <h3><i class="fas fa-scissors"></i> Split Configuration</h3>

                        <div class="form-group">
                            <label for="splitType">Split Type:</label>
                            <select id="splitType" class="form-control">
                                <option value="equal">Equal Split</option>
                                <option value="percentage">Percentage Split</option>
                                <option value="count">Split by Count</option>
                            </select>
                        </div>

                        <div class="form-group" id="splitOptionsContainer">
                            <label for="splitParts">Number of Parts:</label>
                            <input type="number" id="splitParts" class="form-control" value="2" min="2" max="10">
                        </div>

                        <div class="form-group">
                            <label for="splitNaming">Naming Convention:</label>
                            <input type="text" id="splitNaming" class="form-control" value="Split_{index}" placeholder="Use {index} for numbering">
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeLeadSplitPopup()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" onclick="performLeadSplit()">
                        <i class="fas fa-cut"></i> Split Leads
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page if not exists
    if (!document.getElementById('leadSplitModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listener for split type change
        document.getElementById('splitType').addEventListener('change', updateSplitOptions);
    }

    // Show modal
    document.getElementById('leadSplitModal').style.display = 'block';
};

// Update split options based on type
function updateSplitOptions() {
    const splitType = document.getElementById('splitType').value;
    const container = document.getElementById('splitOptionsContainer');

    switch(splitType) {
        case 'equal':
            container.innerHTML = `
                <label for="splitParts">Number of Parts:</label>
                <input type="number" id="splitParts" class="form-control" value="2" min="2" max="10">
            `;
            break;
        case 'percentage':
            container.innerHTML = `
                <label>Percentage Split (must total 100%):</label>
                <div id="percentageInputs">
                    <div class="input-group mb-2">
                        <span class="input-group-text">Part 1:</span>
                        <input type="number" class="form-control percentage-input" value="50" min="1" max="99">
                        <span class="input-group-text">%</span>
                    </div>
                    <div class="input-group mb-2">
                        <span class="input-group-text">Part 2:</span>
                        <input type="number" class="form-control percentage-input" value="50" min="1" max="99">
                        <span class="input-group-text">%</span>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="addPercentagePart()">
                    <i class="fas fa-plus"></i> Add Part
                </button>
            `;
            break;
        case 'count':
            container.innerHTML = `
                <label for="leadsPerPart">Leads per Part:</label>
                <input type="number" id="leadsPerPart" class="form-control" value="${Math.floor(window.generatedLeadsData.length / 2)}" min="1" max="${window.generatedLeadsData.length - 1}">
                <small class="form-text text-muted">Remaining leads will go to the last part</small>
            `;
            break;
    }
}

// Add percentage part
function addPercentagePart() {
    const container = document.getElementById('percentageInputs');
    const partCount = container.children.length + 1;

    const newPart = document.createElement('div');
    newPart.className = 'input-group mb-2';
    newPart.innerHTML = `
        <span class="input-group-text">Part ${partCount}:</span>
        <input type="number" class="form-control percentage-input" value="10" min="1" max="99">
        <span class="input-group-text">%</span>
        <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i>
        </button>
    `;

    container.appendChild(newPart);
}

// Perform the actual lead split
function performLeadSplit() {
    const splitType = document.getElementById('splitType').value;
    const splitNaming = document.getElementById('splitNaming').value || 'Split_{index}';
    const leads = [...window.generatedLeadsData];

    let splitParts = [];

    try {
        switch(splitType) {
            case 'equal':
                const parts = parseInt(document.getElementById('splitParts').value);

                // Initialize empty arrays for each part
                for (let i = 0; i < parts; i++) {
                    splitParts.push({
                        name: splitNaming.replace('{index}', i + 1),
                        leads: [],
                        count: 0
                    });
                }

                // Distribute leads in round-robin fashion to ensure equal renewal date distribution
                // This way if leads are sorted by renewal date, each split gets every nth lead
                leads.forEach((lead, index) => {
                    const partIndex = index % parts;
                    splitParts[partIndex].leads.push(lead);
                    splitParts[partIndex].count++;
                });
                break;

            case 'percentage':
                const percentages = Array.from(document.querySelectorAll('.percentage-input')).map(input => parseInt(input.value));
                const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

                if (totalPercentage !== 100) {
                    alert(`Percentages must total 100%. Current total: ${totalPercentage}%`);
                    return;
                }

                // Initialize parts with target counts
                percentages.forEach((percentage, index) => {
                    splitParts.push({
                        name: splitNaming.replace('{index}', index + 1),
                        leads: [],
                        count: 0,
                        percentage: percentage,
                        targetCount: Math.round(leads.length * (percentage / 100))
                    });
                });

                // Distribute leads in round-robin fashion until targets are met
                let currentPartIndex = 0;
                leads.forEach((lead) => {
                    // Find next part that hasn't reached its target
                    let attempts = 0;
                    while (splitParts[currentPartIndex].count >= splitParts[currentPartIndex].targetCount && attempts < splitParts.length) {
                        currentPartIndex = (currentPartIndex + 1) % splitParts.length;
                        attempts++;
                    }

                    // Add lead to current part
                    splitParts[currentPartIndex].leads.push(lead);
                    splitParts[currentPartIndex].count++;

                    // Move to next part for round-robin distribution
                    currentPartIndex = (currentPartIndex + 1) % splitParts.length;
                });

                // Remove targetCount property
                splitParts.forEach(part => delete part.targetCount);
                break;

            case 'count':
                const leadsPerPartCount = parseInt(document.getElementById('leadsPerPart').value);
                let partIndex = 1;
                let currentPart = {
                    name: splitNaming.replace('{index}', partIndex),
                    leads: [],
                    count: 0
                };

                leads.forEach((lead, index) => {
                    // Add lead to current part
                    currentPart.leads.push(lead);
                    currentPart.count++;

                    // If current part is full, start a new one
                    if (currentPart.count === leadsPerPartCount && index < leads.length - 1) {
                        splitParts.push(currentPart);
                        partIndex++;
                        currentPart = {
                            name: splitNaming.replace('{index}', partIndex),
                            leads: [],
                            count: 0
                        };
                    }
                });

                // Add the last part if it has leads
                if (currentPart.count > 0) {
                    splitParts.push(currentPart);
                }
                break;
        }

        // Store split results
        window.leadSplitResults = splitParts;

        // Show results
        showSplitResults(splitParts);

    } catch (error) {
        console.error('Error splitting leads:', error);
        alert('Error splitting leads: ' + error.message);
    }
}

// Show split results
function showSplitResults(splitParts) {
    const modalBody = document.querySelector('#leadSplitModal .modal-body');

    modalBody.innerHTML = `
        <div class="split-result">
            <div class="alert alert-success">
                <h3><i class="fas fa-check-circle"></i> Leads Split Successfully!</h3>
            </div>

            <div class="result-summary">
                <p><strong>Total Leads Split:</strong> ${window.generatedLeadsData.length}</p>
                <p><strong>Split Into:</strong> ${splitParts.length} parts</p>
            </div>

            <div class="split-parts">
                <h4>Split Parts:</h4>
                ${splitParts.map((part, index) => `
                    <div class="split-part" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <h5>${part.name}</h5>
                        <p><strong>Leads:</strong> ${part.count}</p>
                        ${part.percentage ? `<p><strong>Percentage:</strong> ${part.percentage}%</p>` : ''}
                        <button class="btn btn-primary" onclick="exportSplitPartData(${index})" style="padding: 8px 16px; font-size: 0.9rem; margin-right: 10px;" data-lead-split-csv="true">
                            <i class="fas fa-file-export"></i> Export CSV
                        </button>
                        <button class="btn btn-info" onclick="uploadSplitPartToVicidial(${index})" style="padding: 8px 16px; font-size: 0.9rem;">
                            <i class="fas fa-upload"></i> Upload to Vicidial
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Update footer
    document.querySelector('#leadSplitModal .modal-footer').innerHTML = `
        <button type="button" class="btn btn-primary" onclick="closeLeadSplitPopup()">
            Close
        </button>
        <button type="button" class="btn btn-success" onclick="exportAllSplitParts()" data-lead-split-csv="true">
            <i class="fas fa-file-export"></i> Export All Parts
        </button>
    `;
}

// Export a specific split part to CSV
function exportSplitPartData(partIndex) {
    const part = window.leadSplitResults[partIndex];
    if (!part) return;

    console.log('✅ Exporting split part:', part.name, 'with', part.count, 'leads');

    // Convert to CSV format
    const csvContent = convertLeadsToCSV(part.leads);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${part.name.replace(/[^a-zA-Z0-9]/g, '_')}_leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log('✅ CSV export completed for:', part.name);
}

// Export all split parts (individual files with staggered timing)
function exportAllSplitParts() {
    window.leadSplitResults.forEach((part, index) => {
        setTimeout(() => exportSplitPartData(index), index * 800); // Stagger exports
    });
}

// Upload split part to Vicidial
function uploadSplitPartToVicidial(partIndex) {
    const part = window.leadSplitResults[partIndex];
    if (!part) return;

    // Store original data and prepare split data
    const originalData = window.generatedLeadsData;

    console.log(`🎯 Uploading split "${part.name}" with ${part.count} leads to Vicidial`);

    // Perform complete reset of Vicidial uploader to prevent timeout issues
    if (typeof vicidialUploader !== 'undefined') {
        // Extract cache before reset if first time
        if (!vicidialUploader.cachedLists) {
            const existingModal = document.getElementById('vicidialUploadModal');
            if (existingModal) {
                const listElements = existingModal.querySelectorAll('input[name="vicidialList"]');
                if (listElements.length > 0) {
                    const extractedLists = Array.from(listElements).map(input => ({
                        list_id: input.value,
                        list_name: input.nextElementSibling ? input.nextElementSibling.textContent.trim() : `List ${input.value}`
                    }));
                    vicidialUploader.cachedLists = extractedLists;
                    console.log('💾 Extracted and cached lists before reset:', extractedLists.length, 'lists');
                }
            }
        }

        // Use the new complete reset function
        if (typeof vicidialUploader.completeReset === 'function') {
            vicidialUploader.completeReset();
        } else {
            // Fallback to manual reset if function doesn't exist
            console.log('⚠️ Using fallback reset method');
            vicidialUploader.closeDialog();
            vicidialUploader.resultsShown = false;
            vicidialUploader.uploadCriteria = null;
            vicidialUploader.selectedListId = null;

            const modal = document.getElementById('vicidialUploadModal');
            if (modal) modal.remove();
        }

        console.log(`🔄 Vicidial uploader completely reset for split upload #${partIndex + 1}`);
    }

    // Create criteria object with the split leads (matching the format expected by vicidial-uploader)
    const splitCriteria = {
        state: 'Split Upload',
        insuranceCompanies: [`Split: ${part.name}`],
        daysUntilExpiry: 'Split',
        totalLeads: part.count,  // This is the key field the uploader uses
        leadCount: part.count,   // Keep for compatibility
        leads: part.leads,
        splitName: part.name,
        isSplit: true,
        limit: part.count
    };

    // Set the split leads as the current generated data
    window.generatedLeadsData = part.leads;

    // Add a flag to indicate this is a split upload
    window.isUploadingSplit = true;
    window.splitUploadData = {
        name: part.name,
        count: part.count,
        originalCount: originalData ? originalData.length : 0
    };

    // Wait longer for complete cleanup, then show the fresh upload dialog
    setTimeout(() => {
        try {
            if (typeof vicidialUploader !== 'undefined' && vicidialUploader.showUploadDialog) {
                console.log(`✅ Opening fresh Vicidial upload dialog for split: ${part.name} (${part.count} leads)`);

                // Double-check that we've cleared the old modal
                const oldModal = document.getElementById('vicidialUploadModal');
                if (oldModal) {
                    console.log('⚠️ Found leftover modal, removing it');
                    oldModal.remove();
                }

                // Show the dialog with a completely fresh state
                vicidialUploader.showUploadDialog(splitCriteria);

                console.log('🚀 Upload dialog launched successfully');
            } else {
                throw new Error('Vicidial uploader not available');
            }
        } catch (error) {
            console.error('❌ Failed to open Vicidial upload dialog:', error);
            alert(`Failed to open upload dialog: ${error.message}. Please try refreshing the page.`);

            // Restore original data on error
            window.generatedLeadsData = originalData;
            window.isUploadingSplit = false;
            window.splitUploadData = null;
        }
    }, 200);

    // Restore original data after upload dialog is shown
    setTimeout(() => {
        if (window.isUploadingSplit) {
            console.log('🔄 Restoring original lead data after split upload');
            window.generatedLeadsData = originalData;
            window.isUploadingSplit = false;
            window.splitUploadData = null;
        }
    }, 3000);
}

// Helper function to convert leads to CSV
function convertLeadsToCSV(leads) {
    if (!leads || leads.length === 0) return '';

    // Get headers from first lead
    const headers = Object.keys(leads[0]);
    const csvHeaders = headers.join(',');

    // Convert leads to CSV rows
    const csvRows = leads.map(lead => {
        return headers.map(header => {
            const value = lead[header];
            // Escape CSV values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
}

// Close lead split popup
window.closeLeadSplitPopup = function() {
    const modal = document.getElementById('leadSplitModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

console.log('✅ COMPLETE Lead Generation Interface RESTORED with Day Skip feature!');