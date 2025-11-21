// NUCLEAR OPTION: Override browser history management completely
console.log('🔧 Loading NUCLEAR navigation fix...');

// Track our custom navigation state
let customNavigationState = 'policy-list';

// Override browser history management for policy viewer
function overrideBrowserNavigation() {
    // Override history.pushState to prevent Certificate Holders → Policy Profile from creating history
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(state, title, url) {
        console.log('🚫 BLOCKED history.pushState:', state, title, url);
        // Don't create history entries for policy viewer navigation
        return;
    };

    history.replaceState = function(state, title, url) {
        console.log('🔄 history.replaceState called:', state, title, url);
        return originalReplaceState.call(this, state, title, url);
    };

    // Override popstate event completely
    window.addEventListener('popstate', function(e) {
        console.log('🔙 Popstate event intercepted:', e);
        const policyViewer = document.getElementById('policyViewer');

        if (policyViewer && policyViewer.innerHTML.includes('Policy Profile')) {
            console.log('🔙 FORCING back to policy list from popstate');
            e.preventDefault();
            e.stopPropagation();

            // Force to policy list
            forceNavigateToPolicyList();
        }
    }, true);
}

// Nuclear function to force navigation to policy list
function forceNavigateToPolicyList() {
    console.log('💥 NUCLEAR: Forcing navigation to policy list');

    customNavigationState = 'policy-list';

    const policyViewer = document.getElementById('policyViewer');
    if (policyViewer) {
        policyViewer.innerHTML = `
            <div class="policy-list" id="policyList">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #6c757d;"></i>
                    <p style="margin-top: 10px; color: #6c757d;">Loading policy list...</p>
                </div>
            </div>
        `;

        // Load policy list
        setTimeout(() => {
            if (window.loadPolicyList) {
                window.loadPolicyList();
            }
        }, 100);
    }
}

// Override viewPolicyProfileCOI to not create history when coming from Certificate Holders
const originalViewPolicyProfileCOI = window.viewPolicyProfileCOI;
window.viewPolicyProfileCOI = function(policyId) {
    console.log('🔄 viewPolicyProfileCOI intercepted for:', policyId);

    // Check if we're coming from Certificate Holders
    const policyViewer = document.getElementById('policyViewer');
    const comingFromCertHolders = policyViewer && policyViewer.innerHTML.includes('certificate-holders-panel');

    if (comingFromCertHolders) {
        console.log('🚫 Coming from Certificate Holders - using replaceState instead of pushState');
        customNavigationState = 'policy-profile-from-cert-holders';
    } else {
        customNavigationState = 'policy-profile';
    }

    return originalViewPolicyProfileCOI.call(this, policyId);
};

// Intercept ALL back button clicks in policy viewer with NUCLEAR priority
document.addEventListener('click', function(e) {
    const button = e.target.closest('button');
    if (!button) return;

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer || !policyViewer.contains(button)) return;

    const hasBackIcon = button.querySelector('.fa-arrow-left');
    const isBackButton = button.classList.contains('btn-back') || hasBackIcon;

    if (isBackButton) {
        const viewerHTML = policyViewer.innerHTML;

        // If we're in Policy Profile, ALWAYS go to Policy List
        if (viewerHTML.includes('Policy Profile') && !viewerHTML.includes('certificate-holders-panel')) {
            console.log('💥 NUCLEAR: Intercepting Policy Profile back button');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            forceNavigateToPolicyList();
            return false;
        }
    }
}, true);

// Override browser back button completely for policy viewer
document.addEventListener('keydown', function(e) {
    if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) {
        const policyViewer = document.getElementById('policyViewer');
        if (policyViewer && policyViewer.innerHTML.includes('Policy Profile')) {
            console.log('💥 NUCLEAR: Intercepting browser back key');
            e.preventDefault();
            e.stopPropagation();

            forceNavigateToPolicyList();
            return false;
        }
    }
}, true);

// Initialize the nuclear option
overrideBrowserNavigation();

console.log('💥 NUCLEAR navigation fix loaded - browser history OVERRIDDEN');