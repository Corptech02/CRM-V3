/**
 * Fix for quotes not showing in profile - Override generateQuoteSubmissionsHTML
 * to fetch quotes from API instead of expecting them on the lead object
 */

(function() {
    'use strict';
    
    console.log('Profile quotes fix loaded');
    
    // Store the original function if it exists
    const originalGenerateQuoteSubmissionsHTML = window.generateQuoteSubmissionsHTML;
    
    // Override the function to fetch quotes from API
    window.generateQuoteSubmissionsHTML = function(lead) {
        console.log('generateQuoteSubmissionsHTML override called for lead:', lead.id);
        
        const leadId = lead.id || lead.lead_id;
        if (!leadId) {
            console.error('No lead ID found');
            return '<p style="color: #9ca3af; text-align: center; padding: 20px;">No lead ID available</p>';
        }
        
        // Create a container with loading state
        const containerId = `quotes-container-${leadId}`;
        
        // Start async fetch
        setTimeout(async () => {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;
            
            try {
                console.log(`Fetching quotes from ${apiUrl}/api/quote-submissions/${leadId}`);
                const response = await fetch(`${apiUrl}/api/quote-submissions/${leadId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const quotes = data.submissions || [];
                console.log(`Loaded ${quotes.length} quotes for lead ${leadId}`);
                
                // Find the container and update it
                const container = document.getElementById(containerId);
                if (!container) {
                    console.error('Container not found:', containerId);
                    return;
                }
                
                if (quotes.length === 0) {
                    container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No quotes submitted yet</p>';
                    return;
                }
                
                // Generate HTML for quotes
                const currentLeadId = leadId; // Capture leadId in scope
                container.innerHTML = quotes.map((quote, index) => {
                    const formData = quote.form_data || {};
                    const hasPDF = formData.quote_file_path || quote.quote_pdf_path;
                    const pdfFileName = formData.quote_file_name || (hasPDF ? 'Quote PDF' : '');

                    return `
                        <div class="quote-submission" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h4 style="margin: 0; color: #1f2937;">Quote #${index + 1}</h4>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    ${hasPDF ? `
                                        <button onclick="viewQuotePDF('${quote.id}', '${currentLeadId}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-file-pdf"></i> View PDF
                                        </button>
                                        <button onclick="attachToPolicy('${quote.id}', '${currentLeadId}')" style="background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-paperclip"></i> Attach to Policy
                                        </button>
                                    ` : ''}
                                    <button onclick="deleteQuote('${quote.id}', '${currentLeadId}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Delete Quote">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                    <span style="color: #059669; font-weight: 600; font-size: 12px;">
                                        <i class="fas fa-check-circle"></i> Saved
                                    </span>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Insurance Company:</label>
                                    <input type="text" value="${formData.carrier_name || formData.carrier || ''}" 
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Premium:</label>
                                    <input type="text" value="$${formData.premium || '0'}/mo" 
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Deductible:</label>
                                    <input type="text" value="$${formData.deductible || '0'}" 
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Coverage:</label>
                                    <input type="text" value="${formData.coverage || 'Standard'}" 
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Effective Date:</label>
                                    <input type="text" value="${formData.effective_date || new Date(quote.submitted_date).toLocaleDateString()}" 
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Status:</label>
                                    <input type="text" value="${quote.status || 'quoted'}" 
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                            </div>
                            ${hasPDF ? `
                                <div style="margin-top: 10px; padding: 10px; background: #eff6ff; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
                                    <div>
                                        <i class="fas fa-file-pdf" style="color: #dc2626; margin-right: 8px;"></i>
                                        <span style="font-weight: 600; color: #1e40af;">PDF Attached:</span> ${pdfFileName}
                                    </div>
                                    <span style="color: #6b7280; font-size: 12px;">Click "View PDF" to open</span>
                                </div>
                            ` : ''}
                            ${formData.notes ? `
                                <div style="margin-top: 10px;">
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Notes:</label>
                                    <div style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                        ${formData.notes}
                                    </div>
                                </div>
                            ` : ''}
                            <div style="margin-top: 10px; font-size: 11px; color: #6b7280;">
                                Submitted: ${new Date(quote.submitted_date).toLocaleString()}
                            </div>
                        </div>
                    `;
                }).join('');
                
            } catch (error) {
                console.error('Error fetching quotes:', error);
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 20px;">Error loading quotes: ${error.message}</p>`;
                }
            }
        }, 100);
        
        // Return initial loading state
        return `<div id="${containerId}" style="padding: 20px; text-align: center;">
            <i class="fas fa-spinner fa-spin" style="color: #3b82f6; margin-right: 8px;"></i>
            Loading quotes from database...
        </div>`;
    };
    
    console.log('generateQuoteSubmissionsHTML override installed');

    // Function to view quote PDF
    window.viewQuotePDF = async function(quoteId, leadId) {
        console.log('Viewing PDF for quote:', quoteId);

        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`;

        try {
            // Fetch quote details
            const response = await fetch(`${apiUrl}/api/quote-submissions/${leadId}`);
            const data = await response.json();
            const quote = data.submissions.find(s => s.id == quoteId);

            if (quote) {
                const pdfPath = quote.form_data?.quote_file_path || quote.quote_pdf_path;
                if (pdfPath) {
                    // Convert server path to web accessible path
                    const webPath = pdfPath.replace('/var/www/vanguard/', '/');
                    window.open(webPath, '_blank');
                } else {
                    alert('No PDF attached to this quote');
                }
            }
        } catch (error) {
            console.error('Error viewing PDF:', error);
            alert('Error viewing PDF');
        }
    };

    // Function to attach quote to policy
    window.attachToPolicy = function(quoteId, leadId) {
        console.log('Attaching quote', quoteId, 'to policy for lead', leadId);
        alert('This quote will be attached to the policy card when the lead is converted to a client. The PDF will be available in the policy documents.');
        // Store the selected quote ID for later use
        localStorage.setItem(`selected_quote_${leadId}`, quoteId);
    };

    // Refresh quotes display function
    function refreshQuotesDisplay(leadId) {
        const containerId = `quotes-container-${leadId}`;
        const container = document.getElementById(containerId);

        if (!container) {
            console.error('Quotes container not found:', containerId);
            return;
        }

        // Set loading state
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;"><i class="fas fa-spinner fa-spin"></i> Refreshing quotes...</div>';

        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`;

        // Fetch and update quotes
        setTimeout(async () => {
            try {
                const response = await fetch(`${apiUrl}/api/quote-submissions/${leadId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const quotes = data.submissions || [];
                console.log(`Refreshed ${quotes.length} quotes for lead ${leadId}`);

                if (quotes.length === 0) {
                    container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No quotes submitted yet</p>';
                    return;
                }

                // Generate HTML for quotes (same logic as the original function)
                const currentLeadId = leadId;
                container.innerHTML = quotes.map((quote, index) => {
                    const formData = quote.form_data || {};
                    const hasPDF = formData.quote_file_path || quote.quote_pdf_path;

                    return `
                        <div class="quote-submission" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h4 style="margin: 0; color: #1f2937;">Quote #${index + 1}</h4>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    ${hasPDF ? `
                                        <button onclick="viewQuotePDF('${quote.id}', '${currentLeadId}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                            <i class="fas fa-file-pdf"></i> View PDF
                                        </button>
                                    ` : ''}
                                    <button onclick="deleteQuote('${quote.id}', '${currentLeadId}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Delete Quote">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                    <span style="color: #059669; font-weight: 600; font-size: 12px;">
                                        <i class="fas fa-check-circle"></i> Saved
                                    </span>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Insurance Company:</label>
                                    <input type="text" value="${formData.carrier_name || formData.carrier || ''}"
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Premium:</label>
                                    <input type="text" value="$${formData.premium || '0'}/mo"
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Deductible:</label>
                                    <input type="text" value="$${formData.deductible || '0'}"
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Coverage:</label>
                                    <input type="text" value="${formData.coverage || 'Standard'}"
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Effective Date:</label>
                                    <input type="text" value="${formData.effective_date || new Date(quote.submitted_date).toLocaleDateString()}"
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                                <div>
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Status:</label>
                                    <input type="text" value="${quote.status || 'quoted'}"
                                           readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb;">
                                </div>
                            </div>
                            ${formData.notes ? `
                                <div style="margin-top: 10px;">
                                    <label style="font-weight: 600; font-size: 12px; color: #374151;">Notes:</label>
                                    <textarea readonly style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: #f9fafb; min-height: 60px;">${formData.notes}</textarea>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');

            } catch (error) {
                console.error('Error refreshing quotes:', error);
                container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">Error loading quotes</p>';
            }
        }, 100);
    }

    // Delete quote function
    window.deleteQuote = async function(quoteId, leadId) {
        if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
            return;
        }

        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`;

        try {
            console.log(`Deleting quote ${quoteId} for lead ${leadId}`);
            const response = await fetch(`${apiUrl}/api/quotes/${leadId}/${quoteId}`, {
                method: 'DELETE'
            });

            console.log('Delete response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Quote deleted successfully:', result);
                // Refresh the quotes display by re-running the quote loading logic
                refreshQuotesDisplay(leadId);
                alert('Quote deleted successfully');
            } else {
                const errorText = await response.text();
                console.error('Delete failed with status:', response.status, 'Error:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error deleting quote:', error);
            alert(`Failed to delete quote: ${error.message}`);
        }
    };

})();