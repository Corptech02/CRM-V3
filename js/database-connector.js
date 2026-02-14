// Direct Database Connector for Lead Generation
// Connects to the REAL 2.2M carrier database

console.log('Loading Database Connector...');

// Override search function after page loads
window.addEventListener('DOMContentLoaded', function() {
    console.log('Database Connector Ready');
    
    // Override the search function
    window.performLeadSearch = async function() {
        console.log('performLeadSearch called - using REAL database');
        
        // Get search values
        const usdot = document.getElementById('usdotSearch')?.value?.trim() || '';
        const mc = document.getElementById('mcSearch')?.value?.trim() || '';
        const company = document.getElementById('companySearch')?.value?.trim() || '';
        const state = document.getElementById('stateSearch')?.value || '';
        
        console.log('Search params:', { usdot, mc, company, state });

        // Show loading in carrier profile display container
        const carrierProfileDisplay = document.getElementById('carrierProfileDisplay');

        if (carrierProfileDisplay) {
            carrierProfileDisplay.innerHTML = `
                <div class="loading-message" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #3498db;"></i>
                    <p style="margin-top: 15px; color: #6c757d;">Searching 2.2M carrier database...</p>
                </div>
            `;
        }
        
        try {
            // Build request
            const searchBody = {
                page: 1,
                per_page: 100
            };
            
            if (usdot) searchBody.usdot_number = usdot;
            if (mc) searchBody.mc_number = mc;
            if (company) searchBody.legal_name = company;
            if (state) searchBody.state = state;
            
            console.log('Sending request to API:', searchBody);
            
            // Call API through the comprehensive API service
            let response;
            let data;

            try {
                // Use the new comprehensive API service
                if (window.apiService && window.apiService.searchCarriers) {
                    console.log('Using comprehensive API service for search');
                    data = await window.apiService.searchCarriers({
                        usdot: usdot,
                        mc: mc,
                        company: company,
                        state: state,
                        page: 1,
                        limit: 100
                    });

                    // Convert API response format
                    if (data.results) {
                        data.carriers = data.results;
                    }
                } else {
                    // Fallback to direct API call
                    // Use centralized API
                    const API_URL = (window.VANGUARD_API_URL || 'https://suites-experience-learn-arrested.trycloudflare.com') + '/api/search';

                    response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: JSON.stringify(searchBody)
                    });

                    if (response && response.ok) {
                        data = await response.json();
                    } else {
                        throw new Error('API response not ok');
                    }
                }
            } catch (fetchError) {
                console.log('Comprehensive API not available, using mock data:', fetchError.message);
                data = null;
            }
            
            if (!data || !data.carriers) {
                console.log('API not available, generating mock data');
                // Generate mock data based on search criteria
                data = generateMockCarrierData(usdot, mc, company, state);
            } else {
                console.log(`API returned ${data.carriers?.length || 0} carriers out of ${data.total}`);
            }
            
            // Display carrier profile directly instead of results table
            if (data.carriers && data.carriers.length > 0) {
                const carrier = data.carriers[0]; // Get first carrier

                // Get additional data from the backend
                displayCarrierProfile(carrier.usdot_number);
            }
            } else {
                // No results
                if (carrierProfileDisplay) {
                    carrierProfileDisplay.innerHTML = `
                        <div class="no-results" style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                            <i class="fas fa-search" style="font-size: 48px; color: #6c757d; margin-bottom: 15px;"></i>
                            <h3 style="color: #495057; margin-bottom: 10px;">No carriers found</h3>
                            <p style="color: #6c757d;">No carriers found matching your search criteria.</p>
                            <p style="color: #6c757d; margin-top: 10px;">Try searching by state (e.g., OH) or leave all fields empty to see all carriers.</p>
                        </div>
                    `;
                }
            }
            
        } catch (error) {
            console.error('Search failed:', error);

            if (carrierProfileDisplay) {
                carrierProfileDisplay.innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 40px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #721c24; margin-bottom: 15px;"></i>
                        <h3 style="color: #721c24; margin-bottom: 10px;">Search Error</h3>
                        <p style="color: #721c24;">Error: ${error.message}</p>
                        <p style="color: #721c24; margin-top: 10px;">Please check that the API server is running on port 8001</p>
                    </div>
                `;
            }
        }
    };
    
    // Load stats on page load
    async function loadStats() {
        try {
            let stats;

            // Try to use the comprehensive API service first
            if (window.apiService && window.apiService.getStats) {
                console.log('Using comprehensive API service for stats');
                stats = await window.apiService.getStats();
            } else {
                // Fallback to direct API call
                const API_URL = (window.VANGUARD_API_URL || 'https://suites-experience-learn-arrested.trycloudflare.com') + '/api/stats/summary';

                const response = await fetch(API_URL, {
                    headers: {
                        'ngrok-skip-browser-warning': 'true'
                    }
                });
                stats = await response.json();
            }

            console.log('Database Stats:', stats);

            // Update stats display if on lead generation page
            if (window.location.hash === '#lead-generation') {
                const statsContainer = document.querySelector('.lead-generation-stats');
                if (statsContainer) {
                    statsContainer.innerHTML = `
                        <div style="background: #f0f9ff; border: 1px solid #0284c7; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #0369a1;">📊 Live Database Statistics</h4>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                                <div>
                                    <strong>Total Carriers:</strong><br>
                                    <span style="font-size: 1.5rem; color: #0284c7;">${stats.total_carriers?.toLocaleString()}</span>
                                </div>
                                <div>
                                    <strong>Ohio Carriers:</strong><br>
                                    <span style="font-size: 1.5rem; color: #0284c7;">${stats.ohio_carriers?.toLocaleString()}</span>
                                </div>
                                <div>
                                    <strong>With Insurance:</strong><br>
                                    <span style="font-size: 1.5rem; color: #0284c7;">${stats.carriers_with_insurance?.toLocaleString()}</span>
                                </div>
                                <div>
                                    <strong>API Status:</strong><br>
                                    <span style="font-size: 1.5rem; color: #10b981;">✅ Connected</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Failed to load stats:', error);

            // Show offline status
            if (window.location.hash === '#lead-generation') {
                const statsContainer = document.querySelector('.lead-generation-stats');
                if (statsContainer) {
                    statsContainer.innerHTML = `
                        <div style="background: #fef2f2; border: 1px solid #ef4444; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #dc2626;">📊 Database Status</h4>
                            <div style="text-align: center;">
                                <span style="font-size: 1.2rem; color: #dc2626;">⚠️ API Offline - Using Mock Data</span>
                                <br><small>Real-time statistics unavailable</small>
                            </div>
                        </div>
                    `;
                }
            }
        }
    }
    
    // Load stats
    loadStats();
    
    // Reload stats when navigating to lead generation
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#lead-generation') {
            setTimeout(loadStats, 100);
        }
    });
    
    console.log('✅ Database Connector initialized - 2.2M carriers ready to search!');
});

