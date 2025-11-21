// Mobile Navigation and Interactions
// =====================================

// Mobile Menu Toggle
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const body = document.body;

    if (mobileNav && mobileOverlay) {
        mobileNav.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        mobileOverlay.style.display = mobileOverlay.classList.contains('active') ? 'block' : 'none';
        body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const body = document.body;

    if (mobileNav && mobileOverlay) {
        mobileNav.classList.remove('active');
        mobileOverlay.classList.remove('active');
        mobileOverlay.style.display = 'none';
        body.style.overflow = '';
    }
}

// Toggle Sidebar on Mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobileOverlay');

    if (sidebar) {
        sidebar.classList.toggle('active');
        if (overlay) {
            overlay.classList.toggle('active');
            overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
        }
    }
}

// Mobile Table Card View Toggle
function toggleTableView(tableId) {
    const tableContainer = document.getElementById(tableId)?.closest('.table-container');
    if (tableContainer) {
        tableContainer.classList.toggle('show-mobile-cards');
    }
}

// Convert Table to Mobile Cards
function createMobileCards(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    const headers = table.querySelectorAll('thead th');

    // Create mobile card container
    const cardContainer = document.createElement('div');
    cardContainer.className = 'mobile-card-view';

    rows.forEach(row => {
        const card = document.createElement('div');
        card.className = 'mobile-card';

        const cells = row.querySelectorAll('td');

        // Create card header
        const cardHeader = document.createElement('div');
        cardHeader.className = 'mobile-card-header';

        // Get primary info (usually first few columns)
        if (cells.length > 1) {
            const title = document.createElement('div');
            title.className = 'mobile-card-title';
            title.textContent = cells[1].textContent; // Usually name/title
            cardHeader.appendChild(title);
        }

        // Add status if exists
        const statusCell = row.querySelector('.status-badge');
        if (statusCell) {
            const status = document.createElement('div');
            status.className = `mobile-card-status ${statusCell.className}`;
            status.textContent = statusCell.textContent;
            cardHeader.appendChild(status);
        }

        card.appendChild(cardHeader);

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.className = 'mobile-card-body';

        cells.forEach((cell, index) => {
            if (index === 0 || index === 1) return; // Skip checkbox and name (already in header)

            const cardRow = document.createElement('div');
            cardRow.className = 'mobile-card-row';

            const label = document.createElement('span');
            label.className = 'mobile-card-label';
            label.textContent = headers[index]?.textContent || '';

            const value = document.createElement('span');
            value.className = 'mobile-card-value';
            value.innerHTML = cell.innerHTML;

            cardRow.appendChild(label);
            cardRow.appendChild(value);
            cardBody.appendChild(cardRow);
        });

        card.appendChild(cardBody);

        // Create card actions
        const actions = row.querySelector('.actions');
        if (actions) {
            const cardActions = document.createElement('div');
            cardActions.className = 'mobile-card-actions';

            const actionButtons = actions.querySelectorAll('button, a');
            actionButtons.forEach(btn => {
                const action = document.createElement('a');
                action.className = 'mobile-card-action';
                action.href = btn.href || '#';
                action.onclick = btn.onclick;
                action.innerHTML = btn.innerHTML;
                cardActions.appendChild(action);
            });

            card.appendChild(cardActions);
        }

        cardContainer.appendChild(card);
    });

    // Insert after table
    table.parentNode.insertBefore(cardContainer, table.nextSibling);
}

// Touch Swipe Detection
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleSwipe(element, leftCallback, rightCallback) {
    element.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);

    element.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture(leftCallback, rightCallback);
    }, false);
}

function handleSwipeGesture(leftCallback, rightCallback) {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Only register horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > 50) { // Minimum swipe distance
            if (deltaX > 0 && rightCallback) {
                rightCallback();
            } else if (deltaX < 0 && leftCallback) {
                leftCallback();
            }
        }
    }
}

// Initialize Swipeable Cards
function initSwipeableCards() {
    const cards = document.querySelectorAll('.mobile-card');

    cards.forEach(card => {
        let isSwipedOpen = false;

        handleSwipe(card,
            // Left swipe - open actions
            function() {
                if (!isSwipedOpen) {
                    card.classList.add('swiped');
                    isSwipedOpen = true;
                }
            },
            // Right swipe - close actions
            function() {
                if (isSwipedOpen) {
                    card.classList.remove('swiped');
                    isSwipedOpen = false;
                }
            }
        );
    });
}

