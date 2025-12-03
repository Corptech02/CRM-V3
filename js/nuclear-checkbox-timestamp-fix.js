// NUCLEAR FIX: Use timestamps as source of truth for checkboxes
console.log('☢️ NUCLEAR: Using timestamps as source of truth for checkboxes...');

(function() {
    let currentPolicyNumber = null;
    let checkboxProtectionActive = false;

    // Override showRenewalProfile
    const originalShowProfile = window.showRenewalProfile;
    window.showRenewalProfile = function(policyId) {
        // Get policy number
        const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = allPolicies.find(p => p.id === policyId);
        currentPolicyNumber = policy ? (policy.policyNumber || policy.number || policyId) : policyId;

        console.log(`☢️ Loading policy: ${currentPolicyNumber}`);

        // Call original
        if (originalShowProfile) {
            originalShowProfile.call(this, policyId);
        }

        // Activate protection after profile loads
        setTimeout(() => activateCheckboxProtection(), 100);
        setTimeout(() => activateCheckboxProtection(), 500);
        setTimeout(() => activateCheckboxProtection(), 1000);
    };

    // Function to enforce checkbox states based on timestamps
    function activateCheckboxProtection() {
        if (!currentPolicyNumber) return;

        const storageKey = `renewalTasks_${currentPolicyNumber}`;
        const savedData = localStorage.getItem(storageKey);

        if (!savedData || savedData === 'null') {
            console.log('No saved data for this policy');
            return;
        }

        try {
            const tasks = JSON.parse(savedData);
            console.log(`☢️ Enforcing checkbox states for ${tasks.length} tasks`);

            tasks.forEach(task => {
                const checkbox = document.getElementById(`task-${task.id}`);
                if (checkbox) {
                    // USE TIMESTAMP AS SOURCE OF TRUTH
                    const shouldBeChecked = !!(task.completedAt && task.completedAt.trim() !== '');

                    if (shouldBeChecked !== checkbox.checked) {
                        checkbox.checked = shouldBeChecked;

                        // Also update the visual state
                        const taskItem = checkbox.closest('.task-item');
                        if (taskItem) {
                            if (shouldBeChecked) {
                                taskItem.classList.add('completed');
                            } else {
                                taskItem.classList.remove('completed');
                            }
                        }

                        console.log(`☢️ Fixed checkbox ${task.id}: ${shouldBeChecked} (has timestamp: ${task.completedAt})`);
                    }
                }
            });
        } catch (e) {
            console.error('Error enforcing checkboxes:', e);
        }

        checkboxProtectionActive = true;
    }

    // Override renderTasksTab to use timestamps as truth
    const originalRenderTasks = window.renderTasksTab;
    window.renderTasksTab = function() {
        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';

        const defaultTasks = [
            { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
            { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
            { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
            { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
            { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
            { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
            { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
            { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
            { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
            { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
        ];

        let tasks = defaultTasks;
        const savedData = localStorage.getItem(storageKey);

        if (savedData && savedData !== 'null') {
            try {
                const savedTasks = JSON.parse(savedData);
                if (savedTasks && savedTasks.length > 0) {
                    tasks = savedTasks;

                    // FIX INCONSISTENCIES: Use timestamp as source of truth
                    tasks = tasks.map(task => {
                        const hasTimestamp = !!(task.completedAt && task.completedAt.trim() !== '');
                        return {
                            ...task,
                            completed: hasTimestamp  // Force completed based on timestamp
                        };
                    });

                    // Save the corrected state
                    localStorage.setItem(storageKey, JSON.stringify(tasks));
                    console.log(`☢️ Fixed task states based on timestamps`);
                }
            } catch (e) {
                console.error('Error loading tasks:', e);
            }
        }

        return `
            <div class="tasks-tab">
                <div class="tasks-header">
                    <h3>Renewal Tasks Checklist</h3>
                    <div class="tasks-actions">
                        <button class="btn-small" onclick="clearAllTasks()">
                            <i class="fas fa-redo"></i> Reset Tasks
                        </button>
                        <button class="btn-small" onclick="addRenewalTask()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                </div>
                <div class="tasks-list">
                    ${tasks.map((task) => {
                        // USE TIMESTAMP TO DETERMINE CHECKED STATE
                        const isChecked = !!(task.completedAt && task.completedAt.trim() !== '');

                        return `
                            <div class="task-item ${isChecked ? 'completed' : ''}" data-task-id="${task.id}">
                                <div class="task-checkbox">
                                    <input type="checkbox"
                                           id="task-${task.id}"
                                           ${isChecked ? 'checked' : ''}
                                           onchange="toggleTask(${task.id})">
                                    <label for="task-${task.id}">
                                        <span class="checkbox-custom"></span>
                                        ${task.task}
                                    </label>
                                </div>
                                <div class="task-status">
                                    ${task.completedAt ?
                                        `<span class="completion-time"><i class="fas fa-check"></i> ${task.completedAt}</span>` :
                                        '<span class="status-pending">Pending</span>'}
                                </div>
                                <div class="task-notes">
                                    <textarea class="notes-input"
                                              placeholder="Add notes..."
                                              onblur="saveTaskNote(${task.id}, this.value)">${task.notes || ''}</textarea>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    };

    // Override toggleTask to maintain consistency
    window.toggleTask = function(taskId) {
        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';

        let tasks = [
            { id: 1, task: 'Request Updates from Client', completed: false, completedAt: '', notes: '' },
            { id: 2, task: 'Updates Received', completed: false, completedAt: '', notes: '' },
            { id: 3, task: 'Request Loss Runs', completed: false, completedAt: '', notes: '' },
            { id: 4, task: 'Loss Runs Received', completed: false, completedAt: '', notes: '' },
            { id: 5, task: 'Create Applications', completed: false, completedAt: '', notes: 'Make sure he fills out a supplemental' },
            { id: 6, task: 'Create Proposal', completed: false, completedAt: '', notes: '' },
            { id: 7, task: 'Send Proposal', completed: false, completedAt: '', notes: '' },
            { id: 8, task: 'Signed Docs Received', completed: false, completedAt: '', notes: '' },
            { id: 9, task: 'Bind Order', completed: false, completedAt: '', notes: '' },
            { id: 10, task: 'Finalize Renewal', completed: false, completedAt: '', notes: 'Accounting / Send Thank You Card / Finance' }
        ];

        const savedData = localStorage.getItem(storageKey);
        if (savedData && savedData !== 'null') {
            try {
                tasks = JSON.parse(savedData);
            } catch (e) {
                console.error('Error loading tasks:', e);
            }
        }

        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const checkbox = document.getElementById(`task-${taskId}`);
            const newState = checkbox ? checkbox.checked : !task.completed;

            task.completed = newState;
            task.completedAt = newState ? new Date().toLocaleString() : '';

            console.log(`☢️ Task ${taskId}: completed=${task.completed}, timestamp=${task.completedAt}`);

            // Save immediately
            localStorage.setItem(storageKey, JSON.stringify(tasks));

            // Update visual state
            const taskItem = checkbox?.closest('.task-item');
            if (taskItem) {
                if (newState) {
                    taskItem.classList.add('completed');
                } else {
                    taskItem.classList.remove('completed');
                }
            }
        }

        // Refresh display
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderTasksTab();

            // Reactivate protection
            setTimeout(() => activateCheckboxProtection(), 50);
        }
    };

    // Continuous protection - monitor for unwanted changes - DISABLED - Causing flickering every 200ms
    // setInterval(() => {
        if (checkboxProtectionActive && currentPolicyNumber) {
            const storageKey = `renewalTasks_${currentPolicyNumber}`;
            const savedData = localStorage.getItem(storageKey);

            if (savedData && savedData !== 'null') {
                try {
                    const tasks = JSON.parse(savedData);
                    let needsCorrection = false;

                    tasks.forEach(task => {
                        const checkbox = document.getElementById(`task-${task.id}`);
                        if (checkbox) {
                            const shouldBeChecked = !!(task.completedAt && task.completedAt.trim() !== '');

                            if (shouldBeChecked !== checkbox.checked) {
                                checkbox.checked = shouldBeChecked;
                                needsCorrection = true;

                                const taskItem = checkbox.closest('.task-item');
                                if (taskItem) {
                                    if (shouldBeChecked) {
                                        taskItem.classList.add('completed');
                                    } else {
                                        taskItem.classList.remove('completed');
                                    }
                                }
                            }
                        }
                    });

                    if (needsCorrection) {
                        console.log('☢️ Corrected checkbox states based on timestamps');
                    }
                } catch (e) {
                    // Silent fail
                }
            }
        }
    // }, 200); // DISABLED ABOVE - Causing flickering every 200ms

    // Override saveTaskNote
    window.saveTaskNote = function(taskId, note) {
        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';

        let tasks = [];
        const savedData = localStorage.getItem(storageKey);

        if (savedData && savedData !== 'null') {
            try {
                tasks = JSON.parse(savedData);
            } catch (e) {
                return;
            }
        } else {
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.notes = note;
            localStorage.setItem(storageKey, JSON.stringify(tasks));
        }
    };

    // Override clearAllTasks
    window.clearAllTasks = function() {
        if (confirm('Are you sure you want to reset all tasks? This will clear all checkmarks and timestamps.')) {
            const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';
            localStorage.removeItem(storageKey);

            const tabContent = document.getElementById('profileTabContent');
            if (tabContent) {
                tabContent.innerHTML = renderTasksTab();
            }
        }
    };

    console.log('☢️ NUCLEAR checkbox-timestamp fix active - timestamps are source of truth');
})();