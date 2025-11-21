// Restore COI Management Features
console.log('🔧 Restoring COI management features...');

// Certificate Holder Modal - Make it globally accessible
window.openCertificateHolderModal = function(policyId) {
    console.log('Opening certificate holder modal for policy:', policyId);

    // Get saved certificate holders from localStorage
    const savedHolders = JSON.parse(localStorage.getItem('certificateHolders') || '[]');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'certificateHolderModal';
    modal.innerHTML = `
        <div class="modal-container large" style="max-width: 900px;">
            <div class="modal-header" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
                <h2 style="color: white;"><i class="fas fa-user-shield"></i> Certificate Holder Management</h2>
                <button class="close-btn" onclick="closeModal('certificateHolderModal')" style="color: white;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 30px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <!-- Left side - Add New -->
                    <div>
                        <h3 style="margin-bottom: 20px; color: #059669;">Add New Certificate Holder</h3>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Company Name</label>
                            <input type="text" id="holderCompanyName" class="form-control" placeholder="Enter company name" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Address</label>
                            <textarea id="holderAddress" class="form-control" rows="3" placeholder="Enter full address" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Contact Email</label>
                            <input type="email" id="holderEmail" class="form-control" placeholder="contact@company.com" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Requirements</label>
                            <textarea id="holderRequirements" class="form-control" rows="3" placeholder="Special requirements or notes" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;"></textarea>
                        </div>
                        <button onclick="addCertificateHolder('${policyId}')" class="btn-primary" style="padding: 12px 24px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border: none; border-radius: 8px; font-weight: 600; width: 100%;">
                            <i class="fas fa-plus"></i> Add Certificate Holder
                        </button>
                    </div>

                    <!-- Right side - Saved Holders -->
                    <div>
                        <h3 style="margin-bottom: 20px; color: #059669;">Saved Certificate Holders</h3>
                        <div id="savedHoldersList" style="max-height: 400px; overflow-y: auto;">
                            ${savedHolders.length === 0 ? '<p style="color: #6b7280;">No saved certificate holders yet</p>' :
                            savedHolders.map(holder => `
                                <div class="holder-card" style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px; position: relative;">
                                    <h4 style="margin: 0 0 10px 0; color: #111827;">${holder.companyName}</h4>
                                    <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${holder.address}</p>
                                    <p style="margin: 5px 0; color: #4b5563; font-size: 14px;"><i class="fas fa-envelope"></i> ${holder.email}</p>
                                    ${holder.requirements ? `<p style="margin: 5px 0; color: #6b7280; font-size: 13px; font-style: italic;">${holder.requirements}</p>` : ''}
                                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                                        <button onclick="useCertificateHolder('${policyId}', '${holder.id}')" class="btn-primary" style="padding: 6px 12px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 13px;">
                                            <i class="fas fa-check"></i> Use This
                                        </button>
                                        <button onclick="deleteCertificateHolder('${holder.id}')" class="btn-secondary" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 13px;">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Add Certificate Holder
function addCertificateHolder(policyId) {
    const companyName = document.getElementById('holderCompanyName').value.trim();
    const address = document.getElementById('holderAddress').value.trim();
    const email = document.getElementById('holderEmail').value.trim();
    const requirements = document.getElementById('holderRequirements').value.trim();

    if (!companyName || !address) {
        showNotification('Please enter company name and address', 'error');
        return;
    }

    const savedHolders = JSON.parse(localStorage.getItem('certificateHolders') || '[]');
    const newHolder = {
        id: Date.now().toString(),
        companyName,
        address,
        email,
        requirements,
        createdAt: new Date().toISOString()
    };

    savedHolders.push(newHolder);
    localStorage.setItem('certificateHolders', JSON.stringify(savedHolders));

    showNotification('Certificate holder saved successfully', 'success');

    // Refresh the modal
    closeModal('certificateHolderModal');
    openCertificateHolderModal(policyId);
}

// Delete Certificate Holder
function deleteCertificateHolder(holderId) {
    if (confirm('Are you sure you want to delete this certificate holder?')) {
        const savedHolders = JSON.parse(localStorage.getItem('certificateHolders') || '[]');
        const filtered = savedHolders.filter(h => h.id !== holderId);
        localStorage.setItem('certificateHolders', JSON.stringify(filtered));

        // Refresh the list
        const listDiv = document.getElementById('savedHoldersList');
        if (listDiv) {
            location.reload(); // Simple refresh for now
        }
    }
}

// Use Certificate Holder for COI
function useCertificateHolder(policyId, holderId) {
    const savedHolders = JSON.parse(localStorage.getItem('certificateHolders') || '[]');
    const holder = savedHolders.find(h => h.id === holderId);

    if (!holder) {
        showNotification('Certificate holder not found', 'error');
        return;
    }

    // Close the modal
    closeModal('certificateHolderModal');

    // Open COI preparation with this holder pre-filled
    prepareCOIWithHolder(policyId, holder);
}

// Prepare COI with pre-filled certificate holder
function prepareCOIWithHolder(policyId, holder) {
    // First call the regular prepareCOI function
    prepareCOI(policyId);

    // Then pre-fill the holder information after a short delay
    setTimeout(() => {
        const holderField = document.getElementById('holderInfo');
        if (holderField) {
            holderField.value = `${holder.companyName}\n${holder.address}`;
        }

        // If there's an email field, fill it too
        const emailField = document.getElementById('holderEmail');
        if (emailField) {
            emailField.value = holder.email;
        }

        // Add any special requirements as notes
        if (holder.requirements) {
            const notesField = document.getElementById('coiNotes');
            if (notesField) {
                notesField.value = holder.requirements;
            }
        }
    }, 500);
}

// Send COI Request Email
function sendCOIRequest(policyId) {
    console.log('Sending COI request for policy:', policyId);

    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p => p.id === policyId);

    if (!policy) {
        showNotification('Policy not found', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'coiRequestModal';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 700px;">
            <div class="modal-header" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
                <h2 style="color: white;"><i class="fas fa-envelope"></i> Send COI Request</h2>
                <button class="close-btn" onclick="closeModal('coiRequestModal')" style="color: white;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 30px;">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">From</label>
                    <input type="email" id="requestFrom" class="form-control" value="contact@vigagency.com" readonly style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; background: #f3f4f6;">
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">To</label>
                    <input type="email" id="requestTo" class="form-control" placeholder="recipient@company.com" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">Subject</label>
                    <input type="text" id="requestSubject" class="form-control" value="Certificate of Insurance Request - ${policy.clientName || policy.insuredName || 'Policy #' + policy.policyNumber}" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; margin-bottom: 8px; display: block;">Message</label>
                    <textarea id="requestMessage" class="form-control" rows="8" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">Dear Valued Client,

We are requesting a Certificate of Insurance for ${policy.clientName || policy.insuredName || 'your company'}.

Please ensure the certificate includes the following holder information:

VIG Agency
123 Main Street
Brunswick, OH 44212

Policy Details:
- Policy Number: ${policy.policyNumber || 'N/A'}
- Effective Date: ${policy.effectiveDate || 'N/A'}
- Expiration Date: ${policy.expirationDate || 'N/A'}

Please send the COI at your earliest convenience.

Best regards,
VIG Agency Team
contact@vigagency.com
(555) 123-4567</textarea>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 15px;">
                    <button onclick="closeModal('coiRequestModal')" class="btn-secondary" style="padding: 12px 24px; background: #fff; border: 2px solid #d1d5db; color: #374151; border-radius: 8px; font-weight: 500;">
                        Cancel
                    </button>
                    <button onclick="sendCOIRequestEmail('${policyId}')" class="btn-primary" style="padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; border: none; border-radius: 8px; font-weight: 600;">
                        <i class="fas fa-paper-plane"></i> Send Request
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Send the actual COI request email
async function sendCOIRequestEmail(policyId) {
    const to = document.getElementById('requestTo').value.trim();
    const subject = document.getElementById('requestSubject').value.trim();
    const message = document.getElementById('requestMessage').value.trim();

    if (!to) {
        showNotification('Please enter recipient email', 'error');
        return;
    }

    // Show loading state
    showNotification('Sending email...', 'info');

    try {
        // Send via backend API
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api/coi/send-request'
            : `http://${window.location.hostname}:3001/api/coi/send-request`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'contact@vigagency.com',
                to: to,
                subject: subject,
                message: message,
                policyId: policyId
            })
        });

        if (response.ok) {
            showNotification('COI request sent successfully', 'success');
            closeModal('coiRequestModal');

            // Log the email in COI inbox
            const coiEmails = JSON.parse(localStorage.getItem('coiEmails') || '[]');
            coiEmails.unshift({
                id: Date.now().toString(),
                from: 'contact@vigagency.com',
                to: to,
                subject: subject,
                body: message,
                date: new Date().toISOString(),
                type: 'sent',
                policyId: policyId
            });
            localStorage.setItem('coiEmails', JSON.stringify(coiEmails));

            // Refresh COI inbox if visible
            if (document.getElementById('coiInbox')) {
                loadCOIEmails();
            }
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        console.error('Error sending COI request:', error);
        // Fallback to mailto link
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoLink;
        showNotification('Opening email client...', 'info');
        closeModal('coiRequestModal');
    }
}

// Make functions globally available
window.openCertificateHolderModal = openCertificateHolderModal;
window.addCertificateHolder = addCertificateHolder;
window.deleteCertificateHolder = deleteCertificateHolder;
window.useCertificateHolder = useCertificateHolder;
window.prepareCOIWithHolder = prepareCOIWithHolder;
window.sendCOIRequest = sendCOIRequest;
window.sendCOIRequestEmail = sendCOIRequestEmail;

console.log('✅ COI management features restored');