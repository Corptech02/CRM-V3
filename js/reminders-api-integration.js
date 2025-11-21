// Reminders/Tasks API Integration
console.log('Loading Reminders API Integration...');

document.addEventListener('DOMContentLoaded', function() {
    initializeRemindersAPIIntegration();
});

function initializeRemindersAPIIntegration() {
    console.log('Reminders API Integration Ready');

    // Override todo loading
    if (window.loadTodos) {
        const originalLoadTodos = window.loadTodos;
        window.loadTodos = async function() {
            console.log('Loading todos/reminders from comprehensive API...');

            try {
                // Use API service to get reminders
                if (window.apiService && window.apiService.getReminders) {
                    const reminders = await window.apiService.getReminders();
                    console.log(`Loaded ${reminders.length} reminders from API`);

                    // Convert reminders to todo format and store in localStorage
                    const personalTodos = reminders.filter(r => r.type === 'personal' || !r.type);
                    const agencyTodos = reminders.filter(r => r.type === 'agency');

                    localStorage.setItem('personalTodos', JSON.stringify(personalTodos));
                    localStorage.setItem('agencyTodos', JSON.stringify(agencyTodos));

                    // Update the todo display
                    displayTodosFromData(personalTodos, agencyTodos);

                } else {
                    // Fall back to original function
                    originalLoadTodos();
                }
            } catch (error) {
                console.error('Failed to load reminders from API:', error);
                // Fall back to original function
                originalLoadTodos();
            }
        };
    }

    // Override todo creation
    const originalAddTodo = window.addTodo;
    if (originalAddTodo) {
        window.addTodo = async function(type) {
            const input = document.getElementById(`${type}TodoInput`);
            if (!input || !input.value.trim()) return;

            const todoText = input.value.trim();
            input.value = '';

            try {
                // Use API service to create reminder
                if (window.apiService && window.apiService.createReminder) {
                    const reminderData = {
                        title: todoText,
                        type: type,
                        status: 'pending',
                        created_date: new Date().toISOString(),
                        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
                        priority: 'medium',
                        description: ''
                    };

                    const newReminder = await window.apiService.createReminder(reminderData);
                    console.log('Reminder created via API:', newReminder);

                    // Add to local storage for immediate display
                    const storageKey = `${type}Todos`;
                    const existingTodos = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    existingTodos.push(newReminder);
                    localStorage.setItem(storageKey, JSON.stringify(existingTodos));

                    // Refresh todo display
                    if (window.loadTodos) {
                        window.loadTodos();
                    }

                    if (window.showNotification) {
                        window.showNotification('Reminder added successfully!', 'success');
                    }

                } else {
                    // Fall back to original function
                    originalAddTodo(type);
                }

            } catch (error) {
                console.error('Failed to add reminder via API:', error);
                if (window.showNotification) {
                    window.showNotification('Failed to add reminder: ' + error.message, 'error');
                }

                // Fall back to original function
                originalAddTodo(type);
            }
        };
    }

    // Override todo completion
    const originalCompleteTodo = window.completeTodo;
    if (originalCompleteTodo) {
        window.completeTodo = async function(type, index) {
            try {
                // Get the todo from localStorage
                const storageKey = `${type}Todos`;
                const todos = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const todo = todos[index];

                if (!todo) {
                    console.error('Todo not found:', index);
                    return;
                }

                // Update via API if available
                if (window.apiService && window.apiService.updateReminder && todo.id) {
                    await window.apiService.updateReminder(todo.id, {
                        ...todo,
                        status: 'completed',
                        completed_date: new Date().toISOString()
                    });

                    console.log('Reminder completed via API:', todo.id);
                }

                // Update localStorage
                todos[index] = { ...todo, completed: true, status: 'completed' };
                localStorage.setItem(storageKey, JSON.stringify(todos));

                // Refresh display
                if (window.loadTodos) {
                    window.loadTodos();
                }

                if (window.showNotification) {
                    window.showNotification('Task completed!', 'success');
                }

            } catch (error) {
                console.error('Failed to complete reminder via API:', error);
                // Fall back to original function
                originalCompleteTodo(type, index);
            }
        };
    }

    // Override todo deletion
    const originalDeleteTodo = window.deleteTodo;
    if (originalDeleteTodo) {
        window.deleteTodo = async function(type, index) {
            try {
                // Get the todo from localStorage
                const storageKey = `${type}Todos`;
                const todos = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const todo = todos[index];

                if (!todo) {
                    console.error('Todo not found:', index);
                    return;
                }

                // Delete via API if available
                if (window.apiService && window.apiService.deleteReminder && todo.id) {
                    await window.apiService.deleteReminder(todo.id);
                    console.log('Reminder deleted via API:', todo.id);
                }

                // Remove from localStorage
                todos.splice(index, 1);
                localStorage.setItem(storageKey, JSON.stringify(todos));

                // Refresh display
                if (window.loadTodos) {
                    window.loadTodos();
                }

                if (window.showNotification) {
                    window.showNotification('Task deleted!', 'success');
                }

            } catch (error) {
                console.error('Failed to delete reminder via API:', error);
                // Fall back to original function
                originalDeleteTodo(type, index);
            }
        };
    }

    console.log('✅ Reminders API Integration initialized');
}

// Display todos from data
function displayTodosFromData(personalTodos, agencyTodos) {
    const personalList = document.getElementById('personalTodoList');
    const agencyList = document.getElementById('agencyTodoList');

    if (personalList) {
        personalList.innerHTML = personalTodos.map((todo, index) => `
            <div class="todo-item ${todo.completed || todo.status === 'completed' ? 'completed' : ''}">
                <div class="todo-content">
                    <span class="todo-text">${todo.title || todo.text || 'No title'}</span>
                    ${todo.priority ? `<span class="todo-priority priority-${todo.priority}">${todo.priority}</span>` : ''}
                    ${todo.due_date ? `<span class="todo-due">Due: ${new Date(todo.due_date).toLocaleDateString()}</span>` : ''}
                </div>
                <div class="todo-actions">
                    ${!(todo.completed || todo.status === 'completed') ? `
                        <button onclick="completeTodo('personal', ${index})" class="btn-small btn-success">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button onclick="deleteTodo('personal', ${index})" class="btn-small btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    if (agencyList) {
        agencyList.innerHTML = agencyTodos.map((todo, index) => `
            <div class="todo-item ${todo.completed || todo.status === 'completed' ? 'completed' : ''}">
                <div class="todo-content">
                    <span class="todo-text">${todo.title || todo.text || 'No title'}</span>
                    ${todo.priority ? `<span class="todo-priority priority-${todo.priority}">${todo.priority}</span>` : ''}
                    ${todo.due_date ? `<span class="todo-due">Due: ${new Date(todo.due_date).toLocaleDateString()}</span>` : ''}
                </div>
                <div class="todo-actions">
                    ${!(todo.completed || todo.status === 'completed') ? `
                        <button onclick="completeTodo('agency', ${index})" class="btn-small btn-success">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button onclick="deleteTodo('agency', ${index})" class="btn-small btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Add API methods to apiService if not present
if (window.apiService && !window.apiService.deleteReminder) {
    window.apiService.deleteReminder = async function(reminderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting reminder:', error);
            throw error;
        }
    };

    window.apiService.updateReminder = async function(reminderId, reminderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(reminderData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating reminder:', error);
            throw error;
        }
    };
}

// Make functions globally available
window.displayTodosFromData = displayTodosFromData;

console.log('✅ Reminders API Integration loaded');