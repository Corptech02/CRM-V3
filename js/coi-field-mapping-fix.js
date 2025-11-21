// Enhanced field mapping for COI policy display
console.log('COI Field Mapping Fix loading...');

// Helper function to get field value from various possible locations
window.getFieldValue = function(policy, fieldPaths) {
    for (const path of fieldPaths) {
        const value = path.split('.').reduce((obj, key) => {
            if (!obj) return null;
            // Handle bracket notation
            if (key.includes('[')) {
                const [base, prop] = key.split('[');
                const propName = prop.replace(']', '').replace(/['"]/g, '');
                return obj[base] ? obj[base][propName] : null;
            }
            return obj[key];
        }, policy);

        if (value !== null && value !== undefined && value !== '') {
            return value;
        }
    }
    return null;
};

// Override the viewPolicyProfileCOI to use enhanced field mapping
const originalViewPolicyProfileCOI = window.viewPolicyProfileCOI;
window.viewPolicyProfileCOI = function(policyId) {
    console.log('Enhanced View policy profile:', policyId);

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer element not found');
        return;
    }

    // Get all policies from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Find the policy
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.policyNumber) === String(policyId) ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        console.error('Policy not found:', policyId);
        policyViewer.innerHTML = '<div class="error">Policy not found</div>';
        return;
    }

    console.log('Found policy:', policy);

    // Save current content for back button
    window.originalPolicyListHTML = policyViewer.innerHTML;

    // Enhanced field extraction with multiple possible paths
    const getPremium = () => {
        const paths = [
            'financial["Annual Premium"]',
            'financial.annualPremium',
            'financial.Premium',
            'financial.premium',
            'annualPremium',
            'premium',
            'overview["Annual Premium"]',
            'overview.premium'
        ];
        return getFieldValue(policy, paths) || 0;
    };

    const getCoverageLimit = () => {
        const paths = [
            'coverage["Liability Limit"]',
            'coverage["Combined Single Limit"]',
            'coverage.liabilityLimit',
            'coverage.Liability',
            'coverageLimit',
            'coverage["Liability Limits"]',
            'coverage.combinedSingleLimit'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getCargoLimit = () => {
        const paths = [
            'coverage["Cargo Limit"]',
            'coverage.cargoLimit',
            'coverage.Cargo',
            'coverage["Cargo Coverage"]',
            'cargoLimit'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getDeductible = (type = '') => {
        const paths = type === 'comp' ? [
            'coverage["Comprehensive Deductible"]',
            'coverage.comprehensiveDeductible',
            'coverage["Comp Deductible"]',
            'financial["Comprehensive Deductible"]'
        ] : type === 'collision' ? [
            'coverage["Collision Deductible"]',
            'coverage.collisionDeductible',
            'coverage["Coll Deductible"]',
            'financial["Collision Deductible"]'
        ] : type === 'cargo' ? [
            'coverage["Cargo Deductible"]',
            'coverage.cargoDeductible',
            'financial["Cargo Deductible"]'
        ] : [
            'financial.Deductible',
            'financial.deductible',
            'coverage.Deductible',
            'coverage.deductible',
            'deductible'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getMedicalPayments = () => {
        const paths = [
            'coverage["Medical Payments"]',
            'coverage.medicalPayments',
            'coverage["Medical"]',
            'coverage.Medical',
            'medicalPayments'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getUMUIM = () => {
        const paths = [
            'coverage["Uninsured/Underinsured Motorist"]',
            'coverage["UM/UIM"]',
            'coverage.umUim',
            'coverage["Uninsured Motorist"]',
            'coverage.uninsuredMotorist'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getTrailerInterchange = () => {
        const paths = [
            'coverage["Trailer Interchange Limit"]',
            'coverage["Trailer Interchange"]',
            'coverage.trailerInterchange',
            'trailerInterchange'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getNonTrucking = () => {
        const paths = [
            'coverage["Non-Trucking Liability"]',
            'coverage["Non Trucking Liability"]',
            'coverage.nonTruckingLiability',
            'coverage["Bobtail"]',
            'nonTruckingLiability'
        ];
        return getFieldValue(policy, paths) || '';
    };

    const getGeneralAggregate = () => {
        const paths = [
            'coverage["General Aggregate"]',
            'coverage.generalAggregate',
            'coverage["Aggregate"]',
            'coverage.Aggregate',
            'generalAggregate'
        ];
        return getFieldValue(policy, paths) || '';
    };

    // Get all values
    const premium = getPremium();
    const liabilityLimit = getCoverageLimit();
    const cargoLimit = getCargoLimit();
    const cargoDeductible = getDeductible('cargo');
    const compDeductible = getDeductible('comp');
    const collisionDeductible = getDeductible('collision');
    const medicalPayments = getMedicalPayments();
    const umUim = getUMUIM();
    const trailerInterchange = getTrailerInterchange();
    const nonTrucking = getNonTrucking();
    const generalAggregate = getGeneralAggregate();

    // Get insured name
    const insuredName = policy.clientName ||
                       policy.name ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       policy.insured?.name ||
                       policy.insuredName ||
                       'Unknown';

    // Display comprehensive policy details with actual data
    policyViewer.innerHTML = `
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
                            <span>${policy.carrier || policy.overview?.['Carrier'] || policy.overview?.carrier || policy.insuranceCarrier || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Policy Status:</label>
                            <span class="status-badge ${(policy.policyStatus || policy.status || policy.overview?.['Status'] || 'Active') === 'Active' ? 'status-active' : 'status-inactive'}">
                                ${policy.policyStatus || policy.status || policy.overview?.['Status'] || 'Active'}
                            </span>
                        </div>
                        <div class="info-item">
                            <label>Effective Date:</label>
                            <span>${policy.effectiveDate || policy.overview?.['Effective Date'] || policy.startDate || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Expiration Date:</label>
                            <span>${policy.expirationDate || policy.overview?.['Expiration Date'] || policy.expiryDate || 'N/A'}</span>
                        </div>
                        ${policy.dotNumber || policy.overview?.['DOT Number'] ? `
                        <div class="info-item">
                            <label>DOT Number:</label>
                            <span>${policy.dotNumber || policy.overview?.['DOT Number'] || 'N/A'}</span>
                        </div>` : ''}
                        ${policy.mcNumber || policy.overview?.['MC Number'] ? `
                        <div class="info-item">
                            <label>MC Number:</label>
                            <span>${policy.mcNumber || policy.overview?.['MC Number'] || 'N/A'}</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Financial Information Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-dollar-sign"></i> Financial Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Annual Premium:</label>
                            <span><strong>${premium ? '$' + Number(premium).toLocaleString() : '$0'}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>Monthly Payment:</label>
                            <span>${premium ? '$' + (Number(premium) / 12).toFixed(2).toLocaleString() : '$0.00'}</span>
                        </div>
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
                        ${policy.insured?.['Additional Named Insured'] ? `
                        <div class="info-item">
                            <label>Additional Insured:</label>
                            <span>${policy.insured['Additional Named Insured']}</span>
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
                    </div>
                </div>

                <!-- Coverage Details Section -->
                <div class="profile-section">
                    <h3><i class="fas fa-shield-alt"></i> Coverage Details</h3>
                    <div class="coverage-grid">
                        ${liabilityLimit ? `
                        <div class="coverage-item">
                            <label>Liability Limits:</label>
                            <span>${liabilityLimit}</span>
                        </div>` : ''}
                        ${generalAggregate ? `
                        <div class="coverage-item">
                            <label>General Aggregate:</label>
                            <span>${generalAggregate}</span>
                        </div>` : ''}
                        ${compDeductible ? `
                        <div class="coverage-item">
                            <label>Comprehensive Deductible:</label>
                            <span>${typeof compDeductible === 'number' ? '$' + compDeductible.toLocaleString() : compDeductible}</span>
                        </div>` : ''}
                        ${collisionDeductible ? `
                        <div class="coverage-item">
                            <label>Collision Deductible:</label>
                            <span>${typeof collisionDeductible === 'number' ? '$' + collisionDeductible.toLocaleString() : collisionDeductible}</span>
                        </div>` : ''}
                        ${cargoLimit ? `
                        <div class="coverage-item">
                            <label>Cargo Limit:</label>
                            <span>${typeof cargoLimit === 'number' ? '$' + cargoLimit.toLocaleString() : cargoLimit}</span>
                        </div>` : ''}
                        ${cargoDeductible ? `
                        <div class="coverage-item">
                            <label>Cargo Deductible:</label>
                            <span>${typeof cargoDeductible === 'number' ? '$' + cargoDeductible.toLocaleString() : cargoDeductible}</span>
                        </div>` : ''}
                        ${medicalPayments ? `
                        <div class="coverage-item">
                            <label>Medical Payments:</label>
                            <span>${typeof medicalPayments === 'number' ? '$' + medicalPayments.toLocaleString() : medicalPayments}</span>
                        </div>` : ''}
                        ${umUim ? `
                        <div class="coverage-item">
                            <label>Uninsured/Underinsured Motorist:</label>
                            <span>${umUim}</span>
                        </div>` : ''}
                        ${trailerInterchange ? `
                        <div class="coverage-item">
                            <label>Trailer Interchange Limit:</label>
                            <span>${typeof trailerInterchange === 'number' ? '$' + trailerInterchange.toLocaleString() : trailerInterchange}</span>
                        </div>` : ''}
                        ${nonTrucking ? `
                        <div class="coverage-item">
                            <label>Non-Trucking Liability:</label>
                            <span>${nonTrucking}</span>
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
                                        <td style="padding: 8px;">${driver.experience || driver.Experience || driver['Years of Experience'] || 'N/A'}</td>
                                        <td style="padding: 8px;">${driver.cdl || driver.CDL || driver['CDL'] || driver.hasCDL ? 'Yes' : 'No'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>` : ''}

                <!-- Action Buttons -->
                <div class="profile-actions" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                    <button class="btn-primary" onclick="prepareCOI('${policy.policyNumber || policy.id}')">
                        <i class="fas fa-file-alt"></i> Generate COI
                    </button>
                    <button class="btn-secondary" onclick="editPolicy('${policy.policyNumber || policy.id}')">
                        <i class="fas fa-edit"></i> Edit Policy
                    </button>
                    <button class="btn-secondary" onclick="downloadPolicy('${policy.policyNumber || policy.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn-secondary" onclick="emailPolicy('${policy.policyNumber || policy.id}')">
                        <i class="fas fa-envelope"></i> Email
                    </button>
                </div>
            </div>
        </div>
    `;
};

// Global certificate holders list
const globalCertificateHolders = [
    {
        id: 'dat',
        name: 'DAT Solutions LLC',
        address: '9711 Washington St\nThornton, CO 80229',
        email: 'certs@dat.com',
        description: 'Digital freight matching platform'
    },
    {
        id: 'rmis',
        name: 'RMIS',
        fullName: 'Registry Monitoring Insurance Services, Inc',
        address: '425 Market St, Suite 2200\nSan Francisco, CA 94105',
        email: 'rmis@registrymonitoring.com',
        description: 'Insurance monitoring and compliance services'
    },
    {
        id: 'highway',
        name: 'Highway App, Inc.',
        address: '1234 Highway Blvd\nAustin, TX 78701',
        email: 'insurance@certs.highway.com',
        description: 'Transportation technology platform'
    },
    {
        id: 'capdat',
        name: 'CAPDAT',
        fullName: 'Capital Data Solutions',
        address: '500 Capitol Dr\nAtlanta, GA 30309',
        email: 'certs@dat.com',
        description: 'Data analytics and compliance solutions'
    }
];

// Function to show certificate holders list in left screen
window.showCertificateHoldersList = function(policyId) {
    console.log('Showing certificate holders list for policy:', policyId);

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer not found');
        return;
    }

    // Store current content for back navigation
    if (!window.originalPolicyListHTML) {
        window.originalPolicyListHTML = policyViewer.innerHTML;
    }

    const holderListHTML = `
        <div class="certificate-holders-panel">
            <!-- Header Section -->
            <div class="panel-header" style="background: #f8f9fa; border-bottom: 2px solid #e9ecef; padding: 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <button class="btn-back" onclick="backToPolicyList()" title="Back to Policy List"
                                style="background: #6b7280; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <h2 style="margin: 0; color: #333;"><i class="fas fa-user-shield"></i> Certificate Holders</h2>
                    </div>

                </div>
            </div>

            <!-- Certificate Holders List - Vertical Layout -->
            <div class="holders-list" style="padding: 20px; background: #fff;">
                ${globalCertificateHolders.map(holder => `
                    <div class="holder-row" onclick="selectCertificateHolder('${policyId}', '${holder.id}')"
                         style="width: 100%; background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 15px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.08); overflow: hidden;">

                        <!-- Orange/Yellow Header -->
                        <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; font-size: 18px; font-weight: 700;">
                                ${holder.name}
                            </h3>
                            <span style="background: rgba(255,255,255,0.2); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">
                                GLOBAL
                            </span>
                        </div>

                        <!-- Content Body - Streamlined Layout -->
                        <div style="padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; min-height: 50px;">
                            <!-- Contact Info - Stretched Horizontally -->
                            <div style="flex: 1; display: flex; gap: 30px; align-items: center;">
                                <!-- Address -->
                                <div style="display: flex; align-items: flex-start; gap: 8px;">
                                    <i class="fas fa-map-marker-alt" style="color: #f59e0b; margin-top: 2px; font-size: 14px;"></i>
                                    <div style="color: #4b5563; font-size: 14px; line-height: 1.4;">
                                        ${holder.address.replace(/\n/g, '<br>')}
                                    </div>
                                </div>

                                <!-- Email -->
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-envelope" style="color: #f59e0b; font-size: 14px;"></i>
                                    <span style="color: #4b5563; font-size: 14px;">${holder.email}</span>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div style="margin-left: 30px; display: flex; gap: 10px;">
                                <button class="select-holder-btn" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap;">
                                    <i class="fas fa-check-circle" style="margin-right: 8px;"></i>Select This Holder
                                </button>
                                <button class="edit-holder-btn" onclick="editCertificateHolder('${holder.id}')" style="background: #6b7280; color: white; border: none; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    policyViewer.innerHTML = holderListHTML;

    // Add enhanced hover effects
    setTimeout(() => {
        document.querySelectorAll('.holder-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.borderColor = '#10b981';
                this.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.2)';
                this.style.transform = 'translateY(-2px)';

                // Enhance the select button on hover
                const selectBtn = this.querySelector('.select-holder-btn');
                if (selectBtn) {
                    selectBtn.style.transform = 'scale(1.05)';
                    selectBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                }
            });

            card.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e5e7eb';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                this.style.transform = 'translateY(0)';

                // Reset select button
                const selectBtn = this.querySelector('.select-holder-btn');
                if (selectBtn) {
                    selectBtn.style.transform = 'scale(1)';
                    selectBtn.style.boxShadow = 'none';
                }
            });
        });
    }, 100);
};

// Function to select a certificate holder
window.selectCertificateHolder = function(policyId, holderId) {
    console.log('Selected certificate holder:', holderId, 'for policy:', policyId);

    const selectedHolder = globalCertificateHolders.find(h => h.id === holderId);
    if (!selectedHolder) {
        console.error('Certificate holder not found:', holderId);
        return;
    }

    // Store the selected holder in sessionStorage for COI preparation (using underscore format to match existing system)
    sessionStorage.setItem('selected_certificate_holder', JSON.stringify({
        name: selectedHolder.name,
        fullName: selectedHolder.fullName || selectedHolder.name,
        address: selectedHolder.address,
        email: selectedHolder.email,
        id: selectedHolder.id,
        savedName: selectedHolder.name
    }));

    console.log('Certificate holder stored for COI:', selectedHolder.name);

    // Show success message and proceed to COI preparation
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #059669; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    notification.innerHTML = `<i class="fas fa-check"></i> Selected: ${selectedHolder.name}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
        // Automatically prepare COI with the selected certificate holder
        console.log('🚀 Auto-preparing COI with selected certificate holder:', selectedHolder.name);

        // Try multiple methods to prepare the COI
        if (typeof window.prepareCOI === 'function') {
            console.log('Using prepareCOI function');
            window.prepareCOI(policyId);
            // Trigger auto-fill after COI is prepared
            setTimeout(() => autoFillACORDCertificateHolderFields(), 2000);
        } else if (typeof window.createRealACORDViewer === 'function') {
            console.log('Using createRealACORDViewer function');
            window.createRealACORDViewer(policyId);
            // Trigger auto-fill after viewer is created
            setTimeout(() => autoFillACORDCertificateHolderFields(), 2000);
        } else if (typeof window.openACORDInNewWindow === 'function') {
            console.log('Using openACORDInNewWindow function');
            // Store policy for ACORD viewer
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const policy = policies.find(p => p.policyNumber === policyId || p.id === policyId);
            if (policy) {
                window.currentCOIPolicy = policy;
            }
            window.openACORDInNewWindow();
            // Trigger auto-fill after window opens
            setTimeout(() => autoFillACORDCertificateHolderFields(), 2000);
        } else {
            console.warn('No COI preparation function found, falling back to policy profile');
            // Fallback to policy profile
            if (typeof window.viewPolicyProfileCOI === 'function') {
                window.viewPolicyProfileCOI(policyId);
            } else if (typeof window.showCOIPolicyProfile === 'function') {
                window.showCOIPolicyProfile(policyId);
            }
        }
    }, 1500);
};

// OVERRIDE ALL CERTIFICATE HOLDER FUNCTIONS to use our new full-screen view
window.handleCertificateHoldersClick = function(policyId) {
    console.log('Certificate Holders clicked for:', policyId);
    // Show the certificate holders list instead of modal
    window.showCertificateHoldersList(policyId);
};

// Override the old modal function to redirect to our new view
window.openCertificateHolderModal = function(policyId) {
    console.log('🔄 Redirecting openCertificateHolderModal to full-screen view');
    // Redirect to our new full-screen view
    window.showCertificateHoldersList(policyId);
};

if (typeof window.handlePrepareCOIClick === 'undefined') {
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
}

// Universal function to auto-fill ACORD certificate holder fields
function autoFillACORDCertificateHolderFields() {
    console.log('🔄 Checking for selected certificate holder to auto-fill ACORD fields...');

    // Get selected certificate holder from sessionStorage
    let selectedHolder = null;
    try {
        const holderData = sessionStorage.getItem('selected_certificate_holder');
        if (holderData) {
            selectedHolder = JSON.parse(holderData);
            console.log('✅ Found selected certificate holder:', selectedHolder.name);
        }
    } catch (e) {
        console.warn('Error reading certificate holder data:', e);
        return;
    }

    if (!selectedHolder) {
        console.log('No selected certificate holder found');
        return;
    }

    // Wait for form fields to be available, then populate them
    setTimeout(() => {
        console.log('🔍 Searching for ACORD certificate holder fields...');

        // Target only the main ACORD certificate holder fields (name and address lines only)
        const certHolderField = document.getElementById('field_certHolder');
        const certAddress1Field = document.getElementById('field_certAddress1');
        const certAddress2Field = document.getElementById('field_certAddress2');

        console.log('Field check results:');
        console.log('- certHolder:', !!certHolderField);
        console.log('- certAddress1:', !!certAddress1Field);
        console.log('- certAddress2:', !!certAddress2Field);

        if (certHolderField) {
            console.log('🎯 Auto-filling ACORD certificate holder fields (name and address only)...');

            // Parse the address into components
            const addressLines = selectedHolder.address.split('\n').filter(line => line.trim());

            // Fill name field
            certHolderField.value = selectedHolder.name;
            certHolderField.dispatchEvent(new Event('input', { bubbles: true }));

            // Fill address fields - put all address info in the address lines
            if (addressLines.length > 0 && certAddress1Field) {
                certAddress1Field.value = addressLines[0];
                certAddress1Field.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Put remaining address info in address2 field
            if (addressLines.length > 1 && certAddress2Field) {
                // Combine remaining lines into address2
                const remainingAddress = addressLines.slice(1).join(', ');
                certAddress2Field.value = remainingAddress;
                certAddress2Field.dispatchEvent(new Event('input', { bubbles: true }));
            }

            console.log('✅ Certificate holder fields auto-filled successfully!');
            console.log('Name:', selectedHolder.name);
            console.log('Address lines:', addressLines);

            // Show success notification
            const notification = document.createElement('div');
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; z-index: 10000; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
            notification.innerHTML = `<i class="fas fa-check-circle"></i> Auto-filled: ${selectedHolder.name}`;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);

        } else {
            console.log('ACORD certificate holder fields not found - form may not be ready yet');

            // Search more broadly for any certificate-related fields
            const allInputs = document.querySelectorAll('input, textarea');
            console.log('Total form fields found:', allInputs.length);

            const certFields = Array.from(allInputs).filter(field => {
                const id = (field.id || '').toLowerCase();
                const name = (field.name || '').toLowerCase();
                return id.includes('cert') || name.includes('cert') || id.includes('holder') || name.includes('holder');
            });

            console.log('Certificate-related fields found:', certFields.length);
            certFields.forEach(field => {
                console.log('- Found cert field:', field.id || field.name || 'unnamed', field.tagName);
            });

            // Try again after a longer delay
            setTimeout(() => {
                const retryField = document.getElementById('field_certHolder');
                if (retryField) {
                    console.log('🔄 Retrying certificate holder auto-fill...');
                    autoFillACORDCertificateHolderFields();
                } else {
                    console.log('Certificate holder fields still not available after retry');
                }
            }, 3000);
        }
    }, 1500);
}

// Hook into any ACORD form creation to auto-fill certificate holder fields
// Multiple interception points to ensure we catch all ACORD form creation
setTimeout(() => {
    console.log('🔄 Setting up certificate holder auto-fill interceptors...');

    // Method 1: Intercept createRealACORDViewer
    const originalCreateRealACORDViewer = window.createRealACORDViewer;
    if (originalCreateRealACORDViewer) {
        window.createRealACORDViewer = async function(policyId) {
            console.log('🔄 [Method 1] Intercepting createRealACORDViewer to add auto-fill...');

            // Call the original function
            const result = await originalCreateRealACORDViewer.call(this, policyId);

            // Auto-fill certificate holder fields after form is created
            setTimeout(() => {
                autoFillACORDCertificateHolderFields();
            }, 1000);

            return result;
        };
        console.log('✅ createRealACORDViewer interceptor attached');
    }

    // Method 2: Intercept openACORDInNewWindow
    const originalOpenACORDInNewWindow = window.openACORDInNewWindow;
    if (originalOpenACORDInNewWindow) {
        window.openACORDInNewWindow = function() {
            console.log('🔄 [Method 2] Intercepting openACORDInNewWindow to add auto-fill...');

            // Call the original function
            const result = originalOpenACORDInNewWindow.call(this);

            // Auto-fill certificate holder fields after form is created
            setTimeout(() => {
                autoFillACORDCertificateHolderFields();
            }, 1000);

            return result;
        };
        console.log('✅ openACORDInNewWindow interceptor attached');
    }

    // Method 3: Retry after more scripts load
    setTimeout(() => {
        if (!originalCreateRealACORDViewer) {
            const retryOriginal = window.createRealACORDViewer;
            if (retryOriginal) {
                window.createRealACORDViewer = async function(policyId) {
                    console.log('🔄 [Method 3] Intercepting createRealACORDViewer (retry) to add auto-fill...');

                    const result = await retryOriginal.call(this, policyId);

                    setTimeout(() => {
                        autoFillACORDCertificateHolderFields();
                    }, 1000);

                    return result;
                };
                console.log('✅ createRealACORDViewer interceptor attached (retry)');
            }
        }

        if (!originalOpenACORDInNewWindow) {
            const retryOpenACORD = window.openACORDInNewWindow;
            if (retryOpenACORD) {
                window.openACORDInNewWindow = function() {
                    console.log('🔄 [Method 3] Intercepting openACORDInNewWindow (retry) to add auto-fill...');

                    const result = retryOpenACORD.call(this);

                    setTimeout(() => {
                        autoFillACORDCertificateHolderFields();
                    }, 1000);

                    return result;
                };
                console.log('✅ openACORDInNewWindow interceptor attached (retry)');
            }
        }
    }, 3000);
}, 2000);

console.log('COI Field Mapping Fix loaded - policy fields will now display correctly');

// FINAL OVERRIDE - Ensure certificate holders always shows full-screen view
setTimeout(() => {
    console.log('🔄 Final override: Redirecting all certificate holder functions to full-screen view');

    // Override the modal function completely
    window.openCertificateHolderModal = function(policyId) {
        console.log('🚀 Certificate Holders Modal → Full Screen View for policy:', policyId);
        window.showCertificateHoldersList(policyId);
    };

    // Make sure the button handler is correct
    window.handleCertificateHoldersClick = function(policyId) {
        console.log('🚀 Certificate Holders Button → Full Screen View for policy:', policyId);
        window.showCertificateHoldersList(policyId);
    };

    console.log('✅ Certificate holders override complete - will now show full-screen view');
}, 1000);

// Manual testing function - call this from browser console
window.testCertificateHolderAutoFill = function() {
    console.log('🧪 Testing certificate holder auto-fill manually...');

    // Check sessionStorage
    const storedData = sessionStorage.getItem('selected_certificate_holder');
    console.log('SessionStorage data:', storedData);

    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            console.log('Parsed certificate holder:', parsed);
        } catch (e) {
            console.error('Error parsing stored data:', e);
        }
    }

    // Force run auto-fill
    autoFillACORDCertificateHolderFields();
};

// Function to edit a certificate holder
window.editCertificateHolder = function(holderId) {
    console.log('Editing certificate holder:', holderId);

    // Find the holder in our global list
    const holder = globalCertificateHolders.find(h => h.id === holderId);
    if (!holder) {
        console.error('Certificate holder not found:', holderId);
        return;
    }

    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'editCertificateHolderModal';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 600px;">
            <div class="modal-header" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);">
                <h2 style="color: white;"><i class="fas fa-edit"></i> Edit Certificate Holder</h2>
                <button class="close-btn" onclick="closeModal('editCertificateHolderModal')" style="color: white;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 30px;">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">Company Name</label>
                    <input type="text" id="editHolderName" class="form-control" value="${holder.name}" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">Address</label>
                    <textarea id="editHolderAddress" class="form-control" rows="3" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">${holder.address}</textarea>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">Email</label>
                    <input type="email" id="editHolderEmail" class="form-control" value="${holder.email}" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px;">
                    <button onclick="closeModal('editCertificateHolderModal')" class="btn-secondary" style="padding: 12px 24px; background: #fff; border: 2px solid #d1d5db; color: #374151; border-radius: 8px; font-weight: 500;">
                        Cancel
                    </button>
                    <button onclick="saveCertificateHolderEdit('${holderId}')" class="btn-primary" style="padding: 12px 24px; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; border: none; border-radius: 8px; font-weight: 600;">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// Function to save certificate holder edits
window.saveCertificateHolderEdit = function(holderId) {
    const name = document.getElementById('editHolderName').value.trim();
    const address = document.getElementById('editHolderAddress').value.trim();
    const email = document.getElementById('editHolderEmail').value.trim();

    if (!name || !address || !email) {
        alert('Please fill in all fields');
        return;
    }

    // Find and update the holder in our global list
    const holderIndex = globalCertificateHolders.findIndex(h => h.id === holderId);
    if (holderIndex !== -1) {
        globalCertificateHolders[holderIndex].name = name;
        globalCertificateHolders[holderIndex].address = address;
        globalCertificateHolders[holderIndex].email = email;

        console.log('Certificate holder updated:', globalCertificateHolders[holderIndex]);

        // Close modal
        closeModal('editCertificateHolderModal');

        // Show success message
        if (typeof showNotification === 'function') {
            showNotification('Certificate holder updated successfully', 'success');
        }

        // Refresh the certificate holder view if it's currently open
        const policyViewer = document.getElementById('policyViewer');
        if (policyViewer && policyViewer.querySelector('.holders-list')) {
            // Get current policy ID and refresh the view
            const currentPolicyId = window.currentPolicyForCertHolder || 'default';
            showCertificateHoldersForPolicy(currentPolicyId);
        }
    }
};

console.log('🔄 Certificate holder auto-fill system loaded');
console.log('💡 To test manually, call: testCertificateHolderAutoFill()');
console.log('💡 Current sessionStorage:', sessionStorage.getItem('selected_certificate_holder'));