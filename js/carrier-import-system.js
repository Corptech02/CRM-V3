// Carrier Import System - Import clients from Progressive, GEICO, and other carriers
console.log('Carrier Import System loading...');

// Add import button to the interface
function addCarrierImportButton() {
    // Check if we're on the clients or policies page
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (!dashboardHeader) return;

    // Check if button already exists
    if (document.getElementById('carrier-import-btn')) return;

    // Create import button
    const importBtn = document.createElement('button');
    importBtn.id = 'carrier-import-btn';
    importBtn.className = 'btn-primary';
    importBtn.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin-left: 15px;';
    importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import from Carriers';
    importBtn.onclick = showCarrierImportModal;

    // Find the right place to add it
    const headerActions = dashboardHeader.querySelector('.header-actions') ||
                         dashboardHeader.querySelector('.dashboard-actions') ||
                         dashboardHeader;

    if (headerActions) {
        headerActions.appendChild(importBtn);
    }
}

// Show the import modal
function showCarrierImportModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('carrierImportModal');
    if (existingModal) existingModal.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'carrierImportModal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #333; font-size: 28px;">
                    <i class="fas fa-file-import" style="color: #667eea;"></i> Import Clients from Insurance Carriers
                </h2>
                <button onclick="closeCarrierImportModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Carrier Selection -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #495057; margin-bottom: 15px;">Select Insurance Carrier</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="carrier-card" onclick="selectCarrier('progressive')" style="border: 3px solid #transparent; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; background: #f8f9fa; transition: all 0.3s;">
                        <img src="https://www.progressive.com/content/images/pr-logo-color.svg" alt="Progressive" style="height: 40px; margin-bottom: 10px;">
                        <h4 style="margin: 10px 0 5px 0; color: #333;">Progressive</h4>
                        <p style="margin: 0; color: #666; font-size: 12px;">Import from Progressive Commercial</p>
                    </div>
                    <div class="carrier-card" onclick="selectCarrier('geico')" style="border: 3px solid transparent; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; background: #f8f9fa; transition: all 0.3s;">
                        <div style="background: #026cb5; color: white; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                            <strong style="font-size: 24px;">GEICO</strong>
                        </div>
                        <h4 style="margin: 10px 0 5px 0; color: #333;">GEICO</h4>
                        <p style="margin: 0; color: #666; font-size: 12px;">Import from GEICO Commercial</p>
                    </div>
                    <div class="carrier-card" onclick="selectCarrier('statefarm')" style="border: 3px solid transparent; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; background: #f8f9fa; transition: all 0.3s;">
                        <div style="background: #e31837; color: white; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                            <strong style="font-size: 20px;">State Farm®</strong>
                        </div>
                        <h4 style="margin: 10px 0 5px 0; color: #333;">State Farm</h4>
                        <p style="margin: 0; color: #666; font-size: 12px;">Import from State Farm</p>
                    </div>
                    <div class="carrier-card" onclick="selectCarrier('allstate')" style="border: 3px solid transparent; padding: 20px; border-radius: 10px; cursor: pointer; text-align: center; background: #f8f9fa; transition: all 0.3s;">
                        <div style="background: #0033a0; color: white; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                            <strong style="font-size: 20px;">Allstate</strong>
                        </div>
                        <h4 style="margin: 10px 0 5px 0; color: #333;">Allstate</h4>
                        <p style="margin: 0; color: #666; font-size: 12px;">Import from Allstate</p>
                    </div>
                </div>
            </div>

            <!-- Import Method -->
            <div id="importMethodSection" style="display: none; margin-bottom: 30px;">
                <h3 style="color: #495057; margin-bottom: 15px;">Import Method</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <div onclick="selectImportMethod('file')" style="border: 2px solid #dee2e6; padding: 20px; border-radius: 10px; cursor: pointer; transition: all 0.3s;">
                        <h4 style="margin: 0 0 10px 0; color: #333;">
                            <i class="fas fa-file-csv" style="color: #28a745;"></i> CSV/Excel File Upload
                        </h4>
                        <p style="margin: 0; color: #666; font-size: 14px;">Upload a CSV or Excel file exported from your carrier portal</p>
                    </div>
                    <div onclick="selectImportMethod('paste')" style="border: 2px solid #dee2e6; padding: 20px; border-radius: 10px; cursor: pointer; transition: all 0.3s;">
                        <h4 style="margin: 0 0 10px 0; color: #333;">
                            <i class="fas fa-paste" style="color: #17a2b8;"></i> Copy & Paste Data
                        </h4>
                        <p style="margin: 0; color: #666; font-size: 14px;">Copy data from carrier portal and paste here</p>
                    </div>
                    <div onclick="selectImportMethod('api')" style="border: 2px solid #dee2e6; padding: 20px; border-radius: 10px; cursor: pointer; transition: all 0.3s;">
                        <h4 style="margin: 0 0 10px 0; color: #333;">
                            <i class="fas fa-plug" style="color: #ffc107;"></i> API Connection
                        </h4>
                        <p style="margin: 0; color: #666; font-size: 14px;">Connect directly to carrier API (credentials required)</p>
                    </div>
                </div>
            </div>

            <!-- Import Form -->
            <div id="importFormSection" style="display: none;">
                <!-- File Upload -->
                <div id="fileUploadForm" style="display: none;">
                    <h3 style="color: #495057; margin-bottom: 15px;">Upload Carrier Data File</h3>
                    <div style="border: 3px dashed #dee2e6; padding: 40px; text-align: center; border-radius: 10px; background: #f8f9fa;">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #667eea; margin-bottom: 15px;"></i>
                        <h4 style="margin: 0 0 10px 0; color: #333;">Drop files here or click to browse</h4>
                        <p style="margin: 0 0 20px 0; color: #666;">Supported formats: CSV, XLS, XLSX</p>
                        <input type="file" id="carrierFileInput" accept=".csv,.xls,.xlsx" style="display: none;" onchange="handleCarrierFile(event)">
                        <button onclick="document.getElementById('carrierFileInput').click()" style="background: #667eea; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                            <i class="fas fa-folder-open"></i> Select File
                        </button>
                    </div>
                </div>

                <!-- Paste Data -->
                <div id="pasteDataForm" style="display: none;">
                    <h3 style="color: #495057; margin-bottom: 15px;">Paste Carrier Data</h3>
                    <p style="color: #666; margin-bottom: 15px;">Copy the client data from your carrier portal and paste it below:</p>
                    <textarea id="carrierDataPaste" style="width: 100%; height: 300px; padding: 15px; border: 2px solid #dee2e6; border-radius: 8px; font-family: monospace; font-size: 14px;" placeholder="Paste your data here...

