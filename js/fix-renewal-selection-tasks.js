// Fix Renewal Selection and Per-Policy Task Tracking
console.log('🔧 Fixing renewal selection and per-policy task tracking...');

(function() {
    // Track task states per policy
    let policyTasks = JSON.parse(localStorage.getItem('policyRenewalTasks') || '{}');

    // Save task states
    function savePolicyTasks() {
        localStorage.setItem('policyRenewalTasks', JSON.stringify(policyTasks));
    }

    // Default tasks template
    const defaultTasksTemplate = [
        { id: 1, name: 'Request Updates from Client', status: 'pending', date: '', daysOut: 60, notes: '' },
        { id: 2, name: 'Updates Received', status: 'pending', date: '', daysOut: 65, notes: '' },
        { id: 3, name: 'Request Loss Runs', status: 'pending', date: '', daysOut: 80, notes: '' },
        { id: 4, name: 'Loss Runs Received', status: 'pending', date: '', daysOut: 85, notes: '' },
        { id: 5, name: 'Create Applications', status: 'pending', date: '', daysOut: 120, notes: 'Make sure he fills out a supplemental' },
        { id: 6, name: 'Create Proposal', status: 'pending', date: '', daysOut: 150, notes: '' },
        { id: 7, name: 'Send Proposal', status: 'pending', date: '', daysOut: 156, notes: '' },
        { id: 8, name: 'Signed Docs Received', status: 'pending', date: '', daysOut: 165, notes: '' },
        { id: 9, name: 'Bind Order', status: 'pending', date: '', daysOut: 169, notes: '' },
        { id: 10, name: 'Finalize Renewal', status: 'pending', date: '', daysOut: 180, notes: 'Accounting / Send Thank You Card / Finance' }
    ];

    // Wait for renewalsManager to be ready
    function setupFixes() {
        if (!window.renewalsManager) {
            setTimeout(setupFixes, 100);
            return;
        }

        console.log('✅ Setting up renewal fixes');

        // Fix 1: Override selectRenewal to properly handle selection
        const originalSelectRenewal = window.renewalsManager.selectRenewal.bind(window.renewalsManager);
        window.renewalsManager.selectRenewal = function(policy, event) {
            console.log('🔄 Selecting renewal:', policy.policyNumber);

            // Store the selected policy
            this.selectedRenewal = policy;

            // Clear ALL previous selections properly
            const allItems = document.querySelectorAll('.renewal-item');
            allItems.forEach(item => {
                item.classList.remove('selected');
                item.style.background = ''; // Reset any inline styles
                item.style.borderColor = ''; // Reset border color
            });

            // Find and select the clicked item
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('selected');
            } else {
                // If no event, find the item by policy number
                allItems.forEach(item => {
                    const policyNum = item.querySelector('.policy-number');
                    if (policyNum && policyNum.textContent.includes(policy.policyNumber)) {
                        item.classList.add('selected');
                        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            }

            // Update details panel
            const detailsPanel = document.getElementById('renewalDetails');
            if (detailsPanel) {
                detailsPanel.innerHTML = this.generateRenewalDetails(policy);
            }
        };

        // Fix 2: Override generateTasksTab to use per-policy tasks
        const originalGenerateTasksTab = window.renewalsManager.generateTasksTab.bind(window.renewalsManager);
        window.renewalsManager.generateTasksTab = function(tasks) {
            const policy = this.selectedRenewal;
            if (!policy) {
                return originalGenerateTasksTab(tasks);
            }

            const policyKey = `${policy.policyNumber}_${policy.expirationDate}`;
            console.log('📋 Loading tasks for policy:', policyKey);

            // Get or initialize tasks for this policy
            if (!policyTasks[policyKey]) {
                policyTasks[policyKey] = JSON.parse(JSON.stringify(defaultTasksTemplate));
                savePolicyTasks();
            }

            const policySpecificTasks = policyTasks[policyKey];

            // Generate the tasks HTML
            return `
                <div class="tasks-list">
                    <div class="task-item" style="font-weight: 600; background: #e9ecef;">
                        <div></div>
                        <div>Task</div>
                        <div>Status</div>
                        <div>Date</div>
                        <div>Notes</div>
                    </div>
                    ${policySpecificTasks.map(task => `
                        <div class="task-item ${task.status === 'done' ? 'task-completed' : ''}"
                             data-task-id="${task.id}">
                            <input type="checkbox"
                                class="task-checkbox"
                                data-policy-key="${policyKey}"
                                data-task-id="${task.id}"
                                ${task.status === 'done' ? 'checked' : ''}>
                            <div class="task-name">${task.name}</div>
                            <div class="task-status ${task.status === 'done' ? 'status-done' : 'status-pending'}">
                                ${task.status === 'done' ? '<i class="fas fa-check-circle"></i> Done' : '<i class="fas fa-clock"></i> Pending'}
                            </div>
                            <div class="task-date">
                                ${task.date || ''}
                                ${task.daysOut > 0 && task.status !== 'done' ? ` (In ${task.daysOut} Days)` : ''}
                            </div>
                            <div class="task-notes">${task.notes || ''}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 20px;">
                    <button class="btn-secondary" onclick="renewalsManager.addTask()">
                        <i class="fas fa-plus"></i> Add Task
                    </button>
                    <button class="btn-primary" onclick="renewalsManager.saveTaskProgress()">
                        <i class="fas fa-save"></i> Save Progress
                    </button>
                    <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                        <small style="color: #666;">
                            <i class="fas fa-info-circle"></i> Tasks for Policy: ${policy.policyNumber}
                            (${policy.clientName || 'Unknown'})
                        </small>
                    </div>
                </div>
            `;
        };

        // Fix 3: Override generateRenewalsList to properly handle onclick
        const originalGenerateList = window.renewalsManager.generateRenewalsList.bind(window.renewalsManager);
        window.renewalsManager.generateRenewalsList = function(policies) {
            if (policies.length === 0) {
                return '<div class="empty-state"><i class="fas fa-inbox"></i><p>No renewals found for this period</p></div>';
            }

            return policies.map(policy => {
                const daysUntilExpiration = this.getDaysUntilExpiration(policy.expirationDate);
                const urgencyClass = this.getUrgencyClass(daysUntilExpiration);
                const policyKey = `${policy.policyNumber}_${policy.expirationDate}`;

                return `
                    <div class="renewal-item"
                         data-policy-number="${policy.policyNumber}"
                         data-policy-key="${policyKey}"
                         onclick="renewalsManager.selectRenewal(${JSON.stringify(policy).replace(/"/g, '&quot;')}, event)">
                        <div class="renewal-item-header">
                            <div class="renewal-item-info">
                                <h4>${policy.clientName || 'Unknown Client'}</h4>
                                <div class="policy-number">Policy #${policy.policyNumber || 'N/A'}</div>
                            </div>
                            <span class="expiration-badge ${urgencyClass}">
                                ${daysUntilExpiration <= 0 ? 'EXPIRED' : `${daysUntilExpiration} days`}
                            </span>
                        </div>
                        <div class="renewal-item-details">
                            <div class="detail-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>${this.getPolicyTypeDisplay(policy.policyType)}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-dollar-sign"></i>
                                <span>$${(policy.premium || 0).toLocaleString()}/yr</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-building"></i>
                                <span>${policy.carrier || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>${new Date(policy.expirationDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        };
    }

    // Setup task checkbox listener
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('task-checkbox')) {
            const policyKey = e.target.dataset.policyKey;
            const taskId = parseInt(e.target.dataset.taskId);
            const checked = e.target.checked;

            console.log(`📝 Updating task ${taskId} for policy ${policyKey}: ${checked ? 'done' : 'pending'}`);

            if (policyKey && policyTasks[policyKey]) {
                const task = policyTasks[policyKey].find(t => t.id === taskId);
                if (task) {
                    task.status = checked ? 'done' : 'pending';
                    if (checked) {
                        task.date = new Date().toLocaleDateString();
                    }
                    savePolicyTasks();

                    // Update the UI
                    const taskItem = e.target.closest('.task-item');
                    if (taskItem) {
                        const statusDiv = taskItem.querySelector('.task-status');
                        if (statusDiv) {
                            statusDiv.className = checked ? 'task-status status-done' : 'task-status status-pending';
                            statusDiv.innerHTML = checked ?
                                '<i class="fas fa-check-circle"></i> Done' :
                                '<i class="fas fa-clock"></i> Pending';
                        }

                        // Add visual feedback
                        if (checked) {
                            taskItem.classList.add('task-completed');
                        } else {
                            taskItem.classList.remove('task-completed');
                        }
                    }

                    // Special handling for Finalize Renewal (task 10)
                    if (taskId === 10) {
                        // Trigger finalized renewal visual update
                        const event = new CustomEvent('renewalFinalized', {
                            detail: {
                                policyKey: policyKey,
                                finalized: checked,
                                policy: window.renewalsManager.selectedRenewal
                            }
                        });
                        document.dispatchEvent(event);
                    }
                }
            }
        }
    }, true);

    // Add CSS for proper selection
    const style = document.createElement('style');
    style.textContent = `
        /* Clear selection styling */
        .renewal-item {
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .renewal-item.selected {
            background: linear-gradient(to right, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border-color: #667eea !important;
            transform: scale(1.02);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
        }

        .renewal-item.selected * {
            color: white !important;
        }

        .renewal-item.selected .expiration-badge {
            background: rgba(255, 255, 255, 0.2) !important;
            color: white !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        /* Task completion styling */
        .task-item.task-completed {
            background: linear-gradient(to right, rgba(76, 175, 80, 0.1) 0%, transparent 100%);
            opacity: 0.8;
        }

        .task-item.task-completed .task-name {
            text-decoration: line-through;
            color: #666;
        }

        /* Prevent multiple selections */
        .renewal-item:not(.selected):hover {
            background: #f0f0f0;
            transform: translateX(5px);
        }
    `;
    document.head.appendChild(style);

    // Start setup
    setupFixes();

    console.log('✅ Renewal selection and task tracking fixes active');
})();