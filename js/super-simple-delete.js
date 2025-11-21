/**
 * SUPER SIMPLE DELETE - No fancy logic, just delete from server
 */
(function() {
    'use strict';

    console.log('🚀 SUPER SIMPLE DELETE: Loading...');

    // Store any existing deleteLead function
    const existingDeleteLead = window.deleteLead;

    // Create the simplest possible delete function
    window.deleteLead = function(leadId) {
        console.log('🚀 SUPER SIMPLE: deleteLead called with ID:', leadId);

        if (!confirm('Delete this lead permanently?')) {
            console.log('🚀 SUPER SIMPLE: User cancelled');
            return;
        }

        console.log('🚀 SUPER SIMPLE: Starting deletion process...');

        // Step 1: Delete from server using the simplest possible method
        const xhr = new XMLHttpRequest();
        const deleteUrl = `http://162-220-14-239.nip.io:3001/api/leads/${leadId}`;

        console.log('🚀 SUPER SIMPLE: DELETE URL =', deleteUrl);

        xhr.open('DELETE', deleteUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            console.log('🚀 SUPER SIMPLE: Server response status =', xhr.status);
            console.log('🚀 SUPER SIMPLE: Server response text =', xhr.responseText);

            if (xhr.status >= 200 && xhr.status < 300) {
                console.log('✅ SUPER SIMPLE: Server deletion SUCCESS');

                // Step 2: Remove from localStorage
                try {
                    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                    const beforeCount = leads.length;
                    leads = leads.filter(l => String(l.id) !== String(leadId));
                    const afterCount = leads.length;

                    localStorage.setItem('insurance_leads', JSON.stringify(leads));

                    console.log(`🚀 SUPER SIMPLE: localStorage update: ${beforeCount} -> ${afterCount}`);

                    // Step 3: Track as deleted
                    let deletedIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
                    if (!deletedIds.includes(String(leadId))) {
                        deletedIds.push(String(leadId));
                        localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedIds));
                        console.log('🚀 SUPER SIMPLE: Added to deleted IDs list');
                    }

                    // Step 4: Remove from UI
                    const leadElement = document.querySelector(`[data-lead-id="${leadId}"]`) ||
                                       Array.from(document.querySelectorAll('tr')).find(row =>
                                           row.textContent.includes(leadId));

                    if (leadElement) {
                        leadElement.remove();
                        console.log('🚀 SUPER SIMPLE: Removed from UI');
                    }

                    alert('Lead deleted successfully!');

                    // Refresh view
                    if (typeof window.loadLeadsView === 'function') {
                        setTimeout(() => {
                            console.log('🚀 SUPER SIMPLE: Refreshing leads view');
                            window.loadLeadsView();
                        }, 500);
                    }

                } catch (error) {
                    console.error('🚀 SUPER SIMPLE: Error in cleanup:', error);
                }

            } else {
                console.error('❌ SUPER SIMPLE: Server deletion FAILED');
                alert('Failed to delete lead from server!');
            }
        };

        xhr.onerror = function() {
            console.error('❌ SUPER SIMPLE: Network error');
            alert('Network error while deleting lead!');
        };

        xhr.send();
    };

    // Force this to be THE delete function
    Object.defineProperty(window, 'deleteLead', {
        value: window.deleteLead,
        writable: true,
        configurable: true
    });

    console.log('✅ SUPER SIMPLE DELETE: Loaded and ready');

})();