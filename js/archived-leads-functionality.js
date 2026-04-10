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

    // Show/hide tab content — use setProperty with !important to override any CSS rule
    const activeTab = document.getElementById('active-leads-tab');
    const archivedTab = document.getElementById('archived-leads-tab');

    if (activeTab) {
        if (tabName === 'active') {
            activeTab.style.removeProperty('display');
            activeTab.style.setProperty('display', 'flex', 'important');
        } else {
            activeTab.style.setProperty('display', 'none', 'important');
        }
    }

    if (archivedTab) {
        if (tabName === 'archived') {
            archivedTab.style.removeProperty('display');
            archivedTab.style.setProperty('display', 'flex', 'important');
            archivedTab.style.setProperty('flex-direction', 'column', 'important');
            archivedTab.style.setProperty('flex', '1', 'important');
            archivedTab.style.setProperty('overflow', 'auto', 'important');
        } else {
            archivedTab.style.setProperty('display', 'none', 'important');
        }
    }

    // Scroll back to top of the leads view
    const leadsView = document.querySelector('.leads-view');
    if (leadsView) leadsView.scrollTop = 0;
    const pane = document.querySelector('.dashboard-content') || document.querySelector('.main-content');
    if (pane) pane.scrollTop = 0;

    // Load archived leads data if switching to archived tab
    if (tabName === 'archived') {
        loadArchivedLeads();
    }
}

