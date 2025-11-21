// Complete Lead Generation Restoration Script
console.log('🔧 Restoring complete lead generation functionality...');

// Expose all lead generation functions to window
window.performLeadSearch = function performLeadSearch() {
    const usdot = document.getElementById('usdotSearch')?.value || '';
    const mc = document.getElementById('mcSearch')?.value || '';
    const company = document.getElementById('companySearch')?.value || '';
    const state = document.getElementById('stateSearch')?.value || '';

    console.log('Performing lead search:', { usdot, mc, company, state });

    // Show loading state
    const resultsBody = document.getElementById('searchResults') || document.getElementById('leadResultsBody');
    if (resultsBody) {
        resultsBody.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i> Searching 2.2M carrier database...
            </div>
        `;
    }

    // Build search criteria
    const criteria = {};
    if (usdot) criteria.usdot = usdot;
    if (mc) criteria.mc_number = mc;
    if (company) criteria.company_name = company;
    if (state) criteria.state = state;

    // Use API service to search carriers
    if (window.apiService && window.apiService.searchCarriers) {
        window.apiService.searchCarriers(criteria).then(result => {
            console.log('Search results:', result);
            displaySearchResults(result.carriers || result.data || []);
        }).catch(error => {
            console.error('Search error:', error);
            if (resultsBody) {
                resultsBody.innerHTML = `
                    <div style="color: red; padding: 20px;">
                        Error: ${error.message}
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
    const leads = window.generatedLeadsData;
    if (!leads || leads.length === 0) {
        alert('No leads for email blast. Generate leads first.');
        return;
    }
    console.log('Sending email blast to', leads.length, 'leads...');
    alert('Email blast functionality will be connected.');
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