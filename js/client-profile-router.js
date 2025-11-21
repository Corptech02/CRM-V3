// Handle direct client profile navigation
(function() {
    console.log('Client Profile Router initialized');

    // Function to load a specific client profile
    async function loadClientProfile(clientId) {
        console.log('Loading client profile for ID:', clientId);

        try {
            // First check sessionStorage for the client data
            let client = null;
            const storedData = sessionStorage.getItem('viewClientData');
            const storedId = sessionStorage.getItem('viewClientId');

            if (storedData && storedId === clientId) {
                client = JSON.parse(storedData);
                console.log('Using cached client data:', client.name);
            } else {
                // Fetch from API if not in session
                console.log('Fetching client from API...');
                const response = await fetch('/api/clients');
                if (response.ok) {
                    const clients = await response.json();
                    client = clients.find(c => String(c.id) === String(clientId));
                }
            }

            if (!client) {
                console.error('Client not found:', clientId);
                // Redirect to clients list
                window.location.hash = '#clients';
                return;
            }

            // Load the clients view first (to get the UI structure)
            if (typeof loadClientsView === 'function') {
                await loadClientsView();
            }

            // Wait a moment for the view to load
            setTimeout(() => {
                // Now show the specific client profile
                if (typeof window.showClientProfile === 'function') {
                    window.showClientProfile(client);
                } else if (typeof window.createEnhancedProfile === 'function') {
                    window.createEnhancedProfile(client);
                } else {
                    // Create a basic profile view
                    showBasicClientProfile(client);
                }
            }, 500);

        } catch (error) {
            console.error('Error loading client profile:', error);
            window.location.hash = '#clients';
        }
    }

    // Basic client profile display
    function showBasicClientProfile(client) {
        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;

        // Fetch policies for this client
        fetch(`/api/clients/search?phone=${client.phone.replace(/\D/g, '')}`)
            .then(response => response.json())
            .then(data => {
                const policies = data.policies || [];

                dashboardContent.innerHTML = `
                    <div class="client-profile-container" style="padding: 20px;">
                        <div class="profile-header" style="margin-bottom: 20px;">
                            <button onclick="window.location.hash='#clients'" style="
                                margin-bottom: 15px;
                                padding: 10px 20px;
                                background: #6366f1;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                            ">
                                <i class="fas fa-arrow-left"></i> Back to Clients
                            </button>

                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h1 style="color: #1f2937; margin: 0 0 10px 0;">
                                    <i class="fas fa-user-circle"></i> ${client.name || 'Unknown Client'}
                                </h1>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                                    ${client.phone ? `
                                        <div>
                                            <span style="color: #6b7280; font-size: 12px;">Phone</span>
                                            <div style="font-weight: 600; color: #1f2937;">
                                                <i class="fas fa-phone" style="color: #10b981;"></i> ${client.phone}
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${client.email ? `
                                        <div>
                                            <span style="color: #6b7280; font-size: 12px;">Email</span>
                                            <div style="font-weight: 600; color: #1f2937;">
                                                <i class="fas fa-envelope" style="color: #3b82f6;"></i> ${client.email}
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${client.status ? `
                                        <div>
                                            <span style="color: #6b7280; font-size: 12px;">Status</span>
                                            <div style="font-weight: 600; color: #1f2937;">
                                                <span style="
                                                    background: ${client.status === 'Active' ? '#10b981' : '#6b7280'};
                                                    color: white;
                                                    padding: 2px 8px;
                                                    border-radius: 4px;
                                                    font-size: 12px;
                                                ">${client.status}</span>
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${client.assignedTo ? `
                                        <div>
                                            <span style="color: #6b7280; font-size: 12px;">Assigned To</span>
                                            <div style="font-weight: 600; color: #1f2937;">
                                                <i class="fas fa-user" style="color: #6366f1;"></i> ${client.assignedTo}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        ${policies.length > 0 ? `
                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h2 style="color: #1f2937; margin: 0 0 15px 0;">
                                    <i class="fas fa-file-contract"></i> Active Policies (${policies.length})
                                </h2>
                                <div style="display: grid; gap: 15px;">
                                    ${policies.map(policy => `
                                        <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px;">
                                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                                                <div>
                                                    <span style="color: #6b7280; font-size: 11px;">Policy Number</span>
                                                    <div style="font-weight: 600; color: #1f2937; font-size: 14px;">
                                                        ${policy.policyNumber || 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span style="color: #6b7280; font-size: 11px;">Carrier</span>
                                                    <div style="font-weight: 600; color: #1f2937; font-size: 14px;">
                                                        ${policy.carrier || 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span style="color: #6b7280; font-size: 11px;">Type</span>
                                                    <div style="font-weight: 600; color: #1f2937; font-size: 14px;">
                                                        ${policy.policyType ? policy.policyType.replace('-', ' ').toUpperCase() : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span style="color: #6b7280; font-size: 11px;">Premium</span>
                                                    <div style="font-weight: 600; color: #059669; font-size: 14px;">
                                                        $${(policy.premium || policy.annualPremium || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span style="color: #6b7280; font-size: 11px;">Expires</span>
                                                    <div style="font-weight: 600; color: #dc2626; font-size: 14px;">
                                                        ${policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div style="margin-top: 20px; display: flex; gap: 10px;">
                            <button onclick="window.location.hash='#clients'" style="
                                padding: 12px 24px;
                                background: #6b7280;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-weight: 600;
                            ">
                                <i class="fas fa-list"></i> View All Clients
                            </button>
                        </div>
                    </div>
                `;
            })
            .catch(error => {
                console.error('Error fetching policies:', error);
            });
    }

    // Handle hash changes
    function handleHashChange() {
        const hash = window.location.hash;

        // Check if it's a client profile URL
        if (hash.startsWith('#client/')) {
            const clientId = hash.replace('#client/', '');
            if (clientId) {
                loadClientProfile(clientId);
            }
        }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Check on page load
    document.addEventListener('DOMContentLoaded', handleHashChange);

    // Also check immediately in case DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        handleHashChange();
    }

    console.log('Client Profile Router ready');
})();