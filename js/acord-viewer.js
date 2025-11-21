// Custom ACORD PDF Viewer with Form Field Support
console.log('🎯 Custom ACORD Viewer Loading...');

// Initialize PDF.js when it's available
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    console.log('PDF.js initialized');
} else {
    console.warn('PDF.js not loaded yet');
}

// Global variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let canvas = null;
let ctx = null;
let currentPolicyId = null;
let formFields = {};

// Create custom PDF viewer with ORIGINAL layout
window.createCustomACORDViewer = function(policyId) {
    console.log('Creating custom ACORD viewer for policy:', policyId);
    currentPolicyId = policyId;

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

    // Check if there's a saved COI
    let hasSaved = false;

    // Use EXACT ORIGINAL layout from acord-25-embedded.js
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header with actions - EXACT ORIGINAL -->
            <div class="acord-header" style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                        <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                        Policy: ${policy?.policyNumber || 'N/A'} | ${policy?.carrier || 'N/A'}
                    </p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="saveACORDDirectly('${policyId}')" class="btn-primary" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-save"></i> Save COI
                    </button>
                    <button onclick="downloadACORD()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button onclick="printACORDDirectly()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
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

            <!-- PDF Viewer - Custom canvas replacing embed -->
            <div class="pdf-container" style="flex: 1; padding: 0; background: #f3f4f6; overflow: auto;">
                <div style="width: 100%; height: 100%; background: white; overflow: hidden; min-height: 1000px;">
                    <!-- Canvas for PDF rendering -->
                    <div id="pdfContainer" style="width: 100%; height: 100%; position: relative;">
                        <canvas id="pdfCanvas" style="display: block; margin: 0 auto;"></canvas>
                        <div id="formFieldsOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
                    </div>
                </div>
            </div>

            <!-- Status Bar - EXACT ORIGINAL -->
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

    // Load the PDF
    loadPDFWithFields('ACORD_25_fillable.pdf', policy);
};

// Load PDF and create form fields
async function loadPDFWithFields(url, policyData) {
    try {
        console.log('Loading PDF from:', url);

        // Show loading state
        const container = document.getElementById('pdfContainer');
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #0066cc;"></i>
                <p style="margin-top: 20px; color: #666;">Loading ACORD form...</p>
            </div>
        `;

        // Ensure PDF.js is loaded
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js not loaded, falling back to embed');
            container.innerHTML = `
                <embed src="${url}#view=FitH&toolbar=1&navpanes=0&scrollbar=1&zoom=125"
                       type="application/pdf"
                       width="100%"
                       height="100%"
                       style="min-height: 1000px;">
            `;
            return;
        }

        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;

        console.log('PDF loaded, pages:', pdfDoc.numPages);

        // Reset container and create canvas
        container.innerHTML = `
            <div style="background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto; position: relative; width: fit-content;">
                <canvas id="pdfCanvas" style="display: block;"></canvas>
                <div id="formFieldsOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
            </div>
        `;

        canvas = document.getElementById('pdfCanvas');
        ctx = canvas.getContext('2d');

        // Render the first page
        await renderPage(1);

        // Create form field inputs
        createFormFields(policyData);

    } catch (error) {
        console.error('Error loading PDF:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #dc2626;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px;"></i>
                <p style="margin-top: 20px;">Failed to load PDF. Please try again.</p>
            </div>
        `;
    }
}

// Render PDF page
async function renderPage(num) {
    pageRendering = true;

    try {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        const renderTask = page.render(renderContext);
        await renderTask.promise;

        pageRendering = false;

        if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
        }
    } catch (error) {
        console.error('Error rendering page:', error);
        pageRendering = false;
    }
}

