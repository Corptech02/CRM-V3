/**
 * Fix for quote submission save functionality
 * Ensures quote cards are properly saved when added
 */

(function() {
    'use strict';
    
    console.log('Quote save fix loaded');

    // Function to save quote cards
    window.saveQuoteCard = async function() {
        console.log('saveQuoteCard called');
        
        // Find all unsaved quote cards
        const unsavedCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
        
        if (unsavedCards.length === 0) {
            console.log('No unsaved quote cards found');
            return;
        }
        
        const leadId = window.currentLeadId || 
                      document.querySelector('[data-lead-id]')?.getAttribute('data-lead-id') ||
                      new URLSearchParams(window.location.search).get('leadId');
                      
        if (!leadId) {
            console.error('No lead ID found!');
            alert('Please open a lead profile first');
            return;
        }
        
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;
        
        // Process each unsaved card
        for (const card of unsavedCards) {
            const inputs = card.querySelectorAll('input, select, textarea');
            const quoteData = {};
            
            // Gather data from card inputs
            inputs.forEach(input => {
                const name = input.name || input.id || input.placeholder?.toLowerCase().replace(' ', '_');
                if (name) {
                    quoteData[name] = input.value;
                }
            });
            
            // Ensure we have at least carrier or premium
            if (!quoteData.carrier_name && !quoteData.carrier && !quoteData.premium) {
                console.log('Skipping card with no data');
                continue;
            }
            
            // Create submission payload
            const payload = {
                lead_id: leadId,
                application_id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                form_data: {
                    carrier_name: quoteData.carrier_name || quoteData.carrier || 'Unknown',
                    premium: quoteData.premium || quoteData.monthly_premium || '0',
                    deductible: quoteData.deductible || '0',
                    coverage: quoteData.coverage || quoteData.liability || '',
                    effective_date: quoteData.effective_date || new Date().toISOString().split('T')[0],
                    notes: quoteData.notes || ''
                },
                status: 'quoted',
                submitted_date: new Date().toISOString()
            };
            
            console.log('Saving quote:', payload);
            
            try {
                const response = await fetch(`${apiUrl}/api/quote-submissions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Quote saved:', result);
                    
                    // Mark card as saved
                    card.setAttribute('data-saved', 'true');
                    card.setAttribute('data-quote-id', result.submission_id);
                    
                    // Add visual indicator
                    if (!card.querySelector('.saved-indicator')) {
                        const indicator = document.createElement('span');
                        indicator.className = 'saved-indicator';
                        indicator.style.cssText = 'color: green; font-weight: bold; margin-left: 10px;';
                        indicator.textContent = '✓ Saved';
                        const header = card.querySelector('h3, h4, .card-header');
                        if (header) {
                            header.appendChild(indicator);
                        }
                    }
                } else {
                    console.error('Failed to save quote:', await response.text());
                }
            } catch (error) {
                console.error('Error saving quote:', error);
            }
        }
        
        alert('Quote(s) saved successfully!');
        
        // Refresh quotes display if function exists
        if (window.loadAndDisplayQuotes && leadId) {
            window.loadAndDisplayQuotes(leadId);
        }
    };

    // Monitor for new quote cards and add save functionality
    const observeQuoteCards = function() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check if it's a quote card or contains quote cards
                            const isQuoteCard = node.classList?.contains('quote-card');
                            const hasQuoteCards = node.querySelector?.('.quote-card');
                            
                            if (isQuoteCard || hasQuoteCards) {
                                console.log('New quote card detected');
                                
                                // Add save button if not present
                                setTimeout(() => {
                                    const container = document.querySelector('.quotes-section, .modal-body, #lead-profile-container');
                                    if (container && !container.querySelector('#auto-save-quote-btn')) {
                                        const saveBtn = document.createElement('button');
                                        saveBtn.id = 'auto-save-quote-btn';
                                        saveBtn.textContent = 'Save All Quotes';
                                        saveBtn.className = 'btn btn-primary';
                                        saveBtn.style.cssText = 'margin: 10px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;';
                                        saveBtn.onclick = saveQuoteCard;
                                        
                                        // Find a good place to insert the button
                                        const quoteSection = container.querySelector('.quotes-section, .quote-cards-container');
                                        if (quoteSection) {
                                            quoteSection.insertBefore(saveBtn, quoteSection.firstChild);
                                        } else {
                                            container.appendChild(saveBtn);
                                        }
                                        
                                        console.log('Added save button for quotes');
                                    }
                                }, 500);
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // Start observing
    observeQuoteCards();
    
    // Also expose function globally for manual trigger
    window.manualSaveQuotes = saveQuoteCard;
    
})();