// ULTIMATE EYE ICON FIX - Ensures eye icon ALWAYS works
(function() {
    'use strict';

    console.log('🔧 ULTIMATE EYE ICON FIX - Loading...');

    // Function to fix eye icons and viewLead
    function applyUltimateFix() {
        console.log('🔧 Applying ultimate eye icon fix...');

        // Store original functions if they exist
        const originalViewLead = window.viewLead;
        const originalShowLeadProfile = window.showLeadProfile;

        // Create the definitive viewLead function
        window.viewLead = function(leadId) {
            console.log('👁️ Eye icon clicked - Opening lead:', leadId);

            // Ensure leadId is a string
            leadId = String(leadId);

            // Show loading overlay if available
            if (window.showLeadLoadingOverlay) {
                window.showLeadLoadingOverlay('Loading Lead Profile...');
            }

            // Try multiple methods to show the profile
            let profileShown = false;

            // Method 1: Try showLeadProfile if it exists
            if (!profileShown && window.showLeadProfile && typeof window.showLeadProfile === 'function') {
                try {
                    console.log('✅ Using showLeadProfile');
                    window.showLeadProfile(leadId);
                    profileShown = true;
                } catch (e) {
                    console.error('showLeadProfile failed:', e);
                }
            }

            // Method 2: Try the original viewLead if different
            if (!profileShown && originalViewLead && originalViewLead !== window.viewLead) {
                try {
                    console.log('✅ Using original viewLead');
                    originalViewLead(leadId);
                    profileShown = true;
                } catch (e) {
                    console.error('Original viewLead failed:', e);
                }
            }

            // Method 3: Create our own profile modal
            if (!profileShown) {
                console.log('✅ Creating custom profile modal');
                createCustomProfile(leadId);
                profileShown = true;
            }

            // Hide loading overlay after a delay
            setTimeout(() => {
                if (window.hideLeadLoadingOverlay) {
                    window.hideLeadLoadingOverlay();
                }
            }, 500);

            return false; // Prevent default action
        };

        // Create showLeadProfile if it doesn't exist
        if (!window.showLeadProfile) {
            window.showLeadProfile = window.viewLead;
        }

        // Function to create a custom profile modal
        function createCustomProfile(leadId) {
            console.log('📋 Creating custom profile for lead:', leadId);

            // Get lead data
            let lead = null;

            // Try to get from localStorage
            const sources = ['insurance_leads', 'leads', 'clients'];
            for (const source of sources) {
                const data = JSON.parse(localStorage.getItem(source) || '[]');
                lead = data.find(item => String(item.id) === leadId);
                if (lead) break;
            }

            // If not found, try to fetch from API
            if (!lead) {
                console.log('📡 Fetching lead from API...');
                fetchLeadFromAPI(leadId);
                return;
            }

            // Display the profile
            displayProfile(lead);
        }

        // Function to fetch lead from API
        function fetchLeadFromAPI(leadId) {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            fetch(`${apiUrl}/api/leads/${leadId}`)
                .then(response => response.json())
                .then(lead => {
                    console.log('✅ Lead fetched from API');
                    displayProfile(lead);
                })
                .catch(error => {
                    console.error('❌ Failed to fetch lead:', error);
                    alert('Unable to load lead profile. Please try again.');
                    if (window.hideLeadLoadingOverlay) {
                        window.hideLeadLoadingOverlay();
                    }
                });
        }

        // Function to display the profile
        function displayProfile(lead) {
            console.log('📊 Displaying profile for:', lead.name || lead.company_name || 'Unknown');

            // Remove any existing modals
            document.querySelectorAll('#lead-profile-modal, .lead-profile-modal').forEach(el => el.remove());

            // Create modal
            const modal = document.createElement('div');
            modal.id = 'lead-profile-modal';
            modal.className = 'lead-profile-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.3s ease;
            `;

            // Create content
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                width: 90%;
                max-width: 1000px;
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 12px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            `;

            // Build content HTML
            content.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 25px; border-radius: 12px 12px 0 0; position: relative;">
                    <button onclick="document.getElementById('lead-profile-modal').remove()"
                            style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2);
                                   border: none; color: white; font-size: 28px; width: 40px; height: 40px;
                                   border-radius: 50%; cursor: pointer; display: flex; align-items: center;
                                   justify-content: center;">×</button>
                    <h2 style="margin: 0; font-size: 24px;">${lead.name || lead.company_name || 'Lead Profile'}</h2>
                    <p style="margin: 8px 0 0 0; opacity: 0.9;">ID: ${lead.id}</p>
                </div>

                <div style="padding: 25px;">
                    <!-- Basic Information -->
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">
                            <i class="fas fa-info-circle" style="color: #667eea; margin-right: 8px;"></i>
                            Basic Information
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            ${lead.name ? `<div><strong>Name:</strong> ${lead.name}</div>` : ''}
                            ${lead.company_name ? `<div><strong>Company:</strong> ${lead.company_name}</div>` : ''}
                            ${lead.contact || lead.contact_name ? `<div><strong>Contact:</strong> ${lead.contact || lead.contact_name}</div>` : ''}
                            ${lead.phone ? `<div><strong>Phone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></div>` : ''}
                            ${lead.email ? `<div><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></div>` : ''}
                            ${lead.dot_number || lead.dotNumber ? `<div><strong>DOT:</strong> ${lead.dot_number || lead.dotNumber}</div>` : ''}
                            ${lead.mc_number || lead.mcNumber ? `<div><strong>MC:</strong> ${lead.mc_number || lead.mcNumber}</div>` : ''}
                        </div>
                    </div>

                    <!-- Lead Status -->
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">
                            <i class="fas fa-chart-line" style="color: #667eea; margin-right: 8px;"></i>
                            Lead Status
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div><strong>Stage:</strong> <span style="padding: 3px 10px; border-radius: 12px; background: #667eea; color: white; font-size: 12px;">${lead.stage || 'new'}</span></div>
                            <div><strong>Status:</strong> ${lead.status || 'active'}</div>
                            <div><strong>Product:</strong> ${lead.product || lead.product_interest || 'Commercial Auto'}</div>
                            <div><strong>Premium:</strong> $${lead.premium || '0'}</div>
                            <div><strong>Assigned:</strong> ${lead.assignedTo || lead.assigned_to || 'Unassigned'}</div>
                            <div><strong>Created:</strong> ${lead.created || lead.date || 'N/A'}</div>
                        </div>
                    </div>

                    <!-- Notes -->
                    ${lead.notes ? `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">
                            <i class="fas fa-sticky-note" style="color: #667eea; margin-right: 8px;"></i>
                            Notes
                        </h3>
                        <p style="margin: 0; white-space: pre-wrap;">${lead.notes}</p>
                    </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="if(window.editLead) editLead('${lead.id}')"
                                style="padding: 10px 20px; background: #667eea; color: white; border: none;
                                       border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="if(window.convertLead) convertLead('${lead.id}')"
                                style="padding: 10px 20px; background: #10b981; color: white; border: none;
                                       border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-user-check"></i> Convert to Client
                        </button>
                        <button onclick="if(window.deleteLead) deleteLead('${lead.id}')"
                                style="padding: 10px 20px; background: #dc2626; color: white; border: none;
                                       border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button onclick="document.getElementById('lead-profile-modal').remove()"
                                style="padding: 10px 20px; background: #6b7280; color: white; border: none;
                                       border-radius: 6px; cursor: pointer; font-weight: 600;">
                            Close
                        </button>
                    </div>
                </div>
            `;

            modal.appendChild(content);
            document.body.appendChild(modal);

            // Add animations
            if (!document.getElementById('lead-profile-animations')) {
                const style = document.createElement('style');
                style.id = 'lead-profile-animations';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            // Close on backdrop click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }

        console.log('✅ Ultimate eye icon fix applied!');
    }

    // Apply fix immediately
    applyUltimateFix();

    // Re-apply after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyUltimateFix);
    } else {
        setTimeout(applyUltimateFix, 100);
    }

    // Re-apply periodically to override any other scripts
    setInterval(() => {
        // Check if viewLead was overridden
        if (!window.viewLead || window.viewLead.toString().indexOf('Eye icon clicked') === -1) {
            console.log('🔧 viewLead was overridden, re-applying fix...');
            applyUltimateFix();
        }
    }, 2000);

    console.log('✅ ULTIMATE EYE ICON FIX - Ready!');
})();