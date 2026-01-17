// VIG Agency COI Fix Bookmarklet
// Copy this entire code and paste into browser console on vigagency.com admin dashboard

javascript:(function(){
    console.log('🔧 VIG Agency COI Fix: Loading...');

    if (typeof window.generateOperationDescription === 'function') {
        window.generateOperationDescription = function(policyData) {
            console.log('🚚 FIXED: Enhanced vehicle description generation with data:', policyData);

            if (!policyData) return '';

            const policyType = policyData.policyType || policyData.overview?.['Policy Type'] || '';
            let description = '';

            if (policyType === 'commercial-auto' || policyType === 'Commercial Auto') {
                if (policyData.vehicles && policyData.vehicles.length > 0) {
                    console.log('🔍 FIXED: Processing vehicles...');

                    policyData.vehicles.forEach((vehicle, index) => {
                        console.log(`🚗 Vehicle ${index + 1}:`, vehicle);

                        // Enhanced property extraction
                        let year = '', make = '', model = '', vin = '', value = '', type = 'Vehicle';

                        // Try multiple property variations
                        ['Year', 'year', 'YEAR'].forEach(prop => { if (!year && vehicle[prop]) year = String(vehicle[prop]).trim(); });
                        ['Make', 'make', 'MAKE'].forEach(prop => { if (!make && vehicle[prop]) make = String(vehicle[prop]).trim(); });
                        ['Model', 'model', 'MODEL'].forEach(prop => { if (!model && vehicle[prop]) model = String(vehicle[prop]).trim(); });
                        ['VIN', 'vin', 'Vin'].forEach(prop => { if (!vin && vehicle[prop]) vin = String(vehicle[prop]).trim(); });
                        ['Value', 'value', 'VALUE'].forEach(prop => { if (!value && vehicle[prop]) value = String(vehicle[prop]).trim(); });
                        ['Type', 'type', 'TYPE'].forEach(prop => { if (!type || type === 'Vehicle') && vehicle[prop]) type = String(vehicle[prop]).trim(); });

                        console.log(`🔍 Extracted: ${year} ${make} ${model} VIN:${vin}`);

                        // Build description
                        const parts = [year, make, model].filter(p => p && p !== 'undefined' && p !== 'null');

                        if (parts.length > 0) {
                            description += `- ${parts.join(' ')}`;
                        } else {
                            description += `- Vehicle`;
                        }

                        if (vin && vin !== 'undefined') description += ` - VIN: ${vin}`;
                        if (value && value !== 'undefined') {
                            const num = parseFloat(value);
                            description += ` - Value: $${num ? num.toLocaleString() : value}`;
                        }

                        const typeStr = type.toLowerCase();
                        if (typeStr.includes('trailer') || typeStr.includes('semi')) {
                            description += ` - TRAILER`;
                        } else {
                            description += ` - VEHICLE`;
                        }
                        description += '\n';
                    });

                    const dotNumber = policyData.dotNumber || policyData.overview?.['DOT Number'] || '';
                    const mcNumber = policyData.mcNumber || policyData.overview?.['MC Number'] || '';

                    if (dotNumber || mcNumber) {
                        description += '\n';
                        if (dotNumber) description += `DOT# ${dotNumber} `;
                        if (mcNumber) description += `MC# ${mcNumber}`;
                    }
                } else {
                    description += 'commercial auto operations.';
                }
            } else {
                description += 'general liability operations.';
            }

            console.log('📝 FIXED description:', description.trim());
            return description.trim();
        };

        // Override form field creation
        if (window.createFormFields) {
            const orig = window.createFormFields;
            window.createFormFields = function(policyData) {
                const result = orig.call(this, policyData);
                setTimeout(() => {
                    const field = document.getElementById('field_description');
                    if (field) {
                        field.value = window.generateOperationDescription(policyData);
                        console.log('✅ Description field updated');
                    }
                }, 100);
                return result;
            };
        }

        // Success notification
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px;border-radius:5px;z-index:10000;font-family:Arial;';
        div.innerHTML = '✅ COI Vehicle Fix Applied!';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);

        console.log('✅ VIG Agency COI Fix Applied Successfully!');
    } else {
        console.log('❌ generateOperationDescription not found. Please reload page and try again.');
    }
})();