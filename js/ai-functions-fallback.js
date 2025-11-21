// Fallback definitions for AI Lead Caller functions
// This ensures functions are available even if main script hasn't loaded yet

if (typeof window.showManualCallModal === 'undefined') {
    window.showManualCallModal = function(campaignId) {
        console.log('Waiting for AI Lead Caller to load...');
        // Try again after a short delay
        setTimeout(() => {
            if (typeof window.showManualCallModal === 'function' && window.showManualCallModal !== arguments.callee) {
                window.showManualCallModal(campaignId);
            } else {
                alert('AI Lead Caller is still loading. Please try again in a moment.');
            }
        }, 500);
    };
}

if (typeof window.viewAICampaignDetails === 'undefined') {
    window.viewAICampaignDetails = function(campaignId) {
        console.log('Waiting for AI Lead Caller to load...');
        setTimeout(() => {
            if (typeof window.viewAICampaignDetails === 'function' && window.viewAICampaignDetails !== arguments.callee) {
                window.viewAICampaignDetails(campaignId);
            } else {
                alert('AI Lead Caller is still loading. Please try again in a moment.');
            }
        }, 500);
    };
}

if (typeof window.startAICampaign === 'undefined') {
    window.startAICampaign = function(campaignId) {
        console.log('Waiting for AI Lead Caller to load...');
        setTimeout(() => {
            if (typeof window.startAICampaign === 'function' && window.startAICampaign !== arguments.callee) {
                window.startAICampaign(campaignId);
            } else {
                alert('AI Lead Caller is still loading. Please try again in a moment.');
            }
        }, 500);
    };
}

console.log('AI functions fallback loaded');