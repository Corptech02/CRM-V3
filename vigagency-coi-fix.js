// VIG Agency COI Vehicle Description Fix
// This script fixes the issue where vehicle descriptions show "- - VEHICLE" instead of actual vehicle details

(function() {
    'use strict';

    console.log('🔧 VIG Agency COI Fix: Initializing vehicle description fix...');

    // Wait for the page to load and for the functions to be available
    function initializeFix() {
        if (typeof window.generateOperationDescription === 'function') {
            console.log('🔧 VIG Agency COI Fix: Found generateOperationDescription, applying fix...');

            // Store original function
            const originalFunc = window.generateOperationDescription;

            // Override with fixed version
            window.generateOperationDescription = function(policyData) {
                console.log('🚚 FIXED: Generating operation description with data:', policyData);

                if (!policyData) {
                    console.log('❌ No policy data provided to generateOperationDescription');
                    return '';
                }

                const policyType = policyData.policyType || policyData.overview?.['Policy Type'] || '';
                const insuredName = policyData.clientName || policyData.insured?.['Name/Business Name'] || '';

                console.log('📋 Policy type for description:', policyType);
                console.log('👤 Insured name for description:', insuredName);
                console.log('🚛 Vehicles for description:', policyData.vehicles);

                let description = ``;

                if (policyType === 'commercial-auto' || policyType === 'Commercial Auto') {
                    // Add vehicle info if available
                    if (policyData.vehicles && policyData.vehicles.length > 0) {
                        console.log('🔍 FIXED: Processing vehicles...');

                        // List each vehicle with details
                        policyData.vehicles.forEach((vehicle, index) => {
                            console.log(`🚗 FIXED: Processing vehicle ${index + 1}:`, vehicle);

                            // Try multiple property name variations and handle objects better
                            const year = vehicle.Year || vehicle.year || vehicle.YEAR || '';
                            const make = vehicle.Make || vehicle.make || vehicle.MAKE || '';
                            const model = vehicle.Model || vehicle.model || vehicle.MODEL || '';
                            const vin = vehicle.VIN || vehicle.vin || vehicle.Vin || '';
                            const value = vehicle.Value || vehicle.value || vehicle.VALUE || '';
                            const type = vehicle.Type || vehicle.type || vehicle.TYPE || 'Vehicle';

                            console.log(`🔍 FIXED: Extracted values: Year="${year}", Make="${make}", Model="${model}", VIN="${vin}", Type="${type}"`);

                            // Build vehicle description more carefully
                            let vehicleDesc = '';
                            const parts = [];

                            // Add each part if it exists and isn't empty
                            if (year && year.toString().trim()) parts.push(year.toString().trim());
                            if (make && make.toString().trim()) parts.push(make.toString().trim());
                            if (model && model.toString().trim()) parts.push(model.toString().trim());

                            if (parts.length > 0) {
                                vehicleDesc = parts.join(' ');
                                description += `- ${vehicleDesc}`;
                            } else {
                                // Fallback to generic description if no details
                                description += `- Vehicle`;
                            }

                            // Add VIN if available
                            if (vin && vin.toString().trim()) {
                                description += ` - VIN: ${vin.toString().trim()}`;
                            }

                            // Add value if available
                            if (value && value.toString().trim()) {
                                const numValue = parseFloat(value);
                                if (numValue && numValue > 0) {
                                    description += ` - Value: $${numValue.toLocaleString()}`;
                                } else {
                                    description += ` - Value: ${value.toString().trim()}`;
                                }
                            }

                            // Determine if it's a trailer or vehicle based on type field
                            const typeStr = (type || '').toString().toLowerCase();
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
                console.log('📝 FIXED: Final generated description:', finalDescription);
                return finalDescription;
            };

            console.log('✅ VIG Agency COI Fix: Vehicle description fix applied successfully!');
        } else {
            console.log('🔄 VIG Agency COI Fix: generateOperationDescription not found yet, retrying...');
            setTimeout(initializeFix, 500);
        }
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFix);
    } else {
        initializeFix();
    }

    // Also try to initialize after a delay
    setTimeout(initializeFix, 1000);
    setTimeout(initializeFix, 3000);

})();