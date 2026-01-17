/**
 * Live Stats Integration - Replace modal regeneration with live tracking
 */

// Override stat values with live tracking data
window.getLiveStatValue = function(agentName, statType, originalValue) {
    // Check if we have live stats for this agent
    if (window.liveStatsTracker && window.liveStatsTracker.agents[agentName]) {
        const liveStats = window.liveStatsTracker.agents[agentName];

        switch(statType) {
            case 'totalLeads':
                return liveStats.totalLeads || originalValue;
            case 'totalCalls':
                return liveStats.connectedCalls || originalValue;
            case 'highValueLeads':
                return liveStats.highValueLeads || originalValue;
            case 'callDuration':
                return liveStats.totalCallDuration || originalValue;
            case 'contactRate':
                return liveStats.contactRate || originalValue;
            default:
                return originalValue;
        }
    }
    return originalValue;
};

// Intercept agent performance modal creation to use live stats
(function() {
    'use strict';

    // Override the modal to use live stats instead of regenerating
    function integrateLiveStats() {
        // Wait for modal to be created
        const modal = document.querySelector('.agent-performance-content');
        if (!modal) {
            console.log('📊 Modal not ready, retrying...');
            setTimeout(integrateLiveStats, 500);
            return;
        }

        // Get agent name from modal
        const agentName = extractAgentName();
        if (!agentName) {
            console.log('❌ Could not extract agent name');
            return;
        }

        console.log(`📊 Integrating live stats for ${agentName}`);

        // Load live stats from server and apply to modal
        loadAndApplyLiveStats(agentName);

        // Add save button to modal
        addLiveStatsSaveButton(agentName);
    }

    // More aggressive approach - intercept ALL stat displays
    function overrideAllStatDisplays() {
        setTimeout(() => {
            const modal = document.querySelector('.agent-performance-content');
            if (!modal) return;

            const agentName = extractAgentName();
            if (!agentName) return;

            // Load live stats and override displayed values
            loadAndOverrideDisplayedStats(agentName);
        }, 1000); // Give modal time to fully generate
    }

    function extractAgentName() {
        // Try multiple selectors to find agent name
        const h2 = document.querySelector('h2');
        if (h2) {
            const match = h2.textContent?.match(/(\w+)\s+Performance/i);
            if (match) return match[1];
        }

        // Try modal title
        const modalTitle = document.querySelector('.modal-title');
        if (modalTitle) {
            const match = modalTitle.textContent?.match(/(\w+)\s+Performance/i);
            if (match) return match[1];
        }

        return null;
    }

    async function loadAndApplyLiveStats(agentName) {
        try {
            // Load live stats from server
            const liveStats = await window.liveStatsTracker.loadFromServer(agentName);

            if (liveStats) {
                console.log(`📊 Applying live stats for ${agentName}:`, liveStats);

                // Update modal with live stats
                updateModalWithLiveStats(liveStats);

                // Add data attributes for future updates
                addStatDataAttributes();
            }
        } catch (error) {
            console.error('Error loading live stats:', error);
        }
    }

    async function loadAndOverrideDisplayedStats(agentName) {
        try {
            // Load live stats from server
            const liveStats = await window.liveStatsTracker.loadFromServer(agentName);

            if (liveStats && Object.keys(liveStats).length > 0) {
                console.log(`📊 OVERRIDING displayed stats for ${agentName}:`, liveStats);

                // Find all large stat numbers and override them
                const statElements = document.querySelectorAll('[style*="font-size: 28px"], [style*="font-size:28px"]');

                statElements.forEach((element, index) => {
                    const parentContainer = element.closest('div');
                    const context = getStatContext(parentContainer);

                    let liveValue;
                    switch(context) {
                        case 'totalleads':
                            liveValue = liveStats.totalLeads;
                            break;
                        case 'totalcalls':
                            liveValue = liveStats.connectedCalls;
                            break;
                        case 'highvalue':
                            liveValue = liveStats.highValueLeads;
                            break;
                        case 'duration':
                            liveValue = liveStats.totalCallDuration;
                            break;
                        case 'contactrate':
                            liveValue = liveStats.contactRate + '%';
                            break;
                    }

                    if (liveValue !== undefined) {
                        const originalValue = element.textContent;
                        element.textContent = liveValue;

                        // Visual indication of override
                        element.style.background = '#3b82f6';
                        element.style.color = 'white';
                        element.style.padding = '2px 6px';
                        element.style.borderRadius = '4px';

                        console.log(`🔄 OVERRODE ${context}: ${originalValue} → ${liveValue}`);

                        setTimeout(() => {
                            element.style.background = '';
                            element.style.color = '';
                            element.style.padding = '';
                            element.style.borderRadius = '';
                        }, 3000);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading and overriding stats:', error);
        }
    }

    function updateModalWithLiveStats(stats) {
        // Find stat elements and update them
        const statElements = document.querySelectorAll('div[style*="font-size: 28px"]');

        statElements.forEach(element => {
            const parent = element.closest('div');
            const context = getStatContext(parent);

            let newValue;
            switch(context) {
                case 'totalcalls':
                    newValue = stats.connectedCalls || 0;
                    element.setAttribute('data-stat-type', 'totalCalls');
                    break;
                case 'totalleads':
                    newValue = stats.totalLeads || 0;
                    element.setAttribute('data-stat-type', 'totalLeads');
                    break;
                case 'highvalue':
                    newValue = stats.highValueLeads || 0;
                    element.setAttribute('data-stat-type', 'highValueLeads');
                    break;
                case 'contactrate':
                    newValue = (stats.contactRate || 0) + '%';
                    element.setAttribute('data-stat-type', 'contactRate');
                    break;
                case 'duration':
                    newValue = stats.totalCallDuration || 0;
                    element.setAttribute('data-stat-type', 'callDuration');
                    break;
            }

            if (newValue !== undefined) {
                element.textContent = newValue;

                // Visual feedback
                element.style.background = '#10b981';
                element.style.color = 'white';
                element.style.padding = '2px 4px';
                element.style.borderRadius = '2px';

                setTimeout(() => {
                    element.style.background = '';
                    element.style.color = '';
                    element.style.padding = '';
                    element.style.borderRadius = '';
                }, 2000);

                console.log(`📊 Updated ${context} to ${newValue}`);
            }
        });
    }

    function getStatContext(element) {
        // Simple context detection based on text content
        const text = element.textContent?.toLowerCase() || '';

        if (text.includes('total calls')) return 'totalcalls';
        if (text.includes('total leads')) return 'totalleads';
        if (text.includes('high value')) return 'highvalue';
        if (text.includes('contact rate')) return 'contactrate';
        if (text.includes('duration')) return 'duration';

        return 'unknown';
    }

    function addStatDataAttributes() {
        // Add data attributes to help track elements
        const statElements = document.querySelectorAll('div[style*="font-size: 28px"]');

        statElements.forEach(element => {
            const parent = element.closest('div');
            const context = getStatContext(parent);
            element.setAttribute('data-live-stat-context', context);
        });
    }

    function addLiveStatsSaveButton(agentName) {
        // Look for existing buttons area
        const modal = document.querySelector('.agent-performance-content');
        if (!modal) return;

        // Create save button
        const saveButton = document.createElement('button');
        saveButton.innerHTML = '💾 Save Current Stats';
        saveButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        saveButton.onclick = async () => {
            try {
                // Save current live stats to server
                await window.liveStatsTracker.saveToServer(agentName);

                // Visual feedback
                saveButton.innerHTML = '✅ Saved!';
                saveButton.style.background = '#059669';

                setTimeout(() => {
                    saveButton.innerHTML = '💾 Save Current Stats';
                    saveButton.style.background = '#10b981';
                }, 2000);

                console.log(`💾 Manually saved live stats for ${agentName}`);
            } catch (error) {
                console.error('Error saving live stats:', error);
                saveButton.innerHTML = '❌ Error';
                saveButton.style.background = '#dc2626';

                setTimeout(() => {
                    saveButton.innerHTML = '💾 Save Current Stats';
                    saveButton.style.background = '#10b981';
                }, 2000);
            }
        };

        // Add to page
        document.body.appendChild(saveButton);

        // Remove button when modal closes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.querySelector && node.querySelector('.agent-performance-content')) {
                            saveButton.remove();
                            observer.disconnect();
                        }
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Watch for modal creation
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.querySelector && node.querySelector('.agent-performance-content')) {
                        console.log('🎯 DETECTED agent performance modal - triggering live stats override');
                        setTimeout(integrateLiveStats, 100);

                        // Also trigger aggressive override after modal is fully loaded
                        overrideAllStatDisplays();
                    }
                });
            }
        });
    });

    modalObserver.observe(document.body, { childList: true, subtree: true });

    // Manual override function for testing
    window.manualOverrideLiveStats = async function() {
        console.log('🔧 Manual override triggered');
        const agentName = extractAgentName();
        if (agentName) {
            await loadAndOverrideDisplayedStats(agentName);
        } else {
            console.log('❌ Could not find agent name for manual override');
        }
    };

    console.log('🔴 Live Stats Integration loaded and monitoring for modals...');
    console.log('🔧 Manual test available: window.manualOverrideLiveStats()');

})();