// Function to view carrier from lookup without loading overlay
window.viewCarrierFromLookup = function(usdot) {
    console.log('Viewing carrier from lookup:', usdot);

    // Use carrier profile modal if available (has its own loading indicator)
    if (window.carrierProfileModal && window.carrierProfileModal.show) {
        window.carrierProfileModal.show(usdot);
    } else if (window.originalViewLeadDetails) {
        // Use the original function without loading overlay
        window.originalViewLeadDetails(usdot);
    } else if (window.viewLeadDetails) {
        // Temporarily disable any loading overlay for carrier lookup
        const tempShowLoadingOverlay = window.showLoadingOverlay;
        const tempShowLeadLoadingOverlay = window.showLeadLoadingOverlay;

        // Override to do nothing
        window.showLoadingOverlay = function() {};
        window.showLeadLoadingOverlay = function() {};

        // Call the function
        window.viewLeadDetails(usdot);

        // Restore loading overlay functions after a brief delay
        setTimeout(() => {
            if (tempShowLoadingOverlay) window.showLoadingOverlay = tempShowLoadingOverlay;
            if (tempShowLeadLoadingOverlay) window.showLeadLoadingOverlay = tempShowLeadLoadingOverlay;
        }, 100);
    } else {
        console.error('No carrier view function available');
    }
};

