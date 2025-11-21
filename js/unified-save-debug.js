// UNIFIED SAVE SYSTEM WITH ENHANCED DEBUGGING
(function() {
    'use strict';

    console.log('UNIFIED SAVE DEBUG loading...');

    let currentLeadId = null;
    let saveButtonAdded = false;

    // Add single save button
    function addSaveButton() {
        if (saveButtonAdded) return;

        // Remove any existing duplicate save buttons first
        const existingSaveBtns = document.querySelectorAll('#final-save-btn, #quote-save-btn, #unified-save-btn');
        existingSaveBtns.forEach(btn => btn.remove());

        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = buttons.find(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (!targetButton) return;

        const parent = targetButton.parentElement;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'unified-save-btn';
        saveBtn.innerHTML = 'Save';
        saveBtn.className = targetButton.className || '';
        saveBtn.style.cssText = `
            background: #059669 !important;
            color: white !important;
            margin-right: 10px !important;
            font-weight: bold !important;
            padding: 10px 20px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 16px !important;
        `;

        saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveAllData();
        };

        parent.insertBefore(saveBtn, targetButton);
        saveButtonAdded = true;
        console.log('Save button added');
    }

    // Main save function with detailed debugging
    async function saveAllData() {
        console.log('=== STARTING SAVE PROCESS ===');

        // Get lead ID
        let leadId = currentLeadId || window.currentLeadId;

        if (!leadId) {
            const input = document.querySelector('[onchange*="updateLeadField"]');
            if (input) {
                const match = input.getAttribute('onchange').match(/updateLeadField\(['"]*(\d+)/);
                if (match) leadId = match[1];
            }
        }

        if (!leadId) {
            leadId = prompt('Enter Lead ID:', '88571');
        }

        console.log('Lead ID:', leadId);

        // Debug: Log all inputs on the page
        console.log('=== ALL INPUTS ON PAGE ===');
        document.querySelectorAll('input, textarea, select').forEach(el => {
            if (el.value) {
                console.log(`Element: ${el.tagName}, ID: ${el.id}, Value: "${el.value}", onchange: ${el.getAttribute('onchange')}`);
            }
        });

        const leadData = {};

        // Method 1: Get values from specific IDs
        console.log('=== METHOD 1: BY ID ===');
        const idFields = [
            'lead-company', 'lead-contact', 'lead-phone', 'lead-email',
            'lead-dot', 'lead-mc', 'lead-years', 'lead-fleet',
            'lead-radius', 'lead-commodity', 'lead-states', 'lead-stage',
            'lead-premium', 'lead-transcript'
        ];

        idFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                console.log(`#${id} = "${el.value}"`);
                if (el.value) {
                    // Map ID to field name
                    let fieldName = id.replace('lead-', '').replace(/-/g, '_');
                    // Special mappings
                    if (fieldName === 'company') fieldName = 'company_name';
                    if (fieldName === 'contact') fieldName = 'contact_name';
                    if (fieldName === 'dot') fieldName = 'dot_number';
                    if (fieldName === 'mc') fieldName = 'mc_number';
                    if (fieldName === 'years') fieldName = 'years_in_business';
                    if (fieldName === 'fleet') fieldName = 'fleet_size';
                    if (fieldName === 'radius') fieldName = 'radius_of_operation';
                    if (fieldName === 'commodity') fieldName = 'commodity_hauled';
                    if (fieldName === 'states') fieldName = 'operating_states';
                    if (fieldName === 'transcript') fieldName = 'transcript_text';

                    let value = el.value;
                    if (fieldName === 'premium') {
                        value = value.replace(/[$,]/g, '');
                    }

                    leadData[fieldName] = value;
                }
            } else {
                console.log(`#${id} NOT FOUND`);
            }
        });

        // Method 2: Get from onchange attributes
        console.log('=== METHOD 2: BY ONCHANGE ===');
        document.querySelectorAll('[onchange*="updateLeadField"]').forEach(el => {
            const onchange = el.getAttribute('onchange');
            console.log(`Found element with onchange: ${onchange}, value: "${el.value}"`);

            if (el.value) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([^'"]+)['"]/);
                if (match) {
                    let fieldName = match[1];
                    console.log(`  Field name from onchange: ${fieldName}`);

                    // Map field names
                    const fieldMap = {
                        'name': 'company_name',
                        'contact': 'contact_name',
                        'dotNumber': 'dot_number',
                        'mcNumber': 'mc_number',
                        'yearsInBusiness': 'years_in_business',
                        'fleetSize': 'fleet_size',
                        'radiusOfOperation': 'radius_of_operation',
                        'commodityHauled': 'commodity_hauled',
                        'operatingStates': 'operating_states',
                        'transcriptText': 'transcript_text'
                    };

                    fieldName = fieldMap[fieldName] || fieldName;

                    if (!leadData[fieldName]) {
                        leadData[fieldName] = el.value;
                        console.log(`  Added ${fieldName} = "${el.value}"`);
                    }
                }
            }
        });

        // Method 3: Get notes
        console.log('=== METHOD 3: NOTES ===');
        const notesTextarea = document.querySelector('.notes-area, textarea[placeholder*="notes" i], textarea[placeholder*="Notes"]');
        if (notesTextarea && notesTextarea.value) {
            leadData.notes = notesTextarea.value;
            console.log(`Notes found: "${notesTextarea.value}"`);
        }

        // Clean empty values
        const finalLeadData = {};
        Object.keys(leadData).forEach(key => {
            if (leadData[key] !== undefined && leadData[key] !== null && leadData[key] !== '') {
                finalLeadData[key] = leadData[key];
            }
        });

        console.log('=== FINAL DATA TO SAVE ===');
        console.log(JSON.stringify(finalLeadData, null, 2));

        // Update button
        const saveBtn = document.getElementById('unified-save-btn');
        const originalText = saveBtn?.innerHTML;
        if (saveBtn) {
            saveBtn.innerHTML = 'Saving...';
            saveBtn.disabled = true;
        }

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            if (Object.keys(finalLeadData).length > 0) {
                console.log(`Sending PUT request to ${apiUrl}/api/leads/${leadId}`);
                const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalLeadData)
                });

                const result = await response.json();
                console.log('API Response:', result);

                if (response.ok) {
                    // Also update localStorage
                    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
                    if (leadIndex !== -1) {
                        // Map database fields back to localStorage format
                        leads[leadIndex].name = finalLeadData.company_name || leads[leadIndex].name;
                        leads[leadIndex].contact = finalLeadData.contact_name || leads[leadIndex].contact;
                        leads[leadIndex].phone = finalLeadData.phone || leads[leadIndex].phone;
                        leads[leadIndex].email = finalLeadData.email || leads[leadIndex].email;
                        leads[leadIndex].dotNumber = finalLeadData.dot_number || leads[leadIndex].dotNumber;
                        leads[leadIndex].mcNumber = finalLeadData.mc_number || leads[leadIndex].mcNumber;
                        leads[leadIndex].yearsInBusiness = finalLeadData.years_in_business || leads[leadIndex].yearsInBusiness;
                        leads[leadIndex].fleetSize = finalLeadData.fleet_size || leads[leadIndex].fleetSize;
                        leads[leadIndex].radiusOfOperation = finalLeadData.radius_of_operation || leads[leadIndex].radiusOfOperation;
                        leads[leadIndex].commodityHauled = finalLeadData.commodity_hauled || leads[leadIndex].commodityHauled;
                        leads[leadIndex].operatingStates = finalLeadData.operating_states || leads[leadIndex].operatingStates;
                        leads[leadIndex].notes = finalLeadData.notes || leads[leadIndex].notes;
                        leads[leadIndex].stage = finalLeadData.stage || leads[leadIndex].stage;

                        localStorage.setItem('insurance_leads', JSON.stringify(leads));
                        console.log('LocalStorage updated');
                    }

                    if (saveBtn) {
                        saveBtn.innerHTML = 'Saved!';
                        saveBtn.style.background = '#059669';
                    }

                    if (window.showNotification) {
                        showNotification('Data saved successfully!', 'success');
                    } else {
                        alert('Data saved successfully!');
                    }
                } else {
                    throw new Error(`API error: ${result.error || 'Unknown error'}`);
                }
            } else {
                console.warn('No data to save!');
                alert('No changes detected to save');
            }

            setTimeout(() => {
                if (saveBtn) {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.disabled = false;
                }
            }, 3000);

        } catch (error) {
            console.error('Save error:', error);
            alert(`Save error: ${error.message}`);

            if (saveBtn) {
                saveBtn.innerHTML = 'Error';
                saveBtn.style.background = '#ef4444';
                setTimeout(() => {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.style.background = '#059669';
                    saveBtn.disabled = false;
                }, 3000);
            }
        }
    }

    // Clean up duplicates
    function cleanupDuplicateButtons() {
        const duplicates = document.querySelectorAll('#final-save-btn, #quote-save-btn');
        duplicates.forEach(btn => btn.remove());
    }

    // Monitor for button
    setInterval(() => {
        cleanupDuplicateButtons();

        if (!saveButtonAdded || !document.getElementById('unified-save-btn')) {
            const hasQuoteButtons = Array.from(document.querySelectorAll('button')).some(btn =>
                btn.textContent.includes('Quote Application') ||
                btn.textContent.includes('Add Quote')
            );

            if (hasQuoteButtons) {
                saveButtonAdded = false;
                addSaveButton();
            }
        }
    }, 500);

    // Intercept profile opens
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalShow) {
            originalShow.apply(this, arguments);
        }

        setTimeout(() => {
            cleanupDuplicateButtons();
            addSaveButton();
        }, 500);
    };

    // Track field updates
    window.updateLeadField = function(leadId, field, value) {
        console.log(`updateLeadField called: ${field} = "${value}"`);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
    };

    console.log('UNIFIED SAVE DEBUG loaded');
})();