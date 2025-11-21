// FIX: Isolate task timestamps per policy
console.log('🔧 Fixing task timestamp isolation per policy...');

(function() {
    // Store current policy number globally for task functions to access
    let currentPolicyNumber = null;

    // Override showRenewalProfile to capture policy number
    const originalShowProfile = window.showRenewalProfile;
    window.showRenewalProfile = function(policyId) {
        // Get policy data first to extract policy number
        const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = allPolicies.find(p => p.id === policyId);

        if (policy) {
            currentPolicyNumber = policy.policyNumber || policy.number || policyId;
            console.log(`📋 Setting current policy number: ${currentPolicyNumber}`);
        } else {
            currentPolicyNumber = policyId;
        }

        // Call original function
        if (originalShowProfile) {
            originalShowProfile.call(this, policyId);
        }
    };

    // Override renderTasksTab to use policy-specific storage
    const originalRenderTasks = window.renderTasksTab;
    window.renderTasksTab = function() {
        console.log(`📋 Rendering tasks for policy: ${currentPolicyNumber}`);

        // Get policy-specific tasks
        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';
        const savedTasks = JSON.parse(localStorage.getItem(storageKey) || 'null');

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

        const tasks = savedTasks || defaultTasks;

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
                    ${tasks.map((task, index) => `
                        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id || index}">
                            <div class="task-checkbox">
                                <input type="checkbox"
                                       id="task-${task.id || index}"
                                       ${task.completed ? 'checked' : ''}
                                       onchange="toggleTask(${task.id || index})">
                                <label for="task-${task.id || index}">
                                    <span class="checkbox-custom"></span>
                                    ${task.task}
                                </label>
                            </div>
                            <div class="task-status">
                                ${task.completed && task.completedAt ?
                                    `<span class="completion-time"><i class="fas fa-check"></i> ${task.completedAt}</span>` :
                                    '<span class="status-pending">Pending</span>'}
                            </div>
                            <div class="task-notes">
                                <textarea class="notes-input"
                                          placeholder="Add notes..."
                                          onblur="saveTaskNote(${task.id || index}, this.value)">${task.notes || ''}</textarea>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    // Override toggleTask to use policy-specific storage
    window.toggleTask = function(taskId) {
        if (!currentPolicyNumber) {
            console.warn('No policy number set, using default storage');
        }

        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';
        let tasks = JSON.parse(localStorage.getItem(storageKey) || '[]');

        if (tasks.length === 0) {
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
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toLocaleString() : '';
            localStorage.setItem(storageKey, JSON.stringify(tasks));

            console.log(`✅ Task ${taskId} toggled for policy ${currentPolicyNumber}: ${task.completed ? 'completed' : 'uncompleted'}`);
        }

        // Refresh the tasks tab
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent) {
            tabContent.innerHTML = renderTasksTab();
        }
    };

    // Override saveTaskNote to use policy-specific storage
    window.saveTaskNote = function(taskId, note) {
        const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';
        let tasks = JSON.parse(localStorage.getItem(storageKey) || '[]');

        if (tasks.length === 0) {
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

    // Override clearAllTasks to use policy-specific storage
    window.clearAllTasks = function() {
        if (confirm('Are you sure you want to reset all tasks? This will clear all checkmarks and timestamps.')) {
            const storageKey = currentPolicyNumber ? `renewalTasks_${currentPolicyNumber}` : 'renewalTasks';

            // Reset to defaults
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

            localStorage.setItem(storageKey, JSON.stringify(defaultTasks));

            // Refresh the tasks tab
            const tabContent = document.getElementById('profileTabContent');
            if (tabContent) {
                tabContent.innerHTML = renderTasksTab();
            }

            console.log(`🗑️ Tasks cleared for policy ${currentPolicyNumber}`);
        }
    };

    console.log('✅ Task timestamp isolation fix active');
})();