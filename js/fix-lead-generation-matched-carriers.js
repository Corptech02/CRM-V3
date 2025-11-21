// Fix Lead Generation - Use Matched Carriers CSV Database
// Updates lead generation to filter from /home/corp06/matched_carriers CSV
// and export all 23 fields matching the Ohio leads CSV format
console.log('🔧 Fixing Lead Generation to use Matched Carriers database...');

// Using XMLHttpRequest to completely bypass fetch interceptors from other scripts

// Override the generateLeadsFromForm function to use matched carriers API
window.generateLeadsFromForm = async function() {
    console.log('🔄 Generating leads from Matched Carriers database...');
    console.log('📋 Lead Criteria Selected:');

    // Get all form values
    const state = document.getElementById('genState')?.value;
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    // No limit - fetch all available leads
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '9999';

    // Log the criteria being applied
    console.log(`   🏛️  State: ${state}`);
    console.log(`   📅  Days until expiry: ${expiry}`);
    console.log(`   ⏭️   Skip days: ${skipDays}`);
    console.log(`   🚛  Fleet size: ${minFleet} - ${maxFleet}`);

    if (!state) {
        alert('Please select a state to generate leads.');
        return;
    }

    // Show loading state
    document.getElementById('totalLeadsCount').textContent = 'Loading...';
    document.getElementById('expiringSoonCount').textContent = 'Loading...';
    document.getElementById('withContactCount').textContent = 'Loading...';

    const successDiv = document.getElementById('successMessage');
    successDiv.style.display = 'none';

    try {
        // Call the matched carriers API - this uses the real FMCSA database (imported from CSV)
        const params = new URLSearchParams({
            state: state,
            days: expiry,
            skip_days: skipDays,
            min_fleet: minFleet,
            max_fleet: maxFleet
            // No limit - fetch all available leads
        });

        // Use proxy endpoint through main backend - use current location to avoid CORS
        console.log('🔍 Current location:', window.location.origin);
        console.log('🔍 window.VANGUARD_API_URL:', window.VANGUARD_API_URL);

        // Force using current location with port 3001 to match the current page
        const currentHost = window.location.hostname;
        const currentProtocol = window.location.protocol;
        const baseUrl = `${currentProtocol}//${currentHost}:3001/api`;
        console.log('🔍 Constructed baseUrl:', baseUrl);

        const apiUrl = `${baseUrl}/matched-carriers-leads?${params}`;
        console.log('🔗 Final API URL:', apiUrl);

        // Use XMLHttpRequest to bypass all fetch interceptors completely
        const data = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Set 5-minute timeout
            xhr.timeout = 5 * 60 * 1000; // 5 minutes

            xhr.onload = function() {
                console.log('📡 XMLHttpRequest response status:', xhr.status);
                console.log('📡 XMLHttpRequest response length:', xhr.responseText.length);

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        console.log('✅ Successfully parsed JSON response');
                        resolve(responseData);
                    } catch (e) {
                        console.error('❌ JSON parsing error:', e);
                        console.log('Raw response:', xhr.responseText.substring(0, 500));
                        reject(new Error(`Invalid JSON response: ${e.message}`));
                    }
                } else {
                    console.error('❌ HTTP error response:', xhr.status, xhr.statusText);
                    console.log('Error response body:', xhr.responseText.substring(0, 500));
                    reject(new Error(`HTTP error! status: ${xhr.status} - ${xhr.statusText}`));
                }
            };

            xhr.onerror = function() {
                console.error('❌ XMLHttpRequest network error:', xhr.status, xhr.statusText);
                reject(new Error(`Network error: ${xhr.status} ${xhr.statusText}`));
            };

            xhr.ontimeout = function() {
                console.error('❌ XMLHttpRequest timeout after 5 minutes');
                reject(new Error('Request timed out after 5 minutes. Please try with more specific filters.'));
            };

            xhr.open('GET', apiUrl, true);
            xhr.setRequestHeader('Accept', 'application/json');

            // Add progress logging
            xhr.onreadystatechange = function() {
                console.log(`📊 XMLHttpRequest state: ${xhr.readyState} (${getReadyStateText(xhr.readyState)})`);
                if (xhr.readyState === 4) {
                    console.log(`📊 Final status: ${xhr.status}`);
                }
            };

            console.log('🚀 Sending XMLHttpRequest to:', apiUrl);
            xhr.send();
        });

        function getReadyStateText(state) {
            const states = {
                0: 'UNSENT',
                1: 'OPENED',
                2: 'HEADERS_RECEIVED',
                3: 'LOADING',
                4: 'DONE'
            };
            return states[state] || 'UNKNOWN';
        }

        console.log('🎯 Received FMCSA leads data:', data);

        if (data.success && data.leads) {
            // Store globally for export/viewing - transform to match export format
            window.generatedLeadsData = data.leads.map(lead => transformLeadData(lead));

            // Update statistics display using the API's stats
            const totalLeads = data.stats.total_leads || data.leads.length;
            const expiringSoon = data.leads.filter(lead => parseInt(lead.days_until_expiry) <= 7).length;
            const withContact = data.stats.with_email + data.stats.with_phone || data.leads.filter(lead => lead.email || lead.phone).length;

            document.getElementById('totalLeadsCount').textContent = totalLeads.toLocaleString();
            document.getElementById('expiringSoonCount').textContent = expiringSoon.toLocaleString();
            document.getElementById('withContactCount').textContent = withContact.toLocaleString();

            // Show success message
            successDiv.style.display = 'block';

            console.log(`✅ Generated ${totalLeads} leads for ${state}`);
        } else {
            throw new Error(data.message || 'Failed to fetch leads');
        }

    } catch (error) {
        console.error('❌ Error generating leads:', error);
        alert(`Error generating leads: ${error.message}`);

        // Reset display
        document.getElementById('totalLeadsCount').textContent = '-';
        document.getElementById('expiringSoonCount').textContent = '-';
        document.getElementById('withContactCount').textContent = '-';
    }
};

