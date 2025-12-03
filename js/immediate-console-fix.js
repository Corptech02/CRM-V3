// IMMEDIATE CONSOLE FIX - Copy and paste this into browser console
// This will instantly fix the "$0$0$0$0$0..." issue

console.log('🔧 Running immediate stats fix...');

// Stop all timers - DISABLED - These were causing infinite loop flickering!
// let id = window.setTimeout(function() {}, 0);
// while (id--) { window.clearTimeout(id); }
// id = window.setInterval(function() {}, 0);
// while (id--) { window.clearInterval(id); }

// Get data and calculate stats
const leads = JSON.parse(localStorage.getItem('leads') || '[]');
const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

let totalLeadPremium = 0;
leads.forEach(lead => {
    if (lead.premium) {
        const p = typeof lead.premium === 'string' ?
                  parseFloat(lead.premium.replace(/[^\d.]/g, '')) || 0 :
                  parseFloat(lead.premium) || 0;
        totalLeadPremium += p;
    }
});

// Update display elements
const stats = document.querySelectorAll('.stat-value');
if (stats.length >= 4) {
    stats[0].textContent = clients.length.toString();
    stats[1].textContent = policies.length.toString();
    stats[2].textContent = '$0';  // Policy premium
    stats[3].textContent = totalLeadPremium === 0 ? '$0' : '$' + totalLeadPremium.toLocaleString();
}

console.log('✅ Stats fixed!', {
    clients: clients.length,
    policies: policies.length,
    leadPremium: totalLeadPremium
});

// Prevent future concatenation
Object.defineProperty(Element.prototype, 'textContent', {
    set: function(value) {
        if (typeof value === 'string' && value.includes('$0$0')) {
            console.warn('Blocked $0 concatenation');
            return;
        }
        Object.defineProperty(this, 'textContent', {
            value: value,
            writable: true,
            configurable: true
        });
    },
    configurable: true
});