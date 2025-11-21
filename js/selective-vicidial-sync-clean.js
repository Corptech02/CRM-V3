/**
 * FIXED: Selective ViciDial Sync - Shows individual leads with checkboxes
 * This shows the proper lead selection popup with individual leads
 */

console.log('🔧 FIXED Selective ViciDial Sync system loaded - Individual leads with checkboxes');

// Global variable to track available leads
let availableVicidialLeads = [];

// Override the sync function with selective sync
console.log('🔧 Defining window.syncVicidialLeads function...');
window.syncVicidialLeads = async function() {
    console.log('🔄 Opening selective ViciDial sync...');

    // First, fetch available leads from ViciDial
    showLoadingPopup();

    try {
        // Fetch available leads from backend - try multiple URL strategies
        let API_URLS = [];

        if (window.location.hostname === 'localhost') {
            API_URLS = ['http://localhost:3001', '/'];
        } else {
            // For production, try: 1) Port-specific, 2) Relative URL (through nginx proxy)
            API_URLS = [
                `http://${window.location.hostname}:3001`,
                '/' // Relative URL (goes through nginx proxy)
            ];
        }

        console.log('🌐 Available API URLs to try:', API_URLS);

        // Try each API URL until one works
        let response;
        let lastError;

        for (let i = 0; i < API_URLS.length; i++) {
            const baseUrl = API_URLS[i];
            const fullUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}api/vicidial/data?countsOnly=true`;

            console.log(`🔄 Attempting API call ${i + 1}/${API_URLS.length}:`, fullUrl);

            try {
                response = await fetch(fullUrl);

                if (response.ok) {
                    console.log('✅ Successfully connected to:', fullUrl);
                    break; // Success, exit loop
                } else {
                    console.warn(`❌ HTTP ${response.status} from:`, fullUrl);
                    lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (fetchError) {
                console.warn(`❌ Fetch failed for:`, fullUrl, fetchError.message);
                lastError = fetchError;
            }

            // If this was the last URL, throw the error
            if (i === API_URLS.length - 1) {
                throw new Error(`Unable to connect to any API endpoint. Last error: ${lastError.message}`);
            }
        }

        // Response should be OK at this point since we checked in the loop

        // Get the response text first to see what we actually received
        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Raw response (first 200 chars):', responseText.substring(0, 200));

        // Check if response looks like HTML (error page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error('Server returned HTML error page instead of JSON');
            console.error('Full HTML response:', responseText);
            throw new Error('Server returned HTML error page instead of JSON data. Please try again in a moment.');
        }

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse failed:', parseError);
            console.error('Response was not valid JSON:', responseText.substring(0, 300));
            throw new Error('Server returned invalid data format. Please refresh the page and try again.');
        }

        console.log('📋 Got ViciDial data:', data);

        if (data.saleLeads && data.saleLeads.length > 0) {
            availableVicidialLeads = data.saleLeads;
            hideLoadingPopup();
            showLeadSelectionPopup(data.saleLeads, data);
        } else {
            hideLoadingPopup();
            showNoLeadsPopup();
        }

    } catch (error) {
        console.error('Error fetching ViciDial leads:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        hideLoadingPopup();

        let errorMessage = 'Connection failed';
        if (error.message.includes('fetch')) {
            errorMessage = 'Unable to connect to ViciDial server';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Invalid response from server (expected JSON, got HTML)';
        } else {
            errorMessage = error.message;
        }

        showErrorPopup(errorMessage);
    }
};

function showLoadingPopup() {
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
            <p style="margin: 0; color: #6b7280;">Fetching available SALE leads from 204.13.233.29...</p>
        </div>

        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    document.body.appendChild(popup);
}

function hideLoadingPopup() {
    const popup = document.getElementById('vicidial-loading-popup');
    if (popup) {
        popup.remove();
    }
}

function showLeadSelectionPopup(leads, data) {
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

    // Use allListsSummary to show ALL lists including empty ones
    const allListsSummary = data.allListsSummary || [];
    const leadsByListId = {};

    // Group actual leads by list ID
    leads.forEach((lead, index) => {
        if (!leadsByListId[lead.listId]) {
            leadsByListId[lead.listId] = [];
        }
        leadsByListId[lead.listId].push({ ...lead, originalIndex: index });
    });

    // Generate HTML for ALL lists (including empty ones)
    const leadsList = allListsSummary.map(listSummary => {
        const listId = listSummary.listId;
        const listLeads = leadsByListId[listId] || [];

        // Color coding: Green for active (Y), Orange/Red for inactive
        const isActive = listSummary.active === true;
        const headerColor = isActive
            ? 'linear-gradient(135deg, #10b981, #059669)' // Green for active
            : 'linear-gradient(135deg, #ea580c, #f97316)'; // Orange for inactive
        const shadowColor = isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 88, 12, 0.3)';
        const statusIcon = isActive ? '🟢' : '🔴';

        const listHeader = `
            <div style="
                background: ${headerColor};
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                margin: 16px 0 12px 0;
                font-weight: 700;
                font-size: 16px;
                box-shadow: 0 2px 8px ${shadowColor};
            ">
                ${statusIcon} ${listSummary.listName} (${listSummary.saleCount} SALE leads)
            </div>
        `;

        const leadsHtml = listLeads.map(lead => `
            <div style="
                display: flex;
                align-items: center;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                margin-left: 16px;
            " class="lead-option" data-index="${lead.originalIndex}" onclick="toggleLeadSelection(${lead.originalIndex})">
                <input type="checkbox" id="lead-${lead.originalIndex}" style="margin-right: 12px; transform: scale(1.2);">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                        ${lead.name && !lead.name.startsWith('Lead ') ? lead.name : (lead.contact || 'Unknown Company')}
                    </div>
                    <div style="font-size: 14px; color: #6b7280;">
                        📞 ${lead.phone || 'No phone'} •
                        📧 ${lead.email || 'No email'} •
                        📍 ${lead.state || 'Unknown state'}
                    </div>
                    <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                        DOT: ${lead.dotNumber || 'N/A'} •
                        MC: ${lead.mcNumber || 'N/A'}
                    </div>
                </div>
            </div>
        `).join('');

        // Add a message for empty lists
        const emptyMessage = listLeads.length === 0 ? `
            <div style="
                padding: 16px;
                text-align: center;
                color: #6b7280;
                font-style: italic;
                background: #f9fafb;
                border-radius: 8px;
                margin-bottom: 8px;
            ">
                No SALE leads in this list
            </div>
        ` : '';

        return listHeader + emptyMessage + leadsHtml;
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
                background: linear-gradient(135deg, #f97316, #ea580c);
                color: white;
                border-radius: 12px 12px 0 0;
            ">
                <div style="display: flex; justify-content: between; align-items: center;">
                    <div>
                        <h2 style="margin: 0 0 8px 0; font-size: 20px;">📞 Select ViciDial Leads to Import</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 14px;">
                            Found ${leads.length} SALE leads from 204.13.233.29 • Choose which ones to add
                        </p>
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

    // Add click outside to close
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closeLeadSelectionPopup();
        }
    });

    updateSelectionCount();
}

function toggleLeadSelection(index) {
    console.log(`🔄 toggleLeadSelection called for index: ${index}`);

    const checkbox = document.getElementById(`lead-${index}`);
    const leadOption = document.querySelector(`[data-index="${index}"]`);

    if (!checkbox) {
        console.error(`❌ Checkbox not found for index: ${index}`);
        return;
    }

    const wasPreviouslyChecked = checkbox.checked;
    checkbox.checked = !checkbox.checked;

    console.log(`  - Checkbox ${checkbox.id}: ${wasPreviouslyChecked} → ${checkbox.checked}`);

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
    console.warn('🚨 selectAllLeads() called - this might be the issue!');
    console.trace('selectAllLeads call stack:');

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
    const selectedCheckboxes = document.querySelectorAll('#leads-container input[type="checkbox"]:checked');
    const allCheckboxes = document.querySelectorAll('#leads-container input[type="checkbox"]');

    console.log('🔍 Checkbox Analysis:');
    console.log('  - Total checkboxes found:', allCheckboxes.length);
    console.log('  - Selected checkboxes found:', selectedCheckboxes.length);

    // Debug each checkbox
    allCheckboxes.forEach((cb, i) => {
        console.log(`  - Checkbox ${i}: id=${cb.id}, checked=${cb.checked}`);
    });

    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one lead to import.');
        return;
    }

    const selectedLeads = Array.from(selectedCheckboxes).map(checkbox => {
        const index = checkbox.id.replace('lead-', '');
        return availableVicidialLeads[parseInt(index)];
    });

    console.log('🚀 Importing', selectedLeads.length, 'selected ViciDial leads with full transcription data...');
    console.log('📋 Selected checkboxes:', selectedCheckboxes.length, 'checkboxes');
    console.log('📋 Selected lead IDs:', selectedLeads.map(lead => lead.id));
    console.log('📋 Available leads total:', availableVicidialLeads.length);

    // Close the selection popup
    closeLeadSelectionPopup();

    // Show progress tracker in bottom-right (handled by transcription-progress.js)
    if (window.showTranscriptionProgress) {
        window.showTranscriptionProgress(selectedLeads);
    }

    try {
        // Prepare API URLs with fallback strategy (same as sync function)
        let API_URLS = [];

        if (window.location.hostname === 'localhost') {
            API_URLS = ['http://localhost:3001', '/'];
        } else {
            // For production, try: 1) Port-specific, 2) Relative URL (through nginx proxy)
            API_URLS = [
                `http://${window.location.hostname}:3001`,
                '/' // Relative URL (goes through nginx proxy)
            ];
        }

        if (window.updateTranscriptionProgress) {
            window.updateTranscriptionProgress(10, 'Connecting to ViciDial...');
        }

        console.log('🔄 Available sync endpoints to try:', API_URLS);

        // Try each API URL until one works
        let response;
        let lastError;

        for (let i = 0; i < API_URLS.length; i++) {
            const baseUrl = API_URLS[i];
            const fullUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}api/vicidial/sync-sales`;

            console.log(`🔄 Attempting sync import ${i + 1}/${API_URLS.length}:`, fullUrl);

            try {
                const requestBody = {
                    selectedLeads: selectedLeads,
                    selective: true
                };

                console.log('📤 Sending to API:', {
                    url: fullUrl,
                    selectedLeads: requestBody.selectedLeads.length,
                    leadIds: requestBody.selectedLeads.map(l => l.id),
                    leadNames: requestBody.selectedLeads.map(l => l.name)
                });

                // Double check - this should only be the leads you selected!
                if (requestBody.selectedLeads.length > 1) {
                    console.warn('🚨 WARNING: More than 1 lead being sent when you only selected 1!');
                    console.warn('🚨 Lead names being sent:', requestBody.selectedLeads.map(l => l.name));
                }

                response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                if (response.ok) {
                    console.log('✅ Successfully connected to sync endpoint:', fullUrl);
                    break; // Success, exit loop
                } else {
                    console.warn(`❌ HTTP ${response.status} from sync endpoint:`, fullUrl);
                    lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (fetchError) {
                console.warn(`❌ Sync fetch failed for:`, fullUrl, fetchError.message);
                lastError = fetchError;
            }

            // If this was the last URL, throw the error
            if (i === API_URLS.length - 1) {
                throw new Error(`Unable to connect to sync endpoint. Last error: ${lastError.message}`);
            }
        }

        // Response should be OK at this point since we checked in the loop

        const result = await response.json();
        console.log('Selective import initiated:', result);

        // Poll the backend status to track real transcription progress
        if (window.updateTranscriptionProgress) {
            window.updateTranscriptionProgress(25, 'Processing selected leads...');
        }

        let pollCount = 0;
        const maxPolls = 600; // 20 minutes max (2 seconds * 600 = 1200 seconds) - enough for long transcriptions

        // Poll the sync status endpoint to track actual progress
        const pollInterval = setInterval(async () => {
            pollCount++;

            try {
                // Use the same fallback URL strategy for status polling
                let statusResponse;
                for (let i = 0; i < API_URLS.length; i++) {
                    const baseUrl = API_URLS[i];
                    const statusUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}api/vicidial/sync-status`;

                    try {
                        statusResponse = await fetch(statusUrl);
                        if (statusResponse.ok) {
                            break; // Success, exit loop
                        }
                    } catch (fetchError) {
                        // Try next URL
                        if (i === API_URLS.length - 1) {
                            throw new Error('Unable to connect to status endpoint');
                        }
                    }
                }
                if (statusResponse.ok) {
                    const status = await statusResponse.json();
                    console.log('📊 Sync status:', status);

                    if (status.status === 'running') {
                        // Update with real progress from backend
                        const progress = Math.min(95, Math.max(25, status.percentage || 25));
                        console.log(`📊 Progress: ${progress}% - ${status.message} (${status.processedLeads}/${status.totalLeads} leads)`);

                        if (window.updateTranscriptionProgress) {
                            window.updateTranscriptionProgress(progress, status.message || 'Processing leads...');
                        }
                    } else if (status.status === 'completed') {
                        // Import complete!
                        clearInterval(pollInterval);
                        console.log('✅ Import completed successfully!', status);
                        if (window.updateTranscriptionProgress) {
                            window.updateTranscriptionProgress(100, 'Sync complete!');
                        }

                        // Show completion and refresh
                        showCompletionAndRefresh();
                    } else if (status.status === 'error') {
                        // Import failed
                        clearInterval(pollInterval);
                        console.error('❌ Import failed:', status);
                        if (window.hideTranscriptionProgress) {
                            window.hideTranscriptionProgress();
                        }
                        alert(`❌ Import failed: ${status.message || 'Unknown error occurred'}`);
                        return;
                    } else {
                        // Unknown status, continue polling
                        console.log('⏳ Unknown status, continuing to poll:', status.status);
                    }
                } else {
                    console.warn('⚠️ Status response not OK:', statusResponse.status);
                }

                // Check if we've hit the polling limit
                if (pollCount >= maxPolls) {
                    clearInterval(pollInterval);
                    if (window.hideTranscriptionProgress) {
                        window.hideTranscriptionProgress();
                    }
                    console.error(`❌ Import timeout after ${maxPolls * 2} seconds (${maxPolls} polls)`);

                    // Check if any leads were actually imported during this time
                    try {
                        const leadsResponse = await fetch('/api/leads');
                        if (leadsResponse.ok) {
                            const leads = await leadsResponse.json();
                            console.log(`📊 Current leads in database: ${leads.length} leads`);
                        }
                    } catch (e) {
                        console.warn('Could not check lead count:', e);
                    }

                    alert('❌ Import timeout after 20 minutes. Processing may still be running in background. Please check lead management for imported leads.');
                    return;
                }

            } catch (pollError) {
                console.warn('Polling error:', pollError);

                // On error, continue polling but don't fail immediately
                if (pollCount >= maxPolls) {
                    clearInterval(pollInterval);
                    if (window.hideTranscriptionProgress) {
                        window.hideTranscriptionProgress();
                    }
                    alert('❌ Unable to track import progress after timeout. Please check if leads were imported successfully.');
                }
            }
        }, 2000); // Poll every 2 seconds

        // Show completion for 2 seconds then hide (this should be inside the completed block)
        function showCompletionAndRefresh() {
            setTimeout(() => {
                if (window.showTranscriptionComplete) {
                    window.showTranscriptionComplete(selectedLeads.length);
                }
            }, 500);

            // Force reload leads from server to get the new transcript data
            setTimeout(async () => {
                console.log('🔄 Reloading leads to get transcript data...');
                try {
                    // Use same URL strategy as the import to avoid URL manipulation issues
                    const baseUrl = window.location.hostname === 'localhost'
                        ? 'http://localhost:3001'
                        : `http://${window.location.hostname}:3001`;

                    console.log('📡 Fetching fresh leads from:', `${baseUrl}/api/leads`);

                    // Fetch fresh leads from API
                    const response = await fetch(`${baseUrl}/api/leads`);
                    if (response.ok) {
                        const freshLeads = await response.json();

                        // Update localStorage with fresh data
                        localStorage.setItem('insurance_leads', JSON.stringify(freshLeads));
                        console.log('✅ Leads reloaded with transcript data');
                    }
                } catch (error) {
                    console.warn('Failed to reload leads:', error);
                }

                // Refresh leads view if we're on that page
                if (typeof loadLeadsView === 'function') {
                    loadLeadsView();
                }
            }, 1000);
        }

    } catch (error) {
        console.error('❌ Import error:', error);
        if (window.hideTranscriptionProgress) {
            window.hideTranscriptionProgress();
        }
        alert(`❌ Error importing leads: ${error.message}`);
    }
}