// Transform lead data from API format to standardized export format
function transformLeadData(lead) {
    // Build full address
    const addressParts = [lead.city, lead.state].filter(p => p && p.trim());
    const fullAddress = addressParts.join(', ');

    return {
        // All 23 fields matching Ohio leads CSV format exactly
        usdot_number: lead.dot_number || '',
        mc_number: lead.mc_number || '',
        company_name: lead.company_name || lead.legal_name || '',
        representative_name: lead.representative_name || '',
        representative_title: lead.representative_title || 'Representative',
        street_address: lead.street_address || '', // Available from API now
        city: lead.city || '',
        state: lead.state || '',
        zip_code: lead.zip_code || '', // Available from API now
        full_address: fullAddress,
        phone: lead.phone || lead.phone_number || '',
        cell_phone: lead.cell_phone || '', // Check if available
        fax: lead.fax || '', // Check if available
        email: lead.email || lead.email_address || '',
        fleet_size: lead.power_units || lead.fleet_size || '1',
        drivers: lead.drivers || '', // Check if available
        insurance_amount: lead.insurance_amount || '', // Check if available
        insurance_expiry: lead.insurance_expiry || '',
        insurance_company: lead.insurance_company || lead.insurer_name || '',
        safety_rating: lead.safety_rating || '', // Check if available
        operating_status: lead.operating_status || 'Active',
        business_type: lead.business_type || '', // Check if available
        cargo_carried: lead.cargo_carried || '', // Check if available

        // Keep original fields for internal use and debugging
        dot_number: lead.dot_number || '',
        legal_name: lead.legal_name || lead.company_name || '',
        email_address: lead.email || lead.email_address || '',
        power_units: lead.power_units || lead.fleet_size || '',
        days_until_expiry: lead.days_until_expiry
    };
}

