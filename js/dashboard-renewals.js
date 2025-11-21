// Dashboard Renewals and Charts Module - Real Data from System
class DashboardRenewals {
    constructor() {
        this.renewals = [];
    }

    // Initialize renewals from localStorage
    init() {
        // Update renewals display
        this.updateRenewalsDisplay();
        
        // Update charts
        this.updateCharts();
        
        // Refresh every 30 seconds
        setInterval(() => {
            this.updateRenewalsDisplay();
            this.updateCharts();
        }, 30000);
    }

    // Update renewals table
    updateRenewalsDisplay() {
        const tbody = document.getElementById('renewals-tbody');
        if (!tbody) return;
        
        // Get policies from localStorage
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        
        // Filter policies expiring within 30 days
        const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
        const upcomingRenewals = policies.filter(policy => {
            if (policy.renewalDate || policy.expiryDate) {
                const renewalTime = new Date(policy.renewalDate || policy.expiryDate).getTime();
                return renewalTime <= thirtyDaysFromNow && renewalTime > Date.now();
            }
            return false;
        });
        
        if (upcomingRenewals.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                        No upcoming renewals in the next 30 days
                    </td>
                </tr>
            `;
        } else {
            // Build HTML for renewals
            const html = upcomingRenewals.map(policy => {
                const date = new Date(policy.renewalDate || policy.expiryDate);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                
                const policyType = (policy.type || 'Insurance').toLowerCase();
                let badgeClass = 'auto';
                if (policyType.includes('home')) badgeClass = 'home';
                else if (policyType.includes('commercial')) badgeClass = 'commercial';
                else if (policyType.includes('life')) badgeClass = 'life';
                
                return `
                    <tr>
                        <td>${policy.clientName || 'Unknown Client'}</td>
                        <td><span class="policy-badge ${badgeClass}">${policy.type || 'Insurance'}</span></td>
                        <td>${formattedDate}</td>
                        <td>$${policy.premium || 0}</td>
                        <td>
                            <button class="btn-small btn-primary" onclick="alert('Renewal feature coming soon')">Renew</button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            tbody.innerHTML = html;
        }
    }

    // Update charts with real data
    updateCharts() {
        // Update Premium Growth Chart
        const premiumCtx = document.getElementById('premiumChart');
        if (premiumCtx) {
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            
            // Calculate monthly premiums (simplified - in production would group by actual months)
            const monthlyData = [0, 0, 0, 0, 0, 0]; // Last 6 months
            policies.forEach(policy => {
                const premium = parseFloat(policy.premium || 0);
                // Add to current month (simplified)
                monthlyData[5] += premium;
            });
            
            // If we have Chart.js loaded
            if (window.Chart) {
                // Destroy existing chart if it exists
                if (window.premiumChartInstance) {
                    window.premiumChartInstance.destroy();
                }
                
                window.premiumChartInstance = new Chart(premiumCtx, {
                    type: 'line',
                    data: {
                        labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        datasets: [{
                            label: 'Monthly Premium',
                            data: monthlyData,
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
        
        // Update Policy Distribution Chart
        const policyCtx = document.getElementById('policyChart');
        if (policyCtx) {
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            
            // Count policies by type
            const policyTypes = {};
            policies.forEach(policy => {
                const type = policy.type || 'Other';
                policyTypes[type] = (policyTypes[type] || 0) + 1;
            });
            
            // If we have Chart.js loaded
            if (window.Chart) {
                // Destroy existing chart if it exists
                if (window.policyChartInstance) {
                    window.policyChartInstance.destroy();
                }
                
                window.policyChartInstance = new Chart(policyCtx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(policyTypes).length > 0 ? Object.keys(policyTypes) : ['No Policies'],
                        datasets: [{
                            data: Object.keys(policyTypes).length > 0 ? Object.values(policyTypes) : [1],
                            backgroundColor: [
                                '#667eea',
                                '#f093fb',
                                '#4fd1c5',
                                '#f687b3',
                                '#fbbf24',
                                '#a78bfa'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardRenewals = new DashboardRenewals();
    window.dashboardRenewals.init();
});

// Export for use in other modules
window.DashboardRenewals = DashboardRenewals;