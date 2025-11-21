// Lead Filter 5/30 - Skip first 5 days, show days 6-30
console.log('📅 Lead Filter 5/30 initializing...');

(function() {
    // Function to filter leads by expiration window
    function filterLeadsByExpirationWindow(leads, skipDays = 5, windowDays = 30) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const skipUntil = new Date(today);
        skipUntil.setDate(skipUntil.getDate() + skipDays);

        const showUntil = new Date(today);
        showUntil.setDate(showUntil.getDate() + windowDays);

        console.log(`Filtering leads: Skipping first ${skipDays} days, showing days ${skipDays+1}-${windowDays}`);

        return leads.filter(lead => {
            // Check various date fields
            let expirationDate = null;

            // Try different date field names
            if (lead.insuranceInfo?.expirationDate) {
                expirationDate = new Date(lead.insuranceInfo.expirationDate);
            } else if (lead.expiryDate) {
                expirationDate = new Date(lead.expiryDate);
            } else if (lead.renewalDate) {
                expirationDate = new Date(lead.renewalDate);
            } else if (lead.policyExpirationDate) {
                expirationDate = new Date(lead.policyExpirationDate);
            }

            if (!expirationDate || isNaN(expirationDate)) {
                return false; // Skip if no valid expiration date
            }

            // Check if expiration is within our window (6-30 days out)
            return expirationDate > skipUntil && expirationDate <= showUntil;
        });
    }

    // Function to add 5/30 filter UI to leads page
    function addFilterUI() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions || document.getElementById('filter-530-container')) return;

        // Create filter container
        const filterContainer = document.createElement('div');
        filterContainer.id = 'filter-530-container';
        filterContainer.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-left: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        `;

        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'filter-530-checkbox';
        checkbox.style.cssText = 'width: 18px; height: 18px; cursor: pointer;';

        // Create label
        const label = document.createElement('label');
        label.htmlFor = 'filter-530-checkbox';
        label.style.cssText = 'cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 5px;';
        label.innerHTML = `
            <i class="fas fa-calendar-alt" style="color: #007bff;"></i>
            5/30 Filter
            <span style="font-weight: normal; color: #6c757d; font-size: 12px;">(Skip 1-5 days, Show 6-30)</span>
        `;

        // Create custom range inputs
        const customRange = document.createElement('div');
        customRange.style.cssText = 'display: none; align-items: center; gap: 8px; margin-left: 10px;';
        customRange.innerHTML = `
            <span style="font-size: 12px;">Skip:</span>
            <input type="number" id="skip-days" value="5" min="0" max="30" style="width: 50px; padding: 4px; border: 1px solid #ced4da; border-radius: 4px;">
            <span style="font-size: 12px;">days, Show next:</span>
            <input type="number" id="window-days" value="25" min="1" max="90" style="width: 50px; padding: 4px; border: 1px solid #ced4da; border-radius: 4px;">
            <span style="font-size: 12px;">days</span>
        `;

        // Add event listener
        checkbox.addEventListener('change', function() {
            applyFilter530(this.checked);

            // Save preference
            localStorage.setItem('filter530_enabled', this.checked);

            // Show/hide custom range
            if (this.checked) {
                customRange.style.display = 'flex';
            } else {
                customRange.style.display = 'none';
            }
        });

        // Add event listeners for custom range inputs
        customRange.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', function() {
                if (checkbox.checked) {
                    applyFilter530(true);
                }
            });
        });

        // Assemble filter UI
        filterContainer.appendChild(checkbox);
        filterContainer.appendChild(label);
        filterContainer.appendChild(customRange);

        // Add export button specific to filtered results
        const exportButton = document.createElement('button');
        exportButton.className = 'btn-secondary';
        exportButton.style.cssText = 'margin-left: 10px; display: none;';
        exportButton.innerHTML = '<i class="fas fa-download"></i> Export Filtered';
        exportButton.onclick = exportFilteredLeads;

        checkbox.addEventListener('change', function() {
            exportButton.style.display = this.checked ? 'inline-block' : 'none';
        });

        filterContainer.appendChild(exportButton);
        headerActions.appendChild(filterContainer);

        // Load saved preference
        const savedPreference = localStorage.getItem('filter530_enabled') === 'true';
        if (savedPreference) {
            checkbox.checked = true;
            customRange.style.display = 'flex';
            exportButton.style.display = 'inline-block';
            applyFilter530(true);
        }
    }

    // Function to apply the 5/30 filter
    function applyFilter530(enabled) {
        const tbody = document.getElementById('leadsTableBody');
        if (!tbody) return;

        // Get all leads from localStorage
        const allLeads = JSON.parse(localStorage.getItem('leads') || '[]');

        let leadsToShow = allLeads;

        if (enabled) {
            const skipDays = parseInt(document.getElementById('skip-days')?.value || 5);
            const windowDays = parseInt(document.getElementById('window-days')?.value || 25);
            const totalDays = skipDays + windowDays;

            leadsToShow = filterLeadsByExpirationWindow(allLeads, skipDays, totalDays);

            // Show filter status
            showFilterStatus(skipDays, totalDays, leadsToShow.length, allLeads.length);
        } else {
            hideFilterStatus();
        }

        // Update the table
        displayFilteredLeads(leadsToShow);
    }

    // Function to display filtered leads
    function displayFilteredLeads(leads) {
        const tbody = document.getElementById('leadsTableBody');
        if (!tbody) return;

        if (leads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d;">
                        <i class="fas fa-filter" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                        No leads found in the selected date range
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by expiration date
        leads.sort((a, b) => {
            const dateA = new Date(a.insuranceInfo?.expirationDate || a.expiryDate || a.renewalDate || 0);
            const dateB = new Date(b.insuranceInfo?.expirationDate || b.expiryDate || b.renewalDate || 0);
            return dateA - dateB;
        });

        // Build table HTML
        tbody.innerHTML = leads.map(lead => {
            const expirationDate = lead.insuranceInfo?.expirationDate || lead.expiryDate || lead.renewalDate;
            const daysUntilExpiry = expirationDate ?
                Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A';

            return `
                <tr>
                    <td>${lead.name || 'Unknown'}</td>
                    <td>${lead.phone || 'No Phone'}</td>
                    <td>${lead.email || 'No Email'}</td>
                    <td>${lead.insuranceInfo?.insuranceCompany || 'Unknown'}</td>
                    <td>${lead.insuranceInfo?.policyNumber || 'N/A'}</td>
                    <td>${expirationDate ? new Date(expirationDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <span class="badge ${daysUntilExpiry <= 10 ? 'badge-danger' : daysUntilExpiry <= 20 ? 'badge-warning' : 'badge-success'}">
                            ${daysUntilExpiry} days
                        </span>
                    </td>
                    <td>
                        <button class="btn-small btn-primary" onclick="callLead('${lead.id}')">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button class="btn-small btn-secondary" onclick="viewLead('${lead.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Function to show filter status
    function showFilterStatus(skipDays, totalDays, filteredCount, totalCount) {
        let statusBar = document.getElementById('filter-status-bar');

        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.id = 'filter-status-bar';

            const container = document.querySelector('.leads-container') || document.querySelector('.content-area');
            if (container) {
                container.insertBefore(statusBar, container.firstChild);
            }
        }

        statusBar.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        statusBar.innerHTML = `
            <div>
                <i class="fas fa-filter"></i>
                <strong>5/30 Filter Active:</strong>
                Showing leads expiring in days ${skipDays + 1} to ${totalDays}
                <span style="margin-left: 20px; opacity: 0.9;">
                    (${filteredCount} of ${totalCount} total leads)
                </span>
            </div>
            <button onclick="clearFilter530()" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            ">
                <i class="fas fa-times"></i> Clear Filter
            </button>
        `;
    }

    // Function to hide filter status
    function hideFilterStatus() {
        const statusBar = document.getElementById('filter-status-bar');
        if (statusBar) {
            statusBar.remove();
        }
    }

    // Function to clear filter
    window.clearFilter530 = function() {
        const checkbox = document.getElementById('filter-530-checkbox');
        if (checkbox) {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
        }
    };

    // Function to export filtered leads
    function exportFilteredLeads() {
        const allLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const skipDays = parseInt(document.getElementById('skip-days')?.value || 5);
        const windowDays = parseInt(document.getElementById('window-days')?.value || 25);
        const totalDays = skipDays + windowDays;

        const filteredLeads = filterLeadsByExpirationWindow(allLeads, skipDays, totalDays);

        // Create CSV content
        let csv = 'Company Name,Phone,Email,Insurance Company,Policy Number,Expiration Date,Days Until Expiry,Address,City,State,ZIP\n';

        filteredLeads.forEach(lead => {
            const expirationDate = lead.insuranceInfo?.expirationDate || lead.expiryDate || lead.renewalDate;
            const daysUntilExpiry = expirationDate ?
                Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A';

            csv += `"${lead.name || ''}","${lead.phone || ''}","${lead.email || ''}",`;
            csv += `"${lead.insuranceInfo?.insuranceCompany || ''}","${lead.insuranceInfo?.policyNumber || ''}",`;
            csv += `"${expirationDate || ''}","${daysUntilExpiry}",`;
            csv += `"${lead.address || ''}","${lead.city || ''}","${lead.state || ''}","${lead.zipCode || ''}"\n`;
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `filtered_leads_${skipDays+1}_to_${totalDays}_days_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        successMsg.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Exported ${filteredLeads.length} filtered leads (Days ${skipDays+1}-${totalDays})
        `;
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 5000);
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Add UI when on leads page
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            setTimeout(addFilterUI, 500);
        }
    });

    // Watch for navigation changes
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
            setTimeout(addFilterUI, 500);
        }
    });

    // Export functions globally
    window.filterLeadsByExpirationWindow = filterLeadsByExpirationWindow;
    window.applyFilter530 = applyFilter530;

    console.log('✅ Lead Filter 5/30 initialized');
    console.log('   - Filters leads to skip first 5 days');
    console.log('   - Shows leads expiring in days 6-30');
    console.log('   - Customizable date ranges');
})();