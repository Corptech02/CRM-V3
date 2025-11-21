// Fix Policy Profiles - Load Real Data Instead of Mock
console.log('🚫 fix-real-policies.js DISABLED to prevent POL-2024-* test policy regeneration');
return;

(function() {
    // Get the correct API URL
    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';

    // Force override immediately - before any other script can run
    console.log('🚀 Forcing immediate loadPolicyList override...');

    // Store original if it exists
    const originalLoadPolicyList = window.loadPolicyList;

    // Override loadPolicyList function immediately
    window.loadPolicyList = async function() {
        const policyList = document.getElementById('policyList');
        if (!policyList) return;

        console.log('📋 Fetching real policies from database...');

        try {
            // Show loading state
            policyList.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        <i class="fas fa-spinner fa-spin"></i> Loading real policies...
                    </td>
                </tr>
            `;

            // Fetch real policies from API
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
            // API returns array directly, not wrapped in object
            const policies = Array.isArray(data) ? data : (data.policies || []);

            // Clear loading state
            policyList.innerHTML = '';

            if (policies.length === 0) {
                policyList.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">
                            No policies found. Add policies through the Lead Management system.
                        </td>
                    </tr>
                `;
                return;
            }

            // Display real policies
            policies.forEach(policy => {
                // Format the expiration date - check different field names
                const expiryDate = new Date(policy.expirationDate || policy.expiration_date || policy.expiry);
                const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                });

                // Determine status based on expiration
                const today = new Date();
                const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
                let status = 'active';
                let statusClass = 'status-active';
                let statusText = 'Active';

                if (daysUntilExpiry < 0) {
                    status = 'expired';
                    statusClass = 'status-expired';
                    statusText = 'Expired';
                } else if (daysUntilExpiry < 30) {
                    status = 'expiring';
                    statusClass = 'status-warning';
                    statusText = 'Expiring Soon';
                } else if (daysUntilExpiry < 60) {
                    status = 'renewing';
                    statusClass = 'status-renewing';
                    statusText = 'Renewal Due';
                }

                // Format coverage amount - check coverage object or premium
                let coverage = policy.coverage?.['Liability Limits'] ||
                              policy.premium ||
                              policy.annualPremium ||
                              policy.coverage_limits?.bodily_injury ||
                              'N/A';

                // Clean up coverage value and format it
                if (typeof coverage === 'string') {
                    coverage = coverage.replace(/[$,]/g, ''); // Remove $ and commas
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
                } else {
                    coverage = coverage || 'N/A';
                }

                // Create table row with real data fields
                const row = document.createElement('tr');
                row.className = `policy-row ${statusClass}`;
                row.innerHTML = `
                    <td style="font-weight: 600;">${policy.policyNumber || policy.policy_number || policy.id || 'N/A'}</td>
                    <td>${policy.clientName || policy.company_name || policy.client || policy.insured?.['Name/Business Name'] || 'Unknown'}</td>
                    <td>${policy.policyType || policy.policy_type || policy.type || 'Commercial Auto'}</td>
                    <td>${coverage}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${formattedExpiry}
                        </span>
                    </td>
                    <td>
                        <button class="btn-small btn-icon" onclick="viewPolicyDetails('${policy.id || policy.policyNumber || policy.policy_number}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-small btn-icon" onclick="sendCOI('${policy.id || policy.policyNumber || policy.policy_number}')" title="Send COI">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                        <button class="btn-small btn-icon btn-danger" onclick="renewPolicy('${policy.id || policy.policyNumber || policy.policy_number}')" title="Renew">
                            <i class="fas fa-sync"></i>
                        </button>
                    </td>
                `;
                policyList.appendChild(row);
            });

            console.log(`✅ Loaded ${policies.length} real policies`);

        } catch (error) {
            console.error('Error loading policies:', error);

            // Fallback to showing error
            policyList.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #ef4444;">
                        <i class="fas fa-exclamation-triangle"></i> Error loading policies: ${error.message}
                        <br>
                        <button onclick="loadPolicyList()" style="margin-top: 10px; padding: 5px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    };

    // Auto-reload policies when on policy page
    function checkAndReloadPolicies() {
        if (window.location.hash === '#policy-management') {
            const policyList = document.getElementById('policyList');
            if (policyList) {
                // Check if it has mock data (both old and new patterns)
                const hasMockData = policyList.innerHTML.includes('Swift Trucking LLC') ||
                                   policyList.innerHTML.includes('POL-001') ||
                                   policyList.innerHTML.includes('Eagle Transport Inc') ||
                                   policyList.innerHTML.includes('Sample Trucking') ||
                                   policyList.innerHTML.includes('POL-2024-001') ||
                                   policyList.innerHTML.includes('Express Logistics LLC') ||
                                   policyList.innerHTML.includes('Heavy Haulers Inc');

                if (hasMockData) {
                    console.log('🔄 Replacing mock policies with real data...');
                    loadPolicyList();
                }
            }
        }
    }

    // Check on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndReloadPolicies);
    } else {
        // Force immediate check
        checkAndReloadPolicies();
        setTimeout(checkAndReloadPolicies, 100);
        setTimeout(checkAndReloadPolicies, 500);
    }

    // Check when navigating to policy page
    window.addEventListener('hashchange', checkAndReloadPolicies);

    // Also check periodically
    setInterval(() => {
        if (window.location.hash === '#policy-management') {
            const policyList = document.getElementById('policyList');
            if (policyList && (
                policyList.innerHTML.includes('Swift Trucking LLC') ||
                policyList.innerHTML.includes('Sample Trucking') ||
                policyList.innerHTML.includes('POL-2024-001') ||
                policyList.innerHTML.includes('Express Logistics LLC')
            )) {
                console.log('Mock data detected, reloading...');
                loadPolicyList();
            }
        }
    }, 3000);

})();

console.log('✅ Real policies fix loaded');