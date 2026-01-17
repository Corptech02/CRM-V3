/*
 * Fix Policy Field Mapping for vigagency.com Admin Dashboard
 * Addresses field mapping issues between CRM data structure and edit modal
 */

(function() {
    console.log('🔧 Loading Policy Field Mapping Fix...');

    // Override the original field mapping functions
    window.originalEditPolicy = window.editPolicy;

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
        const policyNumberField = document.getElementById('editPolicyNumber');
        if (policyNumberField && policy.policyNumber) {
            policyNumberField.value = policy.policyNumber;
            console.log('✅ FIXED: Policy Number set to:', policy.policyNumber);
        }

        // 2. Fix Client Name Mapping
        const clientNameField = document.getElementById('editClientName') || document.getElementById('editInsuredName');
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

        // 5. Fix Other Basic Fields
        fixBasicFields(policy);
    }

    function fixVehicleMapping(policy) {
        console.log('🚗 FIXING vehicle mapping...');
        console.log('🔍 Vehicle data structure:', policy.vehicles);

        const vehiclesList = document.getElementById('vehiclesList');
        if (!vehiclesList) {
            console.warn('⚠️ vehiclesList container not found');
            return;
        }

        // Clear existing content
        vehiclesList.innerHTML = '';

        if (policy.vehicles && policy.vehicles.length > 0) {
            console.log('🔍 Processing', policy.vehicles.length, 'vehicles');

            policy.vehicles.forEach((vehicle, index) => {
                console.log('🚗 Processing vehicle:', vehicle);

                // Extract vehicle info from CRM format
                let vehicleInfo = '';
                if (vehicle['']) {
                    vehicleInfo = vehicle[''];
                } else if (vehicle.year || vehicle.make || vehicle.model) {
                    vehicleInfo = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
                }

                const vehicleHTML = `
                    <div class="vehicle-item" data-vehicle="${index}">
                        <div class="vehicle-header">
                            <span class="vehicle-title">Vehicle ${vehicle.vehicleNumber || index + 1}</span>
                            <button type="button" class="btn btn-sm btn-danger" onclick="removeVehicle(${index})">Remove</button>
                        </div>
                        <div class="vehicle-fields">
                            <input type="text" placeholder="Vehicle Info" value="${vehicleInfo}"
                                   class="form-control" id="vehicle_${index}_info">
                            <input type="text" placeholder="Year" value="${vehicle.year || ''}"
                                   class="form-control" id="vehicle_${index}_year">
                            <input type="text" placeholder="Make" value="${vehicle.make || ''}"
                                   class="form-control" id="vehicle_${index}_make">
                            <input type="text" placeholder="Model" value="${vehicle.model || ''}"
                                   class="form-control" id="vehicle_${index}_model">
                            <input type="text" placeholder="VIN" value="${vehicle.vin || ''}"
                                   class="form-control" id="vehicle_${index}_vin">
                        </div>
                    </div>
                `;

                vehiclesList.insertAdjacentHTML('beforeend', vehicleHTML);
                console.log('✅ Added vehicle to UI:', vehicleInfo);
            });

            console.log('✅ FIXED: Vehicles populated -', policy.vehicles.length, 'vehicles');
        } else {
            vehiclesList.innerHTML = '<div class="no-data">No vehicles found</div>';
            console.log('⚠️ No vehicles to display');
        }
    }

    function fixDriverMapping(policy) {
        console.log('👥 FIXING driver mapping...');
        console.log('🔍 Driver data structure:', policy.drivers);

        const driversList = document.getElementById('driversList');
        if (!driversList) {
            console.warn('⚠️ driversList container not found');
            return;
        }

        // Clear existing content
        driversList.innerHTML = '';

        if (policy.drivers && policy.drivers.length > 0) {
            console.log('🔍 Processing', policy.drivers.length, 'drivers');

            policy.drivers.forEach((driver, index) => {
                console.log('👥 Processing driver:', driver);

                // Extract driver info from CRM format
                let driverName = '';
                if (driver['']) {
                    driverName = driver[''];
                } else if (driver.name) {
                    driverName = driver.name;
                } else if (driver.driverName) {
                    driverName = driver.driverName;
                }

                const driverHTML = `
                    <div class="driver-item" data-driver="${index}">
                        <div class="driver-header">
                            <span class="driver-title">Driver ${driver.driverNumber || index + 1}</span>
                            <button type="button" class="btn btn-sm btn-danger" onclick="removeDriver(${index})">Remove</button>
                        </div>
                        <div class="driver-fields">
                            <input type="text" placeholder="Driver Name" value="${driverName}"
                                   class="form-control" id="driver_${index}_name">
                            <input type="text" placeholder="License Number" value="${driver.license_number || ''}"
                                   class="form-control" id="driver_${index}_license">
                            <input type="text" placeholder="License State" value="${driver.license_state || ''}"
                                   class="form-control" id="driver_${index}_state">
                            <input type="date" placeholder="Birth Date" value="${driver.birth_date || ''}"
                                   class="form-control" id="driver_${index}_birth">
                            <input type="date" placeholder="Hire Date" value="${driver.hire_date || ''}"
                                   class="form-control" id="driver_${index}_hire">
                        </div>
                    </div>
                `;

                driversList.insertAdjacentHTML('beforeend', driverHTML);
                console.log('✅ Added driver to UI:', driverName);
            });

            console.log('✅ FIXED: Drivers populated -', policy.drivers.length, 'drivers');
        } else {
            driversList.innerHTML = '<div class="no-data">No drivers found</div>';
            console.log('⚠️ No drivers to display');
        }
    }

    function fixBasicFields(policy) {
        console.log('📋 FIXING basic field mapping...');

        // Policy basic info
        const fields = {
            'editEffectiveDate': policy.effectiveDate,
            'editExpirationDate': policy.expirationDate,
            'editCarrier': policy.carrier,
            'editPremium': policy.premium,
            'editAgent': policy.agent || '',
            'editDotNumber': policy.dotNumber || '',
            'editMcNumber': policy.mcNumber || ''
        };

        // Contact info
        if (policy.contact) {
            fields['editPhoneNumber'] = policy.contact['Phone Number'];
            fields['editEmailAddress'] = policy.contact['Email Address'];
            fields['editCity'] = policy.contact['City'];
            fields['editState'] = policy.contact['State'];
            fields['editZipCode'] = policy.contact['ZIP Code'];
        }

        // Financial info
        if (policy.financial) {
            fields['editAnnualPremium'] = policy.financial['Annual Premium'];
            fields['editPaymentPlan'] = policy.financial['Payment Plan'];
            fields['editBillingMethod'] = policy.financial['Billing Method'];
            fields['editPaymentMethod'] = policy.financial['Payment Method'];
        }

        // Set all fields
        Object.keys(fields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && fields[fieldId]) {
                if (field.type === 'select-one') {
                    // Handle select fields
                    Array.from(field.options).forEach(option => {
                        if (option.value === fields[fieldId] || option.text === fields[fieldId]) {
                            field.value = option.value;
                        }
                    });
                } else {
                    field.value = fields[fieldId];
                }
                console.log('✅ FIXED field:', fieldId, '=', fields[fieldId]);
            }
        });
    }

    console.log('✅ Policy Field Mapping Fix loaded successfully');
})();