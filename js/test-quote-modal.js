// Test function to directly show a simple quote application modal
window.testQuoteModal = function() {
    console.log('Testing quote modal...');
    
    // Remove any existing modal
    const existingModal = document.getElementById('test-quote-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create simple modal
    const modal = document.createElement('div');
    modal.id = 'test-quote-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px;">
            <h2>Quote Application Test</h2>
            <p>If you can see this, the modal system works!</p>
            <button onclick="document.getElementById('test-quote-modal').remove()" 
                    style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('Test modal added to DOM');
};

// Override createQuoteApplication with a simpler version
window.createQuoteApplicationSimple = function(leadId) {
    console.log('Simple quote application for lead:', leadId);
    
    // IMPORTANT: Remove any existing quote modal first to prevent stacking
    const existingModal = document.getElementById('quote-application-modal');
    if (existingModal) {
        existingModal.remove();
        console.log('Removed existing modal');
    }
    
    // Get the lead data
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find(l => l.id == leadId);
    
    if (!lead) {
        alert('Lead not found');
        return;
    }
    
    // Close the lead profile modal first
    const leadProfileModal = document.getElementById('lead-profile-modal');
    if (leadProfileModal) {
        leadProfileModal.style.display = 'none';
    }
    
    // Create simple modal directly with very high z-index
    const modal = document.createElement('div');
    modal.id = 'quote-application-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    `;
    
    content.innerHTML = `
        <div style="position: relative;">
            <button onclick="document.getElementById('quote-application-modal').remove(); var lpm = document.getElementById('lead-profile-modal'); if(lpm) lpm.style.display = 'block';" 
                    style="position: absolute; top: -10px; right: -10px; background: white; border: 2px solid #ccc; border-radius: 50%; width: 35px; height: 35px; font-size: 24px; cursor: pointer; color: #666; z-index: 10; display: flex; align-items: center; justify-content: center; line-height: 1;"
                    onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#000'" 
                    onmouseout="this.style.backgroundColor='white'; this.style.color='#666'"
                    title="Close">
                <span style="margin-top: -2px;">&times;</span>
            </button>
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #0066cc;">Vanguard Insurance Group LLC</h2>
                <p style="margin: 5px 0;">Brunswick, OH 44256 • 330-241-7570</p>
                <h3 style="margin: 10px 0 0 0;">TRUCKING APPLICATION</h3>
            </div>
        </div>
        
        <form style="font-size: 14px;">
            <!-- GENERAL INFORMATION -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">GENERAL INFORMATION</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Effective Date:</label>
                        <input type="date" value="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Insured's Name (including DBA):</label>
                        <input type="text" value="${lead.name || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Mailing Address:</label>
                        <input type="text" value="${lead.address || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Business Phone:</label>
                        <input type="text" value="${lead.phone || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Email:</label>
                        <input type="text" value="${lead.email || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Garaging Address (if different):</label>
                        <input type="text" value="" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">US DOT #:</label>
                        <input type="text" value="${lead.dotNumber || lead.dot || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">MC #:</label>
                        <input type="text" value="${lead.mcNumber || lead.mc || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Years in Business:</label>
                        <input type="text" value="${lead.yearsInBusiness || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                </div>
            </div>

            <!-- OWNER/PRINCIPAL -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">OWNER/PRINCIPAL</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Owner's Name:</label>
                        <input type="text" value="${lead.contact || ''}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Home Address:</label>
                        <input type="text" value="" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                </div>
            </div>

            <!-- DESCRIPTION OF OPERATION -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">DESCRIPTION OF OPERATION</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" style="margin-right: 5px;"> Haul for Hire
                    </label>
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" style="margin-right: 5px;"> Non-Trucking
                    </label>
                    <div>
                        <label style="font-size: 12px;">Other:</label>
                        <input type="text" style="width: 100%; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                </div>
            </div>

            <!-- PERCENTAGE OF LOADS -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">PERCENTAGE OF LOADS</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">0-100 miles:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="25" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">101-300 miles:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="25" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">301-500 miles:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="25" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">500+ miles:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="25" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CLASS OF RISK -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">CLASS OF RISK</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Dry Van:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Dump Truck:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Flat Bed:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Van/Buses:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Auto Hauler:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Box Truck:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-size: 12px;">Reefer:</label>
                        <div style="display: flex; align-items: center;">
                            <input type="text" value="" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;">
                            <span style="margin-left: 3px;">%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COVERAGES -->
            <div style="background: #f0f4f8; padding: 10px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
                <h4 style="margin: 0 0 10px 0; color: #0066cc;">COVERAGES</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Auto Liability:</label>
                        <input type="text" value="$1,000,000" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Cargo Limit:</label>
                        <input type="text" value="$100,000" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">General Liability:</label>
                        <input type="text" value="$1,000,000" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Deductible:</label>
                        <input type="text" value="$1,000" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                    </div>
                </div>
            </div>
        </form>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc;">
            <button onclick="alert('Application saved!'); document.getElementById('quote-application-modal').remove(); var lpm = document.getElementById('lead-profile-modal'); if(lpm) lpm.style.display = 'block';" 
                    style="background: #0066cc; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-save"></i> Save Application
            </button>
            <button onclick="window.print();" 
                    style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                <i class="fas fa-print"></i> Print
            </button>
            <button onclick="document.getElementById('quote-application-modal').remove(); var lpm = document.getElementById('lead-profile-modal'); if(lpm) lpm.style.display = 'block';" 
                    style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    console.log('Simple modal created and added to DOM');
};

// Replace the complex version with the simple one
window.createQuoteApplication = window.createQuoteApplicationSimple;

console.log('Test quote modal script loaded. Call testQuoteModal() to test.');