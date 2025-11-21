// Performance-Optimized Lead Generation Script
// Removes heavy lead list display for faster UI

// Enhanced displayLeadSummary function - replaces displayGeneratedLeads
window.displayLeadSummary = function(data) {
    const resultsDiv = document.getElementById('generateResults');
    if (!resultsDiv) return;

    const stats = data.stats || {};
    const totalLeads = stats.total_leads || data.total || 0;
    const progressiveLeads = stats.progressive_leads || 0;
    const withEmail = stats.with_email || 0;
    const withPhone = stats.with_phone || 0;
    const sampleLeads = data.leads || [];

    if (totalLeads === 0) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                No leads found with the specified criteria.
            </div>
        `;
        return;
    }

    // Store for export
    window.generatedLeadsData = sampleLeads;
    window.generatedLeadsStats = stats;

    let html = `
        <div style="margin: 20px 0;">
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3>📊 Lead Generation Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div style="background: #4CAF50; color: white; padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${totalLeads.toLocaleString()}</div>
                        <div>Total Leads</div>
                    </div>
                    <div style="background: #2196F3; color: white; padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${progressiveLeads.toLocaleString()}</div>
                        <div>Progressive Policies</div>
                    </div>
                    <div style="background: #FF9800; color: white; padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${withEmail.toLocaleString()}</div>
                        <div>With Email</div>
                    </div>
                    <div style="background: #9C27B0; color: white; padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">${withPhone.toLocaleString()}</div>
                        <div>With Phone</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="exportGeneratedLeads('excel')">
                    <i class="fas fa-download"></i> Export to Excel
                </button>
                <button class="btn btn-secondary" onclick="exportGeneratedLeads('json')">
                    <i class="fas fa-file-code"></i> Export JSON
                </button>
                <button class="btn btn-success" onclick="uploadToVicidialWithCriteria()">
                    <i class="fas fa-upload"></i> Upload to Vicidial
                </button>
                <button class="btn btn-info" onclick="sendEmailBlast()">
                    <i class="fas fa-envelope"></i> Email Blast
                </button>
            </div>
    `;

    // Only show sample leads for preview (performance optimization)
    if (sampleLeads && sampleLeads.length > 0) {
        html += `
            <div style="background: #fff; border: 1px solid #ddd; border-radius: 5px;">
                <div style="background: #f8f9fa; padding: 10px; border-bottom: 1px solid #ddd;">
                    <strong>📋 Sample Leads (First ${sampleLeads.length} of ${totalLeads.toLocaleString()})</strong>
                    <span style="color: #666; font-size: 12px;"> - Use Export for full list</span>
                </div>
                <table class="data-table" style="width: 100%; margin: 0;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th>DOT#</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Fleet</th>
                            <th>Insurance</th>
                            <th>Expires</th>
                            <th>Contact</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sampleLeads.forEach(lead => {
            const daysUntilRenewal = lead.days_until_renewal || lead.days_until_expiry || 'N/A';
            const renewalClass = daysUntilRenewal <= 7 ? 'color: #dc3545; font-weight: bold;' :
                               daysUntilRenewal <= 30 ? 'color: #fd7e14;' : '';

            html += `
                <tr>
                    <td>${lead.dot_number || ''}</td>
                    <td style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lead.legal_name || lead.company_name || ''}</td>
                    <td>${lead.city || ''}, ${lead.state || ''}</td>
                    <td>${lead.power_units || 0}</td>
                    <td style="max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lead.insurance_company || 'N/A'}</td>
                    <td style="${renewalClass}">${daysUntilRenewal} days</td>
                    <td>
                        ${lead.phone ? `<i class="fas fa-phone" style="color: green;" title="${lead.phone}"></i>` : ''}
                        ${lead.email ? `<i class="fas fa-envelope" style="color: blue;" title="${lead.email}"></i>` : ''}
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    html += '</div>';
    resultsDiv.innerHTML = html;
};

// Override the original generateLeads function for performance
window.generateLeads = function generateLeads() {
    const state = document.getElementById('genState')?.value || 'All';
    const expiry = document.getElementById('genExpiry')?.value || '30';
    const insurer = document.getElementById('genInsurer')?.value || '';
    const limit = '10000'; // High limit to get all matching results
    const skipDays = document.getElementById('genSkipDays')?.value || '0';
    const minFleet = document.getElementById('genMinFleet')?.value || '1';
    const maxFleet = document.getElementById('genMaxFleet')?.value || '9999';

    console.log('🚀 PERFORMANCE MODE: Generating leads with criteria:', {
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
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 18px; margin-bottom: 15px;">
                    <i class="fas fa-spinner fa-spin"></i> Scanning ${state === 'All' ? 'all states' : state} database...
                </div>
                <div style="color: #666;">
                    ⚡ Performance mode: Loading stats only for faster response
                </div>
            </div>
        `;
    }

    // Call the FINAL fixed API
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
            console.log('📊 Performance API Response:', data);

            // Update statistics using new stats structure
            const stats = data.stats || {};
            const totalLeads = stats.total_leads || data.total || 0;

            document.getElementById('totalLeadsCount').textContent = totalLeads.toLocaleString();
            document.getElementById('expiringSoonCount').textContent =
                (stats.urgent_leads || data.leads?.filter(l => parseInt(l.days_until_renewal) <= 7).length || 0).toLocaleString();
            document.getElementById('withContactCount').textContent =
                (stats.with_email || data.leads?.filter(l => l.email || l.phone).length || 0).toLocaleString();

            // Display optimized summary
            displayLeadSummary(data);

            // Reset button state
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
            }

            // Show success message
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => successMsg.style.display = 'none', 5000);
            }
        })
        .catch(error => {
            console.error('❌ Error generating leads:', error);

            // Reset button state
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
            }

            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div style="color: red; padding: 20px; text-align: center;">
                        <i class="fas fa-exclamation-triangle"></i> Error generating leads: ${error.message}
                        <br><small>Check console for details</small>
                    </div>
                `;
            }
        });
};

// Also override generateLeadsFromForm for consistency
window.generateLeadsFromForm = window.generateLeads;

console.log('⚡ Performance Lead Generation loaded - Optimized for speed!');
console.log('   📊 Shows summary stats instead of full lead lists');
console.log('   🚀 Faster loading and better UI performance');
console.log('   📋 Sample leads shown for preview, export for full data');