Example format:
Policy Number, Client Name, Phone, Email, Address, Premium, Effective Date, Expiration Date
POL-2024-001, ABC Trucking LLC, (555) 123-4567, abc@email.com, 123 Main St, 5000, 01/01/2024, 01/01/2025"></textarea>
                    <div style="margin-top: 15px;">
                        <button onclick="processPayedData()" style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                            <i class="fas fa-upload"></i> Process Data
                        </button>
                    </div>
                </div>

                <!-- API Connection -->
                <div id="apiConnectionForm" style="display: none;">
                    <h3 style="color: #495057; margin-bottom: 15px;">API Connection</h3>
                    <div id="progressiveAPI" style="display: none;">
                        <h4 style="color: #333;">Progressive API Credentials</h4>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Agent Code:</label>
                            <input type="text" id="progressive-agent-code" style="width: 100%; padding: 10px; border: 2px solid #dee2e6; border-radius: 5px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">API Key:</label>
                            <input type="password" id="progressive-api-key" style="width: 100%; padding: 10px; border: 2px solid #dee2e6; border-radius: 5px;">
                        </div>
                    </div>
                    <div id="geicoAPI" style="display: none;">
                        <h4 style="color: #333;">GEICO API Credentials</h4>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Username:</label>
                            <input type="text" id="geico-username" style="width: 100%; padding: 10px; border: 2px solid #dee2e6; border-radius: 5px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Password:</label>
                            <input type="password" id="geico-password" style="width: 100%; padding: 10px; border: 2px solid #dee2e6; border-radius: 5px;">
                        </div>
                    </div>
                    <button onclick="connectToCarrierAPI()" style="background: #ffc107; color: #333; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">
                        <i class="fas fa-plug"></i> Connect to API
                    </button>
                </div>
            </div>

            <!-- Import Results -->
            <div id="importResults" style="display: none; margin-top: 30px;">
                <h3 style="color: #495057; margin-bottom: 15px;">Import Preview</h3>
                <div id="resultsContent" style="max-height: 400px; overflow-y: auto;"></div>
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="confirmImport()" style="background: #28a745; color: white; padding: 15px 40px; border: none; border-radius: 5px; cursor: pointer; font-size: 18px; margin-right: 10px;">
                        <i class="fas fa-check"></i> Confirm Import
                    </button>
                    <button onclick="cancelImport()" style="background: #dc3545; color: white; padding: 15px 40px; border: none; border-radius: 5px; cursor: pointer; font-size: 18px;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add styles for hover effects
    const style = document.createElement('style');
    style.textContent = `
        .carrier-card:hover {
            border-color: #667eea !important;
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
        }
        .carrier-card.selected {
            border-color: #667eea !important;
            background: linear-gradient(135deg, #f0f4ff 0%, #e8efff 100%) !important;
        }
    `;
    document.head.appendChild(style);
}

