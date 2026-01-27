// Force Market Load - Immediately populate table when script loads
console.log('🚀 Force Market Load script starting...');

function forceMarketTableLoad() {
    console.log('🔄 Forcing market table load...');

    // Wait for market data calculator to be ready
    if (!window.marketDataCalculator) {
        console.log('⏳ Market data calculator not ready, waiting...');
        setTimeout(forceMarketTableLoad, 500);
        return;
    }

    // Find the market table body
    const marketTableBody = document.querySelector('.market-table tbody');
    if (!marketTableBody) {
        console.log('⏳ Market table body not found, waiting...');
        setTimeout(forceMarketTableLoad, 500);
        return;
    }

    console.log('✅ Everything ready, building market table now...');

    // Clear any loading message
    marketTableBody.innerHTML = '';

    // Get carriers and build table
    const rankedCarriers = window.marketDataCalculator.getRankedCarriers();
    const carriersWithData = rankedCarriers.filter(c => c.hasData);
    const totalRanked = carriersWithData.length;

    console.log(`📊 Building table with ${rankedCarriers.length} carriers (${totalRanked} with data)`);

    let tableHTML = '';

    rankedCarriers.forEach((carrier, index) => {
        const displayRank = carrier.hasData ? carrier.rank : '—';
        const averageRate = carrier.hasData
            ? window.marketDataCalculator.formatCurrency(carrier.averageRate)
            : '$0';

        const quoteVolume = window.marketDataCalculator.getQuoteVolumeText(carrier.totalQuotes);
        const barWidth = window.marketDataCalculator.getBarWidth(carrier.averageRate);
        const priceBarClass = window.marketDataCalculator.getPriceBarClass(carrier.rank, totalRanked);
        const rowClass = window.marketDataCalculator.getRowClass(carrier.rank, totalRanked);

        tableHTML += `
            <tr class="${rowClass}">
                <td class="rank">${displayRank}</td>
                <td class="carrier">${carrier.name}</td>
                <td class="price">
                    ${carrier.hasData ? `
                        <div class="price-bar ${priceBarClass}">
                            <span class="price-value">${averageRate}</span>
                            <div class="price-visual" style="width: ${barWidth}%;"></div>
                        </div>
                    ` : `
                        <div class="no-data-message">
                            <span class="no-data-text">${averageRate}</span>
                        </div>
                    `}
                </td>
                <td class="volume">${quoteVolume}</td>
                <td class="action">
                    <button class="btn-details" onclick="showCarrierDetails('${carrier.name}')">Details</button>
                </td>
            </tr>
        `;
    });

    marketTableBody.innerHTML = tableHTML;
    console.log('✅ Market table populated successfully!');
}

// Start trying to load immediately
forceMarketTableLoad();

// Also try when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(forceMarketTableLoad, 500);
    });
} else {
    setTimeout(forceMarketTableLoad, 500);
}

console.log('✅ Force Market Load script loaded');