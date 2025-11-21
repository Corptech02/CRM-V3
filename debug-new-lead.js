// Debug New Lead Creation - Comprehensive Debugging
console.log('🔧 Debug New Lead Script Loading...');

// Override the saveNewLead function with extensive debugging
window.originalSaveNewLead = window.saveNewLead;

window.saveNewLead = function(event) {
    console.log('🚀 DEBUG: saveNewLead called!');
    console.log('🚀 DEBUG: Event:', event);
    console.log('🚀 DEBUG: Event type:', event ? event.type : 'No event');

    try {
        if (event) {
            event.preventDefault();
            console.log('🚀 DEBUG: preventDefault called');
        }

        // Check if modal exists
        const modal = document.getElementById('newLeadModal');
        console.log('🚀 DEBUG: Modal found:', modal ? 'YES' : 'NO');

        // Check if form exists
        const form = document.getElementById('newLeadForm');
        console.log('🚀 DEBUG: Form found:', form ? 'YES' : 'NO');

        // Check all form fields
        const fields = {
            leadCompanyName: document.getElementById('leadCompanyName'),
            leadContact: document.getElementById('leadContact'),
            leadPhone: document.getElementById('leadPhone'),
            leadEmail: document.getElementById('leadEmail'),
            leadStage: document.getElementById('leadStage'),
            leadStatus: document.getElementById('leadStatus')
        };

        console.log('🚀 DEBUG: Field check:');
        Object.entries(fields).forEach(([name, element]) => {
            if (element) {
                console.log(`  ✅ ${name}: "${element.value}"`);
            } else {
                console.log(`  ❌ ${name}: ELEMENT NOT FOUND`);
            }
        });

        // Check if we have required data
        const hasName = fields.leadCompanyName && fields.leadCompanyName.value.trim();
        const hasContact = fields.leadContact && fields.leadContact.value.trim();
        const hasPhone = fields.leadPhone && fields.leadPhone.value.trim();

        console.log('🚀 DEBUG: Required fields:');
        console.log(`  Company Name: ${hasName ? 'OK' : 'MISSING'}`);
        console.log(`  Contact: ${hasContact ? 'OK' : 'MISSING'}`);
        console.log(`  Phone: ${hasPhone ? 'OK' : 'MISSING'}`);

        if (!hasName || !hasContact || !hasPhone) {
            console.error('🚀 DEBUG: VALIDATION FAILED - Missing required fields');
            alert('DEBUG: Please fill in Company Name, Contact, and Phone');
            return;
        }

        // Create lead object
        const leadData = {
            id: Date.now().toString(),
            name: fields.leadCompanyName.value.trim(),
            contact: fields.leadContact.value.trim(),
            phone: fields.leadPhone.value.trim(),
            email: fields.leadEmail ? fields.leadEmail.value.trim() : '',
            stage: fields.leadStage ? fields.leadStage.value : 'new',
            status: fields.leadStatus ? fields.leadStatus.value : 'Active',
            product: 'Commercial Auto',
            created: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            source: 'Manual Entry'
        };

        console.log('🚀 DEBUG: Lead data created:', leadData);

        // Try to save to localStorage immediately
        try {
            let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            leads.unshift(leadData);
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            console.log('🚀 DEBUG: Saved to localStorage, total leads:', leads.length);
        } catch (e) {
            console.error('🚀 DEBUG: LocalStorage save failed:', e);
        }

        // Try to save to API
        fetch('http://162.220.14.239:3001/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
        })
        .then(response => {
            console.log('🚀 DEBUG: API response status:', response.status);
            return response.json();
        })
        .then(result => {
            console.log('🚀 DEBUG: API save result:', result);
        })
        .catch(error => {
            console.log('🚀 DEBUG: API save failed (but localStorage worked):', error);
        });

        // Close modal
        if (modal) {
            modal.remove();
            console.log('🚀 DEBUG: Modal closed');
        }

        // Show notification
        if (window.showNotification) {
            window.showNotification('DEBUG: Lead created successfully!', 'success');
        } else {
            alert('DEBUG: Lead created successfully!');
        }

        // Refresh view
        console.log('🚀 DEBUG: Attempting to refresh leads view...');
        if (window.loadLeadsView) {
            setTimeout(() => {
                console.log('🚀 DEBUG: Calling loadLeadsView');
                window.loadLeadsView();
            }, 500);
        } else {
            console.error('🚀 DEBUG: loadLeadsView function not found');
        }

    } catch (error) {
        console.error('🚀 DEBUG: Error in saveNewLead:', error);
        alert('DEBUG ERROR: ' + error.message);
    }
};

// Also override the form submit handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Setting up form submit listener...');

    // Watch for form submissions
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'newLeadForm') {
            console.log('🚀 DEBUG: Form submitted via submit event');
            e.preventDefault();
            window.saveNewLead(e);
        }
    });
});

console.log('✅ Debug New Lead Script Loaded');
console.log('📝 Instructions:');
console.log('1. Open browser console (F12)');
console.log('2. Click "New Lead"');
console.log('3. Fill form and submit');
console.log('4. Watch console for debug messages');