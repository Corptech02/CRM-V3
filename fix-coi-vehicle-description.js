// Fix COI Vehicle Description - Debug and Fix Vehicle Data Reading
console.log('🔧 Loading COI Vehicle Description Fix...');

// Store original function
const originalGenerateOperationDescription = window.generateOperationDescription;

// Create improved version
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
            console.log('🔍 DEBUGGING VEHICLE PROCESSING:');

            // List each vehicle with details
            policyData.vehicles.forEach((vehicle, index) => {
                console.log(`🚗 Processing vehicle ${index + 1}:`, vehicle);

                // Try multiple property name variations
                const year = vehicle.Year || vehicle.year || vehicle.YEAR || '';
                const make = vehicle.Make || vehicle.make || vehicle.MAKE || '';
                const model = vehicle.Model || vehicle.model || vehicle.MODEL || '';
                const vin = vehicle.VIN || vehicle.vin || vehicle.Vin || '';
                const value = vehicle.Value || vehicle.value || vehicle.VALUE || '';
                const type = vehicle.Type || vehicle.type || vehicle.TYPE || 'Vehicle';

                console.log(`🔍 Extracted values: Year="${year}", Make="${make}", Model="${model}", VIN="${vin}", Type="${type}"`);

                // Build vehicle description
                let vehicleDesc = '';

                // Add year, make, model if available
                if (year || make || model) {
                    const parts = [year, make, model].filter(part => part && part.trim());
                    if (parts.length > 0) {
                        vehicleDesc = parts.join(' ');
                    }
                }

                // If we have vehicle info, use it, otherwise fall back
                if (vehicleDesc) {
                    description += `- ${vehicleDesc}`;
                } else {
                    // Fallback to generic description
                    description += `- Vehicle`;
                }

                // Add VIN if available
                if (vin) description += ` - VIN: ${vin}`;

                // Add value if available
                if (value) {
                    const formattedValue = parseFloat(value) ? parseFloat(value).toLocaleString() : value;
                    description += ` - Value: $${formattedValue}`;
                }

                // Determine if it's a trailer or vehicle based on type field
                const typeStr = (type || '').toLowerCase();
                if (typeStr.includes('trailer') || typeStr.includes('semi') || typeStr.includes('dolly') || typeStr === 'trailer') {
                    description += ` - TRAILER`;
                } else {
                    description += ` - VEHICLE`;
                }
                description += '\n';

                console.log(`✅ Generated vehicle description: "${description.split('\n').slice(-2, -1)[0]}"`);
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
    console.log('📝 FIXED: Generated description:', finalDescription);
    return finalDescription;
};

console.log('✅ COI Vehicle Description Fix loaded successfully!');