/**
 * Force Live Stats Override - Simple direct approach
 */

// Direct override function that works immediately
window.forceLiveStatsOverride = async function() {
    console.log('🚀 FORCING live stats override...');

    try {
        // Get live stats for Grant directly from server
        const response = await fetch('/api/live-agent-stats/Grant');
        const result = await response.json();

        if (result.stats) {
            console.log('📊 Retrieved live stats:', result.stats);

            // Find ALL elements with large font size (stat numbers)
            const allElements = document.querySelectorAll('*');
            let overrideCount = 0;

            for (let element of allElements) {
                const style = window.getComputedStyle(element);

                // Check if it's a stat number element
                if (style.fontSize === '28px' && style.fontWeight === '700') {
                    const parentText = element.parentElement?.textContent?.toLowerCase() || '';

                    let newValue;
                    if (parentText.includes('total leads')) {
                        newValue = result.stats.totalLeads;
                    } else if (parentText.includes('total calls')) {
                        newValue = result.stats.connectedCalls;
                    } else if (parentText.includes('high value')) {
                        newValue = result.stats.highValueLeads;
                    } else if (parentText.includes('duration')) {
                        newValue = result.stats.totalCallDuration;
                    } else if (parentText.includes('contact rate')) {
                        newValue = result.stats.contactRate + '%';
                    }

                    if (newValue !== undefined) {
                        const oldValue = element.textContent;
                        element.textContent = newValue;

                        // Visual feedback
                        element.style.background = '#10b981';
                        element.style.color = 'white';
                        element.style.padding = '4px 8px';
                        element.style.borderRadius = '6px';
                        element.style.border = '2px solid #059669';

                        console.log(`✅ OVERRODE: ${oldValue} → ${newValue} (${parentText.substring(0, 20)}...)`);
                        overrideCount++;

                        setTimeout(() => {
                            element.style.background = '#d1fae5';
                            element.style.color = '#065f46';
                            element.style.border = '2px solid #10b981';
                        }, 2000);
                    }
                }
            }

            console.log(`🎯 Successfully overrode ${overrideCount} stat values with live data`);

            if (overrideCount === 0) {
                console.log('⚠️ No stat elements found to override - modal may not be open');
            }

        } else {
            console.log('❌ No live stats found for Grant');
        }
    } catch (error) {
        console.error('❌ Error forcing live stats override:', error);
    }
};

// Auto-run when modal is detected
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // Check if this is a performance modal
                    if (node.querySelector && (
                        node.querySelector('.agent-performance-content') ||
                        node.classList?.contains('agent-performance-content') ||
                        (node.textContent && node.textContent.includes('Performance Profile'))
                    )) {
                        console.log('🔍 Detected performance modal - auto-triggering live stats override');
                        setTimeout(() => {
                            window.forceLiveStatsOverride();
                        }, 1500); // Wait for modal to fully render
                    }
                }
            });
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('💪 Force Live Stats Override loaded');
console.log('🔧 Manual trigger: window.forceLiveStatsOverride()');