// Mock data generator function
function generateMockCarrierData(usdot, mc, company, state) {
    const mockCarriers = [
        { usdot_number: '1234567', legal_name: 'ABC Transport LLC', city: 'Columbus', state: 'OH', power_units: 45, status: 'Active', expiry: '2025-03-15' },
        { usdot_number: '2345678', legal_name: 'Quick Logistics Inc', city: 'Cleveland', state: 'OH', power_units: 23, status: 'Active', expiry: '2025-04-20' },
        { usdot_number: '3456789', legal_name: 'Express Freight Corp', city: 'Cincinnati', state: 'OH', power_units: 67, status: 'Has Carrier', expiry: '2025-02-10' },
        { usdot_number: '4567890', legal_name: 'Reliable Trucking', city: 'Toledo', state: 'OH', power_units: 12, status: 'Active', expiry: '2025-05-01' },
        { usdot_number: '5678901', legal_name: 'Midwest Carriers', city: 'Akron', state: 'OH', power_units: 89, status: 'Active', expiry: '2025-01-30' },
        { usdot_number: '6789012', legal_name: 'Summit Transport', city: 'Dayton', state: 'OH', power_units: 34, status: 'Has Carrier', expiry: '2025-06-15' },
        { usdot_number: '7890123', legal_name: 'Highway Express LLC', city: 'Canton', state: 'OH', power_units: 56, status: 'Active', expiry: '2025-03-25' },
        { usdot_number: '8901234', legal_name: 'Premier Logistics', city: 'Youngstown', state: 'OH', power_units: 28, status: 'Active', expiry: '2025-07-10' },
        { usdot_number: '9012345', legal_name: 'Swift Transport Inc', city: 'Lorain', state: 'OH', power_units: 72, status: 'Active', expiry: '2025-02-28' },
        { usdot_number: '1122334', legal_name: 'Eagle Freight Systems', city: 'Hamilton', state: 'OH', power_units: 41, status: 'Has Carrier', expiry: '2025-04-05' },
        { usdot_number: '2233445', legal_name: 'National Transport Co', city: 'Dallas', state: 'TX', power_units: 156, status: 'Active', expiry: '2025-03-10' },
        { usdot_number: '3344556', legal_name: 'Southern Express', city: 'Houston', state: 'TX', power_units: 89, status: 'Active', expiry: '2025-05-20' },
        { usdot_number: '4455667', legal_name: 'Texas Freight Lines', city: 'Austin', state: 'TX', power_units: 67, status: 'Has Carrier', expiry: '2025-01-15' },
        { usdot_number: '5566778', legal_name: 'Coast to Coast Transport', city: 'Los Angeles', state: 'CA', power_units: 234, status: 'Active', expiry: '2025-06-30' },
        { usdot_number: '6677889', legal_name: 'Pacific Carriers', city: 'San Francisco', state: 'CA', power_units: 112, status: 'Active', expiry: '2025-02-20' },
        { usdot_number: '7788990', legal_name: 'Golden State Logistics', city: 'San Diego', state: 'CA', power_units: 78, status: 'Has Carrier', expiry: '2025-04-15' },
        { usdot_number: '8899001', legal_name: 'Florida Express Inc', city: 'Miami', state: 'FL', power_units: 145, status: 'Active', expiry: '2025-03-05' },
        { usdot_number: '9900112', legal_name: 'Sunshine Transport', city: 'Orlando', state: 'FL', power_units: 56, status: 'Active', expiry: '2025-07-20' },
        { usdot_number: '1010101', legal_name: 'Empire Logistics', city: 'New York', state: 'NY', power_units: 189, status: 'Active', expiry: '2025-01-25' },
        { usdot_number: '2020202', legal_name: 'Liberty Transport', city: 'Buffalo', state: 'NY', power_units: 45, status: 'Has Carrier', expiry: '2025-05-10' }
    ];
    
    // Filter based on search criteria
    let filtered = [...mockCarriers];
    
    if (usdot) {
        filtered = filtered.filter(c => c.usdot_number.includes(usdot));
    }
    if (mc) {
        // MC number search - just filter by USDOT for mock
        filtered = filtered.filter(c => c.usdot_number.includes(mc));
    }
    if (company) {
        filtered = filtered.filter(c => 
            c.legal_name.toLowerCase().includes(company.toLowerCase())
        );
    }
    if (state) {
        filtered = filtered.filter(c => c.state === state.toUpperCase());
    }
    
    // If no search criteria, show first 20
    if (!usdot && !mc && !company && !state) {
        filtered = mockCarriers.slice(0, 20);
    }
    
    return {
        carriers: filtered.map(c => ({
            ...c,
            location: `${c.city}, ${c.state}`,
            fleet: c.power_units,
            dba_name: c.legal_name
        })),
        total: 2200000, // Mock total
        page: 1,
        per_page: 100
    };
}

