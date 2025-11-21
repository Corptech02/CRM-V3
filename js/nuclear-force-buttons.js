// NUCLEAR OPTION - Force buttons to appear no matter what
console.log('☢️ NUCLEAR FORCE BUTTONS - This WILL add buttons!');

// Global function to absolutely force buttons
window.nuclearForceButtons = function() {
    console.log('💥 NUCLEAR FORCE ACTIVATED!');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        alert('Navigate to COI inbox first!');
        return;
    }

    // Strategy: Find ANYTHING that looks remotely like an email
    let buttonsAdded = 0;

    // Get all elements in the inbox
    const allElements = coiInbox.querySelectorAll('*');

    allElements.forEach((element) => {
        // Skip if it already has buttons
        if (element.querySelector('.nuclear-buttons') || element.classList.contains('nuclear-buttons')) {
            return;
        }

        // Check if this element or its parent looks like an email container
        const text = element.textContent || '';
        const html = element.innerHTML || '';
        const onclick = element.getAttribute('onclick') || '';
        const parentOnclick = element.parentElement ? element.parentElement.getAttribute('onclick') || '' : '';

        // Very broad criteria
        const looksLikeEmail = (
            (text.length > 50 && text.length < 500) || // Has reasonable amount of text
            text.includes('@') || // Contains email address
            text.includes('COI') || // Contains COI
            text.includes('Insurance') || // Contains Insurance
            onclick.includes('Email') || // Has email onclick
            parentOnclick.includes('Email') || // Parent has email onclick
            html.includes('fa-circle') || // Contains a circle icon
            (element.style.padding && element.style.cursor === 'pointer') // Has padding and pointer cursor
        );

        if (looksLikeEmail && element.offsetHeight > 30 && element.offsetHeight < 200) {
            // This looks like an email row - add buttons!
            element.style.position = 'relative';
            element.style.minHeight = '60px';

            // Create button container with MAXIMUM visibility
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'nuclear-buttons';
            buttonContainer.style.cssText = `
                position: absolute !important;
                right: 5px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                display: flex !important;
                gap: 5px !important;
                z-index: 2147483647 !important;
                background: white !important;
                padding: 8px !important;
                border: 3px solid red !important;
                border-radius: 10px !important;
                box-shadow: 0 0 20px rgba(255,0,0,0.5) !important;
                animation: pulse 1s infinite !important;
            `;

            // Create HUGE, UNMISSABLE buttons
            const checkBtn = document.createElement('button');
            checkBtn.innerHTML = '✅';
            checkBtn.title = 'Mark as handled (green)';
            checkBtn.style.cssText = `
                width: 45px !important;
                height: 45px !important;
                font-size: 28px !important;
                background: linear-gradient(45deg, #10b981, #34d399) !important;
                border: 3px solid #059669 !important;
                border-radius: 10px !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 4px 10px rgba(16, 185, 129, 0.5) !important;
                transition: transform 0.2s !important;
            `;
            checkBtn.onmouseover = () => checkBtn.style.transform = 'scale(1.2)';
            checkBtn.onmouseout = () => checkBtn.style.transform = 'scale(1)';
            checkBtn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();

                // Toggle green background
                if (element.style.backgroundColor === 'rgb(209, 250, 229)') {
                    element.style.backgroundColor = '';
                    element.style.borderLeft = '';
                    this.style.opacity = '0.5';
                } else {
                    element.style.backgroundColor = '#d1fae5';
                    element.style.borderLeft = '6px solid #10b981';
                    element.style.opacity = '1';
                    this.style.opacity = '1';

                    // Save to localStorage
                    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
                    statuses[`nuclear_${buttonsAdded}`] = 'handled';
                    localStorage.setItem('coi_email_status', JSON.stringify(statuses));
                }

                console.log('✅ Marked as handled!');
                return false;
            };

            const xBtn = document.createElement('button');
            xBtn.innerHTML = '❌';
            xBtn.title = 'Mark as unimportant (red)';
            xBtn.style.cssText = `
                width: 45px !important;
                height: 45px !important;
                font-size: 28px !important;
                background: linear-gradient(45deg, #ef4444, #f87171) !important;
                border: 3px solid #dc2626 !important;
                border-radius: 10px !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 4px 10px rgba(239, 68, 68, 0.5) !important;
                transition: transform 0.2s !important;
            `;
            xBtn.onmouseover = () => xBtn.style.transform = 'scale(1.2)';
            xBtn.onmouseout = () => xBtn.style.transform = 'scale(1)';
            xBtn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();

                // Toggle red background
                if (element.style.backgroundColor === 'rgb(254, 226, 226)') {
                    element.style.backgroundColor = '';
                    element.style.borderLeft = '';
                    element.style.opacity = '';
                    this.style.opacity = '0.5';
                } else {
                    element.style.backgroundColor = '#fee2e2';
                    element.style.borderLeft = '6px solid #ef4444';
                    element.style.opacity = '0.7';
                    this.style.opacity = '1';

                    // Save to localStorage
                    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
                    statuses[`nuclear_${buttonsAdded}`] = 'unimportant';
                    localStorage.setItem('coi_email_status', JSON.stringify(statuses));
                }

                console.log('❌ Marked as unimportant!');
                return false;
            };

            buttonContainer.appendChild(checkBtn);
            buttonContainer.appendChild(xBtn);
            element.appendChild(buttonContainer);

            buttonsAdded++;
            console.log(`Added buttons to element ${buttonsAdded}:`, element);
        }
    });

    // Add pulsing animation CSS if not already added
    if (!document.getElementById('nuclear-styles')) {
        const style = document.createElement('style');
        style.id = 'nuclear-styles';
        style.textContent = `
            @keyframes pulse {
                0% { box-shadow: 0 0 20px rgba(255,0,0,0.5); }
                50% { box-shadow: 0 0 30px rgba(255,0,0,0.8); }
                100% { box-shadow: 0 0 20px rgba(255,0,0,0.5); }
            }

            .nuclear-buttons button:hover {
                transform: scale(1.2) !important;
            }

            .nuclear-buttons button:active {
                transform: scale(0.95) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Show result
    if (buttonsAdded > 0) {
        alert(`☢️ NUCLEAR SUCCESS!\n\nAdded ${buttonsAdded} sets of status buttons!\n\n✅ Click the green checkmark to mark as handled\n❌ Click the red X to mark as unimportant`);
    } else {
        alert('⚠️ No suitable email elements found.\n\nTry:\n1. Make sure emails are loaded\n2. Refresh the page\n3. Navigate to COI inbox');
    }

    console.log(`☢️ Nuclear force complete: ${buttonsAdded} buttons added`);
};

// Create the BIG RED BUTTON
function createNuclearButton() {
    if (document.getElementById('nuclear-button')) return;

    const button = document.createElement('button');
    button.id = 'nuclear-button';
    button.innerHTML = '☢️<br>NUCLEAR<br>FORCE';
    button.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 100px !important;
        height: 100px !important;
        background: radial-gradient(circle, #ff0000, #8b0000) !important;
        color: yellow !important;
        border: 4px solid yellow !important;
        border-radius: 50% !important;
        font-size: 14px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        z-index: 2147483647 !important;
        box-shadow: 0 0 20px rgba(255,0,0,0.8) !important;
        animation: nuclear-pulse 2s infinite !important;
        text-align: center !important;
        line-height: 1.2 !important;
        padding: 10px !important;
    `;

    button.onclick = nuclearForceButtons;

    // Add hover effect
    button.onmouseover = function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 0 40px rgba(255,0,0,1)';
    };
    button.onmouseout = function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 20px rgba(255,0,0,0.8)';
    };

    document.body.appendChild(button);

    // Add animation
    if (!document.getElementById('nuclear-button-styles')) {
        const style = document.createElement('style');
        style.id = 'nuclear-button-styles';
        style.textContent = `
            @keyframes nuclear-pulse {
                0% { box-shadow: 0 0 20px rgba(255,0,0,0.8); }
                50% { box-shadow: 0 0 40px rgba(255,255,0,1); }
                100% { box-shadow: 0 0 20px rgba(255,0,0,0.8); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-create the nuclear button after 3 seconds
setTimeout(createNuclearButton, 3000);

// Also try to run automatically when COI page is loaded
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(() => {
            const coiInbox = document.getElementById('coiInbox');
            if (coiInbox && coiInbox.querySelector('div').length > 2) {
                console.log('☢️ COI page detected with content - Nuclear button ready!');
                createNuclearButton();
            }
        }, 2000);
    }
});

console.log('☢️ NUCLEAR FORCE BUTTONS loaded!');
console.log('🔴 Look for the BIG RED BUTTON in bottom-right corner');
console.log('💥 Or run: nuclearForceButtons()');
console.log('⚠️ This is the LAST RESORT - it will force buttons onto ANYTHING that looks like an email!');