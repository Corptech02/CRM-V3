// DIAGNOSTIC TOOL - Find out EXACTLY why phone matching fails
(function() {
    console.log('🔍 DIAGNOSTIC: Phone Matching Investigation');
    console.log('=========================================');

    // Function to show ALL clients with phones
    window.showAllClientPhones = function() {
        const insurance = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const regular = JSON.parse(localStorage.getItem('leads') || '[]');

        console.log('📋 INSURANCE LEADS WITH PHONES:');
        insurance.forEach((lead, i) => {
            if (lead.phone) {
                console.log(`${i}. ${lead.name || lead.company || 'Unnamed'}`);
                console.log(`   Raw Phone: "${lead.phone}"`);
                console.log(`   Clean: ${lead.phone.replace(/\D/g, '')}`);
                console.log(`   ID: ${lead.id}`);
            }
        });

        console.log('\n📋 REGULAR LEADS WITH PHONES:');
        regular.forEach((lead, i) => {
            if (lead.phone) {
                console.log(`${i}. ${lead.name || lead.company || 'Unnamed'}`);
                console.log(`   Raw Phone: "${lead.phone}"`);
                console.log(`   Clean: ${lead.phone.replace(/\D/g, '')}`);
                console.log(`   ID: ${lead.id}`);
            }
        });

        return { insurance, regular };
    };

    // Function to search for specific phone
    window.findPhone = function(searchPhone) {
        const searchClean = searchPhone.toString().replace(/\D/g, '');
        console.log(`\n🔎 SEARCHING FOR: "${searchPhone}" (clean: ${searchClean})`);

        const insurance = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const regular = JSON.parse(localStorage.getItem('leads') || '[]');
        const all = [...insurance, ...regular];

        let found = false;

        all.forEach(lead => {
            if (lead.phone) {
                const leadClean = lead.phone.toString().replace(/\D/g, '');

                // Check various matching conditions
                if (leadClean.includes(searchClean) ||
                    searchClean.includes(leadClean) ||
                    leadClean.endsWith(searchClean.slice(-7)) ||
                    leadClean.endsWith(searchClean.slice(-10))) {

                    console.log('✅ FOUND MATCH!');
                    console.log('   Name:', lead.name || lead.company);
                    console.log('   Stored Phone:', lead.phone);
                    console.log('   Clean Phone:', leadClean);
                    console.log('   Lead ID:', lead.id);
                    console.log('   Full Lead Object:', lead);
                    found = true;
                }
            }
        });

        if (!found) {
            console.log('❌ NO MATCH FOUND');

            // Show why it might not match
            console.log('\n📊 Comparison with first 3 leads:');
            all.slice(0, 3).forEach(lead => {
                if (lead.phone) {
                    const leadClean = lead.phone.toString().replace(/\D/g, '');
                    console.log(`Lead: ${lead.name || lead.company}`);
                    console.log(`  Their phone: ${leadClean}`);
                    console.log(`  Search phone: ${searchClean}`);
                    console.log(`  Last 7 match? ${leadClean.slice(-7) === searchClean.slice(-7)}`);
                    console.log(`  Last 10 match? ${leadClean.slice(-10) === searchClean.slice(-10)}`);
                }
            });
        }

        return found;
    };

    // Function to manually set a phone number for testing
    window.setTestPhone = function(leadIndex, phone) {
        const insurance = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        if (leadIndex < insurance.length) {
            insurance[leadIndex].phone = phone;
            localStorage.setItem('insurance_leads', JSON.stringify(insurance));
            localStorage.setItem('leads', JSON.stringify(insurance));

            console.log(`✅ Updated lead #${leadIndex} (${insurance[leadIndex].name}) with phone: ${phone}`);
            console.log('Now try: testWithNumber("' + phone.replace(/\D/g, '') + '")');

            return insurance[leadIndex];
        }

        console.log('❌ Invalid lead index');
    };

    // Check what the current popup function is
    window.checkPopupFunction = function() {
        const funcStr = window.showIncomingCallPopup.toString();

        if (funcStr.includes('EXISTING CLIENT')) {
            console.log('✅ Using ENHANCED popup (should show client details)');
        } else if (funcStr.includes('showEnhancedClientPopup')) {
            console.log('✅ Using FIXED popup (should show client details)');
        } else {
            console.log('❌ Using ORIGINAL popup (won't show client details)');
        }

        return funcStr.substring(0, 200) + '...';
    };

    // Test the phone lookup directly
    window.testLookup = function(phone) {
        const result = window.findClientByPhoneNumber ?
            window.findClientByPhoneNumber(phone) :
            'Function not found';

        console.log('Lookup result:', result);
        return result;
    };

    // Run initial diagnostics
    console.log('\n🚀 RUNNING INITIAL DIAGNOSTICS:');
    console.log('1. Checking popup function...');
    checkPopupFunction();

    console.log('\n2. Looking for 3302417570...');
    findPhone('3302417570');

    console.log('\n3. Showing first 5 client phones...');
    const { insurance } = showAllClientPhones();

    console.log('\n📝 INSTRUCTIONS:');
    console.log('- Run: showAllClientPhones() to see all client phones');
    console.log('- Run: findPhone("3302417570") to search for that number');
    console.log('- Run: setTestPhone(0, "(330) 241-7570") to set first lead\'s phone');
    console.log('- Run: testLookup("3302417570") to test the lookup function');
    console.log('- Run: testWithNumber("3302417570") to test the popup');

})();