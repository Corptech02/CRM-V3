// Debug phone search
(function() {
    console.log('🔍 DEBUG: Searching for phone 3302417570 in all leads...');

    // Check insurance_leads
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    console.log('Total insurance_leads:', insuranceLeads.length);

    // Search for any lead containing 2417570 or 330241
    const searchTerms = ['3302417570', '330-241-7570', '(330) 241-7570', '2417570', '330241'];

    let found = false;

    insuranceLeads.forEach(lead => {
        if (lead.phone) {
            const cleanPhone = lead.phone.replace(/\D/g, '');
            for (const term of searchTerms) {
                const cleanTerm = term.replace(/\D/g, '');
                if (cleanPhone.includes(cleanTerm) || cleanTerm.includes(cleanPhone)) {
                    console.log('✅ FOUND MATCH!');
                    console.log('Lead:', lead);
                    console.log('Name:', lead.name || lead.company);
                    console.log('Phone stored as:', lead.phone);
                    console.log('Clean phone:', cleanPhone);
                    found = true;
                    break;
                }
            }
        }
    });

    // Also check regular leads
    const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('Total regular leads:', regularLeads.length);

    regularLeads.forEach(lead => {
        if (lead.phone) {
            const cleanPhone = lead.phone.replace(/\D/g, '');
            for (const term of searchTerms) {
                const cleanTerm = term.replace(/\D/g, '');
                if (cleanPhone.includes(cleanTerm) || cleanTerm.includes(cleanPhone)) {
                    console.log('✅ FOUND MATCH in regular leads!');
                    console.log('Lead:', lead);
                    console.log('Name:', lead.name || lead.company);
                    console.log('Phone stored as:', lead.phone);
                    console.log('Clean phone:', cleanPhone);
                    found = true;
                    break;
                }
            }
        }
    });

    if (!found) {
        console.log('❌ No leads found with phone 3302417570');
        console.log('Showing first 5 leads with phone numbers as examples:');

        let count = 0;
        insuranceLeads.forEach(lead => {
            if (lead.phone && count < 5) {
                console.log(`Example ${count + 1}: ${lead.name || lead.company} - Phone: ${lead.phone}`);
                count++;
            }
        });
    }

    // Create a function to manually add this phone to a test lead
    window.addTestPhone = function(leadId) {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
            lead.phone = '(330) 241-7570';
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));
            console.log('✅ Updated lead', lead.name, 'with phone (330) 241-7570');
            return lead;
        }
        console.log('Lead not found');
    };

    console.log('💡 TIP: Use addTestPhone(leadId) to add the test phone to any lead');
})();