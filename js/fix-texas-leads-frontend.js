// Fix Texas lead generation to use better endpoint
console.log('🔧 Fixing Texas lead generation...');

(function() {
    // Override generateLeadsFromForm when Texas is selected
    const originalGenerate = window.generateLeadsFromForm;

    window.generateLeadsFromForm = async function() {
        const state = document.getElementById('genState').value;

        // If Texas is selected, use the special endpoint
        if (state === 'TX') {
            const expiry = document.getElementById('genExpiry').value;
            const minFleet = document.getElementById('minFleet').value || 1;
            const maxFleet = document.getElementById('maxFleet').value || 1000;

            console.log('Using enhanced Texas lead generation...');

            // Show loading state
            const btn = document.querySelector('button[onclick="generateLeadsFromForm()"]');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Texas Leads...';
                btn.disabled = true;
            }

            try {
                // Handle 5/30 filter
                let days = expiry;
                let skipDays = 0;
                if (expiry === '5/30') {
                    days = 30;
                    skipDays = 5;
                }

                // Call the Texas-specific endpoint
                const response = await fetch(`http://162.220.14.239:3001/api/texas-leads?days=${days}&limit=500&skip_days=${skipDays}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch Texas leads');
                }

                const data = await response.json();

                // Filter by fleet size
                let filteredLeads = data.leads || [];
                if (minFleet || maxFleet) {
                    filteredLeads = filteredLeads.filter(lead => {
                        const fleet = lead.power_units || 0;
                        return fleet >= parseInt(minFleet) && fleet <= parseInt(maxFleet);
                    });
                }

                console.log(`Got ${filteredLeads.length} Texas leads after filtering`);

                // Store for export
                window.generatedLeadsData = filteredLeads.map(carrier => ({
                    usdot_number: carrier.dot_number,
                    mc_number: carrier.mc_number || 'N/A',
                    legal_name: carrier.legal_name || carrier.dba_name || 'N/A',
                    representative_name: carrier.representative_name || carrier.principal_name || 'N/A',
                    city: carrier.city || 'N/A',
                    state: carrier.state || 'TX',
                    phone: carrier.phone || 'N/A',
                    email: carrier.email_address || 'N/A',
                    fleet_size: carrier.power_units || 0,
                    insurance_expiry: carrier.policy_renewal_date || 'N/A',
                    insurance_company: carrier.insurance_carrier || 'Unknown',
                    insurance_amount: carrier.premium || carrier.bipd_insurance_on_file_amount || 0,
                    policy_number: carrier.policy_number || 'N/A',
                    safety_rating: carrier.safety_rating || 'None',
                    operating_status: carrier.operating_status || 'Unknown'
                }));

                // Update statistics
                const leadCount = filteredLeads.length;
                const expiringSoon = filteredLeads.filter(lead => {
                    if (!lead.policy_renewal_date) return false;
                    const daysUntil = Math.ceil((new Date(lead.policy_renewal_date) - new Date()) / (1000 * 60 * 60 * 24));
                    return daysUntil <= 30 && daysUntil > 0;
                }).length;
                const withContact = filteredLeads.filter(lead =>
                    lead.phone !== 'N/A' || lead.email_address !== 'N/A'
                ).length;

                document.getElementById('totalLeadsCount').textContent = leadCount.toLocaleString();
                document.getElementById('expiringSoonCount').textContent = expiringSoon.toLocaleString();
                document.getElementById('withContactCount').textContent = withContact.toLocaleString();

                // Display results
                displayGeneratedLeads(filteredLeads);

                // Show success
                document.getElementById('successMessage').style.display = 'block';

                // Store criteria for upload
                window.lastGeneratedCriteria = {
                    state: 'TX',
                    insuranceCompanies: [],
                    daysUntilExpiry: parseInt(days),
                    skipDays: skipDays,
                    totalLeads: leadCount,
                    limit: leadCount
                };

                console.log(`✅ Successfully generated ${leadCount} Texas leads`);

            } catch (error) {
                console.error('Error generating Texas leads:', error);
                alert('Error generating Texas leads. Please try again.');
            } finally {
                // Reset button
                const btn = document.querySelector('button[onclick="generateLeadsFromForm()"]');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
                    btn.disabled = false;
                }
            }

            return; // Don't continue to original function
        }

        // For non-Texas states, use the original function
        return originalGenerate.call(this);
    };

    console.log('✅ Texas lead generation fix active');
})();