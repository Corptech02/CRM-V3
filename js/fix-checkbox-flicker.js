// FIX: Prevent checkbox flickering - keep them solid
console.log('🔧 Fixing checkbox flickering to keep them solid...');

(function() {
    // Add CSS to prevent transitions on checkboxes during load
    const style = document.createElement('style');
    style.textContent = `
        /* Prevent checkbox transitions during initial load */
        .loading-checkboxes input[type="checkbox"],
        .loading-checkboxes .task-item,
        .loading-checkboxes .checkbox-custom {
            transition: none !important;
            animation: none !important;
        }

        /* Keep checkboxes solid - no fade effects */
        .task-item input[type="checkbox"] {
            opacity: 1 !important;
            transition: none !important;
        }

        .task-item.completed {
            opacity: 1 !important;
        }

        /* Prevent any visual changes during state updates */
        .task-item.no-transition,
        .task-item.no-transition * {
            transition: none !important;
            animation: none !important;
        }
    `;
    document.head.appendChild(style);

    // Override showRenewalProfile to add loading class
    const originalShowProfile = window.showRenewalProfile;
    window.showRenewalProfile = function(policyId) {
        // Add loading class to prevent transitions
        document.body.classList.add('loading-checkboxes');

        // Call original
        if (originalShowProfile) {
            originalShowProfile.call(this, policyId);
        }

        // Remove loading class after everything is settled
        setTimeout(() => {
            document.body.classList.remove('loading-checkboxes');
        }, 500);
    };

    // Override renderTasksTab to render with correct states immediately
    const originalRenderTasks = window.renderTasksTab;
    window.renderTasksTab = function() {
        // Get the HTML from original function
        let html = '';
        if (originalRenderTasks) {
            html = originalRenderTasks.call(this);
        }

        // Add no-transition class to prevent flicker during render
        html = html.replace(/class="task-item/g, 'class="task-item no-transition');

        return html;
    };

    // Remove transition class after render is complete
    const originalToggleTask = window.toggleTask;
    window.toggleTask = function(taskId) {
        // Add no-transition during toggle
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => item.classList.add('no-transition'));

        // Call original
        if (originalToggleTask) {
            originalToggleTask.call(this, taskId);
        }

        // Remove no-transition after update
        setTimeout(() => {
            taskItems.forEach(item => item.classList.remove('no-transition'));
        }, 100);
    };

    // Monitor DOM for task list renders and prevent transitions
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check if tasks were added
                        if (node.classList && node.classList.contains('tasks-tab')) {
                            // Add no-transition to all task items immediately
                            const taskItems = node.querySelectorAll('.task-item');
                            taskItems.forEach(item => {
                                item.classList.add('no-transition');
                            });

                            // Remove after render settles
                            setTimeout(() => {
                                taskItems.forEach(item => {
                                    item.classList.remove('no-transition');
                                });
                            }, 200);
                        }
                    }
                });
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Override any functions that might cause visual updates
    const preventFlicker = () => {
        const checkboxes = document.querySelectorAll('.task-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            // Lock the visual state
            const parent = checkbox.closest('.task-item');
            if (parent) {
                parent.classList.add('no-transition');
                setTimeout(() => {
                    parent.classList.remove('no-transition');
                }, 50);
            }
        });
    };

    // Prevent flicker on profile tab switches
    const originalSwitchTab = window.switchProfileTab;
    window.switchProfileTab = function(tab) {
        if (tab === 'tasks') {
            document.body.classList.add('loading-checkboxes');
        }

        if (originalSwitchTab) {
            originalSwitchTab.call(this, tab);
        }

        if (tab === 'tasks') {
            setTimeout(() => {
                document.body.classList.remove('loading-checkboxes');
            }, 300);
        }
    };

    console.log('✅ Checkbox flicker prevention active - checkboxes will stay solid');
})();