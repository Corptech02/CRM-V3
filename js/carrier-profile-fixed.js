// Fixed Carrier Profile Modal Handler
// This version ensures the modal stays visible

window.viewLeadDetails = function(usdot) {
    console.log('=== VIEWING CARRIER DETAILS ===');
    console.log('USDOT:', usdot);
    
    // First, show a simple test modal to ensure it works
    const testModal = document.createElement('div');
    testModal.id = 'carrierProfileModal';
    testModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    testModal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 90%; max-height: 90%; overflow: auto;">
            <h2>Loading Carrier Profile...</h2>
            <p>USDOT: ${usdot}</p>
            <div id="profile-content">
                <p>Fetching data from database...</p>
            </div>
            <button onclick="document.getElementById('carrierProfileModal').remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
    `;
    
    // Remove any existing modal
    const existing = document.getElementById('carrierProfileModal');
    if (existing) existing.remove();
    
    // Add modal to page
    document.body.appendChild(testModal);
    
    // Now fetch the data
    fetch(`/api/carrier/${usdot}`)
        .then(response => {
            console.log('API Response:', response.status);
            if (!response.ok) throw new Error('Carrier not found');
            return response.json();
        })
        .then(carrier => {
            console.log('Carrier data received:', carrier);
            
            // Update the modal content
            const contentDiv = document.getElementById('profile-content');
            if (contentDiv) {
                contentDiv.innerHTML = `
                    <style>
                        .profile-tabs { display: flex; gap: 0.5rem; border-bottom: 2px solid #ddd; margin-bottom: 1rem; }
                        .profile-tab { padding: 0.5rem 1rem; background: none; border: none; cursor: pointer; }
                        .profile-tab.active { border-bottom: 2px solid #007bff; color: #007bff; }
                        .tab-content { display: none; }
                        .tab-content.active { display: block; }
                        .info-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; }
                        .info-label { font-weight: bold; color: #666; }
                        .info-value { color: #333; }
                        .section-title { font-size: 1.2rem; font-weight: bold; margin: 1rem 0 0.5rem 0; color: #333; }
                    </style>
                    
                    <h2>${carrier.legal_name || 'Unknown Carrier'}</h2>
                    ${carrier.dba_name ? `<p style="color: #666;">DBA: ${carrier.dba_name}</p>` : ''}
                    
                    <div class="profile-tabs">
                        <button class="profile-tab active" onclick="showTab('basic')">Basic Info</button>
                        <button class="profile-tab" onclick="showTab('insurance')">Insurance</button>
                        <button class="profile-tab" onclick="showTab('operations')">Operations</button>
                        <button class="profile-tab" onclick="showTab('officers')">Officers</button>
                    </div>
                    
                    <div id="basic" class="tab-content active">
                        <div class="section-title">📍 Contact Information</div>
                        <div class="info-row">
                            <span class="info-label">Address:</span>
                            <span class="info-value">${carrier.street || 'N/A'}, ${carrier.city}, ${carrier.state} ${carrier.zip_code}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone:</span>
                            <span class="info-value">${carrier.phone || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${carrier.email_address || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Entity Type:</span>
                            <span class="info-value">${carrier.entity_type || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Operating Status:</span>
                            <span class="info-value" style="color: ${carrier.operating_status === 'Active' ? 'green' : 'orange'}">
                                ${carrier.operating_status || 'N/A'}
                            </span>
                        </div>
                    </div>
                    
                    <div id="insurance" class="tab-content">
                        <div class="section-title">🛡️ Insurance Information</div>
                        <div style="padding: 1rem; background: ${carrier.bipd_insurance_on_file_amount > 0 ? '#d4edda' : '#f8d7da'}; border-radius: 4px; margin-bottom: 1rem;">
                            <strong style="color: ${carrier.bipd_insurance_on_file_amount > 0 ? 'green' : 'red'}">
                                ${carrier.bipd_insurance_on_file_amount > 0 ? '✅ Insurance on File' : '❌ No Insurance on File'}
                            </strong>
                            ${carrier.bipd_insurance_on_file_amount > 0 ? 
                                `<p style="font-size: 1.5rem; margin: 0.5rem 0;">$${Number(carrier.bipd_insurance_on_file_amount).toLocaleString()}</p>` : ''}
                        </div>
                        <div class="info-row">
                            <span class="info-label">Insurance Carrier:</span>
                            <span class="info-value">${carrier.insurance_carrier || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Policy Number:</span>
                            <span class="info-value">${carrier.policy_number || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Required Amount:</span>
                            <span class="info-value">${carrier.bipd_insurance_required_amount ? 
                                `$${Number(carrier.bipd_insurance_required_amount).toLocaleString()}` : 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Policy Effective:</span>
                            <span class="info-value">${carrier.policy_effective_date || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Policy Renewal:</span>
                            <span class="info-value">${carrier.policy_renewal_date || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div id="operations" class="tab-content">
                        <div class="section-title">🚚 Fleet & Operations</div>
                        <div style="display: flex; gap: 2rem; margin: 1rem 0;">
                            <div style="text-align: center; padding: 1rem; background: #f0f0f0; border-radius: 4px; flex: 1;">
                                <div style="font-size: 2rem; color: #007bff;">${carrier.power_units || 0}</div>
                                <div>Power Units</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: #f0f0f0; border-radius: 4px; flex: 1;">
                                <div style="font-size: 2rem; color: #28a745;">${carrier.drivers || 0}</div>
                                <div>Drivers</div>
                            </div>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Carrier Operation:</span>
                            <span class="info-value">${carrier.carrier_operation || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">MCS-150 Date:</span>
                            <span class="info-value">${carrier.mcs150_date || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div id="officers" class="tab-content">
                        <div class="section-title">👥 Officers & Representatives</div>
                        ${carrier.principal_name ? `
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
                                <strong>Principal Officer</strong><br>
                                Name: ${carrier.principal_name}<br>
                                Title: ${carrier.principal_title || 'N/A'}
                            </div>
                        ` : ''}
                        ${carrier.representative_1_name ? `
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
                                <strong>Representative 1</strong><br>
                                Name: ${carrier.representative_1_name}<br>
                                Title: ${carrier.representative_1_title || 'N/A'}<br>
                                Nationality: ${carrier.representative_1_nationality || 'N/A'}
                            </div>
                        ` : ''}
                        ${carrier.representative_2_name ? `
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
                                <strong>Representative 2</strong><br>
                                Name: ${carrier.representative_2_name}<br>
                                Title: ${carrier.representative_2_title || 'N/A'}<br>
                                Nationality: ${carrier.representative_2_nationality || 'N/A'}
                            </div>
                        ` : ''}
                        ${!carrier.principal_name && !carrier.representative_1_name && !carrier.representative_2_name ? 
                            '<p style="color: #666;">No officer information available</p>' : ''}
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error loading carrier:', error);
            const contentDiv = document.getElementById('profile-content');
            if (contentDiv) {
                contentDiv.innerHTML = `
                    <div style="color: red;">
                        <h3>Error Loading Profile</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        });
    
    return false;
};

// Tab switching function
window.showTab = function(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Mark button as active
    if (event && event.target) {
        event.target.classList.add('active');
    }
};

// Contact function
window.contactLead = function(usdot) {
    alert(`Contact carrier USDOT: ${usdot}\n\nEmail and dialer features coming soon!`);
    return false;
};

console.log('✅ Carrier Profile handler (fixed version) loaded');