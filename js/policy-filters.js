// Policy Filters Functionality
console.log('🔍 Loading policy filters functionality...');

// Policy filtering function
window.filterPolicies = function() {
    const typeFilter = document.getElementById('policyTypeFilter');
    const carrierFilter = document.getElementById('policyCarrierFilter');
    const statusFilter = document.getElementById('policyStatusFilter');
    const agentFilter = document.getElementById('policyAgentFilter');
    const searchInput = document.querySelector('.filters-bar .search-box input');

    if (!typeFilter || !carrierFilter || !statusFilter) {
        console.log('Filter elements not found, skipping filter');
        return;
    }

    const typeValue = typeFilter.value.toLowerCase();
    const carrierValue = carrierFilter.value.toLowerCase();
    const statusValue = statusFilter.value.toLowerCase();
    const agentValue = agentFilter ? agentFilter.value : '';
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';

    // Check if Maureen is logged in
    const sessionData = sessionStorage.getItem('vanguard_user');
    let isMaureen = false;
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            isMaureen = user.username && user.username.toLowerCase() === 'maureen';
        } catch (error) {
            console.error('Error checking user in filterPolicies:', error);
        }
    }

    console.log(`🔍 Filtering policies: Type="${typeValue}", Carrier="${carrierValue}", Status="${statusValue}", Search="${searchValue}"`);

    // Get all policy table rows
    const tbody = document.getElementById('policyTableBody');
    if (!tbody) {
        console.log('Policy table body not found');
        return;
    }

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) {
            // Skip empty rows or header rows
            return;
        }

        // Extract data from row cells
        const policyNumber = cells[0]?.textContent?.toLowerCase() || '';
        const policyTypeCell = cells[1]?.textContent?.toLowerCase() || '';
        const clientName = cells[2]?.textContent?.toLowerCase() || '';
        const carrier = cells[3]?.textContent?.toLowerCase() || '';
        const assignedAgent = cells[7]?.textContent?.trim() || '';
        const status = cells.length > 8 ? cells[8]?.textContent?.toLowerCase() || '' : '';

        // Policy type matching
        let typeMatch = true;
        if (typeValue) {
            typeMatch = false;
            // Handle different policy type formats
            if (typeValue === 'auto' && (policyTypeCell.includes('personal') && policyTypeCell.includes('auto'))) {
                typeMatch = true;
            } else if (typeValue === 'commercial-auto' && (policyTypeCell.includes('commercial') && policyTypeCell.includes('auto'))) {
                typeMatch = true;
            } else if (typeValue === 'homeowners' && (policyTypeCell.includes('homeowners') || policyTypeCell.includes('home'))) {
                typeMatch = true;
            } else if (typeValue === 'commercial-property' && (policyTypeCell.includes('commercial') && policyTypeCell.includes('property'))) {
                typeMatch = true;
            } else if (typeValue === 'general-liability' && (policyTypeCell.includes('general') || policyTypeCell.includes('liability'))) {
                typeMatch = true;
            } else if (typeValue === 'life' && policyTypeCell.includes('life')) {
                typeMatch = true;
            }
        }

        // Carrier matching
        const carrierMatch = !carrierValue || carrier.includes(carrierValue);

        // Status matching
        const statusMatch = !statusValue || status.includes(statusValue);

        // Search matching (policy number or client name)
        const searchMatch = !searchValue ||
            policyNumber.includes(searchValue) ||
            clientName.includes(searchValue) ||
            carrier.includes(searchValue);

        // Agent filtering with special logic for Maureen
        let agentMatch = true;
        if (isMaureen) {
            // For Maureen: if no specific agent selected ("All My Policies"), still only show Maureen's policies
            if (!agentValue) {
                agentMatch = assignedAgent === 'Maureen';
                console.log(`🔍 Maureen "All My Policies" filter: ${agentMatch ? 'SHOW' : 'HIDE'} policy assigned to "${assignedAgent}"`);
            } else {
                agentMatch = assignedAgent === agentValue;
            }
        } else {
            // Normal filtering for other users
            agentMatch = !agentValue || assignedAgent === agentValue;
        }

        // Show/hide row based on all filters
        const shouldShow = typeMatch && carrierMatch && statusMatch && searchMatch && agentMatch;

        if (shouldShow) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    console.log(`📊 Policy filter results: ${visibleCount} policies visible out of ${rows.length} total`);

    // Update any count displays if they exist
    const countDisplay = document.querySelector('.showing-info');
    if (countDisplay) {
        countDisplay.textContent = `Showing ${visibleCount} policies`;
    }
};

// Add search functionality to search input
function initializePolicySearch() {
    const searchInput = document.querySelector('.policies-view .filters-bar .search-box input');
    if (searchInput && !searchInput.hasAttribute('data-policy-search-initialized')) {
        searchInput.setAttribute('data-policy-search-initialized', 'true');

        // Add event listeners for real-time search
        searchInput.addEventListener('keyup', function() {
            filterPolicies();
        });

        searchInput.addEventListener('search', function() {
            filterPolicies();
        });

        console.log('✅ Policy search functionality initialized');
    }
}

// Initialize search when policies view loads
function initializePolicyFilters() {
    // Wait a bit for the DOM to be ready
    setTimeout(() => {
        initializePolicySearch();

        // Add event listeners to filters if not already added
        const typeFilter = document.getElementById('policyTypeFilter');
        const carrierFilter = document.getElementById('policyCarrierFilter');
        const statusFilter = document.getElementById('policyStatusFilter');

        if (typeFilter && !typeFilter.hasAttribute('data-filter-initialized')) {
            typeFilter.setAttribute('data-filter-initialized', 'true');
            console.log('✅ Policy type filter initialized');
        }

        if (carrierFilter && !carrierFilter.hasAttribute('data-filter-initialized')) {
            carrierFilter.setAttribute('data-filter-initialized', 'true');
            console.log('✅ Policy carrier filter initialized');
        }

        if (statusFilter && !statusFilter.hasAttribute('data-filter-initialized')) {
            statusFilter.setAttribute('data-filter-initialized', 'true');
            console.log('✅ Policy status filter initialized');
        }

        console.log('🎯 Policy filters fully initialized');
    }, 500);
}

// Auto-filter function for Maureen
function applyMaureenAutoFilter() {
    const sessionData = sessionStorage.getItem('vanguard_user');
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            if (user.username && user.username.toLowerCase() === 'maureen') {
                setTimeout(() => {
                    const agentFilter = document.getElementById('policyAgentFilter');
                    if (agentFilter) {
                        agentFilter.value = '';
                        console.log('🔒 AUTO-FILTER (Policies): Set policy filter to "All My Policies" for Maureen');
                        // Trigger the filter function immediately
                        filterPolicies();
                        console.log('✅ AUTO-FILTER (Policies): Applied Maureen "All My Policies" filter');
                    }
                }, 300); // Allow time for DOM to update
            }
        } catch (error) {
            console.error('Error applying Maureen auto-filter for policies:', error);
        }
    }
}

// Auto-initialize when the script loads and when policies view loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePolicyFilters);
} else {
    initializePolicyFilters();
}

// Also initialize when hash changes to policies
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#policies') {
        setTimeout(() => {
            initializePolicyFilters();
            applyMaureenAutoFilter(); // Apply auto-filter for Maureen
        }, 200);
    }
});

// Apply auto-filter when script loads and we're already on policies page
setTimeout(() => {
    if (window.location.hash === '#policies') {
        applyMaureenAutoFilter();
    }
}, 1000);

console.log('✅ Policy filters script loaded');