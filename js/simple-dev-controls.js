/**
 * SIMPLE Dev Controls for Agent Performance - Direct approach
 */

console.log('🚨 SIMPLE DEV CONTROLS LOADING...');

// Remove yellow background if it was added
document.body.style.backgroundColor = '';

window.ADD_DEV_BUTTON_NOW = function() {
    console.log('🚨 ADD_DEV_BUTTON_NOW called');

    // Find the modal containing performance data
    const modal = document.querySelector('[style*="max-width: 1000px"]');

    if (!modal) {
        alert('❌ Modal not found! Make sure the performance modal is open.');
        return;
    }

    console.log('✅ Modal found:', modal);

    // Create a very obvious dev button
    const devButton = document.createElement('div');
    devButton.innerHTML = `
        <div style="
            position: absolute;
            top: 10px;
            right: 60px;
            background: red;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            z-index: 9999;
            border: 3px solid black;
        " onclick="toggleDevMode()">
            🔧 DEV MODE
        </div>
    `;

    modal.style.position = 'relative';
    modal.appendChild(devButton);

    console.log('✅ DEV BUTTON ADDED TO MODAL!');
    alert('✅ DEV BUTTON ADDED! Look for red button in top-right of modal.');
};

window.toggleDevMode = function() {
    console.log('🔧 Dev Mode Toggled!');

    // Prevent rapid double-clicking
    if (window.devModeToggling) {
        console.log('🚫 Already toggling, ignoring...');
        return;
    }
    window.devModeToggling = true;

    // Find the dev mode button to update its styling
    const devButton = document.querySelector('.dev-mode-btn');

    // Simple approach: check if dev mode is currently active by button style
    const isCurrentlyActive = devButton && devButton.style.background === 'yellow';

    console.log('🔍 Dev mode currently active:', isCurrentlyActive);

    if (isCurrentlyActive) {
        // Disable dev mode - remove everything and reset
        console.log('🔧 DISABLING Dev Mode');

        // Remove dev controls panel
        const devControlsContainer = document.querySelector('.dev-controls-panel');
        if (devControlsContainer) {
            devControlsContainer.remove();
        }

        // Remove reset button
        const resetButton = document.querySelector('.dev-reset-button');
        if (resetButton) {
            resetButton.remove();
        }

        // Reset dev button styling
        if (devButton) {
            devButton.style.background = '#f3f4f6';
            devButton.style.color = '#374151';
        }

        // Remove all pencil icons
        const allPencilIcons = document.querySelectorAll('.edit-pencil');
        console.log(`🗑️ Removing ${allPencilIcons.length} pencil icons`);
        allPencilIcons.forEach(pencil => pencil.remove());

        console.log('🔧 Dev Mode DISABLED');

        // Reset the toggle flag
        setTimeout(() => {
            window.devModeToggling = false;
        }, 300);
        return;
    }

    // If not active, enable dev mode by creating new panel
    console.log('🔧 ENABLING Dev Mode');

    // Create dev controls panel
    const modal = document.querySelector('[style*="max-width: 1000px"]') || document.querySelector('.modal-content');
    if (!modal) {
        alert('❌ Modal not found!');
        return;
    }

    devControlsContainer = document.createElement('div');
    devControlsContainer.className = 'dev-controls-panel';
    devControlsContainer.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 300px;
        background: #1f2937;
        color: #f3f4f6;
        padding: 20px;
        border-radius: 8px;
        z-index: 999999999 !important;
        border: 2px solid #059669;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        max-height: 400px;
        overflow-y: auto;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8) !important;
    `;

    // Get current filter to determine available actions
    // Look for filter buttons with the active blue background style
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    let currentFilter = 'ytd'; // default fallback

    for (const btn of filterButtons) {
        const computedStyle = window.getComputedStyle(btn);
        const bgColor = computedStyle.backgroundColor;
        // Check for blue background color (active state)
        if (bgColor === 'rgb(37, 99, 235)' || btn.style.background === '#2563eb') {
            currentFilter = btn.getAttribute('data-filter');
            break;
        }
    }

    console.log('🔍 Current filter detected:', currentFilter);

    // Check if YTD filter is active
    const isYTD = currentFilter.toLowerCase().includes('ytd');

    devControlsContainer.innerHTML = `
        <h4 style="color: #10b981; margin: 0 0 15px 0; text-align: center;">🔧 DEV CONTROLS</h4>
        <div style="color: #fbbf24; margin-bottom: 10px;">Current Filter: <span style="color: #60a5fa;">${currentFilter.toUpperCase()}</span></div>

        ${isYTD ? `
            <div style="margin-bottom: 15px; padding: 10px; background: #374151; border-radius: 4px; text-align: center;">
                <div style="color: #10b981; font-weight: bold; margin-bottom: 5px;">📊 YTD MODE</div>
                <div style="color: #f3f4f6; font-size: 11px; margin-bottom: 8px;">Pencil icons active for visual editing</div>
                <div style="color: #fbbf24; font-size: 10px;">Note: Changes are visual only in YTD mode</div>

                <button onclick="window.forceAddPencilsDebug();"
                        style="width: 100%; margin-top: 8px; padding: 4px; background: #059669; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                    ✏️ REFRESH PENCIL ICONS
                </button>
            </div>
        ` : `
            <div style="margin-bottom: 15px; padding: 10px; background: #374151; border-radius: 4px;">
                <div style="color: #10b981; font-weight: bold; margin-bottom: 8px;">✏️ Inline Stat Editing Active</div>
                <div style="color: #f3f4f6; font-size: 11px; margin-bottom: 8px;">Pencil icons will appear next to all editable stats</div>

                <button onclick="activateInlineEditing()"
                        style="width: 100%; padding: 6px; background: #059669; color: white; border: none; border-radius: 2px; font-size: 11px; cursor: pointer; font-weight: bold;">
                    ✏️ ACTIVATE INLINE EDITING
                </button>

                <div style="margin-top: 8px;">
                    <button onclick="window.forceAddPencilsDebug();"
                            style="width: 100%; padding: 4px; background: #374151; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                        🎯 FORCE ADD PENCILS (DEBUG)
                    </button>
                </div>

                <div style="margin-top: 4px;">
                    <button onclick="console.log('🔍 Available functions:', Object.keys(window).filter(k => k.includes('activate'))); console.log('🔍 Modal elements:', document.querySelectorAll('.modal-content, .agent-performance-content'));"
                            style="width: 100%; padding: 2px; background: #ef4444; color: white; border: none; border-radius: 2px; font-size: 9px; cursor: pointer;">
                        🐛 DEBUG INFO
                    </button>
                </div>

                <div style="margin-top: 8px;">
                    <button onclick="forceResetStats('${currentFilter}')"
                            style="width: 100%; padding: 4px; background: #dc2626; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                        🗑️ RESET ${currentFilter.toUpperCase()} STATS
                    </button>
                </div>
            </div>
        `}

        <div style="margin-bottom: 10px; padding: 8px; background: #374151; border-radius: 4px;">
            <div style="color: #10b981; font-weight: bold; margin-bottom: 5px;">🛠️ Quick Actions:</div>
            <button onclick="forceRefreshStats()"
                    style="width: 100%; margin: 2px 0; padding: 4px; background: #2563eb; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                🔄 Refresh Display
            </button>
            <button onclick="console.log('Current Stats:', getCurrentAgentStats())"
                    style="width: 100%; margin: 2px 0; padding: 3px; background: #4b5563; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                📊 Log Current Stats
            </button>
            <button onclick="exportDevData()"
                    style="width: 100%; margin: 2px 0; padding: 3px; background: #4b5563; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                📋 Export Dev Data
            </button>
            <button onclick="debugDevStats()"
                    style="width: 100%; margin: 2px 0; padding: 3px; background: #7c3aed; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                🔍 Debug Storage & DOM
            </button>
            <button onclick="updateComparisonValues()"
                    style="width: 100%; margin: 2px 0; padding: 3px; background: #f59e0b; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                🔄 Update Comparisons
            </button>
            <button onclick="clearAllDevStats()"
                    style="width: 100%; margin: 2px 0; padding: 3px; background: #dc2626; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                🧹 Clear All Dev Stats
            </button>
            <button onclick="
                console.log('🔍 DEBUGGING localStorage...');
                const keys = Object.keys(localStorage);
                console.log('📋 All localStorage keys:', keys);
                keys.forEach(key => {
                    const value = localStorage.getItem(key);
                    console.log(\`🔑 \${key}: \${value?.substring(0, 150)}...\`);
                });
                alert('Check console for localStorage contents');
            "
                    style="width: 100%; margin: 2px 0; padding: 3px; background: #7c3aed; color: white; border: none; border-radius: 2px; font-size: 10px; cursor: pointer;">
                🔍 Debug localStorage
            </button>
        </div>

        <button onclick="document.querySelector('.dev-controls-panel').style.display='none'"
                style="width: 100%; padding: 6px; background: #6b7280; color: white; border: none; border-radius: 2px; font-size: 11px; cursor: pointer;">
            ❌ Close Dev Controls
        </button>
    `;

    document.body.appendChild(devControlsContainer);

    // Highlight dev button when active and add reset button
    if (devButton) {
        devButton.style.background = 'yellow';
        devButton.style.color = 'black';
    }

    // Create reset button next to dev mode button
    let resetButton = document.querySelector('.dev-reset-button');
    if (!resetButton) {
        const devModeButton = document.querySelector('.dev-mode-btn');
        const filterButtonsContainer = document.querySelector('.time-filter-buttons');

        if (devModeButton && filterButtonsContainer) {
            resetButton = document.createElement('button');
            resetButton.className = 'filter-btn dev-reset-button';
            resetButton.innerHTML = '<i class="fas fa-undo-alt"></i> Reset';
            resetButton.style.cssText = `
                padding: 8px 16px;
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-left: 5px;
                display: inline-block;
            `;
            resetButton.onclick = () => {
                // Try multiple methods to detect current filter
                let currentFilter = 'day';

                // Method 1: Check active button class
                const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
                console.log('🔍 RESET: Found filter buttons:', filterButtons.length);
                filterButtons.forEach(btn => {
                    console.log('🔍 RESET: Button:', btn.getAttribute('data-filter'), 'Active:', btn.classList.contains('active'));
                    if (btn.classList.contains('active') && btn.getAttribute('data-filter') !== 'dev') {
                        currentFilter = btn.getAttribute('data-filter');
                    }
                });

                // Method 2: Check global variable if available
                if (window.currentTimeFilter && window.currentTimeFilter !== 'dev') {
                    currentFilter = window.currentTimeFilter;
                    console.log('🔍 RESET: Using global filter:', currentFilter);
                }

                // Method 3: Check URL hash
                const urlHash = window.location.hash;
                if (urlHash.includes('filter=')) {
                    const urlFilter = urlHash.match(/filter=([^&]+)/)?.[1];
                    if (urlFilter && urlFilter !== 'dev') {
                        currentFilter = urlFilter;
                        console.log('🔍 RESET: Using URL filter:', currentFilter);
                    }
                }

                // Method 4: Force to 'day' if somehow still YTD but user expects day behavior
                if (currentFilter === 'ytd') {
                    const confirm = window.confirm('Filter detection shows YTD. Are you sure you want to reset YTD stats? Click Cancel to reset as DAY stats instead.');
                    if (!confirm) {
                        currentFilter = 'day';
                        console.log('🔍 RESET: User chose to reset as DAY instead of YTD');
                    }
                }

                console.log('🔍 RESET: Final filter decision:', currentFilter);
                forceResetStats(currentFilter);
            };

            // Insert after the dev mode button
            devModeButton.parentNode.insertBefore(resetButton, devModeButton.nextSibling);
        }
    } else {
        resetButton.style.display = 'inline-block';
    }

    // Clean up any old Apply Saved buttons that might still exist
    const oldApplyButton = document.querySelector('.dev-apply-button');
    if (oldApplyButton) {
        oldApplyButton.remove();
        console.log('🧹 Removed old Apply Saved button');
    }

    console.log('✅ Dev Controls Panel Created!');

    // Auto-activate inline editing for ALL filters (including YTD for visual editing only)
    console.log('🚀 Auto-activating inline editing for all filters...');
    // Add delay to avoid modal interference
    setTimeout(() => {
        activateInlineEditing();
    }, 1500);

    // Watch for filter button changes and refresh dev controls (simplified to avoid conflicts)
    // Add a small delay to avoid immediate conflicts during modal opening
    setTimeout(() => {
        const filterButtonsForWatch = document.querySelectorAll('.filter-btn[data-filter]:not(.dev-mode-btn)');
        filterButtonsForWatch.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('🔄 Filter changed, refreshing dev controls...');
                setTimeout(() => {
                    const existingPanel = document.querySelector('.dev-controls-panel');
                    if (existingPanel) {
                        existingPanel.remove();
                        window.devModeToggling = false; // Reset flag before re-creating
                        toggleDevMode(); // Re-create dev controls with new filter
                    }
                }, 300); // Slightly longer delay to avoid conflicts
            });
        });
    }, 2000); // Wait 2 seconds before adding filter listeners

    // Reset the toggle flag
    setTimeout(() => {
        window.devModeToggling = false;
    }, 300);
};

