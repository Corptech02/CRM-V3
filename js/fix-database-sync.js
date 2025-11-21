/**
 * Fix Database Synchronization Issue
 * Ensures all lead operations use the correct backend database
 */
(function() {
    'use strict';

    console.log('🔄 DATABASE SYNC FIX: Loading...');

    // Function to get leads from the CORRECT backend database via API
    async function getLeadsFromBackendDB() {
        try {
            const response = await fetch('/api/leads');
            if (response.ok) {
                const leads = await response.json();
                console.log(`🔄 DATABASE SYNC: Loaded ${leads.length} leads from backend database`);
                return leads;
            } else {
                console.error('🔄 DATABASE SYNC: Failed to load from backend database');
                return [];
            }
        } catch (error) {
            console.error('🔄 DATABASE SYNC: Error loading from backend:', error);
            return [];
        }
    }

    // Function to sync backend database leads to localStorage
    async function syncBackendToLocalStorage() {
        console.log('🔄 DATABASE SYNC: Syncing backend database to localStorage...');

        const backendLeads = await getLeadsFromBackendDB();

        if (backendLeads.length > 0) {
            localStorage.setItem('insurance_leads', JSON.stringify(backendLeads));
            localStorage.setItem('leads', JSON.stringify(backendLeads));

            console.log(`✅ DATABASE SYNC: Synced ${backendLeads.length} leads from backend to localStorage`);

            // Refresh UI if on leads page
            if (window.location.hash === '#leads' && typeof window.loadLeadsView === 'function') {
                setTimeout(() => window.loadLeadsView(), 500);
            }

            return backendLeads;
        } else {
            console.warn('⚠️ DATABASE SYNC: No leads found in backend database');
            return [];
        }
    }

    // Override lead loading to always use backend database
    const originalLoadLeadsView = window.loadLeadsView;
    if (originalLoadLeadsView) {
        window.loadLeadsView = async function() {
            console.log('🔄 DATABASE SYNC: loadLeadsView called - loading from backend database');
            await syncBackendToLocalStorage();
            return originalLoadLeadsView.call(this);
        };
    }

    // Function to verify a lead exists in backend database before deletion
    async function verifyLeadInBackend(leadId) {
        try {
            const response = await fetch(`/api/leads/${leadId}`);
            const exists = response.status === 200;
            console.log(`🔄 DATABASE SYNC: Lead ${leadId} ${exists ? 'EXISTS' : 'DOES NOT EXIST'} in backend database`);
            return exists;
        } catch (error) {
            console.log(`🔄 DATABASE SYNC: Error checking lead ${leadId}:`, error);
            return false;
        }
    }

    // Enhanced deleteLead that checks backend database first
    const originalDeleteLead = window.deleteLead;

    window.deleteLead = async function(leadId) {
        console.log(`🔄 DATABASE SYNC: Attempting to delete lead ${leadId}`);

        if (!confirm('Are you sure you want to permanently delete this lead?')) {
            return;
        }

        // First, verify the lead exists in the backend database
        const existsInBackend = await verifyLeadInBackend(leadId);

        if (!existsInBackend) {
            console.warn(`⚠️ DATABASE SYNC: Lead ${leadId} does not exist in backend database`);

            // Remove from localStorage anyway since it shouldn't be there
            let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const beforeCount = leads.length;
            leads = leads.filter(l => String(l.id) !== String(leadId));
            const afterCount = leads.length;

            if (beforeCount > afterCount) {
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log(`🔄 DATABASE SYNC: Removed phantom lead ${leadId} from localStorage`);

                // Remove from UI
                const leadElement = document.querySelector(`[data-lead-id="${leadId}"]`) ||
                                   Array.from(document.querySelectorAll('tr')).find(row =>
                                       row.textContent.includes(leadId));
                if (leadElement) {
                    leadElement.remove();
                }

                // Refresh view to sync with backend
                await syncBackendToLocalStorage();

                alert('Phantom lead removed and view synced with backend database');
            } else {
                alert('Lead not found in backend database');
            }
            return;
        }

        // Lead exists in backend, proceed with normal deletion
        try {
            const response = await fetch(`/api/leads/${leadId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ DATABASE SYNC: Lead ${leadId} deleted from backend database`);

                // Remove from localStorage
                let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                leads = leads.filter(l => String(l.id) !== String(leadId));
                localStorage.setItem('insurance_leads', JSON.stringify(leads));

                // Track as deleted
                let deletedIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
                if (!deletedIds.includes(String(leadId))) {
                    deletedIds.push(String(leadId));
                    localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedIds));
                }

                // Remove from UI
                const leadElement = document.querySelector(`[data-lead-id="${leadId}"]`) ||
                                   Array.from(document.querySelectorAll('tr')).find(row =>
                                       row.textContent.includes(leadId));
                if (leadElement) {
                    leadElement.remove();
                }

                alert('Lead permanently deleted from backend database!');

                // Sync localStorage with backend to ensure consistency
                await syncBackendToLocalStorage();

            } else {
                throw new Error(`Delete failed with status: ${response.status}`);
            }

        } catch (error) {
            console.error(`❌ DATABASE SYNC: Error deleting lead ${leadId}:`, error);
            alert(`Failed to delete lead: ${error.message}`);
        }
    };

    // Function to sync all data on page load
    async function initializeSync() {
        console.log('🔄 DATABASE SYNC: Initializing...');
        await syncBackendToLocalStorage();
    }

    // Initialize sync when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSync);
    } else {
        setTimeout(initializeSync, 1000);
    }

    // Expose sync function globally
    window.syncWithBackendDatabase = syncBackendToLocalStorage;
    window.verifyLeadInBackend = verifyLeadInBackend;

    console.log('✅ DATABASE SYNC FIX: Loaded - all operations now use backend database');

})();