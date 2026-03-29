// Extract Full FMCSA Database by Getting All Leads
console.log('📊 EXTRACTING ENTIRE FMCSA DATABASE');
console.log('=====================================');

async function extractFullDatabase() {
    const baseUrl = 'https://162-220-14-239.nip.io/api';

    const allStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    let grandTotalLeads = 0;
    const stateResults = {};
    const allLeadsData = [];

    console.log('🔍 Extracting actual leads data from all states...');
    console.log('⏳ This will get the complete database by fetching all leads\n');

    // Use the working query format - no limit to get everything
    for (const state of allStates) {
        console.log(`📍 Processing ${state}...`);

        try {
            // Use the same format that worked in your logs
            const stateUrl = `${baseUrl}/matched-carriers-leads?state=${state}&days=30&skip_days=0&min_fleet=1&max_fleet=9999`;

            const response = await fetch(stateUrl);
            const data = await response.json();

            if (data.leads && Array.isArray(data.leads)) {
                const leadCount = data.leads.length;
                stateResults[state] = leadCount;
                grandTotalLeads += leadCount;

                console.log(`   ${state}: ${leadCount.toLocaleString()} leads`);

                // Add to master list
                data.leads.forEach(lead => {
                    lead.query_state = state; // Tag with query state
                    allLeadsData.push(lead);
                });

                // Show sample of insurance expiration dates to understand time range
                if (leadCount > 0) {
                    const expiryDates = data.leads.slice(0, 5).map(l => l.insurance_expiry);
                    console.log(`      Sample expiry dates: ${expiryDates.join(', ')}`);
                }

            } else {
                console.log(`   ${state}: No leads data returned`);
                stateResults[state] = 0;
            }

            // Delay to be respectful to API
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.log(`   ${state}: ERROR - ${error.message}`);
            stateResults[state] = 'ERROR';
        }
    }

    console.log('\n🎯 COMPLETE FMCSA DATABASE SUMMARY:');
    console.log('=====================================');
    console.log(`📊 TOTAL LEADS IN DATABASE: ${grandTotalLeads.toLocaleString()}`);
    console.log(`🗺️  States processed: ${allStates.length}`);
    console.log(`📈 Average leads per state: ${Math.round(grandTotalLeads / allStates.length).toLocaleString()}`);

    // Top performing states
    const validStates = Object.entries(stateResults)
        .filter(([state, count]) => typeof count === 'number' && count > 0)
        .sort(([,a], [,b]) => b - a);

    console.log(`\n🏆 STATES WITH LEADS (${validStates.length} states):`);
    validStates.forEach(([state, count], index) => {
        const percentage = ((count / grandTotalLeads) * 100).toFixed(1);
        console.log(`   ${index + 1}. ${state}: ${count.toLocaleString()} leads (${percentage}%)`);
    });

    // Analyze insurance expiry patterns
    console.log('\n📅 INSURANCE EXPIRY ANALYSIS:');
    const expiryYears = {};
    const expiryMonths = {};

    allLeadsData.forEach(lead => {
        if (lead.insurance_expiry) {
            const year = lead.insurance_expiry.substring(0, 4);
            const month = lead.insurance_expiry.substring(5, 7);

            expiryYears[year] = (expiryYears[year] || 0) + 1;
            expiryMonths[month] = (expiryMonths[month] || 0) + 1;
        }
    });

    console.log('By Year:');
    Object.entries(expiryYears)
        .sort(([a,], [b,]) => a.localeCompare(b))
        .forEach(([year, count]) => {
            console.log(`   ${year}: ${count.toLocaleString()} leads`);
        });

    console.log('\nBy Month (2025):');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    Object.entries(expiryMonths)
        .sort(([a,], [b,]) => a.localeCompare(b))
        .forEach(([month, count]) => {
            const monthName = monthNames[parseInt(month) - 1] || month;
            console.log(`   ${monthName}: ${count.toLocaleString()} leads`);
        });

    // Save complete results
    window.completeDatabase = {
        totalLeads: grandTotalLeads,
        stateResults: stateResults,
        topStates: validStates,
        expiryYears: expiryYears,
        expiryMonths: expiryMonths,
        sampleLeads: allLeadsData.slice(0, 10),
        extractionDate: new Date().toISOString()
    };

    console.log('\n✅ Complete database extraction finished!');
    console.log(`📁 Results saved to window.completeDatabase`);
    console.log(`💾 Full dataset contains ${allLeadsData.length.toLocaleString()} lead records`);

    return {
        totalLeads: grandTotalLeads,
        stateBreakdown: validStates,
        timeAnalysis: expiryYears
    };
}

// Execute extraction
extractFullDatabase();