// Market Real Data Calculator - Uses actual Log Quote data
console.log('📊 Loading Market real data calculator...');

// Market data calculator class
class MarketDataCalculator {
    constructor() {
        this.quotes = this.loadQuotes();
        this.currentMetric = localStorage.getItem('market_metric') || 'liability';
        this.carrierStats = this.calculateCarrierStats();
    }

    // Load quotes from localStorage
    loadQuotes() {
        try {
            return JSON.parse(localStorage.getItem('market_quotes') || '[]');
        } catch (error) {
            console.error('Error loading quotes:', error);
            return [];
        }
    }

    // Extract numeric value from text field based on current metric
    extractValueByMetric(quote) {
        let text = '';

        switch(this.currentMetric) {
            case 'physical':
                text = quote.physicalCoverage || quote.clientName || '';
                break;
            case 'cargo':
                text = quote.premiumText || '';
                break;
            case 'liability':
            default:
                text = quote.liabilityPerUnit || '';
                break;
        }

        if (!text) return null;

        // Remove common currency symbols and formatting
        const cleanText = text.replace(/[$,\s]/g, '');

        // Extract first number found
        const match = cleanText.match(/(\d+(?:\.\d{2})?)/);
        if (match) {
            return parseFloat(match[1]);
        }

        return null;
    }

    // Legacy method for backward compatibility
    extractPremiumValue(premiumText) {
        if (!premiumText) return null;

        // Remove common currency symbols and formatting
        const cleanText = premiumText.replace(/[$,\s]/g, '');

        // Extract first number found
        const match = cleanText.match(/(\d+(?:\.\d{2})?)/);
        if (match) {
            return parseFloat(match[1]);
        }

        return null;
    }

    // Calculate statistics for each carrier
    calculateCarrierStats() {
        const stats = {};

        // Initialize all carriers with empty stats
        const allCarriers = [
            'Progressive', 'Geico', 'Northland', 'Canal',
            'Occidental', 'Crum & Forster', 'Nico', 'Berkley Prime'
        ];

        allCarriers.forEach(carrier => {
            stats[carrier] = {
                name: carrier,
                quotes: [],
                totalQuotes: 0,
                averageRate: null,
                hasData: false,
                rank: null
            };
        });

        // Process quotes and group by carrier
        this.quotes.forEach(quote => {
            const carrier = quote.carrier;
            if (stats[carrier]) {
                const value = this.extractValueByMetric(quote);
                if (value && value > 0) {
                    stats[carrier].quotes.push({
                        value: value,
                        date: quote.dateCreated,
                        client: quote.clientName || quote.physicalCoverage
                    });
                }
            }
        });

        // Calculate averages and totals
        Object.keys(stats).forEach(carrier => {
            const carrierData = stats[carrier];
            carrierData.totalQuotes = carrierData.quotes.length;

            if (carrierData.totalQuotes > 0) {
                const sum = carrierData.quotes.reduce((acc, quote) => acc + quote.value, 0);
                carrierData.averageRate = Math.round(sum / carrierData.totalQuotes);
                carrierData.hasData = true;
            }
        });

        // Calculate rankings
        const carriersWithData = Object.values(stats).filter(c => c.hasData);
        carriersWithData.sort((a, b) => a.averageRate - b.averageRate);

        carriersWithData.forEach((carrier, index) => {
            carrier.rank = index + 1;
        });

        console.log('📈 Carrier stats calculated:', stats);
        return stats;
    }

    // Get carrier data for display
    getCarrierData(carrierName) {
        return this.carrierStats[carrierName] || {
            name: carrierName,
            quotes: [],
            totalQuotes: 0,
            averageRate: 0,
            hasData: false,
            rank: null
        };
    }

    // Get all carriers sorted by rank
    getRankedCarriers() {
        const carriers = Object.values(this.carrierStats);

        // Separate carriers with data and without data
        const withData = carriers.filter(c => c.hasData).sort((a, b) => a.averageRate - b.averageRate);
        const withoutData = carriers.filter(c => !c.hasData).sort((a, b) => a.name.localeCompare(b.name));

        return [...withData, ...withoutData];
    }

    // Format currency for display
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return null;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Get quote volume text
    getQuoteVolumeText(totalQuotes) {
        if (totalQuotes === 0) return 'No quotes';
        if (totalQuotes === 1) return '1 quote';
        return `${totalQuotes} quotes`;
    }

    // Calculate bar width percentage
    getBarWidth(carrierRate) {
        if (!carrierRate) return 0;

        const withDataCarriers = Object.values(this.carrierStats).filter(c => c.hasData);
        if (withDataCarriers.length === 0) return 0;

        const maxRate = Math.max(...withDataCarriers.map(c => c.averageRate));
        const minRate = Math.min(...withDataCarriers.map(c => c.averageRate));

        if (maxRate === minRate) return 50; // Single carrier case

        return Math.round(((carrierRate - minRate) / (maxRate - minRate)) * 100);
    }

