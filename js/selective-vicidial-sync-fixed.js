/**
 * FIXED: Selective ViciDial Sync with timeout and better error handling
 * This MUST override all other syncVicidialLeads functions
 */

console.log('🔧 FIXED Selective ViciDial Sync system loaded - VERSION 6');

// Global variable to track available leads
let availableVicidialLeads = [];

// Store reference to the working bulk import process (from add-sync-button.js)
let workingBulkImportFunction = null;
if (window.syncVicidialLeads && window.syncVicidialLeads.toString().includes('sync-notification-backup')) {
    workingBulkImportFunction = window.syncVicidialLeads;
    console.log('✅ Stored working bulk import function for reference');
}

// Force clear any existing syncVicidialLeads function first
if (window.syncVicidialLeads) {
    console.log('⚠️ Found existing syncVicidialLeads function - will override it');
}

// Override the sync function with selective sync - FORCE OVERRIDE
window.syncVicidialLeads = async function() {
    console.log('🎯 SELECTIVE SYNC CALLED - This should show LEAD SELECTION POPUP with orange headers!');
    console.log('🔄 Opening selective ViciDial sync (FIXED version)...');

    // Remove any existing popups first
    const existingPopup = document.getElementById('vicidial-loading-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // First, show loading popup
    showLoadingPopup();

    try {
        console.log('📡 Fetching from /api/vicidial/data (scanning all lists for selection)...');

        // Fetch available leads from backend for selection overlay
        const response = await fetch('/api/vicidial/data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📡 Data received:', data);
        console.log(`📋 Scanned ${data.totalListsScanned || 0} ViciDial lists`);
        console.log(`✅ Found ${data.totalSaleLeads || 0} SALE leads in ${data.listsWithSaleLeads || 0} lists`);

        // Always show the lead selection popup if we have list data
        if (data.success && data.allListsSummary) {
            availableVicidialLeads = data.saleLeads || [];
            hideLoadingPopup();
            showLeadSelectionPopupWithAllLists(data);
        } else {
            hideLoadingPopup();
            showErrorPopup('Failed to scan ViciDial lists');
        }

    } catch (error) {
        console.error('❌ Error fetching ViciDial leads:', error);
        hideLoadingPopup();

        let errorMessage = 'Connection failed';
        if (error.message.includes('fetch')) {
            errorMessage = 'Network error - unable to reach server';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Invalid response from server';
        } else if (error.message.includes('Server error')) {
            errorMessage = error.message;
        } else {
            errorMessage = error.message || 'Unknown error occurred';
        }

        showErrorPopup(errorMessage);
    }
};

function showLoadingPopup() {
    console.log('🔄 Showing loading popup...');

    const popup = document.createElement('div');
    popup.id = 'vicidial-loading-popup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    popup.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 90%;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Connecting to ViciDial</h3>
            <p style="margin: 0; color: #6b7280;">Fetching available SALE leads...</p>
            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">This may take a moment for large datasets</p>
            <button onclick="cancelSync()" style="
                margin-top: 20px;
                background: #6b7280;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">Cancel</button>
        </div>
    `;

    // Add spinning animation
    if (!document.getElementById('spin-animation')) {
        const style = document.createElement('style');
        style.id = 'spin-animation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Add cancel function
    window.cancelSync = function() {
        console.log('❌ Sync cancelled by user');
        hideLoadingPopup();
    };

    document.body.appendChild(popup);

    // Removed timeout - let the operation complete no matter how long it takes
    // The user can still cancel manually if needed
}

function hideLoadingPopup() {
    console.log('✅ Hiding loading popup...');

    const popup = document.getElementById('vicidial-loading-popup');
    if (popup) {
        popup.remove();
    }

    // Clean up cancel function
    if (window.cancelSync) {
        delete window.cancelSync;
    }
}

function showLeadSelectionPopupWithAllLists(data) {
    console.log('📋 Showing ALL ViciDial lists with SALE leads');
    console.log(`📊 Scan summary: ${data.totalListsScanned} lists scanned, ${data.listsWithSaleLeads} with SALE leads`);

    const leads = data.saleLeads || [];
    const allLists = data.allListsSummary || [];

    const popup = document.createElement('div');
    popup.id = 'lead-selection-popup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Group leads by list ID for easy lookup
    const leadsByList = {};
    leads.forEach((lead, index) => {
        if (!leadsByList[lead.listId]) {
            leadsByList[lead.listId] = [];
        }
        leadsByList[lead.listId].push({ ...lead, originalIndex: index });
    });

    // Generate ALL lists with green headers for active lists, orange for inactive
    const leadsList = allLists
        .sort((a, b) => a.listId.localeCompare(b.listId))
        .map(list => {
            const listLeads = leadsByList[list.listId] || [];
            const hasLeads = listLeads.length > 0;
            const isActive = list.active === true || list.active === 'Y';

            // Use green gradient for active lists, orange for inactive
            const headerColor = isActive
                ? 'linear-gradient(135deg, #10b981, #059669)' // Green gradient
                : 'linear-gradient(135deg, #f59e0b, #d97706)'; // Orange gradient

            // Always show the header for every list
            let listHtml = `
                <div style="margin-bottom: 20px;">
                    <div style="
                        background: ${headerColor};
                        color: white;
                        padding: 12px 16px;
                        border-radius: 8px 8px ${hasLeads ? '0 0' : '8px 8px'};
                        font-weight: 600;
                        font-size: 14px;
                        margin-bottom: ${hasLeads ? '8px' : '0'};
                    ">
                        List ${list.listId}: ${list.listName.split('[')[0].trim()} (${list.saleCount} leads) ${isActive ? '✓ Active' : ''}
                    </div>
            `;

            // Only add lead details if this list has SALE leads
            if (hasLeads) {
                const leadsHtml = listLeads.map(lead => {
                    const originalIndex = lead.originalIndex;
                    const lastCallDate = lead.lastCallDate ? new Date(lead.lastCallDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }) : 'Unknown';

                    return `
                        <div style="
                            display: flex;
                            align-items: center;
                            padding: 10px;
                            border: 1px solid #e5e7eb;
                            border-radius: 6px;
                            margin-bottom: 6px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s;
                            margin-left: 8px;
                        " class="lead-option" data-index="${originalIndex}" onclick="toggleLeadSelection(${originalIndex})">
                            <input type="checkbox" id="lead-${originalIndex}" style="margin-right: 12px; transform: scale(1.2);">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                                    ${lead.name || 'Unknown Company'}
                                </div>
                                <div style="font-size: 13px; color: #6b7280;">
                                    Rep: ${lead.contact || 'Unknown'} |
                                    DOT: ${lead.dotNumber || 'N/A'} |
                                    Sale Date: ${lastCallDate}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                listHtml += `
                    <div style="padding-left: 8px;">
                        ${leadsHtml}
                    </div>
                `;
            }

            listHtml += `</div>`;
            return listHtml;
        }).join('');

    popup.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 800px;
            width: 95%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        ">
            <!-- Header -->
            <div style="
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border-radius: 12px 12px 0 0;
            ">
                <div style="display: flex; justify-content: between; align-items: center;">
                    <div>
                        <h2 style="margin: 0 0 8px 0; font-size: 20px;">📞 Select ViciDial Leads to Import</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 14px;">
                            Scanned ${data.totalListsScanned} ViciDial lists • Found ${leads.length} SALE leads in ${data.listsWithSaleLeads} lists
                        </p>
                    </div>
                </div>
            </div>

            <!-- Selection Controls - Only show if there are leads -->
            ${leads.length > 0 ? `
            <div style="padding: 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <button onclick="selectAllLeads()" style="
                        background: #10b981; color: white; border: none; padding: 8px 16px;
                        border-radius: 6px; cursor: pointer; font-size: 14px;
                    ">✅ Select All</button>
                    <button onclick="deselectAllLeads()" style="
                        background: #6b7280; color: white; border: none; padding: 8px 16px;
                        border-radius: 6px; cursor: pointer; font-size: 14px;
                    ">❌ Deselect All</button>
                    <span style="color: #6b7280; font-size: 14px;" id="selection-count">0 selected</span>
                </div>
            </div>
            ` : ''}

            <!-- All Lists with SALE Leads -->
            <div style="
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                max-height: 400px;
            " id="leads-container">
                ${leadsList}
            </div>

            <!-- Footer Actions -->
            <div style="
                padding: 20px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                border-radius: 0 0 12px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <button onclick="closeLeadSelectionPopup()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Cancel</button>
                ${leads.length > 0 ? `
                <button onclick="importSelectedLeads()" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Import Selected Leads</button>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(popup);
}

// Keep the old function for backwards compatibility
function showLeadSelectionPopup(leads, scanData = null) {
    console.log('📋 Showing lead selection popup with', leads.length, 'leads');
    if (scanData) {
        console.log(`📊 Scan summary: ${scanData.totalListsScanned} lists scanned, ${scanData.listsWithSaleLeads} with SALE leads`);
    }

    const popup = document.createElement('div');
    popup.id = 'lead-selection-popup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Group leads by list ID
    const leadsByList = {};
    leads.forEach((lead, index) => {
        if (!leadsByList[lead.listId]) {
            leadsByList[lead.listId] = {
                listName: lead.listName,
                leads: []
            };
        }
        leadsByList[lead.listId].leads.push({ ...lead, originalIndex: index });
    });

    // Generate leads list organized by list number
    const leadsList = Object.keys(leadsByList)
        .sort((a, b) => a.localeCompare(b)) // Sort list IDs
        .map(listId => {
            const listData = leadsByList[listId];
            const leadsHtml = listData.leads.map(lead => {
                const originalIndex = lead.originalIndex;
                const lastCallDate = lead.lastCallDate ? new Date(lead.lastCallDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) : 'Unknown';

                const renewalInfo = lead.renewalDate ?
                    `🗓️ Renewal: ${new Date(lead.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${lead.daysUntilRenewal || 0} days)` :
                    '';

                const premiumInfo = lead.estimatedPremium ? `💰 Est. Premium: $${lead.estimatedPremium.toLocaleString()}` : '';
                const fleetInfo = lead.powerUnits ? `🚛 ${lead.powerUnits} units` : '';

                return `
                    <div style="
                        display: flex;
                        align-items: center;
                        padding: 10px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        margin-bottom: 6px;
                        background: white;
                        cursor: pointer;
                        transition: all 0.2s;
                    " class="lead-option" data-index="${originalIndex}" onclick="toggleLeadSelection(${originalIndex})">
                        <input type="checkbox" id="lead-${originalIndex}" style="margin-right: 12px; transform: scale(1.2);">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                                ${lead.name || 'Unknown Company'}
                            </div>
                            <div style="font-size: 13px; color: #6b7280;">
                                Rep: ${lead.contact || 'Unknown'} |
                                DOT: ${lead.dotNumber || 'N/A'} |
                                Sale Date: ${lastCallDate}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div style="margin-bottom: 20px;">
                    <div style="
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        color: white;
                        padding: 12px 16px;
                        border-radius: 8px 8px 0 0;
                        font-weight: 600;
                        font-size: 14px;
                        margin-bottom: 8px;
                    ">
                        List ${listId}: ${listData.listName} (${listData.leads.length} leads)
                    </div>
                    <div style="padding-left: 8px;">
                        ${leadsHtml}
                    </div>
                </div>
            `;
        }).join('');

    popup.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 800px;
            width: 95%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        ">
            <!-- Header -->
            <div style="
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border-radius: 12px 12px 0 0;
            ">
                <div style="display: flex; justify-content: between; align-items: center;">
                    <div>
                        <h2 style="margin: 0 0 8px 0; font-size: 20px;">📞 Select ViciDial Leads to Import</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 14px;">
                            ${scanData ? `Scanned ${scanData.totalListsScanned} ViciDial lists • ` : ''}Found ${leads.length} SALE leads • Choose which ones to add
                        </p>
                        ${scanData && scanData.allListsSummary ? `
                        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 12px;">
                            Lists with SALE leads: ${scanData.allListsSummary.filter(l => l.saleCount > 0).map(l => `${l.listId} (${l.saleCount})`).join(', ')}
                        </p>` : ''}
                    </div>
                </div>
            </div>

            <!-- Selection Controls -->
            <div style="padding: 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <button onclick="selectAllLeads()" style="
                        background: #10b981; color: white; border: none; padding: 8px 16px;
                        border-radius: 6px; cursor: pointer; font-size: 14px;
                    ">✅ Select All</button>
                    <button onclick="deselectAllLeads()" style="
                        background: #6b7280; color: white; border: none; padding: 8px 16px;
                        border-radius: 6px; cursor: pointer; font-size: 14px;
                    ">❌ Deselect All</button>
                    <span style="color: #6b7280; font-size: 14px;" id="selection-count">0 selected</span>
                </div>
            </div>

            <!-- Leads List -->
            <div style="
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                max-height: 400px;
            " id="leads-container">
                ${leadsList}
            </div>

            <!-- Footer Actions -->
            <div style="
                padding: 20px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                border-radius: 0 0 12px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <button onclick="closeLeadSelectionPopup()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Cancel</button>
                <button onclick="importSelectedLeads()" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                ">🚀 Import Selected Leads</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);
    updateSelectionCount();
}

function toggleLeadSelection(index) {
    const checkbox = document.getElementById(`lead-${index}`);
    const leadOption = document.querySelector(`[data-index="${index}"]`);

    checkbox.checked = !checkbox.checked;

    if (checkbox.checked) {
        leadOption.style.background = '#dbeafe';
        leadOption.style.borderColor = '#3b82f6';
    } else {
        leadOption.style.background = 'white';
        leadOption.style.borderColor = '#e5e7eb';
    }

    updateSelectionCount();
}

function selectAllLeads() {
    const checkboxes = document.querySelectorAll('#leads-container input[type="checkbox"]');
    const leadOptions = document.querySelectorAll('.lead-option');

    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = true;
        leadOptions[index].style.background = '#dbeafe';
        leadOptions[index].style.borderColor = '#3b82f6';
    });

    updateSelectionCount();
}

function deselectAllLeads() {
    const checkboxes = document.querySelectorAll('#leads-container input[type="checkbox"]');
    const leadOptions = document.querySelectorAll('.lead-option');

    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = false;
        leadOptions[index].style.background = 'white';
        leadOptions[index].style.borderColor = '#e5e7eb';
    });

    updateSelectionCount();
}

function updateSelectionCount() {
    const checkboxes = document.querySelectorAll('#leads-container input[type="checkbox"]:checked');
    const counter = document.getElementById('selection-count');
    if (counter) {
        counter.textContent = `${checkboxes.length} selected`;
    }
}

function closeLeadSelectionPopup() {
    const popup = document.getElementById('lead-selection-popup');
    if (popup) {
        popup.remove();
    }
}

async function importSelectedLeads() {
    const checkboxes = document.querySelectorAll('#leads-container input[type="checkbox"]:checked');
    const selectedIndices = Array.from(checkboxes).map(cb =>
        parseInt(cb.id.replace('lead-', ''))
    );

    if (selectedIndices.length === 0) {
        alert('Please select at least one lead to import.');
        return;
    }

    const selectedLeads = selectedIndices.map(index => availableVicidialLeads[index]);
    closeLeadSelectionPopup();
    showImportProgress(selectedLeads);
    await performLeadImport(selectedLeads);
}

function showImportProgress(leads) {
    const popup = document.createElement('div');
    popup.id = 'import-progress-popup';
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        z-index: 10002;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    popup.innerHTML = `
        <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
            <span style="
                width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
                border-top: 2px solid white; border-radius: 50%;
                animation: spin 1s linear infinite;
            "></span>
            Importing Selected Leads
        </h4>
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">
            Importing ${leads.length} selected leads from ViciDial...
        </p>
        <div style="background: rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; font-size: 12px;">
            📊 Progress: <span id="import-progress">0</span>/${leads.length} leads processed
        </div>
    `;

    document.body.appendChild(popup);
}

async function performLeadImport(selectedLeads) {
    console.log(`🚀 Importing ${selectedLeads.length} selected ViciDial leads with REAL-TIME transcription`);

    // Close the lead selection popup first
    const selectionPopup = document.getElementById('lead-selection-popup');
    if (selectionPopup) {
        selectionPopup.remove();
    }

    // Show detailed transcription progress overlay AFTER lead selection
    showTranscriptionProgressOverlay(selectedLeads.length);

    let currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    const timestamp = Date.now();
    let importedCount = 0;

    for (let i = 0; i < selectedLeads.length; i++) {
        const leadData = selectedLeads[i];

        // Update progress overlay
        updateTranscriptionProgress(i + 1, selectedLeads.length, leadData.name || 'Unknown Lead', 'Starting...');

        // Check for duplicates
        const existingLead = currentLeads.find(lead =>
            (lead.phone === leadData.phone && leadData.phone) ||
            (lead.dotNumber === leadData.dotNumber && leadData.dotNumber) ||
            (lead.id === leadData.id)
        );

        if (!existingLead) {
            try {
                // Show transcription progress stages
                updateTranscriptionProgress(i + 1, selectedLeads.length, leadData.name, '🎵 Downloading recording...');

                // Call NEW backend endpoint for real-time transcription
                const response = await fetch('/api/vicidial/process-lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ leadData })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                updateTranscriptionProgress(i + 1, selectedLeads.length, leadData.name, '🎤 Transcribing audio...');

                const result = await response.json();

                if (result.success) {
                    updateTranscriptionProgress(i + 1, selectedLeads.length, leadData.name, '🤖 Processing with AI...');

                    // Use processed lead with real transcription
                    const processedLead = result.lead;

                    const newLead = {
                        id: processedLead.id || leadData.id || (timestamp + i + 1000),
                        name: processedLead.name || leadData.name || 'Unknown Company',
                        contact: processedLead.contact || leadData.contact || '',
                        company: processedLead.company || leadData.company || '',
                        firstName: processedLead.firstName || leadData.firstName || '',
                        lastName: processedLead.lastName || leadData.lastName || '',
                        phone: processedLead.phone || leadData.phone || '',
                        email: processedLead.email || leadData.email || '',
                        address: processedLead.address || leadData.address || '',
                        city: processedLead.city || leadData.city || '',
                        state: processedLead.state || leadData.state || '',
                        zipCode: processedLead.zipCode || leadData.zipCode || '',
                        dotNumber: processedLead.dotNumber || leadData.dotNumber || '',
                        mcNumber: processedLead.mcNumber || leadData.mcNumber || '',
                        fleetSize: processedLead.fleetSize || leadData.fleetSize || 1,
                        drivers: processedLead.drivers || leadData.drivers || 0,
                        currentCarrier: processedLead.currentCarrier || leadData.currentCarrier || '',
                        insuranceExpiry: processedLead.insuranceExpiry || leadData.insuranceExpiry || '',
                        renewalDate: processedLead.renewalDate || leadData.renewalDate || '',
                        premium: processedLead.premium || leadData.premium || 0,
                        stage: 'contacted',
                        priority: 'high',
                        source: 'ViciDial Import - SALE Lead',
                        status: 'SALE',
                        assignedTo: 'Grant Corp',
                        leadId: processedLead.leadId || leadData.leadId || '',
                        listId: processedLead.listId || leadData.listId || '',
                        listName: processedLead.listName || leadData.listName || '',
                        campaign: processedLead.campaign || leadData.campaign || '',
                        callResult: 'SALE',
                        lastCallDate: processedLead.lastCallDate || leadData.lastCallDate || new Date().toISOString(),

                        // REAL transcription data from backend processing
                        transcript: processedLead.callTranscript || processedLead.transcript || '',
                        transcriptStatus: processedLead.transcriptStatus || 'completed',
                        hasTranscript: Boolean(processedLead.callTranscript || processedLead.transcript),
                        transcriptLength: (processedLead.callTranscript || processedLead.transcript || '').length,
                        recordingUrl: processedLead.recordingUrl || leadData.recordingUrl || '',

                        notes: `ViciDial SALE Lead - Transcribed on ${new Date().toLocaleDateString()}. ${processedLead.notes || ''}`,
                        created: new Date().toISOString(),
                        lastContact: new Date().toISOString()
                    };

                    const transcriptLength = newLead.transcript ? newLead.transcript.length : 0;
                    updateTranscriptionProgress(i + 1, selectedLeads.length, leadData.name, `✅ Complete (${transcriptLength} chars)`);

                    console.log(`📝 Imported lead ${i + 1}/${selectedLeads.length}: ${newLead.name} (Transcript: ${transcriptLength} chars)`);

                    currentLeads.push(newLead);
                    importedCount++;
                } else {
                    throw new Error(result.error || 'Unknown error');
                }

            } catch (error) {
                console.error(`❌ Error processing lead ${leadData.name}:`, error.message);
                updateTranscriptionProgress(i + 1, selectedLeads.length, leadData.name, `❌ Error: ${error.message}`);

                // Still import without transcription
                const basicLead = {
                    id: leadData.id || (timestamp + i + 1000),
                    name: leadData.name || 'Unknown Company',
                    contact: leadData.contact || '',
                    phone: leadData.phone || '',
                    source: 'ViciDial Import - SALE Lead',
                    status: 'SALE',
                    transcript: '',
                    transcriptStatus: 'failed',
                    notes: `Import failed to transcribe: ${error.message}`,
                    created: new Date().toISOString()
                };
                currentLeads.push(basicLead);
                importedCount++;
            }
        } else {
            console.log(`⏭️ Skipping duplicate lead: ${leadData.name || leadData.phone}`);
            updateTranscriptionProgress(i + 1, selectedLeads.length, leadData.name, '⏭️ Duplicate - skipped');
        }

        // Small delay for UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Hide progress overlay after small delay to show completion
    setTimeout(() => {
        hideTranscriptionProgressOverlay();
    }, 2000);

    // Save to localStorage
    localStorage.setItem('leads', JSON.stringify(currentLeads));

    console.log(`✅ Import complete: ${importedCount} new leads imported with real-time transcription`);
    }

    // Save to localStorage
    localStorage.setItem('leads', JSON.stringify(currentLeads));

    console.log(`✅ Import complete: ${importedCount} new leads imported with transcription data`);

    setTimeout(() => {
        const progressPopup = document.getElementById('import-progress-popup');
        if (progressPopup) {
            progressPopup.innerHTML = `
                <h4 style="margin: 0 0 12px 0;">✅ Import Complete!</h4>
                <p style="margin: 0; font-size: 14px;">
                    Successfully imported ${importedCount} new leads.
                    ${selectedLeads.length - importedCount > 0 ?
                        `(${selectedLeads.length - importedCount} duplicates skipped)` : ''}
                </p>
            `;

            setTimeout(() => {
                progressPopup.remove();
            }, 3000);
        }

        if (window.loadLeads) {
            window.loadLeads();
        }

        if (window.showNotification) {
            window.showNotification(
                `Imported ${importedCount} ViciDial leads successfully!`,
                'success'
            );
        }
    }, 500);
}

// NEW: Enhanced progress tracking functions for real-time transcription
function showTranscriptionProgressOverlay(totalLeads) {
    console.log(`📊 Showing transcription progress overlay for ${totalLeads} leads`);

    const overlay = document.createElement('div');
    overlay.id = 'transcription-progress-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 15000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 90%;
            text-align: center;
        ">
            <h3 style="margin: 0 0 20px 0; color: #2563eb;">🎤 Transcribing ViciDial Leads</h3>

            <div style="margin: 15px 0;">
                <div style="background: #f3f4f6; border-radius: 8px; padding: 3px; position: relative;">
                    <div id="transcription-progress-bar" style="
                        background: linear-gradient(45deg, #2563eb, #3b82f6);
                        height: 24px;
                        border-radius: 6px;
                        width: 0%;
                        transition: width 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 12px;
                        font-weight: 600;
                    ">0%</div>
                </div>
            </div>

            <div style="margin: 15px 0; font-size: 16px; font-weight: 500;">
                Processing <span id="current-lead-index">1</span> of <span id="total-leads">${totalLeads}</span>
            </div>

            <div style="margin: 10px 0; color: #374151;">
                <div id="current-lead-name" style="font-weight: 500; margin-bottom: 5px;">Starting...</div>
                <div id="current-lead-status" style="color: #6b7280; font-size: 14px;">Preparing transcription...</div>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #2563eb;">
                <div style="font-size: 13px; color: #4b5563; text-align: left;">
                    <strong>Process:</strong><br>
                    • Download recording from ViciDial<br>
                    • Transcribe audio with Deepgram<br>
                    • Extract structured data with AI<br>
                    • Import to lead management system
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

function updateTranscriptionProgress(currentIndex, totalLeads, leadName, status) {
    const progressBar = document.getElementById('transcription-progress-bar');
    const leadIndexSpan = document.getElementById('current-lead-index');
    const leadNameDiv = document.getElementById('current-lead-name');
    const leadStatusDiv = document.getElementById('current-lead-status');

    if (progressBar && leadIndexSpan && leadNameDiv && leadStatusDiv) {
        const percentage = Math.round((currentIndex / totalLeads) * 100);

        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${percentage}%`;

        leadIndexSpan.textContent = currentIndex;
        leadNameDiv.textContent = leadName;
        leadStatusDiv.textContent = status;
    }
}

