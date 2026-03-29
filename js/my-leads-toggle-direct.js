// My Leads Toggle - Direct Element Targeting
console.log('🚀 Direct My Leads Toggle loading...');

window.myLeadsOnlyActive = false;

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

window.toggleMyLeadsFilter = function(enabled) {
    console.log('🔄 DIRECT TOGGLE:', enabled ? 'ENABLED' : 'DISABLED');
    window.myLeadsOnlyActive = enabled;

    const currentUser = getCurrentUser();
    console.log('👤 Current user:', currentUser);

    // Inject a style rule to force display:none with !important when class is applied
    if (!document.getElementById('my-leads-hide-style')) {
        const s = document.createElement('style');
        s.id = 'my-leads-hide-style';
        s.textContent = '.ml-hidden { display: none !important; }';
        document.head.appendChild(s);
    }

    function hideRow(row) { row.classList.add('ml-hidden'); }
    function showRow(row) { row.classList.remove('ml-hidden'); }

    function isMySection(text) {
        return text.includes(`${currentUser}'s Leads`) ||
               text.toLowerCase().includes(`${currentUser.toLowerCase()}'s leads`);
    }
    function isSpecialSection(text) {
        return text.includes('Unassigned') || text.includes('Closed') || text.includes('New Leads');
    }
    function isLeadsSectionText(text) {
        return text.includes("'s Leads") || text.includes(" Leads");
    }

    // Get all table rows
    const allRows = Array.from(document.querySelectorAll('tbody tr, table tr'));
    console.log(`📋 Found ${allRows.length} total table rows`);

    let hiddenCount = 0;
    let shownCount = 0;
    let currentSection = '';

    allRows.forEach(row => {
        // lead-divider rows — use data-agent or text to determine section
        if (row.classList.contains('lead-divider')) {
            const td = row.querySelector('td');
            const headerText = td ? td.textContent : '';
            if (isLeadsSectionText(headerText)) {
                currentSection = headerText;
                if (enabled) {
                    if (isMySection(headerText) || isSpecialSection(headerText)) {
                        showRow(row);
                    } else {
                        hideRow(row);
                        hiddenCount++;
                    }
                } else {
                    showRow(row);
                }
            }
            return;
        }

        // Other section header rows (colspan td with section name)
        const colspanTd = row.querySelector('td[colspan]');
        if (colspanTd) {
            const headerText = colspanTd.textContent || '';
            if (isLeadsSectionText(headerText)) {
                currentSection = headerText;
                if (enabled) {
                    if (isMySection(headerText) || isSpecialSection(headerText)) {
                        showRow(row);
                    } else {
                        hideRow(row);
                        hiddenCount++;
                    }
                } else {
                    showRow(row);
                }
                return;
            }
        }

        // Lead rows
        const isLeadRow = row.hasAttribute('data-lead-id') ||
                         row.classList.contains('timestamp-red') ||
                         row.classList.contains('timestamp-yellow') ||
                         row.classList.contains('timestamp-green') ||
                         row.querySelector('input.lead-checkbox') != null;

        if (isLeadRow) {
            const leadName = row.getAttribute('data-lead-name') || 'Unknown';
            const mine = isMySection(currentSection) || isSpecialSection(currentSection);
            if (enabled) {
                if (mine) { showRow(row); shownCount++; }
                else { hideRow(row); hiddenCount++; }
            } else {
                showRow(row);
                shownCount++;
            }
        }
    });

    console.log(`📊 ${enabled ? `Hidden ${hiddenCount}, shown ${shownCount}` : `Restored ${shownCount} items`}`);
    updateToggleUI(enabled);
};

function updateToggleUI(enabled) {
    updateToggleButtonUI();
}

