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
        vehicleEntry.style.cssText = 'margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;';

        vehicleEntry.innerHTML = `
            <h4>Vehicle ${vehicleCount}</h4>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <input type="text" class="form-control" placeholder="Year" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control" placeholder="Make" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control" placeholder="Model" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <input type="text" class="form-control" placeholder="VIN" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control" placeholder="Value" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
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
        trailerEntry.style.cssText = 'margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;';

        trailerEntry.innerHTML = `
            <h4>Trailer ${trailerCount}</h4>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <input type="text" class="form-control" placeholder="Year" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control" placeholder="Make" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control" placeholder="Type" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <input type="text" class="form-control" placeholder="VIN" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <input type="text" class="form-control" placeholder="Value" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
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

    // Make functions available globally
    window.addPolicyVehicle = addPolicyVehicle;
    window.addPolicyTrailer = addPolicyTrailer;
    window.addPolicyDriver = addPolicyDriver;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPolicyOverrides);
    } else {
        initPolicyOverrides();
    }

    // Also initialize after a delay to ensure all other scripts have loaded
    setTimeout(initPolicyOverrides, 1000);
})();