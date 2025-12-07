// API Service for comprehensive Vanguard Insurance API
// Dynamic API URL configuration
const getAPIBaseURL = () => {
    // Check for global configuration from api-config.js first
    if (window.VANGUARD_API_URL) {
        console.log('Using configured API URL:', window.VANGUARD_API_URL);
        return window.VANGUARD_API_URL;
    }

    // Check for manually set API URL in localStorage
    const customAPI = localStorage.getItem('VANGUARD_API_URL');
    if (customAPI) {
        console.log('Using custom API URL from localStorage:', customAPI);
        return customAPI;
    }

    // Fallback to the current Cloudflare tunnel
    const defaultURL = 'https://maria-downloadable-lens-looks.trycloudflare.com';
    console.log('Using default API URL:', defaultURL);
    return defaultURL;
};

const API_BASE_URL = getAPIBaseURL();
console.log('API Service using:', API_BASE_URL);

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

const apiService = {
    // Search carriers with filters
    searchCarriers: async function(filters) {
        try {
            // Build clean request body - only include non-empty values
            const searchBody = {
                page: filters.page || 1,
                per_page: filters.limit || 20
            };
            
            // Only add filters that have values
            if (filters.usdot) searchBody.usdot_number = filters.usdot;
            if (filters.company) searchBody.legal_name = filters.company;
            if (filters.state) searchBody.state = filters.state;
            if (filters.mc) searchBody.mc_number = filters.mc;
            if (filters.hasInsurance !== undefined) searchBody.has_insurance = filters.hasInsurance;
            if (filters.minCoverage) searchBody.min_coverage = filters.minCoverage;
            
            console.log('Sending search request:', searchBody);
            
            const response = await fetch(`${API_BASE_URL}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(searchBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching carriers:', error);
            throw error;
        }
    },

    // Get carrier by USDOT number
    getCarrierByDOT: async function(dotNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/carriers/${dotNumber}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching carrier:', error);
            throw error;
        }
    },

    // Get summary statistics
    getStats: async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/stats/summary`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    },

    // Generate leads based on criteria - uses REAL insurance database
    generateLeads: async function(criteria) {
        try {
            console.log('Generating leads with criteria:', criteria);

            // Use the real FMCSA API for expiring insurance leads
            const params = new URLSearchParams({
                days: criteria.expiryDays || criteria.insurance_expiring_days || 30,
                limit: criteria.limit || criteria.count || 500,
                state: criteria.state || '',
                min_premium: criteria.minPremium || 0
            });

            // Add skip days for 5/30 filter
            if (criteria.skipDays && criteria.skipDays > 0) {
                params.append('skip_days', criteria.skipDays);
                console.log(`Applying 5/30 filter: skipping first ${criteria.skipDays} days`);
            }
            
            // Add insurance companies filter if provided
            if (criteria.insuranceCompanies && criteria.insuranceCompanies.length > 0) {
                params.append('insurance_companies', criteria.insuranceCompanies.join(','));
            }
            
            // Always use the backend server API endpoint
            const response = await fetch(`${API_BASE_URL}/api/leads/expiring-insurance?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Handle both array response and object with leads property
            const leadsArray = Array.isArray(data) ? data : (data.leads || []);
            console.log(`Retrieved ${leadsArray.length} real insurance leads from FMCSA database`);
            
            // Pass through the leads with minimal transformation to preserve all fields
            const transformedLeads = leadsArray.map(lead => ({
                // Keep all original fields
                ...lead,
                // Add fields expected by the UI
                usdot_number: lead.dot_number || lead.usdot_number,
                location: `${lead.city || ''}, ${lead.state || ''}`.trim(),
                fleet: lead.power_units || 0,
                status: lead.operating_status || 'Active',
                expiry: lead.policy_renewal_date || lead.insurance_expiry_date || 'N/A',
                insurance_on_file: lead.bipd_insurance_on_file_amount || lead.premium || 0,
                lead_score: parseInt(lead.quality_score === 'HIGH' ? 80 : 50)
            }));
            
            // Save to localStorage
            const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const allLeads = [...existingLeads, ...transformedLeads];
            localStorage.setItem('leads', JSON.stringify(allLeads));

            // Don't apply filter here - the API already filtered with skip_days parameter
            // The API handles the date year inconsistencies correctly
            const finalLeads = transformedLeads;

            if (criteria.skipDays && criteria.skipDays > 0) {
                console.log(`API returned ${finalLeads.length} leads (days 6-30, skipped first ${criteria.skipDays} days)`);
            } else {
                console.log(`Generated ${finalLeads.length} real insurance leads from FMCSA database`);
            }

            return {
                success: true,
                total: finalLeads.length,
                leads: finalLeads
            };
        } catch (error) {
            console.error('Error generating leads:', error);
            
            // Detailed error diagnostics
            let errorMessage = 'Unable to connect to insurance database.\n\n';
            let debugInfo = [];
            
            // Check if it's a network error
            if (error.message.includes('Failed to fetch')) {
                debugInfo.push('❌ Network Error: Cannot reach the insurance API server');
                debugInfo.push('📍 API URL: http://localhost:8002');
                debugInfo.push('🔍 Possible causes:');
                debugInfo.push('  • Insurance database server is not running');
                debugInfo.push('  • Port 8002 is blocked or unavailable');
                debugInfo.push('  • CORS policy blocking the request');
                
                // Check if API is accessible
                try {
                    const healthCheck = await fetch('http://localhost:8002/api/health', { 
                        method: 'GET',
                        mode: 'no-cors' 
                    });
                    debugInfo.push('✅ API server appears to be reachable');
                } catch (e) {
                    debugInfo.push('❌ API server is not accessible from this browser');
                    
                    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
                        debugInfo.push('');
                        debugInfo.push('⚠️ NGROK LIMITATION DETECTED');
                        debugInfo.push('You are accessing Vanguard through ngrok, which cannot reach localhost:8002');
                        debugInfo.push('');
                        debugInfo.push('💡 SOLUTIONS:');
                        debugInfo.push('1. Access Vanguard locally: http://localhost:8897');
                        debugInfo.push('2. OR upgrade ngrok to paid plan for multiple tunnels');
                        debugInfo.push('3. OR set up a reverse proxy on your server');
                        debugInfo.push('');
                        debugInfo.push('✅ The insurance database IS running with 2.2M carriers,');
                        debugInfo.push('   but cannot be accessed through ngrok free tier.');
                    } else {
                        debugInfo.push('💡 Solution: Start the insurance API server');
                        debugInfo.push('   Run: cd /home/corp06/DB-system && python3 demo_real_api_alt_port.py');
                    }
                }
            } else if (error.message.includes('HTTP error')) {
                debugInfo.push(`❌ HTTP Error: ${error.message}`);
                debugInfo.push('🔍 The API server responded with an error');
                
                if (error.message.includes('404')) {
                    debugInfo.push('  • Endpoint not found - API may need update');
                } else if (error.message.includes('500')) {
                    debugInfo.push('  • Server error - Check API logs');
                } else if (error.message.includes('403')) {
                    debugInfo.push('  • Access denied - Check API permissions');
                }
            } else {
                debugInfo.push(`❌ Unexpected Error: ${error.message}`);
                debugInfo.push('📋 Full error details:');
                debugInfo.push(error.stack || error.toString());
            }
            
            // Add timestamp
            debugInfo.push('');
            debugInfo.push(`⏰ Error occurred at: ${new Date().toLocaleString()}`);
            debugInfo.push('📊 Requested criteria:');
            debugInfo.push(JSON.stringify(criteria, null, 2));
            
            errorMessage += debugInfo.join('\n');
            
            // Log to console with formatting
            console.group('🚨 Lead Generation Failed - Diagnostic Report');
            debugInfo.forEach(line => console.log(line));
            console.groupEnd();
            
            // Throw detailed error for UI to handle
            const detailedError = new Error(errorMessage);
            detailedError.diagnostics = debugInfo;
            detailedError.originalError = error;
            throw detailedError;
        }
    },

    // Lead Management Functions
    async getLeads() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/leads`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching leads:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('leads') || '[]');
        }
    },

    async createLead(leadData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/leads`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(leadData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Also save to localStorage for offline support
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            localLeads.push(data);
            localStorage.setItem('leads', JSON.stringify(localLeads));

            return data;
        } catch (error) {
            console.error('Error creating lead:', error);
            // Fallback to localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const newLead = {
                id: `LEAD_${Date.now()}`,
                ...leadData,
                created: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString()
            };
            localLeads.push(newLead);
            localStorage.setItem('leads', JSON.stringify(localLeads));
            return newLead;
        }
    },

    async updateLead(leadId, leadData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(leadData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Also update localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const index = localLeads.findIndex(lead => lead.id === leadId);
            if (index !== -1) {
                localLeads[index] = { ...localLeads[index], ...leadData };
                localStorage.setItem('leads', JSON.stringify(localLeads));
            }

            return data;
        } catch (error) {
            console.error('Error updating lead:', error);
            // Fallback to localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const index = localLeads.findIndex(lead => lead.id === leadId);
            if (index !== -1) {
                localLeads[index] = { ...localLeads[index], ...leadData };
                localStorage.setItem('leads', JSON.stringify(localLeads));
                return localLeads[index];
            }
            throw error;
        }
    },

    async deleteLead(leadId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Also remove from localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const filteredLeads = localLeads.filter(lead => lead.id !== leadId);
            localStorage.setItem('leads', JSON.stringify(filteredLeads));

            return { success: true };
        } catch (error) {
            console.error('Error deleting lead:', error);
            // Fallback to localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const filteredLeads = localLeads.filter(lead => lead.id !== leadId);
            localStorage.setItem('leads', JSON.stringify(filteredLeads));
            return { success: true };
        }
    },

    // Policy Management Functions
    async getPolicies() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/policies`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching policies:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('policies') || '[]');
        }
    },

    async createPolicy(policyData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/policies`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(policyData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Also save to localStorage
            const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
            localPolicies.push(data);
            localStorage.setItem('policies', JSON.stringify(localPolicies));

            return data;
        } catch (error) {
            console.error('Error creating policy:', error);
            // Fallback to localStorage
            const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
            const newPolicy = {
                id: `POLICY_${Date.now()}`,
                ...policyData,
                created: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString()
            };
            localPolicies.push(newPolicy);
            localStorage.setItem('policies', JSON.stringify(localPolicies));
            return newPolicy;
        }
    },

    async updatePolicy(policyId, policyData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(policyData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Also update localStorage
            const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
            const index = localPolicies.findIndex(policy => policy.id === policyId);
            if (index !== -1) {
                localPolicies[index] = { ...localPolicies[index], ...policyData };
                localStorage.setItem('policies', JSON.stringify(localPolicies));
            }

            return data;
        } catch (error) {
            console.error('Error updating policy:', error);
            throw error;
        }
    },

    // Reminders/Tasks Functions
    async getReminders() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reminders`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching reminders:', error);
            // Fallback to localStorage
            const personalTodos = JSON.parse(localStorage.getItem('personalTodos') || '[]');
            const agencyTodos = JSON.parse(localStorage.getItem('agencyTodos') || '[]');
            return [...personalTodos, ...agencyTodos];
        }
    },

    async createReminder(reminderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reminders`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(reminderData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating reminder:', error);
            throw error;
        }
    },

    // Authentication Functions
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();

            // Store token and user info
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    },

    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error during registration:', error);
            throw error;
        }
    },

    // Dashboard Statistics
    async getDashboardStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/stats/dashboard`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                // Don't treat 404 as an error, just return null to trigger fallback
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            // Suppress API errors and return null to trigger localStorage fallback
            return null;
        }
    },

    // Get comprehensive carrier profile
    async getCarrierProfile(dotNumber) {
        try {
            const API_BASE_URL = this.getAPIBaseURL();
            const response = await fetch(`${API_BASE_URL}/api/carrier/profile/${dotNumber}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Carrier profile loaded:', data);
            return data;
        } catch (error) {
            console.error('Error fetching carrier profile:', error);
            throw error;
        }
    }
};

// Make it globally available
window.apiService = apiService;