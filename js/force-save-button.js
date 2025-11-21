// FORCE SAVE BUTTON - Ensures Save button is always present
(function() {
    "use strict";

    console.log("FORCE SAVE BUTTON loading...");

    // Force add save button with multiple strategies
    function forceSaveButton() {
        // Do not add multiple times
        if (document.getElementById("quote-save-btn")) {
            return;
        }

        console.log("Attempting to add Save button...");

        // Strategy 1: Find "Add Quote" button
        let targetButton = null;
        const buttons = Array.from(document.querySelectorAll("button"));

        // Look for various quote-related buttons
        targetButton = buttons.find(btn => {
            const text = btn.textContent.trim();
            return text.includes("Add Quote") ||
                   text.includes("Quote Application") ||
                   text === "+ Add Quote" ||
                   text === "Add Quote +";
        });

        if (\!targetButton) {
            console.log("No target button found for Save button placement");
            return;
        }

        console.log("Target button found:", targetButton.textContent);

        // Create the Save button
        const saveBtn = document.createElement("button");
        saveBtn.id = "quote-save-btn";
        saveBtn.innerHTML = "Save";
        saveBtn.style.cssText = "background: #059669 \!important; color: white \!important; margin-right: 10px \!important; font-weight: bold \!important; padding: 10px 20px \!important; border-radius: 6px \!important; cursor: pointer \!important; font-size: 16px \!important;";

        // Add click handler
        saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Save button clicked");
            
            if (window.exploreQuotes) {
                const quotes = window.exploreQuotes();
                console.log("Quotes captured:", quotes);
            }
        };

        // Insert before the target button
        if (targetButton.parentElement) {
            targetButton.parentElement.insertBefore(saveBtn, targetButton);
            console.log("✅ Save button added successfully");
        }
    }

    // Keep checking every 500ms
    setInterval(() => {
        forceSaveButton();
    }, 500);

    console.log("FORCE SAVE BUTTON loaded");
})();
