// Progressive Commercial COI Autofill Information
console.log('📋 Progressive Commercial COI Autofill Configuration Loading...');

// Progressive-specific contact information based on the provided COI
const PROGRESSIVE_COMMERCIAL_INFO = {
    insurer: {
        name: 'Progressive Preferred Insurance Company',
        naicCode: '37834',
        email: 'progressivecommercial@email.progressive.com',
        phone: '1-800-444-4487',
        fax: null, // Not provided in reference COI
        serviceName: 'Progressive Commercial Lines Customer and Agent Servicing'
    },
    producer: {
        // This appears to be the agent/broker info from your COI
        name: 'UNITED INS GROUP LLC',
        address: '435 ABBEYVILLE RD F',
        city: 'MEDINA',
        state: 'OH',
        zip: '44256'
    }
};

// Override the fillACORDForm function to include Progressive-specific information
const originalFillACORDForm = window.fillACORDForm;
window.fillACORDForm = function(policyId) {
    console.log('🔧 Progressive COI Autofill - Checking policy...');

    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        console.error('Policy not found:', policyId);
        if (originalFillACORDForm) {
            return originalFillACORDForm(policyId);
        }
        return;
    }

    // Check if this is a Progressive policy
    const isProgressive = policy.carrier &&
        (policy.carrier.toLowerCase().includes('progressive') ||
         policy.carrier.toLowerCase() === 'progressive');

    if (isProgressive) {
        console.log('✅ Progressive policy detected - using Progressive contact info');
        fillProgressiveCOI(policy);
    } else if (originalFillACORDForm) {
        // Use original function for non-Progressive policies
        originalFillACORDForm(policyId);
    }
};

// Function to fill Progressive-specific COI information
function fillProgressiveCOI(policy) {
    console.log('📝 Filling Progressive COI with correct contact information');

    // Get client data if available
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id === policy.clientId) || {};

    // Find the ACORD form content element
    const acordFormContent = document.getElementById('acordFormContent');
    if (!acordFormContent) {
        console.error('ACORD form content not found');
        return;
    }

    // Update Producer section with Progressive agent info
    const producerSection = acordFormContent.querySelector('div:contains("PRODUCER")');
    if (producerSection) {
        const producerContent = `
            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">PRODUCER</div>
            <div style="margin-bottom: 5px;">
                <strong>Name:</strong> ${PROGRESSIVE_COMMERCIAL_INFO.producer.name}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Address:</strong> ${PROGRESSIVE_COMMERCIAL_INFO.producer.address}, ${PROGRESSIVE_COMMERCIAL_INFO.producer.city}, ${PROGRESSIVE_COMMERCIAL_INFO.producer.state} ${PROGRESSIVE_COMMERCIAL_INFO.producer.zip}
            </div>
            <div>
                <strong>Phone:</strong> ${PROGRESSIVE_COMMERCIAL_INFO.insurer.phone}
                <strong style="margin-left: 20px;">Email:</strong> ${PROGRESSIVE_COMMERCIAL_INFO.insurer.email}
            </div>
        `;

        // Find and update the producer div
        const producerDivs = acordFormContent.querySelectorAll('div[style*="border"]');
        producerDivs.forEach(div => {
            if (div.innerHTML.includes('PRODUCER')) {
                div.innerHTML = producerContent;
            }
        });
    }

    // Update Insurer section
    const insurerSections = acordFormContent.querySelectorAll('tr');
    insurerSections.forEach(row => {
        if (row.innerHTML.includes('INSURER A') || row.innerHTML.includes('Insurance Company A')) {
            row.innerHTML = row.innerHTML.replace(
                /Insurance Company A|INSURER A[\s\S]*?<\/td>/,
                `${PROGRESSIVE_COMMERCIAL_INFO.insurer.name}</td>`
            );
        }
        if (row.innerHTML.includes('NAIC') && row.innerHTML.includes('12345')) {
            row.innerHTML = row.innerHTML.replace(
                /12345/g,
                PROGRESSIVE_COMMERCIAL_INFO.insurer.naicCode
            );
        }
    });

    // Update the form data in memory if we're using a form data object
    if (window.currentCOIFormData) {
        window.currentCOIFormData = {
            ...window.currentCOIFormData,
            producerName: PROGRESSIVE_COMMERCIAL_INFO.producer.name,
            producerAddress: `${PROGRESSIVE_COMMERCIAL_INFO.producer.address}, ${PROGRESSIVE_COMMERCIAL_INFO.producer.city}, ${PROGRESSIVE_COMMERCIAL_INFO.producer.state} ${PROGRESSIVE_COMMERCIAL_INFO.producer.zip}`,
            producerPhone: PROGRESSIVE_COMMERCIAL_INFO.insurer.phone,
            producerEmail: PROGRESSIVE_COMMERCIAL_INFO.insurer.email,
            insurerA: PROGRESSIVE_COMMERCIAL_INFO.insurer.name,
            naicA: PROGRESSIVE_COMMERCIAL_INFO.insurer.naicCode,
            // Keep existing insured information
            insuredName: client.name || policy.clientName || policy.insuredName || '',
            insuredAddress: client.address || policy.insuredAddress || '',
            policyNumber: policy.policyNumber || '',
            effectiveDate: policy.effectiveDate || '',
            expirationDate: policy.expirationDate || ''
        };
    }

    // Show success message
    showProgressiveSuccessMessage();
}