    // Get price bar class based on ranking
    getPriceBarClass(rank, totalRanked) {
        if (!rank || totalRanked === 0) return 'no-data';

        const percentage = rank / totalRanked;

        if (percentage <= 0.25) return 'best';
        if (percentage <= 0.5) return 'good';
        if (percentage <= 0.75) return 'average';
        if (percentage <= 0.9) return 'higher';
        return 'expensive';
    }

    // Get row class for styling
    getRowClass(rank, totalRanked) {
        if (!rank || totalRanked === 0) return 'carrier-row no-data';

        const percentage = rank / totalRanked;

        if (percentage <= 0.25) return 'carrier-row best-price';
        if (percentage <= 0.5) return 'carrier-row good-price';
        if (percentage <= 0.75) return 'carrier-row average-price';
        if (percentage <= 0.9) return 'carrier-row higher-price';
        return 'carrier-row expensive-price';
    }

    // Set calculation metric
    setMetric(metric) {
        this.currentMetric = metric;
        localStorage.setItem('market_metric', metric);
        this.carrierStats = this.calculateCarrierStats();
        console.log(`📊 Market metric changed to: ${metric}`);
    }

    // Refresh data when new quotes are added
    refresh() {
        this.quotes = this.loadQuotes();
        this.carrierStats = this.calculateCarrierStats();
        console.log('📊 Market data refreshed');
    }
}

// Create global market data calculator
window.marketDataCalculator = new MarketDataCalculator();

// Function to rebuild the market table with real data
function rebuildMarketTable() {
    console.log('🔄 Rebuilding market table with real data...');

    const marketTableBody = document.querySelector('.market-table tbody');
    if (!marketTableBody) {
        console.error('❌ Market table body not found');
        console.log('🔍 Retrying in 2 seconds...');
        setTimeout(rebuildMarketTable, 2000);
        return;
    }

    console.log('✅ Found market table body, proceeding with rebuild');

    const rankedCarriers = window.marketDataCalculator.getRankedCarriers();
    const carriersWithData = rankedCarriers.filter(c => c.hasData);
    const totalRanked = carriersWithData.length;

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
    console.log('✅ Market table rebuilt with real data');
}

// Function to refresh market data after saving a quote
function refreshMarketData() {
    if (window.marketDataCalculator) {
        window.marketDataCalculator.refresh();
        rebuildMarketTable();
        console.log('📊 Market data and table refreshed');
    }
}

// Override the original saveQuote function to refresh data
const originalSaveQuote = window.saveQuote;
if (typeof originalSaveQuote === 'function') {
    window.saveQuote = function(carrierName) {
        // Call original save function
        const result = originalSaveQuote(carrierName);

        // Refresh market data after saving
        setTimeout(() => {
            refreshMarketData();
        }, 100);

        return result;
    };
}

// Clear any existing sample/fake data on load
function clearFakeData() {
    console.log('🧹 Clearing any fake/sample data to start fresh...');
    localStorage.removeItem('market_quotes');
    console.log('✅ Cleared market quotes data');
}

// Initialize header text based on saved metric
function initializeMetricHeader() {
    const savedMetric = localStorage.getItem('market_metric') || 'liability';
    const priceHeader = document.querySelector('.price-col');

    if (priceHeader) {
        let headerText = 'Avg Liability Per Unit'; // Default

        switch(savedMetric) {
            case 'physical':
                headerText = 'Avg Physical Per Unit';
                break;
            case 'cargo':
                headerText = 'Avg Cargo';
                break;
            case 'liability':
            default:
                headerText = 'Avg Liability Per Unit';
                break;
        }

        // Update header while preserving the icon
        const icon = priceHeader.querySelector('.metric-selector-icon');
        if (icon) {
            priceHeader.innerHTML = headerText;
            priceHeader.appendChild(icon);
        }

        console.log(`📊 Initialized header with metric: ${savedMetric}`);
    }
}

// Initialize market table when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔄 DOM loaded - initializing market data');
        clearFakeData();
        setTimeout(() => {
            initializeMetricHeader();
            console.log('🔄 About to rebuild market table');
            rebuildMarketTable();
        }, 1000); // Wait for other scripts to load
    });
} else {
    console.log('🔄 DOM already loaded - initializing market data');
    clearFakeData();
    setTimeout(() => {
        initializeMetricHeader();
        console.log('🔄 About to rebuild market table');
        rebuildMarketTable();
    }, 1000);
}

// Also rebuild when market view is shown
const originalLoadMarketView = window.loadMarketView;
if (typeof originalLoadMarketView === 'function') {
    window.loadMarketView = function() {
        console.log('📊 Market view loading - rebuilding table');
        originalLoadMarketView();
        setTimeout(() => {
            rebuildMarketTable();
        }, 100);
    };
}

// Make functions globally available
window.rebuildMarketTable = rebuildMarketTable;
window.refreshMarketData = refreshMarketData;

console.log('✅ Market real data calculator loaded');