// Fix instant delete - remove leads from UI immediately without refresh
(function() {
    'use strict';

    console.log('🗑️ Loading instant delete fix...');

    // Store original deleteLead function
    const originalDeleteLead = window.deleteLead;

    // Enhanced deleteLead that removes from UI instantly
    window.deleteLead = async function(leadId) {
        if (confirm('Are you sure you want to delete this lead?')) {
            console.log('🗑️ Deleting lead:', leadId);

            // IMMEDIATELY remove from UI - don't wait for server/localStorage
            const leadRow = document.querySelector(`#leadsTableBody tr[data-lead-id="${leadId}"]`);
            if (!leadRow) {
                // Try finding by checkbox value
                const checkbox = document.querySelector(`.lead-checkbox[value="${leadId}"]`);
                if (checkbox) {
                    const row = checkbox.closest('tr');
                    if (row) {
                        row.style.transition = 'opacity 0.3s, transform 0.3s';
                        row.style.opacity = '0';
                        row.style.transform = 'translateX(-20px)';
                        setTimeout(() => row.remove(), 300);
                    }
                }
            } else {
                leadRow.style.transition = 'opacity 0.3s, transform 0.3s';
                leadRow.style.opacity = '0';
                leadRow.style.transform = 'translateX(-20px)';
                setTimeout(() => leadRow.remove(), 300);
            }

            // Track deleted leads to prevent them from reappearing
            const deletedLeads = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
            if (!deletedLeads.includes(String(leadId))) {
                deletedLeads.push(String(leadId));
                localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedLeads));
            }

            // Delete from server
            try {
                const apiUrl = window.VANGUARD_API_URL ||
                              (window.location.hostname === 'localhost'
                                ? 'http://localhost:3001/api'
                                : `http://${window.location.hostname}:3001/api`);

                const deleteUrl = `${apiUrl}/leads/${leadId}`;
                console.log(`🔥 DEBUGGING DELETE: URL = ${deleteUrl}`);
                console.log(`🔥 DEBUGGING DELETE: Method = DELETE`);

                const response = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                console.log(`🔥 DEBUGGING DELETE: Response status = ${response.status}`);
                console.log(`🔥 DEBUGGING DELETE: Response ok = ${response.ok}`);

                if (response.ok) {
                    const responseText = await response.text();
                    console.log(`🔥 DEBUGGING DELETE: Response body = ${responseText}`);
                    console.log('✅ Lead deleted from server');
                } else {
                    const errorText = await response.text();
                    console.log(`🔥 DEBUGGING DELETE: Error response = ${errorText}`);
                    console.warn('⚠️ Failed to delete from server, removed locally');
                }
            } catch (error) {
                console.error('🔥 DEBUGGING DELETE: Exception =', error);
                console.error('Error deleting from server:', error);
            }

            // Delete from localStorage
            let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

            insurance_leads = insurance_leads.filter(l => String(l.id) !== String(leadId));
            regular_leads = regular_leads.filter(l => String(l.id) !== String(leadId));

            localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
            localStorage.setItem('leads', JSON.stringify(regular_leads));

            // Remove from memory store
            if (window.leadStore && window.leadStore[leadId]) {
                delete window.leadStore[leadId];
            }

            // Update lead count if displayed
            const leadCount = document.querySelector('.leads-count');
            if (leadCount) {
                const currentCount = parseInt(leadCount.textContent) || 0;
                if (currentCount > 0) {
                    leadCount.textContent = currentCount - 1;
                }
            }

            showNotification('Lead deleted successfully', 'success');

            // Don't reload view immediately - UI is already updated
            // Only reload if there are no more leads
            if (insurance_leads.length === 0) {
                setTimeout(() => {
                    if (window.loadLeadsView) {
                        window.loadLeadsView();
                    }
                }, 500);
            }
        }
    };

    // Fix for bulk delete
    window.deleteSelectedLeads = function() {
        const selectedCheckboxes = document.querySelectorAll('.lead-checkbox:checked');
        const selectedCount = selectedCheckboxes.length;

        if (selectedCount === 0) {
            showNotification('No leads selected', 'warning');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedCount} lead(s)?`)) {
            console.log(`🗑️ Bulk deleting ${selectedCount} leads`);

            // Get all selected lead IDs
            const leadIds = Array.from(selectedCheckboxes).map(cb => cb.value);

            // Track deleted leads
            const deletedLeads = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
            leadIds.forEach(id => {
                if (!deletedLeads.includes(String(id))) {
                    deletedLeads.push(String(id));
                }
            });
            localStorage.setItem('DELETED_LEAD_IDS', JSON.stringify(deletedLeads));

            // IMMEDIATELY remove from UI with animation
            selectedCheckboxes.forEach((checkbox, index) => {
                const row = checkbox.closest('tr');
                if (row) {
                    setTimeout(() => {
                        row.style.transition = 'opacity 0.3s, transform 0.3s';
                        row.style.opacity = '0';
                        row.style.transform = 'translateX(-20px)';
                        setTimeout(() => row.remove(), 300);
                    }, index * 50); // Stagger the animations
                }
            });

            // Delete from localStorage
            let insurance_leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let regular_leads = JSON.parse(localStorage.getItem('leads') || '[]');

            insurance_leads = insurance_leads.filter(l => !leadIds.includes(String(l.id)));
            regular_leads = regular_leads.filter(l => !leadIds.includes(String(l.id)));

            localStorage.setItem('insurance_leads', JSON.stringify(insurance_leads));
            localStorage.setItem('leads', JSON.stringify(regular_leads));

            // Delete from server (async)
            leadIds.forEach(async leadId => {
                try {
                    const apiUrl = window.VANGUARD_API_URL ||
                                  (window.location.hostname === 'localhost'
                                    ? 'http://localhost:3001/api'
                                    : `http://${window.location.hostname}:3001/api`);

                    await fetch(`${apiUrl}/leads/${leadId}`, {
                        method: 'DELETE'
                    });
                } catch (error) {
                    console.error('Error deleting lead from server:', leadId, error);
                }
            });

            // Hide the bulk delete button
            const bulkDeleteBtn = document.querySelector('.bulk-delete-btn');
            if (bulkDeleteBtn) {
                bulkDeleteBtn.style.display = 'none';
            }

            // Reset select all checkbox
            const selectAllCheckbox = document.getElementById('selectAllLeads');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }

            showNotification(`${selectedCount} lead(s) deleted successfully`, 'success');

            // Only reload if all leads are gone
            if (insurance_leads.length === 0) {
                setTimeout(() => {
                    if (window.loadLeadsView) {
                        window.loadLeadsView();
                    }
                }, 1000);
            }
        }
    };

    // Also hook the confirm button on bulk delete
    window.confirmBulkDelete = window.deleteSelectedLeads;

    console.log('✅ Instant delete fix loaded - leads will disappear immediately!');
})();