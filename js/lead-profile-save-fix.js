// Lead Profile Save Functionality Fix
// Adds explicit save button and tracks all changes before saving

(function() {
    'use strict';

    console.log('Lead Profile Save Fix loading...');

    // Store unsaved changes
    window.leadProfileChanges = {};
    window.leadProfileOriginal = {};

    // Track field changes without auto-saving
    window.trackLeadFieldChange = function(leadId, field, value) {
        if (!window.leadProfileChanges[leadId]) {
            window.leadProfileChanges[leadId] = {};
        }

        // Track the change
        window.leadProfileChanges[leadId][field] = value;

        // Show unsaved indicator
        const saveButton = document.getElementById('save-lead-profile-btn');
        if (saveButton) {
            saveButton.classList.add('has-changes');
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes*';
            saveButton.style.background = '#ef4444'; // Red color for unsaved changes
        }
    };

    // Save all lead profile changes
    window.saveLeadProfile = async function(leadId) {
        console.log('Saving lead profile for:', leadId);

        let changes = window.leadProfileChanges[leadId] || {};

        // If no tracked changes, collect all current field values
        if (Object.keys(changes).length === 0) {
            console.log('No tracked changes, collecting all current values...');

            const inputs = document.querySelectorAll('input, select, textarea');
            changes = {};

            inputs.forEach(input => {
                // Skip buttons
                if (input.type === 'button' || input.type === 'submit') {
                    return;
                }

                let fieldName = null;

                // Check onchange attribute
                const onchange = input.getAttribute('onchange');
                if (onchange && onchange.includes('updateLeadField')) {
                    const fieldMatch = onchange.match(/updateLeadField\([^,]+,\s*['"](\w+)['"]/);
                    if (fieldMatch) {
                        fieldName = fieldMatch[1];
                    }
                }

                // Get value
                let value = input.type === 'checkbox' ? input.checked : input.value;

                if (fieldName && value !== null && value !== '') {
                    changes[fieldName] = value;
                }
            });

            // Store the collected changes
            window.leadProfileChanges[leadId] = changes;
        }

        if (Object.keys(changes).length === 0) {
            showNotification('No data to save', 'info');
            return;
        }

        console.log('Saving changes:', changes);

        // Show loading state
        const saveButton = document.getElementById('save-lead-profile-btn');
        const originalHTML = saveButton ? saveButton.innerHTML : '';
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveButton.disabled = true;
        }

        try {
            // Update localStorage first
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
            const lead = leads.find(l => String(l.id) === String(leadId));

            if (lead) {
                // Apply all changes to the lead object
                Object.keys(changes).forEach(field => {
                    lead[field] = changes[field];
                });
                lead.lastModified = new Date().toISOString();

                // Save to localStorage
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));
            }

            // Save to server
            let serverSuccess = false;

            // Try new API first
            try {
                // Use current domain for API
                const apiUrl = window.location.hostname === 'localhost'
                    ? 'http://localhost:8897'
                    : `http://${window.location.hostname}:8897`;

                const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(changes)
                });

                if (response.ok) {
                    serverSuccess = true;
                    console.log('Lead saved to server (new API)');
                }
            } catch (error) {
                console.error('Error with new API:', error);
            }

            // Try old API as fallback
            if (!serverSuccess) {
                try {
                    const response = await fetch('http://localhost:5001/api/update_lead', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            lead_id: leadId,
                            updates: changes
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            serverSuccess = true;
                            console.log('Lead saved to server (old API)');
                        }
                    }
                } catch (error) {
                    console.error('Error with old API:', error);
                }
            }

            // Clear changes after successful save
            window.leadProfileChanges[leadId] = {};

            // Update button state
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
                saveButton.style.background = '#10b981'; // Green for saved
                saveButton.classList.remove('has-changes');
                saveButton.disabled = false;

                // Reset button after 2 seconds
                setTimeout(() => {
                    saveButton.innerHTML = '<i class="fas fa-save"></i> Save Profile';
                    saveButton.style.background = '#2563eb'; // Back to blue
                }, 2000);
            }

            if (serverSuccess) {
                showNotification('Lead profile saved successfully', 'success');
            } else {
                showNotification('Saved locally (server unreachable)', 'warning');
            }

        } catch (error) {
            console.error('Error saving lead profile:', error);
            showNotification('Error saving lead profile', 'error');

            // Reset button on error
            if (saveButton) {
                saveButton.innerHTML = originalHTML;
                saveButton.disabled = false;
            }
        }
    };

    // Override the original updateLeadField to just track changes
    const originalUpdateLeadField = window.updateLeadField;

    window.updateLeadField = function(leadId, field, value) {
        // Just track the change, don't save immediately
        trackLeadFieldChange(leadId, field, value);
    };

    // Enhanced showLeadProfile with save button
    const originalShowLeadProfile = window.showLeadProfile;

    window.showLeadProfile = function(leadId) {
        // Call original function
        if (originalShowLeadProfile) {
            originalShowLeadProfile.call(this, leadId);
        }

        // Clear any previous changes
        window.leadProfileChanges[leadId] = {};

        // Add save button after a short delay
        setTimeout(() => {
            // Try multiple locations for the save button
            let buttonAdded = false;

            // First, try to add it right after the modal header
            const modalHeader = document.querySelector('.modal-header');
            if (modalHeader && !document.getElementById('save-lead-profile-btn')) {
                // Create a toolbar div right after the header
                const toolbar = document.createElement('div');
                toolbar.id = 'lead-profile-toolbar';
                toolbar.style.cssText = 'padding: 15px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; display: flex; gap: 10px; align-items: center;';

                // Create save button
                const saveButton = document.createElement('button');
                saveButton.id = 'save-lead-profile-btn';
                saveButton.className = 'btn-primary';
                saveButton.style.cssText = 'background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px;';
                saveButton.innerHTML = '<i class="fas fa-save"></i> Save Profile';
                saveButton.onclick = function() {
                    saveLeadProfile(leadId);
                };

                // Add auto-save indicator
                const autoSaveIndicator = document.createElement('span');
                autoSaveIndicator.id = 'auto-save-indicator';
                autoSaveIndicator.style.cssText = 'font-size: 12px; color: #666; margin-left: auto;';
                autoSaveIndicator.innerHTML = '<i class="fas fa-info-circle"></i> Make changes and click Save to persist';

                toolbar.appendChild(saveButton);
                toolbar.appendChild(autoSaveIndicator);

                // Insert toolbar after header
                modalHeader.parentNode.insertBefore(toolbar, modalHeader.nextSibling);
                buttonAdded = true;
            }

            // Fallback: Try to add to quote submissions section
            if (!buttonAdded) {
                const quoteSection = document.querySelector('#quote-submissions-container');
                if (quoteSection && !document.getElementById('save-lead-profile-btn')) {
                    const parent = quoteSection.parentElement;
                    const header = parent.querySelector('h3');

                    if (header) {
                        // Find or create button container
                        let buttonContainer = parent.querySelector('div[style*="display: flex"]');
                        if (!buttonContainer) {
                            buttonContainer = document.createElement('div');
                            buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';
                            header.parentNode.insertBefore(buttonContainer, header.nextSibling);
                        }

                        // Add save button
                        const saveButton = document.createElement('button');
                        saveButton.id = 'save-lead-profile-btn';
                        saveButton.className = 'btn-primary';
                        saveButton.style.cssText = 'background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;';
                        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Profile';
                        saveButton.onclick = function() {
                            saveLeadProfile(leadId);
                        };

                        // Insert as first button
                        buttonContainer.insertBefore(saveButton, buttonContainer.firstChild);
                        buttonAdded = true;
                    }
                }
            }

            // Last fallback: Try profile-actions
            if (!buttonAdded) {
                const profileActions = document.querySelector('.profile-actions');
                if (profileActions && !document.getElementById('save-lead-profile-btn')) {
                    const saveButton = document.createElement('button');
                    saveButton.id = 'save-lead-profile-btn';
                    saveButton.className = 'btn-primary';
                    saveButton.style.cssText = 'background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px; font-weight: bold;';
                    saveButton.innerHTML = '<i class="fas fa-save"></i> Save Profile';
                    saveButton.onclick = function() {
                        saveLeadProfile(leadId);
                    };

                    profileActions.insertBefore(saveButton, profileActions.firstChild);
                    buttonAdded = true;
                }
            }

            // Update all input fields to use trackLeadFieldChange instead of updateLeadField
            const inputs = document.querySelectorAll('.lead-profile-content input, .lead-profile-content select, .lead-profile-content textarea');
            inputs.forEach(input => {
                const onchangeAttr = input.getAttribute('onchange');
                if (onchangeAttr && onchangeAttr.includes('updateLeadField')) {
                    // Extract the parameters from the onchange attribute
                    const match = onchangeAttr.match(/updateLeadField\(([^,]+),\s*['"]([^'"]+)['"]/);
                    if (match) {
                        const fieldName = match[2];

                        // Replace with new tracking function
                        input.removeAttribute('onchange');
                        input.addEventListener('change', function() {
                            trackLeadFieldChange(leadId, fieldName, this.value);
                        });

                        // Also track on input for real-time feedback
                        input.addEventListener('input', function() {
                            const indicator = document.getElementById('auto-save-indicator');
                            if (indicator) {
                                indicator.style.display = 'inline';
                            }
                        });
                    }
                }
            });
        }, 500);
    };

    // Add keyboard shortcut for save (Ctrl+S or Cmd+S)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            const modal = document.querySelector('.lead-profile-modal');
            if (modal) {
                e.preventDefault();

                // Find the lead ID from any input field
                const input = modal.querySelector('input[onchange*="updateLeadField"]');
                if (input) {
                    const onchange = input.getAttribute('onchange');
                    const match = onchange.match(/updateLeadField\(([^,]+),/);
                    if (match) {
                        const leadId = match[1];
                        saveLeadProfile(leadId);
                    }
                }
            }
        }
    });

    // Add styles for the save button
    const style = document.createElement('style');
    style.textContent = `
        #save-lead-profile-btn.has-changes {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }

        #auto-save-indicator {
            animation: fade-in 0.3s;
        }

        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    console.log('Lead Profile Save Fix loaded - Save button added, Ctrl+S enabled');
})();