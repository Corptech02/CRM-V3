// Simple Reports Call Count Fix - Only fix the data, keep original UI
console.log('🔧 SIMPLE FIX: Patching call counts without changing UI...');

// Let the original function run, then patch the displayed numbers
document.addEventListener('DOMContentLoaded', function() {
    // Monitor for modal creation
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    console.log('🔍 Node added:', node.className, node.tagName);

                    // Look for agent performance modals with multiple detection methods
                    const agentModal = node.querySelector && (
                        node.querySelector('.agent-performance-content') ||
                        node.classList.contains('agent-profile-modal') ||
                        (node.classList.contains('modal-overlay') && node.innerHTML && node.innerHTML.includes('Performance Profile'))
                    );

                    if (agentModal) {
                        console.log('🔧 Found agent modal, fixing call counts...');
                        setTimeout(() => fixCallCountsInModal(node), 100);
                    } else if (node.innerHTML && node.innerHTML.includes('Performance Profile')) {
                        console.log('🔧 Found Performance Profile text, trying fix...');
                        setTimeout(() => fixCallCountsInModal(node), 100);
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

function fixCallCountsInModal(modalElement) {
    try {
        console.log('🔧 fixCallCountsInModal called on element:', modalElement.className, modalElement.tagName);

        // Extract agent name from modal title
        const titleElement = modalElement.querySelector('h2');
        console.log('🔍 Title element found:', titleElement?.textContent);
        if (!titleElement) {
            console.log('❌ No h2 title element found');
            return;
        }

        const titleText = titleElement.textContent;
        const agentNameMatch = titleText.match(/(\w+)\s+Performance Profile/);
        console.log('🔍 Agent name match:', agentNameMatch);
        if (!agentNameMatch) {
            console.log('❌ No agent name found in title:', titleText);
            return;
        }

        const agentName = agentNameMatch[1];
        console.log(`🔧 Fixing call counts for agent: ${agentName}`);

        // Calculate correct call counts
        const allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const agentLeads = allLeads.filter(lead => {
            const assignedTo = lead.assignedTo || lead.agent || '';
            return assignedTo.toLowerCase() === agentName.toLowerCase();
        });

        let totalConnectedCalls = 0;
        let totalCallAttempts = 0;

        agentLeads.forEach(lead => {
            if (lead.reachOut) {
                const connected = lead.reachOut.callsConnected || 0;
                const attempts = lead.reachOut.callAttempts || 0;
                totalConnectedCalls += connected;
                totalCallAttempts += attempts;

                if (connected > 0) {
                    console.log(`📞 ${lead.name}: ${connected} connected calls`);
                }
            }
        });

        console.log(`📊 ${agentName}: ${totalConnectedCalls} total connected calls from ${agentLeads.length} leads`);

        // Find and update the Total Calls display
        console.log('🔍 Searching for Total Calls elements...');
        const callElements = modalElement.querySelectorAll('*');
        console.log('🔍 Found elements to check:', callElements.length);

        let foundCallElement = false;
        callElements.forEach((element, index) => {
            if (element.textContent === '0' &&
                element.nextElementSibling &&
                element.nextElementSibling.textContent === 'Total Calls') {

                console.log('🔧 Found Total Calls element! Updating from 0 to', totalConnectedCalls);
                foundCallElement = true;
                element.textContent = totalConnectedCalls;
                element.style.color = totalConnectedCalls > 0 ? '#059669' : '#dc2626';

                // Also update the parent container background
                const parent = element.closest('div[style*="background"]');
                if (parent && totalConnectedCalls > 0) {
                    parent.style.background = '#f0fdf4';
                    parent.style.borderColor = '#bbf7d0';
                }
            }
        });

        // Look for elements that contain "Total Calls" text
        const textNodes = [];
        const walker = document.createTreeWalker(
            modalElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let textNode;
        while (textNode = walker.nextNode()) {
            if (textNode.textContent.includes('Total Calls')) {
                const parent = textNode.parentElement;
                const valueElement = parent.previousElementSibling;
                if (valueElement && valueElement.textContent === '0') {
                    console.log('🔧 Found Total Calls element, updating...');
                    valueElement.textContent = totalConnectedCalls;
                    valueElement.style.color = totalConnectedCalls > 0 ? '#059669' : '#dc2626';
                }
            }
        }

        // Check if we found and updated any elements
        if (!foundCallElement) {
            console.log('❌ Could not find Total Calls element to update');
            console.log('🔍 Searching for any elements containing "Total Calls"...');

            // Alternative search
            const allElements = modalElement.querySelectorAll('*');
            allElements.forEach((element, index) => {
                if (element.textContent && element.textContent.includes('Total Calls')) {
                    console.log(`🔍 Found "Total Calls" in element ${index}:`, element.textContent, element.outerHTML.substring(0, 100));
                }
                if (element.textContent === '0') {
                    console.log(`🔍 Found "0" in element ${index}:`, element.outerHTML.substring(0, 100));
                }
            });
        }

        // Add a small indicator that the fix was applied
        const indicator = modalElement.querySelector('h2');
        if (indicator && !indicator.textContent.includes('(FIXED)')) {
            indicator.innerHTML += ' <span style="color: #10b981; font-size: 14px;">(FIXED)</span>';
        }

    } catch (error) {
        console.error('❌ Error fixing call counts:', error);
    }
}

// Manual trigger function for testing
window.manualFixCallCounts = function(agentName = 'Grant') {
    console.log(`🔧 Manual fix triggered for ${agentName}`);
    const modal = document.querySelector('.agent-profile-modal') || document.querySelector('[class*="modal"]');
    if (modal) {
        console.log('🔧 Found modal manually, applying fix...');
        fixCallCountsInModal(modal);
    } else {
        console.log('❌ No modal found for manual fix');
    }
};

// Direct fix function that finds and updates any "0" next to "Total Calls"
window.directFixCallCounts = function(agentName = 'Grant') {
    console.log(`🔧 DIRECT FIX for ${agentName}`);

    // Calculate correct call count
    const allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const agentLeads = allLeads.filter(lead => {
        const assignedTo = lead.assignedTo || lead.agent || '';
        return assignedTo.toLowerCase() === agentName.toLowerCase();
    });

    let totalConnectedCalls = 0;
    agentLeads.forEach(lead => {
        if (lead.reachOut) {
            const connected = lead.reachOut.callsConnected || 0;
            totalConnectedCalls += connected;
            if (connected > 0) {
                console.log(`📞 ${lead.name}: ${connected} connected calls`);
            }
        }
    });

    console.log(`📊 ${agentName}: ${totalConnectedCalls} total connected calls`);

    // Find ALL elements containing "0" and check if they're near "Total Calls"
    const allElements = document.querySelectorAll('*');
    let fixed = false;

    allElements.forEach(element => {
        if (element.textContent === '0') {
            const parent = element.parentElement;
            const nextSib = element.nextElementSibling;
            const prevSib = element.previousElementSibling;

            // Check if this "0" is related to "Total Calls"
            if (nextSib && nextSib.textContent && nextSib.textContent.includes('Total Calls')) {
                console.log('🔧 FOUND IT! Updating Total Calls from 0 to', totalConnectedCalls);
                element.textContent = totalConnectedCalls;
                element.style.color = '#059669';
                element.style.fontWeight = 'bold';
                fixed = true;
            } else if (parent && parent.textContent && parent.textContent.includes('Total Calls')) {
                console.log('🔧 FOUND IT! (parent check) Updating Total Calls from 0 to', totalConnectedCalls);
                element.textContent = totalConnectedCalls;
                element.style.color = '#059669';
                element.style.fontWeight = 'bold';
                fixed = true;
            }
        }
    });

    if (!fixed) {
        console.log('❌ Could not find Total Calls element to update');
        // Show all elements that contain "Total Calls"
        allElements.forEach(element => {
            if (element.textContent && element.textContent.includes('Total Calls')) {
                console.log('🔍 Found Total Calls element:', element.outerHTML.substring(0, 200));
            }
        });
    } else {
        console.log('✅ Successfully updated Total Calls!');
    }
};

console.log('✅ Simple call count fix loaded - will patch numbers when modals appear');
console.log('🧪 Test with: window.manualFixCallCounts("Grant")');