// QUOTE CAPTURE SIMPLE DIRECT - Just find and save the quote data
(function() {
    'use strict';

    console.log('QUOTE CAPTURE SIMPLE DIRECT loading...');

    let currentLeadId = null;

    // Add save button
    function addSaveButton() {
        if (document.getElementById('quote-save-btn')) return;

        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = buttons.find(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (!targetButton) return;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'quote-save-btn';
        saveBtn.innerHTML = 'Save Quote';
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
            captureAndSave();
        };

        targetButton.parentElement.insertBefore(saveBtn, targetButton);
        console.log('Save button added');
    }

    // SIMPLE capture - just get the data
    function captureAndSave() {
        console.log('=== SIMPLE DIRECT CAPTURE ===');

        // Find ALL visible inputs
        const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea');
        const visibleInputs = [];

        allInputs.forEach(input => {
            const rect = input.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            const value = input.value?.trim();

            if (isVisible && value && value.length > 0) {
                visibleInputs.push({
                    element: input,
                    value: value
                });
            }
        });

        console.log(`Found ${visibleInputs.length} visible inputs with values`);

        // Build quote data from ANY inputs that look right
        const quoteData = {
            carrier_name: null,
            premium: null,
            deductible: null,
            coverage: null,
            notes: null
        };

        // Go through each input and try to categorize it
        visibleInputs.forEach((item, index) => {
            const value = item.value;
            console.log(`Input ${index + 1}: "${value.substring(0, 50)}"`);

            // Skip if it's transcript (has Agent: or Customer: or is very long)
            if (value.includes('Agent:') || value.includes('Customer:') || value.length > 500) {
                console.log('  → Skipping (looks like transcript)');
                return;
            }

            // Is it a number?
            const numValue = parseFloat(value.replace(/[$,]/g, ''));
            const isNumber = !isNaN(numValue);

            // Try to categorize based on value characteristics
            if (!quoteData.carrier_name && !isNumber && value.length < 100 && value.length > 1) {
                // First non-numeric short value is probably carrier name
                quoteData.carrier_name = value;
                console.log('  → Captured as Carrier Name');
            }
            else if (!quoteData.premium && isNumber && numValue >= 100) {
                // Large number is probably premium
                quoteData.premium = numValue.toString();
                console.log('  → Captured as Premium');
            }
            else if (!quoteData.deductible && isNumber && numValue < 100) {
                // Small number is probably deductible
                quoteData.deductible = numValue.toString();
                console.log('  → Captured as Deductible');
            }
            else if (!quoteData.coverage && (value.includes('$') || value.includes(',000'))) {
                // Value with $ or ,000 is probably coverage
                quoteData.coverage = value;
                console.log('  → Captured as Coverage');
            }
            else if (!quoteData.notes && item.element.tagName === 'TEXTAREA' && value.length < 500) {
                // Textarea under 500 chars is probably notes
                quoteData.notes = value;
                console.log('  → Captured as Notes');
            }
        });

        // Check if we got anything useful
        if (!quoteData.carrier_name && !quoteData.premium) {
            console.error('No quote data captured!');
            alert('Could not find quote data. Make sure you filled in at least the carrier name or premium amount.');
            return;
        }

        console.log('Quote data captured:', quoteData);

        // Save it
        saveQuoteNow(quoteData);
    }

    // Direct save function
    async function saveQuoteNow(quoteData) {
        console.log('Saving quote...', quoteData);

        const leadId = currentLeadId || window.currentLeadId || '88571';
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;

        const saveBtn = document.getElementById('quote-save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = 'Saving...';
            saveBtn.disabled = true;
        }

        try {
            const quotePayload = {
                lead_id: leadId,
                application_id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                form_data: {
                    carrier_name: quoteData.carrier_name || 'Unknown Carrier',
                    premium: quoteData.premium || '0',
                    deductible: quoteData.deductible || '0',
                    coverage: quoteData.coverage || '',
                    effective_date: new Date().toISOString().split('T')[0],
                    notes: quoteData.notes || ''
                },
                status: 'quoted',
                submitted_date: new Date().toISOString()
            };

            console.log('Sending to API:', quotePayload);

            const response = await fetch(`${apiUrl}/api/quote-submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quotePayload)
            });

            if (response.ok) {
                console.log('✅ Quote saved successfully!');
                alert('Quote saved successfully!');

                if (saveBtn) {
                    saveBtn.innerHTML = 'Saved!';
                    saveBtn.style.background = '#059669';
                }

                // Clear the form
                const newQuoteCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
                newQuoteCards.forEach(card => {
                    card.setAttribute('data-saved', 'true');
                });

                // Reload quotes
                setTimeout(() => {
                    if (window.loadAndDisplayQuotes) {
                        window.loadAndDisplayQuotes(leadId);
                    }
                    if (saveBtn) {
                        saveBtn.innerHTML = 'Save Quote';
                        saveBtn.disabled = false;
                    }
                }, 1500);

            } else {
                const error = await response.text();
                console.error('Save failed:', error);
                alert('Failed to save quote: ' + error);
                if (saveBtn) {
                    saveBtn.innerHTML = 'Save Quote';
                    saveBtn.disabled = false;
                }
            }

        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving quote: ' + error.message);
            if (saveBtn) {
                saveBtn.innerHTML = 'Save Quote';
                saveBtn.disabled = false;
            }
        }
    }

    // Initialize
    setInterval(() => {
        addSaveButton();
    }, 500);

    // Track lead ID
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        if (originalShow) {
            originalShow.apply(this, arguments);
        }
    };

    // Global functions
    window.captureAndSaveQuote = captureAndSave;
    window.simpleQuoteCapture = captureAndSave;

    console.log('QUOTE CAPTURE SIMPLE DIRECT loaded');
    console.log('Use captureAndSaveQuote() to manually trigger');
})();