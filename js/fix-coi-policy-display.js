// Fix COI Policy Display - Ensure all fields are properly mapped
console.log('🔧 COI Policy Display Fix Loading...');

// Override the showPolicyDetailsModal to properly map fields
const originalShowPolicyDetailsModal = window.showPolicyDetailsModal;
window.showPolicyDetailsModal = function(policy) {
    console.log('Original policy data for COI display:', policy);

    // Helper function to get first non-empty value
    const firstNonEmpty = (...values) => {
        for (const val of values) {
            if (val && val !== '') return val;
        }
        return null;
    };

    // Map nested fields to top level for proper display
    const mappedPolicy = {
        ...policy,

        // Map carrier from overview tab if not at root - handle empty strings
        carrier: firstNonEmpty(
            policy.carrier,
            policy.overview?.['Insurance Carrier'],
            policy.overview?.Carrier,
            policy.overview?.carrier
        ) || 'N/A',

        // Map dates from overview tab - handle empty strings
        effectiveDate: firstNonEmpty(
            policy.effectiveDate,
            policy.overview?.['Effective Date'],
            policy.overview?.effectiveDate
        ) || 'N/A',

        expirationDate: firstNonEmpty(
            policy.expirationDate,
            policy.overview?.['Expiration Date'],
            policy.overview?.expirationDate
        ) || 'N/A',

        // Map premium from various locations - handle commas in numbers
        premium: firstNonEmpty(
            policy.premium,
            policy.overview?.Premium,
            policy.overview?.['Annual Premium'],
            policy.financial?.Premium,
            policy.financial?.['Annual Premium'],
            policy.annualPremium
        ) || '0',

        // Map policy status
        policyStatus: policy.policyStatus ||
                     policy.overview?.Status ||
                     policy.overview?.['Policy Status'] ||
                     policy.status ||
                     'Active',

        // Map insured information
        insured: policy.insured || {
            'Primary Named Insured': policy.overview?.['Named Insured'] ||
                                    policy.namedInsured ||
                                    policy.clientName ||
                                    ''
        },

        // Map financial data
        financial: policy.financial || {
            'Annual Premium': policy.premium ||
                            policy.overview?.Premium ||
                            policy.overview?.['Annual Premium'] ||
                            '0',
            'Monthly Payment': policy.monthlyPremium ||
                             policy.financial?.['Monthly Premium'] ||
                             (parseFloat(policy.premium || 0) / 12).toFixed(2)
        },

        // Map coverage data
        coverage: policy.coverage || {
            'Liability Limits': policy.coverage?.['Liability Limits'] || '1000000',
            'General Aggregate': policy.coverage?.['General Aggregate'] || '2000000',
            'Comprehensive Deductible': policy.coverage?.['Comprehensive Deductible'] || '2500',
            'Collision Deductible': policy.coverage?.['Collision Deductible'] || '2500',
            'Cargo Limit': policy.coverage?.['Cargo Limit'] || '250000',
            'Cargo Deductible': policy.coverage?.['Cargo Deductible'] || '2500',
            'Medical Payments': policy.coverage?.['Medical Payments'] || '5000',
            'Uninsured/Underinsured Motorist': policy.coverage?.['Uninsured/Underinsured Motorist'] || '1000000'
        }
    };

    // Fix premium display format - handle commas in numbers
    if (mappedPolicy.premium && mappedPolicy.premium !== '0') {
        // Remove commas and parse as float
        const premiumStr = mappedPolicy.premium.toString().replace(/,/g, '');
        const premiumValue = parseFloat(premiumStr);

        if (!isNaN(premiumValue)) {
            mappedPolicy.premium = premiumValue.toFixed(2);

            // Update financial section
            if (!mappedPolicy.financial) {
                mappedPolicy.financial = {};
            }
            mappedPolicy.financial['Annual Premium'] = premiumValue.toFixed(2);
            mappedPolicy.financial['Monthly Payment'] = (premiumValue / 12).toFixed(2);
        }
    } else if (!mappedPolicy.financial || !mappedPolicy.financial['Annual Premium']) {
        // Ensure financial section exists even with no premium
        mappedPolicy.financial = {
            'Annual Premium': '0.00',
            'Monthly Payment': '0.00'
        };
    }

    console.log('Mapped policy data for COI display:', mappedPolicy);

    // Call original function with mapped data
    if (originalShowPolicyDetailsModal) {
        originalShowPolicyDetailsModal.call(this, mappedPolicy);
    }
};

// Also fix the generateViewContentForTab function for financial display
const originalGenerateViewContentForTab = window.generateViewContentForTab;
if (originalGenerateViewContentForTab) {
    window.generateViewContentForTab = function(tabId, policy) {
        // Helper function to get first non-empty value
        const firstNonEmpty = (...values) => {
            for (const val of values) {
                if (val && val !== '') return val;
            }
            return null;
        };

        // Map policy data before generating content
        const mappedPolicy = {
            ...policy,
            premium: firstNonEmpty(
                policy.premium,
                policy.overview?.Premium,
                policy.financial?.['Annual Premium']
            ) || '0',
            carrier: firstNonEmpty(
                policy.carrier,
                policy.overview?.['Insurance Carrier'],
                policy.overview?.Carrier
            ) || 'N/A',
            effectiveDate: firstNonEmpty(
                policy.effectiveDate,
                policy.overview?.['Effective Date']
            ) || 'N/A',
            expirationDate: firstNonEmpty(
                policy.expirationDate,
                policy.overview?.['Expiration Date']
            ) || 'N/A'
        };

        // Ensure financial data is properly structured - handle commas in premium
        if (!mappedPolicy.financial || Object.keys(mappedPolicy.financial).length === 0) {
            const premiumStr = (mappedPolicy.premium || '0').toString().replace(/,/g, '');
            const premiumValue = parseFloat(premiumStr) || 0;
            mappedPolicy.financial = {
                'Annual Premium': premiumValue.toFixed(2),
                'Monthly Payment': (premiumValue / 12).toFixed(2)
            };
        }

        return originalGenerateViewContentForTab.call(this, tabId, mappedPolicy);
    };
}

console.log('✅ COI Policy Display Fix Applied');