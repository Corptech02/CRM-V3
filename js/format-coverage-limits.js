// Format Coverage Limits with Commas
console.log('Loading coverage limit formatting utility...');

// Utility function to format numbers with commas
window.formatCoverageLimit = function(value) {
    if (!value && value !== 0) return '';

    // Convert to string and remove existing commas, dollar signs, spaces
    let cleanValue = String(value).replace(/[$,\s]/g, '');

    // Check if it's a valid number
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return value; // Return original if not a number

    // Format with commas
    return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

// Format currency value with dollar sign and commas
window.formatCurrencyValue = function(value) {
    if (!value && value !== 0) return '';

    // Convert to string and remove existing commas, dollar signs, spaces
    let cleanValue = String(value).replace(/[$,\s]/g, '');

    // Check if it's a valid number
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return value; // Return original if not a number

    // Format with dollar sign and commas
    return '$' + numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

// Parse limit value to number (removes commas, dollar signs, etc.)
window.parseLimitValue = function(value) {
    if (!value) return 0;

    // Convert to string and remove commas, dollar signs, spaces
    let cleanValue = String(value).replace(/[$,\s]/g, '');

    // Parse to number
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
};

// Format all coverage fields in a policy object
window.formatPolicyCoverages = function(policy) {
    if (!policy) return policy;

    // List of fields that should be formatted as currency
    const coverageFields = [
        'coverageLimit',
        'occurrenceLimit',
        'aggregateLimit',
        'cargoLimit',
        'autoLimit',
        'liabilityLimit',
        'propertyDamageLimit',
        'bodilyInjuryLimit',
        'combinedSingleLimit',
        'perAccidentLimit',
        'perPersonLimit',
        'medicalPaymentsLimit',
        'uninsuredMotoristLimit',
        'underinsuredMotoristLimit',
        'comprehensiveLimit',
        'collisionLimit',
        'deductible',
        'premium',
        'annualPremium',
        'monthlyPremium',
        'downPayment'
    ];

    // Format top-level fields
    coverageFields.forEach(field => {
        if (policy[field]) {
            policy[field] = formatCoverageLimit(policy[field]);
        }
    });

    // Format coverage object fields
    if (policy.coverage && typeof policy.coverage === 'object') {
        Object.keys(policy.coverage).forEach(key => {
            // Check if the key contains words indicating it's a limit/amount
            if (key.toLowerCase().includes('limit') ||
                key.toLowerCase().includes('coverage') ||
                key.toLowerCase().includes('deductible') ||
                key.toLowerCase().includes('premium') ||
                key.toLowerCase().includes('amount')) {
                policy.coverage[key] = formatCoverageLimit(policy.coverage[key]);
            }
        });
    }

    // Format financial object fields
    if (policy.financial && typeof policy.financial === 'object') {
        Object.keys(policy.financial).forEach(key => {
            // Check if the key contains words indicating it's a monetary value
            if (key.toLowerCase().includes('premium') ||
                key.toLowerCase().includes('deductible') ||
                key.toLowerCase().includes('payment') ||
                key.toLowerCase().includes('amount')) {
                policy.financial[key] = formatCoverageLimit(policy.financial[key]);
            }
        });
    }

    return policy;
};

// Auto-format input fields as user types
window.setupCoverageFormatting = function() {
    // Find all input fields that should have formatting
    const selectors = [
        'input[name*="limit"]',
        'input[name*="Limit"]',
        'input[name*="coverage"]',
        'input[name*="Coverage"]',
        'input[name*="premium"]',
        'input[name*="Premium"]',
        'input[name*="deductible"]',
        'input[name*="Deductible"]',
        'input[id*="limit"]',
        'input[id*="Limit"]',
        'input[id*="coverage"]',
        'input[id*="Coverage"]',
        'input[placeholder*="limit"]',
        'input[placeholder*="coverage"]',
        'input[placeholder*="$"]'
    ].join(', ');

    document.querySelectorAll(selectors).forEach(input => {
        // Skip if already set up
        if (input.hasAttribute('data-formatted')) return;

        input.setAttribute('data-formatted', 'true');

        // Format on blur (when user leaves the field)
        input.addEventListener('blur', function() {
            const value = this.value;
            const formatted = formatCoverageLimit(value);
            if (formatted && formatted !== value) {
                this.value = formatted;
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                this.dispatchEvent(event);
            }
        });

        // Allow only numbers, commas, and dollar signs while typing
        input.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            if (!/[\d,$]/.test(char) && e.which !== 8 && e.which !== 46) {
                e.preventDefault();
            }
        });
    });
};

// Override localStorage setItem to format policies before saving
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    if (key === 'insurance_policies') {
        try {
            const policies = JSON.parse(value);
            if (Array.isArray(policies)) {
                // Format all policies before saving
                const formattedPolicies = policies.map(policy => formatPolicyCoverages(policy));
                value = JSON.stringify(formattedPolicies);
            }
        } catch (e) {
            // If parsing fails, just save as-is
        }
    }
    return originalSetItem.call(this, key, value);
};

// Set up formatting on page load and after dynamic content loads
document.addEventListener('DOMContentLoaded', setupCoverageFormatting);

// Monitor for dynamically added content
const observer = new MutationObserver(function(mutations) {
    // Debounce to avoid too many calls
    clearTimeout(window.formatDebounce);
    window.formatDebounce = setTimeout(setupCoverageFormatting, 100);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Format existing policies on load
setTimeout(() => {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    if (policies.length > 0) {
        const formattedPolicies = policies.map(policy => formatPolicyCoverages(policy));
        localStorage.setItem('insurance_policies', JSON.stringify(formattedPolicies));
        console.log('Formatted existing policies with comma separators');
    }
}, 1000);

console.log('✓ Coverage limit formatting utility loaded');