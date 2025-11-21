// Authentication Service for Vanguard Insurance
const authService = {
    // API URLs - Updated to use comprehensive API
    AUTH_API_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:8897'
        : window.location.hostname.includes('github.io')
        ? 'https://vanguard-insurance-api.loca.lt'
        : 'http://162.220.14.239:8897'
    
    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;
        
        // Token expiry check disabled temporarily for testing
        // Just check if token exists
        return true;
        
        // Original expiry check code - disabled
        // try {
        //     const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        //     // Token is valid for 8 hours
        //     const tokenAge = Date.now() - (userInfo.loginTime || 0);
        //     if (tokenAge > 8 * 60 * 60 * 1000) {
        //         this.logout();
        //         return false;
        //     }
        //     return true;
        // } catch {
        //     return false;
        // }
    },
    
    // Get current user info
    getCurrentUser() {
        if (!this.isAuthenticated()) return null;
        return JSON.parse(localStorage.getItem('userInfo') || '{}');
    },
    
    // Get auth token
    getToken() {
        return localStorage.getItem('authToken');
    },
    
    // Login
    async login(username, password) {
        try {
            // Use the new API service for login
            if (window.apiService && window.apiService.login) {
                return await window.apiService.login(username, password);
            }

            // Fallback to direct API call
            const response = await fetch(`${this.AUTH_API_URL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();

            // Store token and user info
            localStorage.setItem('authToken', data.access_token || data.token);
            const userInfo = {
                ...(data.user || data.user_info || {}),
                loginTime: Date.now()
            };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    // Register
    async register(userData) {
        try {
            // Use the new API service for registration
            if (window.apiService && window.apiService.register) {
                return await window.apiService.register(userData);
            }

            // Fallback to direct API call
            const response = await fetch(`${this.AUTH_API_URL}/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },
    
    // Logout
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        window.location.href = 'login.html';
    },
    
    // Check authentication and redirect if needed
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },
    
    // Get authorization headers
    getAuthHeaders() {
        const token = this.getToken();
        if (!token) return {};
        
        return {
            'Authorization': `Bearer ${token}`
        };
    },
    
    // Check if user has permission
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // Admin has all permissions
        if (user.role === 'admin' || (user.permissions && user.permissions.includes('all'))) {
            return true;
        }
        
        return user.permissions && user.permissions.includes(permission);
    },
    
    // Display user info in UI
    displayUserInfo() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        // Update any user display elements
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = user.full_name || user.username;
        });
        
        const userRoleElements = document.querySelectorAll('.user-role');
        userRoleElements.forEach(el => {
            el.textContent = user.role;
        });
        
        // Update the existing user menu instead of adding a new button
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            // Update the user menu with actual user info
            userMenu.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=0066cc&color=fff" alt="User" class="user-avatar">
                <span>${user.full_name || user.username}</span>
                <i class="fas fa-chevron-down"></i>
            `;
            
            // Create dropdown menu if it doesn't exist
            if (!userMenu.querySelector('.user-dropdown')) {
                const dropdown = document.createElement('div');
                dropdown.className = 'user-dropdown';
                dropdown.style.cssText = `
                    display: none;
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    min-width: 200px;
                    z-index: 1000;
                    margin-top: 5px;
                `;
                
                dropdown.innerHTML = `
                    <div style="padding: 15px; border-bottom: 1px solid #eee;">
                        <div style="font-weight: 600; color: #333;">${user.full_name || user.username}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">Role: ${user.role}</div>
                        <div style="font-size: 12px; color: #666;">${user.email || ''}</div>
                    </div>
                    <div style="padding: 10px;">
                        <button id="profileBtn" style="width: 100%; padding: 8px; background: none; border: none; text-align: left; cursor: pointer; hover: background: #f5f5f5;">
                            <i class="fas fa-user"></i> View Profile
                        </button>
                        <button id="settingsBtn" style="width: 100%; padding: 8px; background: none; border: none; text-align: left; cursor: pointer;">
                            <i class="fas fa-cog"></i> Settings
                        </button>
                        <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">
                        <button id="logoutBtn" style="width: 100%; padding: 8px; background: none; border: none; text-align: left; cursor: pointer; color: #dc3545;">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                `;
                
                userMenu.appendChild(dropdown);
                userMenu.style.position = 'relative';
                userMenu.style.cursor = 'pointer';
                
                // Toggle dropdown on click
                userMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = dropdown.style.display === 'block';
                    dropdown.style.display = isVisible ? 'none' : 'block';
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                });
                
                // Add logout functionality
                dropdown.querySelector('#logoutBtn').onclick = (e) => {
                    e.stopPropagation();
                    this.logout();
                };
                
                // Profile and settings placeholders
                dropdown.querySelector('#profileBtn').onclick = (e) => {
                    e.stopPropagation();
                    alert(`User Profile:\n\nUsername: ${user.username}\nName: ${user.full_name || 'Not set'}\nEmail: ${user.email || 'Not set'}\nRole: ${user.role}\nDepartment: ${user.department || 'Not set'}`);
                };
                
                dropdown.querySelector('#settingsBtn').onclick = (e) => {
                    e.stopPropagation();
                    alert('Settings page coming soon!');
                };
            }
        }
    },
    
    // Initialize auth check on page load
    init() {
        // Pages that don't require auth
        const publicPages = ['login.html', 'register.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (!publicPages.includes(currentPage)) {
            // Temporarily disabled - uncomment to enable auth requirement
            // if (!this.requireAuth()) {
            //     return false;
            // }
            
            // Display user info if authenticated
            if (this.isAuthenticated()) {
                this.displayUserInfo();
            }
            
            // Setup periodic token check - disabled for now
            // setInterval(() => {
            //     if (!this.isAuthenticated()) {
            //         alert('Your session has expired. Please login again.');
            //         this.logout();
            //     }
            // }, 60000); // Check every minute
        }
        
        return true;
    },
    
    // Migrate localStorage data to server
    async migrateLocalData() {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            // Get local data
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
            const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');

            // Only migrate if there's data
            if (localLeads.length || localClients.length || localPolicies.length) {
                console.log('Migrating local data to comprehensive API server...');

                const headers = {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    ...this.getAuthHeaders()
                };

                // Migrate leads using the new API service
                if (window.apiService) {
                    for (const lead of localLeads) {
                        try {
                            await window.apiService.createLead({
                                ...lead,
                                assigned_to: user.id
                            });
                        } catch (error) {
                            console.warn('Failed to migrate lead:', lead.id, error);
                        }
                    }

                    // Migrate policies
                    for (const policy of localPolicies) {
                        try {
                            await window.apiService.createPolicy({
                                ...policy,
                                user_id: user.id
                            });
                        } catch (error) {
                            console.warn('Failed to migrate policy:', policy.id, error);
                        }
                    }
                }

                console.log('Data migration completed');

                // Mark data as migrated but don't remove immediately
                localStorage.setItem('dataMigrated', 'true');
            }
        } catch (error) {
            console.error('Data migration failed:', error);
        }
    }
};

// Initialize auth service when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authService.init());
} else {
    authService.init();
}

// Make authService globally available
window.authService = authService;