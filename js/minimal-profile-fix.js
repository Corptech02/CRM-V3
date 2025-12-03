// Minimal profile fix to test
console.log('🟢 MINIMAL: Script starting...');

// Simple enhanced profile function
window.createEnhancedProfile = function createEnhancedProfile(lead) {
    console.log('🟢 MINIMAL: createEnhancedProfile called for:', lead.name);

    // Remove any existing modals
    const existing = document.getElementById('lead-profile-container');
    if (existing) {
        existing.remove();
    }

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'lead-profile-container';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 1200px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        position: relative;
        padding: 20px;
    `;

    modalContent.innerHTML = `
        <h2 style="margin-top: 0; color: #333;">
            <i class="fas fa-truck"></i> Lead Profile: ${lead.name || 'Unknown'}
        </h2>

        <button onclick="document.getElementById('lead-profile-container').remove()" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: #ff4444;
            color: white;
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
        ">×</button>

        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">Company Information</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Company Name:</label>
                    <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contact:</label>
                    <input type="text" value="${lead.contact || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Phone:</label>
                    <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email:</label>
                    <input type="text" value="${lead.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
        </div>

        <p style="color: #666; font-style: italic;">This is a minimal test version of the enhanced profile.</p>
    `;

    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    console.log('🟢 MINIMAL: Modal created and displayed');
};

console.log('🟢 MINIMAL: Script loaded successfully');

if (window.createEnhancedProfile) {
    console.log('🟢 MINIMAL: createEnhancedProfile function is available');
} else {
    console.error('🟢 MINIMAL: createEnhancedProfile function NOT available');
}