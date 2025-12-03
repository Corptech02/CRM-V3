// Test script execution to see where it breaks
console.log('🔍 TESTING SCRIPT EXECUTION...');

try {
    // Test if we can access the beginning of final-profile-fix.js
    console.log('1. Testing beginning functions...');
    console.log('   createEnhancedProfile:', typeof window.createEnhancedProfile);
    console.log('   updateLeadField:', typeof window.updateLeadField);

    // Test middle functions
    console.log('2. Testing middle functions...');
    console.log('   openEmailDocumentation:', typeof window.openEmailDocumentation);
    console.log('   checkFilesAndOpenEmail:', typeof window.checkFilesAndOpenEmail);

    // Test end functions
    console.log('3. Testing end functions...');
    console.log('   showLeadProfile:', typeof window.showLeadProfile);
    console.log('   openLossRunsUpload:', typeof window.openLossRunsUpload);
    console.log('   updateReachOut:', typeof window.updateReachOut);

    // Check for syntax errors by trying to evaluate parts of the script
    console.log('4. Checking for JavaScript errors...');

    // Test if window object is accessible
    console.log('   window object accessible:', typeof window !== 'undefined');

    // Test if we can read the script content
    fetch('/js/final-profile-fix.js?v=1005')
        .then(response => response.text())
        .then(script => {
            console.log('5. Script content loaded:', script.length, 'characters');

            // Look for syntax errors
            try {
                // Don't execute, just check syntax
                new Function(script);
                console.log('6. Script syntax is valid ✓');

                // Check if functions are being overridden
                setTimeout(() => {
                    console.log('7. Functions after delay:');
                    console.log('   showLeadProfile:', typeof window.showLeadProfile);
                    console.log('   openEmailDocumentation:', typeof window.openEmailDocumentation);
                    console.log('   checkFilesAndOpenEmail:', typeof window.checkFilesAndOpenEmail);
                    console.log('   openLossRunsUpload:', typeof window.openLossRunsUpload);
                    console.log('   updateReachOut:', typeof window.updateReachOut);
                }, 2000);

            } catch (syntaxError) {
                console.log('6. Script syntax error found:', syntaxError.message);
            }
        })
        .catch(error => {
            console.log('5. Failed to load script:', error.message);
        });

} catch (error) {
    console.log('❌ Error during test:', error.message);
}

console.log('✅ Script execution test complete');