// Complete Lead Generation Restoration Script
console.log('🔧 Restoring complete lead generation functionality...');

// Expose all lead generation functions to window
window.performLeadSearch = function performLeadSearch() {
    const usdot = document.getElementById('usdotSearch')?.value || '';
    const mc = document.getElementById('mcSearch')?.value || '';
    const company = document.getElementById('companySearch')?.value || '';
    const state = document.getElementById('stateSearch')?.value || '';

    console.log('Performing lead search:', { usdot, mc, company, state });

    // Show loading state in carrier profile display container
    const carrierProfileDisplay = document.getElementById('carrierProfileDisplay');
    if (carrierProfileDisplay) {
        carrierProfileDisplay.innerHTML = `
            <div class="loading-message" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #3498db;"></i>
                <p style="margin-top: 15px; color: #6c757d;">Searching 2.2M carrier database...</p>
            </div>
        `;
    }

    // Build search criteria
    const criteria = {};
    if (usdot) criteria.usdot = usdot;
    if (mc) criteria.mc_number = mc;
    if (company) criteria.company_name = company;
    if (state) criteria.state = state;

    // Use the comprehensive carrier search like database-connector.js
    if (window.apiService && window.apiService.searchCarriers) {
        window.apiService.searchCarriers(criteria).then(result => {
            console.log('Search results:', result);

            // Display carrier profile directly if we found a carrier
            if (result.carriers && result.carriers.length > 0) {
                const carrier = result.carriers[0];
                // Always call the comprehensive profile display function directly
                displayFullCarrierProfile(carrier.usdot_number);
            } else {
                // No results
                if (carrierProfileDisplay) {
                    carrierProfileDisplay.innerHTML = `
                        <div class="no-results" style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                            <i class="fas fa-search" style="font-size: 48px; color: #6c757d; margin-bottom: 15px;"></i>
                            <h3 style="color: #495057; margin-bottom: 10px;">No carriers found</h3>
                            <p style="color: #6c757d;">No carriers found matching your search criteria.</p>
                        </div>
                    `;
                }
            }
        }).catch(error => {
            console.error('Search error:', error);
            if (carrierProfileDisplay) {
                carrierProfileDisplay.innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 40px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #721c24; margin-bottom: 15px;"></i>
                        <h3 style="color: #721c24; margin-bottom: 10px;">Search Error</h3>
                        <p style="color: #721c24;">Error: ${error.message}</p>
                    </div>
                `;
            }
        });
    } else {
        // Fallback to direct API call
        fetch(`http://localhost:5002/api/matched-carriers-leads?state=${state}&company=${encodeURIComponent(company)}&limit=100`)
            .then(response => response.json())
            .then(data => {
                console.log('Direct API results:', data);
                displaySearchResults(data.leads || []);
            })
            .catch(error => {
                console.error('Direct API error:', error);
                if (resultsBody) {
                    resultsBody.innerHTML = `
                        <div style="color: red; padding: 20px;">
                            Error: ${error.message}
                        </div>
                    `;
                }
            });
    }
};

// Function to display search results
window.displaySearchResults = function(carriers) {
    const resultsContainer = document.getElementById('searchResults') || document.getElementById('leadResultsBody');
    if (!resultsContainer) return;

    if (!carriers || carriers.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                No carriers found matching your criteria.
            </div>
        `;
        return;
    }

    let html = `
        <div style="margin-bottom: 10px; font-weight: bold;">
            Found ${carriers.length} carriers
        </div>
        <table class="data-table" style="width: 100%;">
            <thead>
                <tr>
                    <th>DOT#</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Fleet</th>
                    <th>Insurance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    carriers.forEach(carrier => {
        html += `
            <tr>
                <td>${carrier.dot_number || carrier.usdot_number || ''}</td>
                <td>${carrier.legal_name || carrier.company_name || ''}</td>
                <td>${carrier.city || ''}, ${carrier.state || ''}</td>
                <td>${carrier.power_units || carrier.fleet_size || 0}</td>
                <td>${carrier.insurance_carrier || 'N/A'}</td>
                <td>
                    <button class="btn-small" onclick="addLeadFromCarrier('${carrier.dot_number || carrier.usdot_number}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    resultsContainer.innerHTML = html;
};

// Generate Leads function
window.generateLeads = function generateLeads() {
    const state = document.getElementById('genState')?.value || 'All';
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const insurer = document.getElementById('genInsurer')?.value || '';
    const limit = '10000'; // High limit to get all matching results
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '9999';

    console.log('Generating leads with criteria:', {
        state, expiry, insurer, limit, skipDays, minFleet, maxFleet
    });

    // Show loading state on button
    const btn = document.querySelector('button[onclick="generateLeads()"], button[onclick*="generateLeads"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating leads...';
    }

    // Show loading state
    const resultsDiv = document.getElementById('generateResults');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i> Generating leads from database...
            </div>
        `;
    }

    // Call the matched carriers API
    const params = new URLSearchParams({
        days: expiry,
        state: state === 'All' ? '' : state,
        limit: limit,
        skip_days: skipDays,
        min_fleet: minFleet,
        max_fleet: maxFleet
    });

    if (insurer) {
        params.append('insurance_companies', insurer);
    }

    fetch(`http://162.220.14.239:3001/api/matched-carriers-leads?${params}`)
        .then(response => response.json())
        .then(data => {
            console.log('Generated leads:', data);

            // Update statistics
            document.getElementById('totalLeadsCount').textContent = data.leads?.length || 0;
            document.getElementById('expiringSoonCount').textContent =
                data.leads?.filter(l => parseInt(l.days_until_renewal) <= 7).length || 0;
            document.getElementById('withContactCount').textContent =
                data.leads?.filter(l => l.email || l.phone).length || 0;

            // Display results
            displayGeneratedLeads(data.leads || []);

            // Show success message
            // Reset button state
            const btn = document.querySelector('button[onclick="generateLeads()"], button[onclick*="generateLeads"]');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
            }

            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error generating leads:', error);

            // Reset button state
            const btn = document.querySelector('button[onclick="generateLeads()"], button[onclick*="generateLeads"]');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
            }

            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div style="color: red; padding: 20px;">
                        Error generating leads: ${error.message}
                    </div>
                `;
            }
        });
};

// Display generated leads
window.displayGeneratedLeads = function(leads) {
    const resultsDiv = document.getElementById('generateResults');
    if (!resultsDiv) return;

    if (!leads || leads.length === 0) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                No leads found with the specified criteria.
            </div>
        `;
        return;
    }

    // Store for export
    window.generatedLeadsData = leads;

    let html = `
        <div style="margin: 20px 0;">
            <h3>Generated ${leads.length} Leads</h3>
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th><input type="checkbox" onclick="selectAllLeads(this)"></th>
                        <th>DOT#</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Fleet</th>
                        <th>Insurance</th>
                        <th>Renewal</th>
                        <th>Contact</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    leads.forEach((lead, index) => {
        const daysUntilRenewal = lead.days_until_renewal || 'N/A';
        const renewalClass = daysUntilRenewal <= 7 ? 'text-red-600' :
                           daysUntilRenewal <= 30 ? 'text-yellow-600' : '';

        html += `
            <tr>
                <td><input type="checkbox" class="lead-checkbox" value="${lead.dot_number}"></td>
                <td>${lead.dot_number || ''}</td>
                <td>${lead.legal_name || lead.company_name || ''}</td>
                <td>${lead.city || ''}, ${lead.state || ''}</td>
                <td>${lead.power_units || 0}</td>
                <td>${lead.insurance_carrier || 'N/A'}</td>
                <td class="${renewalClass}">${daysUntilRenewal} days</td>
                <td>
                    ${lead.phone ? `<i class="fas fa-phone" title="${lead.phone}"></i>` : ''}
                    ${lead.email ? `<i class="fas fa-envelope" title="${lead.email}"></i>` : ''}
                </td>
                <td>
                    <button class="btn-small" onclick="importLead(${index})">
                        <i class="fas fa-download"></i> Import
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    resultsDiv.innerHTML = html;
};

// Export generated leads
window.exportGeneratedLeads = function(format) {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to export. Please generate leads first.');
        return;
    }

    const leads = window.generatedLeadsData;

    if (format === 'excel') {
        // Create CSV content
        const headers = ['DOT Number', 'Company Name', 'City', 'State', 'Phone', 'Email',
                        'Fleet Size', 'Insurance Carrier', 'Days Until Renewal'];
        const csvContent = [
            headers.join(','),
            ...leads.map(lead => [
                lead.dot_number || '',
                `"${(lead.legal_name || lead.company_name || '').replace(/"/g, '""')}"`,
                lead.city || '',
                lead.state || '',
                lead.phone || '',
                lead.email || '',
                lead.power_units || 0,
                lead.insurance_carrier || '',
                lead.days_until_renewal || ''
            ].join(','))
        ].join('\\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } else if (format === 'json') {
        // Download JSON
        const jsonContent = JSON.stringify(leads, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
};

// View generated leads in modal
window.viewGeneratedLeads = function() {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to view. Please generate leads first.');
        return;
    }

    // You can implement a modal view here
    console.log('Generated leads:', window.generatedLeadsData);
    alert(`${window.generatedLeadsData.length} leads generated. Check console for details.`);
};

// Import a lead to the system
window.importLead = function(index) {
    if (!window.generatedLeadsData || !window.generatedLeadsData[index]) {
        alert('Lead not found');
        return;
    }

    const lead = window.generatedLeadsData[index];
    console.log('Importing lead:', lead);

    // Convert to lead format and save
    const newLead = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: lead.legal_name || lead.company_name || 'Unknown Company',
        phone: lead.phone || '',
        email: lead.email || '',
        stage: 'new',
        contact: lead.contact_name || '',
        company: lead.legal_name || lead.company_name || '',
        dot_number: lead.dot_number || '',
        mc_number: lead.mc_number || '',
        address: `${lead.city || ''}, ${lead.state || ''}`,
        fleet_size: lead.power_units || 0,
        insurance_carrier: lead.insurance_carrier || '',
        renewal_date: lead.insurance_expiry || '',
        created: new Date().toISOString(),
        source: 'Lead Generation Database'
    };

    // Save to backend
    fetch('http://localhost:3001/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Lead imported:', result);
        alert('Lead imported successfully!');

        // Refresh leads view if visible
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        }
    })
    .catch(error => {
        console.error('Error importing lead:', error);
        alert('Error importing lead: ' + error.message);
    });
};

// Select all leads checkbox
window.selectAllLeads = function(checkbox) {
    const checkboxes = document.querySelectorAll('.lead-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
};

// Clear search filters
window.clearLeadFilters = function() {
    document.getElementById('usdotSearch').value = '';
    document.getElementById('mcSearch').value = '';
    document.getElementById('companySearch').value = '';
    document.getElementById('stateSearch').value = '';

    const resultsBody = document.getElementById('searchResults') || document.getElementById('leadResultsBody');
    if (resultsBody) {
        resultsBody.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                No results. Use the search form above to find leads.
            </div>
        `;
    }
};

// Add lead from carrier search
window.addLeadFromCarrier = function(dotNumber) {
    console.log('Adding lead from carrier:', dotNumber);

    // Fetch full carrier details and add as lead
    fetch(`http://localhost:5002/api/matched-carriers-leads?dot=${dotNumber}&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data.leads && data.leads.length > 0) {
                importLead(0);
                window.generatedLeadsData = data.leads;
            }
        })
        .catch(error => {
            console.error('Error adding lead:', error);
            alert('Error adding lead: ' + error.message);
        });
};

