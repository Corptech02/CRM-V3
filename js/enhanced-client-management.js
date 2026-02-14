// Enhanced Client Management Features
console.log('Loading enhanced client management features...');

// Add search and filtering functionality
window.initializeClientSearch = function() {
    const clientsView = document.querySelector('.clients-view');
    if (!clientsView) return;

    // Add search bar if it doesn't exist
    const existingSearch = clientsView.querySelector('.client-search');
    if (existingSearch) return;

    const header = clientsView.querySelector('.content-header');
    if (!header) return;

    // Check if current user is admin
    const sessionData = sessionStorage.getItem('vanguard_user');
    let isAdmin = false;
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            isAdmin = ['grant', 'maureen'].includes(user.username.toLowerCase());
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Create search and filter controls
    const searchControls = document.createElement('div');
    searchControls.className = 'client-search-controls';
    searchControls.innerHTML = `
        <div class="client-search" style="display: flex; gap: 15px; margin: 20px 0; align-items: center;">
            <div class="search-input-group" style="flex: 1; max-width: 400px;">
                <input type="text" id="clientSearchInput" placeholder="Search clients by name, phone, or email..."
                       style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none;">
            </div>
            <select id="clientTypeFilter" style="padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none;">
                <option value="">All Types</option>
                <option value="Commercial">Commercial</option>
                <option value="Personal Lines">Personal Lines</option>
                <option value="Commercial Auto">Commercial Auto</option>
            </select>
            ${isAdmin ? `<select id="clientAgentFilter" style="padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none;">
                <option value="">All Agents</option>
                <option value="Grant">Grant</option>
                <option value="Carson">Carson</option>
                <option value="Hunter">Hunter</option>
            </select>` : ''}
            <button id="clearFilters" class="btn-secondary" style="padding: 12px 16px;">
                <i class="fas fa-times"></i> Clear
            </button>
        </div>
    `;

    header.appendChild(searchControls);

    // Add event listeners
    const searchInput = document.getElementById('clientSearchInput');
    const typeFilter = document.getElementById('clientTypeFilter');
    const agentFilter = document.getElementById('clientAgentFilter');
    const clearFilters = document.getElementById('clearFilters');

    const performSearch = debounce(() => {
        filterClientsTable();
    }, 300);

    searchInput.addEventListener('input', performSearch);
    typeFilter.addEventListener('change', filterClientsTable);
    if (agentFilter) {
        agentFilter.addEventListener('change', filterClientsTable);
    }
    clearFilters.addEventListener('click', () => {
        searchInput.value = '';
        typeFilter.value = '';
        if (agentFilter) {
            agentFilter.value = '';
        }
        filterClientsTable();
    });
};

