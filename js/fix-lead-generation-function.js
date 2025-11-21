// Fix for loadLeadGenerationView function not being defined
console.log('Loading lead generation fix...');

// Ensure loadLeadGenerationView is available globally
if (typeof window.loadLeadGenerationView !== 'function') {
    window.loadLeadGenerationView = function(activeTab = 'lookup') {
        console.log('Loading Lead Generation view with tab:', activeTab);

        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) {
            console.error('Dashboard content not found');
            return;
        }

        // Load the lead generation interface
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
                            </div>

                            <div class="search-actions">
                                <button class="btn-primary" onclick="if(typeof performLeadSearch === 'function') performLeadSearch()">
                                    <i class="fas fa-search"></i> Search Database
                                </button>
                                <button class="btn-secondary" onclick="if(typeof clearLeadFilters === 'function') clearLeadFilters()">
                                    <i class="fas fa-eraser"></i> Clear Filters
                                </button>
                            </div>
                        </div>

                        <!-- Results Section -->
                        <div class="lead-results-section" id="leadResults" style="margin-top: 20px;">
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
                                    <tbody id="searchResults">
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
                        <div class="generate-leads-container">
                            <!-- Statistics Section - Always Visible at Top -->
                            <div id="generatedLeadsResults" style="margin-bottom: 1rem;">
                                <div class="results-summary">
                                    <div id="successMessage" style="display: none; margin-bottom: 0.75rem;">
                                        <h3 style="color: #059669; font-size: 1.1rem;">
                                            <i class="fas fa-check-circle"></i> Leads Generated Successfully!
                                        </h3>
                                    </div>
                                    <div class="stats-row" style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                                        <div class="stat-box" style="background: #f0fdf4; padding: 12px; border-radius: 6px; flex: 1;">
                                            <span style="color: #16a34a;">Total Leads Found</span>
                                            <p style="font-weight: bold; color: #15803d; margin: 4px 0 0 0;">
                                                <span id="totalLeadsCount">-</span>
                                            </p>
                                        </div>
                                        <div class="stat-box" style="background: #fef3c7; padding: 12px; border-radius: 6px; flex: 1;">
                                            <span style="color: #d97706;">Expiring Soon</span>
                                            <p style="font-weight: bold; color: #d97706; margin: 4px 0 0 0;">
                                                <span id="expiringSoonCount">-</span>
                                            </p>
                                        </div>
                                        <div class="stat-box" style="background: #dbeafe; padding: 12px; border-radius: 6px; flex: 1;">
                                            <span style="color: #2563eb;">With Contact Info</span>
                                            <p style="font-weight: bold; color: #1d4ed8; margin: 4px 0 0 0;">
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
                                        <label>Insurance Expiring Within</label>
                                        <select class="form-control" id="genExpiry">
                                            <option value="30">30 Days</option>
                                            <option value="45">45 Days</option>
                                            <option value="60">60 Days</option>
                                            <option value="90">90 Days</option>
                                            <option value="120">120 Days</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Skip Days</label>
                                        <select class="form-control" id="genSkipDays">
                                            <option value="0">0 Days (No Skip)</option>
                                            <option value="1">1 Day</option>
                                            <option value="2">2 Days</option>
                                            <option value="3">3 Days</option>
                                            <option value="4">4 Days</option>
                                            <option value="5">5 Days</option>
                                            <option value="7">7 Days</option>
                                            <option value="10">10 Days</option>
                                            <option value="14">14 Days</option>
                                            <option value="21">21 Days</option>
                                            <option value="30">30 Days</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Minimum Fleet Size</label>
                                        <input type="number" class="form-control" id="genMinFleet" placeholder="e.g., 1" value="1">
                                    </div>
                                    <div class="form-group">
                                        <label>Maximum Fleet Size</label>
                                        <input type="number" class="form-control" id="genMaxFleet" placeholder="e.g., 999" value="999">
                                    </div>
                                </div>

                                <div class="form-grid">
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

                                <div class="form-actions" style="margin-top: 1rem;">
                                    <button class="btn-primary" onclick="if(typeof generateLeads === 'function') generateLeads()" style="padding: 10px 24px; font-size: 1rem;">
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
                                    <button class="btn-secondary" onclick="resetGenerateForm()" style="padding: 10px 20px;">
                                        <i class="fas fa-redo"></i> Reset Form
                                    </button>
                                </div>
                            </div>

                            <!-- Results Table Section -->
                            <div id="generateResults" class="results-section" style="margin-top: 20px;"></div>
                        </div>
                    </div>

                </div>
            </div>
        `;

        console.log('Lead Generation view loaded successfully');
    };
}

// Ensure switchLeadSection is also available globally
if (typeof window.switchLeadSection !== 'function') {
    window.switchLeadSection = function(section) {
        console.log('Switching to section:', section);

        // Hide all sections
        const carrierLookup = document.getElementById('carrierLookupSection');
        const generateLeads = document.getElementById('generateLeadsSection');

        if (carrierLookup) carrierLookup.style.display = 'none';
        if (generateLeads) generateLeads.style.display = 'none';

        // Remove active class from all tabs
        document.querySelectorAll('.folder-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected section and activate tab
        if (section === 'lookup' && carrierLookup) {
            carrierLookup.style.display = 'block';
            const tab = document.querySelectorAll('.folder-tab')[0];
            if (tab) tab.classList.add('active');
        } else if (section === 'generate' && generateLeads) {
            generateLeads.style.display = 'block';
            const tab = document.querySelectorAll('.folder-tab')[1];
            if (tab) tab.classList.add('active');
        }
    };
}

console.log('Lead generation fix loaded - functions available:',
    'loadLeadGenerationView:', typeof window.loadLeadGenerationView === 'function',
    'switchLeadSection:', typeof window.switchLeadSection === 'function');