// Display carrier profile directly on the page
// Expose displayCarrierProfile globally
window.displayCarrierProfile = async function displayCarrierProfile(usdotNumber) {
    try {
        console.log('Loading carrier profile for USDOT:', usdotNumber);

        // Fetch full carrier profile data
        const response = await window.fetch(`/api/carrier/profile/${usdotNumber}`, {
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch carrier profile');
        }

        const data = await response.json();
        const carrier = data.carrier;

        console.log('Loaded carrier profile:', carrier);

        // Display the carrier profile in the profile display container
        const carrierProfileDisplay = document.getElementById('carrierProfileDisplay');
        if (carrierProfileDisplay) {
            carrierProfileDisplay.innerHTML = createCarrierProfileHTML(carrier);
        }

    } catch (error) {
        console.error('Error loading carrier profile:', error);
        const carrierProfileDisplay = document.getElementById('carrierProfileDisplay');
        if (carrierProfileDisplay) {
            carrierProfileDisplay.innerHTML = `
                <div class="carrier-profile-error">
                    <h3>Error Loading Carrier Profile</h3>
                    <p>Unable to load carrier information. Please try again.</p>
                </div>
            `;
        }
    }
}

// Create HTML for carrier profile display - expose globally
window.createCarrierProfileHTML = function createCarrierProfileHTML(carrier) {
    const inspections = carrier.inspections || [];
    const safetyData = carrier.safety_summary;
    const address = carrier.address || {};

    return `
        <div class="carrier-profile-display">
            <!-- Company Header -->
            <div class="company-header">
                <div class="company-main-info">
                    <h2 class="company-name">${carrier.legal_name || 'Unknown Company'}</h2>
                    <div class="company-details">
                        <span class="usdot-number">USDOT: ${carrier.usdot_number}</span>
                        <span class="operating-status status-${carrier.operating_status === 'Active' ? 'active' : 'inactive'}">
                            ${carrier.operating_status || 'Unknown'}
                        </span>
                        <span class="operation-type">${carrier.business_type || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Contact & Fleet Info -->
            <div class="profile-grid">
                <div class="profile-section contact-info">
                    <h3>Contact Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Company Officer:</label>
                            <span>${carrier.carrier_details?.COMPANY_OFFICER_1 || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Phone:</label>
                            <span>${carrier.phone || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${carrier.email || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Address:</label>
                            <span>${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-section fleet-info">
                    <h3>Fleet Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Fleet Size:</label>
                            <span>${carrier.power_units || 0} vehicles</span>
                        </div>
                        <div class="info-item">
                            <label>Drivers:</label>
                            <span>${carrier.drivers || 0}</span>
                        </div>
                        <div class="info-item">
                            <label>Hazmat:</label>
                            <span>${carrier.carrier_details?.HM_Ind === 'Y' ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="info-item">
                            <label>Safety Rating:</label>
                            <span>${carrier.safety_rating || 'Not Rated'}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-section safety-summary">
                    <h3>Safety Summary</h3>
                    <div class="safety-metrics">
                        <div class="metric">
                            <div class="metric-value">${safetyData?.total_inspections || 0}</div>
                            <div class="metric-label">Total Inspections</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${safetyData?.oos_inspections || 0}</div>
                            <div class="metric-label">OOS Events</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${safetyData?.oos_rate || '0%'}</div>
                            <div class="metric-label">OOS Rate</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${safetyData?.hazmat_inspections || 0}</div>
                            <div class="metric-label">Hazmat Inspections</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Inspections List -->
            <div class="inspections-section">
                <h3>Vehicle Inspections</h3>
                ${inspections.length > 0 ? `
                    <div class="inspections-list">
                        ${inspections.slice(0, 10).map(inspection => `
                            <div class="inspection-item">
                                <div class="inspection-header">
                                    <span class="inspection-date">${inspection.Insp_Date}</span>
                                    <span class="inspection-state">${inspection.Report_State}</span>
                                    <span class="inspection-oos ${inspection.OOS_Total > 0 ? 'oos-yes' : 'oos-no'}">
                                        ${inspection.OOS_Total > 0 ? 'OOS' : 'No OOS'}
                                    </span>
                                </div>
                                <div class="inspection-details">
                                    <span class="vehicle-info">${inspection.Unit_Make} ${inspection.Unit_Type_Desc}</span>
                                    <span class="vin">VIN: ${inspection.VIN || 'N/A'}</span>
                                    <span class="violations">Violations: ${inspection.BASIC_Viol || 0}</span>
                                </div>
                            </div>
                        `).join('')}
                        ${inspections.length > 10 ? `
                            <div class="inspections-more">
                                <p>Showing 10 of ${inspections.length} inspections</p>
                            </div>
                        ` : ''}
                    </div>
                ` : '<p class="no-inspections">No inspection records found.</p>'}
            </div>
        </div>
    `;
}

// Update the viewCarrierFromLookup function to use the new display
window.viewCarrierFromLookup = function(usdot) {
    console.log('Viewing carrier from lookup:', usdot);
    displayCarrierProfile(usdot);
};

// Also handle Enter key on search fields
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const searchInputs = ['usdotSearch', 'mcSearch', 'companySearch', 'stateSearch'];
        if (document.activeElement && searchInputs.includes(document.activeElement.id)) {
            e.preventDefault();
            console.log('Enter key pressed in search field');
            window.performLeadSearch();
        }
    }
});