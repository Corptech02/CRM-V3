// ============================================
// ARCHIVED LEADS FUNCTIONALITY
// ============================================

// Tab switching function
function switchLeadTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);

    // Update tab buttons
    document.querySelectorAll('.lead-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tabName === 'active') {
            tab.style.background = tab.textContent.includes('Active') ? '#3b82f6' : '#f3f4f6';
            tab.style.color = tab.textContent.includes('Active') ? 'white' : '#6b7280';
        } else {
            tab.style.background = tab.textContent.includes('Archived') ? '#3b82f6' : '#f3f4f6';
            tab.style.color = tab.textContent.includes('Archived') ? 'white' : '#6b7280';
        }
    });

    // Update active tab class
    const activeButton = tabName === 'active' ?
        document.querySelector('.lead-tab:first-child') :
        document.querySelector('.lead-tab:last-child');
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Show/hide tab content
    document.getElementById('active-leads-tab').style.display = tabName === 'active' ? 'block' : 'none';
    document.getElementById('archived-leads-tab').style.display = tabName === 'archived' ? 'block' : 'none';

    // Load archived leads data if switching to archived tab
    if (tabName === 'archived') {
        loadArchivedLeads();
    }
}

// Function to generate archived lead rows
function generateArchivedLeadRows(archivedLeads) {
    if (!archivedLeads || archivedLeads.length === 0) {
        return '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #6b7280;">No archived leads found</td></tr>';
    }

    return archivedLeads.map(lead => {
        const archivedDate = lead.archivedDate ? new Date(lead.archivedDate).toLocaleDateString() : 'Unknown';

        return `
            <tr style="opacity: 0.8;">
                <td>
                    <input type="checkbox" class="archived-lead-checkbox" value="${lead.id}">
                </td>
                <td>
                    <div class="lead-info">
                        <strong>${lead.name || 'Unknown'}</strong>
                        ${lead.company ? `<br><small style="color: #6b7280;">${lead.company}</small>` : ''}
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        ${lead.phone ? `<div><i class="fas fa-phone" style="color: #10b981;"></i> ${lead.phone}</div>` : ''}
                        ${lead.email ? `<div><i class="fas fa-envelope" style="color: #3b82f6;"></i> ${lead.email}</div>` : ''}
                    </div>
                </td>
                <td>
                    <span class="product-badge ${lead.product ? lead.product.toLowerCase() : ''}" style="opacity: 0.7;">
                        ${lead.product || 'Not specified'}
                    </span>
                </td>
                <td>
                    <div class="premium-amount">
                        ${lead.premium ? '$' + parseFloat(lead.premium).toLocaleString() : '-'}
                    </div>
                </td>
                <td>
                    <span class="stage-badge ${lead.stage || 'closed'}" style="opacity: 0.7;">
                        ${window.formatStageName ? window.formatStageName(lead.stage || 'closed') : (lead.stage || 'closed')}
                    </span>
                </td>
                <td>${lead.assignedTo || 'Unassigned'}</td>
                <td>
                    <span style="color: #6b7280; font-size: 13px;">
                        ${archivedDate}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="restoreLead('${lead.archiveId}')" class="btn-icon" title="Restore to Active" style="background: #10b981; color: white;">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button onclick="viewArchivedLead('${lead.id}')" class="btn-icon" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="permanentlyDeleteLead('${lead.archiveId}')" class="btn-icon" title="Delete Permanently" style="background: #ef4444; color: white;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Global variables for archived leads management
window.allArchivedLeads = [];
window.currentArchivedMonth = null;

// Load archived leads from server and set up monthly tabs
function loadArchivedLeads() {
    console.log('📂 Loading archived leads from server...');

    const tableBody = document.getElementById('archivedLeadsTableBody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #6b7280;">⏳ Loading archived leads...</td></tr>';
    }

    fetch('/api/archived-leads')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`Found ${data.archivedLeads.length} archived leads from server`);
                window.allArchivedLeads = data.archivedLeads;

                // Set up monthly tabs and load current month
                setupMonthlyTabs(data.archivedLeads);

                // Load the most recent month by default
                const currentMonth = getCurrentMonth();
                loadArchivedLeadsByMonth(currentMonth);
            } else {
                console.error('Error loading archived leads:', data.error);
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #ef4444;">Error loading archived leads</td></tr>';
                }
            }
        })
        .catch(error => {
            console.error('Error loading archived leads:', error);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #ef4444;">Error loading archived leads</td></tr>';
            }
        });
}

// Get current month in YYYY-MM format (using current year)
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Set up monthly tabs for all 12 months of current year
function setupMonthlyTabs(archivedLeads) {
    const monthlyTabsContainer = document.getElementById('monthlyArchiveTabs');
    if (!monthlyTabsContainer) return;

    // Group leads by month
    const monthGroups = {};
    archivedLeads.forEach(lead => {
        const archivedDate = new Date(lead.archivedDate);
        const monthKey = `${archivedDate.getFullYear()}-${String(archivedDate.getMonth() + 1).padStart(2, '0')}`;

        if (!monthGroups[monthKey]) {
            monthGroups[monthKey] = [];
        }
        monthGroups[monthKey].push(lead);
    });

    // Create all 12 months for current year (regardless of whether they have leads)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear(); // Use current year instead of hardcoded 2025
    const currentMonth = currentDate.getMonth() + 1; // Current month (1-12)
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const allMonths = [];
    for (let month = 1; month <= 12; month++) {
        const monthKey = `${currentYear}-${String(month).padStart(2, '0')}`;
        const monthName = new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'long' });
        const count = monthGroups[monthKey] ? monthGroups[monthKey].length : 0;
        const isActive = monthKey === currentMonthKey; // Make current month active

        allMonths.push({
            monthKey,
            monthName,
            count,
            isActive,
            monthNumber: month
        });
    }

    // Sort months by month number (January first)
    allMonths.sort((a, b) => a.monthNumber - b.monthNumber);

    // Create tabs HTML
    const tabsHTML = allMonths.map(monthData => {
        return `
            <button class="monthly-tab ${monthData.isActive ? 'active' : ''}"
                    onclick="switchArchivedMonth('${monthData.monthKey}')"
                    data-month="${monthData.monthKey}"
                    style="padding: 10px 16px; border: none; border-radius: 6px 6px 0 0; cursor: pointer; font-weight: 500; font-size: 13px; transition: all 0.2s; white-space: nowrap; ${monthData.isActive ? 'background: #3b82f6; color: white;' : 'background: #f3f4f6; color: #6b7280;'}">
                <i class="fas fa-calendar-alt" style="margin-right: 5px;"></i>
                ${monthData.monthName}
                <span style="background: ${monthData.isActive ? 'rgba(255,255,255,0.2)' : '#e5e7eb'}; color: ${monthData.isActive ? 'white' : '#374151'}; padding: 2px 6px; border-radius: 10px; margin-left: 6px; font-size: 11px;">${monthData.count}</span>
            </button>
        `;
    }).join('');

    monthlyTabsContainer.innerHTML = tabsHTML;

    // Set current month to the current month of 2025
    window.currentArchivedMonth = currentMonthKey;
}

// Switch to a specific month
function switchArchivedMonth(monthKey) {
    console.log('📅 Switching to archived month:', monthKey);

    // Update tab active states
    document.querySelectorAll('.monthly-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.month === monthKey) {
            tab.style.background = '#3b82f6';
            tab.style.color = 'white';
            tab.classList.add('active');
        } else {
            tab.style.background = '#f3f4f6';
            tab.style.color = '#6b7280';
        }
    });

    window.currentArchivedMonth = monthKey;
    loadArchivedLeadsByMonth(monthKey);
}

// Load archived leads for specific month
function loadArchivedLeadsByMonth(monthKey) {
    console.log('📅 Loading archived leads for month:', monthKey);

    const tableBody = document.getElementById('archivedLeadsTableBody');
    if (!tableBody) return;

    // Filter leads by month
    const monthLeads = window.allArchivedLeads.filter(lead => {
        const archivedDate = new Date(lead.archivedDate);
        const leadMonthKey = `${archivedDate.getFullYear()}-${String(archivedDate.getMonth() + 1).padStart(2, '0')}`;
        return leadMonthKey === monthKey;
    });

    console.log(`Found ${monthLeads.length} leads for ${monthKey}`);

    // Update table
    if (monthLeads.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #6b7280;">No archived leads found for this month</td></tr>';
    } else {
        tableBody.innerHTML = generateArchivedLeadRows(monthLeads);
    }

    // Update stats
    updateArchiveStats(monthLeads, monthKey);
}

// Update archive statistics
function updateArchiveStats(monthLeads, monthKey) {
    const statsContainer = document.getElementById('archiveStats');
    if (!statsContainer) return;

    const [year, month] = monthKey.split('-');
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const totalLeads = monthLeads.length;
    const totalPremium = monthLeads.reduce((sum, lead) => sum + (parseFloat(lead.premium) || 0), 0);

    // Group by final stage
    const stageGroups = {};
    monthLeads.forEach(lead => {
        const stage = lead.stage || 'unknown';
        stageGroups[stage] = (stageGroups[stage] || 0) + 1;
    });

    // Group by assigned user
    const userGroups = {};
    monthLeads.forEach(lead => {
        const user = lead.assignedTo || 'Unassigned';
        userGroups[user] = (userGroups[user] || 0) + 1;
    });

    const statsHTML = `
        <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-archive" style="color: white; font-size: 18px;"></i>
                </div>
                <div>
                    <h4 style="margin: 0; color: #374151; font-size: 14px;">Total Archived</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">${monthName}</p>
                </div>
            </div>
            <div style="font-size: 24px; font-weight: bold; color: #374151;">${totalLeads}</div>
        </div>

        <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="background: linear-gradient(135deg, #10b981, #059669); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-dollar-sign" style="color: white; font-size: 18px;"></i>
                </div>
                <div>
                    <h4 style="margin: 0; color: #374151; font-size: 14px;">Total Premium</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">Archived Leads</p>
                </div>
            </div>
            <div style="font-size: 24px; font-weight: bold; color: #374151;">$${totalPremium.toLocaleString()}</div>
        </div>

        <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="background: linear-gradient(135deg, #f59e0b, #d97706); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-chart-pie" style="color: white; font-size: 18px;"></i>
                </div>
                <div>
                    <h4 style="margin: 0; color: #374151; font-size: 14px;">Top Stage</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">Most Common</p>
                </div>
            </div>
            <div style="font-size: 16px; font-weight: bold; color: #374151;">${getTopStage(stageGroups)}</div>
        </div>
    `;

    statsContainer.innerHTML = statsHTML;
}

// Get the most common stage
function getTopStage(stageGroups) {
    const stages = Object.entries(stageGroups);
    if (stages.length === 0) return 'None';

    const topStage = stages.reduce((max, current) => current[1] > max[1] ? current : max);
    const stageName = window.formatStageName ? window.formatStageName(topStage[0]) : topStage[0];
    return `${stageName} (${topStage[1]})`;
}

// Archive a lead
function archiveLead(leadId) {
    console.log('📦 Archiving lead:', leadId);

    // Prevent multiple simultaneous archive attempts
    if (window.archivingInProgress) {
        console.log('⚠️ Archive already in progress, ignoring duplicate request');
        return;
    }

    // Show custom overlay confirmation popup
    showArchiveConfirmation(leadId);
}

// Show custom archive confirmation overlay
function showArchiveConfirmation(leadId) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'archiveConfirmationOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(2px);
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 0;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        transform: scale(0.9);
        animation: modalSlideIn 0.2s ease-out forwards;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);

    modal.innerHTML = `
        <div style="padding: 24px 24px 0 24px; text-align: center;">
            <div style="
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px auto;
            ">
                <i class="fas fa-archive" style="color: white; font-size: 20px;"></i>
            </div>
            <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 18px; font-weight: 600;">
                Archive Lead
            </h3>
            <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Are you sure you want to archive this lead?<br>
                It will be moved to the Archived Leads tab.
            </p>
        </div>
        <div style="padding: 16px 24px 24px 24px; display: flex; gap: 12px;">
            <button id="cancelArchive" style="
                flex: 1;
                padding: 10px 16px;
                border: 1px solid #d1d5db;
                background: white;
                color: #374151;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                Cancel
            </button>
            <button id="confirmArchive" style="
                flex: 1;
                padding: 10px 16px;
                border: none;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                Archive Lead
            </button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Handle button clicks
    document.getElementById('cancelArchive').onclick = () => {
        console.log('❌ User cancelled archiving operation');
        closeArchiveConfirmation();
    };

    document.getElementById('confirmArchive').onclick = () => {
        console.log('✅ User confirmed archiving, proceeding with operation');
        closeArchiveConfirmation();
        proceedWithArchive(leadId);
    };

    // Close on overlay click (outside modal)
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            console.log('❌ User cancelled archiving by clicking outside');
            closeArchiveConfirmation();
        }
    };

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            console.log('❌ User cancelled archiving with Escape key');
            closeArchiveConfirmation();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Close archive confirmation overlay
function closeArchiveConfirmation() {
    const overlay = document.getElementById('archiveConfirmationOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Proceed with archiving after confirmation
function proceedWithArchive(leadId) {
    // Set flag to prevent duplicate requests
    window.archivingInProgress = true;

    // Get current user for tracking
    const archivedBy = (() => {
        const userData = sessionStorage.getItem('vanguard_user');
        if (userData) {
            const user = JSON.parse(userData);
            return user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
        }
        return 'System';
    })();

    // Call server API to archive the lead
    fetch(`/api/archive-lead/${leadId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ archivedBy })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Lead archived successfully:', data.archivedId);

            // Refresh the current view
            if (window.location.hash === '#leads') {
                if (typeof window.loadLeadsView === 'function') {
                    window.loadLeadsView();
                }
            }

            // If archived leads tab is currently active, refresh it to show the new archived lead
            const archivedTab = document.getElementById('archived-leads-tab');
            if (archivedTab && archivedTab.style.display !== 'none') {
                console.log('🔄 Refreshing archived leads view to show newly archived lead');
                if (typeof loadArchivedLeads === 'function') {
                    loadArchivedLeads();
                }
            }

            // No success notification - removed per user request
        } else {
            console.error('❌ Archive failed:', data.error);
            alert('Failed to archive lead: ' + data.error);
        }

        // Clear the flag to allow future archive operations
        window.archivingInProgress = false;
    })
    .catch(error => {
        console.error('❌ Archive error:', error);
        alert('Error archiving lead. Please try again.');

        // Clear the flag to allow future archive operations
        window.archivingInProgress = false;
    });
}

// Restore a lead from archive
function restoreLead(archiveId) {
    console.log('📤 Restoring archived lead:', archiveId);

    if (!confirm('Are you sure you want to restore this lead to active leads?')) {
        return;
    }

    // Call server API to restore the lead
    fetch(`/api/restore-lead/${archiveId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Lead restored successfully:', data.restoredId);

            // Refresh archived leads view
            loadArchivedLeads();

            // Show success message
            if (window.showNotification) {
                window.showNotification('Lead restored to active leads', 'success');
            }
        } else {
            console.error('❌ Restore failed:', data.error);
            alert('Failed to restore lead: ' + data.error);
        }
    })
    .catch(error => {
        console.error('❌ Restore error:', error);
        alert('Error restoring lead. Please try again.');
    });
}

// View archived lead details
function viewArchivedLead(originalLeadId) {
    console.log('👁️ Viewing archived lead:', originalLeadId);

    // For archived leads, we need to find them by original lead ID
    // and temporarily add them to localStorage for the viewLead function to work
    fetch('/api/archived-leads')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const archivedLead = data.archivedLeads.find(l => String(l.id) === String(originalLeadId));

                if (!archivedLead) {
                    alert('Archived lead not found');
                    return;
                }

                // Temporarily add to localStorage so viewLead can access it
                const tempLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const existingIndex = tempLeads.findIndex(l => String(l.id) === String(originalLeadId));

                if (existingIndex === -1) {
                    tempLeads.push(archivedLead);
                    localStorage.setItem('insurance_leads', JSON.stringify(tempLeads));
                }

                // Mark as viewing archived lead
                window.viewingArchivedLead = true;

                // Use the existing viewLead function
                if (typeof window.viewLead === 'function') {
                    window.viewLead(originalLeadId);
                } else {
                    alert('View function not available');
                }
            } else {
                alert('Error loading archived lead details');
            }
        })
        .catch(error => {
            console.error('Error loading archived lead:', error);
            alert('Error loading archived lead details');
        });
}

