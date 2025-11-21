// WORKING SAVE BUTTON - Carefully designed to actually work
(function() {
    'use strict';

    console.log('=== WORKING SAVE BUTTON LOADING ===');

    // Global variable to track current lead
    window.currentLeadId = null;

    // Function to add save button to lead profile
    function addSaveButton() {
        // Don't add multiple buttons
        if (document.getElementById('working-save-btn')) {
            return;
        }

        console.log('Adding save button to lead profile...');

        // Find the lead profile modal
        const modal = document.querySelector('.lead-profile-modal, .modal-content');
        if (!modal) {
            console.log('No modal found yet');
            return;
        }

        // Create a container for the save button at the TOP of the modal
        const saveContainer = document.createElement('div');
        saveContainer.style.cssText = `
            position: sticky;
            top: 0;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-bottom: 2px solid #2563eb;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        `;

        // Create the save button
        const saveBtn = document.createElement('button');
        saveBtn.id = 'working-save-btn';
        saveBtn.innerHTML = '💾 SAVE LEAD PROFILE';
        saveBtn.style.cssText = `
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
        `;

        saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveCurrentLeadState();
        };

        saveContainer.appendChild(saveBtn);

        // Insert at the beginning of the modal
        const firstChild = modal.firstChild;
        if (firstChild) {
            modal.insertBefore(saveContainer, firstChild);
        } else {
            modal.appendChild(saveContainer);
        }

        console.log('Save button added successfully');
    }

    // Function to collect ALL current field values
    function collectAllFieldValues() {
        const data = {};

        console.log('Collecting all field values...');

        // Get ALL inputs, textareas, and selects
        document.querySelectorAll('input, textarea, select').forEach(element => {
            // Skip buttons
            if (element.type === 'button' || element.type === 'submit') {
                return;
            }

            const value = element.type === 'checkbox' ? element.checked : element.value;

            // Skip empty values unless it's intentionally cleared
            if (value === '' && element.type !== 'text' && element.type !== 'textarea') {
                return;
            }

            // Try to get field name from onchange attribute FIRST
            const onchange = element.getAttribute('onchange') || '';
            if (onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([^'"]+)['"]/);
                if (match) {
                    const fieldName = match[1];
                    data[fieldName] = value;
                    console.log(`Found field from onchange: ${fieldName} = ${value}`);
                    return;
                }
            }

            // Try to identify field by analyzing all attributes and context
            const id = (element.id || '').toLowerCase();
            const name = (element.name || '').toLowerCase();
            const placeholder = (element.placeholder || '').toLowerCase();
            const className = (element.className || '').toLowerCase();

            // Look for label
            let label = '';
            const labelElement = element.closest('label') ||
                                document.querySelector(`label[for="${element.id}"]`) ||
                                element.parentElement?.querySelector('label');
            if (labelElement) {
                label = labelElement.textContent.toLowerCase();
            }

            // Combine all text hints
            const allHints = `${id} ${name} ${placeholder} ${className} ${label}`;

            // Map to database fields based on any hint
            if (allHints.includes('company') && !allHints.includes('insurance')) {
                data.company_name = value;
                console.log(`Mapped to company_name: ${value}`);
            }
            else if (allHints.includes('contact') && !allHints.includes('date')) {
                data.contact_name = value;
                console.log(`Mapped to contact_name: ${value}`);
            }
            else if (allHints.includes('phone')) {
                data.phone = value;
                console.log(`Mapped to phone: ${value}`);
            }
            else if (allHints.includes('email')) {
                data.email = value;
                console.log(`Mapped to email: ${value}`);
            }
            else if (allHints.includes('note') || allHints.includes('transcript')) {
                data.notes = value;
                console.log(`Mapped to notes: ${value}`);
            }
            else if (allHints.includes('dot') && !allHints.includes('mc')) {
                data.dot_number = value;
                console.log(`Mapped to dot_number: ${value}`);
            }
            else if (allHints.includes('mc')) {
                data.mc_number = value;
                console.log(`Mapped to mc_number: ${value}`);
            }
            else if (allHints.includes('address') && !allHints.includes('email')) {
                data.address = value;
                console.log(`Mapped to address: ${value}`);
            }
            else if (allHints.includes('city')) {
                data.city = value;
                console.log(`Mapped to city: ${value}`);
            }
            else if (allHints.includes('state')) {
                data.state = value;
                console.log(`Mapped to state: ${value}`);
            }
            else if (allHints.includes('zip')) {
                data.zip_code = value;
                console.log(`Mapped to zip_code: ${value}`);
            }
            else if (allHints.includes('year')) {
                data.years_in_business = value;
                console.log(`Mapped to years_in_business: ${value}`);
            }
            else if (allHints.includes('fleet')) {
                data.fleet_size = value;
                console.log(`Mapped to fleet_size: ${value}`);
            }
            else if (allHints.includes('radius')) {
                data.radius_of_operation = value;
                console.log(`Mapped to radius_of_operation: ${value}`);
            }
            else if (allHints.includes('commodity')) {
                data.commodity_hauled = value;
                console.log(`Mapped to commodity_hauled: ${value}`);
            }
            else if (allHints.includes('premium')) {
                data.premium = value;
                console.log(`Mapped to premium: ${value}`);
            }
        });

        return data;
    }

    // Function to save current state
    async function saveCurrentLeadState() {
        console.log('=== SAVING CURRENT LEAD STATE ===');

        // Get lead ID
        let leadId = window.currentLeadId;

        // Try to find lead ID if not set
        if (!leadId) {
            const input = document.querySelector('[onchange*="updateLeadField"]');
            if (input) {
                const match = input.getAttribute('onchange').match(/updateLeadField\(['"]?(\w+)['"]?/);
                if (match) {
                    leadId = match[1];
                }
            }
        }

        if (!leadId) {
            // Last resort - prompt user
            leadId = prompt('Enter Lead ID:', '88571');
        }

        if (!leadId) {
            alert('Cannot determine lead ID');
            return;
        }

        console.log('Lead ID:', leadId);
        window.currentLeadId = leadId;

        // Collect all field values
        const data = collectAllFieldValues();

        console.log('Collected data:', data);

        if (Object.keys(data).length === 0) {
            alert('No data found to save. Please make sure fields are filled.');
            return;
        }

        // Update button to show saving
        const btn = document.getElementById('working-save-btn');
        if (btn) {
            btn.innerHTML = '⏳ SAVING...';
            btn.disabled = true;
            btn.style.background = '#fbbf24';
        }

        try {
            // Determine API URL
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            console.log(`Saving to: ${apiUrl}/api/leads/${leadId}`);

            // Save to database
            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('API Response:', result);

            if (response.ok) {
                // Update localStorage to match
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

                if (leadIndex !== -1) {
                    // Update the lead in localStorage
                    Object.assign(leads[leadIndex], data);

                    // Also update common field mappings
                    leads[leadIndex].name = data.company_name || leads[leadIndex].name;
                    leads[leadIndex].contact = data.contact_name || leads[leadIndex].contact;
                    leads[leadIndex].dotNumber = data.dot_number || leads[leadIndex].dotNumber;
                    leads[leadIndex].mcNumber = data.mc_number || leads[leadIndex].mcNumber;

                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    localStorage.setItem('leads', JSON.stringify(leads));

                    console.log('LocalStorage updated');
                }

                if (btn) {
                    btn.innerHTML = '✅ SAVED SUCCESSFULLY!';
                    btn.style.background = '#10b981';
                }

                // Show notification
                if (window.showNotification) {
                    showNotification('Lead saved successfully!', 'success');
                } else {
                    console.log('Save successful!');
                }

                // Reset button after 3 seconds
                setTimeout(() => {
                    if (btn) {
                        btn.innerHTML = '💾 SAVE LEAD PROFILE';
                        btn.style.background = '#2563eb';
                        btn.disabled = false;
                    }
                }, 3000);

            } else {
                throw new Error(result.error || result.message || 'Save failed');
            }

        } catch (error) {
            console.error('Save error:', error);

            if (btn) {
                btn.innerHTML = '❌ SAVE FAILED';
                btn.style.background = '#ef4444';
                btn.disabled = false;
            }

            alert(`Save failed: ${error.message}`);
        }
    }

    // Override viewLead and showLeadProfile to track lead ID
    const originalViewLead = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('viewLead called with:', leadId);
        window.currentLeadId = leadId;

        if (originalViewLead) {
            originalViewLead.call(this, leadId);
        }

        // Add save button after a delay
        setTimeout(addSaveButton, 500);
        setTimeout(addSaveButton, 1000);
    };

    const originalShowLeadProfile = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        console.log('showLeadProfile called with:', leadId);
        window.currentLeadId = leadId;

        if (originalShowLeadProfile) {
            originalShowLeadProfile.call(this, leadId);
        }

        // Add save button after a delay
        setTimeout(addSaveButton, 500);
        setTimeout(addSaveButton, 1000);
    };

    // Override updateLeadField to just track the lead ID
    window.updateLeadField = function(leadId, field, value) {
        console.log(`Field update: ${field} = ${value} for lead ${leadId}`);
        window.currentLeadId = leadId;
        // Don't do anything else - no auto-save
    };

    // Watch for modal opening
    const observer = new MutationObserver(() => {
        const modal = document.querySelector('.lead-profile-modal, .modal-content');
        if (modal && !document.getElementById('working-save-btn')) {
            console.log('Modal detected, adding save button...');
            addSaveButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Make save function global for testing
    window.saveCurrentLeadState = saveCurrentLeadState;
    window.addSaveButton = addSaveButton;

    console.log('=== WORKING SAVE BUTTON LOADED ===');
    console.log('Save button will appear at the top of lead profiles');
})();