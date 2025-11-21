// Lead Save Button Fix - Ensures save button is always visible
// This runs after lead profile is displayed

(function() {
    'use strict';

    console.log('Lead Save Button Fix loading...');

    // Function to add save button to lead profile
    window.ensureSaveButton = function(leadId) {
        // Don't add multiple save buttons
        if (document.getElementById('save-lead-profile-btn')) {
            console.log('Save button already exists');
            return;
        }

        console.log('Adding save button for lead:', leadId);

        // Strategy 1: Add to modal header area
        const modalContent = document.querySelector('.modal-content, .lead-profile-modal');
        if (modalContent) {
            const header = modalContent.querySelector('.modal-header, h2');
            if (header) {
                // Create toolbar
                const toolbar = document.createElement('div');
                toolbar.style.cssText = 'padding: 15px; background: #f3f4f6; border-bottom: 2px solid #2563eb; display: flex; gap: 10px; align-items: center;';

                // Create save button
                const saveButton = document.createElement('button');
                saveButton.id = 'save-lead-profile-btn';
                saveButton.style.cssText = 'background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;';
                saveButton.innerHTML = '<i class="fas fa-save"></i> SAVE PROFILE';
                saveButton.onclick = function() {
                    if (window.saveLeadProfile) {
                        window.saveLeadProfile(leadId);
                    } else {
                        alert('Save function not available. Please refresh the page.');
                    }
                };

                toolbar.appendChild(saveButton);

                // Add indicator
                const indicator = document.createElement('span');
                indicator.style.cssText = 'margin-left: auto; color: #666; font-size: 14px;';
                indicator.innerHTML = '<i class="fas fa-info-circle"></i> Click Save to persist all changes';
                toolbar.appendChild(indicator);

                // Insert after header's parent element
                header.parentElement.insertBefore(toolbar, header.nextSibling);
                console.log('Save button added to header area');
                return;
            }
        }

        // Strategy 2: Add to any section with "Lead Status" or "Company Information"
        const sections = document.querySelectorAll('h3, .section-header');
        for (let section of sections) {
            if (section.textContent.includes('Lead Status') || section.textContent.includes('Company Information')) {
                const container = document.createElement('div');
                container.style.cssText = 'margin: 15px 0; padding: 15px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px;';

                const saveButton = document.createElement('button');
                saveButton.id = 'save-lead-profile-btn';
                saveButton.style.cssText = 'background: #f59e0b; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; width: 100%;';
                saveButton.innerHTML = '<i class="fas fa-save"></i> SAVE ALL CHANGES';
                saveButton.onclick = function() {
                    if (window.saveLeadProfile) {
                        window.saveLeadProfile(leadId);
                    } else {
                        alert('Save function not available. Please refresh the page.');
                    }
                };

                container.appendChild(saveButton);
                section.parentElement.insertBefore(container, section.nextSibling);
                console.log('Save button added after section:', section.textContent);
                return;
            }
        }

        // Strategy 3: Add floating save button
        const floatingButton = document.createElement('div');
        floatingButton.id = 'save-lead-profile-btn';
        floatingButton.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 10000;
            background: #2563eb;
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        floatingButton.innerHTML = '<i class="fas fa-save"></i> SAVE PROFILE';
        floatingButton.onclick = function() {
            if (window.saveLeadProfile) {
                window.saveLeadProfile(leadId);
            } else {
                alert('Save function not available. Please refresh the page.');
            }
        };

        document.body.appendChild(floatingButton);
        console.log('Floating save button added');
    };

    // Override viewLead to add save button
    const originalViewLead = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('ViewLead called with save button fix');

        // Call original
        if (originalViewLead) {
            originalViewLead.call(this, leadId);
        }

        // Add save button after delay
        setTimeout(() => {
            ensureSaveButton(leadId);
        }, 1000);

        // Try again after longer delay in case DOM takes time to build
        setTimeout(() => {
            ensureSaveButton(leadId);
        }, 2500);
    };

    // Also intercept showLeadProfile
    const originalShowLeadProfile = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        console.log('ShowLeadProfile called with save button fix');

        // Call original
        if (originalShowLeadProfile) {
            originalShowLeadProfile.call(this, leadId);
        }

        // Add save button after delay
        setTimeout(() => {
            ensureSaveButton(leadId);
        }, 1000);

        // Try again after longer delay
        setTimeout(() => {
            ensureSaveButton(leadId);
        }, 2500);
    };

    // Monitor for lead profile opening (for any method)
    const observer = new MutationObserver((mutations) => {
        // Check if a lead profile modal was added
        const leadModal = document.querySelector('.lead-profile-modal, .modal-content');
        if (leadModal && !document.getElementById('save-lead-profile-btn')) {
            // Try to extract lead ID from any input
            const inputs = leadModal.querySelectorAll('input[onchange*="updateLeadField"]');
            if (inputs.length > 0) {
                const onchange = inputs[0].getAttribute('onchange');
                const match = onchange ? onchange.match(/updateLeadField\(([^,]+)/) : null;
                if (match) {
                    const leadId = match[1].replace(/['"]/g, '');
                    console.log('Lead profile detected via mutation observer, adding save button');
                    setTimeout(() => ensureSaveButton(leadId), 500);
                }
            }
        }
    });

    // Start observing when DOM is ready
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    console.log('Lead Save Button Fix loaded - button will be added when lead profile opens');
})();