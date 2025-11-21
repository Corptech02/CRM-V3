// FIX EYE ICON - Ensure eye icon button opens lead profile correctly
(function() {
    'use strict';

    console.log('EYE ICON FIX loading...');

    // Wait for page to fully load
    function fixViewLead() {
        console.log('Installing fixed viewLead function...');

        // Override viewLead to ensure it works
        window.viewLead = function(leadId) {
            console.log('Eye icon clicked - opening lead profile for ID:', leadId);

            // Parse the lead ID
            leadId = parseInt(leadId);

            // Get leads from localStorage
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            console.log('Found', leads.length, 'leads in localStorage');

            const lead = leads.find(l => {
                return l.id === leadId ||
                       parseInt(l.id) === leadId ||
                       l.id === String(leadId);
            });

            if (!lead) {
                console.error('Lead not found in localStorage:', leadId);
                console.log('Available lead IDs:', leads.map(l => l.id));

                // Try to fetch from API if not in localStorage
                fetchLeadFromAPI(leadId);
                return false;
            }

            console.log('Found lead:', lead.name);

            // Always create the profile directly - don't rely on other functions
            createBasicProfile(lead);

            return false;
        };

        // Fetch lead from API if not in localStorage
        function fetchLeadFromAPI(leadId) {
            console.log('Attempting to fetch lead from API:', leadId);

            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            fetch(`${apiUrl}/api/leads/${leadId}`)
                .then(response => {
                    if (!response.ok) throw new Error('Lead not found');
                    return response.json();
                })
                .then(lead => {
                    console.log('Lead fetched from API:', lead);

                    // Store in localStorage for next time
                    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                    leads.push(lead);
                    localStorage.setItem('leads', JSON.stringify(leads));

                    // Open profile directly
                    createBasicProfile(lead);
                })
                .catch(error => {
                    console.error('Failed to fetch lead:', error);
                    alert('Could not load lead profile. Please refresh the page and try again.');
                });
        }

        // Basic profile fallback
        function createBasicProfile(lead) {
            console.log('Creating basic profile for:', lead.name);

            // Store current lead ID globally
            window.currentLeadId = lead.id;

            // Remove any existing modals
            const existingModals = document.querySelectorAll('#lead-profile-modal, #lead-profile-container');
            existingModals.forEach(modal => modal.remove());

            const modal = document.createElement('div');
            modal.id = 'lead-profile-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 999999;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 1200px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
                        <h2 style="margin: 0; font-size: 28px; color: #1f2937;">${lead.name || 'Lead Profile'}</h2>
                        <button onclick="this.closest('#lead-profile-modal').remove(); window.currentLeadId = null;" style="background: none; border: none; font-size: 30px; cursor: pointer; color: #6b7280;">&times;</button>
                    </div>

                    <!-- Lead Details Section -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="font-size: 20px; margin-bottom: 15px; color: #374151;">Lead Information</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; background: #f9fafb; padding: 20px; border-radius: 8px;">
                            <div><strong>ID:</strong> ${lead.id}</div>
                            <div><strong>Name:</strong> ${lead.name || 'N/A'}</div>
                            <div><strong>Contact:</strong> ${lead.contact || lead.contact_name || 'N/A'}</div>
                            <div><strong>Phone:</strong> ${lead.phone || 'N/A'}</div>
                            <div><strong>Email:</strong> ${lead.email || 'N/A'}</div>
                            <div><strong>Status:</strong> ${lead.status || 'N/A'}</div>
                            <div><strong>Product:</strong> ${lead.product || 'N/A'}</div>
                            <div><strong>State:</strong> ${lead.state || 'N/A'}</div>
                            <div><strong>Premium:</strong> $${lead.premium || '0.00'}</div>
                            <div><strong>Win/Loss:</strong> ${lead.win_loss || 'Pending'}</div>
                            <div><strong>Assigned To:</strong> ${lead.assigned_to || 'Unassigned'}</div>
                            <div><strong>Date:</strong> ${lead.date || 'N/A'}</div>
                            ${lead.dot_number || lead.dotNumber ? `<div><strong>DOT#:</strong> ${lead.dot_number || lead.dotNumber}</div>` : ''}
                            ${lead.mc_number || lead.mcNumber ? `<div><strong>MC#:</strong> ${lead.mc_number || lead.mcNumber}</div>` : ''}
                        </div>
                    </div>

                    <!-- Quotes Section -->
                    <div style="margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="font-size: 20px; margin: 0; color: #374151;">Quotes</h3>
                            <div>
                                <button onclick="if(window.createQuoteApplicationSimple && window.currentLeadId) { console.log('Opening CORRECT Vanguard Insurance Group quote application for lead:', window.currentLeadId); window.createQuoteApplicationSimple(window.currentLeadId); } else if(window.createQuoteApplication && window.currentLeadId) { console.log('Fallback: Creating quote application for lead:', window.currentLeadId); window.createQuoteApplication(window.currentLeadId); } else { console.error('Quote application function or lead ID not available'); }" style="padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; margin-right: 10px;">Quote Application</button>
                                <button onclick="if(window.addQuoteCard) window.addQuoteCard()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">+ Add Quote</button>
                            </div>
                        </div>
                        <div id="quote-submissions-container" style="min-height: 100px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #fafafa;">
                            <p style="color: #6b7280; text-align: center;">Loading quotes...</p>
                        </div>
                    </div>

                    <!-- Notes Section -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="font-size: 20px; margin-bottom: 15px; color: #374151;">Notes</h3>
                        <textarea id="lead-notes" style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; resize: vertical;">${lead.notes || ''}</textarea>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <button onclick="if(window.saveLead) window.saveLead(${lead.id})" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">💾 Save</button>
                        <button onclick="this.closest('#lead-profile-modal').remove(); window.currentLeadId = null;" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Close on backdrop click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                    window.currentLeadId = null;
                }
            });

            // Trigger quote loading
            setTimeout(() => {
                if (window.loadAndDisplayQuotes) {
                    window.loadAndDisplayQuotes(lead.id);
                }
            }, 100);
        }

        console.log('viewLead function has been fixed');
    }

    // Apply fix after a short delay to override other scripts
    setTimeout(fixViewLead, 1000);

    // Also re-apply on DOM changes in case other scripts override
    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (window.viewLead.toString().indexOf('Eye icon clicked') === -1) {
                console.log('viewLead was overridden, re-applying fix...');
                fixViewLead();
            }
        }, 500);
    });

    // Start observing after initial load
    setTimeout(() => {
        observer.observe(document.body, { childList: true, subtree: true });
    }, 2000);

    console.log('EYE ICON FIX loaded!');
})();