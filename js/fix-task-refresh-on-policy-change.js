// Fix Task Checklist Refresh When Switching Policies
console.log('🔄 Fixing task checklist to refresh on policy change...');

(function() {
    // Storage for per-policy tasks - UNIQUE for each policy
    const TASKS_STORAGE_KEY = 'policyRenewalTasksV2';
    let allPolicyTasks = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || '{}');

    // Track the currently displayed policy
    let currentDisplayedPolicy = null;

    // Default task template - FRESH for each policy
    function getDefaultTasks() {
        return [
            { id: 1, name: 'Request Updates from Client', checked: false, date: '', notes: '' },
            { id: 2, name: 'Updates Received', checked: false, date: '', notes: '' },
            { id: 3, name: 'Request Loss Runs', checked: false, date: '', notes: '' },
            { id: 4, name: 'Loss Runs Received', checked: false, date: '', notes: '' },
            { id: 5, name: 'Create Applications', checked: false, date: '', notes: 'Make sure he fills out a supplemental' },
            { id: 6, name: 'Create Proposal', checked: false, date: '', notes: '' },
            { id: 7, name: 'Send Proposal', checked: false, date: '', notes: '' },
            { id: 8, name: 'Signed Docs Received', checked: false, date: '', notes: '' },
            { id: 9, name: 'Bind Order', checked: false, date: '', notes: '' },
            { id: 10, name: 'Finalize Renewal', checked: false, date: '', notes: 'Accounting / Send Thank You Card / Finance' }
        ];
    }

    // Save tasks to storage
    function saveTasks() {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(allPolicyTasks));
    }

    // Get tasks for a specific policy
    function getTasksForPolicy(policyNumber) {
        if (!policyNumber) return getDefaultTasks();

        if (!allPolicyTasks[policyNumber]) {
            allPolicyTasks[policyNumber] = getDefaultTasks();
            saveTasks();
        }

        return allPolicyTasks[policyNumber];
    }

    // Update task for a specific policy
    function updateTaskForPolicy(policyNumber, taskId, checked) {
        if (!policyNumber) return;

        const tasks = getTasksForPolicy(policyNumber);
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            task.checked = checked;
            task.date = checked ? new Date().toLocaleDateString() : '';
            allPolicyTasks[policyNumber] = tasks;
            saveTasks();
            console.log(`✅ Updated task ${taskId} for policy ${policyNumber}: ${checked}`);
        }
    }

    // Force refresh the task display
    function refreshTaskDisplay(policy) {
        if (!policy) return;

        console.log(`🔄 Refreshing tasks for policy: ${policy.policyNumber}`);
        currentDisplayedPolicy = policy.policyNumber;

        // Find the tab content area
        const tabContent = document.getElementById('tabContent');
        if (!tabContent) return;

        // Get tasks for THIS SPECIFIC policy
        const policyTasks = getTasksForPolicy(policy.policyNumber);

        // Generate fresh HTML with this policy's tasks
        const tasksHTML = `
            <div class="tasks-refresh-container" data-current-policy="${policy.policyNumber}">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0;">Renewal Tasks for Policy #${policy.policyNumber}</h4>
                    <small>Client: ${policy.clientName || 'Unknown'}</small>
                </div>

                <div class="tasks-list">
                    <div style="display: grid; grid-template-columns: 40px 2fr 1fr 1fr 2fr; gap: 10px; padding: 10px; background: #f0f0f0; font-weight: bold;">
                        <div></div>
                        <div>Task</div>
                        <div>Status</div>
                        <div>Date</div>
                        <div>Notes</div>
                    </div>

                    ${policyTasks.map(task => `
                        <div class="policy-task-row" style="display: grid; grid-template-columns: 40px 2fr 1fr 1fr 2fr; gap: 10px; padding: 10px; border-bottom: 1px solid #e0e0e0; ${task.checked ? 'background: rgba(76,175,80,0.1);' : ''}">
                            <div>
                                <input type="checkbox"
                                       class="policy-specific-checkbox"
                                       data-policy="${policy.policyNumber}"
                                       data-task-id="${task.id}"
                                       ${task.checked ? 'checked' : ''}
                                       style="width: 20px; height: 20px; cursor: pointer;">
                            </div>
                            <div style="${task.checked ? 'text-decoration: line-through; color: #999;' : ''}">
                                ${task.name}
                                ${task.id === 10 ? '<span style="color: #FFA500; margin-left: 5px;">★</span>' : ''}
                            </div>
                            <div>
                                ${task.checked ?
                                    '<span style="color: #4CAF50;">✓ Done</span>' :
                                    '<span style="color: #999;">Pending</span>'}
                            </div>
                            <div>${task.date || ''}</div>
                            <div style="font-size: 12px; color: #666;">${task.notes || ''}</div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <small style="color: #666;">
                        <i class="fas fa-info-circle"></i> Task progress is saved separately for each policy
                    </small>
                </div>
            </div>
        `;

        // Replace the content
        tabContent.innerHTML = tasksHTML;
    }

    // Monitor for policy selection changes
    function setupPolicyChangeDetection() {
        if (!window.renewalsManager) {
            setTimeout(setupPolicyChangeDetection, 100);
            return;
        }

        console.log('🎯 Setting up policy change detection');

        // Override selectRenewal to refresh tasks
        const originalSelectRenewal = window.renewalsManager.selectRenewal;
        window.renewalsManager.selectRenewal = function(policy) {
            console.log('📌 Policy selected:', policy.policyNumber);

            // Call original function
            if (originalSelectRenewal) {
                originalSelectRenewal.call(this, policy);
            }

            // Store the selected policy
            this.selectedRenewal = policy;

            // Force refresh the task display if tasks tab is active
            const tasksTab = document.querySelector('.tab-btn.active');
            if (tasksTab && tasksTab.textContent.includes('Tasks')) {
                setTimeout(() => {
                    refreshTaskDisplay(policy);
                }, 100);
            }
        };

        // Override tab switching to refresh tasks
        const originalSwitchTab = window.renewalsManager.switchTab;
        window.renewalsManager.switchTab = function(tab) {
            console.log('📑 Switching to tab:', tab);

            // Call original function
            if (originalSwitchTab) {
                originalSwitchTab.call(this, tab);
            }

            // If switching to tasks tab, refresh with current policy's tasks
            if (tab === 'tasks' && this.selectedRenewal) {
                setTimeout(() => {
                    refreshTaskDisplay(this.selectedRenewal);
                }, 100);
            }
        };
    }

    // Global checkbox listener
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('policy-specific-checkbox')) {
            const policyNumber = e.target.dataset.policy;
            const taskId = parseInt(e.target.dataset.taskId);
            const checked = e.target.checked;

            console.log(`📝 Task ${taskId} changed to ${checked} for policy ${policyNumber}`);

            // Update the task state
            updateTaskForPolicy(policyNumber, taskId, checked);

            // Update visual feedback
            const row = e.target.closest('.policy-task-row');
            if (row) {
                const taskName = row.querySelector('div:nth-child(2)');
                const status = row.querySelector('div:nth-child(3)');
                const date = row.querySelector('div:nth-child(4)');

                if (checked) {
                    row.style.background = 'rgba(76,175,80,0.1)';
                    taskName.style.textDecoration = 'line-through';
                    taskName.style.color = '#999';
                    status.innerHTML = '<span style="color: #4CAF50;">✓ Done</span>';
                    if (!date.textContent) {
                        date.textContent = new Date().toLocaleDateString();
                    }
                } else {
                    row.style.background = '';
                    taskName.style.textDecoration = '';
                    taskName.style.color = '';
                    status.innerHTML = '<span style="color: #999;">Pending</span>';
                    date.textContent = '';
                }

                // Special handling for Finalize Renewal
                if (taskId === 10) {
                    const renewalItems = document.querySelectorAll('.renewal-item');
                    renewalItems.forEach(item => {
                        const policyNum = item.querySelector('.policy-number');
                        if (policyNum && policyNum.textContent.includes(policyNumber)) {
                            if (checked) {
                                item.style.borderLeft = '8px solid #4CAF50';
                                const clientName = item.querySelector('h4');
                                if (clientName && !clientName.querySelector('.finalized-mark')) {
                                    const mark = document.createElement('span');
                                    mark.className = 'finalized-mark';
                                    mark.style.cssText = 'color: #4CAF50; margin-left: 10px;';
                                    mark.textContent = '✓';
                                    clientName.appendChild(mark);
                                }
                            } else {
                                item.style.borderLeft = '';
                                const mark = item.querySelector('.finalized-mark');
                                if (mark) mark.remove();
                            }
                        }
                    });
                }
            }
        }
    });

    // Start monitoring
    setupPolicyChangeDetection();

    // Also monitor for clicks on renewal items
    document.addEventListener('click', function(e) {
        const renewalItem = e.target.closest('.renewal-item');
        if (renewalItem) {
            // Extract policy data and force refresh after a short delay
            setTimeout(() => {
                if (window.renewalsManager && window.renewalsManager.selectedRenewal) {
                    const tasksTab = document.querySelector('.tab-btn.active');
                    if (tasksTab && tasksTab.textContent.includes('Tasks')) {
                        refreshTaskDisplay(window.renewalsManager.selectedRenewal);
                    }
                }
            }, 200);
        }
    }, true);

    console.log('✅ Task refresh on policy change is active');
})();