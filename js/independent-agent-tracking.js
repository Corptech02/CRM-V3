// Independent Agent Performance Tracking System
// This system maintains its own tracking database completely separate from lead data
// to ensure accurate incremental tracking regardless of lead data synchronization issues

(function() {
    'use strict';

    console.log('🔧 Loading Independent Agent Tracking System...');

    // Independent tracking storage key
    const TRACKING_STORAGE_KEY = 'independentAgentTracking';

    // Get or create independent tracking data
    function getIndependentTrackingData() {
        const data = localStorage.getItem(TRACKING_STORAGE_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.warn('Error parsing independent tracking data:', e);
            }
        }

        // Initialize empty tracking data
        return {
            agents: {
                'Grant': {
                    totalLeads: 0,
                    activities: [],
                    resetTimestamp: null,
                    leadsSinceReset: 0,
                    callsSinceReset: 0,
                    salesSinceReset: 0,
                    contactsSinceReset: 0
                },
                'Hunter': {
                    totalLeads: 0,
                    activities: [],
                    resetTimestamp: null,
                    leadsSinceReset: 0,
                    callsSinceReset: 0,
                    salesSinceReset: 0,
                    contactsSinceReset: 0
                },
                'Carson': {
                    totalLeads: 0,
                    activities: [],
                    resetTimestamp: null,
                    leadsSinceReset: 0,
                    callsSinceReset: 0,
                    salesSinceReset: 0,
                    contactsSinceReset: 0
                }
            },
            lastUpdate: new Date().toISOString(),
            version: '2.0'
        };
    }

    // Save independent tracking data
    function saveIndependentTrackingData(data) {
        data.lastUpdate = new Date().toISOString();
        localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(data));
        console.log('📊 Independent tracking data saved');
    }

    // Reset agent performance (independent of lead data)
    function resetIndependentAgent(agentName) {
        const trackingData = getIndependentTrackingData();
        const resetTimestamp = new Date().toISOString();

        if (!trackingData.agents[agentName]) {
            trackingData.agents[agentName] = {
                totalLeads: 0,
                activities: [],
                resetTimestamp: null,
                leadsSinceReset: 0,
                callsSinceReset: 0,
                salesSinceReset: 0,
                contactsSinceReset: 0
            };
        }

        // Store current totals as baseline for exclusion
        trackingData.agents[agentName].resetTimestamp = resetTimestamp;
        trackingData.agents[agentName].leadsSinceReset = 0;
        trackingData.agents[agentName].callsSinceReset = 0;
        trackingData.agents[agentName].salesSinceReset = 0;
        trackingData.agents[agentName].contactsSinceReset = 0;
        trackingData.agents[agentName].activities = [];

        saveIndependentTrackingData(trackingData);
        console.log(`🔄 Independent reset for ${agentName} at ${resetTimestamp}`);

        return true;
    }

    // Track a new lead assignment (independent tracking)
    function trackNewLeadAssignment(leadId, agentName, leadData = {}) {
        const trackingData = getIndependentTrackingData();
        const timestamp = new Date().toISOString();

        if (!trackingData.agents[agentName]) {
            trackingData.agents[agentName] = {
                totalLeads: 0,
                activities: [],
                resetTimestamp: null,
                leadsSinceReset: 0,
                callsSinceReset: 0,
                salesSinceReset: 0,
                contactsSinceReset: 0
            };
        }

        // Add to activities log
        const activity = {
            type: 'lead_assigned',
            leadId: leadId,
            timestamp: timestamp,
            data: {
                name: leadData.name || 'Unknown',
                premium: parseFloat(leadData.premium || 0),
                source: leadData.source || 'Unknown'
            }
        };

        trackingData.agents[agentName].activities.push(activity);
        trackingData.agents[agentName].totalLeads++;
        trackingData.agents[agentName].leadsSinceReset++;

        saveIndependentTrackingData(trackingData);
        console.log(`📈 Independent tracking: Lead ${leadId} assigned to ${agentName} (leads since reset: ${trackingData.agents[agentName].leadsSinceReset})`);
    }

    // Track a call activity
    function trackNewCallActivity(leadId, agentName, callData = {}) {
        const trackingData = getIndependentTrackingData();
        const timestamp = new Date().toISOString();

        if (!trackingData.agents[agentName]) return;

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

        trackingData.agents[agentName].activities.push(activity);
        trackingData.agents[agentName].callsSinceReset++;

        if (callData.connected) {
            trackingData.agents[agentName].contactsSinceReset++;
        }

        saveIndependentTrackingData(trackingData);
        console.log(`📞 Independent tracking: Call logged for ${agentName} (calls since reset: ${trackingData.agents[agentName].callsSinceReset})`);
    }

    // Track a sale/conversion
    function trackNewSale(leadId, agentName, saleData = {}) {
        const trackingData = getIndependentTrackingData();
        const timestamp = new Date().toISOString();

        if (!trackingData.agents[agentName]) return;

        const activity = {
            type: 'sale_completed',
            leadId: leadId,
            timestamp: timestamp,
            data: {
                amount: saleData.amount || 0,
                commission: saleData.commission || 0
            }
        };

        trackingData.agents[agentName].activities.push(activity);
        trackingData.agents[agentName].salesSinceReset++;

        saveIndependentTrackingData(trackingData);
        console.log(`💰 Independent tracking: Sale recorded for ${agentName} (sales since reset: ${trackingData.agents[agentName].salesSinceReset})`);
    }

    // Get agent performance (independent calculation)
    function getIndependentAgentPerformance(agentName, period = 'since_reset') {
        const trackingData = getIndependentTrackingData();
        const agent = trackingData.agents[agentName];

        if (!agent) {
            return {
                totalLeads: 0,
                totalCalls: 0,
                totalSales: 0,
                totalContacts: 0,
                contactRate: 0,
                conversionRate: 0,
                callTime: 0,
                highValueLeads: 0,
                lowValueLeads: 0
            };
        }

        let filterDate = null;

        // Set filter date based on period
        const now = new Date();
        switch (period) {
            case 'today':
                filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                filterDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'since_reset':
                filterDate = agent.resetTimestamp ? new Date(agent.resetTimestamp) : null;
                break;
            default:
                filterDate = null; // All time
        }

        // Filter activities by period
        let relevantActivities = agent.activities;
        if (filterDate) {
            relevantActivities = agent.activities.filter(activity => {
                return new Date(activity.timestamp) >= filterDate;
            });
        }

        // Calculate metrics from filtered activities
        let totalLeads = 0;
        let totalCalls = 0;
        let totalSales = 0;
        let totalContacts = 0;
        let totalCallTime = 0;
        let highValueLeads = 0;
        let lowValueLeads = 0;

        relevantActivities.forEach(activity => {
            switch (activity.type) {
                case 'lead_assigned':
                    totalLeads++;
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
                        totalContacts++;
                    }
                    break;
                case 'sale_completed':
                    totalSales++;
                    break;
            }
        });

        const contactRate = totalCalls > 0 ? (totalContacts / totalCalls * 100) : 0;
        const conversionRate = totalLeads > 0 ? (totalSales / totalLeads * 100) : 0;

        return {
            totalLeads,
            totalCalls,
            totalSales,
            totalContacts,
            contactRate: Math.round(contactRate * 10) / 10,
            conversionRate: Math.round(conversionRate * 10) / 10,
            callTime: Math.round(totalCallTime / 60), // Convert to minutes
            highValueLeads,
            lowValueLeads,
            period: period,
            resetTimestamp: agent.resetTimestamp
        };
    }

    // Auto-detect new lead assignments by monitoring lead changes
    function monitorLeadChanges() {
        try {
            const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lastKnownLeads = JSON.parse(localStorage.getItem('lastKnownLeads') || '[]');

            // Find new leads by comparing IDs
            const lastKnownIds = new Set(lastKnownLeads.map(lead => lead.id));
            const newLeads = currentLeads.filter(lead => !lastKnownIds.has(lead.id));

            if (newLeads.length > 0) {
                console.log(`🔍 Detected ${newLeads.length} new leads`);
                newLeads.forEach(lead => {
                    if (lead.assignedTo) {
                        console.log(`📝 Auto-tracking new lead assignment: ${lead.id} → ${lead.assignedTo}`);
                        trackNewLeadAssignment(lead.id, lead.assignedTo, lead);
                    }
                });
            }

            // Find newly assigned leads (assignedTo changed)
            const currentAssignments = new Map();
            currentLeads.forEach(lead => {
                if (lead.assignedTo) {
                    currentAssignments.set(lead.id, lead.assignedTo);
                }
            });

            const lastAssignments = new Map();
            lastKnownLeads.forEach(lead => {
                if (lead.assignedTo) {
                    lastAssignments.set(lead.id, lead.assignedTo);
                }
            });

            // Check for assignment changes
            currentAssignments.forEach((currentAgent, leadId) => {
                const lastAgent = lastAssignments.get(leadId);
                if (!lastAgent || lastAgent !== currentAgent) {
                    const lead = currentLeads.find(l => l.id === leadId);
                    if (lead && !lastAgent) { // Only track if it's a new assignment, not a reassignment
                        console.log(`📝 Auto-tracking assignment change: ${leadId} → ${currentAgent}`);
                        trackNewLeadAssignment(leadId, currentAgent, lead);
                    }
                }
            });

            // Update last known state
            localStorage.setItem('lastKnownLeads', JSON.stringify(currentLeads));

        } catch (e) {
            console.warn('Error monitoring lead changes:', e);
        }
    }

    // Expose functions globally
    window.resetIndependentAgent = resetIndependentAgent;
    window.trackNewLeadAssignment = trackNewLeadAssignment;
    window.trackNewCallActivity = trackNewCallActivity;
    window.trackNewSale = trackNewSale;
    window.getIndependentAgentPerformance = getIndependentAgentPerformance;
    window.getIndependentTrackingData = getIndependentTrackingData;

    // Override the reset function to use independent tracking
    setTimeout(() => {
        window.resetAgentStats = function(agentName, period = 'all') {
            console.log(`🔄 Independent reset triggered for ${agentName}`);

            const confirmReset = confirm(`Are you sure you want to reset all performance statistics for ${agentName}? This will set all counts back to 0.`);

            if (confirmReset) {
                resetIndependentAgent(agentName);
                alert(`✅ Statistics reset successfully for ${agentName}! All counts are now at 0.`);

                // Refresh the modal with independent system
                setTimeout(() => {
                    if (window.showIndependentAgentModal) {
                        window.showIndependentAgentModal(agentName);
                    } else if (window.viewAgentStats) {
                        window.viewAgentStats(agentName);
                    }
                }, 500);
            }
        };
    }, 2000);

    // Additional override with higher priority
    setTimeout(() => {
        window.resetAgentStats = function(agentName, period = 'all') {
            console.log(`🔄 [FINAL OVERRIDE] Independent reset triggered for ${agentName}`);

            const confirmReset = confirm(`Are you sure you want to reset all performance statistics for ${agentName}? This will set all counts back to 0.`);

            if (confirmReset) {
                resetIndependentAgent(agentName);
                alert(`✅ Statistics reset successfully for ${agentName}! All counts are now at 0.`);

                // Refresh the modal with independent system
                setTimeout(() => {
                    if (window.showIndependentAgentModal) {
                        window.showIndependentAgentModal(agentName);
                    } else if (window.viewAgentStats) {
                        window.viewAgentStats(agentName);
                    }
                }, 500);
            }
        };
    }, 6000);

    // Start monitoring for lead changes
    setInterval(monitorLeadChanges, 3000); // Check every 3 seconds

    // Initialize last known state
    setTimeout(() => {
        const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        localStorage.setItem('lastKnownLeads', JSON.stringify(currentLeads));
        console.log('✅ Independent Agent Tracking System initialized');
    }, 1000);

})();