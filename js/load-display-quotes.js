// LOAD AND DISPLAY QUOTES - Loads saved quotes from database and displays them in the lead profile
(function() {
    'use strict';

    console.log('LOAD AND DISPLAY QUOTES loading...');

    // Function to load and display quotes
    async function loadAndDisplayQuotes(leadId) {
        console.log('Loading quotes for lead:', leadId);

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            const response = await fetch(`${apiUrl}/api/quote-submissions/${leadId}`);

            if (!response.ok) {
                console.error('Failed to load quotes:', response.status);
                return;
            }

            const response_data = await response.json();
            console.log('Loaded quotes from database:', response_data);

            // Extract the submissions array from the response
            const quotes = response_data.submissions || [];

            if (!quotes || quotes.length === 0) {
                console.log('No quotes found for this lead');
                return;
            }

            // Wait a bit for the profile to fully render
            setTimeout(() => {
                displayQuotes(quotes);
            }, 500);

        } catch (error) {
            console.error('Error loading quotes:', error);
        }
    }

    // Function to recreate quote cards exactly as the Add Quote button creates them
    function displayQuotes(quotes) {
        console.log('Recreating quote cards for saved quotes:', quotes);

        // Find the quote submissions container - this maintains the original layout
        let quotesDiv = document.getElementById('quote-submissions-container');

        if (!quotesDiv) {
            console.error('Could not find quote-submissions-container');
            return;
        }

        // IMPORTANT: Clear ALL existing cards to prevent duplicates
        const allExistingCards = quotesDiv.querySelectorAll('.quote-card');
        console.log(`Removing ${allExistingCards.length} existing quote cards`);
        allExistingCards.forEach(card => card.remove());

        // Add each saved quote as a card
        quotes.forEach((quote, index) => {
            console.log('Creating quote card for:', quote);

            // Parse form_data if it's a string
            let formData = quote.form_data;
            if (typeof formData === 'string') {
                try {
                    formData = JSON.parse(formData);
                } catch (e) {
                    console.error('Failed to parse form_data:', e);
                    formData = {};
                }
            }

            const carrier = formData.carrier_name || '';
            const premium = formData.premium || '0.00';
            const deductible = formData.deductible || '0.00';
            const coverage = formData.coverage || '';
            const notes = formData.notes || '';
            const submittedDate = quote.submitted_date ? new Date(quote.submitted_date).toLocaleDateString() : new Date().toLocaleDateString();

            // Check for uploaded file
            const hasFile = formData.quote_file_name || formData.quote_file_path || quote.quote_pdf_path;
            const fileName = formData.quote_file_name || formData.quote_file_original_name || '';
            let filePath = formData.quote_file_path || quote.quote_pdf_path || '';

            // Debug file information
            console.log(`Quote ${index + 1} file info:`, {
                hasFile: hasFile,
                fileName: fileName,
                filePath: filePath,
                quote_pdf_path: quote.quote_pdf_path,
                formData_file: formData.quote_file_name
            });

            // Convert file path to accessible URL
            if (filePath && filePath.includes('/var/www/vanguard/uploads/quotes/')) {
                const filename = filePath.split('/').pop();
                const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8897' : `http://${window.location.hostname}:8897`;
                filePath = `${apiUrl}/uploads/quotes/${filename}`;
                console.log(`Converted file path to URL: ${filePath}`);
            }

            // Create quote card matching the exact structure of Add Quote
            const quoteCard = document.createElement('div');
            quoteCard.className = 'quote-card';
            quoteCard.setAttribute('data-saved', 'true');
            quoteCard.setAttribute('data-quote-id', quote.id);
            quoteCard.style.cssText = `
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                background-color: #ffffff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            `;

            quoteCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Quote #${index + 1}</h3>
                    <button onclick="deleteQuoteSubmission('${quote.id}')" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 14px;">🗑️ Delete</button>
                </div>

                <div style="display: grid; gap: 12px;">
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Insurance Company:</label>
                        <input type="text" value="${carrier}" placeholder="Enter carrier name" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Premium ($):</label>
                            <input type="text" value="${premium}" placeholder="0.00" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Deductible ($):</label>
                            <input type="text" value="${deductible}" placeholder="0.00" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                        </div>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Coverage Amount ($):</label>
                        <input type="text" value="${coverage}" placeholder="e.g., $1,000,000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Quote File:</label>
                        ${hasFile ? `
                            <div style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">
                                📎 <a href="${filePath}" target="_blank" style="color: #3b82f6; text-decoration: underline;">
                                    ${fileName || 'View attached file'}
                                </a>
                                ${formData.quote_file_size ? `<span style="color: #6b7280; margin-left: 10px;">(${Math.round(formData.quote_file_size / 1024)} KB)</span>` : ''}
                            </div>
                        ` : `
                            <input type="file" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">No file attached</div>
                        `}
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Notes:</label>
                        <textarea placeholder="Add any notes about this quote..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; min-height: 60px; resize: vertical;">${notes}</textarea>
                    </div>

                    <div style="color: #6b7280; font-size: 14px;">
                        Submitted: ${submittedDate}
                    </div>
                </div>
            `;

            // Add the quote card to the container
            quotesDiv.appendChild(quoteCard);

            // Add delete functionality
            const deleteBtn = quoteCard.querySelector('button');
            deleteBtn.onclick = function() {
                if (confirm('Are you sure you want to delete this quote?')) {
                    quoteCard.remove();
                    // TODO: Also delete from database
                }
            };
        });

        // Update the quote count if needed
        window.loadedQuoteCount = quotes.length;
        console.log(`Recreated ${quotes.length} quote cards`);
    }

    // Intercept profile opening functions
    const originalView = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('viewLead called, will load quotes for:', leadId);

        if (originalView) {
            originalView.apply(this, arguments);
        }

        // Load quotes after profile renders - wait longer for profile to fully load
        setTimeout(() => {
            loadAndDisplayQuotes(leadId);
        }, 1500);
    };

    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        console.log('showLeadProfile called, will load quotes for:', leadId);

        if (originalShow) {
            originalShow.apply(this, arguments);
        }

        // Load quotes after profile renders - wait longer for profile to fully load
        setTimeout(() => {
            loadAndDisplayQuotes(leadId);
        }, 1500);
    };

    // Also intercept the Add Quote button to track new quotes
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' &&
            (e.target.textContent.includes('Add Quote') ||
             e.target.textContent.includes('+ Add Quote'))) {
            console.log('Add Quote clicked, will track new quote cards');

            // Mark any new cards as not saved yet
            setTimeout(() => {
                const newCards = document.querySelectorAll('.quote-card:not([data-saved])');
                newCards.forEach(card => {
                    card.setAttribute('data-saved', 'false');
                });
            }, 100);
        }
    }, true);

    // Also check if a profile is already open
    setTimeout(() => {
        const leadId = window.currentLeadId;
        if (leadId) {
            console.log('Lead profile already open, loading quotes for:', leadId);
            loadAndDisplayQuotes(leadId);
        }
    }, 2000);

    console.log('LOAD AND DISPLAY QUOTES loaded!');
})();