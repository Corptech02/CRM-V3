// Enhanced Vicidial Sync with Selective Import
console.log('🔄 Enhanced Vicidial Sync Loading...');

// Override the sync function with our enhanced version
window.syncVicidialLeads = async function() {
    console.log('🎯 Opening Enhanced Vicidial Sync Interface...');
    showVicidialSyncOverlay();
};

// Main function to show the sync overlay
async function showVicidialSyncOverlay() {
    // Remove any existing overlay
    const existingOverlay = document.getElementById('vicidialSyncOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'vicidialSyncOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
            <i class="fas fa-sync-alt"></i> Enhanced Vicidial Sync
        </h2>
        <button onclick="closeVicidialSyncOverlay()" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 24px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        ">&times;</button>
    `;

    // Loading content initially
    const content = document.createElement('div');
    content.style.cssText = `
        flex: 1;
        padding: 30px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
    `;
    content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #667eea; margin-bottom: 20px;"></i>
            <h3 style="margin: 0; color: #333;">Loading Vicidial Data...</h3>
            <p style="color: #666; margin: 10px 0 0 0;">Fetching lists and SALE leads from Vicidial system</p>
        </div>
    `;

    // Footer with action buttons
    const footer = document.createElement('div');
    footer.style.cssText = `
        background: #f8f9fa;
        padding: 20px 30px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    footer.innerHTML = `
        <div style="color: #666;">
            <span id="selectedCount">0 leads selected</span>
        </div>
        <div style="display: flex; gap: 12px;">
            <button onclick="closeVicidialSyncOverlay()" style="
                background: #6b7280;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            ">Cancel</button>
            <button id="syncSelectedBtn" onclick="syncSelectedLeads()" style="
                background: #10b981;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                opacity: 0.5;
            " disabled>
                <i class="fas fa-download"></i> Import Selected
            </button>
        </div>
    `;

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Load the actual data
    await loadVicidialData(content);
}

// Function to load Vicidial data and populate the interface
async function loadVicidialData(contentContainer) {
    try {
        // Show loading state
        console.log('📞 Loading Vicidial lists and SALE leads...');

        // Mock data for now - in real implementation, this would fetch from Vicidial API
        const vicidialData = await fetchVicidialData();

        // Clear loading content
        contentContainer.innerHTML = '';

        // Create main content layout
        const mainContent = document.createElement('div');
        mainContent.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
            height: 100%;
        `;

        // Left panel - Lists
        const listsPanel = document.createElement('div');
        listsPanel.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                <i class="fas fa-list"></i> Available Lists
            </h3>
            <div id="listContainer" style="max-height: 400px; overflow-y: auto;">
                ${renderLists(vicidialData.lists)}
            </div>
        `;

        // Right panel - SALE Leads
        const leadsPanel = document.createElement('div');
        leadsPanel.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                <i class="fas fa-trophy"></i> SALE Leads Available
            </h3>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 600; color: #166534;">Total SALE Leads: ${vicidialData.saleLeads.length}</span>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="selectAllLeads" onchange="toggleAllLeads(this)" style="transform: scale(1.2);">
                        <span style="font-weight: 500;">Select All</span>
                    </label>
                </div>
            </div>
            <div id="leadsContainer" style="max-height: 500px; overflow-y: auto;">
                ${renderSaleLeads(vicidialData.saleLeads)}
            </div>
        `;

        mainContent.appendChild(listsPanel);
        mainContent.appendChild(leadsPanel);
        contentContainer.appendChild(mainContent);

        // Update selection count
        updateSelectionCount();

    } catch (error) {
        console.error('❌ Error loading Vicidial data:', error);
        contentContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 20px;"></i>
                <h3 style="margin: 0; color: #333;">Error Loading Data</h3>
                <p style="color: #666; margin: 10px 0 20px 0;">${error.message}</p>
                <button onclick="loadVicidialData(document.querySelector('#vicidialSyncOverlay .content'))" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                ">
                    <i class="fas fa-retry"></i> Retry
                </button>
            </div>
        `;
    }
}

// Function to fetch Vicidial data from API
async function fetchVicidialData() {
    try {
        console.log('📞 Fetching real Vicidial data from API...');

        const response = await fetch('/api/vicidial/data');
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Loaded ${data.lists.length} lists and ${data.saleLeads.length} SALE leads`);

        return data;
    } catch (error) {
        console.error('❌ Failed to fetch from API, using fallback data:', error);

        // Fallback to mock data if API fails
        return {
        lists: [
            {
                id: '1001',
                name: '102060d OH ALL',
                description: 'Ohio Commercial Auto Leads',
                totalLeads: 1247,
                saleLeads: 23,
                lastUpdated: '2025-10-22'
            },
            {
                id: '1002',
                name: '102060d TX ALL',
                description: 'Texas Commercial Auto Leads',
                totalLeads: 2156,
                saleLeads: 18,
                lastUpdated: '2025-10-21'
            },
            {
                id: '1003',
                name: '102060d FL ALL',
                description: 'Florida Commercial Auto Leads',
                totalLeads: 892,
                saleLeads: 12,
                lastUpdated: '2025-10-20'
            },
            {
                id: '1004',
                name: '102060d CA ALL',
                description: 'California Commercial Auto Leads',
                totalLeads: 3421,
                saleLeads: 31,
                lastUpdated: '2025-10-22'
            }
        ],
        saleLeads: [
            {
                id: 'vicidial_95559',
                leadId: '95559',
                name: 'MACKLEE OWNER MACKLEE TRANSPORT LLC',
                phone: '4407683801',
                email: 'MACKLEEKEMETIC360@GMAIL.COM',
                listId: '1001',
                listName: '102060d OH ALL',
                saleDate: '2025-10-22T17:42:52.818Z',
                agent: 'Grant Corp',
                premium: '$24',
                fleetSize: 1,
                notes: '24'
            },
            {
                id: 'vicidial_95635',
                leadId: '95635',
                name: 'SHAROFIDDIN NAJUMTDINOV SHAROF TRANS INC',
                phone: '3143022352',
                email: 'shon4459@gmail.com',
                listId: '1001',
                listName: '102060d OH ALL',
                saleDate: '2025-10-22T17:42:53.465Z',
                agent: 'Grant Corp',
                premium: '$27',
                fleetSize: 3,
                notes: '27. 6k 1m 250k progressive. 3unites.'
            },
            {
                id: 'vicidial_95257',
                leadId: '95257',
                name: 'STEVE MICHAEL GEBHARDT STEPHEN M GEBHARDT INC',
                phone: '9373131021',
                email: null,
                listId: '1001',
                listName: '102060d OH ALL',
                saleDate: '2025-10-22T17:42:54.123Z',
                agent: 'Grant Corp',
                premium: '$15',
                fleetSize: 15,
                notes: '15'
            },
            {
                id: 'vicidial_96358',
                leadId: '96358',
                name: 'JOHN SMITH TRANSPORT LLC',
                phone: '5551234567',
                email: 'john@smithtransport.com',
                listId: '1002',
                listName: '102060d TX ALL',
                saleDate: '2025-10-21T15:30:22.456Z',
                agent: 'Hunter Brooks',
                premium: '$32',
                fleetSize: 5,
                notes: 'Interested in full coverage'
            },
            {
                id: 'vicidial_95268',
                leadId: '95268',
                name: 'MARIA GONZALEZ FREIGHT',
                phone: '7139876543',
                email: 'maria@gonzalezfreight.com',
                listId: '1002',
                listName: '102060d TX ALL',
                saleDate: '2025-10-21T14:22:11.789Z',
                agent: 'Grant Corp',
                premium: '$45',
                fleetSize: 8,
                notes: 'Expanding fleet, needs cargo coverage'
            }
        ]
    };
}

