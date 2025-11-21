// Add "Assigned To" dropdown to lead profiles
(function() {
    'use strict';

    console.log('📋 Adding Assigned To dropdown functionality...');

    // Define team members list - you can customize this
    window.teamMembers = [
        'Unassigned',
        'Hunter',
        'Grant',
        'Maureen'
    ];

    // Function to update assigned to field
    window.updateAssignedTo = async function(leadId, assignedTo) {
        console.log(`📝 Updating assigned to: ${leadId} → ${assignedTo}`);

        if (!leadId) {
            console.error('No lead ID provided');
            return;
        }

        leadId = String(leadId);

        try {
            // Update in both localStorage locations
            let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

            // Update in insurance_leads
            const insuranceIndex = insurance_leads.findIndex(l => String(l.id) === leadId);
            if (insuranceIndex !== -1) {
                insurance_leads[insuranceIndex].assignedTo = assignedTo;
                insurance_leads[insuranceIndex].assignedAt = new Date().toISOString();
                console.log('✅ Updated assignedTo in insurance_leads');
            }

            // Update in regular leads
            const regularIndex = regular_leads.findIndex(l => String(l.id) === leadId);
            if (regularIndex !== -1) {
                regular_leads[regularIndex].assignedTo = assignedTo;
                regular_leads[regularIndex].assignedAt = new Date().toISOString();
                console.log('✅ Updated assignedTo in leads');
            }

            // Save to both localStorage keys
            localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
            localStorage.setItem('leads', JSON.stringify(regular_leads));

            // Update in memory store if it exists
            if (window.leadStore && window.leadStore[leadId]) {
                window.leadStore[leadId].assignedTo = assignedTo;
                window.leadStore[leadId].assignedAt = new Date().toISOString();
            }

            // CRITICAL: Save to server API with full lead object
            try {
                // Get the full lead object
                let leadToUpdate = insurance_leads.find(l => String(l.id) === leadId) ||
                                  regular_leads.find(l => String(l.id) === leadId);

                // If not in localStorage, fetch from server
                if (!leadToUpdate) {
                    const apiUrl = window.VANGUARD_API_URL ||
                                 (window.location.hostname === 'localhost'
                                   ? 'http://localhost:3001'
                                   : `http://${window.location.hostname}:3001`);

                    const getResponse = await fetch(`${apiUrl}/api/leads`);
                    const allLeads = await getResponse.json();
                    leadToUpdate = allLeads.find(l => String(l.id) === leadId);
                }

                if (leadToUpdate) {
                    // Update the assignedTo in the lead object
                    leadToUpdate.assignedTo = assignedTo;
                    leadToUpdate.assignedAt = new Date().toISOString();

                    // Use the correct API URL and POST method
                    const apiUrl = window.VANGUARD_API_URL ||
                                 (window.location.hostname === 'localhost'
                                   ? 'http://localhost:3001'
                                   : `http://${window.location.hostname}:3001`);

                    const response = await fetch(`${apiUrl}/api/leads`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(leadToUpdate)
                    });

                    if (response.ok) {
                        console.log('✅ AssignedTo updated in API');
                    } else {
                        console.warn('API update failed, but saved locally');
                    }
                } else {
                    console.error('Lead not found for update');
                }
            } catch (error) {
                console.log('API not available, saved locally only');
            }

            // Show success message
            if (window.showNotification) {
                showNotification(`Lead assigned to ${assignedTo}`, 'success');
            }

            // Update the display in the table if visible
            const tableRows = document.querySelectorAll('#leadsTableBody tr');
            tableRows.forEach(row => {
                const checkbox = row.querySelector('.lead-checkbox');
                if (checkbox && checkbox.value === leadId) {
                    const assignedTd = row.cells[7]; // Assigned To column
                    if (assignedTd) {
                        assignedTd.textContent = assignedTo;
                    }
                }
            });

            return true;

        } catch (error) {
            console.error('Error updating assigned to:', error);
            if (window.showNotification) {
                showNotification('Error updating assignment', 'error');
            }
            return false;
        }
    };

    // Override the profile creation to include Assigned To dropdown
    const originalCreateEnhancedProfile = window.createEnhancedProfile;
    if (originalCreateEnhancedProfile) {
        window.createEnhancedProfile = function(lead) {
            const result = originalCreateEnhancedProfile(lead);

            // Add the Assigned To dropdown to the profile after it's created
            setTimeout(() => {
                addAssignedToDropdown(lead);
            }, 100);

            return result;
        };
    }

    // Function to add the Assigned To dropdown to existing profile
    function addAssignedToDropdown(lead) {
        // Find the lead details section
        const profileContainer = document.querySelector('.enhanced-profile-overlay');
        if (!profileContainer) return;

        // Find the Lead Details section specifically (it has the yellow background)
        let leadDetailsSection = null;
        const sections = profileContainer.querySelectorAll('.profile-section');
        for (const section of sections) {
            const heading = section.querySelector('h3');
            if (heading && heading.textContent.includes('Lead Details')) {
                leadDetailsSection = section;
                break;
            }
        }

        if (!leadDetailsSection) return;

        // Check if already added
        if (profileContainer.querySelector('#assigned-to-dropdown-container')) return;

        // Find the grid container with other dropdowns
        const gridContainer = leadDetailsSection.querySelector('div[style*="grid"]');
        if (!gridContainer) return;

        // Create the Assigned To dropdown div
        const assignedToDiv = document.createElement('div');
        assignedToDiv.id = 'assigned-to-dropdown-container';
        assignedToDiv.innerHTML = `
            <label style="font-weight: 600; font-size: 12px;">Assigned To:</label>
            <select id="lead-assigned-${lead.id}"
                    onchange="updateAssignedTo('${lead.id}', this.value)"
                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                ${window.teamMembers.map(member =>
                    `<option value="${member}" ${lead.assignedTo === member ? 'selected' : ''}>
                        ${member}
                    </option>`
                ).join('')}
            </select>
        `;

        // Find the Win/Loss dropdown specifically and add after it
        let winLossDiv = null;
        const divs = gridContainer.querySelectorAll('div');
        for (const div of divs) {
            if (div.querySelector('select[id*="winloss"]')) {
                winLossDiv = div;
                break;
            }
        }

        if (winLossDiv) {
            winLossDiv.after(assignedToDiv);
        } else {
            // If no Win/Loss found, add at the end
            gridContainer.appendChild(assignedToDiv);
        }

        console.log('✅ Added Assigned To dropdown to Lead Details section');
    }

    // Monitor for profile opens and add the dropdown
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('enhanced-profile-overlay')) {
                        // Profile was opened, find the lead data
                        const leadId = node.querySelector('[id^="lead-stage-"]')?.id?.replace('lead-stage-', '');
                        if (leadId) {
                            // Get the lead data
                            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                            const lead = leads.find(l => String(l.id) === String(leadId));
                            if (lead) {
                                setTimeout(() => addAssignedToDropdown(lead), 100);
                            }
                        }
                    }
                });
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also patch the final-profile-fix.js HTML generation
    const originalGenerateProfileHTML = window.generateEnhancedProfileHTML;
    if (originalGenerateProfileHTML) {
        window.generateEnhancedProfileHTML = function(lead) {
            let html = originalGenerateProfileHTML ? originalGenerateProfileHTML(lead) : '';

            // Find the Lead Details section and add Assigned To after Win/Loss
            const assignedToHTML = `
                        <div>
                            <label style="font-weight: 600; font-size: 12px;">Assigned To:</label>
                            <select id="lead-assigned-${lead.id}"
                                    onchange="updateAssignedTo('${lead.id}', this.value)"
                                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
                                ${window.teamMembers.map(member =>
                                    `<option value="${member}" ${lead.assignedTo === member ? 'selected' : ''}>
                                        ${member}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>`;

            // Look for Win/Loss dropdown and add after it, but before the closing divs of Lead Details section
            const winLossPattern = /<select id="lead-winloss-[^"]*"[^>]*>[\s\S]*?<\/select>\s*<\/div>/;
            const match = html.match(winLossPattern);

            if (match) {
                const insertPosition = html.indexOf(match[0]) + match[0].length;
                html = html.slice(0, insertPosition) + '\n' + assignedToHTML + html.slice(insertPosition);
            }

            return html;
        };
    }

    console.log('✅ Assigned To dropdown functionality added!');
})();