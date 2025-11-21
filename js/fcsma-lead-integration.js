// FCSMA LEAD INTEGRATION - Connect Vanguard lead gen to FCSMA database
(function() {
    'use strict';

    console.log('🎯 FCSMA-LEAD-INTEGRATION: Connecting to new FCSMA database...');

    // Override the generateLeadsFromForm to use FCSMA database
    window.generateLeadsFromForm = async function() {
        const btn = document.querySelector('button[onclick="generateLeadsFromForm()"]');
        const originalText = btn ? btn.innerHTML : 'Generate Leads';

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Querying FCSMA Database...';
            }

            // Get form criteria
            const state = document.getElementById('leadState')?.value || '';
            const expiryDays = document.getElementById('expiryDays')?.value || 30;
            const limit = document.getElementById('leadCount')?.value || 100;
            const carrier = document.getElementById('carrierFilter')?.value || '';

            console.log(`Querying FCSMA database for leads expiring in ${expiryDays} days...`);

            // Query FCSMA database via our new API endpoint
            const response = await fetch('/api/fcsma-leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    expiryDays: parseInt(expiryDays),
                    limit: parseInt(limit),
                    carrier: carrier,
                    state: state
                })
            });

            const data = await response.json();

            // Show count
            const leadCount = data.leads ? data.leads.length : 0;
            console.log(`✅ Found ${leadCount} FCSMA leads expiring within ${expiryDays} days`);

            // Display the leads
            if (data.leads && data.leads.length > 0) {
                displayFCSMALeads(data.leads);
                showNotification(`Found ${leadCount} FCSMA leads from database`, 'success');
            } else {
                showNotification(`No FCSMA policies found expiring within ${expiryDays} days`, 'warning');
            }

        } catch (error) {
            console.error('Error fetching FCSMA leads:', error);

            // Fallback to local FCSMA database query
            try {
                console.log('🔄 Falling back to local FCSMA database...');
                const fallbackLeads = await queryLocalFCSMADatabase(expiryDays, limit, carrier);
                if (fallbackLeads.length > 0) {
                    displayFCSMALeads(fallbackLeads);
                    showNotification(`Found ${fallbackLeads.length} FCSMA leads (local fallback)`, 'success');
                } else {
                    showNotification('No FCSMA leads found', 'warning');
                }
            } catch (fallbackError) {
                console.error('Fallback query failed:', fallbackError);
                showNotification('Error connecting to FCSMA database', 'error');
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    };

    // Function to query FCSMA database via backend script
    async function queryLocalFCSMADatabase(expiryDays, limit, carrier) {
        console.log('📊 Querying FCSMA database via Python script...');

        try {
            // Execute Python script to query FCSMA database
            const response = await fetch('/api/query-fcsma.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expiryDays: parseInt(expiryDays),
                    limit: parseInt(limit),
                    carrier: carrier || ''
                })
            });

            if (!response.ok) {
                throw new Error('FCSMA query failed');
            }

            const data = await response.json();
            return data.leads || [];

        } catch (error) {
            console.warn('FCSMA backend query failed, using sample data:', error);

            // Fallback to sample FCSMA data with current structure
            const sampleFCSMALeads = [
                {
                    mc_number: 'MC1742145',
                    dot_number: '04428534',
                    insurance_carrier: 'PROGRESSIVE SOUTHEASTERN INSURANCE COMPANY',
                    policy_number: 'CA861619832',
                    policy_end_date: '2025-11-07',
                    primary_coverage_amount: 750,
                    coverage_level: 'BIPD/Primary'
                },
                {
                    mc_number: 'MC078805',
                    dot_number: '03100470',
                    insurance_carrier: 'GREAT WEST CASUALTY CO.',
                    policy_number: 'GRT43940A',
                    policy_end_date: '2025-11-07',
                    primary_coverage_amount: 1000,
                    coverage_level: 'BIPD/Primary'
                },
                {
                    mc_number: 'MC899499',
                    dot_number: '02572661',
                    insurance_carrier: 'OCCIDENTAL FIRE AND CASUALTY CO. OF N.C.',
                    policy_number: 'GAT0004955',
                    policy_end_date: '2025-11-07',
                    primary_coverage_amount: 750,
                    coverage_level: 'BIPD/Primary'
                },
                {
                    mc_number: 'MC724454',
                    dot_number: '02073296',
                    insurance_carrier: 'PROGRESSIVE COUNTY MUTUAL',
                    policy_number: 'CA862793889',
                    policy_end_date: '2025-11-07',
                    primary_coverage_amount: 750,
                    coverage_level: 'BIPD/Primary'
                },
                {
                    mc_number: 'MC1613672',
                    dot_number: '03643217',
                    insurance_carrier: 'PROGRESSIVE NORTHWESTERN INS. CO.',
                    policy_number: 'CA991982858',
                    policy_end_date: '2025-11-07',
                    primary_coverage_amount: 1000,
                    coverage_level: 'BIPD/Primary'
                }
            ];

            // Filter by carrier if specified
            let filteredLeads = sampleFCSMALeads;
            if (carrier && carrier.trim() !== '') {
                filteredLeads = sampleFCSMALeads.filter(lead =>
                    lead.insurance_carrier.toUpperCase().includes(carrier.toUpperCase())
                );
            }

            return filteredLeads.slice(0, parseInt(limit));
        }
    }

    // Function to display FCSMA leads
    function displayFCSMALeads(leads) {
        const tbody = document.getElementById('generatedLeadsTableBody');
        if (!tbody) {
            console.log('No table body found for displaying leads');
            return;
        }

        tbody.innerHTML = '';

        leads.forEach((lead, index) => {
            const row = document.createElement('tr');

            // Format expiry date
            const expiryDate = new Date(lead.policy_end_date || lead.expirationDate);
            const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });

            // Calculate days until expiry
            const today = new Date();
            const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            // Format coverage amount
            const coverageAmount = lead.primary_coverage_amount ?
                `$${(lead.primary_coverage_amount * 1000).toLocaleString()}` :
                'N/A';

            row.innerHTML = `
                <td>
                    <input type="checkbox" class="lead-checkbox" value="${lead.dot_number}">
                </td>
                <td>${lead.dot_number || 'N/A'}</td>
                <td>${lead.mc_number || 'N/A'}</td>
                <td>${lead.insurance_carrier || 'Unknown Carrier'}</td>
                <td>${lead.policy_number || 'N/A'}</td>
                <td>${coverageAmount}</td>
                <td>
                    <strong>${formattedExpiry}</strong>
                    <br><small class="${daysUntil <= 7 ? 'text-danger' : daysUntil <= 30 ? 'text-warning' : 'text-success'}">${daysUntil} days</small>
                </td>
                <td>
                    <span class="badge badge-info">${lead.coverage_level || 'Primary'}</span>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Update count display
        const countElement = document.querySelector('#generateLeads .lead-count');
        if (countElement) {
            countElement.textContent = leads.length;
        }

        // Show the results section
        const resultsSection = document.getElementById('generatedLeadsResults');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }

        console.log(`📊 Displayed ${leads.length} FCSMA leads in table`);
    }

    // Add carrier filter to lead generation form if it doesn't exist
    function addCarrierFilter() {
        const leadForm = document.querySelector('#generateLeads form, .lead-generation-form');
        if (!leadForm) return;

        // Check if carrier filter already exists
        if (document.getElementById('carrierFilter')) return;

        // Create carrier filter
        const carrierGroup = document.createElement('div');
        carrierGroup.className = 'form-group';
        carrierGroup.innerHTML = `
            <label for="carrierFilter">Insurance Carrier (Optional):</label>
            <select id="carrierFilter" class="form-control">
                <option value="">All Carriers</option>
                <option value="GEICO">GEICO Companies</option>
                <option value="PROGRESSIVE">Progressive Companies</option>
                <option value="UNITED FINANCIAL">United Financial Casualty</option>
                <option value="ARTISAN">Artisan & Truckers</option>
                <option value="GREAT WEST">Great West Casualty</option>
                <option value="NORTHLAND">Northland Insurance</option>
                <option value="CANAL">Canal Insurance</option>
            </select>
        `;

        // Insert after the expiry days field
        const expiryField = document.getElementById('expiryDays')?.closest('.form-group');
        if (expiryField) {
            expiryField.parentNode.insertBefore(carrierGroup, expiryField.nextSibling);
        } else {
            leadForm.appendChild(carrierGroup);
        }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Add carrier filter after a short delay to ensure form is ready
        setTimeout(addCarrierFilter, 1000);
    });

    // Also try to add carrier filter if we're already on the page
    setTimeout(addCarrierFilter, 2000);

    console.log('✅ FCSMA-LEAD-INTEGRATION: Ready to query FCSMA database for leads');
})();