// Function to activate inline editing with pencil icons
window.activateInlineEditing = function() {
    console.log('✏️ STARTING activateInlineEditing function...');

    // Check if we're in the middle of modal creation/loading
    if (window.isModalLoading) {
        console.log('⚠️ Modal is loading, delaying dev controls activation...');
        setTimeout(() => {
            window.activateInlineEditing();
        }, 1000);
        return;
    }

    // Find the performance modal specifically
    let modal = document.querySelector('.agent-performance-content');
    if (!modal) {
        // Try to find modal containing performance data
        modal = document.querySelector('[style*="max-width: 1000px"]') ||
                document.querySelector('.modal-content:has(h2)') ||
                [...document.querySelectorAll('.modal-content')].find(m =>
                    m.textContent.includes('Performance') ||
                    m.textContent.includes('Total Leads') ||
                    m.textContent.includes('Call Activity')
                );
    }

    if (!modal) {
        console.error('❌ Performance modal not found');
        console.log('🔍 Available modals:', document.querySelectorAll('[class*="modal"], [style*="max-width"]'));
        console.log('⚠️ Will retry in 2 seconds...');
        // Don't show alert, just retry
        setTimeout(() => {
            window.activateInlineEditing();
        }, 2000);
        return;
    }

    console.log('✅ Found modal:', modal);
    console.log('🔍 Modal classes:', modal.className);
    console.log('🔍 Modal children count:', modal.children.length);

    // Target specific stat value patterns in the performance info boxes
    const allElements = modal.querySelectorAll('div');
    let editableCount = 0;
    let checkedCount = 0;

    console.log(`🔍 Checking ${allElements.length} div elements for stat patterns...`);

    allElements.forEach((el, index) => {
        const text = el.textContent.trim();
        // Remove existing pencil icons for pattern matching
        const cleanText = text.replace(/✏️/g, '').trim();
        checkedCount++;

        // Skip elements that contain too much text (likely container elements)
        if (text.length > 200) {
            return;
        }

        // Log first few elements to see what we're working with
        if (index < 20) {
            const shortText = text.length > 50 ? text.substring(0, 47) + '...' : text;
            console.log(`Element ${index}: "${shortText}"`);
        }

        // Check for numeric stat patterns more flexibly using clean text
        const isStatPattern = (
            // Match pure numbers (1, 27, 67, 0, etc.)
            /^\d+$/.test(cleanText) ||
            // Match percentages (96.3%, 0%, 3.7%, etc.)
            /^\d+(\.\d+)?\s*%$/.test(cleanText) ||
            // Match decimal numbers (3.7, 0.0, etc.)
            /^\d+\.\d+$/.test(cleanText) ||
            // Match negative numbers with signs (-1.0, +4.0, etc.)
            /^[+\-]\d+(\.\d+)?$/.test(cleanText) ||
            // Match numbers with "min" suffix (67, 0 min, etc.)
            /^\d+(\.\d+)?\s*min?$/.test(cleanText)
        );

        if (isStatPattern) {
            const computedStyle = window.getComputedStyle(el);
            const fontSize = computedStyle.fontSize;
            const fontWeight = computedStyle.fontWeight;
            const fontSizeNum = parseFloat(fontSize);

            console.log(`📍 STAT PATTERN MATCH: "${cleanText}" (original: "${text}") - font-size: ${fontSize}, font-weight: ${fontWeight}, height: ${el.offsetHeight}px`);

            // Focus on prominent stat displays (larger text, bold, or positioned prominently)
            const isProminentStat = (
                fontSizeNum >= 16 || // Larger font size
                fontWeight === 'bold' || fontWeight >= 600 || // Bold text
                el.offsetHeight > 20 || // Reasonable height
                el.parentElement?.style?.textAlign === 'center' || // Centered stats
                fontSizeNum >= 28 || // Extra large stats (like the "27", "96.3%" etc.)
                (el.parentElement?.style?.background?.includes('#f0fdf4')) || // Green stat bubbles
                (el.parentElement?.style?.background?.includes('#fef2f2')) || // Red stat bubbles
                (el.parentElement?.style?.background?.includes('#f8f9fa')) // Gray stat bubbles
            );

            if (!isProminentStat) {
                console.log(`   ↳ 🚫 Not prominent enough: font-size: ${fontSize}, weight: ${fontWeight}`);
                return;
            }

            // Skip if already has pencil icon or other exclusions
            if (el.querySelector('.edit-pencil')) {
                console.log('   ↳ 🚫 Already has pencil icon');
                return;
            }

            if (el.offsetHeight < 10) {
                console.log('   ↳ 🚫 Too small (height < 10px)');
                return;
            }

            if (el.closest('input, button, select, textarea, script')) {
                console.log('   ↳ 🚫 Inside input/button/etc');
                return;
            }

            if (text.includes('vs avg') || text.includes('Avg:') || text.includes('total leads')) {
                console.log('   ↳ 🚫 Contains excluded text');
                return;
            }

            console.log(`   ↳ ✅ ADDING PENCIL ICON to "${text}"`);
            addPencilIcon(el, text);
            editableCount++;
        }
    });

    console.log(`📊 Checked ${checkedCount} elements, found ${editableCount} stat patterns`);

    console.log(`✅ Added ${editableCount} pencil icons for inline editing`);

    // NOTE: Dev stats are now only loaded when explicitly requested via dev mode actions
    // This prevents automatic override of live server data

    if (typeof showNotification === 'function') {
        showNotification(`Inline editing activated (${editableCount} fields)`, 'success');
    }
};

// Function to add pencil icon to a stat element
function addPencilIcon(element, originalValue) {
    // Skip if already has pencil
    if (element.querySelector('.edit-pencil')) return;

    // Create pencil icon
    const pencilIcon = document.createElement('span');
    pencilIcon.className = 'edit-pencil';
    pencilIcon.innerHTML = '✏️';

    // Check if this is a large stat value (main info box value)
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseInt(computedStyle.fontSize);
    const isLargeStat = fontSize >= 20;

    pencilIcon.style.cssText = `
        margin-left: ${isLargeStat ? '8px' : '4px'};
        cursor: pointer;
        opacity: 0.6;
        font-size: ${isLargeStat ? '16px' : '12px'};
        transition: all 0.2s;
        display: inline-block;
        vertical-align: ${isLargeStat ? 'top' : 'middle'};
        line-height: 1;
    `;

    // Add hover effect
    pencilIcon.addEventListener('mouseenter', () => {
        pencilIcon.style.opacity = '1';
        pencilIcon.style.transform = 'scale(1.2)';
    });

    pencilIcon.addEventListener('mouseleave', () => {
        pencilIcon.style.opacity = '0.7';
        pencilIcon.style.transform = 'scale(1)';
    });

    // Add click handler for inline editing
    pencilIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        // Get current displayed value (without pencil icon)
        const currentValue = element.textContent.replace(/✏️/g, '').trim();
        makeElementEditable(element, currentValue);
    });

    // Position relative for absolute positioning of pencil
    element.style.position = 'relative';
    element.appendChild(pencilIcon);
}

// Function to make an element editable
function makeElementEditable(element, originalValue) {
    // Remove pencil icon temporarily
    const pencil = element.querySelector('.edit-pencil');
    if (pencil) pencil.style.display = 'none';

    // Store original content
    const originalContent = element.innerHTML;
    const originalText = element.textContent.replace('✏️', '').trim();

    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.style.cssText = `
        width: ${Math.max(60, element.offsetWidth - 10)}px;
        padding: 2px 4px;
        border: 2px solid #059669;
        border-radius: 3px;
        background: white;
        color: #1f2937;
        font-size: ${window.getComputedStyle(element).fontSize};
        font-weight: ${window.getComputedStyle(element).fontWeight};
    `;

    // Create save/cancel buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin-top: 4px; display: flex; gap: 4px;';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾';
    saveBtn.style.cssText = 'padding: 2px 6px; background: #059669; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 12px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '❌';
    cancelBtn.style.cssText = 'padding: 2px 6px; background: #dc2626; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 12px;';

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);

    // Replace element content
    element.innerHTML = '';
    element.appendChild(input);
    element.appendChild(buttonContainer);

    // Focus and select input
    input.focus();
    input.select();

    // Save function
    const saveEdit = () => {
        const newValue = input.value.trim();

        // Update content carefully to preserve structure
        if (element.children.length === 0) {
            // Simple text element, safe to replace
            element.innerHTML = originalContent.replace(originalText, newValue);
        } else {
            // Has child elements, only update the text parts
            element.textContent = newValue;
        }

        // Save to localStorage for persistence - Enhanced agent name detection
        let agentName = document.querySelector('h2')?.textContent?.match(/(\w+)\s+Performance\s+Profile/i)?.[1];
        if (!agentName) {
            agentName = document.querySelector('h2')?.textContent?.match(/^(\w+)\s+Performance/i)?.[1];
        }
        // Try other selectors if still not found
        if (!agentName) {
            const allTextElements = document.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6');
            for (const el of allTextElements) {
                const text = el.textContent?.trim();
                if (text && text.includes('Performance Profile')) {
                    const match = text.match(/(\w+)\s+Performance\s+Profile/i);
                    if (match && match[1] !== 'Agent') {
                        agentName = match[1];
                        break;
                    }
                }
            }
        }

        // Get context for main dashboard updates (always needed)
        const context = getStatContext(element);

        const currentFilter = getCurrentFilter();
        if (agentName && currentFilter) {
            // Create a more stable identifier including context
            const statType = getStatType(originalText);
            const statId = `${statType}_${originalText}_${context}`;

            // Clean up conflicting values for the same metric type before saving
            cleanupConflictingTotalLeads(agentName, currentFilter, statId);

            const storageKey = `devStats_${agentName}_${currentFilter}`;
            let devStats = JSON.parse(localStorage.getItem(storageKey) || '{}');

            devStats[statId] = newValue;

            // Save to server instead of localStorage
            saveDevStatsToServer(agentName, currentFilter, devStats);

            // Also update live stats tracker
            updateLiveStatsTracker(agentName, context, newValue);
        }

        // Visual feedback for successful edit
        element.style.background = '#10b981';
        element.style.color = 'white';
        element.style.padding = '2px 4px';
        element.style.borderRadius = '2px';

        setTimeout(() => {
            element.style.background = '';
            element.style.color = '';
            element.style.padding = '';
            element.style.borderRadius = '';
        }, 2000);

        console.log(`✅ Updated stat from "${originalText}" to "${newValue}"`);

        // Immediately update the stat box color based on the new value
        updateStatBoxColor(element, newValue);

        // Skip automatic comparison updates - let the color update handle it
        // updateComparisonValues();

        // Update main dashboard table if this is a key metric
        updateMainDashboardStats(agentName, context, newValue);

        if (typeof showNotification === 'function') {
            showNotification(`Stat updated: ${newValue} (saved)`, 'success');
        }
    };

    // Cancel function
    const cancelEdit = () => {
        element.innerHTML = originalContent;
    };

    // Event handlers
    saveBtn.addEventListener('click', saveEdit);
    cancelBtn.addEventListener('click', cancelEdit);

    // Save on Enter, cancel on Escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
}