// Global variables for import process
let selectedCarrier = null;
let selectedMethod = null;
let importData = [];

// Select carrier
window.selectCarrier = function(carrier) {
    selectedCarrier = carrier;

    // Update UI
    document.querySelectorAll('.carrier-card').forEach(card => {
        card.classList.remove('selected');
        card.style.borderColor = 'transparent';
    });
    event.currentTarget.classList.add('selected');
    event.currentTarget.style.borderColor = '#667eea';

    // Show import method section
    document.getElementById('importMethodSection').style.display = 'block';

    // Update API form based on carrier
    if (carrier === 'progressive') {
        document.getElementById('progressiveAPI').style.display = 'block';
        document.getElementById('geicoAPI').style.display = 'none';
    } else if (carrier === 'geico') {
        document.getElementById('geicoAPI').style.display = 'block';
        document.getElementById('progressiveAPI').style.display = 'none';
    }
};

// Select import method
window.selectImportMethod = function(method) {
    selectedMethod = method;

    // Show import form section
    document.getElementById('importFormSection').style.display = 'block';

    // Hide all forms first
    document.getElementById('fileUploadForm').style.display = 'none';
    document.getElementById('pasteDataForm').style.display = 'none';
    document.getElementById('apiConnectionForm').style.display = 'none';

    // Show selected form
    if (method === 'file') {
        document.getElementById('fileUploadForm').style.display = 'block';
    } else if (method === 'paste') {
        document.getElementById('pasteDataForm').style.display = 'block';
    } else if (method === 'api') {
        document.getElementById('apiConnectionForm').style.display = 'block';
    }
};

// Handle file upload
window.handleCarrierFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        processCarrierData(content, file.name);
    };

    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        // For Excel files, we'd need a library like xlsx.js
        alert('Excel file detected. Processing Excel files requires additional setup. For now, please export as CSV.');
    }
};

// Process pasted data
window.processPayedData = function() {
    const data = document.getElementById('carrierDataPaste').value;
    if (!data) {
        alert('Please paste data first');
        return;
    }
    processCarrierData(data, 'pasted_data');
};

// Process carrier data
function processCarrierData(content, source) {
    console.log('Processing carrier data from:', source);

    // Parse CSV data
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    importData = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const record = {};

        headers.forEach((header, index) => {
            record[header] = values[index] || '';
        });

        // Map to our format based on carrier
        const client = mapCarrierDataToClient(record);
        if (client) {
            importData.push(client);
        }
    }

    // Show preview
    showImportPreview();
}

// Map carrier data to our client format
function mapCarrierDataToClient(record) {
    const client = {
        id: 'IMP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        importedFrom: selectedCarrier,
        importDate: new Date().toISOString(),
        status: 'Active'
    };

    // Map fields based on carrier
    if (selectedCarrier === 'progressive') {
        client.name = record['Business Name'] || record['Client Name'] || record['Insured Name'] || '';
        client.contactName = record['Contact'] || record['Contact Name'] || '';
        client.phone = record['Phone'] || record['Phone Number'] || '';
        client.email = record['Email'] || record['Email Address'] || '';
        client.address = record['Address'] || record['Business Address'] || '';
        client.policyNumber = record['Policy Number'] || record['Policy #'] || '';
        client.effectiveDate = record['Effective Date'] || record['Start Date'] || '';
        client.expirationDate = record['Expiration Date'] || record['End Date'] || '';
        client.premium = parseFloat(record['Premium'] || record['Annual Premium'] || '0');
        client.dotNumber = record['DOT'] || record['DOT Number'] || '';
        client.mcNumber = record['MC'] || record['MC Number'] || '';
    } else if (selectedCarrier === 'geico') {
        client.name = record['Company Name'] || record['Business Name'] || record['Insured'] || '';
        client.contactName = record['Primary Contact'] || record['Contact'] || '';
        client.phone = record['Business Phone'] || record['Phone'] || '';
        client.email = record['Business Email'] || record['Email'] || '';
        client.address = record['Business Address'] || record['Address'] || '';
        client.policyNumber = record['Policy ID'] || record['Policy Number'] || '';
        client.effectiveDate = record['Policy Start'] || record['Effective Date'] || '';
        client.expirationDate = record['Policy End'] || record['Expiration Date'] || '';
        client.premium = parseFloat(record['Total Premium'] || record['Premium'] || '0');
        client.dotNumber = record['DOT #'] || record['DOT'] || '';
        client.mcNumber = record['MC #'] || record['MC'] || '';
    } else {
        // Generic mapping
        client.name = record['Name'] || record['Business Name'] || record['Company'] || '';
        client.phone = record['Phone'] || record['Phone Number'] || '';
        client.email = record['Email'] || record['Email Address'] || '';
        client.address = record['Address'] || '';
        client.policyNumber = record['Policy Number'] || record['Policy'] || '';
        client.premium = parseFloat(record['Premium'] || '0');
    }

    // Only return if we have at least a name
    return client.name ? client : null;
}