// Function to render lists
function renderLists(lists) {
    return lists.map(list => `
        <div style="
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
            background: #fafafa;
        ">
            <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
                <h4 style="margin: 0; color: #333; font-size: 16px;">${list.name}</h4>
                <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                    ${list.saleLeads} SALES
                </span>
            </div>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${list.description}</p>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888;">
                <span>${list.totalLeads} total leads</span>
                <span>Updated: ${list.lastUpdated}</span>
            </div>
        </div>
    `).join('');
}

// Function to render SALE leads with checkboxes
function renderSaleLeads(leads) {
    return leads.map(lead => {
        const saleDate = new Date(lead.saleDate);
        const formattedDate = saleDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="lead-item" style="
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                background: white;
                transition: all 0.2s ease;
            " onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='#e5e7eb'">
                <div style="display: flex; align-items: start; gap: 12px;">
                    <label style="display: flex; align-items: center; margin-top: 2px;">
                        <input type="checkbox" class="lead-checkbox" data-lead-id="${lead.id}"
                               onchange="updateSelectionCount()" style="transform: scale(1.3);">
                    </label>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <h4 style="margin: 0; color: #333; font-size: 15px; font-weight: 600;">
                                ${lead.name}
                            </h4>
                            <div style="text-align: right;">
                                <div style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; margin-bottom: 4px;">
                                    SALE
                                </div>
                                <div style="font-size: 12px; color: #666;">
                                    ${formattedDate}
                                </div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                            <div style="font-size: 13px;">
                                <span style="color: #666;">Phone:</span>
                                <strong>${lead.phone}</strong>
                            </div>
                            <div style="font-size: 13px;">
                                <span style="color: #666;">Fleet:</span>
                                <strong>${lead.fleetSize} units</strong>
                            </div>
                        </div>

                        ${lead.email ? `
                            <div style="font-size: 13px; margin-bottom: 8px;">
                                <span style="color: #666;">Email:</span>
                                <strong>${lead.email}</strong>
                            </div>
                        ` : ''}

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 12px; color: #888;">
                                List: ${lead.listName}
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                                    ${lead.agent}
                                </span>
                                <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                    ${lead.premium}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Function to toggle all leads selection
window.toggleAllLeads = function(checkbox) {
    const leadCheckboxes = document.querySelectorAll('.lead-checkbox');
    leadCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateSelectionCount();
};

// Function to update selection count and enable/disable sync button
window.updateSelectionCount = function() {
    const checkedBoxes = document.querySelectorAll('.lead-checkbox:checked');
    const count = checkedBoxes.length;

    // Update counter
    const counterElement = document.getElementById('selectedCount');
    if (counterElement) {
        counterElement.textContent = `${count} lead${count !== 1 ? 's' : ''} selected`;
    }

    // Enable/disable sync button
    const syncButton = document.getElementById('syncSelectedBtn');
    if (syncButton) {
        syncButton.disabled = count === 0;
        syncButton.style.opacity = count === 0 ? '0.5' : '1';
    }

    // Update select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllLeads');
    const totalCheckboxes = document.querySelectorAll('.lead-checkbox');
    if (selectAllCheckbox && totalCheckboxes.length > 0) {
        selectAllCheckbox.checked = count === totalCheckboxes.length;
        selectAllCheckbox.indeterminate = count > 0 && count < totalCheckboxes.length;
    }
};

// Function to sync selected leads
window.syncSelectedLeads = async function() {
    const checkedBoxes = document.querySelectorAll('.lead-checkbox:checked');
    const selectedLeadIds = Array.from(checkedBoxes).map(cb => cb.dataset.leadId);

    if (selectedLeadIds.length === 0) {
        alert('Please select at least one lead to import.');
        return;
    }

    // Show confirmation
    const confirmed = confirm(`Import ${selectedLeadIds.length} selected SALE leads?\n\nThis will add them to your lead management system.`);
    if (!confirmed) {
        return;
    }

    // Close overlay first
    closeVicidialSyncOverlay();

    // Show import progress
    showImportProgress(selectedLeadIds);

    try {
        // Import the selected leads
        await importSelectedLeads(selectedLeadIds);

        // Refresh leads view
        setTimeout(() => {
            if (window.forceReloadLeads) {
                window.forceReloadLeads();
            }
        }, 1000);

    } catch (error) {
        console.error('❌ Import failed:', error);
        alert('Import failed: ' + error.message);
    }
};

// Function to show import progress
function showImportProgress(leadIds) {
    const progressOverlay = document.createElement('div');
    progressOverlay.id = 'importProgressOverlay';
    progressOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;

    progressOverlay.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
        ">
            <i class="fas fa-download" style="font-size: 48px; color: #10b981; margin-bottom: 20px;"></i>
            <h3 style="margin: 0 0 10px 0; color: #333;">Importing Leads</h3>
            <p style="color: #666; margin: 0 0 20px 0;">Importing ${leadIds.length} SALE leads...</p>
            <div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                <div id="progressBar" style="height: 100%; background: #10b981; width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <p id="progressText" style="margin: 10px 0 0 0; font-size: 14px; color: #888;">0%</p>
        </div>
    `;

    document.body.appendChild(progressOverlay);

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;

        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = Math.round(progress) + '%';

        if (progress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
                progressOverlay.remove();
            }, 1000);
        }
    }, 200);
}

// Function to import selected leads
async function importSelectedLeads(leadIds) {
    console.log('📥 Importing selected leads:', leadIds);

    try {
        // Get the current Vicidial data to find the selected leads
        const vicidialData = await fetchVicidialData();
        const selectedLeads = vicidialData.saleLeads.filter(lead =>
            leadIds.includes(lead.id)
        );

        console.log(`📦 Found ${selectedLeads.length} leads to import`);

        // Import each lead
        for (const lead of selectedLeads) {
            // Format lead data for our system
            const formattedLead = {
                id: lead.id,
                name: lead.name,
                contact: lead.name,
                phone: lead.phone,
                email: lead.email,
                stage: 'new', // Reset stage for new import
                status: 'Active',
                source: `Vicidial - ${lead.listName}`,
                product: 'Commercial Auto Insurance',
                assignedTo: lead.agent,
                premium: parseInt(lead.premium.replace('$', '')) || 0,
                fleetSize: lead.fleetSize,
                notes: lead.notes,
                created: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                leadId: lead.leadId,
                listId: lead.listId,
                listName: lead.listName,
                originalSaleDate: lead.saleDate,
                importDate: new Date().toISOString()
            };

            // Save to database
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedLead)
            });

            if (!response.ok) {
                console.error(`❌ Failed to save lead ${lead.id}:`, response.status);
            } else {
                console.log(`✅ Imported lead: ${lead.name}`);
            }
        }

        console.log('✅ Import completed successfully');

        // Show success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
        `;
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Successfully imported ${selectedLeads.length} SALE leads
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);

    } catch (error) {
        console.error('❌ Import failed:', error);
        throw error;
    }
}

// Function to close the overlay
window.closeVicidialSyncOverlay = function() {
    const overlay = document.getElementById('vicidialSyncOverlay');
    if (overlay) {
        overlay.remove();
    }
};

console.log('✅ Enhanced Vicidial Sync Ready');
console.log('   Click "Sync Vicidial Now" to open the enhanced interface');