// Navigation Fix - Ensure dashboard loads and other navigation works
console.log('🔧 Loading navigation fix...');

// Function to ensure dashboard is visible on page load
function ensureDashboardVisible() {
    // Make sure dashboard is visible
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'block';
        console.log('✅ Dashboard content made visible');
    }

    // Make sure market is hidden
    const marketContent = document.querySelector('.market-content');
    if (marketContent) {
        marketContent.style.display = 'none';
    }

    // Set dashboard as active in sidebar
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    if (dashboardLink) {
        const dashboardItem = dashboardLink.parentElement;
        dashboardItem.classList.add('active');
    }
}

// Run immediately
ensureDashboardVisible();

// Also run after page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureDashboardVisible);
} else {
    setTimeout(ensureDashboardVisible, 100);
}

console.log('✅ Navigation fix loaded');