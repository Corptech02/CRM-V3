// Enhanced Quote Application Form with Dynamic Rows
console.log('📝 Enhanced Quote Form Loading...');

// Functions to add/remove rows dynamically
function addCommodityRow() {
    const container = document.getElementById('commodities-container');
    const rows = container.querySelectorAll('.commodity-row');
    if (rows.length >= 4) {
        alert('Maximum 4 commodity rows allowed');
        return;
    }

    const rowHtml = `
        <div class="commodity-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Commodity:</label>
                <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">% of Loads:</label>
                <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 12px;">Max Value:</label>
                <input type="text" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <div>
                <button type="button" onclick="removeCommodityRow(this)" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeCommodityRow(button) {
    button.closest('.commodity-row').remove();
}

function addDriverRow() {
    const container = document.getElementById('drivers-container');
    const rowHtml = `
        <div class="driver-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 2fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Name:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Birth:</label>
                <input type="date" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">License Number:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">State:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Years Experience:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Date of Hire:</label>
                <input type="date" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;"># Accidents/Violations:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <button type="button" onclick="removeDriverRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeDriverRow(button) {
    button.closest('.driver-row').remove();
}

function addTruckRow() {
    const container = document.getElementById('trucks-container');
    const rows = container.querySelectorAll('.truck-row');
    if (rows.length >= 40) {
        alert('Maximum 40 truck rows allowed');
        return;
    }

    const rowHtml = `
        <div class="truck-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Type of Truck:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <button type="button" onclick="removeTruckRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeTruckRow(button) {
    button.closest('.truck-row').remove();
}

function addTrailerRow() {
    const container = document.getElementById('trailers-container');
    const rows = container.querySelectorAll('.trailer-row');
    if (rows.length >= 40) {
        alert('Maximum 40 trailer rows allowed');
        return;
    }

    const rowHtml = `
        <div class="trailer-row" style="display: grid; grid-template-columns: 1fr 2fr 1fr 2fr 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Year:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Make/Model:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Trailer Type:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">VIN:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Value:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 3px; font-weight: bold; font-size: 11px;">Radius:</label>
                <input type="text" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
            </div>
            <div>
                <button type="button" onclick="removeTrailerRow(this)" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

function removeTrailerRow(button) {
    button.closest('.trailer-row').remove();
}

// Make functions globally available
window.addCommodityRow = addCommodityRow;
window.removeCommodityRow = removeCommodityRow;
window.addDriverRow = addDriverRow;
window.removeDriverRow = removeDriverRow;
window.addTruckRow = addTruckRow;
window.removeTruckRow = removeTruckRow;
window.addTrailerRow = addTrailerRow;
window.removeTrailerRow = removeTrailerRow;

console.log('✅ Enhanced Quote Form Functions Loaded');