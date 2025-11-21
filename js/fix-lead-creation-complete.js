// Complete fix for lead creation issues
(function() {
    'use strict';

    console.log('🔧 Loading complete lead creation fix...');

    // Override the saveNewLead function to ensure it works properly
    window.saveNewLead = async function(event) {
        if (event) event.preventDefault();

        console.log('📝 Starting lead creation...');

        try {
            // Get all form values directly
            const companyName = document.getElementById('leadCompanyName')?.value || '';
            const contactName = document.getElementById('leadContact')?.value || '';
            const phone = document.getElementById('leadPhone')?.value || '';
            const email = document.getElementById('leadEmail')?.value || '';
            const dotNumber = document.getElementById('leadDOT')?.value || '';
            const mcNumber = document.getElementById('leadMC')?.value || '';
            const yearsInBusiness = document.getElementById('leadYearsInBusiness')?.value || '';
            const fleetSize = document.getElementById('leadFleetSize')?.value || '';
            const radius = document.getElementById('leadRadius')?.value || '';
            const commodity = document.getElementById('leadCommodity')?.value || '';
            const operatingStates = document.getElementById('leadOperatingStates')?.value || '';
            const stage = document.getElementById('leadStage')?.value || 'new';
            const status = document.getElementById('leadStatus')?.value || 'Active';
            const premium = document.getElementById('leadPremium')?.value || '0';
            const winLoss = document.getElementById('leadWinLoss')?.value || 'neutral';
            const notes = document.getElementById('leadNotes')?.value || '';

            // Generate a unique ID
            const leadId = `L${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

            console.log('📋 Form data collected:', {
                id: leadId,
                companyName,
                contactName,
                phone,
                email
            });

            // Create the lead object with consistent field names
            const newLead = {
                id: leadId,
                name: companyName,
                contact: contactName,
                phone: phone,
                email: email,
                company: companyName,
                dotNumber: dotNumber,
                mcNumber: mcNumber,
                yearsInBusiness: yearsInBusiness,
                fleetSize: fleetSize,
                radiusOfOperation: radius,
                commodityHauled: commodity,
                operatingStates: operatingStates,
                product: 'Commercial Auto',
                premium: parseFloat(premium) || 0,
                stage: stage,
                status: status,
                win_loss: winLoss,
                notes: notes,
                assignedTo: 'Unassigned',
                source: 'Manual Entry',
                created: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString(),
                renewalDate: '',
                quotes: []
            };

            // Try to save to API first
            let apiSaved = false;
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : 'http://162-220-14-239.nip.io:8897';

            try {
                // Prepare data for API (snake_case)
                const apiData = {
                    id: leadId,
                    company_name: companyName,
                    contact_name: contactName,
                    phone: phone,
                    email: email,
                    dot_number: dotNumber,
                    mc_number: mcNumber,
                    years_in_business: yearsInBusiness,
                    fleet_size: fleetSize,
                    radius_of_operation: radius,
                    commodity_hauled: commodity,
                    operating_states: operatingStates,
                    product: 'Commercial Auto Insurance',
                    premium: parseFloat(premium) || 0,
                    stage: stage,
                    status: status,
                    win_loss: winLoss,
                    notes: notes,
                    source: 'Manual Entry'
                };

                console.log('🌐 Sending to API:', apiUrl + '/api/leads');

                const response = await fetch(apiUrl + '/api/leads', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(apiData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ API save successful:', result);
                    // Use the API-generated ID if provided
                    if (result.id) {
                        newLead.id = result.id;
                    }
                    apiSaved = true;
                } else {
                    const errorText = await response.text();
                    console.warn('⚠️ API save failed:', response.status, errorText);
                }
            } catch (error) {
                console.warn('⚠️ API error, will save locally:', error);
            }

            // Always save to localStorage for immediate display
            let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

            // Remove any existing lead with the same ID (shouldn't happen but just in case)
            leads = leads.filter(l => l.id !== newLead.id);

            // Add the new lead at the beginning
            leads.unshift(newLead);

            // Save to both localStorage keys
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));

            console.log('💾 Lead saved to localStorage. Total leads:', leads.length);
            console.log('📊 New lead details:', newLead);

            // Close modal
            if (window.closeNewLeadModal) {
                window.closeNewLeadModal();
            }

            // Show success message
            if (window.showNotification) {
                const message = apiSaved
                    ? `Lead "${companyName}" created successfully!`
                    : `Lead "${companyName}" saved locally (offline mode)`;
                window.showNotification(message, 'success');
            }

            // Refresh the leads view
            if (window.loadLeadsView) {
                console.log('🔄 Refreshing leads view...');
                await window.loadLeadsView();
            }

            return newLead;

        } catch (error) {
            console.error('❌ Error creating lead:', error);
            if (window.showNotification) {
                window.showNotification('Error creating lead: ' + error.message, 'error');
            }
        }
    };

    // Also fix the viewLead function to handle leads properly
    const originalViewLead = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('👁️ View lead called with ID:', leadId);

        // Check if lead was already found by another handler
        if (window.currentViewLead && String(window.currentViewLead.id) === String(leadId)) {
            console.log('✅ Lead already found by another handler, continuing with profile creation');
            // Continue to create/show the profile
            if (window.createEnhancedProfile) {
                window.createEnhancedProfile(window.currentViewLead);
            } else if (window.showLeadProfile) {
                window.showLeadProfile(window.currentViewLead);
            }
            return;
        }

        // If leadId is undefined or null, try to extract from event
        if (!leadId && event && event.currentTarget) {
            const onclick = event.currentTarget.getAttribute('onclick');
            const match = onclick?.match(/viewLead\(['"]?([^'"]+)['"]?\)/);
            if (match) {
                leadId = match[1];
                console.log('📍 Extracted lead ID from onclick:', leadId);
            }
        }

        if (!leadId) {
            console.error('❌ No lead ID provided to viewLead');
            if (window.showNotification) {
                window.showNotification('Error: Lead ID not found', 'error');
            }
            return;
        }

        // Call the original function with the lead ID
        if (originalViewLead) {
            originalViewLead(leadId);
        }
    };

    // Fix the lead table generation to ensure IDs are included
    const originalGenerateRows = window.generateSimpleLeadRows;
    window.generateSimpleLeadRows = function(leads) {
        if (!leads || leads.length === 0) {
            return '<tr><td colspan="10" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
        }

        console.log('📊 Generating rows for', leads.length, 'leads');

        return leads.map(lead => {
            // Ensure lead has an ID
            if (!lead.id) {
                console.warn('⚠️ Lead without ID found:', lead);
                lead.id = `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }

            const displayName = lead.name && lead.name.length > 15
                ? lead.name.substring(0, 15) + '...'
                : (lead.name || 'Unnamed Lead');

            const leadIdStr = String(lead.id);

            return `
                <tr>
                    <td>
                        <input type="checkbox" class="lead-checkbox" value="${leadIdStr}"
                               data-lead='${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                    </td>
                    <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline; display: block;
                                       overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                onclick="viewLead('${leadIdStr}')" title="${lead.name || 'Unnamed Lead'}">
                            ${displayName}
                        </strong>
                    </td>
                    <td>
                        <div class="contact-info" style="display: flex; gap: 10px; align-items: center;">
                            <a href="tel:${lead.phone || ''}" title="${lead.phone || 'No phone'}"
                               style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-phone"></i>
                            </a>
                            <a href="mailto:${lead.email || ''}" title="${lead.email || 'No email'}"
                               style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </td>
                    <td>${lead.product || 'Commercial Auto'}</td>
                    <td>$${(lead.premium || 0).toLocaleString()}</td>
                    <td>${window.getStageHtml ? window.getStageHtml(lead.stage || 'new') : lead.stage || 'new'}</td>
                    <td>${lead.renewalDate || 'N/A'}</td>
                    <td>${lead.assignedTo || 'Unassigned'}</td>
                    <td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="viewLead('${leadIdStr}')" title="View Lead">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="deleteLead('${leadIdStr}')" title="Delete Lead"
                                    style="color: #dc2626;">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="btn-icon" onclick="convertLead('${leadIdStr}')" title="Convert to Client">
                                <i class="fas fa-user-check"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    console.log('✅ Complete lead creation fix loaded successfully!');
})();