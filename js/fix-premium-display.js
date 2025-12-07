// Fix Premium Display in Clients Management
console.log('Fixing premium display in clients management...');

// Override loadClientsView to use the proper implementation
window.loadClientsView = function() {
    console.log('Loading clients view with proper premium calculation...');
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    // Get all policies first for premium calculation
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log('Total policies in storage:', allPolicies.length);

    dashboardContent.innerHTML = `
        <div class="clients-view">
            <header class="content-header">
                <h1>Clients Management</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="importClients()">
                        <i class="fas fa-upload"></i> Import
                    </button>
                    <button class="btn-primary" onclick="showNewClient()">
                        <i class="fas fa-plus"></i> New Client
                    </button>
                </div>
            </header>

            <div class="filters-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search clients by name, phone, email..." id="clientSearch" onkeyup="filterClients()">
                </div>
                <div class="filter-group">
                    <select class="filter-select">
                        <option>All Types</option>
                        <option>Personal Lines</option>
                        <option>Commercial Lines</option>
                        <option>Commercial Auto</option>
                        <option>Life & Health</option>
                    </select>
                    <select class="filter-select">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Prospect</option>
                        <option>Inactive</option>
                    </select>
                    <button class="btn-filter">
                        <i class="fas fa-filter"></i> More Filters
                    </button>
                </div>
            </div>

            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Client Name <i class="fas fa-sort"></i></th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Policies</th>
                            <th>Premium</th>
                            <th>Assigned to</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clientsTableBody">
                        ${generateClientRowsWithPremium()}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// Generate client rows with proper premium calculation
function generateClientRowsWithPremium() {
    // Get clients from localStorage
    let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');

    // Get current user and check if they are admin - filter clients for non-admin users
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
            console.log(`🔒 Client filtering - Current user: ${currentUser}, Is Admin: ${isAdmin}`);
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Remove duplicates based on name
    const uniqueClients = [];
    const seenNames = new Set();

    clients.forEach(client => {
        const name = (client.name || '').toUpperCase().trim();
        if (name && !seenNames.has(name)) {
            seenNames.add(name);
            uniqueClients.push(client);
        }
    });

    clients = uniqueClients;
    console.log('Found unique clients:', clients.length);

    // Filter clients based on user role
    if (!isAdmin && currentUser) {
        const originalCount = clients.length;
        clients = clients.filter(client => {
            const assignedTo = client.assignedTo ||
                              client.agent ||
                              client.assignedAgent ||
                              client.producer ||
                              'Grant'; // Default to Grant if no assignment
            return assignedTo.toLowerCase() === currentUser.toLowerCase();
        });
        console.log(`🔒 Filtered clients: ${originalCount} -> ${clients.length} (showing only ${currentUser}'s clients)`);
    } else if (isAdmin) {
        console.log(`🔒 Admin user - showing all ${clients.length} clients`);
    }

    if (clients.length === 0) {
        return `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px; margin: 0;">No clients found</p>
                    <p style="font-size: 14px; margin-top: 8px;">Convert leads or add new clients to get started</p>
                </td>
            </tr>
        `;
    }

    // Get all policies for premium calculation
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Generate rows for each client
    return clients.map(client => {
        // Ensure client has an ID - generate one if missing
        if (!client.id) {
            // Generate a unique ID based on name and timestamp
            const clientName = client.name || client.companyName || client.businessName || `client_${Date.now()}`;
            const nameId = clientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            client.id = `client_${nameId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`📝 Generated ID for client ${clientName}: ${client.id}`);

            // Update localStorage to persist the ID
            const allClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const clientIndex = allClients.findIndex(c => c.name === client.name);
            if (clientIndex !== -1) {
                allClients[clientIndex].id = client.id;
                localStorage.setItem('insurance_clients', JSON.stringify(allClients));
                console.log(`💾 Saved ID for ${client.name} to localStorage`);
            }
        }

        // Get initials for avatar
        const nameParts = (client.name || 'Unknown').split(' ').filter(n => n);
        const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';

        // Find all policies for this client - ONLY use fresh data
        const clientPolicies = allPolicies.filter(policy => {
            // Check if policy belongs to this client by clientId
            if (policy.clientId && String(policy.clientId) === String(client.id)) {
                console.log(`Policy ${policy.policyNumber} matched by clientId for ${client.name}`);
                return true;
            }

            // Check if the insured name matches
            const insuredName = policy.insured?.['Name/Business Name'] ||
                               policy.insured?.['Primary Named Insured'] ||
                               policy.insuredName;
            if (insuredName && client.name && insuredName.toLowerCase() === client.name.toLowerCase()) {
                console.log(`Policy ${policy.policyNumber} matched by name for ${client.name}`);
                return true;
            }

            return false;
        });

        const policyCount = clientPolicies.length;
        console.log(`Client ${client.name}: Found ${policyCount} policies`);

        // Calculate total premium from policies
        let totalPremium = 0;
        clientPolicies.forEach(policy => {
            // Check ALL possible premium field locations
            let premiumValue = 0;

            // Check financial object
            if (policy.financial) {
                premiumValue = policy.financial['Annual Premium'] ||
                              policy.financial['Premium'] ||
                              policy.financial.annualPremium ||
                              policy.financial.premium ||
                              0;
                console.log(`  Policy ${policy.policyNumber}: financial.* = ${premiumValue}`);
            }

            // Check top-level fields if not found in financial
            if (!premiumValue) {
                premiumValue = policy['Annual Premium'] ||
                              policy.Premium ||
                              policy.premium ||
                              policy.annualPremium ||
                              0;
                console.log(`  Policy ${policy.policyNumber}: top-level = ${premiumValue}`);
            }

            // Convert to number
            const numericPremium = typeof premiumValue === 'string' ?
                parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 :
                parseFloat(premiumValue) || 0;

            console.log(`  Policy ${policy.policyNumber}: Final premium = ${numericPremium}`);
            totalPremium += numericPremium;
        });

        // Format premium display
        const premiumDisplay = totalPremium > 0 ? `$${totalPremium.toLocaleString()}/yr` : '-';
        console.log(`Client ${client.name}: Total Premium = ${totalPremium} -> Display = ${premiumDisplay}`);

        // Get assigned agent
        const assignedTo = client.assignedTo || client.agent || client.assignedAgent || client.producer || 'Grant';

        // Debug client ID for viewClient functionality
        console.log(`👤 Generating button for client: ${client.name} with ID: ${client.id} (type: ${typeof client.id})`);

        return `
            <tr>
                <td class="client-name">
                    <div class="client-avatar">${initials}</div>
                    <span>${client.name}</span>
                </td>
                <td>${client.phone || '-'}</td>
                <td>${client.email || '-'}</td>
                <td>${policyCount}</td>
                <td>${premiumDisplay}</td>
                <td>${assignedTo}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="console.log('🔍 Eye button clicked for client:', '${client.id}'); viewClient('${client.id}')" title="View Client"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="editClient('${client.id}')" title="Edit Client"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="emailClient('${client.id}')" title="Email Client"><i class="fas fa-envelope"></i></button>
                        <button class="btn-icon" onclick="deleteClient('${client.id}')" title="Delete Client" style="color: #dc2626;"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// If we're on the clients page, reload it
setTimeout(() => {
    if (window.location.hash === '#clients') {
        console.log('Reloading clients view with fixed premium display...');
        loadClientsView();
    }
}, 500);

console.log('Premium display fix applied');