(function() {
    console.log('🔍🔍🔍 DIAGNOSING TIMESTAMP PROBLEM 🔍🔍🔍');

    window.diagnoseTimestamps = function() {
        const table = document.getElementById('leadsTableBody');
        if (!table) {
            console.error('NO TABLE!');
            return;
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        console.log('=== DIAGNOSTIC REPORT ===');
        console.log(`Total rows in table: ${rows.length}`);
        console.log(`Total leads in storage: ${leads.length}`);

        // Check what timestamps exist
        console.log('\n=== CHECKING LEAD TIMESTAMPS ===');
        leads.forEach(lead => {
            if (lead.stageTimestamps) {
                console.log(`Lead: ${lead.name}`);
                console.log(`  Current stage: ${lead.stage}`);
                console.log(`  Stage timestamps:`, lead.stageTimestamps);

                if (lead.stageTimestamps[lead.stage]) {
                    const ts = lead.stageTimestamps[lead.stage];
                    const date = new Date(ts);
                    const now = new Date();
                    const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
                    console.log(`  Current stage timestamp: ${ts}`);
                    console.log(`  Days old: ${days}`);

                    if (days > 0) {
                        console.log(`  ⚠️ THIS SHOULD BE HIGHLIGHTED!`);
                    }
                }
            }
        });

        console.log('\n=== CHECKING TABLE ROWS ===');
        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const nameCell = cells[1];
                const todoCell = cells[6];

                const name = (nameCell.textContent || '').trim();
                const todo = (todoCell.textContent || '').trim();

                if (todo && todo.length > 0) {
                    console.log(`Row ${idx}: ${name}`);
                    console.log(`  TODO: "${todo}"`);

                    // Try to find lead
                    const matchingLead = leads.find(l => {
                        if (!l.name) return false;
                        // Very loose matching
                        return name.toLowerCase().includes(l.name.toLowerCase()) ||
                               l.name.toLowerCase().includes(name.toLowerCase());
                    });

                    if (matchingLead) {
                        console.log(`  ✅ Found matching lead: ${matchingLead.name}`);

                        if (matchingLead.stageTimestamps && matchingLead.stageTimestamps[matchingLead.stage]) {
                            const ts = matchingLead.stageTimestamps[matchingLead.stage];
                            const date = new Date(ts);
                            const now = new Date();
                            const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));

                            console.log(`    Stage: ${matchingLead.stage}`);
                            console.log(`    Timestamp: ${ts}`);
                            console.log(`    Days old: ${days}`);

                            if (days === 1) {
                                console.log(`    🟡 SHOULD BE YELLOW!`);
                            } else if (days > 1 && days < 7) {
                                console.log(`    🟠 SHOULD BE ORANGE!`);
                            } else if (days >= 7) {
                                console.log(`    🔴 SHOULD BE RED!`);
                            }
                        } else {
                            console.log(`    ❌ No timestamp for stage ${matchingLead.stage}`);
                        }
                    } else {
                        console.log(`  ❌ No matching lead found`);
                    }
                }
            }
        });
    };

    // Run diagnosis
    window.diagnoseTimestamps();

    // Try a SUPER SIMPLE highlight test
    window.testSimpleHighlight = function() {
        console.log('🧪 TESTING SIMPLE HIGHLIGHT');

        const table = document.getElementById('leadsTableBody');
        if (!table) return;

        const rows = table.querySelectorAll('tr');

        // Just highlight the first 3 rows with TODO text for testing
        let count = 0;
        rows.forEach((row, idx) => {
            if (count >= 3) return;

            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const todoCell = cells[6];
                const todo = (todoCell.textContent || '').trim();

                if (todo && todo.length > 0) {
                    count++;

                    if (count === 1) {
                        console.log(`🟡 Making row ${idx} YELLOW`);
                        // FORCE YELLOW
                        row.style.backgroundColor = '#fef3c7';
                        row.style.borderLeft = '4px solid #f59e0b';
                        row.setAttribute('style', 'background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important;');
                    } else if (count === 2) {
                        console.log(`🟠 Making row ${idx} ORANGE`);
                        // FORCE ORANGE
                        row.style.backgroundColor = '#fed7aa';
                        row.style.borderLeft = '4px solid #fb923c';
                        row.setAttribute('style', 'background-color: #fed7aa !important; border-left: 4px solid #fb923c !important;');
                    } else if (count === 3) {
                        console.log(`🔴 Making row ${idx} RED`);
                        // FORCE RED
                        row.style.backgroundColor = '#fecaca';
                        row.style.borderLeft = '4px solid #ef4444';
                        row.setAttribute('style', 'background-color: #fecaca !important; border-left: 4px solid #ef4444 !important;');
                    }
                }
            }
        });

        console.log(`✅ Applied test colors to ${count} rows`);
    };
})();