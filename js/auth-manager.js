// Authentication Manager for Vanguard AMS
(function() {
    'use strict';

    // Check if user is authenticated
    function checkAuth() {
        // Check for session data in sessionStorage (from login.html)
        const sessionData = sessionStorage.getItem('vanguard_user');

        if (!sessionData) {
            window.location.href = '/login.html';
            return false;
        }

        try {
            const user = JSON.parse(sessionData);
            console.log('User data from sessionStorage:', user); // Debug log

            // Validate user object structure
            if (!user || !user.username) {
                console.error('Invalid session data structure:', user);
                sessionStorage.removeItem('vanguard_user');
                window.location.href = '/login.html';
                return false;
            }

            console.log('User authenticated:', user); // Debug log

            // Control admin UI elements
            controlAdminUI(user.username);

            return user;
        } catch (error) {
            console.error('Error reading session data:', error);
            // Clear corrupted session data
            sessionStorage.removeItem('vanguard_user');
            window.location.href = '/login.html';
            return false;
        }
    }

    // Extract username from email for display
    function extractUsernameFromEmail(email) {
        if (!email) return 'User';

        // Handle specific emails
        if (email.includes('grant.corp')) return 'grant';
        if (email.includes('maureen')) return 'maureen';
        if (email.includes('uigtest')) return 'uigtest';

        // Extract username part from email
        return email.split('@')[0].toLowerCase();
    }

    // Logout function
    function logout() {
        // Clear all session data
        sessionStorage.removeItem('vanguard_user');
        window.location.href = '/login.html';
    }

    // Check if user is admin
    function isAdmin(username) {
        const adminUsers = ['grant', 'maureen'];
        return adminUsers.includes(username.toLowerCase());
    }

    // Display user info in header
    function displayUserInfo() {
        const user = checkAuth();
        if (!user) return;

        // Wait for DOM to be ready
        const setupUserDisplay = () => {
            // Find or create user info element
            let userInfoElement = document.getElementById('userInfoDisplay');

            if (!userInfoElement) {
                // Try to find the header
                const header = document.querySelector('.top-header') || document.querySelector('.dashboard-header');

                if (header) {
                    // Create admin badge if user is admin
                    const adminBadge = isAdmin(user.username) ? `
                        <span style="
                            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                            color: white;
                            padding: 4px 8px;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            border: 1px solid rgba(255,255,255,0.3);
                        ">
                            <i class="fas fa-crown" style="margin-right: 4px;"></i>ADMIN
                        </span>
                    ` : '';

                    // Create user info display
                    userInfoElement = document.createElement('div');
                    userInfoElement.id = 'userInfoDisplay';
                    userInfoElement.style.cssText = `
                        position: absolute;
                        right: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        color: white;
                        font-size: 14px;
                        z-index: 1000;
                    `;

                    userInfoElement.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 30px;">
                            <i class="fas fa-user-circle" style="font-size: 20px;"></i>
                            <span style="font-weight: 500;">${user.username}</span>
                            ${adminBadge}
                        </div>
                        <button onclick="logout()" style="
                            background: rgba(255,255,255,0.2);
                            border: 1px solid rgba(255,255,255,0.3);
                            color: white;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                            transition: all 0.3s;
                        " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                           onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <i class="fas fa-sign-out-alt" style="margin-right: 6px;"></i>
                            Logout
                        </button>
                    `;

                    // Make header relative if it's not already
                    if (getComputedStyle(header).position === 'static') {
                        header.style.position = 'relative';
                    }

                    header.appendChild(userInfoElement);
                }
            }
        };

        // Try to set up immediately
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setupUserDisplay();
        }

        // Also try after DOM loads
        document.addEventListener('DOMContentLoaded', setupUserDisplay);

        // And after a short delay for dynamic content
        setTimeout(setupUserDisplay, 1000);
        setTimeout(setupUserDisplay, 2000);
    }

    // Set current user as default assigned agent
    function setDefaultAssignedAgent() {
        const user = checkAuth();
        if (!user) return;

        // Wait for forms to load
        const setDefaults = () => {
            // Find all agent select dropdowns
            const agentSelects = document.querySelectorAll('select[name="assignedTo"], select#leadAssignedTo, select#clientAssignedTo');

            agentSelects.forEach(select => {
                // Check if user's name is an option
                const options = Array.from(select.options);
                const userOption = options.find(opt => opt.value === user.username);

                if (userOption && !select.value) {
                    select.value = user.username;
                }
            });
        };

        // Set up observer for dynamically added forms
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    setDefaults();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial setup
        setTimeout(setDefaults, 500);
    }

    // Control admin UI visibility based on user role
    function controlAdminUI(username) {
        console.log('AUTH-MANAGER: controlAdminUI called with username:', username);

        const isAdmin = (username) => {
            const adminUsers = ['grant', 'maureen'];
            const isAdminUser = adminUsers.includes(username.toLowerCase());
            console.log('AUTH-MANAGER: Checking admin status for:', username, '-> isAdmin:', isAdminUser);
            return isAdminUser;
        };

        // Wait for DOM to be ready before manipulating elements
        const applyAdminControls = () => {
            console.log('AUTH-MANAGER: Applying admin controls...');

            // Find Administration section in sidebar
            const menuSections = document.querySelectorAll('.sidebar-menu .menu-section');
            console.log('AUTH-MANAGER: Found menu sections:', menuSections.length);

            let administrationSectionFound = false;

            menuSections.forEach((section, index) => {
                const heading = section.querySelector('h3');
                if (heading) {
                    console.log(`AUTH-MANAGER: Section ${index} heading:`, heading.textContent.trim());

                    if (heading.textContent.trim() === 'Administration') {
                        administrationSectionFound = true;
                        console.log('AUTH-MANAGER: Found Administration section!');

                        if (isAdmin(username)) {
                            section.style.display = 'block';
                            section.style.visibility = 'visible';
                            console.log('AUTH-MANAGER: ✅ Admin user - Administration section visible');
                        } else {
                            section.style.display = 'none';
                            section.style.visibility = 'hidden';
                            console.log('AUTH-MANAGER: ❌ Non-admin user - Administration section hidden');
                        }
                    }
                }
            });

            if (!administrationSectionFound) {
                console.warn('AUTH-MANAGER: ⚠️ Administration section not found in sidebar!');
            }

            // Hide dashboard stats for non-admin users
            const adminOnlyStats = [
                'Active Clients',
                'Active Policies',
                'All Time Premium',
                'Monthly Lead Premium'
            ];

            const statCards = document.querySelectorAll('.stat-card');
            console.log('AUTH-MANAGER: Found stat cards:', statCards.length);

            statCards.forEach((card, index) => {
                const statTitle = card.querySelector('.stat-details h3');
                if (statTitle) {
                    const titleText = statTitle.textContent.trim();
                    console.log(`AUTH-MANAGER: Stat card ${index} title:`, titleText);

                    if (adminOnlyStats.includes(titleText)) {
                        if (isAdmin(username)) {
                            card.style.display = 'block';
                            card.style.visibility = 'visible';
                            console.log(`AUTH-MANAGER: ✅ Admin - Showing stat: ${titleText}`);
                        } else {
                            card.style.display = 'none';
                            card.style.visibility = 'hidden';
                            console.log(`AUTH-MANAGER: ❌ Non-admin - Hiding stat: ${titleText}`);
                        }
                    }
                }
            });

            // Hide premium column in clients table for non-admin users
            const clientsTable = document.querySelector('.clients-view .data-table');
            if (clientsTable) {
                console.log('AUTH-MANAGER: Found clients table, checking premium column...');

                // Find and hide/show premium column header
                const headers = clientsTable.querySelectorAll('thead th');
                headers.forEach((header, index) => {
                    if (header.textContent.trim() === 'Premium') {
                        console.log(`AUTH-MANAGER: Found Premium column header at index ${index}`);
                        if (isAdmin(username)) {
                            header.style.display = 'table-cell';
                            header.style.visibility = 'visible';
                            console.log('AUTH-MANAGER: ✅ Admin - Showing Premium column header');
                        } else {
                            header.style.display = 'none';
                            header.style.visibility = 'hidden';
                            console.log('AUTH-MANAGER: ❌ Non-admin - Hiding Premium column header');
                        }

                        // Also hide/show corresponding cells in each row
                        const rows = clientsTable.querySelectorAll('tbody tr');
                        rows.forEach((row, rowIndex) => {
                            const cells = row.querySelectorAll('td');
                            if (cells[index]) {
                                if (isAdmin(username)) {
                                    cells[index].style.display = 'table-cell';
                                    cells[index].style.visibility = 'visible';
                                } else {
                                    cells[index].style.display = 'none';
                                    cells[index].style.visibility = 'hidden';
                                }
                            }
                        });
                    }
                });
            }

            // Hide premium column in policy management table for non-admin users
            const policiesTable = document.querySelector('.policies-view .data-table');
            if (policiesTable) {
                console.log('AUTH-MANAGER: Found policies table, checking premium column...');

                // Find and hide/show premium column header
                const headers = policiesTable.querySelectorAll('thead th');
                headers.forEach((header, index) => {
                    if (header.textContent.trim() === 'Premium') {
                        console.log(`AUTH-MANAGER: Found Premium column header in policies table at index ${index}`);
                        if (isAdmin(username)) {
                            header.style.display = 'table-cell';
                            header.style.visibility = 'visible';
                            console.log('AUTH-MANAGER: ✅ Admin - Showing Premium column header in policies');
                        } else {
                            header.style.display = 'none';
                            header.style.visibility = 'hidden';
                            console.log('AUTH-MANAGER: ❌ Non-admin - Hiding Premium column header in policies');
                        }

                        // Also hide/show corresponding cells in each row
                        const rows = policiesTable.querySelectorAll('tbody tr');
                        rows.forEach((row, rowIndex) => {
                            const cells = row.querySelectorAll('td');
                            if (cells[index]) {
                                if (isAdmin(username)) {
                                    cells[index].style.display = 'table-cell';
                                    cells[index].style.visibility = 'visible';
                                } else {
                                    cells[index].style.display = 'none';
                                    cells[index].style.visibility = 'hidden';
                                }
                            }
                        });
                    }
                });
            }

            // Hide "Total Premium" stat card in policy management for non-admin users
            const policyStats = document.querySelectorAll('.mini-stat');
            policyStats.forEach(stat => {
                const label = stat.querySelector('.mini-stat-label');
                if (label && label.textContent.trim() === 'Total Premium') {
                    if (isAdmin(username)) {
                        stat.style.display = 'block';
                        stat.style.visibility = 'visible';
                        console.log('AUTH-MANAGER: ✅ Admin - Showing Total Premium stat');
                    } else {
                        stat.style.display = 'none';
                        stat.style.visibility = 'hidden';
                        console.log('AUTH-MANAGER: ❌ Non-admin - Hiding Total Premium stat');
                    }
                }
            });

            // Hide premium information in policy views for non-admin users (ONLY if not admin)
            if (!isAdmin(username)) {
                console.log('AUTH-MANAGER: Non-admin user - applying continuous premium hiding...');

                // Function to hide premium content aggressively
                const hidePremiumContent = () => {
                    let hiddenCount = 0;

                    // 1. Hide any element that contains exactly "Premium:" as text
                    document.querySelectorAll('*').forEach(element => {
                        if (element.textContent && element.textContent.trim() === 'Premium:' &&
                            element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE') {
                            element.style.display = 'none';
                            hiddenCount++;
                        }
                    });

                    // 2. Hide any element that contains premium amounts like "14,537.00/yr"
                    document.querySelectorAll('*').forEach(element => {
                        if (element.textContent && element.textContent.match(/^\$?[\d,]+\.?\d*\/?(yr|year)$/i) &&
                            element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE') {
                            const parent = element.parentElement;
                            // Only hide if the parent or nearby elements mention premium
                            if (parent && (parent.textContent?.includes('Premium') ||
                                          parent.previousElementSibling?.textContent?.includes('Premium'))) {
                                element.style.display = 'none';
                                hiddenCount++;
                            }
                        }
                    });

                    // 3. Hide "Total Annual Premium" containers
                    document.querySelectorAll('*').forEach(element => {
                        if (element.textContent && element.textContent.trim() === 'Total Annual Premium') {
                            const container = element.closest('div[style*="background"], div[style*="padding"]');
                            if (container) {
                                container.style.display = 'none';
                                hiddenCount++;
                            }
                        }
                    });

                    // 4. Specifically target policy card premium rows
                    document.querySelectorAll('.info-group, .info-item, .detail-row').forEach(container => {
                        const text = container.textContent;
                        if (text && text.includes('Premium:')) {
                            container.style.display = 'none';
                            hiddenCount++;
                        }
                    });

                    // 5. Target policy overview modal premium section
                    document.querySelectorAll('.view-item').forEach(viewItem => {
                        const label = viewItem.querySelector('label');
                        if (label && label.textContent &&
                            (label.textContent.toUpperCase().includes('PREMIUM') ||
                             label.textContent.trim() === 'Premium')) {
                            viewItem.style.display = 'none';
                            hiddenCount++;
                        }
                    });

                    // 6. Target renewal card premium spans specifically
                    document.querySelectorAll('.renewal-card .premium').forEach(premiumSpan => {
                        premiumSpan.style.display = 'none';
                        hiddenCount++;
                    });

                    if (hiddenCount > 0) {
                        console.log(`AUTH-MANAGER: ❌ Hidden ${hiddenCount} premium elements (including renewal cards)`);
                    }
                };

                // Run immediately
                hidePremiumContent();

                // Set up continuous monitoring every 500ms
                const premiumHideInterval = setInterval(() => {
                    if (!isAdmin(username)) {
                        hidePremiumContent();
                    } else {
                        clearInterval(premiumHideInterval);
                    }
                }, 500);

                // Store interval ID so we can clear it later
                window.premiumHideInterval = premiumHideInterval;

            } else {
                console.log('AUTH-MANAGER: ✅ Admin user - All premium information visible');

                // Clear any existing interval
                if (window.premiumHideInterval) {
                    clearInterval(window.premiumHideInterval);
                    window.premiumHideInterval = null;
                }
            }
        };

        // Apply controls immediately if DOM is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            applyAdminControls();
        }

        // Also apply after DOM loads
        document.addEventListener('DOMContentLoaded', applyAdminControls);

        // Apply with multiple delays for dynamic content
        setTimeout(applyAdminControls, 100);
        setTimeout(applyAdminControls, 500);
        setTimeout(applyAdminControls, 1000);

        // Set up MutationObserver to watch for content changes (like dashboard reload)
        const adminControlObserver = new MutationObserver((mutations) => {
            let shouldReapply = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasStatCard = addedNodes.some(node =>
                        node.nodeType === 1 && (
                            node.classList?.contains('stat-card') ||
                            node.querySelector?.('.stat-card') ||
                            node.classList?.contains('menu-section') ||
                            node.querySelector?.('.menu-section') ||
                            node.classList?.contains('clients-view') ||
                            node.querySelector?.('.clients-view') ||
                            node.classList?.contains('policies-view') ||
                            node.querySelector?.('.policies-view') ||
                            node.classList?.contains('data-table') ||
                            node.querySelector?.('.data-table') ||
                            node.classList?.contains('policy-view') ||
                            node.querySelector?.('.policy-view') ||
                            node.classList?.contains('client-profile') ||
                            node.querySelector?.('.client-profile') ||
                            node.classList?.contains('mini-stat') ||
                            node.querySelector?.('.mini-stat') ||
                            node.textContent?.includes('Premium') ||
                            node.textContent?.includes('Total Annual')
                        )
                    );

                    if (hasStatCard) {
                        shouldReapply = true;
                        console.log('AUTH-MANAGER: Content reload detected, reapplying admin controls...');
                    }
                }
            });

            if (shouldReapply) {
                setTimeout(applyAdminControls, 100);
            }
        });

        // Start observing the document body for changes
        adminControlObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('AUTH-MANAGER: MutationObserver set up for persistent admin controls');
    }

    // Check session expiry (not used with sessionStorage login)
    function checkSessionExpiry() {
        // No session expiry with the original login system
        return;
    }

    // Initialize
    window.addEventListener('DOMContentLoaded', () => {
        // Check authentication
        const user = checkAuth();
        if (user) {
            displayUserInfo();
            setDefaultAssignedAgent();

            // Check session expiry every 30 minutes
            setInterval(checkSessionExpiry, 30 * 60 * 1000);
        }
    });

    // Make logout function globally available
    window.logout = logout;

    // Check auth on page visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkAuth();
        }
    });

    console.log('🔐 Auth Manager initialized');
})();