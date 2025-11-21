/**
 * Selective ViciDial Sync - Choose which leads to import
 * Replaces the automatic sync with a selection popup
 */

console.log('📋 Selective ViciDial Sync system loaded');

// Global variable to track available leads
let availableVicidialLeads = [];

// Override the sync function with selective sync
window.syncVicidialLeads = async function() {
    console.log('🔄 Opening selective ViciDial sync...');

    // First, fetch available leads from ViciDial
    showLoadingPopup();

    try {
        // Fetch available leads from backend
        const response = await fetch('/api/vicidial/data');
        const data = await response.json();

        if (data.saleLeads && data.saleLeads.length > 0) {
            availableVicidialLeads = data.saleLeads;
            hideLoadingPopup();
            showLeadSelectionPopup(data.saleLeads);
        } else {
            hideLoadingPopup();
            showNoLeadsPopup();
        }

    } catch (error) {
        console.error('Error fetching ViciDial leads:', error);
        hideLoadingPopup();

        let errorMessage = 'Connection failed';
        if (error.message.includes('fetch')) {
            errorMessage = 'Unable to connect to ViciDial server';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Invalid response from server';
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
    `;

    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(popup);
}

function hideLoadingPopup() {
    const popup = document.getElementById('vicidial-loading-popup');
    if (popup) {
        popup.remove();
    }
}

function showLeadSelectionPopup(leads) {
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

    const leadsList = leads.map((lead, index) => `
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
        " class="lead-option" data-index="${index}" onclick="toggleLeadSelection(${index})">
            <input type="checkbox" id="lead-${index}" style="margin-right: 12px; transform: scale(1.2);">
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                    ${lead.name || 'Unknown Company'}
                </div>
                <div style="font-size: 14px; color: #6b7280;">
                    📞 ${lead.phone || 'No phone'} •
                    📧 ${lead.email || 'No email'} •
                    📍 ${lead.state || 'Unknown state'}
                </div>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                    Contact: ${lead.contact || 'Unknown'} •
                    DOT: ${lead.dotNumber || 'N/A'} •
                    MC: ${lead.mcNumber || 'N/A'}
                </div>
            </div>
        </div>
    `).join('');

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

    // Close the selection popup
    closeLeadSelectionPopup();

    // Show import progress
    showImportProgress(selectedLeads);

    // Import the selected leads
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
    console.log(`🚀 Importing ${selectedLeads.length} selected ViciDial leads`);

    // Get current leads
    let currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('Current leads before import:', currentLeads.length);

    // Import each selected lead
    const timestamp = Date.now();
    let importedCount = 0;

    for (let i = 0; i < selectedLeads.length; i++) {
        const leadData = selectedLeads[i];

        // Check if lead already exists (by phone or DOT number)
        const existingLead = currentLeads.find(lead =>
            (lead.phone === leadData.phone && leadData.phone) ||
            (lead.dotNumber === leadData.dotNumber && leadData.dotNumber)
        );

        if (!existingLead) {
            const newLead = {
                id: timestamp + i + 1000,
                name: leadData.name || 'Unknown Company',
                contact: leadData.contact || 'Unknown Contact',
                phone: leadData.phone || '',
                email: leadData.email || '',
                state: leadData.state || '',
                dotNumber: leadData.dotNumber || '',
                mcNumber: leadData.mcNumber || '',
                stage: 'new',
                priority: 'medium',
                source: 'ViciDial Import - SALE Lead',
                notes: `Imported from ViciDial on ${new Date().toLocaleDateString()}`,
                created: new Date().toISOString(),
                lastContact: null,
                status: 'active'
            };

            currentLeads.push(newLead);
            importedCount++;
        }

        // Update progress
        const progressSpan = document.getElementById('import-progress');
        if (progressSpan) {
            progressSpan.textContent = i + 1;
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Save updated leads
    localStorage.setItem('leads', JSON.stringify(currentLeads));

    // Show completion
    setTimeout(() => {
        const progressPopup = document.getElementById('import-progress-popup');
        if (progressPopup) {
            progressPopup.innerHTML = `
                <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                    ✅ Import Complete!
                </h4>
                <p style="margin: 0; font-size: 14px;">
                    Successfully imported ${importedCount} new leads from ViciDial.
                    ${selectedLeads.length - importedCount > 0 ?
                        `(${selectedLeads.length - importedCount} duplicates skipped)` : ''}
                </p>
            `;

            // Auto-close after 3 seconds
            setTimeout(() => {
                progressPopup.remove();
            }, 3000);
        }

        // Refresh the leads display
        if (window.loadLeads) {
            window.loadLeads();
        }

        // Show notification
        if (window.showNotification) {
            window.showNotification(
                `Imported ${importedCount} ViciDial leads successfully!`,
                'success'
            );
        }

    }, 500);
}

function showNoLeadsPopup() {
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
            No SALE leads found in ViciDial at this time. Check back later or contact support.
        </p>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 5000);
}

function showErrorPopup(errorMessage) {
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
        <h4 style="margin: 0 0 8px 0;">❌ Connection Error</h4>
        <p style="margin: 0; font-size: 14px;">
            Failed to connect to ViciDial: ${errorMessage}
        </p>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 5000);
}

console.log('✅ Selective ViciDial sync system ready - click Sync button to choose leads');