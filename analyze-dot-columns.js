// Analyze DOT Company Census File - 147 Columns
console.log('📊 ANALYZING DOT COMPANY CENSUS FILE (147 COLUMNS)');
console.log('=================================================');

async function analyzeDOTColumns() {
    try {
        // Get metadata about the dataset
        console.log('🔍 Fetching dataset metadata...');
        const metadataUrl = 'https://data.transportation.gov/api/views/az4n-8mr2.json';

        const response = await fetch(metadataUrl);
        const metadata = await response.json();

        console.log(`📋 Dataset: ${metadata.name}`);
        console.log(`📖 Description: ${metadata.description.substring(0, 200)}...`);
        console.log(`📊 Total Columns: ${metadata.columns.length}`);
        console.log(`📈 Download Count: ${metadata.downloadCount.toLocaleString()}`);
        console.log('');

        // List all columns
        console.log('📝 ALL 147 COLUMNS:');
        console.log('===================');

        metadata.columns.forEach((column, index) => {
            const fieldType = column.dataTypeName;
            const fieldName = column.name;
            const description = column.description || 'No description';

            console.log(`${(index + 1).toString().padStart(3, ' ')}. ${fieldName}`);
            console.log(`     Type: ${fieldType}`);
            console.log(`     Desc: ${description.substring(0, 80)}${description.length > 80 ? '...' : ''}`);
            console.log('');
        });

        // Try to get sample data (this will require auth)
        console.log('🔐 TESTING DATA ACCESS (requires authentication)...');
        try {
            const dataUrl = 'https://data.transportation.gov/api/v3/views/az4n-8mr2/query.json?$limit=1';
            const dataResponse = await fetch(dataUrl);
            const dataResult = await dataResponse.json();

            if (dataResult.error) {
                console.log('❌ Authentication Required for Data Access');
                console.log(`   Error: ${dataResult.message}`);
                console.log('   📝 To access data, you need an application token from DOT');
            } else {
                console.log('✅ Data access successful!');
                console.log(`   Records available: ${dataResult.data?.length || 'Unknown'}`);
            }
        } catch (error) {
            console.log(`❌ Data access failed: ${error.message}`);
        }

        // Analysis summary
        const columnTypes = {};
        metadata.columns.forEach(col => {
            columnTypes[col.dataTypeName] = (columnTypes[col.dataTypeName] || 0) + 1;
        });

        console.log('\n📊 COLUMN TYPE BREAKDOWN:');
        Object.entries(columnTypes).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} columns`);
        });

        return {
            totalColumns: metadata.columns.length,
            columns: metadata.columns.map(col => ({
                name: col.name,
                type: col.dataTypeName,
                description: col.description
            })),
            columnTypes: columnTypes,
            dataset: metadata.name
        };

    } catch (error) {
        console.error('❌ Error analyzing DOT dataset:', error);
        return null;
    }
}

// Execute analysis
analyzeDOTColumns().then(results => {
    if (results) {
        console.log('\n✅ DOT Column analysis complete!');
        console.log(`📁 ${results.totalColumns} columns identified for DB-advanced database`);

        // Save results for further processing
        global.dotAnalysis = results;
    }
}).catch(error => {
    console.error('❌ Failed to analyze DOT dataset:', error);
});