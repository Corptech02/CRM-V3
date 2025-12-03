// Debug script to understand why viewLead is redirecting
console.log('🔧 DEBUG: Starting viewLead debugging...');

// Store the original viewLead function if it exists
let originalViewLead = window.viewLead;

// Override with debug version
window.viewLead = function(leadId) {
    console.log('🔧 DEBUG: viewLead called with leadId:', leadId);
    console.log('🔧 DEBUG: Current URL:', window.location.href);
    console.log('🔧 DEBUG: typeof window.createEnhancedProfile:', typeof window.createEnhancedProfile);
    console.log('🔧 DEBUG: typeof window.showLeadProfile:', typeof window.showLeadProfile);

    // Check if we're being redirected by looking at stack trace
    console.trace('🔧 DEBUG: Call stack for viewLead');

    // Check localStorage for lead
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let lead = leads.find(l => String(l.id) === String(leadId));

    console.log('🔧 DEBUG: Found lead in localStorage:', !!lead);
    if (lead) {
        console.log('🔧 DEBUG: Lead name:', lead.name);
    }

    // Prevent default behavior
    if (window.event) {
        window.event.preventDefault();
        window.event.stopPropagation();
        console.log('🔧 DEBUG: Prevented default event behavior');
    }

    // Try to call enhanced profile if available
    if (window.createEnhancedProfile && lead) {
        console.log('🔧 DEBUG: Calling createEnhancedProfile...');
        window.createEnhancedProfile(lead);
        return false;
    } else {
        console.error('🔧 DEBUG: Cannot call enhanced profile - missing function or lead');
        console.log('🔧 DEBUG: createEnhancedProfile available:', !!window.createEnhancedProfile);
        console.log('🔧 DEBUG: lead available:', !!lead);
    }

    return false;
};

// Also override the eye icon click handlers directly
setTimeout(() => {
    console.log('🔧 DEBUG: Setting up eye icon overrides...');

    const eyeIcons = document.querySelectorAll('.fa-eye');
    console.log('🔧 DEBUG: Found', eyeIcons.length, 'eye icons');

    eyeIcons.forEach((icon, index) => {
        const button = icon.closest('button');
        if (button) {
            // Remove existing onclick
            button.removeAttribute('onclick');

            // Add new click handler
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                console.log('🔧 DEBUG: Eye icon clicked (button', index, ')');

                // Try to extract leadId from nearby elements
                const row = button.closest('tr');
                if (row) {
                    // Look for data attributes or other ways to get the lead ID
                    const nameElement = row.querySelector('[onclick*="viewLead"]');
                    if (nameElement) {
                        const onclickAttr = nameElement.getAttribute('onclick');
                        const leadIdMatch = onclickAttr.match(/viewLead\(['"]([^'"]+)['"]\)/);
                        if (leadIdMatch) {
                            const leadId = leadIdMatch[1];
                            console.log('🔧 DEBUG: Extracted leadId from onclick:', leadId);
                            window.viewLead(leadId);
                            return false;
                        }
                    }
                }

                console.error('🔧 DEBUG: Could not extract leadId from eye icon click');
                return false;
            });
        }
    });
}, 1000);

console.log('🔧 DEBUG: viewLead debugging setup complete');