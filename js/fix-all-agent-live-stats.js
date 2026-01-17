// Fix to ensure all agents get live stats overlays like Grant
console.log('🔧 Loading universal live stats overlay fix...');

// Override the viewAgentStatsWithDateRange function to ensure ALL agents get live stats
if (window.viewAgentStatsWithDateRange) {
    const originalFunction = window.viewAgentStatsWithDateRange;

    window.viewAgentStatsWithDateRange = async function(agentName, dateRange, periodLabel) {
        console.log(`🔧 FIXED: Enhanced viewAgentStatsWithDateRange called for ${agentName} with period: ${periodLabel}`);

        try {
            // Call the original function first with all parameters
            await originalFunction.call(this, agentName, dateRange, periodLabel);
        } catch (error) {
            console.warn(`🔧 FIXED: Error in original function for ${agentName}:`, error);
            // Continue with live stats even if original function fails
        }

        // Force apply live stats for ALL agents (not just Grant)
        setTimeout(async () => {
            await forceApplyLiveStatsForAgent(agentName);
        }, 800); // Slightly longer delay to ensure DOM is ready
    };
} else {
    console.warn('🔧 viewAgentStatsWithDateRange not found - live stats fix not applied');
}

// Universal function to apply live stats overlay for any agent
async function forceApplyLiveStatsForAgent(agentName) {
    try {
        console.log(`🚀 UNIVERSAL: Forcing live stats overlay for ${agentName}`);

        // Determine current period filter to fetch the right stats
        const currentPeriod = getCurrentPeriod();
        console.log(`🚀 UNIVERSAL: Current period detected: ${currentPeriod}`);

        // Try period-specific stats first, fall back to general stats
        let response, result;
        try {
            response = await fetch(`/api/live-agent-stats/${agentName}_${currentPeriod}`);
            result = await response.json();
            console.log(`📊 UNIVERSAL: Fetched ${currentPeriod}-specific stats for ${agentName}`);
        } catch (error) {
            console.log(`📊 UNIVERSAL: No ${currentPeriod}-specific stats, using general stats for ${agentName}`);
            response = await fetch(`/api/live-agent-stats/${agentName}`);
            result = await response.json();
        }

        if (result.stats && Object.keys(result.stats).length > 0) {
            console.log(`📊 UNIVERSAL: Retrieved live stats for ${agentName}:`, result.stats);

            // Find all stat number elements (28px font)
            const statElements = document.querySelectorAll('[style*="font-size: 28px"]');
            console.log(`📊 UNIVERSAL: Found ${statElements.length} stat elements to process`);

            // Track which stat labels have already been processed to prevent duplicates
            const processedLabels = new Set();

            statElements.forEach((element) => {
                const parentText = element.parentElement?.textContent?.toLowerCase() || '';
                let newValue, statLabel;

                // Map stats to display values
                if (parentText.includes('total leads')) {
                    newValue = result.stats.totalLeads;
                    statLabel = 'Total Leads';
                } else if (parentText.includes('high value leads')) {
                    newValue = result.stats.highValueLeads;
                    statLabel = 'High Value Leads';
                } else if (parentText.includes('total calls')) {
                    newValue = result.stats.totalCalls;
                    statLabel = 'Total Calls';
                } else if (parentText.includes('call duration')) {
                    newValue = result.stats.totalCallDuration;
                    statLabel = 'Total Call Duration (min)';
                } else if (parentText.includes('contact rate')) {
                    newValue = result.stats.contactRate + '%';
                    statLabel = 'Contact Rate';
                } else if (parentText.includes('leads to brokers')) {
                    newValue = result.stats.leadsToBrokers;
                    statLabel = 'Leads to Brokers';
                } else if (parentText.includes('low value lead rate')) {
                    const lowValueRate = result.stats.totalLeads > 0
                        ? Math.round((result.stats.lowValueLeads / result.stats.totalLeads) * 100)
                        : 0;
                    newValue = lowValueRate + '%';
                    statLabel = 'Low Value Lead Rate';
                }

                if (newValue !== undefined && statLabel) {
                    const originalValue = element.textContent;

                    // Check if this stat label has already been processed
                    if (processedLabels.has(statLabel)) {
                        console.log(`⏭️ SKIPPING: ${statLabel} already processed for ${agentName}`);
                        return;
                    }

                    // Mark this stat label as processed
                    processedLabels.add(statLabel);

                    // Find ALL stat containers with this same label and hide them
                    statElements.forEach((otherElement) => {
                        const otherParentText = otherElement.parentElement?.textContent?.toLowerCase() || '';
                        let otherStatLabel = '';

                        // Determine the stat label for this other element
                        if (otherParentText.includes('total leads')) otherStatLabel = 'Total Leads';
                        else if (otherParentText.includes('high value leads')) otherStatLabel = 'High Value Leads';
                        else if (otherParentText.includes('total calls')) otherStatLabel = 'Total Calls';
                        else if (otherParentText.includes('call duration')) otherStatLabel = 'Total Call Duration (min)';
                        else if (otherParentText.includes('contact rate')) otherStatLabel = 'Contact Rate';
                        else if (otherParentText.includes('leads to brokers')) otherStatLabel = 'Leads to Brokers';
                        else if (otherParentText.includes('low value lead rate')) otherStatLabel = 'Low Value Lead Rate';

                        // Hide all containers with the same stat label
                        if (otherStatLabel === statLabel) {
                            const otherContainer = otherElement.closest('[style*="padding: 20px"]');
                            if (otherContainer) {
                                otherContainer.style.display = 'none';
                                otherContainer.dataset.liveStatsApplied = 'true';
                            }
                        }
                    });

                    // Get the first stat container for positioning the overlay
                    const statContainer = element.closest('[style*="padding: 20px"]');
                    if (!statContainer) return;

                    // Calculate comparison to average (simplified)
                    let avgValue = 0;
                    let comparison = 0;

                    if (statLabel === 'Total Leads') avgValue = 23;
                    else if (statLabel === 'High Value Leads') avgValue = 2;
                    else if (statLabel === 'Total Calls') avgValue = 6;
                    else if (statLabel === 'Total Call Duration (min)') avgValue = 248;
                    else if (statLabel === 'Contact Rate') avgValue = 70;

                    if (avgValue > 0) {
                        if (statLabel.includes('%')) {
                            comparison = parseInt(newValue) - avgValue;
                        } else {
                            comparison = parseInt(newValue) - avgValue;
                        }
                    }

                    // Create replacement green overlay
                    const overlay = document.createElement('div');
                    overlay.className = 'live-stats-expanded-overlay';
                    overlay.style.cssText = `
                        background: rgb(209, 250, 229);
                        color: rgb(6, 95, 70);
                        padding: 20px;
                        border-radius: 12px;
                        border: 2px solid rgb(16, 185, 129);
                        text-align: center;
                        margin: 8px;
                        position: relative;
                        z-index: 1000;
                    `;

                    overlay.innerHTML = `
                        <div style="font-size: 28px; font-weight: bold; margin-bottom: 4px; color: rgb(6, 95, 70);">${newValue}</div>
                        <div style="font-size: 14px; color: #059669; margin-bottom: 4px;">${statLabel}</div>
                        <div style="font-size: 11px; color: #059669; margin-top: 4px; opacity: 0.8;">${comparison >= 0 ? '+' : ''}${comparison.toFixed(1)} vs avg</div>
                        <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Avg: ${avgValue}</div>
                    `;

                    // Insert the overlay in the same position as the original
                    if (statContainer.parentNode) {
                        statContainer.parentNode.insertBefore(overlay, statContainer);
                    }

                    console.log(`✅ UNIVERSAL REPLACEMENT: ${originalValue} → ${newValue} (${statLabel}) for ${agentName}`);
                }
            });
        } else {
            console.log(`📊 UNIVERSAL: No live stats found for ${agentName}`);
        }
    } catch (error) {
        console.error(`❌ UNIVERSAL: Error applying live stats for ${agentName}:`, error);
    }
}

// Helper function to get current period filter
function getCurrentPeriod() {
    // Look for filter buttons with the active state
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    for (const btn of filterButtons) {
        const computedStyle = window.getComputedStyle(btn);
        const bgColor = computedStyle.backgroundColor;
        // Check for blue background color (active state)
        if (bgColor === 'rgb(37, 99, 235)' || btn.style.background === '#2563eb') {
            const filter = btn.getAttribute('data-filter');
            return filter || 'day';
        }
    }

    // Fallback: check for active class
    for (const btn of filterButtons) {
        if (btn.classList.contains('active')) {
            const filter = btn.getAttribute('data-filter');
            return filter || 'day';
        }
    }

    // Default fallback
    return 'day';
}

// Also expose the functions globally for manual testing
window.forceApplyLiveStatsForAgent = forceApplyLiveStatsForAgent;
window.getCurrentPeriod = getCurrentPeriod;

console.log('✅ Universal live stats overlay fix loaded');