// SAVE BUTTON INSIDE LEAD PROFILE - Targets the actual profile modal
(function() {
    'use strict';

    console.log('SAVE BUTTON IN PROFILE loading...');

    // Function to add save button to the lead profile
    function addSaveButtonToProfile() {
        console.log('Looking for lead profile...');

        // Check if save button already exists
        if (document.getElementById('lead-profile-save-btn')) {
            console.log('Save button already exists');
            return;
        }

        // Look for the Quote Submissions section or buttons
        const markers = [
            'Quote Submissions',
            'Quote Application',
            'Company Information',
            'Lead Status & Stage'
        ];

        let targetLocation = null;

        // Method 1: Find Quote Submissions heading
        const headings = Array.from(document.querySelectorAll('h3, h4, h2'));
        for (let heading of headings) {
            if (heading.textContent.includes('Quote Submissions')) {
                console.log('Found Quote Submissions heading');
                targetLocation = heading.parentElement;
                break;
            }
        }

        // Method 2: Find Quote Application button
        if (!targetLocation) {
            const buttons = Array.from(document.querySelectorAll('button'));
            for (let btn of buttons) {
                if (btn.textContent.includes('Quote Application') ||
                    btn.textContent.includes('Add Quote')) {
                    console.log('Found quote buttons');
                    targetLocation = btn.parentElement;
                    break;
                }
            }
        }

        // Method 3: Find Company Information section
        if (!targetLocation) {
            for (let heading of headings) {
                if (heading.textContent.includes('Company Information')) {
                    console.log('Found Company Information section');
                    // Add after this section
                    targetLocation = heading.parentElement;
                    break;
                }
            }
        }

        // Method 4: Find any element with lead profile content
        if (!targetLocation) {
            const profileContent = document.querySelector(
                '.lead-profile-content, ' +
                '.modal-body, ' +
                '[class*="profile"], ' +
                '[class*="modal-content"]'
            );
            if (profileContent) {
                console.log('Found profile content container');
                targetLocation = profileContent;
            }
        }

        if (!targetLocation) {
            console.log('Could not find suitable location for save button');
            return;
        }

        console.log('Adding save button to profile...');

        // Create save button container
        const saveContainer = document.createElement('div');
        saveContainer.style.cssText = `
            margin: 20px 0;
            padding: 15px;
            background: #f0f9ff;
            border: 2px solid #2563eb;
            border-radius: 10px;
            text-align: center;
        `;

        // Create the save button
        const saveBtn = document.createElement('button');
        saveBtn.id = 'lead-profile-save-btn';
        saveBtn.innerHTML = '💾 SAVE ALL CHANGES TO LEAD PROFILE';
        saveBtn.style.cssText = `
            background: #2563eb;
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        // Add hover effect
        saveBtn.onmouseover = function() {
            this.style.background = '#1d4ed8';
            this.style.transform = 'scale(1.05)';
        };
        saveBtn.onmouseout = function() {
            this.style.background = '#2563eb';
            this.style.transform = 'scale(1)';
        };

        saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveLeadProfile();
        };

        // Add instruction text
        const instruction = document.createElement('p');
        instruction.style.cssText = `
            margin: 10px 0 0 0;
            color: #6b7280;
            font-size: 14px;
        `;
        instruction.textContent = 'Click to save all changes made to this lead profile';

        saveContainer.appendChild(saveBtn);
        saveContainer.appendChild(instruction);

        // Insert the save button
        // If we found Quote Submissions, insert before it
        const quoteHeader = Array.from(document.querySelectorAll('h3, h4')).find(h =>
            h.textContent.includes('Quote Submissions')
        );

        if (quoteHeader) {
            quoteHeader.parentNode.insertBefore(saveContainer, quoteHeader);
            console.log('Save button added before Quote Submissions');
        } else {
            // Otherwise append to target location
            targetLocation.appendChild(saveContainer);
            console.log('Save button added to profile');
        }

        // Also add a floating save indicator
        const floatingIndicator = document.createElement('div');
        floatingIndicator.id = 'save-indicator';
        floatingIndicator.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            display: none;
            z-index: 999999;
            font-weight: bold;
        `;
        document.body.appendChild(floatingIndicator);
    }

    // Function to save the lead profile
    async function saveLeadProfile() {
        console.log('=== SAVING LEAD PROFILE ===');

        // Find lead ID
        let leadId = window.currentLeadId;

        if (!leadId) {
            // Try to find from any onchange attribute
            const inputWithOnchange = document.querySelector('[onchange*="updateLeadField"]');
            if (inputWithOnchange) {
                const match = inputWithOnchange.getAttribute('onchange').match(/updateLeadField\(['"]?(\w+)['"]?/);
                if (match) leadId = match[1];
            }
        }

        if (!leadId) {
            leadId = prompt('Enter Lead ID (e.g., 88571):');
        }

        if (!leadId) {
            alert('Cannot determine lead ID');
            return;
        }

        console.log('Saving lead:', leadId);
        window.currentLeadId = leadId;

        // Collect all field values
        const data = {};

        // Find all inputs in the profile
        document.querySelectorAll('input, textarea, select').forEach(element => {
            if (element.type === 'button' || element.type === 'submit') return;

            const value = element.value;
            if (!value && value !== '') return;

            // Check if element has onchange with updateLeadField
            const onchange = element.getAttribute('onchange') || '';
            if (onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([^'"]+)['"]/);
                if (match) {
                    const fieldName = match[1];
                    data[fieldName] = value;
                    console.log(`Field: ${fieldName} = ${value}`);
                    return;
                }
            }

            // Try to identify field from context
            // Look for preceding label or text
            let fieldName = null;
            const parent = element.parentElement;

            // Check if there's text before this input
            const prevText = parent?.textContent || '';
            const allText = (prevText + ' ' + element.placeholder + ' ' + element.id).toLowerCase();

            if (allText.includes('company name')) {
                data.company_name = value;
                console.log(`Detected Company Name: ${value}`);
            } else if (allText.includes('contact:') || (allText.includes('contact') && !allText.includes('date'))) {
                data.contact_name = value;
                console.log(`Detected Contact: ${value}`);
            } else if (allText.includes('phone')) {
                data.phone = value;
                console.log(`Detected Phone: ${value}`);
            } else if (allText.includes('email')) {
                data.email = value;
                console.log(`Detected Email: ${value}`);
            } else if (allText.includes('dot number')) {
                data.dot_number = value;
                console.log(`Detected DOT: ${value}`);
            } else if (allText.includes('mc number')) {
                data.mc_number = value;
                console.log(`Detected MC: ${value}`);
            } else if (allText.includes('years in business')) {
                data.years_in_business = value;
                console.log(`Detected Years: ${value}`);
            } else if (allText.includes('fleet size')) {
                data.fleet_size = value;
                console.log(`Detected Fleet: ${value}`);
            } else if (allText.includes('radius')) {
                data.radius_of_operation = value;
                console.log(`Detected Radius: ${value}`);
            } else if (allText.includes('commodity')) {
                data.commodity_hauled = value;
                console.log(`Detected Commodity: ${value}`);
            } else if (allText.includes('notes') || element.tagName === 'TEXTAREA') {
                data.notes = value;
                console.log(`Detected Notes: ${value}`);
            }
        });

        console.log('Collected data:', data);

        if (Object.keys(data).length === 0) {
            alert('No data found to save');
            return;
        }

        // Update save button
        const saveBtn = document.getElementById('lead-profile-save-btn');
        const originalText = saveBtn?.innerHTML;
        if (saveBtn) {
            saveBtn.innerHTML = '⏳ SAVING...';
            saveBtn.disabled = true;
            saveBtn.style.background = '#fbbf24';
        }

        // Show floating indicator
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.textContent = 'Saving...';
            indicator.style.display = 'block';
            indicator.style.background = '#fbbf24';
        }

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            console.log(`Saving to ${apiUrl}/api/leads/${leadId}`);

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('API response:', result);

            if (response.ok) {
                // Update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const lead = leads.find(l => String(l.id) === String(leadId));
                if (lead) {
                    Object.assign(lead, data);
                    lead.name = data.company_name || lead.name;
                    lead.contact = data.contact_name || lead.contact;
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    localStorage.setItem('leads', JSON.stringify(leads));
                }

                if (saveBtn) {
                    saveBtn.innerHTML = '✅ SAVED SUCCESSFULLY!';
                    saveBtn.style.background = '#10b981';
                }

                if (indicator) {
                    indicator.textContent = '✅ Saved!';
                    indicator.style.background = '#10b981';
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, 3000);
                }

                if (window.showNotification) {
                    showNotification('Lead profile saved successfully!', 'success');
                }

                console.log('SAVE SUCCESSFUL!');

                // Reset button after delay
                setTimeout(() => {
                    if (saveBtn) {
                        saveBtn.innerHTML = originalText;
                        saveBtn.style.background = '#2563eb';
                        saveBtn.disabled = false;
                    }
                }, 3000);

            } else {
                throw new Error(result.error || result.message || 'Save failed');
            }

        } catch (error) {
            console.error('Save error:', error);
            alert(`Save failed: ${error.message}`);

            if (saveBtn) {
                saveBtn.innerHTML = '❌ SAVE FAILED';
                saveBtn.style.background = '#ef4444';
                saveBtn.disabled = false;
            }

            if (indicator) {
                indicator.style.display = 'none';
            }
        }
    }

    // Watch for profile opening
    let checkInterval = null;

    function startWatching() {
        if (checkInterval) return;

        checkInterval = setInterval(() => {
            // Check if we're in a lead profile
            const hasLeadProfile =
                document.querySelector('h2')?.textContent?.includes('Commercial Auto Lead Profile') ||
                document.body.textContent.includes('Company Information') ||
                document.body.textContent.includes('Quote Submissions');

            if (hasLeadProfile && !document.getElementById('lead-profile-save-btn')) {
                console.log('Lead profile detected, adding save button...');
                addSaveButtonToProfile();
            }
        }, 500);
    }

    // Intercept profile functions
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        console.log('showLeadProfile called:', leadId);
        window.currentLeadId = leadId;

        if (originalShow) {
            originalShow.call(this, leadId);
        }

        setTimeout(addSaveButtonToProfile, 100);
        setTimeout(addSaveButtonToProfile, 500);
        setTimeout(addSaveButtonToProfile, 1000);
    };

    const originalView = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('viewLead called:', leadId);
        window.currentLeadId = leadId;

        if (originalView) {
            originalView.call(this, leadId);
        }

        setTimeout(addSaveButtonToProfile, 100);
        setTimeout(addSaveButtonToProfile, 500);
        setTimeout(addSaveButtonToProfile, 1000);
    };

    // Track lead ID from field updates
    window.updateLeadField = function(leadId, field, value) {
        console.log(`Field changed: ${field} = ${value}`);
        window.currentLeadId = leadId;
        // Don't auto-save
    };

    // Start watching for profile
    startWatching();

    // Also use mutation observer
    const observer = new MutationObserver(() => {
        const hasLeadProfile =
            document.querySelector('h2')?.textContent?.includes('Commercial Auto Lead Profile') ||
            document.body.textContent.includes('Quote Submissions');

        if (hasLeadProfile && !document.getElementById('lead-profile-save-btn')) {
            addSaveButtonToProfile();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Make save function global
    window.saveLeadProfile = saveLeadProfile;

    console.log('SAVE BUTTON IN PROFILE loaded - will appear inside lead profile near Quote Submissions');
})();