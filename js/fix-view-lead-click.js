// Fix for viewLead function - ensures lead profile opens when eye icon is clicked
(function() {
    'use strict';

    console.log('🔧 FIX-VIEW-LEAD-CLICK: Initializing...');

    // Store reference to the correct viewLead function
    let correctViewLead = null;

    // Check what viewLead functions are available
    if (window.viewLead) {
        console.log('✅ Found existing viewLead function');
        correctViewLead = window.viewLead;
    }

    // Override viewLead to ensure it works
    window.viewLead = function(leadId) {
        console.log(`👁️ View Lead clicked with ID: ${leadId}`);

        // Convert to string for consistency
        leadId = String(leadId);

        // Always use showLeadProfile if available
        if (window.showLeadProfile && typeof window.showLeadProfile === 'function') {
            console.log('✅ Opening lead profile...');
            window.showLeadProfile(leadId);
            return false; // Prevent any other handling
        }

        // Fallback to standard view
        console.log('📋 Using standard lead view');

        // Get the lead data
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let lead = leads.find(l => String(l.id) === leadId);

        if (!lead) {
            leads = JSON.parse(localStorage.getItem('leads') || '[]');
            lead = leads.find(l => String(l.id) === leadId);
        }

        if (!lead) {
            console.error(`❌ Lead not found: ${leadId}`);
            alert('Lead not found');
            return;
        }

        console.log(`✅ Found lead: ${lead.name}`);

        // Use the enhanced profile viewer
        if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        } else {
            // Fallback: Create basic lead view
            console.log('⚠️ No lead profile viewer available, creating basic view...');

            const dashboardContent = document.querySelector('.dashboard-content');
            if (!dashboardContent) {
                alert('Cannot display lead - dashboard not found');
                return;
            }

            // Basic lead display
            dashboardContent.innerHTML = `
                <div class="lead-profile">
                    <header class="content-header">
                        <button class="btn-text" onclick="loadLeadsView()">
                            <i class="fas fa-arrow-left"></i> Back to Leads
                        </button>
                        <h1>Lead Profile: ${lead.name}</h1>
                    </header>
                    <div class="profile-section">
                        <h2>Lead Information</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Name:</label>
                                <p>${lead.name || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Phone:</label>
                                <p>${lead.phone || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Email:</label>
                                <p>${lead.email || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Product:</label>
                                <p>${lead.product || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Stage:</label>
                                <p>${lead.stage || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Premium:</label>
                                <p>$${(lead.premium || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn-primary" onclick="loadLeadsView()">Close</button>
                    </div>
                </div>
            `;
        }
    };

    // Remove this event listener as it might interfere
    // The onclick attribute on the button already handles the click

    // Fix the profile closing function as well
    window.closeLeadProfile = function() {
        console.log('🚪 Closing lead profile');

        // Try to remove modal overlay
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.remove();
        }

        // Try to remove lead profile modal
        const profileModal = document.querySelector('.lead-profile-modal');
        if (profileModal && profileModal.parentElement) {
            profileModal.parentElement.remove();
        }

        // If neither worked, reload the leads view
        if (window.loadLeadsView && typeof window.loadLeadsView === 'function') {
            window.loadLeadsView();
        }
    };

    console.log('✅ FIX-VIEW-LEAD-CLICK: Ready - eye icons should now open lead profiles');
})();