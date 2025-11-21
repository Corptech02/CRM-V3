// Debug script to help identify lead submission issues
// Add this to browser console to debug the New Lead form

console.log('🔧 Lead Submission Debug Script Loaded');

// Override the saveNewLead function to add more debugging
window.originalSaveNewLead = window.saveNewLead;

window.saveNewLead = function(event) {
    console.log('🚀 DEBUG: saveNewLead called');
    console.log('🚀 DEBUG: Event object:', event);

    try {
        event.preventDefault();
        console.log('🚀 DEBUG: preventDefault called successfully');

        // Check if modal exists
        const modal = document.getElementById('newLeadModal');
        console.log('🚀 DEBUG: Modal found:', modal ? 'YES' : 'NO');

        // Check if form exists
        const form = document.getElementById('newLeadForm');
        console.log('🚀 DEBUG: Form found:', form ? 'YES' : 'NO');

        // Check all form elements
        const formElements = {
            leadCompanyName: document.getElementById('leadCompanyName'),
            leadContact: document.getElementById('leadContact'),
            leadPhone: document.getElementById('leadPhone'),
            leadEmail: document.getElementById('leadEmail'),
            leadStage: document.getElementById('leadStage'),
            leadStatus: document.getElementById('leadStatus'),
            leadPremium: document.getElementById('leadPremium')
        };

        console.log('🚀 DEBUG: Form elements check:');
        Object.entries(formElements).forEach(([key, element]) => {
            console.log(`  - ${key}: ${element ? 'FOUND' : 'MISSING'}${element ? ` (value: "${element.value}")` : ''}`);
        });

        // If all elements found, call original function
        if (formElements.leadCompanyName && formElements.leadContact && formElements.leadPhone) {
            console.log('🚀 DEBUG: All required elements found, calling original function');
            return window.originalSaveNewLead(event);
        } else {
            console.error('🚀 DEBUG: Missing required form elements!');
            alert('DEBUG: Missing form elements - check console for details');
        }

    } catch (error) {
        console.error('🚀 DEBUG: Error in saveNewLead:', error);
        alert('DEBUG: Error in saveNewLead - check console for details');
    }
};

// Function to manually test form submission
window.debugTestLeadSave = function() {
    console.log('🧪 DEBUG: Manual test started');

    // Create test data
    const testData = {
        company: 'Test Company ' + Date.now(),
        contact: 'Test Contact',
        phone: '555-TEST',
        email: 'test@example.com'
    };

    console.log('🧪 DEBUG: Filling form with test data:', testData);

    // Fill form if it exists
    const elements = {
        leadCompanyName: document.getElementById('leadCompanyName'),
        leadContact: document.getElementById('leadContact'),
        leadPhone: document.getElementById('leadPhone'),
        leadEmail: document.getElementById('leadEmail')
    };

    if (elements.leadCompanyName) {
        elements.leadCompanyName.value = testData.company;
        elements.leadContact.value = testData.contact;
        elements.leadPhone.value = testData.phone;
        elements.leadEmail.value = testData.email;

        console.log('🧪 DEBUG: Form filled, attempting submission');

        // Create fake event
        const fakeEvent = {
            preventDefault: () => console.log('🧪 DEBUG: preventDefault called'),
            target: document.getElementById('newLeadForm')
        };

        // Call save function
        window.saveNewLead(fakeEvent);
    } else {
        console.error('🧪 DEBUG: Form not found - is the New Lead modal open?');
        alert('Please open the New Lead modal first, then run debugTestLeadSave() again');
    }
};

// Function to check if API is accessible
window.debugTestAPI = async function() {
    console.log('🔌 DEBUG: Testing API connectivity');

    try {
        const API_URL = window.VANGUARD_API_URL || 'http://162.220.14.239:3001';
        const response = await fetch(`${API_URL}/api/health`);

        if (response.ok) {
            const data = await response.json();
            console.log('🔌 DEBUG: API health check successful:', data);
            return true;
        } else {
            console.error('🔌 DEBUG: API health check failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('🔌 DEBUG: API connection error:', error);
        return false;
    }
};

console.log('🔧 Debug functions available:');
console.log('  - debugTestLeadSave(): Fill form and test submission');
console.log('  - debugTestAPI(): Test API connectivity');
console.log('  - saveNewLead is now wrapped with debug logging');