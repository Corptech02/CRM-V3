// DISABLED: My Leads Only Toggle - now handled by my-leads-toggle-direct.js
console.log('🚫 My Leads Toggle DISABLED - handled by my-leads-toggle-direct.js');

// Global toggle state
// window.myLeadsOnlyActive = false;

// Create the toggle HTML - DISABLED
function createToggleHTML_DISABLED() {
    return `
        <div style="display: flex; align-items: center; gap: 6px; margin-right: 8px;">
            <label style="position: relative; display: inline-block; width: 32px; height: 16px;">
                <input type="checkbox" id="myLeadsToggle" onchange="window.toggleMyLeadsFilter(this.checked)"
                       style="opacity: 0; width: 0; height: 0;">
                <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                           background-color: #ccc; border-radius: 16px; transition: .3s; ${window.myLeadsOnlyActive ? 'background-color: #3b82f6;' : ''}">
                    <span style="position: absolute; content: ''; height: 12px; width: 12px; left: 2px; bottom: 2px;
                               background-color: white; border-radius: 50%; transition: .3s;
                               ${window.myLeadsOnlyActive ? 'transform: translateX(16px);' : ''}"></span>
                </span>
            </label>
            <span style="font-size: 0.75rem; color: #374151; white-space: nowrap;">
                <i class="fas fa-user" style="color: #3b82f6; margin-right: 2px;"></i>Mine
            </span>
            <span id="myLeadsCounter" style="font-size: 0.65rem; color: #6b7280;"></span>
        </div>
    `;
}

// Toggle function - override any existing toggleMyLeadsFilter function
window.toggleMyLeadsFilter = function(enabled) {
    console.log('🔄 NEW TOGGLE: My Leads Filter:', enabled ? 'ENABLED' : 'DISABLED');
    window.myLeadsOnlyActive = enabled;

    // Apply filter
    filterTableRows();
    updateLeadCounter();

    // Update toggle styling
    const slider = document.querySelector('#myLeadsToggle + span');
    const dot = slider?.querySelector('span');
    if (slider && dot) {
        if (enabled) {
            slider.style.backgroundColor = '#3b82f6';
            dot.style.transform = 'translateX(16px)';
        } else {
            slider.style.backgroundColor = '#ccc';
            dot.style.transform = 'translateX(0)';
        }
    }
};

// Legacy function name for compatibility
window.toggleMyLeads = function(enabled) {
    console.log('🔄 Legacy Toggle My Leads:', enabled);
    window.toggleMyLeadsFilter(enabled);
};

// Get current user
function getCurrentUser() {
    try {
        const userData = sessionStorage.getItem('vanguard_user');
        if (userData) {
            const user = JSON.parse(userData);
            return user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
        }
    } catch (e) {
        console.warn('Error getting user:', e);
    }
    return '';
}

// Filter grouped lead sections (not individual table rows)
function filterTableRows() {
    const currentUser = getCurrentUser();
    console.log(`🔍 Filtering leads for user: "${currentUser}"`);
    console.log(`🔘 Toggle state - My Leads Only: ${window.myLeadsOnlyActive ? 'ENABLED' : 'DISABLED'}`);

    // Find all lead group headers (like "Grant's Leads", "Carson's Leads", etc.)
    const leadGroups = document.querySelectorAll('h3, .lead-group-header, [style*="font-weight: bold"]');

    if (leadGroups.length === 0) {
        console.warn('❌ No lead group headers found, trying to find lead sections...');

        // Fallback: Look specifically for lead group elements with very specific criteria
        const allElements = document.querySelectorAll('*');
        const groupElements = Array.from(allElements).filter(el => {
            const text = el.textContent || '';
            // Must contain the exact pattern of lead groups AND be a reasonable length
            const hasLeadPattern = text.includes("'s Leads (") || text.includes(" Leads (");
            const isReasonableLength = text.length > 10 && text.length < 100; // Not too short or too long
            const isNotNavigationOrHeader = !text.includes('Dashboard') && !text.includes('Settings') &&
                                          !text.includes('Reports') && !text.includes('SIP Phone') &&
                                          !text.includes('Navigation') && !text.includes('Menu');

            return hasLeadPattern && isReasonableLength && isNotNavigationOrHeader;
        });

        console.log(`Found ${groupElements.length} potential lead group elements`);
        groupElements.forEach((el, index) => {
            console.log(`Group ${index + 1}: "${el.textContent.trim()}"`);
        });

        if (groupElements.length === 0) {
            console.error('❌ Could not find any lead groups to filter');
            return;
        }

        filterLeadGroups(groupElements, currentUser);
    } else {
        console.log(`Found ${leadGroups.length} lead group headers`);
        // Convert NodeList to Array
        const leadGroupsArray = Array.from(leadGroups);
        filterLeadGroups(leadGroupsArray, currentUser);
    }
}

