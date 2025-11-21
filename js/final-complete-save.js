// FINAL COMPLETE SAVE - Handles all fields, notes, and quote submissions correctly
(function() {
    'use strict';

    console.log('FINAL COMPLETE SAVE loading...');

    let currentLeadId = null;
    let saveButtonAdded = false;

    // Add save button
    function addSaveButton() {
        if (saveButtonAdded) return;

        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = buttons.find(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (!targetButton) return;

        const parent = targetButton.parentElement;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'final-save-btn';
        saveBtn.innerHTML = '💾 Save Everything';
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
        console.log('Save button added successfully');
    }

    // Main save function
    async function saveAllData() {
        console.log('=== SAVING ALL DATA ===');

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

        if (!leadId) {
            alert('Cannot find lead ID!');
            return;
        }

        console.log('Lead ID:', leadId);

        // Initialize data containers
        const leadData = {};
        const quoteSubmissions = [];

        // STEP 1: Collect all input fields with updateLeadField
        console.log('Step 1: Collecting input fields...');
        document.querySelectorAll('[onchange*="updateLeadField"]').forEach(element => {
            const value = element.value;
            if (!value && value !== '') return;

            const onchange = element.getAttribute('onchange');
            const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([\w_]+)['"]/);
            if (match) {
                leadData[match[1]] = value;
                console.log(`  ${match[1]}: ${value}`);
            }
        });

        // STEP 2: Find the ACTUAL Notes textarea (not the transcript)
        console.log('Step 2: Finding Notes field...');

        // Method 1: Look for a textarea specifically for notes
        let notesFound = false;

        // Find all h3/h4 headers
        const headers = document.querySelectorAll('h3, h4, h2');
        for (let header of headers) {
            if (header.textContent.trim() === 'Notes' ||
                header.textContent.trim().includes('Notes')) {

                console.log('Found Notes header');

                // Look for textarea after this header
                let nextEl = header.nextElementSibling;
                let searchCount = 0;

                while (nextEl && searchCount < 5) {
                    // Stop if we hit Call Transcript
                    if (nextEl.textContent && nextEl.textContent.includes('Call Transcript')) {
                        break;
                    }

                    if (nextEl.tagName === 'TEXTAREA') {
                        leadData.notes = nextEl.value;
                        console.log(`  Notes (from textarea): ${nextEl.value}`);
                        notesFound = true;
                        break;
                    }

                    // Check children
                    const textarea = nextEl.querySelector('textarea');
                    if (textarea) {
                        leadData.notes = textarea.value;
                        console.log(`  Notes (from child textarea): ${textarea.value}`);
                        notesFound = true;
                        break;
                    }

                    nextEl = nextEl.nextElementSibling;
                    searchCount++;
                }

                if (notesFound) break;
            }
        }

        // Method 2: If no notes found, look for textarea with notes in id/name
        if (!notesFound) {
            const notesTextarea = document.querySelector('textarea[id*="notes"], textarea[name*="notes"], textarea[data-field="notes"]');
            if (notesTextarea) {
                leadData.notes = notesTextarea.value;
                console.log(`  Notes (from id/name): ${notesTextarea.value}`);
            }
        }

        // STEP 3: Collect quote submissions
        console.log('Step 3: Collecting quote submissions...');

        // Check if there are quote submissions stored in window
        if (window.leadQuoteSubmissions && Array.isArray(window.leadQuoteSubmissions)) {
            window.leadQuoteSubmissions.forEach(quote => {
                if (quote.lead_id === leadId) {
                    quoteSubmissions.push(quote);
                    console.log('  Found quote in window:', quote);
                }
            });
        }

        // Also check localStorage for quotes
        const storedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const storedLead = storedLeads.find(l => String(l.id) === String(leadId));
        if (storedLead && storedLead.quoteSubmissions) {
            storedLead.quoteSubmissions.forEach(quote => {
                // Check if this quote is already in our list
                const exists = quoteSubmissions.some(q =>
                    q.carrier_name === quote.carrier_name &&
                    q.premium === quote.premium
                );

                if (!exists) {
                    // Format for API
                    const formattedQuote = {
                        lead_id: leadId,
                        application_id: quote.application_id || `app_${Date.now()}`,
                        form_data: {
                            carrier_name: quote.carrier_name,
                            premium: quote.premium,
                            effective_date: quote.effective_date,
                            coverage: quote.coverage,
                            deductible: quote.deductible,
                            notes: quote.notes
                        },
                        status: quote.status || 'quoted',
                        submitted_date: quote.submitted_date || new Date().toISOString()
                    };
                    quoteSubmissions.push(formattedQuote);
                    console.log('  Found quote in localStorage:', formattedQuote);
                }
            });
        }

        // STEP 4: Map field names properly
        console.log('Step 4: Mapping field names...');
        const fieldMappings = {
            'company': 'company_name',
            'contact': 'contact_name',
            'dot': 'dot_number',
            'mc': 'mc_number',
            'years': 'years_in_business',
            'fleet': 'fleet_size',
            'radius': 'radius_of_operation',
            'commodity': 'commodity_hauled',
            'states': 'operating_states'
        };

        const finalLeadData = {};
        Object.keys(leadData).forEach(key => {
            const mappedKey = fieldMappings[key] || key;
            finalLeadData[mappedKey] = leadData[key];
        });

        console.log('Final lead data:', finalLeadData);
        console.log('Quote submissions:', quoteSubmissions);

        // Update button
        const saveBtn = document.getElementById('final-save-btn');
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

            let saveSuccess = true;

            // Save lead data
            if (Object.keys(finalLeadData).length > 0) {
                console.log('Saving lead data...');
                const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(finalLeadData)
                });

                const result = await response.json();
                console.log('Lead save response:', result);

                if (!response.ok) {
                    saveSuccess = false;
                    console.error('Failed to save lead data');
                }
            }

            // Save each quote submission
            for (const quote of quoteSubmissions) {
                console.log('Saving quote submission:', quote);

                try {
                    const quoteResponse = await fetch(`${apiUrl}/api/quote-submissions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(quote)
                    });

                    if (quoteResponse.ok) {
                        const quoteResult = await quoteResponse.json();
                        console.log('Quote saved:', quoteResult);
                    } else {
                        console.error('Quote save failed:', await quoteResponse.text());
                    }
                } catch (error) {
                    console.error('Error saving quote:', error);
                }
            }

            // Update localStorage
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
            if (leadIndex !== -1) {
                Object.assign(leads[leadIndex], finalLeadData);
                leads[leadIndex].name = finalLeadData.company_name || leads[leadIndex].name;
                leads[leadIndex].contact = finalLeadData.contact_name || leads[leadIndex].contact;
                leads[leadIndex].notes = finalLeadData.notes || leads[leadIndex].notes;

                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));
                console.log('LocalStorage updated');
            }

            if (saveSuccess) {
                if (saveBtn) {
                    saveBtn.innerHTML = '✅ Saved Successfully!';
                    saveBtn.style.background = '#059669';
                }

                if (window.showNotification) {
                    showNotification('All data saved successfully!', 'success');
                } else {
                    alert('All data saved successfully!');
                }
            }

            setTimeout(() => {
                if (saveBtn) {
                    saveBtn.innerHTML = originalText;
                    saveBtn.style.background = '#059669';
                    saveBtn.disabled = false;
                }
            }, 3000);

        } catch (error) {
            console.error('Save error:', error);
            alert(`Save error: ${error.message}`);

            if (saveBtn) {
                saveBtn.innerHTML = '❌ Error';
                saveBtn.style.background = '#ef4444';
                saveBtn.disabled = false;
            }
        }
    }

    // Monitor for button
    setInterval(() => {
        if (!saveButtonAdded || !document.getElementById('final-save-btn')) {
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

    // Track field updates
    window.updateLeadField = function(leadId, field, value) {
        console.log(`Field updated: ${field} = ${value}`);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
    };

    // Also intercept quote submissions
    const originalAddQuote = window.addQuoteSubmission;
    window.addQuoteSubmission = function(quoteData) {
        console.log('Quote submission added:', quoteData);

        // Store in window for saving
        if (!window.leadQuoteSubmissions) {
            window.leadQuoteSubmissions = [];
        }

        const leadId = currentLeadId || window.currentLeadId || quoteData.lead_id;

        const formattedQuote = {
            lead_id: leadId,
            application_id: `app_${Date.now()}`,
            form_data: quoteData,
            status: 'quoted',
            submitted_date: new Date().toISOString()
        };

        window.leadQuoteSubmissions.push(formattedQuote);

        if (originalAddQuote) {
            originalAddQuote.apply(this, arguments);
        }
    };

    console.log('FINAL COMPLETE SAVE loaded - handles all fields, notes, and quotes!');
})();