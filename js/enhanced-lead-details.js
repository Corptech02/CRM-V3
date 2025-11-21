/**
 * Enhanced Lead Details View - Shows transcripts, vehicles, notes
 */

// Override the viewLeadDetails function to show FULL information
window.viewLeadDetails = function(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id === leadId || l.id == leadId || String(l.id) === String(leadId));
    
    if (!lead) {
        console.error('Lead not found:', leadId);
        return;
    }
    
    // Create enhanced modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'z-index: 10000;';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2>${lead.name}</h2>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <div class="modal-body">
                <!-- Basic Info -->
                <div class="lead-detail-section">
                    <h3><i class="fas fa-info-circle"></i> Basic Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Contact:</label>
                            <span>${lead.contact || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${lead.phone || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${lead.email || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Stage:</label>
                            <span class="badge badge-${lead.stage}">${lead.stage || 'new'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Premium:</label>
                            <span>$${(lead.premium || 0).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Renewal Date:</label>
                            <span>${lead.renewalDate || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>DOT Number:</label>
                            <span>${lead.dotNumber || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>MC Number:</label>
                            <span>${lead.mcNumber || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Vehicles Section -->
                ${lead.vehicles && lead.vehicles.length > 0 ? `
                <div class="lead-detail-section">
                    <h3><i class="fas fa-truck"></i> Vehicles (${lead.vehicles.length})</h3>
                    <div class="vehicles-list">
                        ${lead.vehicles.map(v => `
                            <div class="vehicle-card">
                                <strong>${v.year} ${v.make} ${v.model}</strong><br>
                                <small>VIN: ${v.vin}</small><br>
                                <small>Value: $${v.value.toLocaleString()}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Call Transcript -->
                ${lead.callTranscript ? `
                <div class="lead-detail-section">
                    <h3><i class="fas fa-phone"></i> Call Transcript</h3>
                    <div class="transcript-box">
                        <pre style="white-space: pre-wrap; font-family: inherit;">${lead.callTranscript}</pre>
                    </div>
                </div>
                ` : ''}
                
                <!-- Notes -->
                ${lead.notes && lead.notes.length > 0 ? `
                <div class="lead-detail-section">
                    <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                    <div class="notes-list">
                        ${lead.notes.map(n => `
                            <div class="note-item">
                                <small class="note-date">${n.date}</small>
                                <div class="note-text">${n.note}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Additional Info -->
                ${lead.businessType || lead.yearsInBusiness || lead.safetyRating ? `
                <div class="lead-detail-section">
                    <h3><i class="fas fa-building"></i> Business Information</h3>
                    <div class="detail-grid">
                        ${lead.businessType ? `
                        <div class="detail-item">
                            <label>Business Type:</label>
                            <span>${lead.businessType}</span>
                        </div>
                        ` : ''}
                        ${lead.yearsInBusiness ? `
                        <div class="detail-item">
                            <label>Years in Business:</label>
                            <span>${lead.yearsInBusiness}</span>
                        </div>
                        ` : ''}
                        ${lead.safetyRating ? `
                        <div class="detail-item">
                            <label>Safety Rating:</label>
                            <span>${lead.safetyRating}</span>
                        </div>
                        ` : ''}
                        ${lead.insuranceHistory ? `
                        <div class="detail-item">
                            <label>Insurance History:</label>
                            <span>${lead.insuranceHistory}</span>
                        </div>
                        ` : ''}
                        ${lead.fleetSize ? `
                        <div class="detail-item">
                            <label>Fleet Size:</label>
                            <span>${lead.fleetSize} vehicles</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                <!-- Actions -->
                <div class="lead-detail-section">
                    <h3><i class="fas fa-tasks"></i> Actions</h3>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="alert('Quote generation would happen here')">
                            <i class="fas fa-file-invoice-dollar"></i> Generate Quote
                        </button>
                        <button class="btn-secondary" onclick="alert('SMS would open here')">
                            <i class="fas fa-sms"></i> Send SMS
                        </button>
                        <button class="btn-secondary" onclick="alert('Email would open here')">
                            <i class="fas fa-envelope"></i> Send Email
                        </button>
                        <button class="btn-secondary" onclick="alert('Call would start here')">
                            <i class="fas fa-phone"></i> Call
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#enhanced-lead-styles')) {
        const styles = document.createElement('style');
        styles.id = 'enhanced-lead-styles';
        styles.innerHTML = `
            .lead-detail-section {
                margin-bottom: 25px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .lead-detail-section h3 {
                margin: 0 0 15px 0;
                color: #2c3e50;
                font-size: 18px;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 8px;
            }
            
            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
            }
            
            .detail-item label {
                font-weight: 600;
                color: #666;
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            
            .detail-item span {
                color: #2c3e50;
                font-size: 14px;
            }
            
            .vehicles-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .vehicle-card {
                background: white;
                padding: 12px;
                border-radius: 6px;
                border: 1px solid #e0e0e0;
            }
            
            .transcript-box {
                background: white;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #e0e0e0;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .notes-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .note-item {
                background: white;
                padding: 12px;
                border-radius: 6px;
                border-left: 3px solid #3b82f6;
            }
            
            .note-date {
                color: #999;
                font-size: 11px;
                text-transform: uppercase;
            }
            
            .note-text {
                margin-top: 5px;
                color: #2c3e50;
                font-size: 14px;
            }
            
            .action-buttons {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .action-buttons button {
                padding: 10px 20px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-primary {
                background: #3b82f6;
                color: white;
            }
            
            .btn-secondary {
                background: #6b7280;
                color: white;
            }
            
            .btn-primary:hover {
                background: #2563eb;
            }
            
            .btn-secondary:hover {
                background: #4b5563;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(modal);
};

console.log('✅ Enhanced lead details view loaded!');
console.log('Click eye icon on any lead to see full details including transcripts');