function filterLeadGroups(groupElements, currentUser) {
    let totalLeadsVisible = 0;
    let myLeadsVisible = 0;

    // Ensure groupElements is an array
    if (!Array.isArray(groupElements)) {
        console.error('❌ groupElements is not an array:', typeof groupElements);
        return;
    }

    console.log(`📋 Received ${groupElements.length} group elements to process`);

    // Only process elements that actually look like lead group headers
    const validGroupElements = groupElements.filter(el => {
        const text = el.textContent || '';
        const isValidLeadGroup = (text.includes("'s Leads (") || text.includes(" Leads (")) &&
                                 (text.includes('Grant') || text.includes('Carson') || text.includes('Hunter') ||
                                  text.includes('Closed') || text.includes('Unassigned') || text.includes('New'));

        if (!isValidLeadGroup) {
            console.log(`⚠️ Skipping invalid group: "${text}"`);
        }
        return isValidLeadGroup;
    });

    console.log(`📋 Processing ${validGroupElements.length} valid lead groups`);

    validGroupElements.forEach((groupEl, index) => {
        const groupText = groupEl.textContent || '';
        console.log(`🔍 Checking group ${index + 1}: "${groupText}"`);

        // CRITICAL: Don't touch navigation, sidebar, or header elements
        const isNavigationElement = groupEl.closest('.sidebar') || groupEl.closest('.navigation') ||
                                   groupEl.closest('.header') || groupEl.closest('.menu') ||
                                   groupEl.className.includes('nav') || groupEl.className.includes('sidebar');

        if (isNavigationElement) {
            console.log(`⚠️ Skipping navigation element: "${groupText}"`);
            return; // Skip this element entirely
        }

        // Check if this group belongs to current user
        const isMyGroup = groupText.includes(`${currentUser}'s Leads`) ||
                         groupText.toLowerCase().includes(`${currentUser.toLowerCase()}'s leads`);

        // Check if this is unassigned or closed leads (always show leads when toggle enabled)
        const isUnassignedOrClosed = groupText.includes('Unassigned') ||
                                   groupText.includes('Closed Leads') ||
                                   groupText.includes('New Leads');

        // ALWAYS KEEP THE LEAD GROUP HEADER VISIBLE
        console.log(`📋 Keeping lead group header visible: "${groupText}"`);

        let shouldShowLeadsInGroup;
        if (!window.myLeadsOnlyActive) {
            // DISABLED = Show all leads under all headers
            shouldShowLeadsInGroup = true;
            console.log(`📋 Showing all leads under: "${groupText}"`);
        } else {
            // ENABLED = Show leads only under my groups + unassigned/closed
            shouldShowLeadsInGroup = isMyGroup || isUnassignedOrClosed;
            console.log(`👤 ${shouldShowLeadsInGroup ? 'Showing' : 'Hiding'} leads under: "${groupText}" (isMyGroup: ${isMyGroup}, isSpecial: ${isUnassignedOrClosed})`);
        }

        // Find all elements between this group header and the next one
        let currentElement = groupEl.nextElementSibling;
        let leadCount = 0;

        while (currentElement) {
            // Stop if we hit another group header
            const currentText = currentElement.textContent || '';
            if (currentText.includes("'s Leads (") || currentText.includes(" Leads (")) {
                break;
            }

            // Check if this looks like a lead entry - contains company name and other lead data
            const isLeadElement = currentText.includes('Commercial Auto') ||
                                 currentText.includes('Grant') ||
                                 currentText.includes('Carson') ||
                                 currentText.includes('Hunter') ||
                                 (currentText.length > 100 && currentText.includes('$'));

            if (isLeadElement && currentElement.style) {
                leadCount++;

                if (shouldShowLeadsInGroup) {
                    currentElement.style.display = '';
                    totalLeadsVisible++;
                    if (isMyGroup) myLeadsVisible++;
                    if (leadCount <= 2) {
                        const companyName = currentText.split('\n')[0]?.trim() || 'Unknown';
                        console.log(`  ✅ Showing lead: "${companyName}"`);
                    }
                } else {
                    currentElement.style.display = 'none';
                    if (leadCount <= 2) {
                        const companyName = currentText.split('\n')[0]?.trim() || 'Unknown';
                        console.log(`  ❌ Hiding lead: "${companyName}"`);
                    }
                }
            }

            currentElement = currentElement.nextElementSibling;
        }

        console.log(`  📊 Group "${groupText}" has ${leadCount} lead items processed`);
    });

    console.log(`📊 Result: ${window.myLeadsOnlyActive ? `Showing ${myLeadsVisible} of ${totalLeadsVisible} leads (headers always visible)` : `Showing all ${totalLeadsVisible} leads`}`);
}

