// APP SENT STAGE HIGHLIGHT FIX
// This script modifies the showCallStatus function to display "indefinite" for app sent stage

console.log('🚀 APP SENT HIGHLIGHT FIX - Loading...');

(function() {
    // Store original showCallStatus functions
    let originalShowCallStatus = null;
    let originalShowCallStatusWithFreshData = null;

    // Enhanced showCallStatus that handles app sent stage
    function showCallStatusEnhanced(leadId) {
        console.log(`🟢 ENHANCED HIGHLIGHT DURATION for lead: ${leadId}`);

        // First get the lead to check its stage - try multiple storage locations
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        if (leads.length === 0) {
            leads = JSON.parse(localStorage.getItem('leads') || '[]');
            console.log(`🔍 Using 'leads' storage: ${leads.length} leads`);
        } else {
            console.log(`🔍 Using 'insurance_leads' storage: ${leads.length} leads`);
        }

        const lead = leads.find(l => String(l.id) === String(leadId));

        if (!lead) {
            console.log(`❌ Lead ${leadId} not found in localStorage, using original function`);
            if (originalShowCallStatus) {
                return originalShowCallStatus(leadId);
            }
            return;
        }

        console.log(`🔍 Found lead: ${lead.name}, Stage: "${lead.stage}"`);

        // SPECIAL CASE: App sent stage (check for exact match)
        if (lead.stage === 'app sent' || lead.stage === 'app_sent') {
            console.log('✅ APP SENT STAGE DETECTED - showing indefinite green highlight modal');
            showAppSentHighlightModal(lead);
            return;
        }

        // For all other stages, use original function
        console.log(`🔄 Using original function for stage: ${lead.stage}`);
        if (originalShowCallStatus) {
            return originalShowCallStatus(leadId);
        }
    }

    // Special modal for app sent stage
    function showAppSentHighlightModal(lead) {
        console.log('🎯 Creating app sent indefinite highlight modal');

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
                <button id="close-highlight-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            <!-- App Sent Indefinite Highlight -->
            <div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 8px; margin-bottom: 20px; border: 2px solid #10b981;">
                <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">Green Highlight Status</div>
                <div id="countdown-timer" style="font-size: 32px; font-weight: bold; color: #10b981; margin-bottom: 5px;">Indefinite</div>
                <div style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #dcfce7; color: #166534;">
                    App Sent - Indefinite Highlight
                </div>
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
                <p style="margin: 0; color: #166534; font-weight: 500;">
                    <i class="fas fa-info-circle"></i> This lead has an indefinite green highlight because the application has been sent.
                    No further reach-out is required at this stage.
                </p>
            </div>
            <div style="text-align: center;">
                <button id="close-highlight-modal-btn" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Close
                </button>
            </div>
        `;

        modal.className = 'call-status-modal';
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close handlers
        const closeBtn = modalContent.querySelector('#close-highlight-modal');
        const closeBtnMain = modalContent.querySelector('#close-highlight-modal-btn');

        closeBtn.addEventListener('click', () => modal.remove());
        closeBtnMain.addEventListener('click', () => modal.remove());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        console.log('✅ App sent indefinite highlight modal displayed');
    }

    // Wait for page to load and override functions
    function installOverride() {
        console.log('🔧 INSTALLING APP SENT OVERRIDE...');

        // Check for protectedFunctions
        if (window.protectedFunctions && window.protectedFunctions.showCallStatus) {
            console.log('🔄 Overriding protectedFunctions.showCallStatus for app sent handling');
            if (!originalShowCallStatus) originalShowCallStatus = window.protectedFunctions.showCallStatus;
            window.protectedFunctions.showCallStatus = showCallStatusEnhanced;
            console.log('✅ protectedFunctions.showCallStatus overridden');
        } else {
            console.log('❌ protectedFunctions.showCallStatus not found');
        }

        // Check for global showCallStatus
        if (window.showCallStatus) {
            console.log('🔄 Overriding global showCallStatus for app sent handling');
            if (!originalShowCallStatus) originalShowCallStatus = window.showCallStatus;
            window.showCallStatus = showCallStatusEnhanced;
            console.log('✅ Global showCallStatus overridden');
        } else {
            console.log('❌ Global showCallStatus not found');
        }

        // Make enhanced function globally available
        window.showCallStatusEnhanced = showCallStatusEnhanced;
        window.showAppSentHighlightModal = showAppSentHighlightModal;

        console.log('📊 OVERRIDE STATUS:');
        console.log('   protectedFunctions available:', !!window.protectedFunctions);
        console.log('   protectedFunctions.showCallStatus available:', !!(window.protectedFunctions?.showCallStatus));
        console.log('   global showCallStatus available:', !!window.showCallStatus);
        console.log('   originalShowCallStatus stored:', !!originalShowCallStatus);
    }

    // More aggressive installation - try multiple times and use observers
    installOverride();
    setTimeout(installOverride, 500);
    setTimeout(installOverride, 1000);
    setTimeout(installOverride, 2000);
    setTimeout(installOverride, 3000);
    setTimeout(installOverride, 5000);

    // Watch for showCallStatus function creation
    let functionWatcher = setInterval(() => {
        if ((window.showCallStatus && window.showCallStatus !== showCallStatusEnhanced) ||
            (window.protectedFunctions?.showCallStatus && window.protectedFunctions.showCallStatus !== showCallStatusEnhanced)) {
            console.log('🔄 Detected new showCallStatus function, re-installing override...');
            installOverride();
        }
    }, 1000);

    console.log('✅ App sent highlight fix installed');

})();

console.log('🎯 APP SENT HIGHLIGHT FIX - Loaded successfully');