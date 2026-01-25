// DIRECT HIGHLIGHT BUTTON INTERCEPTOR
// This intercepts clicks on highlight duration buttons to handle app sent stage

console.log('🎯 HIGHLIGHT BUTTON INTERCEPTOR - Loading...');

(function() {
    // Function to handle app sent stage highlight button clicks
    function handleHighlightButtonClick(event) {
        console.log('🔍 HIGHLIGHT BUTTON CLICKED');

        // Find the clicked button
        const button = event.target.closest('button');
        if (!button) return;

        // Check if this is a highlight duration button
        const buttonText = button.textContent || button.innerHTML;
        console.log(`🔍 Button text: "${buttonText}"`);

        if (!buttonText.toLowerCase().includes('highlight') &&
            !buttonText.toLowerCase().includes('duration') &&
            !button.id.includes('highlight') &&
            !button.classList.contains('highlight')) {
            return; // Not a highlight button
        }

        // Try to find the lead ID from the button or nearby elements
        let leadId = null;

        // Method 1: Check for onclick attribute with leadId
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr) {
            const leadIdMatch = onclickAttr.match(/showCallStatus\(['"]?(\d+)['"]?\)/);
            if (leadIdMatch) {
                leadId = leadIdMatch[1];
                console.log(`🔍 Found lead ID from onclick: ${leadId}`);
            }
        }

        // Method 2: Check for data attributes
        if (!leadId) {
            leadId = button.getAttribute('data-lead-id') ||
                     button.getAttribute('data-id') ||
                     button.getAttribute('data-leadid');
        }

        // Method 3: Check parent elements
        if (!leadId) {
            let parent = button.parentElement;
            while (parent && !leadId) {
                leadId = parent.getAttribute('data-lead-id') ||
                         parent.getAttribute('data-id') ||
                         parent.getAttribute('data-leadid');
                parent = parent.parentElement;
            }
        }

        if (!leadId) {
            console.log('❌ Could not determine lead ID, allowing normal processing');
            return;
        }

        console.log(`🎯 Processing highlight button for lead ID: ${leadId}`);

        // Get the lead data to check stage
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        if (leads.length === 0) {
            leads = JSON.parse(localStorage.getItem('leads') || '[]');
        }

        const lead = leads.find(l => String(l.id) === String(leadId));
        if (!lead) {
            console.log(`❌ Lead ${leadId} not found in localStorage`);
            return;
        }

        console.log(`🔍 Lead found: ${lead.name}, Stage: "${lead.stage}"`);

        // Check if this is app sent stage
        if (lead.stage === 'app sent' || lead.stage === 'app_sent') {
            console.log('✅ APP SENT STAGE - Intercepting to show indefinite highlight');

            // Prevent the default action
            event.preventDefault();
            event.stopPropagation();

            // Show our custom app sent modal
            showAppSentHighlightModal(lead);
            return false;
        }

        console.log(`🔄 Not app sent stage (${lead.stage}), allowing normal processing`);
    }

    // Special modal for app sent stage
    function showAppSentHighlightModal(lead) {
        console.log('🎯 SHOWING APP SENT INDEFINITE HIGHLIGHT MODAL');

        // Remove any existing modals first
        const existingModals = document.querySelectorAll('.call-status-modal');
        existingModals.forEach(modal => modal.remove());

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 9999999;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white; border-radius: 12px; padding: 30px;
            max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #1f2937;"><i class="fas fa-highlight" style="color: #10b981;"></i> Highlight Duration Status</h2>
                <button class="close-highlight-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            <!-- App Sent Indefinite Highlight -->
            <div style="text-align: center; padding: 25px; background: #f0fdf4; border-radius: 8px; margin-bottom: 20px; border: 2px solid #10b981;">
                <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px;">Green Highlight Status</div>
                <div style="font-size: 36px; font-weight: bold; color: #10b981; margin-bottom: 15px;">Indefinite</div>
                <div style="display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; background: #dcfce7; color: #166534;">
                    App Sent - Indefinite Highlight
                </div>
            </div>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
                <p style="margin: 0; color: #166534; font-weight: 500; font-size: 16px;">
                    <i class="fas fa-check-circle" style="margin-right: 8px;"></i> This lead has an indefinite green highlight because the application has been sent.
                    No further reach-out is required at this stage.
                </p>
            </div>
            <div style="text-align: center;">
                <button class="close-highlight-modal-btn" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px;">
                    Close
                </button>
            </div>
        `;

        modal.className = 'call-status-modal app-sent-modal';
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close handlers
        const closeBtns = modalContent.querySelectorAll('.close-highlight-modal, .close-highlight-modal-btn');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        console.log('✅ App sent indefinite highlight modal displayed via interceptor');
    }

    // Install click interceptor
    function installClickInterceptor() {
        console.log('🔧 Installing highlight button click interceptor...');

        // Add click listener to document to catch all button clicks
        document.addEventListener('click', handleHighlightButtonClick, true);

        // Make function globally available
        window.showAppSentHighlightModal = showAppSentHighlightModal;

        console.log('✅ Click interceptor installed');
    }

    // Install immediately and after DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installClickInterceptor);
    } else {
        installClickInterceptor();
    }

    // Also install after a delay to ensure it's set up
    setTimeout(installClickInterceptor, 1000);

    console.log('✅ Highlight button interceptor loaded');

})();

console.log('🎯 HIGHLIGHT BUTTON INTERCEPTOR - Ready');