// Supporting functions for dev controls
window.updateStatField = function(fieldType) {
    console.log('🔧 Updating stat field:', fieldType);

    let inputId, displaySelector, value;

    switch(fieldType) {
        case 'totalLeads':
            inputId = 'dev-total-leads';
            displaySelector = '#agentTotalLeads, [id*="Leads"]:not([id*="High"]):not([id*="Low"])';
            break;
        case 'highValue':
            inputId = 'dev-high-value';
            displaySelector = '#agentHighValueLeads, [id*="HighValue"]';
            break;
        case 'totalCalls':
            inputId = 'dev-total-calls';
            displaySelector = '#agentCallsMade, [id*="CallsMade"], [id*="TotalCalls"]';
            break;
        case 'callDuration':
            inputId = 'dev-call-duration';
            displaySelector = '#agentCallTime, [id*="CallTime"], [id*="CallDuration"]';
            break;
        default:
            console.error('Unknown field type:', fieldType);
            return;
    }

    const input = document.getElementById(inputId);
    if (!input) {
        console.error('Input not found:', inputId);
        return;
    }

    value = parseInt(input.value) || 0;

    // Update display elements
    const elements = document.querySelectorAll(displaySelector);
    console.log('Found elements to update:', elements.length, displaySelector);

    elements.forEach(el => {
        if (fieldType === 'callDuration') {
            el.textContent = value + ' min';
        } else {
            el.textContent = value;
        }

        // Add visual feedback
        el.style.background = '#10b981';
        el.style.color = 'white';
        el.style.padding = '2px 4px';
        el.style.borderRadius = '2px';

        setTimeout(() => {
            el.style.background = '';
            el.style.color = '';
            el.style.padding = '';
            el.style.borderRadius = '';
        }, 2000);
    });

    console.log('✅ Updated', fieldType, 'to', value);
    input.value = '';

    // Show success notification if available
    if (typeof showNotification === 'function') {
        showNotification(`${fieldType} updated to ${value}`, 'success');
    }
};

// Helper function to extract current agent name from modal
function extractCurrentAgentName() {
    // Try multiple methods to find agent name
    const modal = document.querySelector('.agent-performance-content') ||
                 document.querySelector('[style*="max-width: 1000px"]') ||
                 document.querySelector('.modal-content');

    if (modal) {
        // Method 1: Look for h2 with Performance Profile
        const h2 = modal.querySelector('h2') || document.querySelector('h2');
        if (h2 && h2.textContent.includes('Performance Profile')) {
            const match = h2.textContent.match(/(\w+)\s+Performance Profile/i);
            if (match) {
                console.log('🔍 Agent name from h2:', match[1]);
                return match[1];
            }
        }

        // Method 2: Look in modal title
        const modalTitle = modal.querySelector('.modal-title, [class*="title"]');
        if (modalTitle && modalTitle.textContent.includes('Performance')) {
            const match = modalTitle.textContent.match(/(\w+)\s+Performance/i);
            if (match) {
                console.log('🔍 Agent name from modal title:', match[1]);
                return match[1];
            }
        }
    }

    // Method 3: Look globally for any Performance Profile text
    const allElements = document.querySelectorAll('*');
    for (let el of allElements) {
        if (el.textContent && el.textContent.includes('Performance Profile')) {
            const match = el.textContent.match(/(\w+)\s+Performance Profile/i);
            if (match && match[1] !== 'Agent') {
                console.log('🔍 Agent name from global search:', match[1]);
                return match[1];
            }
        }
    }

    console.log('❌ Could not extract agent name from modal');
    return null;
}

window.forceResetStats = function(filterType) {
    console.log('🗑️ Force reset stats for filter:', filterType);
    console.log('🗑️ Filter type check:', typeof filterType, 'Value:', JSON.stringify(filterType));
    console.log('🗑️ Is YTD?', filterType === 'ytd', 'toLowerCase:', filterType?.toLowerCase?.());

    // Only block YTD reset if explicitly confirmed to be YTD
    if (filterType === 'ytd' || filterType?.toLowerCase?.() === 'ytd') {
        const reallyYTD = window.confirm('⚠️ YTD filter detected. This will reset Year-To-Date stats which affects data integrity.\n\nClick OK to proceed with YTD reset, or Cancel to abort.');
        if (!reallyYTD) {
            console.log('🗑️ YTD reset cancelled by user');
            return;
        }
        console.log('🗑️ User confirmed YTD reset - proceeding...');
    }

    const confirmed = confirm(`🗑️ Reset ${filterType.toUpperCase()} stats only?\n\nThis will:\n✅ Reset ${filterType.toUpperCase()} live stats to zero\n✅ Keep other periods unchanged\n\n❌ Other periods (${filterType === 'day' ? 'Weekly/Monthly/YTD' : filterType === 'weekly' ? 'Daily/Monthly/YTD' : filterType === 'monthly' ? 'Daily/Weekly/YTD' : 'Daily/Weekly/Monthly'}) will NOT be affected.\n\nContinue?`);

    if (!confirmed) {
        console.log('❌ Reset cancelled by user');
        return;
    }

    // CRITICAL: Reset live stats for specific period only (keep overlay system active)
    const agentName = extractCurrentAgentName();
    if (agentName) {
        console.log(`🗑️ Resetting ${filterType.toUpperCase()} live stats to zero for ${agentName}...`);
        const resetStats = {
            totalLeads: 0,
            connectedCalls: 0,
            highValueLeads: 0,
            totalCallDuration: 0,
            contactRate: 0,
            period: filterType,
            lastUpdated: new Date().toISOString()
        };

        // Store period-specific stats using a period suffix
        fetch('/api/live-agent-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentName: `${agentName}_${filterType}`, // Period-specific key
                stats: resetStats
            })
        }).then(() => {
            console.log(`✅ ${filterType.toUpperCase()} live stats reset to zero for ${agentName}`);
        }).catch(error => {
            console.error(`Error resetting ${filterType} live stats:`, error);
        });
    }

    // Reset display elements to zero
    const statElements = [
        '#agentTotalLeads, [id*="Leads"]:not([id*="High"]):not([id*="Low"])',
        '#agentHighValueLeads, [id*="HighValue"]',
        '#agentLowValueLeads, [id*="LowValue"]',
        '#agentCallsMade, [id*="CallsMade"]',
        '#agentCallTime, [id*="CallTime"]',
        '[id*="ContactRate"]',
        '[id*="ConversionRate"]'
    ];

    let resetCount = 0;
    statElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const originalValue = el.textContent;
            el.textContent = '0';

            // Special handling for percentage fields
            if (selector.includes('Rate')) {
                el.textContent = '0%';
            } else if (selector.includes('CallTime')) {
                el.textContent = '0 min';
            }

            // Visual feedback
            el.style.background = '#dc2626';
            el.style.color = 'white';
            el.style.padding = '2px 4px';
            el.style.borderRadius = '2px';
            resetCount++;

            setTimeout(() => {
                el.style.background = '';
                el.style.color = '';
                el.style.padding = '';
                el.style.borderRadius = '';
            }, 3000);
        });
    });

    console.log(`✅ Reset ${resetCount} stat elements for ${filterType}`);

    if (typeof showNotification === 'function') {
        showNotification(`${filterType.toUpperCase()} stats reset (${resetCount} elements)`, 'success');
    } else {
        alert(`✅ ${filterType.toUpperCase()} stats reset successfully!`);
    }

    // Reload the modal to show cleared stats
    setTimeout(() => {
        const agentName = extractCurrentAgentName();
        if (agentName && typeof viewAgentStatsWithDateRange === 'function') {
            console.log('🔄 Reloading modal after reset...');

            // Create appropriate dateRange object for the filter type
            let dateRange, periodLabel;
            const now = new Date();

            switch(filterType) {
                case 'day':
                    dateRange = {
                        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                    };
                    periodLabel = 'day';
                    break;
                case 'week':
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    dateRange = {
                        start: startOfWeek,
                        end: now
                    };
                    periodLabel = 'week';
                    break;
                case 'month':
                    dateRange = {
                        start: new Date(now.getFullYear(), now.getMonth(), 1),
                        end: now
                    };
                    periodLabel = 'month';
                    break;
                case 'ytd':
                    dateRange = {
                        start: new Date(now.getFullYear(), 0, 1),
                        end: now
                    };
                    periodLabel = 'ytd';
                    break;
                default:
                    dateRange = {
                        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                    };
                    periodLabel = 'day';
            }

            viewAgentStatsWithDateRange(agentName, dateRange, periodLabel);
        } else if (window.location.reload) {
            console.log('🔄 Reloading page after reset...');
            window.location.reload();
        }
    }, 1000);
};

window.forceRefreshStats = function() {
    console.log('🔄 Force refreshing stats display...');

    // Try to find and trigger existing refresh functions
    const refreshButtons = document.querySelectorAll('button[onclick*="refresh"], button[onclick*="update"], button[onclick*="reload"]');

    if (refreshButtons.length > 0) {
        console.log('Found refresh buttons:', refreshButtons.length);
        refreshButtons[0].click();
    }

    // Also try to trigger a view refresh if the function exists
    const agentName = document.querySelector('h2')?.textContent?.match(/(\w+)\s+Performance/)?.[1];

    if (agentName && typeof viewAgentStats === 'function') {
        console.log('Triggering viewAgentStats for:', agentName);
        setTimeout(() => viewAgentStats(agentName), 500);
    }

    // Visual feedback
    const modal = document.querySelector('.modal-content');
    if (modal) {
        modal.style.opacity = '0.7';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 300);
    }

    if (typeof showNotification === 'function') {
        showNotification('Stats display refreshed', 'info');
    }

    console.log('✅ Refresh triggered');
};

window.getCurrentAgentStats = function() {
    const stats = {};

    // Try to extract current stats from display
    const extractStat = (selector, name) => {
        const el = document.querySelector(selector);
        if (el) {
            stats[name] = el.textContent.trim();
        }
    };

    extractStat('#agentTotalLeads, [id*="Leads"]:not([id*="High"]):not([id*="Low"])', 'totalLeads');
    extractStat('#agentHighValueLeads, [id*="HighValue"]', 'highValueLeads');
    extractStat('#agentLowValueLeads, [id*="LowValue"]', 'lowValueLeads');
    extractStat('#agentCallsMade, [id*="CallsMade"]', 'totalCalls');
    extractStat('#agentCallTime, [id*="CallTime"]', 'callTime');

    console.log('Current Agent Stats:', stats);
    return stats;
};