// Pull to Refresh
let isPulling = false;
let startY = 0;
let currentY = 0;

function initPullToRefresh(callback) {
    const refreshContainer = document.createElement('div');
    refreshContainer.className = 'pull-to-refresh';
    refreshContainer.innerHTML = '<i class="fas fa-sync"></i>';
    document.body.insertBefore(refreshContainer, document.body.firstChild);

    document.addEventListener('touchstart', function(e) {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    });

    document.addEventListener('touchmove', function(e) {
        if (!isPulling) return;

        currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;

        if (pullDistance > 0 && pullDistance < 150) {
            refreshContainer.style.transform = `translateY(${pullDistance}px)`;

            if (pullDistance > 60) {
                refreshContainer.classList.add('active');
            }
        }
    });

    document.addEventListener('touchend', function() {
        if (!isPulling) return;

        const pullDistance = currentY - startY;

        if (pullDistance > 60) {
            // Trigger refresh
            refreshContainer.innerHTML = '<i class="fas fa-sync fa-spin"></i>';

            if (callback) {
                callback().then(() => {
                    refreshContainer.innerHTML = '<i class="fas fa-sync"></i>';
                    refreshContainer.style.transform = 'translateY(-60px)';
                    refreshContainer.classList.remove('active');
                });
            } else {
                // Default refresh behavior
                location.reload();
            }
        } else {
            refreshContainer.style.transform = 'translateY(-60px)';
            refreshContainer.classList.remove('active');
        }

        isPulling = false;
        startY = 0;
        currentY = 0;
    });
}

// Bottom Navigation Active State
function setBottomNavActive(itemId) {
    const items = document.querySelectorAll('.bottom-nav-item');
    items.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === itemId) {
            item.classList.add('active');
        }
    });
}

// Responsive Table Scroll Indicator
function addTableScrollIndicator() {
    const tables = document.querySelectorAll('.table-responsive');

    tables.forEach(table => {
        const wrapper = table.querySelector('.data-table');
        if (!wrapper) return;

        // Check if table is scrollable
        if (wrapper.scrollWidth > table.clientWidth) {
            const indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.innerHTML = '<i class="fas fa-arrow-right"></i> Scroll for more';
            table.appendChild(indicator);

            // Hide indicator when scrolled
            wrapper.addEventListener('scroll', function() {
                if (wrapper.scrollLeft > 0) {
                    indicator.style.display = 'none';
                }
            });
        }
    });
}

// Floating Action Button (FAB) Actions
function initFAB() {
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.innerHTML = '<i class="fas fa-plus"></i>';
    fab.onclick = function() {
        // Open quick add menu
        openQuickAddMenu();
    };
    document.body.appendChild(fab);
}

function openQuickAddMenu() {
    // Implementation for quick add menu
    const menu = document.createElement('div');
    menu.className = 'fab-menu';
    menu.innerHTML = `
        <a href="#" onclick="openNewLeadModal()"><i class="fas fa-user-plus"></i> New Lead</a>
        <a href="#" onclick="openNewPolicyModal()"><i class="fas fa-file-plus"></i> New Policy</a>
        <a href="#" onclick="openNewQuoteModal()"><i class="fas fa-calculator"></i> New Quote</a>
        <a href="#" onclick="openNewTaskModal()"><i class="fas fa-tasks"></i> New Task</a>
    `;
    // Add menu logic here
}

// Mobile Form Enhancements
function enhanceMobileForms() {
    // Auto-resize textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });

    // Add clear buttons to inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    inputs.forEach(input => {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'input-clear';
        clearBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearBtn.onclick = function() {
            input.value = '';
            input.focus();
        };
        wrapper.appendChild(clearBtn);

        // Show/hide clear button
        input.addEventListener('input', function() {
            clearBtn.style.display = this.value ? 'block' : 'none';
        });
    });
}

