// Force immediate FMCSA data update for all clients
(function() {
    console.log('🚀 Forcing immediate FMCSA data update...');
    
    // Clear the last update timestamp to force an update
    localStorage.removeItem('fmcsa_last_update');
    
    // Wait for the FMCSA updater to be loaded
    setTimeout(() => {
        if (window.updateAllClientsWithFMCSAData) {
            console.log('📊 Starting FMCSA data update for all clients...');
            window.updateAllClientsWithFMCSAData().then(() => {
                console.log('✅ FMCSA data update complete!');
                localStorage.setItem('fmcsa_last_update', new Date().getTime().toString());
            }).catch(error => {
                console.error('❌ Error updating FMCSA data:', error);
            });
        } else {
            console.log('⚠️ FMCSA updater not loaded yet. Try refreshing the page.');
        }
    }, 2000);
})();