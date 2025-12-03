// Clear stuck loading overlays
console.log('🧹 Clearing all loading overlays...');

// Common selectors for loading overlays
const loadingSelectors = [
    '.loading-overlay',
    '.loading',
    '#loadingOverlay',
    '#loading',
    '[class*="loading"]',
    '[id*="loading"]',
    '.modal-overlay',
    '.overlay'
];

// Text-based search for loading elements
const elementsWithLoadingText = [];
document.querySelectorAll('*').forEach(el => {
    if (el.textContent && el.textContent.includes('Loading Lead Profile')) {
        elementsWithLoadingText.push(el);
    }
});

console.log(`Found ${elementsWithLoadingText.length} elements with loading text`);

// Remove elements with loading text
elementsWithLoadingText.forEach((el, idx) => {
    console.log(`Removing element ${idx}:`, el);
    el.remove();
});

// Remove by common selectors
loadingSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        elements.forEach(el => {
            console.log('Removing:', el);
            el.remove();
        });
    }
});

// Remove any high z-index overlays
document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const zIndex = parseInt(style.zIndex);
    if (zIndex > 1000 && style.position !== 'static') {
        if (el.textContent.includes('Loading') || el.textContent.includes('Please wait')) {
            console.log('Removing high z-index loading element:', el);
            el.remove();
        }
    }
});

console.log('✅ Loading overlay cleanup complete');