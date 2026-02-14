// Fix for clickable phone/email processing - DISABLED for clients table
// This script is disabled to prevent unwanted clickable wrappers in client table

(function() {
    console.log('🔧 Clickable elements fix - DISABLED for plain text display...');
    return; // Exit early to disable all clickable processing

    // Override the generateClientRows function to add scanning after content is set
    if (window.generateClientRows) {
        const originalGenerateClientRows = window.generateClientRows;

        window.generateClientRows = async function(page) {
            console.log('📞 Enhanced generateClientRows - page:', page);
            const content = await originalGenerateClientRows(page);

            // Add scanning after a short delay to ensure DOM is updated
            setTimeout(() => {
                if (window.scanForClickableContent) {
                    console.log('🔍 Scanning client rows for clickable elements...');
                    const clientsView = document.querySelector('.clients-view');
                    if (clientsView) {
                        window.scanForClickableContent(clientsView);

                        // Double-check after processing
                        setTimeout(() => {
                            const clickables = clientsView.querySelectorAll('.clickable-phone, .clickable-email');
                            console.log(`✅ Found ${clickables.length} clickable elements after processing`);

                            if (clickables.length === 0) {
                                console.log('⚠️ No clickables found, trying manual cell processing...');
                                const cells = clientsView.querySelectorAll('td');
                                cells.forEach(cell => {
                                    const text = cell.textContent.trim();
                                    if (text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) ||
                                        text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)) {
                                        window.scanForClickableContent(cell);
                                    }
                                });
                            }
                        }, 200);
                    }
                }
            }, 100);

            return content;
        };
    }

    // Also override the goToClientPage function to ensure scanning happens
    if (window.goToClientPage) {
        const originalGoToClientPage = window.goToClientPage;

        window.goToClientPage = function(page) {
            console.log('📞 Enhanced goToClientPage - page:', page);
            const result = originalGoToClientPage(page);

            // Add scanning after table is populated
            setTimeout(() => {
                if (window.scanForClickableContent) {
                    console.log('🔍 Scanning after page navigation for clickable elements...');
                    const clientsView = document.querySelector('.clients-view');
                    if (clientsView) {
                        window.scanForClickableContent(clientsView);
                    }
                }
            }, 500);

            return result;
        };
    }

    // Add a mutation observer to catch when table content changes
    function setupTableObserver() {
        const tbody = document.getElementById('clientsTableBody');
        if (tbody) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Check if actual client rows were added (not just loading spinner)
                        const hasClientRows = Array.from(mutation.addedNodes).some(node => {
                            return node.nodeType === 1 &&
                                   node.querySelector &&
                                   (node.querySelector('.client-name') ||
                                    node.textContent.includes('@') ||
                                    node.textContent.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/));
                        });

                        if (hasClientRows) {
                            console.log('🔍 Table content changed, scanning for clickable elements...');
                            setTimeout(() => {
                                if (window.scanForClickableContent) {
                                    const clientsView = document.querySelector('.clients-view');
                                    if (clientsView) {
                                        window.scanForClickableContent(clientsView);

                                        setTimeout(() => {
                                            const clickables = clientsView.querySelectorAll('.clickable-phone, .clickable-email');
                                            console.log(`✅ Mutation observer found ${clickables.length} clickable elements`);
                                        }, 100);
                                    }
                                }
                            }, 100);
                        }
                    }
                });
            });

            observer.observe(tbody, {
                childList: true,
                subtree: true
            });

            console.log('👀 Table mutation observer setup complete');
        }
    }

    // Setup observer when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupTableObserver);
    } else {
        setupTableObserver();
    }

    // Also setup when clients view is loaded
    const originalSetActiveTab = window.setActiveTab;
    if (originalSetActiveTab) {
        window.setActiveTab = function(tab) {
            const result = originalSetActiveTab(tab);

            if (tab === 'clients') {
                setTimeout(setupTableObserver, 500);
            }

            return result;
        };
    }

    console.log('✅ Clickable elements fix loaded successfully');
})();