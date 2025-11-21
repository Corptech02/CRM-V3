// Quote Applications Viewing System
(function() {
    'use strict';
    
    // Add Quote Applications to the navigation menu
    function addQuoteApplicationsToNav() {
        // Check if we're in the leads section
        const interval = setInterval(() => {
            const leadsNav = document.querySelector('a[onclick*="showLeads"]');
            if (leadsNav && !document.querySelector('a[onclick*="showQuoteApplications"]')) {
                // Add Quote Applications menu item after Leads
                const navItem = document.createElement('li');
                navItem.innerHTML = `
                    <a href="#" onclick="showQuoteApplications(); return false;">
                        <i class="fas fa-file-alt"></i>
                        <span>Quote Applications</span>
                    </a>
                `;
                
                // Insert after Leads
                if (leadsNav.parentElement && leadsNav.parentElement.parentElement) {
                    leadsNav.parentElement.parentElement.insertBefore(navItem, leadsNav.parentElement.nextSibling);
                }
                
                clearInterval(interval);
            }
        }, 1000);
    }
    
    // Show Quote Applications section
    window.showQuoteApplications = function() {
        console.log('Showing Quote Applications');
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Remove existing quote applications section if any
        const existingSection = document.getElementById('quote-applications-section');
        if (existingSection) {
            existingSection.remove();
        }
        
        // Get all saved applications
        const applications = JSON.parse(localStorage.getItem('quoteApplications') || '[]');
        
        // Create the Quote Applications section
        const section = document.createElement('div');
        section.id = 'quote-applications-section';
        section.className = 'content-section';
        section.style.display = 'block';
        section.innerHTML = `
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2><i class="fas fa-file-alt"></i> Quote Applications</h2>
                <div style="display: flex; gap: 10px;">
                    <button onclick="exportAllApplications()" class="btn-primary" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-download"></i> Export All
                    </button>
                </div>
            </div>
            
            <div class="applications-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
                ${applications.length > 0 ? applications.map(app => `
                    <div class="application-card" style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <div>
                                <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px;">
                                    ${app.data.insuredName || 'Unnamed Application'}
                                </h3>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    Created: ${new Date(app.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <span style="background: ${app.status === 'submitted' ? '#10b981' : app.status === 'draft' ? '#f59e0b' : '#6b7280'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                ${app.status || 'draft'}
                            </span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 14px;">
                            <div>
                                <strong>DOT #:</strong> ${app.data.dotNumber || 'N/A'}
                            </div>
                            <div>
                                <strong>MC #:</strong> ${app.data.mcNumber || 'N/A'}
                            </div>
                            <div>
                                <strong>Phone:</strong> ${app.data.businessPhone || 'N/A'}
                            </div>
                            <div>
                                <strong>Email:</strong> ${app.data.email || 'N/A'}
                            </div>
                            <div>
                                <strong>Fleet Size:</strong> ${app.data.fleetSize || 'N/A'}
                            </div>
                            <div>
                                <strong>Effective Date:</strong> ${app.data.effectiveDate || 'N/A'}
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button onclick="viewApplication('${app.id}')" style="flex: 1; background: #2563eb; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button onclick="editApplication('${app.id}')" style="flex: 1; background: #6b7280; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="printApplication('${app.id}')" style="flex: 1; background: #10b981; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-print"></i> Print
                            </button>
                            <button onclick="deleteApplication('${app.id}')" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('') : `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #f9fafb; border-radius: 8px;">
                        <i class="fas fa-file-alt" style="font-size: 48px; color: #d1d5db; margin-bottom: 20px;"></i>
                        <h3 style="margin: 0 0 10px 0; color: #6b7280;">No Quote Applications Yet</h3>
                        <p style="color: #9ca3af; margin-bottom: 20px;">Quote applications will appear here when created from lead profiles.</p>
                        <button onclick="showLeads()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-users"></i> Go to Leads
                        </button>
                    </div>
                `}
            </div>
        `;
        
        // Add to main content area
        const mainContent = document.querySelector('.main-content') || document.querySelector('#content');
        if (mainContent) {
            mainContent.appendChild(section);
        }
        
        // Update active nav
        document.querySelectorAll('.sidebar a').forEach(a => {
            a.classList.remove('active');
        });
        const quoteAppNav = document.querySelector('a[onclick*="showQuoteApplications"]');
        if (quoteAppNav) {
            quoteAppNav.classList.add('active');
        }
    };
    
    // View application
    window.viewApplication = function(appId) {
        const applications = JSON.parse(localStorage.getItem('quoteApplications') || '[]');
        const app = applications.find(a => a.id === appId);
        
        if (app && typeof QuoteApplication !== 'undefined') {
            const quoteApp = new QuoteApplication();
            quoteApp.showApplicationModal(app);
        }
    };
    
    // Edit application
    window.editApplication = function(appId) {
        const applications = JSON.parse(localStorage.getItem('quoteApplications') || '[]');
        const app = applications.find(a => a.id === appId);
        
        if (app && typeof QuoteApplication !== 'undefined') {
            const quoteApp = new QuoteApplication();
            quoteApp.editApplication(app);
        }
    };
    
    // Print application
    window.printApplication = function(appId) {
        const applications = JSON.parse(localStorage.getItem('quoteApplications') || '[]');
        const app = applications.find(a => a.id === appId);
        
        if (app && typeof QuoteApplication !== 'undefined') {
            const quoteApp = new QuoteApplication();
            quoteApp.printApplication(app);
        }
    };
    
    // Delete application
    window.deleteApplication = function(appId) {
        if (confirm('Are you sure you want to delete this quote application?')) {
            let applications = JSON.parse(localStorage.getItem('quoteApplications') || '[]');
            applications = applications.filter(a => a.id !== appId);
            localStorage.setItem('quoteApplications', JSON.stringify(applications));
            
            // Refresh the view
            showQuoteApplications();
        }
    };
    
    // Export all applications
    window.exportAllApplications = function() {
        const applications = JSON.parse(localStorage.getItem('quoteApplications') || '[]');
        
        if (applications.length === 0) {
            alert('No applications to export');
            return;
        }
        
        // Create CSV content
        const headers = ['Created Date', 'Insured Name', 'DOT #', 'MC #', 'Phone', 'Email', 'Fleet Size', 'Effective Date', 'Status'];
        const rows = applications.map(app => [
            new Date(app.createdAt).toLocaleDateString(),
            app.data.insuredName || '',
            app.data.dotNumber || '',
            app.data.mcNumber || '',
            app.data.businessPhone || '',
            app.data.email || '',
            app.data.fleetSize || '',
            app.data.effectiveDate || '',
            app.status || 'draft'
        ]);
        
        // Convert to CSV
        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-applications-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    
    // Initialize
    addQuoteApplicationsToNav();
    
    console.log('Quote Applications View loaded');
})();