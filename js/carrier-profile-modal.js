// Carrier Profile Modal - Complete Carrier Information Display
class CarrierProfileModal {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="carrierProfileModal" class="carrier-modal" style="display:none;">
                <div class="carrier-modal-content">
                    <div class="carrier-modal-header">
                        <h2 id="modalCarrierName">Carrier Profile</h2>
                        <span class="carrier-modal-close">&times;</span>
                    </div>
                    <div class="carrier-modal-body">
                        <div class="carrier-profile-loading" style="display: block; text-align: center; padding: 40px;">
                            <div class="spinner"></div>
                            <p>Loading carrier information...</p>
                        </div>
                        <div class="carrier-profile-content" style="display: none;"></div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('carrierProfileModal');

        // Add modal styles
        this.addStyles();

        // Setup event listeners
        this.setupEventListeners();
    }

    addStyles() {
        if (!document.getElementById('carrierModalStyles')) {
            const styles = `
                <style id="carrierModalStyles">
                    .carrier-modal {
                        position: fixed;
                        z-index: 10000;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0,0,0,0.5);
                        animation: fadeIn 0.3s;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .carrier-modal-content {
                        position: relative;
                        background-color: #fefefe;
                        margin: 2% auto;
                        padding: 0;
                        border-radius: 10px;
                        width: 90%;
                        max-width: 1200px;
                        max-height: 90vh;
                        overflow: hidden;
                        box-shadow: 0 5px 30px rgba(0,0,0,0.3);
                        animation: slideIn 0.3s;
                    }

                    @keyframes slideIn {
                        from { transform: translateY(-30px); }
                        to { transform: translateY(0); }
                    }

                    .carrier-modal-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        position: relative;
                    }

                    .carrier-modal-header h2 {
                        margin: 0;
                        font-size: 24px;
                    }

                    .carrier-modal-close {
                        position: absolute;
                        right: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 30px;
                        font-weight: bold;
                        color: white;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }

                    .carrier-modal-close:hover {
                        transform: translateY(-50%) scale(1.2);
                    }

                    .carrier-modal-body {
                        padding: 20px;
                        max-height: calc(90vh - 80px);
                        overflow-y: auto;
                    }

                    .carrier-info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }

                    .carrier-info-section {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }

                    .carrier-info-section.full-width {
                        grid-column: 1 / -1;
                    }

                    .carrier-info-section h3 {
                        margin-top: 0;
                        margin-bottom: 15px;
                        color: #333;
                        border-bottom: 2px solid #667eea;
                        padding-bottom: 10px;
                        font-size: 18px;
                    }

                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #e9ecef;
                    }

                    .info-row:last-child {
                        border-bottom: none;
                    }

                    .info-label {
                        font-weight: 600;
                        color: #6c757d;
                    }

                    .info-value {
                        text-align: right;
                        color: #495057;
                    }

                    .info-value.na {
                        color: #adb5bd;
                        font-style: italic;
                    }

                    .status-badge {
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: bold;
                        text-transform: uppercase;
                    }

                    .status-active {
                        background: #28a745;
                        color: white;
                    }

                    .status-inactive {
                        background: #dc3545;
                        color: white;
                    }

                    .equipment-table {
                        width: 100%;
                        margin-top: 10px;
                    }

                    .equipment-table table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    .equipment-table th {
                        background: #667eea;
                        color: white;
                        padding: 10px;
                        text-align: left;
                        font-size: 14px;
                    }

                    .equipment-table td {
                        padding: 10px;
                        border-bottom: 1px solid #dee2e6;
                        font-size: 14px;
                    }

                    .equipment-table tr:hover {
                        background: #f1f3f5;
                    }

                    .no-inspections {
                        text-align: center;
                        color: #adb5bd;
                        padding: 20px;
                        font-style: italic;
                    }

                    .inspection-summary {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        margin-bottom: 15px;
                    }

                    .summary-stat {
                        background: white;
                        padding: 10px;
                        border-radius: 5px;
                        text-align: center;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }

                    .summary-stat .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #667eea;
                    }

                    .summary-stat .stat-label {
                        font-size: 12px;
                        color: #6c757d;
                        margin-top: 5px;
                    }

                    .action-buttons {
                        margin-top: 20px;
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                    }

                    .btn-action {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: all 0.3s;
                    }

                    .btn-create-lead {
                        background: #28a745;
                        color: white;
                    }

                    .btn-create-lead:hover {
                        background: #218838;
                    }

                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    .error-message {
                        background: #f8d7da;
                        color: #721c24;
                        padding: 15px;
                        border-radius: 5px;
                        text-align: center;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    setupEventListeners() {
        // Close modal when clicking X
        const closeBtn = this.modal.querySelector('.carrier-modal-close');
        closeBtn.onclick = () => this.hide();

        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        };

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.hide();
            }
        });
    }

    async show(dotNumber) {
        this.modal.style.display = 'block';
        const loadingDiv = this.modal.querySelector('.carrier-profile-loading');
        const contentDiv = this.modal.querySelector('.carrier-profile-content');

        loadingDiv.style.display = 'block';
        contentDiv.style.display = 'none';

        try {
            // Get API base URL
            let apiBase = 'https://api.vigagency.com';

            const customAPI = localStorage.getItem('VANGUARD_API_URL');
            if (customAPI) {
                apiBase = customAPI;
            } else if (window.location.hostname === 'vanguard.vigagency.com') {
                apiBase = 'https://api.vigagency.com';
            } else if (window.location.hostname === 'localhost') {
                apiBase = 'http://localhost:8897';
            } else if (window.location.hostname.includes('github.io')) {
                apiBase = 'https://api.vigagency.com';
            } else if (window.location.protocol === 'https:') {
                apiBase = 'https://api.vigagency.com';
            } else {
                apiBase = 'http://162.220.14.239:8897';
            }

            // Fetch carrier profile
            const response = await fetch(`${apiBase}/api/carrier/profile/${dotNumber}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch carrier profile');
            }

            const data = await response.json();

            // Update modal header
            const headerTitle = this.modal.querySelector('#modalCarrierName');
            headerTitle.textContent = data.carrier?.legal_name || `Carrier #${dotNumber}`;

            // Display carrier information
            this.displayCarrierInfo(data);

            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';

        } catch (error) {
            console.error('Error loading carrier profile:', error);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            contentDiv.innerHTML = `
                <div class="error-message">
                    <p>Failed to load carrier profile. Please try again.</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    displayCarrierInfo(data) {
        const contentDiv = this.modal.querySelector('.carrier-profile-content');
        const carrier = data.carrier || {};
        const inspections = data.inspections || [];
        const inspectionSummary = data.inspection_summary || {};

        // Format values helper
        const formatValue = (value) => {
            if (value === null || value === undefined || value === '') {
                return '<span class="info-value na">N/A</span>';
            }
            return value;
        };

        // Format currency
        const formatCurrency = (value) => {
            if (!value) return '<span class="info-value na">N/A</span>';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        };

        // Format date
        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            try {
                return new Date(dateStr).toLocaleDateString('en-US');
            } catch {
                return dateStr;
            }
        };

        // Build the HTML content with new layout
        const html = `
            <div class="carrier-info-grid">
                <!-- Left Column -->
                <div>
                    <!-- Basic Information -->
                    <div class="carrier-info-section">
                        <h3>📋 Basic Information</h3>
                        <div class="info-row">
                            <span class="info-label">DOT Number:</span>
                            <span class="info-value"><strong>${carrier.dot_number}</strong></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Legal Name:</span>
                            <span class="info-value">${formatValue(carrier.legal_name)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">DBA Name:</span>
                            <span class="info-value">${formatValue(carrier.dba_name)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Entity Type:</span>
                            <span class="info-value">${formatValue(carrier.entity_type)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Operating Status:</span>
                            <span class="info-value">
                                ${carrier.operating_status === 'Active'
                                    ? '<span class="status-badge status-active">Active</span>'
                                    : '<span class="status-badge status-inactive">' + formatValue(carrier.operating_status) + '</span>'
                                }
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">MC Number:</span>
                            <span class="info-value">${formatValue(carrier.mc_number)}</span>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="carrier-info-section" style="margin-top: 20px;">
                        <h3>📞 Contact Information</h3>
                        <div class="info-row">
                            <span class="info-label">Phone:</span>
                            <span class="info-value">${formatValue(carrier.phone)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${formatValue(carrier.email_address)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Street:</span>
                            <span class="info-value">${formatValue(carrier.street)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">City:</span>
                            <span class="info-value">${formatValue(carrier.city)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">State:</span>
                            <span class="info-value">${formatValue(carrier.state)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ZIP Code:</span>
                            <span class="info-value">${formatValue(carrier.zip_code)}</span>
                        </div>
                    </div>

                    <!-- Fleet Information -->
                    <div class="carrier-info-section" style="margin-top: 20px;">
                        <h3>🚚 Fleet Information</h3>
                        <div class="info-row">
                            <span class="info-label">Power Units:</span>
                            <span class="info-value">${formatValue(carrier.power_units)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Drivers:</span>
                            <span class="info-value">${formatValue(carrier.drivers)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">MCS-150 Date:</span>
                            <span class="info-value">${formatValue(carrier.mcs150_date)}</span>
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div>
                    <!-- Insurance Information -->
                    <div class="carrier-info-section">
                        <h3>🛡️ Insurance Information</h3>
                        <div class="info-row">
                            <span class="info-label">Insurance Carrier:</span>
                            <span class="info-value">${formatValue(carrier.insurance_carrier)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Policy Number:</span>
                            <span class="info-value">${formatValue(carrier.policy_number)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Required Amount:</span>
                            <span class="info-value">${formatCurrency(carrier.bipd_insurance_required_amount)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">On File Amount:</span>
                            <span class="info-value">${formatCurrency(carrier.bipd_insurance_on_file_amount)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Effective Date:</span>
                            <span class="info-value">${formatDate(carrier.policy_effective_date)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Renewal Date:</span>
                            <span class="info-value">${formatDate(carrier.policy_renewal_date)}</span>
                        </div>
                    </div>

                    <!-- Additional Information - Moved here -->
                    <div class="carrier-info-section" style="margin-top: 20px;">
                        <h3>📊 Additional Information</h3>
                        <div class="info-row">
                            <span class="info-label">Carrier Operation:</span>
                            <span class="info-value">${formatValue(carrier.carrier_operation)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Insurance Updated:</span>
                            <span class="info-value">
                                ${carrier.insurance_updated === 1 || carrier.insurance_updated === true
                                    ? '<span style="color: #28a745;">✓ Yes</span>'
                                    : '<span style="color: #dc3545;">✗ No</span>'
                                }
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Created At:</span>
                            <span class="info-value">${formatDate(carrier.created_at)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Docket:</span>
                            <span class="info-value">${formatValue(carrier.docket)}</span>
                        </div>
                    </div>

                    <!-- Representatives -->
                    ${carrier.representative_1_name || carrier.representative_2_name || carrier.principal_name ? `
                    <div class="carrier-info-section" style="margin-top: 20px;">
                        <h3>👥 Company Officers</h3>
                        ${carrier.representative_1_name ? `
                        <div class="info-row">
                            <span class="info-label">Rep 1:</span>
                            <span class="info-value">${carrier.representative_1_name} (${formatValue(carrier.representative_1_title)})</span>
                        </div>
                        ` : ''}
                        ${carrier.representative_2_name ? `
                        <div class="info-row">
                            <span class="info-label">Rep 2:</span>
                            <span class="info-value">${carrier.representative_2_name} (${formatValue(carrier.representative_2_title)})</span>
                        </div>
                        ` : ''}
                        ${carrier.principal_name ? `
                        <div class="info-row">
                            <span class="info-label">Principal:</span>
                            <span class="info-value">${carrier.principal_name} (${formatValue(carrier.principal_title)})</span>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Equipment Section (Full Width) - New Section -->
            <div class="carrier-info-section full-width" style="margin-top: 20px;">
                <h3>🚛 Equipment & Vehicles</h3>

                ${(() => {
                    // Filter inspections that have vehicle data (VIN, make, model, or year)
                    const vehicleInspections = inspections.filter(insp =>
                        insp.vehicle_vin || insp.vehicle_make || insp.vehicle_model || insp.vehicle_year
                    );

                    if (vehicleInspections.length > 0) {
                        return `
                            <div class="equipment-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Inspection Date</th>
                                            <th>VIN</th>
                                            <th>Year</th>
                                            <th>Make</th>
                                            <th>Model</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${vehicleInspections.slice(0, 20).map(insp => `
                                            <tr>
                                                <td>${formatDate(insp.insp_date)}</td>
                                                <td>${insp.vehicle_vin || '-'}</td>
                                                <td>${insp.vehicle_year || '-'}</td>
                                                <td>${insp.vehicle_make || '-'}</td>
                                                <td>${insp.vehicle_model || '-'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    } else if (inspectionSummary.total_inspections > 0) {
                        return `
                            <div class="no-inspections">
                                <p>No vehicle-specific data available in ${inspectionSummary.total_inspections} inspections.</p>
                                <p style="font-size: 0.9em; color: #666;">Vehicle details (VIN, make, model) not included in current inspection records.</p>
                            </div>
                        `;
                    } else {
                        return '<div class="no-inspections">No inspection records found for this carrier.</div>';
                    }
                })()}
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
                <button class="btn-action btn-create-lead" onclick="window.createLeadFromCarrierData(${carrier.dot_number})">
                    Create Lead from Carrier
                </button>
            </div>
        `;

        contentDiv.innerHTML = html;
    }

    hide() {
        this.modal.style.display = 'none';
    }
}

// Initialize modal and expose globally
window.carrierProfileModal = new CarrierProfileModal();

console.log('Carrier profile modal loaded - v4');