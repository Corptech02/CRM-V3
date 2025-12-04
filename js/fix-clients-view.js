// Fix clients view to show converted clients
console.log('Fixing clients view to show all clients...');

// Override the generateClientRows function to load from API
window.generateClientRows = async function() {
    // Get clients from API first, then localStorage as fallback
    let allClients = [];

    try {
        const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';
        const response = await fetch(`${API_URL}/api/clients`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (response.ok) {
            allClients = await response.json();
            console.log(`✅ Loaded ${allClients.length} real clients from API`);
        } else {
            throw new Error('API failed');
        }
    } catch (error) {
        console.warn('API error, falling back to localStorage:', error);
        // Fallback to localStorage
        const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const convertedClients = JSON.parse(localStorage.getItem('clients') || '[]');

        console.log('Insurance clients:', insuranceClients.length);
        console.log('Converted clients:', convertedClients.length);

        // Merge both arrays (avoid duplicates based on ID)
        allClients = [...insuranceClients];
        const existingIds = new Set(insuranceClients.map(c => String(c.id)));

        convertedClients.forEach(client => {
            if (!existingIds.has(String(client.id))) {
                allClients.push(client);
            }
        });
    }

    console.log('Total clients:', allClients.length);
    
    // Get current user and check if they are admin - filter clients for non-admin users
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
            console.log(`🔍 Fix-clients-view filtering - Current user: ${currentUser}, Is Admin: ${isAdmin}`);
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Filter clients based on user role
    if (!isAdmin && currentUser) {
        const originalCount = allClients.length;
        allClients = allClients.filter(client => {
            const assignedTo = client.assignedTo || client.agent || 'Grant'; // Default to Grant if no assignment
            return assignedTo.toLowerCase() === currentUser.toLowerCase();
        });
        console.log(`🔒 Fix-clients-view filtered: ${originalCount} -> ${allClients.length} (showing only ${currentUser}'s clients)`);
    } else if (isAdmin) {
        console.log(`👑 Fix-clients-view admin user - showing all ${allClients.length} clients`);
    }

    // If no clients, show a message
    if (allClients.length === 0) {
        return `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px; margin: 0;">No clients found</p>
                    <p style="font-size: 14px; margin-top: 8px;">Convert leads or add new clients to get started</p>
                </td>
            </tr>
        `;
    }
    
    // Generate rows for each client
    return allClients.map(client => {
        // Get initials for avatar
        const nameParts = (client.name || 'Unknown').split(' ').filter(n => n);
        const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';
        
        // Determine badge color based on type
        const typeColor = client.type === 'Commercial' ? 'purple' : 
                         client.policyType === 'Commercial Auto' ? 'purple' : 'blue';
        
        // Count policies (if available)
        const policyCount = client.policies ? client.policies.length : 0;
        
        // Format premium
        const premium = client.totalPremium || client.premium || 0;
        const formattedPremium = typeof premium === 'number' ? 
            `$${premium.toLocaleString()}` : premium;
        
        // Format status
        const status = client.status || client.policyStatus || 'Active';
        const statusClass = status === 'Active' ? 'status-active' : 
                           status === 'Pending' ? 'status-pending' : 'status-inactive';
        
        // Format type
        const clientType = client.type || client.policyType || 'Personal Lines';

        // Get assigned agent - check multiple possible locations
        const assignedTo = client.assignedTo ||
                          client.agent ||
                          client.assignedAgent ||
                          client.producer ||
                          'Grant'; // Default to Grant if no assignment

        return `
            <tr>
                <td>
                    <div class="client-info">
                        <div class="client-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            ${initials}
                        </div>
                        <div>
                            <div class="client-name">${client.name || 'Unknown'}</div>
                            ${client.convertedFrom ? '<span style="font-size: 11px; color: #10b981;">Converted Lead</span>' : ''}
                        </div>
                    </div>
                </td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.email || 'N/A'}</td>
                <td><span class="policy-count">${policyCount}</span></td>
                <td>${formattedPremium}</td>
                <td>${assignedTo}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewClient('${client.id}')" title="View Profile">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="editClient('${client.id}')" title="Edit Client">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="deleteClient('${client.id}')" title="Delete Client">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

// Also update the loadClientsView to use API data for the count
const originalLoadClientsView = window.loadClientsView;
window.loadClientsView = async function() {
    // Call original function
    if (originalLoadClientsView) {
        await originalLoadClientsView();
    }

    // Update count with API data
    setTimeout(async () => {
        let allClients = [];

        try {
            const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';
            const response = await fetch(`${API_URL}/api/clients`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (response.ok) {
                allClients = await response.json();
            } else {
                throw new Error('API failed');
            }
        } catch (error) {
            // Fallback to localStorage
            const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const convertedClients = JSON.parse(localStorage.getItem('clients') || '[]');

            allClients = [...insuranceClients];
            const existingIds = new Set(insuranceClients.map(c => String(c.id)));

            convertedClients.forEach(client => {
                if (!existingIds.has(String(client.id))) {
                    allClients.push(client);
                }
            });
        }

        const footerInfo = document.querySelector('.showing-info');
        if (footerInfo && allClients.length > 0) {
            footerInfo.textContent = `Showing 1-${Math.min(10, allClients.length)} of ${allClients.length} clients`;
        } else if (footerInfo) {
            footerInfo.textContent = 'No clients to display';
        }
    }, 100);
};

// Migrate converted clients to insurance_clients for consistency
function migrateClients() {
    const convertedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    
    if (convertedClients.length > 0) {
        console.log('Migrating', convertedClients.length, 'converted clients to insurance_clients');
        
        // Add converted clients to insurance_clients
        const existingIds = new Set(insuranceClients.map(c => String(c.id)));
        
        convertedClients.forEach(client => {
            if (!existingIds.has(String(client.id))) {
                // Ensure client has all required fields
                client.type = client.type || client.policyType || 'Personal Lines';
                client.status = client.status || client.policyStatus || 'Active';
                client.createdAt = client.createdAt || new Date().toISOString();
                insuranceClients.push(client);
            }
        });
        
        // Save updated insurance_clients
        localStorage.setItem('insurance_clients', JSON.stringify(insuranceClients));
        
        // Clear the old clients storage to avoid confusion
        localStorage.removeItem('clients');
        
        console.log('Migration complete. Total clients:', insuranceClients.length);
    }
}

// Run migration on load
migrateClients();

// If we're on the clients page, reload it
if (window.location.hash === '#clients') {
    setTimeout(() => {
        if (window.loadClientsView) {
            window.loadClientsView();
        }
    }, 100);
}

// Disabled - Using original viewClient from app.js
// Also fix the viewClient function to work with merged data
/*
const originalViewClient = window.viewClient;
window.viewClient = function(id) {
    console.log('Viewing client with ID:', id);
    
    // Get client from either storage location
    let client = null;
    
    // First check insurance_clients
    const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    client = insuranceClients.find(c => String(c.id) === String(id));
    
    // If not found, check clients storage
    if (!client) {
        const convertedClients = JSON.parse(localStorage.getItem('clients') || '[]');
        client = convertedClients.find(c => String(c.id) === String(id));
    }
    
    if (!client) {
        console.error('Client not found in either storage:', id);
        if (window.showNotification) {
            window.showNotification('Client not found', 'error');
        }
        return;
    }
    
    console.log('Found client:', client);
    
    // Call the original viewClient function if it exists
    if (originalViewClient) {
        // Temporarily add the client to insurance_clients so the original function can find it
        const tempClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const existingIndex = tempClients.findIndex(c => String(c.id) === String(id));
        if (existingIndex === -1) {
            tempClients.push(client);
            localStorage.setItem('insurance_clients', JSON.stringify(tempClients));
        }
        
        // Call original function - Make sure we're calling it correctly
        try {
            originalViewClient(id);
        } catch (error) {
            console.error('Error calling original viewClient:', error);
            // If original function fails, use our backup
            showClientProfileView(client);
        }
    } else {
        // If no original function, create our own view
        showClientProfileView(client);
    }
};
*/

// Disabled - Using original client profile from app.js
/*
// Create a client profile view if needed
function showClientProfileView(client) {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    dashboardContent.innerHTML = `
        <div class="client-profile-view">
            <header class="content-header">
                <div class="header-back">
                    <button class="btn-back" onclick="loadClientsView()">
                        <i class="fas fa-arrow-left"></i> Back to Clients
                    </button>
                    <h1>Client Profile</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editClient('${client.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-primary" onclick="addPolicyToClient('${client.id}')">
                        <i class="fas fa-file-contract"></i> Add Policy
                    </button>
                </div>
            </header>
            
            <div class="client-profile-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px;">
                <!-- Client Information Card -->
                <div class="profile-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-user"></i> Client Information</h3>
                    <div style="display: grid; gap: 15px;">
                        <div>
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Name</label>
                            <p style="font-size: 16px; margin: 5px 0;">${client.name || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Contact</label>
                            <p style="font-size: 16px; margin: 5px 0;">${client.contact || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Email</label>
                            <p style="font-size: 16px; margin: 5px 0;">${client.email || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Phone</label>
                            <p style="font-size: 16px; margin: 5px 0;">${client.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Type</label>
                            <p style="font-size: 16px; margin: 5px 0;">${client.type || client.policyType || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Status</label>
                            <p style="font-size: 16px; margin: 5px 0;">
                                <span class="status status-active">${client.status || client.policyStatus || 'Active'}</span>
                            </p>
                        </div>
                        ${client.convertedFrom ? `
                            <div>
                                <label style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Converted From</label>
                                <p style="font-size: 16px; margin: 5px 0;">
                                    <span style="color: #10b981;">Lead #${client.convertedFrom}</span>
                                </p>
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Converted Date</label>
                                <p style="font-size: 16px; margin: 5px 0;">${new Date(client.convertedDate || client.createdAt).toLocaleDateString()}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Notes Card -->
                <div class="profile-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-sticky-note"></i> Notes</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; min-height: 150px;">
                        <p style="color: #4b5563; margin: 0;">${client.notes || 'No notes available'}</p>
                    </div>
                </div>
                
                <!-- Policies Section -->
                <div class="profile-card" style="grid-column: 1 / -1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-file-contract"></i> Policies</h3>
                    ${client.policies && client.policies.length > 0 ? `
                        <table style="width: 100%;">
                            <thead>
                                <tr style="border-bottom: 1px solid #e5e7eb;">
                                    <th style="text-align: left; padding: 10px;">Policy Number</th>
                                    <th style="text-align: left; padding: 10px;">Type</th>
                                    <th style="text-align: left; padding: 10px;">Premium</th>
                                    <th style="text-align: left; padding: 10px;">Status</th>
                                    <th style="text-align: left; padding: 10px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${client.policies.map(policy => `
                                    <tr style="border-bottom: 1px solid #f3f4f6;">
                                        <td style="padding: 10px;">${policy.policyNumber || 'N/A'}</td>
                                        <td style="padding: 10px;">${policy.type || 'N/A'}</td>
                                        <td style="padding: 10px;">$${policy.premium || 0}</td>
                                        <td style="padding: 10px;">
                                            <span class="status status-active">${policy.status || 'Active'}</span>
                                        </td>
                                        <td style="padding: 10px;">
                                            <button class="btn-icon" title="View Policy">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <div style="text-align: center; padding: 40px; color: #9ca3af;">
                            <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                            <p>No policies found for this client</p>
                            <button class="btn-primary" style="margin-top: 10px;" onclick="addPolicyToClient('${client.id}')">
                                <i class="fas fa-plus"></i> Add First Policy
                            </button>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}
*/

console.log('Clients view fix applied - Type/Status removed, original viewClient preserved');