// Function to remove all toggle buttons - AGGRESSIVE REMOVAL
window.removeAllToggles = function() {
    console.log('🧹 AGGRESSIVE TOGGLE REMOVAL STARTING...');

    // Remove by ID
    const byId = document.querySelectorAll('#myLeadsToggle');
    console.log(`Found ${byId.length} toggles by ID`);
    byId.forEach(el => el.remove());

    // Remove by class
    const byClass = document.querySelectorAll('.toggle-button, .my-leads-toggle');
    console.log(`Found ${byClass.length} toggles by class`);
    byClass.forEach(el => el.remove());

    // Remove by text content
    const allButtons = document.querySelectorAll('button');
    const toggleButtons = Array.from(allButtons).filter(btn =>
        btn.textContent.includes('My Leads') ||
        btn.textContent.includes('My Leads Only')
    );
    console.log(`Found ${toggleButtons.length} toggles by text content`);
    toggleButtons.forEach(btn => btn.remove());

    // Remove any toggle-related elements in headers/tables
    const headerElements = document.querySelectorAll('th *:has(input[type="checkbox"]), td *:has(input[type="checkbox"])');
    const toggleHeaders = Array.from(headerElements).filter(el =>
        el.textContent.includes('My Leads') ||
        el.innerHTML.includes('toggle')
    );
    console.log(`Found ${toggleHeaders.length} header toggles`);
    toggleHeaders.forEach(el => el.remove());

    // Nuclear option: remove any element containing "My Leads Only"
    const allElements = document.querySelectorAll('*');
    const myLeadsElements = Array.from(allElements).filter(el =>
        el.textContent === 'My Leads Only' ||
        el.textContent === 'My Leads Only ✓'
    );
    console.log(`Found ${myLeadsElements.length} elements with exact text match`);
    myLeadsElements.forEach(el => {
        const parent = el.closest('button, div, span');
        if (parent) parent.remove();
    });

    console.log('✅ AGGRESSIVE TOGGLE REMOVAL COMPLETE');
};

function insertToggle() {
    // Only insert toggle if we're on the leads tab
    const currentHash = window.location.hash;
    if (currentHash !== '#leads') {
        console.log('🚫 Not on leads tab, skipping toggle insertion');
        return;
    }

    // Check if toggle already exists - if so, just wire up behavior
    if (document.getElementById('myLeadsToggle')) {
        console.log('✅ Toggle already exists in DOM, wiring up behavior');
        setupToggleBehavior();
        return;
    }

    // Remove any existing toggles first
    window.removeAllToggles();

    // Wait a moment for DOM cleanup, then check again
    setTimeout(() => {
        // Double-check that no toggle exists after cleanup
        if (document.getElementById('myLeadsToggle')) {
            console.log('✅ Toggle exists after cleanup, wiring up behavior');
            setupToggleBehavior();
            return;
        }

        console.log('🔄 Inserting fresh toggle...');

        const toggleHTML = `
        <button type="button" id="myLeadsToggle" onclick="window.toggleMyLeadsFilter(!window.myLeadsOnlyActive)"
                style="margin-left: 6px; padding: 4px 7px; font-size: 12px; background: transparent; color: #9ca3af; border: 1px solid #4b5563; border-radius: 4px; cursor: pointer; vertical-align: middle; transition: all 0.2s;"
                title="My Leads Only">
            <i id="myLeadsToggleIcon" class="fas fa-eye"></i>
        </button>
    `;

    // ONLY target header-actions container - no fallbacks to prevent header insertion
    const headerActions = document.querySelector('.header-actions');
    console.log('🔍 Looking for header-actions:', headerActions ? 'FOUND' : 'NOT FOUND');

    if (headerActions) {
        console.log('📋 Header actions content:', headerActions.innerHTML.substring(0, 200));
        // Find the Sync Vicidial button to insert before it
        let syncButton = headerActions.querySelector('button[onclick*="syncVicidialLeads"]');

        if (!syncButton) {
            // Fallback: find button containing "Sync Vicidial" text
            const buttons = headerActions.querySelectorAll('button');
            syncButton = Array.from(buttons).find(btn => btn.textContent.includes('Sync Vicidial'));
        }

        if (!syncButton) {
            // Final fallback: just use the first button
            syncButton = headerActions.querySelector('button');
        }
        console.log('🎯 Sync button found:', syncButton ? 'YES' : 'NO');

        if (syncButton) {
            syncButton.insertAdjacentHTML('beforebegin', toggleHTML);
            console.log('✅ Toggle inserted before Sync Vicidial button in header-actions');
            setupToggleBehavior();
            return true;
        }

        // Fallback: insert at beginning of header actions only
        headerActions.insertAdjacentHTML('afterbegin', toggleHTML);
        console.log('✅ Toggle inserted at start of header-actions');
        setupToggleBehavior();
        return true;
    }

        console.warn('❌ Could not find .header-actions container - toggle will not be inserted to prevent duplicates');
        return false;
    }, 100); // Close the setTimeout
}

