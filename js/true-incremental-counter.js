// True Incremental Counter System
// Tracks actual lead additions as they happen, not total counts

(function() {
    'use strict';

    console.log('🔢 Loading True Incremental Counter System...');

    const COUNTER_STORAGE_KEY = 'trueIncrementalCounters';

    // Get or create counter data
    function getCounterData() {
        const data = localStorage.getItem(COUNTER_STORAGE_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.warn('Error parsing counter data:', e);
            }
        }

        return {
            agents: {
                'Grant': {
                    // Overall counter for backward compatibility
                    leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0,
                    resetTimestamp: null,

                    // SEPARATE CONTAINERS - One per filter, all track simultaneously
                    todayCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    weekCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    monthCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    ytdCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    customCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
                },
                'Hunter': {
                    leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0,
                    resetTimestamp: null,

                    todayCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    weekCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    monthCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    ytdCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    customCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
                },
                'Carson': {
                    leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0,
                    resetTimestamp: null,

                    todayCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    weekCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    monthCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    ytdCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    customCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
                }
            },
            version: '4.0'
        };
    }

    // Save counter data
    function saveCounterData(data) {
        localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(data));
        console.log('🔢 Counter data saved');
    }

    // Reset agent counter (full reset - all periods)
    function resetAgentCounter(agentName) {
        const counterData = getCounterData();
        const resetTimestamp = new Date().toISOString();

        if (!counterData.agents[agentName]) {
            counterData.agents[agentName] = {
                leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0,
                resetTimestamp: null,
                periodResets: { day: null, week: null, month: null, ytd: null, custom: null }
            };
        }

        // Reset all counters to 0
        counterData.agents[agentName].leadCount = 0;
        counterData.agents[agentName].callCount = 0;
        counterData.agents[agentName].saleCount = 0;
        counterData.agents[agentName].leadsToBrokers = 0;
        counterData.agents[agentName].totalCallDuration = 0;
        counterData.agents[agentName].resetTimestamp = resetTimestamp;

        saveCounterData(counterData);
        console.log(`🔢 Reset counter for ${agentName} - all counts now at 0`);
        return true;
    }

    // Reset agent counter for specific time period - RESET ONLY THAT CONTAINER
    function resetAgentCounterForPeriod(agentName, period) {
        const counterData = getCounterData();

        if (!counterData.agents[agentName]) {
            counterData.agents[agentName] = {
                leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0,
                resetTimestamp: null,
                todayCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                weekCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                monthCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                ytdCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                customCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
            };
        }

        // Initialize separate containers if not present (migration)
        if (!counterData.agents[agentName].todayCounters) {
            counterData.agents[agentName].todayCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].weekCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].monthCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].ytdCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].customCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
        }

        // Map period to container name
        const periodToContainer = {
            'day': 'todayCounters',
            'week': 'weekCounters',
            'month': 'monthCounters',
            'ytd': 'ytdCounters',
            'custom': 'customCounters'
        };

        const containerName = periodToContainer[period];
        if (!containerName) {
            console.log(`❌ RESET ERROR: Unknown period '${period}'`);
            return false;
        }

        // RESET ONLY THE SPECIFIC CONTAINER
        const oldValues = { ...counterData.agents[agentName][containerName] };
        counterData.agents[agentName][containerName] = {
            leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0
        };

        saveCounterData(counterData);
        console.log(`🔢 CONTAINER RESET: ${period} (${containerName}) for ${agentName} - ONLY THIS CONTAINER RESET`);
        console.log(`🔢 OLD ${period}: Leads: ${oldValues.leadCount}, Calls: ${oldValues.callCount}, Sales: ${oldValues.saleCount}`);
        console.log(`🔢 NEW ${period}: Leads: 0, Calls: 0, Sales: 0`);
        console.log(`✅ OTHER CONTAINERS UNCHANGED`);
        return true;
    }

    // Add 1 to lead counter (when a lead is actually added)
    function incrementLeadCounter(agentName, leadId = null) {
        const counterData = getCounterData();

        if (!counterData.agents[agentName]) {
            counterData.agents[agentName] = {
                leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0,
                resetTimestamp: null,
                periodCounters: {
                    day: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    week: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    month: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    ytd: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    custom: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
                }
            };
        }

        // Initialize separate containers if not present (migration)
        if (!counterData.agents[agentName].todayCounters) {
            counterData.agents[agentName].todayCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].weekCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].monthCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].ytdCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].customCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
        }

        // Increment overall counter
        counterData.agents[agentName].leadCount += 1;

        // INCREMENT ALL SEPARATE CONTAINERS SIMULTANEOUSLY
        counterData.agents[agentName].todayCounters.leadCount += 1;
        counterData.agents[agentName].weekCounters.leadCount += 1;
        counterData.agents[agentName].monthCounters.leadCount += 1;
        counterData.agents[agentName].ytdCounters.leadCount += 1;
        counterData.agents[agentName].customCounters.leadCount += 1;

        saveCounterData(counterData);
        console.log(`🔢 +1 Lead for ${agentName}: Today: ${counterData.agents[agentName].todayCounters.leadCount}, Week: ${counterData.agents[agentName].weekCounters.leadCount}, Month: ${counterData.agents[agentName].monthCounters.leadCount}`);

        return counterData.agents[agentName].leadCount;
    }

    // Add 1 to call counter
    function incrementCallCounter(agentName) {
        const counterData = getCounterData();

        if (!counterData.agents[agentName]) {
            counterData.agents[agentName] = {
                leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0,
                resetTimestamp: null,
                periodCounters: {
                    day: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    week: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    month: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    ytd: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    custom: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
                }
            };
        }

        // Initialize separate containers if not present (migration)
        if (!counterData.agents[agentName].todayCounters) {
            counterData.agents[agentName].todayCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].weekCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].monthCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].ytdCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].customCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
        }

        // Increment overall counter
        counterData.agents[agentName].callCount += 1;

        // INCREMENT ALL SEPARATE CONTAINERS SIMULTANEOUSLY
        counterData.agents[agentName].todayCounters.callCount += 1;
        counterData.agents[agentName].weekCounters.callCount += 1;
        counterData.agents[agentName].monthCounters.callCount += 1;
        counterData.agents[agentName].ytdCounters.callCount += 1;
        counterData.agents[agentName].customCounters.callCount += 1;

        saveCounterData(counterData);
        console.log(`🔢 +1 Call for ${agentName}: Today: ${counterData.agents[agentName].todayCounters.callCount}, Week: ${counterData.agents[agentName].weekCounters.callCount}, Month: ${counterData.agents[agentName].monthCounters.callCount}`);

        return counterData.agents[agentName].callCount;
    }

    // Add 1 to sale counter
    function incrementSaleCounter(agentName) {
        const counterData = getCounterData();

        if (!counterData.agents[agentName]) {
            counterData.agents[agentName] = {
                leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0,
                resetTimestamp: null,
                periodCounters: {
                    day: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    week: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    month: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    ytd: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    custom: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
                }
            };
        }

        // Initialize separate containers if not present (migration)
        if (!counterData.agents[agentName].todayCounters) {
            counterData.agents[agentName].todayCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].weekCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].monthCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].ytdCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            counterData.agents[agentName].customCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
        }

        // Increment overall counter
        counterData.agents[agentName].saleCount += 1;

        // INCREMENT ALL SEPARATE CONTAINERS SIMULTANEOUSLY
        counterData.agents[agentName].todayCounters.saleCount += 1;
        counterData.agents[agentName].weekCounters.saleCount += 1;
        counterData.agents[agentName].monthCounters.saleCount += 1;
        counterData.agents[agentName].ytdCounters.saleCount += 1;
        counterData.agents[agentName].customCounters.saleCount += 1;

        saveCounterData(counterData);
        console.log(`🔢 +1 Sale for ${agentName}: Today: ${counterData.agents[agentName].todayCounters.saleCount}, Week: ${counterData.agents[agentName].weekCounters.saleCount}, Month: ${counterData.agents[agentName].monthCounters.saleCount}`);

        return counterData.agents[agentName].saleCount;
    }

    // Add 1 to leads to brokers counter (when stage becomes app_sent)
    function incrementBrokerCounter(agentName, leadId = null) {
        const counterData = getCounterData();

        if (!counterData.agents[agentName]) {
            counterData.agents[agentName] = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, resetTimestamp: null };
        }

        // Ensure leadsToBrokers is a number
        if (!counterData.agents[agentName].leadsToBrokers || isNaN(counterData.agents[agentName].leadsToBrokers)) {
            counterData.agents[agentName].leadsToBrokers = 0;
        }

        counterData.agents[agentName].leadsToBrokers += 1;
        saveCounterData(counterData);
        console.log(`🏢 +1 Lead to Broker for ${agentName}: Now at ${counterData.agents[agentName].leadsToBrokers} leads (Lead ID: ${leadId})`);

        return counterData.agents[agentName].leadsToBrokers;
    }

    // Get current counter values
    function getAgentCounters(agentName) {
        const counterData = getCounterData();
        const agent = counterData.agents[agentName];

        if (!agent) {
            return {
                leadCount: 0,
                callCount: 0,
                saleCount: 0,
                leadsToBrokers: 0,
                resetTimestamp: null
            };
        }

        return {
            leadCount: agent.leadCount,
            callCount: agent.callCount,
            saleCount: agent.saleCount,
            leadsToBrokers: agent.leadsToBrokers || 0,
            totalCallDuration: agent.totalCallDuration || 0,
            resetTimestamp: agent.resetTimestamp,
            contactRate: agent.callCount > 0 ? ((agent.callCount * 0.8) / agent.callCount * 100).toFixed(1) : 0, // Mock contact rate
            conversionRate: agent.leadCount > 0 ? (agent.saleCount / agent.leadCount * 100).toFixed(1) : 0
        };
    }

    // Get counter values for specific time period - RETURNS ACTUAL PERIOD COUNTERS
    function getAgentCountersForPeriod(agentName, period) {
        const counterData = getCounterData();
        const agent = counterData.agents[agentName];

        if (!agent) {
            return {
                leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0,
                totalCallDuration: 0, resetTimestamp: null
            };
        }

        // Initialize separate containers if not present (migration)
        if (!agent.todayCounters) {
            agent.todayCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            agent.weekCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            agent.monthCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            agent.ytdCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            agent.customCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            saveCounterData(counterData);
        }

        // Map period to container name
        const periodToContainer = {
            'day': 'todayCounters',
            'week': 'weekCounters',
            'month': 'monthCounters',
            'ytd': 'ytdCounters',
            'custom': 'customCounters'
        };

        const containerName = periodToContainer[period];
        if (!containerName || !agent[containerName]) {
            console.log(`📊 CONTAINER NOT FOUND: ${period} (${containerName}) doesn't exist for ${agentName}`);
            return {
                leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0,
                totalCallDuration: 0, resetTimestamp: null
            };
        }

        // Get the specific container values
        const container = agent[containerName];
        console.log(`📊 SEPARATE CONTAINER: ${agentName} ${period} (${containerName}) - Leads: ${container.leadCount}, Calls: ${container.callCount}, Sales: ${container.saleCount}`);

        return {
            leadCount: container.leadCount || 0,
            callCount: container.callCount || 0,
            saleCount: container.saleCount || 0,
            leadsToBrokers: container.leadsToBrokers || 0,
            totalCallDuration: container.totalCallDuration || 0,
            resetTimestamp: null, // Separate containers don't have individual timestamps
            contactRate: container.callCount > 0 ? ((container.callCount * 0.8) / container.callCount * 100).toFixed(1) : 0,
            conversionRate: container.leadCount > 0 ? (container.saleCount / container.leadCount * 100).toFixed(1) : 0
        };
    }

    // Monitor for new lead assignments using a different approach
    function monitorForNewLeads() {
        try {
            const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lastKnownLeadCount = parseInt(localStorage.getItem('lastKnownLeadCount') || '0');

            // Count current total leads
            const currentTotal = currentLeads.length;

            if (currentTotal > lastKnownLeadCount) {
                const newLeadsAdded = currentTotal - lastKnownLeadCount;
                console.log(`🔍 Detected ${newLeadsAdded} new leads added to system`);

                // Find the newest leads (those added most recently)
                const newestLeads = currentLeads.slice(-newLeadsAdded);

                newestLeads.forEach(lead => {
                    if (lead.assignedTo) {
                        console.log(`🔢 Auto-incrementing counter for ${lead.assignedTo} due to new lead ${lead.id}`);
                        incrementLeadCounter(lead.assignedTo, lead.id);
                    }
                });
            }

            // Update the last known count
            localStorage.setItem('lastKnownLeadCount', currentTotal.toString());

        } catch (e) {
            console.warn('Error monitoring for new leads:', e);
        }
    }

    // Manual function to add leads (for when ViciDial imports happen)
    function manuallyAddLead(agentName, leadCount = 1) {
        for (let i = 0; i < leadCount; i++) {
            incrementLeadCounter(agentName);
        }
        return getAgentCounters(agentName).leadCount;
    }

    // Test function to manually increment broker counter
    window.testBrokerCounter = function(agentName = 'Carson', leadId = 'test') {
        originalConsoleLog(`🧪 MANUAL TEST: Adding broker for ${agentName}`);
        return incrementBrokerCounter(agentName, leadId);
    };

    // Manual function to test email tracking
    window.testEmailTracking = function(leadId = '132511') {
        originalConsoleLog(`🧪 TESTING: Simulating email tracking for lead ${leadId}`);
        window.lastEmailLeadId = leadId;
        originalConsoleLog(`📤 Sending email for lead: ${leadId}`);
        originalConsoleLog(`✅ Email sent successfully: <test@test.com>`);
        return 'Email tracking test completed - check broker counter';
    };

    // Manual function to fix lead counts based on actual assignments
    window.fixAgentLeadCount = function(agentName) {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const agentLeads = leads.filter(lead => lead.assignedTo === agentName);

        const counterData = getCounterData();
        if (!counterData.agents[agentName]) {
            counterData.agents[agentName] = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, resetTimestamp: null };
        }

        counterData.agents[agentName].leadCount = agentLeads.length;
        saveCounterData(counterData);
        originalConsoleLog(`🔧 MANUAL FIX: Set ${agentName} lead count to ${agentLeads.length} based on actual assignments`);

        return agentLeads.length;
    };

    // Expose functions globally
    window.resetAgentCounter = resetAgentCounter;
    window.resetAgentCounterForPeriod = resetAgentCounterForPeriod;
    window.incrementLeadCounter = incrementLeadCounter;
    window.incrementCallCounter = incrementCallCounter;
    window.incrementSaleCounter = incrementSaleCounter;
    window.incrementBrokerCounter = incrementBrokerCounter;
    window.testBrokerCounter = testBrokerCounter;
    window.testEmailTracking = testEmailTracking;
    window.getAgentCounters = getAgentCounters;
    window.getAgentCountersForPeriod = getAgentCountersForPeriod;
    window.manuallyAddLead = manuallyAddLead;
    window.fixAgentLeadCount = fixAgentLeadCount;

    // Override reset function to use true counter
    setTimeout(() => {
        window.resetAgentStats = function(agentName, period = 'all') {
            console.log(`🔢 True counter reset triggered for ${agentName}`);

            const confirmReset = confirm(`Reset the counter for ${agentName} back to 0? This will not affect the actual leads, only the counter.`);

            if (confirmReset) {
                resetAgentCounter(agentName);
                alert(`✅ Counter reset for ${agentName}! Counter is now at 0.`);

                // Refresh modal if it exists
                setTimeout(() => {
                    if (window.showTrueCounterModal) {
                        window.showTrueCounterModal(agentName);
                    }
                }, 500);
            }
        };
    }, 7000); // Load after everything else

    // Start monitoring every 2 seconds for new leads
    setInterval(monitorForNewLeads, 2000);

    // CONSOLE MESSAGE INTERCEPTOR - Listen for call events like lead events
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        // Call original first
        originalConsoleLog.apply(console, args);

        // Check for call events
        args.forEach(arg => {
            if (typeof arg === 'string') {
                // Skip our own debug messages to avoid infinite loop (but allow initial tracking messages)
                if (arg.includes('🔍 BROKER-DEBUG: Found lead data:') || arg.includes('🔍 BROKER-DEBUG: Lead search details')) {
                    return;
                }

                // Pattern: "📞 Added connected call for Carson: 3 total"
                const callMatch = arg.match(/📞 Added connected call for (\w+): \d+ total/);
                if (callMatch) {
                    const agentName = callMatch[1];
                    window.lastCallAgent = agentName; // Remember for duration tracking
                    console.log(`🔢 INTERCEPTED: Call added for ${agentName}, incrementing true counter`);
                    incrementCallCounter(agentName);
                }

                // Pattern: "📞 Handling call duration for lead 132511: 21 minutes"
                const durationMatch = arg.match(/📞 Handling call duration for lead \d+: (\d+) minutes?/);
                if (durationMatch && window.lastCallAgent) {
                    const duration = parseInt(durationMatch[1]);
                    const agentName = window.lastCallAgent;

                    // Add to call duration tracking
                    const counterData = getCounterData();
                    if (!counterData.agents[agentName]) {
                        counterData.agents[agentName] = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, resetTimestamp: null };
                    }

                    if (!counterData.agents[agentName].totalCallDuration) {
                        counterData.agents[agentName].totalCallDuration = 0;
                    }

                    counterData.agents[agentName].totalCallDuration += duration;
                    saveCounterData(counterData);

                    console.log(`🔢 INTERCEPTED: Added ${duration} min duration for ${agentName}, total: ${counterData.agents[agentName].totalCallDuration} min`);
                }

                // Pattern: "✅ Email sent successfully: <id>" - increment broker counter when email is sent
                const emailMatch = arg.match(/✅ Email sent successfully:/);
                if (emailMatch) {
                    originalConsoleLog(`🔍 BROKER-DEBUG: Email sent detected, lastEmailLeadId = ${window.lastEmailLeadId}`);

                    // Look for recent lead context from email sending
                    const recentLeadId = window.lastEmailLeadId;
                    if (recentLeadId) {
                        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                        const lead = leads.find(l => String(l.id) === String(recentLeadId));

                        originalConsoleLog(`🔍 BROKER-DEBUG: Found lead data:`, lead);

                        if (lead && lead.assignedTo) {
                            originalConsoleLog(`🔢 INTERCEPTED: Email sent for lead ${recentLeadId} (${lead.name}), incrementing broker counter for ${lead.assignedTo}`);
                            incrementBrokerCounter(lead.assignedTo, recentLeadId);

                            // Clear the lead ID after processing
                            window.lastEmailLeadId = null;
                        } else {
                            originalConsoleLog(`⚠️ INTERCEPTED: Email sent but no assigned agent found for lead ${recentLeadId}`);
                            originalConsoleLog(`🔍 BROKER-DEBUG: Lead search details - ID: ${recentLeadId}, Total leads: ${leads.length}`);
                        }
                    } else {
                        originalConsoleLog(`⚠️ BROKER-DEBUG: No lastEmailLeadId found, cannot increment broker counter`);
                    }
                }

                // Track email sending lead ID for broker counting
                const emailSendMatch = arg.match(/📤 Sending email for lead: (\d+)/);
                if (emailSendMatch) {
                    const [, leadId] = emailSendMatch;
                    window.lastEmailLeadId = leadId;
                    originalConsoleLog(`🔍 BROKER-DEBUG: Tracking email send for lead ${leadId}`);
                }

                // COMPREHENSIVE BROKER TRACKING - Multiple fallback patterns

                // Pattern 1: Direct email success with stage update pattern
                if (arg.includes('✅ Email sent via Titan API with attachments')) {
                    originalConsoleLog(`🔍 BROKER-DEBUG: Email success detected, checking recent context...`);

                    // Look for the most recently updated lead to app_sent
                    setTimeout(() => {
                        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                        const appSentLeads = leads.filter(lead => lead.stage === 'app_sent');

                        if (appSentLeads.length > 0) {
                            // Get the most recent app_sent lead
                            const recentLead = appSentLeads[appSentLeads.length - 1];
                            if (recentLead && recentLead.assignedTo) {
                                originalConsoleLog(`🔢 SUCCESS-PATTERN: Email success detected for lead ${recentLead.id} (${recentLead.name}), incrementing broker counter for ${recentLead.assignedTo}`);
                                incrementBrokerCounter(recentLead.assignedTo, recentLead.id);
                            }
                        }
                    }, 100);
                }

                // Pattern 2: Stage update to app_sent (fallback)
                if (arg.includes('🎯 Auto-updating stage to "app sent" after successful email')) {
                    const leadIdMatch = arg.match(/lead: (\d+)/);
                    if (leadIdMatch) {
                        const leadId = leadIdMatch[1];
                        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                        const lead = leads.find(l => String(l.id) === String(leadId));

                        if (lead && lead.assignedTo) {
                            originalConsoleLog(`🔢 AUTO-STAGE-PATTERN: Auto stage update detected for lead ${leadId} (${lead.name}), incrementing broker counter for ${lead.assignedTo}`);
                            incrementBrokerCounter(lead.assignedTo, leadId);
                        }
                    }
                }
            }
        });
    };

    // Track last call agent for duration association
    window.lastCallAgent = null;

    // Initialize known lead count
    setTimeout(() => {
        const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        localStorage.setItem('lastKnownLeadCount', currentLeads.length.toString());
        console.log(`🔢 Initialized with ${currentLeads.length} existing leads`);
    }, 1000);

    console.log('✅ True Incremental Counter System loaded with call tracking');
})();