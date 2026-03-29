// Console DOT Lookup Script - Paste this into browser console
// This will manually trigger DOT lookup for lead 150420

console.log('🚛 Starting manual DOT lookup for lead 150420...');

async function performManualDOTLookup() {
    try {
        // First, check if the function exists
        if (typeof window.performDOTLookupForLead === 'function') {
            console.log('✅ performDOTLookupForLead function found');

            const result = await window.performDOTLookupForLead('150420', '3833739');

            if (result) {
                console.log('✅ DOT lookup successful!', result);

                // Check if lead was updated
                setTimeout(() => {
                    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                    const updatedLead = leads.find(lead => lead.id == '150420');

                    if (updatedLead) {
                        console.log('🔍 Updated lead data:');
                        console.log('State:', updatedLead.state || 'NOT SET');
                        console.log('Years in Business:', updatedLead.yearsInBusiness || 'NOT SET');
                        console.log('Commodity:', updatedLead.commodityHauled || 'NOT SET');

                        if (updatedLead.state) {
                            console.log('🎉 SUCCESS: Lead data was populated!');
                        } else {
                            console.log('⚠️ WARNING: Lead data not populated');
                        }
                    }
                }, 3000);

            } else {
                console.log('⚠️ DOT lookup returned null');
            }

        } else {
            console.log('❌ performDOTLookupForLead function not found');

            // Try alternative approach - call API directly
            console.log('🔄 Trying direct API call...');

            const response = await fetch('/api/test-db/3833739');
            const data = await response.json();

            if (data.success) {
                console.log('✅ Direct API call successful:', data.carrier);

                // Manually update the lead
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const leadIndex = leads.findIndex(lead => lead.id == '150420');

                if (leadIndex !== -1) {
                    leads[leadIndex].state = data.carrier.PHY_STATE;
                    leads[leadIndex].yearsInBusiness = calculateYearsFromDOT(data.carrier.DOT_NUMBER);
                    leads[leadIndex].commodityHauled = 'General Freight'; // Default

                    localStorage.setItem('insurance_leads', JSON.stringify(leads));

                    console.log('✅ Manually updated lead with DOT data');
                    console.log('State:', data.carrier.PHY_STATE);
                    console.log('DOT:', data.carrier.DOT_NUMBER);
                }
            } else {
                console.log('❌ Direct API call failed:', data);
            }
        }

    } catch (error) {
        console.error('❌ Error during DOT lookup:', error);
    }
}

// Helper function
function calculateYearsFromDOT(dotNumber) {
    const dotNum = parseInt(dotNumber);
    if (dotNum < 1000000) return '25+ years';
    if (dotNum < 2000000) return '15-20 years';
    if (dotNum < 3000000) return '10-15 years';
    return '5-10 years';
}

// Run the lookup
performManualDOTLookup();