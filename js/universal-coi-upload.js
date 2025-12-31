// Universal COI Upload - DISABLED for CRM
console.log('🔧 Universal COI Upload - DISABLED for CRM interface');

// Function to add COI upload section to any modal containing policy fields - DISABLED
function addCOIUploadToModal(modalElement) {
    console.log('📋 COI upload section disabled for CRM');
    return; // Exit early - disable COI upload functionality

    // Create COI upload section
    const coiSection = document.createElement('div');
    coiSection.id = 'universalCOISection';
    coiSection.style.cssText = `
        margin-top: 30px;
        padding: 25px;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    `;

    coiSection.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #1f2937; display: flex; align-items: center; font-size: 18px; font-weight: 600;">
            <i class="fas fa-file-upload" style="margin-right: 10px; color: #3b82f6;"></i>
            Certificate of Insurance Documents
        </h3>
        <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
            Upload the COI document that will be used when sending COIs for this policy.
            Supported formats: PDF, DOC, DOCX, PNG, JPG
        </p>

        <!-- Upload Area -->
        <div id="universalCOIUploadArea" style="
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
        ">
            <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #999; margin-bottom: 16px; display: block;"></i>
            <h4 style="margin: 0 0 8px 0; color: #333;">Drop COI file here or click to browse</h4>
            <p style="margin: 0; color: #666; font-size: 14px;">Maximum file size: 50MB</p>
            <input type="file" id="universalCOIFileInput" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style="display: none;">
        </div>

        <!-- Upload Progress -->
        <div id="universalCOIProgress" style="display: none; margin: 20px 0;">
            <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                <div id="universalCOIProgressBar" style="height: 24px; background: #3b82f6; width: 0%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                    0%
                </div>
            </div>
        </div>

        <!-- Current Files -->
        <div id="universalCOIFilesList" style="margin-top: 20px;">
            <h4 style="margin-bottom: 15px; color: #333; font-size: 16px;">
                <i class="fas fa-files-o"></i> Current COI Documents
            </h4>
            <div id="universalCOIFilesContainer" style="border: 1px solid #e0e0e0; border-radius: 6px; min-height: 60px; padding: 15px; background: white;">
                <p style="color: #999; text-align: center; margin: 0;">
                    No COI documents uploaded yet
                </p>
            </div>
        </div>

        <!-- Status -->
        <div id="universalCOIStatus" style="margin-top: 15px;"></div>
    `;

    // Insert before the cancel/save buttons
    const buttons = modalElement.querySelector('.form-actions, .modal-footer, [onclick*="Cancel"], button[onclick*="cancel"]')?.parentElement;
    if (buttons) {
        buttons.parentNode.insertBefore(coiSection, buttons);
    } else {
        // Fallback: append to modal body or modal itself
        const modalBody = modalElement.querySelector('.modal-body, .modal-content');
        if (modalBody) {
            modalBody.appendChild(coiSection);
        } else {
            modalElement.appendChild(coiSection);
        }
    }

    // Initialize upload functionality
    initializeUniversalCOIUpload();

    // Load existing files
    setTimeout(() => {
        const policyNumber = getPolicyNumberFromModal(modalElement);
        if (policyNumber) {
            loadUniversalCOIFiles(policyNumber);
        }
    }, 100);
}

// Get policy number from any policy modal
function getPolicyNumberFromModal(modalElement) {
    // Try various field selectors
    const selectors = [
        'input[id*="policyNumber"]',
        'input[id*="policy-number"]',
        'input[placeholder*="POL"]',
        'input[value*="864709702"]',
        'span:contains("864709702")',
        'div:contains("Policy Number")',
        '.policy-number'
    ];

    for (const selector of selectors) {
        const element = modalElement.querySelector(selector);
        if (element) {
            const value = element.value || element.textContent || element.innerText;
            if (value && value.trim()) {
                console.log('📋 Found policy number:', value.trim());
                return value.trim();
            }
        }
    }

    // Fallback: look for any number pattern
    const textContent = modalElement.textContent || modalElement.innerText;
    const policyNumberMatch = textContent.match(/\b\d{6,}\b/);
    if (policyNumberMatch) {
        console.log('📋 Found policy number from text:', policyNumberMatch[0]);
        return policyNumberMatch[0];
    }

    console.log('⚠️ Could not find policy number in modal');
    return null;
}

// Initialize COI upload functionality
function initializeUniversalCOIUpload() {
    const uploadArea = document.getElementById('universalCOIUploadArea');
    const fileInput = document.getElementById('universalCOIFileInput');

    if (!uploadArea || !fileInput) return;

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
        uploadArea.style.backgroundColor = 'white';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = 'white';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleUniversalCOIUpload(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUniversalCOIUpload(e.target.files[0]);
        }
    });

    console.log('✅ Universal COI upload initialized');
}

// Handle COI file upload
async function handleUniversalCOIUpload(file) {
    const modalElement = document.getElementById('universalCOISection').closest('.modal, .modal-container, [class*="modal"]');
    const policyNumber = getPolicyNumberFromModal(modalElement) || '864709702'; // fallback

    // Validate file
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
        showUniversalCOIStatus('Invalid file type. Please upload PDF, DOC, DOCX, PNG, or JPG files only.', 'error');
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        showUniversalCOIStatus('File too large. Maximum size is 50MB.', 'error');
        return;
    }

    console.log('📤 Uploading COI file:', file.name, 'for policy:', policyNumber);

    // Show progress
    const progressContainer = document.getElementById('universalCOIProgress');
    const progressBar = document.getElementById('universalCOIProgressBar');
    progressContainer.style.display = 'block';

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('policyId', policyNumber);
        formData.append('policyNumber', policyNumber);
        formData.append('uploadedBy', 'Admin User');

        // Upload with progress
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressBar.style.width = percent + '%';
                progressBar.textContent = Math.round(percent) + '%';
            }
        };

        xhr.onload = () => {
            progressContainer.style.display = 'none';

            if (xhr.status === 200) {
                console.log('✅ COI upload successful');
                showUniversalCOIStatus('COI document uploaded successfully!', 'success');
                loadUniversalCOIFiles(policyNumber);
            } else {
                console.error('❌ COI upload failed:', xhr.responseText);
                showUniversalCOIStatus('Upload failed: ' + xhr.responseText, 'error');
            }
        };

        xhr.onerror = () => {
            progressContainer.style.display = 'none';
            showUniversalCOIStatus('Network error during upload. Please try again.', 'error');
        };

        xhr.open('POST', '/api/documents');
        xhr.send(formData);

    } catch (error) {
        progressContainer.style.display = 'none';
        showUniversalCOIStatus('Upload error: ' + error.message, 'error');
    }
}

// Show status messages
function showUniversalCOIStatus(message, type) {
    const statusContainer = document.getElementById('universalCOIStatus');
    if (!statusContainer) return;

    const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

    statusContainer.innerHTML = `
        <div style="padding: 12px; border-radius: 6px; background: ${color}20; border: 1px solid ${color}40; color: ${color}; margin: 10px 0; font-size: 14px; display: flex; align-items: center;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="margin-right: 8px;"></i>
            ${message}
        </div>
    `;

    if (type === 'success') {
        setTimeout(() => {
            statusContainer.innerHTML = '';
        }, 5000);
    }
}

// Load existing COI files
async function loadUniversalCOIFiles(policyNumber) {
    if (!policyNumber) return;

    try {
        const response = await fetch(`/api/policies/${encodeURIComponent(policyNumber)}/documents?type=coi`);
        if (!response.ok) return;

        const data = await response.json();
        const files = data.documents || [];

        const container = document.getElementById('universalCOIFilesContainer');
        if (!container) return;

        if (files.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; margin: 0;">No COI documents uploaded yet</p>';
            return;
        }

        container.innerHTML = files.map(file => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 8px; background: #f9f9f9;">
                <div style="display: flex; align-items: center; flex: 1;">
                    <i class="fas fa-file-pdf" style="color: #ef4444; margin-right: 10px; font-size: 18px;"></i>
                    <div>
                        <div style="font-weight: 500; color: #333;">${file.original_name}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${formatBytes(file.file_size)} • ${new Date(file.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="downloadUniversalCOI('${file.id}')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button onclick="deleteUniversalCOI('${file.id}', '${policyNumber}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('❌ Error loading COI files:', error);
    }
}

// Utility functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

window.downloadUniversalCOI = async function(fileId) {
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
        alert('Error downloading file. Please try again.');
    }
};

window.deleteUniversalCOI = async function(fileId, policyNumber) {
    if (!confirm('Are you sure you want to delete this COI document?')) return;

    try {
        const response = await fetch(`/api/documents/${fileId}`, { method: 'DELETE' });
        if (response.ok) {
            showUniversalCOIStatus('COI document deleted successfully.', 'success');
            loadUniversalCOIFiles(policyNumber);
        }
    } catch (error) {
        showUniversalCOIStatus('Error deleting file. Please try again.', 'error');
    }
};

// Observer to detect policy modals
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if this is a policy modal
                const isModal = node.classList && (
                    node.classList.contains('modal') ||
                    node.classList.contains('Modal') ||
                    node.id === 'policyModal'
                );

                const containsPolicyFields = node.innerHTML && (
                    node.innerHTML.includes('Policy Number') ||
                    node.innerHTML.includes('Client Name') ||
                    node.innerHTML.includes('864709702') ||
                    node.innerHTML.includes('ARB Transport')
                );

                if ((isModal && containsPolicyFields) ||
                    (containsPolicyFields && node.querySelector && node.querySelector('input, select'))) {

                    console.log('🎯 Policy modal detected:', node);

                    // Wait a bit for the modal to fully render
                    setTimeout(() => {
                        if (!node.querySelector('#universalCOISection')) {
                            addCOIUploadToModal(node);
                        }
                    }, 500);
                }

                // Also check child elements
                if (node.querySelector) {
                    const modalChild = node.querySelector('.modal, .Modal, [id*="modal"]');
                    if (modalChild && modalChild.innerHTML && modalChild.innerHTML.includes('Policy Number')) {
                        setTimeout(() => {
                            if (!modalChild.querySelector('#universalCOISection')) {
                                addCOIUploadToModal(modalChild);
                            }
                        }, 500);
                    }
                }
            }
        });
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('✅ Universal COI Upload loaded - will detect any policy modal');