// FIX: Ensure checkboxes persist when returning to renewal profiles
console.log('🔧 Fixing checkbox persistence for renewal tasks...');

(function() {
    // Store current policy number globally
    let currentPolicyNumber = null;

    // Override showRenewalProfile to capture policy number
    const originalShowProfile = window.showRenewalProfile;
    window.showRenewalProfile = function(policyId) {
        // Get policy data to extract policy number
        const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = allPolicies.find(p => p.id === policyId);

        if (policy) {
            currentPolicyNumber = policy.policyNumber || policy.number || policyId;
            console.log(`📋 Loading renewal profile for policy: ${currentPolicyNumber}`);

            // Debug: Check what's in storage for this policy
            const storageKey = `renewalTasks_${currentPolicyNumber}`;
            const savedTasks = localStorage.getItem(storageKey);
            console.log(`📦 Saved tasks for ${currentPolicyNumber}:`, savedTasks);
        } else {
            currentPolicyNumber = policyId;
        }

        // Call original function
        if (originalShowProfile) {
            originalShowProfile.call(this, policyId);
        }
    };

    // Override renderTasksTab with better persistence
    const originalRenderTasks = window.renderTasksTab;
    window.renderTasksTab = function() {
        console.log(`📋 Rendering tasks for policy: ${currentPolicyNumber}`);

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

        // Get policy-specific tasks
        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';
        let savedTasks = null;

        try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData && savedData !== 'null' && savedData !== 'undefined') {
                savedTasks = JSON.parse(savedData);
                console.log(`✅ Found ${savedTasks.length} saved tasks for ${currentPolicyNumber}`);

                // Log the completed state of each task
                savedTasks.forEach(task => {
                    if (task.completed) {
                        console.log(`   ✓ Task ${task.id}: "${task.task}" is completed (${task.completedAt})`);
                    }
                });
            }
        } catch (e) {
            console.error('Error loading saved tasks:', e);
        }

        // Use saved tasks if they exist, otherwise use defaults
        const tasks = savedTasks && savedTasks.length > 0 ? savedTasks : defaultTasks;

        // Generate HTML with proper checkbox states
        const html = `
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
                    ${tasks.map((task, index) => {
                        const isChecked = task.completed === true;
                        const checkedAttr = isChecked ? 'checked="checked"' : '';

                        console.log(`   Rendering task ${task.id}: completed=${task.completed}, checked=${isChecked}`);

                        return `
                            <div class="task-item ${isChecked ? 'completed' : ''}" data-task-id="${task.id || index}">
                                <div class="task-checkbox">
                                    <input type="checkbox"
                                           id="task-${task.id || index}"
                                           ${checkedAttr}
                                           data-completed="${isChecked}"
                                           onchange="toggleTask(${task.id || index})">
                                    <label for="task-${task.id || index}">
                                        <span class="checkbox-custom"></span>
                                        ${task.task}
                                    </label>
                                </div>
                                <div class="task-status">
                                    ${isChecked && task.completedAt ?
                                        `<span class="completion-time"><i class="fas fa-check"></i> ${task.completedAt}</span>` :
                                        '<span class="status-pending">Pending</span>'}
                                </div>
                                <div class="task-notes">
                                    <textarea class="notes-input"
                                              placeholder="Add notes..."
                                              onblur="saveTaskNote(${task.id || index}, this.value)">${task.notes || ''}</textarea>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        return html;
    };

    // Override toggleTask with better state management
    window.toggleTask = function(taskId) {
        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';

        // Get existing tasks or initialize with defaults
        let tasks;
        const savedData = localStorage.getItem(storageKey);

        if (savedData && savedData !== 'null' && savedData !== 'undefined') {
            try {
                tasks = JSON.parse(savedData);
            } catch (e) {
                console.error('Error parsing saved tasks:', e);
                tasks = null;
            }
        }

        if (!tasks || tasks.length === 0) {
            // Initialize with defaults
            tasks = [
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
        }

        // Find and toggle the task
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toLocaleString() : '';

            console.log(`✅ Task ${taskId} toggled: completed=${task.completed}, timestamp=${task.completedAt}`);

            // Save to localStorage
            localStorage.setItem(storageKey, JSON.stringify(tasks));

            // Verify it was saved
            const verification = localStorage.getItem(storageKey);
            console.log(`💾 Saved to ${storageKey}:`, verification);
        }

        // Refresh the tasks tab
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderTasksTab();

            // Force re-check the checkboxes after render
            setTimeout(() => {
                tasks.forEach(task => {
                    if (task.completed) {
                        const checkbox = document.getElementById(`task-${task.id}`);
                        if (checkbox && !checkbox.checked) {
                            checkbox.checked = true;
                            console.log(`🔄 Force-checked task ${task.id}`);
                        }
                    }
                });
            }, 50);
        }
    };

    // Override saveTaskNote with proper storage
    window.saveTaskNote = function(taskId, note) {
        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';

        let tasks;
        const savedData = localStorage.getItem(storageKey);

        if (savedData && savedData !== 'null' && savedData !== 'undefined') {
            try {
                tasks = JSON.parse(savedData);
            } catch (e) {
                tasks = null;
            }
        }

        if (!tasks || tasks.length === 0) {
            // Initialize with defaults
            tasks = [
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

            // Clear storage for this policy
            localStorage.removeItem(storageKey);
            console.log(`🗑️ Cleared tasks for policy ${currentPolicyNumber}`);

            // Refresh the tasks tab
            const tabContent = document.getElementById('profileTabContent');
            if (tabContent) {
                tabContent.innerHTML = renderTasksTab();
            }
        }
    };

    // Also ensure checkboxes are restored when switching tabs
    const originalSwitchTab = window.switchProfileTab;
    window.switchProfileTab = function(tab) {
        if (originalSwitchTab) {
            originalSwitchTab.call(this, tab);
        }

        // If switching back to tasks tab, ensure checkboxes are properly checked
        if (tab === 'tasks') {
            setTimeout(() => {
                const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';
                const savedData = localStorage.getItem(storageKey);

                if (savedData && savedData !== 'null') {
                    try {
                        const tasks = JSON.parse(savedData);
                        tasks.forEach(task => {
                            if (task.completed) {
                                const checkbox = document.getElementById(`task-${task.id}`);
                                if (checkbox && !checkbox.checked) {
                                    checkbox.checked = true;
                                    console.log(`🔄 Restored checked state for task ${task.id}`);
                                }
                            }
                        });
                    } catch (e) {
                        console.error('Error restoring checkboxes:', e);
                    }
                }
            }, 100);
        }
    };

    console.log('✅ Checkbox persistence fix active');
})();