// Setup toggle behavior for button-style toggle
function setupToggleBehavior() {
    const toggleButton = document.getElementById('myLeadsToggle');
    if (!toggleButton) return;

    // Remove onclick and use addEventListener
    toggleButton.removeAttribute('onclick');

    toggleButton.addEventListener('click', function() {
        window.myLeadsOnlyActive = !window.myLeadsOnlyActive;
        window.toggleMyLeadsFilter(window.myLeadsOnlyActive);
        updateToggleButtonUI();
    });

    updateToggleButtonUI();
}

function updateToggleButtonUI() {
    const toggleButton = document.getElementById('myLeadsToggle');
    const icon = document.getElementById('myLeadsToggleIcon');

    if (toggleButton) {
        if (window.myLeadsOnlyActive) {
            toggleButton.style.background = '#1e40af';
            toggleButton.style.borderColor = '#3b82f6';
            toggleButton.style.color = '#93c5fd';
            if (icon) { icon.className = 'fas fa-eye-slash'; }
        } else {
            toggleButton.style.background = 'transparent';
            toggleButton.style.borderColor = '#4b5563';
            toggleButton.style.color = '#9ca3af';
            if (icon) { icon.className = 'fas fa-eye'; }
        }
    }
}

// Insert toggle with multiple retries - only if on leads tab
if (window.location.hash === '#leads') {
    setTimeout(insertToggle, 500);
    setTimeout(insertToggle, 1000);
    setTimeout(insertToggle, 2000);
    setTimeout(insertToggle, 3000);
    setTimeout(insertToggle, 5000);
}

// Also watch for DOM changes to catch header-actions being added dynamically
const observer = new MutationObserver(function(mutations) {
    if (window.location.hash === '#leads' &&
        document.querySelector('.header-actions') &&
        !document.getElementById('myLeadsToggle')) {
        console.log('🔄 Header actions detected on leads tab, inserting toggle...');
        // Use a slight delay to prevent multiple observers firing at once
        setTimeout(() => {
            if (!document.getElementById('myLeadsToggle')) {
                insertToggle();
            }
        }, 50);
    }
});

if (typeof window !== 'undefined' && window.document) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Also listen for hash changes (navigation)
window.addEventListener('hashchange', function(e) {
    const currentHash = window.location.hash;

    if (currentHash === '#leads') {
        console.log('🔄 Navigated to leads tab, checking for toggle...');
        setTimeout(insertToggle, 1000);
    } else {
        console.log('🧹 Navigated away from leads tab, removing toggles...');
        if (window.removeAllToggles) {
            window.removeAllToggles();
        }
    }
});

// Check immediately if we're already on leads page
if (window.location.hash === '#leads') {
    console.log('🔄 Already on leads tab, adding extra retries...');
    setTimeout(insertToggle, 100);
    setTimeout(insertToggle, 500);
}

window.testDirectToggle = function() {
    console.log('🧪 Testing Direct Toggle');
    console.log('User:', getCurrentUser());
    window.toggleMyLeadsFilter(!window.myLeadsOnlyActive);
};

// Immediately remove any existing toggles when this script loads
window.removeAllToggles();

console.log('🎯 Direct toggle loaded - try window.testDirectToggle()');
console.log('🧹 To remove all toggles manually: window.removeAllToggles()');