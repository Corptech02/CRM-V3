// Debug script to check what functions are available
console.log('🔍 DEBUG: Checking available functions...');

setInterval(() => {
    console.log('🔍 FUNCTIONS CHECK:', {
        'window.createEnhancedProfile': typeof window.createEnhancedProfile,
        'window.showLeadProfile': typeof window.showLeadProfile,
        'window.viewLead': typeof window.viewLead
    });

    // Check if our enhanced profile script loaded
    const modal = document.getElementById('lead-profile-container');
    console.log('🔍 Modal exists:', !!modal);

    // Check if there are any lead profile containers
    const existingProfiles = document.querySelectorAll('[class*="lead-profile"]');
    console.log('🔍 Existing profile elements:', existingProfiles.length);
}, 5000);

// Also check when page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('🔍 PAGE LOADED - Function check:', {
            'createEnhancedProfile': typeof window.createEnhancedProfile,
            'showLeadProfile': typeof window.showLeadProfile,
            'viewLead': typeof window.viewLead
        });
    }, 2000);
});