(function() {
    console.log('📅 FIXING YEAR 2025 TIMESTAMPS');

    // Fix all timestamps that have year 2025
    window.fixYear2025 = function() {
        console.log('Fixing all 2025 timestamps to 2024...');

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let fixedCount = 0;

        leads.forEach(lead => {
            let modified = false;

            // Fix stageTimestamps
            if (lead.stageTimestamps) {
                Object.keys(lead.stageTimestamps).forEach(stage => {
                    const timestamp = lead.stageTimestamps[stage];
                    if (timestamp && timestamp.includes('2025')) {
                        lead.stageTimestamps[stage] = timestamp.replace('2025', '2024');
                        console.log(`Fixed ${lead.name} stage ${stage}: ${timestamp} -> ${lead.stageTimestamps[stage]}`);
                        modified = true;
                    }
                });
            }

            // Fix updatedAt
            if (lead.updatedAt && lead.updatedAt.includes('2025')) {
                const oldVal = lead.updatedAt;
                lead.updatedAt = lead.updatedAt.replace('2025', '2024');
                console.log(`Fixed ${lead.name} updatedAt: ${oldVal} -> ${lead.updatedAt}`);
                modified = true;
            }

            // Fix stageUpdatedAt
            if (lead.stageUpdatedAt && lead.stageUpdatedAt.includes('2025')) {
                const oldVal = lead.stageUpdatedAt;
                lead.stageUpdatedAt = lead.stageUpdatedAt.replace('2025', '2024');
                console.log(`Fixed ${lead.name} stageUpdatedAt: ${oldVal} -> ${lead.stageUpdatedAt}`);
                modified = true;
            }

            // Fix createdAt
            if (lead.createdAt && lead.createdAt.includes('2025')) {
                const oldVal = lead.createdAt;
                lead.createdAt = lead.createdAt.replace(/2025/g, '2024');
                console.log(`Fixed ${lead.name} createdAt: ${oldVal} -> ${lead.createdAt}`);
                modified = true;
            }

            // Fix created
            if (lead.created && lead.created.includes('2025')) {
                const oldVal = lead.created;
                lead.created = lead.created.replace(/2025/g, '2024');
                console.log(`Fixed ${lead.name} created: ${oldVal} -> ${lead.created}`);
                modified = true;
            }

            if (modified) {
                fixedCount++;
            }
        });

        // Save the fixed data
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log(`✅ Fixed ${fixedCount} leads with 2025 timestamps`);

        // Force refresh highlighting
        if (window.synchronizedHighlighting) {
            window.synchronizedHighlighting();
        }
    };

    // Better date calculation that handles the year issue
    window.calculateDaysOldFixed = function(timestamp) {
        if (!timestamp) return null;

        let dateStr = timestamp;

        // Handle different date formats
        if (typeof dateStr === 'string') {
            // Fix year 2025 to 2024
            dateStr = dateStr.replace(/2025/g, '2024');
        }

        const date = new Date(dateStr);

        if (isNaN(date.getTime())) {
            return null;
        }

        const now = new Date();

        // If date is in the future, assume it's a year error
        if (date > now) {
            date.setFullYear(date.getFullYear() - 1);
        }

        // Calculate days difference
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const diffMs = todayMidnight - dateMidnight;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    // Override the synchronized highlighting with fixed version
    const originalSync = window.synchronizedHighlighting;

    window.synchronizedHighlightingFixed = function() {
        console.log('🔄 FIXED SYNCHRONIZED HIGHLIGHTING RUNNING');

        const table = document.getElementById('leadsTableBody');
        if (!table) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = table.querySelectorAll('tr');

        let stats = { yellow: 0, orange: 0, red: 0, green: 0, today: 0, errors: 0 };

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            const todoCell = cells[6];
            const todoText = (todoCell.textContent || '').trim();

            // Clear existing highlights
            row.classList.remove('timestamp-yellow', 'timestamp-orange', 'timestamp-red', 'reach-out-complete');

            if (!todoText || todoText === '') {
                // GREEN for empty TODO
                row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                row.style.setProperty('border-left', '4px solid #10b981', 'important');
                row.style.setProperty('border-right', '2px solid #10b981', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.green++;
                return;
            }

            // Get name
            const nameCell = cells[1];
            const nameText = (nameCell.textContent || '').trim();

            // Find matching lead
            const matchedLead = leads.find(l => {
                if (!l.name) return false;
                const cleanRowName = nameText.replace('...', '').trim();
                const shortLeadName = l.name.substring(0, 15);

                return l.name === nameText ||
                       l.name === cleanRowName ||
                       shortLeadName === cleanRowName ||
                       cleanRowName === l.name.substring(0, cleanRowName.length);
            });

            if (!matchedLead) {
                stats.errors++;
                return;
            }

            // Get timestamp with priority
            let timestamp = null;
            const stage = matchedLead.stage || 'new';

            if (matchedLead.stageTimestamps && matchedLead.stageTimestamps[stage]) {
                timestamp = matchedLead.stageTimestamps[stage];
            } else if (matchedLead.updatedAt) {
                timestamp = matchedLead.updatedAt;
            } else if (matchedLead.stageUpdatedAt) {
                timestamp = matchedLead.stageUpdatedAt;
            } else if (matchedLead.createdAt || matchedLead.created) {
                timestamp = matchedLead.createdAt || matchedLead.created;
            }

            if (!timestamp) {
                stats.errors++;
                return;
            }

            // Calculate days with FIXED year handling
            const diffDays = window.calculateDaysOldFixed(timestamp);

            if (diffDays === null) {
                stats.errors++;
                return;
            }

            // Apply colors based on days
            if (diffDays === 0) {
                // Today - no highlight
                stats.today++;
            } else if (diffDays === 1) {
                // YELLOW - 1 day old
                row.style.setProperty('background-color', '#fef3c7', 'important');
                row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                row.style.setProperty('border-right', '2px solid #f59e0b', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.yellow++;
            } else if (diffDays > 1 && diffDays < 7) {
                // ORANGE - 2-6 days
                row.style.setProperty('background-color', '#fed7aa', 'important');
                row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                row.style.setProperty('border-right', '2px solid #fb923c', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.orange++;
            } else if (diffDays >= 7) {
                // RED - 7+ days
                row.style.setProperty('background-color', '#fecaca', 'important');
                row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                row.style.setProperty('border-right', '2px solid #ef4444', 'important');
                cells.forEach(cell => cell.style.backgroundColor = 'transparent');
                stats.red++;
            }
        });

        console.log('✅ Fixed highlighting stats:', stats);
    };

    // Replace the synchronized function
    window.synchronizedHighlighting = window.synchronizedHighlightingFixed;

    // Run the year fix immediately
    setTimeout(() => {
        console.log('🔧 Running year 2025 fix...');
        window.fixYear2025();
    }, 1000);

    // Then run highlighting
    setTimeout(() => {
        window.synchronizedHighlightingFixed();
    }, 2000);

    // Keep running
    setInterval(window.synchronizedHighlightingFixed, 2000);

    console.log('✅ Year 2025 fix loaded. Use window.fixYear2025() to manually fix dates');
})();