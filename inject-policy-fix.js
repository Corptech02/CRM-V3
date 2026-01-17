/*
 * Injection script to fix policy field mapping on vigagency.com
 * This script can be run in browser console or loaded as a bookmarklet
 */

javascript:(function() {
    // Check if we're on the right page
    if (!window.location.href.includes('vigagency.com/pages/admin-dashboard.html')) {
        alert('This fix is only for the vigagency.com admin dashboard');
        return;
    }

    console.log('🔧 Injecting Policy Field Mapping Fix...');

    // Override the original field mapping functions
    if (typeof window.originalEditPolicy === 'undefined') {
        window.originalEditPolicy = window.editPolicy;
    }

    window.editPolicy = function(policyId) {
        console.log('🔄 FIXED editPolicy called with policyId:', policyId);

        // Find the policy
        const policy = window.allPolicies?.find(p => p.id === policyId) ||
                      window.filteredPolicies?.find(p => p.id === policyId);

        if (!policy) {
            console.error('❌ Policy not found:', policyId);
            return;
        }

        console.log('🔍 FIXED: Full policy object for mapping:', policy);

        // Open the edit modal first
        if (window.originalEditPolicy) {
            window.originalEditPolicy(policyId);
        }

        // Wait for modal to be ready, then fix field mapping
        setTimeout(() => {
            fixFieldMapping(policy);
        }, 500);
    };

    function fixFieldMapping(policy) {
        console.log('🎯 FIXING field mapping for policy:', policy.id);

        // 1. Fix Policy Number Mapping
        const policyNumberField = document.getElementById('editPolicyNumber') ||
                                 document.querySelector('input[placeholder*="Policy Number"]') ||
                                 document.querySelector('input[id*="policy"]');

        if (policyNumberField && policy.policyNumber) {
            policyNumberField.value = policy.policyNumber;
            console.log('✅ FIXED: Policy Number set to:', policy.policyNumber);
        }

        // 2. Fix Client Name Mapping
        const clientNameField = document.getElementById('editClientName') ||
                               document.getElementById('editInsuredName') ||
                               document.querySelector('input[placeholder*="Client"]') ||
                               document.querySelector('input[placeholder*="Insured"]');

        let clientName = 'Unknown Client';
        if (policy.insured && policy.insured['Name/Business Name']) {
            clientName = policy.insured['Name/Business Name'];
        } else if (policy.clientName) {
            clientName = policy.clientName;
        } else if (policy.insured_name) {
            clientName = policy.insured_name;
        }

        if (clientNameField) {
            clientNameField.value = clientName;
            console.log('✅ FIXED: Client Name set to:', clientName);
        }

        // 3. Fix Vehicle Data Mapping
        fixVehicleMapping(policy);

        // 4. Fix Driver Data Mapping
        fixDriverMapping(policy);

        // 5. Fix Contact and Financial Fields
        fixContactFields(policy);
    }

    function fixVehicleMapping(policy) {
        console.log('🚗 FIXING vehicle mapping...');

        const vehiclesList = document.getElementById('vehiclesList') ||
                           document.querySelector('.vehicles-container') ||
                           document.querySelector('[id*="vehicle"]');

        if (!vehiclesList) {
            console.warn('⚠️ vehiclesList container not found');
            return;
        }

        // Clear and rebuild vehicles
        vehiclesList.innerHTML = '';

        if (policy.vehicles && policy.vehicles.length > 0) {
            policy.vehicles.forEach((vehicle, index) => {
                let vehicleInfo = vehicle[''] ||
                                `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() ||
                                'Vehicle Information';

                const vehicleHTML = `
                    <div class="vehicle-item mb-3 p-3 border rounded" data-vehicle="${index}">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">Vehicle ${vehicle.vehicleNumber || index + 1}</h6>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeVehicle(${index})">×</button>
                        </div>
                        <div class="row">
                            <div class="col-12 mb-2">
                                <input type="text" class="form-control" placeholder="Vehicle Information"
                                       value="${vehicleInfo}" id="vehicle_${index}_info">
                            </div>
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="Year"
                                       value="${vehicle.year || ''}" id="vehicle_${index}_year">
                            </div>
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="Make"
                                       value="${vehicle.make || ''}" id="vehicle_${index}_make">
                            </div>
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="Model"
                                       value="${vehicle.model || ''}" id="vehicle_${index}_model">
                            </div>
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="VIN"
                                       value="${vehicle.vin || ''}" id="vehicle_${index}_vin">
                            </div>
                        </div>
                    </div>
                `;

                vehiclesList.insertAdjacentHTML('beforeend', vehicleHTML);
                console.log('✅ Added vehicle:', vehicleInfo);
            });

            console.log('✅ FIXED: Vehicles populated -', policy.vehicles.length, 'vehicles');
        } else {
            vehiclesList.innerHTML = '<div class="alert alert-info">No vehicles found in CRM data</div>';
        }
    }

    function fixDriverMapping(policy) {
        console.log('👥 FIXING driver mapping...');

        const driversList = document.getElementById('driversList') ||
                          document.querySelector('.drivers-container') ||
                          document.querySelector('[id*="driver"]');

        if (!driversList) {
            console.warn('⚠️ driversList container not found');
            return;
        }

        // Clear and rebuild drivers
        driversList.innerHTML = '';

        if (policy.drivers && policy.drivers.length > 0) {
            policy.drivers.forEach((driver, index) => {
                let driverName = driver[''] || driver.name || driver.driverName || 'Unknown Driver';

                const driverHTML = `
                    <div class="driver-item mb-3 p-3 border rounded" data-driver="${index}">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">Driver ${driver.driverNumber || index + 1}</h6>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeDriver(${index})">×</button>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-2">
                                <input type="text" class="form-control" placeholder="Driver Name"
                                       value="${driverName}" id="driver_${index}_name">
                            </div>
                            <div class="col-md-6 mb-2">
                                <input type="text" class="form-control" placeholder="License Number"
                                       value="${driver.license_number || ''}" id="driver_${index}_license">
                            </div>
                            <div class="col-md-4">
                                <input type="text" class="form-control" placeholder="State"
                                       value="${driver.license_state || ''}" id="driver_${index}_state">
                            </div>
                            <div class="col-md-4">
                                <input type="date" class="form-control" placeholder="Birth Date"
                                       value="${driver.birth_date || ''}" id="driver_${index}_birth">
                            </div>
                            <div class="col-md-4">
                                <input type="date" class="form-control" placeholder="Hire Date"
                                       value="${driver.hire_date || ''}" id="driver_${index}_hire">
                            </div>
                        </div>
                    </div>
                `;

                driversList.insertAdjacentHTML('beforeend', driverHTML);
                console.log('✅ Added driver:', driverName);
            });

            console.log('✅ FIXED: Drivers populated -', policy.drivers.length, 'drivers');
        } else {
            driversList.innerHTML = '<div class="alert alert-info">No drivers found in CRM data</div>';
        }
    }

    function fixContactFields(policy) {
        console.log('📞 FIXING contact and financial fields...');

        // Contact information mapping
        if (policy.contact) {
            const contactFields = {
                'editPhoneNumber': policy.contact['Phone Number'],
                'editEmailAddress': policy.contact['Email Address'],
                'editCity': policy.contact['City'],
                'editState': policy.contact['State'],
                'editZipCode': policy.contact['ZIP Code']
            };

            Object.keys(contactFields).forEach(fieldId => {
                const field = document.getElementById(fieldId) ||
                             document.querySelector(`input[placeholder*="${fieldId.replace('edit', '').replace(/([A-Z])/g, ' $1').trim()}"]`);
                if (field && contactFields[fieldId]) {
                    field.value = contactFields[fieldId];
                    console.log('✅ Set contact field:', fieldId, '=', contactFields[fieldId]);
                }
            });
        }

        // Financial information mapping
        if (policy.financial) {
            const financialFields = {
                'editAnnualPremium': policy.financial['Annual Premium'],
                'editPaymentPlan': policy.financial['Payment Plan'],
                'editBillingMethod': policy.financial['Billing Method'],
                'editPaymentMethod': policy.financial['Payment Method']
            };

            Object.keys(financialFields).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field && financialFields[fieldId]) {
                    field.value = financialFields[fieldId];
                    console.log('✅ Set financial field:', fieldId, '=', financialFields[fieldId]);
                }
            });
        }
    }

    console.log('✅ Policy Field Mapping Fix injected successfully!');
    alert('Policy field mapping fix has been applied! Edit a policy to see the improvements.');
})();