// Create form field inputs overlaid on PDF
function createFormFields(policyData) {
    const overlay = document.getElementById('formFieldsOverlay');
    if (!overlay) return;

    // Clear existing fields
    overlay.innerHTML = '';
    formFields = {};

    // Define field positions (based on ACORD 25 layout at scale 1.5)
    const fields = [
        // Producer Information
        { name: 'producer', type: 'text', x: 52, y: 150, width: 250, height: 20,
          value: 'Vanguard Insurance Agency' },
        { name: 'producerAddress', type: 'text', x: 52, y: 172, width: 250, height: 20,
          value: '123 Insurance Blvd, Suite 100' },
        { name: 'producerCity', type: 'text', x: 52, y: 194, width: 250, height: 20,
          value: 'New York, NY 10001' },
        { name: 'producerPhone', type: 'text', x: 330, y: 150, width: 150, height: 20,
          value: '(555) 123-4567' },

        // Insured Information
        { name: 'insured', type: 'text', x: 52, y: 290, width: 300, height: 20,
          value: policyData?.clientName || '' },
        { name: 'insuredAddress', type: 'text', x: 52, y: 312, width: 300, height: 20,
          value: '' },

        // Insurance Company
        { name: 'insurerA', type: 'text', x: 540, y: 368, width: 200, height: 20,
          value: policyData?.carrier || '' },

        // Policy Number
        { name: 'policyNumber', type: 'text', x: 525, y: 485, width: 150, height: 20,
          value: policyData?.policyNumber || '' },

        // Effective Date
        { name: 'effectiveDate', type: 'date', x: 695, y: 485, width: 100, height: 20,
          value: policyData?.effectiveDate || '' },

        // Expiration Date
        { name: 'expirationDate', type: 'date', x: 795, y: 485, width: 100, height: 20,
          value: policyData?.expirationDate || '' },

        // Limits
        { name: 'eachOccurrence', type: 'text', x: 740, y: 485, width: 120, height: 20,
          value: '1,000,000' },
        { name: 'generalAggregate', type: 'text', x: 740, y: 520, width: 120, height: 20,
          value: '2,000,000' },

        // Certificate Holder
        { name: 'certificateHolder', type: 'textarea', x: 52, y: 760, width: 350, height: 80,
          value: '' },

        // Description
        { name: 'description', type: 'textarea', x: 52, y: 620, width: 800, height: 60,
          value: '' },

        // Authorized Representative - THE KEY FIELD
        { name: 'authorizedRep', type: 'text', x: 577, y: 945, width: 250, height: 25,
          value: 'Grant Corp', style: 'font-weight: bold; font-size: 14px;' }
    ];

    // Create input elements for each field
    fields.forEach(field => {
        let input;

        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.style.resize = 'none';
        } else {
            input = document.createElement('input');
            input.type = field.type;
        }

        // Set common styles
        input.style.cssText = `
            position: absolute;
            left: ${field.x}px;
            top: ${field.y}px;
            width: ${field.width}px;
            height: ${field.height}px;
            border: 1px solid #ddd;
            padding: 2px 5px;
            font-size: 11px;
            font-family: Arial, sans-serif;
            background: rgba(255, 255, 255, 0.9);
            ${field.style || ''}
        `;

        input.name = field.name;
        input.value = field.value;

        // Store reference
        formFields[field.name] = input;

        // Add focus/blur effects
        input.addEventListener('focus', () => {
            input.style.background = 'white';
            input.style.borderColor = '#0066cc';
        });

        input.addEventListener('blur', () => {
            input.style.background = 'rgba(255, 255, 255, 0.9)';
            input.style.borderColor = '#ddd';
        });

        overlay.appendChild(input);
    });

    console.log('Form fields created:', Object.keys(formFields).length);
}

// Save ACORD directly to database
window.saveACORDDirectly = async function(policyId) {
    console.log('Saving ACORD form for policy:', policyId);

    // Update status - use coiStatus ID to match original
    const statusEl = document.getElementById('coiStatus');
    if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    // Collect all form field values
    const formData = {};
    for (const [name, input] of Object.entries(formFields)) {
        formData[name] = input.value;
    }

    try {
        // Save to server
        const response = await fetch('http://162.220.14.239:3001/api/save-coi-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyId: policyId,
                formData: formData,
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            // Update status
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved successfully';
                statusEl.style.color = '#10b981';
            }

            // Show success message
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
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
            successDiv.innerHTML = `
                <i class="fas fa-check-circle"></i> COI saved successfully!
            `;
            document.body.appendChild(successDiv);
            setTimeout(() => successDiv.remove(), 3000);

            // Also generate PDF with filled data
            await generateFilledPDF(policyId, formData);

        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Save error:', error);

        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Save failed';
            statusEl.style.color = '#dc2626';
        }

        alert('Failed to save COI. Please try again.');
    }
};

// Generate filled PDF server-side
async function generateFilledPDF(policyId, formData) {
    try {
        const response = await fetch('http://162.220.14.239:3001/api/generate-filled-coi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyId: policyId,
                formData: formData
            })
        });

        if (response.ok) {
            console.log('Filled PDF generated successfully');
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

// Print function
window.printACORDDirectly = function() {
    window.print();
};

// Load saved form data
window.loadSavedFormData = async function(policyId) {
    try {
        const response = await fetch(`http://162.220.14.239:3001/api/get-coi-form/${policyId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.formData) {
                // Fill the form fields with saved data
                for (const [name, value] of Object.entries(data.formData)) {
                    if (formFields[name]) {
                        formFields[name].value = value;
                    }
                }
                console.log('Loaded saved form data');
            }
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
};

console.log('✅ Custom ACORD Viewer Ready');