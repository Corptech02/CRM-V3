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
        if (typeof url === 'string' && (url.includes('/api/leads/expiring-insurance') || url.includes('/api/optimized-leads'))) {
            console.log('🎯 Enhanced Override v5: Intercepted leads API call:', url);
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
                let matchedCarriersLeads = await queryMatchedCarriersDataForced(criteria);

                console.log(`Retrieved ${matchedCarriersLeads.length} real leads from matched carriers database v3`);

                // Apply skip days filtering if specified
                if (criteria.skipDays && criteria.skipDays > 0) {
                    const today = new Date();
                    const skipUntilDate = new Date();
                    skipUntilDate.setDate(today.getDate() + criteria.skipDays);
                    const maxDate = new Date();
                    maxDate.setDate(today.getDate() + (criteria.expiryDays || 30));

                    console.log(`🔍 Applying skip days filter: Skip ${criteria.skipDays} days`);
                    console.log(`📅 Date range: ${skipUntilDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);

                    const beforeCount = matchedCarriersLeads.length;
                    matchedCarriersLeads = matchedCarriersLeads.filter(lead => {
                        if (!lead.insurance_expiry && !lead.renewal_date) return true; // Keep leads without expiry date

                        const expiryDate = new Date(lead.insurance_expiry || lead.renewal_date);
                        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

                        // Include leads that expire after skip days but within total expiry window
                        return daysUntilExpiry > criteria.skipDays && daysUntilExpiry <= (criteria.expiryDays || 30);
                    });

                    console.log(`✅ Skip days filter applied: ${beforeCount} → ${matchedCarriersLeads.length} leads (removed ${beforeCount - matchedCarriersLeads.length} leads)`);
                }

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

        // Use our LOCAL enhanced API with 175k+ representative names
        const backendUrl = window.location.origin + '/api/leads/expiring-insurance?' + new URLSearchParams({
            state: criteria.state || '',
            days: criteria.expiryDays || criteria.daysUntilExpiry || 30,
            limit: Math.min(criteria.limit || 10000, 10000),
            skip_days: criteria.skipDays || 0
        });

        console.log('🔗 FIXED: Calling CORRECT API endpoint with params:', backendUrl);

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
            console.log('📊 FORCED Backend data received - count leads:', data.count || data.total);
            console.log('🔍 ACTUAL DATA BREAKDOWN:', {
                count: data.count,
                total: data.total,
                leads_array_length: data.leads ? data.leads.length : 0,
                criteria: data.criteria
            });
            console.log('🔍 DETAILED DEBUG - data.leads:', data.leads ? 'exists' : 'missing', 'isArray:', Array.isArray(data.leads), 'length:', data.leads ? data.leads.length : 'N/A');

            // Check for either count or total field and ensure leads array exists
            const leadCount = data.count || data.total || 0;
            if (Array.isArray(data.leads) && leadCount >= 0) {
                console.log(`✅ SUCCESS: ${data.leads.length} leads returned from REAL NAMES API`);
                if (data.leads.length > 0) {
                    console.log('🎯 First lead sample:', data.leads[0]);
                    console.log('🎯 Representative name sample:', data.leads[0].contact || data.leads[0].representative_name);
                }

                console.log(`📊 Using REAL NAMES results: ${data.leads.length} leads ready for frontend`);
                return data.leads;
            } else {
                console.log('🔍 Response data:', data);
                throw new Error(`REAL NAMES API returned invalid data: leads=${Array.isArray(data.leads) ? data.leads.length : 'not array'}, count=${data.count}, total=${data.total}`);
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
                limit: parseInt(params.get('limit')) || 10000,
                skipDays: parseInt(params.get('skip_days')) || 0,
                insuranceCompanies: params.get('insurance_companies') ?
                    decodeURIComponent(params.get('insurance_companies')).split(',').map(c => c.trim()) : []
            };

            console.log('🎯 FORCED Enhanced criteria extracted:', criteria);

            // Query matched carriers database with FORCE
            let matchedCarriersLeads = await queryMatchedCarriersDataForced(criteria);

            // Apply skip days filtering if specified
            if (criteria.skipDays && criteria.skipDays > 0) {
                const today = new Date();
                const beforeCount = matchedCarriersLeads.length;

                matchedCarriersLeads = matchedCarriersLeads.filter(lead => {
                    if (!lead.insurance_expiry && !lead.renewal_date) return true; // Keep leads without expiry date

                    const expiryDate = new Date(lead.insurance_expiry || lead.renewal_date);
                    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

                    // Include leads that expire after skip days but within total expiry window
                    return daysUntilExpiry > criteria.skipDays && daysUntilExpiry <= (criteria.expiryDays || 30);
                });

                console.log(`✅ Skip days filter applied in interceptor: ${beforeCount} → ${matchedCarriersLeads.length} leads`);
            }

            // Create response object - include both count and total for compatibility
            const responseData = {
                success: true,
                count: matchedCarriersLeads.length,
                total: matchedCarriersLeads.length,
                leads: matchedCarriersLeads,
                criteria: criteria,
                metadata: {
                    source: 'MATCHED_CARRIERS_WITH_REAL_NAMES',
                    data_file: 'matched_carriers_20251009_183433',
                    filtering_method: 'real_representative_names_lookup',
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