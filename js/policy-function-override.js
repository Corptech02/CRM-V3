// Policy Function Override
// This script ensures policy-specific functions take precedence over lead functions
// when in a policy modal context

(function() {
    'use strict';

    // Wait for DOM to be ready
    function initPolicyOverrides() {
        // Store original lead functions
        const originalAddVehicle = window.addVehicle;
        const originalAddTrailer = window.addTrailer;
        const originalAddDriver = window.addDriver;

        // Override with policy-aware versions
        window.addVehicle = function(leadId) {
            const isPolicyModal = document.getElementById('policyModal') !== null;
            console.log('addVehicle called - isPolicyModal:', isPolicyModal, 'leadId:', leadId);

            if (isPolicyModal) {
                // Policy context - add vehicle to policy form
                addPolicyVehicle();
            } else if (leadId && originalAddVehicle) {
                // Lead context - use original function
                originalAddVehicle(leadId);
            } else if (window.addVehicleToLead) {
                // Fallback to lead function
                window.addVehicleToLead(leadId);
            }
        };

        window.addTrailer = function(leadId) {
            const isPolicyModal = document.getElementById('policyModal') !== null;
            console.log('addTrailer called - isPolicyModal:', isPolicyModal, 'leadId:', leadId);

            if (isPolicyModal) {
                // Policy context - add trailer to policy form
                addPolicyTrailer();
            } else if (leadId && originalAddTrailer) {
                // Lead context - use original function
                originalAddTrailer(leadId);
            } else if (window.addTrailerToLead) {
                // Fallback to lead function
                window.addTrailerToLead(leadId);
            }
        };

        window.addDriver = function(leadId) {
            const isPolicyModal = document.getElementById('policyModal') !== null;
            console.log('addDriver called - isPolicyModal:', isPolicyModal, 'leadId:', leadId);

            if (isPolicyModal) {
                // Policy context - add driver to policy form
                addPolicyDriver();
            } else if (leadId && originalAddDriver) {
                // Lead context - use original function
                originalAddDriver(leadId);
            } else if (window.addDriverToLead) {
                // Fallback to lead function
                window.addDriverToLead(leadId);
            }
        };

        console.log('✅ Policy function overrides applied');
    }

    // Policy-specific functions
    function addPolicyVehicle() {
        console.log('🚗 Adding vehicle to policy form');
        const vehiclesList = document.getElementById('vehiclesList');
        if (!vehiclesList) {
            console.error('vehiclesList not found');
            return;
        }

        const vehicleCount = vehiclesList.children.length + 1;

        const vehicleEntry = document.createElement('div');
        vehicleEntry.className = 'vehicle-entry';
        vehicleEntry.style.marginBottom = '20px';
        vehicleEntry.style.padding = '15px';
        vehicleEntry.style.border = '1px solid rgb(229, 231, 235)';
        vehicleEntry.style.borderRadius = '8px';
        vehicleEntry.style.background = 'rgb(249, 250, 251)';

        vehicleEntry.innerHTML = `
            <h4>Vehicle ${vehicleCount}</h4>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <input type="text" class="form-control vehicle-year" placeholder="Year" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control vehicle-make" placeholder="Make" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control vehicle-model" placeholder="Model" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <select class="form-control vehicle-radius" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <option value="">Select Mile Radius</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="500">500</option>
                    <option value="unlimited">Unlimited</option>
                </select>
                <input type="number" class="form-control vehicle-value" placeholder="Value ($)" step="1000" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 10px;">
                <input type="text" class="form-control vehicle-vin" placeholder="VIN" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;" oninput="checkVINLength(this)">
            </div>
            <button type="button" onclick="this.parentElement.remove()" style="margin-top: 10px; background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove Vehicle</button>
        `;

        vehiclesList.appendChild(vehicleEntry);
        console.log('✅ Vehicle added to policy form');
    }

    function addPolicyTrailer() {
        console.log('🚛 Adding trailer to policy form');
        const trailersList = document.getElementById('trailersList');
        if (!trailersList) {
            console.error('trailersList not found');
            return;
        }

        const trailerCount = trailersList.children.length + 1;

        const trailerEntry = document.createElement('div');
        trailerEntry.className = 'trailer-entry';
        trailerEntry.style.marginBottom = '20px';
        trailerEntry.style.padding = '15px';
        trailerEntry.style.border = '1px solid rgb(229, 231, 235)';
        trailerEntry.style.borderRadius = '8px';
        trailerEntry.style.background = 'rgb(249, 250, 251)';

        trailerEntry.innerHTML = `
            <h4>Trailer ${trailerCount}</h4>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <input type="text" class="form-control trailer-year" placeholder="Year" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control trailer-make" placeholder="Make" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <div style="position: relative;">
                    <select class="form-control trailer-type" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;" onchange="handleTrailerTypeChange(this, ${trailerCount})">
                        <option value="">Select Type</option>
                        <option>Dry Freight</option>
                        <option>Reefer</option>
                        <option>Flatbed</option>
                        <option>Dump</option>
                        <option>Gooseneck</option>
                        <option>Other</option>
                    </select>
                    <input type="text" class="form-control trailer-type-text-${trailerCount}" style="display: none; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;" placeholder="Enter trailer type">
                    <button type="button" class="trailer-type-arrow-${trailerCount}" onclick="switchBackToTrailerTypeDropdown(${trailerCount})" style="display: none; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px;">▼</button>
                </div>
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <select class="form-control trailer-radius" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <option value="">Select Mile Radius</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="500">500</option>
                    <option value="unlimited">Unlimited</option>
                </select>
                <input type="number" class="form-control trailer-value" placeholder="Value ($)" step="1000" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 10px;">
                <input type="text" class="form-control trailer-vin" placeholder="VIN" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;" oninput="checkTrailerVINLength(this)">
            </div>
            <button type="button" onclick="this.parentElement.remove()" style="margin-top: 10px; background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove Trailer</button>
        `;

        trailersList.appendChild(trailerEntry);
        console.log('✅ Trailer added to policy form');
    }

    function addPolicyDriver() {
        console.log('👤 Adding driver to policy form');
        const driversList = document.getElementById('driversList');
        if (!driversList) {
            console.error('driversList not found');
            return;
        }

        const driverCount = driversList.children.length + 1;

        const driverEntry = document.createElement('div');
        driverEntry.className = 'driver-entry';
        driverEntry.style.cssText = 'margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;';

        driverEntry.innerHTML = `
            <h4>Driver ${driverCount}</h4>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <input type="text" class="form-control" placeholder="Full Name" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="date" class="form-control" placeholder="Date of Birth" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <input type="text" class="form-control" placeholder="License Number" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <select class="form-control" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <option value="">Driver Type</option>
                    <option value="owner-operator">Owner Operator</option>
                    <option value="employee">Employee</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <button type="button" onclick="this.parentElement.remove()" style="margin-top: 10px; background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove Driver</button>
        `;

        driversList.appendChild(driverEntry);
        console.log('✅ Driver added to policy form');
    }

    // VIN Length checker - triggers decoder when 17 characters are entered
    function checkVINLength(vinInput) {
        const vin = vinInput.value.trim();
        if (vin.length === 17) {
            decodeVIN(vinInput);
        }
    }

    // Trailer VIN Length checker
    function checkTrailerVINLength(vinInput) {
        const vin = vinInput.value.trim();
        if (vin.length === 17) {
            decodeTrailerVIN(vinInput);
        }
    }

    // VIN Decoder functions
    function decodeVIN(vinInput) {
        const vin = vinInput.value.trim().toUpperCase();

        if (!vin || vin.length !== 17) {
            console.log('VIN must be 17 characters long');
            return;
        }

        // Find the parent vehicle entry
        const vehicleEntry = vinInput.closest('.vehicle-entry');
        if (!vehicleEntry) {
            console.error('Could not find vehicle entry');
            return;
        }

        // Get the input fields within this vehicle entry
        const yearInput = vehicleEntry.querySelector('.vehicle-year');
        const makeInput = vehicleEntry.querySelector('.vehicle-make');
        const modelInput = vehicleEntry.querySelector('.vehicle-model');

        // Show loading state
        if (yearInput) yearInput.value = 'Loading...';
        if (makeInput) makeInput.value = 'Loading...';
        if (modelInput) modelInput.value = 'Loading...';

        // Use NHTSA VIN decoder API (free)
        const apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.Results && data.Results.length > 0) {
                    const result = data.Results[0];

                    // Extract year, make, model
                    const year = result.ModelYear || '';
                    const make = result.Make || '';
                    const model = result.Model || '';

                    // Populate the fields
                    if (yearInput) yearInput.value = year;
                    if (makeInput) makeInput.value = make;
                    if (modelInput) modelInput.value = model;

                    console.log('✅ VIN decoded successfully:', { year, make, model });
                } else {
                    // Clear loading state if no results
                    if (yearInput) yearInput.value = '';
                    if (makeInput) makeInput.value = '';
                    if (modelInput) modelInput.value = '';
                    console.log('❌ No vehicle data found for VIN');
                }
            })
            .catch(error => {
                console.error('Error decoding VIN:', error);
                // Clear loading state on error
                if (yearInput) yearInput.value = '';
                if (makeInput) makeInput.value = '';
                if (modelInput) modelInput.value = '';
            });
    }

    function decodeTrailerVIN(vinInput) {
        const vin = vinInput.value.trim().toUpperCase();

        if (!vin || vin.length !== 17) {
            console.log('VIN must be 17 characters long');
            return;
        }

        // Find the parent trailer entry
        const trailerEntry = vinInput.closest('.trailer-entry');
        if (!trailerEntry) {
            console.error('Could not find trailer entry');
            return;
        }

        // Get the input fields within this trailer entry
        const yearInput = trailerEntry.querySelector('.trailer-year');
        const makeInput = trailerEntry.querySelector('.trailer-make');

        // Show loading state
        if (yearInput) yearInput.value = 'Loading...';
        if (makeInput) makeInput.value = 'Loading...';

        // Use NHTSA VIN decoder API (free)
        const apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.Results && data.Results.length > 0) {
                    const result = data.Results[0];

                    // Extract year, make for trailers
                    const year = result.ModelYear || '';
                    const make = result.Make || '';

                    // Populate the fields
                    if (yearInput) yearInput.value = year;
                    if (makeInput) makeInput.value = make;

                    console.log('✅ Trailer VIN decoded successfully:', { year, make });
                } else {
                    // Clear loading state if no results
                    if (yearInput) yearInput.value = '';
                    if (makeInput) makeInput.value = '';
                    console.log('❌ No trailer data found for VIN');
                }
            })
            .catch(error => {
                console.error('Error decoding trailer VIN:', error);
                // Clear loading state on error
                if (yearInput) yearInput.value = '';
                if (makeInput) makeInput.value = '';
            });
    }

    // Handle trailer type dropdown change to "Other"
    function handleTrailerTypeChange(selectElement, trailerCount) {
        if (selectElement.value === 'Other') {
            // Hide dropdown and show text input with arrow button
            selectElement.style.display = 'none';
            const textInput = document.querySelector(`.trailer-type-text-${trailerCount}`);
            const arrowButton = document.querySelector(`.trailer-type-arrow-${trailerCount}`);

            if (textInput) {
                textInput.style.display = 'block';
                textInput.focus();
            }
            if (arrowButton) {
                arrowButton.style.display = 'block';
            }

            console.log('✅ Switched trailer type to text input mode');
        }
    }

    // Switch trailer type input back to dropdown
    function switchBackToTrailerTypeDropdown(trailerCount) {
        const selectElement = document.querySelector(`.trailer-entry:nth-child(${trailerCount}) .trailer-type`);
        const textInput = document.querySelector(`.trailer-type-text-${trailerCount}`);
        const arrowButton = document.querySelector(`.trailer-type-arrow-${trailerCount}`);

        // Show dropdown and hide text input with arrow button
        if (selectElement) {
            selectElement.style.display = 'block';
            selectElement.value = ''; // Reset to default
        }
        if (textInput) {
            textInput.style.display = 'none';
            textInput.value = ''; // Clear text input
        }
        if (arrowButton) {
            arrowButton.style.display = 'none';
        }

        console.log('✅ Switched trailer type back to dropdown mode');
    }

    // Make functions available globally
    window.addPolicyVehicle = addPolicyVehicle;
    window.addPolicyTrailer = addPolicyTrailer;
    window.addPolicyDriver = addPolicyDriver;
    window.decodeVIN = decodeVIN;
    window.decodeTrailerVIN = decodeTrailerVIN;
    window.checkVINLength = checkVINLength;
    window.checkTrailerVINLength = checkTrailerVINLength;
    window.handleTrailerTypeChange = handleTrailerTypeChange;
    window.switchBackToTrailerTypeDropdown = switchBackToTrailerTypeDropdown;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPolicyOverrides);
    } else {
        initPolicyOverrides();
    }

    // Also initialize after a delay to ensure all other scripts have loaded
    setTimeout(initPolicyOverrides, 1000);
})();