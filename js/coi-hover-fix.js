// COI Hover Fix - AGGRESSIVE fix for hover behavior
console.log('🔥 COI HOVER FIX ACTIVATING...');

// Apply hover fix every 500ms to ensure it sticks
function applyHoverFix() {
    const emailItems = document.querySelectorAll('.email-item');

    emailItems.forEach(item => {
        const emailId = item.getAttribute('data-email-id');
        if (!emailId) return;

        // Check if this email has been read
        const readEmails = localStorage.getItem('coi_read_emails');
        const readList = readEmails ? JSON.parse(readEmails) : [];
        const isRead = readList.includes(emailId);

        // Remove any existing event listeners by cloning
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        if (!isRead) {
            // UNREAD EMAIL - Keep blue styling visible at all times
            newItem.style.cssText = `
                background: #ffffff !important;
                border-left: 4px solid #3b82f6 !important;
                padding: 15px !important;
                border-bottom: 1px solid #e5e7eb !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                cursor: pointer !important;
                transition: all 0.2s !important;
            `;

            // Ensure blue dot is always visible for unread
            let dot = newItem.querySelector('.fa-circle');
            if (!dot) {
                const fromDiv = newItem.querySelector('.email-from');
                if (fromDiv) {
                    dot = document.createElement('i');
                    dot.className = 'fas fa-circle';
                    fromDiv.insertBefore(dot, fromDiv.firstChild);
                }
            }
            if (dot) {
                dot.style.cssText = 'color: #3b82f6 !important; font-size: 8px !important; margin-right: 8px !important; display: inline !important;';
            }

            // Bold text for unread
            const strong = newItem.querySelector('.email-from strong');
            if (strong) {
                strong.style.cssText = 'color: #1f2937 !important; font-weight: bold !important;';
            }

            const subject = newItem.querySelector('.email-subject');
            if (subject) {
                subject.style.cssText = 'color: #111827 !important; font-weight: 600 !important;';
            }

            // Hover effect - KEEP BLUE BORDER AND DOT
            newItem.addEventListener('mouseenter', function() {
                this.style.background = '#eff6ff !important';
                this.style.transform = 'translateX(2px)';
                // KEEP the blue border
                this.style.borderLeft = '4px solid #3b82f6 !important';
                // KEEP the blue dot
                const hoveredDot = this.querySelector('.fa-circle');
                if (hoveredDot) {
                    hoveredDot.style.display = 'inline !important';
                    hoveredDot.style.color = '#3b82f6 !important';
                }
            });

            newItem.addEventListener('mouseleave', function() {
                this.style.background = '#ffffff !important';
                this.style.transform = 'translateX(0)';
                // KEEP the blue border
                this.style.borderLeft = '4px solid #3b82f6 !important';
                // KEEP the blue dot
                const hoveredDot = this.querySelector('.fa-circle');
                if (hoveredDot) {
                    hoveredDot.style.display = 'inline !important';
                    hoveredDot.style.color = '#3b82f6 !important';
                }
            });

        } else {
            // READ EMAIL - Subdued styling
            newItem.style.cssText = `
                background: #f9fafb !important;
                opacity: 0.6 !important;
                border-left: 4px solid #d1d5db !important;
                padding: 15px !important;
                border-bottom: 1px solid #e5e7eb !important;
                cursor: pointer !important;
            `;

            // Hide dot for read emails
            const dot = newItem.querySelector('.fa-circle');
            if (dot) {
                dot.style.display = 'none !important';
            }

            // Lighter text for read
            const strong = newItem.querySelector('.email-from strong');
            if (strong) {
                strong.style.cssText = 'color: #9ca3af !important; font-weight: normal !important;';
            }

            const subject = newItem.querySelector('.email-subject');
            if (subject) {
                subject.style.cssText = 'color: #9ca3af !important; font-weight: normal !important;';
            }

            // Hover for read emails
            newItem.addEventListener('mouseenter', function() {
                this.style.background = '#f3f4f6 !important';
                this.style.opacity = '0.7 !important';
            });

            newItem.addEventListener('mouseleave', function() {
                this.style.background = '#f9fafb !important';
                this.style.opacity = '0.6 !important';
            });
        }

        // Click handler to open email
        newItem.addEventListener('click', function(e) {
            if (!e.target.closest('.email-actions')) {
                const clickedId = this.getAttribute('data-email-id');
                if (clickedId && window.expandEmail) {
                    // Mark as read and update immediately
                    const readEmails = localStorage.getItem('coi_read_emails');
                    const readList = readEmails ? JSON.parse(readEmails) : [];
                    if (!readList.includes(clickedId)) {
                        readList.push(clickedId);
                        localStorage.setItem('coi_read_emails', JSON.stringify(readList));
                    }

                    // Apply read styling immediately
                    this.style.cssText = `
                        background: #f9fafb !important;
                        opacity: 0.6 !important;
                        border-left: 4px solid #d1d5db !important;
                        padding: 15px !important;
                        border-bottom: 1px solid #e5e7eb !important;
                    `;

                    // Hide the blue dot immediately
                    const dot = this.querySelector('.fa-circle');
                    if (dot) {
                        dot.style.display = 'none !important';
                    }

                    // Lighten text immediately
                    const strong = this.querySelector('.email-from strong');
                    if (strong) {
                        strong.style.cssText = 'color: #9ca3af !important; font-weight: normal !important;';
                    }

                    const subject = this.querySelector('.email-subject');
                    if (subject) {
                        subject.style.cssText = 'color: #9ca3af !important; font-weight: normal !important;';
                    }

                    // Open the email
                    window.expandEmail(clickedId);
                }
            }
        });
    });
}

// Apply fix aggressively
// setInterval(applyHoverFix, 500); // DISABLED - Causing blinking every 500ms

// Also apply on DOM changes
const observer = new MutationObserver(() => {
    applyHoverFix();
});

// Start observing when inbox exists - DISABLED - Causing blinking every 100ms
// const checkInbox = setInterval(() => {
//     const coiInbox = document.getElementById('coiInbox');
//     if (coiInbox) {
//         observer.observe(coiInbox, { childList: true, subtree: true });
//         applyHoverFix();
//     }
// }, 100);

// Apply on hash change
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(applyHoverFix, 100);
    }
});

console.log('✅ COI HOVER FIX ACTIVE - Blue borders and dots will persist on hover!');