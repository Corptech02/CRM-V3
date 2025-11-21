// Recent Activities Module - Real Data from System
class RecentActivities {
    constructor() {
        this.activities = [];
        this.maxActivities = 10; // Keep last 10 activities
    }

    // Initialize activities from localStorage
    init() {
        // Load existing activities from localStorage
        const stored = localStorage.getItem('recent_activities');
        if (stored) {
            this.activities = JSON.parse(stored);
        }
        
        // Set up event listeners for system changes
        this.setupEventListeners();
        
        // Update display IMMEDIATELY on page load
        this.updateDisplay();
        
        // Check for changes periodically (every 2 seconds)
        // This will catch changes made in the same tab
        this.startPolling();
        
        // Auto-refresh display every 30 seconds
        setInterval(() => {
            this.updateDisplay();
        }, 30000);
    }

    // Setup event listeners for various system events
    setupEventListeners() {
        // Listen for localStorage changes (when data is added/updated)
        window.addEventListener('storage', (e) => {
            if (e.key === 'insurance_clients') {
                this.checkForNewClients(e.oldValue, e.newValue);
            }
            if (e.key === 'insurance_policies') {
                this.checkForNewPolicies(e.oldValue, e.newValue);
            }
            if (e.key === 'insurance_quotes') {
                this.checkForQuoteConversions(e.oldValue, e.newValue);
            }
            if (e.key === 'insurance_leads') {
                this.checkForNewLeads(e.oldValue, e.newValue);
            }
        });
    }

    // Check for new clients
    checkForNewClients(oldValue, newValue) {
        if (!oldValue || !newValue) return;
        
        const oldClients = JSON.parse(oldValue || '[]');
        const newClients = JSON.parse(newValue || '[]');
        
        if (newClients.length > oldClients.length) {
            const latestClient = newClients[newClients.length - 1];
            this.addActivity({
                type: 'new_client',
                icon: 'user',
                iconClass: 'info',
                title: 'New Client Added',
                description: latestClient.name || 'Unknown Client',
                timestamp: Date.now(),
                details: {
                    email: latestClient.email,
                    phone: latestClient.phone
                }
            });
        }
    }

    // Check for new policies
    checkForNewPolicies(oldValue, newValue) {
        if (!oldValue || !newValue) return;
        
        const oldPolicies = JSON.parse(oldValue || '[]');
        const newPolicies = JSON.parse(newValue || '[]');
        
        if (newPolicies.length > oldPolicies.length) {
            const latestPolicy = newPolicies[newPolicies.length - 1];
            this.addActivity({
                type: 'new_policy',
                icon: 'check',
                iconClass: 'success',
                title: 'New Policy Issued',
                description: `${latestPolicy.clientName || 'Client'} (${latestPolicy.type || 'Insurance'})`,
                timestamp: Date.now(),
                amount: latestPolicy.premium ? `$${latestPolicy.premium}/year` : null
            });
        }
    }

    // Check for quote conversions
    checkForQuoteConversions(oldValue, newValue) {
        if (!oldValue || !newValue) return;
        
        const oldQuotes = JSON.parse(oldValue || '[]');
        const newQuotes = JSON.parse(newValue || '[]');
        
        // Check for status changes to 'converted'
        newQuotes.forEach((quote, index) => {
            if (oldQuotes[index] && oldQuotes[index].status !== 'converted' && quote.status === 'converted') {
                this.addActivity({
                    type: 'quote_converted',
                    icon: 'calculator',
                    iconClass: 'success',
                    title: 'Quote Converted',
                    description: `${quote.clientName || 'Client'} (${quote.type || 'Insurance'})`,
                    timestamp: Date.now(),
                    amount: quote.premium ? `$${quote.premium}/year` : null
                });
            }
        });
    }

    // Check for new leads
    checkForNewLeads(oldValue, newValue) {
        if (!oldValue || !newValue) return;
        
        const oldLeads = JSON.parse(oldValue || '[]');
        const newLeads = JSON.parse(newValue || '[]');
        
        if (newLeads.length > oldLeads.length) {
            const latestLead = newLeads[newLeads.length - 1];
            this.addActivity({
                type: 'new_lead',
                icon: 'bullseye',
                iconClass: 'primary',
                title: 'New Lead Added',
                description: `${latestLead.companyName || latestLead.name || 'Unknown Lead'}`,
                timestamp: Date.now(),
                details: {
                    state: latestLead.state,
                    premium: latestLead.premium,
                    expirationDate: latestLead.expirationDate
                },
                amount: latestLead.premium ? `$${latestLead.premium}/mo` : null
            });
        }
    }

