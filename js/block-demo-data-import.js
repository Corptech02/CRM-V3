// Block Demo Data Import - Prevent test/demo data from being imported
console.log('🚫 Blocking demo data imports...');

(function() {
    // Demo data patterns to block
    const DEMO_PATTERNS = {
        names: [
            'Robert Thompson',
            'Jennifer Martin',
            'Transport Solutions LLC',
            'Michael Chen',
            'Davis Construction',
            'ABC Corp',
            'Tech Startup Inc',
            'John Doe',
            'Jane Smith',
            'Test Company',
            'Demo Business',
            'Sample Corp'
        ],
        emails: [
            'test@',
            'demo@',
            'sample@',
            'example.com',
            'test.com',
            'demo.com'
        ],
        agents: [
            'John Smith',
            'Sarah Johnson',
            'Mike Wilson',
            'Lisa Anderson',
            'Test Agent',
            'Demo User'
        ]
    };

    // Override localStorage.setItem to filter demo data
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        if (key === 'insurance_leads' || key === 'leads') {
            try {
                let data = JSON.parse(value);
                const originalCount = data.length;

                // Filter out demo leads
                data = data.filter(lead => {
                    // Skip if no lead object
                    if (!lead) return true;

                    // Check name patterns
                    const nameIsDemo = DEMO_PATTERNS.names.some(pattern =>
                        lead.name && lead.name.toLowerCase().includes(pattern.toLowerCase())
                    );

                    // Check email patterns
                    const emailIsDemo = lead.email && DEMO_PATTERNS.emails.some(pattern =>
                        lead.email.toLowerCase().includes(pattern.toLowerCase())
                    );

                    // Check agent patterns
                    const agentIsDemo = lead.assignedTo && DEMO_PATTERNS.agents.some(pattern =>
                        lead.assignedTo.toLowerCase() === pattern.toLowerCase()
                    );

                    // Check for clearly fake data
                    const isFake = (lead.premium === 5200 && lead.name === 'Robert Thompson') ||
                                   (lead.premium === 3800 && lead.name && lead.name.includes('Jennifer')) ||
                                   (lead.premium === 12500 && lead.name && lead.name.includes('Transport')) ||
                                   (lead.premium === 2200 && lead.name === 'Michael Chen');

                    if (nameIsDemo || emailIsDemo || agentIsDemo || isFake) {
                        console.log(`🚫 Blocked demo lead: ${lead.name} (${lead.email || 'no email'})`);
                        return false;
                    }

                    return true;
                });

                if (data.length < originalCount) {
                    console.log(`🛡️ Blocked ${originalCount - data.length} demo leads from being saved`);
                }

                value = JSON.stringify(data);
            } catch (e) {
                // If parsing fails, allow the original value
            }
        }

        return originalSetItem.call(this, key, value);
    };

    // Override fetch to block demo data from API
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
            // Clone the response to read it
            const clonedResponse = response.clone();

            // Check if this is a leads API response
            if (args[0] && args[0].includes('/api/leads') && response.ok) {
                return clonedResponse.json().then(data => {
                    // Filter demo leads from API response
                    if (Array.isArray(data)) {
                        const originalCount = data.length;
                        data = data.filter(lead => {
                            const isDemo = DEMO_PATTERNS.names.some(pattern =>
                                lead.name && lead.name.toLowerCase().includes(pattern.toLowerCase())
                            );

                            if (isDemo) {
                                console.log(`🚫 Blocked demo lead from API: ${lead.name}`);
                                return false;
                            }

                            return true;
                        });

                        if (data.length < originalCount) {
                            console.log(`🛡️ Filtered ${originalCount - data.length} demo leads from API`);
                        }
                    }

                    // Return modified response
                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                });
            }

            return response;
        });
    };

    console.log('✅ Demo data blocking active - No test data will be imported');
})();