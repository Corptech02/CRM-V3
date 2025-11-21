/**
 * Bulletproof Lead Deletion - Bypasses all fetch overrides
 * Ensures leads are permanently deleted from server database
 */
(function() {
    'use strict';

    console.log('🛡️ Loading bulletproof lead deletion...');

    // Function to delete lead from server using XMLHttpRequest (bypasses fetch overrides)
    function deleteLeadFromServerDirect(leadId) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const apiUrl = window.VANGUARD_API_URL || `http://${window.location.hostname}:3001/api`;
            const deleteUrl = `${apiUrl}/leads/${leadId}`;

            console.log(`🗑️ BULLETPROOF DELETE: Deleting lead ${leadId} from server`);
            console.log(`🗑️ BULLETPROOF DELETE: URL = ${deleteUrl}`);

            xhr.open('DELETE', deleteUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    console.log(`🗑️ BULLETPROOF DELETE: Response status = ${xhr.status}`);
                    console.log(`🗑️ BULLETPROOF DELETE: Response text = ${xhr.responseText}`);

                    if (xhr.status >= 200 && xhr.status < 300) {
                        console.log(`✅ BULLETPROOF DELETE: Lead ${leadId} successfully deleted from server`);
                        resolve(true);
                    } else {
                        console.error(`❌ BULLETPROOF DELETE: Failed to delete lead ${leadId}. Status: ${xhr.status}`);
                        reject(new Error(`Delete failed with status: ${xhr.status}`));
                    }
                }
            };

            xhr.onerror = function() {
                console.error(`❌ BULLETPROOF DELETE: Network error deleting lead ${leadId}`);
                reject(new Error('Network error'));
            };

            xhr.send();
        });
    }

    // Function to verify lead is deleted from server
    async function verifyLeadDeleted(leadId) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            const apiUrl = window.VANGUARD_API_URL || `http://${window.location.hostname}:3001/api`;
            const checkUrl = `${apiUrl}/leads/${leadId}`;

            xhr.open('GET', checkUrl, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 404) {
                        console.log(`✅ VERIFIED: Lead ${leadId} is permanently deleted from server`);
                        resolve(true);
                    } else if (xhr.status === 200) {
                        console.warn(`⚠️ VERIFICATION FAILED: Lead ${leadId} still exists in server`);
                        resolve(false);
                    } else {
                        console.warn(`⚠️ VERIFICATION UNCLEAR: Server returned status ${xhr.status}`);
                        resolve(false);
                    }
                }
            };
            xhr.send();
        });
    }

    // Override the main deleteLead function with bulletproof version
    const originalDeleteLead = window.deleteLead;

    const bulletproofDeleteFunction = async function(leadId) {
        console.log('🔥 BULLETPROOF DELETE CALLED');
        if (confirm('Are you sure you want to permanently delete this lead?')) {
            console.log(`🗑️ BULLETPROOF: Starting deletion of lead ${leadId}`);

            try {
                // Step 1: Delete from server using bulletproof method
                await deleteLeadFromServerDirect(leadId);

                // Step 2: Verify deletion
                const isDeleted = await verifyLeadDeleted(leadId);
                if (!isDeleted) {
                    throw new Error('Lead deletion verification failed');
                }

                // Step 3: Remove from localStorage
                let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

                const initialCount = insurance_leads.length;
                insurance_leads = insurance_leads.filter(l => String(l.id) !== String(leadId));
                regular_leads = regular_leads.filter(l => String(l.id) !== String(leadId));

                localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
                localStorage.setItem('leads', JSON.stringify(regular_leads));

                // Step 4: Track deleted lead to prevent restoration
                const deletedLeads = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
                if (!deletedLeads.includes(String(leadId))) {
                    deletedLeads.push(String(leadId));
                    localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedLeads));
                }

                // Step 5: Remove from UI immediately
                const leadRow = document.querySelector(`tr[data-lead-id="${leadId}"]`) ||
                               document.querySelector(`.lead-checkbox[value="${leadId}"]`)?.closest('tr') ||
                               Array.from(document.querySelectorAll('tr')).find(row =>
                                   row.textContent.includes(leadId) || row.innerHTML.includes(leadId));

                if (leadRow) {
                    leadRow.style.transition = 'opacity 0.3s';
                    leadRow.style.opacity = '0.3';
                    setTimeout(() => leadRow.remove(), 300);
                }

                console.log(`✅ BULLETPROOF: Lead ${leadId} successfully deleted from server, localStorage, and UI`);

                // Refresh the view
                if (window.location.hash === '#leads' && typeof window.loadLeadsView === 'function') {
                    setTimeout(() => window.loadLeadsView(), 500);
                }

                alert('Lead permanently deleted!');

            } catch (error) {
                console.error(`❌ BULLETPROOF: Failed to delete lead ${leadId}:`, error);
                alert(`Failed to delete lead: ${error.message}`);
            }
        }
    };

    // Assign the bulletproof function
    window.deleteLead = bulletproofDeleteFunction;

    // Also create a bulk delete function
    window.bulletproofBulkDelete = async function(leadIds) {
        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            alert('No leads selected for deletion');
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete ${leadIds.length} lead(s)?`)) {
            return;
        }

        console.log(`🗑️ BULLETPROOF: Starting bulk deletion of ${leadIds.length} leads`);

        let successCount = 0;
        let failCount = 0;

        for (const leadId of leadIds) {
            try {
                await deleteLeadFromServerDirect(leadId);
                const isDeleted = await verifyLeadDeleted(leadId);
                if (isDeleted) {
                    successCount++;
                    console.log(`✅ BULLETPROOF BULK: Lead ${leadId} deleted`);
                } else {
                    failCount++;
                    console.error(`❌ BULLETPROOF BULK: Lead ${leadId} deletion failed verification`);
                }
            } catch (error) {
                failCount++;
                console.error(`❌ BULLETPROOF BULK: Lead ${leadId} deletion failed:`, error);
            }
        }

        console.log(`🗑️ BULLETPROOF BULK: Complete - ${successCount} deleted, ${failCount} failed`);
        alert(`Bulk delete complete: ${successCount} deleted, ${failCount} failed`);

        // Refresh the view
        if (window.location.hash === '#leads' && typeof window.loadLeadsView === 'function') {
            setTimeout(() => window.loadLeadsView(), 500);
        }
    };

    // IMMEDIATELY test and override any existing deleteLead functions
    console.log('🔥 TESTING: Current deleteLead function type:', typeof window.deleteLead);

    // Force override any existing function every 1 second to ensure dominance
    setInterval(() => {
        if (!window.deleteLead || window.deleteLead !== bulletproofDeleteFunction) {
            console.log('🔥 TAKEOVER: Restoring bulletproof deleteLead function');
            window.deleteLead = bulletproofDeleteFunction;
        }
    }, 1000);

    console.log('✅ Bulletproof lead deletion loaded - bypasses all fetch overrides');

})();