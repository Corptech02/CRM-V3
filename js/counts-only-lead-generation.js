// COUNTS ONLY Lead Generation Script
// Simple scan and filter - shows ONLY accurate counts, no lead data

window.displayCountsOnly = function(data) {
    const resultsDiv = document.getElementById('generateResults');
    if (!resultsDiv) return;

    const stats = data.stats || {};
    const totalLeads = stats.total_leads || data.total || 0;
    const progressiveLeads = stats.progressive_leads || 0;
    const withEmail = stats.with_email || 0;
    const withPhone = stats.with_phone || 0;
    const urgentLeads = stats.urgent_leads || 0;

    if (totalLeads === 0) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px;">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <div style="font-size: 18px; margin-bottom: 10px;">No leads found</div>
                <div>Try adjusting your search criteria</div>
            </div>
        `;
        return;
    }

    // Store stats for export
    window.generatedLeadsStats = stats;
    window.generatedLeadsData = []; // Empty - no lead data

    // Just show a simple success message - no fancy UI
    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 5px; margin: 20px 0;">
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
            Successfully generated ${totalLeads.toLocaleString()} leads
        </div>
    `;
};

// Disable the main displayGeneratedLeads function to prevent duplicate UI
window.displayGeneratedLeads = function() {
    // Disabled - using counts-only display instead
};

