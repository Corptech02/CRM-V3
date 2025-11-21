// Simple Save Lead - Always saves all visible fields
(function() {
    'use strict';

    console.log('Simple Save Lead system loading...');

    // Global function to save lead directly
    window.simpleSaveLead = async function() {
        console.log('Simple save triggered');

        // Get the lead ID
        let leadId = window.currentLeadId;

        // If no stored lead ID, try to find it
        if (!leadId) {
            const inputs = document.querySelectorAll('input[onchange*="updateLeadField"]');
            if (inputs.length > 0) {
                const onchange = inputs[0].getAttribute('onchange');
                const match = onchange.match(/updateLeadField\(([^,]+),/);
                if (match) {
                    leadId = match[1].replace(/['"]/g, '');
                }
            }
        }

        if (!leadId) {
            alert('Cannot determine lead ID. Please close and reopen the lead profile.');
            return;
        }

        console.log('Saving lead:', leadId);

        // Collect ALL visible fields
        const allData = {};

        // Get all inputs, selects, and textareas
        const fields = document.querySelectorAll('.lead-profile-content input, .lead-profile-content select, .lead-profile-content textarea, .modal-content input, .modal-content select, .modal-content textarea');

        fields.forEach(field => {
            // Skip buttons and hidden fields
            if (field.type === 'button' || field.type === 'submit' || field.type === 'hidden') {
                return;
            }

            // Get field name from onchange attribute
            let fieldName = null;
            const onchange = field.getAttribute('onchange');
            if (onchange && onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([^'"]+)['"]/);
                if (match) {
                    fieldName = match[1];
                }
            }

            // If no field name from onchange, use ID
            if (!fieldName) {
                fieldName = field.id || field.name;
                if (fieldName) {
                    // Clean up field name
                    fieldName = fieldName.replace(/^lead[-_]/, '').replace(/-/g, '_');
                }
            }

            // Get the value
            let value = '';
            if (field.type === 'checkbox') {
                value = field.checked ? 'true' : 'false';
            } else if (field.type === 'radio') {
                if (field.checked) {
                    value = field.value;
                } else {
                    return; // Skip unchecked radio buttons
                }
            } else {
                value = field.value || '';
            }

            // Store the value
            if (fieldName) {
                allData[fieldName] = value;
                console.log(`Collected: ${fieldName} = ${value}`);
            }
        });

        console.log('Total fields collected:', Object.keys(allData).length);

        // Show saving state
        const saveBtn = document.getElementById('lead-save-btn-forced') || document.getElementById('save-lead-profile-btn');
        const originalText = saveBtn ? saveBtn.innerHTML : '';

        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;
            saveBtn.style.background = '#fbbf24';
        }

        try {
            // Save to localStorage first
            const leads = JSON.parse(localStorage.getItem('leads') || localStorage.getItem('insurance_leads') || '[]');
            const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

            if (leadIndex !== -1) {
                // Update existing lead
                Object.assign(leads[leadIndex], allData);
                localStorage.setItem('leads', JSON.stringify(leads));
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log('Updated in localStorage');
            }

            // Save to server - use current domain or server IP
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(allData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Server response:', result);

                // Show success
                if (saveBtn) {
                    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                    saveBtn.style.background = '#10b981';

                    // Reset after 2 seconds
                    setTimeout(() => {
                        saveBtn.innerHTML = originalText || '<i class="fas fa-save"></i> SAVE LEAD';
                        saveBtn.style.background = '#2563eb';
                        saveBtn.disabled = false;
                    }, 2000);
                }

                // Show notification
                if (window.showNotification) {
                    showNotification('Lead saved successfully!', 'success');
                } else {
                    console.log('Lead saved successfully!');
                }

                // Clear change tracking
                if (window.leadProfileChanges) {
                    window.leadProfileChanges[leadId] = {};
                }

            } else {
                throw new Error(`Server error: ${response.status}`);
            }

        } catch (error) {
            console.error('Save error:', error);

            // Reset button
            if (saveBtn) {
                saveBtn.innerHTML = originalText || '<i class="fas fa-save"></i> SAVE LEAD';
                saveBtn.style.background = '#ef4444';
                saveBtn.disabled = false;
            }

            // Still saved locally
            if (window.showNotification) {
                showNotification('Saved locally (server issue)', 'warning');
            } else {
                alert('Lead saved locally. Server connection issue.');
            }
        }
    };

    // Override the save button click handler
    window.saveLeadData = window.simpleSaveLead;

    // Also make sure saveLeadProfile uses our method
    const originalSaveLeadProfile = window.saveLeadProfile;
    window.saveLeadProfile = function(leadId) {
        window.currentLeadId = leadId;
        window.simpleSaveLead();
    };

    console.log('Simple Save Lead system ready');
})();