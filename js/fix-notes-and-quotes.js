// FIX NOTES AND QUOTES - Properly saves notes and quote submissions
(function() {
    'use strict';

    console.log('FIX NOTES AND QUOTES loading...');

    let currentLeadId = null;
    let saveButtonAdded = false;

    // Function to add save button
    function addSaveButton() {
        if (saveButtonAdded) return;

        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = null;

        for (let btn of buttons) {
            if (btn.textContent.includes('Quote Application') ||
                btn.textContent.includes('Add Quote')) {
                targetButton = btn;
                break;
            }
        }

        if (!targetButton) return;

        const parent = targetButton.parentElement;

        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.id = 'fixed-save-btn';
        saveBtn.innerHTML = '💾 Save All Changes';
        saveBtn.className = targetButton.className || '';
        saveBtn.style.cssText = `
            background: #10b981 !important;
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
            saveEverything();
        };

        parent.insertBefore(saveBtn, targetButton);
        saveButtonAdded = true;
        console.log('Save button added');
    }

    // Main save function
    async function saveEverything() {
        console.log('=== SAVING EVERYTHING ===');

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
        const quoteSubmissions = [];

        // STEP 1: Collect basic lead fields
        document.querySelectorAll('input, select').forEach(element => {
            if (element.type === 'button' || element.type === 'submit') return;

            const value = element.value;
            if (!value) return;

            const onchange = element.getAttribute('onchange') || '';
            if (onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([\w_]+)['"]/);
                if (match) {
                    leadData[match[1]] = value;
                    console.log(`Field ${match[1]}: ${value}`);
                }
            }
        });

        // STEP 2: Find and save ONLY the Notes field (not transcript)
        console.log('Looking for Notes section...');

        // Find the Notes header
        const headers = Array.from(document.querySelectorAll('h3, h4, h2'));
        let notesSection = null;
        let transcriptSection = null;

        headers.forEach(header => {
            const text = header.textContent.trim();
            if (text === 'Notes' || text.includes('Notes')) {
                notesSection = header;
                console.log('Found Notes section');
            }
            if (text.includes('Call Transcript') || text.includes('Transcript')) {
                transcriptSection = header;
                console.log('Found Call Transcript section');
            }
        });

        // Get the notes textarea - it should be after Notes header but before Call Transcript
        if (notesSection) {
            let nextElement = notesSection.nextElementSibling;
            while (nextElement) {
                // Stop if we hit the transcript section
                if (nextElement === transcriptSection) break;

                if (nextElement.tagName === 'TEXTAREA') {
                    leadData.notes = nextElement.value;
                    console.log('Found Notes textarea with value:', nextElement.value);
                    break;
                }

                // Also check children
                const textarea = nextElement.querySelector('textarea');
                if (textarea) {
                    leadData.notes = textarea.value;
                    console.log('Found Notes textarea in child with value:', textarea.value);
                    break;
                }

                nextElement = nextElement.nextElementSibling;
            }
        }

        // STEP 3: Collect Quote Submissions
        console.log('Looking for Quote Submissions...');

        // Find quote submission container
        const quoteContainer = document.getElementById('quote-submissions-container') ||
                              document.querySelector('[id*="quote"]') ||
                              document.querySelector('.quote-submissions');

        if (quoteContainer) {
            console.log('Found quote container');

            // Look for quote cards or items
            const quoteElements = quoteContainer.querySelectorAll('.quote-card, .quote-item, [class*="quote"]');

            quoteElements.forEach(element => {
                const quoteData = {};

                // Extract quote data from the element
                const textContent = element.textContent;

                // Try to extract carrier name
                const carrierMatch = textContent.match(/Carrier:\s*([^\n]+)/);
                if (carrierMatch) quoteData.carrier_name = carrierMatch[1].trim();

                // Try to extract premium
                const premiumMatch = textContent.match(/Premium:\s*\$?([\d,]+)/);
                if (premiumMatch) quoteData.premium = premiumMatch[1].replace(',', '');

                // Try to extract effective date
                const dateMatch = textContent.match(/Effective Date:\s*([^\n]+)/);
                if (dateMatch) quoteData.effective_date = dateMatch[1].trim();

                // Try to extract coverage
                const coverageMatch = textContent.match(/Coverage:\s*([^\n]+)/);
                if (coverageMatch) quoteData.coverage = coverageMatch[1].trim();

                if (Object.keys(quoteData).length > 0) {
                    quoteData.lead_id = leadId;
                    quoteSubmissions.push(quoteData);
                    console.log('Found quote submission:', quoteData);
                }
            });
        }

        // Also check if there's quote data stored in window
        if (window.quoteSubmissions && Array.isArray(window.quoteSubmissions)) {
            window.quoteSubmissions.forEach(quote => {
                if (quote.lead_id === leadId) {
                    quoteSubmissions.push(quote);
                    console.log('Found quote in window:', quote);
                }
            });
        }

        // STEP 4: Map field names properly
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

        // Apply mappings
        const finalData = {};
        Object.keys(leadData).forEach(key => {
            const mappedKey = fieldMappings[key] || key;
            finalData[mappedKey] = leadData[key];
        });

        console.log('Final lead data to save:', finalData);
        console.log('Quote submissions to save:', quoteSubmissions);

        // Update button
        const saveBtn = document.getElementById('fixed-save-btn');
        const originalText = saveBtn?.innerHTML;
        if (saveBtn) {
            saveBtn.innerHTML = '⏳ Saving...';
            saveBtn.disabled = true;
        }

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            // SAVE LEAD DATA
            if (Object.keys(finalData).length > 0) {
                const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(finalData)
                });

                const result = await response.json();
                console.log('Lead save response:', result);

                if (!response.ok) {
                    throw new Error('Failed to save lead data');
                }
            }

            // SAVE QUOTE SUBMISSIONS
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

                    const quoteResult = await quoteResponse.json();
                    console.log('Quote save response:', quoteResult);
                } catch (error) {
                    console.error('Error saving quote:', error);
                }
            }

            // Update localStorage
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lead = leads.find(l => String(l.id) === String(leadId));
            if (lead) {
                Object.assign(lead, finalData);
                lead.name = finalData.company_name || lead.name;
                lead.contact = finalData.contact_name || lead.contact;
                lead.notes = finalData.notes || lead.notes;

                // Store quote submissions
                lead.quoteSubmissions = quoteSubmissions;

                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));
            }

            if (saveBtn) {
                saveBtn.innerHTML = '✅ All Saved!';
                saveBtn.style.background = '#10b981';
            }

            if (window.showNotification) {
                showNotification('All changes and quotes saved!', 'success');
            } else {
                alert('All changes and quotes saved successfully!');
            }

            setTimeout(() => {
                if (saveBtn) {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }
            }, 3000);

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

    // Load quote submissions when profile opens
    async function loadQuoteSubmissions(leadId) {
        console.log('Loading quote submissions for lead:', leadId);

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            const response = await fetch(`${apiUrl}/api/quote-submissions?lead_id=${leadId}`);

            if (response.ok) {
                const quotes = await response.json();
                console.log('Loaded quotes from server:', quotes);

                // Store in window for later use
                window.quoteSubmissions = quotes;

                // Display them if there's a container
                const container = document.getElementById('quote-submissions-container');
                if (container && quotes.length > 0) {
                    container.innerHTML = '';
                    quotes.forEach(quote => {
                        const quoteCard = document.createElement('div');
                        quoteCard.className = 'quote-card';
                        quoteCard.style.cssText = 'border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px;';
                        quoteCard.innerHTML = `
                            <div><strong>Carrier:</strong> ${quote.carrier_name || 'N/A'}</div>
                            <div><strong>Premium:</strong> $${quote.premium || 'N/A'}</div>
                            <div><strong>Effective Date:</strong> ${quote.effective_date || 'N/A'}</div>
                            <div><strong>Coverage:</strong> ${quote.coverage || 'N/A'}</div>
                        `;
                        container.appendChild(quoteCard);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading quotes:', error);
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

        if (hasQuoteButtons && !document.getElementById('fixed-save-btn')) {
            saveButtonAdded = false;
            addSaveButton();
        }
    }, 500);

    // Intercept profile functions
    const originalView = window.viewLead;
    window.viewLead = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalView) {
            originalView.apply(this, arguments);
        }

        setTimeout(() => {
            addSaveButton();
            loadQuoteSubmissions(leadId);
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
            addSaveButton();
            loadQuoteSubmissions(leadId);
        }, 500);
    };

    // Track lead ID
    window.updateLeadField = function(leadId, field, value) {
        console.log(`Field changed: ${field} = ${value}`);
        currentLeadId = leadId;
        window.currentLeadId = leadId;
    };

    console.log('FIX NOTES AND QUOTES loaded!');
})();