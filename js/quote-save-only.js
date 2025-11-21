// QUOTE SAVE ONLY - Focused on saving quote submissions
(function() {
    'use strict';

    console.log('QUOTE SAVE ONLY loading...');

    let currentLeadId = null;
    let saveButtonAdded = false;

    // Add save button
    function addSaveButton() {
        if (saveButtonAdded) return;

        // Remove any existing save buttons
        document.querySelectorAll('#final-save-btn, #quote-save-btn, #unified-save-btn').forEach(btn => btn.remove());

        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = buttons.find(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (!targetButton) return;

        const parent = targetButton.parentElement;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'quote-save-btn';
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
            saveQuotes();
        };

        parent.insertBefore(saveBtn, targetButton);
        saveButtonAdded = true;
        console.log('Save button added');
    }

    // Capture quote data from the form
    function captureQuoteData() {
        console.log('=== CAPTURING QUOTE DATA ===');
        const quotes = [];
        const quoteData = {};

        // Debug: Show ALL inputs on the page with values
        console.log('ALL INPUTS WITH VALUES:');
        document.querySelectorAll('input, textarea, select').forEach((input, index) => {
            if (input.value && input.value.trim() !== '') {
                console.log(`Input ${index}:`, {
                    tag: input.tagName,
                    type: input.type,
                    id: input.id,
                    name: input.name,
                    placeholder: input.placeholder,
                    value: input.value,
                    className: input.className
                });
            }
        });

        // Look specifically for quote form inputs with specific placeholders
        document.querySelectorAll('input, textarea, select').forEach(input => {
            const value = input.value?.trim();
            if (!value) return;

            const placeholder = (input.placeholder || '').toLowerCase();

            console.log(`Checking input: placeholder="${placeholder}", value="${value}"`);

            // Look for exact placeholder matches first (most reliable)
            if (placeholder === '0.00' && input.type === 'number') {
                // This could be premium or deductible, check which one
                const prevText = input.previousElementSibling?.textContent?.toLowerCase() || '';
                const parentText = input.parentElement?.textContent?.toLowerCase() || '';

                if (prevText.includes('premium') || parentText.includes('premium')) {
                    quoteData.premium = value.replace(/[$,]/g, '');
                    console.log('  ✓ Found premium (by 0.00 placeholder):', quoteData.premium);
                } else if (prevText.includes('deductible') || parentText.includes('deductible')) {
                    quoteData.deductible = value.replace(/[$,]/g, '');
                    console.log('  ✓ Found deductible (by 0.00 placeholder):', quoteData.deductible);
                }
            }
            // Coverage amount field
            else if (placeholder.includes('1,000,000') || placeholder.includes('$1,000,000')) {
                quoteData.coverage = value;
                console.log('  ✓ Found coverage:', value);
            }
            // Look for text inputs that might be insurance company
            else if (input.type === 'text' && value.length > 3 &&
                     (value.toLowerCase().includes('insurance') ||
                      value.toLowerCase().includes('group') ||
                      value.toLowerCase().includes('mutual') ||
                      value.toLowerCase().includes('general') ||
                      value.toLowerCase().includes('vanguard'))) {
                quoteData.carrier_name = value;
                console.log('  ✓ Found carrier_name (by company pattern):', value);
            }
            // Effective date
            else if (input.type === 'date') {
                quoteData.effective_date = value;
                console.log('  ✓ Found effective_date:', value);
            }
        });

        // If we didn't find premium/deductible by placeholder, look by value pattern
        if (!quoteData.premium || !quoteData.deductible) {
            document.querySelectorAll('input[type="number"]').forEach(input => {
                const value = input.value?.trim();
                if (!value || value === '0' || value === '0.00') return;

                const numValue = parseFloat(value.replace(/[$,]/g, ''));

                // Premium is usually higher than deductible
                if (numValue >= 1000 && !quoteData.premium) {
                    quoteData.premium = value.replace(/[$,]/g, '');
                    console.log('  ✓ Found premium (by value pattern):', quoteData.premium);
                } else if (numValue > 0 && numValue < 10000 && !quoteData.deductible) {
                    quoteData.deductible = value.replace(/[$,]/g, '');
                    console.log('  ✓ Found deductible (by value pattern):', quoteData.deductible);
                }
            });
        }

        // If we found any quote-related data, add it
        if (Object.keys(quoteData).length > 0) {
            quotes.push(quoteData);
            console.log('Quote data captured:', quoteData);
        } else {
            console.log('❌ No quote data found!');
        }

        return quotes;
    }

    // Save quote data
    async function saveQuotes() {
        console.log('=== SAVING QUOTES ===');

        // Get lead ID from current context
        let leadId = currentLeadId || window.currentLeadId;

        // Try to find it from the page
        if (!leadId) {
            // Look for it in any onchange attribute
            const inputWithLeadId = document.querySelector('[onchange*="updateLeadField"]');
            if (inputWithLeadId) {
                const match = inputWithLeadId.getAttribute('onchange').match(/(\d+)/);
                if (match) leadId = match[1];
            }
        }

        // Default to 88571 if still not found
        if (!leadId) {
            leadId = '88571';
            console.log('Using default lead ID: 88571');
        }

        console.log('Lead ID:', leadId);

        // Capture current quote data
        const quotes = captureQuoteData();

        // Also check if there are pending quotes
        if (window.pendingQuotes && window.pendingQuotes.length > 0) {
            quotes.push(...window.pendingQuotes);
            window.pendingQuotes = [];
        }

        if (quotes.length === 0) {
            alert('Please fill in the quote form before saving');
            return;
        }

        // Update button
        const saveBtn = document.getElementById('quote-save-btn');
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

            let successCount = 0;

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
                    const response = await fetch(`${apiUrl}/api/quote-submissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(quotePayload)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('Quote saved:', result);
                        successCount++;
                    } else {
                        const errorText = await response.text();
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
                if (!lead.quoteSubmissions) lead.quoteSubmissions = [];
                lead.quoteSubmissions.push(...quotes);
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log('Quotes added to localStorage');
            }

            if (successCount > 0) {
                if (saveBtn) {
                    saveBtn.innerHTML = 'Saved!';
                    saveBtn.style.background = '#059669';
                }

                if (window.showNotification) {
                    showNotification(`${successCount} quote(s) saved successfully!`, 'success');
                } else {
                    alert(`${successCount} quote(s) saved successfully!`);
                }

                // Clear the form inputs after successful save
                const modal = document.querySelector('.modal-content, .quote-modal, [class*="quote"]');
                if (modal) {
                    modal.querySelectorAll('input, textarea').forEach(input => {
                        if (input.type !== 'button' && input.type !== 'submit') {
                            input.value = '';
                        }
                    });
                }
            } else {
                throw new Error('Failed to save quotes');
            }

            setTimeout(() => {
                if (saveBtn) {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.disabled = false;
                }
            }, 3000);

        } catch (error) {
            console.error('Save error:', error);
            alert(`Error saving quotes: ${error.message}`);

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

    // Monitor for quote form inputs - capture as user types
    document.addEventListener('input', function(e) {
        const input = e.target;
        const placeholder = (input.placeholder || '').toLowerCase();

        // If this looks like a quote field, capture the form data
        if (placeholder.includes('insurance') || placeholder.includes('premium') ||
            placeholder.includes('deductible') || placeholder.includes('coverage') ||
            placeholder.includes('carrier')) {

            console.log('Quote field updated, capturing form...');

            // Delay to let user finish typing
            setTimeout(() => {
                const quotes = captureQuoteData();
                if (quotes.length > 0) {
                    window.pendingQuotes = quotes;
                    console.log('Pending quotes updated:', quotes);
                }
            }, 500);
        }
    }, true);

    // Clean up duplicates
    setInterval(() => {
        document.querySelectorAll('#final-save-btn, #unified-save-btn').forEach(btn => btn.remove());

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
    }, 500);

    // Track when lead profile opens
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

    console.log('QUOTE SAVE ONLY loaded - focused on saving quotes!');
})();