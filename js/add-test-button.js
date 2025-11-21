// Add a test button to manually trigger enhanced profile
document.addEventListener('DOMContentLoaded', function() {
    // Wait for page to load
    setTimeout(() => {
        // Check if we're on the leads page
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management' || !window.location.hash) {
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                // Add test button
                const testBtn = document.createElement('button');
                testBtn.className = 'btn-secondary';
                testBtn.innerHTML = '<i class="fas fa-test"></i> Test Enhanced Profile';
                testBtn.style.background = '#10b981';
                testBtn.onclick = function() {
                    // Get first commercial auto lead
                    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                    const commercialLead = leads.find(l => 
                        l.product && (l.product.includes('Commercial') || l.product.includes('Fleet'))
                    );
                    
                    if (commercialLead) {
                        console.log('Testing enhanced profile for:', commercialLead.name);
                        console.log('Lead data:', commercialLead);
                        
                        if (window.showLeadProfile) {
                            window.showLeadProfile(commercialLead.id);
                        } else {
                            alert('Enhanced profile function not loaded yet. Please refresh the page.');
                        }
                    } else {
                        alert('No commercial auto leads found in system');
                    }
                };
                
                headerActions.appendChild(testBtn);
                console.log('Test button added');
            }
        }
    }, 2000);
});