window.exportDevData = function() {
    const currentStats = getCurrentAgentStats();
    const agentName = document.querySelector('h2')?.textContent?.match(/(\w+)\s+Performance/)?.[1] || 'Unknown';
    // Get current filter from button styles (same logic as dev controls)
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    let currentFilter = 'ytd';
    for (const btn of filterButtons) {
        const computedStyle = window.getComputedStyle(btn);
        const bgColor = computedStyle.backgroundColor;
        if (bgColor === 'rgb(37, 99, 235)' || btn.style.background === '#2563eb') {
            currentFilter = btn.getAttribute('data-filter');
            break;
        }
    }

    const devData = {
        timestamp: new Date().toISOString(),
        agent: agentName,
        filter: currentFilter,
        stats: currentStats,
        localStorage_size: localStorage.length,
        total_leads_in_storage: JSON.parse(localStorage.getItem('insurance_leads') || '[]').length
    };

    // Create downloadable JSON
    const dataStr = JSON.stringify(devData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `dev-data-${agentName}-${currentFilter}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    console.log('📋 Dev data exported:', devData);

    if (typeof showNotification === 'function') {
        showNotification('Dev data exported successfully', 'success');
    }
};

// Debug function to aggressively add pencils to all stat-like elements
window.forceAddPencilsDebug = function() {
    console.log('🚀 FORCE DEBUG: Adding pencils to ALL stat elements...');

    // Find the performance modal specifically (same logic as activateInlineEditing)
    let modal = document.querySelector('.agent-performance-content');
    if (!modal) {
        modal = document.querySelector('[style*="max-width: 1000px"]') ||
                [...document.querySelectorAll('.modal-content')].find(m =>
                    m.textContent.includes('Performance') ||
                    m.textContent.includes('Total Leads') ||
                    m.textContent.includes('Call Activity')
                );
    }

    if (!modal) {
        alert('❌ Please make sure the Agent Performance modal is open!');
        return;
    }

    console.log('🔍 Using container:', modal);

    // Look for all divs that contain numbers
    const allDivs = modal.querySelectorAll('div');
    let addedCount = 0;

    allDivs.forEach((div, i) => {
        const text = div.textContent.trim();

        // More aggressive pattern matching
        if (/^\d+(\.\d+)?%?$/.test(text) || /^[+\-]?\d+(\.\d+)?$/.test(text)) {

            // Skip if already has pencil
            if (div.querySelector('.edit-pencil')) return;

            // Skip tiny elements
            if (div.offsetHeight < 8 || div.offsetWidth < 20) return;

            console.log(`📝 Adding pencil to: "${text}" (element ${i})`);

            // Force add pencil regardless of styling
            const pencil = document.createElement('span');
            pencil.className = 'edit-pencil';
            pencil.innerHTML = ' ✏️';
            pencil.style.cssText = 'cursor: pointer; color: #2563eb; font-size: 12px; margin-left: 4px;';

            pencil.addEventListener('click', function(e) {
                e.stopPropagation();
                window.makeElementEditable(div);
            });

            div.appendChild(pencil);
            addedCount++;
        }
    });

    console.log(`✅ DEBUG: Added ${addedCount} pencil icons`);

    if (addedCount === 0) {
        console.log('🔍 No stat patterns found. Available text content:');
        allDivs.slice(0, 50).forEach((div, i) => {
            const text = div.textContent.trim();
            if (text && text.length < 20) {
                console.log(`  ${i}: "${text}"`);
            }
        });
    }
};

// Helper function to get current filter
function getCurrentFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    for (const btn of filterButtons) {
        const computedStyle = window.getComputedStyle(btn);
        const bgColor = computedStyle.backgroundColor;
        if (bgColor === 'rgb(37, 99, 235)' || btn.style.background === '#2563eb') {
            return btn.getAttribute('data-filter');
        }
    }
    return 'day'; // default
}

// Helper function to identify stat type
function getStatType(value) {
    if (value.includes('%')) return 'percentage';
    if (value.includes('min')) return 'minutes';
    if (/^\d+$/.test(value)) {
        // Determine stat type by value range
        const num = parseInt(value);
        if (num > 100) return 'large_number'; // likely leads count
        if (num < 50) return 'small_number'; // likely calls count
    }
    return 'general';
}

// Helper function to get context for a stat element
function getStatContext(element) {
    // Look for parent elements that contain identifying text
    let parent = element.parentElement;
    let context = '';

    // Go up to 5 levels to find context (increased from 3), but be more specific
    for (let i = 0; i < 5 && parent; i++) {
        const text = parent.textContent.toLowerCase();

        // Debug logging for troubleshooting
        if (i === 0) {
            console.log(`🔍 Context search for element "${element.textContent.trim()}" - Level ${i}: "${text.substring(0, 100)}..."`);
        }

        // Look for specific metric containers, avoid generic mentions
        // Check for more specific contexts first to avoid conflicts
        if (text.includes('high value leads') && text.length < 500) context = 'highvalue';
        else if (text.includes('low value leads') && !text.includes('low value lead rate') && text.length < 500) context = 'lowvalue';
        else if (text.includes('total leads') && !text.includes('high value') && !text.includes('low value') && text.length < 500) context = 'totalleads';
        else if (text.includes('total calls') && text.length < 500) context = 'totalcalls';
        else if (text.includes('call duration') && text.length < 500) context = 'duration';
        else if (text.includes('contact rate') && text.length < 500) context = 'contactrate';
        else if (text.includes('leads to brokers') && text.length < 500) context = 'brokers';
        else if (text.includes('time on non-green') && text.length < 500) context = 'nongreen';
        else if (text.includes('low value lead rate') && text.length < 500) context = 'lowrate';

        if (context) {
            console.log(`✅ Context found: "${context}" at level ${i}`);
            break;
        }
        parent = parent.parentElement;
    }

    if (!context) {
        console.log(`⚠️ No context found for element "${element.textContent.trim()}" - will use 'unknown'`);
    }

    return context || 'unknown';
}

// Update main dashboard table stats when dev stats are changed
function updateMainDashboardStats(agentName, context, newValue) {
    // Map agent name to lowercase prefix used in IDs
    const agentPrefix = agentName.toLowerCase();

    // Update the main dashboard table based on context
    const element = document.getElementById(`${agentPrefix}Leads`);
    if (!element) {
        console.log(`⚠️ Main dashboard element not found for agent: ${agentName}`);
        return;
    }

    console.log(`📊 Updating main dashboard for ${agentName} - context: ${context}, value: ${newValue}`);

    switch (context) {
        case 'totalleads':
            document.getElementById(`${agentPrefix}Leads`).textContent = newValue;
            break;
        case 'highvalue':
            document.getElementById(`${agentPrefix}HighValueLeads`).textContent = newValue;
            break;
        case 'lowvalue':
            // Parse the percentage and calculate the count if needed
            const numericValue = parseFloat(newValue);
            document.getElementById(`${agentPrefix}LowValueLeads`).textContent = numericValue;
            break;
        case 'totalcalls':
            document.getElementById(`${agentPrefix}CallsMade`).textContent = newValue;
            break;
        case 'duration':
            // Convert to minutes if it's a numeric value
            const minutes = parseFloat(newValue) || 0;
            document.getElementById(`${agentPrefix}CallTime`).textContent = minutes;
            break;
        default:
            console.log(`📊 Context '${context}' doesn't map to main dashboard table`);
    }
}

// Update main dashboard with all saved dev stats
function updateMainDashboardWithSavedStats(agentName, devStats) {
    console.log(`📊 Updating main dashboard with saved stats for ${agentName}:`, devStats);

    // Extract key metrics from saved stats
    let totalLeads = null;
    let highValueLeads = null;
    let lowValueLeads = null;
    let totalCalls = null;
    let callDuration = null;

    Object.keys(devStats).forEach(statId => {
        const value = devStats[statId];

        // Check if this stat matches our main dashboard metrics
        if (statId.includes('_totalleads')) {
            totalLeads = value;
        } else if (statId.includes('_highvalue')) {
            highValueLeads = value;
        } else if (statId.includes('_lowvalue') && !statId.includes('_lowrate')) {
            lowValueLeads = value;
        } else if (statId.includes('_totalcalls')) {
            totalCalls = value;
        } else if (statId.includes('_duration')) {
            callDuration = value;
        }
    });

    // Apply the values to main dashboard
    const agentPrefix = agentName.toLowerCase();

    if (totalLeads !== null) {
        const element = document.getElementById(`${agentPrefix}Leads`);
        if (element) element.textContent = totalLeads;
    }

    if (highValueLeads !== null) {
        const element = document.getElementById(`${agentPrefix}HighValueLeads`);
        if (element) element.textContent = highValueLeads;
    }

    if (lowValueLeads !== null) {
        const element = document.getElementById(`${agentPrefix}LowValueLeads`);
        if (element) element.textContent = parseFloat(lowValueLeads) || lowValueLeads;
    }

    if (totalCalls !== null) {
        const element = document.getElementById(`${agentPrefix}CallsMade`);
        if (element) element.textContent = totalCalls;
    }

    if (callDuration !== null) {
        const element = document.getElementById(`${agentPrefix}CallTime`);
        if (element) element.textContent = parseFloat(callDuration) || callDuration;
    }
}

// Clean up old problematic localStorage values that conflict with context-based system
function cleanupOldDevStats(agentName, currentFilter) {
    const storageKey = `devStats_${agentName}_${currentFilter}`;
    let devStats = JSON.parse(localStorage.getItem(storageKey) || '{}');

    // Remove old problematic values that might conflict with context-based ones
    const problematicKeys = [];

    // Find all old-format keys that have context-based equivalents
    Object.keys(devStats).forEach(key => {
        // If it's an old format key (no context suffix)
        if (!key.includes('_totalleads') && !key.includes('_highvalue') &&
            !key.includes('_lowvalue') && !key.includes('_totalcalls') &&
            !key.includes('_duration') && !key.includes('_contactrate') &&
            !key.includes('_brokers') && !key.includes('_nongreen') &&
            !key.includes('_lowrate')) {

            // Check if there's a context-based equivalent
            const hasContextEquivalent = Object.keys(devStats).some(contextKey =>
                contextKey.startsWith(key + '_')
            );

            if (hasContextEquivalent) {
                problematicKeys.push(key);
            }
        }
    });

    let cleaned = false;
    problematicKeys.forEach(key => {
        console.log(`🧹 Removing conflicting old stat: ${key} = ${devStats[key]} (has context-based equivalent)`);
        delete devStats[key];
        cleaned = true;
    });

    if (cleaned) {
        localStorage.setItem(storageKey, JSON.stringify(devStats));
        console.log('🧹 Cleaned up old conflicting dev stats');
    }
}

// Enhanced cleanup function to remove multiple conflicting totalleads values
function cleanupConflictingTotalLeads(agentName, currentFilter, newStatId) {
    const storageKey = `devStats_${agentName}_${currentFilter}`;
    let devStats = JSON.parse(localStorage.getItem(storageKey) || '{}');

    // Extract the metric type from the new stat ID (totalleads, highvalue, etc.)
    const metricType = newStatId.split('_').pop(); // Get the last part after _

    if (!metricType) return;

    console.log(`🧹 Cleaning up conflicting ${metricType} values before saving new one`);

    const conflictingKeys = [];

    // Find all keys that end with the same metric type
    Object.keys(devStats).forEach(key => {
        if (key.endsWith(`_${metricType}`) && key !== newStatId) {
            conflictingKeys.push(key);
        }
    });

    if (conflictingKeys.length > 0) {
        console.log(`🧹 Found ${conflictingKeys.length} conflicting ${metricType} values:`, conflictingKeys);

        conflictingKeys.forEach(key => {
            console.log(`🧹 Removing conflicting ${metricType} value: ${key} = ${devStats[key]}`);
            delete devStats[key];
        });

        localStorage.setItem(storageKey, JSON.stringify(devStats));
        console.log(`🧹 Cleaned up ${conflictingKeys.length} conflicting ${metricType} values`);
    }
}

