// CLEAN INCREMENTAL COUNTER SYSTEM v5.0
// NO CONSOLE INTERCEPTION - MANUAL BUTTONS ONLY
// SEPARATE CONTAINERS FOR EACH TIME FILTER

(function() {
    'use strict';

    const COUNTER_STORAGE_KEY = 'trueIncrementalCounters';

    console.log('🔢 Loading CLEAN Counter System v5.0 (No Console Interception)');

    // Get counter data from localStorage
    function getCounterData() {
        const data = localStorage.getItem(COUNTER_STORAGE_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.warn('Error parsing counter data:', e);
            }
        }

        // Default data structure with separate containers
        return {
            agents: {
                'Carson': {
                    leadCount: 0,
                    callCount: 0,
                    saleCount: 0,
                    leadsToBrokers: 0,
                    totalCallDuration: 0,
                    resetTimestamp: null,
                    // SEPARATE CONTAINERS - One per filter, all track simultaneously
                    todayCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    weekCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    monthCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    ytdCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                    customCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
                }
            },
            version: '5.0_CLEAN'
        };
    }

    // Save counter data to localStorage
    function saveCounterData(data) {
        localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(data));
    }

    // Initialize agent if needed
    function initializeAgent(counterData, agentName) {
        if (!counterData.agents[agentName]) {
            counterData.agents[agentName] = {
                leadCount: 0,
                callCount: 0,
                saleCount: 0,
                leadsToBrokers: 0,
                totalCallDuration: 0,
                resetTimestamp: null,
                todayCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                weekCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                monthCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                ytdCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
                customCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
            };
        }

        // Ensure separate containers exist (migration support)
        const agent = counterData.agents[agentName];
        if (!agent.todayCounters) {
            agent.todayCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            agent.weekCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            agent.monthCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            agent.ytdCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
            agent.customCounters = { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
        }
    }

    // MANUAL INCREMENT FUNCTIONS (No Console Interception)
    function incrementLeadCounter(agentName) {
        const counterData = getCounterData();
        initializeAgent(counterData, agentName);

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

        // Update UI if modal is open
        refreshCounterDisplayIfOpen();
    }

    function incrementCallCounter(agentName) {
        const counterData = getCounterData();
        initializeAgent(counterData, agentName);

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

        // Update UI if modal is open
        refreshCounterDisplayIfOpen();
    }

    function incrementSaleCounter(agentName) {
        const counterData = getCounterData();
        initializeAgent(counterData, agentName);

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

        // Update UI if modal is open
        refreshCounterDisplayIfOpen();
    }

    // RESET FUNCTIONS - Support for both individual period reset and full reset
    function resetAgentCounterForPeriod(agentName, period) {
        const counterData = getCounterData();
        initializeAgent(counterData, agentName);

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
            leadCount: 0,
            callCount: 0,
            saleCount: 0,
            leadsToBrokers: 0,
            totalCallDuration: 0
        };

        saveCounterData(counterData);
        console.log(`🔢 CONTAINER RESET: ${period} (${containerName}) for ${agentName} - ONLY THIS CONTAINER RESET`);
        console.log(`🔢 OLD ${period}: Leads: ${oldValues.leadCount}, Calls: ${oldValues.callCount}, Sales: ${oldValues.saleCount}`);
        console.log(`🔢 NEW ${period}: Leads: 0, Calls: 0, Sales: 0`);
        console.log(`✅ OTHER CONTAINERS UNCHANGED`);

        // Update UI if modal is open
        refreshCounterDisplayIfOpen();
        return true;
    }

    function resetAgentCounter(agentName) {
        const counterData = getCounterData();
        initializeAgent(counterData, agentName);

        // Reset ALL containers (full reset)
        counterData.agents[agentName] = {
            leadCount: 0,
            callCount: 0,
            saleCount: 0,
            leadsToBrokers: 0,
            totalCallDuration: 0,
            resetTimestamp: Date.now(),
            todayCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
            weekCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
            monthCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
            ytdCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 },
            customCounters: { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 }
        };

        saveCounterData(counterData);
        console.log(`🔢 FULL RESET: All containers reset for ${agentName}`);

        // Update UI if modal is open
        refreshCounterDisplayIfOpen();
    }

    // GET COUNTER DATA FOR SPECIFIC PERIOD
    function getAgentCountersForPeriod(agentName, period) {
        const counterData = getCounterData();
        initializeAgent(counterData, agentName);

        const agent = counterData.agents[agentName];

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
            console.log(`❌ GET ERROR: Unknown period '${period}'`);
            return { leadCount: 0, callCount: 0, saleCount: 0, leadsToBrokers: 0, totalCallDuration: 0 };
        }

        const container = agent[containerName];
        return {
            leadCount: container.leadCount || 0,
            callCount: container.callCount || 0,
            saleCount: container.saleCount || 0,
            leadsToBrokers: container.leadsToBrokers || 0,
            totalCallDuration: container.totalCallDuration || 0
        };
    }

    // GET ALL AGENT DATA (for 'All' filter)
    function getAgentCounters(agentName) {
        const counterData = getCounterData();
        initializeAgent(counterData, agentName);

        const agent = counterData.agents[agentName];
        return {
            leadCount: agent.leadCount || 0,
            callCount: agent.callCount || 0,
            saleCount: agent.saleCount || 0,
            leadsToBrokers: agent.leadsToBrokers || 0,
            totalCallDuration: agent.totalCallDuration || 0
        };
    }

    // UI REFRESH HELPER
    function refreshCounterDisplayIfOpen() {
        // Check if the counter modal is currently open and refresh it
        const modal = document.querySelector('.simple-counter-modal');
        if (modal && modal.style.display !== 'none') {
            // Find the agent name from the modal
            const agentNameElement = modal.querySelector('h3');
            if (agentNameElement) {
                const agentName = agentNameElement.textContent.replace(' Performance', '');
                // Re-trigger the modal display with current data
                setTimeout(() => {
                    if (window.showSimpleCounter) {
                        window.showSimpleCounter(agentName);
                    }
                }, 100);
            }
        }
    }

    // ADD CALL DURATION TO ALL CONTAINERS (for Vicidial integration)
    function addCallDurationToAllContainers(agentName, durationMinutes) {
        const counterData = getCounterData();
        initializeAgent(counterData, agentName);

        const duration = parseInt(durationMinutes) || 0;

        // Add to overall counter
        counterData.agents[agentName].totalCallDuration = (counterData.agents[agentName].totalCallDuration || 0) + duration;

        // ADD DURATION TO ALL SEPARATE CONTAINERS SIMULTANEOUSLY
        counterData.agents[agentName].todayCounters.totalCallDuration = (counterData.agents[agentName].todayCounters.totalCallDuration || 0) + duration;
        counterData.agents[agentName].weekCounters.totalCallDuration = (counterData.agents[agentName].weekCounters.totalCallDuration || 0) + duration;
        counterData.agents[agentName].monthCounters.totalCallDuration = (counterData.agents[agentName].monthCounters.totalCallDuration || 0) + duration;
        counterData.agents[agentName].ytdCounters.totalCallDuration = (counterData.agents[agentName].ytdCounters.totalCallDuration || 0) + duration;
        counterData.agents[agentName].customCounters.totalCallDuration = (counterData.agents[agentName].customCounters.totalCallDuration || 0) + duration;

        saveCounterData(counterData);
        console.log(`📞 +${duration} min duration for ${agentName}: Today: ${counterData.agents[agentName].todayCounters.totalCallDuration}, Week: ${counterData.agents[agentName].weekCounters.totalCallDuration}, Month: ${counterData.agents[agentName].monthCounters.totalCallDuration}`);

        // Update UI if modal is open
        refreshCounterDisplayIfOpen();
    }

    // GLOBAL WINDOW FUNCTIONS
    window.incrementLeadCounter = incrementLeadCounter;
    window.incrementCallCounter = incrementCallCounter;
    window.incrementSaleCounter = incrementSaleCounter;
    window.resetAgentCounter = resetAgentCounter;
    window.resetAgentCounterForPeriod = resetAgentCounterForPeriod;
    window.getAgentCounters = getAgentCounters;
    window.getAgentCountersForPeriod = getAgentCountersForPeriod;
    window.addCallDurationToAllContainers = addCallDurationToAllContainers;

    console.log('✅ CLEAN Counter System v5.0 loaded successfully');
    console.log('✅ Manual increment buttons available');
    console.log('✅ Separate containers for each time filter');
    console.log('✅ NO console interception - clean console guaranteed');

})();