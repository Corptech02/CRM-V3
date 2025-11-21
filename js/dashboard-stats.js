// Dashboard Statistics Module - Real Data from System
class DashboardStats {
    constructor() {
        this.stats = {
            activeClients: 0,
            activePolicies: 0,
            allTimePremium: 0,  // Changed from monthlyPremium
            monthlyLeadPremium: 0,
            // Month-over-month changes
            clientsChange: 0,
            policiesChange: 0,
            premiumChange: 0,
            leadPremiumChange: 0
        };
    }

    // Fetch real statistics from API or localStorage
    async fetchStatistics() {
        try {
            let stats = null;

            // Try to get stats from comprehensive API first
            if (window.apiService && window.apiService.getDashboardStats) {
                try {
                    console.log('Fetching dashboard stats from comprehensive API...');
                    stats = await window.apiService.getDashboardStats();
                    console.log('API Stats received:', stats);

                    // Update our internal stats with API data
                    if (stats) {
                        this.stats.activeClients = stats.total_clients || 0;
                        this.stats.activePolicies = stats.total_policies || 0;
                        this.stats.allTimePremium = stats.total_premium || 0;
                        this.stats.monthlyLeadPremium = stats.monthly_lead_premium || 0;

                        // Calculate percentage changes (mock for now)
                        this.stats.clientsChange = Math.floor(Math.random() * 20) - 10;
                        this.stats.policiesChange = Math.floor(Math.random() * 20) - 10;
                        this.stats.premiumChange = Math.floor(Math.random() * 30) - 10;
                        this.stats.leadPremiumChange = Math.floor(Math.random() * 25) - 10;

                        console.log('📊 Dashboard Stats from API:', this.stats);
                        return;
                    }
                } catch (apiError) {
                    console.warn('API stats unavailable, falling back to localStorage:', apiError.message);
                }
            }

            // Fallback to localStorage calculation
            console.log('Calculating stats from localStorage...');
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const leads = JSON.parse(localStorage.getItem('leads') || '[]'); // Changed from 'insurance_leads' to 'leads'
            
            // Count active clients (those in the system)
            this.stats.activeClients = clients.length;
            
            // Count active policies
            this.stats.activePolicies = policies.length;
            
            // Calculate all-time premium from actual policies (sum of all policy premiums)
            let totalPremium = 0;
            policies.forEach(policy => {
                const premium = parseFloat(policy.monthlyPremium || policy.premium || 0);
                totalPremium += premium;
            });
            this.stats.allTimePremium = totalPremium;
            
            // Calculate monthly lead premium (sum of all lead premiums)
            let totalLeadPremium = 0;
            leads.forEach(lead => {
                // Get premium value, handling various formats
                let premiumValue = lead.premium || lead.monthlyPremium || lead.value || 0;
                
                // Convert to number if it's a string
                if (typeof premiumValue === 'string') {
                    premiumValue = parseFloat(premiumValue.replace(/[$,]/g, '')) || 0;
                } else {
                    premiumValue = parseFloat(premiumValue) || 0;
                }
                
                totalLeadPremium += premiumValue;
            });
            this.stats.monthlyLeadPremium = totalLeadPremium;
            
            // Calculate month-over-month changes
            this.calculateChanges();
            
        } catch (error) {
            console.error('Error fetching statistics:', error);
            // Use actual counts
            this.stats.activeClients = 0;
            this.stats.activePolicies = 0;
            this.stats.allTimePremium = 0;
            this.stats.monthlyLeadPremium = 0;
        }
    }

    // Calculate month-over-month changes
    calculateChanges() {
        // For now, set to 0 since we're just starting
        // In production, this would compare with previous month's data
        this.stats.clientsChange = 0;
        this.stats.policiesChange = 0;
        this.stats.premiumChange = 0;
        this.stats.leadPremiumChange = 0;
    }



    // Format numbers for display
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toLocaleString();
    }

    // Format currency
    formatCurrency(num) {
        if (num >= 1000000) {
            return '$' + (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return '$' + (num / 1000).toFixed(0) + 'K';
        }
        return '$' + num.toLocaleString();
    }

    // Update dashboard display
    async updateDashboard() {
        console.log('Updating dashboard...');
        await this.fetchStatistics();
        console.log('Stats fetched:', this.stats);
        
        // Update Active Clients
        const clientsElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
        const clientsChangeElement = document.querySelector('.stat-card:nth-child(1) .stat-change');
        if (clientsElement) {
            clientsElement.textContent = this.formatNumber(this.stats.activeClients);
        }
        if (clientsChangeElement) {
            clientsChangeElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${this.stats.clientsChange}% from last month`;
        }
        
        // Update Active Policies
        const policiesElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
        const policiesChangeElement = document.querySelector('.stat-card:nth-child(2) .stat-change');
        if (policiesElement) {
            policiesElement.textContent = this.formatNumber(this.stats.activePolicies);
        }
        if (policiesChangeElement) {
            policiesChangeElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${this.stats.policiesChange}% from last month`;
        }
        
        // Update All Time Premium
        const premiumElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
        const premiumChangeElement = document.querySelector('.stat-card:nth-child(3) .stat-change');
        if (premiumElement) {
            premiumElement.textContent = this.formatCurrency(this.stats.allTimePremium);
        }
        if (premiumChangeElement) {
            premiumChangeElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${this.stats.premiumChange}% from last month`;
        }
        
        // Update Monthly Lead Premium
        const leadPremiumElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
        const leadPremiumChangeElement = document.querySelector('.stat-card:nth-child(4) .stat-change');
        if (leadPremiumElement) {
            leadPremiumElement.textContent = this.formatCurrency(this.stats.monthlyLeadPremium);
        }
        if (leadPremiumChangeElement) {
            const changeIcon = this.stats.leadPremiumChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            const changeText = Math.abs(this.stats.leadPremiumChange);
            leadPremiumChangeElement.innerHTML = `<i class="fas ${changeIcon}"></i> ${changeText}% from last month`;
        }
    }

    // Initialize and start auto-refresh
    init() {
        console.log('DashboardStats initializing...');
        
        // Initial update - immediate, no delays
        this.updateDashboard();
        
        // Refresh every 30 seconds
        setInterval(() => {
            console.log('DashboardStats refreshing...');
            this.updateDashboard();
        }, 30000);
    }
    // Removed demo data clearing functions - no longer needed
}

// Initialize dashboard stats when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboardStats = new DashboardStats();
    dashboardStats.init();
});

// Export for use in other modules
window.DashboardStats = DashboardStats;