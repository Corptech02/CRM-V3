// Console injection fix for COI vehicle description
// Copy and paste this entire script into the browser console on vigagency.com

console.log('🔧 Applying COI Vehicle Description Fix...');

// Override the generateOperationDescription function
window.generateOperationDescription = function(policyData) {
    console.log('🚚 FIXED: Generating operation description with data:', policyData);

    if (!policyData) {
        console.log('❌ No policy data provided to generateOperationDescription');
        return '';
    }

    const policyType = policyData.policyType || policyData.overview?.['Policy Type'] || '';
    const insuredName = policyData.clientName || policyData.insured?.['Name/Business Name'] || '';

    console.log('📋 FIXED: Policy type for description:', policyType);
    console.log('👤 FIXED: Insured name for description:', insuredName);
    console.log('🚛 FIXED: Vehicles for description:', policyData.vehicles);

    let description = ``;

    if (policyType === 'commercial-auto' || policyType === 'Commercial Auto') {
        // Add vehicle info if available
        if (policyData.vehicles && policyData.vehicles.length > 0) {
            console.log('🔍 FIXED: Processing vehicles...');

            // List each vehicle with details
            policyData.vehicles.forEach((vehicle, index) => {
                console.log(`🚗 FIXED: Processing vehicle ${index + 1}:`, vehicle);

                // Enhanced property extraction with debugging
                const year = vehicle.Year || vehicle.year || vehicle.YEAR || '';
                const make = vehicle.Make || vehicle.make || vehicle.MAKE || '';
                const model = vehicle.Model || vehicle.model || vehicle.MODEL || '';
                const vin = vehicle.VIN || vehicle.vin || vehicle.Vin || '';
                const value = vehicle.Value || vehicle.value || vehicle.VALUE || '';
                const type = vehicle.Type || vehicle.type || vehicle.TYPE || 'Vehicle';

                console.log(`🔍 FIXED: Raw values: Year="${year}", Make="${make}", Model="${model}", VIN="${vin}", Type="${type}"`);

                // Build vehicle description more carefully
                let vehicleDesc = '';
                const parts = [];

                // Add each part if it exists and isn't empty
                if (year && String(year).trim()) parts.push(String(year).trim());
                if (make && String(make).trim()) parts.push(String(make).trim());
                if (model && String(model).trim()) parts.push(String(model).trim());

                console.log(`🔍 FIXED: Vehicle parts extracted:`, parts);

                if (parts.length > 0) {
                    vehicleDesc = parts.join(' ');
                    description += `- ${vehicleDesc}`;
                } else {
                    // Fallback to generic description if no details
                    description += `- Vehicle`;
                }

                // Add VIN if available
                if (vin && String(vin).trim()) {
                    description += ` - VIN: ${String(vin).trim()}`;
                }

                // Add value if available
                if (value && String(value).trim()) {
                    const numValue = parseFloat(value);
                    if (numValue && numValue > 0) {
                        description += ` - Value: $${numValue.toLocaleString()}`;
                    } else {
                        description += ` - Value: ${String(value).trim()}`;
                    }
                }

                // Determine if it's a trailer or vehicle based on type field
                const typeStr = String(type || '').toLowerCase();
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

// Also override the field creation to use the fixed function
const originalCreateFormFields = window.createFormFields;
if (originalCreateFormFields) {
    window.createFormFields = function(policyData) {
        console.log('🔧 FIXED: Creating form fields with enhanced description generation');

        // Call original function but with our fixed description
        const result = originalCreateFormFields.call(this, policyData);

        // Force update the description field with our fixed version
        setTimeout(() => {
            const descField = document.getElementById('field_description');
            if (descField) {
                const fixedDescription = window.generateOperationDescription(policyData);
                descField.value = fixedDescription;
                console.log('✅ FIXED: Description field updated with:', fixedDescription);
            }
        }, 100);

        return result;
    };
}

console.log('✅ COI Vehicle Description Fix Applied! Now generate a COI to see the fixed vehicle descriptions.');
console.log('Expected output: "- 1998 PETERBILT 379 - VIN: 45052 - VEHICLE" instead of "- - VEHICLE"');