// Filter clients table based on search and filter criteria
function filterClientsTable() {
    const searchInput = document.getElementById('clientSearchInput');
    const typeFilter = document.getElementById('clientTypeFilter');
    const agentFilter = document.getElementById('clientAgentFilter');

    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase();
    const selectedType = typeFilter?.value || '';
    const selectedAgent = agentFilter?.value || '';

    const rows = document.querySelectorAll('.clients-view .data-table tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        // Skip empty state row
        if (row.cells.length === 1) {
            row.style.display = 'none';
            return;
        }

        const clientName = row.cells[0]?.textContent.toLowerCase() || '';
        const clientPhone = row.cells[1]?.textContent.toLowerCase() || '';
        const clientEmail = row.cells[2]?.textContent.toLowerCase() || '';

        // For agent filtering, check the "Assigned to" column (usually the 6th column)
        const assignedTo = row.cells[5]?.textContent.toLowerCase() || '';

        // Extract type from hidden content or data attributes
        const rowContent = row.innerHTML.toLowerCase();
        const matchesType = !selectedType || rowContent.includes(selectedType.toLowerCase());
        const matchesAgent = !selectedAgent || assignedTo.includes(selectedAgent.toLowerCase());

        const matchesSearch = !searchTerm ||
            clientName.includes(searchTerm) ||
            clientPhone.includes(searchTerm) ||
            clientEmail.includes(searchTerm);

        if (matchesSearch && matchesType && matchesAgent) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Update showing info
    const showingInfo = document.querySelector('.clients-view .showing-info');
    if (showingInfo) {
        if (visibleCount === 0) {
            showingInfo.textContent = 'No clients match your filters';
        } else {
            showingInfo.textContent = `Showing ${visibleCount} client${visibleCount === 1 ? '' : 's'}`;
        }
    }

    // Show/hide empty state
    if (visibleCount === 0 && rows.length > 0) {
        const tbody = document.querySelector('.clients-view .data-table tbody');
        if (tbody && !tbody.querySelector('.no-results-row')) {
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            noResultsRow.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <p style="font-size: 16px; margin: 0;">No clients match your search criteria</p>
                    <p style="font-size: 14px; margin-top: 8px; color: #9ca3af;">Try adjusting your filters or search terms</p>
                </td>
            `;
            tbody.appendChild(noResultsRow);
        }
    } else {
        // Remove no results row if it exists
        const noResultsRow = document.querySelector('.no-results-row');
        if (noResultsRow) {
            noResultsRow.remove();
        }
    }
}

// Enhanced client action buttons
window.enhanceClientActions = function() {
    // Add bulk actions
    const clientsView = document.querySelector('.clients-view');
    if (!clientsView) return;

    const existingBulk = clientsView.querySelector('.bulk-actions');
    if (existingBulk) return;

    const headerActions = clientsView.querySelector('.header-actions');
    if (!headerActions) return;

    // Add bulk actions
    const bulkActions = document.createElement('div');
    bulkActions.className = 'bulk-actions';
    bulkActions.innerHTML = `
        <div class="bulk-action-controls" style="display: none; align-items: center; gap: 10px; margin-left: 20px;">
            <span class="selected-count">0 selected</span>
            <button class="btn-secondary" onclick="assignSelectedClients()">
                <i class="fas fa-user-tag"></i> Assign
            </button>
            <button class="btn-secondary" onclick="exportSelectedClients()">
                <i class="fas fa-download"></i> Export
            </button>
            <button class="btn-danger" onclick="deleteSelectedClients()">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    headerActions.appendChild(bulkActions);

    // Add select all checkbox to table header
    const table = clientsView.querySelector('.data-table');
    if (table) {
        const headerRow = table.querySelector('thead tr');
        if (headerRow && !headerRow.querySelector('.select-column')) {
            const selectHeader = document.createElement('th');
            selectHeader.className = 'select-column';
            selectHeader.style.width = '40px';
            selectHeader.innerHTML = '<input type="checkbox" id="selectAllClients">';
            headerRow.insertBefore(selectHeader, headerRow.firstChild);

            // Add select all functionality
            document.getElementById('selectAllClients').addEventListener('change', function() {
                const checkboxes = clientsView.querySelectorAll('tbody input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = this.checked);
                updateBulkActionsVisibility();
            });
        }
    }
};

// Add individual checkboxes to client rows
window.addClientRowCheckboxes = function() {
    const rows = document.querySelectorAll('.clients-view .data-table tbody tr');

    rows.forEach(row => {
        if (row.cells.length === 1 || row.querySelector('.row-checkbox')) return; // Skip empty state or already processed

        const checkbox = document.createElement('td');
        checkbox.className = 'select-column';
        checkbox.style.width = '40px';
        checkbox.innerHTML = '<input type="checkbox" class="row-checkbox">';
        row.insertBefore(checkbox, row.firstChild);

        // Add event listener
        const cb = checkbox.querySelector('input');
        cb.addEventListener('change', updateBulkActionsVisibility);
    });
};

// Update bulk actions visibility
function updateBulkActionsVisibility() {
    const selectedCheckboxes = document.querySelectorAll('.clients-view .row-checkbox:checked');
    const bulkControls = document.querySelector('.bulk-action-controls');
    const selectedCount = document.querySelector('.selected-count');

    if (bulkControls && selectedCount) {
        if (selectedCheckboxes.length > 0) {
            bulkControls.style.display = 'flex';
            selectedCount.textContent = `${selectedCheckboxes.length} selected`;
        } else {
            bulkControls.style.display = 'none';
        }
    }
}

// Bulk actions functions
window.assignSelectedClients = function() {
    const selectedRows = getSelectedClientRows();
    if (selectedRows.length === 0) {
        showNotification('No clients selected', 'warning');
        return;
    }

    // Show agent assignment modal
    showAgentAssignmentModal(selectedRows);
};

window.exportSelectedClients = function() {
    const selectedRows = getSelectedClientRows();
    if (selectedRows.length === 0) {
        showNotification('No clients selected', 'warning');
        return;
    }

    // Export to CSV
    exportClientsToCSV(selectedRows);
};

window.deleteSelectedClients = function() {
    const selectedRows = getSelectedClientRows();
    if (selectedRows.length === 0) {
        showNotification('No clients selected', 'warning');
        return;
    }

    if (confirm(`Are you sure you want to delete ${selectedRows.length} selected clients? This action cannot be undone.`)) {
        deleteMultipleClients(selectedRows);
    }
};

// Helper functions
function getSelectedClientRows() {
    const selectedCheckboxes = document.querySelectorAll('.clients-view .row-checkbox:checked');
    return Array.from(selectedCheckboxes).map(cb => {
        const row = cb.closest('tr');
        const actionButtons = row.querySelector('.action-buttons');
        const viewButton = actionButtons?.querySelector('[onclick*="viewClient"]');
        const clientId = viewButton?.getAttribute('onclick')?.match(/viewClient\('([^']+)'\)/)?.[1];

        return {
            id: clientId,
            name: row.cells[1]?.textContent?.trim() || 'Unknown',
            element: row
        };
    }).filter(client => client.id);
}

function exportClientsToCSV(clients) {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Policies', 'Premium', 'Agent'];
    const csvData = [headers];

    clients.forEach(client => {
        const row = client.element;
        csvData.push([
            client.id,
            row.cells[1]?.textContent?.trim() || '',
            row.cells[2]?.textContent?.trim() || '',
            row.cells[3]?.textContent?.trim() || '',
            row.cells[4]?.textContent?.trim() || '0',
            row.cells[5]?.textContent?.trim() || '$0',
            row.cells[6]?.textContent?.trim() || ''
        ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    window.URL.revokeObjectURL(url);
    showNotification(`Exported ${clients.length} clients to CSV`, 'success');
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Override the original loadClientsView to add enhancements
const originalLoadClientsView = window.loadClientsView;
window.loadClientsView = async function() {
    // Call original function first
    if (originalLoadClientsView) {
        await originalLoadClientsView();
    }

    // Add enhancements after a short delay to ensure DOM is ready
    setTimeout(() => {
        window.initializeClientSearch();
        window.enhanceClientActions();
        window.addClientRowCheckboxes();
    }, 200);
};

// Initialize enhancements if already on clients page
if (window.location.hash === '#clients') {
    setTimeout(() => {
        window.initializeClientSearch();
        window.enhanceClientActions();
        window.addClientRowCheckboxes();
    }, 500);
}

console.log('Enhanced client management features loaded successfully');