// Add auto-save functionality to the original profile
console.log('🔧 Adding auto-save to original profile...');

// Store reference to original close function
let originalCloseFunction = null;

// Function to save all field changes
function saveAllProfileChanges() {
    console.log('💾 Auto-saving profile changes...');

    // Get the current lead ID from the modal
    const modal = document.querySelector('.modal-overlay, #lead-profile-container');
    if (!modal) {
        console.log('No modal found, skipping save');
        return;
    }

    // Find the lead ID from any input with onchange containing updateLeadField or updateLeadStage
    let leadId = null;
    const inputs = modal.querySelectorAll('input, select, textarea');

    for (const input of inputs) {
        const onChange = input.getAttribute('onchange') || '';
        if (onChange.includes('updateLeadField') || onChange.includes('updateLeadStage')) {
            const match = onChange.match(/['"](\d+)['"]/);
            if (match) {
                leadId = match[1];
                break;
            }
        }
    }

    if (!leadId) {
        console.log('Could not find lead ID, skipping save');
        return;
    }

    console.log('Auto-saving lead:', leadId);

    // Get lead data from localStorage
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        leads = JSON.parse(localStorage.getItem('leads') || '[]');
        lead = leads.find(l => String(l.id) === String(leadId));
    }

    if (!lead) {
        console.log('Lead not found in storage');
        return;
    }

    // Collect all field values from the form
    const updates = {};
    let hasChanges = false;

    inputs.forEach(input => {
        if (input.type === 'button' || input.type === 'submit') return;

        const value = input.value.trim();
        if (!value) return;

        // Map field IDs to lead properties
        const fieldMap = {
            // Company information
            'company-name': 'name',
            'contact-person': 'contact',
            'phone': 'phone',
            'email': 'email',
            'dot-number': 'dotNumber',
            'mc-number': 'mcNumber',
            'years-business': 'yearsInBusiness',
            'renewal-date': 'renewalDate',

            // Operation details
            'radius': 'radiusOfOperation',
            'commodity': 'commodityHauled',
            'operating-states': 'operatingStates',

            // Other fields
            'premium': 'premium',
            'notes': 'notes'
        };

        // Check if this input has a field mapping
        const fieldName = fieldMap[input.id] || input.id.replace(`-${leadId}`, '');

        // Special handling for stage field
        if (input.id.includes('lead-stage') || input.id.includes('stage')) {
            fieldName = 'stage';
        }

        // Only update if value is different from current lead data
        if (lead[fieldName] !== value) {
            updates[fieldName] = value;
            lead[fieldName] = value;
            hasChanges = true;
            console.log(`Updated ${fieldName}: ${value}`);
        }

        // Also check by placeholder or context for unmapped fields
        if (!fieldMap[input.id]) {
            const text = (input.placeholder + ' ' + input.id + ' ' + (input.previousElementSibling?.textContent || '')).toLowerCase();

            let detectedField = null;
            if (text.includes('company') && text.includes('name')) detectedField = 'name';
            else if (text.includes('contact') && !text.includes('info')) detectedField = 'contact';
            else if (text.includes('phone')) detectedField = 'phone';
            else if (text.includes('email')) detectedField = 'email';
            else if (text.includes('dot')) detectedField = 'dotNumber';
            else if (text.includes('mc') && text.includes('number')) detectedField = 'mcNumber';
            else if (text.includes('years')) detectedField = 'yearsInBusiness';
            else if (text.includes('renewal')) detectedField = 'renewalDate';
            else if (text.includes('radius')) detectedField = 'radiusOfOperation';
            else if (text.includes('commodity')) detectedField = 'commodityHauled';
            else if (text.includes('state')) detectedField = 'operatingStates';
            else if (text.includes('premium')) detectedField = 'premium';
            else if (text.includes('note')) detectedField = 'notes';

            if (detectedField && lead[detectedField] !== value) {
                updates[detectedField] = value;
                lead[detectedField] = value;
                hasChanges = true;
                console.log(`Auto-detected and updated ${detectedField}: ${value}`);
            }
        }
    });

    // Handle vehicle, trailer, and driver data
    // Look for vehicle inputs
    const vehicleInputs = modal.querySelectorAll('input[id*="vehicle"], input[placeholder*="Year"], input[placeholder*="Make"], input[placeholder*="Model"], input[placeholder*="VIN"]');
    if (vehicleInputs.length > 0) {
        console.log('Found vehicle inputs, processing...');
        if (!lead.vehicles) lead.vehicles = [];

        // Group vehicle inputs by index
        const vehicleGroups = {};
        vehicleInputs.forEach(input => {
            if (input.id.includes('vehicle-') || input.closest('[data-vehicle-index]')) {
                const vehicleIndex = input.id.match(/vehicle-(\d+)/) ? parseInt(input.id.match(/vehicle-(\d+)/)[1]) :
                                   parseInt(input.closest('[data-vehicle-index]')?.dataset.vehicleIndex || 0);

                if (!vehicleGroups[vehicleIndex]) vehicleGroups[vehicleIndex] = {};

                const field = input.placeholder?.toLowerCase() || input.id.split('-').pop();
                if (field && input.value.trim()) {
                    vehicleGroups[vehicleIndex][field.toLowerCase()] = input.value.trim();
                    hasChanges = true;
                }
            }
        });

        // Update lead vehicles
        Object.keys(vehicleGroups).forEach(index => {
            const vehicleData = vehicleGroups[index];
            if (Object.keys(vehicleData).length > 0) {
                while (lead.vehicles.length <= index) {
                    lead.vehicles.push({});
                }
                Object.assign(lead.vehicles[index], vehicleData);
                console.log(`Updated vehicle ${index}:`, vehicleData);
            }
        });
    }

    if (hasChanges) {
        // Update localStorage
        lead.lastModified = new Date().toISOString();
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

        console.log('✅ Auto-save completed successfully');

        // Show brief notification if available
        if (window.showNotification) {
            showNotification('Changes saved automatically', 'success');
        }

        // Refresh leads view if available
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        }
    } else {
        console.log('No changes detected');
    }
}

