// Quick FMCSA Database Statistics
console.log('📊 Quick FMCSA Database Analysis...');

async function quickFMCSAStats() {
    const baseUrl = 'https://162-220-14-239.nip.io/api';

    try {
        // Get sample data for column structure
        console.log('🔍 Getting column structure...');
        const sampleUrl = `${baseUrl}/matched-carriers-leads?state=OH&days=365&skip_days=0&min_fleet=1&max_fleet=1&limit=1`;
        const sampleResponse = await fetch(sampleUrl);
        const sampleData = await sampleResponse.json();

        console.log('\n📋 COLUMN NAMES AND STRUCTURE:');
        if (sampleData.leads && sampleData.leads.length > 0) {
            const sampleLead = sampleData.leads[0];
            const columns = Object.keys(sampleLead);
            columns.forEach((col, i) => {
                const value = sampleLead[col];
                const type = typeof value;
                console.log(`${i + 1}. ${col} (${type}) - Example: "${value}"`);
            });
        }

        // Test a few key states for lead counts
        const testStates = ['OH', 'TX', 'CA', 'FL', 'NY', 'PA'];
        console.log('\n📊 SAMPLE STATE LEAD COUNTS:');

        for (const state of testStates) {
            try {
                // Get total available for next year
                const stateUrl = `${baseUrl}/matched-carriers-leads?state=${state}&days=365&skip_days=0&min_fleet=1&max_fleet=9999&limit=1`;
                const stateResponse = await fetch(stateUrl);
                const stateData = await stateResponse.json();

                if (stateData.total_available !== undefined) {
                    console.log(`${state}: ${stateData.total_available.toLocaleString()} leads (12 months)`);
                }

                // Add small delay
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.log(`${state}: Error - ${error.message}`);
            }
        }

        // Get monthly breakdown for Ohio as example
        console.log('\n📅 MONTHLY BREAKDOWN (Ohio Example):');
        const months = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

        let previousTotal = 0;
        for (let i = 0; i < months.length; i++) {
            try {
                const monthUrl = `${baseUrl}/matched-carriers-leads?state=OH&days=${months[i]}&skip_days=0&min_fleet=1&max_fleet=9999&limit=1`;
                const monthResponse = await fetch(monthUrl);
                const monthData = await monthResponse.json();

                if (monthData.total_available !== undefined) {
                    const currentTotal = monthData.total_available;
                    const monthLeads = currentTotal - previousTotal;
                    const monthName = `Month ${i + 1}`;
                    console.log(`${monthName}: ${monthLeads} new leads (cumulative: ${currentTotal})`);
                    previousTotal = currentTotal;
                }

                await new Promise(resolve => setTimeout(resolve, 150));

            } catch (error) {
                console.log(`Month ${i + 1}: Error - ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

quickFMCSAStats();