// Load saved dev stats from localStorage (only when explicitly requested)
async function loadSavedDevStats(forceLoad = false) {
    if (!forceLoad && !window.devModeExplicitRequest) {
        console.log('🚫 Skipping automatic dev stats loading - live data should not be overridden');
        return;
    }
    console.log('🔄 loadSavedDevStats() called - Starting agent/filter detection...');

    // Set flag to prevent modal closure during loading
    window.loadingDevStats = true;

    // Temporarily disable modal close functions to prevent interference
    if (window.closeModal && !window.originalCloseModal) {
        window.originalCloseModal = window.closeModal;
        window.closeModal = function(modalId) {
            if (window.loadingDevStats) {
                console.log('🚫 Blocking modal close during dev stats loading:', modalId);
                return;
            }
            return window.originalCloseModal(modalId);
        };
    }

    if (window.closeAgentModal && !window.originalCloseAgentModal) {
        window.originalCloseAgentModal = window.closeAgentModal;
        window.closeAgentModal = function() {
            if (window.loadingDevStats) {
                console.log('🚫 Blocking agent modal close during dev stats loading');
                return;
            }
            return window.originalCloseAgentModal();
        };
    }

    // Try multiple selectors for agent name with enhanced detection
    let agentName = null;

    // Method 1: h2 selector with improved regex
    const h2Element = document.querySelector('h2');
    if (h2Element) {
        console.log('🔍 Found h2 element:', h2Element.textContent);
        // Try multiple patterns to extract the agent name
        let h2Match = h2Element.textContent?.match(/^(\w+)\s+Performance/i); // "Grant Performance"
        if (!h2Match) {
            h2Match = h2Element.textContent?.match(/(\w+)\s+Performance\s+Profile/i); // "Grant Performance Profile"
        }
        if (h2Match) agentName = h2Match[1];
    }

    // Method 2: Modal title selector with improved patterns
    if (!agentName) {
        const modalTitle = document.querySelector('.modal-content h2, [class*="modal"] h2, .modal h2');
        if (modalTitle) {
            console.log('🔍 Found modal title:', modalTitle.textContent);
            let modalMatch = modalTitle.textContent?.match(/^(\w+)\s+Performance/i);
            if (!modalMatch) {
                modalMatch = modalTitle.textContent?.match(/(\w+)\s+Performance\s+Profile/i);
            }
            if (modalMatch) agentName = modalMatch[1];
        }
    }

    // Method 3: Look for text patterns that contain agent names before "Performance"
    if (!agentName) {
        const perfElements = [...document.querySelectorAll('*')].filter(el =>
            el.textContent && el.textContent.includes('Performance Profile')
        );
        for (const el of perfElements) {
            console.log('🔍 Found performance element:', el.textContent);
            // Look for pattern like "Grant Performance Profile (Day)"
            let perfMatch = el.textContent?.match(/(\w+)\s+Performance\s+Profile/i);
            if (!perfMatch) {
                // Fallback to simpler pattern
                perfMatch = el.textContent?.match(/^(\w+)\s+Performance/i);
            }
            if (perfMatch && perfMatch[1] !== 'Agent') { // Exclude generic "Agent"
                agentName = perfMatch[1];
                console.log('🔍 Extracted agent name:', agentName);
                break;
            }
        }
    }

    // Method 4: Check the page title or any visible text
    if (!agentName) {
        const allTextElements = document.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6');
        for (const el of allTextElements) {
            const text = el.textContent?.trim();
            if (text && text.includes('Performance Profile')) {
                console.log('🔍 Found text element with performance:', text);
                const match = text.match(/(\w+)\s+Performance\s+Profile/i);
                if (match && match[1] !== 'Agent') {
                    agentName = match[1];
                    console.log('🔍 Final extracted agent name:', agentName);
                    break;
                }
            }
        }
    }

    // Try to get current filter with enhanced detection
    let currentFilter = getCurrentFilter();
    console.log('🔍 getCurrentFilter() returned:', currentFilter);

    if (!currentFilter) {
        // Enhanced fallback detection
        const activeButtons = document.querySelectorAll('.filter-btn, button[data-filter]');
        console.log('🔍 Found filter buttons:', activeButtons.length);

        for (const btn of activeButtons) {
            const computedStyle = window.getComputedStyle(btn);
            const bgColor = computedStyle.backgroundColor;
            console.log('🔍 Button filter:', btn.getAttribute('data-filter'), 'bg:', bgColor);

            if (bgColor === 'rgb(37, 99, 235)' ||
                btn.style.background === '#2563eb' ||
                btn.classList.contains('active') ||
                btn.style.background.includes('2563eb')) {
                currentFilter = btn.getAttribute('data-filter') || 'day';
                console.log('🔍 Detected active filter:', currentFilter);
                break;
            }
        }

        if (!currentFilter) {
            currentFilter = 'day'; // default fallback
            console.log('🔍 Using default filter:', currentFilter);
        }
    }

    console.log('🔍 FINAL DETECTION - Agent:', agentName, 'Filter:', currentFilter);

    if (!agentName || !currentFilter) {
        console.log('❌ Still missing data - Agent:', agentName, 'Filter:', currentFilter);

        // Enhanced retry logic with limit
        if (!window.loadStatsRetryCount) window.loadStatsRetryCount = 0;
        window.loadStatsRetryCount++;

        if (window.loadStatsRetryCount < 5) {
            console.log(`🔄 Retry attempt ${window.loadStatsRetryCount}/5 in 500ms...`);
            setTimeout(loadSavedDevStats, 500);
        } else {
            console.log('❌ Max retries reached, giving up');
            window.loadStatsRetryCount = 0;
        }
        return;
    }

    // Reset retry counter on success
    window.loadStatsRetryCount = 0;

    // Clean up old conflicting stats first
    cleanupOldDevStats(agentName, currentFilter);

    // Load stats from server
    console.log(`📊 Loading dev stats from server for ${agentName} in ${currentFilter}...`);
    const devStats = await loadDevStatsFromServer(agentName, currentFilter);
    const statKeys = Object.keys(devStats);

    if (statKeys.length === 0) {
        console.log(`📊 No saved dev stats found for ${agentName} in ${currentFilter} filter`);
        return;
    }

    console.log(`📊 Loading ${statKeys.length} saved stats for ${agentName} in ${currentFilter}:`, devStats);

    // Enhanced DOM wait and application logic
    const applyStatsWithRetry = (retryCount = 0) => {
        console.log(`🔄 Attempting to apply stats - try ${retryCount + 1}/3`);

        // Apply saved stats to elements with specific stat values
        let appliedCount = 0;

        // Find all stat elements in the DOM (look for common stat patterns)
        const allElements = document.querySelectorAll('div, span, td');
        console.log(`🔍 Found ${allElements.length} elements to check for stat patterns`);

        allElements.forEach((element, index) => {
            const text = element.textContent.trim();

            // Skip elements that already have pencil icons or are too small
            if (text.includes('✏️') || element.offsetHeight < 10) return;

            // Check if this looks like a stat value
            const cleanText = text.replace(/✏️/g, '').trim();
            const isStatPattern = (
                /^\d+$/.test(cleanText) ||
                /^\d+(\.\d+)?\s*%$/.test(cleanText) ||
                /^\d+(\.\d+)?\s*min?$/.test(cleanText)
            );

            if (isStatPattern) {
                const statType = getStatType(cleanText);
                const context = getStatContext(element);
                const statIdWithContext = `${statType}_${cleanText}_${context}`;
                const statIdOld = `${statType}_${cleanText}`;

                console.log(`🔍 Element ${index}: "${cleanText}" -> statId: "${statIdWithContext}" -> saved value: "${devStats[statIdWithContext]}"`);

                // Try new context-based ID first, fallback to old ID for backward compatibility
                let savedValue = devStats[statIdWithContext];
                let statId = statIdWithContext;

                if (savedValue === undefined && context && context !== 'unknown') {
                    // Look for ANY saved value with the same context (regardless of the number)
                    const contextKeys = Object.keys(devStats).filter(key => key.endsWith(`_${context}`));
                    if (contextKeys.length > 0) {
                        // Special check: Don't override live call counting data
                        if (context === 'totalcalls' && parseInt(cleanText) > 0) {
                            console.log(`🚫 SKIP: Not overriding live call count "${cleanText}" with saved dev stat`);
                        } else {
                            // Use the first (and should be only) context match
                            savedValue = devStats[contextKeys[0]];
                            statId = contextKeys[0];
                            console.log(`🔄 Context match: "${cleanText}" context "${context}" -> found "${contextKeys[0]}" -> saved value: "${savedValue}"`);
                        }
                    }
                }

                // If still no match and context detection failed, try alternative matching for common stat patterns
                if (savedValue === undefined && context === 'unknown') {
                    // Look for saved values that might match this element based on value patterns
                    const numericValue = parseFloat(cleanText.replace(/[^\d.]/g, ''));

                    // For elements that look like total leads (numbers 20-50 range typically)
                    if (/^\d+$/.test(cleanText) && numericValue >= 10 && numericValue <= 100) {
                        const possibleKeys = Object.keys(devStats).filter(key => key.includes('totalleads'));
                        if (possibleKeys.length > 0) {
                            savedValue = devStats[possibleKeys[0]];
                            statId = possibleKeys[0];
                            console.log(`🔄 Pattern match for totalleads: "${cleanText}" -> found "${possibleKeys[0]}" -> saved value: "${savedValue}"`);
                        }
                    }

                    // For elements that look like high value leads (small numbers typically)
                    else if (/^\d+$/.test(cleanText) && numericValue >= 0 && numericValue <= 20) {
                        const possibleKeys = Object.keys(devStats).filter(key => key.includes('highvalue'));
                        if (possibleKeys.length > 0) {
                            savedValue = devStats[possibleKeys[0]];
                            statId = possibleKeys[0];
                            console.log(`🔄 Pattern match for highvalue: "${cleanText}" -> found "${possibleKeys[0]}" -> saved value: "${savedValue}"`);
                        }
                    }

                    // For percentages that look like low value lead rates
                    else if (/^\d+(\.\d+)?\s*%$/.test(cleanText) && numericValue > 50) {
                        const possibleKeys = Object.keys(devStats).filter(key => key.includes('lowrate'));
                        if (possibleKeys.length > 0) {
                            savedValue = devStats[possibleKeys[0]];
                            statId = possibleKeys[0];
                            console.log(`🔄 Pattern match for lowrate: "${cleanText}" -> found "${possibleKeys[0]}" -> saved value: "${savedValue}"`);
                        }
                    }
                }

                if (savedValue === undefined) {
                    // Only use fallback for non-zero values or when we have specific context confidence
                    // This prevents the "0" fallback from applying to all zero elements
                    if (cleanText !== '0' && cleanText !== '0%') {
                        savedValue = devStats[statIdOld];
                        statId = statIdOld;
                        console.log(`🔄 Fallback to old ID: "${statIdOld}" -> saved value: "${savedValue}"`);
                    }
                }

                if (savedValue !== undefined) {
                    console.log(`📊 APPLYING: "${cleanText}" -> "${savedValue}"`);

                    // Apply saved value carefully - preserve structure
                    if (element.children.length === 0) {
                        // Simple text element, safe to replace
                        element.innerHTML = savedValue;
                    } else {
                        // Has child elements, only update text content
                        element.textContent = savedValue;
                    }

                    // Update the stat box color based on the loaded value
                    updateStatBoxColor(element, savedValue);

                    // If we just updated Total Leads, recalculate percentage-based stats
                    if (context && context.includes('totalleads')) {
                        setTimeout(() => {
                            recalculatePercentageStats(parseInt(savedValue));
                        }, 100);
                    }

                    // Re-add pencil icon if dev mode is active
                    const devPanel = document.querySelector('.dev-controls-panel');
                    if (devPanel && devPanel.style.display !== 'none') {
                        const pencilIcon = document.createElement('span');
                        pencilIcon.className = 'edit-pencil';
                        pencilIcon.innerHTML = '✏️';
                        pencilIcon.style.cssText = 'margin-left: 4px; cursor: pointer; opacity: 0.7; font-size: 12px;';
                        pencilIcon.addEventListener('click', (e) => {
                            e.stopPropagation();
                            // Get current displayed value (without pencil icon)
                            const currentValue = element.textContent.replace(/✏️/g, '').trim();
                            makeElementEditable(element, currentValue);
                        });
                        element.appendChild(pencilIcon);
                    }

                    // Visual feedback
                    element.style.background = '#3b82f6';
                    element.style.color = 'white';
                    element.style.padding = '2px 4px';
                    element.style.borderRadius = '2px';

                    setTimeout(() => {
                        element.style.background = '';
                        element.style.color = '';
                        element.style.padding = '';
                        element.style.borderRadius = '';
                    }, 1500);

                    appliedCount++;
                    console.log(`📊 Loaded saved stat: "${cleanText}" -> "${savedValue}"`);
                }
            }
        });

        console.log(`✅ Applied ${appliedCount} saved dev stats for ${agentName} in ${currentFilter}`);

        // Fix all title colors after applying stats
        setTimeout(() => {
            if (window.fixAllTitleColors) {
                fixAllTitleColors();
            }
        }, 200);

        // If no stats were applied and we have retries left, try again
        if (appliedCount === 0 && retryCount < 2 && statKeys.length > 0) {
            console.log(`🔄 No stats applied, retrying in 1000ms... (attempt ${retryCount + 1}/3)`);
            setTimeout(() => applyStatsWithRetry(retryCount + 1), 1000);
        } else {
            // Update main dashboard with saved stats
            if (appliedCount > 0) {
                updateMainDashboardWithSavedStats(agentName, devStats);

                // Skip automatic comparison updates to prevent incorrect calculations
                console.log('🔄 Skipping automatic comparison updates to prevent incorrect calculations...');
                // The updateStatBoxColor function will handle individual updates correctly
                // setTimeout(() => {
                //     updateComparisonValues();
                // }, 1000);
            }

            if (appliedCount > 0 && typeof showNotification === 'function') {
                showNotification(`Loaded ${appliedCount} saved ${currentFilter} edits`, 'info');
            }

            // Debug: Show what was in localStorage vs what was found
            if (statKeys.length > 0) {
                console.log('📊 SAVED STATS IN STORAGE:', devStats);
                console.log('📊 CURRENT STAT ELEMENTS IN DOM:', [...document.querySelectorAll('div, span, td')].filter(el => {
                    const text = el.textContent.trim().replace(/✏️/g, '');
                    return /^\d+$/.test(text) || /^\d+(\.\d+)?\s*%$/.test(text) || /^\d+(\.\d+)?\s*min?$/.test(text);
                }).map(el => el.textContent.trim()));
            }

            // Clear the loading flag and restore modal functions
            window.loadingDevStats = false;

            // Restore original modal close functions
            if (window.originalCloseModal) {
                window.closeModal = window.originalCloseModal;
                delete window.originalCloseModal;
            }
            if (window.originalCloseAgentModal) {
                window.closeAgentModal = window.originalCloseAgentModal;
                delete window.originalCloseAgentModal;
            }

            // Skip global color update to prevent text corruption
            // Individual stat colors are updated correctly during the loading process
            // setTimeout(() => {
            //     updateAllStatColors();
            // }, 200);

            console.log('✅ Dev stats loading completed, modal functions restored');
        }
    };

    // Start the application process with initial delay
    setTimeout(() => applyStatsWithRetry(), 300);
}