// Update counter
function updateLeadCounter() {
    const counter = document.getElementById('myLeadsCounter');
    if (!counter) return;

    const tableBody = document.querySelector('#leadsTable tbody, #leadsTableBody');
    if (!tableBody) return;

    const allRows = tableBody.querySelectorAll('tr');
    const visibleRows = Array.from(allRows).filter(row => row.style.display !== 'none');

    if (window.myLeadsOnlyActive) {
        // When enabled, show "Mine (29 of 62 leads)"
        counter.textContent = `(${visibleRows.length} of ${allRows.length} leads)`;
        console.log(`📊 Counter updated: ${visibleRows.length} of ${allRows.length} leads showing`);
    } else {
        // When disabled, show total count
        counter.textContent = `(${allRows.length} total)`;
        console.log(`📊 Counter updated: ${allRows.length} total leads showing`);
    }
}

// DISABLED: Insert toggle into table header - handled by my-leads-toggle-direct.js
function insertToggle_DISABLED() {
    console.log('🚫 Toggle insertion DISABLED - handled by my-leads-toggle-direct.js');
    return false;

    // Check if toggle already exists
    if (document.querySelector('#myLeadsToggle')) {
        console.log('ℹ️ Toggle already exists');
        return true;
    }

    // Try multiple selectors to find a header to insert the toggle
    const selectors = [
        '#leadsTable th:nth-child(2)', // Name column in main leads table
        '.data-table th:nth-child(2)',  // Generic data table
        'table th:nth-child(2)',        // Any table header
        '#leadsTableBody th:nth-child(2)', // Alternative table body
        'th:contains("Name")',          // Header containing "Name"
        'th'                            // Any table header as fallback
    ];

    let nameHeader = null;
    let selectorUsed = '';

    for (const selector of selectors) {
        try {
            nameHeader = document.querySelector(selector);
            if (nameHeader) {
                selectorUsed = selector;
                console.log(`✅ Found header with selector: ${selector}`);
                console.log(`📍 Header content: "${nameHeader.textContent.trim()}"`);
                break;
            }
        } catch (e) {
            console.log(`⚠️ Selector failed: ${selector}`);
        }
    }

    if (!nameHeader) {
        console.warn('❌ No suitable header found for toggle insertion');
        console.log('Available headers:');
        document.querySelectorAll('th, .header, [class*="header"]').forEach((header, i) => {
            console.log(`  ${i+1}. "${header.textContent.trim()}" (${header.tagName}.${header.className})`);
        });
        return false;
    }

    console.log(`✅ Using header: "${nameHeader.textContent}" with selector: ${selectorUsed}`);

    // Insert toggle at the beginning of the header
    const originalContent = nameHeader.innerHTML;
    nameHeader.innerHTML = createToggleHTML() + originalContent;
    nameHeader.style.display = 'flex';
    nameHeader.style.alignItems = 'center';
    nameHeader.style.justifyContent = 'flex-start';
    nameHeader.style.minWidth = '180px';

    console.log('✅ Toggle inserted successfully!');
    updateLeadCounter();
    return true;
}

