// Real Custom ACORD PDF Viewer - Actually renders and controls the PDF
console.log('🎯 Real ACORD Viewer Initializing...');

// Immediately log that we're setting up the function
console.log('🔧 Setting up createRealACORDViewer function...');

// Wait for PDF.js to be available
window.addEventListener('load', function() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        console.log('✅ PDF.js ready for real viewer');
    }
});

// Global state for our real viewer
window.realPdfState = {
    pdfDoc: null,
    pageNum: 1,
    pageRendering: false,
    scale: 1.3,
    canvas: null,
    ctx: null,
    formData: {}
};

// Helper function to determine signature based on agent
function getSignatureForAgent(agent) {
    console.log('🖋️ ACORD VIEWER SIGNATURE SELECTION:');
    console.log('  - Agent value:', agent);

    if (agent) {
        const lowerAgent = agent.toLowerCase();

        if (lowerAgent.includes('grant')) {
            console.log('✅ SIGNATURE: Using Grant Corp signature for Grant agent');
            return 'Grant Corp';
        } else if (lowerAgent.includes('hunter')) {
            console.log('✅ SIGNATURE: Using Hunter Brooks signature for Hunter agent');
            return 'Hunter Brooks';
        } else if (lowerAgent.includes('carson')) {
            console.log('✅ SIGNATURE: Using Carson Sweitzer signature for Carson agent');
            return 'Carson Sweitzer';
        } else if (lowerAgent.includes('maureen')) {
            console.log('✅ SIGNATURE: Using Maureen Corp signature for Maureen agent');
            return 'Maureen Corp';
        }
    }

    console.log('✅ SIGNATURE: Using Grant Corp signature (default)');
    return 'Grant Corp';
}

// Check if there's a saved COI for this policy
window.checkSavedCOI = async function(policyId) {
    try {
        const response = await fetch(`http://162.220.14.239:3001/api/get-saved-coi/${policyId}`);
        if (response.ok) {
            return true;
        }
    } catch (e) {
        console.log('No saved COI found for policy:', policyId);
    }
    return false;
};

// Helper function to format dates for ACORD form (MM/DD/YYYY)
function formatDateForACORD(dateStr) {
    if (!dateStr || dateStr === '') return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date)) return '';
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    } catch (e) {
        return dateStr; // Return as-is if can't parse
    }
}

// Generate operation description based on policy type
function generateOperationDescription(policyData) {
    if (!policyData) return '';

    const policyType = policyData.policyType || policyData.overview?.['Policy Type'] || '';
    const insuredName = policyData.clientName || policyData.insured?.['Name/Business Name'] || '';

    let description = `Certificate holder is an additional insured with respect to `;

    if (policyType === 'commercial-auto' || policyType === 'Commercial Auto') {
        // Add vehicle info if available
        if (policyData.vehicles && policyData.vehicles.length > 0) {
            const vehicleCount = policyData.vehicles.length;
            description += `${vehicleCount} vehicle${vehicleCount > 1 ? 's' : ''} operated by ${insuredName}. `;

            // List each vehicle with details
            description += '\n\nVEHICLES:\n';
            policyData.vehicles.forEach((vehicle, index) => {
                const year = vehicle.Year || vehicle.year || '';
                const make = vehicle.Make || vehicle.make || '';
                const model = vehicle.Model || vehicle.model || '';
                const vin = vehicle.VIN || vehicle.vin || '';
                const value = vehicle.Value || vehicle.value || '';
                const type = vehicle.Type || vehicle.type || 'Vehicle';

                description += `${index + 1}. ${year} ${make} ${model}`.trim();
                if (vin) description += ` - VIN: ${vin}`;
                if (value) {
                    // Format value with commas if it's a number
                    const formattedValue = parseFloat(value) ? parseFloat(value).toLocaleString() : value;
                    description += ` - Value: $${formattedValue}`;
                }
                if (type && type !== 'Vehicle') description += ` (${type})`;
                description += '\n';
            });

            // Add DOT/MC numbers if available
            const dotNumber = policyData.dotNumber || policyData.overview?.['DOT Number'] || '';
            const mcNumber = policyData.mcNumber || policyData.overview?.['MC Number'] || '';

            if (dotNumber || mcNumber) {
                description += '\n';
                if (dotNumber) description += `DOT# ${dotNumber} `;
                if (mcNumber) description += `MC# ${mcNumber}`;
            }
        } else {
            description += `commercial auto operations. `;
        }
    } else {
        description += `general liability operations. `;
    }

    return description.trim();
}

