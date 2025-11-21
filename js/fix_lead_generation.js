// Lead Generation API Connector for Vanguard AMS
// Connects to the real 2.2M carrier database API

const API_BASE_URL = 'http://localhost:8001';

// Wait for DOM to load
setTimeout(() => {
    console.log('Connecting to 2.2M carrier database API...');
    
    // Override the performLeadSearch function to use real API
    window.performLeadSearch = async function() {
        const usdot = document.getElementById('usdotSearch')?.value || '';
        const mc = document.getElementById('mcSearch')?.value || '';
        const company = document.getElementById('companySearch')?.value || '';
        const state = document.getElementById('stateSearch')?.value || '';
        
        // Show loading state
        const resultsBody = document.getElementById('leadResultsBody');
        if (resultsBody) {
            resultsBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <i class="fas fa-spinner fa-spin"></i> Searching 2.2M carrier database...
                    </td>
                </tr>
            `;
        }
        
        try {
            // Build request body
            const searchBody = {
                page: 1,
                per_page: 100
            };
            
            if (usdot) searchBody.usdot_number = usdot;
            if (mc) searchBody.mc_number = mc;
            if (company) searchBody.legal_name = company;
            if (state) searchBody.state = state;
            
            console.log('Searching database with:', searchBody);
            
            // Make API request
            const response = await fetch(`${API_BASE_URL}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchBody)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Found ${data.total} carriers, showing ${data.carriers.length}`);
            
            // Transform data for display
            const results = data.carriers.map(carrier => ({
                usdot: carrier.usdot_number,
                company: carrier.legal_name || carrier.dba_name,
                location: carrier.location,
                fleet: carrier.fleet || carrier.power_units || '0',
                status: carrier.status,
                expiry: carrier.expiry,
                insurance: carrier.insurance_on_file || 0,
                phone: carrier.phone,
                email: carrier.email
            }));
            
            displayLeadResults(results);
            
        } catch (error) {
            console.error('Search error:', error);
            
            // If API fails, show message
            if (resultsBody) {
                resultsBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-danger">
                            Error connecting to database. Please ensure API is running.
                        </td>
                    </tr>
                `;
            }
        }
    };

    // Override displayLeadResults for proper display
    window.displayLeadResults = function(results) {
        const resultsBody = document.getElementById('leadResultsBody');
        const resultsCount = document.querySelector('.results-count');
        
        if (!results || results.length === 0) {
            if (resultsBody) {
                resultsBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">No results found. Try adjusting your search criteria.</td>
                    </tr>
                `;
            }
            if (resultsCount) {
                resultsCount.textContent = '0 leads found';
            }
            return;
        }
        
        if (resultsCount) {
            resultsCount.textContent = `${results.length} leads found (from 2.2M+ carriers)`;
        }
        
        if (resultsBody) {
            resultsBody.innerHTML = results.map(result => `
                <tr>
                    <td><input type="checkbox" class="lead-checkbox" value="${result.usdot}"></td>
                    <td class="font-mono">${result.usdot}</td>
                    <td><strong>${result.company}</strong></td>
                    <td>${result.location}</td>
                    <td>${result.fleet} vehicles</td>
                    <td>
                        <span class="status-badge ${result.status === 'Active' ? 'status-active' : result.status === 'Has Carrier' ? 'status-warning' : 'status-inactive'}">
                            ${result.status}
                        </span>
                    </td>
                    <td>${result.expiry}</td>
                    <td>
                        <button class="btn-small btn-icon" onclick="viewLeadDetails('${result.usdot}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-small btn-icon" onclick="contactLead('${result.usdot}')" title="Contact">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    };

    // Load database stats on page load
    window.loadDatabaseStats = async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/stats/summary`);
            const stats = await response.json();
            
            console.log('Database Statistics:', stats);
            
            // Update stats display if element exists
            const statsElement = document.querySelector('.lead-generation-stats');
            if (statsElement) {
                statsElement.innerHTML = `
                    <div style="background: #f0f9ff; border: 1px solid #0284c7; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #0369a1;">📊 Live Database Statistics</h4>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                            <div>
                                <strong>Total Carriers:</strong><br>
                                <span style="font-size: 1.5rem; color: #0284c7;">${stats.total_carriers?.toLocaleString() || '0'}</span>
                            </div>
                            <div>
                                <strong>Ohio Carriers:</strong><br>
                                <span style="font-size: 1.5rem; color: #0284c7;">${stats.ohio_carriers?.toLocaleString() || '0'}</span>
                            </div>
                            <div>
                                <strong>With Insurance:</strong><br>
                                <span style="font-size: 1.5rem; color: #0284c7;">${stats.carriers_with_insurance?.toLocaleString() || '0'}</span>
                            </div>
                            <div>
                                <strong>API Status:</strong><br>
                                <span style="font-size: 1.5rem; color: #10b981;">✅ ${stats.api_status || 'Connected'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // Load stats immediately
    loadDatabaseStats();
    
    // Add stats display to lead generation page if needed
    if (window.location.hash === '#lead-generation') {
        setTimeout(() => {
            const leadGenView = document.querySelector('.lead-generation-view');
            if (leadGenView && !document.querySelector('.lead-generation-stats')) {
                const statsDiv = document.createElement('div');
                statsDiv.className = 'lead-generation-stats';
                leadGenView.insertBefore(statsDiv, leadGenView.firstChild.nextSibling);
                loadDatabaseStats();
            }
        }, 100);
    }
    
    console.log('✅ Lead Generation connected to REAL 2.2M carrier database!');

}, 500);

// Make search work on Enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const searchInputs = ['usdotSearch', 'mcSearch', 'companySearch', 'stateSearch'];
        const activeElement = document.activeElement;
        
        if (activeElement && searchInputs.includes(activeElement.id)) {
            e.preventDefault();
            performLeadSearch();
        }
    }
});

// Handle lead details view
window.viewLeadDetails = function(usdot) {
    alert(`View details for USDOT: ${usdot}\n\nFull carrier details will be displayed here.`);
};

// Handle contact lead
window.contactLead = function(usdot) {
    alert(`Contact carrier USDOT: ${usdot}\n\nContact form will open here.`);
};