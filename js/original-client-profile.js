// Original Simple Client Profile Design
window.viewClientOriginal = function(id) {
    console.log('Loading original client profile for:', id);

    // Store the client ID globally for refresh after policy deletion
    window.currentViewingClientId = id;

    // Get client data
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id == id);

    if (!client) {
        showNotification('Client not found', 'error');
        loadClientsView();
        return;
    }

    // Get policies for this client - ALWAYS get fresh data from localStorage
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log('Total policies in storage:', allPolicies.length);
    console.log('Client ID:', id, 'Client Name:', client.name);

    const clientPolicies = allPolicies.filter(policy => {
        // Match by clientId
        if (policy.clientId && String(policy.clientId) === String(id)) {
            console.log('Policy matched by clientId:', policy.policyNumber);
            return true;
        }

        // Match by insured name
        const insuredName = policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           policy.insuredName;
        if (insuredName && client.name && insuredName.toLowerCase() === client.name.toLowerCase()) {
            console.log('Policy matched by insured name:', policy.policyNumber, 'Insured:', insuredName);
            return true;
        }

        // DO NOT check client.policies array as it may be outdated
        // Only use the fresh data from insurance_policies storage

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

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 0 24px;">
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
                            <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 500;">${client.fullName || client.contactName || 'N/A'}</p>
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
                                    <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                        ${policy.policyStatus || policy.status || 'Active'}
                                    </span>
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
                                        <span style="color: #1f2937;">${policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Expires:</span>
                                        <span style="color: #1f2937;">${policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A'}</span>
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

// Override the current viewClient function with the original simple design
window.viewClient = window.viewClientOriginal;

console.log('Original client profile design restored');