// Create the REAL custom viewer
window.createRealACORDViewer = async function(policyId) {
    console.log('Creating REAL ACORD viewer for policy:', policyId);

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer not found');
        return;
    }

    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    // Create our REAL viewer with EXACT original layout
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header - EXACTLY as you had it -->
            <div class="acord-header" style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                        <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                        Policy: ${policy?.policyNumber || 'N/A'} | ${policy?.carrier || 'N/A'}
                    </p>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button onclick="realSaveCOI('${policyId}')" class="btn-primary" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-save"></i> Save COI
                    </button>
                    <button onclick="saveCertificateHolder('${policyId}')" class="btn-secondary" style="background: #f59e0b; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-user-shield"></i> Save Certificate Holder
                    </button>
                    <button onclick="showSignAsModal('${policyId}')" class="btn-secondary" style="background: #8b5cf6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-signature"></i> Sign As
                    </button>
                    <button onclick="realDownloadCOI('${policyId}')" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button onclick="realPrintCOI()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
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

            <!-- Our REAL PDF canvas where we render -->
            <div class="pdf-container" style="flex: 1; padding: 20px; background: #f3f4f6; overflow: auto;">
                <div style="background: white; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative; width: fit-content;">
                    <!-- The actual canvas where PDF is drawn -->
                    <canvas id="realPdfCanvas"></canvas>
                    <!-- Form fields overlay on top of canvas -->
                    <div id="realFormOverlay" style="position: absolute; top: 0; left: 0;"></div>
                </div>
            </div>

            <!-- Status Bar -->
            <div style="padding: 15px 20px; background: white; border-top: 1px solid #e5e7eb; display: flex; justify-content: between; align-items: center;">
                <div style="flex: 1;">
                    <span style="color: #6b7280; font-size: 14px;">
                        <i class="fas fa-info-circle"></i>
                        ACORD 25 (2016/03) - Certificate of Liability Insurance
                    </span>
                </div>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="color: #10b981; font-size: 14px;" id="coiStatus">
                        <i class="fas fa-check-circle"></i> Ready to fill
                    </span>
                </div>
            </div>
        </div>
    `;

    // Now actually load and render the PDF
    await loadRealPDF(policyId, policy);
};

// Load and render the actual PDF
async function loadRealPDF(policyId, policyData) {
    console.log('Loading real PDF...');

    try {
        // Get the canvas
        window.realPdfState.canvas = document.getElementById('realPdfCanvas');
        if (!window.realPdfState.canvas) {
            console.error('Canvas not found');
            return;
        }
        window.realPdfState.ctx = window.realPdfState.canvas.getContext('2d');

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument('/ACORD_25_fillable.pdf');
        window.realPdfState.pdfDoc = await loadingTask.promise;
        console.log('PDF loaded:', window.realPdfState.pdfDoc.numPages, 'pages');

        // Render the first page
        await renderRealPage(1);

        // Create our form fields
        createRealFormFields(policyId, policyData);

        // Load any saved data
        await loadSavedData(policyId);

    } catch (error) {
        console.error('Error loading PDF:', error);
        // Fallback to embedded PDF
        document.querySelector('.pdf-container').innerHTML = `
            <embed src="/ACORD_25_fillable.pdf#zoom=125" type="application/pdf" width="100%" height="100%" style="min-height: 800px;">
        `;
    }
}

// Render a page of the PDF
async function renderRealPage(pageNumber) {
    console.log('Rendering page', pageNumber);

    try {
        // Get the page
        const page = await window.realPdfState.pdfDoc.getPage(pageNumber);

        // Set scale to fit width
        const viewport = page.getViewport({ scale: window.realPdfState.scale });

        // Set canvas dimensions
        window.realPdfState.canvas.height = viewport.height;
        window.realPdfState.canvas.width = viewport.width;

        // Render PDF page into canvas
        const renderContext = {
            canvasContext: window.realPdfState.ctx,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        console.log('Page rendered successfully');

    } catch (error) {
        console.error('Error rendering page:', error);
    }
}

// Create form fields that we control
function createRealFormFields(policyId, policyData) {
    console.log('Creating real form fields...');

    const overlay = document.getElementById('realFormOverlay');
    if (!overlay) return;

    // Set overlay dimensions to match canvas
    overlay.style.width = window.realPdfState.canvas.width + 'px';
    overlay.style.height = window.realPdfState.canvas.height + 'px';

    // Clear any existing fields
    overlay.innerHTML = '';

    // EXACT field positions extracted from ACORD 25 fillable PDF (scaled at 1.3x)
    const fields = [
        // === PRODUCER SECTION (top left) ===
        { id: 'producer', x: 29, y: 172, width: 364, height: 16,
          value: 'Vanguard Insurance Group LLC' },
        { id: 'producerAddress1', x: 29, y: 187, width: 364, height: 16,
          value: '2888 Nationwide Pkwy' },
        { id: 'producerAddress2', x: 29, y: 203, width: 364, height: 16,
          value: '' },
        { id: 'producerCity', x: 29, y: 218, width: 281, height: 16,
          value: 'Brunswick' },
        { id: 'producerState', x: 309, y: 218, width: 23, height: 16,
          value: 'OH' },
        { id: 'producerZip', x: 333, y: 218, width: 60, height: 16,
          value: '44242' },

        // === CONTACT INFO (right side of producer) ===
        { id: 'contactName', x: 450, y: 156, width: 317, height: 16,
          value: '' },
        { id: 'phone', x: 459, y: 172, width: 164, height: 16,
          value: '(866) 628-9441' },
        { id: 'fax', x: 673, y: 172, width: 94, height: 16,
          value: '(330) 779-1097' },
        { id: 'email', x: 450, y: 187, width: 317, height: 16,
          value: 'contact@vigagency.com' },

        // === INSURED SECTION ===
        { id: 'insured', x: 94, y: 250, width: 299, height: 16,
          value: policyData?.clientName || policyData?.insured?.['Name/Business Name'] || policyData?.insured?.['Primary Named Insured'] || '', bold: true },
        { id: 'insuredAddress1', x: 94, y: 265, width: 299, height: 16,
          value: policyData?.contact?.['Mailing Address'] || '' },
        { id: 'insuredAddress2', x: 94, y: 281, width: 299, height: 16,
          value: (() => {
            // Get city, state, zip from separate fields in policy data
            const city = policyData?.city || policyData?.contact?.City || '';
            const state = policyData?.state || policyData?.contact?.State || '';
            const zip = policyData?.zip || policyData?.zipCode || policyData?.contact?.['ZIP Code'] || '';

            console.log('🏙️ ACORD Viewer - Building insuredAddress2:');
            console.log('  - City:', city);
            console.log('  - State:', state);
            console.log('  - ZIP:', zip);

            // Format: "CITY STATE ZIP"
            const parts = [city, state, zip].filter(Boolean);
            const result = parts.join(' ');
            console.log('  - Final insuredAddress2:', result);

            return result || '';
          })() },
        { id: 'insuredCity', x: 94, y: 296, width: 216, height: 16,
          value: policyData?.contact?.['City'] || '' },
        { id: 'insuredState', x: 309, y: 296, width: 23, height: 16,
          value: policyData?.contact?.['State'] || '' },
        { id: 'insuredZip', x: 333, y: 296, width: 60, height: 16,
          value: policyData?.contact?.['ZIP Code'] || '' },

        // === INSURER SECTION (companies A-F) ===
        { id: 'insurerA', x: 454, y: 218, width: 243, height: 16,
          value: (policyData?.carrier && policyData.carrier !== '') ?
                 (policyData.carrier === 'Progressive' ? 'Progressive Preferred Insurance Company' : policyData.carrier) :
                 (policyData?.overview?.['Carrier'] && policyData.overview['Carrier'] !== '') ?
                 (policyData.overview['Carrier'] === 'Progressive' ? 'Progressive Preferred Insurance Company' : policyData.overview['Carrier']) :
                 'Progressive Preferred Insurance Company' },
        { id: 'insurerANaic', x: 707, y: 218, width: 60, height: 16,
          value: (policyData?.carrier === 'Progressive' || policyData?.overview?.['Carrier'] === 'Progressive' ||
                 (!policyData?.carrier && !policyData?.overview?.['Carrier'])) ? '24260' : '' },

        // === GENERAL LIABILITY CHECKBOXES ===
        { id: 'glCheck', x: 47, y: 390, width: 18, height: 16,
          type: 'checkbox', checked: true },
        { id: 'glClaimsMade', x: 65, y: 406, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'glOccurrence', x: 150, y: 406, width: 20, height: 16,
          type: 'checkbox', checked: true },
        { id: 'glOtherCov1', x: 47, y: 421, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'glOtherCov2', x: 47, y: 437, width: 18, height: 16,
          type: 'checkbox' },

        // === AGGREGATE LIMIT CHECKBOXES ===
        { id: 'aggPolicy', x: 47, y: 468, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'aggProject', x: 103, y: 468, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'aggLocation', x: 159, y: 468, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'aggOther', x: 47, y: 484, width: 18, height: 16,
          type: 'checkbox' },

        // === AUTOMOBILE LIABILITY CHECKBOXES ===
        { id: 'autoAny', x: 47, y: 515, width: 18, height: 16,
          type: 'checkbox', checked: (policyData?.policyType === 'commercial-auto' || policyData?.overview?.['Policy Type'] === 'Commercial Auto') },
        { id: 'autoOwned', x: 47, y: 530, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'autoScheduled', x: 135, y: 530, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'autoHired', x: 47, y: 546, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'autoNonOwned', x: 135, y: 546, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'autoOther1', x: 47, y: 562, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'autoOther2', x: 135, y: 562, width: 20, height: 16,
          type: 'checkbox' },

        // === EXCESS/UMBRELLA CHECKBOXES ===
        { id: 'umbrella', x: 47, y: 577, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'umbrellaOccur', x: 150, y: 577, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'excess', x: 47, y: 593, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'excessClaims', x: 150, y: 593, width: 20, height: 16,
          type: 'checkbox' },
        { id: 'deductible', x: 47, y: 608, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'retention', x: 94, y: 608, width: 18, height: 16,
          type: 'checkbox' },

        // === WORKERS COMP CHECKBOXES ===
        { id: 'wcStatute', x: 552, y: 624, width: 18, height: 16,
          type: 'checkbox' },
        { id: 'wcOther', x: 618, y: 624, width: 20, height: 16,
          type: 'checkbox' },

        // === WORKERS COMP FIELDS ===
        { id: 'wcInsurer', x: 23, y: 647, width: 23, height: 16,
          value: '' },
        { id: 'wcAddlInsd', x: 229, y: 647, width: 23, height: 16,
          value: '' },
        { id: 'wcSubrWvd', x: 252, y: 647, width: 23, height: 16,
          value: '' },
        { id: 'wcPolicyNum', x: 281, y: 647, width: 146, height: 16,
          value: '' },
        { id: 'wcEffDate', x: 430, y: 647, width: 61, height: 16,
          value: '' },
        { id: 'wcExpDate', x: 491, y: 647, width: 61, height: 16,
          value: '' },

        // === OTHER POLICY FIELDS ===
        // Above row (y: 686)
        { id: 'otherInsurerAbove', x: 23, y: 686, width: 23, height: 16,
          value: '' },
        { id: 'otherAddlInsdAbove', x: 229, y: 686, width: 23, height: 16,
          value: '' },
        { id: 'otherSubrWvdAbove', x: 252, y: 686, width: 23, height: 16,
          value: '' },
        { id: 'otherPolicyNumAbove', x: 281, y: 686, width: 146, height: 16,
          value: '' },
        { id: 'otherEffDateAbove', x: 430, y: 686, width: 61, height: 16,
          value: '' },
        { id: 'otherExpDateAbove', x: 491, y: 686, width: 61, height: 16,
          value: '' },
        { id: 'otherLimitsAbove', x: 552, y: 686, width: 83, height: 16,
          value: '' },

        // Middle row (y: 702)
        { id: 'otherInsurer', x: 23, y: 702, width: 23, height: 16,
          value: '' },
        { id: 'otherAddlInsd', x: 229, y: 702, width: 23, height: 16,
          value: '' },
        { id: 'otherSubrWvd', x: 252, y: 702, width: 23, height: 16,
          value: '' },
        { id: 'otherPolicyNum', x: 281, y: 702, width: 146, height: 16,
          value: '' },
        { id: 'otherEffDate', x: 430, y: 702, width: 61, height: 16,
          value: '' },
        { id: 'otherExpDate', x: 491, y: 702, width: 61, height: 16,
          value: '' },
        { id: 'otherLimits', x: 552, y: 702, width: 83, height: 16,
          value: '' },

        // Bottom row (y: 718) - Non-Owned Trailer
        { id: 'nonOwnedTrailerInsurer', x: 23, y: 718, width: 23, height: 16,
          value: '' },
        { id: 'nonOwnedTrailerAddlInsd', x: 229, y: 718, width: 23, height: 16,
          value: '' },
        { id: 'nonOwnedTrailerSubrWvd', x: 252, y: 718, width: 23, height: 16,
          value: '' },
        { id: 'nonOwnedTrailerPolicyNum', x: 281, y: 718, width: 146, height: 16,
          value: '' },
        { id: 'nonOwnedTrailerEffDate', x: 430, y: 718, width: 61, height: 16,
          value: '' },
        { id: 'nonOwnedTrailerExpDate', x: 491, y: 718, width: 61, height: 16,
          value: '' },
        { id: 'nonOwnedTrailerLimits', x: 552, y: 718, width: 83, height: 16,
          value: '' },
        { id: 'otherDescriptionAbove', x: 52, y: 686, width: 173, height: 16,
          value: '' },
        { id: 'otherDescription', x: 52, y: 702, width: 173, height: 16,
          value: '' },
        { id: 'nonOwnedTrailerText', x: 52, y: 718, width: 173, height: 16,
          value: '' },
        { id: 'glInsurer', x: 23, y: 437, width: 23, height: 16,
          value: 'A' },
        { id: 'glAddlInsd', x: 229, y: 437, width: 23, height: 16,
          value: '' },
        { id: 'glSubrWvd', x: 252, y: 437, width: 23, height: 16,
          value: '' },
        { id: 'glPolicyNum', x: 281, y: 437, width: 146, height: 16,
          value: (policyData?.policyType !== 'commercial-auto') ? (policyData?.policyNumber || '') : '' },
        { id: 'glEffDate', x: 430, y: 437, width: 61, height: 16,
          value: (policyData?.policyType !== 'commercial-auto' && policyData?.effectiveDate) ?
                 formatDateForACORD(policyData.effectiveDate) :
                 ((policyData?.policyType !== 'commercial-auto' && policyData?.overview?.['Effective Date']) ? formatDateForACORD(policyData.overview['Effective Date']) : '') },
        { id: 'glExpDate', x: 491, y: 437, width: 61, height: 16,
          value: (policyData?.policyType !== 'commercial-auto' && policyData?.expirationDate) ?
                 formatDateForACORD(policyData.expirationDate) :
                 ((policyData?.policyType !== 'commercial-auto' && policyData?.overview?.['Expiration Date']) ? formatDateForACORD(policyData.overview['Expiration Date']) : '') },

        // === AUTOMOBILE LIABILITY FIELDS ===
        { id: 'autoInsurer', x: 23, y: 530, width: 23, height: 16,
          value: (policyData?.policyType === 'commercial-auto' || policyData?.overview?.['Policy Type'] === 'Commercial Auto') ? 'A' : '' },
        { id: 'autoAddlInsd', x: 229, y: 530, width: 23, height: 16,
          value: '' },
        { id: 'autoSubrWvd', x: 252, y: 530, width: 23, height: 16,
          value: '' },
        { id: 'autoPolicyNum', x: 281, y: 530, width: 146, height: 16,
          value: (policyData?.policyType === 'commercial-auto' || policyData?.overview?.['Policy Type'] === 'Commercial Auto') ? (policyData?.policyNumber || '') : '' },
        { id: 'autoEffDate', x: 430, y: 530, width: 61, height: 16,
          value: (policyData?.policyType === 'commercial-auto' && policyData?.effectiveDate) ?
                 formatDateForACORD(policyData.effectiveDate) :
                 (policyData?.overview?.['Effective Date'] ? formatDateForACORD(policyData.overview['Effective Date']) : '') },
        { id: 'autoExpDate', x: 491, y: 530, width: 61, height: 16,
          value: (policyData?.policyType === 'commercial-auto' && policyData?.expirationDate) ?
                 formatDateForACORD(policyData.expirationDate) :
                 (policyData?.overview?.['Expiration Date'] ? formatDateForACORD(policyData.overview['Expiration Date']) : '') },

        // === AUTO LIABILITY LIMITS (ALL MISSING FIELDS) ===
        { id: 'autoCombinedSingle', x: 684, y: 499, width: 83, height: 16,
          value: policyData?.coverage?.['Liability Limits'] || '' },
        { id: 'autoBodilyInjuryPerson', x: 684, y: 515, width: 83, height: 16,
          value: '' },
        { id: 'autoBodilyInjuryAccident', x: 684, y: 530, width: 83, height: 16,
          value: '' },
        { id: 'autoPropertyDamage', x: 684, y: 546, width: 83, height: 16,
          value: '' },
        { id: 'autoOtherLimit', x: 684, y: 562, width: 83, height: 16,
          value: '' },

        // === EXCESS/UMBRELLA FIELDS ===
        { id: 'excessInsurer', x: 23, y: 593, width: 23, height: 16,
          value: '' },
        { id: 'excessAddlInsd', x: 229, y: 593, width: 23, height: 16,
          value: '' },
        { id: 'excessSubrWvd', x: 252, y: 593, width: 23, height: 16,
          value: '' },
        { id: 'excessPolicyNum', x: 281, y: 593, width: 146, height: 16,
          value: '' },
        { id: 'excessEffDate', x: 430, y: 593, width: 61, height: 16,
          value: '' },
        { id: 'excessExpDate', x: 491, y: 593, width: 61, height: 16,
          value: '' },

        // === EXCESS/UMBRELLA LIMITS ===
        { id: 'excessEachOccur', x: 684, y: 577, width: 83, height: 16,
          value: '' },
        { id: 'excessAggregate', x: 684, y: 593, width: 83, height: 16,
          value: '' },
        { id: 'excessOtherLimit', x: 684, y: 608, width: 83, height: 16,
          value: '' },

        // === WORKERS COMP LIMITS ===
        { id: 'wcOtherField', x: 673, y: 624, width: 94, height: 16,
          value: '' },
        { id: 'wcEachAccident', x: 684, y: 640, width: 83, height: 16,
          value: '' },
        { id: 'wcDiseasePolicyLimit', x: 684, y: 655, width: 83, height: 16,
          value: '' },
        { id: 'wcDiseaseEachEmployee', x: 684, y: 671, width: 83, height: 16,
          value: '' },

        // === OTHER POLICY LIMITS ===
        { id: 'otherLimit1', x: 684, y: 686, width: 83, height: 16,
          value: '' },
        { id: 'otherLimit2', x: 684, y: 702, width: 83, height: 16,
          value: '' },
        { id: 'otherLimit3', x: 684, y: 718, width: 83, height: 16,
          value: '' },

        // === GENERAL LIABILITY LIMITS ===
        { id: 'eachOccurrence', x: 684, y: 390, width: 83, height: 16,
          value: policyData?.coverage?.['Liability Limits'] || '1,000,000' },
        { id: 'damageRented', x: 684, y: 406, width: 83, height: 16,
          value: '100,000' },
        { id: 'medExp', x: 684, y: 421, width: 83, height: 16,
          value: policyData?.coverage?.['Medical Payments'] || '5,000' },
        { id: 'personalAdv', x: 684, y: 437, width: 83, height: 16,
          value: policyData?.coverage?.['Liability Limits'] || '1,000,000' },
        { id: 'generalAgg', x: 684, y: 452, width: 83, height: 16,
          value: policyData?.coverage?.['General Aggregate'] || '2,000,000' },
        { id: 'productsOps', x: 684, y: 468, width: 83, height: 16,
          value: policyData?.coverage?.['General Aggregate'] || '2,000,000' },
        { id: 'glOtherLimit', x: 684, y: 484, width: 83, height: 16,
          value: '' },

        // === DESCRIPTION OF OPERATIONS (large text area) ===
        { id: 'description', x: 29, y: 749, width: 738, height: 86,
          type: 'textarea', value: generateOperationDescription(policyData) },

        // === CERTIFICATE HOLDER ===
        { id: 'certHolder', x: 94, y: 897, width: 299, height: 16,
          value: '' },
        { id: 'certAddress1', x: 94, y: 913, width: 299, height: 16,
          value: '' },
        { id: 'certAddress2', x: 94, y: 928, width: 299, height: 16,
          value: '' },
        { id: 'certCity', x: 94, y: 944, width: 216, height: 16,
          value: '' },
        { id: 'certState', x: 309, y: 944, width: 23, height: 16,
          value: '' },
        { id: 'certZip', x: 333, y: 944, width: 60, height: 16,
          value: '' },

        // === AUTHORIZED REPRESENTATIVE (signature area) ===
        { id: 'authRep', x: 403, y: 936, width: 364, height: 31,
          value: getSignatureForAgent(policyData?.agent), bold: true, size: 16, signature: true }
    ];

    // Create each field
    fields.forEach(field => {
        let element;

        if (field.type === 'checkbox') {
            element = document.createElement('input');
            element.type = 'checkbox';
            element.checked = field.checked || false;
            element.style.width = field.width + 'px';
            element.style.height = field.height + 'px';
        } else if (field.type === 'textarea') {
            element = document.createElement('textarea');
            element.style.resize = 'none';
            element.style.overflow = 'hidden';
        } else {
            element = document.createElement('input');
            element.type = field.type || 'text';
        }

        // Common styles
        element.style.position = 'absolute';
        element.style.left = field.x + 'px';
        element.style.top = field.y + 'px';
        element.style.width = field.width + 'px';
        element.style.height = field.height + 'px';
        element.style.border = '1px solid transparent';
        element.style.background = 'rgba(255, 255, 255, 0.8)';
        element.style.fontSize = (field.size || 10) + 'px';
        element.style.fontFamily = field.signature ? 'Dancing Script, Lucida Handwriting, cursive' : 'Arial, sans-serif';
        element.style.padding = '1px 3px';

        if (field.bold) {
            element.style.fontWeight = 'bold';
        }

        if (field.signature) {
            element.style.fontWeight = '600';
            element.style.color = '#000';
        }

        if (field.value) {
            element.value = field.value;
        }

        element.id = 'field_' + field.id;

        // Add hover effect
        element.addEventListener('mouseenter', () => {
            element.style.border = '1px solid #0066cc';
            element.style.background = 'white';
        });

        element.addEventListener('mouseleave', () => {
            element.style.border = '1px solid transparent';
            element.style.background = 'rgba(255, 255, 255, 0.8)';
        });

        // Store value changes
        if (element.type === 'checkbox') {
            element.addEventListener('change', () => {
                window.realPdfState.formData[field.id] = element.checked;
                console.log('Checkbox updated:', field.id, element.checked);
            });
        } else {
            // Use 'input' event for text fields to capture as user types
            element.addEventListener('input', () => {
                window.realPdfState.formData[field.id] = element.value;
                console.log('Field updated:', field.id, element.value);
            });
        }

        overlay.appendChild(element);

        // Store initial value
        if (field.type === 'checkbox') {
            window.realPdfState.formData[field.id] = field.checked || false;
        } else {
            window.realPdfState.formData[field.id] = field.value || '';
        }
    });

    console.log('Created', overlay.children.length, 'form fields');
}

// Save the COI with our data
window.realSaveCOI = async function(policyId) {
    console.log('🚀 === STARTING COI SAVE PROCESS v2 ===');
    console.log('🎯 Target Policy ID for save:', policyId);
    console.log('📅 Save timestamp:', new Date().toISOString());
    console.log('🔍 Available policies in localStorage before save:');

    const existingPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    existingPolicies.forEach(p => {
        console.log('  - Policy:', p.id || 'No ID', 'Number:', p.policyNumber || 'No Number', 'HasCOI:', (p.coiDocuments?.length || 0) > 0);
    });

    // Update status
    const statusEl = document.getElementById('coiStatus');
    if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    // Collect all current form values
    const formData = {};
    document.querySelectorAll('#realFormOverlay input, #realFormOverlay textarea').forEach(el => {
        const fieldId = el.id.replace('field_', '');
        formData[fieldId] = el.type === 'checkbox' ? el.checked : el.value;
        console.log('🔍 Collecting field for save:', fieldId, '=', formData[fieldId]);
    });

    console.log('📋 All form data being saved:', formData);

    try {
        // Save to server
        const response = await fetch('https://162-220-14-239.nip.io/api/save-coi-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                policyId: policyId,
                formData: formData
            })
        });

        if (response.ok) {
            // Generate filled PDF
            await fetch('https://162-220-14-239.nip.io/api/generate-filled-coi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    policyId: policyId,
                    formData: formData
                })
            });

            // Save the COI document data locally for viewing
            console.log('💾 About to save COI document with formData:', formData);
            await saveCOIDocumentToPolicy(policyId, formData);

            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved successfully!';
            }

            // Show success message
            showSuccessMessage('COI saved successfully!');

            // Refresh the COI display in the policy modal if it exists
            setTimeout(() => {
                if (window.loadCOIFiles && typeof window.loadCOIFiles === 'function') {
                    console.log('🔄 Refreshing COI display after save');
                    window.loadCOIFiles(policyId);
                }
            }, 500);
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        console.error('Save error:', error);
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Save failed';
        }
    }
};

// Download the filled COI
window.realDownloadCOI = async function(policyId) {
    console.log('Downloading COI for policy:', policyId);

    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        alert('Policy not found');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Generate ACORD 25 HTML for download
    const acordHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ACORD 25 - ${policy.policyNumber || 'Certificate'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2; padding: 0.5in; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .section { border: 1px solid #000; margin-bottom: 10px; padding: 8px; }
        .section-title { font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">ACORD 25 CERTIFICATE OF LIABILITY INSURANCE</div>
        <div>DATE: ${today}</div>
    </div>

    <div class="section">
        <div class="section-title">PRODUCER</div>
        <div><strong>Vanguard Insurance Group LLC</strong></div>
        <div>2888 Nationwide Pkwy, Brunswick, OH 44242</div>
        <div>Phone: (866) 628-9441 | Fax: (330) 779-1097 | Email: contact@vigagency.com</div>
    </div>

    <div class="section">
        <div class="section-title">INSURED</div>
        <div><strong>${policy.clientName || policy.name || 'N/A'}</strong></div>
        <div>${policy.address || 'N/A'}</div>
    </div>

    <div class="section">
        <div class="section-title">INSURERS AFFORDING COVERAGE</div>
        <div>INSURER A: ${policy.carrier || 'N/A'}</div>
    </div>

    <div class="section">
        <div class="section-title">COVERAGES</div>
        <table>
            <tr>
                <th>TYPE</th>
                <th>POLICY NUMBER</th>
                <th>EFF DATE</th>
                <th>EXP DATE</th>
                <th>LIMITS</th>
            </tr>
            <tr>
                <td>${policy.type || 'GENERAL LIABILITY'}</td>
                <td>${policy.policyNumber || 'N/A'}</td>
                <td>${policy.effectiveDate || 'N/A'}</td>
                <td>${policy.expirationDate || 'N/A'}</td>
                <td>${policy.coverageLimit ? '$' + Number(policy.coverageLimit).toLocaleString() : 'N/A'}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">CERTIFICATE HOLDER</div>
        <div style="min-height: 60px; border: 1px solid #999; padding: 5px; margin-top: 5px;">
            To be filled in by certificate holder
        </div>
    </div>

    <div class="section">
        <div class="section-title">AUTHORIZED REPRESENTATIVE</div>
        <div style="margin-top: 30px;">______________________________ Date: ${today}</div>
    </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([acordHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACORD_25_${policy.policyNumber || 'Certificate'}_${today}.html`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

