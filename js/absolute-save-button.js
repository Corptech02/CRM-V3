// ABSOLUTE SAVE BUTTON - Forces save button to appear no matter what
(function() {
    'use strict';

    console.log('ABSOLUTE SAVE BUTTON LOADING');

    let attempts = 0;
    let buttonAdded = false;

    // Function to add save button
    function forceSaveButton() {
        if (buttonAdded) return;

        attempts++;
        console.log(`Attempt ${attempts} to add save button`);

        // Look for ANY modal or profile content
        const possibleContainers = [
            '.lead-profile-modal',
            '.modal-content',
            '.lead-profile-content',
            '.modal-body',
            '[class*="lead"]',
            '[class*="profile"]',
            '[class*="modal"]'
        ];

        let container = null;
        for (let selector of possibleContainers) {
            container = document.querySelector(selector);
            if (container) {
                console.log(`Found container: ${selector}`);
                break;
            }
        }

        // If no container, check if there are any quote buttons (indicating we're in a lead profile)
        if (!container) {
            const quoteBtn = Array.from(document.querySelectorAll('button')).find(btn =>
                btn.textContent.includes('Quote') ||
                btn.textContent.includes('Application')
            );
            if (quoteBtn) {
                container = quoteBtn.closest('div');
                console.log('Found container via quote button');
            }
        }

        // If still no container, just use body
        if (!container && document.body) {
            // Check if page has lead-related content
            const hasLeadContent = document.body.innerHTML.includes('Company Name') ||
                                  document.body.innerHTML.includes('Contact Name') ||
                                  document.body.innerHTML.includes('DOT Number');
            if (hasLeadContent) {
                container = document.body;
                console.log('Using body as container - lead content detected');
            }
        }

        if (!container) {
            console.log('No suitable container found yet');
            return;
        }

        // Create save button with FIXED positioning
        const saveBtn = document.createElement('button');
        saveBtn.id = 'absolute-save-btn';
        saveBtn.innerHTML = '💾 SAVE LEAD CHANGES';
        saveBtn.style.cssText = `
            position: fixed !important;
            top: 80px !important;
            right: 20px !important;
            background: #dc2626 !important;
            color: white !important;
            border: none !important;
            padding: 15px 30px !important;
            font-size: 20px !important;
            font-weight: bold !important;
            border-radius: 10px !important;
            cursor: pointer !important;
            z-index: 9999999 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            animation: pulse 2s infinite !important;
        `;

        // Add pulsing animation
        if (!document.getElementById('save-btn-styles')) {
            const style = document.createElement('style');
            style.id = 'save-btn-styles';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                #absolute-save-btn:hover {
                    background: #b91c1c !important;
                    transform: scale(1.1) !important;
                }
            `;
            document.head.appendChild(style);
        }

        saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            performSave();
        };

        document.body.appendChild(saveBtn);
        buttonAdded = true;
        console.log('SAVE BUTTON ADDED - Look for red button in top right!');

        // Also add inline save button in the modal
        if (container !== document.body) {
            const inlineBtn = saveBtn.cloneNode(true);
            inlineBtn.id = 'inline-save-btn';
            inlineBtn.style.position = 'relative';
            inlineBtn.style.cssText = `
                background: #2563eb !important;
                color: white !important;
                border: none !important;
                padding: 12px 24px !important;
                font-size: 18px !important;
                font-weight: bold !important;
                border-radius: 8px !important;
                cursor: pointer !important;
                margin: 10px 0 !important;
                width: 100% !important;
                display: block !important;
            `;
            inlineBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                performSave();
            };

            // Try to insert at the top of the container
            const firstElement = container.firstElementChild;
            if (firstElement) {
                container.insertBefore(inlineBtn, firstElement);
            } else {
                container.appendChild(inlineBtn);
            }
        }
    }

    // Function to perform save
    async function performSave() {
        console.log('PERFORMING SAVE');

        // Find lead ID
        let leadId = window.currentLeadId;

        if (!leadId) {
            // Try to find from inputs
            const input = document.querySelector('[onchange*="updateLeadField"]');
            if (input) {
                const match = input.getAttribute('onchange').match(/updateLeadField\(['"]?(\w+)['"]?/);
                if (match) leadId = match[1];
            }
        }

        if (!leadId) {
            // Try to find from URL or page content
            const urlMatch = window.location.href.match(/lead[_-]?(\d+)/i);
            if (urlMatch) leadId = urlMatch[1];
        }

        if (!leadId) {
            leadId = prompt('Enter Lead ID (e.g., 88571):');
        }

        if (!leadId) {
            alert('Cannot find lead ID!');
            return;
        }

        console.log('Saving lead:', leadId);

        // Collect ALL field values
        const data = {};

        document.querySelectorAll('input, textarea, select').forEach(el => {
            if (el.type === 'button' || el.type === 'submit') return;

            const value = el.value;
            if (!value && value !== '') return;

            // Try to identify field
            const onchange = el.getAttribute('onchange') || '';
            const text = (el.placeholder + ' ' + el.id + ' ' + el.name + ' ' + el.className).toLowerCase();

            // Check onchange first
            if (onchange.includes('updateLeadField')) {
                const match = onchange.match(/updateLeadField\([^,]+,\s*['"]([^'"]+)['"]/);
                if (match) {
                    data[match[1]] = value;
                    console.log(`Field: ${match[1]} = ${value}`);
                    return;
                }
            }

            // Map common fields
            if (text.includes('company') && !text.includes('insurance')) {
                data.company_name = value;
            } else if (text.includes('contact') && !text.includes('date')) {
                data.contact_name = value;
            } else if (text.includes('phone')) {
                data.phone = value;
            } else if (text.includes('email')) {
                data.email = value;
            } else if (text.includes('note') || text.includes('transcript')) {
                data.notes = value;
            } else if (text.includes('dot')) {
                data.dot_number = value;
            } else if (text.includes('mc')) {
                data.mc_number = value;
            } else if (text.includes('address')) {
                data.address = value;
            } else if (text.includes('city')) {
                data.city = value;
            } else if (text.includes('state')) {
                data.state = value;
            } else if (text.includes('zip')) {
                data.zip_code = value;
            }
        });

        console.log('Collected data:', data);

        if (Object.keys(data).length === 0) {
            alert('No data to save!');
            return;
        }

        // Update buttons
        const buttons = [
            document.getElementById('absolute-save-btn'),
            document.getElementById('inline-save-btn')
        ];

        buttons.forEach(btn => {
            if (btn) {
                btn.innerHTML = '⏳ SAVING...';
                btn.disabled = true;
            }
        });

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Save successful:', result);

                // Update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const lead = leads.find(l => String(l.id) === String(leadId));
                if (lead) {
                    Object.assign(lead, data);
                    lead.name = data.company_name || lead.name;
                    lead.contact = data.contact_name || lead.contact;
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                    localStorage.setItem('leads', JSON.stringify(leads));
                }

                buttons.forEach(btn => {
                    if (btn) {
                        btn.innerHTML = '✅ SAVED!';
                        btn.style.background = '#16a34a !important';
                    }
                });

                if (window.showNotification) {
                    showNotification('Lead saved successfully!', 'success');
                } else {
                    alert('Lead saved successfully!');
                }

                setTimeout(() => {
                    buttons.forEach(btn => {
                        if (btn) {
                            btn.innerHTML = '💾 SAVE LEAD CHANGES';
                            btn.style.background = btn.id === 'absolute-save-btn' ? '#dc2626 !important' : '#2563eb !important';
                            btn.disabled = false;
                        }
                    });
                }, 3000);

            } else {
                throw new Error(result.error || 'Save failed');
            }

        } catch (error) {
            console.error('Save error:', error);
            alert(`Save failed: ${error.message}`);

            buttons.forEach(btn => {
                if (btn) {
                    btn.innerHTML = '❌ FAILED';
                    btn.disabled = false;
                }
            });
        }
    }

    // Try to add button immediately
    forceSaveButton();

    // Try again after delays
    setTimeout(forceSaveButton, 100);
    setTimeout(forceSaveButton, 500);
    setTimeout(forceSaveButton, 1000);
    setTimeout(forceSaveButton, 2000);

    // Watch for ANY changes to the page
    const observer = new MutationObserver(() => {
        if (!buttonAdded) {
            forceSaveButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Intercept profile opens
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        console.log('Lead profile opening:', leadId);
        window.currentLeadId = leadId;
        buttonAdded = false; // Reset so button can be added again

        if (originalShow) {
            originalShow.call(this, leadId);
        }

        setTimeout(forceSaveButton, 100);
        setTimeout(forceSaveButton, 500);
    };

    const originalView = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('View lead:', leadId);
        window.currentLeadId = leadId;
        buttonAdded = false;

        if (originalView) {
            originalView.call(this, leadId);
        }

        setTimeout(forceSaveButton, 100);
        setTimeout(forceSaveButton, 500);
    };

    // Global save function
    window.performSave = performSave;

    console.log('ABSOLUTE SAVE BUTTON LOADED - Red button will appear in top right!');
})();