// Helper function to show success message
function showProgressiveSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 20px;"></i>
        <div>
            <strong>Progressive Commercial COI</strong><br>
            <small>Contact: ${PROGRESSIVE_COMMERCIAL_INFO.insurer.phone} | ${PROGRESSIVE_COMMERCIAL_INFO.insurer.email}</small>
        </div>
    `;
    document.body.appendChild(successDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        successDiv.style.transition = 'opacity 0.5s';
        successDiv.style.opacity = '0';
        setTimeout(() => successDiv.remove(), 500);
    }, 5000);
}

// Also enhance the email COI function for Progressive policies
const originalEmailACORD = window.emailACORD;
window.emailACORD = function(policyId) {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (policy && policy.carrier && policy.carrier.toLowerCase().includes('progressive')) {
        console.log('📧 Adding Progressive contact info to email');

        // Inject Progressive contact info into the email template
        if (window.currentEmailTemplate) {
            window.currentEmailTemplate += `\n\nProgressive Commercial Contact:\nPhone: ${PROGRESSIVE_COMMERCIAL_INFO.insurer.phone}\nEmail: ${PROGRESSIVE_COMMERCIAL_INFO.insurer.email}`;
        }
    }

    if (originalEmailACORD) {
        originalEmailACORD(policyId);
    }
};

// Function to update existing Progressive policies with correct info
window.updateProgressivePolicies = function() {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    let updated = 0;

    policies.forEach(policy => {
        if (policy.carrier && policy.carrier.toLowerCase().includes('progressive')) {
            // Add Progressive-specific metadata
            policy.insurerEmail = PROGRESSIVE_COMMERCIAL_INFO.insurer.email;
            policy.insurerPhone = PROGRESSIVE_COMMERCIAL_INFO.insurer.phone;
            policy.naicCode = PROGRESSIVE_COMMERCIAL_INFO.insurer.naicCode;
            updated++;
        }
    });

    if (updated > 0) {
        localStorage.setItem('insurance_policies', JSON.stringify(policies));
        console.log(`✅ Updated ${updated} Progressive policies with correct contact information`);
    }

    return updated;
};

// Auto-update Progressive policies on load
setTimeout(() => {
    const updatedCount = updateProgressivePolicies();
    if (updatedCount > 0) {
        console.log(`🔄 Progressive policies updated with correct contact information`);
    }
}, 1000);

console.log('✅ Progressive Commercial COI Autofill Configured');
console.log('📞 Progressive Commercial: 1-800-444-4487');
console.log('📧 Email: progressivecommercial@email.progressive.com');
console.log('🏢 NAIC Code: 37834');