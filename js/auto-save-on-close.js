// Auto-save lead profile when closing
(function() {
    'use strict';

    console.log('Auto-save on close loading...');

    let currentLeadData = {};
    let currentLeadId = null;

    // Function to collect all current field values
    function collectFieldValues() {
        const data = {};

        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.type === 'button' || element.type === 'submit') return;

            const value = element.value;
            if (!value) return;

            // Get field name from onchange attribute
            const onchange = element.getAttribute('onchange');
            if (onchange && onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([^'"]+)['"]/);
                if (match) {
                    data[match[1]] = value;
                    return;
                }
            }

            // Fallback: guess field name from context
            const text = (element.placeholder + ' ' + element.id + ' ' + element.name).toLowerCase();

            if (text.includes('company')) data.company_name = value;
            else if (text.includes('contact')) data.contact_name = value;
            else if (text.includes('phone')) data.phone = value;
            else if (text.includes('email')) data.email = value;
            else if (text.includes('dot')) data.dot_number = value;
            else if (text.includes('mc')) data.mc_number = value;
            else if (text.includes('years')) data.years_in_business = value;
            else if (text.includes('fleet')) data.fleet_size = value;
            else if (text.includes('radius')) data.radius_of_operation = value;
            else if (text.includes('commodity')) data.commodity_hauled = value;
            else if (text.includes('notes')) data.notes = value;
            else if (text.includes('address')) data.address = value;
            else if (text.includes('city')) data.city = value;
            else if (text.includes('state')) data.state = value;
            else if (text.includes('zip')) data.zip_code = value;
        });

        return data;
    }

    // Function to save to database
    async function autoSave() {
        if (!currentLeadId) {
            console.log('No lead ID, skipping auto-save');
            return;
        }

        const data = collectFieldValues();

        if (Object.keys(data).length === 0) {
            console.log('No data to save');
            return;
        }

        console.log('Auto-saving lead:', currentLeadId);
        console.log('Data:', data);

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            const response = await fetch(`${apiUrl}/api/leads/${currentLeadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Auto-save successful:', result);

                // Update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const lead = leads.find(l => String(l.id) === String(currentLeadId));
                if (lead) {
                    Object.assign(lead, data);
                    lead.name = data.company_name || lead.name;
                    lead.contact = data.contact_name || lead.contact;
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    localStorage.setItem('leads', JSON.stringify(leads));
                }

                // Show brief notification
                if (window.showNotification) {
                    showNotification('Changes saved automatically', 'success');
                }
            } else {
                console.error('Auto-save failed:', result);
            }
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    // Track when lead profile opens
    const originalShowLeadProfile = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        console.log('Lead profile opening for:', leadId);
        currentLeadId = leadId;

        // Call original function
        if (originalShowLeadProfile) {
            originalShowLeadProfile.call(this, leadId);
        }
    };

    const originalViewLead = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('View lead called for:', leadId);
        currentLeadId = leadId;

        if (originalViewLead) {
            originalViewLead.call(this, leadId);
        }
    };

    // Track lead ID from updateLeadField calls
    const originalUpdateLeadField = window.updateLeadField;
    window.updateLeadField = function(leadId, field, value) {
        currentLeadId = leadId;
        console.log(`Field update: ${field} = ${value} for lead ${leadId}`);
        // Don't call original to prevent immediate saves
    };

    // Detect when modal closes
    function detectModalClose() {
        const modal = document.querySelector('.lead-profile-modal, .modal-overlay, .modal-content');
        if (!modal) return false;

        // Check if modal is being removed or hidden
        const isHidden = modal.style.display === 'none' ||
                        modal.classList.contains('hidden') ||
                        !modal.offsetParent;

        return isHidden;
    }

    // Watch for modal close
    let modalOpen = false;

    const observer = new MutationObserver(() => {
        const modal = document.querySelector('.lead-profile-modal, .modal-overlay');

        if (modal && !modalOpen) {
            // Modal just opened
            modalOpen = true;
            console.log('Lead profile opened');

            // Find lead ID from any input
            const input = modal.querySelector('[onchange*="updateLeadField"]');
            if (input) {
                const match = input.getAttribute('onchange').match(/updateLeadField\(['"]?(\d+)/);
                if (match) {
                    currentLeadId = match[1];
                    console.log('Found lead ID from input:', currentLeadId);
                }
            }
        } else if (!modal && modalOpen) {
            // Modal just closed
            modalOpen = false;
            console.log('Lead profile closed - auto-saving...');
            autoSave();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also save when clicking outside modal
    document.addEventListener('click', function(e) {
        const modal = document.querySelector('.modal-overlay');
        if (modal && e.target === modal) {
            console.log('Clicked outside modal - auto-saving...');
            autoSave();
        }
    });

    // Save when pressing Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOpen) {
            console.log('Escape pressed - auto-saving...');
            autoSave();
        }
    });

    // Save when closing functions are called
    const originalCloseLeadProfile = window.closeLeadProfile;
    window.closeLeadProfile = function() {
        console.log('closeLeadProfile called - auto-saving...');
        autoSave();

        if (originalCloseLeadProfile) {
            setTimeout(() => originalCloseLeadProfile.call(this), 100);
        }
    };

    // Save on page unload too
    window.addEventListener('beforeunload', function() {
        if (currentLeadId && modalOpen) {
            autoSave();
        }
    });

    console.log('Auto-save on close loaded - changes will save automatically when closing lead profile');
})();