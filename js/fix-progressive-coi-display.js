// FIX: Progressive COI Display - Actually shows Progressive info on the COI form
console.log('🔧 Fixing Progressive COI display to show correct information');

// Progressive Commercial information
const PROGRESSIVE_INFO = {
    producer: {
        name: 'UNITED INS GROUP LLC',
        address: '435 ABBEYVILLE RD F, MEDINA, OH 44256',
        phone: '1-800-444-4487',
        fax: '',
        email: 'progressivecommercial@email.progressive.com'
    },
    insurer: {
        name: 'Progressive Preferred Insurance Company',
        naicCode: '37834'
    }
};

// Override prepareCOI to use Progressive info when appropriate
const originalPrepareCOI = window.prepareCOI;
window.prepareCOI = function(policyId) {
    console.log('🔧 Intercepted prepareCOI for policy:', policyId);

    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        console.error('Policy not found:', policyId);
        if (originalPrepareCOI) {
            return originalPrepareCOI(policyId);
        }
        return;
    }

    // Check if this is a Progressive policy
    const isProgressive = policy.carrier &&
        (policy.carrier.toLowerCase().includes('progressive') ||
         policy.carrier.toLowerCase() === 'progressive');

    console.log(`Policy carrier: ${policy.carrier}, Is Progressive: ${isProgressive}`);

    // Get the policy viewer element
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer not found');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Determine which producer info to use
    const producerInfo = isProgressive ? PROGRESSIVE_INFO.producer : {
        name: 'Vanguard Insurance Agency',
        address: '123 Main Street, Suite 100, New York, NY 10001',
        phone: '(555) 123-4567',
        fax: '(555) 123-4568',
        email: 'coi@vanguardinsurance.com'
    };

    // Determine insurer info
    const insurerInfo = isProgressive ? PROGRESSIVE_INFO.insurer : {
        name: policy.carrier || 'Insurance Company',
        naicCode: '12345'
    };

    // Add print-specific CSS if not already added
    if (!document.getElementById('acord-print-styles')) {
        const printStyles = document.createElement('style');
        printStyles.id = 'acord-print-styles';
        printStyles.innerHTML = `
            @media print {
                body * { visibility: hidden !important; }
                #acordFormContent, #acordFormContent * { visibility: visible !important; }
                #acordFormContent {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    background: white !important;
                }
                .sidebar, .navbar, .acord-header, .acord-status-bar { display: none !important; }
                @page { size: letter; margin: 0.5in; }
            }
        `;
        document.head.appendChild(printStyles);
    }

    // Create the ACORD 25 display with correct producer info
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header with actions -->
            <div class="acord-header no-print" style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                        <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                        Policy: ${policy.policyNumber || 'N/A'} | ${policy.carrier || 'N/A'}
                        ${isProgressive ? ' | <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">Progressive Commercial</span>' : ''}
                    </p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="fillACORDForm('${policyId}')" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-edit"></i> Fill Form
                    </button>
                    <button onclick="downloadACORD()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button onclick="printACORD()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button onclick="emailACORD('${policyId}')" class="btn-primary" style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-envelope"></i> Email COI
                    </button>
                    <button onclick="backToPolicyView('${policyId}')" class="btn-secondary" style="background: rgba(255,255,255,0.1); border: 2px solid white; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            </div>

            <!-- ACORD Form Content -->
            <div class="pdf-container" style="flex: 1; padding: 20px; background: #f3f4f6; overflow: auto;">
                <div id="acordFormContent" style="max-width: 8.5in; margin: 0 auto; background: white; padding: 0.5in; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- ACORD 25 Form HTML -->
                    <div class="acord-form">
                        <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">ACORD 25 CERTIFICATE OF LIABILITY INSURANCE</div>
                            <div>DATE (MM/DD/YYYY): ${today}</div>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">PRODUCER</div>
                            <div style="margin-bottom: 5px;">
                                <strong>Name:</strong> ${producerInfo.name}
                            </div>
                            <div style="margin-bottom: 5px;">
                                <strong>Address:</strong> ${producerInfo.address}
                            </div>
                            <div style="margin-bottom: 5px;">
                                <strong>Phone:</strong> ${producerInfo.phone} ${producerInfo.fax ? '| <strong>Fax:</strong> ' + producerInfo.fax : ''}
                            </div>
                            ${producerInfo.email ? `<div><strong>Email:</strong> ${producerInfo.email}</div>` : ''}
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">INSURED</div>
                            <div style="margin-bottom: 5px;">
                                <strong>Name:</strong> ${policy.clientName || policy.name || 'N/A'}
                            </div>
                            <div>
                                <strong>Address:</strong> ${policy.address || 'N/A'}
                            </div>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">INSURER(S) AFFORDING COVERAGE</div>
                            <table style="width: 100%; margin-top: 5px;">
                                <tr>
                                    <td style="width: 80px;"><strong>INSURER A:</strong></td>
                                    <td>${insurerInfo.name}</td>
                                    <td style="width: 100px;"><strong>NAIC #:</strong> ${insurerInfo.naicCode}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">COVERAGES</div>
                            <table style="width: 100%; margin-top: 10px; font-size: 10px;">
                                <tr style="background: #f5f5f5;">
                                    <th style="text-align: left; padding: 5px;">TYPE OF INSURANCE</th>
                                    <th style="text-align: center; padding: 5px;">INSR LTR</th>
                                    <th style="text-align: center; padding: 5px;">POLICY NUMBER</th>
                                    <th style="text-align: center; padding: 5px;">POLICY EFF DATE</th>
                                    <th style="text-align: center; padding: 5px;">POLICY EXP DATE</th>
                                    <th style="text-align: center; padding: 5px;">LIMITS</th>
                                </tr>
                                ${policy.policyType === 'commercial-auto' ? `
                                <tr>
                                    <td style="padding: 5px;">COMMERCIAL AUTO</td>
                                    <td style="text-align: center;">A</td>
                                    <td style="text-align: center;">${policy.policyNumber || ''}</td>
                                    <td style="text-align: center;">${policy.effectiveDate || ''}</td>
                                    <td style="text-align: center;">${policy.expirationDate || ''}</td>
                                    <td style="text-align: center;">$${policy.limit || '1,000,000'}</td>
                                </tr>` : ''}
                                ${policy.policyType === 'general-liability' ? `
                                <tr>
                                    <td style="padding: 5px;">GENERAL LIABILITY</td>
                                    <td style="text-align: center;">A</td>
                                    <td style="text-align: center;">${policy.policyNumber || ''}</td>
                                    <td style="text-align: center;">${policy.effectiveDate || ''}</td>
                                    <td style="text-align: center;">${policy.expirationDate || ''}</td>
                                    <td style="text-align: center;">$${policy.limit || '2,000,000'}</td>
                                </tr>` : ''}
                            </table>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">CERTIFICATE HOLDER</div>
                            <div id="certificateHolder" style="padding: 10px;">
                                <div contenteditable="true" style="min-height: 60px; padding: 5px; border: 1px dashed #ccc;">
                                    [Enter Certificate Holder Information]
                                </div>
                            </div>
                        </div>

                        <div style="border: 1px solid #000; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">AUTHORIZED REPRESENTATIVE</div>
                            <div style="padding: 10px; text-align: right;">
                                <div style="border-bottom: 1px solid #000; width: 250px; margin-left: auto; margin-bottom: 5px; padding-bottom: 2px;">
                                    Grant Corp
                                </div>
                                <div style="font-size: 9px; color: #666;">Signature</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Status bar -->
            <div class="acord-status-bar no-print" style="padding: 10px 20px; background: #f8f9fa; border-top: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6c757d; font-size: 14px;">
                    <i class="fas fa-info-circle"></i> ACORD 25 (2016/03) - ${isProgressive ? 'Progressive Commercial' : 'Standard'} Certificate
                </span>
                <span style="color: #28a745; font-size: 14px;">
                    <i class="fas fa-check-circle"></i> Ready to send
                </span>
            </div>
        </div>
    `;

    // Store current COI policy data for other functions
    window.currentCOIPolicy = policy;
    window.currentCOIProducer = producerInfo;
    window.currentCOIInsurer = insurerInfo;

    console.log(`✅ COI prepared with ${isProgressive ? 'Progressive' : 'Standard'} information`);

    // Show notification if Progressive
    if (isProgressive) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        notification.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 20px;"></i>
            <div>
                <strong>Progressive Commercial COI</strong><br>
                <small>Phone: ${PROGRESSIVE_INFO.producer.phone} | Email: ${PROGRESSIVE_INFO.producer.email}</small>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
};

console.log('✅ Progressive COI display fix loaded - will show correct contact information on COI forms');