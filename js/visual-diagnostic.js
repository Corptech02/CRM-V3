// Visual Diagnostic Tool - Shows what emails are detected
console.log('👁️ Visual Diagnostic Tool Loading...');

window.visualDiagnostic = function() {
    console.log('=== VISUAL DIAGNOSTIC STARTING ===');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        alert('No COI Inbox found! Navigate to the COI page first.');
        return;
    }

    // Remove any existing diagnostic overlays
    document.querySelectorAll('.diagnostic-overlay').forEach(el => el.remove());

    // Create diagnostic panel
    const panel = document.createElement('div');
    panel.className = 'diagnostic-overlay';
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: black;
        color: lime;
        padding: 15px;
        border: 2px solid lime;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 99999;
        max-width: 400px;
        max-height: 300px;
        overflow-y: auto;
    `;

    let diagnosticHTML = '<h3 style="margin: 0 0 10px 0; color: lime;">🔍 DIAGNOSTIC RESULTS</h3>';

    // Find all potential emails
    const allDivs = coiInbox.querySelectorAll('div');
    const emailCandidates = [];

    allDivs.forEach((div, index) => {
        const onclick = div.getAttribute('onclick') || '';
        const style = window.getComputedStyle(div);
        const text = div.textContent || '';

        // Score each div
        let score = 0;
        let reasons = [];

        if (onclick.includes('Email')) {
            score += 10;
            reasons.push('has Email onclick');
        }
        if (onclick.includes('expand')) {
            score += 10;
            reasons.push('has expand onclick');
        }
        if (style.cursor === 'pointer') {
            score += 5;
            reasons.push('pointer cursor');
        }
        if (div.querySelector('.fa-circle')) {
            score += 8;
            reasons.push('has circle icon');
        }
        if (text.includes('@')) {
            score += 3;
            reasons.push('contains @');
        }
        if (text.includes('COI') || text.includes('Insurance')) {
            score += 3;
            reasons.push('insurance text');
        }
        if (parseFloat(style.padding) > 5) {
            score += 2;
            reasons.push('has padding');
        }
        if (style.borderBottom || style.borderTop) {
            score += 2;
            reasons.push('has border');
        }

        if (score >= 5) {
            emailCandidates.push({
                element: div,
                score: score,
                reasons: reasons,
                index: index
            });

            // Highlight the element
            div.style.outline = `3px solid ${score >= 10 ? 'lime' : 'yellow'}`;
            div.style.outlineOffset = '-3px';

            // Add a label
            const label = document.createElement('div');
            label.className = 'diagnostic-overlay';
            label.style.cssText = `
                position: absolute;
                background: ${score >= 10 ? 'lime' : 'yellow'};
                color: black;
                padding: 2px 5px;
                font-size: 10px;
                font-weight: bold;
                border-radius: 3px;
                z-index: 99998;
                pointer-events: none;
            `;
            label.textContent = `Score: ${score}`;
            div.style.position = 'relative';
            div.appendChild(label);
        }
    });

    // Sort by score
    emailCandidates.sort((a, b) => b.score - a.score);

    // Display results
    diagnosticHTML += `<div style="color: white;">Found ${emailCandidates.length} email candidates:</div>`;

    emailCandidates.slice(0, 10).forEach((candidate, i) => {
        diagnosticHTML += `
            <div style="margin: 5px 0; padding: 5px; background: rgba(0,255,0,0.1); border: 1px solid lime;">
                <strong>#${i + 1} (Score: ${candidate.score})</strong><br>
                ${candidate.reasons.join(', ')}<br>
                <small>${candidate.element.textContent.substring(0, 50)}...</small>
            </div>
        `;
    });

    // Check for existing status buttons
    const existingButtons = document.querySelectorAll('.status-buttons-final, .email-status-controls-aggressive, .force-status-controls');
    diagnosticHTML += `<div style="margin-top: 10px; color: ${existingButtons.length > 0 ? 'lime' : 'red'};">
        Status buttons found: ${existingButtons.length}
    </div>`;

    panel.innerHTML = diagnosticHTML;
    document.body.appendChild(panel);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✖ Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: red;
        color: white;
        border: none;
        padding: 2px 8px;
        cursor: pointer;
        border-radius: 3px;
    `;
    closeBtn.onclick = function() {
        document.querySelectorAll('.diagnostic-overlay').forEach(el => el.remove());
        allDivs.forEach(div => {
            div.style.outline = '';
            div.style.outlineOffset = '';
        });
    };
    panel.appendChild(closeBtn);

    console.log('=== DIAGNOSTIC COMPLETE ===');
    console.log(`Found ${emailCandidates.length} potential emails`);
    console.log('Top candidates:', emailCandidates.slice(0, 5));
};

