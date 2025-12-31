// Admin COI Upload Enhancement - DISABLED for CRM
console.log('🔧 Admin COI Upload Enhancement - DISABLED for CRM interface');

// Enhanced policy modal with COI upload section - DISABLED
window.enhancedShowPolicyModal = function(existingPolicy = null) {
    console.log('📋 COI upload enhancement disabled for CRM');
    // Fallback to original modal function if it exists
    if (window.originalShowPolicyModal) {
        return window.originalShowPolicyModal(existingPolicy);
    }
    return; // Exit early - disable COI upload functionality

    // Set editing state
    window.editingPolicyId = existingPolicy ? (existingPolicy.id || existingPolicy.policyNumber) : null;

    // Create enhanced modal with COI section
    const modal = document.createElement('div');
    modal.id = 'policyModal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1000px; width: 95%; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2><i class="fas fa-shield-alt"></i> ${existingPolicy ? 'Edit Policy' : 'New Policy'}</h2>
                <span class="close" onclick="closePolicyModal()">&times;</span>
            </div>

            <div class="modal-body">
                <!-- Policy Form Tabs -->
                <div class="tab-container">
                    <div class="tab-buttons">
                        <button class="tab-button active" data-tab="overview">Overview</button>
                        <button class="tab-button" data-tab="insured">Insured</button>
                        <button class="tab-button" data-tab="coverage">Coverage</button>
                        <button class="tab-button" data-tab="financial">Financial</button>
                        <button class="tab-button" data-tab="coi-upload">COI Documents</button>
                    </div>

                    <!-- Overview Tab -->
                    <div id="overview-tab" class="tab-content active">
                        <div class="form-section">
                            <h3>Policy Overview</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Policy Number *</label>
                                    <input type="text" id="policyNumber" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Policy Type *</label>
                                    <select id="policyType" class="form-control" required>
                                        <option value="">Select Type</option>
                                        <option value="commercial-auto">Commercial Auto</option>
                                        <option value="general-liability">General Liability</option>
                                        <option value="cargo">Cargo Insurance</option>
                                        <option value="physical-damage">Physical Damage</option>
                                        <option value="workers-comp">Workers Compensation</option>
                                        <option value="umbrella">Umbrella</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Insurance Carrier *</label>
                                    <input type="text" id="carrier" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Policy Status</label>
                                    <select id="policyStatus" class="form-control">
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Effective Date</label>
                                    <input type="date" id="effectiveDate" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Expiration Date</label>
                                    <input type="date" id="expirationDate" class="form-control">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Insured Tab -->
                    <div id="insured-tab" class="tab-content">
                        <div class="form-section">
                            <h3>Insured Information</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Business Name</label>
                                    <input type="text" id="insuredName" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Address</label>
                                    <input type="text" id="insuredAddress" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>City</label>
                                    <input type="text" id="insuredCity" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>State</label>
                                    <input type="text" id="insuredState" class="form-control" maxlength="2" style="text-transform: uppercase">
                                </div>
                                <div class="form-group">
                                    <label>ZIP Code</label>
                                    <input type="text" id="insuredZip" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Phone</label>
                                    <input type="tel" id="insuredPhone" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" id="insuredEmail" class="form-control">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coverage Tab -->
                    <div id="coverage-tab" class="tab-content">
                        <div class="form-section">
                            <h3>Coverage Details</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Bodily Injury Liability</label>
                                    <input type="text" id="bodilyInjury" class="form-control" placeholder="e.g., $1,000,000">
                                </div>
                                <div class="form-group">
                                    <label>Property Damage Liability</label>
                                    <input type="text" id="propertyDamage" class="form-control" placeholder="e.g., $1,000,000">
                                </div>
                                <div class="form-group">
                                    <label>Comprehensive Deductible</label>
                                    <input type="text" id="comprehensive" class="form-control" placeholder="e.g., $1,000">
                                </div>
                                <div class="form-group">
                                    <label>Collision Deductible</label>
                                    <input type="text" id="collision" class="form-control" placeholder="e.g., $1,000">
                                </div>
                                <div class="form-group">
                                    <label>Uninsured Motorist</label>
                                    <input type="text" id="uninsuredMotorist" class="form-control" placeholder="e.g., $1,000,000">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Financial Tab -->
                    <div id="financial-tab" class="tab-content">
                        <div class="form-section">
                            <h3>Financial Information</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Annual Premium</label>
                                    <input type="number" id="annualPremium" class="form-control" placeholder="0.00" step="0.01">
                                </div>
                                <div class="form-group">
                                    <label>Monthly Payment</label>
                                    <input type="number" id="monthlyPayment" class="form-control" placeholder="0.00" step="0.01">
                                </div>
                                <div class="form-group">
                                    <label>Down Payment</label>
                                    <input type="number" id="downPayment" class="form-control" placeholder="0.00" step="0.01">
                                </div>
                                <!-- Win/Loss field will be added here by existing script -->
                            </div>
                        </div>
                    </div>

                    <!-- COI Upload Tab -->
                    <div id="coi-upload-tab" class="tab-content">
                        <div class="form-section">
                            <h3><i class="fas fa-file-upload"></i> Certificate of Insurance Documents</h3>
                            <p style="color: #666; margin-bottom: 20px;">
                                Upload the COI document that will be used when sending COIs for this policy.
                                Supported formats: PDF, DOC, DOCX, PNG, JPG
                            </p>

                            <!-- Upload Area -->
                            <div id="coiUploadArea" class="upload-area" style="
                                border: 2px dashed #ddd;
                                border-radius: 8px;
                                padding: 40px;
                                text-align: center;
                                margin: 20px 0;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #999; margin-bottom: 16px;"></i>
                                <h4 style="margin: 0 0 8px 0; color: #333;">Drop COI file here or click to browse</h4>
                                <p style="margin: 0; color: #666; font-size: 14px;">Maximum file size: 50MB</p>
                                <input type="file" id="coiFileInput" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style="display: none;">
                            </div>

                            <!-- Upload Progress -->
                            <div id="coiUploadProgress" style="display: none; margin: 20px 0;">
                                <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                                    <div id="coiProgressBar" style="height: 24px; background: #3b82f6; width: 0%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                                        0%
                                    </div>
                                </div>
                            </div>

                            <!-- Current COI Files -->
                            <div id="coiFilesList" style="margin-top: 30px;">
                                <h4 style="margin-bottom: 15px; color: #333;">
                                    <i class="fas fa-files-o"></i> Current COI Documents
                                </h4>
                                <div id="coiFilesContainer" style="border: 1px solid #e0e0e0; border-radius: 6px; min-height: 60px; padding: 15px;">
                                    <p style="color: #999; text-align: center; margin: 0;">
                                        No COI documents uploaded yet
                                    </p>
                                </div>
                            </div>

                            <!-- Upload Status -->
                            <div id="coiUploadStatus" style="margin-top: 20px;"></div>
                        </div>
                    </div>
                </div>

                <!-- Notes Section -->
                <div class="form-section" style="margin-top: 30px;">
                    <label>Notes</label>
                    <textarea id="policyNotes" class="form-control" rows="3" placeholder="Additional policy notes..."></textarea>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closePolicyModal()">Cancel</button>
                <button type="button" class="btn-primary" onclick="enhancedSavePolicy()">
                    <i class="fas fa-save"></i> Save Policy
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Initialize tab functionality
    initializePolicyTabs();

    // Initialize COI upload functionality
    initializeCOIUpload();

    // Populate form if editing existing policy
    if (existingPolicy) {
        setTimeout(() => populateEnhancedPolicyForm(existingPolicy), 100);
    }

    // Load existing COI files
    if (existingPolicy) {
        loadPolicyCoiFiles(existingPolicy.policyNumber || existingPolicy.id);
    }

    console.log('✅ Enhanced policy modal with COI upload ready');
};

