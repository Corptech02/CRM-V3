// Click-to-dial and Click-to-email functionality
// This module adds double-click handlers for phone numbers and email addresses throughout the application

(function() {
    console.log('Click-to-dial-email.js loaded and executing...');
    // Track open tool windows
    let phoneToolWindow = null;
    let emailToolWindow = null;
    
    // Regular expressions for detecting phone numbers and emails
    const phoneRegex = /(\+?1?\s?)?(\([0-9]{3}\)|[0-9]{3})[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // Format phone number for display
    function formatPhoneNumber(phone) {
        // Remove all non-numeric characters
        const cleaned = phone.replace(/\D/g, '');
        // Format as (XXX) XXX-XXXX if it's a 10-digit number
        if (cleaned.length === 10) {
            return `(${cleaned.substr(0, 3)}) ${cleaned.substr(3, 3)}-${cleaned.substr(6, 4)}`;
        }
        return phone;
    }
    
    // Open or restore phone tool and populate with number
    function openPhoneWithNumber(phoneNumber) {
        console.log('Opening phone tool with number:', phoneNumber);
        const formattedNumber = formatPhoneNumber(phoneNumber);
        
        // Check if phone tool is already open by looking for tool windows with Phone title
        let existingPhoneTool = null;
        document.querySelectorAll('.tool-window').forEach(window => {
            const titleSpan = window.querySelector('.tool-window-title span');
            if (titleSpan && titleSpan.textContent === 'Phone') {
                existingPhoneTool = window;
            }
        });
        
        if (existingPhoneTool) {
            console.log('Found existing phone tool');
            // Check if it's minimized
            if (existingPhoneTool.classList.contains('minimized')) {
                // Find the window ID
                const windowId = existingPhoneTool.id;
                restoreWindow(windowId);
            } else {
                // Bring to front
                bringToFront(existingPhoneTool);
            }
            
            // Find the phone input and populate it
            setTimeout(() => {
                const phoneInput = existingPhoneTool.querySelector('input[type="tel"]');
                if (phoneInput) {
                    phoneInput.value = formattedNumber;
                    phoneInput.focus();
                    // Flash the input to show it was updated
                    phoneInput.style.backgroundColor = '#dbeafe';
                    setTimeout(() => {
                        phoneInput.style.backgroundColor = '';
                    }, 500);
                }
            }, 100);
        } else {
            console.log('Opening new phone tool');
            // Check if openPhoneTool function exists
            if (typeof openPhoneTool === 'function') {
                openPhoneTool();
            } else {
                console.error('openPhoneTool function not found!');
                return;
            }
            
            // Wait for tool to be created then populate the number
            setTimeout(() => {
                let newPhoneTool = null;
                document.querySelectorAll('.tool-window').forEach(window => {
                    const titleSpan = window.querySelector('.tool-window-title span');
                    if (titleSpan && titleSpan.textContent === 'Phone') {
                        newPhoneTool = window;
                    }
                });
                
                if (newPhoneTool) {
                    console.log('New phone tool created');
                    const phoneInput = newPhoneTool.querySelector('input[type="tel"]');
                    if (phoneInput) {
                        phoneInput.value = formattedNumber;
                        phoneInput.focus();
                        // Flash the input
                        phoneInput.style.backgroundColor = '#dbeafe';
                        setTimeout(() => {
                            phoneInput.style.backgroundColor = '';
                        }, 500);
                    }
                }
            }, 200);
        }
    }
    
    // Open or restore email tool and populate with address
    function openEmailWithAddress(emailAddress) {
        console.log('Opening email tool with address:', emailAddress);
        
        // Check if email tool is already open by looking for tool windows with Email title
        let existingEmailTool = null;
        document.querySelectorAll('.tool-window').forEach(window => {
            const titleSpan = window.querySelector('.tool-window-title span');
            if (titleSpan && titleSpan.textContent === 'Email') {
                existingEmailTool = window;
            }
        });
        
        if (existingEmailTool) {
            console.log('Found existing email tool');
            // Check if it's minimized
            if (existingEmailTool.classList.contains('minimized')) {
                // Find the window ID
                const windowId = existingEmailTool.id;
                restoreWindow(windowId);
            } else {
                // Bring to front
                bringToFront(existingEmailTool);
            }
            
            // Show compose and populate the To field
            setTimeout(() => {
                const windowId = existingEmailTool.id.replace('tool-window-', 'email-window-');
                
                // Check if showComposeEmail function exists
                if (typeof showComposeEmail === 'function') {
                    showComposeEmail(windowId);
                    
                    setTimeout(() => {
                        // Find the To input field by ID
                        const toInput = document.getElementById(`${windowId}-to`);
                        if (toInput) {
                            toInput.value = emailAddress;
                            // Focus on subject since To is filled
                            const subjectInput = document.getElementById(`${windowId}-subject`);
                            if (subjectInput) {
                                subjectInput.focus();
                            }
                            // Flash the To input to show it was updated
                            toInput.style.backgroundColor = '#dbeafe';
                            setTimeout(() => {
                                toInput.style.backgroundColor = '';
                            }, 500);
                        }
                    }, 200);
                } else {
                    console.error('showComposeEmail function not found!');
                }
            }, 100);
        } else {
            console.log('Opening new email tool');
            // Check if openEmailTool function exists
            if (typeof openEmailTool === 'function') {
                // Pass the email address to open in compose mode
                openEmailTool(emailAddress);
            } else {
                console.error('openEmailTool function not found!');
                return;
            }
            
            // Email tool will open with compose view and email pre-filled
            // Just need to focus the subject field after a delay
            setTimeout(() => {
                let newEmailTool = null;
                document.querySelectorAll('.tool-window').forEach(window => {
                    const titleSpan = window.querySelector('.tool-window-title span');
                    if (titleSpan && titleSpan.textContent === 'Email') {
                        newEmailTool = window;
                    }
                });
                
                if (newEmailTool) {
                    console.log('New email tool created with compose view');
                    // Focus on the subject field since To is already filled
                    const subjectInput = newEmailTool.querySelector('input[id*="subject"]');
                    if (subjectInput) {
                        subjectInput.focus();
                    }
                }
            }, 300);
        }
    }
    
    // Make an element clickable for phone number
    function makePhoneClickable(element, phoneNumber) {
        element.style.cursor = 'pointer';
        element.style.textDecoration = 'underline';
        element.style.textDecorationStyle = 'dotted';
        element.style.textDecorationColor = '#0066cc';
        element.title = `Double-click to dial ${formatPhoneNumber(phoneNumber)}`;
        
        element.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Phone double-clicked:', phoneNumber);
            openPhoneWithNumber(phoneNumber);
        });
        
        // Add hover effect
        element.addEventListener('mouseenter', function() {
            this.style.color = '#0066cc';
            this.style.textDecorationStyle = 'solid';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.color = '';
            this.style.textDecorationStyle = 'dotted';
        });
    }
    
    // Make an element clickable for email
    function makeEmailClickable(element, emailAddress) {
        element.style.cursor = 'pointer';
        element.style.textDecoration = 'underline';
        element.style.textDecorationStyle = 'dotted';
        element.style.textDecorationColor = '#0066cc';
        element.title = `Double-click to compose email to ${emailAddress}`;
        
        element.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Email double-clicked:', emailAddress);
            openEmailWithAddress(emailAddress);
        });
        
        // Add hover effect
        element.addEventListener('mouseenter', function() {
            this.style.color = '#0066cc';
            this.style.textDecorationStyle = 'solid';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.color = '';
            this.style.textDecorationStyle = 'dotted';
        });
    }
    
    // Process text nodes to find and wrap phone numbers and emails
    function processTextNode(textNode) {
        const text = textNode.textContent;
        if (!text.trim()) return;
        
        let hasMatch = false;
        let html = text;
        
        // Check for phone numbers
        const phoneMatches = [...text.matchAll(phoneRegex)];
        if (phoneMatches.length > 0) {
            hasMatch = true;
            // Sort matches by position (reverse) to replace from end to start
            phoneMatches.sort((a, b) => b.index - a.index);
            phoneMatches.forEach(match => {
                const phone = match[0];
                const escapedPhone = phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                html = html.replace(new RegExp(escapedPhone, 'g'), `<span class="clickable-phone" data-phone="${phone}">${phone}</span>`);
            });
        }
        
        // Check for emails
        const emailMatches = [...text.matchAll(emailRegex)];
        if (emailMatches.length > 0) {
            hasMatch = true;
            // Sort matches by position (reverse) to replace from end to start
            emailMatches.sort((a, b) => b.index - a.index);
            emailMatches.forEach(match => {
                const email = match[0];
                const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                html = html.replace(new RegExp(escapedEmail, 'g'), `<span class="clickable-email" data-email="${email}">${email}</span>`);
            });
        }
        
        // Replace the text node with the new HTML if we found matches
        if (hasMatch) {
            const wrapper = document.createElement('span');
            wrapper.className = 'clickable-wrapper';
            wrapper.innerHTML = html;
            
            // Replace the text node
            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(wrapper, textNode);
                
                // Make the new elements clickable
                wrapper.querySelectorAll('.clickable-phone').forEach(el => {
                    makePhoneClickable(el, el.dataset.phone);
                });
                wrapper.querySelectorAll('.clickable-email').forEach(el => {
                    makeEmailClickable(el, el.dataset.email);
                });
            }
        }
    }
    
    // Scan an element and its children for phone numbers and emails
    function scanElement(element) {
        // Skip if element is an input, textarea, or script
        if (element.tagName && ['INPUT', 'TEXTAREA', 'SCRIPT', 'STYLE'].includes(element.tagName)) {
            return;
        }
        
        // Skip if element already has clickable classes
        if (element.classList && (element.classList.contains('clickable-phone') || element.classList.contains('clickable-email'))) {
            return;
        }
        
        // Also skip if element has been processed already
        if (element.dataset && element.dataset.clickableProcessed) {
            return;
        }
        
        // Process text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip empty text nodes
                    if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                    
                    // Skip if parent is already a clickable element
                    if (node.parentElement.classList && 
                        (node.parentElement.classList.contains('clickable-phone') || 
                         node.parentElement.classList.contains('clickable-email'))) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip if parent is an input or textarea
                    if (node.parentElement.tagName && 
                        ['INPUT', 'TEXTAREA', 'SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        
        // Process each text node
        textNodes.forEach(processTextNode);
        
        // Mark element as processed
        if (element.dataset) {
            element.dataset.clickableProcessed = 'true';
        }
    }
    
    // Public function to scan content (can be called from other scripts)
    window.scanForClickableContent = function(element) {
        if (!element) element = document.body;
        
        // Clear all processed flags in the element
        element.querySelectorAll('[data-clickable-processed]').forEach(el => {
            delete el.dataset.clickableProcessed;
        });
        
        // Reset regex lastIndex
        phoneRegex.lastIndex = 0;
        emailRegex.lastIndex = 0;
        
        // Also look specifically for table cells with phone/email patterns
        element.querySelectorAll('td').forEach(td => {
            const text = td.textContent.trim();
            
            // Reset regex before testing
            phoneRegex.lastIndex = 0;
            emailRegex.lastIndex = 0;
            
            // Check if this looks like a phone or email
            if (phoneRegex.test(text) || emailRegex.test(text)) {
                // Process all text nodes in this cell
                const walker = document.createTreeWalker(
                    td,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: function(node) {
                            if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                            if (node.parentElement.classList && 
                                (node.parentElement.classList.contains('clickable-phone') || 
                                 node.parentElement.classList.contains('clickable-email'))) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                );
                
                const textNodes = [];
                while (walker.nextNode()) {
                    textNodes.push(walker.currentNode);
                }
                textNodes.forEach(processTextNode);
            }
        });
        
        // Then do the regular scan
        scanElement(element);
    }
    
    // Initialize - scan the entire document
    function initialize() {
        console.log('Initializing click-to-dial/email functionality...');
        
        // Check if required functions are available
        if (typeof openPhoneTool !== 'function') {
            console.error('openPhoneTool function not found! Waiting...');
            setTimeout(initialize, 500);
            return;
        }
        if (typeof openEmailTool !== 'function') {
            console.error('openEmailTool function not found! Waiting...');
            setTimeout(initialize, 500);
            return;
        }
        
        console.log('All required functions found, proceeding with initialization');
        
        // Initial scan
        scanElement(document.body);
        
        // Set up mutation observer to handle dynamically added content
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Handle added nodes
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Small delay to ensure content is fully rendered
                        setTimeout(() => {
                            // Clear the processed flag for new content
                            if (node.dataset) {
                                delete node.dataset.clickableProcessed;
                            }
                            scanElement(node);
                        }, 100);
                    } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        // Also handle text nodes that might contain phone/email
                        const parent = node.parentElement;
                        if (parent && !parent.dataset.clickableProcessed) {
                            setTimeout(() => scanElement(parent), 100);
                        }
                    }
                });
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        console.log('Click-to-dial and Click-to-email functionality initialized');
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM is already ready
        setTimeout(initialize, 100);
    }
    
    // Hook into navigation changes
    // Re-scan after hash changes (navigation)
    window.addEventListener('hashchange', function() {
        setTimeout(() => {
            console.log('Hash changed, rescanning for clickable content...');
            const content = document.querySelector('.dashboard-content') || document.body;
            // Clear processed flags
            content.querySelectorAll('[data-clickable-processed]').forEach(el => {
                delete el.dataset.clickableProcessed;
            });
            scanElement(content);
        }, 300);
    });
    
    // Also hook into clicks on sidebar menu items
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.sidebar-menu a, .nav-link');
        if (target) {
            setTimeout(() => {
                const content = document.querySelector('.dashboard-content') || document.body;
                // Clear processed flags
                content.querySelectorAll('[data-clickable-processed]').forEach(el => {
                    delete el.dataset.clickableProcessed;
                });
                scanElement(content);
            }, 500);
        }
    });
    
    // Add keyboard shortcut to force scan (Ctrl+Shift+S)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            console.log('Manual scan triggered by Ctrl+Shift+S');
            const content = document.querySelector('.dashboard-content') || document.body;
            
            // Clear all processed flags
            document.querySelectorAll('[data-clickable-processed]').forEach(el => {
                delete el.dataset.clickableProcessed;
            });
            
            // Remove existing clickable wrappers to start fresh
            document.querySelectorAll('.clickable-wrapper').forEach(wrapper => {
                const text = wrapper.textContent;
                const textNode = document.createTextNode(text);
                wrapper.parentNode.replaceChild(textNode, wrapper);
            });
            
            // Force rescan
            window.scanForClickableContent(content);
            
            // Show notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                font-family: 'Inter', sans-serif;
            `;
            notification.textContent = 'Phone/Email scan complete!';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    });
    
    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
        .clickable-phone, .clickable-email {
            transition: color 0.2s;
        }
        .clickable-phone:hover, .clickable-email:hover {
            background-color: rgba(0, 102, 204, 0.05);
            border-radius: 3px;
            padding: 0 2px;
        }
    `;
    document.head.appendChild(style);
})();