// Viewport Height Fix for Mobile Browsers
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Create Lead Mobile Cards
function createLeadMobileCards() {
    const leadTable = document.querySelector('#leadsTable, .leads-table, [id*="lead"][id*="table"]');
    if (!leadTable || window.innerWidth > 768) return;

    const tbody = leadTable.querySelector('tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    // Create mobile cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'lead-mobile-cards';

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return; // Skip empty rows

        // Create card
        const card = document.createElement('div');
        card.className = 'lead-card-mobile';

        // Card header (name and status)
        const header = document.createElement('div');
        header.className = 'lead-header';

        const name = document.createElement('div');
        name.className = 'lead-name';
        name.textContent = cells[1]?.textContent || 'Unknown Lead';
        header.appendChild(name);

        const status = cells[3]?.querySelector('.status-badge') || cells[3];
        if (status) {
            const statusBadge = document.createElement('span');
            statusBadge.className = 'lead-status status-active';
            statusBadge.textContent = status.textContent || 'Active';
            header.appendChild(statusBadge);
        }

        card.appendChild(header);

        // Card details
        const details = document.createElement('div');
        details.className = 'lead-details';

        // Phone
        if (cells[2]) {
            const phoneItem = document.createElement('div');
            phoneItem.className = 'lead-detail-item';
            phoneItem.innerHTML = '<i class="fas fa-phone"></i><span class="lead-detail-value">' + (cells[2].textContent || 'N/A') + '</span>';
            details.appendChild(phoneItem);
        }

        // Date
        if (cells[4]) {
            const dateItem = document.createElement('div');
            dateItem.className = 'lead-detail-item';
            dateItem.innerHTML = '<i class="fas fa-calendar"></i><span class="lead-detail-value">' + (cells[4].textContent || 'N/A') + '</span>';
            details.appendChild(dateItem);
        }

        // Email if exists
        const email = cells[2]?.querySelector('a[href^="mailto"]');
        if (email) {
            const emailItem = document.createElement('div');
            emailItem.className = 'lead-detail-item';
            emailItem.innerHTML = '<i class="fas fa-envelope"></i><span class="lead-detail-value">' + email.textContent + '</span>';
            details.appendChild(emailItem);
        }

        card.appendChild(details);

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'lead-actions-row';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'lead-action-btn';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
        actions.appendChild(viewBtn);

        const editBtn = document.createElement('button');
        editBtn.className = 'lead-action-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        actions.appendChild(editBtn);

        const callBtn = document.createElement('button');
        callBtn.className = 'lead-action-btn';
        callBtn.innerHTML = '<i class="fas fa-phone"></i> Call';
        actions.appendChild(callBtn);

        card.appendChild(actions);
        cardsContainer.appendChild(card);
    });

    // Don't hide table - let CSS handle display
    // leadTable.style.display = 'none'; // Commented out - table stays visible

    // Add cards as an alternative view (not shown by default)
    if (leadTable.parentNode) {
        leadTable.parentNode.insertBefore(cardsContainer, leadTable.nextSibling);
        cardsContainer.style.display = 'none'; // Hide cards by default
    }
}

// Initialize Mobile Features
document.addEventListener('DOMContentLoaded', function() {
    // Check if mobile
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Create lead mobile cards
        createLeadMobileCards();

        // Create mobile cards for other tables
        createMobileCards('policiesTable');
        createMobileCards('clientsTable');

        // Initialize swipeable cards
        initSwipeableCards();

        // Add table scroll indicators
        addTableScrollIndicator();

        // Initialize FAB
        initFAB();

        // Enhance forms
        enhanceMobileForms();

        // Initialize pull to refresh
        initPullToRefresh(async function() {
            // Custom refresh logic
            await new Promise(resolve => setTimeout(resolve, 1000));
            location.reload();
        });
    }

    // Set viewport height
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);

    // Handle navigation active states
    const navLinks = document.querySelectorAll('.mobile-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Close mobile menu on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });

    // Prevent body scroll when mobile menu is open
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    const isActive = mobileNav.classList.contains('active');
                    document.body.style.overflow = isActive ? 'hidden' : '';
                }
            });
        });

        observer.observe(mobileNav, { attributes: true });
    }
});

// Export functions for external use
window.mobileUtils = {
    toggleMobileMenu,
    closeMobileMenu,
    toggleSidebar,
    toggleTableView,
    createMobileCards,
    initSwipeableCards,
    setBottomNavActive,
    initFAB,
    enhanceMobileForms
};