/**
 * Fix Agent Performance Counts - Only count leads created in the selected period
 * Also add developer mode settings for manual stats editing
 */

(function() {
    'use strict';

    console.log('🔧 Agent Performance Counts Fix Loading...');

    // Add a very simple and obvious manual trigger function
    window.FORCE_ADD_DEV_CONTROLS = function() {
        console.log('🔧 FORCE_ADD_DEV_CONTROLS called manually');

        // Find any element containing both "Performance Profile" and "Download PDF Report"
        const allElements = document.querySelectorAll('*');
        let modalFound = false;

        for (let element of allElements) {
            if (element.textContent &&
                element.textContent.includes('Performance Profile') &&
                element.textContent.includes('Download PDF Report')) {

                console.log('🔧 FOUND MODAL!', element.tagName, element.className);
                modalFound = true;

                // Add the dev toggle button directly
                const devButton = document.createElement('button');
                devButton.textContent = '🔧 DEV MODE';
                devButton.style.cssText = `
                    padding: 6px 12px;
                    background: #f59e0b;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    margin: 10px;
                    position: absolute;
                    top: 10px;
                    right: 50px;
                    z-index: 1000;
                `;

                devButton.onclick = function() {
                    window.toggleAgentPerformanceDevMode();
                };

                // Add to the modal
                element.style.position = 'relative';
                element.appendChild(devButton);

                console.log('🔧 DEV BUTTON ADDED TO MODAL!');
                break;
            }
        }

        if (!modalFound) {
            console.log('🚨 MODAL NOT FOUND - Try opening the agent performance modal first');
            alert('Modal not found! Make sure the agent performance modal is open first.');
        }
    };

    // Enable developer mode
    window.AGENT_PERFORMANCE_DEV_MODE = false;

    // Store for manual stat overrides
    window.manualStatOverrides = {};

    // Function to toggle dev mode
    window.toggleAgentPerformanceDevMode = function() {
        window.AGENT_PERFORMANCE_DEV_MODE = !window.AGENT_PERFORMANCE_DEV_MODE;
        console.log('🔧 Agent Performance Dev Mode:', window.AGENT_PERFORMANCE_DEV_MODE ? 'ENABLED' : 'DISABLED');

        // Show notification
        const message = window.AGENT_PERFORMANCE_DEV_MODE ?
            'Dev mode enabled - Manual stats editing available' :
            'Dev mode disabled';

        if (window.showNotification) {
            window.showNotification(message, 'info');
        } else {
            alert(message);
        }

        // Refresh any open agent modals to show/hide dev controls
        refreshAgentModalDevControls();
    };

    // Function to reset agent stats for a specific period
    window.resetAgentStats = function(agentName, period = 'day') {
        if (!window.AGENT_PERFORMANCE_DEV_MODE) {
            alert('Dev mode must be enabled to reset stats');
            return;
        }

        const confirmation = confirm(`Reset all ${period} stats for ${agentName}? This will clear:\n- Call logs\n- Activity data\n- Manual overrides\n\nThis cannot be undone.`);

        if (!confirmation) return;

        console.log(`🗑️ Resetting ${period} stats for ${agentName}...`);

        // Clear manual overrides
        const overrideKey = `${agentName}_${period}`;
        delete window.manualStatOverrides[overrideKey];

        // Clear stored performance data
        localStorage.removeItem(`agentStats_${agentName}_${period}`);
        localStorage.removeItem(`agentPerformance_${agentName}_${period}`);

        // Reset call logs for the period based on date
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const now = new Date();
        let startDate, endDate = now;

        switch(period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'ytd':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }

        // Clear call logs in the date range
        leads.forEach(lead => {
            if (lead.assignedTo === agentName && lead.reachOut && lead.reachOut.callLogs) {
                lead.reachOut.callLogs = lead.reachOut.callLogs.filter(call => {
                    const callDate = new Date(call.date);
                    return callDate < startDate || callDate > endDate;
                });
            }
        });

        // Save updated leads
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        console.log(`✅ Reset complete for ${agentName} ${period} stats`);

        if (window.showNotification) {
            window.showNotification(`${agentName} ${period} stats reset successfully`, 'success');
        }

        // Refresh the current modal if open
        if (window.currentAgentModal === agentName) {
            setTimeout(() => {
                window.viewAgentStats(agentName);
            }, 100);
        }
    };

    // Function to manually edit a specific stat
    window.editAgentStat = function(agentName, period, statName, currentValue) {
        if (!window.AGENT_PERFORMANCE_DEV_MODE) {
            alert('Dev mode must be enabled to edit stats');
            return;
        }

        const newValue = prompt(`Edit ${statName} for ${agentName} (${period}):\n\nCurrent value: ${currentValue}\nEnter new value:`, currentValue);

        if (newValue === null || newValue === '') return;

        const overrideKey = `${agentName}_${period}`;
        if (!window.manualStatOverrides[overrideKey]) {
            window.manualStatOverrides[overrideKey] = {};
        }

        window.manualStatOverrides[overrideKey][statName] = parseFloat(newValue) || newValue;

        console.log(`📝 Manual override set: ${statName} = ${newValue} for ${agentName} (${period})`);

        if (window.showNotification) {
            window.showNotification(`${statName} updated to ${newValue}`, 'success');
        }

        // Refresh the current modal if open
        if (window.currentAgentModal === agentName) {
            setTimeout(() => {
                window.viewAgentStats(agentName);
            }, 100);
        }
    };

    // Function to get leads created only in the specified date range
    window.getLeadsForPeriod = function(agentName, period = 'day', customRange = null) {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const now = new Date();
        let startDate, endDate = now;

        if (customRange) {
            startDate = customRange.start;
            endDate = customRange.end;
        } else {
            switch(period) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'ytd':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
        }

        // Filter leads by agent and creation date
        const agentLeads = leads.filter(lead => {
            if (lead.assignedTo !== agentName) return false;

            // Use the lead's creation date (check multiple possible fields)
            const createdDate = new Date(lead.created || lead.dateCreated || lead.createdAt || lead.timestamp || Date.now());

            return createdDate >= startDate && createdDate <= endDate;
        });

        console.log(`📊 Found ${agentLeads.length} leads created for ${agentName} in ${period} period (${startDate.toDateString()} to ${endDate.toDateString()})`);

        return agentLeads;
    };

    // Function to add dev mode toggle button to modal
    function addDevModeToggleToModal() {
        // Find the modal using the same logic as refreshAgentModalDevControls
        let modal = null;
        const allElements = document.querySelectorAll('*');

        for (let element of allElements) {
            if (element.textContent &&
                element.textContent.includes('Performance Profile') &&
                element.textContent.includes('Lead Distribution') &&
                element.textContent.includes('Close Profile')) {
                modal = element;
                break;
            }
        }

        if (!modal) return;

        // Remove existing dev toggle if it exists
        const existingToggle = modal.querySelector('.dev-mode-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        // Find a header element to attach the button to
        let modalHeader = null;
        const headers = modal.querySelectorAll('*');
        for (let header of headers) {
            if (header.textContent && header.textContent.includes('Performance Profile')) {
                modalHeader = header;
                console.log('🔧 Found header for dev toggle:', header.tagName);
                break;
            }
        }

        if (!modalHeader) return;

        // Create dev mode toggle button
        const devToggle = document.createElement('button');
        devToggle.className = 'dev-mode-toggle';
        devToggle.innerHTML = window.AGENT_PERFORMANCE_DEV_MODE ?
            '<i class="fas fa-cog"></i> Dev Mode: ON' :
            '<i class="fas fa-cog"></i> Dev Mode';
        devToggle.style.cssText = `
            padding: 4px 8px;
            background: ${window.AGENT_PERFORMANCE_DEV_MODE ? '#f59e0b' : '#6b7280'};
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-left: 16px;
            transition: all 0.2s;
        `;

        devToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            window.toggleAgentPerformanceDevMode();

            // Update button appearance
            setTimeout(() => {
                addDevModeToggleToModal();
                refreshAgentModalDevControls();
            }, 100);
        });

        // Add next to header instead of inside it
        if (modalHeader.parentElement) {
            modalHeader.parentElement.insertBefore(devToggle, modalHeader.nextSibling);
            console.log('🔧 Dev toggle button added to modal');
        }
    }

    // Function to add dev mode controls to agent modal
    function refreshAgentModalDevControls() {
        console.log('🔧 refreshAgentModalDevControls called');

        // Find the actual modal element - look for the performance content specifically
        let modal = null;
        const allElements = document.querySelectorAll('*');

        for (let element of allElements) {
            if (element.textContent &&
                element.textContent.includes('Performance Profile') &&
                element.textContent.includes('Lead Distribution') &&
                element.textContent.includes('Close Profile')) {
                modal = element;
                console.log('🔧 Found performance modal element:', element.tagName, element.className);
                break;
            }
        }

        if (!modal) {
            console.log('🚨 Performance modal not found');
            return;
        }

        // Remove existing dev controls
        const existingDevControls = modal.querySelector('.dev-controls');
        if (existingDevControls) {
            existingDevControls.remove();
        }

        // Always add the toggle button
        addDevModeToggleToModal();

        if (!window.AGENT_PERFORMANCE_DEV_MODE) return;

        // Find the right place to add dev controls - after the header area
        let insertionPoint = null;

        // Look for the "Performance Profile" header
        const headers = modal.querySelectorAll('*');
        for (let header of headers) {
            if (header.textContent && header.textContent.includes('Performance Profile')) {
                insertionPoint = header.parentElement;
                console.log('🔧 Found insertion point after Performance Profile header');
                break;
            }
        }

        if (!insertionPoint) {
            insertionPoint = modal;
            console.log('🔧 Using modal as insertion point');
        }

        const devControls = document.createElement('div');
        devControls.className = 'dev-controls';
        devControls.innerHTML = `
            <div style="
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 24px;
                border-left: 4px solid #f59e0b;
            ">
                <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">
                    <i class="fas fa-cog"></i> Developer Mode Controls
                </h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button onclick="resetAgentStats('Grant', 'day')" style="
                        padding: 6px 12px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Reset Day</button>
                    <button onclick="resetAgentStats('Grant', 'week')" style="
                        padding: 6px 12px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Reset Week</button>
                    <button onclick="resetAgentStats('Grant', 'month')" style="
                        padding: 6px 12px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Reset Month</button>
                    <button onclick="resetAgentStats('Grant', 'ytd')" style="
                        padding: 6px 12px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Reset YTD</button>
                </div>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
                    Click on any statistic to edit its value manually.
                </p>
            </div>
        `;

        // Insert the dev controls at the insertion point
        if (insertionPoint.firstChild) {
            insertionPoint.insertBefore(devControls, insertionPoint.firstChild);
        } else {
            insertionPoint.appendChild(devControls);
        }

        console.log('🔧 Dev controls inserted into modal');

        // Make stats clickable for editing
        const statCards = modalContent.querySelectorAll('[style*="font-size: 28px"]');
        statCards.forEach(card => {
            if (card.textContent && !isNaN(parseFloat(card.textContent))) {
                card.style.cursor = 'pointer';
                card.style.border = '1px dashed #f59e0b';
                card.title = 'Click to edit (Dev Mode)';

                card.addEventListener('click', function() {
                    const statName = this.parentElement.querySelector('[style*="font-size: 14px"]').textContent;
                    const currentValue = this.textContent;
                    window.editAgentStat('Grant', 'ytd', statName, currentValue);
                });
            }
        });
    }

    // Watch for agent performance modal
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Look for the specific performance modal content
                        if (node.textContent &&
                            node.textContent.includes('Performance Profile') &&
                            node.textContent.includes('Lead Distribution')) {
                            console.log('🔧 Agent Performance Modal detected, adding dev controls...');
                            setTimeout(() => {
                                refreshAgentModalDevControls();
                            }, 500);
                        }

                        // Also check child elements for the performance modal
                        if (node.querySelector) {
                            const performanceElement = node.querySelector('*');
                            if (performanceElement && performanceElement.textContent &&
                                performanceElement.textContent.includes('Performance Profile') &&
                                performanceElement.textContent.includes('Lead Distribution')) {
                                console.log('🔧 Agent Performance Modal in child detected, adding dev controls...');
                                setTimeout(() => {
                                    refreshAgentModalDevControls();
                                }, 500);
                            }
                        }
                    }
                });
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also try to add dev controls to any existing modals
    setTimeout(() => {
        const existingModal = document.querySelector('.agent-modal-overlay, .agent-profile-modal, .modal-overlay');
        if (existingModal && existingModal.textContent && existingModal.textContent.includes('Performance Profile')) {
            console.log('🔧 Found existing performance modal, adding dev controls...');
            refreshAgentModalDevControls();
        }
    }, 1000);

    // Manual function to add dev controls to currently open modal
    window.addDevControlsToCurrentModal = function() {
        console.log('🔧 Manually adding dev controls to current modal...');
        refreshAgentModalDevControls();
    };

    // Add global dev mode toggle command
    console.log('💡 Dev Mode Commands Available:');
    console.log('- FORCE_ADD_DEV_CONTROLS() - Manually add dev button to modal (USE THIS FIRST!)');
    console.log('- toggleAgentPerformanceDevMode() - Enable/disable dev mode');
    console.log('- addDevControlsToCurrentModal() - Manually add dev controls to open modal');
    console.log('- resetAgentStats(agentName, period) - Reset stats for period');
    console.log('- editAgentStat(agentName, period, statName, value) - Edit specific stat');

    console.log('🔧 Agent Performance Counts Fix System Installed');
    console.log('👁️ Watching for agent performance modals...');
    console.log('');
    console.log('🚨 QUICK START: Open the agent performance modal, then type: FORCE_ADD_DEV_CONTROLS()');

})();