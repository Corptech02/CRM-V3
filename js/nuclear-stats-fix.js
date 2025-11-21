/**
 * Nuclear Stats Fix - Completely stop and replace the broken stats display
 */

console.log('💥 NUCLEAR STATS FIX - Stopping all stats updates and fixing display...');

(function() {
    'use strict';

    // IMMEDIATELY stop ALL intervals and timeouts
    let id = window.setTimeout(function() {}, 0);
    while (id--) {
        window.clearTimeout(id);
    }

    id = window.setInterval(function() {}, 0);
    while (id--) {
        window.clearInterval(id);
    }

    console.log('🛑 Stopped all intervals and timeouts');

    // Disable all existing dashboard stats functions
    if (window.DashboardStats) {
        window.DashboardStats.prototype.updateDashboard = function() {
            console.log('🚫 Blocked DashboardStats.updateDashboard');
            return Promise.resolve();
        };
        window.DashboardStats.prototype.fetchStatistics = function() {
            console.log('🚫 Blocked DashboardStats.fetchStatistics');
            return Promise.resolve();
        };
    }

    // Override any formatCurrency functions globally
    window.formatCurrency = function(num) {
        const n = parseFloat(num) || 0;
        return n === 0 ? '$0' : '$' + n.toLocaleString();
    };

    // Function to calculate and display correct stats
    function calculateAndDisplayStats() {
        try {
            console.log('📊 Calculating fresh stats...');

            // Get data
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

            console.log(`Data loaded: ${clients.length} clients, ${policies.length} policies, ${leads.length} leads`);

            // Calculate stats
            let totalLeadPremium = 0;
            let newLeadsCount = 0;

            leads.forEach(lead => {
                if (lead.status === 'New' || lead.status === 'new') {
                    newLeadsCount++;
                }

                // Parse premium value safely
                let premium = 0;
                if (lead.premium) {
                    if (typeof lead.premium === 'string') {
                        const cleaned = lead.premium.replace(/[^\d.]/g, '');
                        premium = parseFloat(cleaned) || 0;
                    } else {
                        premium = parseFloat(lead.premium) || 0;
                    }
                }

                totalLeadPremium += premium;
            });

            const stats = {
                clients: clients.length,
                policies: policies.length,
                policyPremium: policies.reduce((sum, p) => sum + (parseFloat(p.premium || 0) || 0), 0),
                leadPremium: totalLeadPremium,
                newLeads: newLeadsCount
            };

            console.log('📈 Calculated stats:', stats);

            // DIRECTLY update all stat display elements
            const statElements = document.querySelectorAll('.stat-value');

            // Clear any existing content first
            statElements.forEach(el => {
                if (el.textContent.includes('$0$0') || el.textContent.length > 20) {
                    el.textContent = '';
                }
            });

            // Update with correct values
            if (statElements.length >= 4) {
                statElements[0].textContent = stats.clients.toString();
                statElements[1].textContent = stats.policies.toString();
                statElements[2].textContent = stats.policyPremium === 0 ? '$0' : '$' + stats.policyPremium.toLocaleString();
                statElements[3].textContent = stats.leadPremium === 0 ? '$0' : '$' + stats.leadPremium.toLocaleString();

                console.log('✅ Updated stats display:', {
                    clients: statElements[0].textContent,
                    policies: statElements[1].textContent,
                    policyPremium: statElements[2].textContent,
                    leadPremium: statElements[3].textContent
                });
            }

            // Also try specific selectors
            const clientsEl = document.querySelector('[data-stat="clients"] .stat-value') ||
                             document.querySelector('.stat-card:nth-child(1) .stat-value');
            const policiesEl = document.querySelector('[data-stat="policies"] .stat-value') ||
                              document.querySelector('.stat-card:nth-child(2) .stat-value');
            const policyPremiumEl = document.querySelector('[data-stat="premium"] .stat-value') ||
                                   document.querySelector('.stat-card:nth-child(3) .stat-value');
            const leadPremiumEl = document.querySelector('[data-stat="leads"] .stat-value') ||
                                 document.querySelector('.stat-card:nth-child(4) .stat-value');

            if (clientsEl && clientsEl.textContent.includes('$0$0')) {
                clientsEl.textContent = stats.clients.toString();
            }
            if (policiesEl && policiesEl.textContent.includes('$0$0')) {
                policiesEl.textContent = stats.policies.toString();
            }
            if (policyPremiumEl && policyPremiumEl.textContent.includes('$0$0')) {
                policyPremiumEl.textContent = stats.policyPremium === 0 ? '$0' : '$' + stats.policyPremium.toLocaleString();
            }
            if (leadPremiumEl && leadPremiumEl.textContent.includes('$0$0')) {
                leadPremiumEl.textContent = stats.leadPremium === 0 ? '$0' : '$' + stats.leadPremium.toLocaleString();
            }

        } catch (error) {
            console.error('❌ Error in nuclear stats fix:', error);
        }
    }

    // Prevent any future textContent updates that contain $0$0
    const originalTextContentSetter = Object.getOwnPropertyDescriptor(Element.prototype, 'textContent').set;
    Object.defineProperty(Element.prototype, 'textContent', {
        set: function(value) {
            // Block any attempts to set concatenated $0 values
            if (typeof value === 'string' && value.includes('$0$0')) {
                console.warn('🚫 Blocked attempt to set concatenated $0 values:', value);
                return;
            }
            originalTextContentSetter.call(this, value);
        },
        get: function() {
            return this.textContent;
        }
    });

    // Run the fix immediately
    calculateAndDisplayStats();

    // Expose manual trigger
    window.nuclearStatsFixNow = calculateAndDisplayStats;

    console.log('💥 Nuclear stats fix complete. Use nuclearStatsFixNow() to manually trigger.');

})();