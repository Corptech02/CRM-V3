// Backup the current loadLeadsView and replace with minimal version
function loadLeadsView_backup() {
    // This is the current broken version - keeping for reference
}

function loadLeadsView() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        alert('Dashboard content not found');
        return;
    }
    
    // Simple test to see if we can set ANY content
    dashboardContent.innerHTML = `
        <div class="leads-view">
            <h1>Leads Test</h1>
            <p>If you can see this, the basic function works.</p>
        </div>
    `;
}