// Reset dev mode function - resets all stats to 0
// Debug function to inspect localStorage and DOM state
window.debugDevStats = function() {
    console.log('🔍 =========================');
    console.log('🔍 DEV STATS DEBUG REPORT');
    console.log('🔍 =========================');

    // Get agent and filter - Enhanced detection
    let agentName = document.querySelector('h2')?.textContent?.match(/(\w+)\s+Performance\s+Profile/i)?.[1];
    if (!agentName) {
        agentName = document.querySelector('h2')?.textContent?.match(/^(\w+)\s+Performance/i)?.[1];
    }
    // Try other selectors if still not found
    if (!agentName) {
        const allTextElements = document.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6');
        for (const el of allTextElements) {
            const text = el.textContent?.trim();
            if (text && text.includes('Performance Profile')) {
                const match = text.match(/(\w+)\s+Performance\s+Profile/i);
                if (match && match[1] !== 'Agent') {
                    agentName = match[1];
                    break;
                }
            }
        }
    }
    const currentFilter = getCurrentFilter();

    console.log('🔍 Agent:', agentName);
    console.log('🔍 Filter:', currentFilter);

    if (agentName && currentFilter) {
        const storageKey = `devStats_${agentName}_${currentFilter}`;
        const devStats = JSON.parse(localStorage.getItem(storageKey) || '{}');
        console.log('🔍 Storage Key:', storageKey);
        console.log('🔍 Saved Dev Stats:', devStats);
    }

    // Show all localStorage keys related to devStats
    console.log('🔍 All devStats keys in localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('devStats_')) {
            const value = localStorage.getItem(key);
            console.log(`  ${key}: ${value}`);
        }
    }

    // Show current DOM elements that look like stats
    console.log('🔍 Current stat elements in DOM:');
    const allElements = document.querySelectorAll('div, span, td');
    const statElements = [...allElements].filter(el => {
        const text = el.textContent.trim().replace(/✏️/g, '');
        return /^\d+$/.test(text) || /^\d+(\.\d+)?\s*%$/.test(text) || /^\d+(\.\d+)?\s*min?$/.test(text);
    });

    statElements.forEach((el, i) => {
        const text = el.textContent.trim().replace(/✏️/g, '');
        const statType = getStatType(text);
        const statId = `${statType}_${text}`;
        console.log(`  ${i}: "${text}" -> statId: "${statId}"`);
    });

    console.log('🔍 =========================');
};

window.resetDevMode = async function() {
    console.log('🗑️ Clearing All Saved Dev Stats...');

    // Get current filter to determine what to reset
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    let currentFilter = 'day'; // default
    for (const btn of filterButtons) {
        const computedStyle = window.getComputedStyle(btn);
        const bgColor = computedStyle.backgroundColor;
        if (bgColor === 'rgb(37, 99, 235)' || btn.style.background === '#2563eb') {
            currentFilter = btn.getAttribute('data-filter');
            break;
        }
    }

    console.log('🗑️ Clearing saved stats for filter:', currentFilter);

    // Don't allow reset for YTD
    if (currentFilter === 'ytd') {
        alert('❌ YTD stats cannot be reset for data integrity');
        return;
    }

    // Confirm reset
    const confirmed = confirm(`⚠️ This will CLEAR all saved ${currentFilter.toUpperCase()} dev stats and show live data. Continue?`);
    if (!confirmed) {
        console.log('❌ Reset cancelled by user');
        return;
    }

    // Enhanced agent name detection
    let agentName = document.querySelector('h2')?.textContent?.match(/(\w+)\s+Performance\s+Profile/i)?.[1];
    if (!agentName) {
        agentName = document.querySelector('h2')?.textContent?.match(/^(\w+)\s+Performance/i)?.[1];
    }
    // Try other selectors if still not found
    if (!agentName) {
        const allTextElements = document.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6');
        for (const el of allTextElements) {
            const text = el.textContent?.trim();
            if (text && text.includes('Performance Profile')) {
                const match = text.match(/(\w+)\s+Performance\s+Profile/i);
                if (match && match[1] !== 'Agent') {
                    agentName = match[1];
                    break;
                }
            }
        }
    }

    if (!agentName) {
        alert('❌ Could not determine agent name');
        return;
    }

    // Clear ALL saved dev stats for this agent and filter from server
    await clearDevStatsFromServer(agentName, currentFilter);
    console.log(`🗑️ Cleared all saved dev stats for ${agentName} in ${currentFilter} filter`);

    // Reload the modal to show fresh live data
    console.log('🔄 Reloading modal to show live data...');

    // Find the close modal function and reopen
    if (window.closeModal && window.viewAgentStats) {
        window.closeModal('agent-profile-modal');
        setTimeout(() => {
            window.viewAgentStats(agentName);
        }, 300);
    } else {
        // Fallback: just reload the page
        window.location.reload();
    }

    if (typeof showNotification === 'function') {
        showNotification(`All saved dev stats cleared for ${agentName}`, 'success');
    } else {
        alert(`✅ All saved dev stats cleared! Modal will reload with live data.`);
    }
};

// applySavedStats function removed - no longer needed as live stats override automatically

// Function to update comparison values after stats are changed
window.updateComparisonValues = function() {
    console.log('🔄 Updating comparison values...');

    // Find ALL elements that contain "vs avg" text, regardless of styling
    const allElements = document.querySelectorAll('*');
    const comparisonElements = [...allElements].filter(el =>
        el.textContent && el.textContent.includes('vs avg') && !el.classList.contains('edit-pencil')
    );

    console.log(`🔍 Found ${comparisonElements.length} elements with "vs avg"`);

    let updatedCount = 0;

    comparisonElements.forEach((el, index) => {
        const text = el.textContent.trim();
        console.log(`🔍 Element ${index}: "${text}"`);

        // Look for comparison patterns like "+4.0 vs avg", "-3.0 vs avg"
        const vsAvgMatch = text.match(/([+\-]?\d+(\.\d+)?)\s+vs\s+avg/i);
        if (vsAvgMatch) {
            console.log(`🔍 Found comparison pattern: "${vsAvgMatch[0]}"`);

            // Find the associated stat value by looking in the parent container
            let statContainer = el.parentElement;
            let currentValue = null;
            let avgValue = null;

            // Search multiple levels up to find the stat container
            for (let level = 0; level < 5 && statContainer; level++) {
                console.log(`🔍 Level ${level} container:`, statContainer.textContent.substring(0, 100));

                // Look for stat elements (numbers with pencil icons)
                const statElements = statContainer.querySelectorAll('.edit-pencil');
                if (statElements.length > 0) {
                    // Find the stat element closest to this comparison
                    const parentStatElement = statElements[0].parentElement;
                    if (parentStatElement) {
                        const statText = parentStatElement.textContent.replace(/✏️/g, '').trim();
                        currentValue = parseFloat(statText.replace(/[^\d.]/g, ''));
                        console.log(`🔍 Found stat value: "${statText}" -> ${currentValue}`);
                    }
                    break;
                }

                // Also try finding standalone stat numbers
                const allChildElements = [...statContainer.querySelectorAll('*')];
                for (const child of allChildElements) {
                    const childText = child.textContent.trim().replace(/✏️/g, '');
                    if (/^\d+(\.\d+)?%?$/.test(childText) && !childText.includes('vs') && !childText.includes('avg') && !childText.includes('Avg:')) {
                        currentValue = parseFloat(childText.replace(/[^\d.]/g, ''));
                        console.log(`🔍 Found standalone stat: "${childText}" -> ${currentValue}`);
                        break;
                    }
                }

                if (currentValue !== null) break;
                statContainer = statContainer.parentElement;
            }

            // Extract the average value from anywhere in the container
            const avgMatch = text.match(/avg:\s*(\d+(\.\d+)?)%?/i);
            if (avgMatch) {
                avgValue = parseFloat(avgMatch[1]);
                console.log(`🔍 Found avg value: ${avgValue}`);
            }

            if (currentValue !== null && avgValue !== null) {
                const difference = currentValue - avgValue;
                console.log(`🔍 Calculating: ${currentValue} - ${avgValue} = ${difference}`);

                // Update the comparison text
                const newComparisonText = text.replace(
                    /[+\-]?\d+(\.\d+)?\s+vs\s+avg/i,
                    `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} vs avg`
                );

                // Only update if the content is actually different
                if (newComparisonText !== text) {
                    el.textContent = newComparisonText;

                    // Update color based on positive/negative
                    if (difference > 0) {
                        el.style.color = '#10b981'; // Green for positive
                    } else if (difference < 0) {
                        el.style.color = '#ef4444'; // Red for negative
                    } else {
                        el.style.color = '#6b7280'; // Gray for neutral
                    }

                    // Also update the parent stat box background color
                    let statBox = el.parentElement;
                    for (let level = 0; level < 5 && statBox; level++) {
                        if (statBox.style.background && statBox.style.background.includes('#')) {
                            // Found a stat box with background color, update it
                            if (difference > 0) {
                                // Better than average - Green
                                statBox.style.background = '#f0fdf4';
                                statBox.style.borderColor = '#bbf7d0';
                            } else if (difference < 0) {
                                // Worse than average - Red
                                statBox.style.background = '#fef2f2';
                                statBox.style.borderColor = '#fecaca';
                            } else {
                                // Same as average - Grey
                                statBox.style.background = '#f8f9fa';
                                statBox.style.borderColor = '#e5e7eb';
                            }

                            // Also update the title text color to match the box meaning
                            // Look for title divs with specific font-size styling
                            const titleDivs = statBox.querySelectorAll('div[style*="font-size: 14px"]');
                            titleDivs.forEach(titleEl => {
                                const text = titleEl.textContent.trim().toLowerCase();
                                // Only update actual title elements, skip comparison text
                                if ((text.includes('total leads') ||
                                    text.includes('high value leads') ||
                                    text.includes('low value leads') ||
                                    text.includes('total calls') ||
                                    text.includes('call duration') ||
                                    text.includes('contact rate') ||
                                    text.includes('leads to brokers') ||
                                    text.includes('time on non-green') ||
                                    text.includes('low value lead rate')) &&
                                    !text.includes('vs avg') &&
                                    !text.includes('avg:') &&
                                    !text.includes('%')) {

                                    const targetColor = difference > 0 ? '#059669' : difference < 0 ? '#dc2626' : '#6b7280';
                                    titleEl.style.setProperty('color', targetColor, 'important');
                                    console.log(`🎨 TITLE COLOR FIX: "${titleEl.textContent}" -> ${targetColor} (${difference < 0 ? 'red' : difference > 0 ? 'green' : 'gray'})`);
                                }
                            });

                            console.log(`🎨 Updated stat box background for difference: ${difference}`);
                            break;
                        }
                        statBox = statBox.parentElement;
                    }

                    console.log(`✅ Updated comparison: "${text}" -> "${newComparisonText}"`);
                    updatedCount++;

                    // Visual feedback
                    el.style.background = '#fbbf24';
                    el.style.padding = '1px 3px';
                    el.style.borderRadius = '2px';

                    setTimeout(() => {
                        el.style.background = '';
                        el.style.padding = '';
                        el.style.borderRadius = '';
                    }, 1500);
                } else {
                    console.log(`🔍 No update needed: "${text}"`);
                }
            } else {
                console.log(`❌ Could not find values - current: ${currentValue}, avg: ${avgValue}`);
            }
        }
    });

    // Also look for text patterns in div elements
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
        const text = div.textContent.trim();

        // Look for patterns like "3.7% of total" that might need updating
        if (/\d+(\.\d+)?%\s+of\s+total/i.test(text) && !text.includes('vs avg')) {
            console.log('🔍 Found percentage of total:', text);

            // Try to find associated stat values to recalculate percentage
            const container = div.closest('[class*="stat"], [class*="performance"], [class*="info"]') || div.parentElement;
            if (container) {
                const statElements = container.querySelectorAll('*');
                let totalValue = null;
                let partValue = null;

                // Look for the main numbers
                statElements.forEach(el => {
                    const elText = el.textContent.trim().replace(/✏️/g, '');
                    if (/^\d+$/.test(elText)) {
                        const num = parseInt(elText);
                        if (num > 10) {
                            totalValue = num; // Likely the total
                        } else {
                            partValue = num; // Likely the part
                        }
                    }
                });

                if (totalValue !== null && partValue !== null && totalValue > 0) {
                    const percentage = ((partValue / totalValue) * 100).toFixed(1);
                    const newText = text.replace(/\d+(\.\d+)?%/, `${percentage}%`);

                    if (newText !== text) {
                        div.textContent = newText;
                        console.log(`✅ Updated percentage: "${text}" -> "${newText}"`);
                        updatedCount++;

                        // Visual feedback
                        div.style.background = '#3b82f6';
                        div.style.color = 'white';
                        div.style.padding = '1px 3px';
                        div.style.borderRadius = '2px';

                        setTimeout(() => {
                            div.style.background = '';
                            div.style.color = '';
                            div.style.padding = '';
                            div.style.borderRadius = '';
                        }, 1500);
                    }
                }
            }
        }
    });

    console.log(`✅ Updated ${updatedCount} comparison values`);

    if (updatedCount > 0 && typeof showNotification === 'function') {
        showNotification(`Updated ${updatedCount} comparisons`, 'info');
    }
};

