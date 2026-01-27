// Market Navigation - Minimal Interference Fix
console.log('🏪 Loading minimal market navigation...');

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

// Function to hide market view only
function hideMarketView() {
    console.log('📤 Hiding Market view...');
    const marketContent = document.querySelector('.market-content');
    if (marketContent) {
        marketContent.style.display = 'none';
        console.log('✅ Market content hidden');
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

// VERY minimal navigation handler - ONLY for market clicks
function handleMarketOnly(event) {
    const target = event.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');

    // ONLY handle market tab clicks - ignore everything else
    if (href === '#market') {
        event.preventDefault();
        event.stopPropagation();
        loadMarketView();
        console.log('✅ Market navigation handled');
        return;
    }

    // For any other click, if market is visible, hide it
    const marketContent = document.querySelector('.market-content');
    if (marketContent && marketContent.style.display === 'block') {
        console.log('👋 Market was visible, hiding it for other navigation');
        hideMarketView();
    }

    // Let all other navigation work normally - DO NOT INTERFERE
}

// Setup ONLY market-specific navigation
function setupMinimalMarketNavigation() {
    console.log('🔧 Setting up minimal market navigation...');

    // Remove any existing listeners first
    document.removeEventListener('click', handleMarketOnly);

    // Add minimal click handler
    document.addEventListener('click', handleMarketOnly);

    // Make functions globally available
    window.loadMarketView = loadMarketView;
    window.hideMarketView = hideMarketView;

    console.log('✅ Minimal market navigation setup complete');
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMinimalMarketNavigation);
} else {
    setupMinimalMarketNavigation();
}

console.log('✅ Minimal market navigation script loaded');