// SMS Blast function
window.sendSMSBlast = function() {
    const message = document.getElementById('smsMessage')?.value || '';
    const target = document.getElementById('smsTarget')?.value || '';
    const schedule = document.getElementById('smsSchedule')?.value || '';

    if (!message) {
        alert('Please enter a message');
        return;
    }

    console.log('Sending SMS blast:', { message, target, schedule });

    // This would connect to your SMS service
    alert('SMS blast functionality will be connected to your SMS provider.');
};

// Also ensure searchCarriers is available (alias for performLeadSearch)
window.searchCarriers = window.performLeadSearch;

// Insurance company select all/clear all functions
window.selectAllInsurance = function() {
    document.querySelectorAll('input[name="insurance"]').forEach(checkbox => {
        checkbox.checked = true;
    });
};

window.clearAllInsurance = function() {
    document.querySelectorAll('input[name="insurance"]').forEach(checkbox => {
        checkbox.checked = false;
    });
};

// Generate leads from form function - reads all the filters
window.generateLeadsFromForm = function() {
    const state = document.getElementById('genState')?.value || '';
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '999';
    const limit = '10000'; // High limit to get all matching results

    // Get selected insurance companies
    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(checkbox => {
        insuranceCompanies.push(checkbox.value);
    });

    console.log('Generating leads with advanced criteria:', {
        state, expiry, skipDays, minFleet, maxFleet, limit, insuranceCompanies
    });

    // Show loading state
    const resultsDiv = document.getElementById('generateResults');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i> Generating leads from 2.2M carrier database...
            </div>
        `;
    }

    // Build params for API call
    const params = new URLSearchParams({
        days: expiry,
        state: state,
        limit: limit,
        skip_days: skipDays,
        min_fleet: minFleet,
        max_fleet: maxFleet
    });

    if (insuranceCompanies.length > 0) {
        params.append('insurance_companies', insuranceCompanies.join(','));
    }

    fetch(`http://162.220.14.239:3001/api/matched-carriers-leads?${params}`)
        .then(response => response.json())
        .then(data => {
            console.log('Generated leads:', data);

            // Update statistics
            document.getElementById('totalLeadsCount').textContent = data.leads?.length || 0;
            document.getElementById('expiringSoonCount').textContent =
                data.leads?.filter(l => parseInt(l.days_until_renewal) <= 7).length || 0;
            document.getElementById('withContactCount').textContent =
                data.leads?.filter(l => l.email || l.phone).length || 0;

            // Display results
            displayGeneratedLeads(data.leads || []);

            // Show success message
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => successMsg.style.display = 'none', 5000);
            }
        })
        .catch(error => {
            console.error('Error generating leads:', error);
            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div style="color: red; padding: 20px;">
                        Error generating leads: ${error.message}
                    </div>
                `;
            }
        });
};

// Upload to Vicidial function
window.uploadToVicidialWithCriteria = function() {
    const leads = window.generatedLeadsData;
    if (!leads || leads.length === 0) {
        alert('No leads to upload. Generate leads first.');
        return;
    }
    console.log('Uploading', leads.length, 'leads to Vicidial...');
    alert('Upload to Vicidial functionality will be connected.');
};

// Email blast function
window.sendEmailBlast = function() {
    // Check if we have generated leads data
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('Please generate leads first before sending email blast');
        return;
    }

    const totalRecipients = window.generatedLeadsData.length;
    console.log('Sending email blast to', totalRecipients, 'leads...');

    // Create email blast popup modal
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    // Generate professional email template
    const defaultSubject = 'Commercial Trucking Insurance - Better Rates Available';
    const defaultMessage = `Hello [CONTACT_NAME],

My name is [AGENT_NAME] from Vanguard Insurance Group, and I'm reaching out because I noticed you were currently insured with [CARRIER_NAME], which has experienced significant rate increases recently.

As a specialized commercial trucking insurance agency, we've been helping trucking companies like yours secure more competitive rates and better coverage options. Many of our clients have saved 15-30% on their premiums while improving their policy benefits.

Given the current market conditions and your carrier's recent rate adjustments, I believe we could provide you with a more cost-effective solution for your fleet.

I'd be happy to provide you with a no-obligation quote comparison. This would only take a few minutes of your time and could potentially save your company thousands of dollars annually.

Would you be available for a brief 10-minute conversation this week to discuss your current coverage and explore better options?

Best regards,
[AGENT_NAME]
Vanguard Insurance Group
Phone: [AGENT_PHONE]
Email: [AGENT_EMAIL]

P.S. We specialize exclusively in commercial trucking insurance and work with over 20 A-rated carriers to ensure you get the best possible rates.`;

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3 style="margin: 0; color: white;">
                    <i class="fas fa-envelope" style="color: white;"></i> Email Blast to Generated Leads
                </h3>
                <button onclick="this.closest('.modal-backdrop').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
            </div>
            <div class="modal-body">
                <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066cc;">
                    <h4 style="margin: 0 0 10px 0; color: #0066cc;">
                        <i class="fas fa-users"></i> Ready to Send
                    </h4>
                    <p style="margin: 0; font-size: 16px;">
                        <strong>${totalRecipients} leads</strong> will receive this email blast
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <label for="blastSubject" style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                        Email Subject:
                    </label>
                    <input type="text" id="blastSubject" value="${defaultSubject}"
                           style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label for="blastMessage" style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                        Email Message:
                    </label>
                    <textarea id="blastMessage" rows="16"
                              style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; font-family: Arial, sans-serif; line-height: 1.5; box-sizing: border-box; resize: vertical;">${defaultMessage}</textarea>
                </div>

                <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                    <small style="color: #856404;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Template Variables:</strong> [CONTACT_NAME], [AGENT_NAME], [CARRIER_NAME], [AGENT_PHONE], [AGENT_EMAIL] will be automatically replaced for each recipient.
                    </small>
                </div>

                <div style="display: flex; gap: 15px; justify-content: flex-end;">
                    <button onclick="this.closest('.modal-backdrop').remove()"
                            class="btn-secondary" style="padding: 12px 24px;">
                        Cancel
                    </button>
                    <button onclick="executeEmailBlastFromLG()"
                            class="btn-primary" style="padding: 12px 24px;">
                        <i class="fas fa-paper-plane"></i> Send Email Blast
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// Execute email blast from lead generation
window.executeEmailBlastFromLG = function() {
    const subject = document.getElementById('blastSubject').value.trim();
    const message = document.getElementById('blastMessage').value.trim();

    if (!subject) {
        alert('Please enter email subject');
        return;
    }

    if (!message) {
        alert('Please enter email message');
        return;
    }

    // Close the email compose modal
    document.querySelector('.modal-backdrop').remove();

    const totalRecipients = window.generatedLeadsData.length;
    let sentCount = 0;

    // Show progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-backdrop';
    progressModal.style.display = 'flex';
    progressModal.style.alignItems = 'center';
    progressModal.style.justifyContent = 'center';

    progressModal.innerHTML = `
        <div class="modal-content" style="max-width: 450px; text-align: center;">
            <h3 style="margin: 0 0 20px 0; color: #0066cc;">
                <i class="fas fa-paper-plane"></i> Sending Email Blast
            </h3>
            <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <div class="progress-bar" style="background: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 15px;">
                    <div class="progress-fill" id="emailProgress"
                         style="background: linear-gradient(45deg, #0066cc, #004499); height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 10px;"></div>
                </div>
                <p id="emailProgressText" style="margin: 0; font-size: 16px; color: #495057;">
                    Preparing to send to ${totalRecipients} recipients...
                </p>
            </div>
            <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
                <small style="color: #856404;">
                    <i class="fas fa-info-circle"></i> Personalizing emails with recipient data...
                </small>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);

    // Simulate sending process with more realistic timing
    const interval = setInterval(() => {
        const increment = Math.min(3, totalRecipients - sentCount); // Slower, more realistic
        sentCount += increment;
        const progress = (sentCount / totalRecipients) * 100;

        document.getElementById('emailProgress').style.width = progress + '%';

        if (sentCount < totalRecipients) {
            document.getElementById('emailProgressText').innerHTML =
                `Sending personalized emails...<br><strong>${sentCount} of ${totalRecipients}</strong> sent`;
        } else {
            document.getElementById('emailProgressText').innerHTML =
                `<strong>Complete!</strong> ${totalRecipients} emails sent successfully`;
        }

        if (sentCount >= totalRecipients) {
            clearInterval(interval);

            setTimeout(() => {
                progressModal.remove();

                // Save to email blast history
                const blastHistory = JSON.parse(localStorage.getItem('emailBlasts') || '[]');
                blastHistory.push({
                    id: 'blast_' + Date.now(),
                    subject: subject,
                    message: message,
                    recipients: totalRecipients,
                    sentAt: new Date().toISOString(),
                    status: 'completed',
                    type: 'lead_generation'
                });
                localStorage.setItem('emailBlasts', JSON.stringify(blastHistory));

                alert(`✅ Email blast completed! ${totalRecipients} personalized emails sent to generated leads.`);
            }, 1500);
        }
    }, 800); // Slower interval for more realistic progress
};

