// Fix clients view to show converted clients
console.log('Fixing clients view to show all clients...');

// Override the generateClientRows function to load from API
window.generateClientRows = async function() {
    // Get clients from API first, then localStorage as fallback
    let allClients = [];

    try {
        const response = await fetch(`/api/clients?limit=500&offset=0`);

        if (response.ok) {
            const _apiData = await response.json();
            allClients = Array.isArray(_apiData) ? _apiData : (_apiData.clients || []);
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

    console.log('Total clients (raw):', allClients.length);

    // ── Deduplicate clients ──────────────────────────────────────────────────
    // Pass 1: name+DOB identity key dedup
    const _seenKeys = new Set();
    const _uniqueAll = [];
    allClients.forEach(c => {
        const dob = c.dateOfBirth || c['Date of Birth'] || '';
        const n   = (c.name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        const key = (n && dob) ? `${n}|${dob}` : n;
        if (key && !_seenKeys.has(key)) { _seenKeys.add(key); _uniqueAll.push(c); }
        else if (!key) { _uniqueAll.push(c); }
    });

    // Pass 2: suppress business-name-only records (LLC, Inc, Trucking, etc.)
    // when a real person client already claims that business name or shares the same phone.
    const _BIZ_RE  = /\b(llc|l\.l\.c|inc|incorporated|corp|corporation|ltd|limited|lp|l\.p|trucking|transport|transportation|logistics|hauling|construction|farms|enterprises|services|solutions|towing)\b/i;
    const _isBiz   = (c) => _BIZ_RE.test(c.name || '');
    const _np      = (ph) => (ph || '').replace(/\D/g, '');
    const _nb      = (s)  => (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    const _pBizKeys = new Set();
    const _pPhones  = new Set();
    _uniqueAll.forEach(c => {
        if (_isBiz(c)) return;
        if (c.businessName) _pBizKeys.add(_nb(c.businessName));
        const ph = _np(c.phone); if (ph.length >= 10) _pPhones.add(ph);
    });
    const _suppressed = new Set();
    _uniqueAll.forEach(c => {
        if (!_isBiz(c)) return;
        const bk = _nb(c.name), ph = _np(c.phone);
        if ((bk && _pBizKeys.has(bk)) || (ph.length >= 10 && _pPhones.has(ph))) _suppressed.add(String(c.id));
    });

    // Pass 3: person-name dedup by phone — keep mixed-case over ALL-CAPS, else older id
    const _phoneGrp = {};
    _uniqueAll.forEach(c => {
        if (_isBiz(c) || _suppressed.has(String(c.id))) return;
        const ph = _np(c.phone); if (ph.length < 10) return;
        if (!_phoneGrp[ph]) _phoneGrp[ph] = [];
        _phoneGrp[ph].push(c);
    });
    Object.values(_phoneGrp).forEach(grp => {
        if (grp.length < 2) return;
        const sorted = [...grp].sort((a, b) => {
            const aC = (a.name||'') === (a.name||'').toUpperCase();
            const bC = (b.name||'') === (b.name||'').toUpperCase();
            if (aC !== bC) return aC ? 1 : -1;
            return String(a.id) < String(b.id) ? -1 : 1;
        });
        sorted.slice(1).forEach(c => _suppressed.add(String(c.id)));
    });

    allClients = _uniqueAll.filter(c => !_suppressed.has(String(c.id)));
    console.log(`Total clients after dedup: ${allClients.length} (suppressed ${_suppressed.size} dupes)`);
    // ────────────────────────────────────────────────────────────────────────

    // Get current user and check if they are admin - filter clients for non-admin users
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    let isCsrUser = false;
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
            isCsrUser = (user.role || '') === 'csr';
            console.log(`🔍 Fix-clients-view filtering - Current user: ${currentUser}, Is Admin: ${isAdmin}, Is CSR: ${isCsrUser}`);
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Filter clients based on user role — CSR sees all clients (gated by search in UI)
    if (!isAdmin && !isCsrUser && currentUser) {
        const originalCount = allClients.length;
        allClients = allClients.filter(client => {
            const assignedTo = client.assignedTo || client.agent || 'Grant'; // Default to Grant if no assignment
            return assignedTo.toLowerCase() === currentUser.toLowerCase();
        });
        console.log(`🔒 Fix-clients-view filtered: ${originalCount} -> ${allClients.length} (showing only ${currentUser}'s clients)`);
    } else if (isAdmin) {
        console.log(`👑 Fix-clients-view admin user - showing all ${allClients.length} clients`);
    } else if (isCsrUser) {
        console.log(`🎧 Fix-clients-view CSR user - showing all ${allClients.length} clients (search-gated)`);
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
                            <div class="client-name">${client.fullName || client.name || 'Unknown'}</div>
                            ${client.convertedFrom ? '<span style="font-size: 11px; color: #10b981;">Converted Lead</span>' : ''}
                        </div>
                    </div>
                </td>
                <td>${client.phone && client.phone !== 'N/A' ?
                        `<span class="clickable-wrapper"><span class="clickable-phone" data-phone="${client.phone}" title="Double-click to dial ${client.phone}" style="cursor: pointer; text-decoration: underline dotted rgb(0, 102, 204);">${client.phone}</span></span>` :
                        'N/A'
                    }</td>
                <td>${client.email && client.email !== 'N/A' ?
                        `<span class="clickable-wrapper"><span class="clickable-email" data-email="${client.email}" title="Double-click to compose email to ${client.email}" style="cursor: pointer; text-decoration: underline dotted rgb(0, 102, 204);">${client.email}</span></span>` :
                        'N/A'
                    }</td>
                <td><span class="policy-count">${policyCount}</span></td>
                <td>${formattedPremium}</td>
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
            const response = await fetch(`/api/clients?limit=500&offset=0`);

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