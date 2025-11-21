/**
 * Override renderSubmissionsTab to load quotes from API
 */

(function() {
    'use strict';
    
    console.log('Quote render fix loaded - overriding renderSubmissionsTab');
    
    // Store original function
    const originalRenderSubmissionsTab = window.renderSubmissionsTab;
    
    // Override the function to load from API
    window.renderSubmissionsTab = function() {
        console.log('renderSubmissionsTab override called');
        
        const leadId = window.currentLeadId || 
                      document.querySelector('[data-lead-id]')?.getAttribute('data-lead-id');
        
        if (!leadId) {
            console.log('No lead ID, using original render');
            return originalRenderSubmissionsTab ? originalRenderSubmissionsTab() : '';
        }
        
        // Create initial HTML with loading state
        const initialHtml = `
            <div class="submissions-tab">
                <div id="submissionsList">
                    <div class="submissions-header">
                        <h3>Quote Submissions</h3>
                        <button class="btn-primary" onclick="showAddSubmissionForm()">
                            <i class="fas fa-plus"></i> Add New Quote
                        </button>
                    </div>
                    <div id="quote-loading" style="padding: 20px; text-align: center;">
                        <i class="fas fa-spinner fa-spin"></i> Loading quotes...
                    </div>
                </div>
            </div>
        `;
        
        // Load quotes async and update display
        setTimeout(async () => {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;
            
            try {
                const response = await fetch(`${apiUrl}/api/quote-submissions/${leadId}`);
                if (!response.ok) {
                    throw new Error('Failed to load quotes');
                }
                
                const data = await response.json();
                const submissions = data.submissions || [];
                
                console.log('Loaded', submissions.length, 'quotes from API');
                
                // Transform to expected format
                const savedSubmissions = submissions.map(sub => {
                    const formData = sub.form_data || {};
                    return {
                        carrier: formData.carrier_name || 'Unknown',
                        type: formData.policy_type || 'Commercial Auto',
                        premium: formData.premium || '0',
                        deductible: formData.deductible || '0',
                        coverage: formData.coverage || 'Standard',
                        effectiveDate: formData.effective_date || sub.submitted_date,
                        notes: formData.notes || ''
                    };
                });
                
                // Store in localStorage for compatibility
                localStorage.setItem('renewalSubmissions', JSON.stringify(savedSubmissions));
                
                // Update the display
                const container = document.getElementById('submissionsList');
                if (container) {
                    const loadingDiv = container.querySelector('#quote-loading');
                    if (loadingDiv) {
                        if (savedSubmissions.length > 0) {
                            loadingDiv.outerHTML = `
                                <div class="submissions-list">
                                    ${savedSubmissions.map((submission, index) => `
                                        <div class="submission-card">
                                            <div class="submission-info">
                                                <h4>${submission.carrier}</h4>
                                                <div class="submission-details">
                                                    <span><strong>Premium:</strong> $${submission.premium}/mo</span>
                                                    <span><strong>Deductible:</strong> $${submission.deductible}</span>
                                                    <span><strong>Coverage:</strong> ${submission.coverage}</span>
                                                </div>
                                                <div class="submission-meta">
                                                    <span><i class="fas fa-calendar"></i> Submitted: ${new Date(submission.effectiveDate || Date.now()).toLocaleDateString()}</span>
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
                                
                                <div class="comparison-section">
                                    <h4>Quote Comparison</h4>
                                    <table class="comparison-table">
                                        <thead>
                                            <tr>
                                                <th>Carrier</th>
                                                <th>Policy Type</th>
                                                <th>Premium</th>
                                                <th>Deductible</th>
                                                <th>Coverage</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${savedSubmissions.map((submission, index) => `
                                                <tr>
                                                    <td><strong>${submission.carrier}</strong></td>
                                                    <td>${submission.type}</td>
                                                    <td class="premium-cell">$${submission.premium}</td>
                                                    <td>$${submission.deductible}</td>
                                                    <td>${submission.coverage}</td>
                                                    <td><button class="btn-small ${index === 0 ? 'btn-success' : ''}" onclick="selectQuote(${index})">Select</button></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `;
                        } else {
                            loadingDiv.outerHTML = `
                                <div class="empty-submissions">
                                    <i class="fas fa-file-invoice" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                                    <p style="color: #666;">No quote submissions yet</p>
                                    <p style="color: #999; font-size: 14px;">Click "Add New Quote" to create your first submission</p>
                                </div>
                            `;
                        }
                    }
                    console.log('Updated quote display with', savedSubmissions.length, 'quotes');
                }
            } catch (error) {
                console.error('Error loading quotes:', error);
                const container = document.getElementById('submissionsList');
                if (container) {
                    const loadingDiv = container.querySelector('#quote-loading');
                    if (loadingDiv) {
                        loadingDiv.innerHTML = '<p style="color: red;">Error loading quotes</p>';
                    }
                }
            }
        }, 100);
        
        return initialHtml;
    };
    
    console.log('renderSubmissionsTab function overridden successfully');
    
})();