/**
 * Fix for lead 88571 showing incorrect cached data
 * Forces fresh API fetch and clears stale localStorage data
 */

(function() {
    'use strict';

    // Clear any cached lead data for 88571 on page load
    const clearCachedLead88571 = function() {
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const filteredLeads = leads.filter(l => String(l.id) !== '88571');
        
        if (leads.length !== filteredLeads.length) {
            localStorage.setItem('leads', JSON.stringify(filteredLeads));
            console.log('Cleared cached data for lead 88571');
        }
    };

    // Override viewLeadDetails to always fetch fresh data for 88571
    const originalViewLeadDetails = window.viewLeadDetails;
    window.viewLeadDetails = function(leadId) {
        // Always fetch fresh data for lead 88571
        if (String(leadId) === '88571') {
            console.log('Fetching fresh data for lead 88571');
            
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            fetch(`${apiUrl}/api/leads/88571`)
                .then(response => {
                    if (!response.ok) throw new Error('Lead not found');
                    return response.json();
                })
                .then(lead => {
                    console.log('Fresh lead data received:', lead);
                    
                    // Update localStorage with fresh data
                    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                    const filteredLeads = leads.filter(l => String(l.id) !== '88571');
                    filteredLeads.push(lead);
                    localStorage.setItem('leads', JSON.stringify(filteredLeads));
                    
                    // Call original function with fresh data
                    if (originalViewLeadDetails) {
                        originalViewLeadDetails(leadId);
                    }
                })
                .catch(error => {
                    console.error('Failed to fetch lead 88571:', error);
                    alert('Could not load lead data. Please refresh and try again.');
                });
            
            return; // Don't proceed with cached data
        }
        
        // For other leads, use original function
        if (originalViewLeadDetails) {
            originalViewLeadDetails(leadId);
        }
    };

    // Clear cached data on page load
    clearCachedLead88571();

    // Also override the save function to ensure it uses correct API
    const setupSaveForLead88571 = function() {
        // Wait for save button to be available
        setTimeout(() => {
            const saveBtn = document.querySelector('.save-btn, #save-lead-btn, button[onclick*="saveLead"]');
            if (saveBtn && window.currentLeadId === '88571') {
                saveBtn.onclick = function() {
                    console.log('Saving lead 88571 with fresh API call');
                    
                    const apiUrl = window.location.hostname === 'localhost'
                        ? 'http://localhost:8897'
                        : `http://${window.location.hostname}:8897`;
                    
                    // Gather all form data
                    const formData = {};
                    document.querySelectorAll('input, select, textarea').forEach(el => {
                        if (el.name || el.id) {
                            formData[el.name || el.id] = el.value;
                        }
                    });
                    
                    fetch(`${apiUrl}/api/leads/88571`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    })
                    .then(response => {
                        if (!response.ok) throw new Error('Save failed');
                        return response.json();
                    })
                    .then(data => {
                        console.log('Lead 88571 saved successfully:', data);
                        alert('Lead saved successfully!');
                        
                        // Clear cached data to force refresh next time
                        clearCachedLead88571();
                    })
                    .catch(error => {
                        console.error('Failed to save lead 88571:', error);
                        alert('Failed to save lead. Please try again.');
                    });
                };
            }
        }, 1000);
    };

    // Set up save handler when profile opens
    const observer = new MutationObserver(() => {
        if (window.currentLeadId === '88571') {
            setupSaveForLead88571();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });

})();