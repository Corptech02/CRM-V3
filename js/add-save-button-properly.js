// ADD SAVE BUTTON PROPERLY - Right next to Quote Application buttons
(function() {
    'use strict';

    console.log('ADD SAVE BUTTON PROPERLY - Starting...');

    let saveButtonAdded = false;
    let currentLeadId = null;

    // Function to add save button next to quote buttons
    function addSaveButton() {
        if (saveButtonAdded) return;

        console.log('Looking for Quote Application buttons...');

        // Find all buttons and look for Quote Application or Add Quote
        const allButtons = document.querySelectorAll('button');
        let quoteButton = null;
        let addQuoteButton = null;

        for (let btn of allButtons) {
            const text = btn.textContent.trim();
            if (text.includes('Quote Application')) {
                quoteButton = btn;
                console.log('Found Quote Application button');
            }
            if (text.includes('Add Quote')) {
                addQuoteButton = btn;
                console.log('Found Add Quote button');
            }
        }

        // If we found either quote button, add save button next to them
        if (quoteButton || addQuoteButton) {
            const targetButton = quoteButton || addQuoteButton;
            const parent = targetButton.parentElement;

            if (!parent) {
                console.log('No parent element found');
                return;
            }

            console.log('Adding save button to parent:', parent);

            // Create save button that matches the style of existing buttons
            const saveButton = document.createElement('button');
            saveButton.id = 'lead-save-button';
            saveButton.innerHTML = '💾 Save Lead Profile';

            // Copy the classes from the existing button
            saveButton.className = targetButton.className;

            // Add custom styling to make it stand out
            saveButton.style.cssText = `
                background: #10b981 !important;
                color: white !important;
                margin-right: 10px !important;
                font-weight: bold !important;
            `;

            // Add click handler
            saveButton.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                saveLead();
            };

            // Insert before the first quote button
            parent.insertBefore(saveButton, targetButton);
            saveButtonAdded = true;
            console.log('Save button added successfully!');
        } else {
            console.log('Quote buttons not found yet');
        }
    }

    // Function to save the lead
    async function saveLead() {
        console.log('SAVE BUTTON CLICKED!');

        // Get lead ID
        let leadId = currentLeadId || window.currentLeadId;

        // Try to find lead ID from any input onchange
        if (!leadId) {
            const inputs = document.querySelectorAll('[onchange*="updateLeadField"]');
            for (let input of inputs) {
                const onchange = input.getAttribute('onchange');
                const match = onchange.match(/updateLeadField\(['"]*(\w+)['"]*,/);
                if (match) {
                    leadId = match[1];
                    break;
                }
            }
        }

        if (!leadId) {
            leadId = prompt('Enter lead ID:', '88571');
        }

        if (!leadId) {
            alert('Cannot find lead ID!');
            return;
        }

        console.log('Saving lead:', leadId);

        // Collect ALL field values from the page
        const data = {};

        // Get all inputs and textareas
        const fields = document.querySelectorAll('input:not([type="button"]):not([type="submit"]), textarea, select');

        fields.forEach(field => {
            const value = field.value;
            if (!value) return;

            // Check if field has onchange with updateLeadField
            const onchange = field.getAttribute('onchange') || '';
            if (onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([\w_]+)['"]/);
                if (match) {
                    const fieldName = match[1];
                    data[fieldName] = value;
                    console.log(`Field ${fieldName} = ${value}`);
                }
            }

            // Also check for specific field patterns in the page
            // Look at the text before the input to identify what it is
            const container = field.closest('div');
            if (container) {
                const text = container.textContent.toLowerCase();

                if (text.includes('company name') && !data.company_name) {
                    data.company_name = value;
                } else if (text.includes('contact:') && !data.contact_name) {
                    data.contact_name = value;
                } else if (text.includes('phone:') && !data.phone) {
                    data.phone = value;
                } else if (text.includes('email:') && !data.email) {
                    data.email = value;
                } else if (text.includes('dot number') && !data.dot_number) {
                    data.dot_number = value;
                } else if (text.includes('mc number') && !data.mc_number) {
                    data.mc_number = value;
                } else if (text.includes('years in business') && !data.years_in_business) {
                    data.years_in_business = value;
                } else if (text.includes('fleet size') && !data.fleet_size) {
                    data.fleet_size = value;
                } else if (text.includes('radius of operation') && !data.radius_of_operation) {
                    data.radius_of_operation = value;
                } else if (text.includes('commodity hauled') && !data.commodity_hauled) {
                    data.commodity_hauled = value;
                } else if (text.includes('notes') && !data.notes) {
                    data.notes = value;
                } else if (text.includes('premium:') && !data.premium) {
                    data.premium = value;
                } else if (text.includes('win/loss') && !data.win_loss) {
                    data.win_loss = value;
                }
            }
        });

        // Also specifically get Premium and Win/Loss fields by ID
        const premiumField = document.querySelector('[id^="lead-premium-"]');
        if (premiumField && premiumField.value) {
            data.premium = premiumField.value;
            console.log('Found premium:', data.premium);
        }

        const winLossField = document.querySelector('[id^="lead-winloss-"]');
        if (winLossField && winLossField.value) {
            data.win_loss = winLossField.value;
            console.log('Found win/loss:', data.win_loss);
        }

        console.log('Data to save:', data);

        if (Object.keys(data).length === 0) {
            alert('No data to save!');
            return;
        }

        // Update button to show saving
        const saveBtn = document.getElementById('lead-save-button');
        const originalText = saveBtn ? saveBtn.innerHTML : '';

        if (saveBtn) {
            saveBtn.innerHTML = '⏳ Saving...';
            saveBtn.disabled = true;
            saveBtn.style.background = '#fbbf24';
        }

        try {
            // Determine API URL
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('Save response:', result);

            if (response.ok) {
                // Update localStorage too
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const lead = leads.find(l => String(l.id) === String(leadId));
                if (lead) {
                    Object.assign(lead, data);
                    // Map database fields to frontend fields
                    lead.name = data.company_name || lead.name;
                    lead.contact = data.contact_name || lead.contact;
                    lead.dotNumber = data.dot_number || lead.dotNumber;
                    lead.mcNumber = data.mc_number || lead.mcNumber;
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    localStorage.setItem('leads', JSON.stringify(leads));
                }

                if (saveBtn) {
                    saveBtn.innerHTML = '✅ Saved!';
                    saveBtn.style.background = '#10b981';
                }

                // Show notification
                if (window.showNotification) {
                    showNotification('Lead saved successfully!', 'success');
                } else {
                    alert('Lead saved successfully!');
                }

                // Reset button after 2 seconds
                setTimeout(() => {
                    if (saveBtn) {
                        saveBtn.innerHTML = originalText;
                        saveBtn.style.background = '#10b981';
                        saveBtn.disabled = false;
                    }
                }, 2000);

            } else {
                throw new Error(result.error || 'Save failed');
            }

        } catch (error) {
            console.error('Save error:', error);
            alert('Save failed: ' + error.message);

            if (saveBtn) {
                saveBtn.innerHTML = '❌ Failed';
                saveBtn.style.background = '#ef4444';
                saveBtn.disabled = false;
            }
        }
    }

    // Check for quote buttons every 500ms
    const checkInterval = setInterval(() => {
        // Look for signs we're in a lead profile
        const hasQuoteButton = Array.from(document.querySelectorAll('button')).some(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (hasQuoteButton && !saveButtonAdded) {
            console.log('Quote buttons detected, adding save button...');
            addSaveButton();
        }

        // Also check if the save button was removed and re-add it
        if (hasQuoteButton && saveButtonAdded && !document.getElementById('lead-save-button')) {
            console.log('Save button was removed, re-adding...');
            saveButtonAdded = false;
            addSaveButton();
        }
    }, 500);

    // Intercept lead profile functions
    const originalViewLead = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('viewLead called with:', leadId);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalViewLead) {
            originalViewLead.apply(this, arguments);
        }

        // Try to add button after a delay
        setTimeout(addSaveButton, 100);
        setTimeout(addSaveButton, 500);
        setTimeout(addSaveButton, 1000);
    };

    const originalShowLeadProfile = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        console.log('showLeadProfile called with:', leadId);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalShowLeadProfile) {
            originalShowLeadProfile.apply(this, arguments);
        }

        // Try to add button after a delay
        setTimeout(addSaveButton, 100);
        setTimeout(addSaveButton, 500);
        setTimeout(addSaveButton, 1000);
    };

    // Track lead ID when fields are updated
    const originalUpdateLeadField = window.updateLeadField;
    window.updateLeadField = function(leadId, field, value) {
        console.log(`Field update: ${field} = ${value} for lead ${leadId}`);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        // Don't call original to prevent auto-save
    };

    // Also watch for DOM changes
    const observer = new MutationObserver(() => {
        const hasQuoteButton = Array.from(document.querySelectorAll('button')).some(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (hasQuoteButton && !saveButtonAdded) {
            addSaveButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('ADD SAVE BUTTON PROPERLY - Script loaded, watching for Quote buttons...');
})();