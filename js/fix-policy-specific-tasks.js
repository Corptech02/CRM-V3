// Fix Per-Policy Task Tracking - Each policy gets unique tasks
console.log('📋 Fixing per-policy task tracking...');

(function() {
    // Storage for per-policy tasks
    let policyTaskStates = JSON.parse(localStorage.getItem('policySpecificTasks') || '{}');

    // Save task states
    function saveTaskStates() {
        localStorage.setItem('policySpecificTasks', JSON.stringify(policyTaskStates));
    }

    // Default task template
    const defaultTasks = [
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

    // Get or create tasks for a specific policy
    function getPolicyTasks(policyNumber, expirationDate) {
        const key = `${policyNumber}_${expirationDate}`;

        if (!policyTaskStates[key]) {
            // Create new task set for this policy
            policyTaskStates[key] = JSON.parse(JSON.stringify(defaultTasks));
            saveTaskStates();
        }

        return policyTaskStates[key];
    }

    // Update task status for a specific policy
    function updatePolicyTask(policyNumber, expirationDate, taskId, checked) {
        const key = `${policyNumber}_${expirationDate}`;
        const tasks = getPolicyTasks(policyNumber, expirationDate);

        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = checked ? 'done' : 'pending';
            if (checked) {
                task.date = new Date().toLocaleDateString();
            } else {
                task.date = '';
            }

            policyTaskStates[key] = tasks;
            saveTaskStates();

            console.log(`✅ Updated task ${taskId} for policy ${policyNumber}: ${checked ? 'done' : 'pending'}`);
        }
    }

    // Wait for renewalsManager
    function setupTaskTracking() {
        if (!window.renewalsManager) {
            setTimeout(setupTaskTracking, 100);
            return;
        }

        console.log('🚀 Setting up per-policy task tracking');

        // Override generateTasksTab to use policy-specific tasks
        const originalGenerateTasksTab = window.renewalsManager.generateTasksTab;
        window.renewalsManager.generateTasksTab = function(tasks) {
            const policy = this.selectedRenewal;

            if (!policy) {
                console.log('⚠️ No policy selected');
                return '<div class="empty-state">Please select a policy to view tasks</div>';
            }

            const policyTasks = getPolicyTasks(policy.policyNumber, policy.expirationDate);
            const policyKey = `${policy.policyNumber}_${policy.expirationDate}`;

            console.log(`📋 Loading tasks for policy ${policy.policyNumber} (${policy.clientName})`);

            // Generate HTML with policy-specific data attributes
            return `
                <div class="tasks-container" data-policy-key="${policyKey}">
                    <div style="padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px 8px 0 0; margin-bottom: 0;">
                        <h3 style="margin: 0; font-size: 18px;">
                            <i class="fas fa-tasks"></i> Renewal Tasks
                        </h3>
                        <div style="margin-top: 8px; font-size: 14px; opacity: 0.9;">
                            Policy: ${policy.policyNumber} | Client: ${policy.clientName || 'Unknown'}
                        </div>
                    </div>

                    <div class="tasks-list" style="border: 2px solid #667eea; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden;">
                        <div class="task-header" style="display: grid; grid-template-columns: 30px 2fr 1fr 1.5fr 2fr; gap: 15px; padding: 12px; background: #e9ecef; font-weight: 600;">
                            <div></div>
                            <div>Task</div>
                            <div>Status</div>
                            <div>Date</div>
                            <div>Notes</div>
                        </div>
                        ${policyTasks.map(task => `
                            <div class="task-item ${task.status === 'done' ? 'task-done' : ''}"
                                 style="display: grid; grid-template-columns: 30px 2fr 1fr 1.5fr 2fr; gap: 15px; padding: 12px; background: white; border-bottom: 1px solid #e9ecef;">
                                <input type="checkbox"
                                    class="policy-task-checkbox"
                                    data-policy-number="${policy.policyNumber}"
                                    data-policy-expiration="${policy.expirationDate}"
                                    data-task-id="${task.id}"
                                    ${task.status === 'done' ? 'checked' : ''}>
                                <div class="task-name" style="${task.status === 'done' ? 'text-decoration: line-through; color: #999;' : ''}">
                                    ${task.name}
                                    ${task.id === 10 ? '<span style="color: #4CAF50; margin-left: 10px;">⭐</span>' : ''}
                                </div>
                                <div class="task-status">
                                    ${task.status === 'done' ?
                                        '<span style="color: #4CAF50;"><i class="fas fa-check-circle"></i> Done</span>' :
                                        '<span style="color: #FFA500;"><i class="fas fa-clock"></i> Pending</span>'}
                                </div>
                                <div class="task-date">
                                    ${task.date || ''}
                                    ${task.daysOut > 0 && task.status !== 'done' ? ` <small>(${task.daysOut}d)</small>` : ''}
                                </div>
                                <div class="task-notes" style="font-size: 12px; color: #666;">
                                    ${task.notes || ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button class="btn-secondary" onclick="alert('Add task feature coming soon')">
                                <i class="fas fa-plus"></i> Add Task
                            </button>
                            <span style="margin-left: auto; color: #666; font-size: 13px;">
                                <i class="fas fa-info-circle"></i> Tasks are saved automatically per policy
                            </span>
                        </div>
                    </div>
                </div>
            `;
        };

        // Override updateTaskStatus to do nothing (we handle it ourselves)
        window.renewalsManager.updateTaskStatus = function(taskId, checked) {
            console.log('Task update intercepted - handled by per-policy system');
        };
    }

    // Global event listener for task checkboxes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('policy-task-checkbox')) {
            const policyNumber = e.target.dataset.policyNumber;
            const expirationDate = e.target.dataset.policyExpiration;
            const taskId = parseInt(e.target.dataset.taskId);
            const checked = e.target.checked;

            console.log(`📝 Task ${taskId} changed for policy ${policyNumber}`);

            // Update the task state
            updatePolicyTask(policyNumber, expirationDate, taskId, checked);

            // Update UI immediately
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                const nameDiv = taskItem.querySelector('.task-name');
                const statusDiv = taskItem.querySelector('.task-status');
                const dateDiv = taskItem.querySelector('.task-date');

                if (checked) {
                    taskItem.classList.add('task-done');
                    nameDiv.style.textDecoration = 'line-through';
                    nameDiv.style.color = '#999';
                    statusDiv.innerHTML = '<span style="color: #4CAF50;"><i class="fas fa-check-circle"></i> Done</span>';
                    if (!dateDiv.textContent.includes('/')) {
                        dateDiv.innerHTML = new Date().toLocaleDateString();
                    }
                } else {
                    taskItem.classList.remove('task-done');
                    nameDiv.style.textDecoration = 'none';
                    nameDiv.style.color = '';
                    statusDiv.innerHTML = '<span style="color: #FFA500;"><i class="fas fa-clock"></i> Pending</span>';
                }

                // Special handling for Finalize Renewal (task 10)
                if (taskId === 10) {
                    // Update the renewal list visual indicator
                    const renewalItems = document.querySelectorAll('.renewal-item');
                    renewalItems.forEach(item => {
                        const policyNum = item.querySelector('.policy-number');
                        if (policyNum && policyNum.textContent.includes(policyNumber)) {
                            if (checked) {
                                item.style.borderLeft = '8px solid #4CAF50';
                                item.classList.add('renewal-finalized');
                            } else {
                                item.style.borderLeft = '';
                                item.classList.remove('renewal-finalized');
                            }
                        }
                    });
                }
            }
        }
    }, true);

    // Start setup
    setupTaskTracking();

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .task-item.task-done {
            background: linear-gradient(to right, rgba(76, 175, 80, 0.05) 0%, transparent 100%) !important;
        }

        .policy-task-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .policy-task-checkbox:checked {
            accent-color: #4CAF50;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ Per-policy task tracking active');
})();