// Simple lead profile that works
(function() {
    'use strict';

    console.log('📋 SIMPLE-LEAD-PROFILE: Initializing...');

    // Override showLeadProfile with a simple working version
    window.showLeadProfile = function(leadId) {
        console.log(`Opening simple profile for lead: ${leadId}`);

        // Convert ID to string for consistency
        leadId = String(leadId);

        // Get lead data
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let lead = leads.find(l => String(l.id) === leadId);

        if (!lead) {
            leads = JSON.parse(localStorage.getItem('leads') || '[]');
            lead = leads.find(l => String(l.id) === leadId);
        }

        // Fallback to server if not found locally
        if (!lead) {
            console.log('Lead not found locally, trying server...');
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            fetch(`${apiUrl}/api/leads/${leadId}`)
                .then(response => response.json())
                .then(serverLead => {
                    if (serverLead && !serverLead.error) {
                        console.log('Found lead on server, showing profile');
                        // Show the profile with server data
                        window.showLeadProfile_withData(leadId, serverLead);
                    } else {
                        console.error('Lead not found on server either');
                        alert(`Lead not found (ID: ${leadId}). This lead may have been deleted or archived.`);
                        // Refresh the leads view to remove stale entries
                        if (typeof loadLeadsView === 'function') {
                            loadLeadsView();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching lead from server:', error);
                    alert(`Lead not found (ID: ${leadId}). This lead may have been deleted or archived.`);
                    // Refresh the leads view to remove stale entries
                    if (typeof loadLeadsView === 'function') {
                        loadLeadsView();
                    }
                });
            return;
        }


        console.log('Found lead:', lead.name);

        // Remove any existing profile
        const existing = document.getElementById('simple-lead-profile');
        if (existing) {
            existing.remove();
        }

        // Create simple profile modal
        const modal = document.createElement('div');
        modal.id = 'simple-lead-profile';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 8px;
                padding: 20px;
                position: relative;
            ">
                <button onclick="document.getElementById('simple-lead-profile').remove()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: red;
                    color: white;
                    border: none;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                ">×</button>

                <h2 style="margin-top: 0;">Lead Profile: ${lead.name || 'Unknown'}</h2>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div>
                        <label style="font-weight: bold;">Name:</label>
                        <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 5px;" onchange="updateLeadField('${leadId}', 'name', this.value)">
                    </div>
                    <div>
                        <label style="font-weight: bold;">Phone:</label>
                        <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 5px;" onchange="updateLeadField('${leadId}', 'phone', this.value)">
                    </div>
                    <div>
                        <label style="font-weight: bold;">Email:</label>
                        <input type="text" value="${lead.email || ''}" style="width: 100%; padding: 5px;" onchange="updateLeadField('${leadId}', 'email', this.value)">
                    </div>
                    <div>
                        <label style="font-weight: bold;">Product:</label>
                        <input type="text" value="${lead.product || ''}" style="width: 100%; padding: 5px;" onchange="updateLeadField('${leadId}', 'product', this.value)">
                    </div>
                    <div>
                        <label style="font-weight: bold;">Stage:</label>
                        <select style="width: 100%; padding: 5px;" onchange="updateLeadField('${leadId}', 'stage', this.value)">
                            <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                            <option value="info_requested" ${lead.stage === 'info_requested' ? 'selected' : ''}>Info Requested</option>
                            <option value="info_received" ${lead.stage === 'info_received' ? 'selected' : ''}>Info Received</option>
                            <option value="loss_runs_requested" ${lead.stage === 'loss_runs_requested' ? 'selected' : ''}>Loss Runs Requested</option>
                            <option value="loss_runs_received" ${lead.stage === 'loss_runs_received' ? 'selected' : ''}>Loss Runs Received</option>
                            <option value="app_prepared" ${lead.stage === 'app_prepared' ? 'selected' : ''}>App Prepared</option>
                            <option value="app_sent" ${lead.stage === 'app_sent' ? 'selected' : ''}>App Sent</option>
                            <option value="app_quote_received" ${lead.stage === 'app_quote_received' ? 'selected' : ''}>App Quote Received</option>
                            <option value="app_quote_sent" ${lead.stage === 'app_quote_sent' ? 'selected' : ''}>App Quote Sent</option>
                            <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                            <option value="quote_sent" ${lead.stage === 'quote_sent' ? 'selected' : ''}>Quote Sent</option>
                            <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                            <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                            <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight: bold;">Premium:</label>
                        <input type="text" value="${lead.premium || ''}" style="width: 100%; padding: 5px;" onchange="updateLeadField('${leadId}', 'premium', this.value)">
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    <label style="font-weight: bold;">Notes:</label>
                    <textarea style="width: 100%; height: 100px; padding: 5px;" onchange="updateLeadField('${leadId}', 'notes', this.value)">${lead.notes || ''}</textarea>
                </div>

                <!-- Quote Submissions Section -->
                <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>Quote Submissions</h3>
                        <button onclick="showAddQuoteForm('${leadId}')" style="
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                        ">+ Add Quote</button>
                    </div>
                    <div id="quote-submissions-container">
                        ${renderQuotes(lead)}
                    </div>
                </div>

                <div style="margin-top: 20px; text-align: right;">
                    <button onclick="document.getElementById('simple-lead-profile').remove()" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('✅ Simple profile added to DOM');
    };

    // Simple quote renderer
    function renderQuotes(lead) {
        if (!lead.quotes || lead.quotes.length === 0) {
            return '<p style="color: #999;">No quotes yet</p>';
        }

        return lead.quotes.map(quote => `
            <div style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>${quote.carrier || 'Unknown'}</strong><br>
                        Premium: $${(quote.premium || 0).toLocaleString()}<br>
                        ${quote.notes ? `Notes: ${quote.notes}` : ''}
                    </div>
                    <button onclick="deleteQuote('${lead.id}', '${quote.id}')" style="
                        background: red;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                    ">Delete</button>
                </div>
            </div>
        `).join('');
    }

    window.renderQuotes = renderQuotes;

    // Helper function to show profile with server data
    window.showLeadProfile_withData = function(leadId, lead) {
        console.log('Showing profile with server data for:', leadId);

        // Call the main function but inject the lead data
        const originalConsole = console.log;

        // Temporarily store server data in localStorage for the profile to use
        const tempLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        tempLeads.push(lead);
        localStorage.setItem('insurance_leads', JSON.stringify(tempLeads));

        // Call the profile function
        window.showLeadProfile(leadId);

        // Clean up - remove the temporary lead after profile loads
        setTimeout(() => {
            const cleanedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const filteredLeads = cleanedLeads.filter(l => String(l.id) !== String(leadId) || l.name !== lead.name);
            localStorage.setItem('insurance_leads', JSON.stringify(filteredLeads));
        }, 2000);
    };

    // Don't override viewLead here, let fix-view-lead-click.js handle it

    console.log('✅ SIMPLE-LEAD-PROFILE: Ready');
})();