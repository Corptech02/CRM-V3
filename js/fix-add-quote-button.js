/**
 * Fix Add Quote button to show the existing quote form
 */

(function() {
    'use strict';
    
    console.log('Add Quote button fix loaded');
    
    // Override addQuoteSubmission to use the existing form
    window.addQuoteSubmission = function(leadId) {
        console.log('Add Quote clicked for lead:', leadId);
        
        // Store the lead ID for later use
        window.currentQuoteLeadId = leadId;
        
        // Check if showAddSubmissionForm exists and use it
        if (typeof window.showAddSubmissionForm === 'function') {
            console.log('Using existing showAddSubmissionForm');
            window.showAddSubmissionForm();
            return;
        }
        
        // If the form doesn't exist in the DOM, create it
        let form = document.getElementById('submissionForm');
        if (!form) {
            console.log('Creating quote submission form');
            
            // Find the container
            const container = document.getElementById('quote-submissions-container') || 
                           document.querySelector('.quote-submissions-section');
            
            if (!container) {
                console.error('No container found for quote form');
                return;
            }
            
            // Create the form HTML (using the existing design)
            const formHTML = `
                <div id="submissionForm" class="submission-form" style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
                    <div class="form-card">
                        <div class="form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h4 style="margin: 0; color: #1f2937;">Add New Quote</h4>
                            <button onclick="hideQuoteForm()" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Insurance Company</label>
                                <select class="form-control" id="submissionCarrier" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                                    <option value="">Select Carrier</option>
                                    <option value="Progressive">Progressive</option>
                                    <option value="State Farm">State Farm</option>
                                    <option value="Hartford">Hartford</option>
                                    <option value="Travelers">Travelers</option>
                                    <option value="Liberty Mutual">Liberty Mutual</option>
                                    <option value="Nationwide">Nationwide</option>
                                    <option value="Allstate">Allstate</option>
                                    <option value="GEICO">GEICO</option>
                                    <option value="Berkshire Hathaway">Berkshire Hathaway</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Monthly Premium</label>
                                <input type="text" class="form-control" id="submissionPremium" placeholder="1000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Deductible</label>
                                <input type="text" class="form-control" id="submissionDeductible" placeholder="1000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Coverage Amount</label>
                                <input type="text" class="form-control" id="submissionCoverage" placeholder="1000000" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Notes</label>
                                <textarea class="form-control" id="submissionNotes" rows="3" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"></textarea>
                            </div>
                        </div>
                        <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button onclick="hideQuoteForm()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                                Cancel
                            </button>
                            <button onclick="saveQuoteSubmission()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-save"></i> Save Quote
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert the form
            container.insertAdjacentHTML('beforeend', formHTML);
        } else {
            // Show existing form
            form.style.display = 'block';
        }
        
        // Hide the quotes list temporarily
        const quotesContainer = document.querySelector('#quotes-container-' + leadId);
        if (quotesContainer) {
            quotesContainer.style.display = 'none';
        }
    };
    
    // Function to hide the quote form
    window.hideQuoteForm = function() {
        const form = document.getElementById('submissionForm');
        if (form) {
            form.style.display = 'none';
            // Remove it from DOM
            form.remove();
        }
        
        // Show quotes list again
        const leadId = window.currentQuoteLeadId;
        if (leadId) {
            const quotesContainer = document.querySelector('#quotes-container-' + leadId);
            if (quotesContainer) {
                quotesContainer.style.display = 'block';
            }
        }
    };
    
    // Function to save the quote submission
    window.saveQuoteSubmission = async function() {
        const carrier = document.getElementById('submissionCarrier')?.value;
        const premium = document.getElementById('submissionPremium')?.value;
        const deductible = document.getElementById('submissionDeductible')?.value;
        const coverage = document.getElementById('submissionCoverage')?.value;
        const notes = document.getElementById('submissionNotes')?.value;
        
        if (!carrier || !premium) {
            alert('Please fill in at least the carrier and premium');
            return;
        }
        
        const leadId = window.currentQuoteLeadId;
        if (!leadId) {
            alert('No lead selected');
            return;
        }
        
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;
        
        const payload = {
            lead_id: leadId,
            application_id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            form_data: {
                carrier_name: carrier,
                premium: premium,
                deductible: deductible || '0',
                coverage: coverage || 'Standard',
                effective_date: new Date().toISOString().split('T')[0],
                notes: notes || ''
            },
            status: 'quoted',
            submitted_date: new Date().toISOString()
        };
        
        try {
            const response = await fetch(`${apiUrl}/api/quote-submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                alert('Quote saved successfully!');
                hideQuoteForm();
                
                // Reload the quotes
                if (window.generateQuoteSubmissionsHTML) {
                    const container = document.getElementById('quote-submissions-container');
                    if (container) {
                        const lead = { id: leadId };
                        container.innerHTML = window.generateQuoteSubmissionsHTML(lead);
                    }
                }
            } else {
                alert('Failed to save quote');
            }
        } catch (error) {
            console.error('Error saving quote:', error);
            alert('Error saving quote: ' + error.message);
        }
    };
    
    console.log('Add Quote button fix applied');
    
})();