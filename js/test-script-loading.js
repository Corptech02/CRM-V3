// Test script to verify script loading works
console.log('🔴 TEST SCRIPT LOADED - This should appear in console');
window.testScriptLoaded = true;

// Test if we can create a simple function
window.testCreateEnhancedProfile = function() {
    console.log('🔴 TEST createEnhancedProfile function called');

    // Create a simple modal to test
    const modal = document.createElement('div');
    modal.id = 'test-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px;">
            <h2>TEST MODAL WORKING!</h2>
            <p>If you see this, script loading works.</p>
            <button onclick="document.getElementById('test-modal').remove()">Close</button>
        </div>
    `;

    document.body.appendChild(modal);
    console.log('🔴 TEST modal created');
};

console.log('🔴 TEST SCRIPT COMPLETE');