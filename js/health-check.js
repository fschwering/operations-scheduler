(function () {
    console.log("Health Check Script Loaded");
    const criticalIds = [
        // Chart Header
        "chartTitle",
        "titleInput",
        "titleFontSizeInput",
        "titleAlignSelect",
        "leftHeaderInput",
        "rightHeaderInput",

        // Overall Dates & Width
        "scheduleStartInput",
        "scheduleEndInput",
        "chartWidthInput",

        // Timeline & Interactions
        "showTodayInput",
        "labelUnitSelect",
        "liveDragInput",

        // Grid
        "showGridInput",

        // Tables
        "groupTable",
        "projectTable",
        "itemTable",

        // Buttons
        "toggleChartBtn",
        "undoBtn",
        "redoBtn",
        "updateChartTopBtn",
        "saveTopBtn",
        "loadTopBtn",
        "exportPngTopBtn",
        "exportCsvTopBtn",
        "resetDemoTopBtn"
    ];

    function runHealthCheck() {
        const missing = [];
        criticalIds.forEach(id => {
            if (!document.getElementById(id)) {
                missing.push(id);
            }
        });

        if (missing.length > 0) {
            const msg = "CRITICAL SYSTEM FAILURE:\n\nThe following required elements are missing from the HTML:\n\n" +
                missing.join("\n") +
                "\n\nThe application may not function correctly. Please check the console for more details.";
            console.error("CRITICAL: Missing DOM elements:", missing);
            alert(msg);
        } else {
            console.log("System Health Check Passed: All critical elements found.");
        }
    }

    // Run on load
    window.addEventListener("DOMContentLoaded", runHealthCheck);
})();