// Local tracker functions (disabled - using global ones from transcription-progress.js)
// Simple Lead Sync Tracker (Top-Right Corner)
function showTranscriptionProgress_local(selectedLeads) {
    // Remove any existing progress
    hideTranscriptionProgress();

    const notification = document.createElement('div');
    notification.id = 'transcription-progress';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        z-index: 100001;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create lead list
    const leadsList = selectedLeads.map((lead, index) => `
        <div id="lead-sync-${index}" style="padding: 5px 0; font-size: 13px; opacity: 0.8;">
            <i class="fas fa-clock" style="margin-right: 5px; color: #fbbf24;"></i>
            ${lead.name || lead.company || lead.phone || `Lead ${index + 1}`}
        </div>
    `).join('');

    notification.innerHTML = `
        <h4 style="margin: 0 0 15px 0; font-size: 16px;">
            <i class="fas fa-sync fa-spin"></i> Syncing ${selectedLeads.length} leads
        </h4>
        <div id="leads-sync-list" style="max-height: 200px; overflow-y: auto;">
            ${leadsList}
        </div>
    `;

    document.body.appendChild(notification);
}

function updateTranscriptionProgress_local(percentage, message) {
    // Update header with current status
    const notification = document.getElementById('transcription-progress');
    if (notification) {
        const header = notification.querySelector('h4');
        if (header && message) {
            header.innerHTML = `
                <i class="fas fa-sync fa-spin"></i> ${message}
            `;
        }

        // Mark leads as completed based on percentage
        const leadElements = notification.querySelectorAll('[id^="lead-sync-"]');
        const completedCount = Math.floor((percentage / 100) * leadElements.length);

        leadElements.forEach((leadElement, index) => {
            if (index < completedCount) {
                // Mark as completed
                const icon = leadElement.querySelector('i');
                if (icon && icon.classList.contains('fa-clock')) {
                    icon.className = 'fas fa-check-circle';
                    icon.style.color = '#10b981';
                }
            }
        });
    }
}