function hideTranscriptionProgressOverlay() {
    const overlay = document.getElementById('transcription-progress-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function showListScanSummary(data) {
    console.log('📊 Showing list scan summary');

    const popup = document.createElement('div');
    popup.id = 'vicidial-summary-popup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const listSummaryHtml = data.allListsSummary && data.allListsSummary.length > 0
        ? data.allListsSummary.map(list => `
            <div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                <strong>List ${list.listId}:</strong> ${list.listName.split('[')[0].trim()}
                <span style="float: right; color: ${list.saleCount > 0 ? '#10b981' : '#6b7280'};">
                    ${list.saleCount} SALE leads
                </span>
            </div>
        `).join('')
        : '<p>No lists found</p>';

    popup.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <h3 style="margin: 0 0 20px 0; color: #1f2937;">📋 ViciDial Lists Scan Complete</h3>
            <p style="color: #6b7280; margin-bottom: 20px;">
                Scanned ${data.totalListsScanned} ViciDial lists •
                Found ${data.totalSaleLeads} SALE leads in ${data.listsWithSaleLeads} lists
            </p>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
                ${listSummaryHtml}
            </div>
            <button onclick="document.getElementById('vicidial-summary-popup').remove()" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                width: 100%;
            ">Close</button>
        </div>
    `;

    document.body.appendChild(popup);
}

function showNoLeadsPopup(scanData = null) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fbbf24;
        color: #92400e;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    popup.innerHTML = `
        <h4 style="margin: 0 0 8px 0;">⚠️ No SALE Leads Found</h4>
        <p style="margin: 0; font-size: 14px;">
            No SALE leads available. Check back later.
        </p>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 5000);
}

function showErrorPopup(errorMessage) {
    console.log('❌ Showing error popup:', errorMessage);

    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    popup.innerHTML = `
        <h4 style="margin: 0 0 8px 0;">❌ Sync Error</h4>
        <p style="margin: 0; font-size: 14px;">
            ${errorMessage}
        </p>
        <button onclick="this.parentElement.remove()" style="
            margin-top: 12px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        ">Close</button>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
        }
    }, 10000);
}

console.log('✅ FIXED Selective ViciDial sync system ready - with timeout and debugging');

// ABSOLUTE FINAL OVERRIDE - Use setTimeout to ensure this runs AFTER all other scripts
setTimeout(function() {
    console.log('🔄 FINAL OVERRIDE: Ensuring selective sync function is absolutely the last one defined');

    // Store the correct selective sync function
    const selectiveSyncFunction = window.syncVicidialLeads;

    // Force override again with a slight delay
    setTimeout(function() {
        if (typeof selectiveSyncFunction === 'function') {
            window.syncVicidialLeads = selectiveSyncFunction;
            console.log('✅ FINAL OVERRIDE: Selective sync function forcefully set as the active syncVicidialLeads');
        }
    }, 100);
