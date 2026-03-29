(function() {
    console.log('🎨 MANUAL COLOR OVERRIDE LOADED');

    // This function FORCES colors on rows with TODO text
    window.manualColorOverride = function() {
        console.log('🎨 APPLYING MANUAL COLORS');

        const table = document.getElementById('leadsTableBody');
        if (!table) {
            console.error('No table found!');
            return;
        }

        const rows = table.querySelectorAll('tr');
        let colorIndex = 0;
        const colors = ['yellow', 'orange', 'red'];

        rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const todoCell = cells[7];
                const todoText = (todoCell.textContent || '').trim();

                // Only color rows with TODO text
                if (todoText && todoText.length > 0) {
                    const color = colors[colorIndex % 3];
                    colorIndex++;

                    // Clear any existing styles first
                    row.removeAttribute('style');
                    row.removeAttribute('class');

                    // Apply color based on rotation
                    switch(color) {
                        case 'yellow':
                            // YELLOW
                            row.style.backgroundColor = '#fef3c7';
                            row.style.borderLeft = '4px solid #f59e0b';
                            row.style.borderRight = '2px solid #f59e0b';
                            // Force with important
                            row.style.setProperty('background-color', '#fef3c7', 'important');
                            row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
                            row.style.setProperty('border-right', '2px solid #f59e0b', 'important');
                            console.log(`🟡 Row ${idx} -> YELLOW`);
                            break;

                        case 'orange':
                            // ORANGE
                            row.style.backgroundColor = '#fed7aa';
                            row.style.borderLeft = '4px solid #fb923c';
                            row.style.borderRight = '2px solid #fb923c';
                            // Force with important
                            row.style.setProperty('background-color', '#fed7aa', 'important');
                            row.style.setProperty('border-left', '4px solid #fb923c', 'important');
                            row.style.setProperty('border-right', '2px solid #fb923c', 'important');
                            console.log(`🟠 Row ${idx} -> ORANGE`);
                            break;

                        case 'red':
                            // RED
                            row.style.backgroundColor = '#fecaca';
                            row.style.borderLeft = '4px solid #ef4444';
                            row.style.borderRight = '2px solid #ef4444';
                            // Force with important
                            row.style.setProperty('background-color', '#fecaca', 'important');
                            row.style.setProperty('border-left', '4px solid #ef4444', 'important');
                            row.style.setProperty('border-right', '2px solid #ef4444', 'important');
                            console.log(`🔴 Row ${idx} -> RED`);
                            break;
                    }

                    // Also make sure cells are transparent
                    cells.forEach(cell => {
                        cell.style.backgroundColor = 'transparent';
                    });
                } else if (!todoText) {
                    // GREEN for empty TODO
                    row.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                    row.style.borderLeft = '4px solid #10b981';
                    row.style.borderRight = '2px solid #10b981';
                    // Force with important
                    row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                    row.style.setProperty('border-left', '4px solid #10b981', 'important');
                    row.style.setProperty('border-right', '2px solid #10b981', 'important');
                    console.log(`🟢 Row ${idx} -> GREEN (empty TODO)`);

                    cells.forEach(cell => {
                        cell.style.backgroundColor = 'transparent';
                    });
                }
            }
        });

        console.log('✅ Manual colors applied!');
    };

    // Add a button to the page for easy testing
    window.addColorTestButton = function() {
        const button = document.createElement('button');
        button.textContent = 'TEST COLORS';
        button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;';
        button.onclick = window.manualColorOverride;
        document.body.appendChild(button);
        console.log('✅ Test button added to page');
    };

    // Run manual override immediately
    setTimeout(() => {
        console.log('🚀 Running manual color override...');
        window.manualColorOverride();
    }, 2000);

    console.log('✅ Manual Color Override ready - Run window.manualColorOverride()');
})();