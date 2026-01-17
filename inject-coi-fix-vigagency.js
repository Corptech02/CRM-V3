// Inject this fix directly into vigagency.com console to fix COI vehicle descriptions
// Copy and paste this entire script into browser console on vigagency.com admin dashboard

console.log('🔧 Applying Enhanced COI Vehicle Description Fix for vigagency.com...');

// Enhanced vehicle description fix
window.generateOperationDescription = function(policyData) {
    console.log('🚚 FIXED: Enhanced vehicle description generation with data:', policyData);

    if (!policyData) {
        console.log('❌ No policy data provided');
        return '';
    }

    const policyType = policyData.policyType || policyData.overview?.['Policy Type'] || '';
    const insuredName = policyData.clientName || policyData.insured?.['Name/Business Name'] || '';

    console.log('📋 FIXED: Policy type:', policyType);
    console.log('👤 FIXED: Insured name:', insuredName);
    console.log('🚛 FIXED: Raw vehicles data:', policyData.vehicles);

    let description = '';

    if (policyType === 'commercial-auto' || policyType === 'Commercial Auto') {
        if (policyData.vehicles && policyData.vehicles.length > 0) {
            console.log('🔍 FIXED: Processing vehicles with enhanced extraction...');

            policyData.vehicles.forEach((vehicle, index) => {
                console.log(`🚗 FIXED: Processing vehicle ${index + 1}:`, vehicle);

                // Enhanced property extraction - try all possible variations
                let year = '', make = '', model = '', vin = '', value = '', type = '';

                // Try multiple property name variations with extensive debugging
                const yearCandidates = [vehicle.Year, vehicle.year, vehicle.YEAR, vehicle.yr, vehicle.YR];
                const makeCandidates = [vehicle.Make, vehicle.make, vehicle.MAKE, vehicle.manufacturer, vehicle.Manufacturer];
                const modelCandidates = [vehicle.Model, vehicle.model, vehicle.MODEL];
                const vinCandidates = [vehicle.VIN, vehicle.vin, vehicle.Vin, vehicle.vinNumber];
                const valueCandidates = [vehicle.Value, vehicle.value, vehicle.VALUE, vehicle.vehicleValue];
                const typeCandidates = [vehicle.Type, vehicle.type, vehicle.TYPE, vehicle.vehicleType];

                // Extract values, prioritizing non-empty strings
                year = yearCandidates.find(v => v && String(v).trim() && String(v) !== 'undefined') || '';
                make = makeCandidates.find(v => v && String(v).trim() && String(v) !== 'undefined') || '';
                model = modelCandidates.find(v => v && String(v).trim() && String(v) !== 'undefined') || '';
                vin = vinCandidates.find(v => v && String(v).trim() && String(v) !== 'undefined') || '';
                value = valueCandidates.find(v => v && String(v).trim() && String(v) !== 'undefined') || '';
                type = typeCandidates.find(v => v && String(v).trim() && String(v) !== 'undefined') || 'Vehicle';

                // Convert to strings and trim
                year = year ? String(year).trim() : '';
                make = make ? String(make).trim() : '';
                model = model ? String(model).trim() : '';
                vin = vin ? String(vin).trim() : '';
                value = value ? String(value).trim() : '';
                type = type ? String(type).trim() : 'Vehicle';

                console.log(`🔍 FIXED: Final extracted values: Year="${year}", Make="${make}", Model="${model}", VIN="${vin}", Type="${type}"`);

                // Build vehicle description with careful validation
                const vehicleParts = [];
                if (year && year !== '' && year !== 'undefined' && year !== 'null') vehicleParts.push(year);
                if (make && make !== '' && make !== 'undefined' && make !== 'null') vehicleParts.push(make);
                if (model && model !== '' && model !== 'undefined' && model !== 'null') vehicleParts.push(model);

                console.log(`🔍 FIXED: Vehicle parts array:`, vehicleParts);

                if (vehicleParts.length > 0) {
                    const vehicleDesc = vehicleParts.join(' ');
                    description += `- ${vehicleDesc}`;
                    console.log(`✅ FIXED: Vehicle description built: "- ${vehicleDesc}"`);
                } else {
                    description += '- Vehicle';
                    console.log(`⚠️ FIXED: No vehicle parts found, using fallback: "- Vehicle"`);
                }

                // Add VIN if available
                if (vin && vin !== '' && vin !== 'undefined' && vin !== 'null') {
                    description += ` - VIN: ${vin}`;
                    console.log(`✅ FIXED: Added VIN: ${vin}`);
                }

                // Add value if available
                if (value && value !== '' && value !== 'undefined' && value !== 'null') {
                    const numValue = parseFloat(value);
                    if (numValue && numValue > 0) {
                        description += ` - Value: $${numValue.toLocaleString()}`;
                    } else {
                        description += ` - Value: ${value}`;
                    }
                    console.log(`✅ FIXED: Added value: ${value}`);
                }

                // Determine vehicle vs trailer type
                const typeStr = type.toLowerCase();
                if (typeStr.includes('trailer') || typeStr.includes('semi') || typeStr.includes('dolly')) {
                    description += ' - TRAILER';
                    console.log(`🚛 FIXED: Identified as TRAILER`);
                } else {
                    description += ' - VEHICLE';
                    console.log(`🚗 FIXED: Identified as VEHICLE`);
                }

                description += '\n';
                console.log(`✅ FIXED: Complete vehicle line: "${description.split('\n').slice(-2)[0]}"`);
            });

            // Add DOT/MC numbers if available
            const dotNumber = policyData.dotNumber || policyData.overview?.['DOT Number'] || '';
            const mcNumber = policyData.mcNumber || policyData.overview?.['MC Number'] || '';

            if (dotNumber || mcNumber) {
                description += '\n';
                if (dotNumber) description += `DOT# ${dotNumber} `;
                if (mcNumber) description += `MC# ${mcNumber}`;
                console.log(`✅ FIXED: Added DOT/MC numbers: DOT# ${dotNumber} MC# ${mcNumber}`);
            }
        } else {
            description += 'commercial auto operations.';
            console.log(`⚠️ FIXED: No vehicles found, using fallback description`);
        }
    } else {
        description += 'general liability operations.';
        console.log(`⚠️ FIXED: Not commercial auto, using general liability description`);
    }

    const finalDescription = description.trim();
    console.log('📝 FIXED: Final enhanced description:', finalDescription);
    console.log('🎯 EXPECTED: Should show "- 1998 PETERBILT 379 - VIN: 45052 - VEHICLE" instead of "- - VEHICLE"');

    return finalDescription;
};

