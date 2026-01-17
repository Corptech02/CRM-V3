/**
 * Live Stats Tracker - Real-time event tracking for agent performance
 * Updates stats as events happen, maintains live counters
 */

// Global live stats storage
window.liveStatsTracker = {
    agents: {}, // { agentName: { totalCalls: 5, totalLeads: 10, ... } }

    // Initialize agent stats if not exists
    initAgent(agentName) {
        if (!this.agents[agentName]) {
            this.agents[agentName] = {
                totalCalls: 0,
                connectedCalls: 0,
                totalCallDuration: 0,
                totalLeads: 0,
                highValueLeads: 0,
                lowValueLeads: 0,
                contactRate: 0,
                leadsToBrokers: 0,
                lastUpdated: new Date().toISOString()
            };
        }
        return this.agents[agentName];
    },

    // Add a connected call event
    addConnectedCall(agentName, duration = 0) {
        const agent = this.initAgent(agentName);
        agent.connectedCalls++;
        agent.totalCalls++;
        agent.totalCallDuration += duration;
        agent.lastUpdated = new Date().toISOString();

        this.recalculateContactRate(agentName);
        this.saveToServer(agentName);

        console.log(`📞 Added connected call for ${agentName}: ${agent.connectedCalls} total`);

        // Trigger UI update if modal is open
        this.updateUIIfOpen(agentName);
    },

    // Add a lead event
    addLead(agentName, isHighValue = false) {
        const agent = this.initAgent(agentName);
        agent.totalLeads++;

        if (isHighValue) {
            agent.highValueLeads++;
        } else {
            agent.lowValueLeads++;
        }

        agent.lastUpdated = new Date().toISOString();
        this.recalculateContactRate(agentName);
        this.saveToServer(agentName);

        console.log(`👥 Added lead for ${agentName}: ${agent.totalLeads} total (${agent.highValueLeads} high value)`);

        // Trigger UI update if modal is open
        this.updateUIIfOpen(agentName);
    },

    // Recalculate contact rate
    recalculateContactRate(agentName) {
        const agent = this.agents[agentName];
        if (agent && agent.totalLeads > 0) {
            agent.contactRate = Math.round((agent.connectedCalls / agent.totalLeads) * 100 * 10) / 10;
        }
    },

    // Save current stats to server for persistence
    async saveToServer(agentName) {
        const agent = this.agents[agentName];
        if (!agent) return;

        try {
            const response = await fetch('/api/live-agent-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentName,
                    stats: agent
                })
            });

            if (response.ok) {
                console.log(`💾 Saved live stats for ${agentName} to server`);
            }
        } catch (error) {
            console.error('Error saving live stats:', error);
        }
    },

    // Load live stats from server
    async loadFromServer(agentName) {
        try {
            const response = await fetch(`/api/live-agent-stats/${agentName}`);
            if (response.ok) {
                const result = await response.json();
                if (result.stats) {
                    this.agents[agentName] = result.stats;
                    console.log(`📊 Loaded live stats for ${agentName}:`, result.stats);
                    return result.stats;
                }
            }
        } catch (error) {
            console.error('Error loading live stats:', error);
        }

        return this.initAgent(agentName);
    },

    // Update UI if agent modal is currently open
    updateUIIfOpen(agentName) {
        // Check if the agent performance modal is open for this agent
        const modal = document.querySelector('.agent-performance-content');
        const agentNameInModal = document.querySelector('h2')?.textContent;

        if (modal && agentNameInModal && agentNameInModal.includes(agentName)) {
            // Update the displayed stats with live values
            this.updateModalStats(agentName);
        }
    },

    // Update the modal with current live stats
    updateModalStats(agentName) {
        const agent = this.agents[agentName];
        if (!agent) return;

        // Find and update stat elements
        const statElements = document.querySelectorAll('[data-stat-type]');

        statElements.forEach(element => {
            const statType = element.getAttribute('data-stat-type');
            let newValue;

            switch(statType) {
                case 'totalCalls':
                    newValue = agent.connectedCalls;
                    break;
                case 'totalLeads':
                    newValue = agent.totalLeads;
                    break;
                case 'highValueLeads':
                    newValue = agent.highValueLeads;
                    break;
                case 'contactRate':
                    newValue = agent.contactRate + '%';
                    break;
                case 'callDuration':
                    newValue = agent.totalCallDuration;
                    break;
            }

            if (newValue !== undefined) {
                element.textContent = newValue;

                // Add visual feedback for update
                element.style.background = '#10b981';
                element.style.color = 'white';
                setTimeout(() => {
                    element.style.background = '';
                    element.style.color = '';
                }, 1000);

                console.log(`📊 Updated ${statType} to ${newValue} for ${agentName}`);
            }
        });
    },

    // Get current stats for an agent
    getStats(agentName) {
        return this.agents[agentName] || this.initAgent(agentName);
    },

    // Reset stats for an agent (if needed)
    resetAgent(agentName) {
        delete this.agents[agentName];
        this.initAgent(agentName);
        this.saveToServer(agentName);
        console.log(`🔄 Reset stats for ${agentName}`);
    }
};

// Add event listeners for call events
document.addEventListener('callConnected', (event) => {
    const { agentName, duration } = event.detail;
    window.liveStatsTracker.addConnectedCall(agentName, duration);
});

document.addEventListener('leadAdded', (event) => {
    const { agentName, isHighValue } = event.detail;
    window.liveStatsTracker.addLead(agentName, isHighValue);
});

console.log('🔴 Live Stats Tracker loaded and ready');