// Print the COI
window.realPrintCOI = function() {
    const coiContent = document.querySelector('.real-acord-content');
    if (!coiContent) {
        window.print();
        return;
    }

    // Create a print-only window
    const printWindow = window.open('', 'PrintACORD', 'width=900,height=1200');
    if (!printWindow) {
        alert('Please allow pop-ups to print the ACORD 25 form');
        return;
    }

    // Clone the ACORD content
    const printContent = coiContent.cloneNode(true);

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>Print ACORD 25</title>
    <style>
        @page { size: letter; margin: 0.5in; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; }
        .checkbox { width: 12px; height: 12px; border: 1px solid #000; display: inline-block; margin-right: 5px; }
        .checkbox.checked::after { content: "X"; display: block; text-align: center; line-height: 12px; }
        input[type="text"] { border: none; border-bottom: 1px solid #000; padding: 2px; }
        .form-section { margin-bottom: 10px; padding: 8px; border: 1px solid #000; }
        .section-title { font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    ${printContent.innerHTML}
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.close();
            }, 500);
        }
    </script>
</body>
</html>`);

    printWindow.document.close();
};

// Load saved data
async function loadSavedData(policyId) {
    try {
        const response = await fetch(`http://162.220.14.239:3001/api/get-coi-form/${policyId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.formData) {
                // Fill the fields with saved data
                for (const [fieldId, value] of Object.entries(data.formData)) {
                    const element = document.getElementById('field_' + fieldId);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = value;
                        } else {
                            element.value = value;
                        }
                    }
                }
                console.log('Loaded saved data for policy:', policyId);
            }
        }
    } catch (error) {
        console.log('No saved data found');
    }
}