// Override export function to include all 23 fields
window.exportGeneratedLeads = function(format) {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to export. Please generate leads first.');
        return;
    }

    const leads = window.generatedLeadsData;

    if (format === 'excel') {
        // All 23 headers matching your Ohio leads CSV exactly
        const headers = [
            'USDOT Number', 'MC Number', 'Company Name', 'Representative Name', 'Representative Title',
            'Street Address', 'City', 'State', 'Zip Code', 'Full Address', 'Phone', 'Cell Phone',
            'Fax', 'Email', 'Fleet Size', 'Drivers', 'Insurance Amount', 'Insurance Expiry',
            'Insurance Company', 'Safety Rating', 'Operating Status', 'Business Type', 'Cargo Carried'
        ];

        const csvContent = [
            headers.map(h => `"${h}"`).join(','),
            ...leads.map(lead => [
                `"${lead.usdot_number}"`,
                `"${lead.mc_number}"`,
                `"${(lead.company_name || '').replace(/"/g, '""')}"`,
                `"${(lead.representative_name || '').replace(/"/g, '""')}"`,
                `"${lead.representative_title}"`,
                `"${(lead.street_address || '').replace(/"/g, '""')}"`,
                `"${(lead.city || '').replace(/"/g, '""')}"`,
                `"${lead.state}"`,
                `"${lead.zip_code}"`,
                `"${(lead.full_address || '').replace(/"/g, '""')}"`,
                `"${lead.phone}"`,
                `"${lead.cell_phone}"`,
                `"${lead.fax}"`,
                `"${lead.email}"`,
                `"${lead.fleet_size}"`,
                `"${lead.drivers}"`,
                `"${lead.insurance_amount}"`,
                `"${lead.insurance_expiry}"`,
                `"${(lead.insurance_company || '').replace(/"/g, '""')}"`,
                `"${lead.safety_rating}"`,
                `"${lead.operating_status}"`,
                `"${lead.business_type}"`,
                `"${lead.cargo_carried}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const state = document.getElementById('genState')?.value || 'leads';
        const today = new Date().toISOString().split('T')[0];
        link.download = `leads_${state}_${today}.csv`;
        link.click();

        console.log(`✅ Exported ${leads.length} leads to CSV with all 23 fields`);
        alert(`Successfully exported ${leads.length} leads to CSV format!`);

    } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const state = document.getElementById('genState')?.value || 'leads';
        const today = new Date().toISOString().split('T')[0];
        link.download = `leads_${state}_${today}.json`;
        link.click();

        console.log(`✅ Exported ${leads.length} leads to JSON`);
        alert(`Successfully exported ${leads.length} leads to JSON format!`);
    }
};

// Override view function to show proper data
window.viewGeneratedLeads = function() {
    if (!window.generatedLeadsData || window.generatedLeadsData.length === 0) {
        alert('No leads to view. Please generate leads first.');
        return;
    }

    console.log(`📋 Viewing ${window.generatedLeadsData.length} generated leads:`, window.generatedLeadsData);

    // Create a simple modal to show lead data preview
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
        align-items: center; justify-content: center;
    `;

    const preview = window.generatedLeadsData.slice(0, 5); // Show first 5 leads

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 90%; max-height: 90%; overflow: auto;">
            <h2>Generated Leads Preview (${window.generatedLeadsData.length} total)</h2>
            <div style="margin: 20px 0;">
                <strong>Sample leads (first 5):</strong>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 12px; overflow: auto;">
${preview.map((lead, i) => `${i+1}. ${lead.company_name} (${lead.usdot_number})
   📍 ${lead.city}, ${lead.state}
   📞 ${lead.phone}
   📧 ${lead.email}
   🚛 Fleet: ${lead.fleet_size}
   📅 Expires: ${lead.insurance_expiry}
   🏢 Insurer: ${lead.insurance_company}
`).join('\n')}
                </pre>
            </div>
            <button onclick="this.parentElement.parentElement.remove()"
                    style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                Close Preview
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

console.log('✅ Lead Generation updated to use Matched Carriers CSV database');
console.log('📊 Export now includes all 23 fields matching Ohio leads CSV format');