// DISABLED: Fallback insert toggle - handled by my-leads-toggle-direct.js
function insertToggleAtTop_DISABLED() {
    console.log('🚫 Top toggle insertion DISABLED - handled by my-leads-toggle-direct.js');
    return false;

    const leadsView = document.querySelector('.leads-view, .dashboard-content, main, body');
    if (!leadsView) {
        console.warn('❌ No container found for toggle');
        return false;
    }

    const toggleContainer = document.createElement('div');
    toggleContainer.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 15px 0;">
            <strong style="color: #374151;">My Leads Filter:</strong>
            ${createToggleHTML()}
        </div>
    `;

    leadsView.insertBefore(toggleContainer, leadsView.firstChild);
    console.log('✅ Toggle inserted at top of page!');
    updateLeadCounter();
    return true;
}

// DISABLED - Header insertion disabled to prevent duplicates
function tryInsertToggle() {
    console.log('⚠️ OLD TOGGLE INSERTION DISABLED - Using my-leads-toggle-direct.js for button placement');
    return;
}

// Start immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInsertToggle);
} else {
    tryInsertToggle();
}

// Also try when hash changes to leads
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#leads') {
        setTimeout(tryInsertToggle, 1000);
    }
});

// Try immediately if we're on leads page
if (window.location.hash === '#leads') {
    setTimeout(tryInsertToggle, 1000);
}

// Test function you can run from console
window.testMyLeadsToggle = function() {
    console.log('🧪 Testing My Leads Toggle...');
    console.log('Current user:', getCurrentUser());
    console.log('Toggle state:', window.myLeadsOnlyActive);

    // Look for VALID lead group headers only
    const allElements = document.querySelectorAll('*');
    const allGroups = Array.from(allElements).filter(el => {
        const text = el.textContent || '';
        return text.includes("'s Leads (") || text.includes(" Leads (");
    });

    console.log(`Found ${allGroups.length} total elements with "Leads (" pattern:`);
    allGroups.forEach((el, index) => {
        const text = el.textContent.trim();
        const isValid = (text.includes('Grant') || text.includes('Carson') || text.includes('Hunter') ||
                        text.includes('Closed') || text.includes('Unassigned') || text.includes('New'));
        console.log(`  ${index + 1}. "${text}" ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    });

    // Filter to valid groups only
    const validGroups = allGroups.filter(el => {
        const text = el.textContent || '';
        return (text.includes('Grant') || text.includes('Carson') || text.includes('Hunter') ||
               text.includes('Closed') || text.includes('Unassigned') || text.includes('New'));
    });

    console.log(`\n📋 ${validGroups.length} VALID lead groups found:`);
    validGroups.forEach((el, index) => {
        console.log(`  ${index + 1}. "${el.textContent.trim()}"`);
    });

    filterTableRows();
    updateLeadCounter();
};

console.log('🎯 My Leads Toggle script loaded');
console.log('💡 Run window.testMyLeadsToggle() in console to debug');