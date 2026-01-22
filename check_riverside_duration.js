// Script to check RIVERSIDE AUTO TOW highlight duration
console.log('🔍 Checking RIVERSIDE AUTO TOW highlight duration...');

// Check localStorage first
const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
const riversideLead = leads.find(l => l.name && l.name.includes('RIVERSIDE AUTO') && l.name.includes('TOW'));

if (riversideLead) {
    console.log('📋 Found RIVERSIDE AUTO TOW in localStorage:');
    console.log(`   ID: ${riversideLead.id}`);
    console.log(`   Name: ${riversideLead.name}`);
    console.log('   reachOut data:', riversideLead.reachOut);

    if (riversideLead.reachOut?.greenHighlightUntil) {
        const expiry = new Date(riversideLead.reachOut.greenHighlightUntil);
        const now = new Date();
        const diffMs = expiry - now;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        console.log(`✅ localStorage Duration: ${days}d ${hours}h ${minutes}m remaining`);
        console.log(`   Expires at: ${expiry.toLocaleString()}`);
        console.log(`   greenHighlightDays: ${riversideLead.reachOut.greenHighlightDays || 'NOT SET'}`);

        // Now check server
        fetch(`/api/leads/${riversideLead.id}`)
            .then(response => response.json())
            .then(serverLead => {
                console.log('🌐 Server data for RIVERSIDE AUTO TOW:');
                console.log('   Server reachOut:', serverLead.reachOut);

                if (serverLead.reachOut?.greenHighlightUntil) {
                    const serverExpiry = new Date(serverLead.reachOut.greenHighlightUntil);
                    const serverDiffMs = serverExpiry - now;
                    const serverDays = Math.floor(serverDiffMs / (1000 * 60 * 60 * 24));
                    const serverHours = Math.floor((serverDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                    console.log(`✅ Server Duration: ${serverDays}d ${serverHours}h remaining`);
                    console.log(`   Server expires at: ${serverExpiry.toLocaleString()}`);
                    console.log(`   Server greenHighlightDays: ${serverLead.reachOut.greenHighlightDays || 'NOT SET'}`);

                    if (riversideLead.reachOut.greenHighlightUntil === serverLead.reachOut.greenHighlightUntil) {
                        console.log('✅ PERFECT MATCH: localStorage and server have identical duration data!');
                    } else {
                        console.log('❌ MISMATCH: localStorage and server have different duration data');
                        console.log(`   Local: ${riversideLead.reachOut.greenHighlightUntil}`);
                        console.log(`   Server: ${serverLead.reachOut.greenHighlightUntil}`);
                    }
                } else {
                    console.log('❌ Server has NO greenHighlightUntil data - not saved to server!');
                }
            })
            .catch(error => {
                console.log('❌ Server check failed:', error);
            });

    } else {
        console.log('❌ No greenHighlightUntil found in localStorage');
    }
} else {
    console.log('❌ RIVERSIDE AUTO TOW not found in localStorage');
    console.log('Available leads:', leads.map(l => l.name).slice(0, 10));
}