// Simple auto-save for original profile - no input blocking
console.log('🔧 Loading simple profile auto-save...');

// Store the lead ID when profile opens
let currentProfileLeadId = null;

// Watch for profile modal opening
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
                // Check if this is a profile modal
                if (node.classList?.contains('modal-overlay') ||
                    node.id === 'lead-profile-container' ||
                    node.querySelector && node.querySelector('.modal-header h2')) {

                    console.log('Profile modal detected');

                    // Try to find the lead ID from any input
                    const inputs = node.querySelectorAll('input, select');
                    for (const input of inputs) {
                        const onChange = input.getAttribute('onchange') || '';
                        const match = onChange.match(/['"](\d+)['"]/);
                        if (match) {
                            currentProfileLeadId = match[1];
                            console.log('Found lead ID:', currentProfileLeadId);
                            break;
                        }
                    }

                    // Add close button handler
                    setTimeout(() => {
                        const closeButtons = node.querySelectorAll('.close-btn, #profile-close-btn');
                        closeButtons.forEach(btn => {
                            btn.addEventListener('click', saveBeforeClose);
                        });
                    }, 100);
                }
            }
        });
    });
});

// Simple save function
function saveBeforeClose() {
    if (!currentProfileLeadId) {
        console.log('No lead ID to save');
        return;
    }

    console.log('💾 Auto-saving before close...');

    // Get current modal
    const modal = document.querySelector('.modal-overlay, #lead-profile-container');
    if (!modal) return;

    // Get lead data
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let lead = leads.find(l => String(l.id) === String(currentProfileLeadId));

    if (!lead) {
        leads = JSON.parse(localStorage.getItem('leads') || '[]');
        lead = leads.find(l => String(l.id) === String(currentProfileLeadId));
    }

    if (!lead) {
        console.log('Lead not found for saving');
        return;
    }

    // Save only the basic company fields that we know exist
    const updates = {};
    let hasChanges = false;

    // Map of input IDs to lead properties
    const fieldMappings = {
        'company-name': 'name',
        'contact-person': 'contact',
        'phone': 'phone',
        'email': 'email',
        'dot-number': 'dotNumber',
        'mc-number': 'mcNumber',
        'years-business': 'yearsInBusiness',
        'renewal-date': 'renewalDate',
        'radius': 'radiusOfOperation',
        'commodity': 'commodityHauled',
        'operating-states': 'operatingStates',
        'premium': 'premium',
        'notes': 'notes'
    };

    // Update fields
    Object.entries(fieldMappings).forEach(([inputId, leadProp]) => {
        const input = modal.querySelector(`#${inputId}`);
        if (input && input.value && input.value.trim() !== lead[leadProp]) {
            lead[leadProp] = input.value.trim();
            hasChanges = true;
            console.log(`Updated ${leadProp}: ${input.value.trim()}`);
        }
    });

    // Also check inputs by partial ID match
    const allInputs = modal.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
    allInputs.forEach(input => {
        if (input.value.trim() && input.id) {
            // Try to match common field patterns
            if (input.id.includes('company') && !fieldMappings[input.id]) {
                lead.name = input.value.trim();
                hasChanges = true;
            } else if (input.id.includes('contact') && !fieldMappings[input.id]) {
                lead.contact = input.value.trim();
                hasChanges = true;
            } else if (input.id.includes('dot') && !fieldMappings[input.id]) {
                lead.dotNumber = input.value.trim();
                hasChanges = true;
            }
        }
    });

    if (hasChanges) {
        lead.lastModified = new Date().toISOString();
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));
        console.log('✅ Auto-save completed');

        // Refresh leads view
        if (typeof loadLeadsView === 'function') {
            setTimeout(loadLeadsView, 100);
        }
    }
}

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Save on escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && currentProfileLeadId) {
        saveBeforeClose();
        currentProfileLeadId = null;
    }
});

// Save on outside click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay') && currentProfileLeadId) {
        saveBeforeClose();
        currentProfileLeadId = null;
    }
});

console.log('✅ Simple profile auto-save loaded');