// Function to generate archived lead rows
function generateArchivedLeadRows(archivedLeads) {
    if (!archivedLeads || archivedLeads.length === 0) {
        return '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #6b7280;">No archived leads found</td></tr>';
    }

    return archivedLeads.map(lead => {
        const archivedDate = lead.archivedDate ? new Date(lead.archivedDate).toLocaleDateString() : 'Unknown';

        // Sent to market indicator
        const sentToMarket = !!(lead.appStage?.app || lead.stage === 'app_sent' ||
            lead.stage === 'app_quote_received' || lead.stage === 'app_quote_sent');
        const marketCircle = sentToMarket
            ? `<span style="width:22px;height:22px;border-radius:50%;background:#10b981;color:white;font-size:11px;display:inline-flex;align-items:center;justify-content:center;pointer-events:none;" title="Sent to market"><i class="fas fa-check"></i></span>`
            : `<span style="width:22px;height:22px;border-radius:50%;background:#d1d5db;color:#9ca3af;font-size:11px;display:inline-flex;align-items:center;justify-content:center;pointer-events:none;" title="Not sent to market"><i class="fas fa-times"></i></span>`;

        // Renewal date
        const renewalDisplay = lead.renewalDate
            ? `<span style="color:#374151;font-size:13px;">${lead.renewalDate}</span>`
            : `<span style="color:#d1d5db;font-size:13px;">—</span>`;

        // Call time bar
        const timeMeter = (typeof window.generateTimeMeter === 'function')
            ? window.generateTimeMeter(lead)
            : '<span style="color:#d1d5db;font-size:12px;">—</span>';

        return `
            <tr class="gold-border-lead" data-lead-id="${lead.id || ''}" data-lead-name="${(lead.name || '').replace(/"/g, '&quot;')}" style="opacity:0.9;">
                <td>
                    <input type="checkbox" class="archived-lead-checkbox" value="${lead.archiveId || lead.id}" onchange="updateBulkDeleteArchivedButton()">
                </td>
                <td style="width:28px;padding:4px;text-align:center;">
                    ${marketCircle}
                </td>
                <td>
                    <div class="lead-info">
                        <strong>${lead.name || 'Unknown'}</strong>
                        ${lead.company ? `<br><small style="color:#6b7280;">${lead.company}</small>` : ''}
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        ${lead.phone ? `<div><i class="fas fa-phone" style="color:#10b981;"></i> ${lead.phone}</div>` : ''}
                        ${lead.email ? `<div><i class="fas fa-envelope" style="color:#3b82f6;"></i> ${lead.email}</div>` : ''}
                    </div>
                </td>
                <td>
                    <span class="product-badge ${lead.product ? lead.product.toLowerCase().replace(/\s+/g,'-') : ''}" style="opacity:0.7;">
                        ${lead.product || 'Not specified'}
                    </span>
                </td>
                <td>
                    <div class="premium-amount">
                        ${lead.premium ? '$' + parseFloat(String(lead.premium).replace(/[^0-9.]/g,'')).toLocaleString() : '—'}
                    </div>
                </td>
                <td>${renewalDisplay}</td>
                <td style="min-width:80px;padding-top:6px;">${timeMeter}</td>
                <td>${lead.assignedTo || 'Unassigned'}</td>
                <td>
                    <span style="color:#6b7280;font-size:13px;">${archivedDate}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="restoreLead('${lead.archiveId}')" class="btn-icon" title="Restore to Active" style="background:#10b981;color:white;">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button onclick="viewArchivedLead('${lead.id}')" class="btn-icon" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="permanentlyDeleteLead('${lead.archiveId}')" class="btn-icon" title="Delete Permanently" style="background:#ef4444;color:white;">
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
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #6b7280;">⏳ Loading archived leads...</td></tr>';
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
                    tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #ef4444;">Error loading archived leads</td></tr>';
                }
            }
        })
        .catch(error => {
            console.error('Error loading archived leads:', error);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #ef4444;">Error loading archived leads</td></tr>';
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

    // Group leads by renewal date month only (ignore year — all Januaries together, etc.)
    const monthGroups = {};
    archivedLeads.forEach(lead => {
        const dateStr = lead.renewalDate || lead.renewal_date || lead.insurance_expiry || '';
        if (!dateStr) return;
        const renewalDate = new Date(dateStr);
        if (isNaN(renewalDate.getTime())) return;
        const mo = String(renewalDate.getMonth() + 1).padStart(2, '0');
        if (!monthGroups[mo]) monthGroups[mo] = [];
        monthGroups[mo].push(lead);
    });

    // Build all 12 month tabs (01–12); default active = current month
    const currentDate = new Date();
    const currentMonthKey = String(currentDate.getMonth() + 1).padStart(2, '0');

    const allMonths = [];
    for (let m = 1; m <= 12; m++) {
        const monthKey = String(m).padStart(2, '0');
        const monthName = new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
        const count = monthGroups[monthKey] ? monthGroups[monthKey].length : 0;
        const isActive = monthKey === currentMonthKey;
        if (isActive) window.currentArchivedMonth = monthKey;
        allMonths.push({ monthKey, monthName, count, isActive, monthNumber: m });
    }

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

    // Filter leads by renewal month only (ignore year)
    const monthLeads = window.allArchivedLeads.filter(lead => {
        const dateStr = lead.renewalDate || lead.renewal_date || lead.insurance_expiry || '';
        if (!dateStr) return false;
        const renewalDate = new Date(dateStr);
        if (isNaN(renewalDate.getTime())) return false;
        return String(renewalDate.getMonth() + 1).padStart(2, '0') === monthKey;
    });

    console.log(`Found ${monthLeads.length} leads for ${monthKey}`);

    // Sort by renewal date ascending (soonest renewal first; no date goes to bottom)
    monthLeads.sort((a, b) => {
        const da = a.renewalDate ? new Date(a.renewalDate).getTime() : Infinity;
        const db = b.renewalDate ? new Date(b.renewalDate).getTime() : Infinity;
        return da - db;
    });

    // Update table
    if (monthLeads.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #6b7280;">No archived leads found for this month</td></tr>';
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
                It will be moved to the Archived Leads page.
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

            // If we're on the archived leads standalone page, refresh it
            if (window.location.hash === '#archived-leads') {
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

// ============================================
// DELETE DUPLICATE ARCHIVED LEADS
// ============================================
async function deleteDuplicateArchivedLeads() {
    // Fetch all archived leads fresh from server
    let allLeads;
    try {
        const resp = await fetch('/api/archived-leads');
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch');
        allLeads = data.archivedLeads;
    } catch (e) {
        alert('Error fetching archived leads: ' + e.message);
        return;
    }

    if (!allLeads || allLeads.length === 0) {
        alert('No archived leads found.');
        return;
    }

    // Identify duplicates: group by originalLeadId first, then by cleaned phone
    // Keep the one with the most recent archivedDate; mark others for deletion
    const toDelete = []; // archiveIds to delete

    // Pass 1: deduplicate by originalLeadId
    const byOriginalId = {};
    allLeads.forEach(lead => {
        const key = String(lead.originalLeadId || lead.id || '');
        if (!key) return;
        if (!byOriginalId[key]) {
            byOriginalId[key] = lead;
        } else {
            // Keep the more recently archived one
            const existing = byOriginalId[key];
            const existingDate = new Date(existing.archivedDate || 0).getTime();
            const thisDate = new Date(lead.archivedDate || 0).getTime();
            if (thisDate >= existingDate) {
                toDelete.push(existing.archiveId);
                byOriginalId[key] = lead;
            } else {
                toDelete.push(lead.archiveId);
            }
        }
    });

    // Pass 2: among survivors, deduplicate by phone number
    const survivors = Object.values(byOriginalId);
    const byPhone = {};
    survivors.forEach(lead => {
        const phone = (lead.phone || '').replace(/\D/g, '');
        if (!phone || phone.length < 7) return; // skip if no useful phone
        if (!byPhone[phone]) {
            byPhone[phone] = lead;
        } else {
            const existing = byPhone[phone];
            const existingDate = new Date(existing.archivedDate || 0).getTime();
            const thisDate = new Date(lead.archivedDate || 0).getTime();
            if (thisDate >= existingDate) {
                toDelete.push(existing.archiveId);
                byPhone[phone] = lead;
            } else {
                toDelete.push(lead.archiveId);
            }
        }
    });

    // Deduplicate the toDelete list itself (same archiveId may appear twice)
    const uniqueToDelete = [...new Set(toDelete.filter(Boolean))];

    if (uniqueToDelete.length === 0) {
        alert('No duplicate archived leads found. All records are unique.');
        return;
    }

    if (!confirm(`Found ${uniqueToDelete.length} duplicate archived lead${uniqueToDelete.length > 1 ? 's' : ''}.\n\nThe most recently archived copy of each lead will be kept. Delete the duplicates now?`)) {
        return;
    }

    // Delete each duplicate sequentially
    let deleted = 0;
    let failed = 0;
    for (const archiveId of uniqueToDelete) {
        try {
            const r = await fetch(`/api/archived-leads/${archiveId}`, { method: 'DELETE' });
            const d = await r.json();
            if (d.success) deleted++;
            else failed++;
        } catch (e) {
            failed++;
        }
    }

    const msg = failed > 0
        ? `Deleted ${deleted} duplicate${deleted !== 1 ? 's' : ''}. ${failed} failed.`
        : `Successfully deleted ${deleted} duplicate archived lead${deleted !== 1 ? 's' : ''}.`;

    alert(msg);

    // Refresh the view
    loadArchivedLeads();
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

    // Update bulk delete button after toggling
    updateBulkDeleteArchivedButton();
}

// Update bulk delete overlay for archived leads
function updateBulkDeleteArchivedButton() {
    const selectedCheckboxes = document.querySelectorAll('.archived-lead-checkbox:checked');
    let deleteOverlay = document.getElementById('bulkDeleteArchivedOverlay');

    if (selectedCheckboxes.length > 0) {
        // Create overlay if it doesn't exist
        if (!deleteOverlay) {
            deleteOverlay = document.createElement('div');
            deleteOverlay.id = 'bulkDeleteArchivedOverlay';
            deleteOverlay.innerHTML = `
                <div class="delete-icon-container" onclick="bulkDeleteArchivedLeads()">
                    <i class="fas fa-trash"></i>
                    <span class="delete-count">${selectedCheckboxes.length}</span>
                </div>
            `;
            deleteOverlay.style.cssText = `
                position: fixed;
                top: 80px;
                right: 30px;
                z-index: 10000;
                cursor: pointer;
                animation: slideInRight 0.3s ease-out;
            `;

            // Add styles if not already present
            if (!document.getElementById('bulkDeleteArchivedStyles')) {
                const style = document.createElement('style');
                style.id = 'bulkDeleteArchivedStyles';
                style.textContent = `
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes pulse-glow {
                        0%, 100% {
                            box-shadow: 0 0 20px rgba(220, 38, 38, 0.8),
                                       0 0 40px rgba(220, 38, 38, 0.6),
                                       0 0 60px rgba(220, 38, 38, 0.4);
                        }
                        50% {
                            box-shadow: 0 0 30px rgba(220, 38, 38, 0.9),
                                       0 0 50px rgba(220, 38, 38, 0.6),
                                       0 0 70px rgba(220, 38, 38, 0.4);
                        }
                    }
                    #bulkDeleteArchivedOverlay .delete-icon-container {
                        position: relative;
                        width: 70px;
                        height: 70px;
                        background: linear-gradient(135deg, #dc2626, #b91c1c);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 28px;
                        animation: pulse-glow 2s ease-in-out infinite;
                        transition: transform 0.2s ease;
                    }
                    #bulkDeleteArchivedOverlay .delete-icon-container:hover {
                        transform: scale(1.1);
                        animation: pulse-glow 1s ease-in-out infinite;
                    }
                    #bulkDeleteArchivedOverlay .delete-count {
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #fbbf24;
                        color: #000;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: bold;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                `;
                document.head.appendChild(style);
            }
            document.body.appendChild(deleteOverlay);
        } else {
            // Update count
            const countElement = deleteOverlay.querySelector('.delete-count');
            if (countElement) {
                countElement.textContent = selectedCheckboxes.length;
            }
        }
    } else {
        // Remove overlay if no items selected
        if (deleteOverlay) {
            deleteOverlay.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (deleteOverlay && deleteOverlay.parentNode) {
                    deleteOverlay.remove();
                }
            }, 300);
        }
    }
}

