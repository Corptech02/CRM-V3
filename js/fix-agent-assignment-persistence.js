// Fix for persisting agent assignments to server
// This ensures assigned_to field is saved like the stage field

(function() {
    'use strict';
    console.log('🔧 Loading agent assignment persistence fix...');

    // Create a function to update agent assignment that saves to server
    window.updateAgentAssignment = async function(leadId, newAgent) {
        console.log(`📝 Updating agent assignment: ${leadId} → ${newAgent || 'Unassigned'}`);

        if (!leadId) {
            console.error('Missing leadId');
            return;
        }

        try {
            // Convert leadId to string for consistency
            leadId = String(leadId);

            // Get leads from both localStorage keys
            let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

            let foundInInsurance = false;
            let foundInRegular = false;

            // Update in insurance_leads
            const insuranceIndex = insurance_leads.findIndex(l => String(l.id) === leadId);
            if (insuranceIndex !== -1) {
                insurance_leads[insuranceIndex].assigned_to = newAgent;
                insurance_leads[insuranceIndex].assignedTo = newAgent; // Also update camelCase version
                insurance_leads[insuranceIndex].assignmentUpdatedAt = new Date().toISOString();
                foundInInsurance = true;
                console.log('✅ Updated in insurance_leads');
            }

            // Update in regular leads
            const regularIndex = regular_leads.findIndex(l => String(l.id) === leadId);
            if (regularIndex !== -1) {
                regular_leads[regularIndex].assigned_to = newAgent;
                regular_leads[regularIndex].assignedTo = newAgent; // Also update camelCase version
                regular_leads[regularIndex].assignmentUpdatedAt = new Date().toISOString();
                foundInRegular = true;
                console.log('✅ Updated in leads');
            }

            // If not found in either, check memory store
            if (!foundInInsurance && !foundInRegular) {
                console.warn('Lead not found in localStorage, checking memory store...');

                if (window.leadStore && window.leadStore[leadId]) {
                    const lead = window.leadStore[leadId];
                    lead.assigned_to = newAgent;
                    lead.assignedTo = newAgent;
                    lead.assignmentUpdatedAt = new Date().toISOString();

                    // Add to both arrays
                    insurance_leads.push(lead);
                    regular_leads.push(lead);

                    console.log('✅ Added from memory store to localStorage');
                } else {
                    console.error('Lead not found anywhere!');
                    if (window.showNotification) {
                        showNotification('Error: Lead not found', 'error');
                    }
                    return;
                }
            }

            // Save to BOTH localStorage keys
            localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
            localStorage.setItem('leads', JSON.stringify(regular_leads));
            console.log('💾 Saved to both localStorage keys');

            // Update in memory store if it exists
            if (window.leadStore && window.leadStore[leadId]) {
                window.leadStore[leadId].assigned_to = newAgent;
                window.leadStore[leadId].assignedTo = newAgent;
                window.leadStore[leadId].assignmentUpdatedAt = new Date().toISOString();
            }

            // Save to API with full lead object
            try {
                // Get the full lead object
                let leadToUpdate = insurance_leads.find(l => String(l.id) === leadId) ||
                                  regular_leads.find(l => String(l.id) === leadId);

                // If not in localStorage, fetch from server
                if (!leadToUpdate) {
                    const apiUrl = window.VANGUARD_API_URL ||
                                 (window.location.hostname === 'localhost'
                                   ? 'http://localhost:3001'
                                   : `http://${window.location.hostname}:3001`);

                    const getResponse = await fetch(`${apiUrl}/api/leads`);
                    const allLeads = await getResponse.json();
                    leadToUpdate = allLeads.find(l => String(l.id) === leadId);
                }

                if (leadToUpdate) {
                    // Update the assignedTo in the lead object
                    leadToUpdate.assignedTo = newAgent;
                    leadToUpdate.assigned_to = newAgent;
                    leadToUpdate.assignmentUpdatedAt = new Date().toISOString();

                    // Use the correct API URL and POST method
                    const apiUrl = window.VANGUARD_API_URL ||
                                 (window.location.hostname === 'localhost'
                                   ? 'http://localhost:3001'
                                   : `http://${window.location.hostname}:3001`);

                    const response = await fetch(`${apiUrl}/api/leads`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(leadToUpdate)
                    });

                    if (response.ok) {
                        console.log('✅ Agent assignment updated in API');
                    } else {
                        console.warn('API update failed, but saved locally');
                    }
                } else {
                    console.error('Lead not found for update');
                }
            } catch (error) {
                console.log('API not available, saved locally only');
            }

            // Update the display immediately
            updateAgentDisplay(leadId, newAgent);

            // Show success message
            if (window.showNotification) {
                showNotification(`Lead assigned to ${newAgent || 'Unassigned'}`, 'success');
            }

            // Refresh the view if needed
            if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
                setTimeout(() => {
                    if (window.loadLeadsView) {
                        window.loadLeadsView();
                    }
                }, 500);
            }

            return true;

        } catch (error) {
            console.error('Error updating agent assignment:', error);
            if (window.showNotification) {
                showNotification('Error updating assignment', 'error');
            }
            return false;
        }
    };

    // Helper function to update agent display in the UI
    function updateAgentDisplay(leadId, newAgent) {
        // Update dropdown if visible
        const agentSelect = document.querySelector(`[id*="agent-${leadId}"], [id*="assigned-${leadId}"]`);
        if (agentSelect) {
            agentSelect.value = newAgent || '';
        }

        // Update text displays
        const agentDisplays = document.querySelectorAll(`[data-agent-id="${leadId}"]`);
        agentDisplays.forEach(display => {
            display.textContent = newAgent || 'Unassigned';
        });

        // Update in any tables
        const tableRows = document.querySelectorAll(`tr[data-lead-id="${leadId}"]`);
        tableRows.forEach(row => {
            const agentCell = row.querySelector('.agent-cell, td:nth-child(7)'); // Adjust based on table structure
            if (agentCell) {
                agentCell.textContent = newAgent || 'Unassigned';
            }
        });

        console.log(`📊 Updated agent display for lead ${leadId}`);
    }

    // Override the updateLeadField function to use our new agent assignment function
    const originalUpdateLeadField = window.updateLeadField;
    window.updateLeadField = function(leadId, fieldName, value) {
        console.log(`Updating field: ${fieldName} for lead ${leadId}`);

        // If it's the assigned_to field, use our special function
        if (fieldName === 'assigned_to' || fieldName === 'assignedTo') {
            return window.updateAgentAssignment(leadId, value);
        }

        // Otherwise, use the original function if it exists
        if (originalUpdateLeadField) {
            return originalUpdateLeadField(leadId, fieldName, value);
        }

        // Fallback: update locally
        leadId = String(leadId);

        // Update in all localStorage keys
        ['insurance_leads', 'leads'].forEach(key => {
            const leads = JSON.parse(localStorage.getItem(key) || '[]');
            const leadIndex = leads.findIndex(l => String(l.id) === leadId);

            if (leadIndex !== -1) {
                leads[leadIndex][fieldName] = value;
                // Also update camelCase/snake_case variants
                if (fieldName === 'assigned_to') {
                    leads[leadIndex].assignedTo = value;
                } else if (fieldName === 'assignedTo') {
                    leads[leadIndex].assigned_to = value;
                }
                localStorage.setItem(key, JSON.stringify(leads));
            }
        });

        // Try to save to API
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : 'http://162-220-14-239.nip.io:8897';

            fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [fieldName]: value })
            }).then(response => {
                if (response.ok) {
                    console.log(`✅ ${fieldName} updated in API`);
                }
            }).catch(error => {
                console.log('API not available, saved locally only');
            });
        } catch (error) {
            console.log('Error saving to API:', error);
        }

        // Update display
        if (window.showNotification) {
            showNotification(`${fieldName} updated`, 'success');
        }
    };

    // Also handle the assignLeadToAgent function if it exists
    window.assignLeadToAgent = function(leadId, agentName) {
        console.log(`Assigning lead ${leadId} to agent: ${agentName}`);
        return window.updateAgentAssignment(leadId, agentName);
    };

    console.log('✅ Agent assignment persistence fix loaded');

    // Make functions globally available
    window.updateAgentDisplay = updateAgentDisplay;
})();