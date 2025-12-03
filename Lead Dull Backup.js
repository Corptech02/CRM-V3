// LEAD DULLING SYSTEM BACKUP
// Saved on 2025-11-28 before removal
// This file contains all the dulling logic that was removed from the system

// =============================================================================
// 1. CSS DULLING STYLES (from index.html)
// =============================================================================

const dullingCSS = `
/* DULLED LEADS - Apply dulling effect to all Hunter's leads */
tr.dulled-lead,
tr[data-nuclear-highlight$="-dulled"] {
    opacity: 0.6 !important;
    filter: grayscale(30%) !important;
}

tr.dulled-lead td,
tr[data-nuclear-highlight$="-dulled"] td {
    background-color: transparent !important;
    background: transparent !important;
    color: #777 !important;
}

tr.dulled-lead strong,
tr[data-nuclear-highlight$="-dulled"] strong {
    color: #777 !important;
}

/* Specific dulled color combinations */
tr[data-nuclear-highlight="yellow-dulled"] {
    background-color: #fef3c7 !important;
    border-left: 4px solid #f59e0b !important;
    opacity: 0.6 !important;
    filter: grayscale(30%) !important;
}

tr[data-nuclear-highlight="orange-dulled"] {
    background-color: #fed7aa !important;
    border-left: 4px solid #fb923c !important;
    opacity: 0.6 !important;
    filter: grayscale(30%) !important;
}

tr[data-nuclear-highlight="red-dulled"] {
    background-color: #fecaca !important;
    border-left: 4px solid #ef4444 !important;
    opacity: 0.6 !important;
    filter: grayscale(30%) !important;
}

tr[data-nuclear-highlight="green-dulled"] {
    background-color: rgba(16, 185, 129, 0.2) !important;
    border-left: 4px solid #10b981 !important;
    opacity: 0.6 !important;
    filter: grayscale(30%) !important;
}
`;

// =============================================================================
// 2. NUCLEAR HIGHLIGHTING DULLING LOGIC
// =============================================================================

const nuclearHighlightingDullingLogic = `
// CHECK: Should this lead be dulled? (Dull leads NOT assigned to current user)
let currentUserName = '';

// PRIORITY 1: Real authentication from sessionStorage (login.html)
const sessionData = sessionStorage.getItem('vanguard_user');
if (sessionData) {
    try {
        const user = JSON.parse(sessionData);
        currentUserName = user.username || '';
        console.log(\`🔐 REAL AUTH: Using logged-in user: "\${currentUserName}"\`);
    } catch (e) {
        console.error('Failed to parse session data:', e);
    }
}

// PRIORITY 2: Simulation for testing (fallback)
if (!currentUserName) {
    const simulatedUser = localStorage.getItem('simulatedUser');
    if (simulatedUser) {
        currentUserName = simulatedUser;
        console.log(\`🧪 SIMULATION: Using simulated user: "\${currentUserName}"\`);
    }
}

// PRIORITY 3: Old auth service (legacy fallback)
if (!currentUserName && window.authService && window.authService.getCurrentUser) {
    const user = window.authService.getCurrentUser();
    currentUserName = user?.username || user?.full_name || '';
    console.log(\`⚡ LEGACY AUTH: Using auth service user: "\${currentUserName}"\`);
}

const shouldDull = currentUserName &&
                  lead.assignedTo &&
                  lead.assignedTo !== 'Unassigned' &&
                  lead.assignedTo.toLowerCase() !== currentUserName.toLowerCase();

// Debug dulling for all leads containing "FAST ARROW" or first 3 leads
if (index < 3 || lead.name.toLowerCase().includes('fast arrow')) {
    console.log(\`💣 NUCLEAR DULLING: \${lead.name} (\${lead.assignedTo}) vs user "\${currentUserName}" = \${shouldDull ? 'DULLED' : 'VISIBLE'}\`);
    console.log(\`   • currentUserName: "\${currentUserName}"\`);
    console.log(\`   • lead.assignedTo: "\${lead.assignedTo}"\`);
    console.log(\`   • Not Unassigned: \${lead.assignedTo !== 'Unassigned'}\`);
    console.log(\`   • Names match: \${lead.assignedTo?.toLowerCase() === currentUserName?.toLowerCase()}\`);
}

// DULLED HIGHLIGHTING EXAMPLES:
// if (diffDays === 1) {
//     // YELLOW (will be dulled if Hunter's lead)
//     if (shouldDull) {
//         rowStyle = 'style="background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important; border-right: 2px solid #f59e0b !important; opacity: 0.6 !important; filter: grayscale(30%) !important;"';
//         rowClass = 'timestamp-yellow dulled-lead nuclear-highlight';
//         highlightColor = 'yellow-dulled';
//         console.log(\`🟡🔘 NUCLEAR: \${lead.name} -> YELLOW DULLED (Hunter's lead)\`);
//     } else {
//         rowStyle = 'style="background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important; border-right: 2px solid #f59e0b !important;"';
//         rowClass = 'timestamp-yellow nuclear-highlight';
//         highlightColor = 'yellow';
//         console.log(\`🟡 NUCLEAR: \${lead.name} -> YELLOW\`);
//     }
// }
`;

