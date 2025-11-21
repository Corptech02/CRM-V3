// FINAL FIX: Override the lead table after everything else loads
console.log('🔧 FINAL LEAD TABLE FIX LOADING...');

(function() {
    // Function to get next action based on stage and reach out status
    function getNextActionFixed(stage, lead) {
        // Check if reach out is complete
        if (lead && lead.reachOut) {
            const reachOut = lead.reachOut;

            // Check if stage requires reach out (NOT info_received - that needs quote preparation)
            if (stage === 'quoted' || stage === 'info_requested' ||
                stage === 'quote_sent' || stage === 'quote-sent-unaware' || stage === 'quote-sent-aware' ||
                stage === 'interested') {

                // If connected call was made or all methods attempted, reach out is complete
                if (reachOut.callsConnected > 0 ||
                    (reachOut.callAttempts > 0 && reachOut.emailCount > 0 && reachOut.textCount > 0)) {
                    return ''; // Empty TO DO when reach out is complete
                }
            }
        }

        const actionMap = {
            'new': 'Assign Stage',
            'contact_attempted': 'Follow up with lead',
            'info_requested': 'Reach out to lead',
            'info_received': 'Prepare Quote',
            'loss_runs_requested': 'Follow up for Loss Runs',
            'loss_runs_received': 'Analyze Loss Runs & Quote',
            'quoted': 'Email Quote, and make contact',
            'quote_sent': 'Reach out to lead',
            'quote-sent-unaware': 'Reach out to lead',
            'quote-sent-aware': 'Follow up with lead',
            'interested': 'Close the deal',
            'not-interested': 'Archive lead',
            'closed': 'Process complete'
        };
        return actionMap[stage] || 'Review lead';
    }

    // Store original if it exists
    const originalGenerateSimpleLeadRows = window.generateSimpleLeadRows;

    // Override the generateSimpleLeadRows function completely
    window.generateSimpleLeadRows = function(leads) {
        console.log('🔧 Using FIXED generateSimpleLeadRows function');

        if (!leads || leads.length === 0) {
            return '<tr><td colspan="11" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
        }

        const html = leads.map(lead => {
            // Get current logged-in user
            const userData = sessionStorage.getItem('vanguard_user');
            let currentUser = '';
            if (userData) {
                const user = JSON.parse(userData);
                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
            }

            // Check if this lead belongs to another user (grey it out)
            const isOtherUsersLead = lead.assignedTo && lead.assignedTo !== currentUser && currentUser !== '';

            // Truncate name to 15 characters max
            const displayName = lead.name && lead.name.length > 15 ? lead.name.substring(0, 15) + '...' : lead.name || '';

            // Check if reach out is complete for green highlighting
            let isReachOutComplete = false;
            if (lead.reachOut) {
                const reachOut = lead.reachOut;
                const stage = lead.stage || 'new';

                // Check if stage requires reach out (NOT info_received - that needs quote preparation)
                if (stage === 'quoted' || stage === 'info_requested' ||
                    stage === 'quote_sent' || stage === 'quote-sent-unaware' || stage === 'quote-sent-aware' ||
                    stage === 'interested') {

                    // Convert values to numbers in case they're stored as strings
                    const callsConnected = Number(reachOut.callsConnected) || 0;
                    const callAttempts = Number(reachOut.callAttempts) || 0;
                    const emailCount = Number(reachOut.emailCount) || 0;
                    const textCount = Number(reachOut.textCount) || 0;

                    // If connected call was made or all methods attempted, reach out is complete
                    if (callsConnected > 0 ||
                        (callAttempts > 0 && emailCount > 0 && textCount > 0)) {
                        isReachOutComplete = true;
                    }
                }
            }

            // Check timestamp age and TO DO text for highlighting
            let timestampColor = null;
            let borderColor = null;
            let shouldHighlightForTimestamp = false;

            // Check if lead has TO DO text
            const hasTodoText = lead.todo && lead.todo.trim() !== '';

            if (hasTodoText && lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                const timestamp = lead.stageTimestamps[lead.stage];
                const stageDate = new Date(timestamp);
                const now = new Date();

                // Calculate difference in days
                const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
                const diffTime = nowDate - compareDate;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                // Only highlight if timestamp is NOT green (not today)
                if (diffDays === 1) {
                    // Yellow for yesterday
                    timestampColor = '#fef3c7'; // Light yellow background
                    borderColor = '#f59e0b'; // Yellow border
                    shouldHighlightForTimestamp = true;
                } else if (diffDays > 1 && diffDays < 7) {
                    // Orange for 2-6 days
                    timestampColor = '#fed7aa'; // Light orange background
                    borderColor = '#fb923c'; // Orange border
                    shouldHighlightForTimestamp = true;
                } else if (diffDays >= 7) {
                    // Red for 7+ days
                    timestampColor = '#fecaca'; // Light red background
                    borderColor = '#ef4444'; // Red border
                    shouldHighlightForTimestamp = true;
                }
            }

            // Determine row styling based on priority: grey out > timestamp highlight > green highlight
            let rowStyle = '';
            let rowClass = '';

            if (isOtherUsersLead) {
                // Grey out leads assigned to other users
                rowStyle = 'style="opacity: 0.4; background-color: rgba(156, 163, 175, 0.1) !important; filter: grayscale(50%);"';
                rowClass = 'other-user-lead';
            } else if (shouldHighlightForTimestamp) {
                // Highlight based on timestamp age (only if has TO DO text)
                rowStyle = `style="background-color: ${timestampColor} !important; border-left: 4px solid ${borderColor} !important; border-right: 2px solid ${borderColor} !important;"`;
                rowClass = 'timestamp-highlight';
            } else if (isReachOutComplete) {
                // Green highlight for reach out complete (only for current user's leads)
                rowStyle = 'style="background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important; border-right: 2px solid #10b981 !important;"';
                rowClass = 'reach-out-complete';
            }

            return `
                <tr ${rowStyle} ${rowClass ? `class="${rowClass}"` : ''}>
                    <td>
                        <input type="checkbox" class="lead-checkbox" value="${lead.id}" onchange="updateBulkDeleteButton()" data-lead='${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                    </td>
                    <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onclick="viewLead(${lead.id})" title="${lead.name}">${displayName}</strong>
                    </td>
                    <td>
                        <div class="contact-info" style="display: flex; gap: 10px; align-items: center;">
                            <a href="tel:${lead.phone}" title="${lead.phone}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-phone"></i>
                            </a>
                            <a href="mailto:${lead.email}" title="${lead.email}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </td>
                    <td>${lead.product || 'Not specified'}</td>
                    <td>$${(lead.premium || 0).toLocaleString()}</td>
                    <td>${window.getStageHtml ? window.getStageHtml(lead.stage, lead) : getStageHtmlFixed(lead.stage)}</td>
                    <td>
                        <div style="font-weight: bold; color: black;">
                            ${getNextActionFixed(lead.stage || 'new', lead)}
                        </div>
                    </td>
                    <td>${lead.renewalDate || 'N/A'}</td>
                    <td>${lead.assignedTo || 'Unassigned'}</td>
                    <td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="viewLead('${lead.id}')" title="View Lead"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon" onclick="archiveLead('${lead.id}')" title="Archive Lead" style="color: #f59e0b;"><i class="fas fa-archive"></i></button>
                            <button class="btn-icon" onclick="convertLead('${lead.id}')" title="Convert to Client"><i class="fas fa-user-check"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // FORCE highlighting after HTML is generated
        setTimeout(() => {
            console.log('💚 Auto-applying highlighting after table generation');
            forceAllHighlighting();
        }, 10);

        return html;
    };

    // Backup function for stage HTML if not available
    function getStageHtmlFixed(stage) {
        const stageColors = {
            'new': 'stage-new',
            'contact_attempted': 'stage-contact-attempted',
            'info_requested': 'stage-info-requested',
            'info_received': 'stage-info-received',
            'loss_runs_requested': 'stage-loss-runs-requested',
            'loss_runs_received': 'stage-loss-runs-received',
            'quoted': 'stage-quoted',
            'quote-sent-unaware': 'stage-quote-sent-unaware',
            'quote-sent-aware': 'stage-quote-sent-aware',
            'interested': 'stage-interested',
            'not-interested': 'stage-not-interested',
            'closed': 'stage-closed',
            'contacted': 'stage-contacted',
            'reviewed': 'stage-reviewed',
            'converted': 'stage-converted'
        };

        const stageLabels = {
            'new': 'New',
            'contact_attempted': 'Contact Attempted',
            'info_requested': 'Info Requested',
            'info_received': 'Info Received',
            'loss_runs_requested': 'Loss Runs Requested',
            'loss_runs_received': 'Loss Runs Received',
            'quoted': 'Quoted',
            'quote_sent': 'Quote Sent',
            'quote-sent-unaware': 'Quote Sent (Unaware)',
            'quote-sent-aware': 'Quote Sent (Aware)',
            'interested': 'Interested',
            'not-interested': 'Not Interested',
            'closed': 'Closed',
            'contacted': 'Contacted',
            'reviewed': 'Reviewed',
            'converted': 'Converted'
        };

        return `<span class="stage-badge ${stageColors[stage] || 'stage-default'}">${stageLabels[stage] || stage}</span>`;
    }

    // Function to fix the table immediately
    function fixLeadTable() {
        console.log('🔨 Attempting to fix lead table...');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) {
            console.log('⏳ Table body not found yet, waiting...');
            return false;
        }

        // Fix table width and column spacing
        const table = document.getElementById('leadsTable');
        if (table) {
            table.style.width = '100%';
            table.style.tableLayout = 'auto';

            // Add CSS to spread columns properly
            const style = document.getElementById('lead-table-fix-styles') || document.createElement('style');
            style.id = 'lead-table-fix-styles';
            style.innerHTML = `
                #leadsTable {
                    width: 100% !important;
                    table-layout: fixed !important;
                }

                #leadsTable th,
                #leadsTable td {
                    padding: 8px 10px !important;
                    white-space: nowrap !important;
                }

                /* Grey out leads assigned to other users */
                #leadsTable tr.other-user-lead {
                    opacity: 0.4 !important;
                    background-color: rgba(156, 163, 175, 0.1) !important;
                    filter: grayscale(50%) !important;
                    pointer-events: all;
                }

                #leadsTable tr.other-user-lead td {
                    color: #6b7280 !important;
                }

                /* Balanced column widths */
                #leadsTable th:nth-child(1),
                #leadsTable td:nth-child(1) { width: 40px !important; } /* Checkbox */

                #leadsTable th:nth-child(2),
                #leadsTable td:nth-child(2) { width: 12% !important; } /* Name */

                #leadsTable th:nth-child(3),
                #leadsTable td:nth-child(3) { width: 8% !important; } /* Contact */

                #leadsTable th:nth-child(4),
                #leadsTable td:nth-child(4) { width: 10% !important; } /* Product */

                #leadsTable th:nth-child(5),
                #leadsTable td:nth-child(5) { width: 8% !important; } /* Premium */

                #leadsTable th:nth-child(6),
                #leadsTable td:nth-child(6) { width: 8% !important; } /* Stage */

                #leadsTable th:nth-child(7),
                #leadsTable td:nth-child(7) { width: 12% !important; } /* To Do */

                #leadsTable th:nth-child(8),
                #leadsTable td:nth-child(8) { width: 9% !important; } /* Renewal Date */

                #leadsTable th:nth-child(9),
                #leadsTable td:nth-child(9) { width: 9% !important; } /* Assigned To */

                #leadsTable th:nth-child(10),
                #leadsTable td:nth-child(10) { width: 8% !important; } /* Created */

                #leadsTable th:nth-child(11),
                #leadsTable td:nth-child(11) { width: 10% !important; } /* Actions */

                /* Remove any max-width constraints */
                .table-container {
                    width: 100% !important;
                    max-width: none !important;
                    overflow-x: auto !important;
                }

                .leads-view {
                    width: 100% !important;
                    max-width: none !important;
                }

                /* Ensure the name column text is truncated properly */
                #leadsTable td:nth-child(2) .lead-name {
                    max-width: 150px !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                }

                /* Ensure To Do text is bold and visible */
                #leadsTable td:nth-child(7) div {
                    font-weight: bold !important;
                    color: black !important;
                    white-space: nowrap !important;
                }

                /* Keep action buttons horizontal and compact */
                #leadsTable .action-buttons {
                    display: flex !important;
                    flex-direction: row !important;
                    gap: 3px !important;
                    justify-content: center !important;
                    align-items: center !important;
                    white-space: nowrap !important;
                }

                #leadsTable .btn-icon {
                    padding: 4px 6px !important;
                    font-size: 13px !important;
                    display: inline-block !important;
                }

                /* Green highlighting for reach out complete - HIGHEST PRIORITY */
                #leadsTable tr.reach-out-complete,
                #leadsTableBody tr.reach-out-complete,
                .reach-out-complete {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    background: rgba(16, 185, 129, 0.2) !important;
                    border-left: 4px solid #10b981 !important;
                    border-right: 2px solid #10b981 !important;
                }

                /* Ensure reach out complete overrides timestamp highlighting */
                #leadsTable tr.reach-out-complete.timestamp-highlighted,
                #leadsTableBody tr.reach-out-complete.timestamp-highlighted {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    background: rgba(16, 185, 129, 0.2) !important;
                    border-left: 4px solid #10b981 !important;
                    border-right: 2px solid #10b981 !important;
                }

                /* SUPER AGGRESSIVE GREEN HIGHLIGHTING - MAXIMUM PRIORITY */
                tr[style*="background-color: rgba(16, 185, 129"],
                tr.force-green-highlight,
                #leadsTable tbody tr.force-green-highlight,
                #leadsTableBody tr.force-green-highlight,
                table tr.force-green-highlight {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    background: rgba(16, 185, 129, 0.2) !important;
                    border-left: 4px solid #10b981 !important;
                    border-right: 2px solid #10b981 !important;
                }

                /* Override ANY other background on green highlighted rows */
                tr.force-green-highlight td,
                tr[style*="background-color: rgba(16, 185, 129"] td {
                    background: transparent !important;
                    background-color: transparent !important;
                }

                /* Nuclear option - inline style override */
                tr[style*="rgba(16, 185, 129"] {
                    background-color: rgba(16, 185, 129, 0.2) !important;
                    background: rgba(16, 185, 129, 0.2) !important;
                }
            `;
            if (!document.getElementById('lead-table-fix-styles')) {
                document.head.appendChild(style);
            }
        }

        // Get current leads
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log(`📊 Found ${leads.length} leads to display`);

        // Check if table has wrong number of columns
        const firstRow = tableBody.querySelector('tr');
        if (firstRow) {
            const cellCount = firstRow.querySelectorAll('td').length;
            console.log(`📏 Current table has ${cellCount} columns`);

            if (cellCount !== 11) {
                console.log('❌ Wrong column count, fixing...');
                tableBody.innerHTML = window.generateSimpleLeadRows(leads);
                console.log('✅ Table fixed with correct columns');
                return true;
            }

            // Check if To Do column shows N/A
            const todoCell = firstRow.querySelectorAll('td')[6]; // 7th column (0-indexed)
            if (todoCell && (todoCell.textContent.includes('N/A') || todoCell.textContent.trim() === '')) {
                console.log('❌ To Do column shows N/A, fixing...');
                tableBody.innerHTML = window.generateSimpleLeadRows(leads);
                console.log('✅ Table fixed with proper To Do values');
                return true;
            }
        }

        return false;
    }

    // Function to apply reach out complete highlighting
    function applyReachOutCompleteHighlighting() {
        console.log('🎨 Applying reach out complete highlighting...');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        // Get leads data to check reach out status - check both storage locations
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        if (leads.length === 0) {
            leads = JSON.parse(localStorage.getItem('leads') || '[]');
            console.log(`🔍 Using 'leads' storage: ${leads.length} leads`);
        } else {
            console.log(`🔍 Using 'insurance_leads' storage: ${leads.length} leads`);
        }
        console.log(`🔍 Checking ${leads.length} leads for reach out complete status`);

        const rows = tableBody.querySelectorAll('tr');
        let highlightCount = 0;

        rows.forEach(row => {
            // FIRST CHECK: Look for empty TO DO column (7th column, index 6)
            const todoCell = row.querySelectorAll('td')[6];
            if (todoCell) {
                const todoText = todoCell.textContent.trim();
                console.log(`Checking TO DO cell: "${todoText}"`);

                // If TO DO is empty, this means reach out is complete
                if (todoText === '' || todoText.length === 0) {
                    console.log(`✅ Found lead with empty TO DO - applying green highlight!`);

                    // Apply green styling
                    row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('border-left', '4px solid #10b981', 'important');
                    row.style.setProperty('border-right', '2px solid #10b981', 'important');
                    row.classList.add('reach-out-complete');
                    highlightCount++;
                    return; // Skip to next row
                }
            }
            // Find the lead ID from the checkbox
            const checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox) return;

            const leadId = checkbox.value;
            const lead = leads.find(l => String(l.id) === String(leadId));

            if (lead) {
                const reachOut = lead.reachOut || {};
                const stage = lead.stage || 'new';

                // Log lead info for debugging
                if (lead.reachOut) {
                    console.log(`🔍 Lead ${leadId} (${lead.name}): stage=${stage}, reachOut exists`);
                }

                // Check if stage requires reach out (NOT info_received - that needs quote preparation)
                if (stage === 'quoted' || stage === 'info_requested' ||
                    stage === 'quote_sent' || stage === 'quote-sent-unaware' || stage === 'quote-sent-aware' ||
                    stage === 'interested') {

                    // Convert values to numbers in case they're stored as strings
                    const callsConnected = Number(reachOut.callsConnected) || 0;
                    const callAttempts = Number(reachOut.callAttempts) || 0;
                    const emailCount = Number(reachOut.emailCount) || 0;
                    const textCount = Number(reachOut.textCount) || 0;

                    // If connected call was made or all methods attempted, reach out is complete
                    if (callsConnected > 0 ||
                        (callAttempts > 0 && emailCount > 0 && textCount > 0)) {

                        console.log(`✅ Lead ${leadId} (${lead.name}) is reach out complete!`);
                        console.log(`   - Calls connected: ${callsConnected}`);
                        console.log(`   - Call attempts: ${callAttempts}`);
                        console.log(`   - Emails sent: ${emailCount}`);
                        console.log(`   - Texts sent: ${textCount}`);

                        // Apply green styling
                        row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                        row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                        row.style.setProperty('border-left', '4px solid #10b981', 'important');
                        row.style.setProperty('border-right', '2px solid #10b981', 'important');
                        row.classList.add('reach-out-complete');
                        highlightCount++;
                    }
                }
            }
        });

        console.log(`🎨 Applied green highlighting to ${highlightCount} reach out complete leads`);
    }

    // Run fix after a short delay to let everything load
    setTimeout(() => {
        console.log('🚀 Running initial table fix...');
        fixLeadTable();
        setTimeout(applyReachOutCompleteHighlighting, 500);
    }, 1000);

    // Also run fix after longer delay for async loads
    setTimeout(() => {
        console.log('🚀 Running secondary table fix...');
        fixLeadTable();
        setTimeout(applyReachOutCompleteHighlighting, 500);
    }, 3000);

    // Monitor for table changes and fix if needed
    const observer = new MutationObserver((mutations) => {
        // Check if the table was modified
        let tableModified = false;
        mutations.forEach(mutation => {
            if (mutation.target.id === 'leadsTableBody' ||
                mutation.target.closest && mutation.target.closest('#leadsTableBody')) {
                tableModified = true;
            }
        });

        if (tableModified) {
            console.log('📋 Table was modified - reapplying highlights!');
            // Immediate application
            forceAllHighlighting();

            // Multiple delayed applications to ensure persistence
            setTimeout(forceAllHighlighting, 1);
            setTimeout(forceAllHighlighting, 10);
            setTimeout(forceAllHighlighting, 25);
            setTimeout(forceAllHighlighting, 50);
            setTimeout(forceAllHighlighting, 100);
            setTimeout(forceAllHighlighting, 200);
            setTimeout(forceAllHighlighting, 300);
            setTimeout(forceAllHighlighting, 500);
        }
    });

    // Start observing after initial delay
    setTimeout(() => {
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('👀 Monitoring for table changes...');
    }, 2000);

    // Make the function globally available for debugging
    window.applyReachOutCompleteHighlighting = applyReachOutCompleteHighlighting;

    // OVERRIDE sortLeads to preserve green highlighting
    if (window.sortLeads) {
        console.log('🎯 Overriding sortLeads function to preserve green highlighting');
        const originalSortLeads = window.sortLeads;

        window.sortLeads = function(field) {
            console.log(`📊 Sorting by ${field}...`);

            // Call the original sort function
            originalSortLeads(field);

            // IMMEDIATELY reapply green highlighting after sort
            console.log('🎨 Reapplying green highlighting after sort...');
            setTimeout(() => {
                forceGreenHighlight();
            }, 10);

            setTimeout(() => {
                forceGreenHighlight();
            }, 50);

            setTimeout(() => {
                forceGreenHighlight();
            }, 100);

            setTimeout(() => {
                forceGreenHighlight();
            }, 200);

            setTimeout(() => {
                forceGreenHighlight();
            }, 500);
        };
    }

    // Try to override sortLeads later if it doesn't exist yet
    setTimeout(() => {
        if (window.sortLeads && !window.sortLeads.toString().includes('forceGreenHighlight')) {
            console.log('🎯 Late override of sortLeads function');
            const originalSortLeads = window.sortLeads;

            window.sortLeads = function(field) {
                originalSortLeads(field);
                setTimeout(forceAllHighlighting, 10);
                setTimeout(forceAllHighlighting, 50);
                setTimeout(forceAllHighlighting, 100);
                setTimeout(forceAllHighlighting, 200);
                setTimeout(forceAllHighlighting, 500);
            };
        }
    }, 3000);

    // DIAGNOSTIC function to see what's in the table
    window.diagnoseTable = function() {
        console.log('🔬 TABLE DIAGNOSIS');
        const tableBody = document.getElementById('leadsTableBody');

        if (!tableBody) {
            console.error('❌ NO TABLE BODY FOUND!');
            return;
        }

        const rows = tableBody.querySelectorAll('tr');
        console.log(`📊 Total rows: ${rows.length}`);

        rows.forEach((row, i) => {
            const cells = row.querySelectorAll('td');
            console.log(`\n=== ROW ${i} ===`);
            console.log(`Cells: ${cells.length}`);

            if (cells.length >= 7) {
                // Show what's in each important cell
                const nameCell = cells[1];
                const todoCell = cells[6];

                const name = nameCell ? (nameCell.textContent || '').trim() : 'NO NAME';
                const todoDiv = todoCell ? todoCell.querySelector('div') : null;
                const todoText = todoDiv ? todoDiv.textContent : (todoCell ? todoCell.textContent : 'NO TODO CELL');

                console.log(`Name: "${name}"`);
                console.log(`TO DO Cell HTML: ${todoCell ? todoCell.innerHTML : 'N/A'}`);
                console.log(`TO DO Text: "${todoText}"`);
                console.log(`TO DO Text (trimmed): "${todoText.trim()}"`);
                console.log(`TO DO Length: ${todoText.trim().length}`);
                console.log(`Is Empty? ${todoText.trim() === '' ? 'YES ✅' : 'NO ❌'}`);

                // Check current styles
                console.log(`Current row background: ${row.style.backgroundColor}`);
                console.log(`Has green class? ${row.classList.contains('reach-out-complete') || row.classList.contains('force-green-highlight')}`);
            }
        });
    };

    // COMBINED AGGRESSIVE HIGHLIGHTING - TIMESTAMP FIRST, THEN GREEN
    window.forceAllHighlighting = function() {
        console.log('🔥🔥🔥 FORCING ALL HIGHLIGHTS 🔥🔥🔥');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) {
            console.error('NO TABLE FOUND!');
            return;
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');
        console.log(`Found ${rows.length} rows to check`);

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');

            if (cells.length >= 7) {
                // Get the TO DO cell (7th column, index 6)
                const todoCell = cells[6];

                // Get all text from the cell
                let todoText = '';
                const todoDiv = todoCell.querySelector('div');
                if (todoDiv) {
                    todoText = todoDiv.innerText || todoDiv.textContent || '';
                } else {
                    todoText = todoCell.innerText || todoCell.textContent || '';
                }

                // Clean up the text
                todoText = todoText.trim().replace(/\s+/g, ' ');

                console.log(`Row ${rowIndex} TO DO: "${todoText}" (length: ${todoText.length})`);

                // FIRST CHECK: If TO DO has text, check for old timestamps
                if (todoText && todoText.length > 0 && !/^\s*$/.test(todoText)) {
                    console.log(`Row ${rowIndex} has TO DO text, checking timestamp...`);

                    // Get lead name to find matching lead data
                    const nameCell = cells[1];
                    const nameElement = nameCell.querySelector('strong');

                    if (nameElement) {
                        const displayName = nameElement.textContent.trim();

                        // Find matching lead
                        const lead = leads.find(l => {
                            if (!l.name) return false;
                            const leadName = l.name.length > 15 ? l.name.substring(0, 15) + '...' : l.name;
                            return leadName === displayName || l.name === displayName;
                        });

                        if (lead && lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                            const timestamp = lead.stageTimestamps[lead.stage];
                            const stageDate = new Date(timestamp);
                            const now = new Date();

                            // Calculate difference in days (ignore time)
                            const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
                            const diffTime = nowDate - compareDate;
                            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                            console.log(`Lead ${lead.name}: Days old = ${diffDays}`);

                            if (diffDays === 1) {
                                // YELLOW for 1 day old
                                console.log(`🟡 APPLYING YELLOW to row ${rowIndex}`);

                                row.setAttribute('style',
                                    'background-color: #fef3c7 !important;' +
                                    'background: #fef3c7 !important;' +
                                    'border-left: 4px solid #f59e0b !important;' +
                                    'border-right: 2px solid #f59e0b !important;'
                                );

                                row.style.setProperty('background-color', '#fef3c7', 'important');
                                row.style.setProperty('background', '#fef3c7', 'important');
                                row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                                row.style.setProperty('border-right', '2px solid #f59e0b', 'important');

                                row.classList.add('timestamp-yellow');

                                cells.forEach(cell => {
                                    cell.style.backgroundColor = 'transparent';
                                    cell.style.background = 'transparent';
                                });
                                return; // Skip to next row
                            } else if (diffDays > 1 && diffDays < 7) {
                                // ORANGE for 2-6 days old
                                console.log(`🟠 APPLYING ORANGE to row ${rowIndex}`);

                                row.setAttribute('style',
                                    'background-color: #fed7aa !important;' +
                                    'background: #fed7aa !important;' +
                                    'border-left: 4px solid #fb923c !important;' +
                                    'border-right: 2px solid #fb923c !important;'
                                );

                                row.style.setProperty('background-color', '#fed7aa', 'important');
                                row.style.setProperty('background', '#fed7aa', 'important');
                                row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                                row.style.setProperty('border-right', '2px solid #fb923c', 'important');

                                row.classList.add('timestamp-orange');

                                cells.forEach(cell => {
                                    cell.style.backgroundColor = 'transparent';
                                    cell.style.background = 'transparent';
                                });
                                return; // Skip to next row
                            } else if (diffDays >= 7) {
                                // RED for 7+ days old
                                console.log(`🔴 APPLYING RED to row ${rowIndex}`);

                                row.setAttribute('style',
                                    'background-color: #fecaca !important;' +
                                    'background: #fecaca !important;' +
                                    'border-left: 4px solid #ef4444 !important;' +
                                    'border-right: 2px solid #ef4444 !important;'
                                );

                                row.style.setProperty('background-color', '#fecaca', 'important');
                                row.style.setProperty('background', '#fecaca', 'important');
                                row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                                row.style.setProperty('border-right', '2px solid #ef4444', 'important');

                                row.classList.add('timestamp-red');

                                cells.forEach(cell => {
                                    cell.style.backgroundColor = 'transparent';
                                    cell.style.background = 'transparent';
                                });
                                return; // Skip to next row
                            }
                        }
                    }
                }

                // SECOND CHECK: If TO DO is empty, apply green
                if (!todoText || todoText === '' || todoText.length === 0 || /^\s*$/.test(todoText)) {
                    console.log(`🎯 ROW ${rowIndex} HAS EMPTY TO DO - APPLYING GREEN!`);

                    row.setAttribute('style',
                        'background-color: rgba(16, 185, 129, 0.2) !important;' +
                        'background: rgba(16, 185, 129, 0.2) !important;' +
                        'border-left: 4px solid #10b981 !important;' +
                        'border-right: 2px solid #10b981 !important;'
                    );

                    row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('border-left', '4px solid #10b981', 'important');
                    row.style.setProperty('border-right', '2px solid #10b981', 'important');

                    row.classList.add('reach-out-complete');
                    row.classList.add('force-green-highlight');

                    cells.forEach(cell => {
                        cell.style.backgroundColor = 'transparent';
                        cell.style.background = 'transparent';
                    });
                }
            }
        });
    };

    // Keep the old function names for compatibility but point to the new one
    window.forceGreenHighlight = window.forceAllHighlighting;
    window.forceTimestampHighlight = window.forceAllHighlighting;

    // Simple function that highlights based on empty TO DO
    window.highlightEmptyTodos = window.forceGreenHighlight;

    // Debug function to check reach out data
    window.debugReachOutStatus = function() {
        console.log('🔍 DEBUG: Checking all leads for reach out status...');
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        leads.forEach(lead => {
            if (lead.reachOut) {
                console.log(`Lead: ${lead.name} (${lead.id})`);
                console.log(`  Stage: ${lead.stage}`);
                console.log(`  ReachOut:`, lead.reachOut);

                const reachOut = lead.reachOut;
                const stage = lead.stage || 'new';

                if (stage === 'quoted' || stage === 'info_requested' ||
                    stage === 'quote_sent' || stage === 'quote-sent-unaware' || stage === 'quote-sent-aware' ||
                    stage === 'interested') {

                    if (reachOut.callsConnected > 0) {
                        console.log(`  ✅ COMPLETE - Connected call made`);
                    } else if (reachOut.callAttempts > 0 && reachOut.emailCount > 0 && reachOut.textCount > 0) {
                        console.log(`  ✅ COMPLETE - All methods attempted`);
                    } else {
                        console.log(`  ❌ NOT COMPLETE - Missing: ${reachOut.callAttempts === 0 ? 'Call' : ''} ${reachOut.emailCount === 0 ? 'Email' : ''} ${reachOut.textCount === 0 ? 'Text' : ''}`);
                    }
                }
            }
        });
    };

    // OLD FUNCTION - DISABLED - NOW USING forceAllHighlighting
    window.forceTimestampHighlight_OLD_DISABLED = function() {
        console.log('⏰ FORCING TIMESTAMP-BASED HIGHLIGHT');

        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');
        let highlightCount = 0;

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            // Get the TO DO cell text directly from DOM (7th column, index 6)
            const todoCell = cells[6];
            let todoText = '';
            const todoDiv = todoCell.querySelector('div');
            if (todoDiv) {
                todoText = todoDiv.innerText || todoDiv.textContent || '';
            } else {
                todoText = todoCell.innerText || todoCell.textContent || '';
            }

            // Clean up the text
            todoText = todoText.trim().replace(/\s+/g, ' ');

            // Skip if TO DO is empty (those get green highlight)
            if (!todoText || todoText === '' || todoText.length === 0 || /^\s*$/.test(todoText)) {
                return;
            }

            // Get lead name from the row to match with lead data
            const nameCell = cells[1];
            const nameElement = nameCell.querySelector('strong');
            if (!nameElement) return;

            const displayName = nameElement.textContent.trim();

            // Find matching lead
            const lead = leads.find(l => {
                const leadName = l.name && l.name.length > 15 ? l.name.substring(0, 15) + '...' : l.name || '';
                return leadName === displayName || l.name === displayName;
            });

            if (!lead) {
                console.log(`❌ Could not find lead for ${displayName}`);
                return;
            }

            // Skip if this is another user's lead (already greyed out)
            const userData = sessionStorage.getItem('vanguard_user');
            let currentUser = '';
            if (userData) {
                const user = JSON.parse(userData);
                currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
            }

            const isOtherUsersLead = lead.assignedTo && lead.assignedTo !== currentUser && currentUser !== '';
            if (isOtherUsersLead) return;

            // Now check timestamp
            if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                const timestamp = lead.stageTimestamps[lead.stage];
                const stageDate = new Date(timestamp);
                const now = new Date();

                // Calculate difference in days
                const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
                const diffTime = nowDate - compareDate;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                console.log(`Lead ${lead.name}: TO DO="${todoText}", Days old=${diffDays}`);

                // Apply highlighting based on age using ALL methods like green highlighting
                if (diffDays === 1) {
                    // Yellow for yesterday
                    console.log(`🟡 Applying YELLOW highlight to ${lead.name} (1 day old with TO DO)`);

                    // Method 1: Direct style attribute
                    row.setAttribute('style',
                        'background-color: #fef3c7 !important;' +
                        'background: #fef3c7 !important;' +
                        'border-left: 4px solid #f59e0b !important;' +
                        'border-right: 2px solid #f59e0b !important;'
                    );

                    // Method 2: Individual style properties
                    row.style.backgroundColor = '#fef3c7';
                    row.style.background = '#fef3c7';
                    row.style.borderLeft = '4px solid #f59e0b';
                    row.style.borderRight = '2px solid #f59e0b';

                    // Method 3: Set important flag
                    row.style.setProperty('background-color', '#fef3c7', 'important');
                    row.style.setProperty('background', '#fef3c7', 'important');
                    row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                    row.style.setProperty('border-right', '2px solid #f59e0b', 'important');

                    // Method 4: Add class
                    row.classList.add('timestamp-yellow');
                    highlightCount++;

                } else if (diffDays > 1 && diffDays < 7) {
                    // Orange for 2-6 days
                    console.log(`🟠 Applying ORANGE highlight to ${lead.name} (${diffDays} days old with TO DO)`);

                    // Method 1: Direct style attribute
                    row.setAttribute('style',
                        'background-color: #fed7aa !important;' +
                        'background: #fed7aa !important;' +
                        'border-left: 4px solid #fb923c !important;' +
                        'border-right: 2px solid #fb923c !important;'
                    );

                    // Method 2: Individual style properties
                    row.style.backgroundColor = '#fed7aa';
                    row.style.background = '#fed7aa';
                    row.style.borderLeft = '4px solid #fb923c';
                    row.style.borderRight = '2px solid #fb923c';

                    // Method 3: Set important flag
                    row.style.setProperty('background-color', '#fed7aa', 'important');
                    row.style.setProperty('background', '#fed7aa', 'important');
                    row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                    row.style.setProperty('border-right', '2px solid #fb923c', 'important');

                    // Method 4: Add class
                    row.classList.add('timestamp-orange');
                    highlightCount++;

                } else if (diffDays >= 7) {
                    // Red for 7+ days
                    console.log(`🔴 Applying RED highlight to ${lead.name} (${diffDays} days old with TO DO)`);

                    // Method 1: Direct style attribute
                    row.setAttribute('style',
                        'background-color: #fecaca !important;' +
                        'background: #fecaca !important;' +
                        'border-left: 4px solid #ef4444 !important;' +
                        'border-right: 2px solid #ef4444 !important;'
                    );

                    // Method 2: Individual style properties
                    row.style.backgroundColor = '#fecaca';
                    row.style.background = '#fecaca';
                    row.style.borderLeft = '4px solid #ef4444';
                    row.style.borderRight = '2px solid #ef4444';

                    // Method 3: Set important flag
                    row.style.setProperty('background-color', '#fecaca', 'important');
                    row.style.setProperty('background', '#fecaca', 'important');
                    row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                    row.style.setProperty('border-right', '2px solid #ef4444', 'important');

                    // Method 4: Add class
                    row.classList.add('timestamp-red');
                    highlightCount++;
                }
            } else {
                console.log(`No timestamp found for ${lead.name} stage ${lead.stage}`);
            }
        });

        console.log(`⏰ Applied timestamp highlighting to ${highlightCount} leads`);
    };

    // ULTRA AGGRESSIVE HIGHLIGHTING - RUN MULTIPLE TIMES
    function runAggressiveHighlighting() {
        console.log('💪 AGGRESSIVE HIGHLIGHTING PASS');
        forceAllHighlighting(); // This does both timestamp and green

        // Also inject a style tag to make absolutely sure
        const styleId = 'force-green-style';
        let forceStyle = document.getElementById(styleId);
        if (!forceStyle) {
            forceStyle = document.createElement('style');
            forceStyle.id = styleId;
            document.head.appendChild(forceStyle);
        }

        forceStyle.innerHTML = `
            tr.force-green-highlight,
            tr[style*="rgba(16, 185, 129"] {
                background-color: rgba(16, 185, 129, 0.2) !important;
                background: rgba(16, 185, 129, 0.2) !important;
                border-left: 4px solid #10b981 !important;
                border-right: 2px solid #10b981 !important;
            }
            tr.force-green-highlight > td {
                background: transparent !important;
            }

            /* Timestamp-based highlighting */
            tr.timestamp-yellow,
            tr[style*="#fef3c7"] {
                background-color: #fef3c7 !important;
                background: #fef3c7 !important;
                border-left: 4px solid #f59e0b !important;
                border-right: 2px solid #f59e0b !important;
            }
            tr.timestamp-orange,
            tr[style*="#fed7aa"] {
                background-color: #fed7aa !important;
                background: #fed7aa !important;
                border-left: 4px solid #fb923c !important;
                border-right: 2px solid #fb923c !important;
            }
            tr.timestamp-red,
            tr[style*="#fecaca"] {
                background-color: #fecaca !important;
                background: #fecaca !important;
                border-left: 4px solid #ef4444 !important;
                border-right: 2px solid #ef4444 !important;
            }
            tr.timestamp-yellow > td,
            tr.timestamp-orange > td,
            tr.timestamp-red > td {
                background: transparent !important;
            }
        `;
    }

    // Debug function to check what's happening
    window.debugTimestampHighlight = function() {
        console.log('🔍 DEBUGGING TIMESTAMP HIGHLIGHT');
        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) {
            console.error('No table body found!');
            return;
        }

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const rows = tableBody.querySelectorAll('tr');

        console.log(`Found ${rows.length} rows and ${leads.length} leads`);

        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const nameCell = cells[1];
                const todoCell = cells[6];

                const name = nameCell.textContent.trim();
                const todo = todoCell.textContent.trim();

                // Find matching lead
                const lead = leads.find(l => l.name && (l.name.includes(name) || name.includes(l.name)));

                if (lead && lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                    const timestamp = lead.stageTimestamps[lead.stage];
                    const stageDate = new Date(timestamp);
                    const now = new Date();
                    const diffDays = Math.round((now - stageDate) / (1000 * 60 * 60 * 24));

                    console.log(`Row ${index}: ${name}`);
                    console.log(`  TO DO: "${todo}" (length: ${todo.length})`);
                    console.log(`  Stage: ${lead.stage}`);
                    console.log(`  Timestamp: ${timestamp}`);
                    console.log(`  Days old: ${diffDays}`);
                    console.log(`  Should highlight: ${todo.length > 0 && diffDays > 0 ? 'YES' : 'NO'}`);
                }
            }
        });
    };

    // Run immediately
    setTimeout(runAggressiveHighlighting, 500);
    setTimeout(runAggressiveHighlighting, 1000);
    setTimeout(runAggressiveHighlighting, 1500);
    setTimeout(runAggressiveHighlighting, 2000);
    setTimeout(runAggressiveHighlighting, 3000);

    // Make debug function available
    window.testTimestampHighlight = function() {
        window.debugTimestampHighlight();
        window.forceAllHighlighting();
    };

    // Also expose the combined function directly
    window.forceHighlights = window.forceAllHighlighting;
    setTimeout(runAggressiveHighlighting, 4000);
    setTimeout(runAggressiveHighlighting, 5000);

    // Then run every 2 seconds forever
    setInterval(runAggressiveHighlighting, 2000);

    console.log('✅ FINAL LEAD TABLE FIX READY');

    // RUN IMMEDIATELY ONE MORE TIME
    setTimeout(() => {
        console.log('🚀 IMMEDIATE FINAL HIGHLIGHT RUN');
        forceAllHighlighting();
    }, 100);
})();