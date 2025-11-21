// Restore Original Lead Profile UI Design
console.log('🔧 Restoring original immediate leads UI design...');

// Function to restore the original UI
function restoreOriginalUI() {
    console.log('Forcing restoration of original lead profile UI...');

    // Remove any existing enhanced profile modals
    const existingModals = document.querySelectorAll('#lead-profile-container');
    existingModals.forEach(modal => modal.remove());

    // Enhanced viewLead with database synchronization and Application Submissions
    window.viewLead = async function(leadId) {
        console.log('Opening ENHANCED lead profile with sync for:', leadId);

        // Convert ID to string for consistent comparison
        const searchId = String(leadId);

        // Function to find lead with multiple strategies
        function findLead(leads, id) {
            // Strategy 1: Exact string match
            let lead = leads.find(l => String(l.id) === id);
            if (lead) return lead;

            // Strategy 2: Exact match without conversion
            lead = leads.find(l => l.id === id);
            if (lead) return lead;

            // Strategy 3: Numeric comparison
            const numericId = parseInt(id);
            if (!isNaN(numericId)) {
                lead = leads.find(l => parseInt(l.id) === numericId);
                if (lead) return lead;
            }

            return null;
        }

        // First, try to find the lead in localStorage
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let lead = findLead(leads, searchId);

        if (!lead) {
            console.log('❌ Lead not found in localStorage, syncing from database...');

            try {
                // Try to sync from database
                const response = await fetch('/api/leads', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                    const dbLeads = data.leads || data || [];
                    console.log(`📥 Synced ${dbLeads.length} leads from database`);

                    // Merge with existing leads
                    const mergedLeads = [...leads];
                    dbLeads.forEach(dbLead => {
                        const exists = mergedLeads.find(l => String(l.id) === String(dbLead.id));
                        if (!exists) {
                            mergedLeads.push(dbLead);
                        }
                    });

                    localStorage.setItem('insurance_leads', JSON.stringify(mergedLeads));
                    leads = mergedLeads;
                    lead = findLead(leads, searchId);
                }

                // If still not found, try direct fetch
                if (!lead) {
                    console.log('Trying direct database fetch...');
                    const directResponse = await fetch(`/api/leads/${searchId}`);
                    if (directResponse.ok) {
                        const leadData = await directResponse.json();
                        lead = leadData.lead || leadData;

                        if (lead) {
                            leads.push(lead);
                            localStorage.setItem('insurance_leads', JSON.stringify(leads));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to sync from database:', error);
            }
        }

        if (!lead) {
            console.error('Lead not found anywhere:', searchId);
            const errorMessage = `Lead not found (ID: ${searchId}). This may be due to a data synchronization issue. Would you like to refresh the page to sync data?`;
            if (confirm(errorMessage)) {
                window.location.reload();
            }
            return false;
        }

        console.log('✅ Lead found:', lead.name);

        // Use the enhanced profile system that includes Application Submissions
        if (window.createEnhancedProfile && typeof window.createEnhancedProfile === 'function') {
            console.log('📋 Using createEnhancedProfile with Application Submissions support');
            window.createEnhancedProfile(lead);
            return true;
        }

        console.log('⚠️ Enhanced profile not available, falling back to original');

        // Fallback logic would continue here...

        // Remove any existing modals first
        const existingModal = document.getElementById('lead-profile-container');
        if (existingModal) {
            existingModal.remove();
        }

        // Call the showLeadProfile function - this should be the original from app.js
        if (typeof showLeadProfile === 'function') {
            // Call showLeadProfile with just the lead object
            showLeadProfile(lead);
        } else {
            console.error('showLeadProfile function not found - using fallback');
            // Fallback: trigger the original functionality
            if (window.originalViewLead) {
                window.originalViewLead(leadId);
            }
        }

        return false;
    };

    console.log('✅ Original lead profile UI restored');
}

// Run immediately
restoreOriginalUI();

// Also run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreOriginalUI);
} else {
    // DOM is already loaded, run after a short delay to override other scripts
    setTimeout(restoreOriginalUI, 100);
}

// Run again after all scripts have loaded
window.addEventListener('load', function() {
    setTimeout(restoreOriginalUI, 500);
});