// Override the main export function with direct CSV export
window.exportGeneratedLeads = function(format) {
    console.log('🔄 Export requested, fetching data:', format);

    // Get the same criteria used for the current count search
    const state = document.getElementById('genState')?.value || 'All';
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    const minFleet = '0';
    const maxFleet = '99999';

    // Get selected insurance companies
    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(checkbox => {
        insuranceCompanies.push(checkbox.value);
    });
    const insurer = insuranceCompanies.join(',');

    // Build export API URL
    const params = new URLSearchParams({
        days: expiry,
        state: state === 'All' ? '' : state,
        skip_days: skipDays,
        min_fleet: minFleet,
        max_fleet: maxFleet,
        limit: '50000'
    });

    if (insurer) {
        params.append('insurance_companies', insurer);
    }

    fetch(`http://162.220.14.239:3001/api/matched-carriers-leads/export?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.leads && data.leads.length > 0) {
                console.log(`📊 Exporting ${data.leads.length} leads`);

                const timestamp = new Date().toISOString().split('T')[0];

                if (format === 'json') {
                    // JSON Export
                    const jsonData = JSON.stringify(data.leads, null, 2);
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `leads_${state}_${timestamp}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    // CSV/Excel Export with complete address and representative data
                    let csv = 'USDOT Number,MC Number,Company Name,Representative Name,Representative Title,Street Address,City,State,Zip Code,Full Address,Phone,Cell Phone,Fax,Email,Fleet Size,Drivers,Insurance Amount,Insurance Expiry,Insurance Company,Safety Rating,Operating Status,Business Type,Cargo Carried\n';

                    data.leads.forEach(lead => {
                        csv += `"${lead.usdot_number || ''}","${lead.mc_number || ''}","${lead.company_name || lead.legal_name || ''}","${lead.representative_name || ''}","${lead.representative_title || ''}","${lead.street_address || lead.street || ''}","${lead.city || ''}","${lead.state || ''}","${lead.zip_code || ''}","${lead.full_address || ''}","${lead.phone || ''}","${lead.cell_phone || ''}","${lead.fax || ''}","${lead.email || ''}","${lead.fleet_size || ''}","${lead.drivers || ''}","${lead.insurance_amount || ''}","${lead.insurance_expiry || ''}","${lead.insurance_company || ''}","${lead.safety_rating || ''}","${lead.operating_status || ''}","${lead.business_type || ''}","${lead.cargo_carried || ''}"\n`;
                    });

                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `leads_${state}_${timestamp}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }

                console.log(`✅ Export complete: ${data.leads.length} leads`);
            } else {
                alert('No leads found for export with current criteria');
            }
        })
        .catch(error => {
            console.error('❌ Export error:', error);
            alert(`Export failed: ${error.message}`);
        });
};

// Override the lead generation function for COUNTS ONLY
window.generateLeads = function generateLeads() {
    const state = document.getElementById('genState')?.value || 'All';
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const limit = '50000';
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    // FORCE correct fleet size to include all leads (0 power_units and large fleets)
    const minFleet = '0';  // Always include leads with 0 or no fleet data
    const maxFleet = '99999';  // Always include large fleets

    // PROPERLY collect selected insurance companies from checkboxes
    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(checkbox => {
        insuranceCompanies.push(checkbox.value);
    });
    const insurer = insuranceCompanies.join(',');

    console.log('🔢 COUNTS ONLY: Scanning database with criteria:', {
        state, expiry, insurer, limit, skipDays, minFleet, maxFleet
    });

    // Show loading state
    const btn = document.querySelector('button[onclick="generateLeads()"], button[onclick*="generateLeads"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning database...';
    }

    const resultsDiv = document.getElementById('generateResults');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
                <div style="font-size: 24px; margin-bottom: 20px;">
                    <i class="fas fa-database fa-spin"></i> Scanning Database
                </div>
                <div style="font-size: 16px; opacity: 0.9; margin-bottom: 10px;">
                    Filtering ${state === 'All' ? 'all states' : state} for ${expiry}-day expirations...
                </div>
                <div style="font-size: 14px; opacity: 0.7;">
                    🔢 Counts only - no lead data loaded for maximum speed
                </div>
            </div>
        `;
    }

    // Call the COUNTS ONLY API
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
            console.log('🔢 COUNTS ONLY API Response:', data);

            // Update main statistics
            const stats = data.stats || {};
            const totalLeads = stats.total_leads || data.total || 0;

            document.getElementById('totalLeadsCount').textContent = totalLeads.toLocaleString();
            document.getElementById('expiringSoonCount').textContent = (stats.urgent_leads || 0).toLocaleString();
            document.getElementById('withContactCount').textContent = (stats.with_email || 0).toLocaleString();

            // Display counts only
            displayCountsOnly(data);

            // Store criteria for Vicidial upload (same format as original)
            window.lastGeneratedCriteria = {
                state: state,
                insuranceCompanies: insuranceCompanies, // Pass selected companies
                daysUntilExpiry: parseInt(expiry) || 30,
                displayExpiry: `${expiry} days`, // For display purposes
                skipDays: parseInt(skipDays) || 0,
                totalLeads: totalLeads, // Total count from API
                limit: totalLeads // Pass count as limit for upload
            };

            console.log('✅ Stored criteria for Vicidial upload:', JSON.stringify(window.lastGeneratedCriteria, null, 2));

            // Reset button
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads';
            }

            // Show success message
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => successMsg.style.display = 'none', 5000);
            }
        })
        .catch(error => {
            console.error('❌ COUNTS ONLY API Error:', error);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads';
            }

            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div style="color: #dc3545; padding: 30px; text-align: center; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 15px;"></i>
                        <div style="font-size: 18px; margin-bottom: 10px;">Error scanning database</div>
                        <div style="font-size: 14px;">${error.message}</div>
                    </div>
                `;
            }
        });
};


// Override the uploadToVicidialWithCriteria function to work with counts-only
window.uploadToVicidialWithCriteria = function() {
    // Check if we have criteria from last generation
    if (!window.lastGeneratedCriteria) {
        alert('Please generate leads first before uploading to Vicidial');
        return;
    }

    console.log('=== INITIATING VICIDIAL UPLOAD ===');
    console.log('Using stored criteria:', JSON.stringify(window.lastGeneratedCriteria, null, 2));
    console.log('Total leads to upload:', window.lastGeneratedCriteria.totalLeads);

    // Call vicidialUploader with the exact criteria used for generation
    if (window.vicidialUploader) {
        window.vicidialUploader.showUploadDialog(window.lastGeneratedCriteria);
    } else {
        alert('Vicidial uploader not loaded - will upload ' + window.lastGeneratedCriteria.totalLeads + ' leads');
    }
};

window.uploadCountsToVicidial = window.uploadToVicidialWithCriteria;

window.sendEmailToCounts = async function() {
    try {
        // First fetch the actual lead data
        await fetchLeadDataForAction();

        // Use the existing email blast function from app.js
        if (window.sendEmailBlast) {
            window.sendEmailBlast();
        } else {
            const stats = window.generatedLeadsStats || {};
            alert(`Email campaign functionality not available. ${stats.with_email || 0} leads have email addresses.`);
        }
    } catch (error) {
        console.error('❌ Email campaign error:', error);
        alert(`Email campaign failed: ${error.message}`);
    }
};

// Helper function to fetch lead data for actions
async function fetchLeadDataForAction() {
    // Get the same criteria used for the current count search
    const state = document.getElementById('genState')?.value || 'All';
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    const minFleet = '0';
    const maxFleet = '99999';

    // Get selected insurance companies
    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(checkbox => {
        insuranceCompanies.push(checkbox.value);
    });
    const insurer = insuranceCompanies.join(',');

    console.log('🔄 Fetching lead data for action with criteria:', {
        state, expiry, insurer, skipDays, minFleet, maxFleet
    });

    // Build export API URL with same parameters
    const params = new URLSearchParams({
        days: expiry,
        state: state === 'All' ? '' : state,
        skip_days: skipDays,
        min_fleet: minFleet,
        max_fleet: maxFleet,
        limit: '50000'
    });

    if (insurer) {
        params.append('insurance_companies', insurer);
    }

    const response = await fetch(`http://162.220.14.239:3001/api/matched-carriers-leads/export?${params}`);
    const data = await response.json();

    if (!data.success || !data.leads || data.leads.length === 0) {
        throw new Error('No leads found with current criteria');
    }

    console.log(`📊 Lead data fetched for action: ${data.leads.length} leads`);

    // Set the data for other functions to use
    window.generatedLeadsData = data.leads;
    window.generatedLeads = data.leads;  // Some functions might expect this variable name

    // Store criteria for Vicidial upload
    window.lastGeneratedCriteria = {
        state: state,
        days: expiry,
        skipDays: skipDays,
        insurer: insurer,
        totalLeads: data.leads.length,
        filters: data.filters
    };

    return data.leads;
}

// Override other functions for consistency
window.generateLeadsFromForm = window.generateLeads;

console.log('🔢 COUNTS ONLY Lead Generation loaded');
console.log('   📊 Returns accurate counts only - no lead data');
console.log('   ⚡ Maximum performance - instant results');
console.log('   🎯 Pure scan and filter functionality');