function showTranscriptionComplete_local(count) {
    const notification = document.getElementById('transcription-progress');
    if (notification) {
        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        notification.innerHTML = `
            <h4 style="margin: 0 0 15px 0; font-size: 16px;">
                <i class="fas fa-check-circle"></i> Sync Complete!
            </h4>
            <p style="margin: 0; font-size: 14px; text-align: center;">
                ✅ ${count} leads synced successfully
            </p>
        `;

        // Auto hide after 3 seconds
        setTimeout(() => {
            hideTranscriptionProgress();
        }, 3000);
    }
}

function hideTranscriptionProgress_local() {
    const notification = document.getElementById('transcription-progress');
    if (notification) {
        notification.remove();
    }
}

function showNoLeadsPopup() {
    const popup = document.createElement('div');
    popup.id = 'no-leads-popup';
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
            <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">No SALE Leads Found</h3>
            <p style="margin: 0 0 20px 0; color: #6b7280;">No leads with SALE status were found in any ViciDial lists.</p>
            <button onclick="closeNoLeadsPopup()" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">OK</button>
        </div>
    `;

    document.body.appendChild(popup);
}

function closeNoLeadsPopup() {
    const popup = document.getElementById('no-leads-popup');
    if (popup) {
        popup.remove();
    }
}

function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.id = 'error-popup';
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
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Connection Error</h3>
            <p style="margin: 0 0 20px 0; color: #6b7280;">${message}</p>
            <button onclick="closeErrorPopup()" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">OK</button>
        </div>
    `;

    document.body.appendChild(popup);
}

function closeErrorPopup() {
    const popup = document.getElementById('error-popup');
    if (popup) {
        popup.remove();
    }
}

console.log('✅ selective-vicidial-sync-clean.js fully loaded - window.syncVicidialLeads should be available');