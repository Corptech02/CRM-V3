// Vanguard Insurance Software - Main Application JavaScript

// Global variables

// Function to load leads from server and filter out archived
async function loadLeadsFromServer() {
    try {
        console.log('Loading leads from server...');
        const response = await fetch('/api/leads');
        if (response.ok) {
            const serverLeads = await response.json();
            console.log(`Loaded ${serverLeads.length} leads from server`);

            // Get existing archived leads from localStorage to preserve archive status
            const existingLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const existingArchived = JSON.parse(localStorage.getItem('archivedLeads') || '[]');

            // Create a map of archived lead IDs for quick lookup
            const archivedIds = new Set();
            existingArchived.forEach(lead => archivedIds.add(String(lead.id)));
            existingLeads.forEach(lead => {
                if (lead.archived === true) {
                    archivedIds.add(String(lead.id));
                }
            });

            // Update server leads with archived status from local storage
            const mergedLeads = serverLeads.map(serverLead => {
                // SPECIAL PROTECTION: Never archive ViciDial leads unless explicitly archived by user
                if (serverLead.source === 'ViciDial') {
                    // Only mark as archived if explicitly set in database, not from localStorage
                    if (serverLead.archived !== true && serverLead.archived !== 1) {
                        serverLead.archived = false;
                        console.log(`🛡️ PROTECTING ViciDial lead from archival: ${serverLead.id} - ${serverLead.name}`);
                    }
                } else {
                    // For non-ViciDial leads, check if this lead was previously archived
                    if (archivedIds.has(String(serverLead.id))) {
                        serverLead.archived = true;
                        console.log(`Preserving archived status for lead ${serverLead.id} - ${serverLead.name}`);
                    }
                }
                return serverLead;
            });

            // Filter out archived leads for display
            const activeLeads = mergedLeads.filter(lead => !lead.archived);
            console.log(`Found ${activeLeads.length} active leads after filtering ${archivedIds.size} archived`);

            // CRITICAL: Complete separation - archived leads should NEVER be in insurance_leads
            const permanentArchive = JSON.parse(localStorage.getItem('PERMANENT_ARCHIVED_IDS') || '[]');
            const activeLeadsOnly = mergedLeads.filter(lead =>
                !lead.archived &&
                !permanentArchive.includes(String(lead.id)) &&
                !archivedIds.has(String(lead.id))
            );
            const archivedLeadsOnly = mergedLeads.filter(lead =>
                lead.archived === true ||
                permanentArchive.includes(String(lead.id)) ||
                archivedIds.has(String(lead.id))
            );

            // Special handling for ViciDial leads - ensure they're never accidentally filtered
            const vicidialLeads = mergedLeads.filter(lead =>
                lead.source === 'ViciDial' &&
                !lead.archived &&
                !permanentArchive.includes(String(lead.id)) &&
                !archivedIds.has(String(lead.id))
            );

            if (vicidialLeads.length > 0) {
                console.log(`⚠️ PRESERVING ${vicidialLeads.length} ViciDial leads:`, vicidialLeads.map(l => `${l.id} - ${l.name}`));
            }

            // Update localStorage - COMPLETE SEPARATION
            localStorage.setItem('insurance_leads', JSON.stringify(activeLeadsOnly)); // ONLY ACTIVE

            // Update archived leads storage
            const archivedLeads = archivedLeadsOnly; // Rename for compatibility
            if (archivedLeads.length > 0) {
                localStorage.setItem('archivedLeads', JSON.stringify(archivedLeads));

                // Save archived status back to server for leads that don't have it yet
                archivedLeads.forEach(lead => {
                    fetch('/api/leads', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(lead)
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log(`Saved archived status for lead ${lead.id} to server`);
                    })
                    .catch(error => {
                        console.error(`Failed to save archived status for lead ${lead.id}:`, error);
                    });
                });
            }

            console.log(`✅ Server leads synchronized: ${activeLeadsOnly.length} active, ${archivedLeadsOnly.length} archived`);

            // Refresh leads display if we're on the leads page
            if (window.location.pathname === '/' || window.location.hash === '#leads') {
                console.log('🔄 Refreshing leads display after server sync');
                if (typeof displayLeads === 'function') {
                    displayLeads();
                }
            }
        }
    } catch (error) {
        console.error('Failed to load leads from server:', error);
        // Fall back to localStorage data if server fails
    }
}

// Function to load clients from server and sync with localStorage
async function loadClientsFromServer(limit = 500) {
    try {
        console.log('Loading clients from server...');
        const response = await fetch(`/api/clients?limit=${limit}&offset=0`);
        if (response.ok) {
            const data = await response.json();

            // Handle both old format (array) and new format (object with clients array)
            let serverClients;
            let totalCount;

            if (Array.isArray(data)) {
                // Old format - direct array
                serverClients = data;
                totalCount = data.length;
            } else {
                // New paginated format
                serverClients = data.clients || [];
                totalCount = data.total || serverClients.length;
            }

            console.log(`Loaded ${serverClients.length} clients from server (total: ${totalCount})`);

            // Store in localStorage for caching
            localStorage.setItem('insurance_clients', JSON.stringify(serverClients));

            // Store pagination info for later use
            if (data.total) {
                localStorage.setItem('clients_total_count', data.total.toString());
                localStorage.setItem('clients_has_more', data.hasMore ? 'true' : 'false');
            }

            console.log('Server clients synchronized successfully');
            return serverClients;
        } else {
            console.log('Failed to load clients from server, using localStorage');
            return JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        }
    } catch (error) {
        console.error('Failed to load clients from server:', error);
        // Fall back to localStorage data if server fails
        return JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    }
}

// Function to update the clients footer information
function updateClientsFooterInfo() {
    const showingInfo = document.getElementById('clientsShowingInfo');
    const pagination = document.getElementById('clientsPagination');

    if (!showingInfo) return;

    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const totalCount = localStorage.getItem('clients_total_count');
    const hasMore = localStorage.getItem('clients_has_more') === 'true';

    const displayedCount = clients.length;
    const totalText = totalCount ? ` of ${parseInt(totalCount).toLocaleString()}` : '';

    showingInfo.textContent = `Showing ${displayedCount.toLocaleString()}${totalText} clients`;

    // Add "Load More" button if there are more clients to load
    if (pagination && hasMore && totalCount && displayedCount < parseInt(totalCount)) {
        pagination.innerHTML = `
            <button class="btn-secondary" onclick="loadMoreClients()" id="loadMoreClientsBtn">
                <i class="fas fa-plus"></i> Load More Clients
            </button>
        `;
    } else if (pagination) {
        pagination.innerHTML = '';
    }
}

// Function to load more clients from server
async function loadMoreClients() {
    const currentClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const loadMoreBtn = document.getElementById('loadMoreClientsBtn');

    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading More...';
        loadMoreBtn.disabled = true;
    }

    try {
        const response = await fetch(`/api/clients?limit=500&offset=${currentClients.length}`);
        if (response.ok) {
            const data = await response.json();
            const newClients = data.clients || [];

            if (newClients.length > 0) {
                // Append new clients to existing ones
                const allClients = [...currentClients, ...newClients];
                localStorage.setItem('insurance_clients', JSON.stringify(allClients));

                // Update pagination info
                localStorage.setItem('clients_has_more', data.hasMore ? 'true' : 'false');

                // Refresh the table
                const tbody = document.getElementById('clientsTableBody');
                if (tbody) {
                    tbody.innerHTML = generateClientRows(1);
                }

                // Update footer info
                updateClientsFooterInfo();

                console.log(`Loaded ${newClients.length} more clients. Total: ${allClients.length}`);
            }
        }
    } catch (error) {
        console.error('Failed to load more clients:', error);
    }

    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More Clients';
        loadMoreBtn.disabled = false;
    }
}

// Global function to clean up any duplicate leads
function cleanupDuplicateLeads() {
    console.log('Running global duplicate cleanup...');

    const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
    const permanentArchive = JSON.parse(localStorage.getItem('PERMANENT_ARCHIVED_IDS') || '[]');
    const allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

    // Build set of archived identifiers
    const archivedIds = new Set();
    const archivedPhones = new Set();
    const archivedEmails = new Set();

    // Add permanent archive IDs - these are NEVER allowed in active list
    permanentArchive.forEach(id => {
        archivedIds.add(String(id));
    });

    archivedLeads.forEach(lead => {
        archivedIds.add(String(lead.id));
        if (lead.phone) archivedPhones.add(lead.phone.replace(/\D/g, ''));
        if (lead.email) archivedEmails.add(lead.email.toLowerCase());
    });

    let cleanedCount = 0;

    // Clean the main leads list
    const cleanedLeads = allLeads.map(lead => {
        // If this lead matches ANY archived identifier, mark it as archived
        if (archivedIds.has(String(lead.id)) ||
            (lead.phone && archivedPhones.has(lead.phone.replace(/\D/g, ''))) ||
            (lead.email && archivedEmails.has(lead.email.toLowerCase()))) {

            if (!lead.archived) {
                lead.archived = true;
                cleanedCount++;
                console.log(`Cleanup: Marked lead as archived: ${lead.id} - ${lead.name}`);
            }
        }
        return lead;
    });

    if (cleanedCount > 0) {
        localStorage.setItem('insurance_leads', JSON.stringify(cleanedLeads));
        console.log(`Cleanup complete: Fixed ${cleanedCount} leads that should have been archived`);

        // Only refresh if on leads page AND view has already loaded (prevent race condition)
        if ((window.location.hash === '#leads' || window.location.hash === '#leads-management') &&
            document.querySelector('.leads-view') &&
            typeof loadLeadsView === 'function') {

            // Debounce to prevent rapid refreshes
            clearTimeout(window.leadsRefreshTimeout);
            window.leadsRefreshTimeout = setTimeout(() => {
                loadLeadsView();
            }, 1000);
        }
    } else {
        console.log('Cleanup complete: No duplicates found');
    }
}

// One-time cleanup to completely separate archived and active leads
function oneTimeArchiveSeparation() {
    console.log('Running one-time archive separation...');

    const allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
    const permanentArchive = JSON.parse(localStorage.getItem('PERMANENT_ARCHIVED_IDS') || '[]');

    // Build complete set of archived IDs
    const archivedIds = new Set();
    permanentArchive.forEach(id => archivedIds.add(String(id)));
    archivedLeads.forEach(lead => archivedIds.add(String(lead.id)));

    // Separate leads
    const activeOnly = [];
    const archivedOnly = [];

    allLeads.forEach(lead => {
        if (lead.archived === true || archivedIds.has(String(lead.id))) {
            // This is archived - should NOT be in insurance_leads
            archivedOnly.push(lead);
            console.log(`Moving to archived: ${lead.id} - ${lead.name}`);
        } else {
            // This is active
            activeOnly.push(lead);
        }
    });

    // Combine archived from both sources
    const allArchivedLeads = [...archivedLeads];
    archivedOnly.forEach(lead => {
        if (!allArchivedLeads.find(l => String(l.id) === String(lead.id))) {
            allArchivedLeads.push(lead);
        }
    });

    // Save separated data
    localStorage.setItem('insurance_leads', JSON.stringify(activeOnly));
    localStorage.setItem('archivedLeads', JSON.stringify(allArchivedLeads));

    console.log(`Separation complete: ${activeOnly.length} active, ${allArchivedLeads.length} archived`);
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Initializing app');

    // Run one-time separation
    oneTimeArchiveSeparation();

    // Run initial cleanup
    cleanupDuplicateLeads();

    // Check if we have existing local data before loading from server
    const existingLeads = localStorage.getItem('insurance_leads');
    const existingArchived = localStorage.getItem('archivedLeads');

    // Load from server to ensure ViciDial and other server-added leads are visible
    // This ensures newly added ViciDial leads appear immediately after being synced
    loadLeadsFromServer().then(() => {
        console.log('✅ Initial server sync completed - ViciDial leads preserved');
    });

    // Run cleanup less frequently to avoid interference
    setInterval(() => {
        cleanupDuplicateLeads();
    }, 300000); // Every 5 minutes instead of 30 seconds

    // Initialize components
    initializeEventListeners();
    initializeAutomation();
    
    // Initialize renewals after a delay
    setTimeout(() => {
        loadUpcomingRenewals();
    }, 500);
    
    // Refresh renewals periodically
    setInterval(() => {
        loadUpcomingRenewals();
    }, 60000); // Every minute
    
    // Load dashboard immediately if on dashboard
    if (!window.location.hash || window.location.hash === '' || window.location.hash === '#dashboard') {
        console.log('Loading dashboard on page load');
        loadContent('#dashboard');
    }
    
    // BASIC APPROACH - Let browser handle hash changes naturally without any click handlers
    
    // Handle initial hash
    if (window.location.hash) {
        console.log('Initial hash:', window.location.hash);
        setTimeout(() => {
            loadContent(window.location.hash);
            updateActiveMenuItem(window.location.hash);
        }, 100);
    } else {
        // Load dashboard by default
        setTimeout(() => {
            loadDashboardView();
            updateActiveMenuItem('#dashboard');
        }, 100);
    }
});

// Ensure To-Do box is added when page is fully loaded
window.addEventListener('load', function() {
    setTimeout(() => {
        const hash = window.location.hash || '#dashboard';
        if (hash === '#dashboard' || hash === '') {
            loadDashboardView();
        }
    }, 500);
});

// COI Management View
function loadCOIView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="coi-management">
            <div class="page-header">
                <h1>COI Management</h1>
                <p>Manage Certificates of Insurance requests and policies</p>
            </div>

            <div class="coi-container">
                <!-- Left Panel - Policy Profile Viewer -->
                <div class="coi-left-panel">
                    <div class="panel-header">
                        <h3><i class="fas fa-file-contract"></i> Policy Profiles</h3>
                        <button class="btn-primary btn-small" onclick="refreshPolicies()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                    <div id="policyViewer" class="policy-viewer">
                        <div class="policy-list" id="policyList">
                            <!-- Policy list will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Right Panel - COI Email Inbox -->
                <div class="coi-right-panel">
                    <div class="panel-header">
                        <h3><i class="fas fa-inbox"></i> COI Request Inbox</h3>
                        <div class="inbox-actions">
                            <button class="btn-secondary btn-small" onclick="filterCOIEmails('unread')">
                                <i class="fas fa-envelope"></i> Unread
                            </button>
                            <button class="btn-secondary btn-small" onclick="filterCOIEmails('all')">
                                <i class="fas fa-list"></i> All
                            </button>
                        </div>
                    </div>
                    <div class="coi-inbox" id="coiInbox">
                        <!-- Email list will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load initial data - use localStorage policies instead of API
    if (window.loadRealPolicyList) {
        window.loadRealPolicyList();
    }

    // Load emails with slight delay to avoid blocking UI
    setTimeout(() => {
        if (document.getElementById('coiInbox')) {
            loadCOIInbox();
        }
    }, 500);
}

// Load Policy List
function loadPolicyList() {
    const policyList = document.getElementById('policyList');
    if (!policyList) return;

    console.log('📋 Loading policies from localStorage...');

    // Load policies from localStorage immediately
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log(`✅ Loaded ${policies.length} policies from localStorage`);

    if (policies.length === 0) {
        policyList.innerHTML = `
            <table class="policy-table">
                <thead>
                    <tr>
                        <th>Policy #</th>
                        <th>Client</th>
                        <th>Type</th>
                        <th>Coverage</th>
                        <th>Expiry</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                            <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px;"></i>
                            <p>No policies found</p>
                            <button class="btn-primary" onclick="addNewPolicy()" style="margin-top: 16px;">
                                <i class="fas fa-plus"></i> Add Policy
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
        return;
    }

    // Build the table with real data
    const tableHTML = `
        <table class="policy-table">
            <thead>
                <tr>
                    <th>Policy #</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Coverage</th>
                    <th>Expiry</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${policies.map(policy => {
                        // Format the expiration date
                        const expiryDate = new Date(policy.expirationDate || policy.expiration_date || policy.expiryDate);
                        const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric'
                        });

                        // Determine status based on expiration
                        const today = new Date();
                        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
                        let statusClass = 'status-active';
                        if (daysUntilExpiry < 0) {
                            statusClass = 'status-expired';
                        } else if (daysUntilExpiry < 30) {
                            statusClass = 'status-warning';
                        }

                        // Format coverage amount
                        let coverage = policy.coverage?.['Liability Limits'] ||
                                      policy.premium ||
                                      policy.annualPremium ||
                                      policy.coverageDisplay ||
                                      'N/A';

                        if (typeof coverage === 'string') {
                            coverage = coverage.replace(/[$,]/g, '');
                        }

                        const num = parseFloat(coverage);
                        if (!isNaN(num)) {
                            if (num >= 1000000) {
                                coverage = `$${(num / 1000000).toFixed(0)}M`;
                            } else if (num >= 1000) {
                                coverage = `$${(num / 1000).toFixed(0)}K`;
                            } else {
                                coverage = `$${num}`;
                            }
                        }

                        // Get client name using same logic as Policy Management tab
                        let clientName = 'N/A';

                        // PRIORITY 1: Check Named Insured tab data first (most accurate)
                        if (policy.insured?.['Name/Business Name']) {
                            clientName = policy.insured['Name/Business Name'];
                        } else if (policy.insured?.['Primary Named Insured']) {
                            clientName = policy.insured['Primary Named Insured'];
                        } else if (policy.namedInsured?.name) {
                            clientName = policy.namedInsured.name;
                        } else if (policy.clientName && policy.clientName !== 'N/A' && policy.clientName !== 'Unknown' && policy.clientName !== 'unknown') {
                            // PRIORITY 2: Use existing clientName if it's valid
                            clientName = policy.clientName;
                        } else if (policy.clientId) {
                            // PRIORITY 3: Look up client by ID as fallback
                            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                            const client = clients.find(c => c.id === policy.clientId);
                            if (client) {
                                clientName = client.name || client.companyName || client.businessName || 'N/A';
                            }
                        }

                        return `
                            <tr class="policy-row" data-policy-id="${policy.id}">
                                <td><strong>${policy.policyNumber || policy.policy_number || policy.id || 'N/A'}</strong></td>
                                <td>${clientName}</td>
                                <td><span class="policy-type">${policy.policyType || policy.policy_type || policy.type || 'Commercial Auto'}</span></td>
                                <td>${coverage}</td>
                                <td>
                                    <span class="status-badge ${statusClass}">
                                        ${formattedExpiry}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="viewPolicyProfile('${policy.id || policy.policyNumber}')" title="View Profile">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

    policyList.innerHTML = tableHTML;
    console.log('✅ Successfully displayed policies from localStorage');

    // Restore renewal completion highlighting
    restoreRenewalHighlighting();
}

// Load COI Inbox
function loadCOIInbox() {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Sample trucking/commercial auto email data
    const emails = [
        {
            id: 'EMAIL-001',
            from: 'dispatch@walmart.com',
            subject: 'COI Required - Walmart Distribution Center Access',
            date: new Date().toISOString(),
            unread: true,
            hasAttachment: true,
            policyId: 'POL-001'
        },
        {
            id: 'EMAIL-002',
            from: 'broker@chrobinson.com',
            subject: 'Insurance Certificate - Load #78234',
            date: new Date(Date.now() - 86400000).toISOString(),
            unread: true,
            hasAttachment: false,
            policyId: 'POL-003'
        },
        {
            id: 'EMAIL-003',
            from: 'compliance@amazon.com',
            subject: 'Urgent: Auto Liability Certificate for Amazon Relay',
            date: new Date(Date.now() - 172800000).toISOString(),
            unread: false,
            hasAttachment: true,
            policyId: 'POL-002'
        }
    ];

    coiInbox.innerHTML = `
        <div class="email-list">
            ${emails.map(email => `
                <div class="email-item ${email.unread ? 'unread' : ''}" data-email-id="${email.id}" onclick="expandEmail('${email.id}')">
                    <div class="email-header">
                        <div class="email-info">
                            <div class="email-from">
                                ${email.unread ? '<i class="fas fa-circle" style="color: var(--primary-blue); font-size: 8px; margin-right: 8px;"></i>' : ''}
                                <strong>${email.from}</strong>
                            </div>
                            <div class="email-subject">${email.subject}</div>
                            <div class="email-meta">
                                ${email.hasAttachment ? '<i class="fas fa-paperclip" style="margin-right: 8px;"></i>' : ''}
                                <span class="email-date">${formatDate(email.date)}</span>
                            </div>
                        </div>
                        <button class="btn-icon view-profile-btn" onclick="viewPolicyFromEmail(event, '${email.policyId}')" title="View Policy Profile">
                            <i class="fas fa-file-contract"></i>
                        </button>
                    </div>
                    <div class="email-content" id="content-${email.id}" style="display: none;">
                        <!-- Expanded email content will be inserted here -->
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Expand Email
function expandEmail(emailId) {
    const emailContent = document.getElementById(`content-${emailId}`);
    const emailItem = document.querySelector(`[data-email-id="${emailId}"]`);
    
    if (!emailContent || !emailItem) return;

    // Toggle expansion
    if (emailContent.style.display === 'none') {
        // Mark as read
        emailItem.classList.remove('unread');
        
        // Load email content
        emailContent.innerHTML = `
            <div class="email-body">
                <div class="email-actions">
                    <button class="btn-primary btn-small" onclick="viewPolicyFromEmail(event, 'POL-001')">
                        <i class="fas fa-file-contract"></i> View Policy Profile
                    </button>
                    <button class="btn-secondary btn-small" onclick="replyToEmail('${emailId}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn-secondary btn-small" onclick="forwardEmail('${emailId}')">
                        <i class="fas fa-share"></i> Forward
                    </button>
                </div>
                <div class="email-message">
                    <p>Dear Vanguard Insurance,</p>
                    <p>We require a Certificate of Insurance for your client to haul loads to our distribution centers starting ${new Date(Date.now() + 604800000).toLocaleDateString()}.</p>
                    <p>Please include the following as certificate holder:</p>
                    <ul>
                        <li>Walmart Transportation LLC</li>
                        <li>702 SW 8th Street, Bentonville, AR 72716</li>
                    </ul>
                    <p>Required coverages:</p>
                    <ul>
                        <li>Commercial Auto Liability: $1,000,000 minimum</li>
                        <li>Motor Truck Cargo: $100,000 minimum</li>
                        <li>General Liability: $1,000,000 minimum</li>
                    </ul>
                    <p>Please ensure the certificate shows us as certificate holder with 30-day notice of cancellation.</p>
                    <p>Best regards,<br>Transportation Compliance Team<br>Walmart Inc.</p>
                </div>
                ${Math.random() > 0.5 ? `
                <div class="email-attachments">
                    <h4>Attachments:</h4>
                    <div class="attachment-list">
                        <div class="attachment-item">
                            <i class="fas fa-file-pdf"></i>
                            <span>Broker_Carrier_Agreement.pdf</span>
                            <button class="btn-link" onclick="downloadAttachment('agreement.pdf')">Download</button>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        emailContent.style.display = 'block';
    } else {
        emailContent.style.display = 'none';
    }
}

// View Policy Profile
function viewPolicyProfile(policyId) {
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) return;

    // Sample trucking policy details
    const policyDetails = {
        'POL-001': {
            id: 'POL-001',
            client: 'Swift Trucking LLC',
            type: 'Commercial Auto',
            carrier: 'Progressive Commercial',
            coverage: '$1,000,000',
            deductible: '$2,500',
            premium: '$18,500/year',
            effectiveDate: '2024-01-01',
            expiryDate: '2024-12-31',
            namedInsured: ['Swift Trucking LLC', 'Robert Johnson (Owner)'],
            additionalInsured: [],
            coverageDetails: {
                'Combined Single Limit': '$1,000,000',
                'Bodily Injury (Per Person)': '$500,000',
                'Bodily Injury (Per Accident)': '$1,000,000',
                'Property Damage': '$1,000,000',
                'Uninsured Motorist': '$1,000,000',
                'Medical Payments': '$5,000',
                'Motor Truck Cargo': '$100,000',
                'Trailer Interchange': '$50,000'
            }
        }
    };

    const policy = policyDetails[policyId] || policyDetails['POL-001'];

    policyViewer.innerHTML = `
        <div class="policy-profile">
            <div class="profile-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-back" onclick="backToPolicyList()" title="Back to Policy List">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>Policy Profile: ${policy.id}</h2>
                </div>
                <button class="btn-primary" onclick="prepareCOI('${policy.id}')">
                    <i class="fas fa-file-alt"></i> Prepare COI
                </button>
            </div>
            
            <div class="profile-content">
                <div class="profile-section">
                    <h3>Policy Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Policy Number:</label>
                            <span>${policy.id}</span>
                        </div>
                        <div class="info-item">
                            <label>Type:</label>
                            <span>${policy.type}</span>
                        </div>
                        <div class="info-item">
                            <label>Carrier:</label>
                            <span>${policy.carrier}</span>
                        </div>
                        <div class="info-item">
                            <label>Premium:</label>
                            <span>${policy.premium}</span>
                        </div>
                        <div class="info-item">
                            <label>Effective Date:</label>
                            <span>${new Date(policy.effectiveDate).toLocaleDateString()}</span>
                        </div>
                        <div class="info-item">
                            <label>Expiry Date:</label>
                            <span>${new Date(policy.expiryDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Named Insured</h3>
                    <ul class="insured-list">
                        ${policy.namedInsured.map(name => `<li>${name}</li>`).join('')}
                    </ul>
                </div>

                <div class="profile-section">
                    <h3>Coverage Details</h3>
                    <div class="coverage-grid">
                        ${Object.entries(policy.coverageDetails).map(([key, value]) => `
                            <div class="coverage-item">
                                <label>${key}:</label>
                                <span class="coverage-amount">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Additional Insured</h3>
                    <ul class="insured-list">
                        ${policy.additionalInsured.map(name => `<li>${name}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;

    // Highlight the corresponding policy in the list
    document.querySelectorAll('.policy-row').forEach(row => {
        row.classList.remove('selected');
        if (row.dataset.policyId === policyId) {
            row.classList.add('selected');
        }
    });
}

// View Policy from Email
function viewPolicyFromEmail(event, policyId) {
    event.stopPropagation();
    viewPolicyProfile(policyId);
}

// Prepare COI (ACORD 25 Form)
function prepareCOI(policyId) {
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) return;
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Display COI form in the left panel instead of modal
    policyViewer.innerHTML = `
        <div class="coi-form-container">
            <div class="coi-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-back" onclick="viewPolicyProfile('${policyId}')" title="Back to Policy Profile">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>ACORD® 25 Certificate</h2>
                </div>
            </div>
            <div class="coi-form-body">
                <div class="acord-form-header">
                    <p style="text-align: center; font-size: 11px; color: #666;">
                        THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER. THIS
                        CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES
                        BELOW. THIS CERTIFICATE OF INSURANCE DOES NOT CONSTITUTE A CONTRACT BETWEEN THE ISSUING INSURER(S), AUTHORIZED
                        REPRESENTATIVE OR PRODUCER, AND THE CERTIFICATE HOLDER.
                    </p>
                </div>
                
                <div class="coi-form acord-25">
                    <!-- Producer Section -->
                    <div class="form-section">
                        <h3>PRODUCER</h3>
                        <div class="form-row">
                            <div class="form-group" style="flex: 2;">
                                <label>Producer Name & Address:</label>
                                <textarea class="form-control" rows="3" value="">Vanguard Insurance Group
123 Insurance Way
New York, NY 10001</textarea>
                            </div>
                            <div class="form-group">
                                <label>Phone (A/C, No, Ext):</label>
                                <input type="text" class="form-control" value="(212) 555-0100">
                                <label>Fax (A/C, No):</label>
                                <input type="text" class="form-control" value="(212) 555-0101">
                                <label>E-Mail Address:</label>
                                <input type="email" class="form-control" value="coi@vanguardins.com">
                            </div>
                        </div>
                    </div>

                    <!-- Insured Section -->
                    <div class="form-section">
                        <h3>INSURED</h3>
                        <div class="form-group">
                            <label>Insured Name & Address:</label>
                            <textarea id="insuredInfo" class="form-control" rows="4" placeholder="Enter insured party name and address">Swift Trucking LLC
1234 Highway Drive
Suite 100
Dallas, TX 75001</textarea>
                        </div>
                    </div>

                    <!-- Insurers Section -->
                    <div class="form-section">
                        <h3>INSURERS AFFORDING COVERAGE | NAIC #</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>INSURER A:</label>
                                <input type="text" class="form-control" value="Liberty Mutual Insurance">
                                <input type="text" class="form-control" placeholder="NAIC #" value="23043" style="width: 100px;">
                            </div>
                            <div class="form-group">
                                <label>INSURER B:</label>
                                <input type="text" class="form-control" placeholder="Enter insurer name">
                                <input type="text" class="form-control" placeholder="NAIC #" style="width: 100px;">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>INSURER C:</label>
                                <input type="text" class="form-control" placeholder="Enter insurer name">
                                <input type="text" class="form-control" placeholder="NAIC #" style="width: 100px;">
                            </div>
                            <div class="form-group">
                                <label>INSURER D:</label>
                                <input type="text" class="form-control" placeholder="Enter insurer name">
                                <input type="text" class="form-control" placeholder="NAIC #" style="width: 100px;">
                            </div>
                        </div>
                    </div>

                    <!-- Coverages Section -->
                    <div class="form-section">
                        <h3>COVERAGES | CERTIFICATE NUMBER: COI-${Date.now()}</h3>
                        <p style="font-size: 11px; color: #666;">The policies of insurance listed below have been issued to the insured named above for the policy period indicated.</p>
                        
                        <table class="coverage-table">
                            <thead>
                                <tr>
                                    <th>INSR LTR</th>
                                    <th>TYPE OF INSURANCE</th>
                                    <th>ADDL INSD</th>
                                    <th>SUBR WVD</th>
                                    <th>POLICY NUMBER</th>
                                    <th>POLICY EFF DATE</th>
                                    <th>POLICY EXP DATE</th>
                                    <th>LIMITS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- General Liability -->
                                <tr>
                                    <td><input type="text" class="form-control" value="A" style="width: 30px;"></td>
                                    <td>
                                        <label><input type="checkbox" checked> COMMERCIAL GENERAL LIABILITY</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> CLAIMS-MADE</label>
                                        <label><input type="checkbox" checked> OCCUR</label>
                                    </td>
                                    <td><input type="checkbox" id="glAddl"></td>
                                    <td><input type="checkbox" id="glSubr"></td>
                                    <td><input type="text" class="form-control" value="CGL2024001"></td>
                                    <td><input type="date" class="form-control" value="2024-01-01"></td>
                                    <td><input type="date" class="form-control" value="2024-12-31"></td>
                                    <td>
                                        <div class="limit-row">
                                            <label>EACH OCCURRENCE</label>
                                            <input type="text" class="form-control" value="$1,000,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>DAMAGE TO RENTED PREMISES (Ea occurrence)</label>
                                            <input type="text" class="form-control" value="$100,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>MED EXP (Any one person)</label>
                                            <input type="text" class="form-control" value="$10,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>PERSONAL & ADV INJURY</label>
                                            <input type="text" class="form-control" value="$1,000,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>GENERAL AGGREGATE</label>
                                            <input type="text" class="form-control" value="$2,000,000">
                                        </div>
                                        <div class="limit-row">
                                            <label>PRODUCTS - COMP/OP AGG</label>
                                            <input type="text" class="form-control" value="$2,000,000">
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Automobile Liability -->
                                <tr>
                                    <td><input type="text" class="form-control" style="width: 30px;"></td>
                                    <td>
                                        <label><input type="checkbox"> AUTOMOBILE LIABILITY</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> ANY AUTO</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> OWNED AUTOS ONLY</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> HIRED AUTOS ONLY</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> SCHEDULED AUTOS</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> NON-OWNED AUTOS ONLY</label>
                                    </td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="text" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td>
                                        <div class="limit-row">
                                            <label>COMBINED SINGLE LIMIT (Ea accident)</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>BODILY INJURY (Per person)</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>BODILY INJURY (Per accident)</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>PROPERTY DAMAGE (Per accident)</label>
                                            <input type="text" class="form-control">
                                        </div>
                                    </td>
                                </tr>

                                <!-- Umbrella/Excess -->
                                <tr>
                                    <td><input type="text" class="form-control" style="width: 30px;"></td>
                                    <td>
                                        <label><input type="checkbox"> UMBRELLA LIAB</label>
                                        <label><input type="checkbox"> OCCUR</label><br>
                                        <label><input type="checkbox"> EXCESS LIAB</label>
                                        <label><input type="checkbox"> CLAIMS-MADE</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> DED</label>
                                        <label><input type="checkbox"> RETENTION $</label>
                                        <input type="text" class="form-control" style="width: 100px; display: inline-block;">
                                    </td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="text" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td>
                                        <div class="limit-row">
                                            <label>EACH OCCURRENCE</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>AGGREGATE</label>
                                            <input type="text" class="form-control">
                                        </div>
                                    </td>
                                </tr>

                                <!-- Workers Compensation -->
                                <tr>
                                    <td><input type="text" class="form-control" style="width: 30px;"></td>
                                    <td>
                                        <label><input type="checkbox"> WORKERS COMPENSATION AND EMPLOYERS' LIABILITY</label><br>
                                        <label style="margin-left: 20px;">ANY PROPRIETOR/PARTNER/EXECUTIVE OFFICER/MEMBER EXCLUDED?</label><br>
                                        <label style="margin-left: 20px;"><input type="checkbox"> Yes</label>
                                        <label><input type="checkbox"> No</label><br>
                                        <small style="margin-left: 20px;">If yes, describe under DESCRIPTION OF OPERATIONS below</small>
                                    </td>
                                    <td>N/A</td>
                                    <td><input type="checkbox"></td>
                                    <td><input type="text" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td><input type="date" class="form-control"></td>
                                    <td>
                                        <div class="limit-row">
                                            <label><input type="checkbox"> PER STATUTE</label>
                                            <label style="margin-left: 20px;"><input type="checkbox"> OTHER</label>
                                        </div>
                                        <div class="limit-row">
                                            <label>E.L. EACH ACCIDENT</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>E.L. DISEASE - EA EMPLOYEE</label>
                                            <input type="text" class="form-control">
                                        </div>
                                        <div class="limit-row">
                                            <label>E.L. DISEASE - POLICY LIMIT</label>
                                            <input type="text" class="form-control">
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Description of Operations -->
                    <div class="form-section">
                        <h3>DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES (ACORD 101, Additional Remarks Schedule, may be attached)</h3>
                        <div class="form-group">
                            <textarea id="operations" class="form-control" rows="4" placeholder="Describe the operations, locations, or vehicles"></textarea>
                        </div>
                    </div>

                    <!-- Certificate Holder -->
                    <div class="form-section">
                        <h3>CERTIFICATE HOLDER</h3>
                        <div class="form-row">
                            <div class="form-group" style="flex: 2;">
                                <label>Name & Address:</label>
                                <textarea id="holderInfo" class="form-control" rows="4" placeholder="Enter certificate holder name and complete address"></textarea>
                            </div>
                            <div class="form-group">
                                <label style="font-size: 11px;">
                                    <input type="checkbox"> ACORD 25 (2016/03)<br>
                                    The ACORD name and logo are registered marks of ACORD
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Cancellation Section -->
                    <div class="form-section">
                        <h3>CANCELLATION</h3>
                        <p style="font-size: 11px;">
                            SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE THE EXPIRATION DATE THEREOF, NOTICE WILL BE DELIVERED IN
                            ACCORDANCE WITH THE POLICY PROVISIONS.
                        </p>
                    </div>

                    <!-- Authorized Representative -->
                    <div class="form-section">
                        <div class="form-row">
                            <div class="form-group">
                                <label>AUTHORIZED REPRESENTATIVE:</label>
                                <input type="text" class="form-control" placeholder="Signature (Type name)">
                                <small>Date: ${today}</small>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn-secondary" onclick="printCOI('${policyId}')">
                            <i class="fas fa-print"></i> Print
                        </button>
                        <button class="btn-secondary" onclick="saveCOI('${policyId}')">
                            <i class="fas fa-save"></i> Save Only
                        </button>
                        <button class="btn-primary" onclick="sendAndSaveCOI('${policyId}')">
                            <i class="fas fa-paper-plane"></i> Send & Save COI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Auto-populate fields based on policy
    populateCOIFields(policyId);
}

// Back to Policy List
function backToPolicyList() {
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) return;
    
    // Reset the viewer to show the policy list
    policyViewer.innerHTML = `
        <div class="policy-list" id="policyList">
            <!-- Policy list will be populated here -->
        </div>
    `;
    
    loadPolicyList();
}

// Send and Save COI
function sendAndSaveCOI(policyId) {
    // Get form data
    const holderName = document.getElementById('holderInfo').value.split('\n')[0];
    const holderAddress = document.getElementById('holderInfo').value;
    
    if (!holderName || !holderAddress) {
        alert('Please fill in required certificate holder information');
        return;
    }

    // Create email response modal
    const emailModal = document.createElement('div');
    emailModal.className = 'modal';
    emailModal.id = 'emailResponseModal';
    emailModal.innerHTML = `
        <div class="modal-content email-modal">
            <div class="modal-header">
                <h2>Send Certificate of Insurance</h2>
                <button class="close-btn" onclick="closeModal('emailResponseModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body modal-body-spacious">
                <div class="form-group">
                    <label>To:</label>
                    <input type="text" id="emailTo" class="form-control" value="${holderName.toLowerCase().replace(/\s+/g, '') + '@example.com'}" placeholder="Enter recipient email">
                </div>
                <div class="form-group">
                    <label>CC:</label>
                    <input type="text" id="emailCC" class="form-control" placeholder="Enter CC recipients (optional)">
                </div>
                <div class="form-group">
                    <label>Subject:</label>
                    <input type="text" id="emailSubject" class="form-control" value="Certificate of Insurance - ${policyId}">
                </div>
                <div class="form-group">
                    <label>Message:</label>
                    <textarea id="emailBody" class="form-control" rows="6">Hi,

Please see attached Certificate of Insurance as requested.

Policy Number: ${policyId}
Certificate Holder: ${holderName}

Please let me know if you need any additional information.

Thanks,
Vanguard Insurance Team</textarea>
                </div>
                <div class="form-group">
                    <div class="attachment-preview">
                        <i class="fas fa-file-pdf"></i>
                        <span>COI_${policyId}_${Date.now()}.pdf</span>
                        <span class="attachment-size">(Attached)</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeModal('emailResponseModal')">Cancel</button>
                    <button class="btn-primary" onclick="sendCOIEmail('${policyId}')">
                        <i class="fas fa-paper-plane"></i> Send Email
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(emailModal);
    emailModal.style.display = 'flex';
}

// Send COI Email
function sendCOIEmail(policyId) {
    // Show loading state
    const sendButton = event.target;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendButton.disabled = true;

    setTimeout(() => {
        closeModal('emailResponseModal');
        showNotification('COI sent successfully to recipient!', 'success');
        
        // Refresh inbox to show sent item
        loadCOIInbox();
    }, 1500);
}

// Save COI
function saveCOI(policyId) {
    showNotification('Certificate of Insurance saved successfully!', 'success');
    closeModal('coiModal');
}

// Populate COI Fields
function populateCOIFields(policyId) {
    // Auto-populate based on selected policy
    // This would normally fetch from a database
    console.log('Populating COI fields for policy:', policyId);
}

// Print COI
function printCOI(policyId) {
    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        alert('Policy not found');
        return;
    }

    // Create ACORD 25 form in a new window for printing
    const printWindow = window.open('', 'PrintACORD25', 'width=900,height=1200,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes');

    if (!printWindow) {
        alert('Please allow pop-ups to print the ACORD 25 form');
        return;
    }

    // Generate ACORD 25 form HTML
    const acordHTML = generateACORD25HTML(policy);

    // Write the HTML to the new window
    printWindow.document.open();
    printWindow.document.write(acordHTML);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
}

// Generate ACORD 25 HTML for printing
function generateACORD25HTML(policy) {
    const today = new Date().toISOString().split('T')[0];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ACORD 25 Certificate of Insurance</title>
    <style>
        @page {
            size: letter;
            margin: 0.25in;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            background: white;
        }

        .acord-form {
            width: 8in;
            margin: 0 auto;
            padding: 0.25in;
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
        }

        .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .subtitle {
            font-size: 12px;
        }

        .section {
            border: 1px solid #000;
            margin-bottom: 10px;
            padding: 8px;
        }

        .section-title {
            font-weight: bold;
            background: #f0f0f0;
            padding: 3px;
            margin: -8px -8px 5px -8px;
        }

        .row {
            display: flex;
            margin-bottom: 5px;
        }

        .field {
            flex: 1;
            padding: 2px 5px;
        }

        .field-label {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 2px;
        }

        .field-value {
            border-bottom: 1px solid #999;
            padding: 2px 0;
            min-height: 18px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #000;
            padding: 3px;
            text-align: left;
        }

        th {
            background: #f0f0f0;
            font-weight: bold;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .acord-form {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="acord-form">
        <div class="header">
            <div class="title">ACORD 25 CERTIFICATE OF LIABILITY INSURANCE</div>
            <div class="subtitle">DATE (MM/DD/YYYY): ${today}</div>
        </div>

        <div class="section">
            <div class="section-title">PRODUCER</div>
            <div class="row">
                <div class="field">
                    <div class="field-label">Name:</div>
                    <div class="field-value">Vanguard Insurance Agency</div>
                </div>
            </div>
            <div class="row">
                <div class="field">
                    <div class="field-label">Address:</div>
                    <div class="field-value">123 Main Street, Suite 100</div>
                </div>
            </div>
            <div class="row">
                <div class="field">
                    <div class="field-label">City, State, Zip:</div>
                    <div class="field-value">New York, NY 10001</div>
                </div>
            </div>
            <div class="row">
                <div class="field">
                    <div class="field-label">Phone:</div>
                    <div class="field-value">(555) 123-4567</div>
                </div>
                <div class="field">
                    <div class="field-label">Fax:</div>
                    <div class="field-value">(555) 123-4568</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">INSURED</div>
            <div class="row">
                <div class="field">
                    <div class="field-label">Insured Name:</div>
                    <div class="field-value">${policy.clientName || 'N/A'}</div>
                </div>
            </div>
            <div class="row">
                <div class="field">
                    <div class="field-label">Address:</div>
                    <div class="field-value">${policy.address || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">INSURERS AFFORDING COVERAGE</div>
            <div class="row">
                <div class="field">
                    <div class="field-label">INSURER A:</div>
                    <div class="field-value">${policy.carrier || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">COVERAGES</div>
            <p style="font-size: 9px; margin-bottom: 10px;">
                THE POLICIES OF INSURANCE LISTED BELOW HAVE BEEN ISSUED TO THE INSURED NAMED ABOVE FOR THE POLICY PERIOD INDICATED.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>TYPE OF INSURANCE</th>
                        <th>POLICY NUMBER</th>
                        <th>POLICY EFF DATE</th>
                        <th>POLICY EXP DATE</th>
                        <th>LIMITS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${policy.type || 'GENERAL LIABILITY'}</td>
                        <td>${policy.policyNumber || 'N/A'}</td>
                        <td>${policy.effectiveDate || 'N/A'}</td>
                        <td>${policy.expirationDate || 'N/A'}</td>
                        <td>${policy.coverageLimit ? '$' + Number(policy.coverageLimit).toLocaleString() : 'N/A'}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">CERTIFICATE HOLDER</div>
            <div class="row">
                <div class="field">
                    <div class="field-value" style="min-height: 60px; border: 1px solid #999; padding: 5px;">
                        To be filled in by certificate holder
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">CANCELLATION</div>
            <p style="font-size: 9px;">
                SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE THE EXPIRATION DATE THEREOF,
                NOTICE WILL BE DELIVERED IN ACCORDANCE WITH THE POLICY PROVISIONS.
            </p>
        </div>

        <div class="section">
            <div class="section-title">AUTHORIZED REPRESENTATIVE</div>
            <div class="row">
                <div class="field">
                    <div class="field-label">Signature:</div>
                    <div class="field-value" style="min-height: 30px;"></div>
                </div>
                <div class="field">
                    <div class="field-label">Date:</div>
                    <div class="field-value">${today}</div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 9px; color: #666;">
            ACORD 25 (2016/03) © 1988-2015 ACORD CORPORATION. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;
}

// Preview COI
function previewCOI(policyId) {
    window.open('https://www.acord.org/forms-store/form-information?formNumber=ACORD%2025', '_blank');
}

// Reply to Email
function replyToEmail(emailId) {
    alert('Reply functionality will open email composer with quoted message');
}

// Forward Email
function forwardEmail(emailId) {
    alert('Forward functionality will open email composer with original message');
}

// Filter COI Emails
function filterCOIEmails(filter) {
    const emails = document.querySelectorAll('.email-item');
    emails.forEach(email => {
        if (filter === 'unread') {
            email.style.display = email.classList.contains('unread') ? 'block' : 'none';
        } else {
            email.style.display = 'block';
        }
    });
}

// Refresh Policies
function refreshPolicies() {
    showNotification('Refreshing policy list...', 'info');
    setTimeout(() => {
        // Use localStorage version instead of API version
        if (window.loadRealPolicyList) {
            window.loadRealPolicyList();
        } else {
            loadPolicyList();
        }
        showNotification('Policy list updated!', 'success');
    }, 1000);
}

// Format Date Helper for relative time
function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
        }
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Format Premium Value Helper
function formatPremiumValue(value) {
    if (!value && value !== 0) return '0';
    
    // If it's already a number, format it
    if (typeof value === 'number') {
        return value.toLocaleString();
    }
    
    // If it's a string, clean it and parse it
    if (typeof value === 'string') {
        // Remove dollar signs, commas, and spaces
        const cleanValue = value.replace(/[$,\s]/g, '');
        const numValue = parseFloat(cleanValue);
        
        // Check if parsing was successful
        if (!isNaN(numValue)) {
            return numValue.toLocaleString();
        }
    }
    
    // Default return
    return '0';
}

// Format Date Helper for displaying dates in tables
function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    try {
        // Handle both Date objects and date strings
        let date;
        if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            date = new Date(dateInput);
        }
        
        if (isNaN(date.getTime())) return 'N/A';
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
        return 'N/A';
    }
}

// Format Policy Premium Helper (avoid NaN display)
function formatPolicyPremium(premium) {
    if (!premium || premium === 0 || premium === '0') {
        return '$0/yr';
    }

    // Handle different premium field names and formats
    let premiumValue = premium;

    // Check if it's an object with nested premium values
    if (typeof premium === 'object' && premium !== null) {
        premiumValue = premium.annualPremium ||
                      premium.premium ||
                      premium.annual ||
                      premium.yearly ||
                      0;
    }

    // Convert to string and clean any existing dollar signs and text
    const cleanPremium = String(premiumValue).replace(/[$,/yr/mo]/g, '');
    const numericPremium = parseFloat(cleanPremium) || 0;

    if (numericPremium === 0) {
        return '$0/yr';
    }

    return `$${numericPremium.toLocaleString()}/yr`;
}

// Telnyx Phone System Configuration
const TELNYX_API_KEY = 'YOUR_API_KEY_HERE';
const TELNYX_API_URL = 'https://api.telnyx.com/v2';

// Approved Telnyx Phone Numbers
const TELNYX_PHONE_NUMBERS = [
    { number: '+13303008092', location: 'ORRVILLE', status: 'approved', default: true },
    { number: '+13307652039', location: 'ORRVILLE', status: 'approved' },
    { number: '+13303553943', location: 'KINSMAN', status: 'approved' },
    { number: '+13304485974', location: 'SHARON', status: 'approved' },
    { number: '+13305169554', location: 'DALTON', status: 'approved' },
    { number: '+13305169588', location: 'DALTON', status: 'approved' },
    { number: '+13305309058', location: 'GIRARD', status: 'approved' },
    { number: '+13305309163', location: 'GIRARD', status: 'approved' },
    { number: '+13305309216', location: 'GIRARD', status: 'approved' },
    { number: '+13305674610', location: 'SHREVE', status: 'approved' }
];

// Get default phone number or first available
function getDefaultPhoneNumber() {
    const defaultNumber = TELNYX_PHONE_NUMBERS.find(n => n.default);
    return defaultNumber ? defaultNumber.number : TELNYX_PHONE_NUMBERS[0].number;
}

// Phone Tool Functions
function openPhoneTool() {
    const phoneModal = document.createElement('div');
    phoneModal.className = 'modal-overlay active';
    phoneModal.id = 'phoneToolModal';
    
    phoneModal.innerHTML = `
        <div class="modal-container" style="max-width: 900px; width: 90%; height: 85vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="padding: 20px 25px; border-bottom: 2px solid #e5e7eb; flex-shrink: 0;">
                <h2 style="margin: 0; color: #111827; font-size: 24px; display: flex; align-items: center;">
                    <i class="fas fa-phone-alt" style="margin-right: 12px; color: #10b981;"></i>
                    Telnyx Phone System
                </h2>
                <button class="close-btn" onclick="closePhoneTool()" style="font-size: 28px;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 0; flex: 1; display: flex; overflow: hidden;">
                <!-- Left Panel - Dialer -->
                <div style="width: 380px; background: #f9fafb; padding: 25px; border-right: 2px solid #e5e7eb; display: flex; flex-direction: column;">
                    <!-- Caller ID Selection -->
                    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; color: #374151; font-size: 13px; font-weight: 600;">CALLING FROM:</label>
                        <select id="callerIdSelect" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="+13303008092" selected>ORRVILLE - (330) 300-8092</option>
                            <option value="+13307652039">ORRVILLE - (330) 765-2039</option>
                            <option value="+13303553943">KINSMAN - (330) 355-3943</option>
                            <option value="+13304485974">SHARON - (330) 448-5974</option>
                            <option value="+13305169554">DALTON - (330) 516-9554</option>
                            <option value="+13305169588">DALTON - (330) 516-9588</option>
                            <option value="+13305309058">GIRARD - (330) 530-9058</option>
                            <option value="+13305309163">GIRARD - (330) 530-9163</option>
                            <option value="+13305309216">GIRARD - (330) 530-9216</option>
                            <option value="+13305674610">SHREVE - (330) 567-4610</option>
                        </select>
                    </div>
                    
                    <!-- Number Display -->
                    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                        <input type="text" id="phoneNumber" placeholder="Enter number or select contact" 
                            style="width: 100%; font-size: 22px; padding: 12px; border: none; text-align: center; font-weight: 500;">
                    </div>
                    
                    <!-- Dial Pad -->
                    <div class="dial-pad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                        ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(digit => `
                            <button class="dial-btn" onclick="addDigit('${digit}')" 
                                style="padding: 20px; font-size: 24px; background: white; border: 2px solid #e5e7eb; 
                                border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                ${digit}
                            </button>
                        `).join('')}
                    </div>
                    
                    <!-- Call Actions -->
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <button onclick="makeCall()" class="btn-primary" 
                            style="flex: 1; padding: 15px; font-size: 16px; background: #10b981; border-radius: 10px;">
                            <i class="fas fa-phone"></i> Call
                        </button>
                        <button onclick="clearNumber()" class="btn-secondary" 
                            style="padding: 15px 20px; font-size: 16px; border-radius: 10px;">
                            <i class="fas fa-backspace"></i>
                        </button>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div style="background: white; border-radius: 10px; padding: 15px;">
                        <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 14px; text-transform: uppercase;">Quick Actions</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <button onclick="sendSMS()" class="btn-secondary" style="padding: 10px; font-size: 14px;">
                                <i class="fas fa-sms"></i> Send SMS
                            </button>
                            <button onclick="showCallHistory()" class="btn-secondary" style="padding: 10px; font-size: 14px;">
                                <i class="fas fa-history"></i> Call History
                            </button>
                            <button onclick="showVoicemail()" class="btn-secondary" style="padding: 10px; font-size: 14px;">
                                <i class="fas fa-voicemail"></i> Voicemail
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Right Panel - Call Info & Contacts -->
                <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                    <!-- Call Status -->
                    <div id="callStatus" style="background: #f3f4f6; padding: 20px; border-bottom: 1px solid #e5e7eb; display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">Active Call</p>
                                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 600;" id="activeCallNumber"></p>
                                <p style="margin: 5px 0 0 0; color: #10b981; font-size: 16px;" id="callDuration">00:00</p>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="holdCall()" class="btn-secondary" style="padding: 10px 15px;">
                                    <i class="fas fa-pause"></i> Hold
                                </button>
                                <button onclick="muteCall()" class="btn-secondary" style="padding: 10px 15px;">
                                    <i class="fas fa-microphone-slash"></i> Mute
                                </button>
                                <button onclick="endCall()" class="btn-primary" style="padding: 10px 15px; background: #dc2626;">
                                    <i class="fas fa-phone-slash"></i> End
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tabs -->
                    <div style="display: flex; background: white; border-bottom: 1px solid #e5e7eb;">
                        <button class="phone-tab active" onclick="switchPhoneTab('contacts')" 
                            style="flex: 1; padding: 15px; background: none; border: none; font-size: 15px; cursor: pointer;">
                            <i class="fas fa-address-book"></i> Contacts
                        </button>
                        <button class="phone-tab" onclick="switchPhoneTab('recent')" 
                            style="flex: 1; padding: 15px; background: none; border: none; font-size: 15px; cursor: pointer;">
                            <i class="fas fa-clock"></i> Recent
                        </button>
                        <button class="phone-tab" onclick="switchPhoneTab('sms')" 
                            style="flex: 1; padding: 15px; background: none; border: none; font-size: 15px; cursor: pointer;">
                            <i class="fas fa-comment"></i> Messages
                        </button>
                    </div>
                    
                    <!-- Tab Content -->
                    <div id="phoneTabContent" style="flex: 1; overflow-y: auto; padding: 20px;">
                        <!-- Contacts Tab -->
                        <div id="contactsTab" class="phone-tab-content">
                            <div style="margin-bottom: 15px;">
                                <input type="text" placeholder="Search contacts..." 
                                    style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                            </div>
                            <div id="contactsList">
                                ${generatePhoneContacts()}
                            </div>
                        </div>
                        
                        <!-- Recent Tab -->
                        <div id="recentTab" class="phone-tab-content" style="display: none;">
                            <div id="recentCallsList">
                                ${generateRecentCalls()}
                            </div>
                        </div>
                        
                        <!-- SMS Tab -->
                        <div id="smsTab" class="phone-tab-content" style="display: none;">
                            <div style="margin-bottom: 15px;">
                                <textarea id="smsMessage" placeholder="Type your message..." 
                                    style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; height: 100px;"></textarea>
                                <button onclick="sendSMSMessage()" class="btn-primary" style="margin-top: 10px; padding: 10px 20px;">
                                    <i class="fas fa-paper-plane"></i> Send SMS
                                </button>
                            </div>
                            <div id="messagesList">
                                ${generateMessages()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(phoneModal);
    addPhoneToolStyles();
}

function closePhoneTool() {
    const modal = document.getElementById('phoneToolModal');
    if (modal) modal.remove();
}

function addDigit(digit) {
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.value += digit;
    }
}

function clearNumber() {
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.value = phoneInput.value.slice(0, -1);
    }
}

function makeCall() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    if (!phoneNumber) {
        showNotification('Please enter a phone number', 'error');
        return;
    }
    
    // Show call status
    const callStatus = document.getElementById('callStatus');
    const activeCallNumber = document.getElementById('activeCallNumber');
    const callerIdSelect = document.getElementById('callerIdSelect');
    
    if (callStatus && activeCallNumber) {
        callStatus.style.display = 'block';
        const fromNumber = callerIdSelect ? callerIdSelect.value : getDefaultPhoneNumber();
        const selectedPhone = TELNYX_PHONE_NUMBERS.find(p => p.number === fromNumber);
        activeCallNumber.innerHTML = `
            <div>${phoneNumber}</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                From: ${selectedPhone ? selectedPhone.location : 'Unknown'} (${fromNumber.replace('+1', '')})
            </div>
        `;
        startCallTimer();
    }
    
    // Make actual Telnyx API call
    makeTelnyxCall(phoneNumber);
}

function makeTelnyxCall(phoneNumber) {
    // Get selected caller ID
    const callerIdSelect = document.getElementById('callerIdSelect');
    const fromNumber = callerIdSelect ? callerIdSelect.value : getDefaultPhoneNumber();
    
    // Format phone number for Telnyx (E.164 format)
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
    
    // Telnyx Call Control API
    fetch(`${TELNYX_API_URL}/calls`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            connection_id: 'default',
            to: e164Number,
            from: fromNumber,
            webhook_url: 'https://a3eaf804f020.ngrok-free.app/webhook/telnyx'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Call initiated:', data);
        showNotification(`Calling ${phoneNumber}...`, 'success');
    })
    .catch(error => {
        console.error('Error making call:', error);
        showNotification('Failed to initiate call. Please check your connection.', 'error');
    });
}

function endCall() {
    const callStatus = document.getElementById('callStatus');
    if (callStatus) {
        callStatus.style.display = 'none';
    }
    stopCallTimer();
    showNotification('Call ended', 'info');
}

function holdCall() {
    showNotification('Call on hold', 'info');
}

function muteCall() {
    showNotification('Call muted', 'info');
}

function sendSMS() {
    switchPhoneTab('sms');
}

function sendSMSMessage() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const message = document.getElementById('smsMessage').value;
    
    if (!phoneNumber || !message) {
        showNotification('Please enter phone number and message', 'error');
        return;
    }
    
    // Get selected caller ID
    const callerIdSelect = document.getElementById('callerIdSelect');
    const fromNumber = callerIdSelect ? callerIdSelect.value : getDefaultPhoneNumber();
    
    // Format phone number for Telnyx
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const e164Number = formattedNumber.startsWith('1') ? `+${formattedNumber}` : `+1${formattedNumber}`;
    
    // Telnyx SMS API
    fetch(`${TELNYX_API_URL}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: fromNumber,
            to: e164Number,
            text: message
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('SMS sent:', data);
        showNotification('Message sent successfully!', 'success');
        document.getElementById('smsMessage').value = '';
    })
    .catch(error => {
        console.error('Error sending SMS:', error);
        showNotification('Failed to send message', 'error');
    });
}

function showCallHistory() {
    switchPhoneTab('recent');
}

function showVoicemail() {
    showNotification('Voicemail feature coming soon', 'info');
}

function switchPhoneTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.phone-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the correct tab button
    document.querySelectorAll('.phone-tab').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tab.toLowerCase()) || 
            (tab === 'contacts' && btn.textContent.includes('Contacts')) ||
            (tab === 'recent' && btn.textContent.includes('Recent')) ||
            (tab === 'sms' && btn.textContent.includes('Messages'))) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.phone-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const tabContent = document.getElementById(tab + 'Tab');
    if (tabContent) {
        tabContent.style.display = 'block';
    }
}

function generatePhoneContacts() {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    if (clients.length === 0) {
        return '<p style="text-align: center; color: #6b7280; padding: 20px;">No contacts available</p>';
    }
    
    return clients.map(client => `
        <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; cursor: pointer;"
            onclick="selectContact('${client.phone || ''}', '${client.name}')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="margin: 0; font-weight: 600;">${client.name}</p>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${client.phone || 'No phone'}</p>
                </div>
                <button onclick="selectContact('${client.phone || ''}', '${client.name}'); event.stopPropagation();" 
                    class="btn-icon" style="background: #10b981; color: white;">
                    <i class="fas fa-phone"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function generateRecentCalls() {
    // Sample recent calls - in production, this would come from Telnyx API
    const recentCalls = [
        { number: '(555) 123-4567', name: 'John Smith', time: '2 min ago', type: 'outgoing', duration: '5:23' },
        { number: '(555) 987-6543', name: 'Sarah Johnson', time: '1 hour ago', type: 'incoming', duration: '12:45' },
        { number: '(555) 456-7890', name: 'Mike Davis', time: '3 hours ago', type: 'missed', duration: '' }
    ];
    
    return recentCalls.map(call => `
        <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-${call.type === 'incoming' ? 'arrow-down' : call.type === 'outgoing' ? 'arrow-up' : 'phone-slash'}" 
                        style="color: ${call.type === 'missed' ? '#dc2626' : '#10b981'};"></i>
                    <div>
                        <p style="margin: 0; font-weight: 600;">${call.name}</p>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                            ${call.number} • ${call.time} ${call.duration ? `• ${call.duration}` : ''}
                        </p>
                    </div>
                </div>
                <button onclick="selectContact('${call.number}', '${call.name}')" class="btn-icon">
                    <i class="fas fa-phone"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function generateMessages() {
    // Sample messages - in production, this would come from Telnyx API
    const messages = [
        { number: '(555) 123-4567', name: 'John Smith', message: 'Thanks for the quote!', time: '10 min ago' },
        { number: '(555) 987-6543', name: 'Sarah Johnson', message: 'Can we discuss the policy?', time: '2 hours ago' }
    ];
    
    return messages.map(msg => `
        <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <p style="margin: 0; font-weight: 600;">${msg.name}</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${msg.time}</p>
            </div>
            <p style="margin: 0; color: #374151;">${msg.message}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${msg.number}</p>
        </div>
    `).join('');
}

function selectContact(phone, name) {
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput && phone && phone !== 'No phone') {
        phoneInput.value = phone;
        showNotification(`Selected ${name}`, 'info');
    }
}

let callTimerInterval;
let callSeconds = 0;

function startCallTimer() {
    callSeconds = 0;
    callTimerInterval = setInterval(() => {
        callSeconds++;
        const minutes = Math.floor(callSeconds / 60);
        const seconds = callSeconds % 60;
        const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const callDuration = document.getElementById('callDuration');
        if (callDuration) {
            callDuration.textContent = duration;
        }
    }, 1000);
}

function stopCallTimer() {
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callSeconds = 0;
    }
}

function addPhoneToolStyles() {
    if (!document.getElementById('phone-tool-styles')) {
        const style = document.createElement('style');
        style.id = 'phone-tool-styles';
        style.textContent = `
            .dial-btn:hover {
                background: #10b981 !important;
                color: white !important;
                transform: scale(1.05);
            }
            .dial-btn:active {
                transform: scale(0.95);
            }
            .phone-tab.active {
                background: #f3f4f6 !important;
                border-bottom: 2px solid #10b981 !important;
            }
            .phone-tab:hover {
                background: #f9fafb;
            }
        `;
        document.head.appendChild(style);
    }
}

// Email Tool Functions
function openEmailTool() {
    showNotification('Email tool integration coming soon', 'info');
    // Future: Integrate with email service like SendGrid or AWS SES
}

// Notepad Tool Functions
function openNotepad() {
    const notepadModal = document.createElement('div');
    notepadModal.className = 'modal-overlay active';
    notepadModal.id = 'notepadModal';
    
    // Load saved notes from localStorage
    const savedNotes = localStorage.getItem('notepadContent') || '';
    
    notepadModal.innerHTML = `
        <div class="modal-container" style="max-width: 700px; width: 90%;">
            <div class="modal-header">
                <h2 style="margin: 0; display: flex; align-items: center;">
                    <i class="fas fa-sticky-note" style="margin-right: 10px; color: #f59e0b;"></i>
                    Quick Notepad
                </h2>
                <button class="close-btn" onclick="closeNotepad()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <textarea id="notepadContent" 
                    style="width: 100%; height: 400px; padding: 15px; border: 1px solid #e5e7eb; 
                    border-radius: 8px; font-size: 14px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    resize: vertical;" 
                    placeholder="Type your notes here...">${savedNotes}</textarea>
                <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: #6b7280; font-size: 14px;">
                        <i class="fas fa-info-circle"></i> Notes are automatically saved locally
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="clearNotepad()" class="btn-secondary">
                            <i class="fas fa-trash"></i> Clear
                        </button>
                        <button onclick="saveNotepad()" class="btn-primary">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notepadModal);
    
    // Auto-save notes as user types
    const notepadContent = document.getElementById('notepadContent');
    if (notepadContent) {
        notepadContent.addEventListener('input', () => {
            localStorage.setItem('notepadContent', notepadContent.value);
        });
    }
}

function closeNotepad() {
    const modal = document.getElementById('notepadModal');
    if (modal) {
        saveNotepad(); // Save before closing
        modal.remove();
    }
}

function saveNotepad() {
    const notepadContent = document.getElementById('notepadContent');
    if (notepadContent) {
        localStorage.setItem('notepadContent', notepadContent.value);
        showNotification('Notes saved successfully', 'success');
    }
}

function clearNotepad() {
    if (confirm('Are you sure you want to clear all notes?')) {
        const notepadContent = document.getElementById('notepadContent');
        if (notepadContent) {
            notepadContent.value = '';
            localStorage.setItem('notepadContent', '');
            showNotification('Notes cleared', 'info');
        }
    }
}

// Handle browser back/forward navigation
window.addEventListener('hashchange', function() {
    const hash = window.location.hash || '#dashboard';
    console.log('🔥 CRITICAL DEBUG: Hash changed to:', hash);
    console.log('🔥 CRITICAL DEBUG: About to call loadContent');

    // Force clear any stuck loading states and timeouts before switching
    window.leadsViewLoading = false;
    if (window.leadsRefreshTimeout) {
        clearTimeout(window.leadsRefreshTimeout);
    }
    if (window.leadsViewTimeout) {
        clearTimeout(window.leadsViewTimeout);
        window.leadsViewTimeout = null;
    }

    // Force clear dashboard content if switching away from leads to ensure clean switch
    if (hash !== '#leads') {
        const dashboardContent = document.querySelector('.dashboard-content');
        if (dashboardContent && dashboardContent.querySelector('.leads-view')) {
            console.log('Switching away from leads - forcing content clear');
            dashboardContent.innerHTML = '<div>Loading...</div>';
        }
    }

    loadContent(hash);

    // Small delay to ensure menu highlighting happens after content loading
    setTimeout(() => {
        updateActiveMenuItem(hash);
    }, 10);
});

// Update active menu item
function updateActiveMenuItem(hash) {
    // Normalize hash (handle empty or missing hash)
    const normalizedHash = hash || '#dashboard';

    // Remove active class from all menu items
    document.querySelectorAll('.sidebar li').forEach(li => {
        li.classList.remove('active');
    });

    // Add active class to current menu item
    const activeLink = document.querySelector(`.sidebar a[href="${normalizedHash}"]`);
    if (activeLink) {
        activeLink.parentElement.classList.add('active');
    } else {
        // Fallback: try to find dashboard if hash not found
        if (normalizedHash !== '#dashboard') {
            const dashboardLink = document.querySelector(`.sidebar a[href="#dashboard"]`);
            if (dashboardLink) {
                dashboardLink.parentElement.classList.add('active');
            }
        }
    }
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Quick Action Functions
function showNewQuote() {
    showModal('ratingModal');
}

function showNewClient() {
    // Reset modal for new client
    const modalHeader = document.querySelector('#clientModal .modal-header h2');
    modalHeader.textContent = 'Add New Client';

    const form = document.getElementById('newClientForm');
    form.reset();
    delete form.dataset.clientId;

    // Reset submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Client';

    showModal('clientModal');
}

function showRatingEngine() {
    showModal('ratingModal');
}

function showRenewalsList() {
    // Simulate navigation to renewals page
    updateActiveMenuItem('#renewals');
    loadRenewalsData();
}

function showClaims() {
    // Simulate navigation to claims page
    updateActiveMenuItem('#claims');
    loadClaimsData();
}

function showReports() {
    // Simulate navigation to reports page
    updateActiveMenuItem('#reports');
    generateReports();
}

// Rating Engine Functions
function getQuotes() {
    const quotesResults = document.getElementById('quotesResults');
    const button = event.target;
    
    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Quotes...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        quotesResults.style.display = 'block';
        button.innerHTML = '<i class="fas fa-search"></i> Get Quotes';
        button.disabled = false;
        
        // Animate quote cards
        const cards = quotesResults.querySelectorAll('.quote-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 2000);
}

// Panel Functions
function showPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
        setTimeout(() => {
            panel.style.transform = 'translateX(0)';
        }, 10);
    }
}

function hidePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.transform = 'translateX(100%)';
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
    }
}

// Initialize Charts
function initializeCharts() {
    // Set default chart options to prevent infinite scaling
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    
    // Removed Premium Growth and Policy Distribution charts
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Close modals on click outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                setTimeout(() => {
                    this.style.display = 'none';
                }, 300);
            }
        });
    });
    
    // Sidebar menu items - removed since we handle navigation via hashchange event
    
    // Form submissions
    const newClientForm = document.getElementById('newClientForm');
    if (newClientForm) {
        newClientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveClient();
        });
    }
    
}

// Initialize Automation
function initializeAutomation() {
    // Toggle switches
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const workflowName = this.closest('.workflow-item').querySelector('h4').textContent;
            const status = this.checked ? 'enabled' : 'disabled';
            console.log(`Workflow "${workflowName}" ${status}`);
            
            // Show notification
            showNotification(`Workflow ${status}`, 'success');
        });
    });
}

// Load Content Based on Navigation
function loadContent(section) {
    console.log('🔥 DEBUG: loadContent called with section:', section);
    console.log('🔥 DEBUG: Current location:', window.location.href);

    // Get dashboard content area
    let dashboardContent = document.querySelector('.dashboard-content');
    console.log('🔥 DEBUG: Dashboard content element found:', !!dashboardContent);

    if (!dashboardContent) {
        console.error('🔥 ERROR: Dashboard content not found!');
        return;
    }

    switch(section) {
        case '':
        case '#':
        case '#dashboard':
            // Don't clear content, instead rebuild the dashboard structure
            loadFullDashboard();
            break;
        case '#leads':
            console.log('🔥 DEBUG: About to call loadLeadsView()');
            dashboardContent.innerHTML = '<div>Loading leads from server...</div>'; // Show loading state
            console.log('🔥 DEBUG: Set loading state');
            loadLeadsView().then(() => {
                console.log('🔥 DEBUG: loadLeadsView() completed');
                setTimeout(() => {
                    console.log('🔥 DEBUG: Dashboard content after loadLeadsView:', dashboardContent.innerHTML.length, 'characters');
                    if (dashboardContent.innerHTML.length === 0) {
                        console.error('🔥 ERROR: loadLeadsView() did not add any content!');
                    }
                }, 100);
            }).catch(error => {
                console.error('🔥 ERROR: loadLeadsView() failed:', error);
            });
            break;
        case '#clients':
            dashboardContent.innerHTML = ''; // Clear content
            loadClientsView();
            break;
        case '#policies':
            dashboardContent.innerHTML = ''; // Clear content
            loadPoliciesView();
            break;
        case '#renewals':
            dashboardContent.innerHTML = ''; // Clear content
            loadRenewalsView();
            break;
        case '#lead-generation':
            dashboardContent.innerHTML = ''; // Clear content
            loadLeadGenerationView();
            break;
        case '#rating':
        case '#rating-engine':
            dashboardContent.innerHTML = ''; // Clear content
            loadRatingEngineView();
            break;
        case '#automation':
            // Show automation panel on the side
            showPanel('automationPanel');
            // Keep current view
            break;
        case '#accounting':
            dashboardContent.innerHTML = ''; // Clear content
            loadAccountingView();
            break;
        case '#reports':
            console.log('🔥 DEBUG: About to call loadReportsView()');
            dashboardContent.innerHTML = ''; // Clear content
            console.log('🔥 DEBUG: Cleared dashboard content');
            loadReportsView();
            console.log('🔥 DEBUG: Called loadReportsView()');
            // Check if content was added
            setTimeout(() => {
                console.log('🔥 DEBUG: Dashboard content after loadReportsView:', dashboardContent.innerHTML.length, 'characters');
                if (dashboardContent.innerHTML.length === 0) {
                    console.error('🔥 ERROR: loadReportsView() did not add any content!');
                }
            }, 100);
            break;
        case '#communications':
            dashboardContent.innerHTML = ''; // Clear content
            loadCommunicationsView();
            break;
        case '#carriers':
            dashboardContent.innerHTML = ''; // Clear content
            loadCarriersView();
            break;
        case '#producers':
            dashboardContent.innerHTML = ''; // Clear content
            loadProducersView();
            break;
        case '#settings':
            dashboardContent.innerHTML = ''; // Clear content
            loadSettingsView();
            break;
        case '#analytics':
            dashboardContent.innerHTML = ''; // Clear content
            loadAnalyticsView();
            break;
        case '#integrations':
            dashboardContent.innerHTML = ''; // Clear content
            loadIntegrationsView();
            break;
        case '#coi':
            dashboardContent.innerHTML = ''; // Clear content
            loadCOIView();
            break;
        default:
            // Default to dashboard
            loadDashboardView();
            break;
    }
}

// Save Client Function
function saveClient() {
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('newClientForm');
    
    // Get form data
    const formData = new FormData(form);

    // Debug: Log all form data
    console.log('=== FORM DATA DEBUG ===');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    console.log('=======================');

    // Create client object
    const firstName = formData.get('firstName') || '';
    const lastName = formData.get('lastName') || '';
    const clientName = `${firstName} ${lastName}`.trim();
    
    // Validate required fields
    if (!clientName || !formData.get('clientEmail') || !formData.get('clientPhone')) {
        alert('Please fill in all required fields (Name, Email, Phone)');
        return;
    }
    
    // Check if this is an edit or new client
    const isEditing = form.dataset.clientId;

    const clientData = {
        name: clientName,
        email: formData.get('clientEmail'),
        phone: formData.get('clientPhone'),
        address: formData.get('clientAddress') || '',
        city: formData.get('clientCity') || '',
        state: formData.get('clientState') || '',
        zip: formData.get('clientZip') || '',
        type: formData.get('clientType') || 'Personal',
        status: 'Active',
        assignedTo: formData.get('assignedTo') || '',
        representative: formData.get('representative') || ''
    };

    if (isEditing) {
        // Update existing client - keep original ID type
        const originalId = form.dataset.clientId;
        // Try to parse as number if it looks like a number, otherwise keep as string
        clientData.id = isNaN(originalId) ? originalId : parseInt(originalId);
        console.log('Original ID from form:', originalId, 'Parsed ID:', clientData.id);
    } else {
        // New client
        clientData.id = Date.now();
        clientData.createdAt = new Date().toISOString();
        clientData.policies = [];
        clientData.totalPremium = 0;
    }

    const newClient = clientData;

    console.log('Client data to save:', newClient);
    console.log('Is editing?', isEditing);
    
    // Get existing clients
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    console.log('Existing clients:', clients.length);

    if (isEditing) {
        // Update existing client
        const targetId = newClient.id;
        console.log('Looking for client with ID:', targetId, '(type:', typeof targetId, ')');

        // Log all existing client IDs for comparison
        console.log('Existing client IDs:', clients.map(c => `${c.id} (${typeof c.id})`));

        // Try multiple comparison methods to find the client
        let clientIndex = clients.findIndex(c => c.id == targetId);
        if (clientIndex === -1) {
            clientIndex = clients.findIndex(c => c.id === targetId);
        }
        if (clientIndex === -1) {
            clientIndex = clients.findIndex(c => String(c.id) === String(targetId));
        }

        console.log('Found client at index:', clientIndex);

        if (clientIndex !== -1) {
            console.log('Before update:', clients[clientIndex]);
            // Preserve existing policies and other data
            newClient.policies = clients[clientIndex].policies || [];
            newClient.totalPremium = clients[clientIndex].totalPremium || 0;
            newClient.createdAt = clients[clientIndex].createdAt;
            clients[clientIndex] = newClient;
            console.log('After update:', clients[clientIndex]);
            console.log('Updated existing client successfully');
        } else {
            console.error('Could not find client to update! Target ID:', targetId);
            alert('Error: Could not find client to update. Please try refreshing the page.');
            return;
        }
    } else {
        // Add new client
        clients.push(newClient);
        console.log('Total clients after adding:', clients.length);
    }

    // Save to localStorage
    localStorage.setItem('insurance_clients', JSON.stringify(clients));
    console.log('Saved to localStorage');
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Reset form
        form.reset();
        
        // Close modal
        closeModal('clientModal');
        
        // Show success notification
        const successMessage = isEditing ? 'Client updated successfully!' : 'Client added successfully!';
        showNotification(successMessage, 'success');

        // If we're editing and viewing a client profile, refresh it
        if (isEditing && window.currentViewingClientId) {
            setTimeout(() => {
                viewClient(window.currentViewingClientId);
            }, 100);
        }
        
        // Add real activity for this client
        const activitiesList = document.querySelector('.activities-list');
        if (activitiesList) {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon success">
                    <i class="fas fa-user-plus"></i>
                </div>
                <div class="activity-details">
                    <p><strong>New Client Added</strong> - ${newClient.name}</p>
                    <span class="activity-time">Just now</span>
                </div>
            `;
            activitiesList.insertBefore(activityItem, activitiesList.firstChild);
            
            // Remove last item if too many
            if (activitiesList.children.length > 5) {
                activitiesList.removeChild(activitiesList.lastChild);
            }
        }
        
        // Reload clients view to show new client
        loadClientsView();
        
        // Update client count
        updateClientCount();
        
        // Reset button
        submitBtn.innerHTML = 'Add Client';
        submitBtn.disabled = false;
    }, 500);
}

// Update Dashboard Stats
function updateDashboardStats() {
    console.log('Updating dashboard statistics...');

    // Get data from localStorage (which is synced from server)
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

    // Calculate Active Clients (clients with at least one active policy)
    const activeClients = clients.filter(client => {
        if (client.policies && Array.isArray(client.policies) && client.policies.length > 0) {
            // Check if any of the client's policies are active
            return client.policies.some(policyId => {
                const policy = policies.find(p => p.id === policyId);
                if (policy) {
                    const status = (policy.policyStatus || policy.status || '').toLowerCase();
                    return status === 'active' || status === 'in-force' || status === 'current';
                }
                return false;
            });
        }
        return false;
    }).length;

    // Calculate Active Policies
    const activePolicies = policies.filter(policy => {
        const status = (policy.policyStatus || policy.status || '').toLowerCase();
        return status === 'active' || status === 'in-force' || status === 'current';
    }).length;

    // Calculate All Time Premium (sum of all policy premiums)
    let totalPremium = 0;
    policies.forEach(policy => {
        const premiumValue = policy.financial?.['Annual Premium'] ||
                           policy.financial?.['Premium'] ||
                           policy.premium ||
                           policy.annualPremium || 0;

        let numValue = 0;
        if (typeof premiumValue === 'number') {
            numValue = premiumValue;
        } else if (typeof premiumValue === 'string') {
            const cleanValue = premiumValue.replace(/[$,\s]/g, '');
            numValue = parseFloat(cleanValue) || 0;
        }
        totalPremium += numValue;
    });

    // Calculate Monthly Lead Premium (sum of premiums from leads in current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let monthlyLeadPremium = 0;

    leads.forEach(lead => {
        const leadDate = new Date(lead.createdDate || lead.timestamp || lead.date);
        if (leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear) {
            const premium = lead.premium || lead.estimatedPremium || 0;
            let numValue = 0;
            if (typeof premium === 'number') {
                numValue = premium;
            } else if (typeof premium === 'string') {
                const cleanValue = premium.replace(/[$,\s]/g, '');
                numValue = parseFloat(cleanValue) || 0;
            }
            monthlyLeadPremium += numValue;
        }
    });

    // Update the dashboard display
    const activeClientsElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
    const activePoliciesElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
    const totalPremiumElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
    const monthlyLeadElement = document.querySelector('.stat-card:nth-child(4) .stat-value');

    if (activeClientsElement) {
        activeClientsElement.textContent = activeClients.toString();
    }

    if (activePoliciesElement) {
        activePoliciesElement.textContent = activePolicies.toString();
    }

    if (totalPremiumElement) {
        if (totalPremium >= 1000000) {
            totalPremiumElement.textContent = '$' + (totalPremium / 1000000).toFixed(1) + 'M';
        } else if (totalPremium >= 1000) {
            totalPremiumElement.textContent = '$' + (totalPremium / 1000).toFixed(0) + 'K';
        } else {
            totalPremiumElement.textContent = '$' + totalPremium.toFixed(0);
        }
    }

    if (monthlyLeadElement) {
        if (monthlyLeadPremium >= 1000000) {
            monthlyLeadElement.textContent = '$' + (monthlyLeadPremium / 1000000).toFixed(1) + 'M';
        } else if (monthlyLeadPremium >= 1000) {
            monthlyLeadElement.textContent = '$' + (monthlyLeadPremium / 1000).toFixed(0) + 'K';
        } else {
            monthlyLeadElement.textContent = '$' + monthlyLeadPremium.toFixed(0);
        }
    }

    console.log('Dashboard stats updated:', {
        activeClients,
        activePolicies,
        totalPremium,
        monthlyLeadPremium
    });
}

// Make updateDashboardStats available globally
window.updateDashboardStats = updateDashboardStats;

// Add New Activity
function addNewActivity() {
    const activities = [
        { icon: 'check', type: 'success', text: 'New Policy Issued', details: 'Auto Insurance', amount: '$1,500/year' },
        { icon: 'user', type: 'info', text: 'New Lead Captured', details: 'Web Form' },
        { icon: 'clock', type: 'warning', text: 'Policy Renewal Due', details: 'Homeowners', amount: '$2,800/year' },
        { icon: 'calculator', type: 'success', text: 'Quote Generated', details: 'Commercial Property' }
    ];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const activitiesList = document.querySelector('.activities-list');
    
    if (activitiesList) {
        const newItem = document.createElement('div');
        newItem.className = 'activity-item';
        newItem.style.opacity = '0';
        newItem.innerHTML = `
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-details">
                <p><strong>${activity.text}</strong> - ${activity.details}</p>
                <span class="activity-time">Just now</span>
            </div>
            ${activity.amount ? `<span class="activity-amount">${activity.amount}</span>` : ''}
        `;
        
        activitiesList.insertBefore(newItem, activitiesList.firstChild);
        
        // Animate in
        setTimeout(() => {
            newItem.style.transition = 'opacity 0.5s ease';
            newItem.style.opacity = '1';
        }, 10);
        
        // Remove last item if too many
        if (activitiesList.children.length > 5) {
            activitiesList.removeChild(activitiesList.lastChild);
        }
    }
}

// Load Upcoming Renewals
function loadUpcomingRenewals() {
    const container = document.getElementById('renewals-list-container');
    if (!container) return;
    
    // Get policies from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Filter policies expiring within 30 days
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = policies.filter(policy => {
        if (policy.renewalDate || policy.expiryDate) {
            const renewalTime = new Date(policy.renewalDate || policy.expiryDate).getTime();
            return renewalTime <= thirtyDaysFromNow && renewalTime > Date.now();
        }
        return false;
    });
    
    if (upcomingRenewals.length === 0) {
        // Show no renewals message
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #999;">
                <i class="fas fa-calendar-check" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i>
                <p style="margin: 0; font-size: 16px;">No upcoming renewals in the next 30 days</p>
            </div>
        `;
    } else {
        // Build HTML for renewals
        const html = upcomingRenewals.slice(0, 4).map(policy => {
            const date = new Date(policy.renewalDate || policy.expiryDate);
            const daysLeft = Math.ceil((date - Date.now()) / (1000 * 60 * 60 * 24));
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
            });
            
            return `
                <div class="renewal-item">
                    <div class="renewal-info">
                        <p class="client-name">${policy.clientName || 'Unknown Client'}</p>
                        <p class="policy-type">${policy.type || 'Insurance'}</p>
                    </div>
                    <div class="renewal-date">
                        <span class="date">${formattedDate}</span>
                        <span class="days-left">${daysLeft} days</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles if not exists
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 90px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 3000;
                animation: slideIn 0.3s ease;
            }
            
            .notification.success {
                border-left: 4px solid #10b981;
            }
            
            .notification.info {
                border-left: 4px solid #0066cc;
            }
            
            .notification i {
                font-size: 1.25rem;
            }
            
            .notification.success i {
                color: #10b981;
            }
            
            .notification.info i {
                color: #0066cc;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Helper Functions
// Note: highlightMenuItem() removed - use updateActiveMenuItem() instead

function updateClientCount() {
    const clientCount = document.querySelector('.sidebar a[href="#clients"] .count');
    if (clientCount) {
        let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');

        // Get current user and filter clients for non-admin users
        const sessionData = sessionStorage.getItem('vanguard_user');
        if (sessionData) {
            try {
                const user = JSON.parse(sessionData);
                const currentUser = user.username;
                const isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());

                if (!isAdmin) {
                    clients = clients.filter(client => {
                        const assignedTo = client.assignedTo || client.agent || 'Grant';
                        return assignedTo.toLowerCase() === currentUser.toLowerCase();
                    });
                }
            } catch (error) {
                console.error('Error parsing session data:', error);
            }
        }

        clientCount.textContent = clients.length;
    }

    // Also update dashboard stats if on dashboard view
    if (document.querySelector('.dashboard-content .stat-card')) {
        updateDashboardStats();
    }
}

// View Loading Functions - Full Implementation

function loadFullDashboard() {
    console.log('Loading full dashboard...');
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        console.log('No dashboard content found');
        return;
    }

    // Check if dashboard is already built to avoid unnecessary rebuilds
    const existingStatsGrid = dashboardContent.querySelector('.stats-grid');
    if (existingStatsGrid) {
        console.log('Dashboard already exists, updating data only...');
        // Just update stats and todos without rebuilding
        updateDashboardStats();
        setTimeout(() => {
            loadTodos();
            loadReminderStats();
        }, 100);
        return;
    }

    // Rebuild the entire dashboard structure
    dashboardContent.innerHTML = `
        <!-- Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-details">
                    <h3>Active Clients</h3>
                    <p class="stat-number stat-value">0</p>
                    <span class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> 0% from last month
                    </span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="fas fa-file-contract"></i>
                </div>
                <div class="stat-details">
                    <h3>Active Policies</h3>
                    <p class="stat-number stat-value">0</p>
                    <span class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> 0% from last month
                    </span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-details">
                    <h3>All Time Premium</h3>
                    <p class="stat-number stat-value">$0</p>
                    <span class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> 0% from last month
                    </span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-details">
                    <h3>Monthly Lead Premium</h3>
                    <p class="stat-number stat-value">$0</p>
                    <span class="stat-change positive">
                        <i class="fas fa-arrow-up"></i> 0% from last month
                    </span>
                </div>
            </div>
        </div>


        <!-- Main Sections -->
        <div class="dashboard-sections" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- To-Do List -->
            <div class="section-card todo-container">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>To-Do</h2>
                    <div style="display: flex; gap: 5px;" id="todoViewButtons">
                        <button id="personalTodoBtn" class="btn-sm active" onclick="switchTodoView('personal')" style="
                            padding: 5px 10px;
                            font-size: 0.8rem;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Personal</button>
                        <button id="agencyTodoBtn" class="btn-sm" onclick="switchTodoView('agency')" style="
                            padding: 5px 10px;
                            font-size: 0.8rem;
                            background: #e5e7eb;
                            color: #6b7280;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Agency</button>
                        <button id="assignTodoBtn" class="btn-sm" onclick="switchTodoView('assign')" style="
                            padding: 5px 10px;
                            font-size: 0.8rem;
                            background: #e5e7eb;
                            color: #6b7280;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            display: none;
                        ">Assign</button>
                    </div>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;" id="todoInputContainer">
                        <input type="text" id="todoInput" placeholder="Add a new task..."
                            style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; margin-bottom: 10px;"
                            onkeypress="if(event.key === 'Enter') addTodo()">
                        <div id="assignDropdownContainer" style="display: none;">
                            <select id="assignToSelect" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; margin-bottom: 10px;">
                                <option value="">Assign to...</option>
                                <option value="Hunter">Hunter</option>
                                <option value="Carson">Carson</option>
                            </select>
                            <button onclick="addTodo()" style="
                                width: 100%;
                                padding: 10px;
                                background: #3b82f6;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-size: 14px;
                                cursor: pointer;
                                font-weight: 500;
                            ">Assign Task</button>
                        </div>
                    </div>
                    <div id="todoList" style="max-height: 320px; overflow-y: auto;">
                        <!-- To-do items will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Reminders & Renewals -->
            <div class="section-card">
                <div class="section-header">
                    <h2>Reminders & Renewals</h2>
                </div>
                <div class="reminder-stats" id="reminder-stats-container" style="padding: 20px;">
                    <!-- Reminder statistics will be dynamically populated here -->
                </div>
            </div>
        </div>
    `;
    
    // Immediately update dashboard stats and activities after creating the structure
    if (window.DashboardStats) {
        const dashboardStats = new DashboardStats();
        dashboardStats.updateDashboard();
    }
    
    if (window.recentActivities) {
        window.recentActivities.updateDisplay();
    }
    
    if (window.dashboardRenewals) {
        window.dashboardRenewals.updateRenewalsDisplay();
    }
    
    // Now call loadDashboardView to add the To-Do box after a short delay to ensure DOM is ready
    setTimeout(() => {
        loadDashboardView();
    }, 50);
}

function loadDashboardView() {
    console.log('Loading dashboard view...');
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        console.log('No dashboard content found');
        return;
    }

    // Update dashboard statistics
    setTimeout(() => {
        updateDashboardStats();
    }, 100);

    // Reinitialize todos and reminder stats after content load
    setTimeout(() => {
        if (typeof Chart !== 'undefined') {
            initializeCharts();
        }
        loadTodos(); // Load todos on dashboard initialization
        loadReminderStats(); // Load reminder statistics
    }, 100);
}

// Load Reminder Statistics
function loadReminderStats(retryCount = 0) {
    const reminderStatsContainer = document.getElementById('reminder-stats-container');
    if (!reminderStatsContainer) {
        if (retryCount < 3) {
            console.log(`Reminder stats container not found, retrying... (attempt ${retryCount + 1})`);
            setTimeout(() => {
                loadReminderStats(retryCount + 1);
            }, 100);
        } else {
            console.error('Reminder stats container not found after 3 attempts');
        }
        return;
    }

    console.log('Loading reminder statistics...');

    // Get data from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

    // Calculate stats
    const today = new Date();

    // 60-day upcoming renewals
    const sixtyDaysFromNow = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000));
    const upcomingRenewals60d = policies.filter(policy => {
        if (policy.expirationDate) {
            const expiryDate = new Date(policy.expirationDate);
            return expiryDate >= today && expiryDate <= sixtyDaysFromNow;
        }
        return false;
    }).length;

    // New clients with unsent gifts (clients added in last 30 days without birthday gift)
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const newClientsUnsent = clients.filter(client => {
        const createdDate = client.created || client.dateAdded;
        if (createdDate) {
            const created = new Date(createdDate);
            return created >= thirtyDaysAgo && !client.giftSent;
        }
        return false;
    }).length;

    // 30-day upcoming birthdays
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    let upcomingBirthdays30d = 0;

    // Count birthdays from clients
    clients.forEach(client => {
        if (client.dateOfBirth) {
            const birthDate = new Date(client.dateOfBirth);
            const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());

            const upcomingBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
            if (upcomingBirthday >= today && upcomingBirthday <= thirtyDaysFromNow) {
                upcomingBirthdays30d++;
            }
        }
    });

    // Count birthdays from policy insured data
    policies.forEach(policy => {
        if (policy.insured?.['Date of Birth/Inception']) {
            try {
                const birthDate = new Date(policy.insured['Date of Birth/Inception']);
                if (!isNaN(birthDate.getTime()) && birthDate.getFullYear() > 1900 && birthDate.getFullYear() < today.getFullYear()) {
                    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                    const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());

                    const upcomingBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
                    if (upcomingBirthday >= today && upcomingBirthday <= thirtyDaysFromNow) {
                        upcomingBirthdays30d++;
                    }
                }
            } catch (error) {
                // Invalid date format, skip
            }
        }
    });

    // Policies needing updates (expired or expiring within 7 days)
    const sevenDaysFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    const policiesNeedingUpdate = policies.filter(policy => {
        if (policy.expirationDate) {
            const expiryDate = new Date(policy.expirationDate);
            return expiryDate <= sevenDaysFromNow;
        }
        return false;
    }).length;

    // New COI Emails (from local storage if available)
    const newCoiEmails = JSON.parse(localStorage.getItem('new_coi_emails') || '[]').length;

    // Generate the stats HTML with clickable titles
    reminderStatsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; cursor: pointer; transition: transform 0.2s;"
                 onclick="navigateToTab('#renewals')"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0; font-size: 0.8rem; color: #6b7280; font-weight: 500;">60d Renewals</p>
                        <p style="margin: 5px 0 0 0; font-size: 1.4rem; font-weight: 700; color: #1f2937;">${upcomingRenewals60d}</p>
                    </div>
                    <i class="fas fa-calendar-alt" style="font-size: 1.2rem; color: #3b82f6;"></i>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; cursor: pointer; transition: transform 0.2s;"
                 onclick="navigateToTab('#communications')"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0; font-size: 0.8rem; color: #92400e; font-weight: 500;">New Clients Gifts</p>
                        <p style="margin: 5px 0 0 0; font-size: 1.4rem; font-weight: 700; color: #92400e;">${newClientsUnsent}</p>
                    </div>
                    <i class="fas fa-gift" style="font-size: 1.2rem; color: #f59e0b;"></i>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; cursor: pointer; transition: transform 0.2s;"
                 onclick="navigateToTab('#communications')"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0; font-size: 0.8rem; color: #047857; font-weight: 500;">30d Birthdays</p>
                        <p style="margin: 5px 0 0 0; font-size: 1.4rem; font-weight: 700; color: #047857;">${upcomingBirthdays30d}</p>
                    </div>
                    <i class="fas fa-birthday-cake" style="font-size: 1.2rem; color: #10b981;"></i>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; cursor: pointer; transition: transform 0.2s;"
                 onclick="navigateToTab('#policies')"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0; font-size: 0.8rem; color: #dc2626; font-weight: 500;">Policies to Update</p>
                        <p style="margin: 5px 0 0 0; font-size: 1.4rem; font-weight: 700; color: #dc2626;">${policiesNeedingUpdate}</p>
                    </div>
                    <i class="fas fa-exclamation-triangle" style="font-size: 1.2rem; color: #ef4444;"></i>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #06b6d4; grid-column: 1 / -1; cursor: pointer; transition: transform 0.2s;"
                 onclick="navigateToTab('#coi')"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0; font-size: 0.8rem; color: #0c4a6e; font-weight: 500;">New COI Emails</p>
                        <p style="margin: 5px 0 0 0; font-size: 1.4rem; font-weight: 700; color: #0c4a6e;">${newCoiEmails}</p>
                    </div>
                    <i class="fas fa-envelope" style="font-size: 1.2rem; color: #06b6d4;"></i>
                </div>
            </div>
        </div>
    `;

    console.log('Reminder statistics loaded:', {
        upcomingRenewals60d,
        newClientsUnsent,
        upcomingBirthdays30d,
        policiesNeedingUpdate,
        newCoiEmails
    });
}

// Navigation function for reminder stats
function navigateToTab(hash) {
    console.log('Navigating to tab:', hash);

    // Update the URL hash
    window.location.hash = hash;

    // Update the active menu item
    updateActiveMenuItem(hash);

    // Load the appropriate content
    loadContent(hash);
}

// To-Do List Management Functions
let currentTodoView = 'personal'; // Track current view
let currentAssignView = 'normal'; // Track assignment mode (normal or assign)

// Get current user from session data
function getCurrentUser() {
    const sessionData = sessionStorage.getItem('vanguard_user');
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            return user.username || 'User';
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }
    return 'User';
}

// Check if current user is admin
function isCurrentUserAdmin() {
    const currentUser = getCurrentUser();
    return ['grant', 'maureen'].includes(currentUser.toLowerCase());
}

// Make functions globally accessible
window.switchTodoView = function switchTodoView(view) {
    currentTodoView = view;

    // Update button styles
    const personalBtn = document.getElementById('personalTodoBtn');
    const agencyBtn = document.getElementById('agencyTodoBtn');
    const assignBtn = document.getElementById('assignTodoBtn');
    const assignDropdown = document.getElementById('assignDropdownContainer');
    const todoInput = document.getElementById('todoInput');

    if (personalBtn && agencyBtn) {
        // Reset all buttons
        personalBtn.style.background = '#e5e7eb';
        personalBtn.style.color = '#6b7280';
        agencyBtn.style.background = '#e5e7eb';
        agencyBtn.style.color = '#6b7280';
        if (assignBtn) {
            assignBtn.style.background = '#e5e7eb';
            assignBtn.style.color = '#6b7280';
        }

        // Set active button
        if (view === 'personal') {
            personalBtn.style.background = '#3b82f6';
            personalBtn.style.color = 'white';
        } else if (view === 'agency') {
            agencyBtn.style.background = '#3b82f6';
            agencyBtn.style.color = 'white';
        } else if (view === 'assign') {
            if (assignBtn) {
                assignBtn.style.background = '#3b82f6';
                assignBtn.style.color = 'white';
            }
        }

        // Show/hide assignment UI
        if (view === 'assign') {
            if (assignDropdown) assignDropdown.style.display = 'block';
            if (todoInput) {
                todoInput.style.marginBottom = '0';
                todoInput.placeholder = 'Enter task to assign...';
            }
        } else {
            if (assignDropdown) assignDropdown.style.display = 'none';
            if (todoInput) {
                todoInput.style.marginBottom = '10px';
                todoInput.placeholder = 'Add a new task...';
            }
        }
    }

    loadTodos();
}

window.loadTodos = function loadTodos() {
    const todoList = document.getElementById('todoList');
    const assignBtn = document.getElementById('assignTodoBtn');

    if (!todoList) return;

    // Show/hide assign button based on admin status
    const isAdmin = isCurrentUserAdmin();
    const currentUser = getCurrentUser();

    if (assignBtn) {
        assignBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }


    // Get todos from localStorage
    const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
    let agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
    const hunterTodos = JSON.parse(localStorage.getItem('hunterAssignedTodos') || '[]');
    const carsonTodos = JSON.parse(localStorage.getItem('carsonAssignedTodos') || '[]');

    // Add some default agency todos if none exist (for demo)
    if (agencyTodos.length === 0) {
        agencyTodos = [
            {
                text: 'Review quarterly reports',
                completed: false,
                date: new Date(Date.now() - 86400000).toISOString(),
                author: 'Sarah Manager'
            },
            {
                text: 'Update carrier contact list',
                completed: true,
                date: new Date(Date.now() - 172800000).toISOString(),
                author: 'Mike Sales',
                completedBy: 'John Agent',
                completedDate: new Date(Date.now() - 86400000).toISOString()
            },
            {
                text: 'Schedule team training session',
                completed: false,
                date: new Date(Date.now() - 259200000).toISOString(),
                author: 'Lisa HR'
            }
        ];
        localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));
    }

    let todosToShow = [];

    if (currentTodoView === 'personal') {
        // Show personal todos including assigned ones
        todosToShow = [...personalTodos];

        // Add assigned todos if current user is Hunter or Carson
        if (currentUser.toLowerCase() === 'hunter') {
            todosToShow = [...todosToShow, ...hunterTodos];
        } else if (currentUser.toLowerCase() === 'carson') {
            todosToShow = [...todosToShow, ...carsonTodos];
        }
    } else if (currentTodoView === 'agency') {
        todosToShow = agencyTodos;
    } else if (currentTodoView === 'assign') {
        // Show assignment interface
        todoList.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 20px;">
                <i class="fas fa-user-plus" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Enter a task above and select who to assign it to.</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Tasks will appear on the assigned user's Personal list.</p>
            </div>
        `;
        return;
    }
    
    if (todosToShow.length === 0) {
        todoList.innerHTML = `
            <div style="text-align: center; color: #9ca3af; padding: 20px;">
                <i class="fas fa-tasks" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No tasks yet. Add one above!</p>
            </div>
        `;
        return;
    }
    
    todoList.innerHTML = todosToShow.map((todo, index) => `
        <div class="todo-item" style="
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            margin-bottom: 8px;
            background: ${todo.completed ? '#f9fafb' : 'white'};
        ">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <input type="checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo(${index})"
                    style="margin-top: 3px; cursor: pointer;">
                <div style="flex: 1;">
                    <div style="${todo.completed ? 'text-decoration: line-through; color: #9ca3af;' : todo.assigned ? 'color: #dc2626;' : ''}">
                        ${todo.text}
                        ${todo.assigned ? '<span style="color: #dc2626; font-size: 0.8rem; font-weight: 600; margin-left: 8px;">Assigned</span>' : ''}
                    </div>
                    ${currentTodoView === 'agency' ? `
                        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                            <small style="color: #6b7280; font-size: 0.75rem;">
                                <i class="fas fa-user"></i> ${todo.author}
                            </small>
                            <small style="color: #9ca3af; font-size: 0.75rem;">
                                ${new Date(todo.date).toLocaleDateString()}
                            </small>
                        </div>
                    ` : ''}
                </div>
                ${currentTodoView === 'personal' || todo.author === getCurrentUser() ? `
                    <button onclick="deleteTodo(${index})" style="
                        background: none;
                        border: none;
                        color: #ef4444;
                        cursor: pointer;
                        padding: 0;
                    ">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

window.addTodo = function addTodo() {
    const input = document.getElementById('todoInput');
    const assignSelect = document.getElementById('assignToSelect');

    if (!input || !input.value.trim()) return;

    const currentUser = getCurrentUser();

    const newTodo = {
        text: input.value.trim(),
        completed: false,
        date: new Date().toISOString(),
        author: currentUser
    };

    if (currentTodoView === 'assign') {
        // Handle assignment mode
        const assignTo = assignSelect ? assignSelect.value : '';
        if (!assignTo) {
            alert('Please select who to assign this task to.');
            return;
        }

        // Add assigned flag and assignee info
        newTodo.assigned = true;
        newTodo.assignedTo = assignTo;
        newTodo.assignedBy = currentUser;

        // Store in the assigned user's personal todo list
        const assignedTodosKey = `${assignTo.toLowerCase()}AssignedTodos`;
        const assignedTodos = JSON.parse(localStorage.getItem(assignedTodosKey) || '[]');
        assignedTodos.unshift(newTodo);
        localStorage.setItem(assignedTodosKey, JSON.stringify(assignedTodos));

        // Reset form
        if (assignSelect) assignSelect.value = '';
    } else if (currentTodoView === 'personal') {
        const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
        personalTodos.unshift(newTodo); // Add to beginning
        localStorage.setItem('personalTodos', JSON.stringify(personalTodos));
    } else {
        const agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
        agencyTodos.unshift(newTodo); // Add to beginning
        localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));
    }

    input.value = '';
    loadTodos();
}

window.toggleTodo = function toggleTodo(index) {
    if (currentTodoView === 'personal') {
        const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
        personalTodos[index].completed = !personalTodos[index].completed;
        localStorage.setItem('personalTodos', JSON.stringify(personalTodos));
    } else {
        const agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
        agencyTodos[index].completed = !agencyTodos[index].completed;
        // In agency view, also track who completed it
        if (agencyTodos[index].completed) {
            agencyTodos[index].completedBy = currentUser;
            agencyTodos[index].completedDate = new Date().toISOString();
        }
        localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));
    }
    
    loadTodos();
}

function deleteTodo(index) {
    if (currentTodoView === 'personal') {
        const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
        personalTodos.splice(index, 1);
        localStorage.setItem('personalTodos', JSON.stringify(personalTodos));
    } else {
        const agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
        // Only allow deleting own todos in agency view
        if (agencyTodos[index].author === getCurrentUser()) {
            agencyTodos.splice(index, 1);
            localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));
        }
    }
    
    loadTodos();
}

// Helper function to get stage HTML with colored badge
function getStageHtml(stage, lead) {
    const stageColors = {
        'new': 'stage-new',
        'contact_attempted': 'stage-contact-attempted',
        'info_requested': 'stage-info-requested',
        'info_received': 'stage-info-received',
        'loss_runs_requested': 'stage-loss-runs-requested',
        'loss_runs_received': 'stage-loss-runs-received',
        'qualified': 'stage-qualified',
        'quoted': 'stage-quoted',
        'quote_sent': 'stage-quote-sent',
        'quoted sent': 'stage-quote-sent',
        'quote-sent-unaware': 'stage-quote-sent-unaware',
        'quote-sent-aware': 'stage-quote-sent-aware',
        'interested': 'stage-interested',
        'intested': 'stage-interested',
        'not-interested': 'stage-not-interested',
        'closed': 'stage-closed',
        'contacted': 'stage-contacted',
        'reviewed': 'stage-reviewed',
        'converted': 'stage-converted'
    };

    const stageLabels = {
        'new': 'New',
        'contact_attempted': 'Contact Attempted',
        'info_requested': 'Info Requested',
        'info_received': 'Info Received',
        'loss_runs_requested': 'Loss Runs Requested',
        'loss_runs_received': 'Loss Runs Received',
        'app_prepared': 'App Prepared',
        'app_sent': 'App Sent',
        'app_quote_received': 'App Quote Received',
        'app_quote_sent': 'App Quote Sent',
        'qualified': 'Info Requested',
        'quoted': 'Quoted',
        'quote_sent': 'Quote Sent',
        'quoted sent': 'Quote Sent',
        'quote-sent-unaware': 'Quote Sent (Unaware)',
        'quote-sent-aware': 'Quote Sent (Aware)',
        'interested': 'Interested',
        'intested': 'Interested',
        'not-interested': 'Not Interested',
        'closed': 'Closed',
        'contacted': 'Contacted',
        'reviewed': 'Reviewed',
        'converted': 'Converted'
    };

    // Timestamp display has been moved to lead profile only
    return `<span class="stage-badge ${stageColors[stage] || 'stage-default'}">${stageLabels[stage] || stage}</span>`;
}

// Make getStageHtml globally accessible
window.getStageHtml = getStageHtml;

// Helper function to generate lead rows
function generateSimpleLeadRows(leads) {
    if (!leads || leads.length === 0) {
        return '<tr><td colspan="11" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
    }

    console.log(`🔥 generateSimpleLeadRows: Processing ${leads.length} leads for highlighting`);
    leads.forEach((lead, idx) => {
        console.log(`Lead ${idx}: ${lead.name} - assignedTo: ${lead.assignedTo} - stage: ${lead.stage}`);
    });

    // Get current user for dulling logic - ENHANCED DEBUG
    let currentUserName = '';
    console.log('🔍 DULLING: Starting user detection...');

    try {
        // PRIORITY 1: Real authentication from sessionStorage (login.html)
        const sessionData = sessionStorage.getItem('vanguard_user');
        console.log('🔍 DULLING: sessionData from sessionStorage:', sessionData);

        if (sessionData) {
            try {
                const user = JSON.parse(sessionData);
                currentUserName = user.username || '';
                console.log('🔐 DULLING: Using real authenticated user:', currentUserName);
            } catch (e) {
                console.error('🔍 DULLING: Failed to parse session data:', e);
            }
        }

        // PRIORITY 2: Simulated user (for testing) - only if no real auth
        if (!currentUserName) {
            const simulatedUser = localStorage.getItem('simulatedUser');
            console.log('🔍 DULLING: simulatedUser from localStorage:', simulatedUser);

            if (simulatedUser) {
                currentUserName = simulatedUser;
                console.log('🧪 DULLING: Using simulated user:', currentUserName);
            }
        }

        // PRIORITY 3: Legacy authService - only if nothing else worked
        if (!currentUserName && window.authService && window.authService.getCurrentUser) {
            const authUser = window.authService.getCurrentUser();
            currentUserName = authUser?.username || authUser?.full_name || '';
            console.log('⚡ DULLING: Using authService user:', currentUserName);
        }

        if (!currentUserName) {
            console.log('❌ DULLING: No user detected from any source');
        }
    } catch (error) {
        console.log('❌ DULLING: Error getting current user:', error);
    }

    console.log('🎯 DULLING: Final detected user:', `"${currentUserName}"`);
    console.log('🎯 DULLING: Will dull leads NOT assigned to:', `"${currentUserName}"`);

    if (!currentUserName) {
        console.log('⚠️ DULLING: No user detected - no dulling will be applied');
    }

    return leads.map(lead => {
        // Truncate name to 15 characters max
        const displayName = lead.name && lead.name.length > 15 ? lead.name.substring(0, 15) + '...' : lead.name || '';


        // Calculate highlighting during HTML generation (no continuous DOM manipulation)
        let rowStyle = '';
        let rowClass = '';

        // Get TO DO text to determine if highlighting is needed
        console.log(`🎯 TABLE GEN: Getting next action for lead ${lead.id} - ${lead.name}, stage: ${lead.stage}`);
        const todoText = (typeof getNextAction === 'function' ? getNextAction(lead.stage || 'new', lead) :
                         (window.getNextAction ? window.getNextAction(lead.stage || 'new', lead) : 'Review lead'));
        console.log(`🎯 TABLE GEN: Todo text result for lead ${lead.id}: "${todoText}"`);

        // Apply timestamp highlighting to leads EXCEPT closed leads
        // Closed leads should not be tracked by timestamps
        const isClosed = lead.stage === 'closed' || lead.stage === 'Closed';
        if (!isClosed) {
            // Find the most relevant timestamp - FIXED ORDER AND HANDLING
            let timestamp = null;
            if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                timestamp = lead.stageTimestamps[lead.stage];
            } else if (lead.stageUpdatedAt) {
                timestamp = lead.stageUpdatedAt;
            } else if (lead.updatedAt) {
                timestamp = lead.updatedAt;
            } else if (lead.createdAt) {
                timestamp = lead.createdAt;
            } else if (lead.created) {
                // Convert from MM/DD/YYYY format if needed
                const parts = lead.created.split('/');
                if (parts.length === 3) {
                    timestamp = new Date(parts[2], parts[0] - 1, parts[1]).toISOString();
                } else {
                    timestamp = lead.created;
                }
            }

            if (timestamp) {
                const date = new Date(timestamp);
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const diffMs = todayStart - dateStart;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                // Debug logging for timestamp highlighting in table generation
                console.log(`📊 generateSimpleLeadRows: ${lead.name} - ${diffDays} days old - timestamp: ${timestamp} - assignedTo: ${lead.assignedTo}`);

                if (diffDays === 1) {
                    // Yellow for 1 day old - URGENT TIMELINE
                    rowStyle = 'style="background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important; border-right: 2px solid #f59e0b !important;"';
                    rowClass = 'timestamp-yellow force-persistent-highlight';
                    console.log(`🟡 Built-in highlighting: ${lead.name} -> YELLOW (1 day)`);
                } else if (diffDays === 2) {
                    // Orange for 2 days old - URGENT TIMELINE
                    rowStyle = 'style="background-color: #fed7aa !important; border-left: 4px solid #fb923c !important; border-right: 2px solid #fb923c !important;"';
                    rowClass = 'timestamp-orange force-persistent-highlight';
                    console.log(`🟠 Built-in highlighting: ${lead.name} -> ORANGE (2 days)`);
                } else if (diffDays >= 3) {
                    // Red for 3+ days old - URGENT TIMELINE
                    rowStyle = 'style="background-color: #fecaca !important; border-left: 4px solid #ef4444 !important; border-right: 2px solid #ef4444 !important;"';
                    rowClass = 'timestamp-red force-persistent-highlight';
                    console.log(`🔴 Built-in highlighting: ${lead.name} -> RED (${diffDays} days)`);
                }
            } else {
                console.log(`⚪ generateSimpleLeadRows: ${lead.name} - No timestamp found`);
            }
        } else {
            console.log(`⚫ generateSimpleLeadRows: ${lead.name} - CLOSED LEAD - skipping timestamp highlighting`);
        }

        // OVERRIDE: Apply grey highlighting for "Process complete" TODO (including closed leads)
        if (todoText && (todoText.toLowerCase().includes('process complete') || todoText.includes('Process complete'))) {
            // Grey for "Process complete" TODO - OVERRIDES timestamp highlighting
            rowStyle = 'style="background-color: rgba(156, 163, 175, 0.3) !important; border-left: 4px solid #9ca3af !important; border-right: 2px solid #9ca3af !important;"';
            rowClass = 'process-complete';
            console.log(`⚫ Built-in highlighting: ${lead.name} -> GREY (Process complete)`);
        }
        // OVERRIDE: Apply gray highlighting for other closed leads (without "Process complete" TODO)
        else if (isClosed) {
            // Gray for closed leads - OVERRIDES all other highlighting
            rowStyle = 'style="background-color: #f3f4f6 !important; border-left: 4px solid #9ca3af !important; border-right: 2px solid #9ca3af !important; opacity: 0.7;"';
            rowClass = 'lead-closed';
            console.log(`⚫ Built-in highlighting: ${lead.name} -> GRAY (closed, non-process-complete)`);
        }
        // OVERRIDE: Apply green highlighting for empty TODOs (takes priority over timestamp colors but not closed)
        else if (!todoText || todoText.trim() === '') {
            // Green for empty TO DO - OVERRIDES timestamp highlighting
            rowStyle = 'style="background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important; border-right: 2px solid #10b981 !important;"';
            rowClass = 'reach-out-complete';
            console.log(`🟢 Built-in highlighting: ${lead.name} -> GREEN (empty TODO)`);
        }

        // Add data attributes for highlighting persistence - ENHANCED
        let dataAttributes = '';
        if (rowClass.includes('lead-closed')) {
            dataAttributes = 'data-highlight="gray" data-highlight-applied="true" data-highlight-source="builtin"';
        } else if (rowClass.includes('timestamp-yellow')) {
            dataAttributes = 'data-highlight="yellow" data-highlight-applied="true" data-highlight-source="builtin"';
        } else if (rowClass.includes('timestamp-orange')) {
            dataAttributes = 'data-highlight="orange" data-highlight-applied="true" data-highlight-source="builtin"';
        } else if (rowClass.includes('timestamp-red')) {
            dataAttributes = 'data-highlight="red" data-highlight-applied="true" data-highlight-source="builtin"';
        } else if (rowClass.includes('process-complete')) {
            dataAttributes = 'data-highlight="grey" data-highlight-applied="true" data-highlight-source="builtin"';
        } else if (rowClass.includes('reach-out-complete')) {
            dataAttributes = 'data-highlight="green" data-highlight-applied="true" data-highlight-source="builtin"';
        }

        // Also add lead identification for robust matching
        dataAttributes += ` data-lead-name="${lead.name}" data-lead-id="${lead.id}"`;


        return `
            <tr ${rowClass ? `class="${rowClass}"` : ''} ${rowStyle} ${dataAttributes}>
                <td>
                    <input type="checkbox" class="lead-checkbox" value="${lead.id}" onchange="updateBulkDeleteButton()" data-lead='${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                </td>
                <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onclick="viewLead('${lead.id}')" title="${lead.name}">${displayName}</strong>
                </td>
                <td>
                    <div class="contact-info" style="display: flex; gap: 10px; align-items: center;">
                        <a href="tel:${lead.phone}" title="${lead.phone}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                            <i class="fas fa-phone"></i>
                        </a>
                        <a href="mailto:${lead.email}" title="${lead.email}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                            <i class="fas fa-envelope"></i>
                        </a>
                    </div>
                </td>
                <td>${lead.product || lead.insuranceType || lead.type || 'Commercial Auto'}</td>
                <td>$${(lead.premium || 0).toLocaleString()}</td>
                <td>${getStageHtml(lead.stage, lead)}</td>
                <td>
                    <div style="font-weight: bold; color: black;">
                        ${(() => {
                            console.log(`🎯 TO DO CELL: Getting next action for lead ${lead.id} - ${lead.name}, stage: ${lead.stage}`);
                            const result = (typeof getNextAction === 'function' ? getNextAction(lead.stage || 'new', lead) : (window.getNextAction ? window.getNextAction(lead.stage || 'new', lead) : 'Review lead')) || '';
                            console.log(`🎯 TO DO CELL: Result for lead ${lead.id}: "${result}"`);
                            return result;
                        })()}
                    </div>
                </td>
                <td>${lead.renewalDate || 'N/A'}</td>
                <td>${lead.assignedTo || 'Unassigned'}</td>
                <td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewLead('${lead.id}')" title="View Lead"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="archiveLead('${lead.id}')" title="Archive Lead" style="color: #f59e0b;"><i class="fas fa-archive"></i></button>
                        <button class="btn-icon" onclick="convertLead('${lead.id}')" title="Convert to Client"><i class="fas fa-user-check"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Make generateSimpleLeadRows globally accessible so other scripts use the updated version
window.generateSimpleLeadRows = generateSimpleLeadRows;

// Leads Management Functions
async function loadLeadsView() {
    console.log('loadLeadsView called - loading leads view');

    // Clear any timeouts immediately
    if (window.leadsViewTimeout) {
        clearTimeout(window.leadsViewTimeout);
        window.leadsViewTimeout = null;
    }
    if (window.leadsRefreshTimeout) {
        clearTimeout(window.leadsRefreshTimeout);
        window.leadsRefreshTimeout = null;
    }

    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        console.log('No dashboard content found');
        return;
    }

    // FIRST: Load fresh data from server
    try {
        console.log('🌐 Loading leads from server first...');
        await loadLeadsFromServer();
        console.log('✅ Server data loaded, now rendering view');
    } catch (error) {
        console.log('⚠️ Server load failed, using localStorage:', error);
        // Continue with localStorage data if server fails
    }

    // Show the leads HTML first (rest of function continues normally)

    // Update dashboard stats with real data after view loads
    setTimeout(() => {
        if (window.DashboardStats) {
            const stats = new window.DashboardStats();
            stats.updateDashboard();
        }
    }, 500);

    try {
        // Clean data FIRST to remove mock data before any processing
        if (typeof window.performLeadCleanup === 'function') {
            window.performLeadCleanup();
        }

        // Run deduplication first to clean up any duplicates
        if (window.deduplicateData) {
            console.log('Running deduplication before loading leads...');
            window.deduplicateData();
        }

        // STRICT DEDUPLICATION: Build a set of all archived lead IDs
        // Check BOTH archived storage keys (archivedLeads and archived_leads)
        const archivedLeads1 = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const archivedLeads2 = JSON.parse(localStorage.getItem('archived_leads') || '[]');
        const permanentArchive = JSON.parse(localStorage.getItem('PERMANENT_ARCHIVED_IDS') || '[]');

        // Combine all archived sources
        const allArchivedLeads = [...archivedLeads1, ...archivedLeads2];

        const archivedIds = new Set();
        const archivedPhones = new Set();
        const archivedEmails = new Set();
        const archivedNames = new Set();

        // Add permanent archive IDs first - these can NEVER be shown
        permanentArchive.forEach(id => {
            archivedIds.add(String(id));
        });

        // Collect all identifiers from ALL archived leads sources
        allArchivedLeads.forEach(lead => {
            archivedIds.add(String(lead.id));
            if (lead.name) {
                archivedNames.add(lead.name.toLowerCase());
            }
            if (lead.phone) {
                archivedPhones.add(lead.phone.replace(/\D/g, ''));
            }
            if (lead.email) {
                archivedEmails.add(lead.email.toLowerCase());
            }
        });

        console.log(`Found ${archivedIds.size} archived leads to exclude from active view`);

        // Get leads from BOTH storage keys and clean them
        // NOTE: Re-reading localStorage after loadLeadsFromServer() to get fresh server data
        let insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        console.log('📊 Reading localStorage after server sync - insurance_leads:', insuranceLeads.length, 'regular leads:', regularLeads.length);

        // REMOVE ALL MOCK/TEST DATA FROM BOTH SOURCES
        const mockPatterns = ['Test Lead', 'Test Company', 'Test Trucking', 'Robert Thompson', 'Jennifer Martin',
                              'Michael Chen', 'Davis Construct', 'ABC Corp', 'Tech Startup', 'ABC Trucking'];

        const cleanMockData = (leads) => leads.filter(lead => {
            // Remove test/mock data
            if (lead.name) {
                for (const pattern of mockPatterns) {
                    if (lead.name.includes(pattern)) {
                        console.log(`Removing mock lead: ${lead.name}`);
                        return false;
                    }
                }
            }

            // Fix 'qualified' status to 'quoted'
            if (lead.stage === 'qualified') {
                lead.stage = 'quoted';
            }

            return true;
        });

        insuranceLeads = cleanMockData(insuranceLeads);
        regularLeads = cleanMockData(regularLeads);

        // Use insurance_leads as primary, sync both keys
        let allLeads = insuranceLeads.length > 0 ? insuranceLeads : regularLeads;

        // Filter out archived leads from server data
        const activeLeads = allLeads.filter(lead => {
            if (archivedIds.has(String(lead.id))) return false;
            if (lead.phone && archivedPhones.has(lead.phone.replace(/\D/g, ''))) return false;
            if (lead.email && archivedEmails.has(lead.email.toLowerCase())) return false;
            if (lead.name && archivedNames.has(lead.name.toLowerCase())) return false;
            return true;
        });

        // Use activeLeads from here on
        let leads = activeLeads;
        console.log(`Using ${leads.length} active leads`);

        // FILTER OUT DELETED LEADS (but not recently imported ones)
        const deletedLeadIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
        if (deletedLeadIds.length > 0) {
            console.log(`📋 Deleted lead IDs in localStorage:`, deletedLeadIds);
            console.log(`📋 Current lead IDs being processed:`, leads.map(l => l.id));

            // Don't filter out leads that were created in the last 5 minutes (recently imported)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const beforeFilter = leads.length;

            leads = leads.filter(lead => {
                if (deletedLeadIds.includes(String(lead.id))) {
                    // Check if this lead was created recently
                    const createdAt = new Date(lead.createdAt || lead.created_at || 0);
                    if (createdAt > fiveMinutesAgo) {
                        console.log(`🔓 Allowing recently imported lead: ${lead.id} - ${lead.name} (created: ${createdAt.toISOString()})`);
                        return true; // Don't filter out recently imported leads
                    }

                    // PROTECT VICIDIAL LEADS: Don't filter out ViciDial leads from deleted list
                    const isViciDialLead = lead.source === 'ViciDial' || (String(lead.id).startsWith('88') && String(lead.id).length === 9);
                    if (isViciDialLead) {
                        console.log(`🔓 VICIDIAL PROTECTION ACTIVE: Protecting ViciDial lead from deletion filter: ${lead.id} - ${lead.name} (source: ${lead.source})`);
                        return true; // Don't filter out ViciDial leads
                    }

                    console.log(`🚫 Filtering out deleted lead: ${lead.id} - ${lead.name}`);
                    return false;
                }
                return true;
            });

            console.log(`Filtered ${beforeFilter - leads.length} deleted leads (kept ${leads.length})`);
        }

        // Save cleaned leads to BOTH keys
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

        // STRICT FILTER: Remove ANY lead that matches archived criteria
        // BUT exempt recently imported ViciDial leads for 10 minutes after import
        leads = allLeads.filter(lead => {
            // Check if this is a recently imported ViciDial lead (within 10 minutes)
            const isRecentViciDial = lead.source === 'ViciDial' && lead.createdAt;
            let isRecentlyImported = false;

            if (isRecentViciDial) {
                const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
                const createdAt = new Date(lead.createdAt);
                isRecentlyImported = createdAt > tenMinutesAgo;

                if (isRecentlyImported) {
                    console.log(`🔓 Protecting recently imported ViciDial lead from archiving: ${lead.id} - ${lead.name} (imported: ${createdAt.toISOString()})`);
                }
            }

            // Check if lead is marked as archived
            if (lead.archived === true) {
                console.log(`Excluding archived lead: ${lead.id} - ${lead.name}`);
                return false;
            }

            // Check if lead ID is in archived list
            if (archivedIds.has(String(lead.id))) {
                if (isRecentlyImported) {
                    console.log(`🔓 Keeping recently imported ViciDial lead despite archived ID match: ${lead.id} - ${lead.name}`);
                    return true;
                }
                console.log(`Excluding lead with archived ID: ${lead.id} - ${lead.name}`);
                // Also mark it as archived in the main list for consistency
                lead.archived = true;
                return false;
            }

            // Check if name matches an archived lead
            if (lead.name && archivedNames.has(lead.name.toLowerCase())) {
                if (isRecentlyImported) {
                    console.log(`🔓 Keeping recently imported ViciDial lead despite archived name match: ${lead.id} - ${lead.name}`);
                    return true;
                }
                console.log(`Excluding lead with archived name: ${lead.id} - ${lead.name}`);
                lead.archived = true;
                return false;
            }

            // Check if phone matches an archived lead
            if (lead.phone) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                if (cleanPhone && archivedPhones.has(cleanPhone)) {
                    if (isRecentlyImported) {
                        console.log(`🔓 Keeping recently imported ViciDial lead despite archived phone match: ${lead.id} - ${lead.name}`);
                        return true;
                    }
                    console.log(`Excluding lead with archived phone: ${lead.id} - ${lead.name}`);
                    lead.archived = true;
                    return false;
                }
            }

            // Check if email matches an archived lead
            if (lead.email && archivedEmails.has(lead.email.toLowerCase())) {
                if (isRecentlyImported) {
                    console.log(`🔓 Keeping recently imported ViciDial lead despite archived email match: ${lead.id} - ${lead.name}`);
                    return true;
                }
                console.log(`Excluding lead with archived email: ${lead.id} - ${lead.name}`);
                lead.archived = true;
                return false;
            }

            return true;
        });

        // Save back the cleaned list with archived flags
        localStorage.setItem('insurance_leads', JSON.stringify(allLeads));

        console.log(`Showing ${leads.length} active leads (excluded ${allLeads.length - leads.length} archived/duplicate)`);

        // Filter out archived leads - they should not appear in the active leads view
        leads = leads.filter(lead => !lead.archived);

        // Get current logged-in user
        let currentUser = '';
        const userData = sessionStorage.getItem('vanguard_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                // Capitalize username to match assignedTo format (grant -> Grant)
                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        // Sort leads with logged-in user's leads at the top, then by assignedTo, with closed leads at the bottom
        leads.sort((a, b) => {

            // First, check if either lead is closed - closed leads go to the bottom
            const aIsClosed = a.stage === 'closed' || a.stage === 'Closed';
            const bIsClosed = b.stage === 'closed' || b.stage === 'Closed';

            if (aIsClosed && !bIsClosed) return 1;
            if (bIsClosed && !aIsClosed) return -1;

            // If both are closed or both are not closed, prioritize current user's leads
            const aVal = a.assignedTo || 'zzz'; // Put unassigned at the end
            const bVal = b.assignedTo || 'zzz';

            // Check if leads belong to current user
            const aIsCurrentUser = currentUser && aVal === currentUser;
            const bIsCurrentUser = currentUser && bVal === currentUser;

            // If one belongs to current user and other doesn't, current user goes first
            if (aIsCurrentUser && !bIsCurrentUser) return -1;
            if (bIsCurrentUser && !aIsCurrentUser) return 1;

            // If both belong to current user or both don't, sort by assignedTo (A-Z)
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });
        console.log('Applied user-prioritized sort by assignedTo field', currentUser ? `- ${currentUser}'s leads at top` : '');

        // Store leads globally for filtering
        window.allLeads = leads;
        window.filteredLeads = leads;

        // Never generate sample data - only show real leads
        if (allLeads.length === 0) {
            leads = [];
            console.log('No leads found - showing empty state');
            // Don't save empty leads array - let real data populate
        }
        
        // Safe premium parsing function to fix string concatenation issue
        const safeParsePremium = (premium) => {
            if (!premium) return 0;
            if (typeof premium === 'number') return premium;
            if (typeof premium === 'string') {
                // Remove dollar signs, commas, and other non-numeric characters
                const cleaned = premium.replace(/[$,\s]/g, '');
                const parsed = parseFloat(cleaned);
                return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
        };

        const totalLeads = leads.length;
        const newLeads = leads.filter(l => l.stage === 'new').length;
        const quotedLeads = leads.filter(l => l.stage === 'quoted').length;
        const quoteSentUnaware = leads.filter(l => l.stage === 'quote-sent-unaware').length;
        const quoteSentAware = leads.filter(l => l.stage === 'quote-sent-aware').length;
        const interestedLeads = leads.filter(l => l.stage === 'interested').length;
        const notInterestedLeads = leads.filter(l => l.stage === 'not-interested').length;
        const closedLeads = leads.filter(l => l.stage === 'closed').length;
        
        // Build HTML step by step
        let html = `
        <div class="leads-view">
            <header class="content-header">
                <h1>Lead Management</h1>

                <!-- Lead Management Tabs -->
                <div class="lead-tabs" style="display: flex; gap: 0; margin: 20px 0 10px 0; border-bottom: 2px solid #e5e7eb;">
                    <button class="lead-tab active" onclick="switchLeadTab('active')" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px 6px 0 0; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                        <i class="fas fa-users"></i> Active Leads
                    </button>
                    <button class="lead-tab" onclick="switchLeadTab('archived')" style="padding: 12px 24px; background: #f3f4f6; color: #6b7280; border: none; border-radius: 6px 6px 0 0; cursor: pointer; font-weight: 600; margin-left: 2px; transition: all 0.2s;">
                        <i class="fas fa-archive"></i> Archived Leads
                    </button>
                </div>

                <div class="header-actions">
                    <button class="btn-secondary" onclick="toggleAdvancedFilters()" style="background: #6366f1; border-color: #6366f1; color: white;">
                        <i class="fas fa-filter"></i> Advanced Filters
                        <span id="filterCount" style="display: none; background: #ef4444; color: white; padding: 2px 6px; border-radius: 10px; margin-left: 5px; font-size: 12px;">0</span>
                    </button>
                    <button class="btn-primary" onclick="syncVicidialLeads()" style="background: #10b981; border-color: #10b981;">
                        <i class="fas fa-sync"></i> Sync Vicidial Now
                    </button>
                    <button class="btn-secondary" onclick="importLeads()">
                        <i class="fas fa-upload"></i> Import Leads
                    </button>
                    <button class="btn-secondary" onclick="exportLeads()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn-secondary" onclick="sendLeadsToBlast()">
                        <i class="fas fa-envelope"></i> Send to Blast
                    </button>
                    <button class="btn-primary" onclick="showNewLead()">
                        <i class="fas fa-plus"></i> New Lead
                    </button>
                </div>
            </header>

            <!-- Active Leads Tab Content -->
            <div id="active-leads-tab" class="tab-content active">

            <!-- Advanced Filters Panel -->
            <div id="advancedFiltersPanel" style="display: none; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Stage</label>
                        <select id="filterStage" onchange="applyAdvancedFilters()" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="">All Stages</option>
                            <option value="new">New</option>
                            <option value="contact_attempted">Contact Attempted</option>
                            <option value="info_requested">Info Requested</option>
                            <option value="info_received">Info Received</option>
                            <option value="loss_runs_requested">Loss Runs Requested</option>
                            <option value="loss_runs_received">Loss Runs Received</option>
                            <option value="app_prepared">App Prepared</option>
                            <option value="app_sent">App Sent</option>
                            <option value="app_quote_received">App Quote Received</option>
                            <option value="app_quote_sent">App Quote Sent</option>
                            <option value="quoted">Quoted</option>
                            <option value="quote_sent">Quote Sent</option>
                            <option value="quote-sent-unaware">Quote Sent (Unaware)</option>
                            <option value="quote-sent-aware">Quote Sent (Aware)</option>
                            <option value="interested">Interested</option>
                            <option value="not-interested">Not Interested</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Premium Range</label>
                        <select id="filterPremium" onchange="applyAdvancedFilters()" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="">All Premiums</option>
                            <option value="0-1000">$0 - $1,000</option>
                            <option value="1000-5000">$1,000 - $5,000</option>
                            <option value="5000-10000">$5,000 - $10,000</option>
                            <option value="10000-25000">$10,000 - $25,000</option>
                            <option value="25000+">$25,000+</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Renewal Date</label>
                        <select id="filterRenewal" onchange="applyAdvancedFilters()" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="">All Dates</option>
                            <option value="overdue">Overdue</option>
                            <option value="30">Next 30 Days</option>
                            <option value="60">Next 60 Days</option>
                            <option value="90">Next 90 Days</option>
                            <option value="180">Next 6 Months</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Assigned To</label>
                        <select id="filterAssigned" onchange="applyAdvancedFilters()" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="">All Agents</option>
                            <option value="unassigned">Unassigned</option>
                            <option value="Grant">Grant</option>
                            <option value="Hunter">Hunter</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Product Type</label>
                        <select id="filterProduct" onchange="applyAdvancedFilters()" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="">All Products</option>
                            <option value="auto">Auto</option>
                            <option value="home">Home</option>
                            <option value="business">Business</option>
                            <option value="life">Life</option>
                            <option value="health">Health</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">Skip First N Days</label>
                        <input type="number" id="filterSkipDays" onchange="applyAdvancedFilters()" placeholder="0" min="0" max="365" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <small style="color: #6b7280; font-size: 12px;">Skip leads renewing within this many days from today</small>
                    </div>
                    <div style="display: flex; align-items: end;">
                        <button onclick="clearAdvancedFilters()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-times"></i> Clear All
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Lead Pipeline -->
            <div class="lead-pipeline">
                <div class="pipeline-stage" data-stage="new">
                    <div class="stage-header">
                        <h3>New</h3>
                        <span class="stage-count">${newLeads}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "new").reduce((sum, l) => sum + safeParsePremium(l.premium), 0).toLocaleString()}</div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (newLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="quoted">
                    <div class="stage-header">
                        <h3>Quoted</h3>
                        <span class="stage-count">${quotedLeads}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "quoted").reduce((sum, l) => sum + safeParsePremium(l.premium), 0).toLocaleString()}</div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (quotedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="quote-sent">
                    <div class="stage-header">
                        <h3>Quote Sent</h3>
                        <span class="stage-count">${quoteSentUnaware + quoteSentAware}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "quote-sent-unaware" || l.stage === "quote-sent-aware").reduce((sum, l) => sum + safeParsePremium(l.premium), 0).toLocaleString()}</div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? ((quoteSentUnaware + quoteSentAware)/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="interested">
                    <div class="stage-header">
                        <h3>Interested</h3>
                        <span class="stage-count">${interestedLeads}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "interested").reduce((sum, l) => sum + safeParsePremium(l.premium), 0).toLocaleString()}</div>
                    <div class="stage-bar" style="width: ${totalLeads > 0 ? (interestedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);"></div>
                </div>
                <div class="pipeline-stage" data-stage="closed">
                    <div class="stage-header success">
                        <h3>Closed</h3>
                        <span class="stage-count">${closedLeads}</span>
                    </div>
                    <div class="stage-value">$${leads.filter(l => l.stage === "closed").reduce((sum, l) => sum + safeParsePremium(l.premium), 0).toLocaleString()}</div>
                    <div class="stage-bar success" style="width: ${totalLeads > 0 ? (closedLeads/totalLeads)*100 : 0}%; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);"></div>
                </div>
            </div>
            
            <!-- Lead Stats -->
            <div class="lead-stats">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h4>${(() => {
                            // Get current user - same method as top right display
                            const userData = sessionStorage.getItem('vanguard_user');
                            let userName = 'Your';

                            if (userData) {
                                const user = JSON.parse(userData);
                                // Capitalize username (grant -> Grant)
                                userName = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                            }

                            return userName + "'s Total Leads";
                        })()}</h4>
                        <p class="stat-number">${(() => {
                            // Get current user - same method as top right display
                            const userData = sessionStorage.getItem('vanguard_user');
                            let currentUser = '';

                            if (userData) {
                                const user = JSON.parse(userData);
                                // Capitalize username to match assignedTo format (grant -> Grant)
                                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                            }

                            // Count leads assigned to this user, excluding closed stage
                            const userLeads = currentUser ? leads.filter(lead => lead.assignedTo === currentUser && lead.stage !== 'closed') : [];

                            console.log('Total Leads - Current user:', currentUser, 'Count (excluding closed):', userLeads.length);
                            return userLeads.length;
                        })()}</p>
                        <span class="stat-trend positive">${(() => {
                            // Get current user for the button text
                            const userData = sessionStorage.getItem('vanguard_user');
                            let currentUser = '';

                            if (userData) {
                                const user = JSON.parse(userData);
                                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                            }

                            // Get total count including closed for button text
                            const allUserLeads = currentUser ? leads.filter(lead => lead.assignedTo === currentUser) : [];

                            return `${allUserLeads.length} Including closed`;
                        })()}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Late Update Rate</h4>
                        <p class="stat-number">${(() => {
                            // Calculate leads that haven't been updated in over 7 days
                            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                            const lateLeads = leads.filter(lead => {
                                const lastUpdate = new Date(lead.updatedAt || lead.createdAt || lead.created || 0);
                                return lastUpdate < sevenDaysAgo && lead.stage !== 'closed';
                            });
                            return totalLeads > 0 ? Math.round((lateLeads.length/totalLeads)*100) : 0;
                        })()}%</p>
                        <span class="stat-trend negative">Needs attention</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="stat-content">
                        <h4>Total To Do Tasks</h4>
                        <p class="stat-number">${(() => {
                            // Get current user - SAME METHOD AS TOP RIGHT DISPLAY
                            const userData = sessionStorage.getItem('vanguard_user');
                            let currentUser = '';

                            if (userData) {
                                const user = JSON.parse(userData);
                                // Capitalize username to match assignedTo format (grant -> Grant)
                                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                            }

                            console.log('To Do Tasks - Current user:', currentUser);

                            // Count To Do tasks
                            let todoCount = 0;

                            leads.forEach(lead => {
                                // Only count if assigned to current user
                                if (lead.assignedTo === currentUser) {
                                    // Map stage to To Do action
                                    const actionMap = {
                                        'new': 'Assign Stage',
                                        'contact_attempted': 'Follow up with lead',
                                        'info_requested': 'Reach out to lead',
                                        'info_received': 'Prepare Quote',
                                        'loss_runs_requested': 'Reach out to lead',
                                        'loss_runs_received': 'Prepare app.',
                                        'app_prepared': 'Send application',
                                        'app_sent': '',
                                        'quoted': 'Email Quote, and make contact',
                                        'quote_sent': 'Reach out to lead',
                                        'quote-sent-unaware': 'Reach out to lead',
                                        'quote-sent-aware': 'Follow up with lead',
                                        'interested': 'Reach out',
                                        'not-interested': 'Archive lead',
                                        'closed': 'Process complete'
                                    };

                                    const stage = lead.stage || 'new';
                                    const todoAction = actionMap.hasOwnProperty(stage) ? actionMap[stage] : 'Review lead';

                                    // Check if reach out is complete (makes To Do empty)
                                    let isToDoEmpty = false;
                                    if (lead.reachOut && (stage === 'quoted' || stage === 'info_requested' ||
                                        stage === 'loss_runs_requested' || stage === 'app_sent' || stage === 'quote_sent' || stage === 'interested')) {
                                        const ro = lead.reachOut;
                                        // Reach out complete if: 1) Lead answered call (completedAt exists), or 2) All methods tried
                                        if (ro.completedAt || ro.callsConnected > 0 || (ro.callAttempts > 0 && ro.emailCount > 0 && ro.textCount > 0)) {
                                            isToDoEmpty = true;
                                        }
                                    }

                                    // Count if To Do is not empty
                                    if (!isToDoEmpty && todoAction) {
                                        todoCount++;
                                        console.log(`✓ Lead: "${lead.name}" has To Do: "${todoAction}"`);
                                    }
                                }
                            });

                            console.log(`Total To Do tasks for ${currentUser}: ${todoCount}`);
                            return todoCount;
                        })()}</p>
                        <span class="stat-trend positive">${(() => {
                            // Get current user - same method as top right display
                            const userData = sessionStorage.getItem('vanguard_user');
                            let currentUser = 'Your';

                            if (userData) {
                                const user = JSON.parse(userData);
                                // Capitalize username for display
                                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                            }

                            return `${currentUser}'s active tasks`;
                        })()}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-content">
                        <h4>${(() => {
                            // Get current user for title
                            const userData = sessionStorage.getItem('vanguard_user');
                            let userName = 'Your';

                            if (userData) {
                                const user = JSON.parse(userData);
                                // Capitalize username
                                userName = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                            }

                            return userName + "'s Total Value";
                        })()}</h4>
                        <p class="stat-number">$${(() => {
                            // Get current user
                            const userData = sessionStorage.getItem('vanguard_user');
                            let currentUser = '';

                            if (userData) {
                                const user = JSON.parse(userData);
                                // Capitalize username to match assignedTo format
                                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                            }

                            // Calculate total premium for user's leads
                            const userLeads = currentUser ? leads.filter(lead => lead.assignedTo === currentUser) : [];
                            const totalPremium = userLeads.reduce((sum, lead) => sum + (parseFloat(lead.premium) || 0), 0);

                            return totalPremium.toLocaleString();
                        })()}</p>
                        <span class="stat-trend positive">${(() => {
                            // Calculate 6% commission
                            const userData = sessionStorage.getItem('vanguard_user');
                            let currentUser = '';

                            if (userData) {
                                const user = JSON.parse(userData);
                                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                            }

                            // Calculate total premium for user's leads
                            const userLeads = currentUser ? leads.filter(lead => lead.assignedTo === currentUser) : [];
                            const totalPremium = userLeads.reduce((sum, lead) => sum + (parseFloat(lead.premium) || 0), 0);

                            // Calculate 6% commission
                            const commission = totalPremium * 0.06;

                            return `$${commission.toLocaleString()} commission`;
                        })()}</span>
                    </div>
                </div>
            </div>
            
            <!-- Leads Table -->
            <div class="table-container">
                <table class="data-table" id="leadsTable">
                    <thead>
                        <tr>
                            <th style="width: 40px;">
                                <input type="checkbox" id="selectAllLeads" onclick="toggleAllLeads(this)">
                            </th>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Product Interest</th>
                            <th class="sortable" onclick="sortLeads('premium')" data-sort="premium">
                                Premium 
                                <span class="sort-arrow" id="sort-premium">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('stage')" data-sort="stage">
                                Stage
                                <span class="sort-arrow" id="sort-stage">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th>To Do</th>
                            <th class="sortable" onclick="sortLeads('renewalDate')" data-sort="renewalDate">
                                Renewal Date
                                <span class="sort-arrow" id="sort-renewalDate">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('assignedTo')" data-sort="assignedTo">
                                Assigned To
                                <span class="sort-arrow" id="sort-assignedTo">
                                    <i class="fas fa-sort-up"></i>
                                </span>
                            </th>
                            <th class="sortable" onclick="sortLeads('created')" data-sort="created">
                                Created 
                                <span class="sort-arrow" id="sort-created">
                                    <i class="fas fa-sort"></i>
                                </span>
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="leadsTableBody">
                        ${generateSimpleLeadRows(leads)}
                    </tbody>
                </table>
            </div>
            </div>
            </div>
            <!-- End Active Leads Tab -->

            <!-- Archived Leads Tab Content -->
            <div id="archived-leads-tab" class="tab-content" style="display: none;">
                <div class="archived-leads-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0;">
                        <div>
                            <h3 style="margin: 0; color: #374151;">Archived Leads</h3>
                            <p style="color: #6b7280; margin: 5px 0 0 0;">Leads that have been archived from the active pipeline</p>
                        </div>
                        <div class="archived-actions">
                            <button class="btn-secondary" onclick="exportArchivedLeads()" style="background: #10b981; border-color: #10b981; color: white;">
                                <i class="fas fa-download"></i> Export Current Month
                            </button>
                            <button class="btn-secondary" onclick="exportAllArchivedLeads()" style="background: #6366f1; border-color: #6366f1; color: white; margin-left: 10px;">
                                <i class="fas fa-download"></i> Export All
                            </button>
                        </div>
                    </div>

                    <!-- Monthly Archive Tabs -->
                    <div class="monthly-archive-tabs" id="monthlyArchiveTabs" style="display: flex; gap: 2px; margin: 20px 0 10px 0; border-bottom: 2px solid #e5e7eb; overflow-x: auto; white-space: nowrap; padding-bottom: 2px;">
                        <!-- Monthly tabs will be populated here -->
                    </div>

                    <!-- Archive Summary Stats -->
                    <div class="archive-stats" id="archiveStats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                        <!-- Stats will be populated here -->
                    </div>

                    <!-- Archived Leads Table -->
                    <div class="table-container">
                        <table class="data-table" id="archivedLeadsTable">
                            <thead>
                                <tr>
                                    <th style="width: 40px;">
                                        <input type="checkbox" id="selectAllArchived" onclick="toggleAllArchived(this)">
                                    </th>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Product Interest</th>
                                    <th>Premium</th>
                                    <th>Final Stage</th>
                                    <th>Assigned To</th>
                                    <th>Archived Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="archivedLeadsTableBody">
                                ${generateArchivedLeadRows()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <!-- End Archived Leads Tab -->

        </div>
    `;
        
        // Set the HTML
        dashboardContent.innerHTML = html;

        // Apply highlighting after the table is rendered
        setTimeout(() => {
            console.log('🎨 Initial highlighting after leads view render...');
            if (window.applyReachOutCompleteHighlighting) {
                window.applyReachOutCompleteHighlighting();
            }
            if (window.forceAllHighlighting) {
                window.forceAllHighlighting();
            }
        }, 200);

        // Scan for clickable phone numbers and emails with aggressive retry
        const scanLeadsContent = () => {
            if (window.scanForClickableContent) {
                console.log('Scanning Leads Management view for clickable content...');
                window.scanForClickableContent(dashboardContent);
                
                // Check if any clickable elements were created
                setTimeout(() => {
                    const clickables = dashboardContent.querySelectorAll('.clickable-phone, .clickable-email');
                    console.log(`Found ${clickables.length} clickable elements in Leads view`);
                    
                    // If none found, try again with contact-info divs
                    if (clickables.length === 0) {
                        console.log('No clickable elements found, scanning contact-info divs...');
                        const contactDivs = dashboardContent.querySelectorAll('.contact-info');
                        contactDivs.forEach((div, index) => {
                            console.log(`Processing contact-info ${index}`);
                            window.scanForClickableContent(div);
                        });
                    }
                }, 200);
            }
        };
        
        // Try multiple times with increasing delays
        setTimeout(scanLeadsContent, 100);
        setTimeout(scanLeadsContent, 300);
        setTimeout(scanLeadsContent, 600);
        setTimeout(scanLeadsContent, 1000);
        
    } catch (error) {
        console.error('Error in loadLeadsView:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        dashboardContent.innerHTML = `<div class="error-message">Error loading leads view: ${error.message}</div>`;
    }
    // Removed finally block and loading flags - no more blocking
}

// Moved to before generateSimpleLeadRows function

// Moved to before loadLeadsView function

// Lead Action Functions
function showNewLead() {
    // Create modal HTML with improved spacing and company field
    const modalHTML = `
        <div class="modal-overlay active" id="newLeadModal">
            <div class="modal-container" style="max-width: 800px; width: 90%;">
                <div class="modal-header" style="padding: 24px 30px; border-bottom: 1px solid #e5e7eb;">
                    <h2 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">Create New Lead</h2>
                    <button class="close-btn" onclick="closeNewLeadModal()" style="font-size: 28px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <form id="newLeadForm" onsubmit="saveNewLead(event)">
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Full Name <span style="color: #ef4444;">*</span></label>
                                <input type="text" class="form-control" id="leadName" required placeholder="Enter full name" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Company Name</label>
                                <input type="text" class="form-control" id="leadCompany" placeholder="Enter company name" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Phone Number <span style="color: #ef4444;">*</span></label>
                                <input type="tel" class="form-control" id="leadPhone" required placeholder="(555) 123-4567" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Email Address <span style="color: #ef4444;">*</span></label>
                                <input type="email" class="form-control" id="leadEmail" required placeholder="email@example.com" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>

                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Insurance Type</label>
                                <select class="form-control" id="leadInsuranceType" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="Auto">Auto</option>
                                    <option value="Commercial Auto">Commercial Auto</option>
                                    <option value="Home">Home</option>
                                    <option value="Life">Life</option>
                                    <option value="Health">Health</option>
                                    <option value="Business">Business</option>
                                    <option value="Bundle">Bundle</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Assigned To <span style="color: #ef4444;">*</span></label>
                                <select class="form-control" id="leadAssignedTo" required style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="">Select Agent</option>
                                    <option value="Grant">Grant</option>
                                    <option value="Hunter">Hunter</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Estimated Premium</label>
                                <input type="number" class="form-control" id="leadPremium" placeholder="$0.00" step="0.01" min="0" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Lead Stage</label>
                                <select class="form-control" id="leadStage" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="new">New</option>
                                    <option value="contact_attempted">Contact Attempted</option>
                                    <option value="info_requested">Info Requested</option>
                                    <option value="info_received">Info Received</option>
                                    <option value="loss_runs_requested">Loss Runs Requested</option>
                                    <option value="loss_runs_received">Loss Runs Received</option>
                                    <option value="app_prepared">App Prepared</option>
                                    <option value="app_sent">App Sent</option>
                                    <option value="app_quote_received">App Quote Received</option>
                                    <option value="app_quote_sent">App Quote Sent</option>
                                    <option value="quoted">Quoted</option>
                                    <option value="quote_sent">Quote Sent</option>
                                    <option value="interested">Interested</option>
                                    <option value="not-interested">Not Interested</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Address</label>
                                <input type="text" class="form-control" id="leadAddress" placeholder="123 Main St, City, State ZIP" style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Notes</label>
                                <textarea class="form-control" id="leadNotes" rows="4" placeholder="Add any additional notes about this lead..." style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; resize: vertical;"></textarea>
                            </div>
                        </div>
                        
                        <div class="modal-footer" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
                            <button type="button" class="btn-secondary" onclick="closeNewLeadModal()" style="padding: 12px 24px; font-size: 15px;">Cancel</button>
                            <button type="submit" class="btn-primary" style="padding: 12px 24px; font-size: 15px;">
                                <i class="fas fa-save" style="margin-right: 8px;"></i> Create Lead
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on first field
    setTimeout(() => {
        document.getElementById('leadName')?.focus();
    }, 100);
}

function closeNewLeadModal() {
    const modal = document.getElementById('newLeadModal');
    if (modal) modal.remove();
}

async function saveNewLead(event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById('leadName').value.trim();
    const company = document.getElementById('leadCompany').value.trim();
    const phone = document.getElementById('leadPhone').value.trim();
    const email = document.getElementById('leadEmail').value.trim();
    // Lead Source field removed - set default value
    const source = 'Manual Entry';
    const insuranceType = document.getElementById('leadInsuranceType').value;
    const assignedTo = document.getElementById('leadAssignedTo').value;
    const premium = parseFloat(document.getElementById('leadPremium').value) || 0;
    const stage = document.getElementById('leadStage').value;
    const address = document.getElementById('leadAddress').value.trim();
    const notes = document.getElementById('leadNotes').value.trim();

    // Validate required fields - only name/company and phone are truly required
    if ((!name && !company) || !phone) {
        showNotification('Please fill in Company Name and Phone Number', 'error');
        return;
    }

    // Create new lead object
    const newLead = {
        id: Date.now(),
        name,
        company,
        phone,
        email,
        source,
        insuranceType,
        product: insuranceType, // Add product field for compatibility
        assignedTo,
        premium,
        stage,
        address,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stageTimestamps: {
            [stage]: new Date().toISOString() // Add timestamp for initial stage
        },
        quotes: [],
        activities: [{
            type: 'created',
            date: new Date().toISOString(),
            note: 'Lead created'
        }]
    };

    // Save to server first
    try {
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`;

        const response = await fetch(`${apiUrl}/api/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newLead)
        });

        if (response.ok) {
            console.log('Lead saved to server successfully');
        } else {
            console.error('Failed to save lead to server, saving locally only');
        }
    } catch (error) {
        console.error('Error saving lead to server:', error);
    }

    // Also save to localStorage
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    leads.push(newLead);
    localStorage.setItem('insurance_leads', JSON.stringify(leads));

    // Also save to 'leads' key
    const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    regularLeads.push(newLead);
    localStorage.setItem('leads', JSON.stringify(regularLeads));

    // Close modal
    closeNewLeadModal();

    // Show success notification
    showNotification(`Lead "${name}" created successfully!`, 'success');

    // Reload leads view to show new lead
    loadLeadsView();
}

function viewLead(leadId) {
    // Use the enhanced lead profile for commercial auto leads
    if (window.createEnhancedProfile) {
        console.log('✅ APP.JS: Using createEnhancedProfile for:', leadId);
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        if (lead) {
            window.createEnhancedProfile(lead);
            return;
        }
    }
    if (window.showLeadProfile) {
        window.showLeadProfile(leadId);
        return;
    }

    // Fallback to old view if enhanced profile not available
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }

    // Check if lead is archived
    if (lead.archived) {
        showNotification('This lead has been archived', 'warning');
        // Refresh the leads view to remove stale entries
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        }
        return;
    }
    
    const dashboardContent = document.querySelector('.dashboard-content');
    dashboardContent.innerHTML = `
        <div class="lead-profile" data-lead-id="${lead.id}">
            <header class="content-header">
                <div>
                    <button class="btn-text" onclick="loadLeadsView()">
                        <i class="fas fa-arrow-left"></i> Back to Leads
                    </button>
                    <h1>Lead Profile: ${lead.name}</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editLead(${lead.id})">
                        <i class="fas fa-edit"></i> Edit Lead
                    </button>
                    <button class="btn-danger" onclick="deleteLead(${lead.id})">
                        <i class="fas fa-trash"></i> Delete Lead
                    </button>
                    <button class="btn-primary" onclick="convertLead(${lead.id})">
                        <i class="fas fa-user-check"></i> Convert to Client
                    </button>
                </div>
            </header>
            
            <div class="profile-grid">
                <!-- Lead Information -->
                <div class="profile-section">
                    <h2><i class="fas fa-user"></i> Lead Information</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Name</label>
                            <p>${lead.name}</p>
                        </div>
                        <div class="info-item">
                            <label>Phone</label>
                            <p>${lead.phone}</p>
                        </div>
                        <div class="info-item">
                            <label>Email</label>
                            <p>${lead.email}</p>
                        </div>
                        <div class="info-item">
                            <label>Product Interest</label>
                            <p>${lead.product || lead.insuranceType || lead.type || "Commercial Auto"}</p>
                        </div>
                        <div class="info-item">
                            <label>Stage</label>
                            <p>${getStageHtml(lead.stage)}</p>
                        </div>
                        <div class="info-item">
                            <label>Assigned To</label>
                            <p>${lead.assignedTo || 'Unassigned'}</p>
                        </div>
                        <div class="info-item">
                            <label>Created Date</label>
                            <p>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <label>Renewal Date</label>
                            <p>${lead.renewalDate || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <label>Premium Amount</label>
                            <p class="premium-amount">$${(lead.premium || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Insurance Quotes Section -->
                <div class="profile-section quotes-section">
                    <div class="section-header">
                        <h2><i class="fas fa-file-invoice-dollar"></i> Insurance Quotes</h2>
                        <button class="btn-primary" onclick="addQuote(${lead.id})">
                            <i class="fas fa-plus"></i> Add Quote
                        </button>
                    </div>
                    
                    <div class="quotes-list" id="quotesList">
                        ${generateQuotesList(lead.quotes || [])}
                    </div>
                </div>
                
                <!-- Activity Timeline -->
                <div class="profile-section">
                    <h2><i class="fas fa-history"></i> Activity Timeline</h2>
                    <div class="timeline">
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Lead Created</h4>
                                <p>Lead was created on ${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</p>
                                <span class="timeline-date">${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</span>
                            </div>
                        </div>
                        ${lead.stage === 'quoted' ? `
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Quote Provided</h4>
                                <p>Insurance quote was provided to the lead</p>
                                <span class="timeline-date">1 day ago</span>
                            </div>
                        </div>
                        ` : ''}
                        ${lead.stage === 'contacted' ? `
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Initial Contact</h4>
                                <p>Lead was contacted by ${lead.assignedTo}</p>
                                <span class="timeline-date">2 days ago</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Notes Section -->
                <div class="profile-section">
                    <div class="section-header">
                        <h2><i class="fas fa-sticky-note"></i> Notes</h2>
                        <button class="btn-secondary" onclick="addNote(${lead.id})">
                            <i class="fas fa-plus"></i> Add Note
                        </button>
                    </div>
                    <div class="notes-list">
                        <div class="note-item">
                            <div class="note-header">
                                <strong>${lead.assignedTo}</strong>
                                <span class="note-date">Today at 10:30 AM</span>
                            </div>
                            <p>Initial contact made. Client interested in ${lead.product || lead.insuranceType || lead.type || "Commercial Auto"}. Scheduled follow-up for next week.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}


function editLead(leadId) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay active" id="editLeadModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Edit Lead - ${lead.name}</h2>
                    <button class="close-btn" onclick="closeEditLeadModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editLeadForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Name *</label>
                                <input type="text" class="form-control" id="editLeadName" value="${lead.name}" required>
                            </div>
                            <div class="form-group">
                                <label>Stage *</label>
                                <select class="form-control" id="editLeadStage" required>
                                    <option value="new" ${lead.stage === 'new' ? 'selected' : ''}>New</option>
                                    <option value="contact_attempted" ${lead.stage === 'contact_attempted' ? 'selected' : ''}>Contact Attempted</option>
                                    <option value="info_requested" ${lead.stage === 'info_requested' ? 'selected' : ''}>Info Requested</option>
                                    <option value="info_received" ${lead.stage === 'info_received' ? 'selected' : ''}>Info Received</option>
                                    <option value="loss_runs_requested" ${lead.stage === 'loss_runs_requested' ? 'selected' : ''}>Loss Runs Requested</option>
                                    <option value="loss_runs_received" ${lead.stage === 'loss_runs_received' ? 'selected' : ''}>Loss Runs Received</option>
                                    <option value="app_prepared" ${lead.stage === 'app_prepared' ? 'selected' : ''}>App Prepared</option>
                                    <option value="app_sent" ${lead.stage === 'app_sent' ? 'selected' : ''}>App Sent</option>
                                    <option value="app_quote_received" ${lead.stage === 'app_quote_received' ? 'selected' : ''}>App Quote Received</option>
                                    <option value="app_quote_sent" ${lead.stage === 'app_quote_sent' ? 'selected' : ''}>App Quote Sent</option>
                                    <option value="quoted" ${lead.stage === 'quoted' ? 'selected' : ''}>Quoted</option>
                                    <option value="quote_sent" ${lead.stage === 'quote_sent' ? 'selected' : ''}>Quote Sent</option>
                                    <option value="quote-sent-unaware" ${lead.stage === 'quote-sent-unaware' ? 'selected' : ''}>Quote Sent (Unaware)</option>
                                    <option value="quote-sent-aware" ${lead.stage === 'quote-sent-aware' ? 'selected' : ''}>Quote Sent (Aware)</option>
                                    <option value="interested" ${lead.stage === 'interested' ? 'selected' : ''}>Interested</option>
                                    <option value="not-interested" ${lead.stage === 'not-interested' ? 'selected' : ''}>Not Interested</option>
                                    <option value="closed" ${lead.stage === 'closed' ? 'selected' : ''}>Closed</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone *</label>
                                <input type="tel" class="form-control" id="editLeadPhone" value="${lead.phone}" required>
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" class="form-control" id="editLeadEmail" value="${lead.email}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Product Interest</label>
                                <select class="form-control" id="editLeadProduct">
                                    <option value="Auto" ${lead.product === 'Auto' ? 'selected' : ''}>Auto</option>
                                    <option value="Home" ${lead.product === 'Home' ? 'selected' : ''}>Home</option>
                                    <option value="Life" ${lead.product === 'Life' ? 'selected' : ''}>Life Insurance</option>
                                    <option value="Commercial Auto" ${lead.product === 'Commercial Auto' ? 'selected' : ''}>Commercial Auto</option>
                                    <option value="Commercial Property" ${lead.product === 'Commercial Property' ? 'selected' : ''}>Commercial Property</option>
                                    <option value="Commercial Fleet" ${lead.product === 'Commercial Fleet' ? 'selected' : ''}>Commercial Fleet</option>
                                    <option value="Home + Auto" ${lead.product === 'Home + Auto' ? 'selected' : ''}>Home + Auto Bundle</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Premium Amount</label>
                                <input type="number" class="form-control" id="editLeadPremium" value="${lead.premium || ''}" placeholder="0.00">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Renewal Date</label>
                                <input type="date" class="form-control" id="editLeadRenewalDate" value="${lead.renewalDate ? lead.renewalDate.split('/').reverse().join('-') : ''}">
                            </div>
                            <div class="form-group">
                                <label>Assigned To</label>
                                <select class="form-control" id="editLeadAssignedTo">
                                    <option value="Grant" ${lead.assignedTo === 'Grant' ? 'selected' : ''}>Grant</option>
                                    <option value="Hunter" ${lead.assignedTo === 'Hunter' ? 'selected' : ''}>Hunter</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea class="form-control" id="editLeadNotes" rows="3" placeholder="Additional notes about this lead...">${lead.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeEditLeadModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveLeadEdits(${leadId})">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Save individual lead to server
async function saveLeadToServer(lead) {
    try {
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`;

        // Ensure the lead has an updatedAt timestamp
        lead.updatedAt = new Date().toISOString();

        // Debug: Log what timestamps we're saving
        console.log(`💾 Saving lead ${lead.id} to server with timestamps:`, {
            updatedAt: lead.updatedAt,
            stageTimestamps: lead.stageTimestamps,
            stage: lead.stage
        });

        const response = await fetch(`${apiUrl}/api/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lead)
        });

        if (response.ok) {
            console.log(`✅ Lead ${lead.id} saved to server successfully`);
        } else {
            console.warn(`⚠️ Failed to save lead ${lead.id} to server`);
        }
    } catch (error) {
        console.error(`❌ Error saving lead ${lead.id} to server:`, error);
    }
}

function saveLeadEdits(leadId) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id === leadId);

    if (leadIndex === -1) return;

    const oldStage = leads[leadIndex].stage;
    const newStage = document.getElementById('editLeadStage').value;

    // Update lead with new values
    leads[leadIndex] = {
        ...leads[leadIndex],
        name: document.getElementById('editLeadName').value,
        stage: newStage,
        phone: document.getElementById('editLeadPhone').value,
        email: document.getElementById('editLeadEmail').value,
        product: document.getElementById('editLeadProduct').value,
        premium: parseFloat(document.getElementById('editLeadPremium').value) || 0,
        renewalDate: document.getElementById('editLeadRenewalDate').value ?
            document.getElementById('editLeadRenewalDate').value.split('-').reverse().join('/') : '',
        assignedTo: document.getElementById('editLeadAssignedTo').value,
        notes: document.getElementById('editLeadNotes').value
    };

    // Update stage timestamp if stage changed
    if (oldStage !== newStage) {
        if (!leads[leadIndex].stageTimestamps) {
            leads[leadIndex].stageTimestamps = {};
        }
        const newTimestamp = new Date().toISOString();
        leads[leadIndex].stageTimestamps[newStage] = newTimestamp;
        leads[leadIndex].updatedAt = newTimestamp; // Also update general timestamp
        console.log(`✅ Stage changed from ${oldStage} to ${newStage}, timestamp updated to ${newTimestamp}`);
        console.log(`✅ Lead stageTimestamps now:`, leads[leadIndex].stageTimestamps);
    }

    // Save to server first
    saveLeadToServer(leads[leadIndex]);

    localStorage.setItem('insurance_leads', JSON.stringify(leads));
    closeEditLeadModal();

    // Refresh the leads table if we're on the leads view
    const currentHash = window.location.hash;
    if (currentHash === '#leads') {
        console.log('🔄 Refreshing leads table after status change...');
        refreshLeadsTable();

        // AGGRESSIVE REAL-TIME HIGHLIGHTING UPDATE after stage change
        // Apply multiple highlighting attempts to ensure immediate visual update
        const forceHighlightingUpdate = () => {
            console.log('🎨 AGGRESSIVE HIGHLIGHTING: Stage changed, forcing immediate highlighting update');

            // FIRST: Remove green highlighting from rows that now have TO DO text
            const tableBody = document.getElementById('leadsTableBody');
            if (tableBody) {
                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const todoCell = row.querySelector('td:nth-child(6)'); // TO DO column
                    if (todoCell) {
                        const todoText = todoCell.textContent.trim();
                        // If row has TO DO text but still has completion highlighting, remove it immediately
                        if (todoText && todoText.length > 0) {
                            // Check if this is NOT "Process complete" but has completion highlighting
                            if (!todoText.toLowerCase().includes('process complete')) {
                                if (row.classList.contains('reach-out-complete') ||
                                    row.classList.contains('process-complete') ||
                                    row.style.backgroundColor.includes('156, 163, 175') ||
                                    row.style.backgroundColor.includes('16, 185, 129')) {
                                    console.log('🔴 REMOVING completion highlight - row now has TO DO text:', todoText);
                                    row.classList.remove('reach-out-complete');
                                    row.classList.remove('process-complete');
                                    row.style.removeProperty('background-color');
                                    row.style.removeProperty('background');
                                    row.style.removeProperty('border-left');
                                    row.style.removeProperty('border-right');
                                }
                            }
                        }
                    }
                });
            }

            // THEN: Apply regular highlighting functions
            if (window.forceAllHighlighting) {
                window.forceAllHighlighting();
            }
            if (window.applyReachOutCompleteHighlighting) {
                window.applyReachOutCompleteHighlighting();
            }
            if (window.synchronizedHighlighting) {
                window.synchronizedHighlighting();
            }
            if (window.ultimateHighlight) {
                window.ultimateHighlight();
            }
        };

        // Apply immediately and with multiple timing attempts to combat any delays
        forceHighlightingUpdate(); // Immediate
        setTimeout(forceHighlightingUpdate, 50);   // Quick follow-up
        setTimeout(forceHighlightingUpdate, 200);  // Delayed follow-up
        setTimeout(forceHighlightingUpdate, 500);  // Final follow-up
    }

    // Update the reach out status in the profile if it's open
    setTimeout(() => {
        console.log('🔄 Updating reach out status in profile...');
        console.log('🔄 Lead data after save:', leads[leadIndex]);

        if (window.updateReachOutStatus) {
            console.log('🔄 Calling updateReachOutStatus...');
            window.updateReachOutStatus(leadId);
        } else {
            console.log('❌ updateReachOutStatus function not found');
        }

        // Also try to update any open lead profile completely
        const profileElement = document.querySelector('.lead-profile-modal, #simple-lead-profile, .enhanced-lead-profile');
        if (profileElement) {
            console.log('🔄 Profile is open, forcing complete refresh...');
            setTimeout(() => {
                if (window.showLeadProfile) {
                    window.showLeadProfile(leadId);
                }
            }, 50);
        }
    }, 100);

    showNotification('Lead updated successfully!', 'success');
}

// Function to refresh just the leads table content
function refreshLeadsTable() {
    console.log('🔄 Refreshing leads table content...');

    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) {
        console.log('❌ No leads table body found');
        return;
    }

    // Get fresh leads data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

    // Apply current sorting if any
    const currentSort = window.currentSort || { field: 'name', direction: 'asc' };

    // Sort leads - closed leads always go to the bottom
    leads.sort((a, b) => {
        // First, check if either lead is closed - closed leads go to the bottom
        if (a.stage === 'closed' && b.stage !== 'closed') return 1;
        if (b.stage === 'closed' && a.stage !== 'closed') return -1;

        // If both are closed or both are not closed, apply the regular sorting
        let aVal = a[currentSort.field] || '';
        let bVal = b[currentSort.field] || '';

        if (currentSort.field === 'premium') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        } else {
            aVal = aVal.toString().toLowerCase();
            bVal = bVal.toString().toLowerCase();
        }

        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Update the table body with fresh data
    tableBody.innerHTML = generateSimpleLeadRows(leads);

    // Reapply highlighting
    setTimeout(() => {
        console.log('🎨 Reapplying highlighting after table refresh...');
        if (window.applyReachOutCompleteHighlighting) {
            window.applyReachOutCompleteHighlighting();
        }
        if (window.forceAllHighlighting) {
            window.forceAllHighlighting();
        }
    }, 100);

    console.log('✅ Leads table refreshed successfully');
}

// Function to update a specific lead row in the table without refreshing the entire table
function updateLeadRowInTable(leadId, updatedLead) {
    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) {
        console.log('No leads table found');
        return;
    }

    // Find the row for this lead
    const rows = tableBody.querySelectorAll('tr');
    let targetRow = null;

    rows.forEach(row => {
        // Check if this row contains the lead (look for data attributes or lead info)
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            // Look for the lead name or any identifying information
            const nameCell = cells[0];
            if (nameCell && nameCell.textContent.includes(updatedLead.name)) {
                targetRow = row;
            }
        }
    });

    if (targetRow) {
        console.log(`🔄 Found row for lead ${updatedLead.name}, updating...`);

        // Generate the updated row HTML
        const updatedRowHTML = generateSimpleLeadRows([updatedLead]);

        // Replace the old row with the new one
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = updatedRowHTML;
        const newRow = tempDiv.querySelector('tr');

        if (newRow) {
            targetRow.replaceWith(newRow);
            console.log(`✅ Updated row for lead ${updatedLead.name}`);

            // Reapply highlighting to the new row
            setTimeout(() => {
                if (window.applyReachOutCompleteHighlighting) {
                    window.applyReachOutCompleteHighlighting();
                }
                if (window.forceAllHighlighting) {
                    window.forceAllHighlighting();
                }
            }, 50);
        } else {
            console.log('❌ Failed to generate new row HTML');
        }
    } else {
        console.log(`❌ Could not find row for lead ${updatedLead.name} - refreshing entire table`);
        // Fallback: refresh the entire leads view
        loadLeadsView();
    }
}

function closeEditLeadModal() {
    const modal = document.getElementById('editLeadModal');
    if (modal) modal.remove();
}

function convertLead(leadId) {
    // Get the lead data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    // Convert leadId to string for comparison since IDs might be stored as strings
    const lead = leads.find(l => String(l.id) === String(leadId));
    
    if (!lead) {
        showNotification('Lead not found', 'error');
        console.error('Lead not found with ID:', leadId, 'Available IDs:', leads.map(l => l.id));
        return;
    }
    
    // Create conversion modal
    const modalHTML = `
        <div class="modal-overlay active" id="convertLeadModal">
            <div class="modal-container" style="max-width: 700px; width: 90%;">
                <div class="modal-header" style="padding: 24px 30px; border-bottom: 1px solid #e5e7eb;">
                    <h2 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">Convert Lead to Client</h2>
                    <button class="close-btn" onclick="closeConvertModal()" style="font-size: 28px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0; color: #0369a1; font-size: 14px;">
                            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                            Converting <strong>${lead.name}</strong> from lead to client. Please review and confirm the information below.
                        </p>
                    </div>
                    
                    <form id="convertLeadForm" onsubmit="confirmConvertLead(event, ${leadId})">
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Client Name</label>
                                <input type="text" class="form-control" id="clientName" value="${lead.name}" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Company</label>
                                <input type="text" class="form-control" id="clientCompany" value="${lead.company || ''}" 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Phone</label>
                                <input type="tel" class="form-control" id="clientPhone" value="${lead.phone}" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Email</label>
                                <input type="email" class="form-control" id="clientEmail" value="${lead.email}" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Client Type</label>
                                <select class="form-control" id="clientType" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="Personal">Personal</option>
                                    <option value="Commercial" ${lead.insuranceType === 'Business' || lead.insuranceType === 'Commercial Auto' ? 'selected' : ''}>Commercial</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Account Manager</label>
                                <select class="form-control" id="clientManager" required 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; background: white;">
                                    <option value="${lead.assignedTo || ''}">${lead.assignedTo || 'Select Manager'}</option>
                                    <option value="Grant">Grant</option>
                                    <option value="Hunter">Hunter</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Address</label>
                                <input type="text" class="form-control" id="clientAddress" value="${lead.address || ''}" 
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;">
                            </div>
                            
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">Conversion Notes</label>
                                <textarea class="form-control" id="conversionNotes" rows="3" 
                                    placeholder="Add any notes about this conversion..."
                                    style="width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; resize: vertical;"></textarea>
                            </div>
                        </div>
                        
                        ${lead.quotes && lead.quotes.length > 0 ? `
                        <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px;">
                            <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">
                                <i class="fas fa-file-invoice-dollar" style="margin-right: 8px;"></i>
                                This lead has ${lead.quotes.length} quote(s) that will be transferred to the client profile.
                            </p>
                        </div>
                        ` : ''}
                        
                        <div class="modal-footer" style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                            <label style="display: flex; align-items: center; font-size: 14px; color: #374151;">
                                <input type="checkbox" id="deleteLead" checked style="margin-right: 8px;">
                                Delete lead after conversion
                            </label>
                            <div style="display: flex; gap: 12px;">
                                <button type="button" class="btn-secondary" onclick="closeConvertModal()" 
                                    style="padding: 12px 24px; font-size: 15px;">Cancel</button>
                                <button type="submit" class="btn-primary" 
                                    style="padding: 12px 24px; font-size: 15px; background: #10b981;">
                                    <i class="fas fa-user-check" style="margin-right: 8px;"></i> Convert to Client
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeConvertModal() {
    const modal = document.getElementById('convertLeadModal');
    if (modal) modal.remove();
}

function confirmConvertLead(event, leadId) {
    event.preventDefault();
    
    // Get form values
    const clientName = document.getElementById('clientName').value.trim();
    const clientCompany = document.getElementById('clientCompany').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const clientEmail = document.getElementById('clientEmail').value.trim();
    const clientType = document.getElementById('clientType').value;
    const clientManager = document.getElementById('clientManager').value;
    const clientAddress = document.getElementById('clientAddress').value.trim();
    const conversionNotes = document.getElementById('conversionNotes').value.trim();
    const shouldDeleteLead = document.getElementById('deleteLead').checked;
    
    // Get leads and find the specific lead
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    const lead = leads[leadIndex];
    
    // Get existing clients
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    
    // Create new client object
    const newClient = {
        id: Date.now(),
        name: clientName,
        company: clientCompany,
        type: clientType,
        phone: clientPhone,
        email: clientEmail,
        address: clientAddress,
        accountManager: clientManager,
        policies: [],
        claims: [],
        quotes: lead.quotes || [],
        totalPremium: lead.premium || 0,
        createdAt: new Date().toISOString(),
        convertedFrom: 'lead',
        leadId: leadId,
        conversionNotes: conversionNotes,
        notes: lead.notes || '',
        activities: [
            ...(lead.activities || []),
            {
                type: 'converted',
                date: new Date().toISOString(),
                note: `Converted from lead to client by ${clientManager || 'Admin'}`
            }
        ]
    };
    
    // Add to clients array
    clients.push(newClient);
    
    // Save clients
    localStorage.setItem('insurance_clients', JSON.stringify(clients));
    
    // Delete lead if requested
    if (shouldDeleteLead) {
        leads.splice(leadIndex, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
    } else {
        // Mark lead as converted
        leads[leadIndex].converted = true;
        leads[leadIndex].convertedDate = new Date().toISOString();
        leads[leadIndex].clientId = newClient.id;
        leads[leadIndex].stage = 'converted';  // Set stage to converted
        leads[leadIndex].status = 'converted';  // Also set status for backward compatibility

        // Update stage timestamp for conversion
        if (!leads[leadIndex].stageTimestamps) {
            leads[leadIndex].stageTimestamps = {};
        }
        leads[leadIndex].stageTimestamps['converted'] = new Date().toISOString();

        // Save to server with updated timestamps
        saveLeadToServer(leads[leadIndex]);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
    }
    
    // Close modal
    closeConvertModal();
    
    // Show success notification
    showNotification(`Lead "${clientName}" has been successfully converted to a client!`, 'success');
    
    // Reload the current view
    if (document.querySelector('.leads-view')) {
        loadLeadsView();
    } else if (document.querySelector('.lead-profile')) {
        loadClientsView();
    }
}

// Lead Quote Management Functions
function generateQuotesList(quotes) {
    if (!quotes || quotes.length === 0) {
        return `
            <div class="empty-quotes">
                <i class="fas fa-file-invoice-dollar"></i>
                <p>No quotes added yet</p>
                <p class="text-muted">Click "Add Quote" to upload insurance quotes from different companies</p>
            </div>
        `;
    }
    
    return quotes.map((quote, index) => `
        <div class="quote-item" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9fafb;">
            <div class="quote-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div>
                    <h4 style="margin: 0; color: #111827; font-size: 18px;">
                        <i class="fas fa-building" style="color: #6b7280; margin-right: 8px;"></i>
                        ${quote.company}
                    </h4>
                    <p class="quote-date" style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                        <i class="fas fa-calendar"></i> Quoted on ${new Date(quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div class="quote-amount" style="text-align: right;">
                    <span class="label" style="color: #6b7280; font-size: 12px; display: block;">Premium</span>
                    <span class="amount" style="color: #059669; font-size: 24px; font-weight: bold;">$${quote.premium.toLocaleString()}</span>
                </div>
            </div>
            
            ${quote.notes ? `
                <div class="quote-notes" style="margin: 10px 0; padding: 10px; background: white; border-radius: 6px;">
                    <strong style="color: #374151; font-size: 13px;">Notes:</strong>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${quote.notes}</p>
                </div>
            ` : ''}
            
            ${quote.fileName ? `
                <div class="quote-file" style="margin: 10px 0;">
                    <i class="fas fa-file-pdf" style="color: #dc2626; margin-right: 5px;"></i>
                    <span style="color: #0066cc; text-decoration: underline; cursor: pointer; font-size: 14px;">
                        ${quote.fileName}
                    </span>
                </div>
            ` : ''}
            
            <div class="quote-actions" style="display: flex; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                <button class="btn-secondary btn-small" onclick="viewQuoteDetails(${index})" style="padding: 5px 10px; font-size: 13px;">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="btn-secondary btn-small" onclick="downloadQuote(${index})" style="padding: 5px 10px; font-size: 13px;">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn-secondary btn-small" onclick="deleteQuote(${index})" style="padding: 5px 10px; font-size: 13px; color: #dc2626;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function addQuote(leadId) {
    // Add styles for input group if not already present
    if (!document.getElementById('quote-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'quote-modal-styles';
        style.textContent = `
            .input-group {
                display: flex;
                align-items: stretch;
            }
            .input-group-text {
                padding: 10px 12px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-right: none;
                border-radius: 6px 0 0 6px;
                color: #6b7280;
                font-weight: 500;
            }
            .input-group .form-control {
                border-radius: 0 6px 6px 0;
                flex: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    const modalHTML = `
        <div class="modal-overlay active" id="quoteModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Add Insurance Quote</h2>
                    <button class="close-btn" onclick="closeQuoteModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="quoteForm">
                        <div class="form-group">
                            <label>Insurance Company *</label>
                            <select class="form-control" id="quoteCompany" required>
                                <option value="">Select Insurance Company</option>
                                <option value="Progressive">Progressive</option>
                                <option value="State Farm">State Farm</option>
                                <option value="GEICO">GEICO</option>
                                <option value="Allstate">Allstate</option>
                                <option value="Liberty Mutual">Liberty Mutual</option>
                                <option value="Farmers">Farmers</option>
                                <option value="Nationwide">Nationwide</option>
                                <option value="USAA">USAA</option>
                                <option value="Travelers">Travelers</option>
                                <option value="American Family">American Family</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Quote Date *</label>
                                <input type="date" class="form-control" id="quoteDate" required value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Premium Amount *</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" class="form-control" id="quotePremium" required placeholder="0.00" step="0.01" min="0">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Upload Quote Document (PDF)</label>
                            <input type="file" class="form-control" id="quoteFile" accept=".pdf">
                            <small class="form-text">Upload the quote PDF from the insurance company</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea class="form-control" id="quoteNotes" rows="4" placeholder="Additional notes about this quote..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeQuoteModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveQuote(${leadId})">Save Quote</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function saveQuote(leadId) {
    // Validate required fields
    const company = document.getElementById('quoteCompany').value;
    const date = document.getElementById('quoteDate').value;
    const premium = document.getElementById('quotePremium').value;
    
    if (!company || !date || !premium) {
        alert('Please fill in all required fields (Company, Date, and Premium Amount)');
        return;
    }
    
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
        alert('Lead not found');
        return;
    }
    
    // Handle file upload and convert to data URL for preview
    const fileInput = document.getElementById('quoteFile');
    let fileName = null;
    let fileData = null;
    
    // Create a promise to handle file reading
    const filePromise = new Promise((resolve) => {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            fileName = file.name;
            
            // Convert file to data URL for storage and preview
            const reader = new FileReader();
            reader.onload = function(e) {
                fileData = e.target.result;
                resolve();
            };
            reader.onerror = function() {
                console.error('Error reading file');
                resolve();
            };
            reader.readAsDataURL(file);
        } else {
            resolve();
        }
    });
    
    // Wait for file to be read before saving
    filePromise.then(() => {
    
        const quote = {
            id: Date.now(), // Add unique ID for each quote
            company: company,
            date: date,
            premium: parseFloat(premium),
            notes: document.getElementById('quoteNotes').value,
            fileName: fileName,
            fileData: fileData, // Store the file data URL
            createdAt: new Date().toISOString()
        };
        
        // Initialize quotes array if it doesn't exist
        if (!lead.quotes) {
            lead.quotes = [];
        }
        
        // Add the new quote
        lead.quotes.push(quote);
        
        // Update lead's premium with the latest quote premium
        lead.premium = quote.premium;
        
        // Save updated leads to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        
        console.log('Quote saved:', quote);
        console.log('Updated lead:', lead);
        
        // Close modal and refresh view
        closeQuoteModal();
        viewLead(leadId); // Refresh the lead view to show new quote
        
        // Show success notification
        showNotification('Quote added successfully!', 'success');
    });
}

function closeQuoteModal() {
    const modal = document.getElementById('quoteModal');
    if (modal) modal.remove();
}

function deleteQuote(quoteIndex) {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    // Get the current lead ID from the view
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes) {
        lead.quotes.splice(quoteIndex, 1);
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        viewLead(leadId); // Refresh the view
        showNotification('Quote deleted successfully', 'success');
    }
}

function viewQuoteDetails(quoteIndex) {
    // Get the current lead and quote
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead || !lead.quotes || !lead.quotes[quoteIndex]) return;
    
    const quote = lead.quotes[quoteIndex];
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay active" id="quoteDetailsModal">
            <div class="modal-container" style="max-width: 1200px; width: 90%; height: 80vh;">
                <div class="modal-header">
                    <h2>Quote Details - ${quote.company}</h2>
                    <button class="close-btn" onclick="closeQuoteDetailsModal()">&times;</button>
                </div>
                <div class="modal-body" style="display: flex; gap: 20px; height: calc(100% - 60px); padding: 20px;">
                    ${quote.fileName ? `
                        <!-- PDF Preview Section -->
                        <div class="pdf-section" style="flex: 1.5; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                            <h3 style="margin-top: 0; margin-bottom: 15px; color: #374151; font-size: 16px;">
                                <i class="fas fa-file-pdf" style="color: #dc2626;"></i> Quote Document
                            </h3>
                            <div class="pdf-viewer" style="height: calc(100% - 40px); background: white; border: 1px solid #d1d5db; border-radius: 6px; position: relative; overflow: hidden;">
                                <!-- PDF.js Canvas Container -->
                                <div id="pdf-container-${quoteIndex}" style="width: 100%; height: 100%; overflow: auto;">
                                    <canvas id="pdf-canvas-${quoteIndex}" style="display: block; margin: 0 auto;"></canvas>
                                </div>
                                <!-- PDF Controls -->
                                <div id="pdf-controls-${quoteIndex}" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.7); border-radius: 6px; padding: 5px 10px; display: none; gap: 10px; align-items: center;">
                                    <button onclick="previousPage(${quoteIndex})" class="btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <span id="page-info-${quoteIndex}" style="color: white; font-size: 12px;">1 / 1</span>
                                    <button onclick="nextPage(${quoteIndex})" class="btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                                <!-- Loading indicator -->
                                <div id="pdf-loading-${quoteIndex}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 15px; color: #6b7280;"></i>
                                    <p style="color: #6b7280;">Loading PDF...</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Quote Information Section -->
                    <div class="info-section" style="flex: 1; ${!quote.fileName ? 'max-width: 600px; margin: 0 auto;' : ''}">
                        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: white; height: 100%;">
                            <h3 style="margin-top: 0; margin-bottom: 20px; color: #111827; font-size: 18px;">
                                <i class="fas fa-info-circle" style="color: #0066cc;"></i> Quote Information
                            </h3>
                            
                            <div class="quote-detail-grid" style="display: grid; gap: 20px;">
                                <div class="detail-row">
                                    <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Insurance Company</label>
                                    <div style="font-size: 20px; color: #111827; font-weight: 600; margin-top: 5px;">
                                        <i class="fas fa-building" style="color: #6b7280; margin-right: 8px;"></i>
                                        ${quote.company}
                                    </div>
                                </div>
                                
                                <div class="detail-row">
                                    <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Quote Date</label>
                                    <div style="font-size: 18px; color: #374151; margin-top: 5px;">
                                        <i class="fas fa-calendar" style="color: #6b7280; margin-right: 8px;"></i>
                                        ${new Date(quote.date).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                </div>
                                
                                <div class="detail-row">
                                    <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Premium Amount</label>
                                    <div style="font-size: 32px; color: #059669; font-weight: bold; margin-top: 5px;">
                                        $${quote.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                
                                ${quote.notes ? `
                                    <div class="detail-row">
                                        <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Notes</label>
                                        <div style="font-size: 15px; color: #374151; margin-top: 8px; padding: 12px; background: #f9fafb; border-radius: 6px; line-height: 1.6;">
                                            ${quote.notes}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="detail-row">
                                    <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PDF Attachment</label>
                                    <div style="font-size: 15px; color: ${quote.fileName ? '#059669' : '#6b7280'}; margin-top: 5px;">
                                        <i class="fas ${quote.fileName ? 'fa-check-circle' : 'fa-times-circle'}" style="margin-right: 8px;"></i>
                                        ${quote.fileName || 'No PDF attached'}
                                    </div>
                                </div>
                                
                                ${quote.createdAt ? `
                                    <div class="detail-row">
                                        <label style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Added to System</label>
                                        <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                                            <i class="fas fa-clock" style="margin-right: 8px;"></i>
                                            ${new Date(quote.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 10px;">
                                <button class="btn-primary" onclick="editQuote(${quoteIndex})" style="flex: 1;">
                                    <i class="fas fa-edit"></i> Edit Quote
                                </button>
                                <button class="btn-secondary" onclick="printQuoteDetails(${quoteIndex})" style="flex: 1;">
                                    <i class="fas fa-print"></i> Print
                                </button>
                                <button class="btn-secondary" style="background: #fee2e2; color: #dc2626; border-color: #fecaca;" onclick="deleteQuoteFromModal(${quoteIndex})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles if not present
    if (!document.getElementById('quote-details-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'quote-details-modal-styles';
        style.textContent = `
            #quoteDetailsModal .modal-container {
                display: flex;
                flex-direction: column;
            }
            #quoteDetailsModal .modal-body {
                overflow-y: auto;
            }
            @media (max-width: 768px) {
                #quoteDetailsModal .modal-body {
                    flex-direction: column !important;
                }
                #quoteDetailsModal .pdf-section {
                    min-height: 400px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Load the PDF if it exists using PDF.js
    if (quote.fileData || quote.fileName) {
        setTimeout(() => {
            loadPDFWithPDFJS(quoteIndex, quote);
        }, 100);
    }
}

// PDF.js implementation
async function loadPDFWithPDFJS(quoteIndex, quote) {
    if (!quote.fileData) {
        console.log('No PDF data available');
        return;
    }
    
    try {
        // Configure PDF.js worker
        console.log('Starting PDF load for quote index:', quoteIndex);
        console.log('PDF.js available:', typeof pdfjsLib !== 'undefined');
        
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js library not loaded');
            throw new Error('PDF.js library not available');
        }
        
        // Set worker path if not already set
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
        }
        
        // Convert base64 to array buffer
        let pdfData = quote.fileData;
        if (pdfData.startsWith('data:')) {
            pdfData = pdfData.split(',')[1];
        }
        
        const pdfBytes = atob(pdfData);
        const buffer = new ArrayBuffer(pdfBytes.length);
        const array = new Uint8Array(buffer);
        for (let i = 0; i < pdfBytes.length; i++) {
            array[i] = pdfBytes.charCodeAt(i);
        }
        
        // Load the PDF document
        console.log('Loading PDF document with array buffer, size:', array.length);
        const loadingTask = pdfjsLib.getDocument({ data: array });
        const pdf = await loadingTask.promise;
        
        console.log('PDF loaded, pages:', pdf.numPages);
        
        // Store PDF document reference for navigation
        window[`pdfDoc_${quoteIndex}`] = pdf;
        window[`currentPage_${quoteIndex}`] = 1;
        
        // Render the first page
        await renderPage(quoteIndex, 1, pdf);
        
        // Show controls if multi-page
        if (pdf.numPages > 1) {
            const controls = document.getElementById(`pdf-controls-${quoteIndex}`);
            if (controls) {
                controls.style.display = 'flex';
                document.getElementById(`page-info-${quoteIndex}`).textContent = `1 / ${pdf.numPages}`;
            }
        }
        
        // Hide loading indicator
        const loading = document.getElementById(`pdf-loading-${quoteIndex}`);
        if (loading) loading.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading PDF with PDF.js:', error);
        const container = document.getElementById(`pdf-container-${quoteIndex}`);
        if (container) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 20px;"></i>
                    <h3 style="color: #374151; margin-bottom: 10px;">Error Loading PDF</h3>
                    <p style="color: #6b7280; margin-bottom: 20px;">
                        ${error.message}<br>
                        You can still download the file to view locally.
                    </p>
                    <button class="btn-primary" onclick="downloadQuoteWithData(${quoteIndex})" style="padding: 10px 20px;">
                        <i class="fas fa-download"></i> Download PDF
                    </button>
                </div>
            `;
        }
        const loading = document.getElementById(`pdf-loading-${quoteIndex}`);
        if (loading) loading.style.display = 'none';
    }
}

async function renderPage(quoteIndex, pageNum, pdf) {
    try {
        const page = await pdf.getPage(pageNum);
        const canvas = document.getElementById(`pdf-canvas-${quoteIndex}`);
        const container = document.getElementById(`pdf-container-${quoteIndex}`);
        
        if (!canvas || !container) return;
        
        const ctx = canvas.getContext('2d');
        
        // Calculate scale to fit container
        const containerWidth = container.clientWidth - 20; // Padding
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        const renderContext = {
            canvasContext: ctx,
            viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        console.log(`Page ${pageNum} rendered for quote ${quoteIndex}`);
        
    } catch (error) {
        console.error('Error rendering PDF page:', error);
    }
}

function previousPage(quoteIndex) {
    const pdf = window[`pdfDoc_${quoteIndex}`];
    let currentPage = window[`currentPage_${quoteIndex}`] || 1;
    
    if (pdf && currentPage > 1) {
        currentPage--;
        window[`currentPage_${quoteIndex}`] = currentPage;
        renderPage(quoteIndex, currentPage, pdf);
        document.getElementById(`page-info-${quoteIndex}`).textContent = `${currentPage} / ${pdf.numPages}`;
    }
}

function nextPage(quoteIndex) {
    const pdf = window[`pdfDoc_${quoteIndex}`];
    let currentPage = window[`currentPage_${quoteIndex}`] || 1;
    
    if (pdf && currentPage < pdf.numPages) {
        currentPage++;
        window[`currentPage_${quoteIndex}`] = currentPage;
        renderPage(quoteIndex, currentPage, pdf);
        document.getElementById(`page-info-${quoteIndex}`).textContent = `${currentPage} / ${pdf.numPages}`;
    }
}

function downloadQuote(quoteIndex) {
    // In a real implementation, this would download the PDF
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        const quote = lead.quotes[quoteIndex];
        if (quote.fileName) {
            alert(`Downloading: ${quote.fileName}`);
        } else {
            alert('No PDF file attached to this quote');
        }
    }
}

function closeQuoteDetailsModal() {
    const modal = document.getElementById('quoteDetailsModal');
    if (modal) modal.remove();
}

function downloadQuotePDF(fileName) {
    // In a real implementation, this would download the actual PDF file
    alert(`Downloading: ${fileName}`);
}

function downloadQuoteWithData(quoteIndex) {
    // Get the current lead and quote
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        const quote = lead.quotes[quoteIndex];
        
        if (quote.fileData) {
            // Create a link element and trigger download
            const link = document.createElement('a');
            link.href = quote.fileData;
            link.download = quote.fileName || `quote-${quote.company}-${quote.date}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('No PDF file available for download');
        }
    }
}

function editQuote(quoteIndex) {
    // Close the details modal first
    closeQuoteDetailsModal();
    
    // Get the current lead and quote
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        const quote = lead.quotes[quoteIndex];
        
        // Open the edit modal with pre-filled values
        // For now, we'll just open the add quote modal
        // In a real implementation, you'd pre-fill the form
        alert('Edit functionality would open here with pre-filled quote data');
    }
}

function printQuoteDetails(quoteIndex) {
    // Get the current lead and quote
    const leadElement = document.querySelector('.lead-profile');
    if (!leadElement) return;
    
    const leadId = parseInt(leadElement.dataset.leadId);
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        const quote = lead.quotes[quoteIndex];
        
        // Create a printable version
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Quote Details - ${quote.company}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #111827; }
                        .detail { margin: 15px 0; }
                        .label { font-weight: bold; color: #6b7280; }
                        .value { font-size: 18px; color: #111827; }
                        .premium { font-size: 24px; color: #059669; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Insurance Quote - ${quote.company}</h1>
                    <div class="detail">
                        <div class="label">Company:</div>
                        <div class="value">${quote.company}</div>
                    </div>
                    <div class="detail">
                        <div class="label">Date:</div>
                        <div class="value">${new Date(quote.date).toLocaleDateString()}</div>
                    </div>
                    <div class="detail">
                        <div class="label">Premium:</div>
                        <div class="value premium">$${quote.premium.toFixed(2)}</div>
                    </div>
                    ${quote.notes ? `
                        <div class="detail">
                            <div class="label">Notes:</div>
                            <div class="value">${quote.notes}</div>
                        </div>
                    ` : ''}
                    <div class="detail">
                        <div class="label">PDF Attachment:</div>
                        <div class="value">${quote.fileName || 'No PDF attached'}</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

function deleteQuoteFromModal(quoteIndex) {
    if (confirm('Are you sure you want to delete this quote?')) {
        closeQuoteDetailsModal();
        deleteQuote(quoteIndex);
    }
}

async function deleteLead(leadId) {
    if (confirm('Are you sure you want to delete this lead?')) {
        console.log('Deleting lead:', leadId);

        // VICIDIAL PROTECTION: Don't track ViciDial leads as deleted (9-digit IDs starting with '88')
        const isViciDialLead = String(leadId).startsWith('88') && String(leadId).length === 9;
        if (isViciDialLead) {
            console.log(`🔓 VICIDIAL DELETE PROTECTION: Preventing ViciDial lead ${leadId} from being marked as deleted`);
        } else {
            // Track deleted leads to prevent them from reappearing
            const deletedLeads = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
            if (!deletedLeads.includes(String(leadId))) {
                deletedLeads.push(String(leadId));
                localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedLeads));
            }
        }

        // Delete from server first
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('Lead deleted from server');
            } else {
                console.warn('Failed to delete from server, will remove locally');
            }
        } catch (error) {
            console.error('Error deleting from server:', error);
        }

        // Also delete from local storage
        console.log('Starting local delete for lead:', leadId);

        let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

        console.log('Current insurance_leads count:', insurance_leads.length);
        console.log('Sample lead IDs:', insurance_leads.slice(0, 3).map(l => l.id));

        const initialCount = insurance_leads.length;

        // Filter out the deleted lead from both arrays
        insurance_leads = insurance_leads.filter(l => {
            const keep = String(l.id) !== String(leadId);
            if (!keep) {
                console.log(`Removing lead: ${l.id} (${l.name})`);
            }
            return keep;
        });
        regular_leads = regular_leads.filter(l => String(l.id) !== String(leadId));

        const finalCount = insurance_leads.length;
        console.log(`After filter - Initial: ${initialCount}, Final: ${finalCount}, Deleted: ${initialCount - finalCount}`);

        if (initialCount === finalCount) {
            console.error('Lead not found with ID:', leadId);
            console.log('Available lead IDs:', insurance_leads.map(l => l.id));
            showNotification('Lead not found', 'error');
            return;
        }

        // Save both arrays back to localStorage
        console.log('Saving to localStorage...');
        localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
        localStorage.setItem('leads', JSON.stringify(regular_leads));

        console.log('localStorage updated, reloading view...');

        // Add a small delay before reloading to ensure localStorage is saved
        setTimeout(() => {
            loadLeadsView();
            showNotification('Lead deleted successfully', 'success');
        }, 100);
    }
}

// Lead Sorting - Default to sorting by assignedTo to group leads by user
let currentSort = { field: 'assignedTo', direction: 'asc' };

function sortLeads(field) {
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    
    // Toggle direction if same field, otherwise default to ascending
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Sort the leads
    leads.sort((a, b) => {
        // FIRST: Always prioritize current user's leads regardless of field being sorted
        let currentUser = '';
        const userData = sessionStorage.getItem('vanguard_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                // Capitalize username to match assignedTo format (grant -> Grant)
                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        // Check if leads belong to current user
        const aIsCurrentUser = currentUser && (a.assignedTo === currentUser);
        const bIsCurrentUser = currentUser && (b.assignedTo === currentUser);

        // If one belongs to current user and other doesn't, current user goes first
        if (aIsCurrentUser && !bIsCurrentUser) return -1;
        if (bIsCurrentUser && !aIsCurrentUser) return 1;

        // SECOND: If both leads have same user assignment (both current user's OR both other users'), sort by the selected field
        let aVal = a[field];
        let bVal = b[field];

        // Special handling for assignedTo field
        if (field === 'assignedTo') {
            // Handle unassigned
            aVal = aVal || 'zzz';
            bVal = bVal || 'zzz';
        }
        // Handle different field types
        else if (field === 'premium') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        } else if (field === 'renewalDate' || field === 'created') {
            aVal = new Date(aVal || '2099-12-31');
            bVal = new Date(bVal || '2099-12-31');
        } else if (field === 'stage') {
            // Custom stage ordering - closed leads always at the bottom
            const stageOrder = {
                'new': 1,
                'quoted': 2,
                'quote-sent-unaware': 3,
                'quote-sent-aware': 4,
                'interested': 5,
                'not-interested': 6,
                'contacted': 7,
                'reviewed': 8,
                'converted': 9,
                'closed': 999  // Always at bottom regardless of sort direction
            };
            aVal = stageOrder[aVal] || 500;
            bVal = stageOrder[bVal] || 500;
        }

        // Compare values
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Update the table body
    const tableBody = document.getElementById('leadsTableBody');
    if (tableBody) {
        tableBody.innerHTML = generateSimpleLeadRows(leads);

        // Apply reach out completion highlighting after table is rendered
        setTimeout(() => {
            console.log('🎨 Applying reach out highlighting after server data load...');
            if (window.applyReachOutCompleteHighlighting) {
                window.applyReachOutCompleteHighlighting();
            }
            if (window.forceAllHighlighting) {
                window.forceAllHighlighting();
            }
        }, 100);
    }
    
    // Update sort arrows
    updateSortArrows(field, currentSort.direction);
}

function updateSortArrows(field, direction) {
    // Reset all arrows to neutral
    document.querySelectorAll('.sort-arrow i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    // Update the active column arrow
    const arrow = document.getElementById(`sort-${field}`);
    if (arrow) {
        const icon = arrow.querySelector('i');
        if (icon) {
            icon.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
    }
}

// Global pagination state for clients
let currentClientPage = 1;
const clientsPerPage = 10;

function generateClientRows(page = 1) {
    console.log('🚨 GENERATECLIENTROWS - Loading from localStorage');
    // Load clients from localStorage immediately
    let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    console.log(`✅ Loaded ${clients.length} clients from localStorage`);

    // Get current user and check if they are admin
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
            console.log(`🔍 Current user: ${currentUser}, Is Admin: ${isAdmin}`);
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Filter clients based on user role
    if (!isAdmin && currentUser) {
        const originalCount = clients.length;
        clients = clients.filter(client => {
            const assignedTo = client.assignedTo || client.agent || 'Grant'; // Default to Grant if no assignment
            return assignedTo.toLowerCase() === currentUser.toLowerCase();
        });
        console.log(`🔒 Filtered clients: ${originalCount} -> ${clients.length} (showing only ${currentUser}'s clients)`);
    } else if (isAdmin) {
        console.log(`👑 Admin user - showing all ${clients.length} clients`);
    }

    // Remove duplicates based on name
    const uniqueClients = [];
    const seenNames = new Set();

    clients.forEach(client => {
        const name = (client.name || '').toUpperCase().trim();
        if (name && !seenNames.has(name)) {
            seenNames.add(name);
            uniqueClients.push(client);
        } else if (!name) {
            // Keep clients without names (shouldn't happen but just in case)
            uniqueClients.push(client);
        }
    });

    clients = uniqueClients;
    console.log('generateClientRows - Found unique clients:', clients.length);
    
    // If no clients, show a message
    if (clients.length === 0) {
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
    
    // Calculate pagination
    const totalPages = Math.ceil(clients.length / clientsPerPage);
    const startIndex = (page - 1) * clientsPerPage;
    const endIndex = Math.min(startIndex + clientsPerPage, clients.length);
    const paginatedClients = clients.slice(startIndex, endIndex);

    // Store current page globally
    currentClientPage = page;

    // Get all policies from storage to calculate premiums
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Generate rows for each paginated client
    return paginatedClients.map(client => {
        // Get initials for avatar
        const nameParts = (client.name || 'Unknown').split(' ').filter(n => n);
        const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';

        // Count policies and calculate total premium
        let policyCount = 0;
        let totalPremium = 0;

        // Find all policies for this client - ONLY use fresh data
        const clientPolicies = allPolicies.filter(policy => {
            // Check if policy belongs to this client by clientId
            if (policy.clientId && String(policy.clientId) === String(client.id)) return true;

            // Check if the insured name matches
            const insuredName = policy.insured?.['Name/Business Name'] ||
                               policy.insured?.['Primary Named Insured'] ||
                               policy.insuredName;
            if (insuredName && client.name && insuredName.toLowerCase() === client.name.toLowerCase()) return true;

            // DO NOT check client.policies array as it may be outdated
            // Only use the fresh data from insurance_policies storage
            return false;
        });

        policyCount = clientPolicies.length;
        console.log(`Client ${client.name}: Found ${policyCount} policies`);

        // Calculate total premium from policies - check all possible locations
        clientPolicies.forEach(policy => {
            // Check all possible premium field locations
            const premiumValue = policy.financial?.['Annual Premium'] ||
                                policy.financial?.['Premium'] ||
                                policy.financial?.annualPremium ||
                                policy.financial?.premium ||
                                policy['Annual Premium'] ||
                                policy.Premium ||
                                policy.premium ||
                                policy.annualPremium || 0;

            const numericPremium = typeof premiumValue === 'string' ?
                parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 :
                parseFloat(premiumValue) || 0;

            console.log(`  Policy ${policy.policyNumber}: Premium value = ${premiumValue} -> numeric = ${numericPremium}`);
            console.log(`    Full policy.financial:`, policy.financial);
            totalPremium += numericPremium;
        });

        // Format premium display
        const premiumDisplay = totalPremium > 0 ? `$${totalPremium.toLocaleString()}/yr` : 'N/A';
        console.log(`  Total Premium: ${totalPremium} -> ${premiumDisplay}`);

        // Get assigned agent - check multiple possible locations
        const assignedTo = client.assignedTo ||
                          client.agent ||
                          client.assignedAgent ||
                          client.producer ||
                          'Grant'; // Default to Grant if no assignment

        return `
            <tr>
                <td class="client-name">
                    <div class="client-avatar">${initials}</div>
                    <span>${client.name}</span>
                </td>
                <td>${client.phone}</td>
                <td>${client.email}</td>
                <td>${policyCount}</td>
                <td>${premiumDisplay}</td>
                <td>${assignedTo}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewClient('${client.id}')" title="View Client"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="editClient('${client.id}')" title="Edit Client"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="emailClient('${client.id}')" title="Email Client"><i class="fas fa-envelope"></i></button>
                        <button class="btn-icon" onclick="deleteClient('${client.id}')" title="Delete Client" style="color: #dc2626;"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadClientsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

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
                        <tr><td colspan="7" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading clients from server...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="table-footer">
                <div class="showing-info" id="clientsShowingInfo">
                    Loading clients...
                </div>
                <div class="pagination" id="clientsPagination">
                    <!-- Pagination buttons will be generated dynamically -->
                </div>
            </div>
        </div>
    `;

    // Load clients from server first, then populate table
    await loadClientsFromServer();

    // Populate the table with actual client data
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) {
        tbody.innerHTML = generateClientRows(currentClientPage);
    }

    // Update count and pagination
    updateClientsPagination();

    // Update the footer info with actual counts
    updateClientsFooterInfo();
    
    // Scan for clickable phone numbers and emails with aggressive retry
    const scanContent = () => {
        if (window.scanForClickableContent) {
            console.log('Scanning Clients Management view for clickable content...');
            window.scanForClickableContent(dashboardContent);
            
            // Check if any clickable elements were created
            setTimeout(() => {
                const clickables = dashboardContent.querySelectorAll('.clickable-phone, .clickable-email');
                console.log(`Found ${clickables.length} clickable elements in Clients view`);
                
                // If none found, try again with individual cells
                if (clickables.length === 0) {
                    console.log('No clickable elements found, scanning individual cells...');
                    const cells = dashboardContent.querySelectorAll('td');
                    cells.forEach((td, index) => {
                        const text = td.textContent.trim();
                        if (text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || text.includes('@')) {
                            console.log(`Processing cell ${index}: ${text}`);
                            window.scanForClickableContent(td);
                        }
                    });
                }
            }, 200);
        }
    };
    
    // Try multiple times with increasing delays
    setTimeout(scanContent, 100);
    setTimeout(scanContent, 300);
    setTimeout(scanContent, 600);
    setTimeout(scanContent, 1000);

    // Force remove Type and Status columns if they exist
    setTimeout(() => {
        const table = document.querySelector('.clients-view .data-table');
        if (table) {
            // Check headers and remove Type/Status if found
            const headers = table.querySelectorAll('thead th');
            let typeIndex = -1;
            let statusIndex = -1;

            headers.forEach((th, index) => {
                const text = th.textContent.trim();
                if (text === 'Type') {
                    typeIndex = index;
                    th.remove();
                }
                if (text === 'Status') {
                    statusIndex = index;
                    th.remove();
                }
            });

            // Remove corresponding td elements if headers were found
            if (typeIndex >= 0 || statusIndex >= 0) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (statusIndex >= 0 && cells[statusIndex]) cells[statusIndex].remove();
                    if (typeIndex >= 0 && cells[typeIndex]) cells[typeIndex].remove();
                });
            }

            console.log('Clients table cleanup completed - Type/Status columns removed');
        }
    }, 500);
}

// Update clients pagination
function updateClientsPagination() {
    let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');

    // Get current user and check if they are admin
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Filter clients based on user role
    if (!isAdmin && currentUser) {
        clients = clients.filter(client => {
            const assignedTo = client.assignedTo || client.agent || 'Grant'; // Default to Grant if no assignment
            return assignedTo.toLowerCase() === currentUser.toLowerCase();
        });
    }

    // Remove duplicates
    const uniqueClients = [];
    const seenNames = new Set();
    clients.forEach(client => {
        const name = (client.name || '').toUpperCase().trim();
        if (name && !seenNames.has(name)) {
            seenNames.add(name);
            uniqueClients.push(client);
        } else if (!name) {
            uniqueClients.push(client);
        }
    });
    clients = uniqueClients;

    const totalPages = Math.ceil(clients.length / clientsPerPage);
    const startIndex = (currentClientPage - 1) * clientsPerPage;
    const endIndex = Math.min(startIndex + clientsPerPage, clients.length);

    // Update showing info
    const footerInfo = document.querySelector('.showing-info');
    if (footerInfo) {
        if (clients.length > 0) {
            footerInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${clients.length} clients`;
        } else {
            footerInfo.textContent = 'No clients to display';
        }
    }

    // Generate pagination buttons
    const pagination = document.getElementById('clientsPagination');
    if (pagination) {
        let paginationHTML = '';

        // Previous button
        paginationHTML += `<button class="page-btn" ${currentClientPage === 1 ? 'disabled' : ''} onclick="goToClientPage(${currentClientPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;

        // Page numbers
        if (totalPages <= 7) {
            // Show all pages if 7 or less
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `<button class="page-btn ${i === currentClientPage ? 'active' : ''}" onclick="goToClientPage(${i})">${i}</button>`;
            }
        } else {
            // Show smart pagination for many pages
            if (currentClientPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    paginationHTML += `<button class="page-btn ${i === currentClientPage ? 'active' : ''}" onclick="goToClientPage(${i})">${i}</button>`;
                }
                paginationHTML += '<span>...</span>';
                paginationHTML += `<button class="page-btn" onclick="goToClientPage(${totalPages})">${totalPages}</button>`;
            } else if (currentClientPage >= totalPages - 2) {
                paginationHTML += `<button class="page-btn" onclick="goToClientPage(1)">1</button>`;
                paginationHTML += '<span>...</span>';
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    paginationHTML += `<button class="page-btn ${i === currentClientPage ? 'active' : ''}" onclick="goToClientPage(${i})">${i}</button>`;
                }
            } else {
                paginationHTML += `<button class="page-btn" onclick="goToClientPage(1)">1</button>`;
                paginationHTML += '<span>...</span>';
                for (let i = currentClientPage - 1; i <= currentClientPage + 1; i++) {
                    paginationHTML += `<button class="page-btn ${i === currentClientPage ? 'active' : ''}" onclick="goToClientPage(${i})">${i}</button>`;
                }
                paginationHTML += '<span>...</span>';
                paginationHTML += `<button class="page-btn" onclick="goToClientPage(${totalPages})">${totalPages}</button>`;
            }
        }

        // Next button
        paginationHTML += `<button class="page-btn" ${currentClientPage === totalPages || totalPages === 0 ? 'disabled' : ''} onclick="goToClientPage(${currentClientPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;

        pagination.innerHTML = paginationHTML;
    }
}

// Navigate to a specific page in clients table
window.goToClientPage = function(page) {
    currentClientPage = page;
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) {
        tbody.innerHTML = generateClientRows(page);
    }
    updateClientsPagination();

    // Remove Type and Status columns if they appear
    setTimeout(() => {
        const table = document.querySelector('.clients-view .data-table');
        if (table) {
            const headers = table.querySelectorAll('thead th');
            let typeIndex = -1;
            let statusIndex = -1;

            headers.forEach((th, index) => {
                const text = th.textContent.trim();
                if (text === 'Type') {
                    typeIndex = index;
                    th.remove();
                }
                if (text === 'Status') {
                    statusIndex = index;
                    th.remove();
                }
            });

            if (typeIndex >= 0 || statusIndex >= 0) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (statusIndex >= 0 && cells[statusIndex]) cells[statusIndex].remove();
                    if (typeIndex >= 0 && cells[typeIndex]) cells[typeIndex].remove();
                });
            }
        }
    }, 100);
};

function loadPoliciesView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    // Load policies from localStorage first, then update from server in background
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log('📊 Loading policies from localStorage:', policies.length);

    // Update from server in background (non-blocking)
    if (window.PolicySyncManager && window.PolicySyncManager.loadPolicies) {
        console.log('🔄 Updating policies from server in background...');
        window.PolicySyncManager.loadPolicies().then(serverPolicies => {
            if (serverPolicies && serverPolicies.length > 0) {
                localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
                console.log('✅ Updated policies from server');
                // Optionally refresh the view with new data
                if (document.querySelector('.dashboard-content')?.innerHTML?.includes('Policies Management')) {
                    loadPoliciesView();
                }
            }
        }).catch(error => {
            console.log('⚠️ Server update failed, using localStorage data');
        });
    }

    // Calculate actual statistics
    const totalPolicies = policies.length;
    
    // Count active policies
    const activePolicies = policies.filter(p => {
        const status = (p.policyStatus || p.status || '').toLowerCase();
        return status === 'active' || status === 'in-force' || status === 'current';
    }).length;
    
    // Count pending renewal (policies expiring within 60 days)
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);
    
    const pendingRenewal = policies.filter(p => {
        if (!p.expirationDate) return false;
        const expDate = new Date(p.expirationDate);
        return expDate >= today && expDate <= sixtyDaysFromNow;
    }).length;
    
    // Calculate total premium
    let totalPremium = 0;
    policies.forEach(policy => {
        const premiumValue = policy.financial?.['Annual Premium'] || 
                           policy.financial?.['Premium'] || 
                           policy.premium || 
                           policy.annualPremium || 0;
        
        if (premiumValue) {
            let numValue = 0;
            if (typeof premiumValue === 'number') {
                numValue = premiumValue;
            } else if (typeof premiumValue === 'string') {
                const cleanValue = premiumValue.replace(/[$,\s]/g, '');
                numValue = parseFloat(cleanValue) || 0;
            }
            totalPremium += numValue;
        }
    });
    
    // Format total premium
    let formattedPremium = '$0';
    if (totalPremium >= 1000000) {
        formattedPremium = '$' + (totalPremium / 1000000).toFixed(1) + 'M';
    } else if (totalPremium >= 1000) {
        formattedPremium = '$' + (totalPremium / 1000).toFixed(0) + 'K';
    } else {
        formattedPremium = '$' + totalPremium.toFixed(0);
    }
    
    dashboardContent.innerHTML = `
        <div class="policies-view">
            <header class="content-header">
                <h1>Policy Management</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="exportPolicies()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn-primary" onclick="showNewPolicy()">
                        <i class="fas fa-plus"></i> New Policy
                    </button>
                </div>
            </header>
            
            <div class="policy-stats">
                <div class="mini-stat">
                    <span class="mini-stat-value">${totalPolicies}</span>
                    <span class="mini-stat-label">Total Policies</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${activePolicies}</span>
                    <span class="mini-stat-label">Active</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${pendingRenewal}</span>
                    <span class="mini-stat-label">Pending Renewal</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${formattedPremium}</span>
                    <span class="mini-stat-label">Total Premium</span>
                </div>
            </div>
            
            <div class="filters-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search by policy number, client name...">
                </div>
                <div class="filter-group">
                    <select class="filter-select">
                        <option>All Lines</option>
                        <option>Auto</option>
                        <option>Homeowners</option>
                        <option>Commercial Auto</option>
                        <option>Commercial Property</option>
                        <option>General Liability</option>
                        <option>Life</option>
                    </select>
                    <select class="filter-select">
                        <option>All Carriers</option>
                        <option>Progressive</option>
                        <option>State Farm</option>
                        <option>Allstate</option>
                        <option>Liberty Mutual</option>
                    </select>
                    <select class="filter-select">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Pending</option>
                        <option>Cancelled</option>
                        <option>Expired</option>
                    </select>
                </div>
            </div>
            
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 11%; padding-left: 20px;">Policy #</th>
                            <th style="width: 16%;">Client</th>
                            <th style="width: 13%;">Carrier</th>
                            <th style="width: 11%;">Effective Date</th>
                            <th style="width: 11%;">Expiration</th>
                            <th style="width: 9%;">Premium</th>
                            <th style="width: 12%;">Assigned to</th>
                            <th style="width: 8%;">Status</th>
                            <th style="width: 9%;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="policyTableBody">
                        ${generatePolicyRows()}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Global variable to store current renewal view
let currentRenewalView = 'month';
let selectedRenewalPolicyId = null;

function loadRenewalsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    // Get real policy data from localStorage
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    
    // Process policies for renewals
    const renewalPolicies = getRealRenewalPolicies(allPolicies, clients);
    
    // Calculate renewal statistics
    const stats = calculateRenewalStats(renewalPolicies);
    
    dashboardContent.innerHTML = `
        <div class="renewals-view">
            <header class="content-header">
                <h1>Policy Renewals</h1>
                <div class="header-actions">
                    <div class="view-toggle">
                        <button class="view-btn ${currentRenewalView === 'month' ? 'active' : ''}" onclick="switchRenewalView('month')">
                            <i class="fas fa-calendar-day"></i> Month View
                        </button>
                        <button class="view-btn ${currentRenewalView === '3month' ? 'active' : ''}" onclick="switchRenewalView('3month')">
                            <i class="fas fa-calendar-week"></i> 3-Month View
                        </button>
                        <button class="view-btn ${currentRenewalView === 'year' ? 'active' : ''}" onclick="switchRenewalView('year')">
                            <i class="fas fa-calendar"></i> Year View
                        </button>
                    </div>
                    <button class="btn-primary" onclick="exportRenewals()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </header>
            
            <div class="renewal-stats">
                <div class="stat-card">
                    <h4>Due This Month</h4>
                    <span class="stat-value">${stats.dueThisMonth.count}</span>
                    <span class="stat-label">${stats.dueThisMonth.premium} Premium</span>
                </div>
                <div class="stat-card">
                    <h4>Due Next Month</h4>
                    <span class="stat-value">${stats.dueNextMonth.count}</span>
                    <span class="stat-label">${stats.dueNextMonth.premium} Premium</span>
                </div>
                <div class="stat-card urgent">
                    <h4>Overdue</h4>
                    <span class="stat-value">${stats.overdue.count}</span>
                    <span class="stat-label">${stats.overdue.premium === '$0' ? 'No overdue policies' : stats.overdue.premium + ' Total'}</span>
                </div>
                <div class="stat-card">
                    <h4>Renewal Rate</h4>
                    <span class="stat-value">${stats.renewalRate}</span>
                    <span class="stat-label">Last 12 Months</span>
                </div>
            </div>
            
            <div class="renewal-content">
                <div id="renewalListContainer" class="renewal-list-container">
                    ${currentRenewalView === 'month' ? renderMonthView(renewalPolicies) :
                      currentRenewalView === '3month' ? renderThreeMonthView(renewalPolicies) :
                      renderYearView(renewalPolicies)}
                </div>
                
                <div id="renewalProfile" class="renewal-profile" style="display: none;">
                    <!-- Renewal profile will be inserted here when a policy is selected -->
                </div>
            </div>
        </div>
    `;
    
    // Add necessary styles
    addRenewalStyles();
}

function getRealRenewalPolicies(policies, clients) {
    const renewalPolicies = [];
    const today = new Date();
    const oneYearFromNow = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Ensure clients is an array to prevent .find() errors
    const clientsArray = Array.isArray(clients) ? clients : [];
    
    policies.forEach(policy => {
        if (!policy.expirationDate && !policy.endDate) return;
        
        const expirationDate = new Date(policy.expirationDate || policy.endDate);
        if (isNaN(expirationDate.getTime())) return;
        
        // Get client info
        const client = clientsArray.find(c => c.id === policy.clientId) || {};

        // Use same client name hierarchy as other components (Named Insured first, then fallbacks)
        const clientName = policy.insured?.['Name/Business Name'] ||
                          policy.insured?.['Primary Named Insured'] ||
                          policy.namedInsured?.name ||
                          (policy.clientName && policy.clientName !== 'N/A' && policy.clientName !== 'Unknown' ? policy.clientName : null) ||
                          client.name ||
                          client.companyName ||
                          client.businessName ||
                          'Unknown Client';
        
        // Get premium value
        let premiumValue = 0;
        const premium = policy.financial?.['Annual Premium'] || 
                       policy.financial?.['Premium'] || 
                       policy.premium || 
                       policy.annualPremium || 0;
        
        if (premium) {
            if (typeof premium === 'number') {
                premiumValue = premium;
            } else if (typeof premium === 'string') {
                const cleanValue = premium.replace(/[$,\s]/g, '');
                premiumValue = parseFloat(cleanValue) || 0;
            }
        }
        
        renewalPolicies.push({
            id: policy.id || `POL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            client: clientName,
            carrier: policy.carrier || policy.insuranceCarrier || 'Unknown Carrier',
            type: policy.policyType || policy.type || 'Commercial Auto',
            policyNumber: policy.policyNumber || policy.number || 'N/A',
            premium: premiumValue,
            expirationDate: expirationDate,
            effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate) : 
                          new Date(expirationDate.getFullYear() - 1, expirationDate.getMonth(), expirationDate.getDate()),
            status: getStatusFromDate(expirationDate),
            agent: policy.agent || 'Unassigned',
            phone: client.phone || policy.clientPhone || '',
            email: client.email || policy.clientEmail || ''
        });
    });
    
    // Sort by expiration date
    renewalPolicies.sort((a, b) => a.expirationDate - b.expirationDate);
    return renewalPolicies;
}

function calculateRenewalStats(policies) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    let dueThisMonth = { count: 0, total: 0 };
    let dueNextMonth = { count: 0, total: 0 };
    let overdue = { count: 0, total: 0 };
    let renewed = 0;
    let expired = 0;
    
    policies.forEach(policy => {
        const expDate = policy.expirationDate;
        
        if (expDate < today) {
            overdue.count++;
            overdue.total += policy.premium;
        } else if (expDate >= startOfMonth && expDate <= endOfMonth) {
            dueThisMonth.count++;
            dueThisMonth.total += policy.premium;
        } else if (expDate >= startOfNextMonth && expDate <= endOfNextMonth) {
            dueNextMonth.count++;
            dueNextMonth.total += policy.premium;
        }
        
        // Count renewals in last 12 months
        if (expDate >= oneYearAgo && expDate <= today) {
            if (policy.status === 'renewed') {
                renewed++;
            } else {
                expired++;
            }
        }
    });
    
    // Calculate renewal rate
    const totalPastDue = renewed + expired;
    const renewalRate = totalPastDue > 0 ? Math.round((renewed / totalPastDue) * 100) : 0;
    
    // Format premium amounts
    const formatPremium = (amount) => {
        if (amount >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return '$' + Math.round(amount / 1000) + 'K';
        } else {
            return '$' + Math.round(amount);
        }
    };
    
    return {
        dueThisMonth: {
            count: dueThisMonth.count,
            premium: formatPremium(dueThisMonth.total)
        },
        dueNextMonth: {
            count: dueNextMonth.count,
            premium: formatPremium(dueNextMonth.total)
        },
        overdue: {
            count: overdue.count,
            premium: formatPremium(overdue.total)
        },
        renewalRate: renewalRate + '%'
    };
}

function getStatusFromDate(date) {
    const today = new Date();
    const daysUntil = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 30) return 'urgent';
    if (daysUntil <= 60) return 'upcoming';
    if (daysUntil <= 90) return 'pending';
    return 'future';
}

function renderMonthView(policies) {
    const today = new Date();
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    // Show only policies expiring within 60 days (exclude overdue policies as requested)
    // Filter to show only policies expiring within 30 days from today
    const monthPolicies = policies.filter(p => {
        const expDate = new Date(p.expirationDate);
        if (isNaN(expDate.getTime())) return false;

        const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

        // Show policies expiring in next 30 days (include today, exclude overdue)
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    });

    return `
        <div class="month-view">
            <h3>Renewals Due Within 30 Days</h3>
            <div class="renewal-list">
                ${monthPolicies.map(policy => `
                    <div class="renewal-card ${policy.status || ''} ${selectedRenewalPolicyId === policy.id ? 'selected' : ''}"
                         onclick="showRenewalProfile('${policy.id}')"
                         id="renewal-card-${policy.id}">
                        <div class="renewal-header">
                            <div class="renewal-info">
                                <h4>${policy.client || 'Unknown Client'}</h4>
                                <p>${policy.type || 'Commercial Auto'} - ${policy.carrier || 'Unknown Carrier'}</p>
                                <p class="policy-number">Policy #${policy.policyNumber || 'N/A'}</p>
                            </div>
                            <div class="renewal-date">
                                <span class="date-label">Expires</span>
                                <span class="date-value">${formatDate(policy.expirationDate)}</span>
                                <span class="days-remaining">${getDaysRemaining(policy.expirationDate)}</span>
                            </div>
                        </div>
                        <div class="renewal-footer">
                            <span class="premium">$${(policy.premium || 0).toLocaleString()}/yr</span>
                            <span class="status-badge ${policy.status || ''}">${(policy.status || 'pending').replace('-', ' ')}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderThreeMonthView(policies) {
    const today = new Date();
    // Show policies expiring within 90 days (3 months)
    const threeMonthPolicies = policies.filter(p => {
        const expDate = new Date(p.expirationDate);
        if (isNaN(expDate.getTime())) return false;

        const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

        // Show policies expiring in next 90 days (include today, exclude overdue)
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
    });

    return `
        <div class="three-month-view">
            <h3>Renewals Due Within 3 Months</h3>
            <div class="renewal-list">
                ${threeMonthPolicies.map(policy => `
                    <div class="renewal-card ${policy.status || ''} ${selectedRenewalPolicyId === policy.id ? 'selected' : ''}"
                         onclick="showRenewalProfile('${policy.id}')"
                         id="renewal-card-${policy.id}">
                        <div class="renewal-header">
                            <div class="renewal-info">
                                <h4>${policy.client || 'Unknown Client'}</h4>
                                <p>${policy.type || 'Commercial Auto'} - ${policy.carrier || 'Unknown Carrier'}</p>
                                <p class="policy-number">Policy #${policy.policyNumber || 'N/A'}</p>
                            </div>
                            <div class="renewal-date">
                                <span class="date-label">Expires</span>
                                <span class="date-value">${formatDate(policy.expirationDate)}</span>
                                <span class="days-remaining">${getDaysRemaining(policy.expirationDate)}</span>
                            </div>
                        </div>
                        <div class="renewal-footer">
                            <span class="premium">$${(policy.premium || 0).toLocaleString()}/yr</span>
                            <span class="status-badge ${policy.status || ''}">${(policy.status || 'pending').replace('-', ' ')}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderYearView(policies) {
    const months = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Group policies by month
    policies.forEach(policy => {
        const monthKey = `${policy.expirationDate.getFullYear()}-${policy.expirationDate.getMonth()}`;
        if (!months[monthKey]) {
            months[monthKey] = {
                name: `${monthNames[policy.expirationDate.getMonth()]} ${policy.expirationDate.getFullYear()}`,
                policies: [],
                totalPremium: 0
            };
        }
        months[monthKey].policies.push(policy);
        months[monthKey].totalPremium += policy.premium;
    });
    
    return `
        <div class="year-view">
            <h3>Annual Renewal Calendar</h3>
            <div class="month-grid">
                ${Object.keys(months).slice(0, 12).map(key => `
                    <div class="month-card">
                        <h4>${months[key].name}</h4>
                        <div class="month-stats">
                            <span class="policy-count">${months[key].policies.length} Policies</span>
                            <span class="month-premium">$${months[key].totalPremium.toLocaleString()}</span>
                        </div>
                        <div class="month-policies">
                            ${months[key].policies.slice(0, 3).map(p => `
                                <div class="mini-policy ${selectedRenewalPolicyId === p.id ? 'selected' : ''}" 
                                     onclick="showRenewalProfile('${p.id}')"
                                     id="renewal-card-${p.id}">
                                    <span>${p.client}</span>
                                    <span class="mini-date">${p.expirationDate.getDate()}</span>
                                </div>
                            `).join('')}
                            ${months[key].policies.length > 3 ? `
                                <div class="more-policies">+${months[key].policies.length - 3} more</div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function showRenewalProfile(policyId) {
    const renewalProfile = document.getElementById('renewalProfile');
    const listContainer = document.getElementById('renewalListContainer');
    
    if (!renewalProfile) {
        console.error('Renewal profile element not found');
        return;
    }
    
    // Set the selected policy ID
    selectedRenewalPolicyId = policyId;
    
    // Remove selected class from all cards
    document.querySelectorAll('.renewal-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to the clicked card
    const selectedCard = document.getElementById(`renewal-card-${policyId}`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Get real policy data from localStorage
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const renewalPolicies = getRealRenewalPolicies(allPolicies, clients);
    
    // Find the selected policy
    let policy = renewalPolicies.find(p => p.id === policyId);
    
    // If not found in processed renewals, create a basic policy object
    if (!policy) {
        const rawPolicy = allPolicies.find(p => p.id === policyId);
        if (rawPolicy) {
            const client = clients.find(c => c.id === rawPolicy.clientId) || {};
            policy = {
                id: policyId,
                client: client.name || rawPolicy.clientName || 'Unknown Client',
                carrier: rawPolicy.carrier || rawPolicy.insuranceCarrier || 'Unknown Carrier',
                type: rawPolicy.policyType || rawPolicy.type || 'Commercial Auto',
                policyNumber: rawPolicy.policyNumber || rawPolicy.number || 'N/A',
                premium: rawPolicy.premium || 0,
                expirationDate: new Date(rawPolicy.expirationDate || rawPolicy.endDate),
                effectiveDate: new Date(rawPolicy.effectiveDate || rawPolicy.startDate),
                agent: rawPolicy.agent || 'Unassigned',
                phone: client.phone || '',
                email: client.email || ''
            };
        } else {
            console.error('Policy not found:', policyId);
            return;
        }
    }
    
    // Show profile and adjust layout
    listContainer.style.width = '40%';
    renewalProfile.style.display = 'block';
    renewalProfile.innerHTML = `
        <div class="profile-header">
            <h2>Renewal Profile</h2>
            <button class="close-btn" onclick="closeRenewalProfile()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="profile-layout">
            <div class="policy-info-panel">
                <h3>Policy Information</h3>
                <div class="info-group">
                    <label>Client:</label>
                    <span>${policy.client}</span>
                </div>
                <div class="info-group">
                    <label>Policy #:</label>
                    <span>${policy.policyNumber}</span>
                </div>
                <div class="info-group">
                    <label>Type:</label>
                    <span>${policy.type}</span>
                </div>
                <div class="info-group">
                    <label>Carrier:</label>
                    <span>${policy.carrier}</span>
                </div>
                <div class="info-group">
                    <label>Premium:</label>
                    <span>$${policy.premium.toLocaleString()}/yr</span>
                </div>
                <div class="info-group">
                    <label>Effective:</label>
                    <span>${formatDate(policy.effectiveDate)}</span>
                </div>
                <div class="info-group">
                    <label>Expiration:</label>
                    <span>${formatDate(policy.expirationDate)}</span>
                </div>
                <div class="info-group">
                    <label>Agent:</label>
                    <span>${policy.agent}</span>
                </div>
                <div class="info-group">
                    <label>Contact:</label>
                    <span>${policy.phone}</span>
                    <span>${policy.email}</span>
                </div>
            </div>
            
            <div class="profile-main-content">
                <div class="profile-tabs">
                    <button class="profile-tab active" onclick="switchProfileTab('tasks')">
                        <i class="fas fa-tasks"></i> Tasks
                    </button>
                    <button class="profile-tab" onclick="switchProfileTab('submissions')">
                        <i class="fas fa-file-alt"></i> Submissions
                    </button>
                </div>
                <div id="profileTabContent" class="tab-content">
                    ${renderTasksTab()}
                </div>
            </div>
        </div>
    `;
}

function getCurrentPolicyId() {
    // Get the currently selected renewal policy ID
    return selectedRenewalPolicyId;
}

function renderTasksTab() {
    console.log('Rendering tasks tab');

    // Get current policy ID for policy-specific tasks
    const currentPolicyId = getCurrentPolicyId();

    if (!currentPolicyId) {
        console.error('No policy ID found for renewal tasks');
        return '<p>Error: No policy selected</p>';
    }

    // Get saved tasks for THIS specific policy or use defaults
    const savedTasks = JSON.parse(localStorage.getItem(`renewalTasks_${currentPolicyId}`) || 'null');
    const defaultTasks = [
        { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
        { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
        { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
        { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
        { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
        { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
        { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
        { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
        { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
        { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
    ];
    
    let tasks = savedTasks || defaultTasks;

    // Check if current policy has completed renewal from server or localStorage
    let isRenewalCompleted = false;

    // Check server completions if available
    const selectedRenewal = window.renewalsManager?.selectedRenewal;
    if (selectedRenewal) {
        const policyKey = `${selectedRenewal.policyNumber}_${selectedRenewal.expirationDate}`;
        // Check if loaded in finalizedRenewals from server
        if (window.finalizedRenewals && window.finalizedRenewals[policyKey]) {
            isRenewalCompleted = true;
        }
    }

    // Fall back to localStorage
    if (!isRenewalCompleted) {
        isRenewalCompleted = localStorage.getItem(`renewal_completed_${currentPolicyId}`) === 'true';
    }

    // Update task 10 (Finalize Renewal) based on completion status
    const finalizeTaskIndex = tasks.findIndex(t => t.id === 10);
    if (finalizeTaskIndex !== -1 && isRenewalCompleted) {
        tasks[finalizeTaskIndex].completed = true;
        if (!tasks[finalizeTaskIndex].completedAt) {
            tasks[finalizeTaskIndex].completedAt = 'Previously completed';
        }
    }

    const htmlContent = `
        <div class="tasks-tab">
            <div class="tasks-header">
                <h3>Renewal Tasks Checklist</h3>
                <div class="tasks-actions">
                    <button class="btn-small" onclick="clearAllTasks()">
                        <i class="fas fa-redo"></i> Reset Tasks
                    </button>
                    <button class="btn-small" onclick="addRenewalTask()">
                        <i class="fas fa-plus"></i> Add Task
                    </button>
                </div>
            </div>
            <div class="tasks-list">
                ${tasks.map((task, index) => `
                    <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id || index}">
                        <div class="task-checkbox">
                            <input type="checkbox"
                                   id="task-${task.id || index}"
                                   ${task.completed ? 'checked' : ''}
                                   onchange="toggleTask(${task.id || index}, '${currentPolicyId}')">
                            <label for="task-${task.id || index}">
                                <span class="checkbox-custom"></span>
                                ${task.task}
                            </label>
                        </div>
                        <div class="task-status">
                            ${task.completed && task.completedAt ? 
                                `<span class="completion-time"><i class="fas fa-check"></i> ${task.completedAt}</span>` : 
                                '<span class="status-pending">Pending</span>'}
                        </div>
                        <div class="task-notes">
                            <textarea class="notes-input"
                                      placeholder="Add notes..."
                                      onblur="saveTaskNote(${task.id || index}, this.value, '${currentPolicyId}')">${task.notes || ''}</textarea>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    console.log('Tasks HTML length:', htmlContent.length);
    return htmlContent;
}

function renderSubmissionsTab() {
    // Get saved submissions from localStorage
    const savedSubmissions = JSON.parse(localStorage.getItem('renewalSubmissions') || '[]');
    
    return `
        <div class="submissions-tab">
            <div id="submissionsList">
                <div class="submissions-header">
                    <h3>Quote Submissions</h3>
                    <button class="btn-primary" onclick="showAddSubmissionForm()">
                        <i class="fas fa-plus"></i> Add New Quote
                    </button>
                </div>
                
                ${savedSubmissions.length > 0 ? `
                    <div class="submissions-list">
                        ${savedSubmissions.map((submission, index) => `
                            <div class="submission-item">
                                <div class="submission-info">
                                    <h4>${submission.carrier} - ${submission.type}</h4>
                                    <div class="submission-details-row">
                                        <span><strong>Quote #:</strong> ${submission.quoteNumber}</span>
                                        <span><strong>Premium:</strong> $${submission.premium}/yr</span>
                                        <span><strong>Deductible:</strong> $${submission.deductible}</span>
                                        <span><strong>Coverage:</strong> ${submission.coverage}</span>
                                    </div>
                                    <div class="submission-meta">
                                        <span><i class="fas fa-calendar"></i> Submitted: ${new Date().toLocaleDateString()}</span>
                                        <span class="quote-status received">Quote Received</span>
                                    </div>
                                </div>
                                <div class="submission-actions">
                                    <button class="btn-icon" title="View Quote"><i class="fas fa-eye"></i></button>
                                    <button class="btn-icon" title="Download"><i class="fas fa-download"></i></button>
                                    <button class="btn-icon" onclick="removeSubmission(${index})" title="Delete"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-submissions">
                        <i class="fas fa-file-invoice" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                        <p style="color: #666;">No quote submissions yet</p>
                        <p style="color: #999; font-size: 14px;">Click "Add New Quote" to create your first submission</p>
                    </div>
                `}
                
                <div class="comparison-section">
                    <h4>Quote Comparison</h4>
                    ${savedSubmissions.length > 0 ? `
                        <table class="comparison-table">
                            <thead>
                                <tr>
                                    <th>Carrier</th>
                                    <th>Policy Type</th>
                                    <th>Premium</th>
                                    <th>Deductible</th>
                                    <th>Coverage</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${savedSubmissions.map((submission, index) => `
                                    <tr>
                                        <td><strong>${submission.carrier}</strong></td>
                                        <td>${submission.type}</td>
                                        <td class="premium-cell">$${submission.premium}</td>
                                        <td>$${submission.deductible}</td>
                                        <td>${submission.coverage}</td>
                                        <td><button class="btn-small ${index === 0 ? 'btn-success' : ''}" onclick="selectQuote(${index})">Select</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <p style="text-align: center; color: #666; padding: 20px;">Add multiple quotes to compare them side by side</p>
                    `}
                </div>
            </div>
            
            <div id="submissionForm" class="submission-form" style="display: none;">
                <div class="form-card">
                    <div class="form-header">
                        <button class="back-btn" onclick="hideAddSubmissionForm()" title="Back to Submissions">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h4>Add New Quote Submission</h4>
                    </div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Insurance Company</label>
                            <select class="form-control" id="submissionCarrier">
                                <option value="">Select Carrier</option>
                                <option value="Progressive">Progressive</option>
                                <option value="State Farm">State Farm</option>
                                <option value="Hartford">Hartford</option>
                                <option value="Travelers">Travelers</option>
                                <option value="Liberty Mutual">Liberty Mutual</option>
                                <option value="Nationwide">Nationwide</option>
                                <option value="Allstate">Allstate</option>
                                <option value="GEICO">GEICO</option>
                                <option value="Farmers">Farmers</option>
                                <option value="USAA">USAA</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Policy Type</label>
                            <select class="form-control" id="submissionType">
                                <option value="">Select Type</option>
                                <option value="Commercial Auto">Commercial Auto</option>
                                <option value="General Liability">General Liability</option>
                                <option value="Workers Comp">Workers Compensation</option>
                                <option value="Property">Commercial Property</option>
                                <option value="Umbrella">Commercial Umbrella</option>
                                <option value="Professional">Professional Liability</option>
                                <option value="Cyber">Cyber Liability</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Annual Premium <span style="color: red;">*</span></label>
                            <input type="text" class="form-control" id="submissionPremium" placeholder="$0.00" required>
                        </div>
                        <div class="form-group">
                            <label>Deductible</label>
                            <input type="text" class="form-control" id="submissionDeductible" placeholder="$0.00">
                        </div>
                        <div class="form-group">
                            <label>Coverage Limit</label>
                            <input type="text" class="form-control" id="submissionLimit" placeholder="e.g., $1M/$2M">
                        </div>
                        <div class="form-group">
                            <label>Quote Number</label>
                            <input type="text" class="form-control" id="submissionQuoteNum" placeholder="Quote #">
                        </div>
                    </div>
                    
                    <div class="upload-section">
                        <label>Upload Quote Document</label>
                        <div class="upload-area" onclick="document.getElementById('quoteFile').click()">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Click to upload or drag and drop</p>
                            <span>PDF, DOC, DOCX (Max 10MB)</span>
                            <input type="file" id="quoteFile" style="display: none;" accept=".pdf,.doc,.docx" onchange="handleQuoteUpload(this)">
                        </div>
                        <div id="uploadedFile" class="uploaded-file" style="display: none;">
                            <i class="fas fa-file-pdf"></i>
                            <span id="fileName"></span>
                            <button onclick="removeUploadedFile()" class="remove-file">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn-secondary" onclick="hideAddSubmissionForm()">Cancel</button>
                        <button class="btn-primary" onclick="saveSubmission()">Save Quote</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function switchRenewalView(view) {
    currentRenewalView = view;
    loadRenewalsView();
}

function switchProfileTab(tab) {
    const tabContent = document.getElementById('profileTabContent');
    if (!tabContent) return;
    
    // Update active tab
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(tab)) {
            btn.classList.add('active');
        }
    });
    
    // Update content
    if (tab === 'tasks') {
        tabContent.innerHTML = renderTasksTab();
    } else if (tab === 'submissions') {
        tabContent.innerHTML = renderSubmissionsTab();
    }
}

function closeRenewalProfile() {
    const renewalProfile = document.getElementById('renewalProfile');
    const listContainer = document.getElementById('renewalListContainer');
    
    if (renewalProfile) {
        renewalProfile.style.display = 'none';
        listContainer.style.width = '100%';
        
        // Clear selection
        selectedRenewalPolicyId = null;
        document.querySelectorAll('.renewal-card.selected, .mini-policy.selected').forEach(card => {
            card.classList.remove('selected');
        });
    }
}

function getDaysRemaining(date) {
    const today = new Date();
    const days = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
}

function toggleTask(taskId, policyId) {
    if (!policyId) {
        console.error('No policy ID provided for task toggle');
        return;
    }

    const storageKey = `renewalTasks_${policyId}`;
    const tasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        // If no saved tasks yet for this policy, get defaults and update
        const defaultTasks = [
            { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
            { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
            { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
            { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
            { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
            { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
            { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
            { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
            { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
            { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
        ];

        const task = defaultTasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toLocaleString() : '';
            localStorage.setItem(storageKey, JSON.stringify(defaultTasks));
        }
    } else {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].completedAt = tasks[taskIndex].completed ? new Date().toLocaleString() : '';
        localStorage.setItem(storageKey, JSON.stringify(tasks));
    }

    // Check if "Finalize Renewal" task (ID 10) was completed
    if (taskId === 10) {
        const currentTasks = JSON.parse(localStorage.getItem(`renewalTasks_${policyId}`) || '[]');
        const finalizeTask = currentTasks.find(t => t.id === 10);

        if (finalizeTask && finalizeTask.completed) {
            // Add green highlighting to the current policy
            highlightPolicyAsCompleted();
            showNotification('🎉 Renewal finalized! Policy highlighted in green.', 'success');
        } else {
            // Remove green highlighting if unchecked
            removePolicyHighlight();
        }
    }

    // Refresh the tasks tab
    const tabContent = document.getElementById('profileTabContent');
    if (tabContent) {
        tabContent.innerHTML = renderTasksTab();
    }
}

// Function to highlight policy as completed (green)
function highlightPolicyAsCompleted() {
    // Get current policy ID from renewal context
    const currentPolicyId = getCurrentPolicyId();
    if (!currentPolicyId) {
        console.error('No policy selected for highlighting');
        return;
    }

    // Find and highlight the renewal card
    const renewalCard = document.getElementById(`renewal-card-${currentPolicyId}`);
    if (renewalCard) {
        renewalCard.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
        renewalCard.style.borderLeft = '4px solid #10b981';
        renewalCard.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.1)';

        // Add completion badge if not already present
        if (!renewalCard.querySelector('.renewal-completed-badge')) {
            const cardHeader = renewalCard.querySelector('.card-header');
            if (cardHeader) {
                const badge = document.createElement('span');
                badge.className = 'renewal-completed-badge';
                badge.innerHTML = '<i class="fas fa-check-circle"></i> Complete';
                badge.style.cssText = `
                    background: #10b981;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                    margin-left: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                `;
                cardHeader.appendChild(badge);
            }
        }
    }

    // Also check for mini policy cards in year view
    const miniPolicyCards = document.querySelectorAll('.mini-policy');
    miniPolicyCards.forEach(card => {
        if (card.onclick && card.onclick.toString().includes(currentPolicyId)) {
            card.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
            card.style.borderColor = '#10b981';
        }
    });

    // Store completion status to server
    const selectedRenewal = window.renewalsManager?.selectedRenewal;
    if (selectedRenewal) {
        const policyKey = `${selectedRenewal.policyNumber}_${selectedRenewal.expirationDate}`;

        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api/renewal-completions'
            : `http://${window.location.hostname}:3001/api/renewal-completions`;
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyKey,
                policyNumber: selectedRenewal.policyNumber,
                expirationDate: selectedRenewal.expirationDate,
                completed: true
            })
        }).then(response => {
            if (response.ok) {
                console.log('✅ Saved renewal completion to server');
            }
        }).catch(error => {
            console.error('Error saving completion:', error);
            // Fall back to localStorage
            localStorage.setItem(`renewal_completed_${currentPolicyId}`, 'true');
        });
    } else {
        // Fall back to localStorage
        localStorage.setItem(`renewal_completed_${currentPolicyId}`, 'true');
    }
}

// Function to remove policy highlight
function removePolicyHighlight() {
    const currentPolicyId = getCurrentPolicyId();
    if (!currentPolicyId) {
        console.error('No policy selected for removing highlight');
        return;
    }

    // Remove highlight from renewal card
    const renewalCard = document.getElementById(`renewal-card-${currentPolicyId}`);
    if (renewalCard) {
        renewalCard.style.background = '';
        renewalCard.style.borderLeft = '';
        renewalCard.style.boxShadow = '';

        // Remove completion badge
        const badge = renewalCard.querySelector('.renewal-completed-badge');
        if (badge) {
            badge.remove();
        }
    }

    // Also remove from mini policy cards in year view
    const miniPolicyCards = document.querySelectorAll('.mini-policy');
    miniPolicyCards.forEach(card => {
        if (card.onclick && card.onclick.toString().includes(currentPolicyId)) {
            card.style.background = '';
            card.style.borderColor = '';
        }
    });

    // Remove completion status from server
    const selectedRenewal = window.renewalsManager?.selectedRenewal;
    if (selectedRenewal) {
        const policyKey = `${selectedRenewal.policyNumber}_${selectedRenewal.expirationDate}`;

        const apiUrl = window.location.hostname === 'localhost'
            ? `http://localhost:3001/api/renewal-completions/${policyKey}`
            : `http://${window.location.hostname}:3001/api/renewal-completions/${policyKey}`;
        fetch(apiUrl, {
            method: 'DELETE'
        }).then(response => {
            if (response.ok) {
                console.log('✅ Removed renewal completion from server');
            }
        }).catch(error => {
            console.error('Error removing completion:', error);
        });
    }
    // Also remove from localStorage
    localStorage.removeItem(`renewal_completed_${currentPolicyId}`);
}

// Function to restore renewal completion highlighting on page load
async function restoreRenewalHighlighting() {
    // Load completions from server
    let completions = {};
    try {
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api/renewal-completions'
            : `http://${window.location.hostname}:3001/api/renewal-completions`;
        const response = await fetch(apiUrl);
        if (response.ok) {
            completions = await response.json();
            console.log('✅ Loaded renewal completions from server');
        }
    } catch (error) {
        console.error('Error loading completions:', error);
    }

    // Check all renewal cards (month view)
    const renewalCards = document.querySelectorAll('.renewal-card');
    renewalCards.forEach(card => {
        const policyId = card.id.replace('renewal-card-', '');
        // Check server completions first, then localStorage as fallback
        let isCompleted = false;

        // Try to find in server completions
        for (const key in completions) {
            if (key.includes(policyId)) {
                isCompleted = true;
                break;
            }
        }

        // Fall back to localStorage if not found
        if (!isCompleted) {
            isCompleted = localStorage.getItem(`renewal_completed_${policyId}`) === 'true';
        }

        if (isCompleted) {
            // Apply green highlighting
            card.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
            card.style.borderLeft = '4px solid #10b981';
            card.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.1)';

            // Add completion badge if not already present
            if (!card.querySelector('.renewal-completed-badge')) {
                const cardHeader = card.querySelector('.card-header');
                if (cardHeader) {
                    const badge = document.createElement('span');
                    badge.className = 'renewal-completed-badge';
                    badge.innerHTML = '<i class="fas fa-check-circle"></i> Complete';
                    badge.style.cssText = `
                        background: #10b981;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 500;
                        margin-left: 8px;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    `;
                    cardHeader.appendChild(badge);
                }
            }
        }
    });

    // Also check mini policy cards in year view
    const miniPolicyCards = document.querySelectorAll('.mini-policy');
    miniPolicyCards.forEach(card => {
        const onclickStr = card.getAttribute('onclick');
        if (onclickStr) {
            const match = onclickStr.match(/showRenewalProfile\('([^']+)'\)/);
            if (match) {
                const policyId = match[1];
                const isCompleted = localStorage.getItem(`renewal_completed_${policyId}`);
                if (isCompleted === 'true') {
                    card.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
                    card.style.borderColor = '#10b981';
                }
            }
        }
    });
}

function saveTaskNote(taskId, note, policyId) {
    let tasks = JSON.parse(localStorage.getItem(`renewalTasks_${policyId}`) || '[]');
    
    if (tasks.length === 0) {
        // Initialize with defaults if no saved tasks
        tasks = [
            { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
            { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
            { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
            { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
            { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
            { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
            { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
            { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
            { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
            { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
        ];
    }
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].notes = note;
        localStorage.setItem(`renewalTasks_${policyId}`, JSON.stringify(tasks));
    }
}

function clearAllTasks() {
    if (confirm('Are you sure you want to reset all tasks? This will clear all checkmarks and timestamps.')) {
        const currentPolicyId = getCurrentPolicyId();
        localStorage.removeItem(`renewalTasks_${currentPolicyId}`);
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderTasksTab();
        }
    }
}

function addRenewalTask() {
    const taskName = prompt('Enter the new task name:');
    if (taskName && taskName.trim()) {
        const currentPolicyId = getCurrentPolicyId();
        let tasks = JSON.parse(localStorage.getItem(`renewalTasks_${currentPolicyId}`) || '[]');
        
        if (tasks.length === 0) {
            // Initialize with defaults if empty
            tasks = [
                { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
                { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
                { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
                { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
                { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
                { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
                { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
                { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
                { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
                { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
            ];
        }
        
        const newId = Math.max(...tasks.map(t => t.id || 0)) + 1;
        tasks.push({
            id: newId,
            task: taskName.trim(),
            completed: false,
            completedAt: '',
            notes: ''
        });
        
        localStorage.setItem(`renewalTasks_${currentPolicyId}`, JSON.stringify(tasks));
        
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderTasksTab();
        }
    }
}

function showAddSubmissionForm() {
    const form = document.getElementById('submissionForm');
    const list = document.getElementById('submissionsList');
    if (form && list) {
        form.style.display = 'block';
        list.style.display = 'none';
    }
}

function hideAddSubmissionForm() {
    const form = document.getElementById('submissionForm');
    const list = document.getElementById('submissionsList');
    if (form && list) {
        form.style.display = 'none';
        list.style.display = 'block';
    }
    // Clear form fields safely
    const fields = ['submissionCarrier', 'submissionType', 'submissionPremium', 
                   'submissionDeductible', 'submissionLimit', 'submissionQuoteNum'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
    
    // Also clear file upload
    removeUploadedFile();
}

function handleQuoteUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileName = document.getElementById('fileName');
        const uploadedFile = document.getElementById('uploadedFile');
        
        if (fileName && uploadedFile) {
            fileName.textContent = file.name;
            uploadedFile.style.display = 'flex';
        }
    }
}

function removeUploadedFile() {
    const uploadedFile = document.getElementById('uploadedFile');
    const quoteFile = document.getElementById('quoteFile');
    
    if (uploadedFile) uploadedFile.style.display = 'none';
    if (quoteFile) quoteFile.value = '';
}

function saveSubmission() {
    // Get form values with better error handling
    const carrierEl = document.getElementById('submissionCarrier');
    const typeEl = document.getElementById('submissionType');
    const premiumEl = document.getElementById('submissionPremium');
    const deductibleEl = document.getElementById('submissionDeductible');
    const coverageEl = document.getElementById('submissionLimit');
    const quoteNumberEl = document.getElementById('submissionQuoteNum');
    
    // Debug logging
    console.log('Form elements found:', {
        carrier: carrierEl ? 'Yes' : 'No',
        type: typeEl ? 'Yes' : 'No',
        premium: premiumEl ? 'Yes' : 'No'
    });
    
    const carrier = carrierEl?.value || '';
    const type = typeEl?.value || '';
    const premiumRaw = premiumEl?.value || '';
    const premium = premiumRaw.replace(/[^0-9.]/g, '');
    
    console.log('Form values:', { carrier, type, premium, premiumRaw });
    
    if (!carrier || carrier === '' || !type || type === '' || !premium || premium === '') {
        alert(`Please fill in all required fields:\n- Insurance Company: ${carrier || 'Missing'}\n- Policy Type: ${type || 'Missing'}\n- Premium: ${premiumRaw || 'Missing'}`);
        return;
    }
    
    const deductible = deductibleEl?.value.replace(/[^0-9.]/g, '');
    const coverage = coverageEl?.value;
    const quoteNumber = quoteNumberEl?.value;
    
    // Create submission object
    const newSubmission = {
        carrier,
        type,
        premium,
        deductible: deductible || '0',
        coverage: coverage || 'N/A',
        quoteNumber: quoteNumber || `${carrier.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString()
    };
    
    // Get existing submissions
    const submissions = JSON.parse(localStorage.getItem('renewalSubmissions') || '[]');
    submissions.push(newSubmission);
    
    // Save to localStorage
    localStorage.setItem('renewalSubmissions', JSON.stringify(submissions));
    
    // Hide form and refresh view
    hideAddSubmissionForm();
    
    // Refresh the submissions tab
    const tabContent = document.getElementById('profileTabContent');
    if (tabContent) {
        tabContent.innerHTML = renderSubmissionsTab();
    }
}

function removeSubmission(index) {
    if (confirm('Are you sure you want to delete this submission?')) {
        const submissions = JSON.parse(localStorage.getItem('renewalSubmissions') || '[]');
        submissions.splice(index, 1);
        localStorage.setItem('renewalSubmissions', JSON.stringify(submissions));
        
        // Refresh the submissions tab
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderSubmissionsTab();
        }
    }
}

function selectQuote(index) {
    const submissions = JSON.parse(localStorage.getItem('renewalSubmissions') || '[]');
    if (submissions[index]) {
        alert(`Selected ${submissions[index].carrier} quote with premium $${submissions[index].premium}/yr`);
    }
}

function exportRenewals() {
    // Implementation for exporting renewals
    alert('Export functionality would generate a report here');
}

function addRenewalStyles() {
    // Check if styles already exist
    if (document.getElementById('renewal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'renewal-styles';
    style.textContent = `
        .renewals-view {
            padding: 20px;
        }
        
        .view-toggle {
            display: flex;
            gap: 10px;
            margin-right: 15px;
        }
        
        .view-btn {
            padding: 8px 16px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .view-btn.active {
            background: #0066cc;
            color: white;
            border-color: #0066cc;
        }
        
        .renewal-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-card.urgent {
            background: #fff5f5;
            border-left: 4px solid #ff4444;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            display: block;
            margin: 10px 0;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        
        .renewal-content {
            display: flex;
            gap: 20px;
            margin-top: 20px;
            overflow: visible;
        }
        
        .renewal-list-container {
            flex: 1;
            transition: width 0.3s;
        }
        
        .renewal-profile {
            width: 60%;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            height: 600px;
            overflow: visible;
        }
        
        .renewal-card {
            background: white;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s;
            border-left: 4px solid transparent;
        }
        
        .renewal-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .renewal-card.selected {
            background: #e8f2ff;
            border: 2px solid #0066cc;
            box-shadow: 0 4px 12px rgba(0,102,204,0.2);
        }
        
        .renewal-card.overdue {
            border-left-color: #ff4444;
        }
        
        .renewal-card.urgent {
            border-left-color: #ff9800;
        }
        
        .renewal-card.upcoming {
            border-left-color: #2196f3;
        }
        
        .renewal-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .renewal-date {
            text-align: right;
        }
        
        .date-label {
            display: block;
            font-size: 12px;
            color: #666;
        }
        
        .date-value {
            display: block;
            font-size: 18px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .days-remaining {
            font-size: 12px;
            color: #ff9800;
        }
        
        .renewal-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .premium {
            font-size: 16px;
            font-weight: 600;
            color: #0066cc;
        }
        
        .month-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        
        .month-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .month-stats {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 14px;
        }
        
        .policy-count {
            color: #666;
        }
        
        .month-premium {
            color: #0066cc;
            font-weight: 600;
        }
        
        .mini-policy {
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
            margin-bottom: 5px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            font-size: 13px;
        }
        
        .mini-policy:hover {
            background: #e8e8e8;
        }
        
        .mini-policy.selected {
            background: #0066cc;
            color: white;
        }
        
        .mini-policy.selected .mini-date {
            background: white;
            color: #0066cc;
        }
        
        .mini-date {
            background: #0066cc;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
        }
        
        .more-policies {
            text-align: center;
            padding: 5px;
            color: #666;
            font-size: 12px;
        }
        
        .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
        }
        
        .profile-tabs {
            display: flex;
            gap: 10px;
            padding: 0 20px;
            border-bottom: 1px solid #eee;
            background: white;
        }
        
        .profile-tab {
            padding: 12px 20px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .profile-tab.active {
            border-bottom-color: #0066cc;
            color: #0066cc;
        }
        
        .profile-layout {
            display: flex;
            flex: 1;
            background: white;
            height: 100%;
            overflow: visible;
        }
        
        .policy-info-panel {
            width: 250px;
            padding: 20px;
            background: #f9f9f9;
            border-right: 1px solid #eee;
            overflow-y: auto;
            flex-shrink: 0;
        }
        
        .profile-main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: visible;
        }
        
        .info-group {
            margin-bottom: 15px;
        }
        
        .info-group label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .info-group span {
            display: block;
            font-size: 14px;
            color: #333;
        }
        
        .tab-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: white;
            display: block !important;
            visibility: visible !important;
        }
        
        .tasks-tab, .submissions-tab {
            display: block !important;
            visibility: visible !important;
        }
        
        .tasks-header, .submissions-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .tasks-actions {
            display: flex;
            gap: 10px;
        }
        
        .tasks-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .task-item {
            display: grid;
            grid-template-columns: 2fr 1fr 2fr;
            gap: 20px;
            padding: 15px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            transition: all 0.3s;
        }
        
        .task-item:hover {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .task-item.completed {
            background: #f9f9f9;
            opacity: 0.8;
        }
        
        .task-checkbox {
            display: flex;
            align-items: center;
        }
        
        .task-checkbox input[type="checkbox"] {
            display: none;
        }
        
        .task-checkbox label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 14px;
            color: #333;
            user-select: none;
        }
        
        .checkbox-custom {
            width: 20px;
            height: 20px;
            border: 2px solid #0066cc;
            border-radius: 4px;
            margin-right: 12px;
            position: relative;
            transition: all 0.3s;
            flex-shrink: 0;
        }
        
        .task-checkbox input:checked + label .checkbox-custom {
            background: #0066cc;
        }
        
        .task-checkbox input:checked + label .checkbox-custom::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 14px;
            font-weight: bold;
        }
        
        .task-checkbox input:checked + label {
            text-decoration: line-through;
            color: #666;
        }
        
        .task-status {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .completion-time {
            font-size: 12px;
            color: #4caf50;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .status-pending {
            font-size: 12px;
            color: #999;
            padding: 4px 8px;
            background: #f5f5f5;
            border-radius: 4px;
        }
        
        .task-notes {
            display: flex;
            align-items: center;
        }
        
        .notes-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            resize: none;
            min-height: 35px;
            max-height: 80px;
            font-family: inherit;
        }
        
        .notes-input:focus {
            outline: none;
            border-color: #0066cc;
            box-shadow: 0 0 0 2px rgba(0,102,204,0.1);
        }
        
        .submission-form {
            margin-bottom: 20px;
        }
        
        .form-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        .form-group label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .form-control {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .upload-section {
            margin: 20px 0;
        }
        
        .upload-section label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .upload-area {
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .upload-area:hover {
            border-color: #0066cc;
            background: #f0f7ff;
        }
        
        .upload-area i {
            font-size: 48px;
            color: #0066cc;
            margin-bottom: 10px;
        }
        
        .upload-area p {
            margin: 10px 0 5px;
            font-size: 14px;
            color: #333;
        }
        
        .upload-area span {
            font-size: 12px;
            color: #666;
        }
        
        .uploaded-file {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
            margin-top: 10px;
        }
        
        .uploaded-file i {
            color: #dc3545;
            font-size: 20px;
        }
        
        .remove-file {
            margin-left: auto;
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .submissions-list {
            margin-bottom: 30px;
        }
        
        .submission-item {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        .submission-logo {
            width: 100px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid #eee;
            padding-right: 20px;
        }
        
        .submission-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .submission-info {
            flex: 1;
        }
        
        .submission-info h4 {
            margin: 0 0 10px;
            color: #333;
        }
        
        .submission-details-row {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
            font-size: 13px;
        }
        
        .submission-meta {
            display: flex;
            gap: 20px;
            align-items: center;
            font-size: 12px;
            color: #666;
        }
        
        .submission-actions {
            display: flex;
            gap: 10px;
        }
        
        .quote-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .quote-status.pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .quote-status.received {
            background: #d4edda;
            color: #155724;
        }
        
        .submission-details {
            margin-bottom: 15px;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .detail-row label {
            color: #666;
        }
        
        .submission-actions {
            display: flex;
            gap: 10px;
        }
        
        .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .comparison-table th {
            background: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-size: 13px;
        }
        
        .comparison-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        
        .btn-small {
            padding: 6px 12px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .btn-small:hover {
            background: #0052a3;
        }
        
        .btn-secondary {
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .btn-success {
            background: #28a745 !important;
        }
        
        .btn-success:hover {
            background: #218838 !important;
        }
        
        .premium-cell {
            font-weight: 600;
            color: #0066cc;
        }
        
        .rating {
            background: #ffc107;
            color: #000;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            font-size: 12px;
        }
        
        .comparison-section {
            margin-top: 30px;
        }
        
        .comparison-section h4 {
            margin-bottom: 15px;
        }
        
        .empty-submissions {
            text-align: center;
            padding: 60px 20px;
            background: #f9f9f9;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .form-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .back-btn {
            background: #f5f5f5;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .back-btn:hover {
            background: #e0e0e0;
            transform: translateX(-2px);
        }
        
        .back-btn i {
            font-size: 16px;
            color: #333;
        }
    `;
    document.head.appendChild(style);
}

window.loadLeadGenerationView = function loadLeadGenerationView(activeTab = 'lookup') {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="lead-generation-view">
            <header class="content-header">
                <h1>Lead Generation Database</h1>
            </header>

            <!-- Folder-style tabs -->
            <div class="folder-tabs">
                <button class="folder-tab ${activeTab === 'lookup' ? 'active' : ''}" onclick="switchLeadSection('lookup')">
                    <i class="fas fa-search"></i> Carrier Lookup
                </button>
                <button class="folder-tab ${activeTab === 'generate' ? 'active' : ''}" onclick="switchLeadSection('generate')">
                    <i class="fas fa-magic"></i> Generate Leads
                </button>
                <button class="folder-tab ${activeTab === 'sms' ? 'active' : ''}" onclick="switchLeadSection('sms')">
                    <i class="fas fa-sms"></i> SMS Blast
                </button>
            </div>
            
            <div class="lead-gen-container">
                <!-- Carrier Lookup Section -->
                <div id="carrierLookupSection" class="tab-section" style="display: ${activeTab === 'lookup' ? 'block' : 'none'};">
                    <div class="search-section">
                    <h3>Search Carriers</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>USDOT Number</label>
                                <input type="text" class="form-control" id="usdotSearch" placeholder="Enter USDOT #">
                            </div>
                            <div class="form-group">
                                <label>MC Number</label>
                                <input type="text" class="form-control" id="mcSearch" placeholder="Enter MC #">
                            </div>
                            <div class="form-group">
                                <label>Company Name</label>
                                <input type="text" class="form-control" id="companySearch" placeholder="Enter company name">
                            </div>
                            <div class="form-group">
                                <label>State</label>
                                <select class="form-control" id="stateSearch">
                                    <option value="">All States</option>
                                    <option value="CA">California</option>
                                    <option value="TX">Texas</option>
                                    <option value="FL">Florida</option>
                                    <option value="NY">New York</option>
                                    <option value="IL">Illinois</option>
                                    <option value="OH">Ohio</option>
                                </select>
                            </div>
                        </div>
                    
                    <div class="search-actions">
                        <button class="btn-primary" onclick="performLeadSearch()">
                            <i class="fas fa-search"></i> Search Database
                        </button>
                        <button class="btn-secondary" onclick="clearLeadFilters()">
                            <i class="fas fa-eraser"></i> Clear Filters
                        </button>
                    </div>
                </div>
                
                <!-- Results Section -->
                <div class="lead-results-section" id="leadResults">
                    <div class="results-header">
                        <h3>Search Results</h3>
                        <span class="results-count">0 leads found</span>
                    </div>
                    
                    <div class="lead-results-table">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" onclick="selectAllLeads(this)"></th>
                                    <th>USDOT #</th>
                                    <th>Company Name</th>
                                    <th>Location</th>
                                    <th>Fleet Size</th>
                                    <th>Insurance Status</th>
                                    <th>Expiry Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="leadResultsBody">
                                <tr>
                                    <td colspan="8" class="text-center">No results. Use the search form above to find leads.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="results-pagination">
                        <button class="btn-small" disabled><i class="fas fa-chevron-left"></i> Previous</button>
                        <span class="page-info">Page 1 of 1</span>
                        <button class="btn-small" disabled>Next <i class="fas fa-chevron-right"></i></button>
                    </div>
                    </div>
                </div>
                
                <!-- Generate Leads Section -->
                <div id="generateLeadsSection" class="tab-section" style="display: ${activeTab === 'generate' ? 'block' : 'none'};">
                    ${getGenerateLeadsContent()}
                </div>

                <!-- SMS Blast Section -->
                <div id="smsBlastSection" class="tab-section" style="display: ${activeTab === 'sms' ? 'block' : 'none'};">
                    ${getSMSBlastContent()}
                </div>
            </div>
        </div>
    `;

    // Initialize lead generation specific features
    initializeLeadGeneration();
}

function loadRatingEngineView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="rating-engine-view">
            <header class="content-header">
                <h1>Multi-Carrier Rating Engine</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="loadQuoteTemplate()">
                        <i class="fas fa-file-import"></i> Load Template
                    </button>
                </div>
            </header>
            
            <div class="rating-container">
                <div class="rating-form-section">
                    <h3>Quote Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Product Line</label>
                            <select class="form-control">
                                <option>Auto Insurance</option>
                                <option>Homeowners</option>
                                <option>Commercial Auto</option>
                                <option>Commercial Property</option>
                                <option>General Liability</option>
                                <option>Life Insurance</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Effective Date</label>
                            <input type="date" class="form-control">
                        </div>
                    </div>
                    
                    <h3>Client Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Client Name</label>
                            <input type="text" class="form-control" placeholder="Enter client name">
                        </div>
                        <div class="form-group">
                            <label>Date of Birth</label>
                            <input type="date" class="form-control">
                        </div>
                    </div>
                    
                    <h3>Coverage Details</h3>
                    <div class="coverage-options">
                        <div class="coverage-item">
                            <label>
                                <input type="checkbox" checked> Bodily Injury Liability
                            </label>
                            <select class="form-control">
                                <option>$100k/$300k</option>
                                <option>$250k/$500k</option>
                                <option>$500k/$1M</option>
                            </select>
                        </div>
                        <div class="coverage-item">
                            <label>
                                <input type="checkbox" checked> Property Damage
                            </label>
                            <select class="form-control">
                                <option>$50,000</option>
                                <option>$100,000</option>
                                <option>$250,000</option>
                            </select>
                        </div>
                        <div class="coverage-item">
                            <label>
                                <input type="checkbox" checked> Comprehensive
                            </label>
                            <select class="form-control">
                                <option>$500 deductible</option>
                                <option>$1,000 deductible</option>
                            </select>
                        </div>
                        <div class="coverage-item">
                            <label>
                                <input type="checkbox" checked> Collision
                            </label>
                            <select class="form-control">
                                <option>$500 deductible</option>
                                <option>$1,000 deductible</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn-primary" onclick="runRating()">
                            <i class="fas fa-search"></i> Get Quotes from All Carriers
                        </button>
                    </div>
                </div>
                
                <div class="rating-results-section" id="ratingResults" style="display: none;">
                    <h3>Available Quotes</h3>
                    <div class="carrier-quotes">
                        <!-- Results will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadAccountingView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="accounting-view">
            <header class="content-header">
                <h1>Accounting & Commissions</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="runReconciliation()">
                        <i class="fas fa-balance-scale"></i> Reconcile
                    </button>
                    <button class="btn-primary" onclick="createInvoice()">
                        <i class="fas fa-file-invoice"></i> New Invoice
                    </button>
                </div>
            </header>
            
            <div class="accounting-stats">
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-value">$142,500</span>
                        <span class="stat-label">Total Commissions (YTD)</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-value">$28,750</span>
                        <span class="stat-label">Pending Payments</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-value">$8,200</span>
                        <span class="stat-label">Overdue</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <span class="stat-value">94%</span>
                        <span class="stat-label">Collection Rate</span>
                    </div>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active">Commissions</button>
                <button class="tab-btn">Invoices</button>
                <button class="tab-btn">Payments</button>
                <button class="tab-btn">Direct Bill</button>
                <button class="tab-btn">Claims</button>
            </div>
            
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Policy #</th>
                            <th>Client</th>
                            <th>Carrier</th>
                            <th>Premium</th>
                            <th>Commission %</th>
                            <th>Commission</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>12/28/2024</td>
                            <td>POL-2024-0523</td>
                            <td>John Doe</td>
                            <td>Progressive</td>
                            <td>$1,200</td>
                            <td>15%</td>
                            <td>$180</td>
                            <td><span class="status-badge paid">Paid</span></td>
                        </tr>
                        <tr>
                            <td>12/27/2024</td>
                            <td>POL-2024-0522</td>
                            <td>Smith Agency</td>
                            <td>Liberty Mutual</td>
                            <td>$8,500</td>
                            <td>12%</td>
                            <td>$1,020</td>
                            <td><span class="status-badge pending">Pending</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadReportsView() {
    console.log('loadReportsView function called');
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        console.log('No dashboard content found!');
        return;
    }
    dashboardContent.innerHTML = `
        <div class="reports-view">
            <header class="content-header">
                <h1>Reports & Analytics</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="scheduleReport()">
                        <i class="fas fa-clock"></i> Schedule
                    </button>
                    <button class="btn-primary" onclick="createCustomReport()">
                        <i class="fas fa-plus"></i> Custom Report
                    </button>
                </div>
            </header>
            
            <div class="reports-grid">
                <div class="report-card" onclick="runReport('production')">
                    <div class="report-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3>Production Report</h3>
                    <p>New business and renewal production metrics</p>
                </div>
                
                <div class="report-card" onclick="runReport('loss-ratio')">
                    <div class="report-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <h3>Loss Ratio Analysis</h3>
                    <p>Claims vs premium analysis by line</p>
                </div>
                
                <div class="report-card" onclick="runReport('commission')">
                    <div class="report-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <h3>Commission Report</h3>
                    <p>Detailed commission breakdown by carrier</p>
                </div>
                
                <div class="report-card" onclick="runReport('renewal')">
                    <div class="report-icon">
                        <i class="fas fa-sync"></i>
                    </div>
                    <h3>Renewal Forecast</h3>
                    <p>Upcoming renewals and retention metrics</p>
                </div>
                
                <div class="report-card" onclick="runReport('marketing')">
                    <div class="report-icon">
                        <i class="fas fa-bullhorn"></i>
                    </div>
                    <h3>Marketing ROI</h3>
                    <p>Campaign performance and lead conversion</p>
                </div>
                
                <div class="report-card" onclick="runReport('carrier')">
                    <div class="report-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <h3>Carrier Performance</h3>
                    <p>Quote-to-bind ratios by carrier</p>
                </div>
            </div>
            
            <div class="recent-reports">
                <h3>Recent Reports</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Report Name</th>
                            <th>Type</th>
                            <th>Generated</th>
                            <th>Generated By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>December Production Report</td>
                            <td>Production</td>
                            <td>12/28/2024 09:15 AM</td>
                            <td>Admin</td>
                            <td>
                                <button class="btn-icon"><i class="fas fa-download"></i></button>
                                <button class="btn-icon"><i class="fas fa-eye"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadCommunicationsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    // Get saved campaigns or use defaults
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    
    dashboardContent.innerHTML = `
        <div class="communications-view">
            <header class="content-header">
                <h1>Communications Hub</h1>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="showEmailBlast()">
                        <i class="fas fa-envelope"></i> Email Blast
                    </button>
                    <button class="btn-secondary" onclick="showSMSBlast()">
                        <i class="fas fa-sms"></i> SMS Blast
                    </button>
                    <button class="btn-primary" onclick="showAICampaignModal()">
                        <i class="fas fa-robot"></i> AI Caller Campaign
                    </button>
                    <button class="btn-primary" onclick="createNewCampaign()">
                        <i class="fas fa-paper-plane"></i> New Campaign
                    </button>
                </div>
            </header>
            
            <div class="comm-stats">
                <div class="mini-stat">
                    <span class="mini-stat-value">${localStorage.getItem('emailsSent') || '0'}</span>
                    <span class="mini-stat-label">Emails Sent (Month)</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${localStorage.getItem('emailOpenRate') || '0'}%</span>
                    <span class="mini-stat-label">Open Rate</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${localStorage.getItem('smsSent') || '0'}</span>
                    <span class="mini-stat-label">SMS Sent</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-value">${campaigns.filter(c => c.status === 'active').length}</span>
                    <span class="mini-stat-label">Active Campaigns</span>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" onclick="loadCommunicationTab('reminders')">Reminders</button>
                <button class="tab-btn" onclick="loadCommunicationTab('campaigns')">Campaigns</button>
                <button class="tab-btn" onclick="loadCommunicationTab('email')">Email Blast</button>
                <button class="tab-btn" onclick="loadCommunicationTab('sms')">SMS Blast</button>
                <button class="tab-btn" onclick="loadCommunicationTab('history')">History</button>
            </div>
            
            <div id="communicationTabContent">
                <!-- Default to reminders tab content -->
            </div>
        </div>
    `;
    
    // Add communication styles
    addCommunicationStyles();

    // Load reminders tab by default
    loadCommunicationTab('reminders');
}

function renderCampaignsTab() {
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const aiCampaigns = JSON.parse(localStorage.getItem('aiCampaigns') || '[]');
    
    if (campaigns.length === 0 && aiCampaigns.length === 0) {
        // Add default campaigns if none exist
        const defaultCampaigns = [
            {
                id: 1,
                name: 'Renewal Reminders',
                status: 'active',
                sent: 234,
                opened: 156,
                clicked: 45,
                type: 'email',
                schedule: 'Monthly'
            },
            {
                id: 2,
                name: 'Welcome Series',
                status: 'paused',
                sent: 89,
                opened: 72,
                clicked: 28,
                type: 'email',
                schedule: 'On Signup'
            }
        ];
        localStorage.setItem('campaigns', JSON.stringify(defaultCampaigns));
        campaigns.push(...defaultCampaigns);
    }
    
    return `
        <div class="campaigns-container">
            <div class="campaigns-grid">
                ${campaigns.map(campaign => `
                    <div class="campaign-card" data-campaign-id="${campaign.id}">
                        <div class="campaign-header">
                            <h3>${campaign.name}</h3>
                            <span class="status-badge ${campaign.status}">${campaign.status}</span>
                        </div>
                        <div class="campaign-info">
                            <span class="campaign-type"><i class="fas fa-${campaign.type === 'sms' ? 'sms' : 'envelope'}"></i> ${campaign.type.toUpperCase()}</span>
                            <span class="campaign-schedule"><i class="fas fa-clock"></i> ${campaign.schedule}</span>
                        </div>
                        <div class="campaign-stats">
                            <div>
                                <span class="stat-label">Sent</span>
                                <span class="stat-value">${campaign.sent}</span>
                            </div>
                            <div>
                                <span class="stat-label">Opened</span>
                                <span class="stat-value">${campaign.opened} (${Math.round(campaign.opened/campaign.sent*100)}%)</span>
                            </div>
                            <div>
                                <span class="stat-label">Clicked</span>
                                <span class="stat-value">${campaign.clicked} (${Math.round(campaign.clicked/campaign.sent*100)}%)</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn-small" onclick="viewCampaignDetails(${campaign.id})">
                                <i class="fas fa-eye"></i> Details
                            </button>
                            ${campaign.status === 'active' ? 
                                `<button class="btn-small btn-warning" onclick="toggleCampaign(${campaign.id})">
                                    <i class="fas fa-pause"></i> Pause
                                </button>` :
                                `<button class="btn-small btn-success" onclick="toggleCampaign(${campaign.id})">
                                    <i class="fas fa-play"></i> Start
                                </button>`
                            }
                            <button class="btn-small btn-danger" onclick="deleteCampaign(${campaign.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${aiCampaigns.length > 0 ? `
                <div style="margin-top: 30px;">
                    <h2 style="margin-bottom: 15px; color: #111827;">
                        <i class="fas fa-robot" style="margin-right: 10px; color: #0066cc;"></i>
                        AI Caller Campaigns
                    </h2>
                    <div class="campaigns-grid">
                        ${aiCampaigns.map(campaign => `
                            <div class="campaign-card ai-campaign" data-campaign-id="${campaign.id}">
                                <div class="campaign-header">
                                    <h3>${campaign.name}</h3>
                                    <span class="status-badge ${campaign.status}">${campaign.status}</span>
                                </div>
                                <div class="campaign-stats">
                                    <div class="stat">
                                        <span class="stat-label">Total Calls</span>
                                        <span class="stat-value">${campaign.stats?.totalCalls || 0}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">Interested</span>
                                        <span class="stat-value" style="color: #10b981;">${campaign.stats?.interested || 0}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">Leads</span>
                                        <span class="stat-value">${campaign.leadList?.length || 0}</span>
                                    </div>
                                </div>
                                <div class="campaign-footer">
                                    <button class="btn-small" onclick="viewAICampaignDetails('${campaign.id}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    ${campaign.status === 'draft' ? `
                                        <button class="btn-small btn-primary" onclick="startAICampaign('${campaign.id}')">
                                            <i class="fas fa-play"></i> Start
                                        </button>
                                    ` : campaign.status === 'active' ? `
                                        <button class="btn-small btn-secondary" onclick="pauseAICampaign('${campaign.id}')">
                                            <i class="fas fa-pause"></i> Pause
                                        </button>
                                    ` : ''}
                                    <button class="btn-small" onclick="showManualCallModal('${campaign.id}')">
                                        <i class="fas fa-phone"></i> Manual Call
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderEmailBlastTab() {
    return `
        <div class="blast-container">
            <div class="blast-form">
                <h3>Send Email Blast</h3>
                
                <div class="form-section">
                    <label>Upload Recipients CSV</label>
                    <div class="upload-area" onclick="document.getElementById('recipientFile').click()">
                        <i class="fas fa-file-csv"></i>
                        <p>Click to upload CSV file</p>
                        <span>Must contain email addresses</span>
                        <input type="file" id="recipientFile" style="display: none;" accept=".csv" onchange="handleRecipientUpload(this, 'email')">
                    </div>
                    <div id="recipientMapping" style="display: none;">
                        <h4>Map CSV Columns to Fields</h4>
                        <div id="mappingFields"></div>
                    </div>
                </div>
                
                <div class="form-section">
                    <label>Subject Line</label>
                    <input type="text" class="form-control" id="emailSubject" placeholder="Enter email subject">
                </div>
                
                <div class="form-section">
                    <label>Email Template</label>
                    <div class="template-variables">
                        <p>Available variables (click to insert):</p>
                        <div id="availableVars" class="variable-buttons">
                            <button class="var-btn" onclick="insertVariable('email', '[name]')">[name]</button>
                            <button class="var-btn" onclick="insertVariable('email', '[company]')">[company]</button>
                            <button class="var-btn" onclick="insertVariable('email', '[policy_type]')">[policy_type]</button>
                            <button class="var-btn" onclick="insertVariable('email', '[expiration_date]')">[expiration_date]</button>
                        </div>
                    </div>
                    <textarea id="emailTemplate" class="form-control" rows="10" placeholder="Hi [name],

Your [policy_type] insurance is approaching its expiration date on [expiration_date].

We'd love to help you renew your policy and ensure continuous coverage.

Best regards,
Vanguard Insurance Group"></textarea>
                </div>
                
                <div class="form-section">
                    <label>Schedule</label>
                    <div class="schedule-options">
                        <label class="radio-option">
                            <input type="radio" name="emailSchedule" value="now" checked>
                            Send Immediately
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="emailSchedule" value="later">
                            Schedule for Later
                            <input type="datetime-local" id="emailScheduleTime" class="form-control" style="margin-left: 10px;">
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn-secondary" onclick="previewEmailBlast()">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn-primary" onclick="sendEmailBlast()">
                        <i class="fas fa-paper-plane"></i> Send Email Blast
                    </button>
                </div>
            </div>
            
            <div class="preview-panel" id="emailPreview" style="display: none;">
                <h3>Email Preview</h3>
                <div class="preview-content"></div>
            </div>
        </div>
    `;
}

function renderSMSBlastTab() {
    return `
        <div class="blast-container">
            <div class="blast-form">
                <h3>Send SMS Blast</h3>
                
                <div class="form-section">
                    <label>Upload Recipients CSV</label>
                    <div class="upload-area" onclick="document.getElementById('smsRecipientFile').click()">
                        <i class="fas fa-file-csv"></i>
                        <p>Click to upload CSV file</p>
                        <span>Must contain phone numbers</span>
                        <input type="file" id="smsRecipientFile" style="display: none;" accept=".csv" onchange="handleRecipientUpload(this, 'sms')">
                    </div>
                    <div id="smsRecipientMapping" style="display: none;">
                        <h4>Map CSV Columns to Fields</h4>
                        <div id="smsMappingFields"></div>
                    </div>
                </div>
                
                <div class="form-section">
                    <label>SMS Message</label>
                    <div class="template-variables">
                        <p>Available variables (click to insert):</p>
                        <div id="smsAvailableVars" class="variable-buttons">
                            <button class="var-btn" onclick="insertVariable('sms', '[name]')">[name]</button>
                            <button class="var-btn" onclick="insertVariable('sms', '[company]')">[company]</button>
                            <button class="var-btn" onclick="insertVariable('sms', '[policy_type]')">[policy_type]</button>
                            <button class="var-btn" onclick="insertVariable('sms', '[expiration_date]')">[expiration_date]</button>
                        </div>
                    </div>
                    <textarea id="smsTemplate" class="form-control" rows="5" placeholder="Hi [name], your [policy_type] insurance expires on [expiration_date]. Reply YES to renew or call us at 555-0123." maxlength="160"></textarea>
                    <div class="char-count">
                        <span id="smsCharCount">0</span> / 160 characters
                    </div>
                </div>
                
                <div class="form-section">
                    <label>Schedule</label>
                    <div class="schedule-options">
                        <label class="radio-option">
                            <input type="radio" name="smsSchedule" value="now" checked>
                            Send Immediately
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="smsSchedule" value="later">
                            Schedule for Later
                            <input type="datetime-local" id="smsScheduleTime" class="form-control" style="margin-left: 10px;">
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn-secondary" onclick="previewSMSBlast()">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn-primary" onclick="sendSMSBlast()">
                        <i class="fas fa-paper-plane"></i> Send SMS Blast
                    </button>
                </div>
            </div>
            
            <div class="preview-panel" id="smsPreview" style="display: none;">
                <h3>SMS Preview</h3>
                <div class="preview-content"></div>
            </div>
        </div>
    `;
}

function loadCommunicationTab(tabName) {
    // Update active tab
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase() === tabName.toLowerCase() || 
            (tabName === 'email' && tab.textContent === 'Email') ||
            (tabName === 'sms' && tab.textContent === 'SMS')) {
            tab.classList.add('active');
        }
    });
    
    const contentArea = document.getElementById('communicationTabContent');
    if (!contentArea) return;
    
    let content = '';
    
    switch(tabName) {
        case 'email':
            content = `
                <div class="email-view">
                    <div class="email-composer">
                        <h3>Compose Email</h3>
                        <div class="form-group">
                            <label>To:</label>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="text" class="form-control" id="emailToField" placeholder="Select recipients or enter email addresses" style="flex: 1;">
                                <button class="btn-secondary" onclick="selectRecipients('email', 'leads')">Leads</button>
                                <button class="btn-secondary" onclick="selectRecipients('email', 'clients')">Clients</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Subject:</label>
                            <input type="text" class="form-control" id="emailSubject" placeholder="Enter email subject">
                        </div>
                        <div class="form-group">
                            <label>Message:</label>
                            <textarea class="form-control" id="emailMessage" rows="8" placeholder="Type your message here..."></textarea>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="btn-secondary" onclick="improveWithAI('email')">
                                    <i class="fas fa-magic"></i> AI Improve
                                </button>
                                <button class="btn-secondary" onclick="attachFile('email')">
                                    <i class="fas fa-paperclip"></i> Attach File
                                </button>
                            </div>
                            <div id="emailAttachments" style="margin-top: 10px;"></div>
                        </div>
                        <div class="form-actions">
                            <button class="btn-secondary">Save as Draft</button>
                            <button class="btn-primary">Send Email</button>
                        </div>
                    </div>
                    <div class="recent-emails">
                        <h3>Recent Emails</h3>
                        <div class="email-list">
                            <div class="email-item">
                                <div class="email-from">john.doe@example.com</div>
                                <div class="email-subject">Policy Renewal Reminder</div>
                                <div class="email-time">2 hours ago</div>
                            </div>
                            <div class="email-item">
                                <div class="email-from">sarah.smith@example.com</div>
                                <div class="email-subject">Quote Request</div>
                                <div class="email-time">5 hours ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'sms':
            content = `
                <div class="sms-view">
                    <div class="sms-composer">
                        <h3>Send SMS</h3>
                        <div class="form-group">
                            <label>To:</label>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="text" class="form-control" id="smsToField" placeholder="Enter phone number or select from contacts" style="flex: 1;">
                                <button class="btn-secondary" onclick="selectRecipients('sms', 'leads')">Leads</button>
                                <button class="btn-secondary" onclick="selectRecipients('sms', 'clients')">Clients</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Message:</label>
                            <textarea class="form-control" id="smsMessage" rows="4" placeholder="Type your SMS message (160 characters max)..." maxlength="160"></textarea>
                            <small class="char-count">0 / 160 characters</small>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="btn-secondary" onclick="improveWithAI('sms')">
                                    <i class="fas fa-magic"></i> AI Improve
                                </button>
                                <button class="btn-secondary" onclick="attachFile('sms')">
                                    <i class="fas fa-link"></i> Attach Link
                                </button>
                            </div>
                            <div id="smsAttachments" style="margin-top: 10px;"></div>
                        </div>
                        <div class="form-actions">
                            <button class="btn-secondary">Save Template</button>
                            <button class="btn-primary">Send SMS</button>
                        </div>
                    </div>
                    <div class="recent-sms">
                        <h3>Recent SMS Messages</h3>
                        <div class="sms-list">
                            <div class="sms-item">
                                <div class="sms-to">(555) 123-4567</div>
                                <div class="sms-message">Your policy renewal is due in 30 days. Contact us to review your coverage.</div>
                                <div class="sms-time">1 hour ago</div>
                            </div>
                            <div class="sms-item">
                                <div class="sms-to">(555) 987-6543</div>
                                <div class="sms-message">Thank you for your payment. Your policy is now active.</div>
                                <div class="sms-time">3 hours ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'campaigns':
            content = `
                <div class="campaigns-grid">
                    <div class="campaign-card">
                        <div class="campaign-header">
                            <h3>Renewal Reminders</h3>
                            <span class="status-badge active">Active</span>
                        </div>
                        <div class="campaign-stats">
                            <div>
                                <span class="stat-label">Sent</span>
                                <span class="stat-value">234</span>
                            </div>
                            <div>
                                <span class="stat-label">Opened</span>
                                <span class="stat-value">156 (67%)</span>
                            </div>
                            <div>
                                <span class="stat-label">Clicked</span>
                                <span class="stat-value">45 (19%)</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn-secondary" onclick="viewCampaignDetails('renewal_reminders')">View Details</button>
                            <button class="btn-secondary" onclick="pauseCampaign('renewal_reminders')">Pause</button>
                        </div>
                    </div>

                    <div class="campaign-card">
                        <div class="campaign-header">
                            <h3>Welcome Series</h3>
                            <span class="status-badge active">Active</span>
                        </div>
                        <div class="campaign-stats">
                            <div>
                                <span class="stat-label">Sent</span>
                                <span class="stat-value">89</span>
                            </div>
                            <div>
                                <span class="stat-label">Opened</span>
                                <span class="stat-value">72 (81%)</span>
                            </div>
                            <div>
                                <span class="stat-label">Clicked</span>
                                <span class="stat-value">28 (31%)</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn-secondary" onclick="viewCampaignDetails('welcome_series')">View Details</button>
                            <button class="btn-secondary" onclick="pauseCampaign('welcome_series')">Pause</button>
                        </div>
                    </div>

                    <div class="campaign-card">
                        <div class="campaign-header">
                            <h3>Holiday Greetings</h3>
                            <span class="status-badge pending">Scheduled</span>
                        </div>
                        <div class="campaign-stats">
                            <div>
                                <span class="stat-label">Recipients</span>
                                <span class="stat-value">1,245</span>
                            </div>
                            <div>
                                <span class="stat-label">Send Date</span>
                                <span class="stat-value">Dec 15</span>
                            </div>
                        </div>
                        <div class="campaign-actions">
                            <button class="btn-secondary" onclick="editCampaign('holiday_greetings')">Edit</button>
                            <button class="btn-primary" onclick="previewCampaign('holiday_greetings')">Preview</button>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'reminders':
            content = `
                <div class="reminders-view">
                    <div class="reminders-stats">
                        <div class="mini-stat">
                            <span class="mini-stat-value" id="pending-gifts-count">0</span>
                            <span class="mini-stat-label">Pending Gifts</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-value" id="sent-gifts-count">0</span>
                            <span class="mini-stat-label">Gifts Sent</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-value" id="urgent-birthdays-count">0</span>
                            <span class="mini-stat-label">Urgent Birthdays</span>
                        </div>
                    </div>

                    <div class="reminders-sections">
                        <!-- Birthday Reminders Section -->
                        <div class="reminders-section">
                            <div class="section-header">
                                <h3><i class="fas fa-birthday-cake"></i> Birthday Reminders</h3>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="birthday-view-buttons" style="display: flex; gap: 5px;">
                                        <button id="birthday-30-btn" class="birthday-view-btn active" onclick="setBirthdayView(30)">30d</button>
                                        <button id="birthday-60-btn" class="birthday-view-btn" onclick="setBirthdayView(60)">60d</button>
                                        <button id="birthday-90-btn" class="birthday-view-btn" onclick="setBirthdayView(90)">90d</button>
                                    </div>
                                    <span class="section-count" id="birthday-count">0</span>
                                </div>
                            </div>
                            <div class="reminder-cards-stack" id="birthday-reminders">
                                <!-- Birthday cards will be populated here -->
                            </div>
                        </div>


                        <!-- New Policy Gifts Section -->
                        <div class="reminders-section">
                            <div class="section-header">
                                <h3><i class="fas fa-gift"></i> New Policy Gifts</h3>
                                <span class="section-count" id="new-policy-count">0</span>
                            </div>
                            <div class="reminder-cards-stack" id="new-policy-reminders">
                                <!-- New policy cards will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Initialize reminders after content is loaded
            setTimeout(() => {
                if (window.communicationsReminders) {
                    window.communicationsReminders.init();
                    loadReminderCards();
                } else {
                    // Load the reminders module if not loaded
                    const script = document.createElement('script');
                    script.src = 'js/communications-reminders.js';
                    script.onload = () => {
                        setTimeout(() => {
                            if (window.communicationsReminders) {
                                window.communicationsReminders.init();
                                loadReminderCards();
                            }
                        }, 100);
                    };
                    document.head.appendChild(script);
                }
            }, 100);
            break;
            
        case 'history':
            content = `
                <div class="history-view">
                    <div class="history-filters">
                        <select class="form-control">
                            <option>All Types</option>
                            <option>Email</option>
                            <option>SMS</option>
                            <option>Campaigns</option>
                        </select>
                        <input type="date" class="form-control" placeholder="From Date">
                        <input type="date" class="form-control" placeholder="To Date">
                        <button class="btn-secondary">Filter</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date/Time</th>
                                <th>Type</th>
                                <th>Recipient</th>
                                <th>Subject/Message</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2024-01-15 10:30 AM</td>
                                <td><span class="badge">Email</span></td>
                                <td>john.doe@example.com</td>
                                <td>Policy Renewal Reminder</td>
                                <td><span class="status-badge active">Delivered</span></td>
                                <td><button class="btn-icon"><i class="fas fa-eye"></i></button></td>
                            </tr>
                            <tr>
                                <td>2024-01-15 09:15 AM</td>
                                <td><span class="badge">SMS</span></td>
                                <td>(555) 123-4567</td>
                                <td>Payment confirmation for policy #12345</td>
                                <td><span class="status-badge active">Sent</span></td>
                                <td><button class="btn-icon"><i class="fas fa-eye"></i></button></td>
                            </tr>
                            <tr>
                                <td>2024-01-14 03:45 PM</td>
                                <td><span class="badge">Campaign</span></td>
                                <td>245 recipients</td>
                                <td>Welcome Series - Email 1</td>
                                <td><span class="status-badge active">Completed</span></td>
                                <td><button class="btn-icon"><i class="fas fa-chart-bar"></i></button></td>
                            </tr>
                            <tr>
                                <td>2024-01-14 11:20 AM</td>
                                <td><span class="badge">Email</span></td>
                                <td>sarah.smith@example.com</td>
                                <td>Quote Request Response</td>
                                <td><span class="status-badge pending">Bounced</span></td>
                                <td><button class="btn-icon"><i class="fas fa-redo"></i></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
            break;
    }
    
    contentArea.innerHTML = content;
    
    // Add event listener for SMS character count if SMS tab
    if (tabName === 'sms') {
        const textarea = document.getElementById('smsMessage');
        const charCount = contentArea.querySelector('.char-count');
        if (textarea && charCount) {
            textarea.addEventListener('input', function() {
                charCount.textContent = `${this.value.length} / 160 characters`;
            });
        }
    }
}

function selectRecipients(type, source) {
    // Get leads and clients data
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    
    let recipients = source === 'leads' ? leads : clients;
    let title = source === 'leads' ? 'Select Leads' : 'Select Clients';
    
    // Create modal overlay for recipient selection
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    modalOverlay.innerHTML = `
        <div class="modal-container" style="
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
            ">
                <h2 style="margin: 0;">${title}</h2>
                <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="
                padding: 1.5rem;
                overflow-y: auto;
                flex: 1;
            ">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <input type="text" class="form-control" id="recipientSearch" 
                           placeholder="Search ${source}..." 
                           onkeyup="filterRecipients('${source}')"
                           style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 6px;">
                </div>
                <div class="recipient-list" id="recipientList" style="max-height: 400px; overflow-y: auto;">
                    ${recipients.map(recipient => {
                        const name = recipient.name || `${recipient.firstName} ${recipient.lastName}`;
                        const contact = type === 'email' ? recipient.email : recipient.phone;
                        const display = contact || (type === 'email' ? 'No email' : 'No phone');
                        
                        // Check if this is a lead and if they have quotes
                        // Quotes might be stored directly or need to be checked from the quotes array
                        let hasQuotes = false;
                        let recipientQuotes = [];
                        
                        if (source === 'leads') {
                            // Check if quotes exist on the lead object
                            if (recipient.quotes && recipient.quotes.length > 0) {
                                hasQuotes = true;
                                recipientQuotes = recipient.quotes;
                            } else {
                                // Check if there are quotes in the quotes storage that match this lead
                                const allQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
                                const leadQuotes = allQuotes.filter(q => 
                                    q.leadId === recipient.id || 
                                    q.leadName === name || 
                                    q.clientName === name
                                );
                                if (leadQuotes.length > 0) {
                                    hasQuotes = true;
                                    recipientQuotes = leadQuotes;
                                    // Store quotes on the lead for future use
                                    recipient.quotes = leadQuotes;
                                }
                            }
                        }
                        
                        return `
                            <div class="recipient-item" style="
                                padding: 10px;
                                border: 1px solid #e0e0e0;
                                margin-bottom: 5px;
                                border-radius: 4px;
                                transition: background-color 0.2s;
                            "
                                 onmouseover="this.style.backgroundColor='#f5f5f5'" 
                                 onmouseout="this.style.backgroundColor='white'">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1; cursor: pointer;" onclick="addRecipient('${type}', '${contact || ''}', '${name}')">
                                        <div style="font-weight: 500;">${name}</div>
                                        <div style="font-size: 0.9em; color: #666;">${display}</div>
                                        ${source === 'leads' ? `
                                            <div style="font-size: 0.8em; color: #9ca3af;">
                                                ${hasQuotes ? `${recipientQuotes.length} quote(s) available` : 'No quotes'}
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${hasQuotes ? `
                                        <button class="btn-secondary" style="
                                            padding: 5px 10px;
                                            font-size: 0.85rem;
                                            margin-left: 10px;
                                            background: #3b82f6;
                                            color: white;
                                            border: none;
                                            border-radius: 4px;
                                            cursor: pointer;
                                        " 
                                        onmouseover="this.style.backgroundColor='#2563eb'"
                                        onmouseout="this.style.backgroundColor='#3b82f6'"
                                        onclick="event.stopPropagation(); attachLeadQuote('${type}', '${recipient.id || name}', '${name.replace(/'/g, "\\'")}')">
                                            <i class="fas fa-file-invoice"></i> Attach Quote
                                        </button>
                                    ` : source === 'leads' ? `
                                        <button class="btn-secondary" disabled style="
                                            padding: 5px 10px;
                                            font-size: 0.85rem;
                                            margin-left: 10px;
                                            background: #e5e7eb;
                                            color: #9ca3af;
                                            border: none;
                                            border-radius: 4px;
                                            cursor: not-allowed;
                                        ">
                                            <i class="fas fa-file-invoice"></i> No Quotes
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Add click outside to close
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
    
    document.body.appendChild(modalOverlay);
}

function filterRecipients(source) {
    const searchTerm = document.getElementById('recipientSearch').value.toLowerCase();
    const recipientItems = document.querySelectorAll('.recipient-item');
    
    recipientItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function addRecipient(type, contact, name) {
    if (!contact) {
        alert(`This ${type === 'email' ? 'contact has no email address' : 'contact has no phone number'}`);
        return;
    }
    
    const field = type === 'email' ? 
        document.getElementById('emailToField') : 
        document.getElementById('smsToField');
    
    if (field) {
        // Add to existing recipients if there are any
        const currentValue = field.value.trim();
        if (currentValue) {
            field.value = currentValue + ', ' + contact;
        } else {
            field.value = contact;
        }
    }
    
    // Close the modal
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function improveWithAI(type) {
    const messageField = type === 'email' ? 
        document.getElementById('emailMessage') : 
        document.getElementById('smsMessage');
    
    const subjectField = type === 'email' ? 
        document.getElementById('emailSubject') : null;
    
    if (!messageField) return;
    
    const originalMessage = messageField.value.trim();
    
    if (!originalMessage) {
        alert('Please write a message first');
        return;
    }
    
    // Simulate AI improvement (in production, this would call an actual AI service)
    let improvedMessage = originalMessage;
    
    // Basic improvements
    improvedMessage = improvedMessage.charAt(0).toUpperCase() + improvedMessage.slice(1);
    
    // Add professional tone
    if (type === 'email') {
        // Email improvements
        if (!improvedMessage.includes('Dear') && !improvedMessage.includes('Hello') && !improvedMessage.includes('Hi')) {
            improvedMessage = 'Dear Valued Client,\n\n' + improvedMessage;
        }
        
        if (!improvedMessage.includes('Sincerely') && !improvedMessage.includes('Best regards') && !improvedMessage.includes('Thank you')) {
            improvedMessage += '\n\nBest regards,\nVanguard Insurance Group';
        }
        
        // Auto-generate subject if empty
        if (subjectField && !subjectField.value.trim()) {
            // Extract key topic from message
            if (improvedMessage.toLowerCase().includes('renewal')) {
                subjectField.value = 'Important: Policy Renewal Information';
            } else if (improvedMessage.toLowerCase().includes('quote')) {
                subjectField.value = 'Your Insurance Quote from Vanguard';
            } else if (improvedMessage.toLowerCase().includes('claim')) {
                subjectField.value = 'Update on Your Insurance Claim';
            } else if (improvedMessage.toLowerCase().includes('payment')) {
                subjectField.value = 'Payment Confirmation - Vanguard Insurance';
            } else if (improvedMessage.toLowerCase().includes('policy')) {
                subjectField.value = 'Your Policy Information';
            } else {
                subjectField.value = 'Message from Vanguard Insurance Group';
            }
        }
    } else {
        // SMS improvements (keep it concise)
        // Remove extra spaces and ensure proper punctuation
        improvedMessage = improvedMessage.replace(/\s+/g, ' ');
        
        if (!improvedMessage.endsWith('.') && !improvedMessage.endsWith('!') && !improvedMessage.endsWith('?')) {
            improvedMessage += '.';
        }
        
        // Add company identifier if not present
        if (!improvedMessage.includes('Vanguard')) {
            improvedMessage += ' - Vanguard Insurance';
        }
        
        // Ensure it fits SMS limits
        if (improvedMessage.length > 160) {
            improvedMessage = improvedMessage.substring(0, 157) + '...';
        }
    }
    
    // Apply the improved message
    messageField.value = improvedMessage;
    
    // Update character count for SMS
    if (type === 'sms') {
        const charCount = document.querySelector('.char-count');
        if (charCount) {
            charCount.textContent = `${improvedMessage.length} / 160 characters`;
        }
    }
    
    // Visual feedback
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Improved!';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = '';
        button.style.color = '';
    }, 2000);
}

// File attachment functionality
let attachedFiles = {
    email: [],
    sms: []
};

function attachFile(type) {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    if (type === 'email') {
        // Email can accept various file types
        fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv';
    } else {
        // SMS typically sends links to files rather than attachments
        fileInput.accept = '.pdf,.png,.jpg,.jpeg';
    }
    
    fileInput.onchange = function(e) {
        const files = e.target.files;
        const attachmentContainer = document.getElementById(type + 'Attachments');
        
        if (!attachmentContainer) return;
        
        for (let file of files) {
            // Add to attached files array
            attachedFiles[type].push(file);
            
            // Create attachment display element
            const attachmentDiv = document.createElement('div');
            attachmentDiv.style.cssText = `
                display: inline-flex;
                align-items: center;
                background: #f3f4f6;
                padding: 5px 10px;
                border-radius: 4px;
                margin-right: 10px;
                margin-bottom: 5px;
            `;
            
            const fileIcon = getFileIcon(file.name);
            const fileSize = formatFileSize(file.size);
            
            attachmentDiv.innerHTML = `
                <i class="${fileIcon}" style="margin-right: 5px; color: #6b7280;"></i>
                <span style="margin-right: 5px;">${file.name}</span>
                <small style="color: #9ca3af; margin-right: 10px;">(${fileSize})</small>
                <button onclick="removeAttachment('${type}', '${file.name}')" style="
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    padding: 0;
                ">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            attachmentContainer.appendChild(attachmentDiv);
            
            // For SMS, show as link since SMS can't have true attachments
            if (type === 'sms') {
                const messageField = document.getElementById('smsMessage');
                if (messageField) {
                    // Add a shortened link placeholder to the message
                    const linkText = `\n[File: ${file.name}]`;
                    if ((messageField.value.length + linkText.length) <= 160) {
                        messageField.value += linkText;
                        // Update character count
                        const charCount = document.querySelector('.char-count');
                        if (charCount) {
                            charCount.textContent = `${messageField.value.length} / 160 characters`;
                        }
                    } else {
                        alert('Adding file link would exceed SMS character limit');
                        removeAttachment(type, file.name);
                    }
                }
            }
        }
    };
    
    fileInput.click();
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch(ext) {
        case 'pdf': return 'fas fa-file-pdf';
        case 'doc':
        case 'docx': return 'fas fa-file-word';
        case 'xls':
        case 'xlsx': return 'fas fa-file-excel';
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif': return 'fas fa-file-image';
        case 'txt': return 'fas fa-file-alt';
        case 'csv': return 'fas fa-file-csv';
        default: return 'fas fa-file';
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
}

function removeAttachment(type, filename) {
    // Remove from attachedFiles array
    attachedFiles[type] = attachedFiles[type].filter(f => f.name !== filename);
    
    // Remove from UI
    const attachmentContainer = document.getElementById(type + 'Attachments');
    if (attachmentContainer) {
        const attachments = attachmentContainer.querySelectorAll('div');
        attachments.forEach(div => {
            if (div.innerHTML.includes(filename)) {
                div.remove();
            }
        });
    }
    
    // For SMS, remove from message
    if (type === 'sms') {
        const messageField = document.getElementById('smsMessage');
        if (messageField) {
            const linkText = `[File: ${filename}]`;
            messageField.value = messageField.value.replace('\n' + linkText, '').replace(linkText, '');
            // Update character count
            const charCount = document.querySelector('.char-count');
            if (charCount) {
                charCount.textContent = `${messageField.value.length} / 160 characters`;
            }
        }
    }
}

function attachLeadQuote(type, leadId, leadName) {
    // Get the lead's quotes
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.id === leadId || l.name === leadName);
    
    let quotesToShow = [];
    
    // First check if lead has quotes directly
    if (lead && lead.quotes && lead.quotes.length > 0) {
        quotesToShow = lead.quotes;
    } else {
        // Otherwise check the quotes storage
        const allQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
        quotesToShow = allQuotes.filter(q => 
            q.leadId === leadId || 
            q.leadName === leadName || 
            q.clientName === leadName
        );
    }
    
    if (quotesToShow.length === 0) {
        alert('No quotes found for this lead');
        return;
    }
    
    // Show quote selection modal
    const quoteModal = document.createElement('div');
    quoteModal.className = 'modal-overlay active';
    quoteModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    quoteModal.innerHTML = `
        <div class="modal-container" style="
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 60vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
            ">
                <h3 style="margin: 0;">Select Quote to Attach</h3>
                <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="
                padding: 1.5rem;
                overflow-y: auto;
                flex: 1;
            ">
                ${quotesToShow.map((quote, index) => `
                    <div style="
                        padding: 15px;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        margin-bottom: 10px;
                        cursor: pointer;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.backgroundColor='#f5f5f5'; this.style.borderColor='#3b82f6';" 
                    onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#e0e0e0';"
                    onclick="selectQuoteToAttach('${type}', '${leadName}', ${index})">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong>Quote #${quote.quoteNumber || index + 1}</strong>
                            <span style="color: #10b981; font-weight: 500;">$${quote.premium || '0'}/mo</span>
                        </div>
                        <div style="color: #6b7280; font-size: 0.9em;">
                            <div>Coverage: $${quote.coverage || '0'}</div>
                            <div>Type: ${quote.type || 'Auto Insurance'}</div>
                            <div>Created: ${quote.date || new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(quoteModal);
}

function selectQuoteToAttach(type, leadName, quoteIndex) {
    // Close quote modal
    const quoteModal = document.querySelectorAll('.modal-overlay');
    if (quoteModal.length > 1) {
        quoteModal[quoteModal.length - 1].remove();
    }
    
    // Get the quote from either source
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.name === leadName);
    
    let quote;
    
    if (lead && lead.quotes && lead.quotes[quoteIndex]) {
        quote = lead.quotes[quoteIndex];
    } else {
        // Get from quotes storage
        const allQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
        const leadQuotes = allQuotes.filter(q => 
            q.leadName === leadName || 
            q.clientName === leadName
        );
        if (leadQuotes[quoteIndex]) {
            quote = leadQuotes[quoteIndex];
        }
    }
    
    if (!quote) return;
    const attachmentContainer = document.getElementById(type + 'Attachments');
    
    if (attachmentContainer) {
        // Create quote attachment display
        const quoteDiv = document.createElement('div');
        quoteDiv.style.cssText = `
            display: inline-flex;
            align-items: center;
            background: #dbeafe;
            padding: 5px 10px;
            border-radius: 4px;
            margin-right: 10px;
            margin-bottom: 5px;
            border: 1px solid #3b82f6;
        `;
        
        quoteDiv.innerHTML = `
            <i class="fas fa-file-invoice" style="margin-right: 5px; color: #3b82f6;"></i>
            <span style="margin-right: 5px;">Quote #${quote.quoteNumber || quoteIndex + 1} - ${leadName}</span>
            <small style="color: #1e40af; margin-right: 10px;">($${quote.premium}/mo)</small>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: #ef4444;
                cursor: pointer;
                padding: 0;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        attachmentContainer.appendChild(quoteDiv);
        
        // For SMS, add a note about the quote
        if (type === 'sms') {
            const messageField = document.getElementById('smsMessage');
            if (messageField) {
                const quoteText = `\n[Quote #${quote.quoteNumber || quoteIndex + 1}]`;
                if ((messageField.value.length + quoteText.length) <= 160) {
                    messageField.value += quoteText;
                    // Update character count
                    const charCount = document.querySelector('.char-count');
                    if (charCount) {
                        charCount.textContent = `${messageField.value.length} / 160 characters`;
                    }
                }
            }
        }
    }
}

function loadCarriersView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    // Get carriers from localStorage or use defaults
    let carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
    if (carriers.length === 0) {
        carriers = [
            { id: 1, name: 'Progressive', commission: '15%', products: 'Auto, Home', policies: 892, premium: '$1.2M', logo: 'https://via.placeholder.com/120x60', portalUrl: 'https://www.progressive.com/agent' },
            { id: 2, name: 'State Farm', commission: '12%', products: 'Auto, Home, Life', policies: 1245, premium: '$2.1M', logo: 'https://via.placeholder.com/120x60', portalUrl: 'https://www.statefarm.com/agent' },
            { id: 3, name: 'Liberty Mutual', commission: '14%', products: 'Commercial, GL', policies: 456, premium: '$3.5M', logo: 'https://via.placeholder.com/120x60', portalUrl: 'https://business.libertymutual.com' }
        ];
        localStorage.setItem('carriers', JSON.stringify(carriers));
    }
    
    dashboardContent.innerHTML = `
        <div class="carriers-view">
            <header class="content-header">
                <h1>Carrier Management</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="addCarrier()">
                        <i class="fas fa-plus"></i> Add Carrier
                    </button>
                </div>
            </header>
            
            <div class="carriers-grid">
                ${carriers.map(carrier => `
                <div class="carrier-card" data-carrier-id="${carrier.id}">
                    <div class="carrier-logo">
                        <img src="${carrier.logo}" alt="${carrier.name}">
                    </div>
                    <h3>${carrier.name}</h3>
                    <div class="carrier-info">
                        <div class="info-row">
                            <span>Commission:</span>
                            <strong>${carrier.commission}</strong>
                        </div>
                        <div class="info-row">
                            <span>Products:</span>
                            <strong>${carrier.products}</strong>
                        </div>
                        <div class="info-row">
                            <span>Active Policies:</span>
                            <strong>${carrier.policies}</strong>
                        </div>
                        <div class="info-row">
                            <span>YTD Premium:</span>
                            <strong>${carrier.premium}</strong>
                        </div>
                    </div>
                    <div class="carrier-actions">
                        <button class="btn-secondary" onclick="openCarrierPortal(${carrier.id})">Portal Login</button>
                        <button class="btn-secondary" onclick="viewCarrierDetails(${carrier.id})">View Details</button>
                        <button class="btn-icon" onclick="deleteCarrier(${carrier.id})" title="Delete Carrier" style="color: #ff4444; margin-left: 10px;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    `;
}

function loadProducersView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="producers-view">
            <header class="content-header">
                <h1>Producers & Team</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="addProducer()">
                        <i class="fas fa-user-plus"></i> Add Producer
                    </button>
                </div>
            </header>
            
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>License #</th>
                            <th>Clients</th>
                            <th>YTD Sales</th>
                            <th>Commission</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">JM</div>
                                    <span>James Miller</span>
                                </div>
                            </td>
                            <td>Senior Producer</td>
                            <td>LIC-123456</td>
                            <td>342</td>
                            <td>$450,000</td>
                            <td>$67,500</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <button class="btn-icon" onclick="editProducer(1, 'James Miller')"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" onclick="viewProducerStats(1, 'James Miller')"><i class="fas fa-chart-line"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">SJ</div>
                                    <span>Sarah Johnson</span>
                                </div>
                            </td>
                            <td>Producer</td>
                            <td>LIC-234567</td>
                            <td>256</td>
                            <td>$320,000</td>
                            <td>$48,000</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <button class="btn-icon" onclick="editProducer(2, 'Sarah Johnson')"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon" onclick="viewProducerStats(2, 'Sarah Johnson')"><i class="fas fa-chart-line"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadAnalyticsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="analytics-view">
            <header class="content-header">
                <h1>Analytics Dashboard</h1>
                <div class="header-actions">
                    <select class="filter-select" style="margin-right: 1rem;">
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>Year to Date</option>
                        <option>Last Year</option>
                    </select>
                    <button class="btn-secondary" onclick="exportAnalytics()">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                    <button class="btn-primary" onclick="refreshAnalytics()">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </header>
            
            <!-- KPI Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Total Premium</h3>
                        <span class="trend positive">+12.5%</span>
                    </div>
                    <div class="stat-value">$8.4M</div>
                    <div class="stat-chart">
                        <canvas id="premiumMiniChart"></canvas>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Policy Count</h3>
                        <span class="trend positive">+8.3%</span>
                    </div>
                    <div class="stat-value">5,234</div>
                    <div class="stat-chart">
                        <canvas id="policyMiniChart"></canvas>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Retention Rate</h3>
                        <span class="trend positive">+2.1%</span>
                    </div>
                    <div class="stat-value">94.2%</div>
                    <div class="stat-chart">
                        <canvas id="retentionMiniChart"></canvas>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Loss Ratio</h3>
                        <span class="trend negative">+5.2%</span>
                    </div>
                    <div class="stat-value">58.7%</div>
                    <div class="stat-chart">
                        <canvas id="lossMiniChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Charts Section -->
            <div class="charts-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="chart-card">
                    <h3>Premium Growth Trend</h3>
                    <canvas id="premiumTrendChart" style="max-height: 300px;"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Policy Distribution by Type</h3>
                    <canvas id="policyTypeChart" style="max-height: 300px;"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Top Performing Producers</h3>
                    <canvas id="producerChart" style="max-height: 300px;"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Carrier Performance</h3>
                    <canvas id="carrierChart" style="max-height: 300px;"></canvas>
                </div>
            </div>
            
            <!-- Detailed Metrics Table -->
            <div class="metrics-section" style="margin-top: 2rem;">
                <h3>Detailed Metrics</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Current Period</th>
                            <th>Previous Period</th>
                            <th>Change</th>
                            <th>YTD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>New Business Premium</td>
                            <td>$892,450</td>
                            <td>$756,320</td>
                            <td class="positive">+18.0%</td>
                            <td>$3,245,780</td>
                        </tr>
                        <tr>
                            <td>Renewal Premium</td>
                            <td>$1,456,890</td>
                            <td>$1,398,230</td>
                            <td class="positive">+4.2%</td>
                            <td>$5,123,450</td>
                        </tr>
                        <tr>
                            <td>Average Policy Size</td>
                            <td>$2,845</td>
                            <td>$2,650</td>
                            <td class="positive">+7.4%</td>
                            <td>$2,756</td>
                        </tr>
                        <tr>
                            <td>Quote-to-Bind Ratio</td>
                            <td>68.5%</td>
                            <td>65.2%</td>
                            <td class="positive">+3.3%</td>
                            <td>67.8%</td>
                        </tr>
                        <tr>
                            <td>Client Acquisition Cost</td>
                            <td>$245</td>
                            <td>$278</td>
                            <td class="positive">-11.9%</td>
                            <td>$256</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Initialize analytics charts after DOM is ready
    setTimeout(() => {
        initializeAnalyticsCharts();
    }, 100);
}

function loadIntegrationsView() {
    // Use the configuration view if available
    if (window.loadIntegrationsConfig) {
        window.loadIntegrationsConfig();
        return;
    }
    
    // Use the new integrations view if available
    if (window.loadIntegrationsViewNew) {
        window.loadIntegrationsViewNew();
        return;
    }
    
    // Fallback - just show loading message
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    dashboardContent.innerHTML = `
        <div class="integrations-view">
            <header class="content-header">
                <h1>Integrations</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="addIntegration()">
                        <i class="fas fa-plus"></i> Add Integration
                    </button>
                </div>
            </header>
            <div style="text-align: center; padding: 3rem;">
                <p>Click 'Add Integration' to get started</p>
            </div>
        </div>
    `;
}

function loadSettingsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
        <div class="settings-view">
            <header class="content-header">
                <h1>Settings</h1>
            </header>
            
            <div class="settings-grid">
                <div class="settings-section">
                    <h3>Agency Information</h3>
                    <div class="form-group">
                        <label>Agency Name</label>
                        <input type="text" class="form-control" value="Vanguard Insurance Group">
                    </div>
                    <div class="form-group">
                        <label>License Number</label>
                        <input type="text" class="form-control" value="AGY-789012">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <input type="text" class="form-control" value="123 Insurance Ave, Suite 100">
                    </div>
                    <button class="btn-primary">Save Changes</button>
                </div>
                
                <div class="settings-section">
                    <h3>Integration Settings</h3>
                    <div class="integration-list">
                        <div class="integration-item">
                            <span>ACORD Forms</span>
                            <button class="btn-secondary">Configure</button>
                        </div>
                        <div class="integration-item">
                            <span>Email Integration</span>
                            <button class="btn-secondary">Configure</button>
                        </div>
                        <div class="integration-item">
                            <span>Document Management</span>
                            <button class="btn-secondary">Configure</button>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>User Preferences</h3>
                    <div class="form-group">
                        <label>Default View</label>
                        <select class="form-control">
                            <option>Dashboard</option>
                            <option>Clients</option>
                            <option>Policies</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Email Notifications</label>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <button class="btn-primary">Save Preferences</button>
                </div>
            </div>
        </div>
    `;
}

function loadRenewalsData() {
    console.log('Loading renewals data...');
    // This would load renewal-specific view
}

function loadClaimsData() {
    console.log('Loading claims data...');
    // This would load claims-specific view
}

function generateReports() {
    console.log('Generating reports...');
    loadReportsView();
}

// Additional Helper Functions for All Views

// Client Management Helper Functions
function generateClientPoliciesList(policies) {
    if (!policies || policies.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                <p style="font-size: 16px; margin: 0;">No policies found</p>
                <p style="font-size: 14px; margin-top: 8px;">Click "Add Policy" to create a new policy</p>
            </div>
        `;
    }
    
    return policies.map((policy, index) => {
        // Get the policy type label
        const typeLabel = getPolicyTypeLabel(policy.policyType || policy.type || 'unknown');

        // Get the business name from Named Insured tab (highest priority)
        let businessName = '';
        if (policy.insured?.['Name/Business Name']) {
            businessName = policy.insured['Name/Business Name'];
        } else if (policy.insured?.['Primary Named Insured']) {
            businessName = policy.insured['Primary Named Insured'];
        } else if (policy.namedInsured?.name) {
            businessName = policy.namedInsured.name;
        } else if (policy.clientName && policy.clientName !== 'N/A' && policy.clientName !== 'Unknown') {
            businessName = policy.clientName;
        }

        // Get the premium value from various possible locations
        const premiumValue = policy.financial?.['Annual Premium'] ||
                            policy.financial?.['Premium'] ||
                            policy.financial?.['Monthly Premium'] ||
                            policy.premium ||
                            policy.monthlyPremium ||
                            policy.annualPremium || 0;

        // Format the premium for display
        let formattedPremium = '0';
        if (premiumValue) {
            if (typeof premiumValue === 'number') {
                formattedPremium = premiumValue.toLocaleString();
            } else if (typeof premiumValue === 'string') {
                // Remove formatting characters and parse
                const cleanValue = premiumValue.replace(/[$,\s]/g, '');
                const numValue = parseFloat(cleanValue);
                if (!isNaN(numValue)) {
                    formattedPremium = numValue.toLocaleString();
                }
            }
        }

        // Format status
        const status = policy.policyStatus || policy.status || 'Active';
        const statusClass = getStatusClass(status);

        return `
            <div class="policy-item">
                <div class="policy-header">
                    <span class="policy-number">${policy.policyNumber || `POL-${Date.now()}-${index}`}</span>
                    <span class="status-badge ${statusClass}">${formatStatus(status)}</span>
                </div>
                <div class="policy-details">
                    <p><strong>${typeLabel}</strong></p>
                    ${businessName ? `<p style="color: #6b7280; font-size: 13px; margin: 2px 0;">${businessName}</p>` : ''}
                    <p>${policy.carrier || 'N/A'} • $${formattedPremium}/year</p>
                    <p>Expires: ${formatDate(policy.expirationDate) || 'N/A'}</p>
                </div>
                <div class="policy-actions">
                    <button class="btn-small" onclick="viewPolicy('${policy.id || policy.policyNumber}')">View Details</button>
                    <button class="btn-small" onclick="renewPolicy('${policy.id || policy.policyNumber}')">Renew</button>
                    <button class="btn-small" onclick="confirmDeletePolicy('${policy.id || policy.policyNumber}', '${policy.policyNumber}', '${window.currentViewingClientId || ''}')" style="background: #dc2626; color: white;">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function addPolicyToClient(clientId) {
    // Store the client ID globally for the policy modal to use
    window.currentClientId = clientId;
    window.currentViewingClientId = clientId; // Also store as viewing client ID

    // Get client data
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id == clientId);

    if (!client) {
        showNotification('Client not found', 'error');
        return;
    }

    // Store client info for policy creation
    window.currentClientInfo = client;

    // Use the same policy modal as the main policies tab
    if (typeof showPolicyModal === 'function') {
        showPolicyModal();

        // Update the modal to show it's for a specific client
        setTimeout(() => {
            const modalHeader = document.querySelector('.modal-header h2');
            if (modalHeader) {
                modalHeader.innerHTML = `Create New Policy for ${client.name}`;
            }

            // DON'T override the save function - let the modal handle it
            // The policy-modal.js already handles client ID and will redirect back
        }, 100);
    } else {
        console.error('Policy modal script not loaded');
        showNotification('Policy creation feature not available', 'error');
    }
}

function savePolicyForClient(clientId) {
    // This function saves the policy data from the tabbed modal and links it to the client
    
    // Get the policy data from the modal (using the same structure as savePolicy in policy-modal.js)
    const policyData = collectPolicyData();
    
    if (!policyData) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Add client link and generate policy number
    policyData.clientId = clientId;
    policyData.id = Date.now();
    policyData.policyNumber = policyData.policyNumber || `POL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    policyData.createdAt = new Date().toISOString();
    
    // Get clients and update the specific client
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const clientIndex = clients.findIndex(c => c.id == clientId);
    
    if (clientIndex === -1) {
        showNotification('Client not found', 'error');
        return;
    }
    
    // Add policy to client
    if (!clients[clientIndex].policies) {
        clients[clientIndex].policies = [];
    }
    clients[clientIndex].policies.push(policyData);
    
    // Update total premium
    const premium = policyData.financial?.['Annual Premium'] || policyData.premium || 0;
    clients[clientIndex].totalPremium = clients[clientIndex].policies.reduce((sum, p) => {
        const pPremium = p.financial?.['Annual Premium'] || p.premium || 0;
        return sum + (typeof pPremium === 'string' ? parseFloat(pPremium.replace(/[$,]/g, '')) || 0 : pPremium);
    }, 0);
    
    // Save updated clients
    localStorage.setItem('insurance_clients', JSON.stringify(clients));
    
    // Also save to global policies list (use insurance_policies for consistency)
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Add client name to policy data for display
    policyData.clientName = clients[clientIndex].name;
    policyData.insured = policyData.insured || {};
    policyData.insured['Name/Business Name'] = clients[clientIndex].name;
    
    policies.push(policyData);
    localStorage.setItem('insurance_policies', JSON.stringify(policies));
    
    // Close modal
    closePolicyModal();
    
    // Restore original save function
    if (window.originalSavePolicy) {
        window.savePolicy = window.originalSavePolicy;
        delete window.originalSavePolicy;
    }
    
    // Show success notification
    showNotification(`Policy ${policyData.policyNumber} added successfully!`, 'success');
    
    // Refresh the client view
    viewClient(clientId);
}

function collectPolicyData() {
    // Collect all the policy data from the tabbed form
    // This mirrors the structure used in policy-modal.js
    
    const data = {
        ...currentPolicyData, // Basic policy info from initial creation
        insured: {},
        contact: {},
        coverage: {},
        financial: {},
        vehicles: [],
        drivers: [],
        property: {},
        operations: {},
        documents: [],
        notes: {}
    };
    
    // Collect data from each active tab
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        if (!tab) return;

        const tabId = tab.id?.replace('-content', '');

        switch(tabId) {
            case 'overview':
                // Collect overview fields and update base policy data
                const overviewFields = {
                    'overview-policy-number': 'policyNumber',
                    'overview-carrier': 'carrier',
                    'overview-status': 'policyStatus',
                    'overview-effective-date': 'effectiveDate',
                    'overview-expiration-date': 'expirationDate',
                    'overview-premium': 'premium',
                    'overview-agent': 'agent'
                };

                Object.entries(overviewFields).forEach(([fieldId, dataKey]) => {
                    const field = document.getElementById(fieldId);
                    if (field && field.value) {
                        data[dataKey] = field.value;
                        if (dataKey === 'carrier') {
                            console.log('Collecting carrier:', field.value);
                        }
                    }
                });
                break;

            case 'insured':
                tab.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.id && field.value) {
                        const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.id;
                        data.insured[fieldName] = field.value;
                    }
                });
                break;
                
            case 'contact':
                tab.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.id && field.value) {
                        const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.id;
                        data.contact[fieldName] = field.value;
                    }
                });
                break;
                
            case 'coverage':
                tab.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.id && field.value) {
                        const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.id;
                        data.coverage[fieldName] = field.value;
                    }
                });
                break;
                
            case 'financial':
                tab.querySelectorAll('input, select, textarea').forEach(field => {
                    if (field.id && field.value) {
                        const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.id;
                        data.financial[fieldName] = field.value;
                    }
                });
                break;
                
            case 'vehicles':
                // Collect vehicle and trailer data for commercial auto
                const vehicleEntries = tab.querySelectorAll('.vehicle-entry');
                vehicleEntries.forEach(entry => {
                    const vehicle = {};
                    const inputs = entry.querySelectorAll('input, select');
                    
                    // Map fields based on their position and placeholder
                    inputs.forEach((field, index) => {
                        if (field.value) {
                            // Map placeholders to proper field names
                            let fieldName = field.placeholder || '';
                            
                            // Clean up field names
                            if (fieldName.includes('Year')) fieldName = 'Year';
                            else if (fieldName.includes('Make')) fieldName = 'Make';
                            else if (fieldName.includes('Model')) fieldName = 'Model';
                            else if (fieldName.includes('VIN')) fieldName = 'VIN';
                            else if (fieldName.includes('Value')) fieldName = 'Value';
                            else if (fieldName.includes('Deductible')) fieldName = 'Deductible';
                            else if (field.tagName === 'SELECT') fieldName = 'Coverage';
                            
                            vehicle[fieldName] = field.value;
                        }
                    });
                    
                    if (Object.keys(vehicle).length > 0) {
                        vehicle.Type = 'Vehicle';
                        data.vehicles.push(vehicle);
                    }
                });
                
                // Collect trailer data separately
                const trailerEntries = tab.querySelectorAll('.trailer-entry');
                trailerEntries.forEach(entry => {
                    const trailer = {};
                    const inputs = entry.querySelectorAll('input');
                    
                    inputs.forEach((field, index) => {
                        if (field.value) {
                            // Map placeholders to proper field names
                            let fieldName = field.placeholder || '';
                            
                            if (fieldName.includes('Year')) fieldName = 'Year';
                            else if (fieldName.includes('Make')) fieldName = 'Make';
                            else if (fieldName.includes('Type')) fieldName = 'Trailer Type';
                            else if (fieldName.includes('VIN')) fieldName = 'VIN';
                            else if (fieldName.includes('Length')) fieldName = 'Length';
                            else if (fieldName.includes('Value')) fieldName = 'Value';
                            else if (fieldName.includes('Deductible')) fieldName = 'Deductible';
                            
                            trailer[fieldName] = field.value;
                        }
                    });
                    
                    if (Object.keys(trailer).length > 0) {
                        trailer.Type = 'Trailer';
                        data.vehicles.push(trailer);
                    }
                });
                break;
                
            case 'drivers':
                // Collect driver data
                const driverEntries = tab.querySelectorAll('.driver-entry');
                driverEntries.forEach(entry => {
                    const driver = {};
                    entry.querySelectorAll('input, select').forEach(field => {
                        if (field.value) {
                            const fieldName = field.previousElementSibling?.textContent?.replace(' *', '') || field.placeholder || 'unknown';
                            driver[fieldName] = field.value;
                        }
                    });
                    // Collect endorsements for CDL drivers
                    const endorsements = [];
                    entry.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                        endorsements.push(checkbox.parentElement.textContent.trim());
                    });
                    if (endorsements.length > 0) {
                        driver.endorsements = endorsements;
                    }
                    if (Object.keys(driver).length > 0) {
                        data.drivers.push(driver);
                    }
                });
                break;
                
            case 'notes':
                const notesField = tab.querySelector('textarea');
                if (notesField && notesField.value) {
                    data.notes.content = notesField.value;
                }
                break;
        }
    });
    
    return data;
}

// Make collectPolicyData available globally
window.collectPolicyData = collectPolicyData;

function renewPolicy(policyId) {
    console.log('Renewing policy:', policyId);
    showNotification('Policy renewal feature coming soon!', 'info');
}

// Policy Delete Functions
function confirmDeletePolicy(policyId, policyNumber, clientId) {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'deleteConfirmModal';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 500px;">
            <div class="modal-header" style="background: #dc2626;">
                <h2 style="color: white;">Confirm Delete</h2>
                <button class="close-btn" onclick="document.getElementById('deleteConfirmModal').remove()" style="color: white;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 30px;">
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc2626; margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">Are you sure you want to delete this policy?</h3>
                    <p style="color: #6b7280; margin-bottom: 20px;">Policy Number: <strong>${policyNumber}</strong></p>
                    <p style="color: #dc2626; font-weight: 500;">This action cannot be undone!</p>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; justify-content: center; padding: 20px;">
                <button class="btn-secondary" onclick="document.getElementById('deleteConfirmModal').remove()">
                    Cancel
                </button>
                <button class="btn-primary" onclick="deletePolicy('${policyId}', '${clientId || ''}')" style="background: #dc2626; border-color: #dc2626;">
                    <i class="fas fa-trash"></i> Delete Policy
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function deletePolicy(policyId, clientId) {
    // Remove the confirmation modal
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.remove();

    // First try to delete from server via DataSync
    if (window.DataSync && window.DataSync.deletePolicy) {
        const success = await window.DataSync.deletePolicy(policyId);
        if (success) {
            console.log('Policy deleted from server via DataSync');
            showNotification('Policy deleted successfully!', 'success');

            // Refresh the view
            if (window.location.hash === '#policies') {
                loadPoliciesView();
            }
            if (clientId) {
                const clientModal = document.getElementById('clientProfileModal');
                if (clientModal) {
                    viewClient(clientId);
                }
            }
            return;
        }
    }

    // Fallback to local deletion if server fails
    // Get policies from localStorage
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Convert policyId to string for comparison
    const idStr = String(policyId);

    // Filter out the policy to delete
    const initialCount = policies.length;
    policies = policies.filter(p => {
        // Check various ID formats
        if (String(p.id) === idStr) return false;
        if (p.policyNumber === idStr) return false;
        if (p.policyNumber && p.policyNumber.includes(idStr)) return false;
        if (p.policyNumber && p.policyNumber.endsWith(idStr)) return false;
        return true;
    });

    // Check if a policy was actually deleted
    if (policies.length === initialCount) {
        showNotification('Policy not found', 'error');
        return;
    }

    // Save updated policies
    localStorage.setItem('insurance_policies', JSON.stringify(policies));
    
    // Also update clients' policies arrays if needed
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    clients.forEach(client => {
        if (client.policies && Array.isArray(client.policies)) {
            client.policies = client.policies.filter(p => {
                if (String(p.id) === idStr) return false;
                if (p.policyNumber === idStr) return false;
                return true;
            });
        }
    });
    localStorage.setItem('insurance_clients', JSON.stringify(clients));
    
    // Show success notification
    showNotification('Policy deleted successfully', 'success');
    
    // Refresh the current view
    // Use the passed clientId if available, otherwise try to determine from context
    const refreshClientId = clientId || window.currentViewingClientId;
    
    if (refreshClientId) {
        // Refresh the client view
        viewClient(refreshClientId);
    } else if (window.location.hash === '#policies') {
        // If we're in the policies view, refresh it
        loadPoliciesView();
    } else {
        // Try to detect if we're in a client view
        const clientProfileView = document.querySelector('.client-profile-view');
        if (clientProfileView) {
            // Try to find client ID from localStorage by matching policies
            const allClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            for (const client of allClients) {
                if (client.policies && client.policies.some(p => p.id === policyId || p.policyNumber === policyId)) {
                    viewClient(client.id);
                    return;
                }
            }
            // Fallback: reload the page if we can't determine the client
            location.reload();
        }
    }
}

// Client Management Functions
async function viewClient(id) {
    console.log('🔍 ViewClient called with ID:', id, 'Type:', typeof id);
    // Store the current client ID globally for other functions to use
    window.currentViewingClientId = id;

    // Get actual client data from API first, then localStorage as fallback
    let client = null;

    try {
        const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';
        console.log('📡 Fetching clients from:', `${API_URL}/api/clients`);
        const response = await fetch(`${API_URL}/api/clients`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (response.ok) {
            const clients = await response.json();
            console.log('📋 API returned', clients.length, 'clients');
            console.log('🔍 Looking for client with ID:', id);
            console.log('🔍 Available client IDs:', clients.map(c => c.id).slice(0, 5));

            client = clients.find(c => {
                console.log('🔍 Comparing:', c.id, '==', id, '?', c.id == id);
                return c.id == id;
            });

            if (client) {
                console.log(`✅ Found client from API:`, client.name);
            } else {
                console.log(`❌ Client ${id} not found in API response`);
            }
        } else {
            console.log('❌ API response not ok:', response.status);
        }
    } catch (error) {
        console.warn('❌ API error, falling back to localStorage:', error);
    }

    // Fallback to localStorage if API failed
    if (!client) {
        console.log('🔄 Falling back to localStorage...');
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        console.log('💾 LocalStorage has', clients.length, 'clients');
        console.log('💾 LocalStorage client IDs:', clients.map(c => c.id).slice(0, 5));

        client = clients.find(c => {
            console.log('💾 Comparing localStorage:', c.id, '==', id, '?', c.id == id);
            return c.id == id;
        });

        if (client) {
            console.log(`✅ Found client in localStorage:`, client.name);
        } else {
            console.log(`❌ Client ${id} not found in localStorage either`);
        }
    }

    if (!client) {
        console.log('❌ CLIENT NOT FOUND ANYWHERE - Showing error and reloading clients view');
        showNotification('Client not found', 'error');
        await loadClientsView();
        return;
    } else {
        console.log('✅ CLIENT FOUND! Proceeding to show profile for:', client.name);
    }
    
    // Get all policies for this client from insurance_policies storage
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Filter policies that belong to this client
    // Check by client ID, client name, or insured name
    const clientPolicies = allPolicies.filter(policy => {
        // Check if policy has a clientId that matches
        if (policy.clientId && String(policy.clientId) === String(id)) return true;
        
        // Check if the insured name matches the client name
        const insuredName = policy.insured?.['Name/Business Name'] || 
                           policy.insured?.['Primary Named Insured'] || 
                           policy.insuredName;
        if (insuredName && client.name && insuredName.toLowerCase() === client.name.toLowerCase()) return true;
        
        // Check if policy is in the client's policies array (by ID or policy number)
        if (client.policies && Array.isArray(client.policies)) {
            return client.policies.some(p => {
                if (typeof p === 'string') {
                    return p === policy.id || p === policy.policyNumber;
                }
                if (typeof p === 'object' && p) {
                    return p.id === policy.id || p.policyNumber === policy.policyNumber;
                }
                return false;
            });
        }
        
        return false;
    });
    
    // Calculate total premium from all client policies
    let calculatedTotalPremium = 0;
    clientPolicies.forEach(policy => {
        // Get premium value from various possible locations
        const premiumValue = policy.financial?.['Annual Premium'] || 
                            policy.financial?.['Premium'] || 
                            policy.financial?.['Monthly Premium'] ||
                            policy.premium || 
                            policy.monthlyPremium ||
                            policy.annualPremium || 0;
        
        // Convert to number and add to total
        const numericPremium = typeof premiumValue === 'string' ? 
            parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 : 
            parseFloat(premiumValue) || 0;
        
        // If it's monthly, multiply by 12 for annual
        if (policy.financial?.['Monthly Premium'] || policy.monthlyPremium) {
            calculatedTotalPremium += numericPremium * 12;
        } else {
            calculatedTotalPremium += numericPremium;
        }
    });
    
    // Format client data for display
    const clientData = {
        name: client.name,
        type: client.type || 'Personal',
        phone: client.phone,
        email: client.email,
        address: client.address || 'No address on file',
        company: client.company || '',
        accountManager: client.accountManager || 'Unassigned',
        clientSince: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A',
        totalPremium: calculatedTotalPremium > 0 ? `$${calculatedTotalPremium.toLocaleString()}/yr` : '$0/yr',
        policies: clientPolicies, // Use the filtered policies from insurance_policies
        quotes: client.quotes || [],
        claims: client.claims || [],
        notes: client.notes || client.conversionNotes || 'No notes on file',
        convertedFrom: client.convertedFrom || null
    };
    
    // Load the client profile view
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
                    <button class="btn-secondary" onclick="editClient('${id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary" onclick="addPolicyToClient('${id}')">
                        <i class="fas fa-file-contract"></i> Add Policy
                    </button>
                    <button class="btn-primary" onclick="showNewQuote()">
                        <i class="fas fa-plus"></i> New Quote
                    </button>
                </div>
            </header>
            
            <div class="client-profile-grid">
                <!-- Client Information Card -->
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="profile-avatar">${clientData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                        <div class="profile-title">
                            <h2>${clientData.name}</h2>
                            ${clientData.company ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">${clientData.company}</p>` : ''}
                            <span class="badge badge-${clientData.type === 'Commercial' ? 'purple' : 'blue'}">${clientData.type}</span>
                            ${clientData.convertedFrom === 'lead' ? '<span class="badge badge-green" style="margin-left: 8px;">Converted Lead</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Contact Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Phone</label>
                                <p>${clientData.phone}</p>
                            </div>
                            <div class="info-item">
                                <label>Email</label>
                                <p>${clientData.email}</p>
                            </div>
                            <div class="info-item">
                                <label>Address</label>
                                <p>${clientData.address}</p>
                            </div>
                            <div class="info-item">
                                <label>Assigned To</label>
                                <p>${clientData.assignedTo || clientData.accountManager || 'Unassigned'}</p>
                            </div>
                            ${clientData.representative ? `
                            <div class="info-item">
                                <label>Representative</label>
                                <p>${clientData.representative}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Account Details</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Client Since</label>
                                <p>${clientData.clientSince}</p>
                            </div>
                            <div class="info-item">
                                <label>Total Premium</label>
                                <p class="text-primary">${clientData.totalPremium}</p>
                            </div>
                            <div class="info-item">
                                <label>Active Policies</label>
                                <p>${clientData.policies.length}</p>
                            </div>
                            <div class="info-item">
                                <label>Claims History</label>
                                <p>${clientData.claims.length} claims</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Notes</h3>
                        <p class="notes-text">${clientData.notes}</p>
                    </div>
                </div>
                
                <!-- Policies Section -->
                <div class="profile-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Active Policies</h3>
                        <button class="btn-primary" onclick="addPolicyToClient('${id}')" style="padding: 8px 16px; font-size: 14px;">
                            <i class="fas fa-plus"></i> Add Policy
                        </button>
                    </div>
                    <div class="policies-list">
                        ${generateClientPoliciesList(clientData.policies)}
                        ${client.policies > 1 ? `
                        <div class="policy-item">
                            <div class="policy-header">
                                <span class="policy-number">POL-2024-0389</span>
                                <span class="status-badge active">Active</span>
                            </div>
                            <div class="policy-details">
                                <p><strong>${client.type === 'Commercial Auto' ? 'Cargo Insurance' : client.type === 'Commercial' ? 'Property' : 'Homeowners'}</strong></p>
                                <p>Liberty Mutual • $${client.type === 'Commercial Auto' ? '8,000' : client.type === 'Commercial' ? '4,300' : '900'}/year</p>
                                <p>Expires: 03/20/2025</p>
                            </div>
                            <div class="policy-actions">
                                <button class="btn-small">View Details</button>
                                <button class="btn-small">Renew</button>
                                <button class="btn-small" style="background: #dc2626; color: white;">Delete</button>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="profile-card">
                    <h3>Recent Activity</h3>
                    <div class="timeline">
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p><strong>Policy Renewed</strong></p>
                                <p class="text-muted">Auto Insurance policy renewed</p>
                                <span class="timeline-date">2 days ago</span>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p><strong>Payment Received</strong></p>
                                <p class="text-muted">Monthly premium payment of $${client.type === 'Commercial Auto' ? '3,750' : '287.50'}</p>
                                <span class="timeline-date">1 week ago</span>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p><strong>Quote Generated</strong></p>
                                <p class="text-muted">New quote for additional coverage</p>
                                <span class="timeline-date">2 weeks ago</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Documents Section -->
                <div class="profile-card">
                    <h3>Documents</h3>
                    <div class="documents-list">
                        <div class="document-item">
                            <i class="fas fa-file-pdf"></i>
                            <div class="document-info">
                                <p>Current Policy Declaration</p>
                                <span class="text-muted">Updated 1 month ago</span>
                            </div>
                            <button class="btn-icon"><i class="fas fa-download"></i></button>
                        </div>
                        <div class="document-item">
                            <i class="fas fa-file-pdf"></i>
                            <div class="document-info">
                                <p>Insurance ID Cards</p>
                                <span class="text-muted">Updated 2 months ago</span>
                            </div>
                            <button class="btn-icon"><i class="fas fa-download"></i></button>
                        </div>
                        <div class="document-item">
                            <i class="fas fa-file-alt"></i>
                            <div class="document-info">
                                <p>Application Form</p>
                                <span class="text-muted">Submitted ${client.clientSince}</span>
                            </div>
                            <button class="btn-icon"><i class="fas fa-download"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function editClient(id) {
    console.log('Editing client:', id);

    // Get client data from localStorage
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id == id);

    if (client) {
        // Update modal title
        const modalHeader = document.querySelector('#clientModal .modal-header h2');
        modalHeader.textContent = 'Edit Client';

        // Populate form fields
        const form = document.getElementById('newClientForm');

        // Split name into first and last name
        const nameParts = (client.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        form.querySelector('[name="firstName"]').value = firstName;
        form.querySelector('[name="lastName"]').value = lastName;
        form.querySelector('[name="clientEmail"]').value = client.email || '';
        form.querySelector('[name="clientPhone"]').value = client.phone || '';
        form.querySelector('[name="clientAddress"]').value = client.address || '';
        form.querySelector('[name="assignedTo"]').value = client.assignedTo || '';
        form.querySelector('[name="representative"]').value = client.representative || '';
        form.querySelector('[name="clientCity"]').value = client.city || '';
        form.querySelector('[name="clientState"]').value = client.state || '';
        form.querySelector('[name="clientZip"]').value = client.zip || '';

        // Store client ID for saving
        form.dataset.clientId = id;
        console.log('=== EDIT CLIENT DEBUG ===');
        console.log('Client ID stored for editing:', id, '(type:', typeof id, ')');
        console.log('Client data being edited:', client);
        console.log('========================');

        // Update submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Update Client';
    } else {
        console.error('Client not found:', id);
        alert('Client not found');
        return;
    }

    showModal('clientModal');
}

function emailClient(id) {
    console.log('Emailing client:', id);
    // Would open email compose modal
}

function updateClientAssignment(clientId, assignedTo) {
    console.log('Updating client assignment:', clientId, 'to', assignedTo);

    // Get clients from localStorage
    let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');

    // Find the client
    const clientIndex = clients.findIndex(c => String(c.id) === String(clientId));

    if (clientIndex === -1) {
        showNotification('Client not found', 'error');
        return;
    }

    // Update the assigned to field
    clients[clientIndex].assignedTo = assignedTo || '';

    // Save back to localStorage
    localStorage.setItem('insurance_clients', JSON.stringify(clients));

    // Update server if DataSync is available
    if (window.DataSync && window.DataSync.saveClient) {
        window.DataSync.saveClient(clients[clientIndex]);
    }

    showNotification(`Client assigned to ${assignedTo || 'Unassigned'}`, 'success');
}

function deleteClient(id) {
    // Get client data first to show their name
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id === id);
    
    if (!client) {
        alert('Client not found');
        return;
    }
    
    if (confirm(`Are you sure you want to delete client "${client.name}"? This action cannot be undone.`)) {
        // Remove client from array
        const updatedClients = clients.filter(c => c.id !== id);
        
        // Save updated clients list
        localStorage.setItem('insurance_clients', JSON.stringify(updatedClients));
        
        // Show success notification
        showNotification(`Client "${client.name}" has been deleted successfully`, 'success');
        
        // Reload the clients view
        loadClientsView();
        
        // Update dashboard stats if needed
        if (window.DashboardStats) {
            const dashboardStats = new DashboardStats();
            dashboardStats.updateDashboard();
        }
    }
}

function importClients() {
    console.log('Importing clients');
    // Would open import wizard
}

function filterClients() {
    const searchValue = document.getElementById('clientSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#clientsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? '' : 'none';
    });
}

// Policy Management Functions
function viewPolicy(policyId) {
    console.log('Viewing policy:', policyId);
    
    // Get policy from localStorage (use insurance_policies)
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    // Convert policyId to string for comparison
    const idStr = String(policyId);
    
    // Try to find policy by ID, policy number, or even just the number part
    let policy = policies.find(p => {
        // Check exact ID match
        if (String(p.id) === idStr) return true;
        // Check policy number match
        if (p.policyNumber === idStr) return true;
        // Check if the ID is just a number and matches part of the policy number
        if (p.policyNumber && p.policyNumber.includes(idStr)) return true;
        // Check if the policy number ends with the provided ID
        if (p.policyNumber && p.policyNumber.endsWith(idStr)) return true;
        return false;
    });
    
    if (!policy) {
        console.error('Policy not found. Looking for ID:', policyId);
        console.error('Available policies:', policies.map(p => ({ id: p.id, policyNumber: p.policyNumber })));
        showNotification('Policy not found', 'error');
        return;
    }
    
    // Show the policy details in a tabbed modal
    showPolicyDetailsModal(policy);
}

function showPolicyDetailsModal(policy) {
    const policyType = policy.policyType || 'general';
    
    // Generate tabs based on policy type
    const tabs = generateViewTabsForPolicyType(policyType);
    
    // Create modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.id = 'policyViewModal';
    
    // Determine policy type label for header badge
    const policyTypeLabel = policyType === 'commercial-auto' ? 'Commercial Auto' :
                            policyType === 'personal-auto' ? 'Personal Auto' :
                            policyType ? policyType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
    
    modalOverlay.innerHTML = `
        <div class="modal-container large" style="max-width: 1400px; width: 92%; padding: 0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border-radius: 12px;">
            <div class="modal-header" style="padding: 32px 40px; border-bottom: 2px solid #e5e7eb; background: linear-gradient(135deg, #0066cc 0%, #004999 100%);">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    ${policyTypeLabel ? `<span class="policy-type-badge" style="background: rgba(255, 255, 255, 0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(255, 255, 255, 0.3);">${policyTypeLabel}</span>` : ''}
                    <h2 style="margin: 0; color: white; font-size: 28px; font-weight: 600; letter-spacing: -0.025em;">Policy Details - ${policy.policyNumber}</h2>
                </div>
                <button class="close-btn" onclick="document.getElementById('policyViewModal').remove()" style="background: rgba(255, 255, 255, 0.9); border: 2px solid white; color: #0066cc; font-size: 24px; font-weight: bold; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 75vh; overflow-y: auto; padding: 40px; background: #ffffff;">
                <!-- Policy Status Bar -->
                <div style="background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%); padding: 24px 30px; border-radius: 12px; margin-bottom: 35px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);">
                    <div>
                        <span class="status-badge ${(policy.policyStatus || policy.status || 'active').toLowerCase()}" style="margin-right: 15px; padding: 10px 18px; font-size: 14px; border-radius: 6px; font-weight: 500;">
                            ${policy.policyStatus || policy.status || 'Active'}
                        </span>
                        <span style="margin-left: 10px; color: #6b7280; font-size: 15px; font-weight: 500;">
                            <i class="fas fa-building"></i> ${policy.carrier || 'N/A'}
                        </span>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-secondary" onclick="editPolicy('${policy.id || policy.policyNumber}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; transition: all 0.2s;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-secondary" onclick="printPolicy('${policy.id || policy.policyNumber}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; transition: all 0.2s;">
                            <i class="fas fa-print"></i> Print
                        </button>
                    </div>
                </div>
                
                <!-- Tab Navigation -->
                <div class="policy-tabs" style="margin-bottom: 30px; padding: 5px; background: #f3f4f6; border-radius: 10px;">
                    ${tabs.map((tab, index) => `
                        <button class="tab-btn ${index === 0 ? 'active' : ''}" data-tab="${tab.id}" onclick="switchViewTab('${tab.id}')" style="padding: 14px 24px; font-size: 14px; border-radius: 8px; transition: all 0.2s; margin: 2px;">
                            <i class="${tab.icon}" style="margin-right: 6px;"></i> ${tab.name}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Tab Contents -->
                <div class="tab-contents" style="padding: 35px; background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                    ${tabs.map((tab, index) => `
                        <div id="${tab.id}-view-content" class="tab-content ${index === 0 ? 'active' : ''}" style="padding: 15px;">
                            ${generateViewTabContent(tab.id, policy)}
                        </div>
                    `).join('')}
                </div>

                <!-- Modal Footer with Action Buttons -->
                <div class="modal-footer" style="padding: 25px 40px; border-top: 2px solid #e5e7eb; background: #f9fafb; border-radius: 0 0 12px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 15px;">
                        <button class="btn-secondary" onclick="editPolicy('${policy.id}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; background: #fff; border: 2px solid #d1d5db; color: #374151; font-weight: 500;">
                            <i class="fas fa-edit"></i> Edit Policy
                        </button>
                        <button class="btn-danger" onclick="deletePolicy('${policy.id}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; background: #fff; border: 2px solid #ef4444; color: #ef4444; font-weight: 500;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <button class="btn-primary" onclick="prepareCOI('${policy.id}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; border: none; font-weight: 500;">
                            <i class="fas fa-file-alt"></i> Generate COI
                        </button>
                        <button class="btn-primary" onclick="openCertificateHolderModal('${policy.id}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border: none; font-weight: 500;">
                            <i class="fas fa-user-shield"></i> Save to Certificate Holder
                        </button>
                        <button class="btn-primary" onclick="sendCOIRequest('${policy.id}')" style="padding: 12px 24px; font-size: 14px; border-radius: 8px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; border: none; font-weight: 500;">
                            <i class="fas fa-envelope"></i> Send COI Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);
}

function generateViewTabsForPolicyType(policyType) {
    const baseTabs = [
        { id: 'overview', name: 'Overview', icon: 'fas fa-info-circle' },
        { id: 'insured', name: 'Named Insured', icon: 'fas fa-user' },
        { id: 'contact', name: 'Contact Info', icon: 'fas fa-address-book' },
        { id: 'coverage', name: 'Coverage', icon: 'fas fa-shield-alt' },
        { id: 'financial', name: 'Financial', icon: 'fas fa-dollar-sign' },
        { id: 'documents', name: 'Documents', icon: 'fas fa-file-alt' },
        { id: 'notes', name: 'Notes', icon: 'fas fa-sticky-note' }
    ];
    
    // Add type-specific tabs
    if (policyType === 'personal-auto' || policyType === 'commercial-auto') {
        baseTabs.splice(4, 0, 
            { id: 'vehicles', name: 'Vehicles', icon: 'fas fa-car' },
            { id: 'drivers', name: 'Drivers', icon: 'fas fa-id-card' }
        );
    } else if (policyType === 'homeowners' || policyType === 'commercial-property') {
        baseTabs.splice(4, 0, 
            { id: 'property', name: 'Property', icon: 'fas fa-home' }
        );
    }
    
    return baseTabs;
}

function generateViewTabContent(tabId, policy) {
    switch(tabId) {
        case 'overview':
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Policy Overview</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Policy Number</label>
                            <p style="font-size: 17px; font-weight: 600; margin: 0; color: #111827;">${policy.policyNumber || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Policy Type</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${getPolicyTypeLabel(policy.policyType) || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Carrier</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${policy.carrier || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Status</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">
                                <span class="status-badge ${(policy.policyStatus || 'active').toLowerCase()}">
                                    ${policy.policyStatus || 'Active'}
                                </span>
                            </p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Effective Date</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${formatDate(policy.effectiveDate) || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Expiration Date</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${formatDate(policy.expirationDate) || 'N/A'}</p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Premium</label>
                            <p style="font-size: 17px; margin: 0; color: #374151; font-weight: 600;">
                                ${formatPolicyPremium(policy.premium)}
                            </p>
                        </div>
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Agent</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${policy.agent || 'N/A'}</p>
                        </div>
                        ${(() => {
                            // Get business name from Named Insured tab first, then fallback to clientName
                            const businessName = policy.insured?.['Name/Business Name'] ||
                                                policy.insured?.['Primary Named Insured'] ||
                                                policy.namedInsured?.name ||
                                                policy.clientName;
                            return businessName ? `
                        <div class="view-item">
                            <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Business Name</label>
                            <p style="font-size: 17px; margin: 0; color: #374151;">${businessName}</p>
                        </div>
                            ` : '';
                        })()}
                    </div>
                </div>
            `;
            
        case 'insured':
            const insuredData = policy.insured || {};
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Named Insured Information</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        ${Object.entries(insuredData).map(([key, value]) => `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                <p style="font-size: 17px; margin: 0; color: #374151;">${value || 'N/A'}</p>
                            </div>
                        `).join('')}
                        ${Object.keys(insuredData).length === 0 ? '<p style="color: #6b7280;">No insured information available</p>' : ''}
                    </div>
                </div>
            `;
            
        case 'contact':
            const contactData = policy.contact || {};
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Contact Information</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        ${Object.entries(contactData).map(([key, value]) => `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                <p style="font-size: 17px; margin: 0; color: #374151;">${value || 'N/A'}</p>
                            </div>
                        `).join('')}
                        ${Object.keys(contactData).length === 0 ? '<p style="color: #6b7280;">No contact information available</p>' : ''}
                    </div>
                </div>
            `;
            
        case 'vehicles':
            const vehicles = Array.isArray(policy.vehicles) ? policy.vehicles : [];
            if (vehicles.length === 0) {
                return `
                    <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                        <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Vehicles & Trailers</h3>
                        <p style="color: #6b7280; font-size: 16px;">No vehicles or trailers on this policy</p>
                    </div>
                `;
            }
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Vehicles & Trailers</h3>
                    ${vehicles.map((vehicle, index) => `
                        <div style="background: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                            <h4 style="margin-top: 0; color: #374151;">
                                ${vehicle.Type === 'Trailer' ? 'Trailer' : 'Vehicle'} ${index + 1}
                            </h4>
                            <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                ${Object.entries(vehicle).map(([key, value]) => `
                                    <div class="view-item">
                                        <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                        <p style="font-size: 14px; margin: 0;">${value || 'N/A'}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'drivers':
            const drivers = Array.isArray(policy.drivers) ? policy.drivers : [];
            if (drivers.length === 0) {
                return `
                    <div class="form-section" style="padding: 20px; background: #f9fafb; border-radius: 8px;">
                        <h3 style="margin-top: 0; margin-bottom: 25px; color: #111827; font-size: 20px;">Drivers</h3>
                        <p style="color: #6b7280; font-size: 15px;">No drivers on this policy</p>
                    </div>
                `;
            }
            return `
                <div class="form-section" style="padding: 20px; background: #f9fafb; border-radius: 8px;">
                    <h3 style="margin-top: 0; margin-bottom: 25px; color: #111827; font-size: 20px;">Drivers</h3>
                    ${drivers.map((driver, index) => `
                        <div style="background: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                            <h4 style="margin-top: 0; color: #374151;">Driver ${index + 1}</h4>
                            <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                ${Object.entries(driver).filter(([key]) => key !== 'endorsements').map(([key, value]) => `
                                    <div class="view-item">
                                        <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                        <p style="font-size: 14px; margin: 0;">${value || 'N/A'}</p>
                                    </div>
                                `).join('')}
                                ${driver.endorsements ? `
                                    <div class="view-item" style="grid-column: span 2;">
                                        <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Endorsements</label>
                                        <p style="font-size: 14px; margin: 0;">${driver.endorsements.join(', ')}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'coverage':
            const coverageData = policy.coverage || {};
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Coverage Details</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        ${Object.entries(coverageData).map(([key, value]) => `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                <p style="font-size: 17px; margin: 0; font-weight: 600; color: #059669;">${value || 'N/A'}</p>
                            </div>
                        `).join('')}
                        ${Object.keys(coverageData).length === 0 ? '<p style="color: #6b7280;">No coverage information available</p>' : ''}
                    </div>
                </div>
            `;
            
        case 'financial':
            const financialData = policy.financial || {};
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Financial Information</h3>
                    <div class="view-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 35px;">
                        ${Object.entries(financialData).map(([key, value]) => `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">${key}</label>
                                <p style="font-size: 17px; margin: 0; ${key.toLowerCase().includes('premium') ? 'font-weight: 600; color: #2563eb;' : 'color: #374151;'}">${value || 'N/A'}</p>
                            </div>
                        `).join('')}
                        ${Object.keys(financialData).length === 0 ? `
                            <div class="view-item">
                                <label style="color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em;">Annual Premium</label>
                                <p style="font-size: 16px; margin: 0; font-weight: 600; color: #2563eb;">${policy.premium ? `$${policy.premium}` : 'N/A'}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
        case 'documents':
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Policy Documents</h3>
                    <p style="color: #6b7280; font-size: 16px; margin-bottom: 25px;">No documents uploaded for this policy</p>
                    <button class="btn-secondary" style="margin-top: 20px; padding: 12px 24px; font-size: 14px; border-radius: 8px;">
                        <i class="fas fa-upload"></i> Upload Document
                    </button>
                </div>
            `;
            
        case 'notes':
            const notes = policy.notes?.content || policy.notes || '';
            return `
                <div class="form-section" style="padding: 30px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 12px; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; margin-bottom: 30px; color: #111827; font-size: 22px; font-weight: 600;">Policy Notes</h3>
                    <div style="background: #ffffff; padding: 30px; border-radius: 12px; min-height: 150px; border: 2px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                        <p style="margin: 0; white-space: pre-wrap; font-size: 16px; line-height: 1.6; color: #374151;">${notes || 'No notes for this policy'}</p>
                    </div>
                </div>
            `;
            
        default:
            return '<p>No information available for this section</p>';
    }
}

function switchViewTab(tabId) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('#policyViewModal .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('#policyViewModal .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`#policyViewModal .tab-btn[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`${tabId}-view-content`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

function getPolicyTypeBadgeColor(policyType) {
    if (policyType === 'commercial-auto') return 'orange';
    if (policyType?.includes('commercial')) return 'purple';
    if (policyType?.includes('life')) return 'green';
    return 'blue';
}

function getPolicyTypeLabel(policyType) {
    const labels = {
        'personal-auto': 'Personal Auto',
        'commercial-auto': 'Commercial Auto',
        'homeowners': 'Homeowners',
        'commercial-property': 'Commercial Property',
        'general-liability': 'General Liability',
        'professional-liability': 'Professional Liability',
        'workers-comp': 'Workers Compensation',
        'umbrella': 'Umbrella',
        'life': 'Life',
        'health': 'Health'
    };
    return labels[policyType] || policyType || 'General';
}


function editPolicy(policyId) {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const idStr = String(policyId);
    const policy = policies.find(p => String(p.id) === idStr || p.policyNumber === idStr);
    
    if (policy) {
        // Open the policy modal in edit mode with the existing policy data
        if (typeof showPolicyModal === 'function') {
            showPolicyModal(policy);
        } else {
            showNotification('Edit feature coming soon', 'info');
        }
    } else {
        showNotification('Policy not found', 'error');
    }
}

async function deletePolicy(policyId) {
    if (confirm('Are you sure you want to delete this policy?')) {
        // First try to delete from server via DataSync
        if (window.DataSync && window.DataSync.deletePolicy) {
            const success = await window.DataSync.deletePolicy(policyId);
            if (success) {
                console.log('Policy deleted from server via DataSync');

                // Close modal
                const modal = document.getElementById('policyViewModal');
                if (modal) modal.remove();

                showNotification('Policy deleted successfully', 'success');

                // Refresh current view
                if (document.querySelector('.policies-view')) {
                    loadPoliciesView();
                }
                return;
            }
        }

        // Fallback to local deletion if server fails
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const idStr = String(policyId);
        const updatedPolicies = policies.filter(p => String(p.id) !== idStr && p.policyNumber !== idStr);
        localStorage.setItem('insurance_policies', JSON.stringify(updatedPolicies));

        // Close modal
        const modal = document.getElementById('policyViewModal');
        if (modal) modal.remove();

        showNotification('Policy deleted successfully (server sync pending)', 'warning');

        // Refresh current view
        if (document.querySelector('.policies-view')) {
            loadPoliciesView();
        }
    }
}



function printPolicy(policyId) {
    console.log('Printing policy:', policyId);
    window.print();
}

function downloadPolicy(policyId) {
    console.log('Downloading policy:', policyId);
    showNotification('Preparing policy documents for download...', 'info');
}

function showNewPolicy() {
    // Use the new tabbed policy modal from policy-modal.js
    if (typeof showPolicyModal === 'function') {
        showPolicyModal();
    } else {
        console.error('Policy modal script not loaded');
    }
}

// Policy modal functions have been moved to policy-modal.js
// The new implementation includes tabbed organization and enhanced vehicle/trailer fields

function generatePolicyRows() {
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Get current user and check if they are admin
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
            console.log(`🔍 Policy filtering - Current user: ${currentUser}, Is Admin: ${isAdmin}`);
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Filter policies based on user role
    if (!isAdmin && currentUser) {
        const originalCount = policies.length;
        policies = policies.filter(policy => {
            const assignedTo = policy.assignedTo ||
                              policy.agent ||
                              policy.assignedAgent ||
                              policy.producer ||
                              'Grant'; // Default to Grant if no assignment
            return assignedTo.toLowerCase() === currentUser.toLowerCase();
        });
        console.log(`🔒 Filtered policies: ${originalCount} -> ${policies.length} (showing only ${currentUser}'s policies)`);
    } else if (isAdmin) {
        console.log(`👑 Admin user - showing all ${policies.length} policies`);
    }

    if (policies.length === 0) {
        // Show message when no policies exist
        return `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px; margin: 0;">No policies found</p>
                    <p style="font-size: 14px; margin-top: 8px;">Click "New Policy" to create your first policy</p>
                </td>
            </tr>
        `;
    }
    
    // Generate rows for actual saved policies
    return policies.map(policy => {
        // Ensure policy type is available - check multiple possible locations
        const policyType = policy.policyType || policy.type || (policy.overview && policy.overview['Policy Type'] ?
            policy.overview['Policy Type'].toLowerCase().replace(/\s+/g, '-') : 'unknown');
        const typeLabel = getPolicyTypeLabel(policyType);
        const badgeClass = getBadgeClass(policyType);
        // Check if policy is expired based on expiration date
        let statusClass = getStatusClass(policy.policyStatus || policy.status);
        let displayStatus = policy.policyStatus || policy.status || 'Active';

        // Override status if policy has expired
        if (policy.expirationDate) {
            const today = new Date();
            const expirationDate = new Date(policy.expirationDate);

            if (expirationDate < today) {
                statusClass = 'pending'; // This will map to orange styling
                displayStatus = 'UPDATE POLICY';
            }
        }
        // Check multiple possible locations for the premium
        const premiumValue = policy.financial?.['Annual Premium'] ||
                            policy.financial?.['Premium'] ||
                            policy.financial?.['Monthly Premium'] ||
                            policy.premium ||
                            policy.monthlyPremium ||
                            policy.annualPremium ||
                            0;

        // Format the premium value
        const premium = typeof premiumValue === 'number' ?
                       `$${premiumValue.toLocaleString()}` :
                       (premiumValue?.toString().startsWith('$') ? premiumValue : `$${premiumValue || '0.00'}`);

        // Get client name - PRIORITY 1: Named Insured from form, PRIORITY 2: clientName, PRIORITY 3: client profile
        let clientName = 'N/A';

        // PRIORITY 1: Check Named Insured tab data first (most accurate)
        if (policy.insured?.['Name/Business Name']) {
            clientName = policy.insured['Name/Business Name'];
        } else if (policy.insured?.['Primary Named Insured']) {
            clientName = policy.insured['Primary Named Insured'];
        } else if (policy.namedInsured?.name) {
            clientName = policy.namedInsured.name;
        } else if (policy.clientName && policy.clientName !== 'N/A' && policy.clientName !== 'Unknown' && policy.clientName !== 'unknown') {
            // PRIORITY 2: Use existing clientName if it's valid
            clientName = policy.clientName;
        } else if (policy.clientId) {
            // PRIORITY 3: Look up client by ID as fallback
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const client = clients.find(c => c.id === policy.clientId);
            if (client) {
                clientName = client.name || client.companyName || client.businessName || 'N/A';
            }
        }

        // Use policy.id, or fallback to policyNumber if id is missing
        const policyId = policy.id || policy.policyNumber || 'unknown';

        if (!policy.id) {
            console.warn('⚠️ Policy missing ID field:', policy);
        }

        // Get assigned agent - check multiple possible locations
        const assignedTo = policy.assignedTo ||
                          policy.agent ||
                          policy.assignedAgent ||
                          policy.producer ||
                          'Grant';

        return `
            <tr>
                <td class="policy-number" style="padding-left: 20px;">${policy.policyNumber}</td>
                <td>${clientName}</td>
                <td>${policy.carrier}</td>
                <td>${formatDate(policy.effectiveDate)}</td>
                <td>${formatDate(policy.expirationDate)}</td>
                <td>${premium}/yr</td>
                <td>${assignedTo}</td>
                <td><span class="status-badge ${statusClass}">${displayStatus}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewPolicy('${policyId}')"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="editPolicy('${policyId}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="renewPolicy('${policyId}')"><i class="fas fa-sync"></i></button>
                        <button class="btn-icon btn-icon-danger" onclick="deletePolicy('${policyId}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getPolicyTypeLabel(type) {
    if (!type || type === 'unknown') return 'Unknown';
    
    // Normalize the type to lowercase for matching
    const normalizedType = type.toString().toLowerCase();
    
    const labels = {
        'personal-auto': 'Personal Auto',
        'commercial-auto': 'Commercial Auto',
        'homeowners': 'Homeowners',
        'commercial-property': 'Commercial Property',
        'general-liability': 'General Liability',
        'professional-liability': 'Professional',
        'workers-comp': 'Workers Comp',
        'workers-compensation': 'Workers Comp',
        'umbrella': 'Umbrella',
        'life': 'Life',
        'health': 'Health'
    };
    
    // Try to match the normalized type
    if (labels[normalizedType]) {
        return labels[normalizedType];
    }
    
    // If no match, capitalize the first letter of each word
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getBadgeClass(type) {
    if (!type) return 'badge-gray';
    const typeStr = type.toString().toLowerCase();
    if (typeStr.includes('commercial')) return 'badge-orange';
    if (typeStr.includes('auto')) return 'badge-blue';
    if (typeStr.includes('home')) return 'badge-green';
    if (typeStr.includes('liability')) return 'badge-purple';
    return 'badge-gray';
}

function getStatusClass(status) {
    if (!status) return 'active'; // Default to active if no status
    const statusLower = status.toLowerCase();
    if (statusLower === 'active' || statusLower === 'in-force') return 'active';
    if (statusLower === 'pending') return 'pending';
    if (statusLower === 'expired' || statusLower === 'cancelled' || statusLower === 'non-renewed') return 'pending'; // Use pending class for orange styling
    return 'active';
}

function formatStatus(status) {
    if (!status) return 'Active';
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}


function exportPolicies() {
    console.log('Exporting policies');
    showNotification('Exporting policies to CSV...', 'info');
}

// Rating Engine Functions
function runRating() {
    const resultsSection = document.getElementById('ratingResults');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = `
            <h3>Available Quotes</h3>
            <div class="carrier-quotes">
                <div class="quote-result">
                    <div class="carrier-name">Progressive</div>
                    <div class="quote-premium">$1,245/year</div>
                    <button class="btn-primary">Select</button>
                </div>
                <div class="quote-result">
                    <div class="carrier-name">State Farm</div>
                    <div class="quote-premium">$1,189/year</div>
                    <button class="btn-primary">Select</button>
                </div>
                <div class="quote-result">
                    <div class="carrier-name">Liberty Mutual</div>
                    <div class="quote-premium">$1,367/year</div>
                    <button class="btn-primary">Select</button>
                </div>
            </div>
        `;
    }
}

function loadQuoteTemplate() {
    console.log('Loading quote template');
    // Would populate form with template data
}

// Accounting Functions
function runReconciliation() {
    console.log('Running reconciliation');
    showNotification('Reconciliation started', 'info');
}

function createInvoice() {
    console.log('Creating invoice');
    // Would open invoice creation modal
}

// Reports Functions
function runReport(type) {
    console.log('Running report:', type);
    showNotification(`Generating ${type} report...`, 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification('Report generated successfully', 'success');
    }, 2000);
}

function scheduleReport() {
    console.log('Scheduling report');
    // Would open scheduling modal
}

function createCustomReport() {
    console.log('Creating custom report');
    // Would open report builder
}

// Communications Functions
function createTemplate() {
    console.log('Creating template');
    // Would open template editor
}

function composeCampaign() {
    console.log('Composing campaign');
    // Would open campaign composer
}

// Carrier Functions
// Carrier Management Functions
function addCarrier() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>Add New Carrier</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <form id="addCarrierForm">
                    <div class="form-group">
                        <label>Carrier Name</label>
                        <input type="text" id="carrierName" required>
                    </div>
                    <div class="form-group">
                        <label>Commission Rate (%)</label>
                        <input type="text" id="carrierCommission" placeholder="e.g., 15%" required>
                    </div>
                    <div class="form-group">
                        <label>Products</label>
                        <input type="text" id="carrierProducts" placeholder="e.g., Auto, Home, Life" required>
                    </div>
                    <div class="form-group">
                        <label>Portal URL</label>
                        <input type="url" id="carrierPortal" placeholder="https://..." required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Add Carrier</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('addCarrierForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
        const newCarrier = {
            id: Date.now(),
            name: document.getElementById('carrierName').value,
            commission: document.getElementById('carrierCommission').value,
            products: document.getElementById('carrierProducts').value,
            policies: 0,
            premium: '$0',
            logo: 'https://via.placeholder.com/120x60',
            portalUrl: document.getElementById('carrierPortal').value
        };
        carriers.push(newCarrier);
        localStorage.setItem('carriers', JSON.stringify(carriers));
        modal.remove();
        loadCarriersView();
        showNotification('Carrier added successfully!', 'success');
    });
}

function deleteCarrier(carrierId) {
    if (confirm('Are you sure you want to delete this carrier?')) {
        let carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
        carriers = carriers.filter(c => c.id !== carrierId);
        localStorage.setItem('carriers', JSON.stringify(carriers));
        loadCarriersView();
        showNotification('Carrier deleted successfully!', 'success');
    }
}

function openCarrierPortal(carrierId) {
    const carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
    const carrier = carriers.find(c => c.id === carrierId);
    if (carrier && carrier.portalUrl) {
        window.open(carrier.portalUrl, '_blank');
    } else {
        showNotification('Portal URL not configured for this carrier', 'warning');
    }
}

function viewCarrierDetails(carrierId) {
    const carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
    const carrier = carriers.find(c => c.id === carrierId);
    if (!carrier) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 600px;">
            <div class="modal-header">
                <h2>${carrier.name} Details</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="carrier-detail-grid">
                    <div class="detail-row">
                        <label>Carrier Name:</label>
                        <span>${carrier.name}</span>
                    </div>
                    <div class="detail-row">
                        <label>Commission Rate:</label>
                        <span>${carrier.commission}</span>
                    </div>
                    <div class="detail-row">
                        <label>Products:</label>
                        <span>${carrier.products}</span>
                    </div>
                    <div class="detail-row">
                        <label>Active Policies:</label>
                        <span>${carrier.policies}</span>
                    </div>
                    <div class="detail-row">
                        <label>YTD Premium:</label>
                        <span>${carrier.premium}</span>
                    </div>
                    <div class="detail-row">
                        <label>Portal URL:</label>
                        <span><a href="${carrier.portalUrl}" target="_blank">${carrier.portalUrl}</a></span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="editCarrier(${carrier.id})">Edit</button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function editCarrier(carrierId) {
    const carriers = JSON.parse(localStorage.getItem('carriers') || '[]');
    const carrier = carriers.find(c => c.id === carrierId);
    if (!carrier) return;
    
    // Close any existing modal
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>Edit ${carrier.name}</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <form id="editCarrierForm">
                    <div class="form-group">
                        <label>Carrier Name</label>
                        <input type="text" id="editCarrierName" value="${carrier.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Commission Rate</label>
                        <input type="text" id="editCarrierCommission" value="${carrier.commission}" required>
                    </div>
                    <div class="form-group">
                        <label>Products</label>
                        <input type="text" id="editCarrierProducts" value="${carrier.products}" required>
                    </div>
                    <div class="form-group">
                        <label>Portal URL</label>
                        <input type="url" id="editCarrierPortal" value="${carrier.portalUrl}" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editCarrierForm').addEventListener('submit', function(e) {
        e.preventDefault();
        carrier.name = document.getElementById('editCarrierName').value;
        carrier.commission = document.getElementById('editCarrierCommission').value;
        carrier.products = document.getElementById('editCarrierProducts').value;
        carrier.portalUrl = document.getElementById('editCarrierPortal').value;
        
        localStorage.setItem('carriers', JSON.stringify(carriers));
        modal.remove();
        loadCarriersView();
        showNotification('Carrier updated successfully!', 'success');
    });
}

// Producer Functions
function addProducer() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>Add New Producer</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <form id="addProducerForm">
                    <div class="form-group" style="text-align: center;">
                        <label>Profile Picture</label>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin: 1rem 0;">
                            <div class="user-avatar" id="previewAvatar" style="width: 80px; height: 80px; min-width: 80px; min-height: 80px; font-size: 1.5rem;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('avatarUpload').click()">
                                    <i class="fas fa-upload"></i> Upload Photo
                                </button>
                                <button type="button" class="btn-secondary" onclick="selectAvatarColor(0)">
                                    <i class="fas fa-palette"></i> Choose Color
                                </button>
                                <input type="file" id="avatarUpload" accept="image/*" style="display: none;" onchange="previewAvatar(event)">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="producerName" required onkeyup="updateAvatarInitials(this.value)">
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="producerRole" required>
                            <option value="">Select Role</option>
                            <option value="Producer">Producer</option>
                            <option value="Senior Producer">Senior Producer</option>
                            <option value="Account Manager">Account Manager</option>
                            <option value="CSR">CSR</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>License Number</label>
                        <input type="text" id="producerLicense" placeholder="LIC-XXXXXX" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="producerEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="producerPhone" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Add Producer</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('addProducerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Producer added successfully!', 'success');
        modal.remove();
        loadProducersView();
    });
}

function editProducer(id, name) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>Edit Producer: ${name}</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <form id="editProducerForm">
                    <div class="form-group" style="text-align: center;">
                        <label>Profile Picture</label>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin: 1rem 0;">
                            <div class="user-avatar" id="previewAvatar" style="width: 80px; height: 80px; min-width: 80px; min-height: 80px; font-size: 1.5rem;">
                                ${name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('avatarUpload').click()">
                                    <i class="fas fa-upload"></i> Upload Photo
                                </button>
                                <button type="button" class="btn-secondary" onclick="selectAvatarColor(${id})">
                                    <i class="fas fa-palette"></i> Change Color
                                </button>
                                <input type="file" id="avatarUpload" accept="image/*" style="display: none;" onchange="previewAvatar(event)">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="producerName" value="${name}" required onkeyup="updateAvatarInitials(this.value)">
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="producerRole" required>
                            <option value="Producer" ${id === 2 ? 'selected' : ''}>Producer</option>
                            <option value="Senior Producer" ${id === 1 ? 'selected' : ''}>Senior Producer</option>
                            <option value="Account Manager">Account Manager</option>
                            <option value="CSR">CSR</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>License Number</label>
                        <input type="text" id="producerLicense" value="LIC-${id === 1 ? '123456' : '234567'}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="producerEmail" value="${name.toLowerCase().replace(' ', '.')}@vanguardins.com" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="producerPhone" value="(555) ${id === 1 ? '123-4567' : '234-5678'}" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editProducerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Producer updated successfully!', 'success');
        modal.remove();
        loadProducersView();
    });
}

// Avatar helper functions
function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatar = document.getElementById('previewAvatar');
            avatar.style.backgroundImage = `url(${e.target.result})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.innerHTML = ''; // Clear initials when image is set
        };
        reader.readAsDataURL(file);
    }
}

function updateAvatarInitials(name) {
    const avatar = document.getElementById('previewAvatar');
    if (!avatar.style.backgroundImage || avatar.style.backgroundImage === 'none') {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatar.innerHTML = initials;
    }
}

function selectAvatarColor(producerId) {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ];
    
    const colorModal = document.createElement('div');
    colorModal.className = 'modal-overlay active';
    colorModal.style.zIndex = '10001'; // Higher than parent modal
    colorModal.innerHTML = `
        <div class="modal-container" style="max-width: 400px;">
            <div class="modal-header">
                <h2>Select Avatar Color</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 1rem;">
                    ${colors.map((color, index) => `
                        <div 
                            style="width: 60px; height: 60px; background: ${color}; border-radius: 50%; cursor: pointer; transition: transform 0.2s;"
                            onclick="applyAvatarColor('${color.replace(/'/g, "\\'")}'); this.closest('.modal-overlay').remove();"
                            onmouseover="this.style.transform='scale(1.1)'"
                            onmouseout="this.style.transform='scale(1)'"
                        ></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(colorModal);
}

function applyAvatarColor(color) {
    const avatar = document.getElementById('previewAvatar');
    avatar.style.background = color;
    avatar.style.backgroundImage = 'none'; // Clear any uploaded image
    // Re-set initials if needed
    const nameInput = document.getElementById('producerName');
    if (nameInput && nameInput.value) {
        updateAvatarInitials(nameInput.value);
    }
}

function viewProducerStats(id, name) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 800px;">
            <div class="modal-header">
                <h2>${name} - Performance Stats</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <div class="stat-card">
                        <h4>YTD Sales</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">$${id === 1 ? '450,000' : '320,000'}</p>
                        <span style="color: green;">+${id === 1 ? '15' : '12'}% from last year</span>
                    </div>
                    <div class="stat-card">
                        <h4>Active Clients</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">${id === 1 ? '342' : '256'}</p>
                        <span style="color: green;">+${id === 1 ? '28' : '19'} this month</span>
                    </div>
                    <div class="stat-card">
                        <h4>Commission Earned</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #0066cc;">$${id === 1 ? '67,500' : '48,000'}</p>
                        <span style="color: green;">15% average rate</span>
                    </div>
                </div>
                
                <h3>Recent Activity</h3>
                <table class="data-table" style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Policy Type</th>
                            <th>Premium</th>
                            <th>Commission</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>12/28/2024</td>
                            <td>ABC Corp</td>
                            <td>Commercial Auto</td>
                            <td>$12,000</td>
                            <td>$1,800</td>
                        </tr>
                        <tr>
                            <td>12/27/2024</td>
                            <td>Johnson LLC</td>
                            <td>General Liability</td>
                            <td>$8,500</td>
                            <td>$1,275</td>
                        </tr>
                        <tr>
                            <td>12/26/2024</td>
                            <td>Smith Family</td>
                            <td>Auto + Home</td>
                            <td>$3,200</td>
                            <td>$480</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="modal-footer" style="margin-top: 2rem;">
                    <button class="btn-secondary" onclick="window.print()">Print Report</button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Analytics Functions
function initializeAnalyticsCharts() {
    // Premium Mini Chart
    const premiumMiniCtx = document.getElementById('premiumMiniChart');
    if (premiumMiniCtx) {
        new Chart(premiumMiniCtx, {
            type: 'line',
            data: {
                labels: ['W1', 'W2', 'W3', 'W4'],
                datasets: [{
                    data: [1.8, 2.1, 2.0, 2.3],
                    borderColor: '#0066cc',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
    
    // Premium Trend Chart
    const premiumTrendCtx = document.getElementById('premiumTrendChart');
    if (premiumTrendCtx) {
        new Chart(premiumTrendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Premium ($M)',
                    data: [6.2, 6.8, 7.1, 7.5, 7.9, 8.4],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Policy Type Chart
    const policyTypeCtx = document.getElementById('policyTypeChart');
    if (policyTypeCtx) {
        new Chart(policyTypeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Auto', 'Home', 'Commercial', 'Life', 'Other'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#0066cc',
                        '#4d94ff',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function exportAnalytics() {
    showNotification('Exporting analytics data...', 'info');
}

function refreshAnalytics() {
    showNotification('Refreshing analytics...', 'info');
    loadAnalyticsView();
}

// Integration Functions
function addIntegration() {
    openIntegrationMarketplace();
}

function openIntegrationMarketplace() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 1200px; height: 90vh;">
            <div class="modal-header">
                <h2>Integration Marketplace</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body" style="overflow-y: auto;">
                <div style="display: flex; gap: 2rem; margin-bottom: 2rem;">
                    <input type="text" id="integrationSearch" placeholder="Search integrations..." 
                           style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px;"
                           onkeyup="filterIntegrations(this.value)">
                    <select id="categoryFilter" onchange="filterByCategory(this.value)" 
                            style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="">All Categories</option>
                        <option value="Carriers">Carriers</option>
                        <option value="Dialer & Communication">Dialer & Communication</option>
                        <option value="Forms & Documents">Forms & Documents</option>
                        <option value="CRM & Sales">CRM & Sales</option>
                        <option value="Accounting">Accounting</option>
                        <option value="E-Signature">E-Signature</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Comparative Rating">Comparative Rating</option>
                        <option value="Agency Management">Agency Management</option>
                        <option value="Communication">Communication</option>
                        <option value="Data & Analytics">Data & Analytics</option>
                    </select>
                </div>
                
                <div id="integrationsList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
                    <!-- ViciBox/Vicidial -->
                    <div class="marketplace-card" data-category="Dialer & Communication" data-name="ViciBox">
                        <div class="card-header" style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 2rem;">📞</span>
                            <div>
                                <h3>ViciBox/Vicidial</h3>
                                <span class="category-badge">Dialer & Communication</span>
                            </div>
                        </div>
                        <p>Open-source contact center suite with predictive dialing, IVR, and call recording</p>
                        <div class="features-list" style="margin: 1rem 0;">
                            <span class="feature-tag">Predictive Dialing</span>
                            <span class="feature-tag">Call Recording</span>
                            <span class="feature-tag">Real-time Reporting</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #666;">Setup: 30 min</span>
                            <button class="btn-primary" onclick="setupIntegration('vicidial')">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                    
                    <!-- ACORD Forms -->
                    <div class="marketplace-card" data-category="Forms & Documents" data-name="ACORD">
                        <div class="card-header" style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 2rem;">📋</span>
                            <div>
                                <h3>ACORD Forms</h3>
                                <span class="category-badge">Forms & Documents</span>
                            </div>
                        </div>
                        <p>Industry-standard insurance forms with auto-fill capabilities</p>
                        <div class="features-list" style="margin: 1rem 0;">
                            <span class="feature-tag">125+ Forms</span>
                            <span class="feature-tag">Auto-fill</span>
                            <span class="feature-tag">E-signature Ready</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #666;">Setup: 10 min</span>
                            <button class="btn-primary" onclick="setupIntegration('acord')">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                    
                    <!-- More integrations will be loaded dynamically -->
                    ${window.integrationMarketplace ? window.integrationMarketplace.slice(2).map(integration => `
                        <div class="marketplace-card" data-category="${integration.category}" data-name="${integration.name}">
                            <div class="card-header" style="display: flex; align-items: center; gap: 1rem;">
                                <span style="font-size: 2rem;">${integration.icon}</span>
                                <div>
                                    <h3>${integration.name}</h3>
                                    <span class="category-badge">${integration.category}</span>
                                </div>
                            </div>
                            <p>${integration.description}</p>
                            <div class="features-list" style="margin: 1rem 0;">
                                ${integration.features.slice(0, 3).map(f => `<span class="feature-tag">${f}</span>`).join('')}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #666;">Setup: ${integration.setupTime}</span>
                                <button class="btn-primary" onclick="setupIntegration('${integration.id}')">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function removeIntegration(integrationId) {
    if (confirm('Are you sure you want to remove this integration?')) {
        let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
        activeIntegrations = activeIntegrations.filter(i => i.id !== integrationId);
        localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
        loadIntegrationsView();
        showNotification('Integration removed successfully', 'success');
    }
}

function disconnectIntegration(integrationId) {
    let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
    const integration = activeIntegrations.find(i => i.id === integrationId);
    if (integration) {
        integration.status = 'disconnected';
        localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
        loadIntegrationsView();
        showNotification('Integration disconnected', 'info');
    }
}

function reconnectIntegration(integrationId) {
    let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
    const integration = activeIntegrations.find(i => i.id === integrationId);
    if (integration) {
        integration.status = 'connected';
        integration.lastSync = 'Just now';
        localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
        loadIntegrationsView();
        showNotification('Integration reconnected successfully', 'success');
    }
}

function filterIntegrations(searchTerm) {
    const cards = document.querySelectorAll('.marketplace-card');
    cards.forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const category = card.dataset.category.toLowerCase();
        const match = name.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase());
        card.style.display = match ? 'block' : 'none';
    });
}

function filterByCategory(category) {
    const cards = document.querySelectorAll('.marketplace-card');
    cards.forEach(card => {
        const match = !category || card.dataset.category === category;
        card.style.display = match ? 'block' : 'none';
    });
}

function testIntegration(name) {
    showNotification(`Testing ${name} connection...`, 'info');
    setTimeout(() => {
        showNotification(`${name} connection successful!`, 'success');
    }, 2000);
}

function configureIntegration(integrationId) {
    if (integrationId === 'vicidial') {
        showViciDialConfiguration();
    } else {
        showNotification(`Opening ${integrationId} configuration...`, 'info');
    }
}

// Show ViciDial configuration modal
function showViciDialConfiguration() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'viciConfigModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Configure ViciDial Integration</h2>
                <button class="close-btn" onclick="closeModal('viciConfigModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div class="integration-header" style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 48px;">📞</span>
                        <div>
                            <h3>ViciDial API Connection</h3>
                            <p style="color: #666;">Automatically import sales leads from your ViciDial campaigns</p>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>API Configuration</h4>
                    <div class="form-group">
                        <label>ViciDial Server URL:</label>
                        <input type="text" id="viciUrl" class="form-control" 
                               placeholder="http://your-server/vicidial/non_agent_api.php"
                               value="${localStorage.getItem('vici_api_url') || ''}">
                        <small style="color: #666;">Enter your ViciDial server API endpoint</small>
                    </div>
                    <div class="form-group">
                        <label>API Username:</label>
                        <input type="text" id="viciUser" class="form-control" 
                               placeholder="Enter API username"
                               value="${localStorage.getItem('vici_api_user') || ''}">
                    </div>
                    <div class="form-group">
                        <label>API Password:</label>
                        <input type="password" id="viciPass" class="form-control" 
                               placeholder="Enter API password">
                    </div>
                </div>

                <div class="form-section">
                    <h4>Sync Settings</h4>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="autoSync" checked> 
                            Enable automatic synchronization
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Sync Interval (minutes):</label>
                        <select id="syncInterval" class="form-control">
                            <option value="5">Every 5 minutes</option>
                            <option value="10">Every 10 minutes</option>
                            <option value="15" selected>Every 15 minutes</option>
                            <option value="30">Every 30 minutes</option>
                            <option value="60">Every hour</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Import Lead Status:</label>
                        <div style="margin-top: 10px;">
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" checked disabled> SALE (Always imported)
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" id="importCallback"> CALLBACK
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" id="importInterested"> INTERESTED
                            </label>
                        </div>
                    </div>
                </div>

                <div id="connectionStatus" style="padding: 15px; background: #f9f9f9; border-radius: 8px; margin-top: 20px; display: none;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-spinner fa-spin" id="statusIcon"></i>
                        <span id="statusMessage">Testing connection...</span>
                    </div>
                </div>

                <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn-secondary" onclick="testViciConnection()">
                        <i class="fas fa-plug"></i> Test Connection
                    </button>
                    <button class="btn-primary" onclick="saveViciConfiguration()">
                        <i class="fas fa-save"></i> Save & Connect
                    </button>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <h4>Current Sync Status</h4>
                    <div id="syncStatus" style="margin-top: 15px;">
                        <!-- Sync status will be displayed here -->
                    </div>
                    <button class="btn-secondary" onclick="manualViciSync()" style="margin-top: 10px;">
                        <i class="fas fa-sync"></i> Manual Sync Now
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Load current sync status
    updateViciSyncStatus();
}

// Test ViciDial connection
async function testViciConnection() {
    const url = document.getElementById('viciUrl').value;
    const user = document.getElementById('viciUser').value;
    const pass = document.getElementById('viciPass').value;
    
    if (!url || !user || !pass) {
        showNotification('Please fill in all connection details', 'error');
        return;
    }
    
    const statusDiv = document.getElementById('connectionStatus');
    const statusIcon = document.getElementById('statusIcon');
    const statusMessage = document.getElementById('statusMessage');
    
    statusDiv.style.display = 'block';
    statusIcon.className = 'fas fa-spinner fa-spin';
    statusMessage.textContent = 'Testing connection...';
    
    // Test the connection - use proxy URL if available
    const proxyUrl = window.VICIDIAL_PROXY_URL || url;
    const result = await window.viciDialAPI.init({
        apiUrl: proxyUrl,
        apiUser: user,
        apiPass: pass
    });
    
    if (result.success) {
        statusIcon.className = 'fas fa-check-circle';
        statusIcon.style.color = '#10b981';
        statusMessage.textContent = 'Connection successful!';
        showNotification('ViciDial connection test successful!', 'success');
    } else {
        statusIcon.className = 'fas fa-exclamation-circle';
        statusIcon.style.color = '#ef4444';
        statusMessage.textContent = 'Connection failed. Please check your credentials.';
        showNotification('ViciDial connection test failed', 'error');
    }
}

// Save ViciDial configuration
async function saveViciConfiguration() {
    const url = document.getElementById('viciUrl').value;
    const user = document.getElementById('viciUser').value;
    const pass = document.getElementById('viciPass').value;
    const autoSync = document.getElementById('autoSync').checked;
    const syncInterval = parseInt(document.getElementById('syncInterval').value);
    
    if (!url || !user || !pass) {
        showNotification('Please fill in all connection details', 'error');
        return;
    }
    
    // Save configuration
    localStorage.setItem('vici_api_url', url);
    localStorage.setItem('vici_api_user', user);
    localStorage.setItem('vici_auto_sync', autoSync);
    localStorage.setItem('vici_sync_interval', syncInterval);
    
    // Initialize connection - use proxy URL if available
    const proxyUrl = window.VICIDIAL_PROXY_URL || url;
    const result = await window.viciDialAPI.init({
        apiUrl: proxyUrl,
        apiUser: user,
        apiPass: pass
    });
    
    if (result.success) {
        // Start auto-sync if enabled
        if (autoSync) {
            window.viciDialAPI.startAutoSync(syncInterval);
        }
        
        showNotification('ViciDial integration configured successfully!', 'success');
        closeModal('viciConfigModal');
        
        // Update integration status
        setupIntegration('vicidial');
    } else {
        showNotification('Failed to connect to ViciDial', 'error');
    }
}

// Manual sync from ViciDial
async function manualViciSync() {
    showNotification('Starting manual sync from ViciDial...', 'info');
    
    const result = await window.viciDialAPI.syncSalesLeads();
    
    if (result.success) {
        showNotification(`Imported ${result.imported} new leads from ViciDial`, 'success');
        updateViciSyncStatus();
    } else {
        showNotification('Sync failed: ' + result.error, 'error');
    }
}

// Update ViciDial sync status display
function updateViciSyncStatus() {
    const syncStatusDiv = document.getElementById('syncStatus');
    if (!syncStatusDiv) return;
    
    const status = window.viciDialAPI.getSyncStatus();
    
    syncStatusDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <label style="font-weight: 600;">Connection Status:</label>
                <p>${status.connected ? 
                    '<i class="fas fa-circle" style="color: #10b981;"></i> Connected' : 
                    '<i class="fas fa-circle" style="color: #ef4444;"></i> Disconnected'}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Auto-Sync:</label>
                <p>${status.autoSync ? 
                    '<i class="fas fa-check" style="color: #10b981;"></i> Enabled' : 
                    '<i class="fas fa-times" style="color: #999;"></i> Disabled'}</p>
            </div>
            <div>
                <label style="font-weight: 600;">Last Sync:</label>
                <p>${status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}</p>
            </div>
            <div>
                <label style="font-weight: 600;">API Server:</label>
                <p style="font-size: 12px; word-break: break-all;">${status.apiUrl || 'Not configured'}</p>
            </div>
        </div>
    `;
}

function setupIntegration(integrationId) {
    // Find the integration details
    const marketplaceData = {
        'vicidial': { name: 'ViciBox/Vicidial', icon: '📞', category: 'Dialer & Communication', description: 'Open-source contact center suite' },
        'acord': { name: 'ACORD Forms', icon: '📋', category: 'Forms & Documents', description: 'Industry-standard insurance forms' },
        'progressive': { name: 'Progressive', icon: '🏢', category: 'Carriers', description: 'Direct carrier integration' },
        'salesforce': { name: 'Salesforce CRM', icon: '☁️', category: 'CRM & Sales', description: 'Complete CRM integration' },
        'quickbooks': { name: 'QuickBooks', icon: '💰', category: 'Accounting', description: 'Automated bookkeeping' },
        'docusign': { name: 'DocuSign', icon: '✍️', category: 'E-Signature', description: 'Electronic signatures' }
    };
    
    const integration = marketplaceData[integrationId] || { name: integrationId, icon: '🔌' };
    
    // Get current active integrations
    let activeIntegrations = JSON.parse(localStorage.getItem('activeIntegrations') || '[]');
    
    // Check if already added
    if (activeIntegrations.find(i => i.id === integrationId)) {
        showNotification(`${integration.name} is already integrated`, 'warning');
        return;
    }
    
    // Add new integration
    activeIntegrations.push({
        id: integrationId,
        name: integration.name,
        status: 'connected',
        connectedDate: new Date().toLocaleDateString(),
        lastSync: 'Just now',
        stats: getIntegrationStats(integrationId)
    });
    
    localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
    
    // Close modal if open
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    
    // Reload integrations view
    loadIntegrationsView();
    
    showNotification(`${integration.name} added successfully!`, 'success');
}

function getIntegrationStats(integrationId) {
    const stats = {
        'vicidial': { label: 'Calls Today', value: '0' },
        'acord': { label: 'Forms Generated', value: '0' },
        'progressive': { label: 'Active Quotes', value: '0' },
        'salesforce': { label: 'Contacts Synced', value: '0' },
        'quickbooks': { label: 'Invoices', value: '0' },
        'docusign': { label: 'Documents Sent', value: '0' }
    };
    return stats[integrationId];
}

function syncNow(name) {
    showNotification(`Syncing ${name} data...`, 'info');
}

function connectIntegration(name) {
    showNotification(`Connecting to ${name}...`, 'info');
}

function learnMore(name) {
    showNotification(`Opening ${name} documentation...`, 'info');
}

function copyApiKey() {
    const apiKey = document.getElementById('apiKey').textContent;
    navigator.clipboard.writeText(apiKey);
    showNotification('API key copied to clipboard!', 'success');
}

function regenerateApiKey() {
    if (confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
        showNotification('New API key generated!', 'success');
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N = New Quote
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showNewQuote();
    }
    
    // Ctrl/Cmd + K = Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Implement search functionality
    }
    
    // ESC = Close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }
});

console.log('Vanguard Insurance Software initialized successfully!');

// Lead Generation Functions
function initializeLeadGeneration() {
    console.log('Initializing lead generation module');
    // Add event listeners for lead generation features
}

function switchLeadTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab items
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    const tabMap = {
        'profile': 'profileTab',
        'advanced': 'advancedTab',
        'carrier': 'carrierTab'
    };
    
    const selectedTab = document.getElementById(tabMap[tabName]);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Add active class to clicked tab
    event.target.closest('.tab-item').classList.add('active');
    
    // If switching to lookup tab, show some default results
    if (section === 'lookup') {
        setTimeout(() => {
            // Auto-populate with Ohio carriers by default
            const stateSearch = document.getElementById('stateSearch');
            if (stateSearch && !stateSearch.value) {
                stateSearch.value = 'OH';
                performLeadSearch();
            }
        }, 100);
    }
}

function performLeadSearch() {
    const usdot = document.getElementById('usdotSearch')?.value || '';
    const mc = document.getElementById('mcSearch')?.value || '';
    const company = document.getElementById('companySearch')?.value || '';
    const state = document.getElementById('stateSearch')?.value || '';
    
    // Show loading state
    const resultsBody = document.getElementById('leadResultsBody');
    if (resultsBody) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <i class="fas fa-spinner fa-spin"></i> Searching 2.2M carrier database...
                </td>
            </tr>
        `;
    }
    
    // Generate realistic results based on search criteria
    setTimeout(() => {
        let results = [];
        
        // Generate results based on search parameters
        if (state === 'OH' || (!state && !usdot && !mc && !company)) {
            // Ohio carriers or default search
            results = [
                {
                    usdot: '1234567',
                    company: 'ABC Trucking LLC',
                    location: 'Columbus, OH',
                    fleet: '15',
                    status: 'Active',
                    expiry: '2025-03-15'
                },
                {
                    usdot: '2345678',
                    company: 'XYZ Transport Inc',
                    location: 'Cleveland, OH',
                    fleet: '32',
                    status: 'Active',
                    expiry: '2025-01-20'
                },
                {
                    usdot: '3456789',
                    company: 'Quick Logistics Corp',
                    location: 'Cincinnati, OH',
                    fleet: '8',
                    status: 'Active',
                    expiry: '2025-05-01'
                },
                {
                    usdot: '4567890',
                    company: 'Eagle Carriers LLC',
                    location: 'Toledo, OH',
                    fleet: '25',
                    status: 'Active',
                    expiry: '2025-02-28'
                },
                {
                    usdot: '5678901',
                    company: 'Premier Shipping Co',
                    location: 'Akron, OH',
                    fleet: '12',
                    status: 'Active',
                    expiry: '2025-04-15'
                },
                {
                    usdot: '6789012',
                    company: 'Midwest Freight Solutions',
                    location: 'Dayton, OH',
                    fleet: '18',
                    status: 'Active',
                    expiry: '2025-03-30'
                },
                {
                    usdot: '7890123',
                    company: 'Ohio Valley Transport',
                    location: 'Youngstown, OH',
                    fleet: '22',
                    status: 'Active',
                    expiry: '2025-04-10'
                },
                {
                    usdot: '8901234',
                    company: 'Buckeye Express LLC',
                    location: 'Canton, OH',
                    fleet: '14',
                    status: 'Active',
                    expiry: '2025-02-15'
                }
            ];
        } else if (state) {
            // Other states
            const stateData = {
                'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
                'CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
                'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
                'NY': ['New York', 'Buffalo', 'Rochester', 'Albany']
            };
            
            const cities = stateData[state] || ['City A', 'City B', 'City C'];
            const companies = ['Regional Transport', 'Express Logistics', 'State Carriers', 'Local Freight'];
            
            for (let i = 0; i < 5; i++) {
                results.push({
                    usdot: Math.floor(Math.random() * 9000000 + 1000000).toString(),
                    company: `${companies[i % companies.length]} ${state}`,
                    location: `${cities[i % cities.length]}, ${state}`,
                    fleet: Math.floor(Math.random() * 50 + 5).toString(),
                    status: 'Active',
                    expiry: `2025-0${(i % 6) + 1}-${15 + i}`
                });
            }
        }
        
        // Filter by company name if provided
        if (company) {
            results = results.filter(r => 
                r.company.toLowerCase().includes(company.toLowerCase())
            );
        }
        
        // Filter by USDOT if provided
        if (usdot) {
            results = results.filter(r => r.usdot.includes(usdot));
        }
        
        // Filter by MC if provided
        if (mc) {
            results = results.filter(r => r.usdot.includes(mc));
        }
        
        displayLeadResults(results);
        
        // Update stats display
        const statsHtml = `
            <div style="background: #f0f9ff; border: 1px solid #0284c7; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem;">
                <strong>Database: </strong>2.2M carriers | 
                <strong>Ohio: </strong>51,296 | 
                <strong>With Insurance: </strong>600K+ | 
                <strong>Monthly Leads: </strong>5,129
            </div>
        `;
        
        const searchForm = document.querySelector('.search-form');
        if (searchForm && !document.querySelector('.db-stats')) {
            const statsDiv = document.createElement('div');
            statsDiv.className = 'db-stats';
            statsDiv.innerHTML = statsHtml;
            searchForm.parentNode.insertBefore(statsDiv, searchForm);
        }
    }, 1000);
}

function displayLeadResults(results) {
    const resultsBody = document.getElementById('leadResultsBody');
    const resultsCount = document.querySelector('.results-count');
    
    if (results.length === 0) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No results found. Try adjusting your search criteria.</td>
            </tr>
        `;
        resultsCount.textContent = '0 leads found';
        return;
    }
    
    resultsCount.textContent = `${results.length} leads found`;
    
    resultsBody.innerHTML = results.map(result => `
        <tr>
            <td><input type="checkbox" class="lead-checkbox" value="${result.usdot}"></td>
            <td class="font-mono">${result.usdot}</td>
            <td><strong>${result.company}</strong></td>
            <td>${result.location}</td>
            <td>${result.fleet} vehicles</td>
            <td>
                <span class="status-badge ${result.status === 'Active' ? 'status-active' : 'status-warning'}">
                    ${result.status}
                </span>
            </td>
            <td>${result.expiry}</td>
            <td>
                <button class="btn-small btn-icon" onclick="viewLeadDetails('${result.usdot}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-small btn-icon" onclick="contactLead('${result.usdot}')" title="Contact">
                    <i class="fas fa-envelope"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function clearLeadFilters() {
    document.getElementById('usdotSearch').value = '';
    document.getElementById('mcSearch').value = '';
    document.getElementById('companySearch').value = '';
    document.getElementById('stateSearch').value = '';
    
    // Clear checkboxes
    document.querySelectorAll('.checkbox-group input').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear results
    document.getElementById('leadResultsBody').innerHTML = `
        <tr>
            <td colspan="8" class="text-center">No results. Use the search form above to find leads.</td>
        </tr>
    `;
    document.querySelector('.results-count').textContent = '0 leads found';
}

function selectAllLeads(checkbox) {
    document.querySelectorAll('.lead-checkbox').forEach(cb => {
        cb.checked = checkbox.checked;
    });
}

function viewLeadDetails(usdot) {
    // Show lead details modal or navigate to details page
    alert(`View details for USDOT: ${usdot}`);
}

function contactLead(usdot) {
    // Open communication modal
    alert(`Contact lead with USDOT: ${usdot}`);
}

function exportLeads() {
    // Export selected leads
    const selected = document.querySelectorAll('.lead-checkbox:checked');
    if (selected.length === 0) {
        alert('Please select leads to export');
        return;
    }
    
    // Get the lead data from the table rows
    const exportData = [];
    selected.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const cells = row.querySelectorAll('td');
        
        exportData.push({
            usdot_number: cells[1].textContent.trim(),
            company_name: cells[2].textContent.trim(),
            location: cells[3].textContent.trim(),
            fleet_size: cells[4].textContent.replace(' vehicles', '').trim(),
            status: cells[5].textContent.trim(),
            expiry: cells[6].textContent.trim()
        });
    });
    
    // Create CSV content
    let csv = 'USDOT Number,Company Name,Location,Fleet Size,Status,Insurance Expiry\n';
    
    exportData.forEach(lead => {
        csv += `"${lead.usdot_number}","${lead.company_name}","${lead.location}","${lead.fleet_size}","${lead.status}","${lead.expiry}"\n`;
    });
    
    // Download the CSV file
    const timestamp = new Date().toISOString().split('T')[0];
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_leads_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    message.innerHTML = `
        <strong>✅ Export Successful!</strong><br>
        ${selected.length} leads exported to CSV
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

function searchLeads() {
    // Trigger search with current filters
    performLeadSearch();
}

function getGenerateLeadsContent() {
    return `
        <div class="generate-leads-container">
                <!-- Statistics Section - Always Visible at Top -->
                <div id="generatedLeadsResults" style="margin-bottom: 1rem;">
                    <div class="results-summary">
                        <div id="successMessage" style="display: none; margin-bottom: 0.75rem;">
                            <h3 style="color: #059669; font-size: 1.1rem;">
                                <i class="fas fa-check-circle"></i> Leads Generated Successfully!
                            </h3>
                        </div>
                        <div class="stats-row">
                            <div class="stat-box" style="background: #f0fdf4;">
                                <span style="color: #16a34a;">Total Leads Found</span>
                                <p style="font-weight: bold; color: #15803d;">
                                    <span id="totalLeadsCount">-</span>
                                </p>
                            </div>
                            <div class="stat-box" style="background: #fef3c7;">
                                <span style="color: #d97706;">Expiring Soon</span>
                                <p style="font-weight: bold; color: #d97706;">
                                    <span id="expiringSoonCount">-</span>
                                </p>
                            </div>
                            <div class="stat-box" style="background: #dbeafe;">
                                <span style="color: #2563eb;">With Contact Info</span>
                                <p style="font-weight: bold; color: #1d4ed8;">
                                    <span id="withContactCount">-</span>
                                </p>
                            </div>
                        </div>
                        <div class="export-options" style="margin-top: 0.75rem;">
                            <div class="export-buttons" style="display: flex; gap: 0.75rem; align-items: center;">
                                <span style="font-weight: 600; margin-right: 0.5rem;">Export:</span>
                                <button class="btn-success" onclick="exportGeneratedLeads('excel')" style="background: #10b981; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-excel"></i> Excel
                                </button>
                                <button class="btn-info" onclick="exportGeneratedLeads('json')" style="background: #3b82f6; color: white; padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-file-code"></i> JSON
                                </button>
                                <button class="btn-primary" onclick="viewGeneratedLeads()" style="padding: 8px 16px; font-size: 0.9rem;">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="filter-section">
                    <h3>Select Lead Criteria</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>State <span class="required">*</span></label>
                            <select class="form-control" id="genState">
                                <option value="">Select State</option>
                                <option value="AL">Alabama</option>
                                <option value="AK">Alaska</option>
                                <option value="AZ">Arizona</option>
                                <option value="AR">Arkansas</option>
                                <option value="CA">California</option>
                                <option value="CO">Colorado</option>
                                <option value="CT">Connecticut</option>
                                <option value="DE">Delaware</option>
                                <option value="FL">Florida</option>
                                <option value="GA">Georgia</option>
                                <option value="HI">Hawaii</option>
                                <option value="ID">Idaho</option>
                                <option value="IL">Illinois</option>
                                <option value="IN">Indiana</option>
                                <option value="IA">Iowa</option>
                                <option value="KS">Kansas</option>
                                <option value="KY">Kentucky</option>
                                <option value="LA">Louisiana</option>
                                <option value="ME">Maine</option>
                                <option value="MD">Maryland</option>
                                <option value="MA">Massachusetts</option>
                                <option value="MI">Michigan</option>
                                <option value="MN">Minnesota</option>
                                <option value="MS">Mississippi</option>
                                <option value="MO">Missouri</option>
                                <option value="MT">Montana</option>
                                <option value="NE">Nebraska</option>
                                <option value="NV">Nevada</option>
                                <option value="NH">New Hampshire</option>
                                <option value="NJ">New Jersey</option>
                                <option value="NM">New Mexico</option>
                                <option value="NY">New York</option>
                                <option value="NC">North Carolina</option>
                                <option value="ND">North Dakota</option>
                                <option value="OH">Ohio</option>
                                <option value="OK">Oklahoma</option>
                                <option value="OR">Oregon</option>
                                <option value="PA">Pennsylvania</option>
                                <option value="RI">Rhode Island</option>
                                <option value="SC">South Carolina</option>
                                <option value="SD">South Dakota</option>
                                <option value="TN">Tennessee</option>
                                <option value="TX">Texas</option>
                                <option value="UT">Utah</option>
                                <option value="VT">Vermont</option>
                                <option value="VA">Virginia</option>
                                <option value="WA">Washington</option>
                                <option value="WV">West Virginia</option>
                                <option value="WI">Wisconsin</option>
                                <option value="WY">Wyoming</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Insurance Expiring Within</label>
                            <select class="form-control" id="genExpiry">
                                <option value="5/30">5/30 (Skip 1-5 days, Show 6-30)</option>
                                <option value="30">30 Days</option>
                                <option value="45">45 Days</option>
                                <option value="60">60 Days</option>
                                <option value="90">90 Days</option>
                                <option value="120">120 Days</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Minimum Fleet Size</label>
                            <input type="number" class="form-control" id="minFleet" placeholder="e.g., 1" value="1">
                        </div>
                        <div class="form-group">
                            <label>Maximum Fleet Size</label>
                            <input type="number" class="form-control" id="maxFleet" placeholder="e.g., 999" value="999">
                        </div>
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Operating Status</label>
                            <select class="form-control" id="genStatus">
                                <option value="">All</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="OUT_OF_SERVICE">Out of Service</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Safety Rating</label>
                            <select class="form-control" id="genSafety">
                                <option value="">All Ratings</option>
                                <option value="SATISFACTORY">Satisfactory</option>
                                <option value="CONDITIONAL">Conditional</option>
                                <option value="UNSATISFACTORY">Unsatisfactory</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 3;">
                            <label>Insurance Companies</label>
                            <div class="insurance-checkbox-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; max-height: 120px; overflow-y: auto;">
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="PROGRESSIVE"> Progressive
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="GEICO"> GEICO
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="GREAT_WEST"> Great West Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CANAL"> Canal Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ACUITY"> Acuity
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="NORTHLAND"> Northland
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CINCINNATI"> Cincinnati Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="AUTO_OWNERS"> Auto Owners
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="SENTRY"> Sentry Select
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ERIE"> Erie Insurance
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="TRAVELERS"> Travelers
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="BITCO"> Bitco General
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="CAROLINA"> Carolina Casualty
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="STATE_FARM"> State Farm
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="ALLSTATE"> Allstate
                            </label>
                            <label class="checkbox-item" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="insurance" value="NATIONWIDE"> Nationwide
                            </label>
                            </div>
                            <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem;">
                                <button type="button" class="btn-small" onclick="selectAllInsurance()" style="padding: 4px 10px; font-size: 0.8rem;">Select All</button>
                                <button type="button" class="btn-small" onclick="clearAllInsurance()" style="padding: 4px 10px; font-size: 0.8rem;">Clear All</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="genHazmat"> Hazmat Only
                        </label>
                    </div>
                    <div class="form-actions" style="margin-top: 1rem;">
                        <button class="btn-primary" onclick="generateLeadsFromForm()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-magic"></i> Generate Leads Now
                        </button>
                        <button class="btn-success" onclick="uploadToVicidialWithCriteria()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-upload"></i> Upload to Vicidial
                        </button>
                        <button class="btn-warning" onclick="sendSMSBlast()" style="padding: 10px 24px; font-size: 1rem;">
                            <i class="fas fa-sms"></i> SMS Blast
                        </button>
                        <button class="btn-secondary" onclick="resetGenerateForm()" style="padding: 10px 20px;">
                            <i class="fas fa-redo"></i> Reset Form
                        </button>
                    </div>
                </div>
        </div>
    `;
}

function getSMSBlastContent() {
    return `
        <div class="sms-blast-container">
            <!-- SMS Campaign Setup -->
            <div class="sms-campaign-setup">
                <h3><i class="fas fa-sms"></i> SMS Blast Campaign</h3>
                <p style="color: #6b7280; margin-bottom: 2rem;">Send bulk SMS messages to your selected leads</p>

                <!-- Campaign Details -->
                <div class="campaign-details">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Campaign Name</label>
                            <input type="text" class="form-control" id="sms-campaign-name" placeholder="Enter campaign name">
                        </div>
                        <div class="form-group">
                            <label>From Number</label>
                            <select class="form-control" id="sms-from-number">
                                <option value="+18882681541">+1 (888) 268-1541</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Message Composition -->
                <div class="message-composition">
                    <h4>Message Content</h4>
                    <div class="form-group">
                        <label>Message Template</label>
                        <select class="form-control" id="sms-template" onchange="loadSMSTemplate()">
                            <option value="">Custom Message</option>
                            <option value="insurance-renewal">Insurance Renewal Reminder</option>
                            <option value="quote-followup">Quote Follow-up</option>
                            <option value="policy-expiry">Policy Expiry Alert</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>SMS Message <span style="color: #6b7280;">(160 chars recommended)</span></label>
                        <textarea class="form-control" id="sms-message" rows="4" maxlength="1600"
                                  placeholder="Enter your SMS message here..." onkeyup="updateSMSCharCount()"></textarea>
                        <div class="char-count">
                            <span id="sms-char-count">0</span> characters
                        </div>
                    </div>
                </div>

                <!-- Lead Selection -->
                <div class="lead-selection">
                    <h4>Select Recipients</h4>
                    <div class="selection-options">
                        <div class="form-group">
                            <label>Lead Source</label>
                            <select class="form-control" id="sms-lead-source" onchange="loadSMSRecipients()">
                                <option value="generated">Use Generated Leads (from Generate Leads tab)</option>
                                <option value="search">Use Search Results (from Carrier Lookup tab)</option>
                                <option value="custom">Upload Custom Phone List</option>
                            </select>
                        </div>
                    </div>

                    <!-- Recipients Preview -->
                    <div class="recipients-preview">
                        <div class="recipients-summary">
                            <strong>Recipients: <span id="sms-recipient-count">0</span> phone numbers</strong>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons" style="margin-top: 2rem;">
                    <button class="btn-primary" onclick="testSMSCampaign()" style="padding: 12px 24px;">
                        <i class="fas fa-vial"></i> Send Test Message
                    </button>
                    <button class="btn-success" onclick="launchSMSCampaign()" style="padding: 12px 32px; font-size: 1.1rem;">
                        <i class="fas fa-paper-plane"></i> Launch Campaign
                    </button>
                    <button class="btn-secondary" onclick="saveSMSDraft()" style="padding: 12px 24px;">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                </div>
            </div>
        </div>
    `;
}

function switchLeadSection(section) {
    // Hide all sections
    document.getElementById('carrierLookupSection').style.display = 'none';
    document.getElementById('generateLeadsSection').style.display = 'none';
    const smsSection = document.getElementById('smsBlastSection');
    if (smsSection) smsSection.style.display = 'none';

    // Remove active class from all tabs
    document.querySelectorAll('.folder-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected section and activate tab
    if (section === 'lookup') {
        document.getElementById('carrierLookupSection').style.display = 'block';
        document.querySelectorAll('.folder-tab')[0].classList.add('active');
    } else if (section === 'generate') {
        document.getElementById('generateLeadsSection').style.display = 'block';
        document.querySelectorAll('.folder-tab')[1].classList.add('active');
    } else if (section === 'sms') {
        if (smsSection) smsSection.style.display = 'block';
        document.querySelectorAll('.folder-tab')[2].classList.add('active');
    }
}

function showGenerateLeadsForm() {
    // Load the lead generation view with the generate tab active
    loadLeadGenerationView('generate');
}

// Store generated leads globally for export
let generatedLeadsData = [];

// Display generated leads in the results table
function displayGeneratedLeads(leads) {
    // Check if 5/30 filter is active for display purposes
    const expiryValue = document.getElementById('genExpiry')?.value;

    // Don't switch tabs - stay on Generate Leads tab
    // Update the lead count on the Generate Leads tab
    const genLeadsCount = document.querySelector('#generateLeads .lead-count');
    if (genLeadsCount) {
        if (expiryValue === '5/30') {
            // The leads are already filtered at API level, just show the count
            genLeadsCount.textContent = `${leads.length} leads (Days 6-30, skipped first 5 days)`;
        } else {
            genLeadsCount.textContent = `${leads.length} total leads found`;
        }
    }

    // Store the generated leads for when user switches to lookup tab
    window.generatedLeads = leads;

    // Use the existing displayLeadResults function
    const formattedLeads = leads.map(lead => ({
        usdot: lead.usdot_number,
        company: lead.legal_name || lead.dba_name,
        location: lead.location,
        fleet: lead.fleet || lead.power_units || '0',
        status: lead.status || 'Active',
        expiry: lead.expiry || lead.policy_renewal_date || 'N/A',
        insurance: lead.insurance_on_file || 0,
        insurance_carrier: lead.insurance_carrier,
        lead_score: lead.lead_score || 50
    }));
    
    displayLeadResults(formattedLeads);

    // Update the results count
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
        if (expiryValue === '5/30') {
            resultsCount.textContent = `${leads.length} leads expiring in days 6-30 (first 5 days excluded)`;
        } else {
            resultsCount.textContent = `${leads.length} qualified leads generated (filtered by insurance criteria)`;
        }
    }
}

async function generateLeadsFromForm() {
    const state = document.getElementById('genState').value;
    const expiry = document.getElementById('genExpiry').value;
    const minFleet = document.getElementById('minFleet').value;
    const maxFleet = document.getElementById('maxFleet').value;
    const status = document.getElementById('genStatus').value;
    const safety = document.getElementById('genSafety').value;
    const hazmat = document.getElementById('genHazmat').checked;

    if (!state) {
        alert('Please select a state to generate leads');
        return;
    }

    // Get selected insurance companies - use simple names for broader matching
    const insuranceCompanyMap = {
        'PROGRESSIVE': 'Progressive',
        'GEICO': 'GEICO',
        'GREAT_WEST': 'Great West',
        'CANAL': 'Canal',
        'ACUITY': 'Acuity',
        'NORTHLAND': 'Northland',
        'CINCINNATI': 'Cincinnati',
        'AUTO_OWNERS': 'Auto Owners',
        'SENTRY': 'Sentry',
        'ERIE': 'Erie',
        'TRAVELERS': 'Travelers',
        'BITCO': 'Bitco',
        'CAROLINA': 'Carolina',
        'STATE_FARM': 'State Farm',
        'ALLSTATE': 'Allstate',
        'NATIONWIDE': 'Nationwide'
    };

    const insuranceCompanies = [];
    document.querySelectorAll('input[name="insurance"]:checked').forEach(checkbox => {
        const mappedName = insuranceCompanyMap[checkbox.value] || checkbox.value;
        insuranceCompanies.push(mappedName);
    });

    // Show loading state - find the button properly
    const btn = document.querySelector('button[onclick="generateLeadsFromForm()"]');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Leads...';
        btn.disabled = true;
    }
    
    try {
        // Build criteria object for API
        let expiryValue = expiry;
        let skipDays = 0;

        // Handle 5/30 filter option
        if (expiry === '5/30') {
            expiryValue = 30;  // Total window is 30 days
            skipDays = 5;      // But skip first 5 days
        }

        const criteria = {
            state: state,
            expiryDays: parseInt(expiryValue),
            skipDays: skipDays,  // Add skip days to criteria
            minFleet: parseInt(minFleet),
            maxFleet: parseInt(maxFleet),
            status: status || undefined,
            safety: safety || undefined,
            hazmat: hazmat || undefined,
            insuranceCompanies: insuranceCompanies.length > 0 ? insuranceCompanies : undefined,
            limit: 50000  // Increased limit to get all real leads
        };
        
        // Call real API
        const data = await apiService.generateLeads(criteria);
        
        // Store the criteria for Vicidial upload (with ALL insurance companies)
        // Handle 5/30 filter specially
        let vicidialExpiry = expiry;
        let displayExpiry = expiry;
        if (expiry === '5/30') {
            vicidialExpiry = 30;  // Use 30 days for actual filtering
            displayExpiry = '5/30 (Days 6-30)';  // Display description
        }

        // Store criteria with verification logging
        const totalLeadsGenerated = data.total || generatedLeadsData.length;
        console.log('=== LEAD GENERATION VERIFICATION ===');
        console.log('State:', state);
        console.log('Insurance Companies:', insuranceCompanies);
        console.log('Days Until Expiry:', vicidialExpiry);
        console.log('Skip Days:', skipDays);
        console.log('Total Leads Generated:', totalLeadsGenerated);
        console.log('Data.total:', data.total);
        console.log('GeneratedLeadsData.length:', generatedLeadsData.length);

        lastGeneratedCriteria = {
            state: state,
            insuranceCompanies: insuranceCompanies,  // Pass ALL selected companies
            daysUntilExpiry: parseInt(vicidialExpiry) || 30,
            displayExpiry: displayExpiry,  // For display purposes
            skipDays: skipDays,  // Include skip days for proper filtering
            totalLeads: totalLeadsGenerated,  // EXACT count of leads generated
            limit: totalLeadsGenerated  // Pass this as the limit to upload
        };

        console.log('Stored criteria for upload:', JSON.stringify(lastGeneratedCriteria, null, 2));
        console.log('===================================');
        
        // Log lead data details
        console.log('First 3 generated leads (DOT numbers):', (data.leads || []).slice(0, 3).map(l => l.usdot_number || l.dot_number));
        console.log('Last 3 generated leads (DOT numbers):', (data.leads || []).slice(-3).map(l => l.usdot_number || l.dot_number));

        // Store generated leads data for export - use data.leads not data.carriers
        generatedLeadsData = (data.leads || []).map(carrier => ({
            usdot_number: carrier.usdotNumber || carrier.usdot_number || carrier.dot_number,
            mc_number: carrier.mcNumber || carrier.mc_number || 'N/A',
            legal_name: carrier.name || carrier.legal_name || carrier.dba_name || 'N/A',
            representative_name: carrier.contact || carrier.principal_name || carrier.representative_1_name || carrier.representative_name || 'N/A',
            city: carrier.city || carrier.physical_city || 'N/A',
            state: carrier.state || carrier.physical_state || state,
            phone: carrier.phone || 'N/A',
            email: carrier.email_address || carrier.email || 'N/A',
            fleet_size: carrier.powerUnits || carrier.power_units || 0,
            insurance_expiry: carrier.renewalDate || carrier.insurance_expiry_date || carrier.policy_renewal_date || carrier.expiry || 'N/A',
            insurance_company: carrier.insuranceCompany || carrier.insurance_company || carrier.insurance_carrier || 'Unknown',
            insurance_amount: carrier.premium || carrier.liability_insurance_amount || carrier.bipd_insurance_on_file_amount || carrier.insurance_on_file || 0,
            policy_number: carrier.policy_number || 'N/A',
            safety_rating: carrier.safety_rating || 'None',
            operating_status: carrier.operating_status || carrier.status || 'Unknown'
        }));
        
        // Calculate statistics
        const leadCount = data.total || generatedLeadsData.length;
        const expiringSoon = generatedLeadsData.filter(lead => {
            if (!lead.insurance_expiry || lead.insurance_expiry === 'N/A') return false;
            const expiryDate = new Date(lead.insurance_expiry);
            const daysUntilExpiry = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        }).length;
        const withContact = generatedLeadsData.filter(lead => 
            lead.phone !== 'N/A' || lead.email !== 'N/A'
        ).length;
        
        // Update the statistics
        document.getElementById('totalLeadsCount').textContent = leadCount.toLocaleString();
        document.getElementById('expiringSoonCount').textContent = expiringSoon.toLocaleString();
        document.getElementById('withContactCount').textContent = withContact.toLocaleString();
        
        // Display the generated leads in the search results table
        displayGeneratedLeads(data.leads || []);
        
        // Show success message
        document.getElementById('successMessage').style.display = 'block';

        // Reset button
        const resetBtn = document.querySelector('button[onclick="generateLeadsFromForm()"]');
        if (resetBtn) {
            resetBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
            resetBtn.disabled = false;
        }
        
        // Scroll to top to show results
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.style.display = 'none';
            }
        }, 5000);
        
    } catch (error) {
        console.error('Error generating leads:', error);
        alert('Error generating leads. Please try again.');

        // Reset button
        const btn = document.querySelector('button[onclick="generateLeadsFromForm()"]');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-magic"></i> Generate Leads Now';
            btn.disabled = false;
        }
    }
}

function generateMockLeadData(count, state, expiry) {
    const leads = [];
    const companies = ['ABC Transport', 'XYZ Logistics', 'Quick Freight', 'Eagle Carriers', 'Premier Shipping', 'Global Transport', 'Swift Logistics'];
    const cities = {
        'CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
        'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
        'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
        'NY': ['New York', 'Buffalo', 'Rochester', 'Albany'],
        'IL': ['Chicago', 'Springfield', 'Rockford', 'Peoria'],
        'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo']
    };

    const selectedCities = cities[state] || ['City A', 'City B', 'City C'];

    // For 5/30 filter, generate more leads to account for filtering
    let actualCount = count;
    if (expiry === '5/30') {
        actualCount = Math.ceil(count * 1.5); // Generate 50% more to account for filtered out leads
    }

    for (let i = 0; i < actualCount; i++) {
        const companyName = companies[Math.floor(Math.random() * companies.length)] + ' ' + (i + 1);
        const usdot = Math.floor(Math.random() * 9000000) + 1000000;
        const mc = Math.floor(Math.random() * 900000) + 100000;
        const fleet = Math.floor(Math.random() * 100) + 1;
        const city = selectedCities[Math.floor(Math.random() * selectedCities.length)];

        const expiryDate = new Date();

        // Handle 5/30 filter specially - distribute dates across 1-30 days
        if (expiry === '5/30') {
            // Generate dates across full 30 day range (some will be filtered out)
            const daysAhead = Math.floor(Math.random() * 30) + 1;
            expiryDate.setDate(expiryDate.getDate() + daysAhead);
        } else {
            // Normal expiry date generation
            const maxDays = parseInt(expiry) || 30;
            expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * maxDays) + 1);
        }

        leads.push({
            usdot_number: usdot.toString(),
            mc_number: 'MC-' + mc,
            legal_name: companyName,
            city: city,
            state: state,
            phone: '555-' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000),
            email: companyName.toLowerCase().replace(/\s+/g, '') + '@example.com',
            fleet_size: fleet,
            insurance_expiry: expiryDate.toISOString().split('T')[0],
            insurance_company: ['Progressive', 'GEICO', 'Great West', 'Canal'][Math.floor(Math.random() * 4)],
            safety_rating: ['Satisfactory', 'Conditional', 'None'][Math.floor(Math.random() * 3)],
            operating_status: 'Active'
        });
    }
    
    return leads;
}

function resetGenerateForm() {
    document.getElementById('genState').value = '';
    document.getElementById('genExpiry').value = '90';
    document.getElementById('minFleet').value = '1';
    document.getElementById('maxFleet').value = '999';
    document.getElementById('genStatus').value = '';
    document.getElementById('genSafety').value = '';
    document.getElementById('genHazmat').checked = false;
    
    // Clear all insurance checkboxes
    document.querySelectorAll('input[name="insurance"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset statistics to dashes
    document.getElementById('totalLeadsCount').textContent = '-';
    document.getElementById('expiringSoonCount').textContent = '-';
    document.getElementById('withContactCount').textContent = '-';
    
    // Hide success message
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.style.display = 'none';
    }
    
    // Clear generated data
    generatedLeadsData = [];
}

function selectAllInsurance() {
    document.querySelectorAll('input[name="insurance"]').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function clearAllInsurance() {
    document.querySelectorAll('input[name="insurance"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function exportGeneratedLeads(format) {
    if (!generatedLeadsData || generatedLeadsData.length === 0) {
        alert('No leads to export. Please generate leads first.');
        return;
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const state = document.getElementById('genState').value;
    
    if (format === 'json') {
        // Export as JSON
        const jsonData = JSON.stringify(generatedLeadsData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_${state}_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        showExportSuccess('JSON', generatedLeadsData.length);
        
    } else if (format === 'excel') {
        // Export as CSV (Excel-compatible) - including ALL fields with representative
        let csv = 'USDOT Number,MC Number,Company Name,Representative Name,Street Address,City,State,Zip Code,Phone,Email,Fleet Size,Insurance Amount,Insurance Expiry,Insurance Company,Safety Rating,Operating Status\n';

        generatedLeadsData.forEach(lead => {
            csv += `"${lead.usdot_number || lead.dot_number || ''}","${lead.mc_number || ''}","${lead.legal_name || ''}","${lead.representative_name || lead.contact_person || ''}","${lead.street || ''}","${lead.city || ''}","${lead.state || ''}","${lead.zip_code || ''}","${lead.phone || ''}","${lead.email || lead.email_address || ''}","${lead.fleet_size || lead.power_units || ''}","${lead.insurance_amount || '$750,000'}","${lead.policy_renewal_date || ''}","${lead.insurance_carrier || ''}","${lead.safety_rating || 'Satisfactory'}","${lead.operating_status || 'Active'}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_${state}_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        showExportSuccess('Excel/CSV', generatedLeadsData.length);
    }
}

function showExportSuccess(format, count) {
    const message = document.createElement('div');
    message.className = 'export-success-message';
    message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 1rem 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; animation: slideIn 0.3s ease;';
    message.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <i class="fas fa-check-circle" style="font-size: 1.5rem;"></i>
            <div>
                <strong>Export Successful!</strong><br>
                <small>${count} leads exported as ${format}</small>
            </div>
        </div>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(message);
        }, 300);
    }, 3000);
}

function viewGeneratedLeads() {
    // Load lead generation view and populate with generated leads
    loadLeadGenerationView();
    
    // After view loads, display the generated leads
    setTimeout(() => {
        if (generatedLeadsData && generatedLeadsData.length > 0) {
            const resultsBody = document.getElementById('leadResultsBody');
            const resultsCount = document.querySelector('.results-count');
            
            if (resultsBody && resultsCount) {
                resultsCount.textContent = `${generatedLeadsData.length} leads found`;
                
                resultsBody.innerHTML = generatedLeadsData.slice(0, 50).map(lead => `
                    <tr>
                        <td><input type="checkbox" class="lead-checkbox" value="${lead.usdot_number}"></td>
                        <td class="font-mono">${lead.usdot_number}</td>
                        <td><strong>${lead.legal_name}</strong></td>
                        <td>${lead.city}, ${lead.state}</td>
                        <td>${lead.fleet_size} vehicles</td>
                        <td>
                            <span class="status-badge status-active">Active</span>
                        </td>
                        <td>${lead.insurance_expiry}</td>
                        <td>
                            <button class="btn-small btn-icon" onclick="viewLeadDetails('${lead.usdot_number}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-small btn-icon" onclick="contactLead('${lead.usdot_number}')" title="Contact">
                                <i class="fas fa-envelope"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    }, 100);
}

// Tools Menu Functions moved to tool-windows.js for draggable windows

// Communications Hub Supporting Functions
function toggleCampaign(campaignId) {
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (campaign) {
        campaign.status = campaign.status === 'active' ? 'paused' : 'active';
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        
        // Update button in UI
        const btn = document.querySelector(`button[onclick="toggleCampaign('${campaignId}')"]`);
        if (btn) {
            if (campaign.status === 'active') {
                btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                btn.className = 'btn-warning';
                showNotification(`Campaign "${campaign.name}" started`, 'success');
            } else {
                btn.innerHTML = '<i class="fas fa-play"></i> Start';
                btn.className = 'btn-success';
                showNotification(`Campaign "${campaign.name}" paused`, 'info');
            }
        }
        
        // Update status badge
        const statusBadge = btn.closest('tr').querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = `status-badge status-${campaign.status}`;
            statusBadge.textContent = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
        }
    }
}

function handleRecipientUpload(type) {
    const fileInput = document.getElementById(type === 'email' ? 'emailRecipientFile' : 'smsRecipientFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a CSV file', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            showNotification('CSV file appears to be empty', 'error');
            return;
        }
        
        // Parse CSV headers
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Show column mapping modal
        showColumnMappingModal(headers, type);
        
        // Store CSV data temporarily
        window.tempCsvData = {
            headers: headers,
            rows: lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                return row;
            })
        };
        
        showNotification(`Loaded ${lines.length - 1} recipients from CSV`, 'success');
    };
    
    reader.onerror = function() {
        showNotification('Error reading CSV file', 'error');
    };
    
    reader.readAsText(file);
}

function showColumnMappingModal(headers, type) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h3>Map CSV Columns to Template Variables</h3>
            <p>Map your CSV columns to template variables for personalization:</p>
            <div class="column-mapping">
                ${headers.map(header => `
                    <div class="form-group">
                        <label>${header}:</label>
                        <select class="form-control" data-csv-column="${header}">
                            <option value="">-- Don't use --</option>
                            <option value="{first_name}">First Name</option>
                            <option value="{last_name}">Last Name</option>
                            <option value="{company}">Company</option>
                            <option value="{email}">Email</option>
                            <option value="{phone}">Phone</option>
                            <option value="{policy_number}">Policy Number</option>
                            <option value="{expiry_date}">Expiry Date</option>
                            <option value="{custom_1}">Custom Field 1</option>
                            <option value="{custom_2}">Custom Field 2</option>
                        </select>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
                <button class="btn-primary" onclick="applyColumnMapping('${type}')">Apply Mapping</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function applyColumnMapping(type) {
    const mappings = {};
    const selects = document.querySelectorAll('.column-mapping select');
    
    selects.forEach(select => {
        const csvColumn = select.dataset.csvColumn;
        const templateVar = select.value;
        if (templateVar) {
            mappings[templateVar] = csvColumn;
        }
    });
    
    // Store mappings
    window.tempCsvData.mappings = mappings;
    
    // Update recipient count display
    const recipientCount = window.tempCsvData.rows.length;
    const countDisplay = document.getElementById(type === 'email' ? 'emailRecipientCount' : 'smsRecipientCount');
    if (countDisplay) {
        countDisplay.textContent = `${recipientCount} recipients loaded`;
        countDisplay.style.color = '#28a745';
    }
    
    // Close modal
    document.querySelector('.modal-backdrop').remove();
    
    showNotification('Column mapping applied successfully', 'success');
}

function insertVariable(type) {
    const variables = [
        '{first_name}',
        '{last_name}',
        '{company}',
        '{email}',
        '{phone}',
        '{policy_number}',
        '{expiry_date}'
    ];
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>Insert Variable</h3>
            <p>Select a variable to insert:</p>
            <div class="variable-list">
                ${variables.map(v => `
                    <button class="btn-secondary" style="margin: 5px; width: calc(50% - 10px);" 
                            onclick="insertVariableText('${type}', '${v}')">${v}</button>
                `).join('')}
            </div>
            <div style="text-align: right; margin-top: 20px;">
                <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function insertVariableText(type, variable) {
    const textarea = document.getElementById(type === 'email' ? 'emailBlastMessage' : 'smsBlastMessage');
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        textarea.value = before + variable + after;
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
    }
    document.querySelector('.modal-backdrop').remove();
}

function sendEmailBlast() {
    const subject = document.getElementById('emailBlastSubject').value;
    const message = document.getElementById('emailBlastMessage').value;
    
    if (!subject || !message) {
        showNotification('Please fill in subject and message', 'error');
        return;
    }
    
    if (!window.tempCsvData || !window.tempCsvData.rows.length) {
        showNotification('Please upload recipient list first', 'error');
        return;
    }
    
    // Simulate sending emails
    const totalRecipients = window.tempCsvData.rows.length;
    let sentCount = 0;
    
    // Show progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-backdrop';
    progressModal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>Sending Email Blast</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="emailProgress" style="width: 0%"></div>
            </div>
            <p id="emailProgressText">Sending to 0 of ${totalRecipients} recipients...</p>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    // Simulate sending process
    const interval = setInterval(() => {
        sentCount += Math.min(10, totalRecipients - sentCount);
        const progress = (sentCount / totalRecipients) * 100;
        
        document.getElementById('emailProgress').style.width = progress + '%';
        document.getElementById('emailProgressText').textContent = 
            `Sending to ${sentCount} of ${totalRecipients} recipients...`;
        
        if (sentCount >= totalRecipients) {
            clearInterval(interval);
            progressModal.remove();
            
            // Save to history
            const blastHistory = JSON.parse(localStorage.getItem('emailBlasts') || '[]');
            blastHistory.push({
                id: 'blast_' + Date.now(),
                subject: subject,
                message: message,
                recipients: totalRecipients,
                sentAt: new Date().toISOString(),
                status: 'completed'
            });
            localStorage.setItem('emailBlasts', JSON.stringify(blastHistory));
            
            showNotification(`Email blast sent to ${totalRecipients} recipients!`, 'success');
            
            // Clear form
            document.getElementById('emailBlastSubject').value = '';
            document.getElementById('emailBlastMessage').value = '';
            document.getElementById('emailRecipientFile').value = '';
            document.getElementById('emailRecipientCount').textContent = '';
            window.tempCsvData = null;
        }
    }, 100);
}

function sendSMSBlast() {
    const message = document.getElementById('smsBlastMessage').value;
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    if (!window.tempCsvData || !window.tempCsvData.rows.length) {
        showNotification('Please upload recipient list first', 'error');
        return;
    }
    
    // Check message length
    const charCount = message.length;
    if (charCount > 160) {
        const segments = Math.ceil(charCount / 153);
        if (!confirm(`This message will be sent as ${segments} segments. Continue?`)) {
            return;
        }
    }
    
    // Simulate sending SMS
    const totalRecipients = window.tempCsvData.rows.length;
    let sentCount = 0;
    
    // Show progress modal
    const progressModal = document.createElement('div');
    progressModal.className = 'modal-backdrop';
    progressModal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>Sending SMS Blast</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="smsProgress" style="width: 0%"></div>
            </div>
            <p id="smsProgressText">Sending to 0 of ${totalRecipients} recipients...</p>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    // Simulate sending process
    const interval = setInterval(() => {
        sentCount += Math.min(15, totalRecipients - sentCount);
        const progress = (sentCount / totalRecipients) * 100;
        
        document.getElementById('smsProgress').style.width = progress + '%';
        document.getElementById('smsProgressText').textContent = 
            `Sending to ${sentCount} of ${totalRecipients} recipients...`;
        
        if (sentCount >= totalRecipients) {
            clearInterval(interval);
            progressModal.remove();
            
            // Save to history
            const blastHistory = JSON.parse(localStorage.getItem('smsBlasts') || '[]');
            blastHistory.push({
                id: 'sms_' + Date.now(),
                message: message,
                recipients: totalRecipients,
                sentAt: new Date().toISOString(),
                status: 'completed'
            });
            localStorage.setItem('smsBlasts', JSON.stringify(blastHistory));
            
            showNotification(`SMS blast sent to ${totalRecipients} recipients!`, 'success');
            
            // Clear form
            document.getElementById('smsBlastMessage').value = '';
            document.getElementById('smsRecipientFile').value = '';
            document.getElementById('smsRecipientCount').textContent = '';
            document.getElementById('charCount').textContent = '0 / 160';
            window.tempCsvData = null;
        }
    }, 100);
}

function updateCharCount() {
    const textarea = document.getElementById('smsBlastMessage');
    const charCount = document.getElementById('charCount');
    if (textarea && charCount) {
        const count = textarea.value.length;
        const segments = count <= 160 ? 1 : Math.ceil(count / 153);
        charCount.textContent = `${count} / 160${segments > 1 ? ` (${segments} segments)` : ''}`;
        charCount.style.color = count > 160 ? '#ff6b6b' : '#666';
    }
}

function addCommunicationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .ai-campaign {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .ai-campaign .campaign-header h3 {
            color: white;
        }
        
        .ai-campaign .stat-label {
            color: #374151;
        }
        
        .ai-campaign .stat-value {
            color: #111827;
            font-weight: bold;
        }
        
        .ai-campaign .btn-small {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .ai-campaign .btn-small:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .progress-bar {
            width: 100%;
            height: 30px;
            background-color: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .column-mapping {
            max-height: 400px;
            overflow-y: auto;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 5px;
        }
        
        .variable-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            max-height: 80vh;
            overflow-y: auto;
        }
        
        #emailRecipientCount,
        #smsRecipientCount {
            display: inline-block;
            margin-left: 10px;
            font-weight: bold;
        }

        /* Reminders View Styles */
        .reminders-view {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .reminders-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .reminders-sections {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
        }

        .reminders-section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .section-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .section-header h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .section-count {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        }

        .birthday-view-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 40px;
        }

        .birthday-view-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-1px);
        }

        .birthday-view-btn.active {
            background: rgba(255, 255, 255, 0.9);
            color: #667eea;
            border-color: rgba(255, 255, 255, 0.9);
            font-weight: 600;
        }

        .reminder-cards-stack {
            padding: 20px;
            max-height: 600px;
            overflow-y: auto;
        }

        .reminder-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 16px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .reminder-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .reminder-card.urgent {
            border-left: 4px solid #ef4444;
            background: linear-gradient(to right, #fef2f2, white);
        }

        .reminder-card.soon {
            border-left: 4px solid #f59e0b;
            background: linear-gradient(to right, #fffbeb, white);
        }

        .reminder-card.completed {
            opacity: 0.7;
            border-left: 4px solid #10b981;
        }

        .card-header {
            display: flex;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #f3f4f6;
        }

        .card-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            font-size: 20px;
        }

        .birthday-card .card-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }

        .new-policy-card .card-icon {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
        }

        .card-info {
            flex: 1;
        }

        .card-info h4 {
            margin: 0 0 4px 0;
            font-size: 1rem;
            font-weight: 600;
            color: #111827;
        }

        .card-subtitle {
            margin: 0;
            font-size: 0.875rem;
            color: #6b7280;
        }

        .card-urgency {
            text-align: right;
        }

        .urgency-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .urgency-badge.urgent {
            background: #fee2e2;
            color: #dc2626;
        }

        .urgency-badge.soon {
            background: #fef3c7;
            color: #d97706;
        }

        .urgency-badge:not(.urgent):not(.soon) {
            background: #e5e7eb;
            color: #6b7280;
        }

        .policy-premium {
            font-weight: 600;
            color: #059669;
            font-size: 0.9rem;
        }

        .card-body {
            padding: 0 16px;
        }

        .card-details {
            margin-bottom: 16px;
        }

        .detail-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 0.875rem;
            color: #6b7280;
        }

        .detail-item i {
            width: 16px;
            margin-right: 8px;
            text-align: center;
        }

        .card-actions {
            padding: 12px 16px;
            border-top: 1px solid #f3f4f6;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .status-completed {
            color: #059669;
            font-size: 0.875rem;
            font-weight: 500;
            flex: 1;
        }

        .no-reminders {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }

        .no-reminders p {
            margin: 0;
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(style);
}

// Initialize communication styles
addCommunicationStyles();

// Load reminder cards for the reminders tab
function loadReminderCards() {
    if (!window.communicationsReminders) {
        console.warn('Communications reminders module not loaded');
        return;
    }

    const reminders = window.communicationsReminders.getReminders();

    // Separate reminders by type
    const birthdays = reminders.filter(r => r.type === 'birthday');
    const newPolicies = reminders.filter(r => r.type === 'new_policy');

    // Update counts
    document.getElementById('birthday-count').textContent = birthdays.length;
    document.getElementById('new-policy-count').textContent = newPolicies.length;

    // Load birthday cards
    loadBirthdayCards(birthdays);

    // Load new policy cards
    loadNewPolicyCards(newPolicies);
}

// Global variable to track current birthday view days
window.currentBirthdayViewDays = 30;

// Function to set birthday view and reload data
function setBirthdayView(days) {
    window.currentBirthdayViewDays = days;

    // Update active button state
    document.querySelectorAll('.birthday-view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`birthday-${days}-btn`).classList.add('active');

    // Reload reminders with new day filter
    if (window.communicationsReminders) {
        loadReminderCards();
    }
}

function loadBirthdayCards(birthdays) {
    const container = document.getElementById('birthday-reminders');
    if (!container) return;

    if (birthdays.length === 0) {
        container.innerHTML = `
            <div class="no-reminders">
                <i class="fas fa-birthday-cake" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
                <p>No upcoming birthdays in the next ${window.currentBirthdayViewDays || 30} days</p>
            </div>
        `;
        return;
    }

    const cards = birthdays.map(birthday => {
        const urgencyClass = birthday.daysUntil <= 3 ? 'urgent' : birthday.daysUntil <= 7 ? 'soon' : '';
        const dateStr = birthday.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="reminder-card birthday-card ${urgencyClass} ${birthday.giftSent ? 'completed' : ''}">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas fa-birthday-cake"></i>
                    </div>
                    <div class="card-info">
                        <h4>${birthday.clientName}</h4>
                        <p class="card-subtitle">Turning ${birthday.age} years old</p>
                    </div>
                    <div class="card-urgency">
                        <span class="urgency-badge ${urgencyClass}">
                            ${birthday.daysUntil === 0 ? 'Today!' :
                              birthday.daysUntil === 1 ? 'Tomorrow' :
                              `${birthday.daysUntil} days`}
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${dateStr}</span>
                        </div>
                        ${birthday.email ? `
                            <div class="detail-item">
                                <i class="fas fa-envelope"></i>
                                <span>${birthday.email}</span>
                            </div>
                        ` : ''}
                        ${birthday.phone ? `
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span>${birthday.phone}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    ${!birthday.giftSent ? `
                        <button class="btn-primary btn-small" onclick="window.communicationsReminders.markGiftSent('${birthday.id}', '${birthday.clientName}')">
                            <i class="fas fa-gift"></i> Mark Gift Sent
                        </button>
                        <button class="btn-secondary btn-small" onclick="sendBirthdayMessage('${birthday.clientName}', '${birthday.email}', '${birthday.phone}')">
                            <i class="fas fa-paper-plane"></i> Send Message
                        </button>
                    ` : `
                        <span class="status-completed">
                            <i class="fas fa-check-circle"></i> Gift Sent
                        </span>
                        <button class="btn-secondary btn-small" onclick="window.communicationsReminders.undoGiftSent('${birthday.id}')">
                            <i class="fas fa-undo"></i> Undo
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = cards;
}

function loadNewPolicyCards(newPolicies) {
    const container = document.getElementById('new-policy-reminders');
    if (!container) return;

    if (newPolicies.length === 0) {
        container.innerHTML = `
            <div class="no-reminders">
                <i class="fas fa-file-contract" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
                <p>No new policies in the last 7 days</p>
            </div>
        `;
        return;
    }

    const cards = newPolicies.map(policy => {
        const premium = typeof policy.premium === 'number' ? policy.premium.toLocaleString() : policy.premium;

        return `
            <div class="reminder-card new-policy-card ${policy.giftSent ? 'completed' : ''}">
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fas fa-file-contract"></i>
                    </div>
                    <div class="card-info">
                        <h4>${policy.clientName}</h4>
                        <p class="card-subtitle">${policy.policyType}</p>
                    </div>
                    <div class="card-urgency">
                        <span class="policy-premium">$${premium}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar-plus"></i>
                            <span>${policy.daysAgo === 0 ? 'Today' :
                                   policy.daysAgo === 1 ? 'Yesterday' :
                                   `${policy.daysAgo} days ago`}</span>
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    ${!policy.giftSent ? `
                        <button class="btn-primary btn-small" onclick="window.communicationsReminders.markGiftSent('${policy.id}', '${policy.clientName}')">
                            <i class="fas fa-gift"></i> Mark Gift Sent
                        </button>
                        <button class="btn-secondary btn-small" onclick="sendWelcomeMessage('${policy.clientName}')">
                            <i class="fas fa-paper-plane"></i> Send Welcome
                        </button>
                    ` : `
                        <span class="status-completed">
                            <i class="fas fa-check-circle"></i> Gift Sent
                        </span>
                        <button class="btn-secondary btn-small" onclick="window.communicationsReminders.undoGiftSent('${policy.id}')">
                            <i class="fas fa-undo"></i> Undo
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = cards;
}


// Birthday message helpers
function sendBirthdayMessage(clientName, email, phone) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-birthday-cake"></i> Send Birthday Message to ${clientName}</h3>
                <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="tabs" style="margin-bottom: 20px;">
                    <button class="tab-btn active" onclick="switchBirthdayTab(this, 'email')">Email</button>
                    <button class="tab-btn" onclick="switchBirthdayTab(this, 'sms')">SMS</button>
                </div>

                <div id="birthday-email-tab" class="birthday-tab active">
                    <div class="form-group">
                        <label>To:</label>
                        <input type="email" value="${email || ''}" class="form-control" id="birthdayEmailTo">
                    </div>
                    <div class="form-group">
                        <label>Subject:</label>
                        <input type="text" value="Happy Birthday, ${clientName}!" class="form-control" id="birthdayEmailSubject">
                    </div>
                    <div class="form-group">
                        <label>Message:</label>
                        <textarea class="form-control" rows="6" id="birthdayEmailMessage">Dear ${clientName},

Happy Birthday! 🎉

We hope you have a wonderful day filled with joy and celebration. Thank you for being such a valued client.

As a small token of our appreciation, we've prepared a special gift for you. We'll be in touch soon!

Best wishes,
Your Insurance Team</textarea>
                    </div>
                </div>

                <div id="birthday-sms-tab" class="birthday-tab" style="display: none;">
                    <div class="form-group">
                        <label>To:</label>
                        <input type="tel" value="${phone || ''}" class="form-control" id="birthdaySmsTo">
                    </div>
                    <div class="form-group">
                        <label>Message:</label>
                        <textarea class="form-control" rows="4" maxlength="160" id="birthdaySmsMessage">Happy Birthday ${clientName}! 🎂 Hope you have an amazing day! - Your Insurance Team</textarea>
                        <small class="char-count">0 / 160 characters</small>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn-primary" onclick="sendBirthdayMessageNow('${clientName}')">
                    <i class="fas fa-paper-plane"></i> Send Message
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // Add character counter for SMS
    const smsTextarea = modal.querySelector('#birthdaySmsMessage');
    const charCount = modal.querySelector('.char-count');
    smsTextarea.addEventListener('input', function() {
        charCount.textContent = `${this.value.length} / 160 characters`;
    });
    // Initial count
    charCount.textContent = `${smsTextarea.value.length} / 160 characters`;
}

function switchBirthdayTab(button, tabType) {
    // Update buttons
    button.parentNode.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Update tabs
    document.querySelectorAll('.birthday-tab').forEach(tab => tab.style.display = 'none');
    document.getElementById(`birthday-${tabType}-tab`).style.display = 'block';
}

function sendBirthdayMessageNow(clientName) {
    const activeTab = document.querySelector('.birthday-tab[style="display: block;"], .birthday-tab.active:not([style*="none"])');
    const isEmail = activeTab.id === 'birthday-email-tab';

    if (isEmail) {
        const to = document.getElementById('birthdayEmailTo').value;
        const subject = document.getElementById('birthdayEmailSubject').value;
        const message = document.getElementById('birthdayEmailMessage').value;

        if (!to || !subject || !message) {
            alert('Please fill in all fields');
            return;
        }

        // Simulate sending email
        alert(`Birthday email sent to ${clientName} at ${to}!`);
    } else {
        const to = document.getElementById('birthdaySmsTo').value;
        const message = document.getElementById('birthdaySmsMessage').value;

        if (!to || !message) {
            alert('Please fill in all fields');
            return;
        }

        // Simulate sending SMS
        alert(`Birthday SMS sent to ${clientName} at ${to}!`);
    }

    document.querySelector('.modal').remove();
}

function sendWelcomeMessage(clientName) {
    alert(`Welcome message functionality for ${clientName} - Coming soon!`);
}

// Lead Import and Blast Functions
function importLeads() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = event.target.result;
                let leads = [];
                
                if (file.name.endsWith('.csv')) {
                    // Parse CSV
                    const lines = data.split('\n').filter(line => line.trim());
                    if (lines.length < 2) {
                        showNotification('CSV file appears to be empty', 'error');
                        return;
                    }
                    
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim());
                        const lead = {};
                        
                        headers.forEach((header, index) => {
                            const value = values[index] || '';
                            // Map common header names
                            if (header.includes('name') || header.includes('company')) {
                                lead.name = value;
                            } else if (header.includes('phone') || header.includes('tel')) {
                                lead.phone = value;
                            } else if (header.includes('email') || header.includes('mail')) {
                                lead.email = value;
                            } else if (header.includes('product') || header.includes('interest')) {
                                lead.product = value;
                            } else if (header.includes('premium') || header.includes('amount')) {
                                lead.premium = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                            } else if (header.includes('renewal') || header.includes('expiry')) {
                                lead.renewalDate = value;
                            } else if (header.includes('assigned')) {
                                lead.assignedTo = value;
                            } else {
                                lead[header] = value;
                            }
                        });
                        
                        // Set defaults
                        lead.id = Date.now() + i;
                        lead.stage = lead.stage || 'new';
                        lead.createdAt = new Date().toISOString();
                        lead.product = lead.product || 'General Insurance';
                        
                        if (lead.name && (lead.email || lead.phone)) {
                            leads.push(lead);
                        }
                    }
                } else {
                    showNotification('Excel file import requires additional library. Please use CSV format.', 'warning');
                    return;
                }
                
                if (leads.length > 0) {
                    // Add to existing leads
                    const existingLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                    const updatedLeads = [...existingLeads, ...leads];
                    localStorage.setItem('leads', JSON.stringify(updatedLeads));
                    
                    showNotification(`Successfully imported ${leads.length} leads`, 'success');
                    loadLeadsView();
                } else {
                    showNotification('No valid leads found in file', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                showNotification('Error importing file: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    input.click();
}

function exportLeads() {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    if (leads.length === 0) {
        showNotification('No leads to export', 'warning');
        return;
    }
    
    // Create CSV content
    const headers = ['Name', 'Phone', 'Email', 'Product', 'Premium', 'Stage', 'Renewal Date', 'Assigned To', 'Created'];
    const rows = leads.map(lead => [
        lead.name,
        lead.phone,
        lead.email,
        lead.product,
        lead.premium || 0,
        lead.stage,
        lead.renewalDate || '',
        lead.assignedTo || '',
        lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || ''
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${leads.length} leads`, 'success');
}

window.toggleAllLeads = function(checkbox) {
    const checkboxes = document.querySelectorAll('.lead-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateBulkDeleteButton();
}

// Update bulk delete overlay visibility and count
window.updateBulkDeleteButton = function() {
    const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
    let deleteOverlay = document.getElementById('bulkDeleteOverlay');

    if (selectedCheckboxes.length > 0) {
        // Create overlay if it doesn't exist
        if (!deleteOverlay) {
            deleteOverlay = document.createElement('div');
            deleteOverlay.id = 'bulkDeleteOverlay';
            deleteOverlay.innerHTML = `
                <div class="delete-icon-container" onclick="bulkDeleteLeads()">
                    <i class="fas fa-trash"></i>
                    <span class="delete-count">${selectedCheckboxes.length}</span>
                </div>
            `;
            deleteOverlay.style.cssText = `
                position: fixed;
                top: 80px;
                right: 30px;
                z-index: 10000;
                cursor: pointer;
                animation: slideInRight 0.3s ease-out;
            `;

            // Add styles if not already present
            if (!document.getElementById('bulkDeleteStyles')) {
                const style = document.createElement('style');
                style.id = 'bulkDeleteStyles';
                style.textContent = `
                    @keyframes slideInRight {
                        from {
                            transform: translateX(100px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    @keyframes pulse-glow {
                        0%, 100% {
                            box-shadow: 0 0 20px rgba(220, 38, 38, 0.6),
                                       0 0 40px rgba(220, 38, 38, 0.4),
                                       0 0 60px rgba(220, 38, 38, 0.2);
                        }
                        50% {
                            box-shadow: 0 0 30px rgba(220, 38, 38, 0.8),
                                       0 0 50px rgba(220, 38, 38, 0.6),
                                       0 0 70px rgba(220, 38, 38, 0.4);
                        }
                    }

                    #bulkDeleteOverlay .delete-icon-container {
                        position: relative;
                        width: 70px;
                        height: 70px;
                        background: linear-gradient(135deg, #dc2626, #b91c1c);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 28px;
                        animation: pulse-glow 2s ease-in-out infinite;
                        transition: transform 0.2s ease;
                    }

                    #bulkDeleteOverlay .delete-icon-container:hover {
                        transform: scale(1.1);
                        animation: pulse-glow 1s ease-in-out infinite;
                    }

                    #bulkDeleteOverlay .delete-count {
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #fbbf24;
                        color: #000;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: bold;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(deleteOverlay);
        } else {
            // Update count
            const countElement = deleteOverlay.querySelector('.delete-count');
            if (countElement) {
                countElement.textContent = selectedCheckboxes.length;
            }
        }
    } else {
        // Remove overlay if no items selected
        if (deleteOverlay) {
            deleteOverlay.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (deleteOverlay && deleteOverlay.parentNode) {
                    deleteOverlay.remove();
                }
            }, 300);
        }
    }
}

// Bulk delete selected leads
window.bulkDeleteLeads = async function() {
    const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        showNotification('No leads selected', 'warning');
        return;
    }

    const count = selectedCheckboxes.length;
    const message = count === 1
        ? 'Are you sure you want to delete this lead?'
        : `Are you sure you want to delete ${count} leads?`;

    if (!confirm(message)) {
        return;
    }

    // Collect all lead IDs to delete
    const leadIds = [];
    selectedCheckboxes.forEach(checkbox => {
        leadIds.push(checkbox.value);
    });

    console.log(`Bulk deleting ${leadIds.length} leads...`);

    // VICIDIAL PROTECTION: Filter out ViciDial leads from being tracked as deleted
    const nonViciDialLeads = leadIds.filter(id => {
        const isViciDialLead = String(id).startsWith('88') && String(id).length === 9;
        if (isViciDialLead) {
            console.log(`🔓 BULK VICIDIAL DELETE PROTECTION: Skipping ViciDial lead ${id} from deleted list`);
            return false;
        }
        return true;
    });

    // Track deleted leads to prevent them from reappearing (excluding ViciDial leads)
    if (nonViciDialLeads.length > 0) {
        const deletedLeads = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
        nonViciDialLeads.forEach(id => {
            if (!deletedLeads.includes(String(id))) {
                deletedLeads.push(String(id));
            }
        });
        localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedLeads));
    }

    // Delete from server
    const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}:3001`;

    let successCount = 0;
    let failCount = 0;

    // Delete each lead from server
    for (const leadId of leadIds) {
        try {
            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                successCount++;
                console.log(`Deleted lead ${leadId} from server`);
            } else {
                failCount++;
                console.warn(`Failed to delete lead ${leadId} from server`);
            }
        } catch (error) {
            failCount++;
            console.error(`Error deleting lead ${leadId}:`, error);
        }
    }

    // Remove from localStorage
    let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

    console.log('Before deletion - insurance_leads count:', insurance_leads.length);
    console.log('Lead IDs to delete:', leadIds);

    // Filter out deleted leads - make sure to compare as strings
    insurance_leads = insurance_leads.filter(lead => {
        const shouldKeep = !leadIds.includes(String(lead.id));
        if (!shouldKeep) {
            console.log('Removing lead:', lead.id, lead.name);
        }
        return shouldKeep;
    });
    regular_leads = regular_leads.filter(lead => !leadIds.includes(String(lead.id)));

    console.log('After deletion - insurance_leads count:', insurance_leads.length);

    // Save back to localStorage
    localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
    localStorage.setItem('leads', JSON.stringify(regular_leads));

    // Uncheck select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllLeads');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }

    // Show notification based on actual deletion
    const deletedCount = leadIds.length;
    if (deletedCount > 0) {
        showNotification(`Successfully deleted ${deletedCount} lead(s)`, 'success');

        // Remove the overlay immediately
        const deleteOverlay = document.getElementById('bulkDeleteOverlay');
        if (deleteOverlay) {
            deleteOverlay.remove();
        }

        // Clear all checkboxes
        document.querySelectorAll('.lead-checkbox:checked').forEach(cb => {
            cb.checked = false;
        });

        // Server delete status (for debugging)
        if (failCount > 0) {
            console.warn(`Note: ${failCount} leads may not have been deleted from server but were removed locally`);
        }
    } else {
        showNotification(`Failed to delete leads`, 'error');
    }

    // Reload the leads view to show updated list
    setTimeout(() => {
        loadLeadsView();
    }, 100);
}

function sendLeadsToBlast() {
    const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showNotification('Please select leads to send', 'warning');
        return;
    }
    
    // Gather selected leads
    const selectedLeads = [];
    selectedCheckboxes.forEach(checkbox => {
        try {
            const leadData = JSON.parse(checkbox.dataset.lead);
            selectedLeads.push(leadData);
        } catch (e) {
            console.error('Error parsing lead data:', e);
        }
    });
    
    // Show modal to choose blast type
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3>Send ${selectedLeads.length} Leads to Blast</h3>
            <p>Choose how you want to communicate with these leads:</p>
            
            <div style="display: flex; gap: 20px; margin: 30px 0;">
                <button class="btn-primary" style="flex: 1; padding: 20px;" onclick="prepareEmailBlast(${JSON.stringify(selectedLeads).replace(/"/g, '&quot;')})">
                    <i class="fas fa-envelope" style="font-size: 24px; display: block; margin-bottom: 10px;"></i>
                    Email Blast
                </button>
                <button class="btn-primary" style="flex: 1; padding: 20px;" onclick="prepareSMSBlast(${JSON.stringify(selectedLeads).replace(/"/g, '&quot;')})">
                    <i class="fas fa-sms" style="font-size: 24px; display: block; margin-bottom: 10px;"></i>
                    SMS Blast
                </button>
            </div>
            
            <div style="text-align: right;">
                <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function prepareEmailBlast(leads) {
    // Close modal
    document.querySelector('.modal-backdrop').remove();
    
    // Store leads for blast
    window.tempCsvData = {
        headers: ['name', 'email', 'phone', 'product', 'premium'],
        rows: leads.map(lead => ({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            product: lead.product,
            premium: lead.premium
        })),
        mappings: {
            '{first_name}': 'name',
            '{email}': 'email',
            '{phone}': 'phone',
            '{company}': 'name'
        }
    };
    
    // Navigate to Communications Hub - Email Blast
    window.location.hash = '#communications';
    setTimeout(() => {
        loadCommunicationTab('email-blast');
        showNotification(`${leads.length} leads ready for email blast`, 'success');
    }, 100);
}

function prepareSMSBlast(leads) {
    // Close modal
    document.querySelector('.modal-backdrop').remove();
    
    // Store leads for blast
    window.tempCsvData = {
        headers: ['name', 'phone', 'email', 'product', 'premium'],
        rows: leads.map(lead => ({
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            product: lead.product,
            premium: lead.premium
        })),
        mappings: {
            '{first_name}': 'name',
            '{phone}': 'phone',
            '{company}': 'name'
        }
    };
    
    // Navigate to Communications Hub - SMS Blast
    window.location.hash = '#communications';
    setTimeout(() => {
        loadCommunicationTab('sms-blast');
        showNotification(`${leads.length} leads ready for SMS blast`, 'success');
    }, 100);
}


// Store the last generated lead criteria
let lastGeneratedCriteria = null;

// Function to pass lead generation criteria to Vicidial uploader
function uploadToVicidialWithCriteria() {
    // Use the stored criteria from the last generation
    if (!lastGeneratedCriteria) {
        alert('Please generate leads first before uploading to Vicidial');
        return;
    }

    console.log('=== INITIATING VICIDIAL UPLOAD ===');
    console.log('Using stored criteria:', JSON.stringify(lastGeneratedCriteria, null, 2));
    console.log('Total leads to upload:', lastGeneratedCriteria.totalLeads);

    // Call vicidialUploader with the exact criteria used for generation
    if (window.vicidialUploader) {
        window.vicidialUploader.showUploadDialog(lastGeneratedCriteria);
    } else {
        alert('Vicidial uploader not loaded');
    }
}

// Make function globally accessible
window.uploadToVicidialWithCriteria = uploadToVicidialWithCriteria;

// Advanced Filter Functions
window.toggleAdvancedFilters = function() {
    const panel = document.getElementById('advancedFiltersPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

window.applyAdvancedFilters = function() {
    const filterStage = document.getElementById('filterStage')?.value;
    const filterPremium = document.getElementById('filterPremium')?.value;
    const filterRenewal = document.getElementById('filterRenewal')?.value;
    const filterAssigned = document.getElementById('filterAssigned')?.value;
    console.log('🔍 FILTER DEBUG: filterAssigned =', filterAssigned);
    const filterProduct = document.getElementById('filterProduct')?.value;
    const filterSkipDays = document.getElementById('filterSkipDays')?.value;

    let filteredLeads = [...window.allLeads || []];
    let filterCount = 0;

    // Exclude archived leads
    const archivedLeads = JSON.parse(localStorage.getItem('archived_leads') || '[]');
    const archivedIds = new Set(archivedLeads.map(l => l.id));
    filteredLeads = filteredLeads.filter(lead => !archivedIds.has(lead.id));

    // Apply stage filter
    if (filterStage) {
        filteredLeads = filteredLeads.filter(lead => lead.stage === filterStage);
        filterCount++;
    }

    // Apply premium range filter
    if (filterPremium) {
        const [min, max] = filterPremium.split('-').map(v => v === '+' ? Infinity : parseInt(v));
        filteredLeads = filteredLeads.filter(lead => {
            const premium = lead.premium || 0;
            if (max === undefined) return premium >= 25000;
            return premium >= min && premium < max;
        });
        filterCount++;
    }

    // Apply renewal date filter
    if (filterRenewal) {
        const today = new Date();
        filteredLeads = filteredLeads.filter(lead => {
            if (!lead.renewalDate) return false;
            const renewalDate = new Date(lead.renewalDate);
            const daysUntil = Math.floor((renewalDate - today) / (1000 * 60 * 60 * 24));

            if (filterRenewal === 'overdue') return daysUntil < 0;
            const maxDays = parseInt(filterRenewal);
            return daysUntil >= 0 && daysUntil <= maxDays;
        });
        filterCount++;
    }

    // Apply assigned filter
    if (filterAssigned) {
        const beforeFilterCount = filteredLeads.length;
        if (filterAssigned === 'unassigned') {
            filteredLeads = filteredLeads.filter(lead => !lead.assignedTo);
        } else {
            filteredLeads = filteredLeads.filter(lead => lead.assignedTo === filterAssigned);
        }
        console.log(`🔍 AssignedTo Filter: ${beforeFilterCount} → ${filteredLeads.length} leads (filtered by: "${filterAssigned}")`);
        filterCount++;
    }

    // Apply product filter
    if (filterProduct) {
        filteredLeads = filteredLeads.filter(lead =>
            lead.product && lead.product.toLowerCase().includes(filterProduct.toLowerCase())
        );
        filterCount++;
    }

    // Apply skip days filter
    if (filterSkipDays && parseInt(filterSkipDays) > 0) {
        const skipDays = parseInt(filterSkipDays);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate the date to skip until (today + skipDays)
        const skipUntilDate = new Date(today);
        skipUntilDate.setDate(skipUntilDate.getDate() + skipDays);

        console.log(`🔍 Skip Days Filter: Skipping leads renewing within ${skipDays} days (until ${skipUntilDate.toDateString()})`);

        const beforeSkipCount = filteredLeads.length;

        filteredLeads = filteredLeads.filter(lead => {
            // Check various renewal date fields
            let renewalDateStr = null;

            if (lead.renewalDate && lead.renewalDate !== "N/A") {
                renewalDateStr = lead.renewalDate;
            } else if (lead.policyExpirationDate && lead.policyExpirationDate !== "N/A") {
                renewalDateStr = lead.policyExpirationDate;
            } else if (lead.expiryDate && lead.expiryDate !== "N/A") {
                renewalDateStr = lead.expiryDate;
            } else if (lead.insuranceInfo?.expirationDate) {
                renewalDateStr = lead.insuranceInfo.expirationDate;
            }

            // If no valid renewal date found, keep the lead (can't filter what we don't know)
            if (!renewalDateStr || renewalDateStr === "N/A" || renewalDateStr === "") {
                console.log(`🔍 Skip Filter: No valid date for lead ${lead.name || lead.id} - keeping in results`);
                return true;
            }

            // Parse the date - handle various formats
            let renewalDate = null;

            // Try to parse MM/DD/YYYY or MM/DDYYYY format
            if (renewalDateStr.match(/^\d{1,2}\/\d{1,2}\d{4}$/)) {
                // Handle format like "07/102025" -> "07/10/2025"
                const parts = renewalDateStr.split('/');
                if (parts[1].length === 6) {
                    renewalDateStr = `${parts[0]}/${parts[1].slice(0,2)}/${parts[1].slice(2)}`;
                }
            }

            renewalDate = new Date(renewalDateStr);

            // If date parsing failed, keep the lead
            if (isNaN(renewalDate.getTime())) {
                console.log(`🔍 Skip Filter: Invalid date format "${renewalDateStr}" for lead ${lead.name || lead.id} - keeping in results`);
                return true;
            }

            const isWithinSkipPeriod = renewalDate <= skipUntilDate;
            console.log(`🔍 Skip Filter: Lead ${lead.name || lead.id} - Renewal: ${renewalDate.toDateString()}, Skip Until: ${skipUntilDate.toDateString()}, Skip: ${isWithinSkipPeriod}`);

            // Skip leads that renew within the specified number of days
            return !isWithinSkipPeriod;
        });

        console.log(`🔍 Skip Days Filter Applied: ${beforeSkipCount} → ${filteredLeads.length} leads (filtered out ${beforeSkipCount - filteredLeads.length} leads)`);

        if (beforeSkipCount === filteredLeads.length) {
            console.log(`⚠️ Skip Days Filter had no effect - check if leads have valid renewal dates`);
        }

        filterCount++;
    }

    // Update filter count badge
    const filterCountBadge = document.getElementById('filterCount');
    if (filterCountBadge) {
        if (filterCount > 0) {
            filterCountBadge.textContent = filterCount;
            filterCountBadge.style.display = 'inline-block';
        } else {
            filterCountBadge.style.display = 'none';
        }
    }

    // Store filtered leads globally
    window.filteredLeads = filteredLeads;

    // Update leads count display (if it exists)
    const leadsCountElement = document.querySelector('.leads-count, #leadsCount');
    if (leadsCountElement) {
        leadsCountElement.textContent = `${filteredLeads.length} leads`;
    }

    console.log(`🔍 FINAL FILTER RESULT: Showing ${filteredLeads.length} leads after all filters applied`);

    // Re-render leads table with filtered data
    renderLeadsList(filteredLeads);
};

window.clearAdvancedFilters = function() {
    // Reset all filter inputs
    const filterInputs = ['filterStage', 'filterPremium', 'filterRenewal', 'filterAssigned', 'filterProduct', 'filterSkipDays'];
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });

    // Hide filter count
    const filterCountBadge = document.getElementById('filterCount');
    if (filterCountBadge) {
        filterCountBadge.style.display = 'none';
    }

    // Show all non-archived leads
    const archivedLeads = JSON.parse(localStorage.getItem('archived_leads') || '[]');
    const archivedIds = new Set(archivedLeads.map(l => l.id));
    const nonArchivedLeads = (window.allLeads || []).filter(lead => !archivedIds.has(lead.id));

    window.filteredLeads = nonArchivedLeads;
    renderLeadsList(nonArchivedLeads);
};

// Helper function to format stage names
function formatStageName(stage) {
    const stageMap = {
        'new': 'New',
        'info_received': 'Info Received',
        'info_requested': 'Info Requested',
        'quoted': 'Quoted',
        'quote_sent': 'Quote Sent',
        'quote-sent-unaware': 'Quote Sent (Unaware)',
        'quote-sent-aware': 'Quote Sent (Aware)',
        'interested': 'Interested',
        'not-interested': 'Not Interested',
        'closed': 'Closed'
    };
    return stageMap[stage] || stage;
}

// Helper function to get next action based on stage and reach out status
function getNextAction(stage, lead) {
    console.log(`🔍 GET NEXT ACTION: Lead ${lead.id} - ${lead.name}, stage: ${stage}`);
    console.log(`🔍 GET NEXT ACTION: Lead data:`, lead);

    // Check if reach out is complete
    if (lead && lead.reachOut) {
        const reachOut = lead.reachOut;
        console.log(`🔍 GET NEXT ACTION: ReachOut data:`, reachOut);

        // Check if stage requires reach out (NOT info_received - that needs quote preparation)
        console.log(`🔍 STAGE CHECK: stage="${stage}" (type: ${typeof stage})`);
        console.log(`🔍 STAGE CHECK: Checking conditions...`);
        if (stage === 'quoted' || stage === 'info_requested' || stage === 'Info Requested' ||
            stage === 'loss_runs_requested' || stage === 'Loss Runs Requested' ||
            stage === 'app_sent' || stage === 'App Sent' ||
            stage === 'quote_sent' || stage === 'quote-sent-unaware' || stage === 'quote-sent-aware' ||
            stage === 'interested' || stage === 'Interested') {
            console.log(`🔍 STAGE CHECK: ✅ STAGE MATCHED - proceeding to completion check`);

            // Reach out is complete when ACTUAL completion actions happened:
            // 1. Connected call was made, OR
            // 2. Text has been sent (final step in sequence)
            // MUST have BOTH timestamp AND actual completion actions
            console.log(`🔍 COMPLETION CHECK VALUES: completedAt=${!!reachOut.completedAt}, reachOutCompletedAt=${!!reachOut.reachOutCompletedAt}, callsConnected=${reachOut.callsConnected}, textCount=${reachOut.textCount}`);
            console.log(`🔍 COMPLETION CHECK TYPES: completedAt=${typeof reachOut.completedAt}, reachOutCompletedAt=${typeof reachOut.reachOutCompletedAt}, callsConnected=${typeof reachOut.callsConnected}, textCount=${typeof reachOut.textCount}`);

            const hasTimestamp = reachOut.completedAt || reachOut.reachOutCompletedAt;
            const hasActualCompletion = reachOut.callsConnected > 0 || reachOut.textCount > 0;
            const isActuallyCompleted = hasTimestamp && hasActualCompletion;

            console.log(`🔍 COMPLETION CONDITIONS: hasTimestamp=${hasTimestamp}, hasActualCompletion=${hasActualCompletion}, isActuallyCompleted=${isActuallyCompleted}`);

            // Clean up orphaned timestamps (timestamp without actual completion)
            if (hasTimestamp && !hasActualCompletion) {
                console.log(`🧹 CLEANING UP ORPHANED TIMESTAMP: Lead ${lead.id} has completion timestamp but no actual completion (connected: ${reachOut.callsConnected}, texts: ${reachOut.textCount})`);
                delete reachOut.completedAt;
                delete reachOut.reachOutCompletedAt;
                updateLeadInStorage(lead);
            }

            if (isActuallyCompleted) {
                console.log(`🔍 REACH-OUT COMPLETE CHECK - Lead ${lead.id}: completedAt=${!!reachOut.completedAt}, reachOutCompletedAt=${!!reachOut.reachOutCompletedAt}, callsConnected=${reachOut.callsConnected}, textCount=${reachOut.textCount}`);
                // NEW: Check if reach out completion has expired (older than 2 days)
                if (reachOut.reachOutCompletedAt) {
                    const completedTime = new Date(reachOut.reachOutCompletedAt);
                    const currentTime = new Date();
                    const timeDifferenceMs = currentTime.getTime() - completedTime.getTime();
                    const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);

                    // If more than 2 days have passed, reach out has expired - reset and require new reach out
                    if (timeDifferenceDays > 2) {
                        console.log(`🔄 REACH OUT EXPIRED: Lead ${lead.id} - ${lead.name}, completed ${timeDifferenceDays.toFixed(1)} days ago`);

                        // Reset reach out completion status to trigger new reach out
                        reachOut.callsConnected = 0;
                        reachOut.textCount = 0;
                        reachOut.emailSent = false;
                        reachOut.textSent = false;
                        reachOut.callMade = false;
                        delete reachOut.reachOutCompletedAt;

                        // Save the updated lead data
                        updateLeadInStorage(lead);

                        // Return appropriate reach out action based on stage
                        return getReachOutAction(stage);
                    }
                }

                return ''; // Empty TO DO when reach out is complete and not expired
            }
        }
    }

    const actionMap = {
        // Original lowercase with underscores format
        'new': 'Assign Stage',
        'contact_attempted': 'Follow up with lead',
        'info_requested': 'Reach out',
        'info_received': 'Prepare Quote',
        'loss_runs_requested': 'Reach out',
        'loss_runs_received': 'Prepare app.',
        'app_prepared': 'Send application',
        'app_sent': '',
        'quoted': 'Email Quote, and make contact',
        'quote_sent': 'Reach out',
        'quote-sent-unaware': 'Reach out',
        'quote-sent-aware': 'Follow up with lead',
        'interested': 'Reach out',
        'not-interested': 'Archive lead',
        'closed': 'Process complete',

        // Title case with spaces format (actual database format)
        'New': 'Assign Stage',
        'Contact Attempted': 'Follow up with lead',
        'Info Requested': 'Reach out',
        'Info Received': 'Prepare Quote',
        'Loss Runs Requested': 'Reach out',
        'Loss Runs Received': 'Prepare app.',
        'App Prepared': 'Send application',
        'App Sent': '',
        'Quoted': 'Email Quote, and make contact',
        'Quote Sent': 'Reach out',
        'Quote Sent Unaware': 'Reach out',
        'Quote Sent Aware': 'Follow up with lead',
        'Interested': 'Reach out',
        'Not Interested': 'Archive lead',
        'Closed': 'Process complete'
    };

    const actionText = actionMap.hasOwnProperty(stage) ? actionMap[stage] : 'Review lead';

    // Apply color styling based on action
    if (actionText === 'Process complete') {
        return `<span style="color: #16a34a; font-weight: bold;">${actionText}</span>`;
    } else if (actionText === 'Reach out') {
        return `<span style="color: #dc2626; font-weight: bold;">${actionText}</span>`;
    } else {
        return actionText;
    }
}

// Helper function to get the appropriate reach out action text based on stage
function getReachOutAction(stage) {
    const reachOutActionMap = {
        'quoted': 'Email Quote, and make contact',
        'info_requested': 'Reach out to lead',
        'loss_runs_requested': 'Reach out to lead',
        'app_sent': 'Reach out to lead',
        'quote_sent': 'Reach out to lead',
        'quote-sent-unaware': 'Reach out to lead',
        'quote-sent-aware': 'Follow up with lead',
        'interested': 'Reach out'
    };
    return reachOutActionMap[stage] || 'Reach out to lead';
}

// Helper function to update lead in storage after reach out expiration reset
function updateLeadInStorage(lead) {
    try {
        // Check if it's an insurance lead or regular lead
        let insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');

        // Try to find and update in insurance leads
        let foundIndex = insuranceLeads.findIndex(l => l.id === lead.id);
        if (foundIndex !== -1) {
            insuranceLeads[foundIndex] = lead;
            localStorage.setItem('insurance_leads', JSON.stringify(insuranceLeads));
            console.log(`✅ Updated insurance lead ${lead.id} in localStorage after reach out expiration`);
            return;
        }

        // Try to find and update in regular leads
        foundIndex = regularLeads.findIndex(l => l.id === lead.id);
        if (foundIndex !== -1) {
            regularLeads[foundIndex] = lead;
            localStorage.setItem('leads', JSON.stringify(regularLeads));
            console.log(`✅ Updated regular lead ${lead.id} in localStorage after reach out expiration`);
            return;
        }

        console.warn(`⚠️ Could not find lead ${lead.id} in storage for reach out expiration update`);
    } catch (error) {
        console.error(`❌ Error updating lead ${lead.id} after reach out expiration:`, error);
    }
}

// Make it globally accessible
window.getNextAction = getNextAction;
window.getReachOutAction = getReachOutAction;
window.updateLeadInStorage = updateLeadInStorage;

// Helper function to render filtered leads - FIXED to use standard table generation
function renderLeadsList(leads) {
    const leadsList = document.getElementById('leadsTableBody');
    if (!leadsList) return;

    // FINAL FILTER: Remove any mock/archived leads that made it through
    const mockPatterns = ['Test Lead', 'Test Company', 'Test Trucking', 'Robert Thompson', 'Jennifer Martin',
                          'Michael Chen', 'Davis Construct', 'ABC Corp', 'Tech Startup', 'ABC Trucking'];

    const originalCount = leads.length;
    leads = leads.filter(lead => {
        // Block mock patterns
        if (lead.name) {
            for (const pattern of mockPatterns) {
                if (lead.name.includes(pattern)) {
                    console.log(`🚫 RENDER BLOCK: ${lead.name} (mock data)`);
                    return false;
                }
            }
        }

        // Block archived leads
        if (window.archivedExclusion) {
            if (window.archivedExclusion.ids.has(String(lead.id))) {
                console.log(`🚫 RENDER BLOCK: ${lead.name} (archived by ID)`);
                return false;
            }
            if (lead.name && window.archivedExclusion.names.has(lead.name.toLowerCase().trim())) {
                console.log(`🚫 RENDER BLOCK: ${lead.name} (archived by name)`);
                return false;
            }
            if (lead.phone) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                if (cleanPhone && window.archivedExclusion.phones.has(cleanPhone)) {
                    console.log(`🚫 RENDER BLOCK: ${lead.name} (archived by phone)`);
                    return false;
                }
            }
            if (lead.email && window.archivedExclusion.emails.has(lead.email.toLowerCase().trim())) {
                console.log(`🚫 RENDER BLOCK: ${lead.name} (archived by email)`);
                return false;
            }
        }

        return true;
    });

    if (leads.length !== originalCount) {
        console.log(`🛡️ RENDER FILTER: blocked ${originalCount - leads.length} bad leads from display`);
    }

    if (leads.length === 0) {
        leadsList.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #9ca3af;">
                    No leads found matching your filters
                </td>
            </tr>
        `;
        return;
    }

    // FIXED: Use standard table generation to avoid duplicate tables
    leadsList.innerHTML = generateSimpleLeadRows(leads);

    // OLD CUSTOM CODE BELOW (disabled):
    /* leadsList.innerHTML = leads.map(lead => {
        const isPriority = lead.premium && lead.premium > 10000;
        const renewalDate = lead.renewalDate ? new Date(lead.renewalDate) : null;
        const daysUntilRenewal = renewalDate ? Math.floor((renewalDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

        let renewalClass = '';
        if (daysUntilRenewal !== null) {
            if (daysUntilRenewal < 0) renewalClass = 'renewal-overdue';
            else if (daysUntilRenewal <= 30) renewalClass = 'renewal-soon';
            else if (daysUntilRenewal <= 60) renewalClass = 'renewal-upcoming';
        }

        return `
            <tr class="lead-row ${isPriority ? 'priority-lead' : ''}" data-lead-id="${lead.id}">
                <td style="width: 40px;">
                    <input type="checkbox" class="lead-checkbox" value="${lead.id}" onchange="updateBulkDeleteButton()">
                </td>
                <td>
                    <div class="lead-name">
                        ${isPriority ? '<i class="fas fa-star" style="color: #f59e0b; margin-right: 5px;"></i>' : ''}
                        <strong>${lead.name || 'Unknown'}</strong>
                        ${lead.company ? `<br><small style="color: #6b7280;">${lead.company}</small>` : ''}
                    </div>
                </td>
                <td>
                    <div>${lead.phone || '-'}</div>
                    <div style="font-size: 0.9em; color: #666;">${lead.email || '-'}</div>
                </td>
                <td>
                    <span class="product-badge ${lead.product ? lead.product.toLowerCase() : ''}">
                        ${lead.product || 'Not specified'}
                    </span>
                </td>
                <td>
                    <span class="stage-badge ${lead.stage || 'new'}">
                        ${formatStageName(lead.stage || 'new')}
                    </span>
                </td>
                <td>
                    <div style="font-weight: bold; color: black;">
                        ${(() => {
                            console.log(`🎯 TO DO CELL: Getting next action for lead ${lead.id} - ${lead.name}, stage: ${lead.stage}`);
                            const result = (typeof getNextAction === 'function' ? getNextAction(lead.stage || 'new', lead) : (window.getNextAction ? window.getNextAction(lead.stage || 'new', lead) : 'Review lead')) || '';
                            console.log(`🎯 TO DO CELL: Result for lead ${lead.id}: "${result}"`);
                            return result;
                        })()}
                    </div>
                </td>
                <td>
                    <div class="premium-amount">
                        ${lead.premium ? '$' + lead.premium.toLocaleString() : '-'}
                    </div>
                </td>
                <td class="${renewalClass}">
                    ${renewalDate ? renewalDate.toLocaleDateString() : '-'}
                    ${daysUntilRenewal !== null && daysUntilRenewal <= 30 && daysUntilRenewal >= 0 ?
                        `<br><small style="color: #ef4444;">${daysUntilRenewal} days</small>` : ''}
                </td>
                <td>${lead.assignedTo || 'Unassigned'}</td>
                <td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewLead('${lead.id}')" class="btn-icon" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editLead('${lead.id}')" class="btn-icon" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="archiveLead('${lead.id}')" class="btn-icon" title="Archive">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join(''); */
}

// Communications Campaign Functions
function viewCampaignDetails(campaignId) {
    console.log('Viewing campaign details for:', campaignId);

    const campaigns = {
        'renewal_reminders': {
            name: 'Renewal Reminders',
            status: 'Active',
            sent: 234,
            opened: 156,
            clicked: 45,
            schedule: 'Monthly',
            lastSent: '2024-12-05',
            recipients: ['existing_clients']
        },
        'welcome_series': {
            name: 'Welcome Series',
            status: 'Active',
            sent: 89,
            opened: 72,
            clicked: 28,
            schedule: 'On Signup',
            lastSent: '2024-12-04',
            recipients: ['new_clients']
        },
        'holiday_greetings': {
            name: 'Holiday Greetings',
            status: 'Scheduled',
            recipients: 1245,
            sendDate: 'Dec 15',
            schedule: 'Annual'
        }
    };

    const campaign = campaigns[campaignId];
    if (!campaign) {
        showNotification('Campaign not found', 'error');
        return;
    }

    // Show campaign details modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Campaign Details - ${campaign.name}</h3>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="campaign-details">
                    <div class="detail-section">
                        <h4>Campaign Overview</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Status:</label>
                                <span class="status-badge ${campaign.status.toLowerCase()}">${campaign.status}</span>
                            </div>
                            <div class="detail-item">
                                <label>Schedule:</label>
                                <span>${campaign.schedule}</span>
                            </div>
                            ${campaign.lastSent ? `
                                <div class="detail-item">
                                    <label>Last Sent:</label>
                                    <span>${campaign.lastSent}</span>
                                </div>
                            ` : ''}
                            ${campaign.sendDate ? `
                                <div class="detail-item">
                                    <label>Scheduled Date:</label>
                                    <span>${campaign.sendDate}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${campaign.sent ? `
                        <div class="detail-section">
                            <h4>Performance Metrics</h4>
                            <div class="metrics-grid">
                                <div class="metric-card">
                                    <span class="metric-value">${campaign.sent}</span>
                                    <span class="metric-label">Total Sent</span>
                                </div>
                                <div class="metric-card">
                                    <span class="metric-value">${campaign.opened}</span>
                                    <span class="metric-label">Opened (${Math.round((campaign.opened / campaign.sent) * 100)}%)</span>
                                </div>
                                <div class="metric-card">
                                    <span class="metric-value">${campaign.clicked}</span>
                                    <span class="metric-label">Clicked (${Math.round((campaign.clicked / campaign.sent) * 100)}%)</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="detail-section">
                            <h4>Recipients</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Total Recipients:</label>
                                    <span>${campaign.recipients}</span>
                                </div>
                            </div>
                        </div>
                    `}

                    <div class="detail-section">
                        <h4>Actions</h4>
                        <div class="action-buttons">
                            <button class="btn-secondary" onclick="editCampaign('${campaignId}')">
                                <i class="fas fa-edit"></i> Edit Campaign
                            </button>
                            <button class="btn-secondary" onclick="duplicateCampaign('${campaignId}')">
                                <i class="fas fa-copy"></i> Duplicate
                            </button>
                            ${campaign.status === 'Active' ? `
                                <button class="btn-secondary" onclick="pauseCampaign('${campaignId}')">
                                    <i class="fas fa-pause"></i> Pause
                                </button>
                            ` : `
                                <button class="btn-primary" onclick="startCampaign('${campaignId}')">
                                    <i class="fas fa-play"></i> Start
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function pauseCampaign(campaignId) {
    console.log('Pausing campaign:', campaignId);
    showNotification(`Campaign ${campaignId.replace('_', ' ')} paused`, 'success');
    // Refresh the communications view to show updated status
    setTimeout(() => loadCommunicationTab('campaigns'), 500);
}

function editCampaign(campaignId) {
    console.log('Editing campaign:', campaignId);
    showNotification('Campaign editor will be available soon', 'info');
}

function previewCampaign(campaignId) {
    console.log('Previewing campaign:', campaignId);
    showNotification('Campaign preview will be available soon', 'info');
}

function startCampaign(campaignId) {
    console.log('Starting campaign:', campaignId);
    showNotification(`Campaign ${campaignId.replace('_', ' ')} started`, 'success');
}

function duplicateCampaign(campaignId) {
    console.log('Duplicating campaign:', campaignId);
    showNotification('Campaign duplicated', 'success');
}

// Cache bust: Sun Sep 29 v52 - FORCE REFRESH - Fixed original working flow