// Override any close functions to add auto-save
function addAutoSaveToCloseButtons() {
    // Find close buttons
    const closeButtons = document.querySelectorAll('.close-btn, #profile-close-btn, button[onclick*="close"]');

    closeButtons.forEach(button => {
        const originalOnClick = button.onclick;
        button.onclick = function() {
            console.log('Close button clicked, auto-saving...');
            saveAllProfileChanges();

            // Call original close function
            if (originalOnClick) {
                originalOnClick.call(this);
            }
        };
    });
}

// Watch for profile modal creation
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Check if this is a profile modal
                    if (node.classList?.contains('modal-overlay') ||
                        node.id === 'lead-profile-container' ||
                        node.querySelector('.modal-header h2')) {

                        console.log('Profile modal detected, adding auto-save to close buttons');

                        // Add auto-save to close buttons after a short delay
                        setTimeout(() => {
                            addAutoSaveToCloseButtons();
                        }, 100);
                    }

                    // Also check child nodes
                    const profileElements = node.querySelectorAll('.modal-overlay, #lead-profile-container');
                    if (profileElements.length > 0) {
                        console.log('Profile modal detected in children, adding auto-save');
                        setTimeout(() => {
                            addAutoSaveToCloseButtons();
                        }, 100);
                    }
                }
            });
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Save on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay, #lead-profile-container');
        if (modal) {
            console.log('Escape pressed, auto-saving...');
            saveAllProfileChanges();
        }
    }
});

// Save on outside click
document.addEventListener('click', function(e) {
    const modal = document.querySelector('.modal-overlay');
    if (modal && e.target === modal) {
        console.log('Outside click detected, auto-saving...');
        saveAllProfileChanges();
    }
});

// Save before page unload
window.addEventListener('beforeunload', function() {
    const modal = document.querySelector('.modal-overlay, #lead-profile-container');
    if (modal) {
        saveAllProfileChanges();
    }
});

console.log('✅ Auto-save functionality added to original profile');