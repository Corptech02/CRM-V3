// Fix ACORD Download and Print Functions - Canvas Capture Version
console.log('🔧 Fixing ACORD Download and Print functions...');

// Store the current policy when viewer is created
const originalCreateViewer = window.createRealACORDViewer;
if (originalCreateViewer) {
    window.createRealACORDViewer = async function(policyId) {
        // Get and store policy data globally
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = policies.find(p =>
            p.policyNumber === policyId ||
            p.id === policyId ||
            String(p.id) === String(policyId)
        );

        // Store both policy and ID globally
        window.currentCOIPolicy = policy;
        window.currentCOIPolicyId = policyId;

        console.log('📌 Stored policy globally:', policyId, policy);

        // Call original function
        return await originalCreateViewer.call(this, policyId);
    };
}

// Override download function to capture the actual displayed form
window.downloadACORD = function() {
    console.log('✅ Downloading exact ACORD form display as image');

    const policy = window.currentCOIPolicy;
    if (!policy) {
        alert('Please navigate to a policy first');
        return false;
    }

    // Get the actual ACORD form display elements
    const canvas = document.getElementById('realPdfCanvas');
    const overlay = document.getElementById('realFormOverlay');

    if (!canvas || !overlay) {
        console.error('ACORD viewer elements not found');
        alert('Please ensure the ACORD form is fully loaded and try again.');
        return false;
    }

    const today = new Date().toISOString().split('T')[0];

    // Create a combined canvas with PDF and form fields
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = canvas.width;
    combinedCanvas.height = canvas.height;
    const combinedCtx = combinedCanvas.getContext('2d');

    // Draw the PDF canvas
    combinedCtx.drawImage(canvas, 0, 0);

    // Draw the form field values on top
    const inputs = overlay.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.value || input.checked) {
            const rect = input.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            const x = rect.left - overlayRect.left;
            const y = rect.top - overlayRect.top;

            // Set proper font
            const fontSize = parseInt(input.style.fontSize) || 10;
            const fontFamily = input.style.fontFamily || 'Arial, sans-serif';
            const fontWeight = input.style.fontWeight || 'normal';

            combinedCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
            combinedCtx.fillStyle = '#000000';

            if (input.type === 'checkbox' && input.checked) {
                // Draw X for checked checkboxes
                combinedCtx.font = 'bold 12px Arial';
                combinedCtx.fillText('X', x + 2, y + 10);
            } else if (input.type === 'textarea') {
                // Handle multiline text
                const lines = input.value.split('\n');
                lines.forEach((line, index) => {
                    combinedCtx.fillText(line, x + 2, y + 12 + (index * 14));
                });
            } else if (input.value) {
                // Draw text value
                combinedCtx.fillText(input.value, x + 2, y + 12);
            }
        }
    });

    // Convert canvas to blob and download as PNG
    combinedCanvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ACORD_25_${policy.policyNumber || 'Certificate'}_${today}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png');

    return false;
};

