(function() {
    console.log('🎯🎯🎯 AUTOMATIC TIMESTAMP COLORS LOADING 🎯🎯🎯');

    // This is the REAL fix that will work automatically
    window.automaticTimestampColors = function() {
        console.log('⏰ Running automatic timestamp colors...');

        const table = document.getElementById('leadsTableBody');
        if (!table) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        let yellowCount = 0, orangeCount = 0, redCount = 0, greenCount = 0;

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Get TO DO text
            const todoCell = cells[6];
            const todoText = (todoCell.textContent || '').trim();

            // Get name for matching
            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim();

            // Clear any existing styles first
            row.classList.remove('timestamp-yellow', 'timestamp-orange', 'timestamp-red', 'reach-out-complete', 'force-green-highlight');

            if (!todoText || todoText === '') {
                // GREEN for empty TODO (reach out complete)
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');

                cells.forEach(cell => {
                    cell.style.backgroundColor = 'transparent';
                });

                greenCount++;
                console.log(`Row ${idx}: GREEN (empty TODO)`);
            } else {
                // TODO has text - find matching lead and check timestamp

                // Try multiple matching strategies
                const lead = leads.find(l => {
                    if (!l.name) return false;

                    // Extract just the name part (remove "...")
                    const cleanRowName = nameText.replace('...', '');
                    const shortLeadName = l.name.substring(0, 15);

                    return nameText === l.name ||                     // Exact match
                           cleanRowName === shortLeadName ||          // Match truncated name
                           nameText.includes(l.name) ||               // Row contains lead name
                           l.name.includes(nameText) ||               // Lead contains row name
                           (l.name.toLowerCase().includes(cleanRowName.toLowerCase())); // Case insensitive partial
                });

                if (lead) {
                    console.log(`Found lead match: ${lead.name} for row ${nameText}`);

                    // Get the timestamp - try multiple fields
                    let timestamp = null;

                    // First check stageTimestamps for current stage
                    if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                        timestamp = lead.stageTimestamps[lead.stage];
                        console.log(`Using stage timestamp: ${timestamp}`);
                    }
                    // Then check updatedAt
                    else if (lead.updatedAt) {
                        timestamp = lead.updatedAt;
                        console.log(`Using updatedAt: ${timestamp}`);
                    }
                    // Then check stageUpdatedAt
                    else if (lead.stageUpdatedAt) {
                        timestamp = lead.stageUpdatedAt;
                        console.log(`Using stageUpdatedAt: ${timestamp}`);
                    }
                    // Then check createdAt
                    else if (lead.createdAt || lead.created) {
                        timestamp = lead.createdAt || lead.created;
                        console.log(`Using created date: ${timestamp}`);
                    }

                    if (timestamp) {
                        const stageDate = new Date(timestamp);
                        const now = new Date();

                        // Set both to midnight for accurate day calculation
                        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const stageMidnight = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());

                        // Calculate difference in days
                        const msPerDay = 24 * 60 * 60 * 1000;
                        const diffDays = Math.floor((todayMidnight - stageMidnight) / msPerDay);

                        console.log(`Lead ${lead.name}: ${diffDays} days old (${timestamp})`);

                        if (diffDays === 1) {
                            // YELLOW - 1 day old
                            row.style.setProperty('background-color', '#fef3c7', 'important');
                            row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                            row.style.setProperty('border-right', '2px solid #f59e0b', 'important');

                            cells.forEach(cell => {
                                cell.style.backgroundColor = 'transparent';
                            });

                            yellowCount++;
                            console.log(`🟡 Row ${idx}: YELLOW (1 day old)`);

                        } else if (diffDays > 1 && diffDays < 7) {
                            // ORANGE - 2-6 days old
                            row.style.setProperty('background-color', '#fed7aa', 'important');
                            row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                            row.style.setProperty('border-right', '2px solid #fb923c', 'important');

                            cells.forEach(cell => {
                                cell.style.backgroundColor = 'transparent';
                            });

                            orangeCount++;
                            console.log(`🟠 Row ${idx}: ORANGE (${diffDays} days old)`);

                        } else if (diffDays >= 7) {
                            // RED - 7+ days old
                            row.style.setProperty('background-color', '#fecaca', 'important');
                            row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                            row.style.setProperty('border-right', '2px solid #ef4444', 'important');

                            cells.forEach(cell => {
                                cell.style.backgroundColor = 'transparent';
                            });

                            redCount++;
                            console.log(`🔴 Row ${idx}: RED (${diffDays} days old)`);
                        } else if (diffDays === 0) {
                            // Today - no special color (or light green if you want)
                            console.log(`Row ${idx}: Today (${diffDays} days) - no highlight`);
                        }
                    } else {
                        console.log(`No timestamp found for ${lead.name}`);

                        // NO TIMESTAMP - Create one as today for this stage
                        if (!lead.stageTimestamps) {
                            lead.stageTimestamps = {};
                        }
                        lead.stageTimestamps[lead.stage] = new Date().toISOString();

                        // Save the update
                        const allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                        const updateIndex = allLeads.findIndex(l => l.id === lead.id);
                        if (updateIndex !== -1) {
                            allLeads[updateIndex] = lead;
                            localStorage.setItem('insurance_leads', JSON.stringify(allLeads));
                            console.log(`Created timestamp for ${lead.name}`);
                        }
                    }
                } else {
                    console.log(`No lead match found for row: ${nameText}`);
                }
            }
        });

        console.log(`✅ Applied: Yellow=${yellowCount}, Orange=${orangeCount}, Red=${redCount}, Green=${greenCount}`);
    };

    // Run every second to ensure it works
    setInterval(automaticTimestampColors, 1000);

    // Also run immediately
    setTimeout(automaticTimestampColors, 100);
    setTimeout(automaticTimestampColors, 500);

    // Replace all other highlight functions
    window.forceGreenHighlight = automaticTimestampColors;
    window.forceAllHighlighting = automaticTimestampColors;
    window.forceTimestampHighlight = automaticTimestampColors;
    window.forceColors = automaticTimestampColors;

    console.log('✅ Automatic timestamp colors installed and running!');
})();