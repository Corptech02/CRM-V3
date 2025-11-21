// Force Real Clients - Final Override to Load Real Clients from API
console.log('🔧 Forcing real clients to load from API...');

// Simple function to load and display real clients
async function loadRealClients() {
    console.log('📋 Loading REAL clients from API...');

    try {
        const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';
        const response = await fetch(`${API_URL}/api/clients`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const clients = await response.json();
        console.log(`✅ Loaded ${clients.length} real clients from API`);

        // CRITICAL: Save to localStorage so viewClient can find them
        localStorage.setItem('insurance_clients', JSON.stringify(clients));
        console.log(`💾 FORCE-REAL-CLIENTS: Saved ${clients.length} clients to localStorage`);

        if (clients.length === 0) {
            return `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                        <p style="font-size: 16px; margin: 0;">No clients found in API</p>
                        <p style="font-size: 14px; margin-top: 8px;">Check API connection</p>
                    </td>
                </tr>
            `;
        }

        // Generate client rows with real data
        return clients.map(client => {
            // Get initials for avatar
            const nameParts = (client.name || 'Unknown').split(' ').filter(n => n);
            const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';

            // Count policies
            const policyCount = client.policies ? client.policies.length : 0;

            // Format premium
            const premium = client.totalPremium || 0;
            const formattedPremium = typeof premium === 'number' ?
                `$${premium.toLocaleString()}` : '$0';

            return `
                <tr>
                    <td>
                        <div class="client-info">
                            <div class="client-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                ${initials}
                            </div>
                            <div>
                                <div class="client-name">${client.name || 'Unknown'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${client.phone || 'N/A'}</td>
                    <td>${client.email || 'N/A'}</td>
                    <td><span class="policy-count">${policyCount}</span></td>
                    <td>${formattedPremium}</td>
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

    } catch (error) {
        console.error('Error loading clients:', error);
        return `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i> Error loading clients: ${error.message}
                    <br>
                    <button onclick="forceReloadClients()" style="margin-top: 10px; padding: 5px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </td>
            </tr>
        `;
    }
}

// Force reload function
window.forceReloadClients = async function() {
    console.log('🔄 Force reloading clients...');
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin"></i> Loading real clients...
                </td>
            </tr>
        `;

        const rows = await loadRealClients();
        tbody.innerHTML = rows;
    }
};

// Override generateClientRows completely
window.generateClientRows = async function() {
    return await loadRealClients();
};

// Check and force load if on clients page
function checkAndForceLoadClients() {
    if (window.location.hash === '#clients') {
        const tbody = document.getElementById('clientsTableBody');
        if (tbody) {
            console.log('🔄 Detected clients page - forcing real client load...');
            setTimeout(() => {
                forceReloadClients();
            }, 500);
        }
    }
}

// Multiple triggers
document.addEventListener('DOMContentLoaded', checkAndForceLoadClients);
window.addEventListener('hashchange', checkAndForceLoadClients);

// Check periodically
setInterval(() => {
    if (window.location.hash === '#clients') {
        const tbody = document.getElementById('clientsTableBody');
        if (tbody && tbody.innerHTML.includes('No clients found')) {
            console.log('🔄 "No clients found" detected - forcing reload...');
            forceReloadClients();
        }
    }
}, 2000);

console.log('✅ Force real clients script loaded');