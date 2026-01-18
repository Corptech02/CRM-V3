// Incremental Agent Performance Tracking System
// This system tracks agent performance incrementally with timestamps for proper time-based reporting

(function() {
    'use strict';

    console.log('🔧 Loading Incremental Agent Tracking System...');

    // Get or create agent performance storage
    function getAgentPerformanceData() {
        const data = localStorage.getItem('agentPerformanceTracking');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.warn('Error parsing agent performance data:', e);
            }
        }

        // Initialize empty tracking data
        return {
            agents: {
                'Grant': { totalLeads: 0, activities: [] },
                'Hunter': { totalLeads: 0, activities: [] },
                'Carson': { totalLeads: 0, activities: [] }
            },
            lastReset: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Save agent performance data
    function saveAgentPerformanceData(data) {
        localStorage.setItem('agentPerformanceTracking', JSON.stringify(data));
        console.log('📊 Agent performance data saved');
    }

    // Track a new lead assignment
    function trackLeadAssignment(leadId, agentName, leadData) {
        const performanceData = getAgentPerformanceData();
        const timestamp = new Date().toISOString();

        const activity = {
            type: 'lead_assigned',
            leadId: leadId,
            timestamp: timestamp,
            data: {
                name: leadData.name || 'Unknown',
                premium: parseFloat(leadData.premium || 0),
                source: leadData.source || 'Unknown',
                stage: leadData.stage || 'new'
            }
        };

        // Add to agent's activities
        if (!performanceData.agents[agentName]) {
            performanceData.agents[agentName] = { totalLeads: 0, activities: [] };
        }

        performanceData.agents[agentName].activities.push(activity);
        performanceData.agents[agentName].totalLeads++;

        // Also update the lead in localStorage with assignment timestamp
        try {
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const leadIndex = leads.findIndex(l => l.id == leadId);
            if (leadIndex !== -1) {
                leads[leadIndex].assignedDate = timestamp;
                if (!leads[leadIndex].createdAt) {
                    leads[leadIndex].createdAt = timestamp;
                }
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log(`🕒 Updated lead ${leadId} with assignment timestamp`);
            }
        } catch (e) {
            console.warn('Could not update lead timestamp:', e);
        }

        saveAgentPerformanceData(performanceData);
        console.log(`📈 Tracked lead assignment: ${leadId} → ${agentName}`);
    }

    // Track a call activity
    function trackCallActivity(leadId, agentName, callData) {
        const performanceData = getAgentPerformanceData();
        const timestamp = new Date().toISOString();

        const activity = {
            type: 'call_made',
            leadId: leadId,
            timestamp: timestamp,
            data: {
                duration: callData.duration || 0,
                connected: callData.connected || false,
                notes: callData.notes || ''
            }
        };

        if (!performanceData.agents[agentName]) {
            performanceData.agents[agentName] = { totalLeads: 0, activities: [] };
        }

        performanceData.agents[agentName].activities.push(activity);
        saveAgentPerformanceData(performanceData);
        console.log(`📞 Tracked call: ${agentName} → ${leadId} (${callData.duration}s)`);
    }

    // Track stage changes
    function trackStageChange(leadId, agentName, oldStage, newStage) {
        const performanceData = getAgentPerformanceData();
        const timestamp = new Date().toISOString();

        const activity = {
            type: 'stage_change',
            leadId: leadId,
            timestamp: timestamp,
            data: {
                oldStage: oldStage,
                newStage: newStage
            }
        };

        if (!performanceData.agents[agentName]) {
            performanceData.agents[agentName] = { totalLeads: 0, activities: [] };
        }

        performanceData.agents[agentName].activities.push(activity);
        saveAgentPerformanceData(performanceData);
        console.log(`🎯 Tracked stage change: ${leadId} ${oldStage} → ${newStage}`);
    }

    // Calculate performance for a date range
    function calculatePerformanceForDateRange(agentName, startDate, endDate) {
        const performanceData = getAgentPerformanceData();
        const agent = performanceData.agents[agentName];

        if (!agent) {
            return {
                totalLeads: 0,
                totalCalls: 0,
                totalCallTime: 0,
                connectedCalls: 0,
                contactRate: 0,
                highValueLeads: 0,
                lowValueLeads: 0,
                stageSales: 0
            };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const filteredActivities = agent.activities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            return activityDate >= start && activityDate < end;
        });

        let totalLeads = 0;
        let totalCalls = 0;
        let totalCallTime = 0;
        let connectedCalls = 0;
        let highValueLeads = 0;
        let lowValueLeads = 0;
        let stageSales = 0;

        filteredActivities.forEach(activity => {
            switch (activity.type) {
                case 'lead_assigned':
                    totalLeads++;
                    // High value if premium > $5000 or call time will be > 60 min
                    const premium = activity.data.premium || 0;
                    if (premium > 5000) {
                        highValueLeads++;
                    } else if (premium < 1000) {
                        lowValueLeads++;
                    }
                    break;

                case 'call_made':
                    totalCalls++;
                    totalCallTime += activity.data.duration || 0;
                    if (activity.data.connected) {
                        connectedCalls++;
                    }
                    break;

                case 'stage_change':
                    if (activity.data.newStage === 'closed_won' || activity.data.newStage === 'sale') {
                        stageSales++;
                    }
                    break;
            }
        });

        const contactRate = totalCalls > 0 ? (connectedCalls / totalCalls * 100) : 0;

        return {
            totalLeads,
            totalCalls,
            totalCallTime: Math.round(totalCallTime / 60), // Convert to minutes
            connectedCalls,
            contactRate: Math.round(contactRate * 10) / 10, // Round to 1 decimal
            highValueLeads,
            lowValueLeads,
            stageSales,
            period: `${startDate} to ${endDate}`
        };
    }

    // Reset agent performance data
    function resetAgentPerformance(agentName = null, resetTimestamp = null) {
        const performanceData = getAgentPerformanceData();
        const timestamp = resetTimestamp || new Date().toISOString();

        if (agentName) {
            // Reset specific agent with timestamp tracking
            if (!performanceData.agents[agentName]) {
                performanceData.agents[agentName] = { totalLeads: 0, activities: [] };
            }

            performanceData.agents[agentName] = {
                totalLeads: 0,
                activities: [],
                lastResetTimestamp: timestamp
            };
            console.log(`🔄 Reset performance data for ${agentName} with timestamp ${timestamp}`);
        } else {
            // Reset all agents
            Object.keys(performanceData.agents).forEach(agent => {
                performanceData.agents[agent] = {
                    totalLeads: 0,
                    activities: [],
                    lastResetTimestamp: timestamp
                };
            });
            performanceData.lastReset = timestamp;
            console.log(`🔄 Reset performance data for all agents with timestamp ${timestamp}`);
        }

        saveAgentPerformanceData(performanceData);
        return true;
    }

    // Get performance summary for all periods
    function getPerformanceSummary(agentName) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate different time periods
        const periods = {
            today: {
                start: today,
                end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            },
            week: {
                start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            },
            month: {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            },
            year: {
                start: new Date(now.getFullYear(), 0, 1),
                end: new Date(now.getFullYear() + 1, 0, 1)
            }
        };

        const summary = {};
        Object.keys(periods).forEach(period => {
            summary[period] = calculatePerformanceForDateRange(
                agentName,
                periods[period].start,
                periods[period].end
            );
        });

        return summary;
    }

    // Auto-hook into existing functions to track activities (safe mode)
    function setupAutoTracking() {
        // Create event-based tracking instead of function overrides
        window.addEventListener('leadAssigned', function(event) {
            const { leadId, agentName, leadData } = event.detail;
            trackLeadAssignment(leadId, agentName, leadData);
        });

        window.addEventListener('stageChanged', function(event) {
            const { leadId, agentName, oldStage, newStage } = event.detail;
            trackStageChange(leadId, agentName, oldStage, newStage);
        });

        window.addEventListener('callMade', function(event) {
            const { leadId, agentName, callData } = event.detail;
            trackCallActivity(leadId, agentName, callData);
        });

        // Try to hook safely without overriding protected functions
        try {
            const originalUpdateLead = window.updateLead;
            if (originalUpdateLead && !originalUpdateLead.isProtected) {
                window.updateLead = function(leadId, field, value) {
                    if (field === 'assignedTo' && value) {
                        // Get lead data
                        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                        const lead = leads.find(l => l.id == leadId);
                        if (lead) {
                            trackLeadAssignment(leadId, value, lead);
                        }
                    }
                    return originalUpdateLead.apply(this, arguments);
                };
            }
        } catch (e) {
            console.log('⚠️ Could not hook updateLead (protected function), using events only');
        }

        console.log('🔗 Safe auto-tracking hooks installed');
    }

    // Expose functions globally
    window.trackLeadAssignment = trackLeadAssignment;
    window.trackCallActivity = trackCallActivity;
    window.trackStageChange = trackStageChange;
    window.calculatePerformanceForDateRange = calculatePerformanceForDateRange;
    window.getPerformanceSummary = getPerformanceSummary;
    window.resetAgentPerformance = resetAgentPerformance;

    // Auto-timestamp new ViciDial imports (CONSERVATIVE - only for truly new leads)
    function timestampNewImports() {
        try {
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let updatedCount = 0;

            // Get the latest reset timestamp to ensure we only timestamp truly new leads
            const agentTrackingData = localStorage.getItem('agentPerformanceTracking');
            let latestResetTime = null;
            if (agentTrackingData) {
                const parsedData = JSON.parse(agentTrackingData);
                // Find the most recent reset timestamp across all agents
                Object.values(parsedData.agents || {}).forEach(agent => {
                    if (agent.lastResetTimestamp) {
                        const resetTime = new Date(agent.lastResetTimestamp);
                        if (!latestResetTime || resetTime > latestResetTime) {
                            latestResetTime = resetTime;
                        }
                    }
                });
            }

            leads.forEach(lead => {
                // Only timestamp leads that have NO existing timestamps, NO reset markers, and NOT already auto-timestamped
                const hasNoTimestamps = !lead.createdAt && !lead.assignedDate;
                const hasNoResetMarkers = !lead.resetTimestamp && !lead.statsReset;
                const notAlreadyTimestamped = !lead.autoTimestamped;

                if (hasNoTimestamps && hasNoResetMarkers && notAlreadyTimestamped) {
                    // Only timestamp if this looks like a recent import (no reset markers suggests it's new)
                    const now = new Date();
                    lead.assignedDate = now.toISOString();
                    lead.autoTimestamped = true;
                    lead.autoTimestampedAt = now.toISOString();
                    updatedCount++;
                    console.log(`🕒 Auto-timestamped potential new import: ${lead.id} - ${lead.name}`);
                }
            });

            if (updatedCount > 0) {
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log(`✅ Auto-timestamped ${updatedCount} potential new lead imports`);
            }
        } catch (e) {
            console.warn('Could not auto-timestamp imports:', e);
        }
    }

    // Monitor for new lead imports (run periodically)
    setInterval(timestampNewImports, 5000); // Check every 5 seconds

    // Setup auto-tracking
    setTimeout(setupAutoTracking, 1000); // Delay to ensure other scripts load first

    console.log('✅ Incremental Agent Tracking System loaded');
})();