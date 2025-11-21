// Email Status Diagnostic and Manual Injection Tool
console.log('🔍 Email Status Diagnostic Tool Loaded');

// Diagnostic function to check what's in the COI inbox
window.diagnoseEmailStatus = function() {
    console.log('=== EMAIL STATUS DIAGNOSTIC ===');

    // Check if COI inbox exists
    const coiInbox = document.getElementById('coiInbox');
    console.log('1. COI Inbox found:', !!coiInbox);

    if (!coiInbox) {
        console.log('❌ No COI inbox element found. Are you on the COI page?');
        return;
    }

    // Check for email items
    const emailItems = coiInbox.querySelectorAll('.email-item');
    console.log('2. Email items found:', emailItems.length);

    if (emailItems.length === 0) {
        // Try other selectors
        const divs = coiInbox.querySelectorAll('div');
        console.log('   Total divs in coiInbox:', divs.length);

        // Look for anything that might be an email
        const possibleEmails = Array.from(divs).filter(div => {
            const onclick = div.getAttribute('onclick') || '';
            const text = div.textContent || '';
            return onclick.includes('Email') || onclick.includes('expand') ||
                   text.includes('@') || text.includes('COI');
        });

        console.log('   Possible email elements:', possibleEmails.length);

        if (possibleEmails.length > 0) {
            console.log('   First possible email HTML:', possibleEmails[0].outerHTML.substring(0, 200));
        }
    } else {
        console.log('   First email item HTML:', emailItems[0].outerHTML.substring(0, 200));
    }

    // Check for existing status controls
    const existingControls = coiInbox.querySelectorAll('[class*="status-control"]');
    console.log('3. Existing status controls:', existingControls.length);

    // Check innerHTML structure
    console.log('4. COI Inbox innerHTML preview:', coiInbox.innerHTML.substring(0, 500));

    console.log('=== END DIAGNOSTIC ===');
};

// Manual injection function that definitely works
window.forceAddEmailStatus = function() {
    console.log('🔧 Force adding email status controls...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        alert('Please navigate to the COI Request Inbox first');
        return;
    }

    // Find ALL divs that look like they might be emails
    const allDivs = coiInbox.querySelectorAll('div');
    let emailCount = 0;

    allDivs.forEach((div, index) => {
        // Check if this div looks like an email
        const onclick = div.getAttribute('onclick') || '';
        const style = div.getAttribute('style') || '';
        const hasOnclick = onclick.includes('expandEmail') || onclick.includes('viewEmail');
        const hasPadding = style.includes('padding');
        const hasBorder = style.includes('border');
        const hasText = div.textContent.length > 20;

        // Also check if it contains email-like content
        const text = div.textContent || '';
        const looksLikeEmail = text.includes('@') || text.includes('COI') || text.includes('Insurance');

        // If it looks like an email item
        if ((hasOnclick || (hasPadding && hasBorder && hasText) || looksLikeEmail) &&
            !div.querySelector('.force-status-controls')) {

            console.log(`Found potential email item ${index}:`, div);

            // Make it relative for positioning
            div.style.position = 'relative';

            // Create controls container with bright colors for visibility
            const controls = document.createElement('div');
            controls.className = 'force-status-controls';
            controls.style.cssText = `
                position: absolute;
                right: 5px;
                top: 5px;
                display: flex;
                gap: 5px;
                z-index: 9999;
                background: white;
                padding: 5px;
                border: 2px solid #000;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            // Add bright green check button
            const checkBtn = document.createElement('button');
            checkBtn.innerHTML = '✅';
            checkBtn.title = 'Mark as handled';
            checkBtn.style.cssText = `
                width: 35px;
                height: 35px;
                font-size: 20px;
                background: #10b981;
                color: white;
                border: 2px solid #047857;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            checkBtn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();

                // Toggle green background
                if (div.style.backgroundColor === 'rgb(209, 250, 229)') {
                    div.style.backgroundColor = '';
                    div.style.borderLeft = '';
                    this.style.background = '#10b981';
                } else {
                    div.style.backgroundColor = '#d1fae5';
                    div.style.borderLeft = '5px solid #10b981';
                    this.style.background = '#047857';
                }

                console.log('✅ Toggled handled status');
                return false;
            };

            // Add bright red X button
            const xBtn = document.createElement('button');
            xBtn.innerHTML = '❌';
            xBtn.title = 'Mark as unimportant';
            xBtn.style.cssText = `
                width: 35px;
                height: 35px;
                font-size: 20px;
                background: #ef4444;
                color: white;
                border: 2px solid #991b1b;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            xBtn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();

                // Toggle red background
                if (div.style.backgroundColor === 'rgb(254, 226, 226)') {
                    div.style.backgroundColor = '';
                    div.style.borderLeft = '';
                    div.style.opacity = '';
                    this.style.background = '#ef4444';
                } else {
                    div.style.backgroundColor = '#fee2e2';
                    div.style.borderLeft = '5px solid #ef4444';
                    div.style.opacity = '0.7';
                    this.style.background = '#991b1b';
                }

                console.log('❌ Toggled unimportant status');
                return false;
            };

            controls.appendChild(checkBtn);
            controls.appendChild(xBtn);
            div.appendChild(controls);

            emailCount++;
        }
    });

    if (emailCount === 0) {
        // Try a different approach - look for any clickable items
        console.log('No emails found with standard approach, trying alternative...');

        // Find elements with onclick containing email-related functions
        const clickables = Array.from(coiInbox.querySelectorAll('[onclick]'));
        console.log(`Found ${clickables.length} clickable elements`);

        clickables.forEach((element, i) => {
            if (!element.querySelector('.force-status-controls')) {
                element.style.position = 'relative';

                const controls = document.createElement('div');
                controls.className = 'force-status-controls';
                controls.innerHTML = `
                    <button style="background: lime; padding: 8px; margin: 2px; border: 2px solid black; cursor: pointer;"
                            onclick="event.stopPropagation(); this.parentElement.parentElement.style.background='#d1fae5'; return false;">✅</button>
                    <button style="background: red; padding: 8px; margin: 2px; border: 2px solid black; cursor: pointer;"
                            onclick="event.stopPropagation(); this.parentElement.parentElement.style.background='#fee2e2'; return false;">❌</button>
                `;
                controls.style.cssText = 'position: absolute; right: 0; top: 0; z-index: 9999;';

                element.appendChild(controls);
                emailCount++;
            }
        });
    }

    console.log(`✅ Added status controls to ${emailCount} items`);

    if (emailCount === 0) {
        alert('Could not find any email items. Please make sure emails are loaded in the COI inbox.');
    } else {
        alert(`Successfully added status controls to ${emailCount} emails!`);
    }
};

// DISABLED - User requested removal of purple button
// function addManualButton() { }
// Button creation code removed

console.log('=== EMAIL STATUS MANUAL CONTROLS READY ===');
console.log('1. Run diagnoseEmailStatus() to check what\'s wrong');
console.log('2. Run forceAddEmailStatus() to manually add buttons');
console.log('==========================================');