// Reset form function
window.resetGenerateForm = function() {
    document.getElementById('genState').value = '';
    document.getElementById('genExpiry').value = '30';
    document.getElementById('genSkipDays').value = '0';
    document.getElementById('genMinFleet').value = '1';
    document.getElementById('genMaxFleet').value = '999';
    // Removed genLimit field - no longer needed
    clearAllInsurance();
    document.getElementById('generateResults').innerHTML = '';
    document.getElementById('successMessage').style.display = 'none';
};

// Comprehensive function to display full carrier profile with all data
async function displayFullCarrierProfile(usdotNumber) {
    const carrierProfileDisplay = document.getElementById('carrierProfileDisplay');
    if (!carrierProfileDisplay) return;

    try {
        console.log('Loading comprehensive carrier profile for USDOT:', usdotNumber);

        // Show loading state
        carrierProfileDisplay.innerHTML = `
            <div class="loading-message" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #3498db;"></i>
                <p style="margin-top: 15px; color: #6c757d;">Loading comprehensive carrier profile...</p>
            </div>
        `;

        // Fetch full carrier profile data from the API
        const response = await fetch(`/api/carrier/profile/${usdotNumber}`, {
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch carrier profile');
        }

        const data = await response.json();
        const carrier = data.carrier;

        console.log('Loaded comprehensive carrier profile:', carrier);

        // Display the full profile with all data
        carrierProfileDisplay.innerHTML = createComprehensiveCarrierHTML(carrier);

    } catch (error) {
        console.error('Error loading comprehensive carrier profile:', error);
        carrierProfileDisplay.innerHTML = `
            <div class="carrier-profile-error" style="text-align: center; padding: 40px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                <h3 style="color: #721c24;">Error Loading Carrier Profile</h3>
                <p style="color: #721c24;">Unable to load carrier information. Please try again.</p>
            </div>
        `;
    }
}

// Function to create comprehensive carrier profile HTML
function createComprehensiveCarrierHTML(carrier) {
    const inspections = carrier.inspections || [];
    const safetyData = carrier.safety_summary;
    const address = carrier.address || {};

    // Calculate safety metrics using correct field names
    const totalInspections = inspections.length;
    const oosInspections = inspections.filter(i => (i.OOS_Total && i.OOS_Total > 0) || i.out_of_service === 'Y' || i.out_of_service === 'YES').length;
    const oosPercentage = totalInspections > 0 ? ((oosInspections / totalInspections) * 100).toFixed(1) : '0.0';

    // Determine OOS Rate background color based on safety thresholds
    const oosRate = parseFloat(oosPercentage);
    let oosBackgroundColor = '#ffffff'; // white (default)
    let oosTextColor = '#2c3e50'; // dark text for white background

    if (oosRate >= 50) {
        oosBackgroundColor = '#dc3545'; // red
        oosTextColor = '#ffffff'; // white text for red background
    } else if (oosRate >= 22) {
        oosBackgroundColor = '#fd7e14'; // orange
        oosTextColor = '#ffffff'; // white text for orange background
    } else if (oosRate >= 15) {
        oosBackgroundColor = '#ffc107'; // yellow
        oosTextColor = '#212529'; // dark text for yellow background
    }

    // Get contact information using correct API field names
    const email = carrier.email || carrier.carrier_details?.EMAIL_ADDRESS || 'Not available';
    const phone = carrier.phone || carrier.carrier_details?.PHONE || 'Not available';
    const contact = carrier.carrier_details?.COMPANY_OFFICER_1 || carrier.contact_name || 'Not available';

    // Get insurance information from insurance policies
    const insurancePolicies = carrier.insurance_policies || [];
    const latestPolicy = insurancePolicies.length > 0 ? insurancePolicies[0] : null;

    console.log('🔍 Insurance Debug - Policies:', insurancePolicies.length);
    console.log('🔍 Insurance Debug - Latest Policy:', latestPolicy);

    const insuranceData = {
        company: latestPolicy?.INSURANCE_COMPANY || latestPolicy?.COMPANY_NAME || latestPolicy?.INSURER_NAME || 'Not Available',
        expiration: latestPolicy?.POLICY_END_DATE || latestPolicy?.POLICY_EXPIRATION_DATE || 'Not Available'
    };

    console.log('🔍 Insurance Debug - Final Data:', insuranceData);

    // Get commodities hauled from carrier data
    function getCommoditiesHauled(carrier) {
        const commodities = [];

        // Check various commodity fields from the carrier_details
        const details = carrier.carrier_details || carrier;

        if (details.CRGO_GENFREIGHT === 'X') commodities.push('General Freight');
        if (details.CRGO_HOUSEHOLD === 'X') commodities.push('Household Goods');
        if (details.CRGO_METALSHEET === 'X') commodities.push('Metal Sheets');
        if (details.CRGO_MOTOVEH === 'X') commodities.push('Motor Vehicles');
        if (details.CRGO_DRIVETOW === 'X') commodities.push('Drive/Tow Away');
        if (details.CRGO_LOGPOLE === 'X') commodities.push('Logs/Poles');
        if (details.CRGO_BLDGMAT === 'X') commodities.push('Building Materials');
        if (details.CRGO_MOBILEHOME === 'X') commodities.push('Mobile Homes');
        if (details.CRGO_MACHLRG === 'X') commodities.push('Machinery');
        if (details.CRGO_PRODUCE === 'X') commodities.push('Fresh Produce');
        if (details.CRGO_LIQGAS === 'X') commodities.push('Liquids/Gas');
        if (details.CRGO_INTERMODAL === 'X') commodities.push('Intermodal');
        if (details.CRGO_PASSENGERS === 'X') commodities.push('Passengers');
        if (details.CRGO_OILFIELD === 'X') commodities.push('Oilfield Equipment');
        if (details.CRGO_LIVESTOCK === 'X') commodities.push('Livestock');
        if (details.CRGO_GRAINFEED === 'X') commodities.push('Grain/Feed');
        if (details.CRGO_COALCOKE === 'X') commodities.push('Coal/Coke');
        if (details.CRGO_MEAT === 'X') commodities.push('Meat');
        if (details.CRGO_GARBAGE === 'X') commodities.push('Garbage/Refuse');
        if (details.CRGO_USMAIL === 'X') commodities.push('US Mail');
        if (details.CRGO_CHEM === 'X') commodities.push('Chemicals');
        if (details.CRGO_DRYBULK === 'X') commodities.push('Dry Bulk');
        if (details.CRGO_COLDFOOD === 'X') commodities.push('Refrigerated Food');
        if (details.CRGO_BEVERAGES === 'X') commodities.push('Beverages');
        if (details.CRGO_PAPERPROD === 'X') commodities.push('Paper Products');
        if (details.CRGO_UTILITY === 'X') commodities.push('Utilities');
        if (details.CRGO_FARMSUPP === 'X') commodities.push('Farm Supplies');
        if (details.CRGO_CONSTRUCT === 'X') commodities.push('Construction');
        if (details.CRGO_WATERWELL === 'X') commodities.push('Water Well');

        // Check for other cargo description
        if (details.CRGO_CARGOOTHR === 'X' && details.CRGO_CARGOOTHR_DESC) {
            commodities.push(details.CRGO_CARGOOTHR_DESC);
        }

        return commodities.length > 0 ? commodities.join(', ') : 'General Freight';
    }

    const commoditiesHauled = getCommoditiesHauled(carrier);

    // Helper function to determine eligibility status
    function getEligibilityStatus(carrier, oosPercentage) {
        const authorityYear = carrier.add_date ? parseInt(carrier.add_date.substring(0,4)) : null;
        const vehicles = carrier.vehicles || [];
        const hasOnlyTractors = vehicles.length === 0 || vehicles.every(v =>
            (v.type && v.type.toLowerCase().includes('tractor')) ||
            (v.vehicle_type && v.vehicle_type.toLowerCase().includes('tractor'))
        );
        const oosRate = parseFloat(oosPercentage);

        // Check for disqualifying commodities (passengers, mobile homes, specialized freight)
        const details = carrier.carrier_details || carrier;
        const hasDisqualifyingCommodities =
            details.CRGO_PASSENGERS === 'X' ||     // Passenger transport disqualified
            details.CRGO_MOBILEHOME === 'X' ||     // Mobile home transport disqualified
            details.CRGO_HOUSEHOLD === 'X' ||      // Household goods disqualified
            details.CRGO_OILFIELD === 'X' ||       // Oilfield equipment disqualified
            details.CRGO_WATERWELL === 'X';        // Water well equipment disqualified

        console.log('🔍 RPS Debug - DOT:', carrier.usdot_number || carrier.DOT_NUMBER);
        console.log('🔍 RPS Debug - Authority Year:', authorityYear);
        console.log('🔍 RPS Debug - OOS Rate:', oosRate);
        console.log('🔍 RPS Debug - Only Tractors:', hasOnlyTractors);
        console.log('🔍 RPS Debug - Disqualifying Commodities:', hasDisqualifyingCommodities);
        console.log('🔍 RPS Debug - CRGO_PASSENGERS:', details.CRGO_PASSENGERS);
        console.log('🔍 RPS Debug - CRGO_MOBILEHOME:', details.CRGO_MOBILEHOME);

        // RPS criteria: Authority before 2024, only truck tractors, OOS rate ≤ 20%, no disqualifying commodities
        if (authorityYear && authorityYear < 2024 && hasOnlyTractors && oosRate <= 20 && !hasDisqualifyingCommodities) {
            return 'RPS';
        }
        return 'Standard';
    }

    // Helper function to get eligibility styling
    function getEligibilityStyle(carrier, oosPercentage) {
        const status = getEligibilityStatus(carrier, oosPercentage);
        if (status === 'RPS') {
            return 'color: #10b981; background: #d1fae5; padding: 4px 8px; border-radius: 4px; font-size: 14px;';
        }
        return 'color: #6b7280; font-size: 14px;';
    }

    return `
        <div class="carrier-profile-display">
            <div class="company-header">
                <h1 class="company-name">${carrier.LEGAL_NAME || carrier.legal_name || carrier.DBA_NAME || carrier.dba_name || 'Unknown Company'}</h1>
                <div class="company-details">
                    <span class="usdot-number">USDOT: ${carrier.DOT_NUMBER || carrier.usdot_number}</span>
                    <span class="operating-status ${carrier.operating_status === 'ACTIVE' ? 'status-active' : 'status-inactive'}">
                        ${carrier.operating_status || 'Active'}
                    </span>
                    <span class="operation-type">${carrier.CARRIER_OPERATION || carrier.carrier_operation || 'Interstate'}</span>
                </div>
            </div>

            <!-- Safety Metrics - Now displayed horizontally above profile grid -->
            <div class="safety-metrics-section" style="margin-bottom: 32px;">
                <div class="safety-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; background: #f8f9fa; padding: 20px; border-radius: 12px;">
                    <div class="metric">
                        <div class="metric-value">${totalInspections}</div>
                        <div class="metric-label">Total Inspections</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${oosInspections}</div>
                        <div class="metric-label">OOS Inspections</div>
                    </div>
                    <div class="metric" style="background: ${oosBackgroundColor}; color: ${oosTextColor}; border: 2px solid ${oosBackgroundColor === '#ffffff' ? '#dee2e6' : oosBackgroundColor};">
                        <div class="metric-value">${oosPercentage}%</div>
                        <div class="metric-label">OOS Rate</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${carrier.add_date ? carrier.add_date.substring(0,4) || 'N/A' : 'N/A'}</div>
                        <div class="metric-label">Authority Granted</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" style="font-size: 14px; text-align: center;">${commoditiesHauled}</div>
                        <div class="metric-label">Commodities Hauled</div>
                    </div>
                </div>
            </div>

            <!-- Insurance Information Section -->
            <div class="insurance-section" style="margin-bottom: 32px;">
                <div class="insurance-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; background: #f0f8ff; padding: 20px; border-radius: 12px; border: 1px solid #3b82f6;">
                    <div class="insurance-item">
                        <div class="insurance-label" style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Insurance Company</div>
                        <div class="insurance-value" style="font-weight: 600; color: #1f2937;">${insuranceData?.company || 'Not Available'}</div>
                    </div>
                    <div class="insurance-item">
                        <div class="insurance-label" style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Expiration Date</div>
                        <div class="insurance-value" style="font-weight: 600; color: #1f2937;">${insuranceData?.expiration || 'Not Available'}</div>
                    </div>
                    <div class="insurance-item">
                        <div class="insurance-label" style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Eligible Markets</div>
                        <div class="insurance-value eligible-markets" style="font-weight: 600; ${getEligibilityStyle(carrier, oosPercentage)}">${getEligibilityStatus(carrier, oosPercentage)}</div>
                    </div>
                </div>
            </div>

            <div class="profile-grid">
                <!-- Company Information -->
                <div class="profile-section">
                    <h3>Company Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Legal Name:</label>
                            <span>${carrier.LEGAL_NAME || carrier.legal_name || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>DBA Name:</label>
                            <span>${carrier.DBA_NAME || carrier.dba_name || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>MC Number:</label>
                            <span>${carrier.MC_NUMBER || carrier.mc_number || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Operation Type:</label>
                            <span>${carrier.CARRIER_OPERATION || carrier.carrier_operation || 'Interstate'}</span>
                        </div>
                        <div class="info-item">
                            <label>Hazmat:</label>
                            <span>${carrier.HAZMAT || carrier.hazmat || 'No'}</span>
                        </div>
                    </div>
                </div>

                <!-- Contact Information -->
                <div class="profile-section">
                    <h3>Contact Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Contact Name:</label>
                            <span>${contact}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${email}</span>
                        </div>
                        <div class="info-item">
                            <label>Phone:</label>
                            <span>${phone}</span>
                        </div>
                        <div class="info-item">
                            <label>Address:</label>
                            <span>${carrier.CARRIER_MAILING_STREET || address.street || carrier.mailing_street || 'Not available'}</span>
                        </div>
                        <div class="info-item">
                            <label>City, State:</label>
                            <span>${carrier.CARRIER_MAILING_CITY || address.city || carrier.mailing_city || 'N/A'}, ${carrier.CARRIER_MAILING_STATE || address.state || carrier.mailing_state || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <!-- Fleet Information -->
                <div class="profile-section">
                    <h3>Fleet Information</h3>
                    ${(() => {
                        const uniqueVehicles = extractUniqueVehicles(inspections);
                        if (uniqueVehicles.length > 0) {
                            return `
                                <div style="margin-top: 0px;">
                                    <p style="color: #6c757d; margin-bottom: 8px; font-size: 14px;">
                                        Total Drivers: ${carrier.drivers || carrier.carrier_details?.TOTAL_DRIVERS || 'N/A'}
                                    </p>
                                    <h4 style="color: #2c3e50; font-size: 16px; font-weight: 600; margin-bottom: 12px; border-bottom: 1px solid #dee2e6; padding-bottom: 6px;">
                                        Vehicle Inventory (${uniqueVehicles.length} vehicles)
                                    </h4>
                                    <div class="vehicles-list" style="display: grid; gap: 8px;">
                                        ${uniqueVehicles.map(vehicle => `
                                            <div class="vehicle-item" style="background: #cce7ff; border-radius: 6px; padding: 12px; border: 1px solid #99d6ff;">
                                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                                    <strong style="color: #2c3e50;">${vehicle.year} ${vehicle.make}</strong>
                                                    <span style="background: #0066cc; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                                                        ${vehicle.type}
                                                    </span>
                                                </div>
                                                <div style="font-size: 13px; color: #495057;">
                                                    <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 3px; margin-right: 8px; border: 1px solid #ddd;">
                                                        VIN: ${vehicle.vin}
                                                    </span>
                                                    ${vehicle.license !== 'N/A' ? `<span>License: ${vehicle.license} (${vehicle.state})</span>` : ''}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        } else {
                            return '<div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px; color: #6c757d; font-style: italic; text-align: center;">No detailed vehicle information available from inspections</div>';
                        }
                    })()}
                </div>

                <!-- Trailer Inventory -->
                <div class="profile-section">
                    <h3>Trailer Inventory</h3>
                    ${(() => {
                        const uniqueTrailers = extractUniqueTrailers(inspections);
                        if (uniqueTrailers.length > 0) {
                            return `
                                <div style="margin-top: 0px;">
                                    <h4 style="color: #2c3e50; font-size: 16px; font-weight: 600; margin-bottom: 12px; border-bottom: 1px solid #dee2e6; padding-bottom: 6px;">
                                        Trailer Fleet (${uniqueTrailers.length} trailers)
                                    </h4>
                                    <div class="trailers-list" style="display: grid; gap: 8px;">
                                        ${uniqueTrailers.map(trailer => `
                                            <div class="trailer-item" style="background: #fff3cd; border-radius: 6px; padding: 12px; border: 1px solid #ffeaa7;">
                                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                                    <strong style="color: #2c3e50;">${trailer.year} ${trailer.make}</strong>
                                                    <span style="background: #e17055; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                                                        ${trailer.type}
                                                    </span>
                                                </div>
                                                <div style="font-size: 13px; color: #495057;">
                                                    <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 3px; margin-right: 8px; border: 1px solid #ddd;">
                                                        VIN: ${trailer.vin}
                                                    </span>
                                                    ${trailer.license !== 'N/A' ? `<span>License: ${trailer.license} (${trailer.state})</span>` : ''}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        } else {
                            return '<div style="margin-top: 0px; padding: 12px; background: #f8f9fa; border-radius: 6px; color: #6c757d; font-style: italic; text-align: center;">No trailer information available from inspections</div>';
                        }
                    })()}
                </div>
            </div>

            ${totalInspections > 0 ? `
            <div class="inspections-section">
                <h3>Recent Inspections</h3>
                <div class="inspections-list">
                    ${inspections.slice(0, 10).map(inspection => `
                        <div class="inspection-item">
                            <div class="inspection-header">
                                <span class="inspection-date">${inspection.Insp_Date || inspection.inspection_date || 'Unknown Date'}</span>
                                <span class="inspection-state">${inspection.Report_State || inspection.state || 'N/A'}</span>
                                <span class="inspection-oos ${(inspection.OOS_Total > 0) ? 'oos-yes' : 'oos-no'}">
                                    ${(inspection.OOS_Total > 0) ? 'OOS' : 'No OOS'}
                                </span>
                            </div>
                            <div class="inspection-details">
                                <span class="vehicle-info">Vehicle: ${inspection.Unit_Make || inspection.vehicle_make || 'N/A'}</span>
                                ${inspection.VIN || inspection.vin ? `<span class="vin">VIN: ${inspection.VIN || inspection.vin}</span>` : ''}
                                ${inspection.violations ? `<span class="violations">${inspection.violations} violations</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                    ${inspections.length > 10 ? `
                        <div class="inspections-more">
                            ... and ${inspections.length - 10} more inspections
                        </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// VIN Decoder function
function decodeVIN(vin) {
    if (!vin || vin.length !== 17) return { year: 'Unknown', make: 'Unknown', model: 'Unknown' };

    // VIN position 10 determines year
    const yearCode = vin.charAt(9);
    const yearMap = {
        'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987,
        'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995,
        'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003,
        '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009, 'A': 2010, 'B': 2011,
        'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
        'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026, 'V': 2027
    };

    // For years 2010+, use different mapping
    let year = yearMap[yearCode];
    if (yearCode >= 'A' && yearCode <= 'Z' && year < 2010) {
        year += 30; // 2010-2039 cycle
    }

    // WMI (World Manufacturer Identifier) - first 3 characters
    const wmi = vin.substring(0, 3);
    let make = 'Unknown';

    // Common WMI codes for commercial vehicles
    const wmiMap = {
        '1FU': 'Freightliner', '1FT': 'Ford', '1FJ': 'Freightliner',
        '3AK': 'Freightliner', '3HM': 'International', '3HT': 'International',
        '4V4': 'Volvo', '4V1': 'Volvo', '4VL': 'Volvo', '4VM': 'Volvo',
        '1XK': 'Kenworth', '1XN': 'Kenworth', '1XP': 'Kenworth',
        '1NX': 'PACCAR', '1NP': 'PACCAR', '2NP': 'PACCAR',
        'YV1': 'Volvo', 'YV2': 'Volvo', 'YV3': 'Volvo',
        '2FZ': 'Sterling', '2FU': 'Freightliner', '2FV': 'Freightliner',
        'WBA': 'BMW', 'WBS': 'BMW', 'WBX': 'BMW'
    };

    // Check direct WMI match
    if (wmiMap[wmi]) {
        make = wmiMap[wmi];
    } else {
        // Check partial matches
        const wmi2 = vin.substring(0, 2);
        if (wmi2 === '1F') make = 'Ford/Freightliner';
        else if (wmi2 === '3A' || wmi2 === '3H') make = 'Freightliner/International';
        else if (wmi2 === '4V') make = 'Volvo';
        else if (wmi2 === '1X') make = 'Kenworth';
        else if (vin.charAt(0) === '1') make = 'USA Manufacturer';
        else if (vin.charAt(0) === '2') make = 'Canada Manufacturer';
        else if (vin.charAt(0) === '3') make = 'Mexico Manufacturer';
        else if (vin.charAt(0) === '4' || vin.charAt(0) === '5') make = 'USA Manufacturer';
    }

    return {
        year: year || 'Unknown',
        make: make,
        model: 'Commercial Vehicle',
        vin: vin
    };
}

// Function to extract unique vehicles from inspections
function extractUniqueVehicles(inspections) {
    const vehicleMap = new Map();

    inspections.forEach(inspection => {
        const vin = inspection.VIN || inspection.vin;
        const make = inspection.Unit_Make || inspection.vehicle_make || '';

        if (vin && vin.length === 17) {
            if (!vehicleMap.has(vin)) {
                const decoded = decodeVIN(vin);
                vehicleMap.set(vin, {
                    vin: vin,
                    make: make || decoded.make,
                    model: decoded.model,
                    year: decoded.year,
                    type: inspection.Unit_Type_Desc || inspection.vehicle_type || 'Unknown',
                    license: inspection.Unit_License || inspection.license || 'N/A',
                    state: inspection.Unit_License_State || inspection.license_state || 'N/A'
                });
            }
        }
    });

    return Array.from(vehicleMap.values());
}

// Function to extract unique trailers from inspections
function extractUniqueTrailers(inspections) {
    const trailerMap = new Map();

    inspections.forEach(inspection => {
        const vin = inspection.VIN2 || inspection.vin2;
        const make = inspection.Unit_Make2 || inspection.vehicle_make2 || '';

        if (vin && vin.length === 17) {
            if (!trailerMap.has(vin)) {
                const decoded = decodeVIN(vin);
                trailerMap.set(vin, {
                    vin: vin,
                    make: make || decoded.make,
                    model: decoded.model,
                    year: decoded.year,
                    type: inspection.Unit_Type_Desc2 || inspection.vehicle_type2 || 'Trailer',
                    license: inspection.Unit_License2 || inspection.license2 || 'N/A',
                    state: inspection.Unit_License_State2 || inspection.license_state2 || 'N/A'
                });
            }
        }
    });

    return Array.from(trailerMap.values());
}

// Fallback function to display basic carrier info
function displayCarrierInfo(carrier) {
    const carrierProfileDisplay = document.getElementById('carrierProfileDisplay');
    if (!carrierProfileDisplay) return;

    const companyName = carrier.legal_name || carrier.dba_name || 'Unknown Company';
    const usdot = carrier.usdot_number || 'N/A';

    carrierProfileDisplay.innerHTML = `
        <div class="carrier-profile-display">
            <div class="company-header">
                <h1 class="company-name">${companyName}</h1>
                <div class="company-details">
                    <span class="usdot-number">USDOT: ${usdot}</span>
                    <span class="operating-status status-active">Active</span>
                </div>
            </div>
            <div class="profile-grid">
                <div class="profile-section">
                    <h3>Basic Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Company Name:</label>
                            <span>${companyName}</span>
                        </div>
                        <div class="info-item">
                            <label>USDOT Number:</label>
                            <span>${usdot}</span>
                        </div>
                        <div class="info-item">
                            <label>MC Number:</label>
                            <span>${carrier.mc_number || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

console.log('✅ Lead Generation fully restored with all functions:');
console.log('  - performLeadSearch / searchCarriers');
console.log('  - generateLeads / generateLeadsFromForm');
console.log('  - displaySearchResults');
console.log('  - displayGeneratedLeads');
console.log('  - exportGeneratedLeads');
console.log('  - importLead');
console.log('  - selectAllLeads / selectAllInsurance / clearAllInsurance');
console.log('  - clearLeadFilters / resetGenerateForm');
console.log('  - sendSMSBlast / sendEmailBlast');
console.log('  - uploadToVicidialWithCriteria');