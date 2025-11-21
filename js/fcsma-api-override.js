// Enhanced API Override v4 - Month-Based Filtering with State Optimization
(function() {
    'use strict';

    console.log('🔧 🔧 🔧 OVERRIDE SCRIPT LOADING (2025-10-10 15:30) 🔧 🔧 🔧');
    console.log('🔧 Enhanced API Override v4.0: Month-based filtering with state optimization...');

    // Store original fetch function
    const originalFetch = window.fetch;

    // Override fetch function to intercept API calls
    window.fetch = async function(url, options = {}) {
        // Check if this is the leads API call we want to intercept
        if (typeof url === 'string' && url.includes('/api/leads/expiring-insurance')) {
            console.log('🎯 Enhanced Override v3: Intercepted leads API call:', url);
            return await handleMatchedCarriersRequest(url, options);
        }

        // For all other requests, use original fetch
        return originalFetch.apply(this, arguments);
    };

    // Wait for apiService to be available (backup method)
    function waitForAPIService() {
        console.log('🔍 Checking for apiService...', typeof window.apiService, window.apiService ? 'exists' : 'missing');
        if (typeof window.apiService !== 'undefined' && window.apiService.generateLeads) {
            console.log('✅ Found apiService, overriding with matched carriers v3...');
            overrideGenerateLeads();
        } else {
            console.log('⏳ Waiting for apiService... (will retry in 500ms)');
            setTimeout(waitForAPIService, 500);
        }
    }

    function overrideGenerateLeads() {
        // Store original function as backup
        window.apiService.originalGenerateLeads = window.apiService.generateLeads;

        // Override with matched carriers function
        window.apiService.generateLeads = async function(criteria) {
            try {
                console.log('🎯 Enhanced Override v3: Generating leads with criteria:', criteria);

                // Query matched carriers data - FORCE SUCCESS
                const matchedCarriersLeads = await queryMatchedCarriersDataForced(criteria);

                console.log(`Retrieved ${matchedCarriersLeads.length} real leads from matched carriers database v3`);

                // Transform to match expected format
                const transformedLeads = matchedCarriersLeads.map(lead => ({
                    // Keep ALL original fields
                    ...lead,
                    // Map fields for UI compatibility
                    usdot_number: lead.dot_number || lead.fmcsa_dot_number || '',
                    location: `${lead.city || ''}, ${lead.state || ''}`.trim(),
                    fleet: lead.power_units || 0,
                    status: lead.operating_status || 'Active',
                    expiry: lead.insurance_expiry || lead.renewal_date || '',
                    insurance_on_file: lead.estimated_premium || 0,
                    lead_score: lead.lead_score || 75,
                    quality_score: lead.lead_score >= 80 ? 'HIGH' : (lead.lead_score >= 60 ? 'MEDIUM' : 'LOW'),
                    email: lead.email_address || '',
                    phone: lead.phone || '',
                    renewal_date: lead.insurance_expiry || lead.renewal_date || '',
                    id: `matched_${lead.dot_number}_${Date.now()}`,
                    source: 'Matched Carriers Database v3'
                }));

                // Return in expected format
                return {
                    success: true,
                    total: transformedLeads.length,
                    leads: transformedLeads,
                    metadata: {
                        source: 'Optimized Month-Based API v4',
                        data_file: 'state_optimized_441k_database',
                        filtering_method: 'month_based_insurance_expiry',
                        criteria: criteria,
                        timestamp: new Date().toISOString()
                    }
                };

            } catch (error) {
                console.error('🚨 Enhanced Override v4 error:', error);
                // NO FALLBACK - FORCE THE ISSUE
                throw error;
            }
        };

        console.log('✅ Enhanced Override v4: apiService.generateLeads function replaced with month-based filtering');
    }

    // FORCED query function - no fallback to simulation
    async function queryMatchedCarriersDataForced(criteria) {
        console.log('📊 FORCED: Querying matched carriers database with criteria:', criteria);
        console.log('🔍 FORCED: Criteria type and details:', typeof criteria, JSON.stringify(criteria, null, 2));

        // Use existing API endpoint with month-based filtering enabled
        const backendUrl = '/api/matched-carriers-leads?' + new URLSearchParams({
            state: criteria.state || '',
            days: criteria.expiryDays || criteria.daysUntilExpiry || 30,
            insurance_companies: (criteria.insuranceCompanies || []).map(company => {
                // Smart company name extraction for better matching
                const name = company.toLowerCase();
                if (name.includes('progressive')) return 'Progressive';
                if (name.includes('geico')) return 'GEICO';
                if (name.includes('great west')) return 'Great West';
                if (name.includes('canal')) return 'Canal';
                if (name.includes('acuity')) return 'Acuity';
                if (name.includes('northland')) return 'Northland';
                if (name.includes('cincinnati')) return 'Cincinnati';
                if (name.includes('auto owners')) return 'Auto Owners';
                if (name.includes('sentry')) return 'Sentry';
                if (name.includes('erie')) return 'Erie';
                if (name.includes('travelers')) return 'Travelers';
                if (name.includes('bitco')) return 'Bitco';
                if (name.includes('carolina')) return 'Carolina';
                if (name.includes('state farm')) return 'State Farm';
                if (name.includes('allstate')) return 'Allstate';
                if (name.includes('nationwide')) return 'Nationwide';
                // Fallback to first word for unknown companies
                return company.split(' ')[0];
            }).join(','),
            limit: Math.min(criteria.limit || 1000, 1000),
            require_email: 'false',
            require_phone: 'false',
            month_based: 'true'
        });

        console.log('🔗 FORCED: Calling backend with permissive params:', backendUrl);

        try {
            console.log('🌐 FORCED: About to call originalFetch with URL:', backendUrl);
            const response = await originalFetch(backendUrl);
            console.log('📡 FORCED Response received:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend error response:', errorText);
                throw new Error(`Backend responded with ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('📊 FORCED Backend data received - total leads:', data.total || data.total_leads);
            console.log('🔍 DETAILED DEBUG - data.success:', data.success, 'type:', typeof data.success);
            console.log('🔍 DETAILED DEBUG - data.leads:', data.leads ? 'exists' : 'missing', 'isArray:', Array.isArray(data.leads), 'length:', data.leads ? data.leads.length : 'N/A');
            console.log('🔍 DETAILED DEBUG - Full response object keys:', Object.keys(data));

            if (data.success && Array.isArray(data.leads)) {
                console.log(`✅ SUCCESS: ${data.leads.length} leads returned from optimized API`);
                if (data.leads.length > 0) {
                    console.log('🎯 First lead sample:', data.leads[0]);
                    console.log('🎯 Method used:', data.criteria?.method || 'unknown');
                }

                // No client-side filtering needed - optimized API handles month-based filtering
                console.log(`📊 Using API-filtered results: ${data.leads.length} leads ready for frontend`);
                return data.leads;
            } else {
                console.log('🔍 Response data:', data);
                throw new Error(data.message || `Backend returned status=${data.status}, leads=${Array.isArray(data.leads) ? data.leads.length : 'not array'}`);
            }

        } catch (error) {
            console.error('🚨 FORCED Backend call failed:', error);
            console.error('🚨 NO FALLBACK - This should work with 383K records!');
            throw error;
        }
    }

    // Handle intercepted matched carriers requests
    async function handleMatchedCarriersRequest(url, options) {
        console.log('📊 FORCED Processing matched carriers leads request:', url);

        try {
            // Parse URL parameters
            const urlObj = new URL(url);
            const params = urlObj.searchParams;

            const criteria = {
                state: params.get('state') || '',
                expiryDays: parseInt(params.get('days')) || 30,
                daysUntilExpiry: parseInt(params.get('days')) || 30,
                limit: parseInt(params.get('limit')) || 100,
                skipDays: parseInt(params.get('skip_days')) || 0,
                insuranceCompanies: params.get('insurance_companies') ?
                    decodeURIComponent(params.get('insurance_companies')).split(',').map(c => c.trim()) : []
            };

            console.log('🎯 FORCED Enhanced criteria extracted:', criteria);

            // Query matched carriers database with FORCE
            const matchedCarriersLeads = await queryMatchedCarriersDataForced(criteria);

            // Create response object
            const responseData = {
                success: true,
                total: matchedCarriersLeads.length,
                leads: matchedCarriersLeads,
                metadata: {
                    source: 'Optimized Month-Based API v4',
                    data_file: 'state_optimized_441k_database',
                    filtering_method: 'month_based_insurance_expiry',
                    criteria: criteria,
                    timestamp: new Date().toISOString()
                }
            };

            console.log(`🎯 FORCED Response: ${matchedCarriersLeads.length} leads for criteria`);

            // Return a mock Response object
            return new Response(JSON.stringify(responseData), {
                status: 200,
                statusText: 'OK',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

        } catch (error) {
            console.error('🚨 FORCED Enhanced API handler error:', error);

            // Return error response
            return new Response(JSON.stringify({
                success: false,
                error: error.message,
                leads: []
            }), {
                status: 500,
                statusText: 'Internal Server Error',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }

    // Start both override methods
    waitForAPIService();

    console.log('✅ Enhanced API Override v4.0 (2025-10-10 15:30): Month-based filtering with state optimization');
    console.log('🚀 Using optimized API on port 5004 with realistic lead counts');
})();