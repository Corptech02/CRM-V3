// Test script to verify checkbox selection triggers trash icon
console.log('Testing checkbox selection behavior...');

// Wait for page to load
setTimeout(() => {
    // Find the first checkbox
    const firstCheckbox = document.querySelector('.lead-checkbox');

    if (firstCheckbox) {
        console.log('✅ Found lead checkbox');

        // Check the checkbox
        firstCheckbox.checked = true;

        // Trigger the change event
        firstCheckbox.dispatchEvent(new Event('change'));

        // Check if trash icon appeared
        setTimeout(() => {
            const deleteOverlay = document.getElementById('bulkDeleteOverlay');
            if (deleteOverlay && deleteOverlay.style.display !== 'none') {
                console.log('✅ Trash icon appeared when checkbox was selected!');
            } else {
                console.log('❌ Trash icon did not appear');
            }

            // Uncheck and test again
            firstCheckbox.checked = false;
            firstCheckbox.dispatchEvent(new Event('change'));

            setTimeout(() => {
                const overlayAfterUncheck = document.getElementById('bulkDeleteOverlay');
                if (!overlayAfterUncheck || overlayAfterUncheck.style.display === 'none') {
                    console.log('✅ Trash icon hidden when checkbox was unchecked!');
                } else {
                    console.log('❌ Trash icon still visible after unchecking');
                }
            }, 100);
        }, 100);
    } else {
        console.log('❌ No lead checkboxes found on page');
    }
}, 1000);