// Function to update the Performance Summary text based on current stats
window.updatePerformanceSummary = function() {
    console.log('🔄 Updating performance summary...');

    // Try multiple approaches to find the Performance Summary
    let summaryEl = null;

    // Method 1: Look for elements containing the exact pattern
    const allElements = [...document.querySelectorAll('p, div, span')];
    summaryEl = allElements.find(el => {
        const text = el.textContent || '';
        return text.includes('has managed') &&
               text.includes('total leads with') &&
               text.includes('high-value leads') &&
               !el.querySelector('p, div') && // Make sure it's not a container
               text.length > 50; // Make sure it's the full summary
    });

    // Method 2: If not found, look more broadly
    if (!summaryEl) {
        summaryEl = allElements.find(el => {
            const text = el.textContent || '';
            return text.includes('Grant has managed') && text.includes('Contact rate:');
        });
    }

    // Method 3: Look for any text containing the agent name and performance metrics
    if (!summaryEl) {
        summaryEl = allElements.find(el => {
            const text = el.textContent || '';
            return text.match(/\w+\s+has managed\s+\d+\s+total leads/i);
        });
    }

    console.log('🔍 Summary element search result:', summaryEl);

    if (summaryEl) {
            console.log('📊 Found Performance Summary element');

            // Get current values from the main stat displays in the performance modal
            let currentTotalLeads = '0';
            let currentHighValue = '0';
            let currentLowValue = '0';
            let currentContactRate = '0.0%';

            // Find the main stat elements by looking for large numbers with specific context
            const statElements = [...document.querySelectorAll('div')].filter(el => {
                const text = el.textContent?.trim();
                return text && /^\d+$|^\d+(\.\d+)?%$/.test(text) && el.parentElement;
            });

            statElements.forEach(el => {
                const text = el.textContent.trim();
                const parentText = el.parentElement.textContent.toLowerCase();

                if (parentText.includes('total leads') && !parentText.includes('low value leads')) {
                    currentTotalLeads = text;
                } else if (parentText.includes('high value leads')) {
                    currentHighValue = text;
                } else if (parentText.includes('contact rate')) {
                    currentContactRate = text.includes('%') ? text : text + '%';
                }
            });

            // Calculate low value leads as total - high value
            currentLowValue = (parseInt(currentTotalLeads) - parseInt(currentHighValue)).toString();

            console.log('🔍 Extracted values:', {currentTotalLeads, currentHighValue, currentLowValue, currentContactRate});

            // Get agent name
            const agentName = document.querySelector('h2')?.textContent?.match(/(\w+)\s+Performance/)?.[1] || 'Agent';

            // Calculate percentages
            const total = parseInt(currentTotalLeads) || 0;
            const highValuePercent = total > 0 ? ((parseInt(currentHighValue) / total) * 100).toFixed(1) : '0.0';
            const lowValuePercent = total > 0 ? ((parseInt(currentLowValue) / total) * 100).toFixed(1) : '0.0';

            // Create new summary text
            const newSummaryText = `${agentName} has managed ${currentTotalLeads} total leads with ${currentHighValue} high-value leads (${highValuePercent}%) and ${currentLowValue} low-value leads (${lowValuePercent}%). Contact rate: ${currentContactRate}. 0 leads were referred to brokers (0.0%).`;

            // Update the text
            summaryEl.textContent = newSummaryText;

            // Visual feedback
            summaryEl.style.background = '#3b82f6';
            summaryEl.style.color = 'white';
            summaryEl.style.padding = '4px 8px';
            summaryEl.style.borderRadius = '4px';

            setTimeout(() => {
                summaryEl.style.background = '';
                summaryEl.style.color = '';
                summaryEl.style.padding = '';
                summaryEl.style.borderRadius = '';
            }, 2000);

            console.log(`✅ Updated Performance Summary: ${newSummaryText}`);

            if (typeof showNotification === 'function') {
                showNotification('Performance Summary updated', 'info');
            }
        } else {
            console.log('❌ Performance Summary element not found');
        }
};

// Function to completely clear all dev stats and let natural calculations work
window.clearAllDevStats = function() {
    console.log('🧹 Clearing all dev stats from localStorage...');

    // First, log ALL localStorage keys to see what's there
    const allKeys = Object.keys(localStorage);
    console.log('🔍 ALL localStorage keys:', allKeys);

    // Clear all localStorage keys that might contain dev stats
    let clearedCount = 0;
    const patterns = ['devStats_', 'dev_', 'stat_', 'Grant_', 'agent_'];

    allKeys.forEach(key => {
        let shouldRemove = false;

        // Check if key matches any dev stat patterns
        for (const pattern of patterns) {
            if (key.includes(pattern)) {
                shouldRemove = true;
                break;
            }
        }

        // Also check if the value contains stat-like content
        try {
            const value = localStorage.getItem(key);
            if (value && (value.includes('totalleads') || value.includes('vs avg') || value.includes('small_number'))) {
                shouldRemove = true;
            }
        } catch (e) {
            // Ignore parsing errors
        }

        if (shouldRemove) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log(`🗑️ Removed: ${key}`);
        }
    });

    // If still no keys found, try clearing everything (nuclear option)
    if (clearedCount === 0) {
        console.log('⚠️ No dev stat keys found with patterns. Checking all keys for content...');

        allKeys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                console.log(`🔍 Key: ${key} = ${value?.substring(0, 100)}...`);

                // Look for stat content in values
                if (value && (
                    value.includes('"small_number_0_totalleads"') ||
                    value.includes('"small_number_0_highvalue"') ||
                    value.includes('totalleads') ||
                    value.includes('+4.0 vs avg')
                )) {
                    localStorage.removeItem(key);
                    clearedCount++;
                    console.log(`🗑️ Removed by content: ${key}`);
                }
            } catch (e) {
                console.log(`❌ Error checking ${key}:`, e);
            }
        });
    }

    console.log(`✅ Cleared ${clearedCount} dev stat entries from localStorage`);

    if (typeof showNotification === 'function') {
        showNotification(`Cleared ${clearedCount} dev stat entries`, 'info');
    }

    // Force refresh to show natural calculations
    setTimeout(() => {
        location.reload();
    }, 1000);
};

// Function to immediately update stat box color when a value is edited
function updateStatBoxColor(element, newValue) {
    console.log(`🎨 Updating stat box color for value: "${newValue}"`);

    // Find the stat container (the colored box that contains this element)
    let statContainer = element;
    let avgValue = null;

    // Search up to 5 levels to find the stat box container
    for (let level = 0; level < 5; level++) {
        if (!statContainer) break;

        // Check if this container has a background color (indicating it's a stat box)
        const style = window.getComputedStyle(statContainer);
        const hasBackground = style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';

        if (hasBackground) {
            console.log(`🎨 Found stat container at level ${level}:`, statContainer);

            // Look for the average value in this container or nearby elements
            const containerText = statContainer.textContent.toLowerCase();
            const avgMatch = containerText.match(/avg:\s*(\d+(\.\d+)?)%?/i);

            if (avgMatch) {
                avgValue = parseFloat(avgMatch[1]);
                console.log(`🔍 Found avg value in container: ${avgValue}`);
            } else {
                // Look in sibling elements or parent elements for avg value
                const parent = statContainer.parentElement;
                if (parent) {
                    const parentText = parent.textContent.toLowerCase();
                    const parentAvgMatch = parentText.match(/avg:\s*(\d+(\.\d+)?)%?/i);
                    if (parentAvgMatch) {
                        avgValue = parseFloat(parentAvgMatch[1]);
                        console.log(`🔍 Found avg value in parent: ${avgValue}`);
                    }
                }
            }

            // If we found an average value, compare and update color
            if (avgValue !== null) {
                const currentValue = parseFloat(newValue.replace(/[^\d.]/g, ''));
                console.log(`🔍 Comparing: ${currentValue} vs avg ${avgValue}`);
                const difference = currentValue - avgValue;

                // Apply color logic: lower = red, same = gray, higher = green
                if (currentValue < avgValue) {
                    // Red for below average
                    statContainer.style.background = '#fef2f2';
                    statContainer.style.borderColor = '#fecaca';
                    console.log('🔴 Applied red (below average)');
                } else if (currentValue === avgValue) {
                    // Gray for same as average
                    statContainer.style.background = '#f8f9fa';
                    statContainer.style.borderColor = '#e5e7eb';
                    console.log('⚪ Applied gray (same as average)');
                } else {
                    // Green for above average
                    statContainer.style.background = '#f0fdf4';
                    statContainer.style.borderColor = '#bbf7d0';
                    console.log('🟢 Applied green (above average)');
                }

                // Update the comparison text and color in this container
                const comparisonElements = statContainer.querySelectorAll('*');
                comparisonElements.forEach(el => {
                    const text = el.textContent.trim();
                    if (text.includes('vs avg')) {
                        const newComparisonText = `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} vs avg`;
                        el.textContent = newComparisonText;

                        // Update text color with !important to override hardcoded styles
                        if (difference > 0) {
                            el.style.setProperty('color', '#059669', 'important'); // Green
                        } else if (difference < 0) {
                            el.style.setProperty('color', '#dc2626', 'important'); // Red
                        } else {
                            el.style.setProperty('color', '#6b7280', 'important'); // Gray
                        }

                        console.log(`🔄 Updated comparison text: "${text}" -> "${newComparisonText}"`);
                    }
                });

                return; // Exit once we've updated the color
            }

            break; // Found container but no avg value, stop searching
        }

        statContainer = statContainer.parentElement;
    }

    if (!avgValue) {
        console.log('⚠️ No average value found, cannot update stat box color');
    }
}

