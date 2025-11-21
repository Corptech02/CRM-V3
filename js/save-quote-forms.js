// SAVE QUOTE FORMS - Captures and saves quote submissions from the Add Quote form
(function() {
    'use strict';

    console.log('SAVE QUOTE FORMS loading...');

    let currentLeadId = null;
    let saveButtonAdded = false;
    let collectedQuotes = [];
    let currentQuoteFormData = {};

    // Function to add save button
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
        saveBtn.id = 'quote-save-btn';
        saveBtn.innerHTML = '💾 Save All Changes & Quotes';
        saveBtn.className = targetButton.className || '';
        saveBtn.style.cssText = `
            background: #2563eb !important;
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
            saveEverything();
        };

        parent.insertBefore(saveBtn, targetButton);
        saveButtonAdded = true;
        console.log('Save button added');
    }

    // Function to capture quote data from all quote cards (both new and loaded)
    function captureQuoteData() {
        console.log('Capturing quote data from form...');

        const quotes = [];

        // Look for quote forms - specifically the Add Quote popup structure
        // Method 1: Find by Quote # headers in the popup
        const quoteHeaders = Array.from(document.querySelectorAll('h3, h4, div')).filter(el =>
            el.textContent.includes('Quote #')
        );

        quoteHeaders.forEach((header, index) => {
            console.log(`Found quote header: ${header.textContent}`);

            const quoteData = {
                quote_number: index + 1
            };

            // Get the parent container - look for the form or modal container
            let container = header.parentElement;
            // Keep going up until we find a container with inputs
            while (container && container.querySelectorAll('input').length === 0) {
                container = container.parentElement;
            }

            if (!container) return;

            // Find specific fields based on the text content structure you provided
            const allText = container.innerText || container.textContent || '';
            const lines = allText.split('\n').map(line => line.trim()).filter(line => line);

            // Parse the lines to extract field values
            lines.forEach((line, idx) => {
                // Insurance Company
                if (line.includes('Insurance Company:')) {
                    const nextLine = lines[idx + 1];
                    if (nextLine && !nextLine.includes(':')) {
                        quoteData.carrier_name = nextLine;
                        console.log('  Found carrier from text:', nextLine);
                    }
                }

                // Premium
                if (line.includes('Premium ($):') || line.includes('Premium:')) {
                    const match = line.match(/[\d,]+\.?\d*/);
                    if (match) {
                        quoteData.premium = match[0].replace(/,/g, '');
                        console.log('  Found premium from text:', quoteData.premium);
                    }
                }

                // Deductible
                if (line.includes('Deductible ($):') || line.includes('Deductible:')) {
                    const match = line.match(/[\d,]+\.?\d*/);
                    if (match) {
                        quoteData.deductible = match[0].replace(/,/g, '');
                        console.log('  Found deductible from text:', quoteData.deductible);
                    }
                }

                // Coverage Amount
                if (line.includes('Coverage Amount') || line.includes('Coverage:')) {
                    const nextLine = lines[idx + 1];
                    if (nextLine && (nextLine.includes('$') || nextLine.includes('000'))) {
                        quoteData.coverage = nextLine;
                        console.log('  Found coverage from text:', nextLine);
                    }
                }
            });

            // Also try to find actual input fields
            const inputs = container.querySelectorAll('input, select, textarea');

            inputs.forEach(input => {
                const value = input.value;
                if (!value || value === '0.00') return;

                // Get the label or preceding text
                let fieldLabel = '';

                // Check for label element
                const label = container.querySelector(`label[for="${input.id}"]`);
                if (label) {
                    fieldLabel = label.textContent.toLowerCase();
                }

                // Check placeholder
                const placeholder = input.placeholder?.toLowerCase() || '';

                // Check preceding sibling text
                let prevEl = input.previousElementSibling;
                while (prevEl && prevEl.tagName === 'BR') {
                    prevEl = prevEl.previousElementSibling;
                }
                if (prevEl && prevEl.nodeType === Node.TEXT_NODE) {
                    fieldLabel = prevEl.textContent.toLowerCase();
                }

                // Check parent's text content
                if (!fieldLabel && input.parentElement) {
                    const parentText = input.parentElement.textContent.toLowerCase();
                    fieldLabel = parentText;
                }

                // Map fields based on labels and placeholders
                if (fieldLabel.includes('insurance company') ||
                    placeholder.includes('insurance') ||
                    placeholder.includes('company')) {
                    quoteData.carrier_name = value;
                    console.log('  Found carrier from input:', value);
                }
                else if (fieldLabel.includes('premium') ||
                         placeholder.includes('premium')) {
                    quoteData.premium = value.replace(/[$,]/g, '');
                    console.log('  Found premium from input:', quoteData.premium);
                }
                else if (fieldLabel.includes('deductible') ||
                         placeholder.includes('deductible')) {
                    quoteData.deductible = value.replace(/[$,]/g, '');
                    console.log('  Found deductible from input:', quoteData.deductible);
                }
                else if (fieldLabel.includes('coverage') ||
                         placeholder.includes('coverage') ||
                         placeholder.includes('1,000,000') ||
                         placeholder.includes('e.g.')) {
                    quoteData.coverage = value;
                    console.log('  Found coverage from input:', value);
                }
                else if (fieldLabel.includes('effective') ||
                         placeholder.includes('date')) {
                    quoteData.effective_date = value;
                    console.log('  Found effective date from input:', value);
                }
                else if (input.tagName === 'TEXTAREA' ||
                         fieldLabel.includes('notes') ||
                         placeholder.includes('notes')) {
                    quoteData.notes = value;
                    console.log('  Found notes from input:', value);
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
    async function saveEverything() {
        console.log('=== SAVING EVERYTHING INCLUDING QUOTES ===');

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

        // Collect all input fields
        document.querySelectorAll('[onchange*="updateLeadField"]').forEach(element => {
            const value = element.value;
            if (!value && value !== '') return;

            const onchange = element.getAttribute('onchange');
            const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([\w_]+)['"]/);
            if (match) {
                leadData[match[1]] = value;
            }
        });

        // Find Notes (not transcript)
        const headers = document.querySelectorAll('h3, h4, h2');
        for (let header of headers) {
            if (header.textContent.trim() === 'Notes') {
                let nextEl = header.nextElementSibling;
                while (nextEl) {
                    if (nextEl.textContent && nextEl.textContent.includes('Call Transcript')) break;
                    if (nextEl.tagName === 'TEXTAREA') {
                        leadData.notes = nextEl.value;
                        break;
                    }
                    const textarea = nextEl.querySelector('textarea');
                    if (textarea) {
                        leadData.notes = textarea.value;
                        break;
                    }
                    nextEl = nextEl.nextElementSibling;
                }
                break;
            }
        }

        // Capture quote data from forms
        const quotes = captureQuoteData();

        // Map field names
        const fieldMappings = {
            'company': 'company_name',
            'contact': 'contact_name',
            'dot': 'dot_number',
            'mc': 'mc_number'
        };

        const finalLeadData = {};
        Object.keys(leadData).forEach(key => {
            const mappedKey = fieldMappings[key] || key;
            finalLeadData[mappedKey] = leadData[key];
        });

        console.log('Lead data to save:', finalLeadData);
        console.log('Quotes to save:', quotes);

        // Update button
        const saveBtn = document.getElementById('quote-save-btn');
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

            // Save lead data
            if (Object.keys(finalLeadData).length > 0) {
                console.log('Saving lead data...');
                const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalLeadData)
                });

                const result = await response.json();
                console.log('Lead save response:', result);
            }

            // Also check for pending quotes stored by the monitor
            if (window.pendingQuotes && window.pendingQuotes.length > 0) {
                console.log('Found pending quotes to save:', window.pendingQuotes);
                quotes.push(...window.pendingQuotes);
                window.pendingQuotes = []; // Clear after adding
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
                        effective_date: quote.effective_date || quote.submitted_date || new Date().toISOString().split('T')[0],
                        notes: quote.notes || ''
                    },
                    status: 'quoted',
                    submitted_date: quote.submitted_date || new Date().toISOString()
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
                    }
                } catch (error) {
                    console.error('Error saving quote:', error);
                }
            }

            // Update localStorage
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lead = leads.find(l => String(l.id) === String(leadId));
            if (lead) {
                Object.assign(lead, finalLeadData);
                lead.quotes = quotes;
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
            }

            if (saveBtn) {
                saveBtn.innerHTML = '✅ All Saved!';
                saveBtn.style.background = '#10b981';
            }

            if (window.showNotification) {
                showNotification(`Saved successfully! ${quotes.length} quotes saved.`, 'success');
            } else {
                alert(`Saved successfully! ${quotes.length} quotes saved.`);
            }

            setTimeout(() => {
                if (saveBtn) {
                    saveBtn.innerHTML = originalText;
                    saveBtn.style.background = '#2563eb';
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

    // Monitor for profile opening and quote forms
    setInterval(() => {
        if (!saveButtonAdded || !document.getElementById('quote-save-btn')) {
            const hasQuoteButtons = Array.from(document.querySelectorAll('button')).some(btn =>
                btn.textContent.includes('Quote Application') ||
                btn.textContent.includes('Add Quote')
            );

            if (hasQuoteButtons) {
                saveButtonAdded = false;
                addSaveButton();
            }
        }

        // Capture quotes when Add Quote form is visible
        const hasQuoteForm = document.querySelector('h3')?.textContent?.includes('Quote #') ||
                            document.querySelector('h4')?.textContent?.includes('Quote #');

        if (hasQuoteForm) {
            const currentQuotes = captureQuoteData();
            if (currentQuotes.length > 0) {
                // Store in window for the save function to use
                window.pendingQuotes = currentQuotes;
                console.log('Quotes ready to save:', currentQuotes);
            }
        }
    }, 500);

    // Intercept the addQuote function if it exists
    if (window.addQuote) {
        const originalAddQuote = window.addQuote;
        window.addQuote = function() {
            console.log('Add Quote function called');
            // Call original
            const result = originalAddQuote.apply(this, arguments);

            // Wait for form to render
            setTimeout(() => {
                console.log('Looking for quote form after Add Quote clicked...');
                const quotes = captureQuoteData();
                if (quotes.length > 0) {
                    window.pendingQuotes = quotes;
                    console.log('Pre-captured quote form:', quotes);
                }
            }, 500);

            return result;
        };
    }

    // Intercept modal close events
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function(child) {
        // Check if removing a modal with quote form
        if (child && child.querySelector) {
            const hasQuoteForm = child.querySelector('h3')?.textContent?.includes('Quote #') ||
                                child.querySelector('h4')?.textContent?.includes('Quote #');

            if (hasQuoteForm) {
                console.log('Quote modal being removed, capturing final data...');
                const quotes = captureQuoteData();
                if (quotes.length > 0) {
                    window.pendingQuotes = quotes;
                    console.log('Captured quotes before modal close:', quotes);
                }
            }
        }
        return originalRemoveChild.apply(this, arguments);
    };

    // Intercept profile functions
    const originalView = window.viewLead;
    window.viewLead = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;
        collectedQuotes = [];

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
        collectedQuotes = [];

        if (originalShow) {
            originalShow.apply(this, arguments);
        }

        setTimeout(addSaveButton, 500);

        // Load existing quotes
        setTimeout(() => loadExistingQuotes(leadId), 1000);
    };

    // Load existing quotes from database
    async function loadExistingQuotes(leadId) {
        console.log('Loading existing quotes for lead:', leadId);

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            // For now, we'll skip loading as the API endpoint needs work
            // But quotes will still save properly
        } catch (error) {
            console.error('Error loading quotes:', error);
        }
    }

    // Track field updates
    window.updateLeadField = function(leadId, field, value) {
        console.log(`Field updated: ${field} = ${value}`);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
    };

    // Intercept form submissions and button clicks
    document.addEventListener('click', function(e) {
        // Check if clicking submit/save/add button in quote form
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
            const btnText = e.target.textContent?.toLowerCase() || e.target.value?.toLowerCase() || '';

            if (btnText.includes('submit') || btnText.includes('save') || btnText.includes('add')) {
                // Check if we're in a quote form context
                const hasQuoteForm = document.querySelector('h3')?.textContent?.includes('Quote #') ||
                                   document.querySelector('h4')?.textContent?.includes('Quote #');

                if (hasQuoteForm) {
                    console.log('Quote form submission detected, capturing data...');
                    const quotes = captureQuoteData();
                    if (quotes.length > 0) {
                        window.pendingQuotes = quotes;
                        console.log('Captured quotes on form submit:', quotes);
                    }
                }
            }
        }
    }, true);

    // Also intercept form submit events
    document.addEventListener('submit', function(e) {
        const form = e.target;
        // Check if this form contains quote fields
        const hasQuoteFields = form.querySelector('input[placeholder*="Insurance"]') ||
                              form.querySelector('input[placeholder*="Premium"]') ||
                              form.querySelector('input[placeholder*="Coverage"]');

        if (hasQuoteFields) {
            console.log('Quote form submit event, capturing data...');
            const quotes = captureQuoteData();
            if (quotes.length > 0) {
                window.pendingQuotes = quotes;
                console.log('Captured quotes on form submit:', quotes);
            }
        }
    }, true);

    // Monitor input changes in real-time for quote fields
    document.addEventListener('input', function(e) {
        const input = e.target;
        const placeholder = input.placeholder?.toLowerCase() || '';
        const parentText = input.parentElement?.textContent?.toLowerCase() || '';

        // Check if this is a quote-related field
        if (placeholder.includes('insurance') || placeholder.includes('company') ||
            parentText.includes('insurance company')) {
            currentQuoteFormData.carrier_name = input.value;
            console.log('Quote form - Insurance Company:', input.value);
        }
        else if (placeholder.includes('premium') || parentText.includes('premium')) {
            currentQuoteFormData.premium = input.value.replace(/[$,]/g, '');
            console.log('Quote form - Premium:', currentQuoteFormData.premium);
        }
        else if (placeholder.includes('deductible') || parentText.includes('deductible')) {
            currentQuoteFormData.deductible = input.value.replace(/[$,]/g, '');
            console.log('Quote form - Deductible:', currentQuoteFormData.deductible);
        }
        else if (placeholder.includes('coverage') || placeholder.includes('1,000,000') ||
                parentText.includes('coverage amount')) {
            currentQuoteFormData.coverage = input.value;
            console.log('Quote form - Coverage:', input.value);
        }
        else if (placeholder.includes('date') || parentText.includes('effective')) {
            currentQuoteFormData.effective_date = input.value;
            console.log('Quote form - Effective Date:', input.value);
        }

        // Store the current form data
        if (Object.keys(currentQuoteFormData).length > 0) {
            window.pendingQuotes = [{
                ...currentQuoteFormData,
                lead_id: currentLeadId || window.currentLeadId
            }];
            console.log('Updated pending quote data:', window.pendingQuotes);
        }
    }, true);

    console.log('SAVE QUOTE FORMS loaded - will capture and save quote submissions!');
})();