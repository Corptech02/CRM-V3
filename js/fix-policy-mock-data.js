// Aggressive fix to replace specific mock policy data
console.log('🔨 Aggressively removing mock policy data...');

(function() {
    // Get the correct API URL
    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';

    // Function to detect and replace mock data
    async function replaceMockData() {
        const policyList = document.getElementById('policyList');
        if (!policyList) return;

        // Check for the EXACT mock data the user reported
        const content = policyList.innerHTML || policyList.textContent || '';
        if (content.includes('POL-2024-001') ||
            content.includes('Sample Trucking Co') ||
            content.includes('Express Logistics LLC') ||
            content.includes('Heavy Haulers Inc')) {

            console.log('⚠️ MOCK DATA DETECTED! Replacing with real data...');

            try {
                // Show loading state
                policyList.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin"></i> Loading REAL policies...
                        </td>
                    </tr>
                `;

                // Fetch real policies
                const response = await fetch(`${API_URL}/api/policies`, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Bypass-Tunnel-Reminder': 'true'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch policies');
                }

                const data = await response.json();
                const policies = Array.isArray(data) ? data : (data.policies || []);

                console.log(`✅ Fetched ${policies.length} real policies`);

                // Clear and rebuild table
                const table = policyList.closest('table') || policyList.parentElement;
                if (table && table.tagName === 'TABLE') {
                    // Rebuild entire table with real data
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Policy #</th>
                                <th>Client</th>
                                <th>Type</th>
                                <th>Coverage</th>
                                <th>Expiry</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="policyList">
                        </tbody>
                    `;

                    const tbody = table.querySelector('#policyList');

                    if (policies.length === 0) {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                                    <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px;"></i>
                                    <p>No policies found</p>
                                    <button class="btn-primary" onclick="addNewPolicy()" style="margin-top: 16px;">
                                        <i class="fas fa-plus"></i> Add Policy
                                    </button>
                                </td>
                            </tr>
                        `;
                    } else {
                        policies.forEach(policy => {
                            // Format the expiration date
                            const expiryDate = new Date(policy.expirationDate || policy.expiration_date || policy.expiry);
                            const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric'
                            });

                            // Format coverage amount
                            let coverage = policy.coverage?.['Liability Limits'] ||
                                          policy.premium ||
                                          policy.annualPremium ||
                                          'N/A';

                            if (typeof coverage === 'string') {
                                coverage = coverage.replace(/[$,]/g, '');
                            }

                            const num = parseFloat(coverage);
                            if (!isNaN(num)) {
                                if (num >= 1000000) {
                                    coverage = `$${(num / 1000000).toFixed(0)}M`;
                                } else if (num >= 1000) {
                                    coverage = `$${(num / 1000).toFixed(0)}K`;
                                } else {
                                    coverage = `$${num}`;
                                }
                            }

                            // Determine status
                            const today = new Date();
                            const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
                            let statusClass = 'status-active';
                            if (daysUntilExpiry < 0) {
                                statusClass = 'status-expired';
                            } else if (daysUntilExpiry < 30) {
                                statusClass = 'status-warning';
                            }

                            const row = document.createElement('tr');
                            row.className = `policy-row ${statusClass}`;
                            row.innerHTML = `
                                <td><strong>${policy.policyNumber || policy.id || 'N/A'}</strong></td>
                                <td>${policy.clientName || policy.insured?.['Name/Business Name'] || 'Unknown'}</td>
                                <td><span class="policy-type">${policy.policyType || 'Commercial Auto'}</span></td>
                                <td>${coverage}</td>
                                <td>
                                    <span class="status-badge ${statusClass}">
                                        ${formattedExpiry}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="viewPolicyProfile('${policy.id || policy.policyNumber}')" title="View Profile">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            `;
                            tbody.appendChild(row);
                        });
                    }

                    console.log('✅ Successfully replaced mock data with real policies');
                } else {
                    // Fallback: just replace innerHTML
                    policyList.innerHTML = '';
                    policies.forEach(policy => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${policy.policyNumber || 'N/A'}</td>
                            <td>${policy.clientName || 'Unknown'}</td>
                            <td>${policy.policyType || 'Commercial Auto'}</td>
                            <td>${policy.premium || 'N/A'}</td>
                            <td>${new Date(policy.expirationDate || Date.now()).toLocaleDateString()}</td>
                            <td>
                                <button class="btn-icon" onclick="viewPolicyProfile('${policy.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        `;
                        policyList.appendChild(row);
                    });
                }
            } catch (error) {
                console.error('Error loading policies:', error);
                policyList.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 20px; color: #ef4444;">
                            <i class="fas fa-exclamation-triangle"></i> Error: ${error.message}
                            <br>
                            <button onclick="replaceMockData()" style="margin-top: 10px;">Retry</button>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Make function globally available
    window.replaceMockData = replaceMockData;

    // Run on multiple triggers
    function checkAndReplace() {
        if (window.location.hash === '#coi' || window.location.hash === '#policy-management') {
            replaceMockData();
        }
    }

    // Immediate execution
    checkAndReplace();

    // DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndReplace);
    } else {
        setTimeout(checkAndReplace, 0);
        setTimeout(checkAndReplace, 100);
        setTimeout(checkAndReplace, 500);
        setTimeout(checkAndReplace, 1000);
    }

    // Hash changes
    window.addEventListener('hashchange', checkAndReplace);

    // Periodic check - very aggressive
    setInterval(() => {
        const policyList = document.getElementById('policyList');
        if (policyList) {
            const content = policyList.innerHTML || policyList.textContent || '';
            if (content.includes('POL-2024-001') ||
                content.includes('Sample Trucking Co') ||
                content.includes('Express Logistics LLC')) {
                console.log('🔄 Mock data re-appeared, replacing again...');
                replaceMockData();
            }
        }
    }, 1000); // Check every second

    console.log('✅ Aggressive mock data replacement active');
})();