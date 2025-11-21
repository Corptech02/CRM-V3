// Fix Assigned To Column Sorting Issues
console.log('Fixing Assigned To column sorting...');

// Override the sortLeads function to fix assignedTo field sorting
(function() {
    const originalSortLeads = window.sortLeads;

    window.sortLeads = function(field) {
        console.log('Enhanced sortLeads called with field:', field);

        // Get all leads including archived for proper sorting (then filter after)
        let allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        // Filter out archived leads FIRST to prevent issues with array indices
        let leads = allLeads.filter(lead => !lead.archived);

        console.log(`Sorting ${leads.length} leads by ${field}`);

        // Ensure we have a global sort state
        if (!window.currentSort) {
            window.currentSort = { field: null, direction: 'asc' };
        }

        // Toggle direction if same field, otherwise default to ascending
        if (window.currentSort.field === field) {
            window.currentSort.direction = window.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            window.currentSort.field = field;
            window.currentSort.direction = 'asc';
        }

        // Enhanced sorting with proper assignedTo handling
        leads.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            // Special handling for assignedTo field
            if (field === 'assignedTo') {
                // Normalize values - treat null, undefined, empty string, "Unassigned" as the same
                aVal = normalizeAssignedTo(aVal);
                bVal = normalizeAssignedTo(bVal);

                // Case-insensitive comparison
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();

                console.log(`Comparing: "${a.assignedTo}" (normalized: "${aVal}") vs "${b.assignedTo}" (normalized: "${bVal}")`);
            }
            // Handle different field types
            else if (field === 'premium') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (field === 'renewalDate' || field === 'created') {
                aVal = new Date(aVal || '2099-12-31');
                bVal = new Date(bVal || '2099-12-31');
            } else if (field === 'stage') {
                // Custom stage ordering
                const stageOrder = {
                    'new': 1,
                    'quoted': 2,
                    'quote-sent-unaware': 3,
                    'quote-sent-aware': 4,
                    'interested': 5,
                    'not-interested': 6,
                    'closed': 7,
                    'contacted': 8,
                    'reviewed': 9,
                    'converted': 10
                };
                aVal = stageOrder[aVal] || 999;
                bVal = stageOrder[bVal] || 999;
            } else {
                // For other string fields, ensure proper string comparison
                aVal = String(aVal || '').toLowerCase();
                bVal = String(bVal || '').toLowerCase();
            }

            // Compare values
            if (aVal < bVal) return window.currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return window.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        console.log('Sorted leads:', leads.map(lead => ({ name: lead.name, assignedTo: lead.assignedTo })));

        // Update the table body
        const tableBody = document.getElementById('leadsTableBody');
        if (tableBody) {
            // Use the appropriate row generation function
            if (typeof generateSimpleLeadRows === 'function') {
                tableBody.innerHTML = generateSimpleLeadRows(leads);
            } else if (typeof generateLeadRowsWithColors === 'function') {
                // Get policies for the enhanced version
                const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                tableBody.innerHTML = generateLeadRowsWithColors(leads, allPolicies);
            } else {
                console.error('No lead row generation function available');
            }
        }

        // Update sort arrows
        if (typeof updateSortArrows === 'function') {
            updateSortArrows(field, window.currentSort.direction);
        }

        console.log(`Sorting complete: ${leads.length} leads displayed`);
    };

    // Helper function to normalize assignedTo values
    function normalizeAssignedTo(value) {
        if (!value ||
            value === null ||
            value === undefined ||
            value === '' ||
            value.toLowerCase() === 'unassigned' ||
            value.toLowerCase() === 'none' ||
            value.toLowerCase() === 'null') {
            return 'zzz_unassigned'; // This will sort to the end
        }
        return String(value);
    }

    console.log('Assigned To sorting fix loaded');
})();

// Also fix the "Assigned To" column header to include sorting functionality
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        fixAssignedToColumnHeader();
    }, 1000);
});

function fixAssignedToColumnHeader() {
    // Find the "Assigned To" header that doesn't have sorting
    const headers = document.querySelectorAll('th');
    headers.forEach(header => {
        const text = header.textContent.trim();
        if (text === 'Assigned To' && !header.classList.contains('sortable')) {
            console.log('Adding sorting to Assigned To column');

            // Make it sortable
            header.classList.add('sortable');
            header.setAttribute('onclick', "sortLeads('assignedTo')");
            header.setAttribute('data-sort', 'assignedTo');

            // Add sort arrow if it doesn't exist
            if (!header.querySelector('.sort-arrow')) {
                header.innerHTML = `
                    Assigned To
                    <span class="sort-arrow" id="sort-assignedTo">
                        <i class="fas fa-sort"></i>
                    </span>
                `;
            }
        }
    });
}