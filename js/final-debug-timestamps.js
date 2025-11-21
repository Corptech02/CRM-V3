(function() {
    console.log('🔍 FINAL DEBUG FOR TIMESTAMP ISSUES');

    window.debugUnhighlightedLeads = function() {
        console.log('=== CHECKING UNHIGHLIGHTED LEADS WITH OLD TIMESTAMPS ===');

        const table = document.getElementById('leadsTableBody');
        if (!table) {
            console.error('No table found');
            return;
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        console.log(`Checking ${rows.length} rows...`);

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Check if row has any highlight
            const bgColor = window.getComputedStyle(row).backgroundColor;
            const hasHighlight = bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';

            // Get TO DO
            const todoCell = cells[6];
            const todoText = (todoCell.textContent || '').trim();

            // Skip empty TODOs (those should be green)
            if (!todoText) return;

            // Get name
            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim();

            if (!hasHighlight) {
                console.log(`\n❌ Row ${idx} has TODO but NO HIGHLIGHT:`);
                console.log(`   Name: "${nameText}"`);
                console.log(`   TODO: "${todoText}"`);

                // Try to find the lead
                let matchedLead = null;

                // Try different matching approaches
                for (let lead of leads) {
                    if (!lead.name) continue;

                    // Clean up for comparison
                    const cleanRowName = nameText.replace('...', '').trim().toLowerCase();
                    const leadNameLower = lead.name.toLowerCase();

                    // Various match attempts
                    if (lead.name === nameText ||
                        leadNameLower === cleanRowName ||
                        leadNameLower.startsWith(cleanRowName) ||
                        cleanRowName.startsWith(leadNameLower.substring(0, 15))) {
                        matchedLead = lead;
                        break;
                    }
                }

                if (matchedLead) {
                    console.log(`   ✅ Found lead: "${matchedLead.name}"`);
                    console.log(`   Stage: ${matchedLead.stage}`);

                    // Check all timestamp fields
                    console.log('   Available timestamps:');
                    if (matchedLead.stageTimestamps) {
                        console.log(`     stageTimestamps:`, matchedLead.stageTimestamps);
                        if (matchedLead.stageTimestamps[matchedLead.stage]) {
                            const ts = matchedLead.stageTimestamps[matchedLead.stage];
                            const date = new Date(ts);
                            const now = new Date();
                            const days = Math.round((now - date) / (1000 * 60 * 60 * 24));
                            console.log(`     Stage "${matchedLead.stage}" timestamp: ${ts} (${days} days old)`);

                            if (days > 0) {
                                console.log(`   🚨 THIS SHOULD BE HIGHLIGHTED!`);
                                let expectedColor = 'none';
                                if (days === 1) expectedColor = 'YELLOW';
                                else if (days > 1 && days < 7) expectedColor = 'ORANGE';
                                else if (days >= 7) expectedColor = 'RED';
                                console.log(`   Expected color: ${expectedColor}`);

                                // Try to apply the color NOW
                                if (days === 1) {
                                    row.style.setProperty('background-color', '#fef3c7', 'important');
                                    row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                                    console.log('   🟡 Applied YELLOW manually');
                                } else if (days > 1 && days < 7) {
                                    row.style.setProperty('background-color', '#fed7aa', 'important');
                                    row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                                    console.log('   🟠 Applied ORANGE manually');
                                } else if (days >= 7) {
                                    row.style.setProperty('background-color', '#fecaca', 'important');
                                    row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                                    console.log('   🔴 Applied RED manually');
                                }
                            }
                        }
                    }
                    if (matchedLead.updatedAt) {
                        console.log(`     updatedAt: ${matchedLead.updatedAt}`);
                    }
                    if (matchedLead.createdAt) {
                        console.log(`     createdAt: ${matchedLead.createdAt}`);
                    }
                    if (matchedLead.created) {
                        console.log(`     created: ${matchedLead.created}`);
                    }
                } else {
                    console.log(`   ❌ NO MATCHING LEAD FOUND`);
                    console.log(`   Possible matches:`);

                    // Show similar lead names
                    leads.forEach(lead => {
                        if (lead.name) {
                            const similarity = calculateSimilarity(nameText.toLowerCase(), lead.name.toLowerCase());
                            if (similarity > 0.5) {
                                console.log(`     - "${lead.name}" (similarity: ${Math.round(similarity * 100)}%)`);
                            }
                        }
                    });
                }
            }
        });
    };

    // Helper function to calculate string similarity
    function calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = getEditDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    function getEditDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    // Run debug immediately
    setTimeout(() => {
        console.log('Running debug check...');
        window.debugUnhighlightedLeads();
    }, 2000);

    console.log('✅ Debug tools ready. Use window.debugUnhighlightedLeads() to check');
})();