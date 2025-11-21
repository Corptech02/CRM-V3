// Fix for Quote Application button visibility and functionality
(function() {
    'use strict';
    
    console.log('Quote Application button fix loading...');
    
    // Force override createQuoteApplication to ensure it works with server-based storage
    window.createQuoteApplication = async function(leadId) {
        console.log('Creating quote application for lead:', leadId);

        // Get the lead data from both possible sources
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const allLeads = [...leads, ...insuranceLeads];
        const lead = allLeads.find(l => l.id == leadId); // Use == for type coercion

        console.log('Found lead:', lead);

        if (!lead) {
            console.error('Lead not found with ID:', leadId);
            console.log('Available leads:', leads.map(l => l.id));
            alert('Lead not found. Please refresh and try again.');
            return;
        }

        // Use the comprehensive 35-vehicle application
        if (typeof showComprehensiveApplication === 'function') {
            console.log('Using comprehensive 35-vehicle application...');
            showComprehensiveApplication(leadId);
            console.log('Comprehensive application modal should be displayed');
        } else if (typeof createQuoteApplicationSimple === 'function') {
            console.log('Using CORRECT Vanguard Insurance Group application...');
            createQuoteApplicationSimple(leadId);
            console.log('Vanguard Insurance Group modal should be displayed');
        } else if (typeof showQuoteApplication === 'function') {
            console.log('Using backup Quote Application with vehicle/driver fields...');
            showQuoteApplication(leadId);
            console.log('Backup modal should be displayed');
        } else if (typeof QuoteApplication !== 'undefined') {
            console.log('Using localStorage-based Quote Application...');
            const app = new QuoteApplication();
            const application = app.createApplicationFromLead(lead);
            console.log('Application created:', application);

            // Show the modal
            app.showApplicationModal(application);
            console.log('Modal should be displayed');
        } else {
            console.error('Quote Application not loaded yet');

            // Try to load it dynamically
            const checkAndCreate = () => {
                if (typeof showComprehensiveApplication === 'function') {
                    console.log('Comprehensive 35-vehicle application now available');
                    showComprehensiveApplication(leadId);
                } else if (typeof createQuoteApplicationSimple === 'function') {
                    console.log('CORRECT Vanguard Insurance Group application now available');
                    createQuoteApplicationSimple(leadId);
                } else if (typeof showQuoteApplication === 'function') {
                    console.log('Backup Quote Application now available');
                    showQuoteApplication(leadId);
                } else if (typeof QuoteApplication !== 'undefined') {
                    console.log('localStorage-based Quote Application now available');
                    const app = new QuoteApplication();
                    const application = app.createApplicationFromLead(lead);
                    app.showApplicationModal(application);
                } else {
                    console.error('Quote Application still not available');
                    alert('Quote Application feature is not loading properly. Please refresh the page.');
                }
            };

            // Try again after a short delay
            setTimeout(checkAndCreate, 1500);
        }
    };
    
    // Override viewLead to ensure button is visible
    const originalViewLead = window.viewLead;
    
    window.viewLead = function(leadId) {
        console.log('Enhanced viewLead called for:', leadId);
        
        // Call the original function
        if (originalViewLead) {
            originalViewLead.call(this, leadId);
        }
        
        // Ensure the Quote Application button is added after a short delay
        setTimeout(() => {
            const quoteSection = document.querySelector('#quote-submissions-container');
            if (quoteSection) {
                const parent = quoteSection.parentElement;
                const header = parent.querySelector('h3');
                
                // Check if button already exists by multiple methods
                const existingQuoteBtn = parent.querySelector('button[onclick*="createQuoteApplication"]');
                const existingQuoteBtnByText = Array.from(parent.querySelectorAll('button')).find(btn => 
                    btn.textContent.includes('Quote Application')
                );
                const existingQuoteBtnByData = parent.querySelector('button[data-quote-app-btn="true"]');
                
                if (header && !existingQuoteBtn && !existingQuoteBtnByText && !existingQuoteBtnByData) {
                    console.log('Adding Quote Application button...');
                    
                    // Find the button container or create one
                    let buttonContainer = parent.querySelector('div[style*="display: flex"]');
                    
                    if (!buttonContainer) {
                        // Create button container
                        buttonContainer = document.createElement('div');
                        buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';
                        
                        // Move existing Add Quote button if it exists
                        const addQuoteBtn = parent.querySelector('button[onclick*="addQuoteSubmission"]');
                        if (addQuoteBtn) {
                            buttonContainer.appendChild(addQuoteBtn);
                        }
                        
                        // Insert after header
                        header.parentElement.appendChild(buttonContainer);
                    }
                    
                    // Check again if button doesn't exist in the container
                    if (!buttonContainer.querySelector('button[data-quote-app-btn="true"]')) {
                        // Create Quote Application button
                        const quoteAppBtn = document.createElement('button');
                        quoteAppBtn.innerHTML = '<i class="fas fa-file-alt"></i> Quote Application';
                        quoteAppBtn.style.cssText = 'background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;';
                        quoteAppBtn.setAttribute('data-quote-app-btn', 'true');
                        quoteAppBtn.onclick = function() {
                            createQuoteApplication(leadId);
                        };
                        
                        // Insert as first button
                        buttonContainer.insertBefore(quoteAppBtn, buttonContainer.firstChild);
                        
                        console.log('Quote Application button added successfully');
                    }
                }
            }
        }, 500);
    };
    
    // Check once after page load for any dynamically created lead profiles
    setTimeout(() => {
        const quoteContainers = document.querySelectorAll('#quote-submissions-container');
        quoteContainers.forEach(container => {
            const parent = container.parentElement;
            // Check if Quote Application button already exists
            const existingQuoteAppBtn = parent.querySelector('button[onclick*="createQuoteApplication"]');
            const existingQuoteAppBtnAlt = Array.from(parent.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Quote Application')
            );
            
            if (!existingQuoteAppBtn && !existingQuoteAppBtnAlt) {
                // Extract lead ID from any existing button
                const existingBtn = parent.querySelector('button[onclick*="addQuoteSubmission"]');
                if (existingBtn) {
                    const onclick = existingBtn.getAttribute('onclick');
                    const match = onclick.match(/addQuoteSubmission\(['"]([^'"]+)['"]\)/);
                    if (match) {
                        const leadId = match[1];
                        
                        // Add the Quote Application button
                        let buttonContainer = parent.querySelector('div[style*="display: flex"]');
                        if (!buttonContainer) {
                            const header = parent.querySelector('h3');
                            if (header) {
                                buttonContainer = document.createElement('div');
                                buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';
                                header.parentElement.appendChild(buttonContainer);
                                
                                if (existingBtn) {
                                    buttonContainer.appendChild(existingBtn);
                                }
                            }
                        }
                        
                        if (buttonContainer) {
                            const quoteAppBtn = document.createElement('button');
                            quoteAppBtn.innerHTML = '<i class="fas fa-file-alt"></i> Quote Application';
                            quoteAppBtn.style.cssText = 'background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;';
                            quoteAppBtn.setAttribute('data-quote-app-btn', 'true');
                            quoteAppBtn.onclick = function() {
                                createQuoteApplication(leadId);
                            };
                            buttonContainer.insertBefore(quoteAppBtn, buttonContainer.firstChild);
                        }
                    }
                }
            }
        });
    }, 3000);
    
    console.log('Quote Application button fix loaded');
})();