// Function to fix broken layout by clearing problematic saved stats
window.fixBrokenLayout = function() {
    console.log('🔧 Fixing broken layout...');

    // Clear all dev stats for current agent/filter
    let agentName = document.querySelector('h2')?.textContent?.match(/(\w+)\s+Performance/)?.[1];
    if (!agentName) {
        const allTextElements = document.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6');
        for (const el of allTextElements) {
            const text = el.textContent?.trim();
            if (text && text.includes('Performance Profile')) {
                const match = text.match(/(\w+)\s+Performance\s+Profile/i);
                if (match && match[1] !== 'Agent') {
                    agentName = match[1];
                    break;
                }
            }
        }
    }

    const currentFilter = getCurrentFilter();

    if (agentName && currentFilter) {
        const storageKey = `devStats_${agentName}_${currentFilter}`;
        localStorage.removeItem(storageKey);
        console.log(`🗑️ Removed problematic dev stats for ${agentName} in ${currentFilter}`);

        // Refresh the page to restore original layout
        setTimeout(() => {
            location.reload();
        }, 500);
    }
};

// Function to update all stat colors consistently
window.updateAllStatColors = function() {
    console.log('🎨 Updating all stat colors for consistency...');

    // Find all stat containers with background colors
    const allStatContainers = document.querySelectorAll('div[style*="background"]');

    allStatContainers.forEach(container => {
        // Look for main stat number and average in this container
        const containerText = container.textContent;

        // Find the main stat value (first number before "vs avg")
        const beforeVsAvg = containerText.split('vs avg')[0];
        const statMatches = beforeVsAvg.match(/(\d+(?:\.\d+)?%?)/g);

        // Find the average value
        const avgMatch = containerText.match(/avg:\s*(\d+(?:\.\d+)?)%?/i);

        if (statMatches && avgMatch && statMatches.length > 0) {
            // Get the last number before "vs avg" as the main stat
            const statText = statMatches[statMatches.length - 1];
            const currentValue = parseFloat(statText.replace(/[^\d.]/g, ''));
            const avgValue = parseFloat(avgMatch[1]);

            console.log(`🎨 Checking container: "${statText}" vs avg ${avgValue}`);

            // Apply consistent coloring
            updateStatBoxColor(container.querySelector('div'), statText);
        }
    });

    console.log('✅ All stat colors updated');
};

// Function to recalculate percentage-based stats when Total Leads changes
window.recalculatePercentageStats = function(newTotalLeads) {
    console.log(`🔄 Recalculating percentage stats for Total Leads = ${newTotalLeads}`);

    // Find all percentage-based stats that need updating
    const percentageElements = document.querySelectorAll('*');

    percentageElements.forEach(element => {
        const text = element.textContent.trim();

        // Look for "Low Value Leads" percentage stat (should be calculated)
        if (text.includes('%') &&
            (element.closest('div[style*="padding"]') &&
             element.closest('div[style*="padding"]').textContent.includes('low value leads'))) {

            // For now, assume low value leads are approximately 85-95% of total
            // This is a simplified calculation - in real system this would come from actual data
            const lowValuePercentage = Math.min(95, Math.max(80, 85 + Math.random() * 10));
            const newPercentageText = lowValuePercentage.toFixed(1) + '%';

            console.log(`📊 Updating Low Value Lead percentage: ${text} -> ${newPercentageText}`);
            element.textContent = newPercentageText;

            // Update the stat box color for the new percentage
            updateStatBoxColor(element, newPercentageText);
        }

        // Look for "High Value Leads" percentage stat
        if (text.includes('%') &&
            (element.closest('div[style*="padding"]') &&
             element.closest('div[style*="padding"]').textContent.includes('high value'))) {

            // High value leads are typically 3-8% of total
            const highValuePercentage = Math.min(8, Math.max(1, 3 + Math.random() * 5));
            const newPercentageText = highValuePercentage.toFixed(1) + '%';

            console.log(`📊 Updating High Value Lead percentage: ${text} -> ${newPercentageText}`);
            element.textContent = newPercentageText;

            // Update the stat box color for the new percentage
            updateStatBoxColor(element, newPercentageText);
        }

        // Update "of total" text that shows absolute numbers based on percentages
        if (text.includes('total leads') && !text.includes('vs avg')) {
            const parentContainer = element.closest('div[style*="padding"]');
            if (parentContainer) {
                const containerText = parentContainer.textContent.toLowerCase();
                if (containerText.includes('low value') || containerText.includes('high value')) {
                    const isLowValue = containerText.includes('low value');
                    const percentage = isLowValue ? 90 : 5; // Simplified percentages
                    const absoluteNumber = Math.round((percentage / 100) * newTotalLeads);

                    const newText = `${absoluteNumber} total leads`;
                    console.log(`📊 Updating absolute count: ${text} -> ${newText}`);
                    element.textContent = newText;
                }
            }
        }
    });

    console.log(`✅ Percentage stats recalculated for Total Leads = ${newTotalLeads}`);
};

// Server API functions for dev stats persistence
async function saveDevStatsToServer(agentName, filter, stats) {
    try {
        const response = await fetch('/api/agent-dev-stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agentName,
                filter,
                stats
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`💾 Saved dev stats to server for ${agentName} ${filter}:`, result);

            // Also keep in localStorage as backup
            const storageKey = `devStats_${agentName}_${filter}`;
            localStorage.setItem(storageKey, JSON.stringify(stats));
        } else {
            console.error('Failed to save dev stats to server:', response.status);
            // Fallback to localStorage only
            const storageKey = `devStats_${agentName}_${filter}`;
            localStorage.setItem(storageKey, JSON.stringify(stats));
        }
    } catch (error) {
        console.error('Error saving dev stats to server:', error);
        // Fallback to localStorage only
        const storageKey = `devStats_${agentName}_${filter}`;
        localStorage.setItem(storageKey, JSON.stringify(stats));
    }
}

async function loadDevStatsFromServer(agentName, filter) {
    try {
        const response = await fetch(`/api/agent-dev-stats/${agentName}/${filter}`);

        if (response.ok) {
            const result = await response.json();
            console.log(`📊 Loaded dev stats from server for ${agentName} ${filter}:`, result.stats);

            if (result.stats) {
                // Also save to localStorage as backup
                const storageKey = `devStats_${agentName}_${filter}`;
                localStorage.setItem(storageKey, JSON.stringify(result.stats));
                return result.stats;
            }
        } else {
            console.warn('Failed to load dev stats from server:', response.status);
        }
    } catch (error) {
        console.error('Error loading dev stats from server:', error);
    }

    // Fallback to localStorage
    const storageKey = `devStats_${agentName}_${filter}`;
    const localStats = localStorage.getItem(storageKey);
    if (localStats) {
        console.log(`📊 Fallback: Loaded dev stats from localStorage for ${agentName} ${filter}`);
        return JSON.parse(localStats);
    }

    return {};
}

async function clearDevStatsFromServer(agentName, filter) {
    try {
        const response = await fetch(`/api/agent-dev-stats/${agentName}/${filter}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`🗑️ Cleared dev stats from server for ${agentName} ${filter}:`, result);

            // Also clear localStorage
            const storageKey = `devStats_${agentName}_${filter}`;
            localStorage.removeItem(storageKey);
        } else {
            console.error('Failed to clear dev stats from server:', response.status);
        }
    } catch (error) {
        console.error('Error clearing dev stats from server:', error);
    }
}

// Function to update live stats tracker when values are manually edited
function updateLiveStatsTracker(agentName, context, newValue) {
    if (!window.liveStatsTracker) {
        console.log('⚠️ Live stats tracker not available');
        return;
    }

    const agent = window.liveStatsTracker.initAgent(agentName);
    const numericValue = parseFloat(newValue) || 0;

    // Update the appropriate live stat based on context
    switch(context) {
        case 'totalleads':
            agent.totalLeads = numericValue;
            console.log(`📊 Updated live totalLeads for ${agentName}: ${numericValue}`);
            break;
        case 'totalcalls':
            agent.connectedCalls = numericValue;
            agent.totalCalls = numericValue; // Also update total calls
            console.log(`📊 Updated live connectedCalls for ${agentName}: ${numericValue}`);
            break;
        case 'highvalue':
            agent.highValueLeads = numericValue;
            console.log(`📊 Updated live highValueLeads for ${agentName}: ${numericValue}`);
            break;
        case 'duration':
            agent.totalCallDuration = numericValue;
            console.log(`📊 Updated live totalCallDuration for ${agentName}: ${numericValue}`);
            break;
        case 'contactrate':
            agent.contactRate = numericValue;
            console.log(`📊 Updated live contactRate for ${agentName}: ${numericValue}`);
            break;
        default:
            console.log(`⚠️ Unknown context for live stats update: ${context}`);
            return;
    }

    // Recalculate derived stats
    window.liveStatsTracker.recalculateContactRate(agentName);

    // Save to server
    window.liveStatsTracker.saveToServer(agentName);

    console.log(`✅ Live stats updated and saved for ${agentName}:`, agent);
}

console.log('🚨 SIMPLE DEV CONTROLS READY');
console.log('💡 To add dev button: ADD_DEV_BUTTON_NOW()');
console.log('🔧 Available functions: updateStatField, forceResetStats, forceRefreshStats, getCurrentAgentStats, exportDevData, forceAddPencilsDebug, resetDevMode, updateComparisonValues, updatePerformanceSummary, clearAllDevStats, updateStatBoxColor, fixBrokenLayout');
console.log('🛠️ If layout is broken, run: fixBrokenLayout()');

// Function to manually fix all title colors to match box colors
window.fixAllTitleColors = function() {
    console.log('🎨 Manually fixing all title colors...');

    const statBoxes = document.querySelectorAll('div[style*="background:"][style*="padding: 20px"]');
    let fixedCount = 0;

    statBoxes.forEach(box => {
        const bgColor = box.style.background || box.style.backgroundColor;
        const titleDiv = box.querySelector('div[style*="font-size: 14px"]');

        if (titleDiv) {
            let targetColor = '#6b7280'; // Default gray

            // Determine color based on background
            if (bgColor.includes('240, 253, 244') || bgColor.includes('#f0fdf4')) {
                targetColor = '#059669'; // Green for good performance
            } else if (bgColor.includes('254, 242, 242') || bgColor.includes('#fef2f2')) {
                targetColor = '#dc2626'; // Red for poor performance
            } else if (bgColor.includes('#f8f9fa')) {
                targetColor = '#6b7280'; // Gray for average
            }

            titleDiv.style.setProperty('color', targetColor, 'important');
            console.log(`🎨 Fixed title: "${titleDiv.textContent}" -> ${targetColor}`);
            fixedCount++;
        }

        // Also fix any "Avg: X min/call" text to be gray (informational only)
        const avgPerCallTexts = box.querySelectorAll('div');
        avgPerCallTexts.forEach(textDiv => {
            if (textDiv.textContent.includes('min/call') ||
                (textDiv.textContent.includes('Avg:') && textDiv.textContent.includes('min'))) {
                textDiv.style.setProperty('color', '#6b7280', 'important');
                console.log(`🎨 Fixed avg per call text to gray: "${textDiv.textContent}"`);
            }
        });
    });

    console.log(`✅ Fixed ${fixedCount} title colors`);
};

console.log('🎨 Run fixAllTitleColors() to manually fix title colors');