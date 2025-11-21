// Carrier Profile Modal Handler
// Displays comprehensive carrier information

window.viewLeadDetails = async function(usdot) {
    console.log('Loading carrier details for USDOT:', usdot);
    
    // Prevent any default behavior
    if (window.event) {
        window.event.preventDefault();
        window.event.stopPropagation();
    }
    
    // Show loading modal
    showCarrierModal(`
        <div class="text-center">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <h3>Loading Carrier Profile...</h3>
            <p>USDOT: ${usdot}</p>
        </div>
    `);
    
    try {
        // Fetch carrier details
        const response = await fetch(`/api/carrier/${usdot}`);
        if (!response.ok) {
            throw new Error('Carrier not found');
        }
        
        const carrier = await response.json();
        console.log('Carrier details loaded:', carrier);
        
        // Format the detailed profile
        const profileHTML = `
            <div class="carrier-profile">
                <!-- Header -->
                <div class="profile-header">
                    <h2>${carrier.legal_name || 'Unknown Carrier'}</h2>
                    ${carrier.dba_name ? `<p class="dba">DBA: ${carrier.dba_name}</p>` : ''}
                    <div class="status-badges">
                        <span class="badge ${carrier.operating_status === 'Active' ? 'badge-success' : 'badge-warning'}">
                            ${carrier.operating_status || 'Unknown Status'}
                        </span>
                        <span class="badge badge-info">USDOT: ${carrier.usdot_number}</span>
                    </div>
                </div>
                
                <!-- Tabbed Content -->
                <div class="profile-tabs">
                    <button class="tab-btn active" onclick="showProfileTab('basic')">Basic Info</button>
                    <button class="tab-btn" onclick="showProfileTab('insurance')">Insurance</button>
                    <button class="tab-btn" onclick="showProfileTab('operations')">Operations</button>
                    <button class="tab-btn" onclick="showProfileTab('officers')">Officers/Owners</button>
                    <button class="tab-btn" onclick="showProfileTab('compliance')">Compliance</button>
                </div>
                
                <!-- Tab Content -->
                <div class="profile-content">
                    <!-- Basic Info Tab -->
                    <div id="basic-tab" class="tab-content active">
                        <h3><i class="fas fa-building"></i> Company Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Legal Name:</label>
                                <span>${carrier.legal_name || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>DBA Name:</label>
                                <span>${carrier.dba_name || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Entity Type:</label>
                                <span>${carrier.entity_type || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>USDOT Number:</label>
                                <span class="font-mono">${carrier.usdot_number}</span>
                            </div>
                        </div>
                        
                        <h3><i class="fas fa-map-marker-alt"></i> Contact Information</h3>
                        <div class="info-grid">
                            <div class="info-item full-width">
                                <label>Address:</label>
                                <span>${carrier.street || 'N/A'}<br>
                                ${carrier.city}, ${carrier.state} ${carrier.zip_code}</span>
                            </div>
                            <div class="info-item">
                                <label>Phone:</label>
                                <span><a href="tel:${carrier.phone}">${carrier.phone || 'N/A'}</a></span>
                            </div>
                            <div class="info-item">
                                <label>Email:</label>
                                <span>${carrier.email_address ? `<a href="mailto:${carrier.email_address}">${carrier.email_address}</a>` : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Insurance Tab -->
                    <div id="insurance-tab" class="tab-content">
                        <h3><i class="fas fa-shield-alt"></i> Insurance Information</h3>
                        <div class="insurance-status ${carrier.bipd_insurance_on_file_amount > 0 ? 'insured' : 'uninsured'}">
                            <div class="status-icon">
                                ${carrier.bipd_insurance_on_file_amount > 0 ? 
                                    '<i class="fas fa-check-circle"></i>' : 
                                    '<i class="fas fa-exclamation-triangle"></i>'}
                            </div>
                            <div>
                                <h4>${carrier.bipd_insurance_on_file_amount > 0 ? 'Insurance on File' : 'No Insurance on File'}</h4>
                                ${carrier.bipd_insurance_on_file_amount > 0 ? 
                                    `<p class="amount">$${Number(carrier.bipd_insurance_on_file_amount).toLocaleString()}</p>` : ''}
                            </div>
                        </div>
                        
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Insurance Carrier:</label>
                                <span>${carrier.insurance_carrier || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Policy Number:</label>
                                <span class="font-mono">${carrier.policy_number || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Required Amount:</label>
                                <span>${carrier.bipd_insurance_required_amount ? 
                                    `$${Number(carrier.bipd_insurance_required_amount).toLocaleString()}` : 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>On File Amount:</label>
                                <span>${carrier.bipd_insurance_on_file_amount ? 
                                    `$${Number(carrier.bipd_insurance_on_file_amount).toLocaleString()}` : 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Policy Effective Date:</label>
                                <span>${formatDate(carrier.policy_effective_date)}</span>
                            </div>
                            <div class="info-item">
                                <label>Policy Renewal Date:</label>
                                <span class="${isExpiringSoon(carrier.policy_renewal_date) ? 'text-warning' : ''}">
                                    ${formatDate(carrier.policy_renewal_date)}
                                    ${isExpiringSoon(carrier.policy_renewal_date) ? ' ⚠️ Expiring Soon' : ''}
                                </span>
                            </div>
                            <div class="info-item">
                                <label>Last Insurance Update:</label>
                                <span>${formatDate(carrier.insurance_updated)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Operations Tab -->
                    <div id="operations-tab" class="tab-content">
                        <h3><i class="fas fa-truck"></i> Fleet & Operations</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <i class="fas fa-truck"></i>
                                <div class="stat-value">${carrier.power_units || '0'}</div>
                                <div class="stat-label">Power Units</div>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-user-tie"></i>
                                <div class="stat-value">${carrier.drivers || '0'}</div>
                                <div class="stat-label">Drivers</div>
                            </div>
                        </div>
                        
                        <div class="info-grid">
                            <div class="info-item full-width">
                                <label>Carrier Operation:</label>
                                <span>${carrier.carrier_operation || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Operating Status:</label>
                                <span class="${carrier.operating_status === 'Active' ? 'text-success' : 'text-warning'}">
                                    ${carrier.operating_status || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Officers Tab -->
                    <div id="officers-tab" class="tab-content">
                        <h3><i class="fas fa-users"></i> Officers & Representatives</h3>
                        
                        ${carrier.principal_name ? `
                        <div class="officer-card">
                            <h4>Principal Officer</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Name:</label>
                                    <span>${carrier.principal_name}</span>
                                </div>
                                <div class="info-item">
                                    <label>Title:</label>
                                    <span>${carrier.principal_title || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${carrier.representative_1_name ? `
                        <div class="officer-card">
                            <h4>Representative 1</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Name:</label>
                                    <span>${carrier.representative_1_name}</span>
                                </div>
                                <div class="info-item">
                                    <label>Title:</label>
                                    <span>${carrier.representative_1_title || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Nationality:</label>
                                    <span>${carrier.representative_1_nationality || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${carrier.representative_2_name ? `
                        <div class="officer-card">
                            <h4>Representative 2</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Name:</label>
                                    <span>${carrier.representative_2_name}</span>
                                </div>
                                <div class="info-item">
                                    <label>Title:</label>
                                    <span>${carrier.representative_2_title || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Nationality:</label>
                                    <span>${carrier.representative_2_nationality || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${carrier.officers_data ? `
                        <div class="officer-card">
                            <h4>Additional Officers</h4>
                            <div class="info-item full-width">
                                <pre>${carrier.officers_data}</pre>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${!carrier.principal_name && !carrier.representative_1_name && !carrier.representative_2_name && !carrier.officers_data ? 
                            '<p class="text-muted">No officer information available</p>' : ''}
                    </div>
                    
                    <!-- Compliance Tab -->
                    <div id="compliance-tab" class="tab-content">
                        <h3><i class="fas fa-clipboard-check"></i> Compliance & Records</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>MCS-150 Date:</label>
                                <span>${formatDate(carrier.mcs150_date)}</span>
                            </div>
                            <div class="info-item">
                                <label>Record Created:</label>
                                <span>${formatDate(carrier.created_at)}</span>
                            </div>
                        </div>
                        
                        <div class="compliance-actions">
                            <h4>Quick Actions</h4>
                            <div class="action-buttons">
                                <button class="btn-primary" onclick="generateQuote('${carrier.usdot_number}')">
                                    <i class="fas fa-file-invoice-dollar"></i> Generate Quote
                                </button>
                                <button class="btn-secondary" onclick="exportCarrierProfile('${carrier.usdot_number}')">
                                    <i class="fas fa-download"></i> Export Profile
                                </button>
                                <button class="btn-secondary" onclick="addToLeadList('${carrier.usdot_number}')">
                                    <i class="fas fa-plus"></i> Add to Lead List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        showCarrierModal(profileHTML);
        
    } catch (error) {
        console.error('Error loading carrier details:', error);
        showCarrierModal(`
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Error Loading Profile</h3>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="closeCarrierModal()">Close</button>
            </div>
        `);
    }
};

// Show modal with content
function showCarrierModal(content) {
    try {
        console.log('Showing carrier modal...');
        
        // Remove existing modal if any
        const existingModal = document.getElementById('carrierProfileModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'carrierProfileModal';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.7) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 999999 !important;';
        modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <button class="modal-close" onclick="closeCarrierModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCarrierModal();
        }
    });
    
    console.log('Modal successfully displayed');
    } catch (error) {
        console.error('Error showing modal:', error);
        alert('Error displaying carrier profile: ' + error.message);
    }
}

// Close modal
window.closeCarrierModal = function() {
    const modal = document.getElementById('carrierProfileModal');
    if (modal) {
        modal.remove();
    }
};

// Tab switching
window.showProfileTab = function(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Mark button as active
    event.target.classList.add('active');
};

// Helper functions
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function isExpiringSoon(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    const daysUntil = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
}

// Action functions
window.generateQuote = function(usdot) {
    alert(`Generate insurance quote for USDOT: ${usdot}\n\nThis feature will integrate with your quoting system.`);
};

window.exportCarrierProfile = function(usdot) {
    // Fetch and download profile as PDF/CSV
    window.open(`/api/carrier/${usdot}`);
};

window.addToLeadList = function(usdot) {
    alert(`Added USDOT ${usdot} to lead list!\n\nThis carrier will appear in your saved leads.`);
};

// Contact function
window.contactLead = function(usdot) {
    alert(`Opening communication with carrier USDOT: ${usdot}\n\nEmail template and dialer will open here.`);
};

console.log('✅ Carrier Profile handler loaded');