// Override print function to show actual form display
window.printACORD = function() {
    console.log('✅ Printing exact ACORD form display');

    const policy = window.currentCOIPolicy;
    if (!policy) {
        alert('Please navigate to a policy first');
        return false;
    }

    // Get the actual ACORD form container
    const pdfContainer = document.querySelector('.pdf-container');

    if (!pdfContainer) {
        console.error('PDF container not found');
        alert('Please ensure the ACORD form is fully loaded and try again.');
        return false;
    }

    // Create print window
    const printWindow = window.open('', 'PrintACORD', 'width=900,height=1200');
    if (!printWindow) {
        alert('Please allow pop-ups to print the ACORD 25 form');
        return false;
    }

    // Clone the exact display
    const formDisplay = pdfContainer.querySelector('div[style*="background: white"]');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>Print ACORD 25</title>
    <style>
        @page { size: letter; margin: 0.25in; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        canvas {
            display: block;
            max-width: 100%;
            height: auto;
        }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>`);

    // Get canvas and overlay
    const canvas = document.getElementById('realPdfCanvas');
    const overlay = document.getElementById('realFormOverlay');

    if (canvas && overlay) {
        // Create a combined canvas for printing
        const printCanvas = document.createElement('canvas');
        printCanvas.width = canvas.width;
        printCanvas.height = canvas.height;
        const printCtx = printCanvas.getContext('2d');

        // Draw the PDF
        printCtx.drawImage(canvas, 0, 0);

        // Draw form fields
        const inputs = overlay.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.value || input.checked) {
                const rect = input.getBoundingClientRect();
                const overlayRect = overlay.getBoundingClientRect();
                const x = rect.left - overlayRect.left;
                const y = rect.top - overlayRect.top;

                const fontSize = parseInt(input.style.fontSize) || 10;
                const fontFamily = input.style.fontFamily || 'Arial, sans-serif';
                const fontWeight = input.style.fontWeight || 'normal';

                printCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                printCtx.fillStyle = '#000000';

                if (input.type === 'checkbox' && input.checked) {
                    printCtx.font = 'bold 12px Arial';
                    printCtx.fillText('X', x + 2, y + 10);
                } else if (input.type === 'textarea') {
                    const lines = input.value.split('\n');
                    lines.forEach((line, index) => {
                        printCtx.fillText(line, x + 2, y + 12 + (index * 14));
                    });
                } else if (input.value) {
                    printCtx.fillText(input.value, x + 2, y + 12);
                }
            }
        });

        // Add the canvas to print window
        printWindow.document.body.appendChild(printCanvas);
    }

    printWindow.document.write(`
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
    return false;
};

// Override the real download and print functions
window.realDownloadCOI = function(policyId) {
    console.log('🎯 realDownloadCOI redirected to downloadACORD');

    // Make sure policy is available
    if (!window.currentCOIPolicy && policyId) {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = policies.find(p =>
            p.policyNumber === policyId ||
            p.id === policyId ||
            String(p.id) === String(policyId)
        );
        window.currentCOIPolicy = policy;
    }

    return window.downloadACORD();
};

window.realPrintCOI = function(policyId) {
    console.log('🎯 realPrintCOI redirected to printACORD');

    // Make sure policy is available
    if (!window.currentCOIPolicy && window.currentCOIPolicyId) {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = policies.find(p =>
            p.policyNumber === window.currentCOIPolicyId ||
            p.id === window.currentCOIPolicyId ||
            String(p.id) === String(window.currentCOIPolicyId)
        );
        window.currentCOIPolicy = policy;
    }

    return window.printACORD();
};

// Intercept navigation attempts to API endpoints
document.addEventListener('click', function(e) {
    const target = e.target;
    const element = target.closest('button, a');

    if (element) {
        // Skip tab navigation and menu items
        if (element.closest('.nav-menu, .sidebar-menu, .tab-btn, .modal-tabs') ||
            element.classList.contains('tab-btn') ||
            element.classList.contains('nav-link') ||
            element.hasAttribute('data-tab') ||
            element.onclick && element.onclick.toString().includes('Tab')) {
            console.log('✅ Allowing navigation/tab click');
            return; // Let navigation handle its own clicks
        }

        // Skip quote application PDF buttons
        if (element.hasAttribute('data-quote-app-pdf')) {
            console.log('✅ Allowing quote application PDF download');
            return; // Let the quote application handle its own download
        }

        // Skip lead split CSV export buttons
        if (element.hasAttribute('data-lead-split-csv')) {
            console.log('✅ Allowing lead split CSV export');
            return; // Let the lead split handle its own export
        }

        // Skip client/policy document downloads
        if (element.onclick &&
            (element.onclick.toString().includes('downloadClientDocument') ||
             element.onclick.toString().includes('downloadPolicyDocument'))) {
            console.log('✅ Allowing client/policy document download');
            return; // Let the document system handle its own download
        }

        // Check for download buttons
        if (element.textContent.includes('Download') ||
            element.innerHTML.includes('fa-download') ||
            (element.onclick && element.onclick.toString().includes('download'))) {

            console.log('🛑 Intercepted download click');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.downloadACORD();
            return false;
        }

        // Check for print buttons
        if (element.textContent.includes('Print') ||
            element.innerHTML.includes('fa-print') ||
            (element.onclick && element.onclick.toString().includes('print'))) {

            console.log('🛑 Intercepted print click');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.printACORD();
            return false;
        }
    }
}, true);

// Block navigation to error API endpoint
window.addEventListener('beforeunload', function(e) {
    const url = document.activeElement?.href || window.location.href;
    if (url && url.includes('get-saved-coi')) {
        console.log('🛑 Blocking navigation to get-saved-coi');
        e.preventDefault();
        e.stopPropagation();
        window.downloadACORD();
        return false;
    }
});

// Also fix the back button to work properly
window.backToPolicyView = function(policyId) {
    console.log('🔙 Back button clicked - returning to COI Manager');

    // Clear the policy viewer to force reload
    const policyViewer = document.getElementById('policyViewer');
    if (policyViewer) {
        policyViewer.innerHTML = '';
    }

    // Try multiple approaches to return to COI Manager

    // Approach 1: Direct navigation
    if (typeof loadCOIView === 'function') {
        console.log('Calling loadCOIView()');
        try {
            loadCOIView();
            return;
        } catch (e) {
            console.error('loadCOIView failed:', e);
        }
    }

    // Approach 2: Click the COI Manager menu item
    const coiMenuItems = document.querySelectorAll('a[href="#coi"], [onclick*="loadCOI"], .sidebar-menu a');
    for (let item of coiMenuItems) {
        if (item.textContent.includes('COI') || item.innerHTML.includes('fa-certificate')) {
            console.log('Clicking COI menu item:', item);
            item.click();
            return;
        }
    }

    // Approach 3: Hash navigation
    console.log('Using hash navigation');
    window.location.hash = '#coi';

    // Approach 4: Force reload if nothing else works
    setTimeout(() => {
        const currentHash = window.location.hash;
        if (currentHash !== '#coi') {
            console.log('Force reloading to COI section');
            window.location.href = window.location.origin + window.location.pathname + '#coi';
            window.location.reload();
        }
    }, 500);
};

console.log('✅ ACORD Download and Print fixed - Using canvas capture');