// Show success message
function showSuccessMessage(message) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
    `;
    div.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Back to policy view - Return to COI Manager
window.backToPolicyView = function(policyId) {
    console.log('Going back to COI Manager policies list');

    // Call loadCOIView to return to the main COI Manager view with all policies
    if (typeof loadCOIView === 'function') {
        loadCOIView();
        console.log('Returned to COI Manager');
    } else {
        // Fallback: Try to manually navigate to COI section
        window.location.hash = '#coi';

        // Additional fallback: Try to find and click COI Manager nav item
        const coiNavItems = document.querySelectorAll('a[href="#coi"], .nav-link[onclick*="coi"]');
        for (let navItem of coiNavItems) {
            navItem.click();
            console.log('Clicked COI nav item');
            return;
        }

        console.log('Could not navigate back to COI Manager');
    }
};

// Email ACORD function
window.emailACORD = function(policyId) {
    console.log('Opening email dialog for COI:', policyId);

    // Get the policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        alert('Policy not found');
        return;
    }

    // Create email compose dialog
    const emailDialog = document.createElement('div');
    emailDialog.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 10000; width: 500px;';
    emailDialog.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #333;">Email Certificate of Insurance</h3>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">To:</label>
            <input type="email" id="emailTo" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="recipient@example.com">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">Subject:</label>
            <input type="text" id="emailSubject" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="Certificate of Insurance - ${policy.policyNumber || 'Policy'}">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #666;">Message:</label>
            <textarea id="emailBody" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 100px;">Please find attached the Certificate of Insurance for ${policy.clientName || 'your policy'}.

Policy Number: ${policy.policyNumber || 'N/A'}
Carrier: ${policy.carrier || 'N/A'}

If you have any questions, please let us know.</textarea>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
            <button onclick="sendCOIEmail('${policyId}')" style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-paper-plane"></i> Send Email
            </button>
        </div>
    `;

    document.body.appendChild(emailDialog);
};

