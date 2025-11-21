// API Integration Layer for Vanguard Insurance
// This file bridges the existing app functions with the new comprehensive API

console.log('Loading API Integration Layer...');

// Wait for DOM and API service to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('API Integration Layer Ready');
    initializeAPIIntegration();
});

function initializeAPIIntegration() {
    // Override existing functions to use the new API service

    // Override lead loading function
    if (window.loadLeadsView) {
        const originalLoadLeadsView = window.loadLeadsView;
        window.loadLeadsView = async function() {
            console.log('Loading leads from comprehensive API...');

            try {
                // First load the UI
                originalLoadLeadsView();

                // Then load data from API
                if (window.apiService) {
                    const leads = await window.apiService.getLeads();

                    // Update the leads table with API data
                    if (Array.isArray(leads)) {
                        // Store in localStorage for compatibility
                        localStorage.setItem('leads', JSON.stringify(leads));

                        // Refresh the table display
                        if (window.generateSimpleLeadRows) {
                            const tableBody = document.getElementById('leadsTableBody');
                            if (tableBody) {
                                tableBody.innerHTML = window.generateSimpleLeadRows(leads);
                            }
                        }

                        console.log(`Loaded ${leads.length} leads from API`);
                    }
                }
            } catch (error) {
                console.error('Failed to load leads from API:', error);
                // Fall back to original function
                originalLoadLeadsView();
            }
        };
    }

    // Override save new lead function
    if (window.saveNewLead) {
        const originalSaveNewLead = window.saveNewLead;
        window.saveNewLead = async function(event) {
            if (event) event.preventDefault();

            try {
                // Get form data
                const form = document.getElementById('newLeadForm');
                if (!form) return;

                const formData = new FormData(form);
                const leadData = {
                    name: formData.get('leadName'),
                    contact: formData.get('contactName') || formData.get('leadName'),
                    company: formData.get('company'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    product: formData.get('product') || 'Commercial Auto Insurance',
                    premium: parseFloat(formData.get('premium')) || 0,
                    stage: 'new',
                    priority: formData.get('priority') || 'medium',
                    assignedTo: formData.get('assignedTo') || 'Unassigned',
                    source: 'Manual Entry',
                    renewalDate: formData.get('renewalDate') || '',
                    notes: formData.get('notes') || ''
                };

                // Use API service to create lead
                if (window.apiService) {
                    const newLead = await window.apiService.createLead(leadData);
                    console.log('Lead created via API:', newLead);

                    // Close modal and refresh view
                    if (window.closeNewLeadModal) {
                        window.closeNewLeadModal();
                    }

                    // Refresh leads view
                    if (window.loadLeadsView) {
                        window.loadLeadsView();
                    }

                    // Show success message
                    showNotification('Lead created successfully!', 'success');

                } else {
                    // Fall back to original function
                    originalSaveNewLead(event);
                }

            } catch (error) {
                console.error('Failed to save lead via API:', error);
                showNotification('Failed to save lead: ' + error.message, 'error');

                // Fall back to original function
                originalSaveNewLead(event);
            }
        };
    }

    // Override save lead edits function
    if (window.saveLeadEdits) {
        const originalSaveLeadEdits = window.saveLeadEdits;
        window.saveLeadEdits = async function(leadId) {
            try {
                // Get form data
                const form = document.getElementById('editLeadForm');
                if (!form) return;

                const formData = new FormData(form);
                const leadData = {
                    name: formData.get('leadName'),
                    contact: formData.get('contactName') || formData.get('leadName'),
                    company: formData.get('company'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    product: formData.get('product'),
                    premium: parseFloat(formData.get('premium')) || 0,
                    stage: formData.get('stage'),
                    priority: formData.get('priority'),
                    assignedTo: formData.get('assignedTo'),
                    renewalDate: formData.get('renewalDate'),
                    notes: formData.get('notes')
                };

                // Use API service to update lead
                if (window.apiService) {
                    const updatedLead = await window.apiService.updateLead(leadId, leadData);
                    console.log('Lead updated via API:', updatedLead);

                    // Close modal and refresh view
                    if (window.closeEditLeadModal) {
                        window.closeEditLeadModal();
                    }

                    // Refresh leads view
                    if (window.loadLeadsView) {
                        window.loadLeadsView();
                    }

                    showNotification('Lead updated successfully!', 'success');

                } else {
                    // Fall back to original function
                    originalSaveLeadEdits(leadId);
                }

            } catch (error) {
                console.error('Failed to update lead via API:', error);
                showNotification('Failed to update lead: ' + error.message, 'error');

                // Fall back to original function
                originalSaveLeadEdits(leadId);
            }
        };
    }

    // Override delete lead function
    if (window.deleteLead) {
        const originalDeleteLead = window.deleteLead;
        window.deleteLead = async function(leadId) {
            if (!confirm('Are you sure you want to delete this lead?')) {
                return;
            }

            try {
                // Use API service to delete lead
                if (window.apiService) {
                    await window.apiService.deleteLead(leadId);
                    console.log('Lead deleted via API:', leadId);

                    // Refresh leads view
                    if (window.loadLeadsView) {
                        window.loadLeadsView();
                    }

                    showNotification('Lead deleted successfully!', 'success');

                } else {
                    // Fall back to original function
                    originalDeleteLead(leadId);
                }

            } catch (error) {
                console.error('Failed to delete lead via API:', error);
                showNotification('Failed to delete lead: ' + error.message, 'error');

                // Fall back to original function
                originalDeleteLead(leadId);
            }
        };
    }

    // Override dashboard stats loading
    if (window.loadDashboardView) {
        const originalLoadDashboardView = window.loadDashboardView;
        window.loadDashboardView = async function() {
            console.log('Loading dashboard with API data...');

            // First load the UI
            originalLoadDashboardView();

            // Then load real-time stats from API
            try {
                if (window.apiService && window.apiService.getDashboardStats) {
                    const stats = await window.apiService.getDashboardStats();
                    console.log('Dashboard stats from API:', stats);

                    // Update the dashboard stats
                    updateDashboardStats(stats);
                }
            } catch (error) {
                console.error('Failed to load dashboard stats from API:', error);
            }
        };
    }

    console.log('✅ API Integration Layer initialized - all functions connected to comprehensive API');
}

// Helper function to update dashboard statistics
function updateDashboardStats(stats) {
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-number');

    if (statCards.length >= 4) {
        // Active Clients
        if (statCards[0]) {
            statCards[0].textContent = (stats.total_clients || 0).toLocaleString();
        }

        // Active Policies
        if (statCards[1]) {
            statCards[1].textContent = (stats.total_policies || 0).toLocaleString();
        }

        // All Time Premium
        if (statCards[2]) {
            const premium = stats.total_premium || 0;
            statCards[2].textContent = `$${premium.toLocaleString()}`;
        }

        // Monthly Lead Premium
        if (statCards[3]) {
            const monthlyPremium = stats.monthly_lead_premium || 0;
            statCards[3].textContent = `$${monthlyPremium.toLocaleString()}`;
        }
    }

    // Update sidebar counts
    const sidebarCounts = document.querySelectorAll('.sidebar .count');
    if (sidebarCounts.length >= 3) {
        // Leads count
        if (sidebarCounts[0] && stats.total_leads) {
            sidebarCounts[0].textContent = stats.total_leads.toLocaleString();
        }

        // Clients count
        if (sidebarCounts[1] && stats.total_clients) {
            sidebarCounts[1].textContent = stats.total_clients.toLocaleString();
        }

        // Policies count
        if (sidebarCounts[2] && stats.total_policies) {
            sidebarCounts[2].textContent = stats.total_policies.toLocaleString();
        }
    }
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Initialize data migration from localStorage to API
async function migrateDataToAPI() {
    if (!window.apiService) return;

    const migrated = localStorage.getItem('apiDataMigrated');
    if (migrated) return;

    try {
        console.log('Migrating local data to comprehensive API...');

        // Migrate leads
        const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        for (const lead of localLeads) {
            try {
                await window.apiService.createLead(lead);
            } catch (error) {
                console.warn('Failed to migrate lead:', lead.id, error.message);
            }
        }

        // Migrate policies
        const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
        for (const policy of localPolicies) {
            try {
                await window.apiService.createPolicy(policy);
            } catch (error) {
                console.warn('Failed to migrate policy:', policy.id, error.message);
            }
        }

        // Mark as migrated
        localStorage.setItem('apiDataMigrated', 'true');
        console.log('✅ Data migration completed');

    } catch (error) {
        console.error('Data migration failed:', error);
    }
}

// Auto-migrate data when API service becomes available
if (window.apiService) {
    setTimeout(migrateDataToAPI, 2000);
} else {
    // Wait for API service to load
    const checkAPI = setInterval(() => {
        if (window.apiService) {
            clearInterval(checkAPI);
            setTimeout(migrateDataToAPI, 2000);
        }
    }, 1000);
}

// Make functions globally available
window.updateDashboardStats = updateDashboardStats;
window.showNotification = showNotification;
window.migrateDataToAPI = migrateDataToAPI;