    // Start polling for changes (for same-tab detection)
    startPolling() {
        // Store current counts
        this.lastCounts = {
            clients: JSON.parse(localStorage.getItem('insurance_clients') || '[]').length,
            policies: JSON.parse(localStorage.getItem('insurance_policies') || '[]').length,
            leads: JSON.parse(localStorage.getItem('insurance_leads') || '[]').length,
            quotes: JSON.parse(localStorage.getItem('insurance_quotes') || '[]').length
        };

        // Poll every 2 seconds
        setInterval(() => {
            const currentCounts = {
                clients: JSON.parse(localStorage.getItem('insurance_clients') || '[]').length,
                policies: JSON.parse(localStorage.getItem('insurance_policies') || '[]').length,
                leads: JSON.parse(localStorage.getItem('insurance_leads') || '[]').length,
                quotes: JSON.parse(localStorage.getItem('insurance_quotes') || '[]').length
            };

            // Check for new leads
            if (currentCounts.leads > this.lastCounts.leads) {
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const latestLead = leads[leads.length - 1];
                this.addActivity({
                    type: 'new_lead',
                    icon: 'bullseye',
                    iconClass: 'primary',
                    title: 'New Lead Added',
                    description: `${latestLead.companyName || latestLead.name || 'Unknown Lead'}`,
                    timestamp: Date.now(),
                    amount: latestLead.premium ? `$${latestLead.premium}/mo` : null
                });
            }

            // Check for new clients
            if (currentCounts.clients > this.lastCounts.clients) {
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const latestClient = clients[clients.length - 1];
                this.addActivity({
                    type: 'new_client',
                    icon: 'user',
                    iconClass: 'info',
                    title: 'New Client Added',
                    description: latestClient.name || 'Unknown Client',
                    timestamp: Date.now()
                });
            }

            // Check for new policies
            if (currentCounts.policies > this.lastCounts.policies) {
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const latestPolicy = policies[policies.length - 1];
                this.addActivity({
                    type: 'new_policy',
                    icon: 'check',
                    iconClass: 'success',
                    title: 'New Policy Issued',
                    description: `${latestPolicy.clientName || 'Client'} (${latestPolicy.type || 'Insurance'})`,
                    timestamp: Date.now(),
                    amount: latestPolicy.premium ? `$${latestPolicy.premium}/year` : null
                });
            }

            // Update last counts
            this.lastCounts = currentCounts;
        }, 2000);
    }

    // Add renewal reminders
    checkForRenewals() {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
        
        policies.forEach(policy => {
            if (policy.renewalDate) {
                const renewalTime = new Date(policy.renewalDate).getTime();
                if (renewalTime <= thirtyDaysFromNow && renewalTime > Date.now()) {
                    // Check if we already have this renewal reminder
                    const exists = this.activities.find(a => 
                        a.type === 'renewal_due' && 
                        a.description.includes(policy.clientName)
                    );
                    
                    if (!exists) {
                        this.addActivity({
                            type: 'renewal_due',
                            icon: 'clock',
                            iconClass: 'warning',
                            title: 'Policy Renewal Due',
                            description: `${policy.clientName || 'Client'} (${policy.type || 'Insurance'})`,
                            timestamp: Date.now(),
                            amount: policy.premium ? `$${policy.premium}/year` : null,
                            dueDate: policy.renewalDate
                        });
                    }
                }
            }
        });
    }

    // Add a new activity
    addActivity(activity) {
        this.activities.unshift(activity);
        
        // Keep only the last N activities
        if (this.activities.length > this.maxActivities) {
            this.activities = this.activities.slice(0, this.maxActivities);
        }
        
        // Save to localStorage
        localStorage.setItem('recent_activities', JSON.stringify(this.activities));
        
        // Update display
        this.updateDisplay();
    }

    // Format timestamp to relative time
    getRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    // Update the display
    updateDisplay() {
        const container = document.querySelector('.activities-list');
        if (!container) return;
        
        // Check for renewals periodically
        this.checkForRenewals();
        
        if (this.activities.length === 0) {
            container.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon info">
                        <i class="fas fa-info"></i>
                    </div>
                    <div class="activity-details">
                        <p>No recent activities</p>
                        <span class="activity-time">Activities will appear here as you add clients, policies, and quotes</span>
                    </div>
                </div>
            `;
            return;
        }
        
        // Build HTML for activities
        const html = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.iconClass}">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-details">
                    <p><strong>${activity.title}</strong> - ${activity.description}</p>
                    <span class="activity-time">${this.getRelativeTime(activity.timestamp)}</span>
                </div>
                ${activity.amount ? `<span class="activity-amount">${activity.amount}</span>` : ''}
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    // Manually add test activities (for testing)
    addTestActivity() {
        const types = ['new_client', 'new_policy', 'quote_converted', 'renewal_due', 'new_lead'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const testActivities = {
            new_client: {
                type: 'new_client',
                icon: 'user',
                iconClass: 'info',
                title: 'New Client Added',
                description: 'Test Client ' + Math.floor(Math.random() * 1000),
                timestamp: Date.now()
            },
            new_policy: {
                type: 'new_policy',
                icon: 'check',
                iconClass: 'success',
                title: 'New Policy Issued',
                description: 'Test Client (Auto Insurance)',
                timestamp: Date.now(),
                amount: '$' + (Math.floor(Math.random() * 5000) + 1000) + '/year'
            },
            quote_converted: {
                type: 'quote_converted',
                icon: 'calculator',
                iconClass: 'success',
                title: 'Quote Converted',
                description: 'Test Client (Commercial)',
                timestamp: Date.now(),
                amount: '$' + (Math.floor(Math.random() * 10000) + 2000) + '/year'
            },
            renewal_due: {
                type: 'renewal_due',
                icon: 'clock',
                iconClass: 'warning',
                title: 'Policy Renewal Due',
                description: 'Test Client (Homeowners)',
                timestamp: Date.now(),
                amount: '$' + (Math.floor(Math.random() * 3000) + 1500) + '/year'
            },
            new_lead: {
                type: 'new_lead',
                icon: 'bullseye',
                iconClass: 'primary',
                title: 'New Lead Added',
                description: 'Test Company ' + Math.floor(Math.random() * 1000),
                timestamp: Date.now(),
                amount: '$' + (Math.floor(Math.random() * 8000) + 500) + '/mo'
            }
        };
        
        this.addActivity(testActivities[randomType]);
    }

    // Clear all activities
    clearActivities() {
        this.activities = [];
        localStorage.setItem('recent_activities', JSON.stringify(this.activities));
        this.updateDisplay();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.recentActivities = new RecentActivities();
    window.recentActivities.init();
});

// Export for use in other modules
window.RecentActivities = RecentActivities;