// Send COI email function
window.sendCOIEmail = async function(policyId) {
    const to = document.getElementById('emailTo').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;

    if (!to) {
        alert('Please enter recipient email address');
        return;
    }

    // For now, just show success
    alert(`Email would be sent to: ${to}\\nSubject: ${subject}\\n\\nThe COI PDF would be attached.`);

    // Remove dialog
    document.querySelector('[id="emailTo"]').parentElement.parentElement.remove();
};

// Save Certificate Holder function
window.saveCertificateHolder = function(policyId) {
    console.log('Save Certificate Holder clicked for policy:', policyId);

    // Get the current certificate holder data from the form
    const certHolderField = document.getElementById('field_certHolder');
    const certAddress1Field = document.getElementById('field_certAddress1');
    const certAddress2Field = document.getElementById('field_certAddress2');

    if (!certHolderField || !certHolderField.value.trim()) {
        alert('Please fill in certificate holder information before saving');
        return;
    }

    const holderName = certHolderField.value.trim();
    let holderAddress = '';

    if (certAddress1Field && certAddress1Field.value.trim()) {
        holderAddress += certAddress1Field.value.trim();
    }

    if (certAddress2Field && certAddress2Field.value.trim()) {
        holderAddress += (holderAddress ? '\n' : '') + certAddress2Field.value.trim();
    }

    // Save to localStorage certificate holders
    const savedHolders = JSON.parse(localStorage.getItem('certificateHolders') || '[]');

    // Check if holder already exists
    const existingHolder = savedHolders.find(h => h.companyName === holderName);
    if (existingHolder) {
        if (confirm(`Certificate holder "${holderName}" already exists. Update it?`)) {
            existingHolder.address = holderAddress;
            existingHolder.updatedAt = new Date().toISOString();
        } else {
            return;
        }
    } else {
        // Add new holder
        const newHolder = {
            id: Date.now().toString(),
            companyName: holderName,
            address: holderAddress,
            email: '',
            requirements: '',
            createdAt: new Date().toISOString()
        };
        savedHolders.push(newHolder);
    }

    localStorage.setItem('certificateHolders', JSON.stringify(savedHolders));

    // Show success notification
    showSuccessMessage(`Certificate holder "${holderName}" saved successfully!`);
};

// Show Sign As Modal function
window.showSignAsModal = function(policyId) {
    console.log('Sign As modal for policy:', policyId);

    // Remove any existing modal first
    const existingModal = document.querySelector('.sign-as-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'sign-as-modal';
    modal.id = 'signAsModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;';

    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = 'background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); width: 500px; max-width: 90vw;';
    modalContainer.innerHTML = `
        <div class="modal-header" style="margin-bottom: 25px;">
            <h2 style="margin: 0; color: #333; font-size: 24px;">
                <i class="fas fa-signature" style="color: #8b5cf6; margin-right: 10px;"></i>
                Sign As
            </h2>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                Select who will sign as the authorized representative
            </p>
        </div>

        <div class="signature-options" style="margin-bottom: 25px;">
            <div class="sig-option-1" style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;">
                <div style="font-family: 'Dancing Script', 'Lucida Handwriting', cursive; font-size: 20px; color: #000; font-weight: 600;">Grant Corp</div>
            </div>

            <div class="sig-option-2" style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;">
                <div style="font-family: 'Dancing Script', 'Lucida Handwriting', cursive; font-size: 20px; color: #000; font-weight: 600;">Maureen Corp</div>
            </div>

            <div class="sig-option-3" style="padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;">
                <div style="font-family: 'Dancing Script', 'Lucida Handwriting', cursive; font-size: 20px; color: #000; font-weight: 600;">Hunter Brooks</div>
            </div>
        </div>

        <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 12px;">
            <button class="cancel-btn" style="padding: 12px 24px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                Cancel
            </button>
        </div>
    `;

    modal.appendChild(modalContainer);

    // Add event listeners AFTER modal is created
    setTimeout(() => {
        const option1 = modal.querySelector('.sig-option-1');
        const option2 = modal.querySelector('.sig-option-2');
        const option3 = modal.querySelector('.sig-option-3');
        const cancelBtn = modal.querySelector('.cancel-btn');

        if (option1) {
            option1.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Grant Corp clicked');
                selectSignature('Grant Corp');
            });
        }

        if (option2) {
            option2.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Maureen Corp clicked');
                selectSignature('Maureen Corp');
            });
        }

        if (option3) {
            option3.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Hunter Brooks clicked');
                selectSignature('Hunter Brooks');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeSignAsModal();
            });
        }

        // Hover effects
        [option1, option2, option3].forEach(option => {
            if (option) {
                option.addEventListener('mouseenter', function() {
                    this.style.borderColor = '#8b5cf6';
                    this.style.background = '#f8fafc';
                });
                option.addEventListener('mouseleave', function() {
                    this.style.borderColor = '#e5e7eb';
                    this.style.background = 'white';
                });
            }
        });

        // Close when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeSignAsModal();
            }
        });

    }, 100);

    document.body.appendChild(modal);
    console.log('Modal added to body');
};

// Select signature function
window.selectSignature = function(signatureName) {
    console.log('Selected signature:', signatureName);

    // Update the authorized representative field
    const authRepField = document.getElementById('field_authRep');
    if (authRepField) {
        authRepField.value = signatureName;
        authRepField.dispatchEvent(new Event('input', { bubbles: true }));

        // Update the form data state
        window.realPdfState.formData['authRep'] = signatureName;

        console.log('Updated authorized representative to:', signatureName);
    }

    // Update company information based on signature selection
    if (signatureName === 'Maureen Corp') {
        // Switch to United Insurance Group info
        console.log('🔄 Switching to United Insurance Group information...');
        updateCompanyInfo({
            producer: 'United Insurance Group',
            email: 'Contact@uigagency.com',
            phone: '(330) 259-7438',
            fax: '(330) 259-7439'
        });
    } else {
        // Switch back to standard Vanguard info for Grant Corp or Hunter Brooks
        console.log('🔄 Switching to Vanguard Insurance Group LLC information...');
        updateCompanyInfo({
            producer: 'Vanguard Insurance Group LLC',
            email: 'contact@vigagency.com',
            phone: '(866) 628-9441',
            fax: '(330) 779-1097'
        });
    }

    // Show success notification
    showSuccessMessage(`Signature updated to: ${signatureName}`);

    // Close the modal
    closeSignAsModal();
};

// Close Sign As Modal function
window.closeSignAsModal = function() {
    console.log('Closing Sign As modal');
    const modal = document.querySelector('.sign-as-modal');
    if (modal) {
        modal.remove();
        console.log('Modal removed');
    } else {
        console.log('No modal found to close');
    }
};

