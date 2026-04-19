// Original Simple Client Profile Design
window.viewClientOriginal = async function(id) {
    console.log('Loading original client profile for:', id);

    // Store the client ID globally for refresh after policy deletion
    window.currentViewingClientId = id;

    // Get fresh client data from API to ensure password updates are reflected
    let client;
    try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        const clients = Array.isArray(data) ? data : (data.clients || []);
        client = clients.find(c => c.id == id);

        if (!client) {
            // Fallback to localStorage if not found in API
            const localClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            client = localClients.find(c => c.id == id);
        }
    } catch (error) {
        console.error('Error fetching client data from API:', error);
        // Fallback to localStorage on error
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        client = clients.find(c => c.id == id);
    }

    if (!client) {
        showNotification('Client not found', 'error');
        loadClientsView();
        return;
    }

    // Merge server policies into localStorage without overwriting local-only entries
    try {
        const response = await fetch('/api/policies?includeInactive=true');
        if (response.ok) {
            const serverPolicies = await response.json();
            const localPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            // Build map of server policies by id
            const serverMap = {};
            serverPolicies.forEach(p => { if (p.id) serverMap[p.id] = p; });
            // Keep local-only policies (not on server) and merge with server data
            const merged = [...serverPolicies];
            localPolicies.forEach(p => { if (p.id && !serverMap[p.id]) merged.push(p); });
            localStorage.setItem('insurance_policies', JSON.stringify(merged));
            console.log(`✅ Merged ${serverPolicies.length} server + ${merged.length - serverPolicies.length} local-only policies`);
        }
    } catch (error) {
        console.log('⚠️ Could not sync from server, using localStorage data:', error.message);
    }

    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log('Total policies in storage:', allPolicies.length);
    console.log('Client ID:', id, 'Client Name:', client.name);

    // Build identity key for this client (name + DOB) for fuzzy matching
    const clientDob = client.dateOfBirth || client['Date of Birth'] || '';
    const clientKey = _clientIdentityKey(client.name || client.businessName || '', clientDob);

    const clientPolicies = allPolicies.filter(policy => {
        // 1. Exact clientId match — always wins
        if (policy.clientId && String(policy.clientId) === String(id)) return true;

        // 2. Identity key: owner name + DOB (catches policies linked to duplicate auto-created client records)
        const polOwner = policy.contact?.['Owner Name'] || policy.insuredName || '';
        const polDob   = policy.contact?.['Date of Birth'] || '';
        const polKey   = _clientIdentityKey(polOwner, polDob);
        if (clientKey && polKey && polKey === clientKey) return true;

        // 3. Insured name exact match against client name
        const insuredName = policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           policy.insured?.['Full Name'] ||
                           policy.insured?.['Business Name'] ||
                           policy.insuredName ||
                           policy.clientName;
        if (insuredName && client.name && insuredName.toLowerCase() === client.name.toLowerCase()) return true;

        // 4. Fuzzy identity key on insured/client name
        if (insuredName) {
            const polKeyFallback = _clientIdentityKey(insuredName, '');
            if (clientKey && polKeyFallback && polKeyFallback === clientKey) return true;
        }

        // 5. Business name match (catches policies where auto-created client biz name = real client biz name)
        const polBizName = policy.contact?.['Business Name'] || policy.clientName || '';
        if (polBizName && client.businessName) {
            const polBizKey    = _clientIdentityKey(polBizName, '');
            const clientBizKey = _clientIdentityKey(client.businessName, '');
            if (polBizKey && clientBizKey && polBizKey === clientBizKey) return true;
        }

        return false;
    });

    console.log('Client policies found:', clientPolicies.length);

    // Calculate total premium
    let totalPremium = 0;
    clientPolicies.forEach(policy => {
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
        console.log(`Profile - Policy ${policy.policyNumber}: Premium = ${premiumValue} -> ${numericPremium}`);
        totalPremium += numericPremium;
    });

    // Resolve full name: prefer stored fields, then fall back to linked policy contact/driver data
    const resolvedFullName = client.fullName || client.contactName || (() => {
        for (const p of clientPolicies) {
            const n = (p.contact && p.contact['Owner Name']) || p.clientName || p.insuredName ||
                      (Array.isArray(p.drivers) && p.drivers[0] && p.drivers[0].name) || '';
            if (n) return n;
        }
        return '';
    })();

    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="client-profile-view">
            <header class="content-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <div class="header-back">
                    <button class="btn-back" onclick="loadClientsView()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; backdrop-filter: blur(10px);">
                        <i class="fas fa-arrow-left"></i> Back to Clients
                    </button>
                    <h1 style="color: white; margin: 12px 0 0 0; font-size: 28px; font-weight: 600;">${client.name}</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editClient('${id}')" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">
                        <i class="fas fa-edit"></i> Edit Client
                    </button>
                    <button class="btn-primary" onclick="addPolicyToClient('${id}')" style="background: white; color: #667eea;">
                        <i class="fas fa-plus"></i> Add Policy
                    </button>
                </div>
            </header>

            <div style="padding: 0 24px;">
            <!-- Client Portal Box -->
            <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; margin-right: 12px;">
                            <i class="fas fa-user-circle" style="font-size: 20px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">Client Portal</h3>
                            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Portal Access & Settings</p>
                        </div>
                    </div>
                    <div>
                        ${client.portalPassword ?
                            `<a href="https://vigagency.com/pages/login.html" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #3b82f6; border-radius: 6px; transition: all 0.2s; background: transparent;">
                                <i class="fas fa-external-link-alt" style="font-size: 14px;"></i>
                                Go to Client Portal
                            </a>` :
                            `<span style="color: #9ca3af; text-decoration: none; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; cursor: not-allowed;">
                                <i class="fas fa-external-link-alt" style="font-size: 14px;"></i>
                                Go to Client Portal
                            </span>`
                        }
                    </div>
                </div>
                <div style="display: grid; gap: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-envelope" style="color: #6b7280; font-size: 16px;"></i>
                            <div>
                                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 2px; text-transform: uppercase;">Portal Email</label>
                                <p style="margin: 0; font-size: 14px; color: #1f2937;">${client.email || 'No email set'}</p>
                            </div>
                        </div>
                        <button onclick="window.editClientPortalEmail('${client.id}', '${client.email || ''}')" style="padding: 6px 12px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                            <i class="fas fa-edit" style="font-size: 10px; margin-right: 4px;"></i>Edit
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-lock" style="color: #6b7280; font-size: 16px;"></i>
                            <div>
                                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 2px; text-transform: uppercase;">Portal Password</label>
                                <p style="margin: 0; font-size: 14px; color: ${client.portalPassword ? '#1f2937' : '#9ca3af'};">
                                    <span id="password-display-${client.id}" style="font-family: monospace;">${client.portalPassword ? '●●●●●●●●' : 'NOT CREATED'}</span>
                                    <span style="margin-left: 8px; color: #6b7280; font-size: 12px;">${client.portalPassword ? '(Set)' : ''}</span>
                                </p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            ${client.portalPassword ? `
                                <button onclick="window.togglePasswordVisibility('${client.id}', '${client.portalPassword.replace(/'/g, "\\'")}', this)" style="padding: 6px 8px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;" title="Show/Hide Password">
                                    <i class="fas fa-eye" style="font-size: 10px;"></i>
                                </button>
                            ` : ''}
                            <button onclick="window.${client.portalPassword ? 'changeClientPortalPassword' : 'createClientPortalPassword'}('${client.id}')" style="padding: 6px 12px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                                <i class="fas fa-${client.portalPassword ? 'edit' : 'plus'}" style="font-size: 10px; margin-right: 4px;"></i>${client.portalPassword ? 'Change' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <!-- Client Information - Left Side -->
                <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; margin-bottom: 28px;">
                        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 600; margin-right: 16px;">
                            ${client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                            <h2 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 600;">Client Information</h2>
                            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Personal & Contact Details</p>
                        </div>
                    </div>

                    <div style="display: grid; gap: 24px;">
                        <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
                            <label style="display: block; font-size: 11px; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Full Name</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 500;">${resolvedFullName || 'N/A'}</p>
                        </div>

                        <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
                            <label style="display: block; font-size: 11px; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Business Name</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 500;">
                                ${client.company || client.businessName || client.name || 'N/A'}
                            </p>
                        </div>


                        <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
                            <label style="display: block; font-size: 11px; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Phone</label>
                            <p style="margin: 0; font-size: 16px;">
                                <a href="tel:${client.phone}" style="color: #3b82f6; text-decoration: none; font-weight: 500; display: flex; align-items: center;">
                                    <i class="fas fa-phone" style="margin-right: 8px; font-size: 14px;"></i>
                                    ${client.phone || 'N/A'}
                                </a>
                            </p>
                        </div>

                        <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
                            <label style="display: block; font-size: 11px; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Email</label>
                            <p style="margin: 0; font-size: 16px;">
                                <a href="mailto:${client.email}" style="color: #3b82f6; text-decoration: none; font-weight: 500; display: flex; align-items: center;">
                                    <i class="fas fa-envelope" style="margin-right: 8px; font-size: 14px;"></i>
                                    ${client.email || 'N/A'}
                                </a>
                            </p>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Date of Birth</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">${client.dateOfBirth || 'N/A'}</p>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Address</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">${client.address || 'N/A'}</p>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Client Since</label>
                            <p style="margin: 0; font-size: 16px; color: #1f2937;">
                                ${client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>

                        <div style="padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 10px; border: 1px solid #bfdbfe; text-align: center;">
                            <label style="display: block; font-size: 12px; color: #1e40af; margin-bottom: 8px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Annual Premium</label>
                            <p style="margin: 0; font-size: 32px; color: #059669; font-weight: 700;">
                                $${totalPremium.toLocaleString()}
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">Across ${clientPolicies.length} ${clientPolicies.length === 1 ? 'policy' : 'policies'}</p>
                        </div>

                        ${client.notes ? `
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Notes</label>
                            <p style="margin: 0; font-size: 14px; color: #4b5563; background: #f9fafb; padding: 12px; border-radius: 6px;">
                                ${client.notes}
                            </p>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Policies - Right Side -->
                <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px;">
                        <div style="display: flex; align-items: center;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; margin-right: 12px;">
                                <i class="fas fa-file-contract" style="font-size: 20px;"></i>
                            </div>
                            <div>
                                <h2 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 600;">Active Policies</h2>
                                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${clientPolicies.length} ${clientPolicies.length === 1 ? 'Policy' : 'Policies'} Found</p>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; gap: 16px;">
                        ${clientPolicies.length > 0 ? clientPolicies.map(policy => {
                            const premium = policy.financial?.['Annual Premium'] ||
                                          policy.financial?.['Premium'] ||
                                          policy.premium || 0;
                            const formattedPremium = typeof premium === 'string' ?
                                premium : `$${Number(premium).toLocaleString()}`;

                            // Debug the policy status values
                            const currentStatus = policy.policyStatus || policy.status || 'Active';
                            const isActive = currentStatus === 'Active';
                            console.log(`🔍 RENDER DEBUG: Policy ${policy.policyNumber} - status: "${policy.status}", policyStatus: "${policy.policyStatus}", currentStatus: "${currentStatus}", isActive: ${isActive}`);

                            return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; background: linear-gradient(135deg, #fafafa 0%, #f9fafb 100%); transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);"></div>
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                                    <div>
                                        <p style="margin: 0; font-weight: 600; color: #3b82f6; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            ${policy.policyNumber || 'No Policy Number'}
                                        </p>
                                        <p style="margin: 6px 0 0 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                                            ${policy.policyType || policy.type || 'Unknown Type'}
                                        </p>
                                        ${(() => {
                                            // Get business name from Named Insured tab first, then fallback to clientName
                                            const businessName = policy.insured?.['Name/Business Name'] ||
                                                                policy.insured?.['Primary Named Insured'] ||
                                                                policy.namedInsured?.name ||
                                                                policy.clientName;
                                            return businessName ? `
                                        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px; font-weight: 500;">
                                            ${businessName}
                                        </p>` : '';
                                        })()}
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <label style="position: relative; display: inline-block; width: 40px; height: 20px; cursor: pointer;">
                                            <input type="checkbox"
                                                   id="policyActiveToggle-${policy.id || policy.policyNumber}"
                                                   ${isActive ? 'checked' : ''}
                                                   onchange="window.togglePolicyStatus('${policy.id || policy.policyNumber}', this.checked)"
                                                   style="opacity: 0; width: 0; height: 0;">
                                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isActive ? '#10b981' : '#cbd5e0'}; transition: .4s; border-radius: 20px;">
                                                <span style="position: absolute; content: ''; height: 16px; width: 16px; left: ${isActive ? '22px' : '2px'}; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>
                                            </span>
                                        </label>
                                        <span style="background: ${isActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Client Portal ${isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div style="display: grid; gap: 8px; font-size: 14px; color: #4b5563;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Carrier:</span>
                                        <span style="color: #1f2937; font-weight: 500;">${policy.carrier || 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Premium:</span>
                                        <span style="color: #059669; font-weight: bold;">${formattedPremium}/yr</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Effective:</span>
                                        <span style="color: #1f2937;">${policy.effectiveDate ? formatDate(policy.effectiveDate) : 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Expires:</span>
                                        <span style="color: #1f2937;">${policy.expirationDate ? formatDate(policy.expirationDate) : 'N/A'}</span>
                                    </div>
                                </div>

                                <div style="display: flex; gap: 8px; margin-top: 12px;">
                                    <button onclick="viewPolicy('${policy.id}')" style="flex: 1; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                        View Details
                                    </button>
                                    <button onclick="deletePolicy('${policy.id}', '${id}')" style="padding: 6px 12px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            `;
                        }).join('') : `
                            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                                <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                                <p style="margin: 0 0 16px 0; font-size: 16px;">No policies found</p>
                                <button onclick="addPolicyToClient('${id}')" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    <i class="fas fa-plus"></i> Add First Policy
                                </button>
                                <button onclick="syncPoliciesForClient('${id}')" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 8px;">
                                    <i class="fas fa-sync-alt"></i> Sync Policies
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Documents Section -->
            <div style="padding: 24px; margin-top: 4px;">
                <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; width: 100%;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; margin-right: 12px;">
                                <i class="fas fa-folder" style="font-size: 20px;"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">Documents</h3>
                                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Client Files</p>
                            </div>
                        </div>
                        <button onclick="window.uploadClientDocument('${id}')" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-upload"></i> Upload
                        </button>
                    </div>
                    <div id="client-documents-list" style="display: grid; gap: 12px;">
                        ${window.renderClientDocuments(id)}
                    </div>
                </div>
            </div>
            </div>
        </div>
    `;
};

