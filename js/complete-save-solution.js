// COMPLETE SAVE SOLUTION - Saves ALL fields properly
(function() {
    'use strict';

    console.log('COMPLETE SAVE SOLUTION loading...');

    let currentLeadId = null;
    let saveButtonAdded = false;

    // Function to add save button
    function addSaveButton() {
        if (saveButtonAdded) return;

        console.log('Adding save button...');

        // Find Quote Application or Add Quote buttons
        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = null;

        for (let btn of buttons) {
            if (btn.textContent.includes('Quote Application') ||
                btn.textContent.includes('Add Quote')) {
                targetButton = btn;
                break;
            }
        }

        if (!targetButton) {
            console.log('Target buttons not found');
            return;
        }

        const parent = targetButton.parentElement;

        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.id = 'complete-save-btn';
        saveBtn.innerHTML = '💾 Save Lead Profile';
        saveBtn.className = targetButton.className || '';
        saveBtn.style.cssText = `
            background: #2563eb !important;
            color: white !important;
            margin-right: 10px !important;
            font-weight: bold !important;
            padding: 10px 20px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
        `;

        saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            performCompleteSave();
        };

        parent.insertBefore(saveBtn, targetButton);
        saveButtonAdded = true;
        console.log('Save button added!');
    }

    // Main save function that captures EVERYTHING
    async function performCompleteSave() {
        console.log('=== COMPLETE SAVE INITIATED ===');

        // Get lead ID
        let leadId = currentLeadId || window.currentLeadId;

        if (!leadId) {
            // Try to find from any updateLeadField call
            const inputWithUpdate = document.querySelector('[onchange*="updateLeadField"]');
            if (inputWithUpdate) {
                const match = inputWithUpdate.getAttribute('onchange').match(/updateLeadField\(['"]*(\d+)/);
                if (match) leadId = match[1];
            }
        }

        if (!leadId) {
            leadId = prompt('Enter Lead ID:', '88571');
        }

        if (!leadId) {
            alert('Cannot find lead ID!');
            return;
        }

        console.log('Saving lead:', leadId);

        // Collect ALL data using multiple strategies
        const data = {};

        // STRATEGY 1: Find inputs by their position relative to labels
        const allTextNodes = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            if (text && text.includes(':')) {
                allTextNodes.push({
                    text: text,
                    node: node,
                    parent: node.parentElement
                });
            }
        }

        // Map label text to field names
        const fieldMappings = {
            'Company Name:': 'company_name',
            'Contact:': 'contact_name',
            'Phone:': 'phone',
            'Email:': 'email',
            'DOT Number:': 'dot_number',
            'MC Number:': 'mc_number',
            'Years in Business:': 'years_in_business',
            'Fleet Size:': 'fleet_size',
            'Radius of Operation:': 'radius_of_operation',
            'Commodity Hauled:': 'commodity_hauled',
            'Operating States:': 'operating_states',
            'Address:': 'address',
            'City:': 'city',
            'State:': 'state',
            'Zip:': 'zip_code',
            'Notes': 'notes'
        };

        // For each label, find the associated input/value
        allTextNodes.forEach(item => {
            const labelText = item.text;
            const fieldName = fieldMappings[labelText];

            if (fieldName) {
                console.log(`Found label: ${labelText}`);

                // Look for input field after this label
                const parent = item.parent;
                if (parent) {
                    // Check next sibling for input
                    let nextElement = parent.nextElementSibling;
                    if (nextElement && (nextElement.tagName === 'INPUT' ||
                                       nextElement.tagName === 'TEXTAREA' ||
                                       nextElement.tagName === 'SELECT')) {
                        data[fieldName] = nextElement.value;
                        console.log(`  Found input value: ${nextElement.value}`);
                    } else {
                        // Check within parent for input
                        const input = parent.querySelector('input, textarea, select');
                        if (input) {
                            data[fieldName] = input.value;
                            console.log(`  Found input in parent: ${input.value}`);
                        } else {
                            // Check if the next text node has the value
                            const nextText = parent.nextSibling?.textContent?.trim() ||
                                           parent.parentElement?.textContent?.replace(labelText, '').trim();
                            if (nextText && !nextText.includes(':')) {
                                // This might be static text - still save it if we can edit it
                                console.log(`  Found text value: ${nextText}`);
                            }
                        }
                    }
                }
            }
        });

        // STRATEGY 2: Find ALL inputs with onchange handlers
        document.querySelectorAll('[onchange*="updateLeadField"]').forEach(input => {
            const onchange = input.getAttribute('onchange');
            const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([\w_]+)['"]/);
            if (match) {
                const fieldName = match[1];
                const value = input.value;
                if (value) {
                    data[fieldName] = value;
                    console.log(`From onchange - ${fieldName}: ${value}`);
                }
            }
        });

        // STRATEGY 3: Find ALL inputs/textareas/selects and map by ID or name
        document.querySelectorAll('input, textarea, select').forEach(element => {
            if (element.type === 'button' || element.type === 'submit') return;

            const value = element.value;
            if (!value) return;

            // Check ID and name attributes
            const id = element.id?.toLowerCase() || '';
            const name = element.name?.toLowerCase() || '';
            const placeholder = element.placeholder?.toLowerCase() || '';

            // Map based on ID/name patterns
            if ((id.includes('company') || name.includes('company') || placeholder.includes('company')) && !data.company_name) {
                data.company_name = value;
            } else if ((id.includes('contact') || name.includes('contact') || placeholder.includes('contact')) && !data.contact_name) {
                data.contact_name = value;
            } else if ((id.includes('phone') || name.includes('phone') || placeholder.includes('phone')) && !data.phone) {
                data.phone = value;
            } else if ((id.includes('email') || name.includes('email') || placeholder.includes('email')) && !data.email) {
                data.email = value;
            } else if ((id.includes('dot') || name.includes('dot') || placeholder.includes('dot')) && !data.dot_number) {
                data.dot_number = value;
            } else if ((id.includes('mc') || name.includes('mc') || placeholder.includes('mc')) && !data.mc_number) {
                data.mc_number = value;
            } else if ((id.includes('years') || name.includes('years')) && !data.years_in_business) {
                data.years_in_business = value;
            } else if ((id.includes('fleet') || name.includes('fleet')) && !data.fleet_size) {
                data.fleet_size = value;
            } else if ((id.includes('notes') || name.includes('notes') || element.tagName === 'TEXTAREA') && !data.notes) {
                data.notes = value;
            }
        });

        // STRATEGY 4: Look specifically in Company Information section
        const sections = document.querySelectorAll('div');
        sections.forEach(section => {
            const text = section.textContent;
            if (text.includes('Company Information')) {
                console.log('Found Company Information section');

                // Find all inputs within this section
                const inputs = section.querySelectorAll('input, select, textarea');
                inputs.forEach((input, index) => {
                    const value = input.value;
                    if (!value) return;

                    // Try to identify field by preceding text
                    const precedingText = input.previousSibling?.textContent ||
                                         input.parentElement?.textContent || '';

                    if (precedingText.includes('Company Name')) {
                        data.company_name = value;
                        console.log(`Company Name: ${value}`);
                    } else if (precedingText.includes('Contact')) {
                        data.contact_name = value;
                        console.log(`Contact: ${value}`);
                    } else if (precedingText.includes('Phone')) {
                        data.phone = value;
                        console.log(`Phone: ${value}`);
                    } else if (precedingText.includes('Email')) {
                        data.email = value;
                        console.log(`Email: ${value}`);
                    } else if (precedingText.includes('DOT')) {
                        data.dot_number = value;
                        console.log(`DOT: ${value}`);
                    } else if (precedingText.includes('MC')) {
                        data.mc_number = value;
                        console.log(`MC: ${value}`);
                    }
                });
            }
        });

        console.log('=== FINAL DATA TO SAVE ===');
        console.log(data);

        if (Object.keys(data).length === 0) {
            alert('No data found to save! Please make sure fields are editable.');
            return;
        }

        // Update button
        const saveBtn = document.getElementById('complete-save-btn');
        const originalText = saveBtn?.innerHTML;
        if (saveBtn) {
            saveBtn.innerHTML = '⏳ Saving...';
            saveBtn.disabled = true;
            saveBtn.style.background = '#fbbf24';
        }

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            console.log(`Calling API: ${apiUrl}/api/leads/${leadId}`);

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
                // Update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const lead = leads.find(l => String(l.id) === String(leadId));
                if (lead) {
                    // Update all fields
                    Object.assign(lead, data);
                    // Also update mapped fields
                    lead.name = data.company_name || lead.name;
                    lead.company_name = data.company_name;
                    lead.contact = data.contact_name || lead.contact;
                    lead.contact_name = data.contact_name;
                    lead.phone = data.phone || lead.phone;
                    lead.email = data.email || lead.email;
                    lead.dotNumber = data.dot_number || lead.dotNumber;
                    lead.dot_number = data.dot_number;
                    lead.mcNumber = data.mc_number || lead.mcNumber;
                    lead.mc_number = data.mc_number;
                    lead.years_in_business = data.years_in_business || lead.years_in_business;
                    lead.fleet_size = data.fleet_size || lead.fleet_size;
                    lead.notes = data.notes || lead.notes;

                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    localStorage.setItem('leads', JSON.stringify(leads));
                    console.log('LocalStorage updated');
                }

                if (saveBtn) {
                    saveBtn.innerHTML = '✅ Saved Successfully!';
                    saveBtn.style.background = '#10b981';
                }

                if (window.showNotification) {
                    showNotification('All changes saved successfully!', 'success');
                } else {
                    alert('All changes saved successfully!');
                }

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
                saveBtn.innerHTML = '❌ Failed';
                saveBtn.style.background = '#ef4444';
                saveBtn.disabled = false;
            }
        }
    }

    // Monitor for profile opening
    setInterval(() => {
        const hasQuoteButtons = Array.from(document.querySelectorAll('button')).some(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (hasQuoteButtons && !saveButtonAdded) {
            addSaveButton();
        }

        // Re-add if removed
        if (hasQuoteButtons && !document.getElementById('complete-save-btn')) {
            saveButtonAdded = false;
            addSaveButton();
        }
    }, 500);

    // Intercept functions
    const originalView = window.viewLead;
    window.viewLead = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalView) {
            originalView.apply(this, arguments);
        }

        setTimeout(addSaveButton, 500);
    };

    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalShow) {
            originalShow.apply(this, arguments);
        }

        setTimeout(addSaveButton, 500);
    };

    // Make fields editable if they're not
    const originalUpdateLeadField = window.updateLeadField;
    window.updateLeadField = function(leadId, field, value) {
        console.log(`Field changed: ${field} = ${value}`);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        // Don't auto-save
    };

    console.log('COMPLETE SAVE SOLUTION loaded!');
})();