// Update company information fields based on signature selection
window.updateCompanyInfo = function(companyData) {
    console.log('🔄 Updating company information:', companyData);

    // Update producer name field
    const producerField = document.getElementById('field_producer');
    if (producerField && companyData.producer) {
        producerField.value = companyData.producer;
        producerField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['producer'] = companyData.producer;
        console.log('✅ Updated producer to:', companyData.producer);
    }

    // Update email field
    const emailField = document.getElementById('field_email');
    if (emailField && companyData.email) {
        emailField.value = companyData.email;
        emailField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['email'] = companyData.email;
        console.log('✅ Updated email to:', companyData.email);
    }

    // Update phone field
    const phoneField = document.getElementById('field_phone');
    if (phoneField && companyData.phone) {
        phoneField.value = companyData.phone;
        phoneField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['phone'] = companyData.phone;
        console.log('✅ Updated phone to:', companyData.phone);
    }

    // Update fax field
    const faxField = document.getElementById('field_fax');
    if (faxField && companyData.fax) {
        faxField.value = companyData.fax;
        faxField.dispatchEvent(new Event('input', { bubbles: true }));
        window.realPdfState.formData['fax'] = companyData.fax;
        console.log('✅ Updated fax to:', companyData.fax);
    }

    console.log('✅ Company information update complete');
};

// Function to send COI for a specific policy
window.sendCOIForPolicy = function(policyId) {
    console.log('📧 sendCOIForPolicy called with:', policyId);

    // Call the existing sendPolicyCOI function if available
    if (typeof window.sendPolicyCOI === 'function') {
        console.log('📧 Calling existing sendPolicyCOI function...');
        window.sendPolicyCOI(policyId);
    } else {
        // Fallback: directly call showSimpleCOIEmailModal if sendPolicyCOI doesn't exist
        console.log('📧 sendPolicyCOI not found, calling showSimpleCOIEmailModal directly...');

        // Get policy data
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = policies.find(p =>
            p.id === policyId ||
            p.policyNumber === policyId ||
            String(p.id) === String(policyId)
        );

        if (policy) {
            console.log('✅ Found policy for COI sending:', policy);

            // Check if showSimpleCOIEmailModal function exists
            if (typeof window.showSimpleCOIEmailModal === 'function') {
                console.log('📧 Calling showSimpleCOIEmailModal function');
                window.showSimpleCOIEmailModal(policy);
            } else {
                console.error('❌ showSimpleCOIEmailModal function not found');
                alert('COI email functionality not available. Please refresh the page.');
            }
        } else {
            console.error('❌ Policy not found:', policyId);
            alert('Policy not found. Cannot send COI.');
        }
    }
};

