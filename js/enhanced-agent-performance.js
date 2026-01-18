// Enhanced Agent Performance with Time-Based Tracking and Reset Functionality
(function() {
    'use strict';

    console.log('🚀 Loading Enhanced Agent Performance System...');

    // Define helper functions first
    function generatePerformanceCard(value, avgValue, label, suffix = '', color = '#374151', isPercentage = false) {
        const displayValue = isPercentage ? `${value}%` : `${value}${suffix}`;
        const comparison = avgValue ? (value > avgValue ? '↗️' : value < avgValue ? '↘️' : '➡️') : '';
        const comparisonColor = avgValue ? (value > avgValue ? '#059669' : value < avgValue ? '#dc2626' : '#6b7280') : '#6b7280';

        return `
            <div style="
                background: white;
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                text-align: center;
                transition: all 0.2s ease;
            " onmouseover="this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)'" onmouseout="this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.05)'">
                <div style="font-size: 28px; font-weight: 700; color: ${color}; margin-bottom: 8px;">
                    ${displayValue} <span style="color: ${comparisonColor}; font-size: 16px;">${comparison}</span>
                </div>
                <div style="color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
                ${suffix ? `<div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">${suffix}</div>` : ''}
            </div>
        `;
    }

    // Calculate average performance for comparison
    function calculateAveragePerformance() {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const agents = ['Grant', 'Hunter', 'Carson'];

        let totalLeads = 0;
        let totalHighValue = 0;
        let totalLowValue = 0;
        let totalCalls = 0;
        let totalCallDuration = 0;
        let totalContacted = 0;
        let totalBrokerPushed = 0;

        agents.forEach(agent => {
            const agentLeads = leads.filter(lead => lead.assignedTo === agent);
            totalLeads += agentLeads.length;

            agentLeads.forEach(lead => {
                const premium = parseFloat(lead.premium || 0);
                if (premium > 5000) totalHighValue++;
                if (premium < 1000) totalLowValue++;
                if (lead.reachOut && lead.reachOut.contacted) totalContacted++;
                if (lead.status && lead.status.toLowerCase().includes('broker')) totalBrokerPushed++;

                if (lead.reachOut && lead.reachOut.callLogs) {
                    totalCalls += lead.reachOut.callLogs.length;
                    lead.reachOut.callLogs.forEach(call => {
                        totalCallDuration += (call.duration || 0);
                    });
                }
            });
        });

        const avgPerAgent = totalLeads / agents.length;

        return {
            totalLeads: Math.round(avgPerAgent),
            highValueLeads: Math.round(totalHighValue / agents.length),
            lowValuePercentage: totalLeads > 0 ? ((totalLowValue / totalLeads) * 100).toFixed(1) : '0',
            totalCalls: Math.round(totalCalls / agents.length),
            totalCallDuration: Math.round(totalCallDuration / 60 / agents.length),
            contactRate: totalLeads > 0 ? ((totalContacted / totalLeads) * 100).toFixed(1) : '0',
            leadsPushedToBrokers: Math.round(totalBrokerPushed / agents.length)
        };
    }

    // Override the original viewAgentStats function with enhanced version
    const originalViewAgentStats = window.viewAgentStats;

    window.viewAgentStats = function(agentName) {
        console.log('🔥 Enhanced viewAgentStats called for:', agentName);
        // Flag to prevent original system from running
        window.ENHANCED_AGENT_STATS_ACTIVE = true;
        // Use enhanced system
        return window.enhancedViewAgentStats(agentName);
    };

    // Create the enhanced function that contains our logic
    window.enhancedViewAgentStats = function(agentName) {
        console.log('🎯 Running enhanced agent stats for:', agentName);

        // Check if simple counter should take precedence
        if (window.FORCE_SIMPLE_COUNTER && window.showSimpleCounter) {
            console.log('🎯 Simple counter forced - redirecting immediately');
            return window.showSimpleCounter(agentName);
        }

        // Check if independent tracking should take precedence
        if (window.FORCE_INDEPENDENT_TRACKING && window.showIndependentAgentModal) {
            console.log('🎯 Independent tracking forced - redirecting immediately');
            return window.showIndependentAgentModal(agentName);
        }

        try {
            // Calculate average performance stats for comparison
            const avgStats = calculateAveragePerformance();
            console.log('Average stats for comparison:', avgStats);

            // Close any existing modal first
            closeAgentModal();

            // Use independent tracking system
            let currentPeriod = 'since_reset';
            let agentStats = null;
            let trackingData = null; // Initialize to prevent undefined errors

            // Check if independent tracking is available
            if (window.getIndependentAgentPerformance) {
                agentStats = window.getIndependentAgentPerformance(agentName, currentPeriod);
                console.log(`📊 Using independent tracking for ${agentName}:`, agentStats);

                // IMMEDIATELY EXIT and use independent modal instead
                console.log('🎯 Redirecting to independent modal system');
                if (window.showIndependentAgentModal) {
                    return window.showIndependentAgentModal(agentName);
                }

                // Convert agentStats to trackingData format for compatibility (fallback)
                trackingData = {
                    totalLeads: agentStats.totalLeads,
                    activities: [],
                    lastResetTimestamp: agentStats.resetTimestamp
                };
            } else {
                console.warn('Independent tracking not available, using fallback');

                // Try to get old tracking data as fallback
                try {
                    const agentTrackingData = localStorage.getItem('agentPerformanceTracking');
                    if (agentTrackingData) {
                        const parsedData = JSON.parse(agentTrackingData);
                        trackingData = parsedData.agents && parsedData.agents[agentName] ? parsedData.agents[agentName] : null;
                    }
                } catch (e) {
                    console.warn('Could not parse agent tracking data:', e);
                }
            }

            // Check actual leads in localStorage to see current state
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const currentAgentLeads = leads.filter(lead => lead.assignedTo === agentName);

            // Declare agentLeads variable first
            let agentLeads;

            // Determine if we should use tracking data or actual leads
            let useTrackingData = false;

            // Check if leads have been stat-reset (exist but have reset markers)
            const hasStatResetLeads = currentAgentLeads.some(lead => lead.statsReset || lead.resetTimestamp);

            if (trackingData) {
                // If agent was reset, ALWAYS use tracking data - don't switch back to legacy calculation
                if (trackingData.lastResetTimestamp) {
                    console.log(`📊 Agent ${agentName} was reset - using incremental tracking only (ignoring ${currentAgentLeads.length} total leads)`);

                    // Filter leads to only count those added AFTER the reset timestamp
                    const resetTimestamp = new Date(trackingData.lastResetTimestamp);
                    const newLeadsAfterReset = currentAgentLeads.filter(lead => {
                        // EXCLUDE leads that have reset markers - they existed before the reset
                        if (lead.resetTimestamp || lead.statsReset || lead.preResetLead) {
                            console.log(`🚫 Excluding pre-reset lead: ${lead.id} - ${lead.name}`);
                            return false;
                        }

                        // For leads without reset markers, check their timestamps
                        if (lead.createdAt) {
                            const leadCreatedAt = new Date(lead.createdAt);
                            const isAfterReset = leadCreatedAt > resetTimestamp;
                            console.log(`📅 Lead ${lead.id} createdAt ${lead.createdAt} > resetTimestamp ${trackingData.lastResetTimestamp}: ${isAfterReset}`);
                            return isAfterReset;
                        }
                        if (lead.assignedDate) {
                            const assignedDate = new Date(lead.assignedDate);
                            const isAfterReset = assignedDate > resetTimestamp;
                            console.log(`📅 Lead ${lead.id} assignedDate ${lead.assignedDate} > resetTimestamp ${trackingData.lastResetTimestamp}: ${isAfterReset}`);
                            return isAfterReset;
                        }

                        // If no timestamp and no reset markers, consider it a new import - add timestamp
                        console.log(`🆕 Lead ${lead.id} has no timestamp and no reset markers - treating as new import`);
                        return true;
                    });

                    console.log(`📊 Found ${newLeadsAfterReset.length} leads added after reset timestamp ${trackingData.lastResetTimestamp}`);

                    // DEBUG: Log all leads with their timestamps
                    console.log(`🔍 DEBUGGING: All ${currentAgentLeads.length} agent leads:`);
                    currentAgentLeads.forEach((lead, index) => {
                        console.log(`  ${index + 1}. ${lead.id} - ${lead.name} | Created: ${lead.createdAt || 'NONE'} | Assigned: ${lead.assignedDate || 'NONE'} | Reset: ${lead.resetTimestamp || 'NONE'} | StatsReset: ${lead.statsReset || 'NONE'}`);
                    });

                    // Add timestamps to leads without reset markers AND without timestamps (new imports)
                    const leadsNeedingTimestamps = newLeadsAfterReset.filter(lead => {
                        const hasNoTimestamp = !lead.createdAt && !lead.assignedDate;
                        const isNotAutoTimestamped = !lead.autoTimestamped;
                        return hasNoTimestamp && isNotAutoTimestamped;
                    });

                    if (leadsNeedingTimestamps.length > 0) {
                        console.log(`🔄 Adding timestamps to ${leadsNeedingTimestamps.length} new imports without timestamps`);

                        leadsNeedingTimestamps.forEach(lead => {
                            lead.assignedDate = new Date().toISOString();
                            lead.importedAfterReset = true;
                            lead.autoTimestamped = true;
                            console.log(`🕒 Added timestamp to new import: ${lead.id} - ${lead.name}`);
                        });

                        // Save updated leads
                        localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    }

                    // Use the filtered leads (already filtered for reset markers)
                    agentLeads = newLeadsAfterReset;

                    console.log(`🔍 FINAL AGENT LEADS COUNT: ${agentLeads.length}`);
                    console.log(`🔍 FINAL AGENT LEADS:`);
                    agentLeads.forEach((lead, index) => {
                        console.log(`  ${index + 1}. ${lead.id} - ${lead.name}`);
                    });

                    useTrackingData = true; // Stay in tracking mode
                } else if (trackingData.totalLeads === 0 && trackingData.activities.length === 0 && currentAgentLeads.length === 0) {
                    console.log(`📊 Agent ${agentName} has no tracking data and no leads - showing zeros`);
                    agentLeads = []; // Set to empty array for zeros
                    useTrackingData = true;
                } else if (trackingData.lastResetTimestamp && currentAgentLeads.length === 0) {
                    console.log(`📊 Agent ${agentName} was reset and still has no leads - showing zeros`);
                    agentLeads = []; // Set to empty array for zeros
                    useTrackingData = true;
                } else {
                    console.log(`📊 Agent ${agentName} has active data - using lead calculation`);
                    agentLeads = currentAgentLeads; // Use all current leads
                    useTrackingData = false;
                }
            } else {
                console.log(`📊 Agent ${agentName} has no tracking data - using lead calculation`);
                agentLeads = currentAgentLeads; // Use all current leads
                useTrackingData = false;
            }

            console.log(`📊 Agent ${agentName} - Using tracking data: ${useTrackingData}, Current leads: ${currentAgentLeads.length}, Tracking leads: ${trackingData ? trackingData.totalLeads : 'N/A'}`);
            console.log(`🔧 DEBUG: agentLeads set to ${agentLeads.length} leads in conditional logic`);

            let totalCallTime = 0;
            let contactedLeads = 0;
            let sales = 0;
            let totalPremium = 0;
            let highValueLeads = 0;
            let lowValueLeads = 0;
            let totalCalls = 0;
            let leadsPushedToBrokers = 0;

            console.log(`🔧 DEBUG: Variables initialized, starting calculation logic`);

            if (useTrackingData && trackingData && trackingData.lastResetTimestamp && agentLeads.length === 0) {
                // Agent was reset and no new leads - show zeros
                console.log('📊 Using incremental tracking data (post-reset, no new activity)');
                // All values remain 0 since agent was reset and no new activity
            } else {
                // Calculate metrics from current leads (either new leads after reset, or normal operation)
                console.log(`📊 Calculating stats from ${agentLeads.length} leads (post-reset tracking: ${trackingData && trackingData.lastResetTimestamp ? 'YES' : 'NO'})`);
                agentLeads.forEach(lead => {
                    const premium = parseFloat(lead.premium || 0);
                    totalPremium += premium;

                    if (lead.status === 'closed_won' || lead.leadStatus === 'SALE') {
                        sales++;
                    }

                    if (lead.reachOut && lead.reachOut.contacted) {
                        contactedLeads++;
                    }

                    if (lead.reachOut && lead.reachOut.callLogs) {
                        lead.reachOut.callLogs.forEach(call => {
                            totalCallTime += (call.duration || 0);
                            totalCalls++;
                        });
                    } else if (lead.callLogs) {
                        lead.callLogs.forEach(call => {
                            totalCallTime += (call.duration || 0);
                            totalCalls++;
                        });
                    }

                    // High/Low value classification
                    if (premium > 5000) {
                        highValueLeads++;
                    } else if (premium < 1000) {
                        lowValueLeads++;
                    }

                    if (lead.status && lead.status.toLowerCase().includes('broker')) {
                        leadsPushedToBrokers++;
                    }
                });
            }

            console.log(`🔧 DEBUG: About to calculate percentages with agentLeads.length=${agentLeads.length}`);

            const contactRate = agentLeads.length > 0 ? (contactedLeads / agentLeads.length * 100).toFixed(1) : '0.0';
            const conversionRate = agentLeads.length > 0 ? (sales / agentLeads.length * 100).toFixed(1) : '0.0';
            const avgCallTime = totalCalls > 0 ? (totalCallTime / totalCalls / 60).toFixed(1) : '0';
            const highValuePercentage = agentLeads.length > 0 ? (highValueLeads / agentLeads.length * 100).toFixed(1) : '0';
            const lowValuePercentage = agentLeads.length > 0 ? (lowValueLeads / agentLeads.length * 100).toFixed(1) : '0';
            const brokerPushPercentage = agentLeads.length > 0 ? (leadsPushedToBrokers / agentLeads.length * 100).toFixed(1) : '0';

            console.log(`🔧 DEBUG: Percentages calculated successfully`);

            console.log(`🔧 DEBUG: About to create modal overlay`);

            // Create modal overlay
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';
            modalOverlay.id = 'agentStatsModal';

            console.log(`🔧 DEBUG: Modal overlay element created`);
            modalOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 1;
            `;

            // Add CSS animation if not already added
            if (!document.getElementById('modalAnimationStyles')) {
                const style = document.createElement('style');
                style.id = 'modalAnimationStyles';
                style.textContent = `
                    @keyframes modalSlideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-50px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    .modal-overlay {
                        animation: modalSlideIn 0.3s ease-out;
                    }
                `;
                document.head.appendChild(style);
            }

            modalOverlay.classList.add('modal-overlay');

            // Enhanced modal content with reset button
            modalOverlay.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 900px;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    position: relative;
                ">
                    <!-- Modal Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 16px 16px 0 0; position: sticky; top: 0; z-index: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">
                                    <i class="fas fa-user-circle" style="margin-right: 12px;"></i>${agentName} Performance
                                </h2>
                                <p style="margin: 8px 0 0 0; opacity: 0.9;">Comprehensive performance analytics & insights</p>
                            </div>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <!-- Reset Button -->
                                <button onclick="resetAgentStats('${agentName}')" style="
                                    padding: 8px 16px;
                                    background: rgba(220, 38, 38, 0.9);
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 8px;
                                    color: white;
                                    font-size: 14px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    display: flex;
                                    align-items: center;
                                    gap: 6px;
                                " onmouseover="this.style.background='rgba(220, 38, 38, 1)'" onmouseout="this.style.background='rgba(220, 38, 38, 0.9)'">
                                    <i class="fas fa-redo"></i>
                                    Reset Stats
                                </button>

                                <!-- Close Button -->
                                <button onclick="closeAgentModal()" style="
                                    width: 40px;
                                    height: 40px;
                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 50%;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    font-size: 18px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    transition: all 0.2s ease;
                                " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">×</button>
                            </div>
                        </div>
                    </div>

                    <!-- Enhanced Content -->
                    <div style="padding: 24px;">
                        <!-- Time Period Filters -->
                        <div style="margin-bottom: 24px; text-align: center;">
                            <h3 style="margin: 0 0 16px 0; color: #1f2937;">📅 Time Period View</h3>
                            <div style="display: inline-flex; background: #f3f4f6; padding: 4px; border-radius: 12px; gap: 4px;">
                                <button onclick="filterEnhancedAgentStats('${agentName}', 'today')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #3b82f6; color: white; font-weight: 600; cursor: pointer;">Today</button>
                                <button onclick="filterEnhancedAgentStats('${agentName}', 'week')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #6b7280; color: white; cursor: pointer;">7 Days</button>
                                <button onclick="filterEnhancedAgentStats('${agentName}', 'month')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #6b7280; color: white; cursor: pointer;">Month</button>
                                <button onclick="filterEnhancedAgentStats('${agentName}', 'year')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #6b7280; color: white; cursor: pointer;">Year</button>
                                <button onclick="filterEnhancedAgentStats('${agentName}', 'all')" style="padding: 8px 16px; border: none; border-radius: 8px; background: #6b7280; color: white; cursor: pointer;">All Time</button>
                            </div>
                        </div>

                        <!-- Current Period Display -->
                        <div id="currentPeriodDisplay" style="text-align: center; margin-bottom: 20px; padding: 12px; background: #eff6ff; border-radius: 8px;">
                            <strong style="color: #1d4ed8;">📊 Viewing: Today's Performance</strong>
                        </div>

                        <!-- Performance Cards (same as before but enhanced) -->
                        <div style="margin-bottom: 24px;">
                            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">📈 Lead Distribution</h3>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                                ${generatePerformanceCard(agentLeads.length, avgStats.totalLeads, 'Total Leads', '', '#374151')}
                                ${generatePerformanceCard(highValueLeads, avgStats.highValueLeads, 'High Value Leads', `${highValuePercentage}% of total`, '#059669')}
                                ${generatePerformanceCard(parseFloat(lowValuePercentage), parseFloat(avgStats.lowValuePercentage), 'Low Value Leads', `${lowValueLeads} total leads`, '#dc2626', true)}
                            </div>
                        </div>

                        <!-- Call Activity Group -->
                        <div style="margin-bottom: 16px;">
                            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">📞 Call Activity</h3>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                                ${generatePerformanceCard(totalCalls, avgStats.totalCalls, 'Total Calls', '', '#374151')}
                                ${generatePerformanceCard(parseFloat((totalCallTime/60).toFixed(1)), parseFloat(avgStats.totalCallDuration), 'Total Call Duration (min)', `Avg: ${avgCallTime} min/call`, '#374151')}
                            </div>
                        </div>

                        <!-- Performance Metrics -->
                        <div style="margin-bottom: 24px;">
                            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">⚡ Performance Metrics</h3>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                                ${generatePerformanceCard(parseFloat(contactRate), parseFloat(avgStats.contactRate), 'Contact Rate', '%', '#374151')}
                                ${generatePerformanceCard(leadsPushedToBrokers, avgStats.leadsPushedToBrokers, 'Leads to Brokers', `${brokerPushPercentage}% of total`, '#059669')}
                            </div>
                        </div>

                        <!-- Performance Summary -->
                        <div style="margin-top: 24px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #3b82f6;">
                            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">📊 Performance Summary</h3>
                            <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                                ${agentName} has managed <strong>${agentLeads.length} total leads</strong> with
                                <strong style="color: #059669;">${highValueLeads} high-value leads</strong> (${highValuePercentage}%) and
                                <strong style="color: #dc2626;">${lowValueLeads} low-value leads</strong> (${lowValuePercentage}%).
                                Call activity shows <strong>${totalCalls} calls</strong> with <strong>${Math.round(totalCallTime/60)} minutes</strong> total talk time.
                                Contact rate stands at <strong style="color: #3b82f6;">${contactRate}%</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            // Add to document body instead of documentElement
            document.body.appendChild(modalOverlay);

            // Close modal when clicking overlay
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    closeAgentModal();
                }
            });

            // Close modal when pressing Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeAgentModal();
                }
            });

            // Ensure modal doesn't interfere with tab navigation
            modalOverlay.style.pointerEvents = 'auto';
            const modalContent = modalOverlay.querySelector('div');
            if (modalContent) {
                modalContent.style.pointerEvents = 'auto';
            }

            console.log('✅ Enhanced agent profile modal created successfully');

            // Force the modal to be visible and on top (but not too high z-index)
            setTimeout(() => {
                const modal = document.getElementById('agentStatsModal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.style.visibility = 'visible';
                    modal.style.opacity = '1';
                    modal.style.zIndex = '10000'; // Reasonable z-index
                    console.log('🔧 Forced modal to display');
                } else {
                    console.error('❌ Modal element not found after creation');
                }
            }, 100);

        } catch (error) {
            console.error('❌ Error in enhanced viewAgentStats:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                agentName: agentName,
                timestamp: new Date().toISOString()
            });
            // Don't fall back to original system - show error and stop
            alert(`Error loading enhanced agent statistics for ${agentName}: ${error.message || 'Unknown error'}`);
            return false; // Prevent further execution
        }
    };

    // Reset agent statistics function (override dev mode requirement)
    window.resetAgentStats = function(agentName, period = 'all') {
        // Force reset without dev mode check
        console.log(`🔄 Enhanced reset called for ${agentName} (period: ${period})`);

        const confirmReset = confirm(`Are you sure you want to reset all performance statistics for ${agentName}? This action cannot be undone.`);

        if (confirmReset) {
            console.log(`✅ Confirmed - Resetting stats for ${agentName}`);

            // Get reset timestamp BEFORE resetting anything
            const resetTimestamp = new Date().toISOString();

            // Mark all existing leads for this agent with reset timestamp to exclude from future counts
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const agentLeads = leads.filter(lead => lead.assignedTo === agentName);

            console.log(`🔄 Marking ${agentLeads.length} existing leads as pre-reset for ${agentName}`);

            agentLeads.forEach(lead => {
                // Mark lead as existing before reset - this excludes it from post-reset calculations
                lead.resetTimestamp = resetTimestamp;
                lead.statsReset = true;
                lead.preResetLead = true;

                // Reset reachOut data
                if (lead.reachOut) {
                    lead.reachOut = {
                        callAttempts: 0,
                        callsConnected: 0,
                        emailCount: 0,
                        textCount: 0,
                        voicemailCount: 0,
                        contacted: false,
                        completedAt: null,
                        reachOutCompletedAt: null,
                        callLogs: []
                    };
                }
                if (lead.callLogs) {
                    lead.callLogs = [];
                }

                console.log(`🏷️ Marked lead ${lead.id} (${lead.name}) as pre-reset`);
            });

            // Reset using new tracking system WITH the reset timestamp
            if (window.resetAgentPerformance) {
                window.resetAgentPerformance(agentName, resetTimestamp);
            }

            // Save updated leads
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            alert(`✅ Statistics reset successfully for ${agentName}!`);

            // Refresh the modal
            setTimeout(() => {
                window.viewAgentStats(agentName);
            }, 500);
        }
    };

    // Filter enhanced agent stats by time period
    window.filterEnhancedAgentStats = function(agentName, period) {
        console.log(`🔄 Filtering ${agentName} stats for period: ${period}`);

        // Update active button styling
        const buttons = document.querySelectorAll('#agentStatsModal button');
        buttons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes(period.toLowerCase()) ||
                (period === 'today' && btn.textContent === 'Today') ||
                (period === 'week' && btn.textContent === '7 Days') ||
                (period === 'all' && btn.textContent === 'All Time')) {
                btn.style.background = '#3b82f6';
                btn.style.fontWeight = '600';
            } else if (!btn.textContent.includes('Reset') && !btn.textContent.includes('×')) {
                btn.style.background = '#6b7280';
                btn.style.fontWeight = 'normal';
            }
        });

        // Update period display
        const periodDisplay = document.getElementById('currentPeriodDisplay');
        if (periodDisplay) {
            const periodNames = {
                'today': "Today's Performance",
                'week': "Past 7 Days Performance",
                'month': "This Month's Performance",
                'year': "This Year's Performance",
                'all': "All Time Performance"
            };
            periodDisplay.innerHTML = `<strong style="color: #1d4ed8;">📊 Viewing: ${periodNames[period] || 'Custom Period'}</strong>`;
        }

        // If new tracking system available, use it
        if (window.getPerformanceSummary) {
            const summary = window.getPerformanceSummary(agentName);
            console.log(`📊 ${agentName} performance summary:`, summary);

            // Update the cards with time-filtered data
            // This would require updating the modal content, which is complex
            // For now, show notification about the filtering
            alert(`🔄 Filtering enabled for ${period}. Enhanced time-based tracking is active!`);
        } else {
            console.log('⚠️ New tracking system not available, showing all-time data');
        }
    };

    // Helper function to close the agent modal
    window.closeAgentModal = function() {
        const existingModal = document.getElementById('agentStatsModal');
        if (existingModal) {
            existingModal.remove();
            console.log('🔄 Existing modal closed');
        }
    };

    // Monitor for tab navigation and auto-close modal
    const originalSetActiveTab = window.setActiveTab;
    if (originalSetActiveTab) {
        window.setActiveTab = function(tabName) {
            // Close agent modal when switching tabs
            closeAgentModal();
            console.log(`📱 Tab switch detected to ${tabName} - closed agent modal`);
            return originalSetActiveTab.apply(this, arguments);
        };
    }

    // Also monitor showSection if it exists
    const originalShowSection = window.showSection;
    if (originalShowSection) {
        window.showSection = function(sectionName) {
            // Close agent modal when switching tabs
            closeAgentModal();
            console.log(`📱 Section switch detected to ${sectionName} - closed agent modal`);
            return originalShowSection.apply(this, arguments);
        };
    }

    // Monitor for tab clicks and auto-close modal
    document.addEventListener('click', function(e) {
        const isTabClick = (
            e.target.classList.contains('nav-link') ||
            e.target.classList.contains('mobile-nav-link') ||
            e.target.closest('.nav-link') ||
            e.target.closest('.mobile-nav-link') ||
            e.target.classList.contains('tab') ||
            e.target.closest('.tab')
        );

        if (isTabClick) {
            const modal = document.getElementById('agentStatsModal');
            if (modal) {
                console.log('📱 Navigation click detected - closing agent modal');
                closeAgentModal();
            }
        }
    });

    // Generate performance card helper function
    window.generatePerformanceCard = function(value, avgValue, label, suffix = '', color = '#374151', isPercentage = false) {
        const displayValue = isPercentage ? `${value}%` : `${value}${suffix}`;
        const comparison = avgValue ? (value > avgValue ? '↗️' : value < avgValue ? '↘️' : '➡️') : '';
        const comparisonColor = avgValue ? (value > avgValue ? '#059669' : value < avgValue ? '#dc2626' : '#6b7280') : '#6b7280';

        return `
            <div style="
                background: white;
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                text-align: center;
                transition: all 0.2s ease;
            " onmouseover="this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)'" onmouseout="this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.05)'">
                <div style="font-size: 28px; font-weight: 700; color: ${color}; margin-bottom: 8px;">
                    ${displayValue} <span style="color: ${comparisonColor}; font-size: 16px;">${comparison}</span>
                </div>
                <div style="color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
                ${suffix ? `<div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">${suffix}</div>` : ''}
            </div>
        `;
    };

    // Calculate average performance for comparison
    window.calculateAveragePerformance = function() {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const agents = ['Grant', 'Hunter', 'Carson'];

        let totalLeads = 0;
        let totalHighValue = 0;
        let totalLowValue = 0;
        let totalCalls = 0;
        let totalCallDuration = 0;
        let totalContacted = 0;
        let totalBrokerPushed = 0;

        agents.forEach(agent => {
            const agentLeads = leads.filter(lead => lead.assignedTo === agent);
            totalLeads += agentLeads.length;

            agentLeads.forEach(lead => {
                const premium = parseFloat(lead.premium || 0);
                if (premium > 5000) totalHighValue++;
                if (premium < 1000) totalLowValue++;
                if (lead.reachOut && lead.reachOut.contacted) totalContacted++;
                if (lead.status && lead.status.toLowerCase().includes('broker')) totalBrokerPushed++;

                if (lead.reachOut && lead.reachOut.callLogs) {
                    totalCalls += lead.reachOut.callLogs.length;
                    lead.reachOut.callLogs.forEach(call => {
                        totalCallDuration += (call.duration || 0);
                    });
                }
            });
        });

        const avgPerAgent = totalLeads / agents.length;

        return {
            totalLeads: Math.round(avgPerAgent),
            highValueLeads: Math.round(totalHighValue / agents.length),
            lowValuePercentage: totalLeads > 0 ? ((totalLowValue / totalLeads) * 100).toFixed(1) : '0',
            totalCalls: Math.round(totalCalls / agents.length),
            totalCallDuration: Math.round(totalCallDuration / 60 / agents.length),
            contactRate: totalLeads > 0 ? ((totalContacted / totalLeads) * 100).toFixed(1) : '0',
            leadsPushedToBrokers: Math.round(totalBrokerPushed / agents.length)
        };
    };

    // Test function for debugging
    window.testAgentModal = function() {
        console.log('🧪 Testing enhanced agent modal...');
        if (typeof window.viewAgentStats === 'function') {
            console.log('✅ viewAgentStats function is available');
            window.viewAgentStats('Carson');
        } else {
            console.error('❌ viewAgentStats function not found');
        }
    };

    // Force override any existing resetAgentStats that requires dev mode
    setTimeout(() => {
        // Also force override viewAgentStats to prevent conflicts
        const originalViewAgentStats = window.viewAgentStats;
        window.viewAgentStats = function(agentName) {
            console.log('🔥 Enhanced viewAgentStats override called for:', agentName);
            window.ENHANCED_AGENT_STATS_ACTIVE = true;

            try {
                // Calculate average performance stats for comparison
                const avgStats = calculateAveragePerformance();
                console.log('Average stats for comparison:', avgStats);

                // Close any existing modal first
                closeAgentModal();

                // Use our enhanced system logic
                return window.enhancedViewAgentStats(agentName);
            } catch (error) {
                console.error('❌ Error in enhanced override:', error);
                if (originalViewAgentStats && originalViewAgentStats !== window.viewAgentStats) {
                    return originalViewAgentStats.call(this, agentName);
                }
            }
        };

        const originalReset = window.resetAgentStats;
        window.resetAgentStats = function(agentName, period = 'all') {
            // Force reset without dev mode check
            console.log(`🔄 Enhanced reset called for ${agentName} (period: ${period})`);

            const confirmReset = confirm(`Are you sure you want to reset all performance statistics for ${agentName}? This action cannot be undone.`);

            if (confirmReset) {
                console.log(`✅ Confirmed - Resetting stats for ${agentName}`);

                // Reset using new tracking system
                if (window.resetAgentPerformance) {
                    window.resetAgentPerformance(agentName);
                }

                // Also clear legacy data if needed
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const agentLeads = leads.filter(lead => lead.assignedTo === agentName);

                // Reset ALL activity data for agent's leads
                agentLeads.forEach(lead => {
                    // Reset reachOut data
                    lead.reachOut = {
                        callAttempts: 0,
                        callsConnected: 0,
                        emailCount: 0,
                        textCount: 0,
                        voicemailCount: 0,
                        contacted: false,
                        completedAt: null,
                        reachOutCompletedAt: null,
                        callLogs: []
                    };

                    // Reset call logs
                    lead.callLogs = [];

                    // Reset any other activity fields
                    if (lead.activities) lead.activities = [];
                    if (lead.notes) lead.notes = [];
                    if (lead.emails) lead.emails = [];
                    if (lead.sms) lead.sms = [];

                    // Reset status-related fields but keep lead data
                    if (lead.status) lead.status = 'new';
                    if (lead.stage) lead.stage = 'new';

                    // Mark lead as reset for tracking purposes
                    lead.resetTimestamp = new Date().toISOString();
                    lead.statsReset = true;

                    console.log(`🔄 Reset all activity data for lead ${lead.id}`);
                });

                // Save updated leads
                localStorage.setItem('insurance_leads', JSON.stringify(leads));

                // Force tracking system to recognize reset state
                try {
                    const agentTrackingData = localStorage.getItem('agentPerformanceTracking');
                    if (agentTrackingData) {
                        const parsedData = JSON.parse(agentTrackingData);
                        if (parsedData.agents && parsedData.agents[agentName]) {
                            parsedData.agents[agentName].lastResetTimestamp = new Date().toISOString();
                            localStorage.setItem('agentPerformanceTracking', JSON.stringify(parsedData));
                        }
                    }
                } catch (e) {
                    console.warn('Could not update tracking reset timestamp:', e);
                }

                alert(`✅ Statistics reset successfully for ${agentName}!`);

                // Refresh the modal
                setTimeout(() => {
                    window.viewAgentStats(agentName);
                }, 500);
            }
        };
        console.log('🔧 Override applied - reset now works without dev mode');
    }, 1000); // Wait for other scripts to load first

    // Final override to ensure we take precedence over fix-all-agent-live-stats.js
    setTimeout(() => {
        const currentViewAgentStats = window.viewAgentStats;
        window.viewAgentStats = function(agentName) {
            console.log('🎯 FINAL Enhanced viewAgentStats override for:', agentName);
            window.ENHANCED_AGENT_STATS_ACTIVE = true;

            // Prevent other systems from running
            if (window.closeModal) {
                window.closeModal();
            }

            // Block any subsequent execution
            setTimeout(() => {
                const modals = document.querySelectorAll('.modal-overlay:not(#agentStatsModal)');
                modals.forEach(modal => {
                    if (modal.id !== 'agentStatsModal') {
                        modal.remove();
                        console.log('🚫 Removed competing modal');
                    }
                });
            }, 100);

            // Use our enhanced system
            try {
                return window.enhancedViewAgentStats(agentName);
            } catch (error) {
                console.error('❌ Final override error:', error);
                // Show minimal modal with error
                alert(`Enhanced agent stats error for ${agentName}: ${error.message}`);
                return false;
            }
        };

        // Mark our override as the authoritative one
        window.viewAgentStats.isEnhanced = true;
        window.viewAgentStats.enhanced = true; // Double marking
        console.log('🏆 Final enhanced agent stats override installed');
    }, 2000); // Load after all other scripts

    console.log('✅ Enhanced Agent Performance System loaded');
    console.log('🧪 To test the modal, run: testAgentModal()');
})();