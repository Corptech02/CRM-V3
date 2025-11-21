/**
 * Direct fix for Add Quote button - creates form directly in the modal
 */

(function() {
    'use strict';
    
    console.log('Direct Add Quote fix loaded');
    
    // Override the existing addQuoteSubmission function
    const originalAddQuoteSubmission = window.addQuoteSubmission;
    
    window.addQuoteSubmission = function(leadId) {
        console.log('Add Quote clicked for lead:', leadId);
        
        // Store lead ID
        window.currentQuoteLeadId = leadId;
        
        // Find the quote submissions container
        const container = document.getElementById('quote-submissions-container');
        if (!container) {
            console.error('Quote submissions container not found');
            alert('Error: Cannot find quote container. Please refresh and try again.');
            return;
        }
        
        // Check if form already exists
        let existingForm = document.getElementById('quote-entry-form');
        if (existingForm) {
            existingForm.remove();
        }
        
        // Create the quote entry form
        const formDiv = document.createElement('div');
        formDiv.id = 'quote-entry-form';
        formDiv.style.cssText = `
            background: white;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        formDiv.innerHTML = `
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
                <h4 style="margin: 0; color: #1f2937; font-size: 18px;">Enter New Quote</h4>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Insurance Company *</label>
                    <input type="text" id="new-quote-carrier" placeholder="e.g. GEICO, Progressive" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Monthly Premium *</label>
                    <input type="text" id="new-quote-premium" placeholder="e.g. 1500" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Deductible</label>
                    <input type="text" id="new-quote-deductible" placeholder="e.g. 1000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Coverage Amount</label>
                    <input type="text" id="new-quote-coverage" placeholder="e.g. 1000000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                </div>
                <div style="grid-column: span 2;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Quote PDF Document</label>
                    <input type="file" id="new-quote-pdf" accept=".pdf" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white;">
                    <small style="color: #6b7280;">Upload the quote PDF document from the insurance carrier</small>
                </div>
                <div style="grid-column: span 2;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Notes</label>
                    <textarea id="new-quote-notes" rows="3" placeholder="Additional notes about this quote..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"></textarea>
                </div>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="cancelQuoteEntry()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button onclick="submitQuoteEntry()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-save"></i> Save Quote
                </button>
            </div>
        `;
        
        // Insert the form at the top of the container
        container.insertBefore(formDiv, container.firstChild);
        
        // Scroll to the form
        formDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = document.getElementById('new-quote-carrier');
            if (firstInput) firstInput.focus();
        }, 100);
        
        console.log('Quote form added to DOM');
    };
    
    // Cancel function
    window.cancelQuoteEntry = function() {
        const form = document.getElementById('quote-entry-form');
        if (form) {
            form.remove();
            console.log('Quote form cancelled');
        }
    };
    
    // Submit function
    window.submitQuoteEntry = async function() {
        console.log('Submitting quote...');

        const carrier = document.getElementById('new-quote-carrier')?.value;
        const premium = document.getElementById('new-quote-premium')?.value;
        const deductible = document.getElementById('new-quote-deductible')?.value || '0';
        const coverage = document.getElementById('new-quote-coverage')?.value || '';
        const notes = document.getElementById('new-quote-notes')?.value || '';
        const pdfFile = document.getElementById('new-quote-pdf')?.files[0];

        if (!carrier || !premium) {
            alert('Please fill in at least the Insurance Company and Monthly Premium');
            return;
        }

        const leadId = window.currentQuoteLeadId;
        if (!leadId) {
            alert('Error: Lead ID not found. Please refresh and try again.');
            return;
        }

        // Find and disable submit button
        const submitBtns = document.querySelectorAll('button');
        let submitBtn = null;
        submitBtns.forEach(btn => {
            if (btn.textContent.includes('Save Quote')) {
                submitBtn = btn;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }
        });

        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`;

        const payload = {
            lead_id: leadId,
            application_id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            form_data: {
                carrier_name: carrier,
                premium: premium,
                deductible: deductible,
                coverage: coverage,
                effective_date: new Date().toISOString().split('T')[0],
                notes: notes
            },
            status: 'quoted',
            submitted_date: new Date().toISOString()
        };

        console.log('Preparing submission with PDF:', pdfFile ? pdfFile.name : 'No PDF');

        try {
            let response;

            if (pdfFile) {
                // Use FormData to send file
                const formData = new FormData();
                formData.append('file', pdfFile);
                formData.append('quote_data', JSON.stringify(payload));

                console.log('Sending with file to /with-file endpoint');
                response = await fetch(`${apiUrl}/api/quote-submissions/with-file`, {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Send without file
                console.log('Sending without file to regular endpoint');
                response = await fetch(`${apiUrl}/api/quote-submissions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }
            
            if (response.ok) {
                const result = await response.json();
                console.log('Quote saved:', result);
                
                // Remove the form
                const form = document.getElementById('quote-entry-form');
                if (form) form.remove();
                
                // Show success message
                const container = document.getElementById('quote-submissions-container');
                if (container) {
                    const successMsg = document.createElement('div');
                    successMsg.style.cssText = 'background: #10b981; color: white; padding: 10px; border-radius: 6px; margin: 10px 0;';
                    successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Quote saved successfully! Refreshing...';
                    container.insertBefore(successMsg, container.firstChild);
                    
                    // Refresh quotes after 1 second
                    setTimeout(() => {
                        successMsg.remove();
                        if (window.generateQuoteSubmissionsHTML) {
                            container.innerHTML = window.generateQuoteSubmissionsHTML({ id: leadId });
                        }
                    }, 1500);
                }
            } else {
                const error = await response.text();
                console.error('Save failed:', error);
                alert('Failed to save quote: ' + error);
                
                // Re-enable button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Quote';
                }
            }
        } catch (error) {
            console.error('Error saving quote:', error);
            alert('Error saving quote: ' + error.message);
            
            // Re-enable button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Quote';
            }
        }
    };
    
    console.log('Direct Add Quote fix installed - addQuoteSubmission overridden');
    
})();