// Fix Policy Management Statistics - Calculate actual values from data
(function() {
    console.log('🔧 Fixing policy management statistics...');
    
    // Function to recalculate and update statistics
    function updatePolicyStatistics() {
        // Check if we're on the policies view
        const policyStats = document.querySelector('.policy-stats');
        if (!policyStats) return false;
        
        console.log('📊 Recalculating policy statistics...');

        // Get all policies from localStorage
        let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

        // Get current user and check if they are admin - filter policies for non-admin users
        const sessionData = sessionStorage.getItem('vanguard_user');
        let currentUser = null;
        let isAdmin = false;

        if (sessionData) {
            try {
                const user = JSON.parse(sessionData);
                currentUser = user.username;
                isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
                console.log(`📊 Policy stats filtering - Current user: ${currentUser}, Is Admin: ${isAdmin}`);
            } catch (error) {
                console.error('Error parsing session data:', error);
            }
        }

        // Filter policies based on user role
        if (!isAdmin && currentUser) {
            const originalCount = policies.length;
            policies = policies.filter(policy => {
                const assignedTo = policy.assignedTo ||
                                  policy.agent ||
                                  policy.assignedAgent ||
                                  policy.producer ||
                                  'Grant'; // Default to Grant if no assignment
                return assignedTo.toLowerCase() === currentUser.toLowerCase();
            });
            console.log(`📊 Filtered policy stats: ${originalCount} -> ${policies.length} (showing only ${currentUser}'s policies)`);
        } else if (isAdmin) {
            console.log(`📊 Admin user - calculating stats for all ${policies.length} policies`);
        }

        const totalPolicies = policies.length;
        
        // Count active policies
        const activePolicies = policies.filter(p => {
            const status = (p.policyStatus || p.status || '').toLowerCase();
            return status === 'active' || status === 'in-force' || status === 'current' || status === 'active';
        }).length;
        
        // Count pending renewal (policies expiring within 60 days)
        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(today.getDate() + 60);
        
        const pendingRenewal = policies.filter(p => {
            if (!p.expirationDate && !p.endDate) return false;
            const expDate = new Date(p.expirationDate || p.endDate);
            return expDate >= today && expDate <= sixtyDaysFromNow;
        }).length;
        
        // Calculate total premium
        let totalPremium = 0;
        policies.forEach(policy => {
            // Try multiple possible locations for premium value
            const premiumValue = policy.financial?.['Annual Premium'] || 
                               policy.financial?.['Premium'] || 
                               policy.premium || 
                               policy.annualPremium || 
                               policy.yearlyPremium || 0;
            
            if (premiumValue) {
                let numValue = 0;
                if (typeof premiumValue === 'number') {
                    numValue = premiumValue;
                } else if (typeof premiumValue === 'string') {
                    // Remove currency symbols, commas, and spaces
                    const cleanValue = premiumValue.replace(/[$,\s]/g, '');
                    numValue = parseFloat(cleanValue) || 0;
                }
                totalPremium += numValue;
            }
        });
        
        // Format total premium with K/M suffix
        let formattedPremium = '$0';
        if (totalPremium >= 1000000) {
            formattedPremium = '$' + (totalPremium / 1000000).toFixed(1) + 'M';
        } else if (totalPremium >= 1000) {
            formattedPremium = '$' + Math.round(totalPremium / 1000) + 'K';
        } else {
            formattedPremium = '$' + Math.round(totalPremium);
        }
        
        console.log('📈 Statistics calculated:', {
            total: totalPolicies,
            active: activePolicies,
            pendingRenewal: pendingRenewal,
            totalPremium: formattedPremium
        });
        
        // Update the DOM
        const miniStats = policyStats.querySelectorAll('.mini-stat');
        if (miniStats.length >= 4) {
            // Total Policies
            const totalStat = miniStats[0].querySelector('.mini-stat-value');
            if (totalStat) totalStat.textContent = totalPolicies;
            
            // Active Policies
            const activeStat = miniStats[1].querySelector('.mini-stat-value');
            if (activeStat) activeStat.textContent = activePolicies;
            
            // Pending Renewal
            const renewalStat = miniStats[2].querySelector('.mini-stat-value');
            if (renewalStat) renewalStat.textContent = pendingRenewal;
            
            // Total Premium
            const premiumStat = miniStats[3].querySelector('.mini-stat-value');
            if (premiumStat) premiumStat.textContent = formattedPremium;
        }
        
        return true;
    }
    
    // More aggressive update strategy
    function forceUpdateStats() {
        // Try multiple times with increasing delays
        const delays = [100, 300, 500, 1000, 2000];
        delays.forEach(delay => {
            setTimeout(() => {
                if (window.location.hash === '#policies') {
                    updatePolicyStatistics();
                }
            }, delay);
        });
    }
    
    // Watch for navigation to policies view
    const originalLoadPoliciesView = window.loadPoliciesView;
    if (originalLoadPoliciesView) {
        window.loadPoliciesView = function(...args) {
            const result = originalLoadPoliciesView.apply(this, args);
            // Force update statistics multiple times
            forceUpdateStats();
            return result;
        };
    }
    
    // Also watch for hash changes
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#policies') {
            forceUpdateStats();
        }
    });
    
    // Update statistics if already on policies page
    if (window.location.hash === '#policies') {
        forceUpdateStats();
    }
    
    // Also update on page load
    window.addEventListener('load', function() {
        if (window.location.hash === '#policies') {
            forceUpdateStats();
        }
    });
    
    // Update on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (window.location.hash === '#policies') {
                forceUpdateStats();
            }
        });
    } else {
        if (window.location.hash === '#policies') {
            forceUpdateStats();
        }
    }
    
    // Watch for DOM changes in case the view is loaded dynamically
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const policyStats = document.querySelector('.policy-stats');
                if (policyStats) {
                    // Check if stats have hardcoded values
                    const miniStats = policyStats.querySelectorAll('.mini-stat-value');
                    if (miniStats.length >= 4) {
                        const activeValue = miniStats[1].textContent;
                        const pendingValue = miniStats[2].textContent;
                        const premiumValue = miniStats[3].textContent;
                        
                        // If we detect the hardcoded values, update them
                        if (activeValue === '4,892' || pendingValue === '156' || premiumValue === '$7.2M') {
                            console.log('Detected hardcoded values, forcing update...');
                            updatePolicyStatistics();
                        }
                    }
                }
            }
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Expose the update function globally
    window.updatePolicyStatistics = updatePolicyStatistics;
    
    console.log('✅ Policy statistics fix initialized');
    console.log('   - Statistics will be calculated from actual policy data');
    console.log('   - Updates automatically when navigating to policies view');
})();