// Fix Stage Count Display Issue - Prevents "$0$0$0$0..." concatenation
console.log('Fixing stage count display issue...');

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Monitor for stage count elements and fix any string concatenation issues
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                fixStageCountDisplay();
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Fix immediately on load
    setTimeout(fixStageCountDisplay, 100);
    setTimeout(fixStageCountDisplay, 500);
    setTimeout(fixStageCountDisplay, 1000);
});

function fixStageCountDisplay() {
    const stageCountElements = document.querySelectorAll('.stage-count');

    stageCountElements.forEach(element => {
        const content = element.textContent || element.innerHTML;

        // Check if content contains the "$0$0$0..." pattern
        if (content.includes('$0$0') || content.match(/\d+\$0(\$0)+/)) {
            console.log('Found problematic stage count:', content);

            // Extract the actual number from the beginning
            const match = content.match(/^(\d+)/);
            if (match) {
                const actualCount = parseInt(match[1]);
                console.log('Fixing stage count from', content, 'to', actualCount);
                element.textContent = actualCount.toString();
            }
        }
    });

    // Also check for any elements that might have been missed
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
        if (element.children.length === 0) { // Only text nodes
            const content = element.textContent;
            if (content && content.includes('$0$0') && content.match(/\d+\$0(\$0)+/)) {
                console.log('Found problematic content in element:', content);
                const match = content.match(/^(\d+)/);
                if (match) {
                    const actualCount = parseInt(match[1]);
                    console.log('Fixing content from', content, 'to', actualCount);
                    element.textContent = actualCount.toString();
                }
            }
        }
    });
}

// Override any functions that might be causing the concatenation
window.originalTextContent = Element.prototype.textContent;
Object.defineProperty(Element.prototype, 'textContent', {
    get: function() {
        return this.originalTextContent;
    },
    set: function(value) {
        // Check if value contains the problematic pattern
        if (typeof value === 'string' && value.includes('$0$0')) {
            console.log('Intercepted problematic textContent assignment:', value);
            const match = value.match(/^(\d+)/);
            if (match) {
                const actualCount = parseInt(match[1]);
                console.log('Fixed value from', value, 'to', actualCount);
                this.originalTextContent = actualCount.toString();
                return;
            }
        }
        this.originalTextContent = value;
    }
});

// Also monitor innerHTML assignments
window.originalInnerHTML = Element.prototype.innerHTML;
Object.defineProperty(Element.prototype, 'innerHTML', {
    get: function() {
        return this.originalInnerHTML;
    },
    set: function(value) {
        // Check if value contains the problematic pattern
        if (typeof value === 'string' && value.includes('$0$0')) {
            console.log('Intercepted problematic innerHTML assignment:', value);
            // Fix the value before assigning
            const fixed = value.replace(/(\d+)\$0(\$0)+/g, '$1');
            console.log('Fixed innerHTML from', value, 'to', fixed);
            this.originalInnerHTML = fixed;
            return;
        }
        this.originalInnerHTML = value;
    }
});

console.log('Stage count display fix initialized');