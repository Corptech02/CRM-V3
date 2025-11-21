// FINAL FIX - Make save button actually save to database
(function() {
    'use strict';

    console.log('FINAL SAVE FIX LOADING...');

    // Override ALL save functions to use this one
    window.saveLeadProfile = saveToDatabase;
    window.saveLeadData = saveToDatabase;
    window.saveLead = saveToDatabase;

    // The ONE function that actually saves
    async function saveToDatabase(leadId) {
        console.log('SAVE TRIGGERED for lead:', leadId);

        // If no leadId passed, try to find it
        if (!leadId) {
            leadId = window.currentLeadId;
        }

        if (!leadId) {
            // Find from any input with onchange
            const input = document.querySelector('[onchange*="updateLeadField"]');
            if (input) {
                const match = input.getAttribute('onchange').match(/updateLeadField\(['"]?(\d+)/);
                if (match) leadId = match[1];
            }
        }

        if (!leadId) {
            alert('Cannot find lead ID');
            return;
        }

        console.log('Saving lead:', leadId);

        // Collect ALL input values from the page
        const data = {};

        // Get every input, select, and textarea
        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.type === 'button' || element.type === 'submit') return;

            const value = element.value;
            if (!value) return;

            // Try to get field name from onchange
            const onchange = element.getAttribute('onchange');
            if (onchange && onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([^'"]+)['"]/);
                if (match) {
                    const fieldName = match[1];
                    data[fieldName] = value;
                    console.log(`Found field ${fieldName} = ${value}`);
                    return;
                }
            }

            // Try to get field name from label or placeholder
            const placeholder = element.placeholder?.toLowerCase() || '';
            const label = element.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || '';
            const text = placeholder + ' ' + label;

            if (text.includes('company')) data.company_name = value;
            else if (text.includes('contact')) data.contact_name = value;
            else if (text.includes('phone')) data.phone = value;
            else if (text.includes('email')) data.email = value;
            else if (text.includes('dot')) data.dot_number = value;
            else if (text.includes('mc')) data.mc_number = value;
            else if (text.includes('years')) data.years_in_business = value;
            else if (text.includes('fleet')) data.fleet_size = value;
            else if (text.includes('radius')) data.radius_of_operation = value;
            else if (text.includes('commodity')) data.commodity_hauled = value;
            else if (text.includes('notes')) data.notes = value;
            else if (text.includes('address')) data.address = value;
            else if (text.includes('city')) data.city = value;
            else if (text.includes('state')) data.state = value;
            else if (text.includes('zip')) data.zip_code = value;
        });

        console.log('Data to save:', data);

        if (Object.keys(data).length === 0) {
            alert('No data to save');
            return;
        }

        // Show saving state
        const saveButtons = document.querySelectorAll('button');
        let saveButton = null;
        saveButtons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes('save')) {
                saveButton = btn;
                btn.disabled = true;
                btn.textContent = 'Saving...';
            }
        });

        try {
            // Determine API URL
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            // Save to API
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
                // Update localStorage too
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const lead = leads.find(l => String(l.id) === String(leadId));
                if (lead) {
                    Object.assign(lead, data);
                    // Also map to frontend field names
                    lead.name = data.company_name || lead.name;
                    lead.contact = data.contact_name || lead.contact;
                    lead.dotNumber = data.dot_number || lead.dotNumber;
                    lead.mcNumber = data.mc_number || lead.mcNumber;
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    localStorage.setItem('leads', JSON.stringify(leads));
                }

                if (saveButton) {
                    saveButton.textContent = 'Saved!';
                    saveButton.style.background = '#10b981';
                }

                console.log('SAVE SUCCESSFUL!');

                // Show notification if function exists
                if (window.showNotification) {
                    showNotification('Lead saved successfully!', 'success');
                }

                setTimeout(() => {
                    if (saveButton) {
                        saveButton.textContent = 'Save Lead';
                        saveButton.style.background = '';
                        saveButton.disabled = false;
                    }
                }, 2000);
            } else {
                throw new Error(result.error || result.message || 'Save failed');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving: ' + error.message);

            if (saveButton) {
                saveButton.textContent = 'Save Failed';
                saveButton.style.background = '#ef4444';
                saveButton.disabled = false;
            }
        }
    }

    // Hook into any save button clicks
    document.addEventListener('click', function(e) {
        const target = e.target;

        // Check if it's a save button
        if (target.tagName === 'BUTTON' &&
            (target.textContent.toLowerCase().includes('save') ||
             target.id?.includes('save'))) {

            console.log('Save button clicked:', target);

            // If it has a specific onclick, let it run
            if (target.onclick) return;

            // Otherwise use our save function
            e.preventDefault();
            e.stopPropagation();
            saveToDatabase();
        }
    }, true);

    // Also override the updateLeadField function to just collect changes
    const originalUpdateLeadField = window.updateLeadField;
    window.updateLeadField = function(leadId, field, value) {
        console.log(`Field changed: ${field} = ${value} for lead ${leadId}`);
        window.currentLeadId = leadId;
        // Don't auto-save, just track the lead ID
    };

    console.log('FINAL SAVE FIX LOADED - Save buttons will now save to database');
})();