// Also override form field creation to ensure our fix is applied
if (window.createFormFields) {
    const originalCreateFormFields = window.createFormFields;
    window.createFormFields = function(policyData) {
        console.log('🔧 FIXED: Creating form fields with enhanced description generation');

        const result = originalCreateFormFields.call(this, policyData);

        // Force update description field with our enhanced fix
        setTimeout(() => {
            const descField = document.getElementById('field_description');
            if (descField) {
                const enhancedDescription = window.generateOperationDescription(policyData);
                descField.value = enhancedDescription;
                console.log('✅ FIXED: Description field force-updated with enhanced fix:', enhancedDescription);
            }
        }, 100);

        return result;
    };
}

// Success notification
const notification = document.createElement('div');
notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-left: 4px solid #45a049;
`;
notification.innerHTML = '✅ Enhanced COI Vehicle Fix Applied!<br><small>Vehicle descriptions will now show actual details</small>';
document.body.appendChild(notification);

setTimeout(() => {
    if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
    }
}, 6000);

console.log('✅ Enhanced COI Vehicle Description Fix Applied Successfully!');
console.log('🎯 Expected result: "- 1998 PETERBILT 379 - VIN: 45052 - VEHICLE"');
console.log('🚫 Previous result: "- - VEHICLE"');
console.log('📋 Now generate a COI to test the fix!');