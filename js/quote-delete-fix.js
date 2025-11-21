// QUOTE DELETE FIX - Properly deletes quotes from database
(function() {
    'use strict';

    console.log('QUOTE DELETE FIX loading...');

    // Override the delete function to properly delete from database
    window.deleteQuoteSubmission = async function(quoteId) {
        console.log('Deleting quote submission with ID:', quoteId);

        if (!confirm('Are you sure you want to delete this quote?')) {
            return;
        }

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            // Delete from database
            const response = await fetch(`${apiUrl}/api/quote-submissions/${quoteId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('Quote deleted from database successfully');

                // Remove the quote card from the UI
                const quoteCard = document.querySelector(`[data-quote-id="${quoteId}"]`);
                if (quoteCard) {
                    quoteCard.remove();
                    console.log('Quote card removed from UI');
                }

                // Show success message
                if (window.showNotification) {
                    showNotification('Quote deleted successfully!', 'success');
                } else {
                    // Create a temporary success message
                    const successMsg = document.createElement('div');
                    successMsg.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #10b981;
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        z-index: 10000;
                        font-weight: 600;
                    `;
                    successMsg.textContent = 'Quote deleted successfully!';
                    document.body.appendChild(successMsg);

                    setTimeout(() => {
                        successMsg.remove();
                    }, 3000);
                }

                // Also remove from localStorage if present
                const leadId = window.currentLeadId || '88571';
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const lead = leads.find(l => String(l.id) === String(leadId));

                if (lead && lead.quoteSubmissions) {
                    // Find and remove the quote with matching ID
                    lead.quoteSubmissions = lead.quoteSubmissions.filter(q => {
                        // Check various ID formats
                        return q.id !== quoteId &&
                               q.submission_id !== quoteId &&
                               q.quote_id !== quoteId;
                    });
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    console.log('Quote removed from localStorage');
                }

            } else {
                const errorText = await response.text();
                console.error('Failed to delete quote:', errorText);
                alert('Failed to delete quote. Please try again.');
            }

        } catch (error) {
            console.error('Error deleting quote:', error);
            alert('Error deleting quote: ' + error.message);
        }
    };

    // Also fix any delete buttons that might have the wrong onclick
    function fixDeleteButtons() {
        const deleteButtons = document.querySelectorAll('button');
        deleteButtons.forEach(btn => {
            if (btn.textContent.includes('Delete') && btn.textContent.includes('🗑️')) {
                // Get the quote ID from the parent card if available
                const quoteCard = btn.closest('.quote-card');
                if (quoteCard) {
                    const quoteId = quoteCard.getAttribute('data-quote-id');
                    if (quoteId) {
                        // Update the onclick to use the correct function
                        btn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteQuoteSubmission(quoteId);
                        };
                    }
                }
            }
        });
    }

    // Monitor for new quote cards and fix their delete buttons
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                const hasQuoteCard = addedNodes.some(node =>
                    node.classList && node.classList.contains('quote-card')
                );

                if (hasQuoteCard) {
                    setTimeout(fixDeleteButtons, 100);
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Fix existing buttons on load
    setTimeout(fixDeleteButtons, 1000);

    console.log('QUOTE DELETE FIX loaded - delete buttons will properly remove quotes from database');
})();