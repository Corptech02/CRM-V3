/**
 * Fix Dashboard Stats - Resolve "$0$0$0$0$0" issue
 * This fixes the stats calculation and display problems
 */

console.log('🔧 Fixing dashboard stats calculation...');

(function() {
    'use strict';

    // Enhanced stats calculator
    class FixedDashboardStats {
        constructor() {
            this.stats = {
                activeClients: 0,
                activePolicies: 0,
                allTimePremium: 0,
                monthlyLeadPremium: 0,
                leadCount: 0,
                newLeadsCount: 0,
                clientsChange: 0,
                policiesChange: 0,
                premiumChange: 0,
                leadPremiumChange: 0
            };
        }

        // Safe number parsing function
        parseNumericValue(value) {
            if (!value) return 0;

            // Handle various string formats
            if (typeof value === 'string') {
                // Remove all non-numeric characters except decimal point and minus sign
                const cleanValue = value.replace(/[^\d.-]/g, '');
                const parsed = parseFloat(cleanValue);
                return isNaN(parsed) ? 0 : parsed;
            }

            // Handle numeric values
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }

        // Fetch statistics with better error handling
        async fetchStatistics() {
            try {
                console.log('📊 Calculating dashboard statistics...');

                // Get data from localStorage (primary source)
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const leads = JSON.parse(localStorage.getItem('leads') || '[]');

                console.log(`Data counts: Clients: ${clients.length}, Policies: ${policies.length}, Leads: ${leads.length}`);

                // Count active clients
                this.stats.activeClients = clients.length;

                // Count active policies
                this.stats.activePolicies = policies.length;

                // Calculate total premium from policies
                let totalPolicyPremium = 0;
                policies.forEach(policy => {
                    const premium = this.parseNumericValue(policy.monthlyPremium || policy.premium || policy.value || 0);
                    totalPolicyPremium += premium;
                });
                this.stats.allTimePremium = totalPolicyPremium;

                // Calculate lead statistics
                let totalLeadPremium = 0;
                let newLeadsCount = 0;

                leads.forEach(lead => {
                    // Count total leads
                    this.stats.leadCount++;

                    // Count new leads
                    if (lead.status === 'New' || lead.status === 'new' || lead.stage === 'new') {
                        newLeadsCount++;
                    }

                    // Sum up lead premiums
                    const premiumValue = this.parseNumericValue(
                        lead.premium || lead.monthlyPremium || lead.value || lead.quotedPremium || 0
                    );

                    if (premiumValue > 0) {
                        console.log(`Lead: ${lead.name}, Premium: ${premiumValue}`);
                        totalLeadPremium += premiumValue;
                    }
                });

                this.stats.monthlyLeadPremium = totalLeadPremium;
                this.stats.newLeadsCount = newLeadsCount;

                console.log('📊 Calculated stats:', {
                    clients: this.stats.activeClients,
                    policies: this.stats.activePolicies,
                    policyPremium: this.stats.allTimePremium,
                    leadPremium: this.stats.monthlyLeadPremium,
                    totalLeads: this.stats.leadCount,
                    newLeads: this.stats.newLeadsCount
                });

            } catch (error) {
                console.error('❌ Error calculating statistics:', error);
                // Set defaults on error
                this.stats = {
                    activeClients: 0,
                    activePolicies: 0,
                    allTimePremium: 0,
                    monthlyLeadPremium: 0,
                    leadCount: 0,
                    newLeadsCount: 0,
                    clientsChange: 0,
                    policiesChange: 0,
                    premiumChange: 0,
                    leadPremiumChange: 0
                };
            }
        }

        // Safe number formatting
        formatNumber(num) {
            const safeNum = this.parseNumericValue(num);
            if (safeNum >= 1000000) {
                return (safeNum / 1000000).toFixed(1) + 'M';
            } else if (safeNum >= 1000) {
                return (safeNum / 1000).toFixed(0) + 'K';
            }
            return safeNum.toLocaleString();
        }

        // Safe currency formatting
        formatCurrency(num) {
            const safeNum = this.parseNumericValue(num);
            if (safeNum >= 1000000) {
                return '$' + (safeNum / 1000000).toFixed(1) + 'M';
            } else if (safeNum >= 1000) {
                return '$' + (safeNum / 1000).toFixed(0) + 'K';
            } else if (safeNum === 0) {
                return '$0';
            }
            return '$' + safeNum.toLocaleString();
        }

        // Update dashboard display with safety checks
        async updateDashboard() {
            console.log('🔄 Updating dashboard display...');

            await this.fetchStatistics();

            // Update Active Clients
            const clientsElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
            if (clientsElement) {
                clientsElement.textContent = this.formatNumber(this.stats.activeClients);
                console.log('Updated clients:', clientsElement.textContent);
            }

            // Update Active Policies
            const policiesElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
            if (policiesElement) {
                policiesElement.textContent = this.formatNumber(this.stats.activePolicies);
                console.log('Updated policies:', policiesElement.textContent);
            }

            // Update All Time Premium (from policies)
            const premiumElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
            if (premiumElement) {
                premiumElement.textContent = this.formatCurrency(this.stats.allTimePremium);
                console.log('Updated policy premium:', premiumElement.textContent);
            }

            // Update Lead Premium (4th card)
            const leadPremiumElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
            if (leadPremiumElement) {
                leadPremiumElement.textContent = this.formatCurrency(this.stats.monthlyLeadPremium);
                console.log('Updated lead premium:', leadPremiumElement.textContent);
            }

            // Alternative selectors in case the above don't work
            const allStatValues = document.querySelectorAll('.stat-value');
            if (allStatValues.length >= 4) {
                allStatValues[0].textContent = this.formatNumber(this.stats.activeClients);
                allStatValues[1].textContent = this.formatNumber(this.stats.activePolicies);
                allStatValues[2].textContent = this.formatCurrency(this.stats.allTimePremium);
                allStatValues[3].textContent = this.formatCurrency(this.stats.monthlyLeadPremium);
                console.log('Updated via alternative selector');
            }

            // Update any change indicators
            this.updateChangeIndicators();
        }

        // Update change indicators
        updateChangeIndicators() {
            const changeElements = document.querySelectorAll('.stat-change');
            changeElements.forEach((element, index) => {
                if (element) {
                    const changes = [
                        this.stats.clientsChange,
                        this.stats.policiesChange,
                        this.stats.premiumChange,
                        this.stats.leadPremiumChange
                    ];

                    const change = changes[index] || 0;
                    const icon = change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                    const color = change >= 0 ? 'green' : 'red';

                    element.innerHTML = `<i class="fas ${icon}" style="color: ${color}"></i> ${Math.abs(change)}% from last month`;
                }
            });
        }

        // Initialize with immediate update
        init() {
            console.log('🔧 Fixed DashboardStats initializing...');

            // Immediate update
            this.updateDashboard();

            // Set up periodic refresh
            setInterval(() => {
                console.log('🔄 Dashboard stats refresh...');
                this.updateDashboard();
            }, 30000);

            // Listen for data changes
            window.addEventListener('leadDataChanged', () => {
                console.log('📊 Lead data changed, updating stats...');
                this.updateDashboard();
            });

            window.addEventListener('clientDataChanged', () => {
                console.log('📊 Client data changed, updating stats...');
                this.updateDashboard();
            });
        }

        // Manual refresh function
        refresh() {
            console.log('🔄 Manual dashboard refresh triggered');
            this.updateDashboard();
        }
    }

    // Replace the existing dashboard stats
    window.FixedDashboardStats = FixedDashboardStats;

    // Initialize immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.fixedDashboardStats = new FixedDashboardStats();
            window.fixedDashboardStats.init();
        });
    } else {
        window.fixedDashboardStats = new FixedDashboardStats();
        window.fixedDashboardStats.init();
    }

    // Override the original DashboardStats if it exists
    if (window.DashboardStats) {
        console.log('🔧 Replacing original DashboardStats with fixed version');
        window.DashboardStats = FixedDashboardStats;
    }

    console.log('✅ Dashboard stats fix loaded. Use fixedDashboardStats.refresh() for manual update.');

})();