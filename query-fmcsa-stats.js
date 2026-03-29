// Query FMCSA Database Statistics
console.log('📊 Querying FMCSA Enhanced Database for comprehensive statistics...');

async function queryFMCSAStats() {
    const baseUrl = 'https://162-220-14-239.nip.io/api';

    try {
        // Query for a sample to get column structure first
        console.log('🔍 Getting sample data to identify column structure...');
        const sampleUrl = `${baseUrl}/matched-carriers-leads?state=OH&days=365&skip_days=0&min_fleet=1&max_fleet=1&limit=1`;

        const sampleResponse = await fetch(sampleUrl);
        const sampleData = await sampleResponse.json();

        if (sampleData.leads && sampleData.leads.length > 0) {
            console.log('📋 Column Names Available:');
            const sampleLead = sampleData.leads[0];
            const columnNames = Object.keys(sampleLead);
            columnNames.forEach((column, index) => {
                console.log(`   ${index + 1}. ${column}: ${typeof sampleLead[column]} - Example: "${sampleLead[column]}"`);
            });
            console.log(`\n📊 Total Columns: ${columnNames.length}`);
        }

        // Now query statistics for all states
        console.log('\n🗺️  Querying lead counts across all states...');

        const states = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ];

        const monthlyStats = {};
        let totalLeadsAllStates = 0;

        // Query each state for different time periods
        const timeRanges = [
            { days: 30, label: 'Next 30 days' },
            { days: 60, label: 'Next 60 days' },
            { days: 90, label: 'Next 90 days' },
            { days: 180, label: 'Next 6 months' },
            { days: 365, label: 'Next 12 months' }
        ];

        console.log('🔄 Processing all states (this may take a moment...)');

        for (const timeRange of timeRanges) {
            console.log(`\n📅 === ${timeRange.label.toUpperCase()} ===`);
            let periodTotal = 0;

            for (const state of states) {
                try {
                    const stateUrl = `${baseUrl}/matched-carriers-leads?state=${state}&days=${timeRange.days}&skip_days=0&min_fleet=1&max_fleet=9999&limit=1`;
                    const stateResponse = await fetch(stateUrl);
                    const stateData = await stateResponse.json();

                    if (stateData.total_available) {
                        const count = stateData.total_available;
                        periodTotal += count;
                        if (count > 0) {
                            console.log(`   ${state}: ${count.toLocaleString()} leads`);
                        }
                    }

                    // Small delay to avoid overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    console.log(`   ${state}: Error - ${error.message}`);
                }
            }

            console.log(`   📊 ${timeRange.label} Total: ${periodTotal.toLocaleString()} leads across all states`);

            if (timeRange.days === 365) {
                totalLeadsAllStates = periodTotal;
            }
        }

        console.log(`\n🎯 FINAL SUMMARY:`);
        console.log(`   📊 Total leads in database: ${totalLeadsAllStates.toLocaleString()}`);
        console.log(`   🗺️  States covered: ${states.length}`);
        console.log(`   📋 Data source: FMCSA Enhanced Database`);

        // Try to get more detailed monthly breakdown
        console.log('\n📅 Attempting monthly breakdown analysis...');

        const monthlyBreakdown = [];
        for (let i = 0; i < 12; i++) {
            const skipDays = i * 30;
            const days = 30;

            try {
                const monthUrl = `${baseUrl}/matched-carriers-leads?state=OH&days=${days}&skip_days=${skipDays}&min_fleet=1&max_fleet=9999&limit=1`;
                const monthResponse = await fetch(monthUrl);
                const monthData = await monthResponse.json();

                if (monthData.total_available) {
                    const monthName = new Date(Date.now() + (skipDays * 24 * 60 * 60 * 1000)).toLocaleString('default', { month: 'long', year: 'numeric' });
                    monthlyBreakdown.push({
                        month: monthName,
                        leads: monthData.total_available
                    });
                    console.log(`   ${monthName}: ${monthData.total_available.toLocaleString()} leads (OH sample)`);
                }

                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.log(`   Month ${i + 1}: Error - ${error.message}`);
            }
        }

        return {
            totalLeads: totalLeadsAllStates,
            columnNames: columnNames,
            monthlyBreakdown: monthlyBreakdown,
            sampleData: sampleLead
        };

    } catch (error) {
        console.error('❌ Error querying FMCSA database:', error);
        return null;
    }
}

// Execute the query
queryFMCSAStats().then(results => {
    if (results) {
        console.log('\n✅ FMCSA Database analysis complete!');
        window.fmcsaStats = results; // Store results globally for further inspection
    }
}).catch(error => {
    console.error('❌ Failed to complete FMCSA analysis:', error);
});