(function() {
    console.log('🔧 FIX MISSING HIGHLIGHTS LOADING');

    window.debugMissingHighlights = function() {
        console.log('🔍 CHECKING FOR MISSING HIGHLIGHTS...');

        const table = document.getElementById('leadsTableBody');
        if (!table) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        let missingHighlights = [];

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Get TO DO text
            const todoCell = cells[6];
            const todoText = (todoCell.textContent || '').trim();

            // Skip if no TODO
            if (!todoText || todoText === '') return;

            // Get name
            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim();

            // Check if row has any highlighting
            const hasHighlight = row.style.backgroundColor ||
                                row.classList.contains('timestamp-yellow') ||
                                row.classList.contains('timestamp-orange') ||
                                row.classList.contains('timestamp-red');

            if (!hasHighlight) {
                // This row SHOULD have a highlight but doesn't
                console.log(`❌ Row ${idx} has TODO but NO HIGHLIGHT: ${nameText}`);
                console.log(`   TODO: "${todoText}"`);

                // Try to find the lead
                const lead = leads.find(l => {
                    if (!l.name) return false;

                    // Multiple matching strategies
                    const cleanName = nameText.replace('...', '').trim();
                    const leadNameLower = l.name.toLowerCase();
                    const rowNameLower = cleanName.toLowerCase();

                    // Try exact match first
                    if (l.name === nameText) return true;

                    // Try truncated match (first 15 chars)
                    if (l.name.substring(0, 15) === cleanName.substring(0, 15)) return true;

                    // Try case-insensitive contains
                    if (leadNameLower.includes(rowNameLower) || rowNameLower.includes(leadNameLower)) return true;

                    // Try starts with
                    if (leadNameLower.startsWith(rowNameLower) || rowNameLower.startsWith(leadNameLower)) return true;

                    return false;
                });

                if (lead) {
                    console.log(`   ✅ Found lead: ${lead.name}`);
                    console.log(`   Stage: ${lead.stage}`);

                    // Check all possible timestamp fields
                    const timestamps = {
                        stageTimestamp: lead.stageTimestamps ? lead.stageTimestamps[lead.stage] : null,
                        updatedAt: lead.updatedAt,
                        stageUpdatedAt: lead.stageUpdatedAt,
                        createdAt: lead.createdAt,
                        created: lead.created
                    };

                    console.log('   Timestamps:', timestamps);

                    // Find the first valid timestamp
                    let validTimestamp = null;
                    for (const [key, value] of Object.entries(timestamps)) {
                        if (value) {
                            const date = new Date(value);
                            if (!isNaN(date.getTime())) {
                                validTimestamp = value;
                                console.log(`   Using ${key}: ${value}`);
                                break;
                            }
                        }
                    }

                    if (validTimestamp) {
                        const date = new Date(validTimestamp);
                        const now = new Date();
                        const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));

                        console.log(`   Days old: ${days}`);

                        missingHighlights.push({
                            row: idx,
                            name: nameText,
                            lead: lead.name,
                            days: days,
                            timestamp: validTimestamp
                        });
                    } else {
                        console.log('   ❌ No valid timestamp found');
                    }
                } else {
                    console.log(`   ❌ No matching lead found for "${nameText}"`);

                    // Show all lead names for comparison
                    console.log('   Available leads:');
                    leads.forEach(l => {
                        if (l.name && l.name.toLowerCase().includes(nameText.toLowerCase().substring(0, 5))) {
                            console.log(`     - "${l.name}"`);
                        }
                    });
                }
            }
        });

        if (missingHighlights.length > 0) {
            console.log(`\n🚨 FOUND ${missingHighlights.length} ROWS MISSING HIGHLIGHTS:`);
            missingHighlights.forEach(item => {
                let expectedColor = 'none';
                if (item.days === 1) expectedColor = 'YELLOW';
                else if (item.days > 1 && item.days < 7) expectedColor = 'ORANGE';
                else if (item.days >= 7) expectedColor = 'RED';

                console.log(`Row ${item.row}: "${item.name}" - ${item.days} days old - Should be ${expectedColor}`);
            });
        }
    };

    // Enhanced automatic highlighting that catches more cases
    window.enhancedAutomaticHighlights = function() {
        console.log('🎨 ENHANCED AUTOMATIC HIGHLIGHTS RUNNING');

        const table = document.getElementById('leadsTableBody');
        if (!table) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        let stats = { yellow: 0, orange: 0, red: 0, green: 0, skipped: 0 };

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            const todoCell = cells[6];
            const todoText = (todoCell.textContent || '').trim();

            if (!todoText || todoText === '') {
                // GREEN for empty TODO
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.green++;
                return;
            }

            // Has TODO - need to find timestamp
            const nameCell = cells[1];
            let nameText = (nameCell.textContent || '').trim();

            // Clean up the name
            nameText = nameText.replace('...', '').trim();

            // Try to find matching lead with VERY flexible matching
            let matchedLead = null;

            // First try exact match
            matchedLead = leads.find(l => l.name === nameText);

            // Then try starts with (for truncated names)
            if (!matchedLead) {
                matchedLead = leads.find(l => l.name && l.name.startsWith(nameText));
            }

            // Then try if nameText starts with lead name
            if (!matchedLead) {
                matchedLead = leads.find(l => l.name && nameText.startsWith(l.name.substring(0, 15)));
            }

            // Then try case-insensitive partial match
            if (!matchedLead) {
                const nameLower = nameText.toLowerCase();
                matchedLead = leads.find(l => {
                    if (!l.name) return false;
                    const leadLower = l.name.toLowerCase();
                    return leadLower.includes(nameLower) || nameLower.includes(leadLower);
                });
            }

            // Last resort - match first few characters
            if (!matchedLead) {
                const firstChars = nameText.substring(0, 10).toLowerCase();
                matchedLead = leads.find(l => {
                    if (!l.name) return false;
                    return l.name.toLowerCase().substring(0, 10) === firstChars;
                });
            }

            if (matchedLead) {
                // Get ANY timestamp we can find
                let timestamp = null;

                // Priority order for timestamps
                if (matchedLead.stageTimestamps && matchedLead.stageTimestamps[matchedLead.stage]) {
                    timestamp = matchedLead.stageTimestamps[matchedLead.stage];
                } else if (matchedLead.updatedAt) {
                    timestamp = matchedLead.updatedAt;
                } else if (matchedLead.stageUpdatedAt) {
                    timestamp = matchedLead.stageUpdatedAt;
                } else if (matchedLead.createdAt) {
                    timestamp = matchedLead.createdAt;
                } else if (matchedLead.created) {
                    timestamp = matchedLead.created;
                }

                if (timestamp) {
                    const date = new Date(timestamp);
                    const now = new Date();

                    // Reset to midnight for accurate day calculation
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                    const diffMs = todayStart - dateStart;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        // YELLOW
                        row.style.setProperty('background-color', '#fef3c7', 'important');
                        row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                        row.style.setProperty('border-right', '2px solid #f59e0b', 'important');
                        cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                        stats.yellow++;
                        console.log(`🟡 Row ${idx}: ${nameText} - 1 day old`);
                    } else if (diffDays > 1 && diffDays < 7) {
                        // ORANGE
                        row.style.setProperty('background-color', '#fed7aa', 'important');
                        row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                        row.style.setProperty('border-right', '2px solid #fb923c', 'important');
                        cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                        stats.orange++;
                        console.log(`🟠 Row ${idx}: ${nameText} - ${diffDays} days old`);
                    } else if (diffDays >= 7) {
                        // RED
                        row.style.setProperty('background-color', '#fecaca', 'important');
                        row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                        row.style.setProperty('border-right', '2px solid #ef4444', 'important');
                        cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                        stats.red++;
                        console.log(`🔴 Row ${idx}: ${nameText} - ${diffDays} days old`);
                    } else {
                        stats.skipped++;
                    }
                } else {
                    // No timestamp - create one
                    if (!matchedLead.stageTimestamps) {
                        matchedLead.stageTimestamps = {};
                    }
                    matchedLead.stageTimestamps[matchedLead.stage] = new Date().toISOString();

                    // Save update
                    const leadIndex = leads.findIndex(l => l.id === matchedLead.id);
                    if (leadIndex !== -1) {
                        leads[leadIndex] = matchedLead;
                        localStorage.setItem('insurance_leads', JSON.stringify(leads));
                        console.log(`Created timestamp for ${matchedLead.name}`);
                    }
                    stats.skipped++;
                }
            } else {
                console.log(`❌ No match for row ${idx}: "${nameText}"`);
                stats.skipped++;
            }
        });

        console.log('✅ Stats:', stats);
    };

    // Replace the automatic function
    window.automaticTimestampColors = enhancedAutomaticHighlights;

    // Run debug first to see what's wrong
    setTimeout(() => {
        console.log('🔍 Initial debug check...');
        debugMissingHighlights();
    }, 1000);

    // Then run enhanced highlighting
    setTimeout(() => {
        console.log('🎨 Running enhanced highlights...');
        enhancedAutomaticHighlights();
    }, 2000);

    // Keep running
    // setInterval(enhancedAutomaticHighlights, 2000); // DISABLED - Causing flickering every 2000ms

    console.log('✅ Fix Missing Highlights loaded');
})();