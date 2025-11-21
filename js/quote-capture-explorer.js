// QUOTE CAPTURE EXPLORER - Deep inspection of DOM structure
(function() {
    'use strict';

    console.log('QUOTE CAPTURE EXPLORER loading...');

    let currentLeadId = null;
    let saveButtonAdded = false;

    // Add save button
    function addSaveButton() {
        if (saveButtonAdded) return;

        // Remove ALL existing save buttons to prevent duplicates
        document.querySelectorAll('#quote-save-btn, #final-save-btn, #unified-save-btn').forEach(btn => btn.remove());

        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = buttons.find(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (!targetButton) return;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'quote-save-btn';
        saveBtn.innerHTML = 'Save';
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

        targetButton.parentElement.insertBefore(saveBtn, targetButton);
        saveButtonAdded = true;
        console.log('Save button added');
    }

    // EXPLORER capture - maximum debugging
    function captureQuoteData() {
        console.log('=== QUOTE CAPTURE EXPLORER ===');
        console.log('Timestamp:', new Date().toISOString());
        const quotes = [];

        // 1. Check what quote-related elements exist
        console.log('\n📦 STEP 1: Checking quote-related elements');
        console.log('Quote cards total:', document.querySelectorAll('.quote-card').length);
        console.log('Quote cards (not saved):', document.querySelectorAll('.quote-card:not([data-saved="true"])').length);
        console.log('Quote cards (saved):', document.querySelectorAll('.quote-card[data-saved="true"]').length);
        console.log('Elements with "quote" in class:', document.querySelectorAll('[class*="quote"]').length);

        // 2. Find ALL visible inputs with values
        console.log('\n📝 STEP 2: All visible inputs with values');
        const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea, select');
        let visibleInputsWithValues = [];

        allInputs.forEach((input, idx) => {
            const value = input.value?.trim();
            if (!value) return;

            const rect = input.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            const style = window.getComputedStyle(input);
            const isDisplayed = style.display !== 'none' && style.visibility !== 'hidden';

            if (isVisible && isDisplayed) {
                visibleInputsWithValues.push({
                    index: idx,
                    element: input,
                    value: value,
                    type: input.type,
                    tag: input.tagName
                });
            }
        });

        console.log(`Found ${visibleInputsWithValues.length} visible inputs with values:`);
        visibleInputsWithValues.forEach(item => {
            // Find any associated label
            let label = '';

            // Check for label with 'for' attribute
            if (item.element.id) {
                const labelEl = document.querySelector(`label[for="${item.element.id}"]`);
                if (labelEl) label = labelEl.textContent.trim();
            }

            // Check for label in parent
            if (!label) {
                const parentLabel = item.element.parentElement?.querySelector('label');
                if (parentLabel) label = parentLabel.textContent.trim();
            }

            // Check for previous sibling label
            if (!label) {
                const prevEl = item.element.previousElementSibling;
                if (prevEl && prevEl.tagName === 'LABEL') {
                    label = prevEl.textContent.trim();
                }
            }

            // Get parent structure
            const parent1 = item.element.parentElement;
            const parent2 = parent1?.parentElement;
            const parent3 = parent2?.parentElement;

            console.log(`  Input #${item.index + 1}:`, {
                value: item.value.substring(0, 50) + (item.value.length > 50 ? '...' : ''),
                label: label || 'NO LABEL',
                placeholder: item.element.placeholder,
                id: item.element.id,
                name: item.element.name,
                className: item.element.className,
                parent1Class: parent1?.className || 'none',
                parent2Class: parent2?.className || 'none',
                parent3Class: parent3?.className || 'none',
                insideQuoteCard: !!item.element.closest('.quote-card'),
                insideModal: !!item.element.closest('.modal, .popup, [role="dialog"]')
            });
        });

        // 3. Check specifically for quote cards
        console.log('\n🎯 STEP 3: Checking quote cards specifically');
        const quoteCards = document.querySelectorAll('.quote-card');

        quoteCards.forEach((card, idx) => {
            const isSaved = card.getAttribute('data-saved') === 'true';
            console.log(`\nQuote Card ${idx + 1} (${isSaved ? 'SAVED' : 'NEW'}):`);

            if (!isSaved) {
                const inputs = card.querySelectorAll('input:not([type="file"]), textarea');
                console.log(`  Contains ${inputs.length} inputs`);

                const quoteData = {};

                inputs.forEach(input => {
                    const value = input.value?.trim();
                    if (!value) return;

                    // Find label
                    let labelText = '';
                    const label = card.querySelector(`label[for="${input.id}"]`) ||
                                 input.parentElement?.querySelector('label') ||
                                 input.previousElementSibling;

                    if (label && label.tagName === 'LABEL') {
                        labelText = label.textContent.trim();
                    }

                    console.log(`    Field: label="${labelText}", value="${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`);

                    // Check if this is transcript
                    if (value.includes('Agent:') || value.includes('Customer:') || value.length > 500) {
                        console.log('      ⚠️ TRANSCRIPT DETECTED - SKIPPING');
                        return;
                    }

                    // Map fields
                    const labelLower = labelText.toLowerCase();
                    if (labelLower.includes('insurance company')) {
                        quoteData.carrier_name = value;
                        console.log('      ✅ Mapped as Insurance Company');
                    } else if (labelLower.includes('premium')) {
                        quoteData.premium = value.replace(/[$,]/g, '');
                        console.log('      ✅ Mapped as Premium');
                    } else if (labelLower.includes('deductible')) {
                        quoteData.deductible = value.replace(/[$,]/g, '');
                        console.log('      ✅ Mapped as Deductible');
                    } else if (labelLower.includes('coverage')) {
                        quoteData.coverage = value;
                        console.log('      ✅ Mapped as Coverage');
                    } else if (labelLower.includes('notes')) {
                        quoteData.notes = value;
                        console.log('      ✅ Mapped as Notes');
                    } else {
                        console.log('      ❓ Could not map this field');
                    }
                });

                if (Object.keys(quoteData).length > 0) {
                    quotes.push(quoteData);
                    console.log('  📊 Quote data captured:', quoteData);
                } else {
                    console.log('  ❌ No valid data captured from this card');
                }
            }
        });

        // 4. Check for modals/popups
        console.log('\n🔍 STEP 4: Checking for modals/popups');
        const modals = document.querySelectorAll('.modal, .popup, [role="dialog"], .modal-content');

        modals.forEach((modal, idx) => {
            const style = window.getComputedStyle(modal);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden';

            console.log(`Modal ${idx + 1}: visible=${isVisible}, class="${modal.className}"`);

            if (isVisible) {
                const inputs = modal.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea');
                console.log(`  Contains ${inputs.length} inputs`);

                const modalQuoteData = {};
                inputs.forEach(input => {
                    const value = input.value?.trim();
                    if (!value) return;

                    console.log(`    Input: value="${value.substring(0, 30)}...", placeholder="${input.placeholder}"`);

                    // Skip transcript
                    if (value.includes('Agent:') || value.includes('Customer:')) {
                        console.log('      ⚠️ TRANSCRIPT - SKIPPING');
                        return;
                    }

                    // Try to identify field
                    const placeholder = (input.placeholder || '').toLowerCase();
                    if (placeholder.includes('insurance') || placeholder.includes('carrier')) {
                        modalQuoteData.carrier_name = value;
                        console.log('      → Mapped as carrier');
                    } else if (placeholder.includes('premium')) {
                        modalQuoteData.premium = value.replace(/[$,]/g, '');
                        console.log('      → Mapped as premium');
                    } else if (placeholder.includes('deductible')) {
                        modalQuoteData.deductible = value.replace(/[$,]/g, '');
                        console.log('      → Mapped as deductible');
                    } else if (placeholder.includes('coverage')) {
                        modalQuoteData.coverage = value;
                        console.log('      → Mapped as coverage');
                    }
                });

                if (Object.keys(modalQuoteData).length > 0) {
                    quotes.push(modalQuoteData);
                    console.log('  📊 Modal quote captured:', modalQuoteData);
                }
            }
        });

        // 5. Last resort - look for any container with quote fields
        if (quotes.length === 0) {
            console.log('\n🔧 STEP 5: Last resort - searching for quote field patterns');

            // Look for any container that has multiple inputs that look like quote fields
            const containers = document.querySelectorAll('div, section, article, form');

            containers.forEach(container => {
                const inputs = container.querySelectorAll('input:not([type="hidden"]):not([type="file"])');
                if (inputs.length < 2 || inputs.length > 10) return; // Skip if too few or too many

                let hasQuoteFields = false;
                const containerText = container.textContent.toLowerCase();

                // Check if container mentions quote-related terms
                if (containerText.includes('insurance company') ||
                    containerText.includes('premium') ||
                    containerText.includes('deductible') ||
                    containerText.includes('coverage amount')) {
                    hasQuoteFields = true;
                }

                if (hasQuoteFields) {
                    console.log(`  Found potential quote container: ${container.className || container.tagName}`);

                    const containerQuoteData = {};
                    inputs.forEach(input => {
                        const value = input.value?.trim();
                        if (!value || value.includes('Agent:') || value.includes('Customer:')) return;

                        // Get surrounding text
                        const parent = input.parentElement;
                        const parentText = parent?.textContent?.toLowerCase() || '';

                        if (!containerQuoteData.carrier_name && parentText.includes('insurance company')) {
                            containerQuoteData.carrier_name = value;
                            console.log(`    Found carrier: ${value}`);
                        } else if (!containerQuoteData.premium && parentText.includes('premium')) {
                            containerQuoteData.premium = value.replace(/[$,]/g, '');
                            console.log(`    Found premium: ${value}`);
                        } else if (!containerQuoteData.deductible && parentText.includes('deductible')) {
                            containerQuoteData.deductible = value.replace(/[$,]/g, '');
                            console.log(`    Found deductible: ${value}`);
                        } else if (!containerQuoteData.coverage && parentText.includes('coverage')) {
                            containerQuoteData.coverage = value;
                            console.log(`    Found coverage: ${value}`);
                        }
                    });

                    if (Object.keys(containerQuoteData).length > 0) {
                        quotes.push(containerQuoteData);
                        console.log('  📊 Container quote captured:', containerQuoteData);
                        break; // Stop after finding first valid container
                    }
                }
            });
        }

        console.log('\n=== EXPLORATION COMPLETE ===');
        console.log(`Total quotes captured: ${quotes.length}`);
        if (quotes.length > 0) {
            console.log('Final quotes:', quotes);
        } else {
            console.log('❌ NO QUOTES CAPTURED - Check the debug output above');
            console.log('Look for inputs that have values but aren\'t being recognized as quote fields');
        }

        return quotes;
    }

    // Save quotes
    async function saveQuotes() {
        console.log('=== SAVING QUOTES (EXPLORER) ===');

        let leadId = currentLeadId || window.currentLeadId || '88571';
        console.log('Lead ID:', leadId);

        const quotes = captureQuoteData();

        if (quotes.length === 0) {
            console.error('No quotes captured!');
            alert(`No quote data found.

Please check the browser console (F12 > Console) for detailed debug output.
Look for "STEP 2" to see all inputs with values.
The system should show exactly what it's finding on the page.`);
            return;
        }

        const saveBtn = document.getElementById('quote-save-btn');
        const originalText = saveBtn?.innerHTML;
        if (saveBtn) {
            saveBtn.innerHTML = 'Saving...';
            saveBtn.disabled = true;
        }

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            let successCount = 0;

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
                        effective_date: new Date().toISOString().split('T')[0],
                        notes: quote.notes || ''
                    },
                    status: 'quoted',
                    submitted_date: new Date().toISOString()
                };

                const response = await fetch(`${apiUrl}/api/quote-submissions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quotePayload)
                });

                if (response.ok) {
                    successCount++;
                    console.log('Quote saved successfully');
                }
            }

            if (saveBtn) {
                saveBtn.innerHTML = 'Saved!';
                saveBtn.style.background = '#059669';
            }

            setTimeout(() => {
                if (window.loadAndDisplayQuotes) {
                    window.loadAndDisplayQuotes(leadId);
                }
                if (saveBtn) {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.disabled = false;
                }
            }, 1500);

            if (successCount > 0) {
                alert(`${successCount} quote(s) saved successfully!`);
            }

        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving quotes: ' + error.message);
            if (saveBtn) {
                saveBtn.innerHTML = 'Save';
                saveBtn.disabled = false;
            }
        }
    }

    // Initialize - more aggressive button checking
    setInterval(() => {
        // Always try to add the save button if it's missing
        if (!document.getElementById('quote-save-btn')) {
            const hasQuoteButtons = Array.from(document.querySelectorAll('button')).some(btn => {
                const text = btn.textContent.trim();
                return text.includes('Quote Application') ||
                       text.includes('Add Quote') ||
                       text.includes('Quote') ||
                       text === '+ Add Quote';
            });

            if (hasQuoteButtons) {
                console.log('Quote button found, adding Save button...');
                saveButtonAdded = false;
                addSaveButton();
            }
        }
    }, 500);

    // Track lead ID
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalShow) {
            originalShow.apply(this, arguments);
        }
    };

    // Make function global for debugging
    window.exploreQuotes = captureQuoteData;

    console.log('QUOTE CAPTURE EXPLORER loaded - use exploreQuotes() in console to test');
    console.log('This version provides maximum debugging output');
})();