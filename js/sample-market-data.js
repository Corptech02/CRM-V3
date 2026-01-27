// Sample Market Data - Creates demo quotes for testing
console.log('📊 Loading sample market data for testing...');

function createSampleMarketData() {
    // Check if sample data already exists
    const existingQuotes = JSON.parse(localStorage.getItem('market_quotes') || '[]');
    if (existingQuotes.length > 0) {
        console.log('📋 Sample data already exists, skipping creation');
        return;
    }

    // Create sample quotes for different carriers
    const sampleQuotes = [
        // Progressive - Best prices
        {
            id: Date.now() + 1,
            carrier: 'Progressive',
            clientName: 'ABC Transport LLC',
            premiumText: '$4,100',
            liabilityPerUnit: '$1,000,000',
            quoteNotes: 'Fleet discount applied',
            dateCreated: new Date(Date.now() - 86400000 * 5).toISOString(),
            dateCreatedFormatted: new Date(Date.now() - 86400000 * 5).toLocaleDateString()
        },
        {
            id: Date.now() + 2,
            carrier: 'Progressive',
            clientName: 'Quick Delivery Co',
            premiumText: '$4,350',
            liabilityPerUnit: '$1,000,000',
            quoteNotes: 'Commercial auto policy',
            dateCreated: new Date(Date.now() - 86400000 * 3).toISOString(),
            dateCreatedFormatted: new Date(Date.now() - 86400000 * 3).toLocaleDateString()
        },
        {
            id: Date.now() + 3,
            carrier: 'Progressive',
            clientName: 'Metro Logistics',
            premiumText: '$4,300',
            liabilityPerUnit: '$2,000,000',
            quoteNotes: 'Higher liability coverage',
            dateCreated: new Date(Date.now() - 86400000 * 1).toISOString(),
            dateCreatedFormatted: new Date(Date.now() - 86400000 * 1).toLocaleDateString()
        },

        // Geico - Second best
        {
            id: Date.now() + 4,
            carrier: 'Geico',
            clientName: 'Fast Freight Inc',
            premiumText: '$4,850',
            liabilityPerUnit: '$1,000,000',
            quoteNotes: 'Fleet management included',
            dateCreated: new Date(Date.now() - 86400000 * 4).toISOString(),
            dateCreatedFormatted: new Date(Date.now() - 86400000 * 4).toLocaleDateString()
        },
        {
            id: Date.now() + 5,
            carrier: 'Geico',
            clientName: 'City Movers',
            premiumText: '$4,920',
            liabilityPerUnit: '$1,000,000',
            quoteNotes: 'Standard commercial policy',
            dateCreated: new Date(Date.now() - 86400000 * 2).toISOString(),
            dateCreatedFormatted: new Date(Date.now() - 86400000 * 2).toLocaleDateString()
        },

        // Northland - Mid range
        {
            id: Date.now() + 6,
            carrier: 'Northland',
            clientName: 'Trucking Solutions',
            premiumText: '$5,400',
            liabilityPerUnit: '$1,000,000',
            quoteNotes: 'Specialized trucking coverage',
            dateCreated: new Date(Date.now() - 86400000 * 6).toISOString(),
            dateCreatedFormatted: new Date(Date.now() - 86400000 * 6).toLocaleDateString()
        },

        // Canal - Higher prices
        {
            id: Date.now() + 7,
            carrier: 'Canal',
            clientName: 'Regional Transport',
            premiumText: '$6,200',
            liabilityPerUnit: '$1,000,000',
            quoteNotes: 'Regional coverage area',
            dateCreated: new Date(Date.now() - 86400000 * 7).toISOString(),
            dateCreatedFormatted: new Date(Date.now() - 86400000 * 7).toLocaleDateString()
        },

        // Occidental - Even higher
        {
            id: Date.now() + 8,
            carrier: 'Occidental',
            clientName: 'Heavy Haul Co',
            premiumText: '$7,150',
            liabilityPerUnit: '$2,000,000',
            quoteNotes: 'Heavy equipment transport',
            dateCreated: new Date(Date.now() - 86400000 * 8).toISOString(),
            dateCreatedFormatted: new Date(Date.now() - 86400000 * 8).toLocaleDateString()
        }

        // Crum & Forster, Nico, Berkley Prime - No quotes (will show "Not enough data")
    ];

    // Save sample data
    localStorage.setItem('market_quotes', JSON.stringify(sampleQuotes));

    console.log('✅ Sample market data created:', sampleQuotes.length, 'quotes');
    console.log('📊 Carriers with data: Progressive, Geico, Northland, Canal, Occidental');
    console.log('❌ Carriers without data: Crum & Forster, Nico, Berkley Prime');

    // Refresh market data if calculator exists
    if (typeof refreshMarketData === 'function') {
        setTimeout(() => {
            refreshMarketData();
        }, 500);
    }
}

// Auto-create sample data when page loads (for testing)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(createSampleMarketData, 1500);
    });
} else {
    setTimeout(createSampleMarketData, 1500);
}

// Make function globally available for manual testing
window.createSampleMarketData = createSampleMarketData;

console.log('✅ Sample market data script loaded');