// Initialize tab functionality
function initializePolicyTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

// Initialize COI upload functionality
function initializeCOIUpload() {
    const uploadArea = document.getElementById('coiUploadArea');
    const fileInput = document.getElementById('coiFileInput');

    if (uploadArea && fileInput) {
        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#3b82f6';
            uploadArea.style.backgroundColor = '#f8fafc';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ddd';
            uploadArea.style.backgroundColor = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ddd';
            uploadArea.style.backgroundColor = 'transparent';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleCOIFileUpload(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleCOIFileUpload(e.target.files[0]);
            }
        });
    }

    // Initialize general document upload
    const generalUploadArea = document.getElementById('generalUploadArea');
    const generalFileInput = document.getElementById('generalFileInput');

    if (generalUploadArea && generalFileInput) {
        // Click to upload
        generalUploadArea.addEventListener('click', () => {
            generalFileInput.click();
        });

        // Drag and drop
        generalUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            generalUploadArea.style.borderColor = '#3b82f6';
            generalUploadArea.style.backgroundColor = '#f8fafc';
        });

        generalUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            generalUploadArea.style.borderColor = '#ddd';
            generalUploadArea.style.backgroundColor = 'transparent';
        });

        generalUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            generalUploadArea.style.borderColor = '#ddd';
            generalUploadArea.style.backgroundColor = 'transparent';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleGeneralFileUpload(files[0]);
            }
        });

        // File input change
        generalFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleGeneralFileUpload(e.target.files[0]);
            }
        });
    }
}

