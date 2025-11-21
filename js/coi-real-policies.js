// COI Real Policies - Fetch and display real policies from localStorage
console.log('🔥 COI Real Policies loading...');

// Create a new function to load real policies from server
window.loadRealPolicyList = function() {
    console.log('🚀 Loading real policies for COI interface...');

    const policyList = document.getElementById('policyList');
    if (!policyList) {
        console.error('policyList element not found');
        return;
    }

    // Always try to sync from server first, then fall back to localStorage
    console.log('Loading policies - checking server first...');

    // Show loading while fetching
    policyList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 16px;"></i>
            <p>Loading policies...</p>
        </div>
    `;

    // Try to fetch from server first (limit to 100 policies for COI to capture all current and future)
    Promise.race([
        fetch('/api/policies?limit=100'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ])
    .then(response => response.json())
    .then(data => {
        console.log('Policy API response received, total policies:', Array.isArray(data) ? data.length : 'not array');

        if (Array.isArray(data) && data.length > 0) {
            // Get all unique policies from server (no artificial limit)
            const uniquePolicies = [];
            const seen = new Set();
            for (const policy of data) {
                if (!seen.has(policy.policyNumber)) {
                    seen.add(policy.policyNumber);
                    // Ensure proper field mapping for display
                    uniquePolicies.push({
                        ...policy,
                        id: policy.policyNumber,
                        clientName: policy.clientName || policy.name || 'Unknown',
                        policyType: policy.policyType || policy.type || 'Commercial Auto',
                        expiryDate: policy.expiryDate || policy.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        coverageLimit: policy.coverage || 1000000
                    });
                }
            }

            // Save to localStorage for consistency
            localStorage.setItem('insurance_policies', JSON.stringify(uniquePolicies));

            // Display the policies
            displayPoliciesInCOI(uniquePolicies);
            return;
        }

        // If server has no data, fall back to localStorage
        fallbackToLocalStorage();
    })
    .catch(error => {
        console.error('Failed to fetch policies from server:', error);
        fallbackToLocalStorage();
    });

    function fallbackToLocalStorage() {
        console.log('Falling back to localStorage...');
        let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        console.log(`Loaded ${policies.length} policies from localStorage`, policies);

        if (policies.length === 0) {
            // No policies found anywhere
            policyList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc2626;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>No policies found</p>
                    <button class="btn-primary" onclick="window.loadRealPolicyList()" style="margin-top: 16px;">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
            return;
        }

        // Display policies from localStorage
        displayPoliciesInCOI(policies);
    }

    // Function to display policies in COI format
    function displayPoliciesInCOI(policies) {
        console.log(`Displaying ${policies.length} policies in COI`);
        const policyList = document.getElementById('policyList');
        if (!policyList) return;

        // Display policies using the same format as before
        policyList.innerHTML = `
            <table class="policy-table">
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
                <tbody>
                    ${policies.map(policy => {
                        // Determine status based on expiry
                        const expiryDate = new Date(policy.expiryDate || policy.expirationDate);
                        const today = new Date();
                        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
                        let status = daysUntilExpiry < 0 ? 'expired' : (daysUntilExpiry < 30 ? 'expiring' : 'active');

                        // Format coverage - check various property names
                        let coverageDisplay = '$1M'; // default
                        if (policy.coverageLimit) {
                            coverageDisplay = typeof policy.coverageLimit === 'number' ?
                                `$${(policy.coverageLimit / 1000000).toFixed(0)}M` : policy.coverageLimit;
                        } else if (policy.coverage?.['Liability Limit']) {
                            coverageDisplay = policy.coverage['Liability Limit'];
                        } else if (policy.coverage?.['Combined Single Limit']) {
                            coverageDisplay = policy.coverage['Combined Single Limit'];
                        } else if (typeof policy.coverage === 'string') {
                            coverageDisplay = policy.coverage;
                        } else if (policy.coverageDetails?.liabilityLimit) {
                            coverageDisplay = `$${Math.round(policy.coverageDetails.liabilityLimit / 1000)}K`;
                        } else if (policy.coverageDetails?.['Liability Limit']) {
                            coverageDisplay = policy.coverageDetails['Liability Limit'];
                        }

                        // Get policy type
                        const policyType = policy.policyType || policy.type || 'Commercial Auto';

                        // Get client name - check multiple possible field locations
                        let clientName = policy.clientName ||
                                        policy.name ||
                                        policy.insured?.['Name/Business Name'] ||
                                        policy.insured?.['Primary Named Insured'] ||
                                        policy.insured?.name ||
                                        policy.insuredName ||
                                        'Unknown';

                        return `
                            <tr class="policy-row" data-policy-id="${policy.policyNumber || policy.id}">
                                <td><strong>${policy.policyNumber || policy.id}</strong></td>
                                <td>${clientName}</td>
                                <td><span class="policy-type">${policyType}</span></td>
                                <td>${coverageDisplay}</td>
                                <td>
                                    <span class="status-badge ${status === 'expiring' ? 'status-warning' : status === 'expired' ? 'status-expired' : 'status-active'}">
                                        ${expiryDate.toLocaleDateString()}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="viewPolicyProfileCOI('${policy.policyNumber || policy.id}')" title="View Profile">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        // Add footer with more info
        policyList.innerHTML += `
            <div style="padding: 15px; background: #f0f9ff; text-align: center; border-top: 2px solid #0891b2;">
                <strong style="color: #0891b2;">✅ Loaded ${policies.length} Real Policies from Server</strong>
                <br>
                <small style="color: #0c4a6e;">Live data synchronized from policy management • Updated: ${new Date().toLocaleString()}</small>
                <br>
                <button onclick="window.loadRealPolicyList()" style="margin-top: 8px; padding: 5px 15px; background: #0891b2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-refresh"></i> Refresh Policies
                </button>
            </div>
        `;
    }
};

// View policy profile in COI panel (like demo)
window.viewPolicyProfileCOI = function(policyId) {
    console.log('View policy profile:', policyId);

    // Always use policyViewer as the container
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('policyViewer element not found');
        return;
    }

    // Get all policies from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Find the specific policy
    const policy = policies.find(p => p.policyNumber === policyId || p.id === policyId);

    if (!policy) {
        console.error('Policy not found:', policyId);
        return;
    }

    // Store the entire COI view (including both policyList and policyViewer) for back navigation
    const policyList = document.getElementById('policyList');
    if (policyList && policyList.innerHTML) {
        window.originalPolicyListHTML = `
            <div id="policyList">${policyList.innerHTML}</div>
            <div id="policyViewer">${policyViewer.innerHTML}</div>
        `;
    } else {
        window.originalPolicyListHTML = policyViewer.innerHTML;
    }

    // Get insured name
    const insuredName = policy.clientName ||
                       policy.name ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       policy.insured?.name ||
                       policy.insuredName ||
                       'Primary Insured';

    // Debug: Log policy data and function availability
    console.log('🔍 Policy data for profile:', policy);
    console.log('🔍 openCertificateHolderModal function available:', typeof window.openCertificateHolderModal);
    console.log('🔍 prepareCOI function available:', typeof window.prepareCOI);
    console.log('🔍 Policy ID being used:', policy.policyNumber || policy.id);

    // Display comprehensive policy details
    const profileHTML = `
        <div class="policy-profile">
            <div class="profile-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-back" onclick="backToPolicyList()" title="Back to Policy List">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>Policy Profile: ${policy.policyNumber || policy.id}</h2>
                </div>
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 10px;">
                    <button class="btn-secondary certificate-holders-btn"
                            onclick="handleCertificateHoldersClick('${policy.policyNumber || policy.id}')"
                            style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border: none; padding: 12px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <i class="fas fa-user-shield" style="margin-right: 8px;"></i> Certificate Holders
                    </button>
                    <button class="btn-primary prepare-coi-btn"
                            onclick="handlePrepareCOIClick('${policy.policyNumber || policy.id}', this)"
                            style="background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; border: none; padding: 12px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <i class="fas fa-file-alt" style="margin-right: 8px;"></i> Prepare COI
                    </button>
                </div>
                <div style="border-bottom: 2px solid #e5e7eb; margin-bottom: 20px;"></div>
            </div>

            <div class="profile-content">
                <!-- Policy Information Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-file-contract"></i> Policy Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Policy Number:</label>
                            <span><strong>${policy.policyNumber || policy.overview?.['Policy Number'] || policy.id}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>Policy Type:</label>
                            <span>${policy.policyType || policy.overview?.['Policy Type'] || policy.type || 'Commercial Auto'}</span>
                        </div>
                        <div class="info-item">
                            <label>Insurance Carrier:</label>
                            <span>${(function() {
                                const carrier = policy.carrier || policy.overview?.['Carrier'] || policy.overview?.carrier ||
                                               policy.insuranceCarrier || policy.financial?.carrier || '';
                                return (carrier && carrier !== '') ? carrier : 'N/A';
                            })()}</span>
                        </div>
                        <div class="info-item">
                            <label>Policy Status:</label>
                            <span class="status-badge ${(policy.policyStatus || policy.status || policy.overview?.['Status'] || 'Active') === 'Active' ? 'status-active' : 'status-inactive'}">
                                ${policy.policyStatus || policy.status || policy.overview?.['Status'] || policy.overview?.status || 'Active'}
                            </span>
                        </div>
                        <div class="info-item">
                            <label>Effective Date:</label>
                            <span>${(function() {
                                const date = policy.effectiveDate || policy.overview?.['Effective Date'] ||
                                           policy.overview?.effectiveDate || policy.startDate || '';
                                if (date && date !== '') {
                                    try {
                                        return new Date(date).toLocaleDateString();
                                    } catch(e) {
                                        return date;
                                    }
                                }
                                return 'N/A';
                            })()}</span>
                        </div>
                        <div class="info-item">
                            <label>Expiration Date:</label>
                            <span>${(function() {
                                const date = policy.expirationDate || policy.overview?.['Expiration Date'] ||
                                           policy.overview?.expirationDate || policy.expiryDate || '';
                                if (date && date !== '') {
                                    try {
                                        return new Date(date).toLocaleDateString();
                                    } catch(e) {
                                        return date;
                                    }
                                }
                                return 'N/A';
                            })()}</span>
                        </div>
                        ${policy.dotNumber || policy.overview?.['DOT Number'] || policy.overview?.['DOT#'] ? `
                        <div class="info-item">
                            <label>DOT Number:</label>
                            <span>${policy.dotNumber || policy.overview?.['DOT Number'] || policy.overview?.['DOT#'] || 'N/A'}</span>
                        </div>` : ''}
                        ${policy.mcNumber || policy.overview?.['MC Number'] || policy.overview?.['MC#'] ? `
                        <div class="info-item">
                            <label>MC Number:</label>
                            <span>${policy.mcNumber || policy.overview?.['MC Number'] || policy.overview?.['MC#'] || 'N/A'}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Financial Information Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-dollar-sign"></i> Financial Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Annual Premium:</label>
                            <span><strong>$${(function() {
                                const premiumVal = policy.annualPremium || policy.premium ||
                                                  policy.financial?.['Annual Premium'] || policy.financial?.['Premium'] ||
                                                  policy.financial?.annualPremium || policy.financial?.premium || '0';
                                const cleanPremium = premiumVal.toString().replace(/,/g, '');
                                const numPremium = parseFloat(cleanPremium) || 0;
                                return numPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            })()}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>Monthly Payment:</label>
                            <span>$${(function() {
                                const premiumVal = policy.annualPremium || policy.premium ||
                                                  policy.financial?.['Annual Premium'] || policy.financial?.['Premium'] ||
                                                  policy.financial?.annualPremium || policy.financial?.premium || '0';
                                const cleanPremium = premiumVal.toString().replace(/,/g, '');
                                const numPremium = parseFloat(cleanPremium) || 0;
                                return (numPremium / 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            })()}</span>
                        </div>
                        ${policy.financial?.deductible || policy.financial?.['Deductible'] || policy.financial?.['Collision Deductible'] || policy.deductible ? `
                        <div class="info-item">
                            <label>Deductible:</label>
                            <span>$${(policy.financial?.deductible || policy.financial?.['Deductible'] || policy.financial?.['Collision Deductible'] || policy.deductible || 0).toLocaleString()}</span>
                        </div>` : ''}
                        ${policy.financial?.downPayment || policy.financial?.['Down Payment'] || policy.financial?.['Down payment'] || policy.downPayment ? `
                        <div class="info-item">
                            <label>Down Payment:</label>
                            <span>$${(policy.financial?.downPayment || policy.financial?.['Down Payment'] || policy.financial?.['Down payment'] || policy.downPayment || 0).toLocaleString()}</span>
                        </div>` : ''}
                        ${policy.financial?.['Payment Frequency'] ? `
                        <div class="info-item">
                            <label>Payment Frequency:</label>
                            <span>${policy.financial['Payment Frequency']}</span>
                        </div>` : ''}
                        ${policy.financial?.['Finance Company'] ? `
                        <div class="info-item">
                            <label>Finance Company:</label>
                            <span>${policy.financial['Finance Company']}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Named Insured Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-user"></i> Named Insured</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Primary Insured:</label>
                            <span><strong>${insuredName}</strong></span>
                        </div>
                        ${policy.insured?.['Additional Named Insured'] || policy.additionalInsured ? `
                        <div class="info-item">
                            <label>Additional Insured:</label>
                            <span>${policy.insured?.['Additional Named Insured'] || policy.additionalInsured || 'None'}</span>
                        </div>` : ''}
                        ${policy.insured?.['DBA Name'] ? `
                        <div class="info-item">
                            <label>DBA Name:</label>
                            <span>${policy.insured['DBA Name']}</span>
                        </div>` : ''}
                        ${policy.insured?.['Mailing Address'] ? `
                        <div class="info-item">
                            <label>Mailing Address:</label>
                            <span>${policy.insured['Mailing Address']}</span>
                        </div>` : ''}
                        ${policy.insured?.['Garaging Address'] ? `
                        <div class="info-item">
                            <label>Garaging Address:</label>
                            <span>${policy.insured['Garaging Address']}</span>
                        </div>` : ''}
                        ${policy.contact?.phone || policy.insured?.phone || policy.insured?.['Phone'] ? `
                        <div class="info-item">
                            <label>Phone:</label>
                            <span>${policy.contact?.phone || policy.insured?.phone || policy.insured?.['Phone'] || 'N/A'}</span>
                        </div>` : ''}
                        ${policy.contact?.email || policy.insured?.email || policy.insured?.['Email'] ? `
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${policy.contact?.email || policy.insured?.email || policy.insured?.['Email'] || 'N/A'}</span>
                        </div>` : ''}
                        ${policy.insured?.['FEIN'] ? `
                        <div class="info-item">
                            <label>FEIN:</label>
                            <span>${policy.insured['FEIN']}</span>
                        </div>` : ''}
                        ${policy.insured?.['Entity Type'] ? `
                        <div class="info-item">
                            <label>Entity Type:</label>
                            <span>${policy.insured['Entity Type']}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Coverage Details Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-shield-alt"></i> Coverage Details</h3>
                    <div class="coverage-grid">
                        ${policy.coverage || policy.coverageDetails || policy.coverages ?
                            (policy.coverage ?
                                // If coverage is an object, display all fields
                                Object.entries(policy.coverage).filter(([key, value]) => value && value !== '').map(([key, value]) => `
                                    <div class="coverage-item">
                                        <label>${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:</label>
                                        <span>${typeof value === 'number' ? `$${value.toLocaleString()}` :
                                               typeof value === 'string' && value.match(/^\d+$/) ? `$${parseInt(value).toLocaleString()}` :
                                               value}</span>
                                    </div>
                                `).join('') :
                                // If coverageDetails or coverages exists
                                Object.entries(policy.coverageDetails || policy.coverages || {}).filter(([key, value]) => value && value !== '').map(([key, value]) => `
                                    <div class="coverage-item">
                                        <label>${key}:</label>
                                        <span>${typeof value === 'number' ? `$${value.toLocaleString()}` :
                                               typeof value === 'string' && value.match(/^\d+$/) ? `$${parseInt(value).toLocaleString()}` :
                                               value}</span>
                                    </div>
                                `).join('')
                            ) :
                            // Default coverage display
                            `<div class="coverage-item">
                                <label>Liability Limit:</label>
                                <span>${policy.coverageLimit || '$1,000,000'}</span>
                            </div>
                            <div class="coverage-item">
                                <label>Coverage Type:</label>
                                <span>${policy.policyType || 'Commercial Auto'}</span>
                            </div>`
                        }
                        ${policy.operations?.radiusOfOperation || policy.operations?.['Radius of Operation'] || policy.radiusOfOperation ? `
                        <div class="coverage-item">
                            <label>Radius of Operation:</label>
                            <span>${policy.operations?.radiusOfOperation || policy.operations?.['Radius of Operation'] || policy.radiusOfOperation}</span>
                        </div>` : ''}
                        ${policy.operations?.['Hazmat'] ? `
                        <div class="coverage-item">
                            <label>Hazmat:</label>
                            <span>${policy.operations['Hazmat']}</span>
                        </div>` : ''}
                        ${policy.operations?.['List of Commodities'] ? `
                        <div class="coverage-item">
                            <label>Commodities:</label>
                            <span>${policy.operations['List of Commodities']}</span>
                        </div>` : ''}
                        ${policy.operations?.['States of Operation'] ? `
                        <div class="coverage-item">
                            <label>States of Operation:</label>
                            <span>${policy.operations['States of Operation']}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Vehicles Section (if applicable) -->
                ${policy.vehicles && policy.vehicles.length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-truck"></i> Vehicles (${policy.vehicles.length})</h3>
                    <div style="overflow-x: auto;">
                        <table class="vehicles-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f3f4f6;">
                                    <th style="padding: 8px; text-align: left;">Year</th>
                                    <th style="padding: 8px; text-align: left;">Make</th>
                                    <th style="padding: 8px; text-align: left;">Model</th>
                                    <th style="padding: 8px; text-align: left;">VIN</th>
                                    <th style="padding: 8px; text-align: left;">Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${policy.vehicles.map(vehicle => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 8px;">${vehicle.year || vehicle.Year || vehicle['Year'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${vehicle.make || vehicle.Make || vehicle['Make'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${vehicle.model || vehicle.Model || vehicle['Model'] || 'N/A'}</td>
                                        <td style="padding: 8px; font-size: 12px;">${vehicle.vin || vehicle.VIN || vehicle['VIN'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${vehicle.type || vehicle.Type || vehicle['Type'] || vehicle['Vehicle Type'] || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>` : ''}

                <!-- Drivers Section (if applicable) -->
                ${policy.drivers && policy.drivers.length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-id-card"></i> Drivers (${policy.drivers.length})</h3>
                    <div style="overflow-x: auto;">
                        <table class="drivers-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f3f4f6;">
                                    <th style="padding: 8px; text-align: left;">Name</th>
                                    <th style="padding: 8px; text-align: left;">License #</th>
                                    <th style="padding: 8px; text-align: left;">DOB</th>
                                    <th style="padding: 8px; text-align: left;">Experience</th>
                                    <th style="padding: 8px; text-align: left;">CDL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${policy.drivers.map(driver => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 8px;">${driver.name || driver['Full Name'] || driver['Driver Name'] || driver.Name || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.licenseNumber || driver['License Number'] || driver['License #'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.dob || driver.DOB || driver['Date of Birth'] || driver['DOB'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.experience || driver.Experience || driver['Years of Experience'] || driver['Experience (years)'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.cdl || driver.CDL || driver['CDL'] || driver.hasCDL || driver['Has CDL'] ? 'Yes' : 'No'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>` : ''}

                <!-- Operations Section (if applicable) -->
                ${policy.operations && Object.keys(policy.operations).length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-truck-loading"></i> Operations</h3>
                    <div class="info-grid">
                        ${Object.entries(policy.operations).filter(([key, value]) =>
                            value && value !== '' &&
                            !['radiusOfOperation', 'Radius of Operation', 'Hazmat', 'List of Commodities', 'States of Operation'].includes(key)
                        ).map(([key, value]) => `
                            <div class="info-item">
                                <label>${key}:</label>
                                <span>${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                <!-- Additional Documents Section (if applicable) -->
                ${policy.documents && Object.keys(policy.documents).length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-file-pdf"></i> Documents</h3>
                    <div class="info-grid">
                        ${Object.entries(policy.documents).filter(([key, value]) => value && value !== '').map(([key, value]) => `
                            <div class="info-item">
                                <label>${key}:</label>
                                <span>${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}

                <!-- Additional Information Section -->
                ${policy.notes || policy.additionalInfo || policy['Additional Notes'] ? `
                <div class="profile-section">
                    <h3><i class="fas fa-info-circle"></i> Additional Information</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px;">
                        <p style="margin: 0; white-space: pre-wrap;">${policy.notes || policy.additionalInfo || policy['Additional Notes']}</p>
                    </div>
                </div>` : ''}

                <!-- Action Buttons -->
                <div class="profile-actions" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: center;">
                        <button class="btn-secondary certificate-holders-btn-bottom"
                                onclick="console.log('Certificate Holders clicked (bottom):', '${policy.policyNumber || policy.id}'); if(typeof openCertificateHolderModal === 'function') { openCertificateHolderModal('${policy.policyNumber || policy.id}'); } else { alert('Certificate Holders function not available.'); }"
                                style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border: none; padding: 12px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <i class="fas fa-user-shield" style="margin-right: 8px;"></i> Certificate Holders
                        </button>
                        <button class="btn-primary generate-coi-btn-bottom"
                                onclick="console.log('Generate COI clicked (bottom):', '${policy.policyNumber || policy.id}'); this.innerHTML='<i class=\\"fas fa-spinner fa-spin\\"></i> Loading...'; this.disabled=true; if(typeof prepareCOI === 'function') { prepareCOI('${policy.policyNumber || policy.id}'); } else { alert('Generate COI function not available.'); this.innerHTML='<i class=\\"fas fa-file-alt\\"></i> Generate COI'; this.disabled=false; }"
                                style="background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; border: none; padding: 12px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <i class="fas fa-file-alt" style="margin-right: 8px;"></i> Generate COI
                        </button>
                        <button class="btn-secondary edit-policy-btn"
                                onclick="console.log('Edit Policy clicked:', '${policy.policyNumber || policy.id}'); alert('Edit Policy feature coming soon!');"
                                style="background: #6b7280; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 500; cursor: pointer;">
                            <i class="fas fa-edit" style="margin-right: 6px;"></i> Edit Policy
                        </button>
                        <button class="btn-secondary download-policy-btn"
                                onclick="console.log('Download Policy clicked:', '${policy.policyNumber || policy.id}'); alert('Download feature coming soon!');"
                                style="background: #6b7280; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 500; cursor: pointer;">
                            <i class="fas fa-download" style="margin-right: 6px;"></i> Download
                        </button>
                        <button class="btn-secondary email-policy-btn"
                                onclick="console.log('Email Policy clicked:', '${policy.policyNumber || policy.id}'); alert('Email feature coming soon!');"
                                style="background: #6b7280; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 500; cursor: pointer;">
                            <i class="fas fa-envelope" style="margin-right: 6px;"></i> Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Debug: Log the generated HTML to check if buttons are included
    console.log('🔍 Generated HTML length:', profileHTML.length);
    console.log('🔍 Certificate Holders button in HTML:', profileHTML.includes('Certificate Holders'));
    console.log('🔍 Prepare COI button in HTML:', profileHTML.includes('Prepare COI'));
    console.log('🔍 Button section HTML:', profileHTML.substring(profileHTML.indexOf('display: flex; gap: 12px'), profileHTML.indexOf('display: flex; gap: 12px') + 500));

    // Inject the HTML into the policy viewer
    policyViewer.innerHTML = profileHTML;

    // Debug: Check what's actually in the DOM after injection
    setTimeout(() => {
        const certButton = document.querySelector('.certificate-holders-btn');
        const prepButton = document.querySelector('.prepare-coi-btn');
        console.log('🔍 Certificate Holders button in DOM:', !!certButton);
        console.log('🔍 Prepare COI button in DOM:', !!prepButton);
        if (certButton) {
            console.log('🔍 Certificate button HTML:', certButton.outerHTML);
        }
        if (prepButton) {
            console.log('🔍 Prepare button HTML:', prepButton.outerHTML);
        }
    }, 100);
};

// Handle Certificate Holders button click
window.handleCertificateHoldersClick = function(policyId) {
    console.log('Certificate Holders clicked for:', policyId);
    if (typeof window.openCertificateHolderModal === 'function') {
        window.openCertificateHolderModal(policyId);
    } else {
        alert('Certificate Holders function not available. Please refresh the page.');
    }
};

// Handle Prepare COI button click
window.handlePrepareCOIClick = function(policyId, button) {
    console.log('Prepare COI clicked for:', policyId);
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    button.disabled = true;

    if (typeof window.prepareCOI === 'function') {
        window.prepareCOI(policyId);
    } else {
        alert('Prepare COI function not available.');
        button.innerHTML = '<i class="fas fa-file-alt"></i> Prepare COI';
        button.disabled = false;
    }
};

// Back to policy list
window.backToPolicyList = function() {
    console.log('Back to policy list');

    // Find the policyViewer element
    const policyViewer = document.getElementById('policyViewer');

    if (policyViewer) {
        if (window.originalPolicyListHTML) {
            // Restore the saved HTML
            policyViewer.innerHTML = window.originalPolicyListHTML;
            // Clear the saved HTML for next time
            window.originalPolicyListHTML = null;
        } else {
            // Fallback: recreate the structure
            policyViewer.innerHTML = '<div class="policy-list" id="policyList"></div>';
            // Reload the policy list
            if (window.loadRealPolicyList) {
                window.loadRealPolicyList();
            }
        }
    } else {
        console.error('policyViewer not found');
    }
};

// Generate COI for policy
window.generateCOI = function(policyId) {
    console.log('Generate COI for policy:', policyId);
    // This would integrate with COI generation
    if (window.selectPolicy) {
        window.selectPolicy(policyId);
    }
};

// Renew policy
window.renewPolicy = function(policyId) {
    console.log('Renew policy:', policyId);
    alert(`Renew Policy: ${policyId}\n\nRenewal workflow coming soon!`);
};

// Export policies
window.exportPolicies = function() {
    console.log('Export policies to CSV');
    alert('Export functionality coming soon!');
};

// Add new policy
window.addNewPolicy = function() {
    console.log('Add new policy');
    alert('Add new policy form coming soon!');
};

// Refresh policies function (for the refresh button)
window.refreshPolicies = function() {
    console.log('Refreshing policies...');
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
    notification.innerHTML = '<i class="fas fa-sync fa-spin"></i> Refreshing policies...';
    document.body.appendChild(notification);

    window.loadRealPolicyList();
    setTimeout(() => notification.remove(), 1000);
};

console.log('COI Real Policies ready');