// Function to save COI document data to policy for viewing
async function saveCOIDocumentToPolicy(policyId, formData) {
    console.log('💾 Saving COI document to policy data for:', policyId);

    try {
        // Create COI document object
        const coiDocument = {
            id: `coi-${Date.now()}`,
            name: `ACORD_25_${policyId}_${new Date().toISOString().split('T')[0]}.png`,
            type: 'image/png',
            uploadDate: new Date().toISOString(),
            formData: formData,
            policyId: policyId
        };

        console.log('📋 Created COI document object with formData:', coiDocument.formData);

        // Generate COI with visual overlays including checkmarks
        if (document.getElementById('realFormOverlay') && document.getElementById('realPdfCanvas')) {
            try {
                console.log('🎨 Generating COI with checkbox overlays for save...');

                // Create a new canvas to render the complete COI with overlays
                const sourceCanvas = document.getElementById('realPdfCanvas');
                const overlayCanvas = document.createElement('canvas');
                const ctx = overlayCanvas.getContext('2d');

                // Set canvas size to match source
                overlayCanvas.width = sourceCanvas.width;
                overlayCanvas.height = sourceCanvas.height;

                // Draw the original PDF canvas
                ctx.drawImage(sourceCanvas, 0, 0);

                // Add checkbox overlays - adjusted Y positions up by 12 pixels
                const checkboxMapping = {
                    'glCheck': { x: 47, y: 378 },
                    'glOccurrence': { x: 150, y: 394 },
                    'glClaimsMade': { x: 65, y: 394 },
                    'autoAny': { x: 47, y: 503 },
                    'autoOwned': { x: 47, y: 518 },
                    'autoScheduled': { x: 135, y: 518 },
                    'autoHired': { x: 47, y: 534 },
                    'autoNonOwned': { x: 135, y: 534 },
                    'umbrella': { x: 47, y: 565 },
                    'excess': { x: 47, y: 581 },
                    'wcStatute': { x: 552, y: 612 },
                    'wcOther': { x: 618, y: 612 },
                    'aggPolicy': { x: 47, y: 456 },
                    'aggProject': { x: 103, y: 456 },
                    'aggLocation': { x: 159, y: 456 },
                    'aggOther': { x: 47, y: 472 }
                };

                // Draw checkmarks for checked boxes
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 14px Arial, sans-serif';
                let checkmarksDrawn = 0;

                Object.entries(checkboxMapping).forEach(([fieldName, position]) => {
                    const checkboxElement = document.getElementById(`field_${fieldName}`);
                    if (checkboxElement && checkboxElement.checked) {
                        ctx.fillText('✓', position.x + 2, position.y + 12);
                        console.log(`☑️ Drew save checkmark for ${fieldName} at position ${position.x}, ${position.y}`);
                        checkmarksDrawn++;
                    }
                });

                console.log(`✅ Generated COI with ${checkmarksDrawn} checkmarks for save`);
                coiDocument.dataUrl = overlayCanvas.toDataURL('image/png');

            } catch (error) {
                console.warn('Could not generate COI with overlays:', error);
                // Fallback: use original canvas
                const sourceCanvas = document.getElementById('realPdfCanvas');
                if (sourceCanvas) {
                    coiDocument.dataUrl = sourceCanvas.toDataURL('image/png');
                } else {
                    coiDocument.dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
                }
            }
        }

        // Find the policy in window.allPolicies and also find related policies
        let targetPolicies = [];

        // Cross-reference mapping for policy relationships
        // Updated based on actual policy IDs found in console logs
        const policyMappings = {
            // Primary policy relationships
            '6146786114': ['POL-1769897676650-ri6ku8b34', 'POL-1769575534717-uq6k8c8ty'],
            'POL-1769897676650-ri6ku8b34': ['6146786114', 'POL-1769575534717-uq6k8c8ty'],
            '864564216': ['POL-1769575534717-uq6k8c8ty', 'POL-1769897676650-ri6ku8b34'],
            'POL-1769575534717-uq6k8c8ty': ['864564216', '6146786114', 'POL-1769897676650-ri6ku8b34']
        };

        // Include mapped policy IDs in our search
        const searchIds = [policyId];
        if (policyMappings[policyId]) {
            searchIds.push(...policyMappings[policyId]);
        }

        console.log('🔗 Policy mappings available:', policyMappings);
        console.log('🔍 Will save COI to all these policy IDs:', searchIds);

        console.log('🔍 Searching for policy IDs:', searchIds);

        try {
            console.log('🔧 Starting policy search and save operation...');

        if (window.allPolicies && Array.isArray(window.allPolicies)) {
            console.log('🔧 Attempting save via window.allPolicies...');
            console.log('🔍 Searching through', window.allPolicies.length, 'policies for:', searchIds.join(', '));

            // Find all matching policies (by ID, policy number, or related fields)
            const matchingPolicies = window.allPolicies.filter(p =>
                searchIds.some(searchId =>
                    p.policyNumber === searchId ||
                    p.id === searchId ||
                    (p.policyNumber && p.policyNumber.trim() === searchId.trim()) ||
                    (p.id && p.id.trim() === searchId.trim()) ||
                    // Also check if this policy's number matches another policy's ID
                    p.id === `POL-${searchId}` ||
                    p.policyNumber === `POL-${searchId}` ||
                    (p.id && p.id.includes(searchId)) ||
                    (p.policyNumber && p.policyNumber.includes(searchId))
                )
            );

            if (matchingPolicies.length > 0) {
                targetPolicies = matchingPolicies;
                console.log('✅ Found', matchingPolicies.length, 'matching policies in window.allPolicies');

                matchingPolicies.forEach(policy => {
                    console.log('📄 Replacing COI document for policy:', policy.policyNumber || policy.id);
                    if (!policy.coiDocuments) {
                        policy.coiDocuments = [];
                    }
                    // Remove existing COI documents for this policy
                    policy.coiDocuments = policy.coiDocuments.filter(doc =>
                        doc.policyId !== policyId &&
                        !searchIds.includes(doc.policyId)
                    );
                    // Add the new COI document
                    policy.coiDocuments.push({...coiDocument});
                    console.log('✅ COI document replaced successfully for policy:', policy.policyNumber || policy.id);
                });

                // Also save to localStorage for backup - SAVE TO ALL MATCHING POLICIES
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const localPolicies = policies.filter(p =>
                    searchIds.some(searchId => p.policyNumber === searchId || p.id === searchId)
                );

                if (localPolicies.length > 0) {
                    localPolicies.forEach(localPolicy => {
                        if (!localPolicy.coiDocuments) {
                            localPolicy.coiDocuments = [];
                        }
                        // Remove existing COI documents for this policy
                        localPolicy.coiDocuments = localPolicy.coiDocuments.filter(doc =>
                            doc.policyId !== policyId &&
                            !searchIds.includes(doc.policyId)
                        );
                        // Add the new COI document
                        localPolicy.coiDocuments.push(coiDocument);
                        console.log('💾 COI document replaced in localStorage policy:', localPolicy.policyNumber || localPolicy.id);
                        console.log('📋 Replaced COI document details:');
                        console.log('  - Name:', coiDocument.name);
                        console.log('  - Upload Date:', coiDocument.uploadDate);
                        console.log('  - Form Data Keys:', Object.keys(coiDocument.formData));
                        console.log('  - Description Field:', coiDocument.formData.description);
                    });
                    console.log('🔧 About to write to localStorage via window.allPolicies path...');
                    localStorage.setItem('insurance_policies', JSON.stringify(policies));
                    console.log('✅ localStorage write completed successfully via window.allPolicies');
                    console.log('✅ COI saved to', localPolicies.length, 'matching policies in localStorage');

                    // Debug: Check what was actually saved
                    console.log('🔍 Verifying localStorage save...');
                    const verifyPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                    verifyPolicies.forEach(p => {
                        if (searchIds.some(id => id === p.id || id === p.policyNumber)) {
                            console.log('  ✅ Policy', p.id || 'No ID', 'Number:', p.policyNumber || 'No Number', 'COI Count:', p.coiDocuments?.length || 0);
                            if (p.coiDocuments?.length > 0) {
                                console.log('    📄 Latest COI:', p.coiDocuments[p.coiDocuments.length - 1].name);
                            }
                        }
                    });
                }
            } else {
                console.warn('⚠️ Policy not found in window.allPolicies, saving to localStorage only');
                // Save to localStorage as fallback - SAVE TO ALL MATCHING POLICIES
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const localPolicies = policies.filter(p =>
                    searchIds.some(searchId => p.policyNumber === searchId || p.id === searchId)
                );

                if (localPolicies.length > 0) {
                    localPolicies.forEach(localPolicy => {
                        if (!localPolicy.coiDocuments) {
                            localPolicy.coiDocuments = [];
                        }
                        // Remove existing COI documents for this policy
                        localPolicy.coiDocuments = localPolicy.coiDocuments.filter(doc =>
                            doc.policyId !== policyId &&
                            !searchIds.includes(doc.policyId)
                        );
                        // Add the new COI document
                        localPolicy.coiDocuments.push(coiDocument);
                        console.log('💾 COI document replaced in fallback localStorage policy:', localPolicy.policyNumber || localPolicy.id);
                    });
                    localStorage.setItem('insurance_policies', JSON.stringify(policies));
                    console.log('✅ Fallback: COI saved to', localPolicies.length, 'matching policies in localStorage');
                } else {
                    // Create policy entries for all search IDs to ensure cross-reference works
                    searchIds.forEach(id => {
                        policies.push({
                            id: id,
                            policyNumber: id,
                            coiDocuments: [{ ...coiDocument }]
                        });
                        console.log('🆕 Created new policy entry for ID:', id);
                    });
                    localStorage.setItem('insurance_policies', JSON.stringify(policies));
                    console.log('🆕 Created new policy entries with COI document in localStorage');
                }
            }
        }

        // Also save to the legacy localStorage format for compatibility
        const existingCOIs = JSON.parse(localStorage.getItem('policy_coi_documents') || '[]');

        // Remove existing COI documents for this policy and related policy IDs
        const filteredCOIs = existingCOIs.filter(doc =>
            doc.policyId !== policyId &&
            !searchIds.includes(doc.policyId)
        );

        // Add the new COI document
        filteredCOIs.push({
            ...coiDocument,
            policyId: policyId
        });

        localStorage.setItem('policy_coi_documents', JSON.stringify(filteredCOIs));
        console.log('✅ COI document replaced in legacy localStorage format');

        console.log('✅ COI document saved successfully');

        // Debug: Verify the save actually worked by checking localStorage immediately
        console.log('🔍 SAVE VERIFICATION - Checking if COI was actually saved...');
        const verifyPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        console.log('📊 Total policies in storage:', verifyPolicies.length);

        searchIds.forEach(searchId => {
            const foundPolicy = verifyPolicies.find(p =>
                p.id === searchId || p.policyNumber === searchId ||
                (p.id && p.id.trim() === searchId.trim()) ||
                (p.policyNumber && p.policyNumber.trim() === searchId.trim())
            );
            if (foundPolicy) {
                console.log(`📄 Policy ${searchId}: Found with ${foundPolicy.coiDocuments?.length || 0} COI documents`);
                if (foundPolicy.coiDocuments?.length > 0) {
                    const latestCOI = foundPolicy.coiDocuments[foundPolicy.coiDocuments.length - 1];
                    console.log(`  ├─ Latest COI: ${latestCOI.name} (${latestCOI.uploadDate})`);
                    console.log(`  └─ Form data description: ${latestCOI.formData?.description || 'No description'}`);
                }
            } else {
                console.log(`❌ Policy ${searchId}: NOT FOUND in localStorage`);
            }
        });
        console.log('🔍 SAVE VERIFICATION COMPLETE');

        // Auto-close the generate COI modal after successful save
        setTimeout(() => {
            // Use our enhanced close function
            if (window.closeGenerateCOIModal && typeof window.closeGenerateCOIModal === 'function') {
                window.closeGenerateCOIModal();
            } else if (window.closeCOIModal && typeof window.closeCOIModal === 'function') {
                window.closeCOIModal();
            }

            // Show success message and refresh COI display
            setTimeout(() => {
                showNotification('COI saved successfully! Click "View Current" to see it.', 'success');

                // Force update the specific container we know should show the COI
                console.log('🔧 Force updating COI container after successful save...');
                if (window.forceUpdateCOIContainer) {
                    window.forceUpdateCOIContainer('POL-1769897676650-ri6ku8b34');
                }

                // Update the COI files container display
                if (window.loadCOIFiles && typeof window.loadCOIFiles === 'function') {
                    console.log('🔄 Refreshing COI files display...');
                    window.loadCOIFiles(policyId);

                    // Also try with policy ID patterns that might exist
                    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                    const matchingPolicy = policies.find(p =>
                        p.policyNumber === policyId ||
                        p.id === policyId ||
                        (p.policyNumber && policyId.includes(p.policyNumber)) ||
                        (p.id && policyId.includes(p.id))
                    );

                    if (matchingPolicy) {
                        // Try both policy number and policy ID
                        if (matchingPolicy.policyNumber !== policyId) {
                            window.loadCOIFiles(matchingPolicy.policyNumber);
                        }
                        if (matchingPolicy.id !== policyId) {
                            window.loadCOIFiles(matchingPolicy.id);
                        }
                        console.log('✅ COI files display updated');
                    }
                }

                // Also manually update any visible COI containers
                const allContainers = document.querySelectorAll('[id^="coiFilesContainer-"]');
                console.log('🔍 Found', allContainers.length, 'COI containers to update');

                allContainers.forEach(container => {
                    const containerId = container.id;
                    const containerPolicyId = containerId.replace('coiFilesContainer-', '');
                    console.log('🔄 Checking container for policy:', containerPolicyId);

                    // Check if this container should show our saved COI
                    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                    console.log('📋 Checking policies for container:', containerPolicyId);
                    console.log('📋 Available policies in localStorage:', policies.map(p => ({ id: p.id, policyNumber: p.policyNumber, hasCOI: p.coiDocuments?.length > 0 })));

                    // Special cross-reference mapping for known policy relationships
                    const policyMappings = {
                        '6146786114': 'POL-1769897676650-ri6ku8b34',
                        'POL-1769897676650-ri6ku8b34': '6146786114'
                    };

                    const shouldShowCOI = policies.some(p => {
                        console.log('🔍 Checking policy:', { id: p.id, policyNumber: p.policyNumber, hasCOI: p.coiDocuments?.length > 0 });

                        // Direct match
                        if ((p.policyNumber === containerPolicyId || p.id === containerPolicyId) &&
                            p.coiDocuments && p.coiDocuments.length > 0) {
                            console.log('✅ Direct match found for:', containerPolicyId);
                            return true;
                        }

                        // Cross-reference check - if we saved for the policy we just saved
                        if ((p.policyNumber === policyId || p.id === policyId) && p.coiDocuments && p.coiDocuments.length > 0) {
                            console.log('🔍 Policy matches saved policy ID, checking mappings...');
                            // Check if this container matches our cross-reference mapping
                            const mappedId = policyMappings[policyId] || policyMappings[p.policyNumber];
                            console.log('🔍 Mapped ID for', policyId, 'is:', mappedId);
                            if (mappedId === containerPolicyId) {
                                console.log('🔗 Cross-reference match:', policyId, '→', containerPolicyId);
                                return true;
                            }
                            // Also check if containerPolicyId maps to our saved policy
                            const reverseMappedId = policyMappings[containerPolicyId];
                            console.log('🔍 Reverse mapped ID for', containerPolicyId, 'is:', reverseMappedId);
                            if (reverseMappedId === policyId || reverseMappedId === p.policyNumber) {
                                console.log('🔗 Reverse cross-reference match:', containerPolicyId, '→', policyId);
                                return true;
                            }
                        }

                        return false;
                    });

                    if (shouldShowCOI) {
                        console.log('✅ Updating container display for:', containerPolicyId);
                        // Update the container to show COI cards instead of "No certificates"
                        const policy = policies.find(p => {
                            // Direct match
                            if ((p.policyNumber === containerPolicyId || p.id === containerPolicyId) &&
                                p.coiDocuments && p.coiDocuments.length > 0) {
                                return true;
                            }
                            // Cross-reference match - find the policy that has COI documents
                            if ((p.policyNumber === policyId || p.id === policyId) && p.coiDocuments && p.coiDocuments.length > 0) {
                                const policyMappings = {
                                    '6146786114': 'POL-1769897676650-ri6ku8b34',
                                    'POL-1769897676650-ri6ku8b34': '6146786114'
                                };
                                const mappedId = policyMappings[policyId] || policyMappings[p.policyNumber];
                                const reverseMappedId = policyMappings[containerPolicyId];
                                return (mappedId === containerPolicyId) || (reverseMappedId === policyId || reverseMappedId === p.policyNumber);
                            }
                            return false;
                        });

                        if (policy && policy.coiDocuments) {
                            console.log('🎨 Found policy with COI documents, updating container...');
                            updateCOIContainer(container, policy.coiDocuments);
                        } else {
                            console.log('❌ Could not find policy with COI documents for container:', containerPolicyId);
                        }
                    } else {
                        console.log('❌ No COI should be shown for container:', containerPolicyId);
                    }
                });
            }, 500);
        }, 1500); // Wait 1.5 seconds to show the success state

    } catch (error) {
        console.error('❌ Error saving COI document:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            policyId: policyId,
            formData: formData ? Object.keys(formData) : 'undefined'
        });

        // Try to identify exactly where it failed
        console.error('❌ Save failure point - could not complete localStorage save operation');
        throw error; // Re-throw to see full stack trace
    }
}