// Handle COI file upload
async function handleCOIFileUpload(file) {
    const policyNumber = document.getElementById('overview-policy-number')?.value;

    if (!policyNumber) {
        showCOIUploadStatus('Please enter a policy number before uploading COI documents.', 'error');
        return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
        showCOIUploadStatus('Invalid file type. Please upload PDF, DOC, DOCX, PNG, or JPG files only.', 'error');
        return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
        showCOIUploadStatus('File too large. Maximum size is 50MB.', 'error');
        return;
    }

    console.log('📤 Uploading COI file:', file.name, 'for policy:', policyNumber);

    // Show progress
    const progressContainer = document.getElementById('coiUploadProgress');
    const progressBar = document.getElementById('coiProgressBar');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';

    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('policyId', window.editingPolicyId || '');
        formData.append('policyNumber', policyNumber);
        formData.append('uploadedBy', 'Admin User');
        formData.append('fileType', 'coi');

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
                progressBar.textContent = Math.round(percentComplete) + '%';
            }
        };

        xhr.onload = () => {
            progressContainer.style.display = 'none';

            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                console.log('✅ COI upload successful:', response);
                showCOIUploadStatus('COI document uploaded successfully!', 'success');

                // Reload COI files list
                loadPolicyCoiFiles(policyNumber);
            } else {
                console.error('❌ COI upload failed:', xhr.responseText);
                showCOIUploadStatus('Upload failed: ' + xhr.responseText, 'error');
            }
        };

        xhr.onerror = () => {
            progressContainer.style.display = 'none';
            console.error('❌ COI upload network error');
            showCOIUploadStatus('Network error during upload. Please try again.', 'error');
        };

        xhr.open('POST', '/api/documents');
        xhr.send(formData);

    } catch (error) {
        console.error('❌ COI upload error:', error);
        progressContainer.style.display = 'none';
        showCOIUploadStatus('Upload error: ' + error.message, 'error');
    }
}

// Handle general file upload
async function handleGeneralFileUpload(file) {
    const policyNumber = document.getElementById('overview-policy-number')?.value;

    if (!policyNumber) {
        showCOIUploadStatus('Please enter a policy number before uploading documents.', 'error');
        return;
    }

    // Validate file type
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png',
        'image/jpeg',
        'text/plain'
    ];
    if (!allowedTypes.includes(file.type)) {
        showCOIUploadStatus('Invalid file type. Please upload PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, or TXT files only.', 'error');
        return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
        showCOIUploadStatus('File too large. Maximum size is 50MB.', 'error');
        return;
    }

    console.log('📤 Uploading general file:', file.name, 'for policy:', policyNumber);

    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('policyId', window.editingPolicyId || '');
        formData.append('policyNumber', policyNumber);
        formData.append('uploadedBy', 'Admin User');
        formData.append('fileType', 'general');

        // Upload without progress bar for simplicity
        showCOIUploadStatus('Uploading document...', 'info');

        const response = await fetch('/api/documents', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ General file upload successful:', result);
            showCOIUploadStatus('Document uploaded successfully!', 'success');

            // Reload general files list
            loadPolicyGeneralFiles(policyNumber);
        } else {
            const errorData = await response.json();
            console.error('❌ General file upload failed:', errorData);
            showCOIUploadStatus('Upload failed: ' + (errorData.error || response.statusText), 'error');
        }

    } catch (error) {
        console.error('❌ General file upload error:', error);
        showCOIUploadStatus('Upload error: ' + error.message, 'error');
    }
}