// Auto-inject status buttons with visual feedback
window.autoInjectWithFeedback = function() {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        alert('Navigate to COI inbox first!');
        return;
    }

    // Find all potential emails
    const candidates = [];

    // Strategy 1: Find by onclick
    coiInbox.querySelectorAll('[onclick]').forEach(el => {
        if (!el.querySelector('.status-buttons-final')) {
            candidates.push(el);
        }
    });

    // Strategy 2: Find by cursor pointer
    coiInbox.querySelectorAll('div').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.cursor === 'pointer' && !el.querySelector('.status-buttons-final') && !candidates.includes(el)) {
            candidates.push(el);
        }
    });

    console.log(`Found ${candidates.length} candidates for button injection`);

    candidates.forEach((el, index) => {
        // Flash the element to show it's being processed
        const originalBg = el.style.background;
        el.style.background = 'yellow';

        setTimeout(() => {
            el.style.background = originalBg;

            // Add the buttons
            if (!el.querySelector('.status-buttons-final')) {
                el.style.position = 'relative';

                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'status-buttons-final';
                buttonsDiv.style.cssText = `
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    gap: 8px;
                    z-index: 99999;
                    background: white;
                    padding: 6px;
                    border-radius: 8px;
                    border: 2px solid #667eea;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                `;

                // Big, obvious buttons
                const checkBtn = document.createElement('button');
                checkBtn.innerHTML = '✅';
                checkBtn.style.cssText = `
                    width: 40px;
                    height: 40px;
                    font-size: 24px;
                    background: #10b981;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                `;
                checkBtn.onclick = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    el.style.background = el.style.background === 'rgb(209, 250, 229)' ? '' : '#d1fae5';
                    el.style.borderLeft = el.style.borderLeft ? '' : '5px solid #10b981';
                    return false;
                };

                const xBtn = document.createElement('button');
                xBtn.innerHTML = '❌';
                xBtn.style.cssText = `
                    width: 40px;
                    height: 40px;
                    font-size: 24px;
                    background: #ef4444;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                `;
                xBtn.onclick = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    el.style.background = el.style.background === 'rgb(254, 226, 226)' ? '' : '#fee2e2';
                    el.style.borderLeft = el.style.borderLeft ? '' : '5px solid #ef4444';
                    el.style.opacity = el.style.opacity === '0.7' ? '1' : '0.7';
                    return false;
                };

                buttonsDiv.appendChild(checkBtn);
                buttonsDiv.appendChild(xBtn);
                el.appendChild(buttonsDiv);
            }
        }, index * 100); // Stagger the processing for visual effect
    });

    setTimeout(() => {
        alert(`✅ Added status buttons to ${candidates.length} emails!`);
    }, candidates.length * 100 + 500);
};

// Add control panel
function addControlPanel() {
    if (document.getElementById('diagnostic-control-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'diagnostic-control-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #1a1a1a;
        border: 2px solid #667eea;
        border-radius: 12px;
        padding: 15px;
        z-index: 99999;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    `;

    panel.innerHTML = `
        <div style="color: white; font-weight: bold; margin-bottom: 10px;">
            🛠️ Email Status Controls
        </div>
        <button onclick="visualDiagnostic()" style="display: block; width: 200px; padding: 10px; margin: 5px 0; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            🔍 Run Visual Diagnostic
        </button>
        <button onclick="autoInjectWithFeedback()" style="display: block; width: 200px; padding: 10px; margin: 5px 0; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            💉 Auto-Inject Buttons
        </button>
        <button onclick="addStatusButtonsToEmails()" style="display: block; width: 200px; padding: 10px; margin: 5px 0; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            🎯 Run Original Fix
        </button>
        <button onclick="window.location.hash = '#coi'; setTimeout(loadRealCOIEmails, 500);" style="display: block; width: 200px; padding: 10px; margin: 5px 0; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            📧 Reload COI Emails
        </button>
        <button onclick="this.parentElement.remove()" style="display: block; width: 200px; padding: 10px; margin: 5px 0; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            ✖ Close Panel
        </button>
    `;

    document.body.appendChild(panel);
}

// Auto-add control panel after 2 seconds
setTimeout(addControlPanel, 2000);

console.log('✅ Visual Diagnostic Tool Ready!');
console.log('📋 Commands:');
console.log('   visualDiagnostic() - Run visual diagnostic');
console.log('   autoInjectWithFeedback() - Auto-inject with visual feedback');
console.log('   Or use the control panel in bottom-left corner');