// Document Management Functions
window.renderClientDocuments = function(clientId) {
    // This will be populated by loadClientDocuments function
    const loadingHtml = `
        <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
            <p style="margin: 0; font-size: 16px;">Loading documents...</p>
        </div>
    `;

    // Load documents from server asynchronously
    loadClientDocuments(clientId);

    return loadingHtml;
};

// Load client documents from server
async function loadClientDocuments(clientId) {
    try {
        console.log('📁 Loading documents for client:', clientId);
        const url = `/api/documents?clientId=${clientId}`;
        console.log('📁 Fetching from URL:', url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📁 Raw API response:', data);
        const clientDocs = data.documents || [];

        console.log(`📁 Loaded ${clientDocs.length} documents from server`);

        // Update the documents display
        const documentsList = document.getElementById('client-documents-list');
        if (documentsList) {
            if (clientDocs.length === 0) {
                documentsList.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                        <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                        <p style="margin: 0; font-size: 16px;">No documents uploaded yet</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.7;">Click Upload to add files</p>
                    </div>
                `;
            } else {
                documentsList.innerHTML = clientDocs.map(doc => {
                    const fileIcon = getFileIcon(doc.type);
                    const fileSize = formatFileSize(doc.size);
                    const uploadDate = new Date(doc.uploadDate).toLocaleDateString();

                    return `
                        <div style="display: flex; align-items: center; padding: 12px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <i class="${fileIcon.icon}" style="color: ${fileIcon.color}; margin-right: 12px; font-size: 20px;"></i>
                            <div style="flex: 1;">
                                <p style="margin: 0; font-weight: 500; color: #1f2937; font-size: 14px;">${doc.name}</p>
                                <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">${fileSize} • Uploaded ${uploadDate} • by ${doc.uploadedBy}</p>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="window.downloadClientDocument('${clientId}', '${doc.id}')" style="padding: 6px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button onclick="window.deleteClientDocument('${clientId}', '${doc.id}')" style="padding: 6px 10px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('📁 Error loading documents:', error);
        const documentsList = document.getElementById('client-documents-list');
        if (documentsList) {
            documentsList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.7;"></i>
                    <p style="margin: 0; font-size: 16px;">Error loading documents</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.7;">Please refresh the page and try again</p>
                </div>
            `;
        }
    }
}

window.uploadClientDocument = function(clientId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx';

    input.onchange = async function(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        console.log(`📤 Uploading ${files.length} files for client ${clientId}...`);
        showNotification('Uploading documents...', 'info');

        try {
            const uploadPromises = files.map(file => uploadFileToServer(file, clientId));
            await Promise.all(uploadPromises);

            showNotification(`${files.length} document(s) uploaded successfully`, 'success');

            // Refresh documents display
            loadClientDocuments(clientId);

        } catch (error) {
            console.error('📤 Upload error:', error);
            showNotification('Error uploading documents', 'error');
        }
    };

    input.click();
};

// Upload single file to server
async function uploadFileToServer(file, clientId) {
    console.log('📤 Uploading file:', file.name, 'for client:', clientId);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);
    formData.append('uploadedBy', sessionStorage.getItem('vanguard_user') || 'User');

    const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('📤 Upload error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('📤 Upload success response:', result);
    return result;
}

window.downloadClientDocument = function(clientId, docId) {
    console.log(`📥 CLIENT DOCUMENT DOWNLOAD CALLED - Client: ${clientId}, Doc: ${docId}`);

    // Prevent any potential conflicts by explicitly calling this function
    try {
        console.log(`📥 Creating download link for document ${docId}...`);

        // Create download link to server endpoint
        const link = document.createElement('a');
        const downloadUrl = `/api/download-document?docId=${docId}`;
        console.log(`📥 Download URL: ${downloadUrl}`);

        link.href = downloadUrl;
        link.target = '_blank'; // Open in new tab for better UX
        link.click();

        console.log(`📥 Download link clicked successfully`);
        showNotification('Download started', 'info');
    } catch (error) {
        console.error('📥 Download error:', error);
        showNotification('Download failed', 'error');
    }
};

window.deleteClientDocument = async function(clientId, docId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        return;
    }

    try {
        console.log(`🗑️ Deleting document ${docId}...`);

        const response = await fetch(`/api/documents/${docId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        showNotification('Document deleted successfully', 'success');

        // Refresh documents display
        loadClientDocuments(clientId);

    } catch (error) {
        console.error('🗑️ Delete error:', error);
        showNotification('Error deleting document', 'error');
    }
};

function getFileIcon(fileType) {
    const type = (fileType || '').toLowerCase();

    if (type.includes('pdf')) {
        return { icon: 'fas fa-file-pdf', color: '#dc2626' };
    } else if (type.includes('word') || type.includes('doc')) {
        return { icon: 'fas fa-file-word', color: '#2563eb' };
    } else if (type.includes('excel') || type.includes('sheet')) {
        return { icon: 'fas fa-file-excel', color: '#059669' };
    } else if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png')) {
        return { icon: 'fas fa-file-image', color: '#7c3aed' };
    } else if (type.includes('text')) {
        return { icon: 'fas fa-file-alt', color: '#6b7280' };
    } else {
        return { icon: 'fas fa-file', color: '#6b7280' };
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to toggle policy status in policy cards
window.togglePolicyStatus = function(policyId, isActive) {
    console.log('🔄 [HTTPS VERSION] Toggling policy status for policy:', policyId, 'Active:', isActive);

    const newStatus = isActive ? 'Active' : 'Inactive';

    // Update the visual feedback of the toggle
    const toggle = document.getElementById(`policyActiveToggle-${policyId}`);
    if (toggle) {
        const slider = toggle.nextElementSibling;
        const knob = slider.querySelector('span:last-child');

        // Update colors and position
        slider.style.backgroundColor = isActive ? '#10b981' : '#cbd5e0';
        knob.style.left = isActive ? '22px' : '2px';

        // Update the status badge text and color
        const statusBadge = slider.parentElement.nextElementSibling;
        if (statusBadge) {
            statusBadge.textContent = `Client Portal ${newStatus}`;
            // Update badge background color based on status
            statusBadge.style.background = isActive
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)';
        }
    }

    // Find and update the policy in localStorage
    try {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policyIndex = policies.findIndex(p => p.id === policyId || p.policyNumber === policyId);

        if (policyIndex !== -1) {
            policies[policyIndex].status = newStatus;
            policies[policyIndex].policyStatus = newStatus;
            localStorage.setItem('insurance_policies', JSON.stringify(policies));
            console.log('✅ Policy status updated in localStorage:', newStatus);
        }

        // Also update in window.allPolicies if it exists
        if (window.allPolicies && Array.isArray(window.allPolicies)) {
            const windowPolicyIndex = window.allPolicies.findIndex(p => p.id === policyId || p.policyNumber === policyId);
            if (windowPolicyIndex !== -1) {
                window.allPolicies[windowPolicyIndex].status = newStatus;
                window.allPolicies[windowPolicyIndex].policyStatus = newStatus;
                console.log('✅ Policy status updated in window.allPolicies:', newStatus);
            }
        }

        // Update database via API
        const timestamp = new Date().getTime();
        const apiUrl = `https://162-220-14-239.nip.io/api/policies?t=${timestamp}`;
        console.log('🌐 Making API request to:', apiUrl);
        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: policyId,
                status: newStatus,
                policyStatus: newStatus
            })
        }).then(response => {
            console.log('🔄 Server response status:', response.status);
            return response.json();
        }).then(data => {
            console.log('✅ Server response data:', data);
            if (data.success) {
                console.log('✅ Policy status updated in database:', newStatus);
                if (window.showNotification) {
                    window.showNotification(`Policy status updated to ${newStatus}`, 'success');
                }

                // Force refresh the UI to reflect the new status
                console.log('🔄 Force refreshing UI to reflect new status...');
                setTimeout(() => {
                    if (window.currentViewingClientId && window.viewClientOriginal) {
                        window.viewClientOriginal(window.currentViewingClientId);
                    } else {
                        location.reload();
                    }
                }, 500);

            } else {
                console.warn('⚠️ Failed to update status in database:', data.message);
                if (window.showNotification) {
                    window.showNotification('Status updated locally only', 'warning');
                }
            }
        }).catch(error => {
            console.error('❌ Error updating status:', error);
            if (window.showNotification) {
                window.showNotification('Status updated locally only', 'warning');
            }
        });

    } catch (error) {
        console.error('❌ Error updating policy status:', error);
        if (window.showNotification) {
            window.showNotification('Error updating policy status', 'error');
        }
    }
};

// Function to toggle client portal access
window.toggleClientPortalAccess = function(clientId, isEnabled) {
    console.log('🔄 Toggling client portal access for client:', clientId, 'Enabled:', isEnabled);

    // Update the visual feedback of the toggle
    const toggle = document.getElementById(`clientPortalToggle-${clientId}`);
    if (toggle) {
        const slider = toggle.nextElementSibling;
        const knob = slider.querySelector('span:last-child');

        // Update colors and position
        slider.style.backgroundColor = isEnabled ? '#10b981' : '#cbd5e0';
        knob.style.left = isEnabled ? '24px' : '2px';
    }

    // Find and update the client in localStorage
    try {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const clientIndex = clients.findIndex(c => c.id === clientId);

        if (clientIndex !== -1) {
            clients[clientIndex].portalAccess = isEnabled;
            localStorage.setItem('insurance_clients', JSON.stringify(clients));
            console.log('✅ Client portal access updated in localStorage:', isEnabled);
        }

        // Update database via API
        fetch('/api/clients', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: clientId,
                portalAccess: isEnabled
            })
        }).then(response => {
            if (response.ok) {
                console.log('✅ Client portal access updated in database:', isEnabled);
                if (window.showNotification) {
                    window.showNotification(`Client portal access ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
                }
            } else {
                console.warn('⚠️ Failed to update portal access in database');
                if (window.showNotification) {
                    window.showNotification('Portal access updated locally only', 'warning');
                }
            }
        }).catch(error => {
            console.error('❌ Error updating portal access:', error);
            if (window.showNotification) {
                window.showNotification('Portal access updated locally only', 'warning');
            }
        });

    } catch (error) {
        console.error('❌ Error updating client portal access:', error);
        if (window.showNotification) {
            window.showNotification('Error updating portal access', 'error');
        }
    }
};

// Function to edit client portal email
window.editClientPortalEmail = function(clientId, currentEmail) {
    console.log('📧 Editing client portal email for client:', clientId);

    const newEmail = prompt('Enter new portal email:', currentEmail || '');
    if (newEmail === null) return; // User cancelled

    if (newEmail && !newEmail.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        // Update localStorage
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const clientIndex = clients.findIndex(c => c.id === clientId);

        if (clientIndex !== -1) {
            clients[clientIndex].email = newEmail;
            localStorage.setItem('insurance_clients', JSON.stringify(clients));
            console.log('✅ Client email updated in localStorage:', newEmail);
        }

        // Update database via API
        fetch('/api/clients', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: clientId,
                email: newEmail
            })
        }).then(response => {
            if (response.ok) {
                console.log('✅ Client email updated in database:', newEmail);
                if (window.showNotification) {
                    window.showNotification('Portal email updated successfully', 'success');
                }
                // Refresh the client profile to show new email
                window.viewClient(clientId);
            } else {
                console.warn('⚠️ Failed to update email in database');
                if (window.showNotification) {
                    window.showNotification('Email updated locally only', 'warning');
                }
            }
        }).catch(error => {
            console.error('❌ Error updating email:', error);
            if (window.showNotification) {
                window.showNotification('Email updated locally only', 'warning');
            }
        });

    } catch (error) {
        console.error('❌ Error updating client email:', error);
        if (window.showNotification) {
            window.showNotification('Error updating email', 'error');
        }
    }
};

// Function to create client portal password
window.createClientPortalPassword = function(clientId) {
    window.changeClientPortalPassword(clientId);
};

// Function to change client portal password
window.changeClientPortalPassword = function(clientId) {
    console.log('🔄 Changing client portal password for client:', clientId);

    const newPassword = prompt('Enter new portal password (minimum 8 characters):');
    if (newPassword === null) return; // User cancelled

    if (!newPassword || newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }

    // Get client email — try API first, fall back to localStorage
    function getClientEmail() {
        return fetch('/api/clients/' + clientId)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
            .then(client => {
                if (client && (client.email || client.clientEmail)) return client.email || client.clientEmail;
                const locals = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const local = locals.find(c => c.id === clientId);
                return local ? (local.email || local.clientEmail || '') : '';
            });
    }

    getClientEmail().then(email => {
        if (!email) {
            if (window.showNotification) window.showNotification('Could not find client email', 'error');
            return;
        }

        return fetch('/api/portal/crm/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: clientId, email: email, password: newPassword })
        }).then(res => res.json().then(data => ({ ok: res.ok, data })));
    }).then(result => {
        if (!result) return;
        if (result.ok) {
            // Update localStorage to reflect new password
            try {
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const idx = clients.findIndex(c => c.id === clientId);
                if (idx !== -1) { clients[idx].portalPassword = newPassword; localStorage.setItem('insurance_clients', JSON.stringify(clients)); }
            } catch (e) { /* ignore */ }
            console.log('✅ Portal password updated');
            if (window.showNotification) window.showNotification('Portal password changed successfully!', 'success');
            window.viewClient(clientId);
        } else {
            console.warn('⚠️ Failed:', result.data);
            if (window.showNotification) window.showNotification(result.data.error || 'Failed to change password', 'error');
        }
    }).catch(error => {
        console.error('❌ Error changing password:', error);
        if (window.showNotification) window.showNotification('Error changing password', 'error');
    });
};

// Function to toggle password visibility
window.togglePasswordVisibility = function(clientId, password, buttonElement) {
    const displayElement = document.getElementById(`password-display-${clientId}`);
    const icon = buttonElement.querySelector('i');

    if (!displayElement || !icon) return;

    const isHidden = displayElement.textContent === '●●●●●●●●';

    if (isHidden) {
        // Show password
        displayElement.textContent = password;
        displayElement.style.letterSpacing = '1px';
        icon.className = 'fas fa-eye-slash';
        buttonElement.title = 'Hide Password';
        buttonElement.style.background = '#fee2e2';
        buttonElement.style.color = '#dc2626';
        buttonElement.style.borderColor = '#fecaca';
    } else {
        // Hide password
        displayElement.textContent = '●●●●●●●●';
        displayElement.style.letterSpacing = '2px';
        icon.className = 'fas fa-eye';
        buttonElement.title = 'Show Password';
        buttonElement.style.background = '#f3f4f6';
        buttonElement.style.color = '#374151';
        buttonElement.style.borderColor = '#d1d5db';
    }
};

// Override the current viewClient function with the original simple design
window.viewClient = window.viewClientOriginal;

// Sync Policies — find unlinked policies that match this client and let user attach them
window.syncPoliciesForClient = async function(clientId) {
    // Get client info
    let client;
    try {
        const r = await fetch('/api/clients');
        const d = await r.json();
        const clients = Array.isArray(d) ? d : (d.clients || []);
        client = clients.find(c => String(c.id) === String(clientId));
    } catch(e) {}
    if (!client) { showNotification('Client not found', 'error'); return; }

    // Get all policies
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Stop words that are too common to count as meaningful matches
    const STOP_WORDS = new Set(['llc','inc','ltd','co','corp','lp','the','and','of','transport',
        'trucking','transportation','logistics','hauling','services','enterprises','solutions',
        'construction','group','global','management','systems','company','associates']);

    function normalize(s) {
        return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    }
    function meaningfulTokens(s) {
        return normalize(s).split(/\s+/).filter(t => t.length > 1 && !STOP_WORDS.has(t));
    }

    const clientNameTokens = meaningfulTokens(client.name || '');
    const clientBizTokens  = meaningfulTokens(client.businessName || '');
    const clientBizNorm    = normalize(client.businessName || '');
    const clientNameNorm   = normalize(client.name || '');

    function nameScore(policyName) {
        if (!policyName) return 0;
        const pNorm   = normalize(policyName);
        // Exact business name match → highest score
        if (clientBizNorm && pNorm === clientBizNorm) return 10;
        if (clientNameNorm && pNorm === clientNameNorm) return 10;
        const pTokens = meaningfulTokens(policyName);
        if (pTokens.length === 0) return 0;
        let matches = 0;
        for (const t of clientNameTokens) if (pTokens.includes(t)) matches++;
        for (const t of clientBizTokens)  if (pTokens.includes(t)) matches++;
        return matches;
    }

    // Find policies NOT already linked to this client but likely belonging to them (score >= 2)
    const unlinked = allPolicies.filter(p => {
        if (p.clientId && String(p.clientId) === String(clientId)) return false; // already linked
        const pName = p.insuredName || p.clientName || p.contact?.['Owner Name'] ||
                      p.insured?.['Name/Business Name'] || p.insured?.['Primary Named Insured'] || '';
        return nameScore(pName) >= 2;
    });

    if (unlinked.length === 0) {
        showNotification('No unlinked policies found matching this client', 'info');
        return;
    }

    // Build modal
    const overlay = document.createElement('div');
    overlay.id = 'sync-policies-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';

    const rows = unlinked.map(p => {
        const pName = p.insuredName || p.clientName || p.contact?.['Owner Name'] ||
                      p.insured?.['Name/Business Name'] || p.insured?.['Primary Named Insured'] || '—';
        const polNo  = p.policyNumber || p.id || '—';
        const type   = p.policyType || p.type || '—';
        const eff    = p.effectiveDate || p.overview?.['Effective Date'] || '—';
        const exp    = p.expirationDate || p.overview?.['Expiration Date'] || '—';
        const prem   = p.premium || p.financial?.['Annual Premium'] || p.financial?.premium || '—';
        const score  = nameScore(pName);
        const conf   = score >= 10 ? '🟢 Exact' : score >= 3 ? '🟢 High' : '🟡 Medium';
        return `
            <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:10px 8px;"><input type="checkbox" class="sync-pol-cb" data-id="${p.id || ''}" data-polno="${polNo}" ${score >= 3 ? 'checked' : ''}></td>
                <td style="padding:10px 8px;font-size:13px;font-weight:600;color:#1f2937;">${polNo}</td>
                <td style="padding:10px 8px;font-size:13px;color:#374151;">${pName}</td>
                <td style="padding:10px 8px;font-size:13px;color:#374151;">${type}</td>
                <td style="padding:10px 8px;font-size:13px;color:#6b7280;">${eff} → ${exp}</td>
                <td style="padding:10px 8px;font-size:13px;color:#059669;font-weight:600;">${prem ? '$'+String(prem).replace(/[^0-9.]/g,'') : '—'}</td>
                <td style="padding:10px 8px;font-size:12px;">${conf}</td>
            </tr>`;
    }).join('');

    overlay.innerHTML = `
        <div style="background:white;border-radius:16px;padding:32px;max-width:860px;width:95%;max-height:80vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
                <div>
                    <h2 style="margin:0;font-size:20px;font-weight:700;color:#1f2937;"><i class="fas fa-sync-alt" style="color:#10b981;margin-right:10px;"></i>Sync Policies</h2>
                    <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Found ${unlinked.length} unlinked ${unlinked.length === 1 ? 'policy' : 'policies'} matching <strong>${client.name || client.businessName}</strong>. Select the ones to link.</p>
                </div>
                <button onclick="document.getElementById('sync-policies-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#9ca3af;line-height:1;">&times;</button>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                        <th style="padding:8px;width:36px;"><input type="checkbox" id="sync-pol-all" onchange="document.querySelectorAll('.sync-pol-cb').forEach(cb=>cb.checked=this.checked)" checked></th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">POLICY #</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">INSURED NAME</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">TYPE</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">DATES</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">PREMIUM</th>
                        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">MATCH</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
                <button onclick="document.getElementById('sync-policies-overlay').remove()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;cursor:pointer;font-size:14px;">Cancel</button>
                <button onclick="window._confirmSyncPolicies('${clientId}')" style="padding:10px 20px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;"><i class="fas fa-link"></i> Link Selected Policies</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
};

window._confirmSyncPolicies = async function(clientId) {
    const checked = [...document.querySelectorAll('.sync-pol-cb:checked')];
    if (checked.length === 0) { showNotification('No policies selected', 'warning'); return; }

    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    let linked = 0;

    for (const cb of checked) {
        const pid = cb.dataset.id;
        const idx = allPolicies.findIndex(p => String(p.id) === String(pid));
        if (idx === -1) continue;
        allPolicies[idx].clientId = clientId;
        // Persist to server
        try {
            await fetch(`/api/policies/${pid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allPolicies[idx])
            });
        } catch(e) { console.warn('Could not sync policy to server:', e); }
        linked++;
    }

    localStorage.setItem('insurance_policies', JSON.stringify(allPolicies));
    document.getElementById('sync-policies-overlay')?.remove();
    showNotification(`Linked ${linked} ${linked === 1 ? 'policy' : 'policies'} to client`, 'success');

    // Reload the profile to reflect changes
    if (typeof window.viewClientOriginal === 'function') window.viewClientOriginal(clientId);
};

console.log('Original client profile design restored');