// Permanently delete an archived lead
function permanentlyDeleteLead(archiveId) {
    console.log('🗑️ Permanently deleting archived lead:', archiveId);

    if (!confirm('Are you sure you want to permanently delete this lead? This action cannot be undone.')) {
        return;
    }

    if (!confirm('This will permanently remove all data for this lead. Are you absolutely sure?')) {
        return;
    }

    // Call server API to permanently delete the archived lead
    fetch(`/api/archived-leads/${archiveId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Archived lead permanently deleted');

            // Refresh archived leads view
            loadArchivedLeads();

            // Show success message
            if (window.showNotification) {
                window.showNotification('Lead permanently deleted', 'success');
            }
        } else {
            console.error('❌ Delete failed:', data.error);
            alert('Failed to delete lead: ' + data.error);
        }
    })
    .catch(error => {
        console.error('❌ Delete error:', error);
        alert('Error deleting lead. Please try again.');
    });
}

// Export archived leads for current month
function exportArchivedLeads() {
    console.log('📥 Exporting archived leads for current month...');

    if (!window.currentArchivedMonth || !window.allArchivedLeads) {
        alert('No archived leads data available for export');
        return;
    }

    // Filter leads by current month
    const monthLeads = window.allArchivedLeads.filter(lead => {
        const archivedDate = new Date(lead.archivedDate);
        const leadMonthKey = `${archivedDate.getFullYear()}-${String(archivedDate.getMonth() + 1).padStart(2, '0')}`;
        return leadMonthKey === window.currentArchivedMonth;
    });

    if (monthLeads.length === 0) {
        alert('No archived leads to export for this month');
        return;
    }

    const [year, month] = window.currentArchivedMonth.split('-');
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    exportLeadsToCSV(monthLeads, `archived_leads_${monthName.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`);
}

// Export all archived leads
function exportAllArchivedLeads() {
    console.log('📥 Exporting all archived leads...');

    if (!window.allArchivedLeads || window.allArchivedLeads.length === 0) {
        alert('No archived leads to export');
        return;
    }

    exportLeadsToCSV(window.allArchivedLeads, `all_archived_leads_${new Date().toISOString().split('T')[0]}.csv`);
}

// Helper function to export leads to CSV
function exportLeadsToCSV(leads, filename) {
    // Create CSV content
    const csvHeaders = ['Name', 'Company', 'Phone', 'Email', 'Product', 'Premium', 'Final Stage', 'Assigned To', 'Archived Date', 'Archived By'];
    const csvRows = leads.map(lead => [
        lead.name || '',
        lead.company || '',
        lead.phone || '',
        lead.email || '',
        lead.product || '',
        lead.premium || '',
        window.formatStageName ? window.formatStageName(lead.stage || '') : (lead.stage || ''),
        lead.assignedTo || '',
        lead.archivedDate ? new Date(lead.archivedDate).toLocaleDateString() : '',
        lead.archivedBy || ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${leads.length} archived leads to ${filename}`);
}

// Toggle all archived leads checkboxes
function toggleAllArchived(checkbox) {
    const checkboxes = document.querySelectorAll('.archived-lead-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
}

// Make functions globally available
window.switchLeadTab = switchLeadTab;
window.generateArchivedLeadRows = generateArchivedLeadRows;
window.loadArchivedLeads = loadArchivedLeads;
window.switchArchivedMonth = switchArchivedMonth;
window.loadArchivedLeadsByMonth = loadArchivedLeadsByMonth;
window.archiveLead = archiveLead;
window.restoreLead = restoreLead;
window.viewArchivedLead = viewArchivedLead;
window.permanentlyDeleteLead = permanentlyDeleteLead;
window.exportArchivedLeads = exportArchivedLeads;
window.exportAllArchivedLeads = exportAllArchivedLeads;
window.toggleAllArchived = toggleAllArchived;

console.log('✅ Archived leads functionality initialized');