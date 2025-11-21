/**
 * Fix lead stage saving to database - uses correct API endpoint
 */

(function() {
    'use strict';
    
    console.log('Lead stage database save fix loaded');
    
    // Override updateLeadStage to save to database
    window.updateLeadStage = async function(leadId, newStage) {
        console.log('Updating lead stage:', leadId, 'to', newStage);
        
        // Update localStorage first
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || 
                               localStorage.getItem('leads') || '[]');
        
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                console.log('Found lead, updating stage from', leads[i].stage, 'to', newStage);
                leads[i].stage = newStage;
                leadFound = true;
                
                // Save to localStorage
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));
                
                // Save to database immediately
                await saveStageToDatabase(leads[i], newStage);
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found:', leadId);
            showNotification('Lead not found', 'error');
            return;
        }
    };
    
    // Function to save stage to database
    async function saveStageToDatabase(lead, newStage) {
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;
        
        try {
            // Update the lead object with new stage
            const updatedLead = { ...lead, stage: newStage };
            
            console.log('Saving stage to database via PUT /api/leads/' + lead.id);
            
            const response = await fetch(`${apiUrl}/api/leads/${lead.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedLead)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Stage saved to database:', data);
                
                // Show success notification
                if (window.showNotification) {
                    showNotification(`Stage updated to: ${newStage}`, 'success');
                } else {
                    // Fallback notification
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #10b981;
                        color: white;
                        padding: 12px 20px;
                        border-radius: 6px;
                        z-index: 10000;
                        animation: slideIn 0.3s ease;
                    `;
                    notification.innerHTML = `✓ Stage updated to: ${newStage}`;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                }
                
                // Refresh the leads table if visible
                refreshLeadsTable();
                
            } else {
                const error = await response.text();
                console.error('Failed to save stage:', error);
                showNotification('Failed to save stage to server', 'error');
            }
        } catch (error) {
            console.error('Error saving stage:', error);
            showNotification('Error saving stage: ' + error.message, 'error');
        }
    }
    
    // Function to refresh leads table
    function refreshLeadsTable() {
        // Check if we're on the leads view
        const leadsTable = document.querySelector('.leads-table, #leadsTable, .table-container');
        if (leadsTable) {
            console.log('Refreshing leads table...');
            
            // Re-render the table with updated data
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            
            // Find the tbody
            const tbody = leadsTable.querySelector('tbody');
            if (tbody) {
                // Get current rows to preserve order
                const rows = tbody.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const leadIdCell = row.querySelector('[onclick*="viewLead"]');
                    if (leadIdCell) {
                        const onclickStr = leadIdCell.getAttribute('onclick');
                        const match = onclickStr.match(/viewLead\(['"]([^'"]+)['"]/);;
                        if (match) {
                            const rowLeadId = match[1];
                            const lead = leads.find(l => String(l.id) === String(rowLeadId));
                            
                            if (lead) {
                                // Update stage badge in this row
                                const stageBadge = row.querySelector('.badge.stage, [class*="badge-"]');
                                if (stageBadge) {
                                    // Update badge class and text
                                    stageBadge.className = `badge badge-${lead.stage || 'new'}`;
                                    stageBadge.textContent = (lead.stage || 'new').replace('-', ' ').toUpperCase();
                                    console.log('Updated stage badge for lead', rowLeadId);
                                }
                            }
                        }
                    }
                });
            }
        }
    }
    
    // Also override updateLeadStatus for consistency
    window.updateLeadStatus = async function(leadId, newStatus) {
        console.log('Updating lead status:', leadId, 'to', newStatus);
        
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || 
                               localStorage.getItem('leads') || '[]');
        
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                console.log('Found lead, updating status from', leads[i].status, 'to', newStatus);
                leads[i].status = newStatus;
                leadFound = true;
                
                // Save to localStorage
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));
                
                // Save to database
                const apiUrl = window.location.hostname === 'localhost'
                    ? 'http://localhost:8897'
                    : `http://${window.location.hostname}:8897`;
                
                try {
                    const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(leads[i])
                    });
                    
                    if (response.ok) {
                        console.log('Status saved to database');
                        showNotification(`Status updated to: ${newStatus}`, 'success');
                        refreshLeadsTable();
                    }
                } catch (error) {
                    console.error('Error saving status:', error);
                }
                
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for status update:', leadId);
        }
    };
    
    // Add CSS for notification animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    console.log('Lead stage/status database save system installed');
    
})();