// Bulk delete selected archived leads
async function bulkDeleteArchivedLeads() {
    const selectedCheckboxes = document.querySelectorAll('.archived-lead-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        console.warn('No archived leads selected for deletion');
        return;
    }

    const count = selectedCheckboxes.length;
    const message = count === 1
        ? 'Are you sure you want to permanently delete this archived lead?'
        : `Are you sure you want to permanently delete ${count} archived leads? This cannot be undone.`;

    if (!confirm(message)) {
        return;
    }

    console.log(`🗑️ Bulk deleting ${count} archived leads...`);

    // Get the archive IDs from the checkboxes
    const archiveIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    console.log('Archive IDs to delete:', archiveIds);

    let successCount = 0;
    let failCount = 0;

    // Delete each archived lead
    for (const archiveId of archiveIds) {
        try {
            const response = await fetch(`/api/archived-leads/${archiveId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log(`✅ Deleted archived lead: ${archiveId}`);

                // Remove the row immediately from UI
                const checkbox = document.querySelector(`.archived-lead-checkbox[value="${archiveId}"]`);
                if (checkbox) {
                    const row = checkbox.closest('tr');
                    if (row) {
                        row.style.transition = 'opacity 0.3s, transform 0.3s';
                        row.style.opacity = '0';
                        row.style.transform = 'translateX(-20px)';
                        setTimeout(() => row.remove(), 300);
                    }
                }

                successCount++;
            } else {
                console.error(`❌ Failed to delete archived lead ${archiveId}: ${response.status}`);
                failCount++;
            }
        } catch (error) {
            console.error(`❌ Error deleting archived lead ${archiveId}:`, error);
            failCount++;
        }
    }

    // Show results
    if (successCount > 0) {
        console.log(`✅ Successfully deleted ${successCount} archived lead(s)`);

        // Remove the overlay immediately
        const deleteOverlay = document.getElementById('bulkDeleteArchivedOverlay');
        if (deleteOverlay) {
            deleteOverlay.remove();
        }

        // Clear all checkboxes
        document.querySelectorAll('.archived-lead-checkbox:checked').forEach(cb => {
            cb.checked = false;
        });

        // Show notification
        const message = failCount > 0
            ? `Deleted ${successCount} lead(s). ${failCount} failed.`
            : `Successfully deleted ${successCount} archived lead(s)`;

        console.log(`📊 Bulk delete complete: ${successCount} success, ${failCount} failed`);
    } else {
        console.error(`❌ Failed to delete any archived leads`);
    }
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
window.updateBulkDeleteArchivedButton = updateBulkDeleteArchivedButton;
window.bulkDeleteArchivedLeads = bulkDeleteArchivedLeads;

console.log('✅ Archived leads functionality initialized');