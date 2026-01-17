/**
 * Force Add ViciDial Report Button to Agent Performance Section
 * This script will find any Agent Performance heading and add the button
 */

(function() {
    'use strict';

    console.log('🔧 ViciDial Button Injector Loading...');

    function addViciDialButton() {
        // First, remove any existing ViciDial buttons to prevent duplicates
        const existingButtons = document.querySelectorAll('.vicidial-report-btn');
        existingButtons.forEach(btn => {
            console.log('🗑️ Removing existing ViciDial button');
            btn.remove();
        });

        // Find the specific h3 with "Agent Performance" text that's NOT inside a report-card
        // Look specifically for the one in the recent-reports section
        const agentHeaders = document.querySelectorAll('h3');

        for (let h3 of agentHeaders) {
            if (h3.textContent && h3.textContent.trim() === 'Agent Performance') {
                // Skip if this h3 is inside a report-card (that's the wrong one)
                if (h3.closest('.report-card')) {
                    console.log('📊 Skipping Agent Performance h3 inside report-card:', h3);
                    continue;
                }

                // Also check if this is in the recent-reports section (the right one)
                const isInRecentReports = h3.closest('.recent-reports') || h3.parentElement.className.includes('recent-reports');

                console.log('📊 Found Agent Performance h3:', {
                    element: h3,
                    inReportCard: !!h3.closest('.report-card'),
                    inRecentReports: isInRecentReports,
                    parentClass: h3.parentElement.className,
                    parentId: h3.parentElement.id
                });

                // Create the ViciDial button
                const viciDialButton = document.createElement('button');
                viciDialButton.className = 'vicidial-report-btn btn-primary';
                viciDialButton.innerHTML = '<i class="fas fa-phone-alt"></i> ViciDial Report';
                viciDialButton.style.cssText = `
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    border: none;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #3b82f6;
                    color: white;
                    transition: all 0.2s;
                    margin-left: 16px;
                    float: right;
                `;

                // Add hover effect
                viciDialButton.addEventListener('mouseenter', function() {
                    this.style.background = '#2563eb';
                    this.style.transform = 'translateY(-1px)';
                });

                viciDialButton.addEventListener('mouseleave', function() {
                    this.style.background = '#3b82f6';
                    this.style.transform = 'translateY(0)';
                });

                // Add click handler
                viciDialButton.addEventListener('click', function() {
                    console.log('🔗 Opening ViciDial Report...');
                    window.open('http://204.13.233.29/vicidial/AST_agent_performance_detail.php', '_blank');
                });

                // Style the h3 container to allow inline button placement
                if (!h3.style.display) {
                    h3.style.display = 'flex';
                    h3.style.alignItems = 'center';
                    h3.style.justifyContent = 'space-between';
                    h3.style.width = '100%';
                }

                // Remove float and adjust button for inline placement
                viciDialButton.style.float = 'none';
                viciDialButton.style.marginLeft = 'auto';

                // Append the button directly to the h3 element
                h3.appendChild(viciDialButton);

                console.log('✅ ViciDial button added inline with h3');
                return; // Exit after adding the first one
            }
        }

        console.log('⚠️ Agent Performance h3 not found, will retry...');
    }

    // Try immediately
    addViciDialButton();

    // Try after DOM loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addViciDialButton, 100);
        });
    } else {
        setTimeout(addViciDialButton, 100);
    }

    // Try after a longer delay (for dynamically loaded content)
    setTimeout(addViciDialButton, 1000);
    setTimeout(addViciDialButton, 3000);
    setTimeout(addViciDialButton, 5000);

    // Watch for dynamic content changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check if new content contains Agent Performance
                        if (node.textContent && node.textContent.includes('Agent Performance')) {
                            console.log('🔄 Agent Performance content detected, adding button...');
                            setTimeout(addViciDialButton, 100);
                        }

                        // Also check child nodes
                        const agentElements = node.querySelectorAll && node.querySelectorAll('*');
                        if (agentElements) {
                            for (let element of agentElements) {
                                if (element.textContent && element.textContent.includes('Agent Performance')) {
                                    console.log('🔄 Agent Performance in child content detected, adding button...');
                                    setTimeout(addViciDialButton, 200);
                                    break;
                                }
                            }
                        }
                    }
                });
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('🔧 ViciDial Button Injector System Installed');
    console.log('👁️ Watching for Agent Performance sections...');

})();