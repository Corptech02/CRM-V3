
// Unified API Service for Vanguard AMS
// Connects to all data sources

const API_SERVICES = {
    // Local FMCSA Database
    local: {
        url: 'http://localhost:8001',
        search: async (filters) => {
            const response = await fetch(`${API_SERVICES.local.url}/api/search`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(filters)
            });
            return response.json();
        }
    },
    
    // Transportation.gov API
    transportation: {
        url: 'https://data.transportation.gov/resource/az4n-8mr2.json',
        search: async (filters) => {
            const params = new URLSearchParams();
            if (filters.dot) params.append('dot_number', filters.dot);
            if (filters.state) params.append('phy_state', filters.state);
            params.append('$limit', filters.limit || 100);
            
            const response = await fetch(`${API_SERVICES.transportation.url}?${params}`);
            return response.json();
        }
    },
    
    // Unified search across all sources
    unifiedSearch: async (filters) => {
        try {
            // Search local database first (fastest)
            const localResults = await API_SERVICES.local.search(filters);
            
            // If needed, augment with API data
            if (localResults.carriers.length < 10 && filters.dot) {
                const apiResults = await API_SERVICES.transportation.search({
                    dot: filters.dot,
                    limit: 10
                });
                
                // Merge results
                const merged = [...localResults.carriers];
                for (const apiCarrier of apiResults) {
                    if (!merged.find(c => c.usdot_number === apiCarrier.dot_number)) {
                        merged.push({
                            usdot_number: apiCarrier.dot_number,
                            legal_name: apiCarrier.legal_name,
                            city: apiCarrier.phy_city,
                            state: apiCarrier.phy_state,
                            phone: apiCarrier.phone,
                            email: apiCarrier.email_address,
                            power_units: apiCarrier.power_units,
                            status: apiCarrier.status_code === 'A' ? 'Active' : 'Inactive'
                        });
                    }
                }
                
                return {
                    ...localResults,
                    carriers: merged,
                    sources: ['local', 'transportation.gov']
                };
            }
            
            return {...localResults, sources: ['local']};
            
        } catch (error) {
            console.error('Unified search error:', error);
            throw error;
        }
    }
};

// Make globally available
window.unifiedAPI = API_SERVICES;
