// Debug Policy Modal - Find which modal is actually being used
console.log('🔍 Debug Policy Modal loaded');

// Override and trace all policy-related functions
const originalEditPolicy = window.editPolicy;
window.editPolicy = function(policyId) {
    console.log('🎯 editPolicy called with:', policyId);
    console.trace('editPolicy call stack');

    if (originalEditPolicy) {
        return originalEditPolicy(policyId);
    }
};

const originalShowPolicyModal = window.showPolicyModal;
window.showPolicyModal = function(existingPolicy) {
    console.log('🎯 showPolicyModal called with:', existingPolicy);
    console.trace('showPolicyModal call stack');

    if (originalShowPolicyModal) {
        return originalShowPolicyModal(existingPolicy);
    }
};

// Also trace any modal creation
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);

    if (tagName.toLowerCase() === 'div') {
        // Monitor for modal creation
        const originalSetClassName = element.setAttribute;
        element.setAttribute = function(name, value) {
            if (name === 'class' && (value.includes('modal') || value.includes('Modal'))) {
                console.log('🎯 Modal div created with class:', value);
                console.trace('Modal creation stack');
            }
            return originalSetClassName.call(this, name, value);
        };
    }

    return element;
};

// Monitor for innerHTML changes that might contain policy forms
const originalSetInnerHTML = Element.prototype.innerHTML;
Object.defineProperty(Element.prototype, 'innerHTML', {
    set: function(value) {
        if (typeof value === 'string' && value.includes('Client Name')) {
            console.log('🎯 Policy form detected in innerHTML:', value.substring(0, 200));
            console.trace('Policy form creation stack');
        }
        originalSetInnerHTML.call(this, value);
    },
    get: function() {
        return originalSetInnerHTML.call(this);
    }
});

console.log('🔍 Debug Policy Modal ready - will trace policy modal calls');