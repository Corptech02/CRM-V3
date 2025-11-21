// Fix the profile closing immediately issue
console.log('Applying profile closing fix...');

// Override the viewLead function to prevent immediate closing
window.viewLead = function(leadId) {
    console.log('viewLead called with ID:', leadId);
    
    // Prevent any default behaviors
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Ensure leadId is a number
    leadId = parseInt(leadId);
    
    // Get leads from localStorage
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId || l.id === parseInt(l.id) === leadId);
    
    if (!lead) {
        console.error('Lead not found:', leadId);
        alert('Lead not found');
        return;
    }
    
    console.log('Found lead:', lead.name);
    
    // Remove any existing profile modals first
    const existingModal = document.getElementById('lead-profile-container');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Use the enhanced profile
    if (window.showLeadProfile) {
        console.log('Showing enhanced profile');
        window.showLeadProfile(leadId);
        
        // Make sure the modal stays open
        setTimeout(() => {
            const modal = document.getElementById('lead-profile-container');
            if (modal) {
                // Prevent clicking outside from closing it immediately
                modal.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Make sure overlay clicks work properly
                const overlay = modal.querySelector('.modal-overlay');
                if (overlay) {
                    overlay.addEventListener('click', function(e) {
                        if (e.target === this) {
                            closeLeadProfile();
                        }
                    });
                }
            }
        }, 100);
    } else {
        console.error('Enhanced profile not available');
    }
    
    return false; // Prevent any default action
};

// Fix the close function
window.closeLeadProfile = function() {
    console.log('Closing lead profile');
    const container = document.getElementById('lead-profile-container');
    if (container) {
        container.remove();
    }
};

// Fix all eye icon buttons to prevent default behavior
function fixEyeIcons() {
    document.querySelectorAll('button[onclick*="viewLead"]').forEach(btn => {
        const originalOnclick = btn.getAttribute('onclick');
        const match = originalOnclick.match(/viewLead\((\d+)\)/);
        
        if (match) {
            const leadId = parseInt(match[1]);
            
            // Remove the old onclick
            btn.removeAttribute('onclick');
            
            // Add new click handler
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Eye icon clicked for lead:', leadId);
                window.viewLead(leadId);
                return false;
            });
        }
    });
}

// Apply fixes when page loads and when content changes
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixEyeIcons, 1000);
});

// Also fix when leads view is loaded
const originalLoadLeadsView = window.loadLeadsView;
if (originalLoadLeadsView) {
    window.loadLeadsView = function() {
        originalLoadLeadsView.apply(this, arguments);
        setTimeout(fixEyeIcons, 500);
    };
}

// Monitor for dynamic content changes
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            // Check if leads table was added
            const leadsTable = document.querySelector('#leadsTableBody');
            if (leadsTable) {
                setTimeout(fixEyeIcons, 100);
            }
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Profile closing fix applied');