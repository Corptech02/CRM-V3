// Green Highlight Remover - Removes green highlight when TODO column has content
(function() {
    'use strict';

    console.log('🟢 Loading Green Highlight Remover...');

    // Function to check if TODO cell has meaningful content
    function hasTodoContent(todoCell) {
        if (!todoCell) return false;

        const content = todoCell.innerHTML.trim();

        // Check if cell is truly empty or just has empty divs
        if (!content || content === '') return false;

        // Check for empty div patterns
        if (content.match(/^<div[^>]*>\s*<\/div>$/)) return false;
        if (content.match(/^<div[^>]*style="[^"]*">\s*<\/div>$/)) return false;

        // Check for actual text content
        const textContent = todoCell.textContent?.trim();
        if (textContent && textContent.length > 0) {
            console.log(`🔍 TODO CONTENT FOUND: "${textContent}"`);
            return true;
        }

        return false;
    }

    // Function to remove green highlight from a table row
    function removeGreenHighlight(row, leadId, reason) {
        if (!row) return;

        console.log(`🟢➡️ REMOVING GREEN HIGHLIGHT: Lead ${leadId} - Reason: ${reason}`);

        // Mark row as having TODO content to prevent reapplication
        row.setAttribute('data-todo-content', 'true');
        row.setAttribute('data-green-highlight-disabled', 'true');

        // Remove green highlight classes
        row.classList.remove('green-highlighted');

        // Remove green highlight attributes
        row.removeAttribute('data-highlight');
        row.removeAttribute('data-highlight-applied');
        row.removeAttribute('data-highlight-source');

        // Completely remove all styling that could contain green highlights
        row.removeAttribute('style');

        // Use CSS to permanently override green styling
        row.style.setProperty('background-color', 'transparent', 'important');
        row.style.setProperty('background', 'none', 'important');
        row.style.setProperty('border-left', 'none', 'important');
        row.style.setProperty('border-right', 'none', 'important');

        console.log(`✅ GREEN HIGHLIGHT REMOVED: Lead ${leadId}`);
    }

    // Function to scan all table rows and remove green highlights where needed
    function scanAndRemoveGreenHighlights() {
        try {
            console.log('🔍 SCANNING: Checking for green highlights with TODO content...');

            const tableBody = document.querySelector('#leadsTable tbody') || document.querySelector('tbody');
            if (!tableBody) {
                console.log('❌ SCANNING: Table not found');
                return;
            }

            const rows = tableBody.querySelectorAll('tr');
            let removedCount = 0;

            rows.forEach((row, index) => {
                // Skip divider rows
                if (row.classList.contains('lead-divider')) return;

                // Get lead ID
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (!checkbox) return;

                const leadId = checkbox.value;

                // Skip if already processed for TODO content
                if (row.getAttribute('data-green-highlight-disabled') === 'true') return;

                // Check if row has green highlight
                const hasGreenHighlight = row.classList.contains('green-highlighted') ||
                                         row.getAttribute('data-highlight') === 'green' ||
                                         (row.getAttribute('style') || '').includes('rgba(16, 185, 129');

                if (!hasGreenHighlight) return;

                // Check TODO cell (7th column, index 6)
                const cells = row.querySelectorAll('td');
                if (cells.length > 6) {
                    const todoCell = cells[7];

                    if (hasTodoContent(todoCell)) {
                        removeGreenHighlight(row, leadId, 'TODO content detected');
                        removedCount++;
                    }
                }
            });

            if (removedCount > 0) {
                console.log(`✅ SCANNING COMPLETE: Removed green highlight from ${removedCount} leads`);
            } else {
                console.log('🔍 SCANNING COMPLETE: No green highlights needed removal');
            }

        } catch (error) {
            console.error('❌ SCANNING ERROR:', error);
        }
    }

    // Function to monitor specific lead for TODO changes
    function monitorLeadTodoChanges(leadId) {
        try {
            const tableBody = document.querySelector('#leadsTable tbody') || document.querySelector('tbody');
            if (!tableBody) return;

            const rows = tableBody.querySelectorAll('tr');

            for (const row of rows) {
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (!checkbox || String(checkbox.value) !== String(leadId)) continue;

                const cells = row.querySelectorAll('td');
                if (cells.length > 6) {
                    const todoCell = cells[7];

                    // Set up mutation observer for this specific cell
                    const observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                                console.log(`🔍 TODO CHANGE DETECTED: Lead ${leadId}`);

                                if (hasTodoContent(todoCell)) {
                                    const hasGreenHighlight = row.classList.contains('green-highlighted') ||
                                                             row.getAttribute('data-highlight') === 'green' ||
                                                             (row.getAttribute('style') || '').includes('rgba(16, 185, 129');

                                    if (hasGreenHighlight) {
                                        removeGreenHighlight(row, leadId, 'Real-time TODO change detected');
                                    }
                                }
                            }
                        });
                    });

                    observer.observe(todoCell, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });

                    console.log(`👁️ MONITORING: Set up TODO change observer for lead ${leadId}`);
                }
                break;
            }
        } catch (error) {
            console.error(`❌ MONITORING ERROR for lead ${leadId}:`, error);
        }
    }

    // Function to start monitoring
    function startGreenHighlightRemover() {
        console.log('🚀 STARTING: Green highlight remover system...');

        // Initial scan
        setTimeout(scanAndRemoveGreenHighlights, 1000);

        // Aggressive periodic scanning every 3 seconds to counter reapplication
        setInterval(scanAndRemoveGreenHighlights, 3000);

        // Monitor table changes
        const targetNode = document.body;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const hasTableChanges = Array.from(mutation.addedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            return node.matches('tr') || node.querySelector('tr') ||
                                   node.matches('td') || node.querySelector('td');
                        }
                        return false;
                    });

                    if (hasTableChanges) {
                        console.log('🔄 TABLE CHANGE: Scheduling green highlight scan...');
                        setTimeout(scanAndRemoveGreenHighlights, 500);
                    }
                }
            });
        });

        observer.observe(targetNode, { childList: true, subtree: true });

        // Make functions globally available
        window.greenHighlightRemover = {
            scan: scanAndRemoveGreenHighlights,
            monitor: monitorLeadTodoChanges,
            remove: removeGreenHighlight
        };

        console.log('✅ STARTED: Green highlight remover system active');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startGreenHighlightRemover);
    } else {
        startGreenHighlightRemover();
    }

    // Also initialize after a delay
    setTimeout(startGreenHighlightRemover, 2000);

    console.log('🟢 Green Highlight Remover Script Loaded');

})();