// Show import preview
function showImportPreview() {
    const resultsContent = document.getElementById('resultsContent');

    if (importData.length === 0) {
        resultsContent.innerHTML = '<p style="color: #dc3545;">No valid data found to import. Please check your data format.</p>';
        return;
    }

    let html = `
        <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <strong style="color: #155724;">Found ${importData.length} clients to import from ${selectedCarrier?.toUpperCase()}</strong>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Client Name</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Phone</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Email</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Premium</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Policy #</th>
                </tr>
            </thead>
            <tbody>
    `;

    importData.forEach(client => {
        html += `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${client.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${client.phone || 'N/A'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${client.email || 'N/A'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">$${client.premium.toLocaleString()}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${client.policyNumber || 'N/A'}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';

    resultsContent.innerHTML = html;
    document.getElementById('importResults').style.display = 'block';
}

// Confirm import
window.confirmImport = function() {
    if (importData.length === 0) {
        alert('No data to import');
        return;
    }

    // Get existing clients
    const existingClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');

    // Add imported clients
    importData.forEach(client => {
        // Check for duplicates
        const exists = existingClients.find(c =>
            c.name === client.name ||
            (client.policyNumber && c.policyNumber === client.policyNumber)
        );

        if (!exists) {
            existingClients.push(client);
        }
    });

    // Save back to localStorage
    localStorage.setItem('insurance_clients', JSON.stringify(existingClients));

    // Also create policies if we have policy data
    const existingPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    importData.forEach(client => {
        if (client.policyNumber) {
            const policy = {
                id: 'POL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                policyNumber: client.policyNumber,
                clientName: client.name,
                clientId: client.id,
                policyType: 'commercial-auto',
                carrier: selectedCarrier?.charAt(0).toUpperCase() + selectedCarrier?.slice(1),
                effectiveDate: client.effectiveDate,
                expirationDate: client.expirationDate,
                premium: client.premium,
                annualPremium: client.premium,
                status: 'Active',
                importedFrom: selectedCarrier,
                importDate: new Date().toISOString()
            };

            existingPolicies.push(policy);
        }
    });

    localStorage.setItem('insurance_policies', JSON.stringify(existingPolicies));

    // Show success message
    alert(`✅ Successfully imported ${importData.length} clients from ${selectedCarrier?.toUpperCase()}!`);

    // Close modal and refresh
    closeCarrierImportModal();

    // Refresh the page to show new data
    location.reload();
};

// Cancel import
window.cancelImport = function() {
    importData = [];
    document.getElementById('importResults').style.display = 'none';
};

// Close modal
window.closeCarrierImportModal = function() {
    const modal = document.getElementById('carrierImportModal');
    if (modal) modal.remove();
};

// Connect to carrier API
window.connectToCarrierAPI = function() {
    if (selectedCarrier === 'progressive') {
        const agentCode = document.getElementById('progressive-agent-code').value;
        const apiKey = document.getElementById('progressive-api-key').value;

        if (!agentCode || !apiKey) {
            alert('Please enter Progressive API credentials');
            return;
        }

        // Simulate API connection
        alert('Connecting to Progressive API...\n\nNote: Real API integration requires backend setup and carrier partnership agreements.');

    } else if (selectedCarrier === 'geico') {
        const username = document.getElementById('geico-username').value;
        const password = document.getElementById('geico-password').value;

        if (!username || !password) {
            alert('Please enter GEICO credentials');
            return;
        }

        // Simulate API connection
        alert('Connecting to GEICO API...\n\nNote: Real API integration requires backend setup and carrier partnership agreements.');
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add import button when on appropriate pages - DISABLED to prevent DOM manipulation flickering
    // setInterval(addCarrierImportButton, 1000);
    addCarrierImportButton(); // Run once instead
});

// Also try to add button immediately
setTimeout(addCarrierImportButton, 100);

console.log('Carrier Import System ready - Import clients from Progressive, GEICO, and other carriers');