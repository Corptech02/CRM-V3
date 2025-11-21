// Fix new lead form - remove Lead Source field and fix validation
(function() {
    'use strict';

    console.log('🔧 Fixing new lead form...');

    // Store original showNewLeadModal function
    const originalShowNewLeadModal = window.showNewLeadModal;

    // Override showNewLeadModal to remove Lead Source field
    window.showNewLeadModal = function() {
        console.log('📝 Opening new lead modal (fixed version)...');

        // Call original if it exists
        if (originalShowNewLeadModal) {
            originalShowNewLeadModal();
        }

        // After modal is created, remove Lead Source field
        setTimeout(() => {
            // Find and remove Lead Source field
            const leadSourceField = document.getElementById('leadSource');
            if (leadSourceField) {
                const formGroup = leadSourceField.closest('.form-group');
                if (formGroup) {
                    console.log('🗑️ Removing Lead Source field');
                    formGroup.remove();
                }
            }

            // Also remove any label that says "Lead Source"
            const labels = document.querySelectorAll('label');
            labels.forEach(label => {
                if (label.textContent.includes('Lead Source')) {
                    const parent = label.closest('.form-group');
                    if (parent) {
                        parent.remove();
                    }
                }
            });
        }, 100);
    };

    // Fix the saveNewLead function to not require leadSource
    const originalSaveNewLead = window.saveNewLead;

    window.saveNewLead = function(event) {
        console.log('💾 Saving new lead (fixed version)...');

        if (event) {
            event.preventDefault();
        }

        // Get form values (without leadSource)
        const name = document.getElementById('leadName')?.value?.trim() || '';
        const company = document.getElementById('leadCompany')?.value?.trim() ||
                       document.getElementById('leadCompanyName')?.value?.trim() || '';
        const phone = document.getElementById('leadPhone')?.value?.trim() || '';
        const email = document.getElementById('leadEmail')?.value?.trim() || '';
        const contact = document.getElementById('leadContact')?.value?.trim() || name;
        const insuranceType = document.getElementById('leadInsuranceType')?.value || 'Commercial Auto';
        const assignedTo = document.getElementById('leadAssignedTo')?.value || 'Grant';
        const premium = parseFloat(document.getElementById('leadPremium')?.value) || 0;
        const stage = document.getElementById('leadStage')?.value || 'lead';
        const address = document.getElementById('leadAddress')?.value?.trim() || '';
        const notes = document.getElementById('leadNotes')?.value?.trim() || '';

        // More lenient validation - only require name/company and phone
        if ((!name && !company) || !phone) {
            console.log('⚠️ Validation check:');
            console.log('  Name:', name);
            console.log('  Company:', company);
            console.log('  Phone:', phone);

            showNotification('Please fill in Company/Name and Phone number', 'error');
            return;
        }

        // Create new lead object (without source field)
        const newLead = {
            id: Date.now().toString(),
            name: company || name || 'Unknown Company',
            contact: contact || name || 'Unknown',
            phone: phone,
            email: email || '',
            insuranceType: insuranceType,
            assignedTo: assignedTo,
            premium: premium,
            stage: stage,
            address: address,
            notes: notes,
            status: 'Active',
            created: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Remove source field entirely or set default
            source: 'Manual Entry'
        };

        console.log('✅ Creating lead:', newLead);

        // Save to localStorage
        try {
            let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            leads.unshift(newLead);
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            // Also save to regular leads
            localStorage.setItem('leads', JSON.stringify(leads));

            console.log('✅ Lead saved to localStorage');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }

        // Save to server
        const apiUrl = window.VANGUARD_API_URL ||
                      (window.location.hostname === 'localhost'
                        ? 'http://localhost:3001'
                        : `http://${window.location.hostname}:3001`);

        fetch(`${apiUrl}/api/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newLead)
        })
        .then(response => {
            console.log('Server response:', response.status);
            return response.json();
        })
        .then(result => {
            console.log('Lead saved to server:', result);
        })
        .catch(error => {
            console.log('Server save failed (but localStorage worked):', error);
        });

        // Close modal
        const modal = document.getElementById('newLeadModal');
        if (modal) {
            modal.remove();
        }

        // Show success notification
        showNotification('Lead created successfully!', 'success');

        // Refresh leads view
        setTimeout(() => {
            if (window.loadLeadsView) {
                window.loadLeadsView();
            }
        }, 500);
    };

    // Also fix the debug version if it exists
    if (window.originalSaveNewLead) {
        window.originalSaveNewLead = window.saveNewLead;
    }

    console.log('✅ New lead form fixed - Lead Source removed, validation improved');
})();