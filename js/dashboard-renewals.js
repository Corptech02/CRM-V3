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
        // Removed chart update functions
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardRenewals = new DashboardRenewals();
    window.dashboardRenewals.init();
});

// Export for use in other modules
window.DashboardRenewals = DashboardRenewals;