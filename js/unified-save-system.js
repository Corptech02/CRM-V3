// UNIFIED SAVE SYSTEM - Single save button that handles everything
(function() {
    'use strict';

    console.log('UNIFIED SAVE SYSTEM loading...');

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
        console.log('Unified save button added');
    }

    // Capture quote data from forms
    function captureQuoteData() {
        console.log('Capturing quote data...');
        const quotes = [];

        // Find quote headers
        const quoteHeaders = Array.from(document.querySelectorAll('h3, h4, div')).filter(el =>
            el.textContent.includes('Quote #')
        );

        quoteHeaders.forEach((header, index) => {
            console.log(`Found quote header: ${header.textContent}`);
            const quoteData = { quote_number: index + 1 };

            // Get parent container
            let container = header.parentElement;
            while (container && container.querySelectorAll('input').length === 0) {
                container = container.parentElement;
            }
            if (!container) return;

            // Parse text content
            const allText = container.innerText || container.textContent || '';
            const lines = allText.split('\n').map(line => line.trim()).filter(line => line);

            lines.forEach((line, idx) => {
                if (line.includes('Insurance Company:')) {
                    const nextLine = lines[idx + 1];
                    if (nextLine && !nextLine.includes(':')) {
                        quoteData.carrier_name = nextLine;
                    }
                }
                if (line.includes('Premium')) {
                    const match = line.match(/[\d,]+\.?\d*/);
                    if (match) {
                        quoteData.premium = match[0].replace(/,/g, '');
                    }
                }
                if (line.includes('Deductible')) {
                    const match = line.match(/[\d,]+\.?\d*/);
                    if (match) {
                        quoteData.deductible = match[0].replace(/,/g, '');
                    }
                }
                if (line.includes('Coverage')) {
                    const nextLine = lines[idx + 1];
                    if (nextLine && (nextLine.includes('$') || nextLine.includes('000'))) {
                        quoteData.coverage = nextLine;
                    }
                }
            });

            // Also check input fields
            const inputs = container.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                const value = input.value;
                if (!value || value === '0.00') return;

                const placeholder = input.placeholder?.toLowerCase() || '';
                const parentText = input.parentElement?.textContent?.toLowerCase() || '';

                if (placeholder.includes('insurance') || placeholder.includes('company')) {
                    quoteData.carrier_name = value;
                } else if (placeholder.includes('premium')) {
                    quoteData.premium = value.replace(/[$,]/g, '');
                } else if (placeholder.includes('deductible')) {
                    quoteData.deductible = value.replace(/[$,]/g, '');
                } else if (placeholder.includes('coverage') || placeholder.includes('1,000,000')) {
                    quoteData.coverage = value;
                } else if (placeholder.includes('date')) {
                    quoteData.effective_date = value;
                } else if (input.tagName === 'TEXTAREA') {
                    quoteData.notes = value;
                }
            });

            if (quoteData.carrier_name || (quoteData.premium && quoteData.premium !== '0')) {
                quotes.push(quoteData);
                console.log('Quote captured:', quoteData);
            }
        });

        return quotes;
    }

    // Main save function
    async function saveAllData() {
        console.log('=== UNIFIED SAVE - SAVING ALL DATA ===');

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

        // Collect lead data
        const leadData = {};

        // Method 1: Try getting values directly from ID-based inputs first
        const idBasedFields = [
            { id: 'lead-company', field: 'company_name' },
            { id: 'lead-contact', field: 'contact_name' },
            { id: 'lead-phone', field: 'phone' },
            { id: 'lead-email', field: 'email' },
            { id: 'lead-dot', field: 'dot_number' },
            { id: 'lead-mc', field: 'mc_number' },
            { id: 'lead-years', field: 'years_in_business' },
            { id: 'lead-fleet', field: 'fleet_size' },
            { id: 'lead-radius', field: 'radius_of_operation' },
            { id: 'lead-commodity', field: 'commodity_hauled' },
            { id: 'lead-states', field: 'operating_states' },
            { id: 'lead-stage', field: 'stage' },
            { id: 'lead-premium', field: 'premium' },
            { id: 'lead-transcript', field: 'transcript_text' }
        ];

        idBasedFields.forEach(({ id, field }) => {
            const element = document.getElementById(id);
            if (element && element.value) {
                let value = element.value;
                // Clean premium value
                if (field === 'premium') {
                    value = value.replace(/[$,]/g, '');
                }
                leadData[field] = value;
                console.log(`  ${field}: ${value} (from #${id})`);
            }
        });

        // Method 2: Collect from onchange attributes
        document.querySelectorAll('[onchange*="updateLeadField"]').forEach(element => {
            const value = element.value;
            if (!value && value !== '') return;

            const onchange = element.getAttribute('onchange');
            const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([\w_]+)['"]/);
            if (match) {
                let fieldName = match[1];

                // Map field names from the HTML to database fields
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

                // Only set if not already set by ID method
                if (!leadData[fieldName]) {
                    leadData[fieldName] = value;
                    console.log(`  ${fieldName}: ${value} (from onchange)`);
                }
            }
        });

        // Method 3: Also check data-field attributes (from make-fields-editable.js)
        document.querySelectorAll('[data-field]').forEach(element => {
            const field = element.getAttribute('data-field');
            const value = element.value;
            if (field && value && !leadData[field]) {
                leadData[field] = value;
                console.log(`  ${field}: ${value} (from data-field)`);
            }
        });

        // Find Notes field (not transcript)
        let notesFound = false;
        const headers = document.querySelectorAll('h3, h4, h2');
        for (let header of headers) {
            if (header.textContent.trim() === 'Notes' || header.textContent.trim().includes('Notes')) {
                console.log('Found Notes header');
                let nextEl = header.nextElementSibling;
                let searchCount = 0;

                while (nextEl && searchCount < 5) {
                    if (nextEl.textContent && nextEl.textContent.includes('Call Transcript')) {
                        break;
                    }
                    if (nextEl.tagName === 'TEXTAREA') {
                        leadData.notes = nextEl.value;
                        console.log(`  Notes: ${nextEl.value}`);
                        notesFound = true;
                        break;
                    }
                    const textarea = nextEl.querySelector('textarea');
                    if (textarea) {
                        leadData.notes = textarea.value;
                        console.log(`  Notes: ${textarea.value}`);
                        notesFound = true;
                        break;
                    }
                    nextEl = nextEl.nextElementSibling;
                    searchCount++;
                }
                if (notesFound) break;
            }
        }

        // Also check for notes textarea by class or other attributes
        if (!notesFound) {
            const notesTextarea = document.querySelector('.notes-area, textarea[placeholder*="notes"], textarea[placeholder*="Notes"]');
            if (notesTextarea) {
                leadData.notes = notesTextarea.value;
                console.log(`  Notes (from class): ${notesTextarea.value}`);
            }
        }

        // Capture quote data
        const quotes = captureQuoteData();

        // Also check for pending quotes
        if (window.pendingQuotes && window.pendingQuotes.length > 0) {
            console.log('Found pending quotes:', window.pendingQuotes);
            quotes.push(...window.pendingQuotes);
            window.pendingQuotes = [];
        }

        // Also check window.leadQuoteSubmissions
        if (window.leadQuoteSubmissions && Array.isArray(window.leadQuoteSubmissions)) {
            window.leadQuoteSubmissions.forEach(quote => {
                if (quote.lead_id === leadId) {
                    quotes.push({
                        carrier_name: quote.form_data?.carrier_name || quote.carrier_name,
                        premium: quote.form_data?.premium || quote.premium,
                        deductible: quote.form_data?.deductible || quote.deductible,
                        coverage: quote.form_data?.coverage || quote.coverage,
                        effective_date: quote.form_data?.effective_date || quote.effective_date,
                        notes: quote.form_data?.notes || quote.notes
                    });
                }
            });
        }

        // Clean up the final lead data
        const finalLeadData = {};
        Object.keys(leadData).forEach(key => {
            if (leadData[key] !== undefined && leadData[key] !== null && leadData[key] !== '') {
                finalLeadData[key] = leadData[key];
            }
        });

        console.log('Final lead data:', finalLeadData);
        console.log('Quotes to save:', quotes);

        // Update button state
        const saveBtn = document.getElementById('unified-save-btn');
        const originalText = saveBtn?.innerHTML;
        if (saveBtn) {
            saveBtn.innerHTML = 'Saving...';
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
                console.log('Saving lead data to API...');
                const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalLeadData)
                });

                const result = await response.json();
                console.log('Lead save response:', result);

                if (!response.ok) {
                    saveSuccess = false;
                    console.error('Failed to save lead data:', result);
                }
            }

            // Save each quote
            for (const quote of quotes) {
                console.log('Saving quote:', quote);

                const quotePayload = {
                    lead_id: leadId,
                    application_id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    form_data: {
                        carrier_name: quote.carrier_name || 'Unknown Carrier',
                        premium: quote.premium || '0',
                        deductible: quote.deductible || '0',
                        coverage: quote.coverage || '',
                        effective_date: quote.effective_date || new Date().toISOString().split('T')[0],
                        notes: quote.notes || ''
                    },
                    status: 'quoted',
                    submitted_date: new Date().toISOString()
                };

                try {
                    const quoteResponse = await fetch(`${apiUrl}/api/quote-submissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(quotePayload)
                    });

                    if (quoteResponse.ok) {
                        const quoteResult = await quoteResponse.json();
                        console.log('Quote saved successfully:', quoteResult);
                    } else {
                        const errorText = await quoteResponse.text();
                        console.error('Quote save failed:', errorText);
                        saveSuccess = false;
                    }
                } catch (error) {
                    console.error('Error saving quote:', error);
                    saveSuccess = false;
                }
            }

            // Update localStorage
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

            if (leadIndex !== -1) {
                // Update existing lead
                Object.assign(leads[leadIndex], {
                    name: finalLeadData.company_name || leads[leadIndex].name,
                    contact: finalLeadData.contact_name || leads[leadIndex].contact,
                    phone: finalLeadData.phone || leads[leadIndex].phone,
                    email: finalLeadData.email || leads[leadIndex].email,
                    dotNumber: finalLeadData.dot_number || leads[leadIndex].dotNumber,
                    mcNumber: finalLeadData.mc_number || leads[leadIndex].mcNumber,
                    yearsInBusiness: finalLeadData.years_in_business || leads[leadIndex].yearsInBusiness,
                    fleetSize: finalLeadData.fleet_size || leads[leadIndex].fleetSize,
                    radiusOfOperation: finalLeadData.radius_of_operation || leads[leadIndex].radiusOfOperation,
                    commodityHauled: finalLeadData.commodity_hauled || leads[leadIndex].commodityHauled,
                    operatingStates: finalLeadData.operating_states || leads[leadIndex].operatingStates,
                    notes: finalLeadData.notes || leads[leadIndex].notes,
                    transcriptText: finalLeadData.transcript_text || leads[leadIndex].transcriptText,
                    stage: finalLeadData.stage || leads[leadIndex].stage,
                    premium: finalLeadData.premium || leads[leadIndex].premium
                });

                if (quotes.length > 0) {
                    leads[leadIndex].quoteSubmissions = quotes;
                }

                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));
                console.log('LocalStorage updated');
            }

            if (saveSuccess) {
                if (saveBtn) {
                    saveBtn.innerHTML = 'Saved!';
                    saveBtn.style.background = '#059669';
                }

                const message = quotes.length > 0
                    ? `Saved successfully! ${quotes.length} quote(s) saved.`
                    : 'All data saved successfully!';

                if (window.showNotification) {
                    showNotification(message, 'success');
                } else {
                    alert(message);
                }
            } else {
                throw new Error('Some items failed to save');
            }

            setTimeout(() => {
                if (saveBtn) {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.style.background = '#059669';
                    saveBtn.disabled = false;
                }
            }, 3000);

        } catch (error) {
            console.error('Save error:', error);
            alert(`Save error: ${error.message}`);

            if (saveBtn) {
                saveBtn.innerHTML = 'Error';
                saveBtn.style.background = '#ef4444';
                saveBtn.disabled = false;

                setTimeout(() => {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.style.background = '#059669';
                }, 3000);
            }
        }
    }

    // Clean up any existing duplicate save buttons on load
    function cleanupDuplicateButtons() {
        const duplicates = document.querySelectorAll('#final-save-btn, #quote-save-btn');
        duplicates.forEach(btn => {
            console.log('Removing duplicate button:', btn.id);
            btn.remove();
        });
    }

    // Monitor for button addition
    setInterval(() => {
        // Clean up duplicates first
        cleanupDuplicateButtons();

        // Then add our single button if needed
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
    const originalView = window.viewLead;
    window.viewLead = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalView) {
            originalView.apply(this, arguments);
        }

        setTimeout(() => {
            cleanupDuplicateButtons();
            addSaveButton();
        }, 500);
    };

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
        console.log(`Field updated: ${field} = ${value}`);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
    };

    // Intercept quote submissions
    const originalAddQuote = window.addQuoteSubmission;
    window.addQuoteSubmission = function(quoteData) {
        console.log('Quote submission added:', quoteData);

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

    // Monitor for quote form inputs
    document.addEventListener('input', function(e) {
        const input = e.target;
        const placeholder = input.placeholder?.toLowerCase() || '';
        const parentText = input.parentElement?.textContent?.toLowerCase() || '';

        if (placeholder.includes('insurance') || placeholder.includes('company') ||
            parentText.includes('insurance company') ||
            placeholder.includes('premium') || parentText.includes('premium') ||
            placeholder.includes('deductible') || parentText.includes('deductible') ||
            placeholder.includes('coverage') || placeholder.includes('1,000,000')) {

            console.log('Quote field changed:', input.value);

            // Mark that we should capture quote data on next save
            setTimeout(() => {
                const quotes = captureQuoteData();
                if (quotes.length > 0) {
                    window.pendingQuotes = quotes;
                }
            }, 100);
        }
    }, true);

    console.log('UNIFIED SAVE SYSTEM loaded - single Save button for everything!');
})();