// Show COI upload status
function showCOIUploadStatus(message, type) {
    const statusContainer = document.getElementById('coiUploadStatus');
    const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

    statusContainer.innerHTML = `
        <div style="padding: 12px; border-radius: 6px; background: ${color}20; border: 1px solid ${color}40; color: ${color}; margin: 10px 0;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        </div>
    `;

    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            statusContainer.innerHTML = '';
        }, 5000);
    }
}

// Load existing COI files for a policy
async function loadPolicyCoiFiles(policyNumber) {
    if (!policyNumber) return;

    console.log('📋 Loading COI files for policy:', policyNumber);

    try {
        const response = await fetch(`/api/policies/${encodeURIComponent(policyNumber)}/documents?type=coi`);

        if (!response.ok) {
            console.log('No existing COI files found for policy:', policyNumber);
            return;
        }

        const data = await response.json();
        const coiFiles = data.documents || [];

        const container = document.getElementById('coiFilesContainer');

        if (coiFiles.length === 0) {
            container.innerHTML = `
                <p style="color: #999; text-align: center; margin: 0;">
                    No COI documents uploaded yet
                </p>
            `;
            return;
        }

        container.innerHTML = coiFiles.map(file => `
            <div class="coi-file-item" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                margin-bottom: 8px;
                background: #f9f9f9;
            ">
                <div style="display: flex; align-items: center; flex: 1;">
                    <i class="fas fa-file-pdf" style="color: #ef4444; margin-right: 10px; font-size: 18px;"></i>
                    <div>
                        <div style="font-weight: 500; color: #333;">${file.original_name}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${formatFileSize(file.file_size)} • Uploaded ${formatDate(file.created_at)}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="downloadCOIFile('${file.id}')" style="
                        padding: 6px 12px;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button onclick="deleteCOIFile('${file.id}', '${policyNumber}')" style="
                        padding: 6px 12px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('❌ Error loading COI files:', error);
    }
}

// Load general documents for a policy
async function loadPolicyGeneralFiles(policyNumber) {
    if (!policyNumber) return;

    console.log('📋 Loading general files for policy:', policyNumber);

    try {
        const response = await fetch(`/api/policies/${encodeURIComponent(policyNumber)}/documents`);

        if (!response.ok) {
            console.log('No existing general files found for policy:', policyNumber);
            return;
        }

        const data = await response.json();
        // Filter out COI documents to show only general documents
        const generalFiles = (data.documents || []).filter(file =>
            !file.original_name.toLowerCase().includes('coi') &&
            !file.original_name.toLowerCase().includes('certificate') &&
            !file.original_name.toLowerCase().includes('acord')
        );

        const container = document.getElementById('generalFilesContainer');

        if (generalFiles.length === 0) {
            container.innerHTML = `
                <p style="color: #999; text-align: center; margin: 0; font-size: 14px;">
                    No general documents uploaded yet
                </p>
            `;
            return;
        }

        container.innerHTML = generalFiles.map(file => `
            <div class="general-file-item" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                margin-bottom: 6px;
                background: #fcfcfc;
                font-size: 14px;
            ">
                <div style="display: flex; align-items: center; flex: 1;">
                    <i class="fas fa-file-alt" style="color: #6b7280; margin-right: 8px; font-size: 16px;"></i>
                    <div>
                        <div style="font-weight: 500; color: #333;">${file.original_name}</div>
                        <div style="font-size: 11px; color: #666;">
                            ${formatFileSize(file.file_size)} • ${formatDate(file.created_at)}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button onclick="downloadCOIFile('${file.id}')" style="
                        padding: 4px 8px;
                        background: #6b7280;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="deleteCOIFile('${file.id}', '${policyNumber}')" style="
                        padding: 4px 8px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('❌ Error loading general files:', error);
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
}

// Download COI file
window.downloadCOIFile = async function(fileId) {
    try {
        const response = await fetch(`/api/documents/${fileId}/download`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'coi-document.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('❌ Error downloading COI file:', error);
        alert('Error downloading file. Please try again.');
    }
};

// Delete COI file
window.deleteCOIFile = async function(fileId, policyNumber) {
    if (!confirm('Are you sure you want to delete this COI document?')) {
        return;
    }

    try {
        const response = await fetch(`/api/documents/${fileId}`, { method: 'DELETE' });
        if (response.ok) {
            showCOIUploadStatus('COI document deleted successfully.', 'success');
            loadPolicyCoiFiles(policyNumber);
        } else {
            showCOIUploadStatus('Error deleting file. Please try again.', 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting COI file:', error);
        showCOIUploadStatus('Error deleting file. Please try again.', 'error');
    }
};

// Populate enhanced form
function populateEnhancedPolicyForm(policy) {
    console.log('📋 Populating enhanced policy form:', policy);

    // Basic fields
    if (document.getElementById('policyNumber')) document.getElementById('policyNumber').value = policy.policyNumber || '';
    if (document.getElementById('policyType')) document.getElementById('policyType').value = policy.policyType || '';
    if (document.getElementById('carrier')) document.getElementById('carrier').value = policy.carrier || '';
    if (document.getElementById('policyStatus')) document.getElementById('policyStatus').value = policy.status || policy.policyStatus || 'active';
    if (document.getElementById('effectiveDate')) document.getElementById('effectiveDate').value = policy.effectiveDate || '';
    if (document.getElementById('expirationDate')) document.getElementById('expirationDate').value = policy.expirationDate || '';

    // Financial fields
    if (document.getElementById('annualPremium')) {
        const premium = policy.premium || policy.annualPremium || (policy.financial && policy.financial['Annual Premium']) || '';
        document.getElementById('annualPremium').value = String(premium).replace(/[$,]/g, '');
    }

    // Insured information
    if (policy.insured) {
        if (document.getElementById('insuredName')) document.getElementById('insuredName').value = policy.insured['Name/Business Name'] || policy.insured['Primary Named Insured'] || '';
        if (document.getElementById('insuredAddress')) document.getElementById('insuredAddress').value = policy.insured['Address'] || '';
        if (document.getElementById('insuredCity')) document.getElementById('insuredCity').value = policy.insured['City'] || '';
        if (document.getElementById('insuredState')) document.getElementById('insuredState').value = policy.insured['State'] || '';
        if (document.getElementById('insuredZip')) document.getElementById('insuredZip').value = policy.insured['ZIP'] || '';
        if (document.getElementById('insuredPhone')) document.getElementById('insuredPhone').value = policy.insured['Phone'] || '';
        if (document.getElementById('insuredEmail')) document.getElementById('insuredEmail').value = policy.insured['Email'] || '';
    }

    // Coverage information
    if (policy.coverage) {
        if (document.getElementById('bodilyInjury')) document.getElementById('bodilyInjury').value = policy.coverage['Bodily Injury'] || '';
        if (document.getElementById('propertyDamage')) document.getElementById('propertyDamage').value = policy.coverage['Property Damage'] || '';
        if (document.getElementById('comprehensive')) document.getElementById('comprehensive').value = policy.coverage['Comprehensive'] || '';
        if (document.getElementById('collision')) document.getElementById('collision').value = policy.coverage['Collision'] || '';
        if (document.getElementById('uninsuredMotorist')) document.getElementById('uninsuredMotorist').value = policy.coverage['Uninsured Motorist'] || '';
    }

    // Notes
    if (document.getElementById('policyNotes')) document.getElementById('policyNotes').value = policy.notes || '';
}

// Enhanced generateTabContent function to add COI upload to Documents tab
const originalGenerateTabContent = window.generateTabContent;

window.generateTabContent = function(tabId, policyType) {
    // Call original function first
    let originalContent = '';
    if (originalGenerateTabContent) {
        originalContent = originalGenerateTabContent(tabId, policyType);
    }

    // If this is the documents tab, enhance it with COI upload functionality
    if (tabId === 'documents') {
        return enhancedDocumentsTabContent(policyType);
    }

    // For all other tabs, return original content
    return originalContent;
};

// Enhanced Documents tab content with COI upload
function enhancedDocumentsTabContent(policyType) {
    return `
        <div class="form-section">
            <h3><i class="fas fa-file-upload"></i> Certificate of Insurance Documents</h3>
            <p style="color: #666; margin-bottom: 20px;">
                Upload the COI document that will be used when sending COIs for this policy.
                Supported formats: PDF, DOC, DOCX, PNG, JPG
            </p>

            <!-- Upload Area -->
            <div id="coiUploadArea" class="upload-area" style="
                border: 2px dashed #ddd;
                border-radius: 8px;
                padding: 40px;
                text-align: center;
                margin: 20px 0;
                cursor: pointer;
                transition: all 0.3s ease;
            ">
                <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #999; margin-bottom: 16px;"></i>
                <h4 style="margin: 0 0 8px 0; color: #333;">Drop COI file here or click to browse</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">Maximum file size: 50MB</p>
                <input type="file" id="coiFileInput" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style="display: none;">
            </div>

            <!-- Upload Progress -->
            <div id="coiUploadProgress" style="display: none; margin: 20px 0;">
                <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                    <div id="coiProgressBar" style="height: 24px; background: #3b82f6; width: 0%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                        0%
                    </div>
                </div>
            </div>

            <!-- Current COI Files -->
            <div id="coiFilesList" style="margin-top: 30px;">
                <h4 style="margin-bottom: 15px; color: #333;">
                    <i class="fas fa-files-o"></i> Current COI Documents
                </h4>
                <div id="coiFilesContainer" style="border: 1px solid #e0e0e0; border-radius: 6px; min-height: 60px; padding: 15px;">
                    <p style="color: #999; text-align: center; margin: 0;">
                        No COI documents uploaded yet
                    </p>
                </div>
            </div>

            <!-- Upload Status -->
            <div id="coiUploadStatus" style="margin-top: 20px;"></div>

            <!-- General Documents Section -->
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                <h4><i class="fas fa-folder"></i> General Documents</h4>
                <p style="color: #666; margin-bottom: 20px;">
                    Upload other policy-related documents such as applications, quotes, amendments, etc.
                </p>

                <div id="generalUploadArea" class="upload-area" style="
                    border: 2px dashed #ddd;
                    border-radius: 8px;
                    padding: 30px;
                    text-align: center;
                    margin: 20px 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    <i class="fas fa-file-upload" style="font-size: 36px; color: #999; margin-bottom: 12px;"></i>
                    <h4 style="margin: 0 0 8px 0; color: #333;">Upload general documents</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG</p>
                    <input type="file" id="generalFileInput" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" style="display: none;">
                </div>

                <div id="generalFilesList" style="margin-top: 20px;">
                    <div id="generalFilesContainer" style="border: 1px solid #e0e0e0; border-radius: 6px; min-height: 40px; padding: 15px;">
                        <p style="color: #999; text-align: center; margin: 0; font-size: 14px;">
                            No general documents uploaded yet
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize upload functionality when documents tab is shown
const originalSwitchTab = window.switchTab;
window.switchTab = function(tabId) {
    // Call original switchTab function
    if (originalSwitchTab) {
        originalSwitchTab(tabId);
    }

    // If switching to documents tab, initialize COI upload functionality
    if (tabId === 'documents') {
        setTimeout(() => {
            initializeCOIUpload();

            // Load existing files if we have a policy
            const policyNumber = document.getElementById('overview-policy-number')?.value;
            if (policyNumber) {
                loadPolicyCoiFiles(policyNumber);
                loadPolicyGeneralFiles(policyNumber);
            }
        }, 100);
    }
};

console.log('✅ Admin COI Upload Enhancement loaded');
console.log('🎯 Policy edit modal now includes COI upload section');
console.log('📋 Features added:');
console.log('  - COI Documents tab in policy modal');
console.log('  - Drag & drop file upload');
console.log('  - Progress tracking');
console.log('  - File management (view, download, delete)');
console.log('  - Integration with existing document system');