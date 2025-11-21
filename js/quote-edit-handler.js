// QUOTE EDIT HANDLER - Handles editing and updating existing quotes
(function() {
    'use strict';

    console.log('QUOTE EDIT HANDLER loading...');

    // Track which quotes have been edited
    const editedQuotes = new Map();

    // Monitor input changes in displayed quote cards
    document.addEventListener('input', function(e) {
        const input = e.target;
        const quoteCard = input.closest('.quote-card[data-saved="true"]');

        if (!quoteCard) return;

        const quoteId = quoteCard.getAttribute('data-quote-id');
        if (!quoteId) return;

        console.log(`Quote ${quoteId} edited`);

        // Get current values from the card
        const currentData = {
            id: quoteId,
            carrier_name: '',
            premium: '',
            deductible: '',
            coverage: '',
            notes: ''
        };

        // Find all inputs in this quote card
        const inputs = quoteCard.querySelectorAll('input, textarea');
        inputs.forEach(inp => {
            const label = inp.parentElement?.querySelector('label')?.textContent?.toLowerCase() || '';
            const value = inp.value?.trim() || '';

            if (label.includes('insurance company')) {
                currentData.carrier_name = value;
            } else if (label.includes('premium')) {
                currentData.premium = value.replace(/[$,]/g, '');
            } else if (label.includes('deductible')) {
                currentData.deductible = value.replace(/[$,]/g, '');
            } else if (label.includes('coverage')) {
                currentData.coverage = value;
            } else if (inp.tagName === 'TEXTAREA' || label.includes('notes')) {
                currentData.notes = value;
            }
        });

        // Store the edited data
        editedQuotes.set(quoteId, currentData);
        console.log('Edited quote data:', currentData);

        // Add a visual indicator that quote has been edited
        if (!quoteCard.querySelector('.edit-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'edit-indicator';
            indicator.style.cssText = `
                background: #fbbf24;
                color: #92400e;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                margin-left: 10px;
                font-weight: 600;
            `;
            indicator.textContent = 'Modified';

            const header = quoteCard.querySelector('h3, h4');
            if (header) {
                header.appendChild(indicator);
            }
        }
    }, true);

    // Add update button to save edited quotes
    function addUpdateButton() {
        // Check if button already exists
        if (document.getElementById('update-quotes-btn')) return;

        // Find the save button
        const saveBtn = document.getElementById('quote-save-btn');
        if (!saveBtn) return;

        const updateBtn = document.createElement('button');
        updateBtn.id = 'update-quotes-btn';
        updateBtn.innerHTML = 'Update Edited';
        updateBtn.style.cssText = `
            background: #3b82f6 !important;
            color: white !important;
            margin-right: 10px !important;
            font-weight: bold !important;
            padding: 10px 20px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 16px !important;
            display: none;
        `;

        updateBtn.onclick = async function(e) {
            e.preventDefault();
            await updateEditedQuotes();
        };

        saveBtn.parentElement.insertBefore(updateBtn, saveBtn.nextSibling);
    }

    // Update edited quotes in database
    async function updateEditedQuotes() {
        if (editedQuotes.size === 0) {
            alert('No quotes have been edited');
            return;
        }

        console.log('Updating edited quotes...');

        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;

        let successCount = 0;
        const updateBtn = document.getElementById('update-quotes-btn');

        if (updateBtn) {
            updateBtn.innerHTML = 'Updating...';
            updateBtn.disabled = true;
        }

        for (const [quoteId, quoteData] of editedQuotes) {
            try {
                // First delete the old quote
                const deleteResponse = await fetch(`${apiUrl}/api/quote-submissions/${quoteId}`, {
                    method: 'DELETE'
                });

                if (deleteResponse.ok) {
                    // Then create a new one with updated data
                    const leadId = window.currentLeadId || '88571';
                    const newQuotePayload = {
                        lead_id: leadId,
                        application_id: `quote_updated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        form_data: {
                            carrier_name: quoteData.carrier_name,
                            premium: quoteData.premium,
                            deductible: quoteData.deductible,
                            coverage: quoteData.coverage,
                            notes: quoteData.notes
                        },
                        status: 'quoted',
                        submitted_date: new Date().toISOString()
                    };

                    const createResponse = await fetch(`${apiUrl}/api/quote-submissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newQuotePayload)
                    });

                    if (createResponse.ok) {
                        successCount++;
                        console.log(`Quote ${quoteId} updated successfully`);

                        // Remove edit indicator
                        const card = document.querySelector(`[data-quote-id="${quoteId}"]`);
                        const indicator = card?.querySelector('.edit-indicator');
                        if (indicator) indicator.remove();
                    }
                }
            } catch (error) {
                console.error(`Error updating quote ${quoteId}:`, error);
            }
        }

        // Clear edited quotes map
        editedQuotes.clear();

        if (updateBtn) {
            updateBtn.innerHTML = `✓ ${successCount} Updated`;
            updateBtn.style.background = '#059669';

            setTimeout(() => {
                updateBtn.style.display = 'none';
                updateBtn.innerHTML = 'Update Edited';
                updateBtn.style.background = '#3b82f6';
                updateBtn.disabled = false;

                // Reload quotes
                if (window.loadAndDisplayQuotes) {
                    const leadId = window.currentLeadId || '88571';
                    window.loadAndDisplayQuotes(leadId);
                }
            }, 2000);
        }

        if (successCount > 0) {
            alert(`${successCount} quote(s) updated successfully!`);
        }
    }

    // Monitor for changes and show/hide update button
    setInterval(() => {
        // Add update button if needed
        if (!document.getElementById('update-quotes-btn') && document.getElementById('quote-save-btn')) {
            addUpdateButton();
        }

        // Show/hide update button based on edits
        const updateBtn = document.getElementById('update-quotes-btn');
        if (updateBtn) {
            updateBtn.style.display = editedQuotes.size > 0 ? 'inline-block' : 'none';
        }
    }, 500);

    // Clear edits when profile is closed/opened
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        editedQuotes.clear();
        if (originalShow) {
            originalShow.apply(this, arguments);
        }
    };

    console.log('QUOTE EDIT HANDLER loaded - edits will be tracked and can be updated');
})();