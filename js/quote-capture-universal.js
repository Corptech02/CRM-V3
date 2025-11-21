// QUOTE CAPTURE UNIVERSAL - Works with ANY form structure
(function() {
    'use strict';

    console.log('QUOTE CAPTURE UNIVERSAL loading...');

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
            universalCapture();
        };

        targetButton.parentElement.insertBefore(saveBtn, targetButton);
        console.log('Save button added');
    }

    // UNIVERSAL capture - finds quote data ANYWHERE
    function universalCapture() {
        console.log('=== UNIVERSAL QUOTE CAPTURE ===');
        console.log('This will find quote data anywhere on the page');

        // Strategy 1: Look in quote-submissions-container
        let container = document.getElementById('quote-submissions-container');
        let searchArea = container || document.body;

        console.log('Search area:', container ? 'quote-submissions-container' : 'entire page');

        // Find file inputs
        let fileInput = null;
        const fileInputs = searchArea.querySelectorAll('input[type="file"]');
        console.log(`Found ${fileInputs.length} file inputs`);

        // Get the first file input that has a file selected
        for (let input of fileInputs) {
            if (input.files && input.files.length > 0) {
                fileInput = input;
                console.log('Found file:', input.files[0].name);
                break;
            }
        }

        // If no file selected, get the first visible file input for reference
        if (!fileInput && fileInputs.length > 0) {
            fileInput = fileInputs[0];
            console.log('File input found but no file selected');
        }

        // Find ALL inputs that are visible and have values
        const allInputs = searchArea.querySelectorAll('input, textarea');
        const validInputs = [];

        allInputs.forEach((input, idx) => {
            // Skip hidden, file, checkbox, radio
            if (input.type === 'hidden' || input.type === 'file' ||
                input.type === 'checkbox' || input.type === 'radio') {
                return;
            }

            const value = input.value?.trim();
            if (!value || value === '') return;

            // Skip placeholder text
            if (value === 'Add any notes about this quote...' ||
                value === 'Enter carrier name' ||
                value === '0.00') {
                return;
            }

            // Check if visible
            const rect = input.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;

            if (isVisible) {
                validInputs.push({
                    element: input,
                    value: value,
                    index: idx
                });
            }
        });

        console.log(`Found ${validInputs.length} inputs with values`);

        // Now intelligently map them to quote fields
        const quote = {};
        const usedIndexes = new Set();

        // Pass 1: Find carrier name (first text that's not a number and not transcript)
        for (let i = 0; i < validInputs.length; i++) {
            const item = validInputs[i];
            const value = item.value;

            // Skip if transcript
            if (value.includes('Agent:') || value.includes('Customer:') || value.length > 200) {
                continue;
            }

            // Skip if it's a number
            if (!isNaN(value.replace(/[$,]/g, ''))) {
                continue;
            }

            // This is likely the carrier name
            quote.carrier_name = value;
            usedIndexes.add(i);
            console.log(`✓ Carrier Name: "${value}"`);
            break;
        }

        // Pass 2: Find numbers and categorize them
        const numbers = [];
        for (let i = 0; i < validInputs.length; i++) {
            if (usedIndexes.has(i)) continue;

            const item = validInputs[i];
            const value = item.value;

            // Skip transcript
            if (value.includes('Agent:') || value.includes('Customer:')) continue;

            const cleanValue = value.replace(/[$,]/g, '');
            const numValue = parseFloat(cleanValue);

            if (!isNaN(numValue) && numValue > 0) {
                numbers.push({
                    original: value,
                    clean: cleanValue,
                    numeric: numValue,
                    index: i
                });
            }
        }

        console.log(`Found ${numbers.length} numeric values`);

        // Sort numbers by size (largest first)
        numbers.sort((a, b) => b.numeric - a.numeric);

        // Assign numbers intelligently
        if (numbers.length > 0) {
            // Largest number is usually coverage or premium
            if (numbers[0].numeric > 10000) {
                quote.coverage = numbers[0].clean;
                console.log(`✓ Coverage: "${numbers[0].original}"`);
                usedIndexes.add(numbers[0].index);
            } else if (numbers[0].numeric > 1000) {
                quote.premium = numbers[0].clean;
                console.log(`✓ Premium: "${numbers[0].original}"`);
                usedIndexes.add(numbers[0].index);
            }

            // Second number
            if (numbers.length > 1 && !quote.premium) {
                quote.premium = numbers[1].clean;
                console.log(`✓ Premium: "${numbers[1].original}"`);
                usedIndexes.add(numbers[1].index);
            } else if (numbers.length > 1 && !quote.deductible) {
                quote.deductible = numbers[1].clean;
                console.log(`✓ Deductible: "${numbers[1].original}"`);
                usedIndexes.add(numbers[1].index);
            }

            // Third number
            if (numbers.length > 2 && !quote.deductible) {
                quote.deductible = numbers[2].clean;
                console.log(`✓ Deductible: "${numbers[2].original}"`);
                usedIndexes.add(numbers[2].index);
            }
        }

        // Pass 3: Find notes (textarea with reasonable length)
        for (let i = 0; i < validInputs.length; i++) {
            if (usedIndexes.has(i)) continue;

            const item = validInputs[i];
            if (item.element.tagName === 'TEXTAREA' && item.value.length < 500) {
                quote.notes = item.value;
                console.log(`✓ Notes: "${item.value.substring(0, 50)}..."`);
                break;
            }
        }

        // Validate we have something
        if (!quote.carrier_name && !quote.premium && !quote.deductible && !quote.coverage) {
            console.error('No quote data captured!');
            console.log('All inputs found:', validInputs.map(i => i.value));
            alert('Could not find any quote data. Please make sure you have filled in the quote fields with:\n- Insurance Company Name (text)\n- Premium (number)\n- Deductible (number)\n- Coverage (number)');
            return;
        }

        console.log('Final quote data:', quote);

        // Check if we have a file to upload
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            console.log(`File to upload: ${file.name} (${file.size} bytes)`);

            // Save quote with file
            saveQuoteWithFile(quote, file);
        } else {
            // Save without file
            saveQuote(quote);
        }
    }

    // Save quote with file upload
    async function saveQuoteWithFile(quoteData, file) {
        console.log('Saving quote with file...', quoteData, file.name);

        const leadId = currentLeadId || window.currentLeadId || '88571';
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;

        const saveBtn = document.getElementById('quote-save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = 'Uploading...';
            saveBtn.disabled = true;
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();

            // Add the file
            formData.append('file', file);

            // Add quote data as JSON
            const quotePayload = {
                lead_id: leadId,
                application_id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                form_data: {
                    carrier_name: quoteData.carrier_name || 'Unknown Carrier',
                    premium: quoteData.premium || '0',
                    deductible: quoteData.deductible || '0',
                    coverage: quoteData.coverage || '',
                    effective_date: new Date().toISOString().split('T')[0],
                    notes: quoteData.notes || '',
                    quote_file_name: file.name
                },
                status: 'quoted',
                submitted_date: new Date().toISOString()
            };

            formData.append('quote_data', JSON.stringify(quotePayload));

            console.log('Uploading file and quote data...');

            // Send with multipart/form-data
            const response = await fetch(`${apiUrl}/api/quote-submissions/with-file`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                console.log('✅ QUOTE AND FILE SAVED SUCCESSFULLY!');
                alert(`Quote saved successfully with file: ${file.name}`);
                handleSaveSuccess(saveBtn);
            } else {
                // If file upload endpoint doesn't exist, fall back to regular save
                console.log('File upload endpoint not found, saving without file...');
                saveQuote(quoteData);
            }

        } catch (error) {
            console.error('File upload error, trying without file:', error);
            // Fall back to saving without file
            saveQuote(quoteData);
        }
    }

    // Save the quote without file
    async function saveQuote(quoteData) {
        console.log('Saving quote without file...', quoteData);

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

            console.log('Sending:', quotePayload);

            const response = await fetch(`${apiUrl}/api/quote-submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quotePayload)
            });

            if (response.ok) {
                console.log('✅ QUOTE SAVED SUCCESSFULLY!');
                alert('Quote saved successfully!');
                handleSaveSuccess(saveBtn);
            } else {
                throw new Error(await response.text());
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

    // Handle successful save
    function handleSaveSuccess(saveBtn) {
        if (saveBtn) {
            saveBtn.innerHTML = 'Saved!';
            saveBtn.style.background = '#059669';
        }

        // Clear any new quote forms
        const newCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
        newCards.forEach(card => {
            // Clear inputs
            card.querySelectorAll('input[type="text"], input[type="file"], textarea').forEach(input => {
                if (input.type === 'file') {
                    input.value = null;
                } else {
                    input.value = '';
                }
            });
            card.setAttribute('data-saved', 'true');
        });

        // Reload quotes
        const leadId = currentLeadId || window.currentLeadId || '88571';
        setTimeout(() => {
            if (window.loadAndDisplayQuotes) {
                window.loadAndDisplayQuotes(leadId);
            }
            if (saveBtn) {
                saveBtn.innerHTML = 'Save Quote';
                saveBtn.disabled = false;
            }
        }, 1500);
    }

    // Initialize
    setInterval(addSaveButton, 500);

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
    window.captureAndSaveQuote = universalCapture;
    window.universalQuoteCapture = universalCapture;

    console.log('QUOTE CAPTURE UNIVERSAL loaded');
    console.log('This version will find quote data ANYWHERE');
    console.log('Test with: universalQuoteCapture()');
})();