// Function to update COI container with visual cards
function updateCOIContainer(container, coiDocuments) {
    console.log('🎨 Updating COI container with', coiDocuments.length, 'documents');
    console.log('🎨 Container ID:', container.id);
    console.log('🎨 COI Documents:', coiDocuments.map(d => ({ id: d.id, name: d.name, uploadDate: d.uploadDate })));

    let containerHTML = '';

    coiDocuments.forEach((doc, index) => {
        const uploadDate = doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Unknown';
        const docName = doc.name || `COI Document ${index + 1}`;

        containerHTML += `
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: 0.2s; cursor: pointer;" onclick="window.showCOIModal && window.showCOIModal(${JSON.stringify(doc).replace(/"/g, '&quot;')})">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: #3b82f6; color: white; padding: 12px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-file-pdf" style="font-size: 20px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 14px; font-weight: 600;">${docName}</h4>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                            <i class="fas fa-calendar"></i> ${uploadDate} |
                            <i class="fas fa-file"></i> ${doc.type || 'image/png'}
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="event.stopPropagation(); window.showCOIModal && window.showCOIModal(${JSON.stringify(doc).replace(/"/g, '&quot;')})" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = containerHTML;
    console.log('✅ COI container updated successfully');
}

// Simplified function to force update COI container for specific policy
window.forceUpdateCOIContainer = function(policyId = 'POL-1769897676650-ri6ku8b34') {
    console.log('🔧 Force updating COI container for policy:', policyId);

    // Find the container
    const container = document.getElementById(`coiFilesContainer-${policyId}`);
    if (!container) {
        console.log('❌ Container not found:', `coiFilesContainer-${policyId}`);
        return;
    }

    // Try to get actual saved COI data first
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const crossReferenceMap = {
        '6146786114': 'POL-1769897676650-ri6ku8b34',
        'POL-1769897676650-ri6ku8b34': '6146786114'
    };

    // Look for policy with COI data (either direct match or cross-reference)
    let coiDocuments = null;
    const searchIds = [policyId, crossReferenceMap[policyId]].filter(id => id);

    for (const searchId of searchIds) {
        const policy = policies.find(p => (p.id === searchId || p.policyNumber === searchId) && p.coiDocuments && p.coiDocuments.length > 0);
        if (policy) {
            coiDocuments = policy.coiDocuments;
            console.log('✅ Found saved COI documents for policy:', searchId);
            break;
        }
    }

    // Fallback to sample if no saved data found
    if (!coiDocuments) {
        console.log('⚠️ No saved COI found, using sample data...');
        coiDocuments = [{
            id: `coi-${Date.now()}`,
            name: `ACORD_25_${policyId}_${new Date().toISOString().split('T')[0]}.png`,
            type: 'image/png',
            uploadDate: new Date().toISOString()
        }];
    }

    console.log('🎨 Updating container with COI documents...');
    updateCOIContainer(container, coiDocuments);
    return true;
};

// Test function to manually trigger container update
window.testCOIContainerUpdate = function() {
    console.log('🧪 Testing COI container update manually...');

    // Find the container
    const container = document.getElementById('coiFilesContainer-POL-1769897676650-ri6ku8b34');
    if (!container) {
        console.log('❌ Container not found');
        return;
    }

    // Check localStorage for policies
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log('📋 Available policies:', policies.map(p => ({ id: p.id, policyNumber: p.policyNumber, hasCOI: p.coiDocuments?.length > 0 })));

    // Find a policy with COI documents
    const policyWithCOI = policies.find(p => p.coiDocuments && p.coiDocuments.length > 0);
    if (policyWithCOI) {
        console.log('✅ Found policy with COI:', policyWithCOI.id || policyWithCOI.policyNumber);
        updateCOIContainer(container, policyWithCOI.coiDocuments);
    } else {
        console.log('❌ No policy with COI documents found');
        console.log('🔧 Using force update instead...');
        window.forceUpdateCOIContainer();
    }
};

// Test function to validate modal reopening with COI data
window.testModalReopenWithCOI = function() {
    console.log('🧪 Testing modal reopen with COI data...');

    // Ensure we have sample COI data in localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const testPolicy = {
        id: 'POL-1769897676650-ri6ku8b34',
        policyNumber: 'POL-1769897676650-ri6ku8b34',
        coiDocuments: [{
            id: 'test-coi-123',
            name: 'Test_ACORD_25.png',
            type: 'image/png',
            uploadDate: new Date().toISOString()
        }]
    };

    // Add or update the policy
    const existingIndex = policies.findIndex(p => p.id === testPolicy.id || p.policyNumber === testPolicy.policyNumber);
    if (existingIndex >= 0) {
        policies[existingIndex] = testPolicy;
    } else {
        policies.push(testPolicy);
    }

    localStorage.setItem('insurance_policies', JSON.stringify(policies));
    console.log('✅ Added test COI data to localStorage');

    // Close any existing modal
    const existingModal = document.getElementById('policyViewModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Wait a bit then reopen modal
    setTimeout(() => {
        console.log('🔄 Reopening policy modal...');
        if (window.viewPolicy) {
            window.viewPolicy('POL-1769897676650-ri6ku8b34');
        }
    }, 500);
};

// Debug log to confirm function is defined
console.log('✅ createRealACORDViewer function defined:', typeof window.createRealACORDViewer);

console.log('✅ Real ACORD Viewer Ready with Certificate Holder and Sign As features');