// ULTIMATE FIX - Completely Separate Task Lists Per Policy
console.log('💪 ULTIMATE FIX: Forcing separate task lists per policy...');

(function() {
    // Unique storage for each policy's tasks
    const STORAGE_KEY = 'ultimatePolicyTasks';
    let policyTaskDatabase = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    // Save to storage
    function saveDatabase() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(policyTaskDatabase));
    }

    // Get fresh default tasks
    function createFreshTasks() {
        return {
            task1: { id: 1, name: 'Request Updates from Client', checked: false },
            task2: { id: 2, name: 'Updates Received', checked: false },
            task3: { id: 3, name: 'Request Loss Runs', checked: false },
            task4: { id: 4, name: 'Loss Runs Received', checked: false },
            task5: { id: 5, name: 'Create Applications', checked: false },
            task6: { id: 6, name: 'Create Proposal', checked: false },
            task7: { id: 7, name: 'Send Proposal', checked: false },
            task8: { id: 8, name: 'Signed Docs Received', checked: false },
            task9: { id: 9, name: 'Bind Order', checked: false },
            task10: { id: 10, name: 'Finalize Renewal', checked: false }
        };
    }

    // Get or create tasks for a specific policy
    function getTasksForPolicy(policyNumber) {
        const key = String(policyNumber).replace(/[^a-zA-Z0-9]/g, '_');

        if (!policyTaskDatabase[key]) {
            console.log(`📝 Creating new task set for policy: ${policyNumber}`);
            policyTaskDatabase[key] = createFreshTasks();
            saveDatabase();
        }

        return policyTaskDatabase[key];
    }

    // Update a task for a policy
    function updatePolicyTask(policyNumber, taskId, checked) {
        const key = String(policyNumber).replace(/[^a-zA-Z0-9]/g, '_');
        const tasks = getTasksForPolicy(policyNumber);
        const taskKey = `task${taskId}`;

        if (tasks[taskKey]) {
            tasks[taskKey].checked = checked;
            policyTaskDatabase[key] = tasks;
            saveDatabase();
            console.log(`✅ Saved: Policy ${policyNumber}, Task ${taskId} = ${checked}`);
        }
    }

    // COMPLETELY REBUILD the task display
    function rebuildTaskDisplay(policy) {
        if (!policy) {
            console.log('❌ No policy provided to rebuild tasks');
            return;
        }

        console.log(`🔨 REBUILDING tasks for policy: ${policy.policyNumber}`);

        // Find the tab content area
        const tabContent = document.getElementById('tabContent');
        if (!tabContent) {
            console.log('❌ Tab content area not found');
            return;
        }

        // Get THIS policy's specific tasks
        const policyTasks = getTasksForPolicy(policy.policyNumber);

        // COMPLETELY REPLACE the content
        const newTaskHTML = `
            <div id="ultimateTaskContainer" data-loaded-policy="${policy.policyNumber}">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                    <h3 style="margin: 0; font-size: 20px;">📋 Renewal Tasks</h3>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.95;">
                        <strong>Policy:</strong> ${policy.policyNumber} |
                        <strong>Client:</strong> ${policy.clientName || 'Unknown'} |
                        <strong>Expiration:</strong> ${policy.expirationDate || 'N/A'}
                    </div>
                </div>

                <div style="background: white; border: 2px solid #667eea; border-radius: 10px; overflow: hidden;">
                    <div style="display: grid; grid-template-columns: 50px 3fr 1fr 1fr 2fr; gap: 15px; padding: 15px; background: #f8f9fa; font-weight: bold; border-bottom: 2px solid #667eea;">
                        <div>✓</div>
                        <div>Task</div>
                        <div>Status</div>
                        <div>Date</div>
                        <div>Notes</div>
                    </div>

                    <div id="taskListContainer">
                        ${Object.values(policyTasks).map(task => `
                            <div class="ultimate-task-row" data-task-id="${task.id}" style="display: grid; grid-template-columns: 50px 3fr 1fr 1fr 2fr; gap: 15px; padding: 15px; border-bottom: 1px solid #e0e0e0; ${task.checked ? 'background: rgba(76,175,80,0.1);' : 'background: white;'}">
                                <div>
                                    <input type="checkbox"
                                           class="ultimate-task-checkbox"
                                           data-ultimate-policy="${policy.policyNumber}"
                                           data-ultimate-task="${task.id}"
                                           ${task.checked ? 'checked' : ''}
                                           style="width: 20px; height: 20px; cursor: pointer;">
                                </div>
                                <div class="task-name-cell" style="${task.checked ? 'text-decoration: line-through; color: #999;' : 'color: #333; font-weight: 500;'}">
                                    ${task.name}
                                    ${task.id === 10 ? '<span style="color: #FFD700; margin-left: 8px; font-size: 18px;">⭐</span>' : ''}
                                </div>
                                <div class="task-status-cell">
                                    ${task.checked ?
                                        '<span style="color: #4CAF50; font-weight: bold;">✓ Done</span>' :
                                        '<span style="color: #999;">Pending</span>'}
                                </div>
                                <div class="task-date-cell">
                                    ${task.checked ? new Date().toLocaleDateString() : ''}
                                </div>
                                <div style="font-size: 12px; color: #666;">
                                    ${task.id === 5 ? 'Make sure he fills out a supplemental' : ''}
                                    ${task.id === 10 ? 'Accounting / Send Thank You Card / Finance' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 10px; text-align: center;">
                    <div style="font-size: 14px; color: #666;">
                        <i class="fas fa-database"></i> Task states are stored uniquely for Policy #${policy.policyNumber}
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #999;">
                        Last updated: ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `;

        // FORCEFULLY REPLACE THE CONTENT
        tabContent.innerHTML = newTaskHTML;
        console.log(`✅ Tasks rebuilt for policy ${policy.policyNumber}`);
    }

    // Intercept ALL policy selections
    function interceptPolicySelection() {
        // Method 1: Override renewalsManager
        if (window.renewalsManager) {
            const originalSelect = window.renewalsManager.selectRenewal;
            window.renewalsManager.selectRenewal = function(policy) {
                console.log(`🎯 Policy selection intercepted: ${policy.policyNumber}`);

                // Call original
                if (originalSelect) {
                    originalSelect.call(this, policy);
                }

                // Force rebuild tasks if on tasks tab
                setTimeout(() => {
                    const activeTab = document.querySelector('.tab-btn.active');
                    if (activeTab && activeTab.textContent.includes('Tasks')) {
                        rebuildTaskDisplay(policy);
                    }
                }, 100);
            };

            // Also override tab switching
            const originalSwitchTab = window.renewalsManager.switchTab;
            window.renewalsManager.switchTab = function(tab) {
                console.log(`📑 Tab switch intercepted: ${tab}`);

                // Call original
                if (originalSwitchTab) {
                    originalSwitchTab.call(this, tab);
                }

                // If switching to tasks, rebuild
                if (tab === 'tasks' && this.selectedRenewal) {
                    setTimeout(() => {
                        rebuildTaskDisplay(this.selectedRenewal);
                    }, 100);
                }
            };
        }

        // Method 2: Global click listener
        document.addEventListener('click', function(e) {
            // Detect renewal item clicks
            const renewalItem = e.target.closest('.renewal-item');
            if (renewalItem) {
                setTimeout(() => {
                    if (window.renewalsManager?.selectedRenewal) {
                        const activeTab = document.querySelector('.tab-btn.active');
                        if (activeTab && activeTab.textContent.includes('Tasks')) {
                            rebuildTaskDisplay(window.renewalsManager.selectedRenewal);
                        }
                    }
                }, 200);
            }

            // Detect tab clicks
            if (e.target.classList.contains('tab-btn') && e.target.textContent.includes('Tasks')) {
                setTimeout(() => {
                    if (window.renewalsManager?.selectedRenewal) {
                        rebuildTaskDisplay(window.renewalsManager.selectedRenewal);
                    }
                }, 100);
            }
        }, true);
    }

    // Handle checkbox changes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('ultimate-task-checkbox')) {
            const policyNumber = e.target.dataset.ultimatePolicy;
            const taskId = parseInt(e.target.dataset.ultimateTask);
            const checked = e.target.checked;

            console.log(`☑️ Checkbox changed: Policy ${policyNumber}, Task ${taskId} = ${checked}`);

            // Update storage
            updatePolicyTask(policyNumber, taskId, checked);

            // Update UI
            const row = e.target.closest('.ultimate-task-row');
            if (row) {
                const nameCell = row.querySelector('.task-name-cell');
                const statusCell = row.querySelector('.task-status-cell');
                const dateCell = row.querySelector('.task-date-cell');

                if (checked) {
                    row.style.background = 'rgba(76,175,80,0.1)';
                    nameCell.style.textDecoration = 'line-through';
                    nameCell.style.color = '#999';
                    statusCell.innerHTML = '<span style="color: #4CAF50; font-weight: bold;">✓ Done</span>';
                    dateCell.textContent = new Date().toLocaleDateString();
                } else {
                    row.style.background = 'white';
                    nameCell.style.textDecoration = 'none';
                    nameCell.style.color = '#333';
                    statusCell.innerHTML = '<span style="color: #999;">Pending</span>';
                    dateCell.textContent = '';
                }

                // Special handling for Finalize Renewal (green stripe)
                if (taskId === 10) {
                    const renewalItems = document.querySelectorAll('.renewal-item');
                    renewalItems.forEach(item => {
                        const policyNum = item.querySelector('.policy-number');
                        if (policyNum && policyNum.textContent.includes(policyNumber)) {
                            item.style.borderLeft = checked ? '8px solid #4CAF50' : '4px solid #2196F3';
                        }
                    });
                }
            }
        }
    });

    // Wait for renewalsManager then start
    function initialize() {
        if (!window.renewalsManager) {
            setTimeout(initialize, 100);
            return;
        }

        console.log('🚀 Ultimate fix initialized');
        interceptPolicySelection();
    }

    initialize();

    // Indicator removed per user request

    console.log('✅ Each policy now has COMPLETELY SEPARATE task lists!');
})();