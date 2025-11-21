// Fix lead profile viewing to ensure enhanced profile loads
console.log('Fixing lead profile view...');

// Override the viewLead function to ensure it uses the enhanced profile
window.viewLead = function(leadId) {
    console.log('viewLead called with ID:', leadId);
    
    // Ensure leadId is a number
    leadId = parseInt(leadId);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId || l.id === leadId.toString());
    
    if (!lead) {
        console.error('Lead not found:', leadId);
        alert('Lead not found');
        return;
    }
    
    console.log('Found lead:', lead.name);
    
    // Always use the enhanced profile for commercial auto leads
    if (window.showLeadProfile) {
        console.log('Using enhanced profile');
        window.showLeadProfile(leadId);
    } else {
        console.error('Enhanced profile function not available');
        // Fallback - load the enhanced profile script
        const script = document.createElement('script');
        script.src = 'js/lead-profile-enhanced.js';
        script.onload = function() {
            if (window.showLeadProfile) {
                window.showLeadProfile(leadId);
            }
        };
        document.head.appendChild(script);
    }
};

// Also ensure the eye icon buttons work
setTimeout(() => {
    document.querySelectorAll('button[onclick^="viewLead"]').forEach(btn => {
        const match = btn.getAttribute('onclick').match(/viewLead\((\d+)\)/);
        if (match) {
            const leadId = parseInt(match[1]);
            btn.onclick = function(e) {
                e.preventDefault();
                console.log('Eye icon clicked for lead:', leadId);
                window.viewLead(leadId);
            };
        }
    });
}, 1000);

console.log('Lead profile fix applied');