// Auto-inject COI Vehicle Description Fix for vigagency.com
// This script automatically applies the fix when the page loads

(function() {
    'use strict';

    console.log('🚀 Auto-injecting COI Vehicle Description Fix for vigagency.com...');

    // Function to inject our fix
    function injectCoiFix() {
        // Check if we're on the right page
        if (!window.location.href.includes('vigagency.com')) {
            console.log('❌ Not on vigagency.com, skipping COI fix injection');
            return;
        }

        console.log('🔧 Injecting COI Vehicle Description Fix...');

        // Wait for the page functions to be available
        function waitForFunctions() {
            if (typeof window.generateOperationDescription === 'function') {
                console.log('✅ Found generateOperationDescription, applying enhanced fix...');

                // Store original function
                const originalFunc = window.generateOperationDescription;

                // Override with our enhanced version
                window.generateOperationDescription = function(policyData) {
                    console.log('🚚 FIXED: Generating operation description with enhanced vehicle data extraction:', policyData);

                    if (!policyData) {
                        console.log('❌ No policy data provided to generateOperationDescription');
                        return '';
                    }

                    const policyType = policyData.policyType || policyData.overview?.['Policy Type'] || '';
                    const insuredName = policyData.clientName || policyData.insured?.['Name/Business Name'] || '';

                    console.log('📋 FIXED: Policy type for description:', policyType);
                    console.log('👤 FIXED: Insured name for description:', insuredName);
                    console.log('🚛 FIXED: Vehicles for description:', policyData.vehicles);

                    let description = '';

                    if (policyType === 'commercial-auto' || policyType === 'Commercial Auto') {
                        // Add vehicle info if available
                        if (policyData.vehicles && policyData.vehicles.length > 0) {
                            console.log('🔍 FIXED: Processing vehicles with enhanced extraction...');

                            // List each vehicle with details
                            policyData.vehicles.forEach((vehicle, index) => {
                                console.log(`🚗 FIXED: Processing vehicle ${index + 1}:`, vehicle);

                                // Enhanced property extraction with multiple naming variations
                                let year = '', make = '', model = '', vin = '', value = '', type = '';

                                // Try all possible property name variations
                                const yearProps = ['Year', 'year', 'YEAR', 'yr', 'YR'];
                                const makeProps = ['Make', 'make', 'MAKE', 'manufacturer', 'Manufacturer'];
                                const modelProps = ['Model', 'model', 'MODEL'];
                                const vinProps = ['VIN', 'vin', 'Vin', 'vinNumber', 'VinNumber'];
                                const valueProps = ['Value', 'value', 'VALUE', 'vehicleValue', 'VehicleValue'];
                                const typeProps = ['Type', 'type', 'TYPE', 'vehicleType', 'VehicleType'];

                                // Extract with fallbacks
                                for (let prop of yearProps) if (!year && vehicle[prop]) year = String(vehicle[prop]).trim();
                                for (let prop of makeProps) if (!make && vehicle[prop]) make = String(vehicle[prop]).trim();
                                for (let prop of modelProps) if (!model && vehicle[prop]) model = String(vehicle[prop]).trim();
                                for (let prop of vinProps) if (!vin && vehicle[prop]) vin = String(vehicle[prop]).trim();
                                for (let prop of valueProps) if (!value && vehicle[prop]) value = String(vehicle[prop]).trim();
                                for (let prop of typeProps) if (!type && vehicle[prop]) type = String(vehicle[prop]).trim();

                                // If no type found, default to 'Vehicle'
                                if (!type) type = 'Vehicle';

                                console.log(`🔍 FIXED: Enhanced extraction results: Year="${year}", Make="${make}", Model="${model}", VIN="${vin}", Type="${type}"`);

                                // Build vehicle description with better logic
                                let vehicleDesc = '';
                                const parts = [];

                                // Add each part if it exists and isn't empty
                                if (year && year !== 'undefined' && year !== 'null') parts.push(year);
                                if (make && make !== 'undefined' && make !== 'null') parts.push(make);
                                if (model && model !== 'undefined' && model !== 'null') parts.push(model);

                                console.log(`🔍 FIXED: Vehicle parts extracted:`, parts);

                                if (parts.length > 0) {
                                    vehicleDesc = parts.join(' ');
                                    description += `- ${vehicleDesc}`;
                                } else {
                                    // Fallback to generic description if no details
                                    description += `- Vehicle`;
                                }

                                // Add VIN if available
                                if (vin && vin !== 'undefined' && vin !== 'null') {
                                    description += ` - VIN: ${vin}`;
                                }

                                // Add value if available
                                if (value && value !== 'undefined' && value !== 'null') {
                                    const numValue = parseFloat(value);
                                    if (numValue && numValue > 0) {
                                        description += ` - Value: $${numValue.toLocaleString()}`;
                                    } else {
                                        description += ` - Value: ${value}`;
                                    }
                                }

                                // Determine if it's a trailer or vehicle based on type field
                                const typeStr = type.toLowerCase();
                                if (typeStr.includes('trailer') || typeStr.includes('semi') || typeStr.includes('dolly')) {
                                    description += ` - TRAILER`;
                                } else {
                                    description += ` - VEHICLE`;
                                }
                                description += '\n';

                                console.log(`✅ FIXED: Generated vehicle line: "${description.split('\n').slice(-2)[0]}"`);
                            });

                            // Add DOT/MC numbers if available
                            const dotNumber = policyData.dotNumber || policyData.overview?.['DOT Number'] || '';
                            const mcNumber = policyData.mcNumber || policyData.overview?.['MC Number'] || '';

                            if (dotNumber || mcNumber) {
                                description += '\n';
                                if (dotNumber) description += `DOT# ${dotNumber} `;
                                if (mcNumber) description += `MC# ${mcNumber}`;
                            }
                        } else {
                            description += `commercial auto operations. `;
                        }
                    } else {
                        description += `general liability operations. `;
                    }

                    const finalDescription = description.trim();
                    console.log('📝 FIXED: Final enhanced description:', finalDescription);
                    return finalDescription;
                };

                // Also override any form field creation functions
                if (window.createFormFields) {
                    const originalCreateFormFields = window.createFormFields;
                    window.createFormFields = function(policyData) {
                        console.log('🔧 FIXED: Creating form fields with enhanced description generation');

                        // Call original function
                        const result = originalCreateFormFields.call(this, policyData);

                        // Force update the description field with our fixed version
                        setTimeout(() => {
                            const descField = document.getElementById('field_description');
                            if (descField) {
                                const fixedDescription = window.generateOperationDescription(policyData);
                                descField.value = fixedDescription;
                                console.log('✅ FIXED: Description field updated with enhanced fix:', fixedDescription);
                            }
                        }, 100);

                        return result;
                    };
                }

                console.log('✅ COI Vehicle Description Fix Applied Successfully!');
                console.log('Expected output: "- 1998 PETERBILT 379 - VIN: 45052 - VEHICLE" instead of "- - VEHICLE"');

                // Show success notification
                if (document.body) {
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #4CAF50;
                        color: white;
                        padding: 15px;
                        border-radius: 5px;
                        z-index: 10000;
                        font-family: Arial, sans-serif;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    `;
                    notification.innerHTML = '✅ COI Vehicle Description Fix Applied!';
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 5000);
                }
            } else {
                console.log('🔄 Functions not ready yet, retrying in 500ms...');
                setTimeout(waitForFunctions, 500);
            }
        }

        // Start waiting for functions
        waitForFunctions();
    }

    // Initialize the fix
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectCoiFix);
    } else {
        injectCoiFix();
    }

    // Also try to initialize after delays to ensure it loads
    setTimeout(injectCoiFix, 1000);
    setTimeout(injectCoiFix, 3000);
    setTimeout(injectCoiFix, 5000);

})();