// =============================================================================
// 3. COMPLETE NUCLEAR HIGHLIGHTING DULLING CONDITIONS
// =============================================================================

const completeDullingConditions = \`
// Process Complete dulling
if (isProcessComplete) {
    if (shouldDull) {
        rowStyle = 'style="background-color: rgba(156, 163, 175, 0.3) !important; border-left: 4px solid #9ca3af !important; border-right: 2px solid #9ca3af !important; opacity: 0.6 !important; filter: grayscale(30%) !important;"';
        rowClass = 'process-complete dulled-lead nuclear-highlight';
        highlightColor = 'grey-dulled';
        console.log(\`⚫🔘 NUCLEAR: \${lead.name} -> GREY DULLED (Process complete - Hunter's lead)\`);
    } else {
        rowStyle = 'style="background-color: rgba(156, 163, 175, 0.3) !important; border-left: 4px solid #9ca3af !important; border-right: 2px solid #9ca3af !important;"';
        rowClass = 'process-complete nuclear-highlight';
        highlightColor = 'grey';
        console.log(\`⚫ NUCLEAR: \${lead.name} -> GREY (Process complete)\`);
    }
} else if (stageRequiresReachOut && isReachOutComplete) {
    // GREEN highlighting for empty TODO (reach out complete) - overrides timestamp highlighting
    if (shouldDull) {
        rowStyle = 'style="background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important; border-right: 2px solid #10b981 !important; opacity: 0.6 !important; filter: grayscale(30%) !important;"';
        rowClass = 'reach-out-complete dulled-lead nuclear-highlight';
        highlightColor = 'green-dulled';
        console.log(\`🟢🔘 NUCLEAR: \${lead.name} -> GREEN DULLED (Empty TODO - Hunter's completed reach out)\`);
    } else {
        rowStyle = 'style="background-color: rgba(16, 185, 129, 0.2) !important; border-left: 4px solid #10b981 !important; border-right: 2px solid #10b981 !important;"';
        rowClass = 'reach-out-complete nuclear-highlight';
        highlightColor = 'green';
        console.log(\`🟢 NUCLEAR: \${lead.name} -> GREEN (Empty TODO - completed reach out)\`);
    }
}
\`;

// =============================================================================
// 4. HOW TO RE-ENABLE LEAD DULLING
// =============================================================================

const reEnableInstructions = \`
TO RE-ENABLE LEAD DULLING:

1. Add the CSS styles (dullingCSS) back to index.html in the <style> section
2. Add the user detection logic (nuclearHighlightingDullingLogic) back to nuclear-highlighting-fix.js
3. Update all highlighting conditions to check 'shouldDull' and apply dulled versions
4. Add 'dulled-lead' class to rowClass when shouldDull is true
5. Add dulled highlight colors like 'yellow-dulled', 'green-dulled', etc.

Key points:
- shouldDull = lead is assigned to someone other than current user
- Dulled leads get: opacity: 0.6, filter: grayscale(30%), color: #777
- All highlighting (yellow, orange, red, green, grey) has dulled variants
- Debug logging shows dulling decisions for troubleshooting
\`;

console.log('📁 Lead Dulling System Backup Created');
console.log('This file contains all removed dulling code for future restoration');