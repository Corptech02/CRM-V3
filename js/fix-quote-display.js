/**
 * Fix for quote display - Loads quotes from API instead of localStorage
 */

(function() {
    'use strict';
    
    console.log('Quote display fix loaded');
    
    // Function to load and display quotes from API
    window.loadQuotesFromAPI = async function(leadId) {
        console.log('Loading quotes from API for lead:', leadId);
        
        if (!leadId) {
            console.error('No lead ID provided');
            return [];
        }
        
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;
        
        try {
            const response = await fetch(`${apiUrl}/api/quote-submissions/${leadId}`);
            
            if (!response.ok) {
                console.error('Failed to load quotes:', response.status);
                return [];
            }
            
            const data = await response.json();
            console.log('Loaded quotes:', data);
            
            // Transform API quotes to match expected format
            const quotes = (data.submissions || []).map(submission => {
                const formData = submission.form_data || {};
                return {
                    id: submission.id,
                    carrier: formData.carrier_name || 'Unknown Carrier',
                    type: formData.policy_type || 'Commercial Auto',
                    premium: formData.premium || '0',
                    deductible: formData.deductible || '0',
                    coverage: formData.coverage || 'Standard',
                    status: submission.status || 'quoted',
                    submittedDate: submission.submitted_date,
                    notes: formData.notes || ''
                };
            });
            
            // Store in localStorage for compatibility with existing code
            localStorage.setItem('renewalSubmissions', JSON.stringify(quotes));
            
            return quotes;
        } catch (error) {
            console.error('Error loading quotes:', error);
            return [];
        }
    };
    
    // Override the quote display section
    const updateQuoteDisplay = async function() {
        // Get current lead ID
        const leadId = window.currentLeadId || 
                      document.querySelector('[data-lead-id]')?.getAttribute('data-lead-id');
        
        if (!leadId) {
            console.log('No lead ID found for quote loading');
            return;
        }
        
        // Load quotes from API
        const quotes = await loadQuotesFromAPI(leadId);
        console.log('Quotes loaded for display:', quotes.length);
        
        // Find quote display container
        const quoteContainers = document.querySelectorAll('.submissions-list, .empty-submissions, .comparison-section');
        
        if (quoteContainers.length === 0) {
            console.log('No quote display containers found yet');
            return;
        }
        
        // Update the display
        quoteContainers.forEach(container => {
            const parent = container.parentElement;
            if (parent && parent.querySelector('.empty-submissions') && quotes.length > 0) {
                // Replace empty message with quotes
                const emptyDiv = parent.querySelector('.empty-submissions');
                if (emptyDiv) {
                    const submissionsHtml = `
                        <div class="submissions-list">
                            ${quotes.map((quote, index) => `
                                <div class="submission-card" data-quote-id="${quote.id}">
                                    <div class="submission-info">
                                        <h4>${quote.carrier}</h4>
                                        <div class="submission-details">
                                            <span><strong>Premium:</strong> $${quote.premium}/mo</span>
                                            <span><strong>Deductible:</strong> $${quote.deductible}</span>
                                            <span><strong>Coverage:</strong> ${quote.coverage}</span>
                                        </div>
                                        <div class="submission-meta">
                                            <span><i class="fas fa-calendar"></i> ${new Date(quote.submittedDate || Date.now()).toLocaleDateString()}</span>
                                            <span class="quote-status received">Quote Received</span>
                                        </div>
                                    </div>
                                    <div class="submission-actions">
                                        <button class="btn-icon" title="View Quote"><i class="fas fa-eye"></i></button>
                                        <button class="btn-icon" title="Download"><i class="fas fa-download"></i></button>
                                        <button class="btn-icon" onclick="removeSubmission(${index})" title="Delete"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    emptyDiv.outerHTML = submissionsHtml;
                    console.log('Replaced empty quotes message with', quotes.length, 'quotes');
                }
            }
        });
        
        // Also update comparison table if it exists
        const comparisonTable = document.querySelector('.comparison-table tbody');
        if (comparisonTable && quotes.length > 0) {
            comparisonTable.innerHTML = quotes.map((quote, index) => `
                <tr>
                    <td><strong>${quote.carrier}</strong></td>
                    <td>${quote.type}</td>
                    <td class="premium-cell">$${quote.premium}</td>
                    <td>$${quote.deductible}</td>
                    <td>${quote.coverage}</td>
                    <td><button class="btn-small ${index === 0 ? 'btn-success' : ''}" onclick="selectQuote(${index})">Select</button></td>
                </tr>
            `).join('');
        }
    };
    
    // Watch for lead profile modal opening
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check for lead profile elements
                        const hasQuoteSection = node.querySelector?.('.empty-submissions, .submissions-list, .quote-submissions');
                        const isQuoteSection = node.classList?.contains('empty-submissions') || 
                                              node.classList?.contains('submissions-list');
                        
                        if (hasQuoteSection || isQuoteSection) {
                            console.log('Quote section detected, loading quotes...');
                            setTimeout(updateQuoteDisplay, 500);
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
    
    // Also check periodically for quote sections
    setInterval(() => {
        const emptyQuotes = document.querySelector('.empty-submissions');
        if (emptyQuotes && window.currentLeadId) {
            updateQuoteDisplay();
        }
    }, 2000);
    
    // Expose function globally
    window.forceLoadQuotes = updateQuoteDisplay;
    
})();