// Market Navigation - Simple Fix
console.log('🏪 Loading simple market navigation...');

// Market page switching function
function loadMarketView() {
    console.log('📊 Loading Market view...');

    // Hide dashboard content
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'none';
    }

    // Show market content
    const marketContent = document.querySelector('.market-content');
    if (marketContent) {
        marketContent.style.display = 'block';
        console.log('✅ Market content displayed');
    }

    // Update sidebar active state
    updateSidebarActive('market');
}

// Function to hide market and show dashboard
function hideMarketView() {
    const marketContent = document.querySelector('.market-content');
    if (marketContent) {
        marketContent.style.display = 'none';
    }

    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'block';
    }
}

// Function to update sidebar active state
function updateSidebarActive(activeSection) {
    // Remove active class from all sidebar items
    const sidebarItems = document.querySelectorAll('.sidebar li');
    sidebarItems.forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to the current section
    const activeItem = document.querySelector(`a[href="#${activeSection}"]`)?.parentElement;
    if (activeItem) {
        activeItem.classList.add('active');
        console.log(`✅ Updated sidebar active state to: ${activeSection}`);
    }
}

// Setup navigation for market only
function setupMarketNavigation() {
    console.log('🔧 Setting up simple market navigation...');

    // Only handle market link clicks
    const marketLink = document.querySelector('a[href="#market"]');
    if (marketLink) {
        marketLink.addEventListener('click', function(event) {
            event.preventDefault();
            loadMarketView();
        });
        console.log('✅ Market navigation link bound');
    }

    // Make functions globally available
    window.loadMarketView = loadMarketView;
    window.hideMarketView = hideMarketView;

    console.log('✅ Simple market navigation setup complete');
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMarketNavigation);
} else {
    setupMarketNavigation();
}

// Also set up after delay
setTimeout(setupMarketNavigation, 500);

console.log('✅ Simple market navigation script loaded');