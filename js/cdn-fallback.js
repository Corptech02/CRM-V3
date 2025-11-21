// CDN Fallback Handler - Ensures page works even if external resources fail
(function() {
    'use strict';

    // Check if critical libraries loaded
    window.addEventListener('load', function() {
        // Check Font Awesome
        if (!document.querySelector('.fa')) {
            console.warn('Font Awesome may not have loaded properly');
        }

        // Check Chart.js
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded - charts will be disabled');
            window.Chart = {
                register: function() {},
                Chart: function() { return { destroy: function() {}, update: function() {} }; }
            };
        }

        // Check Firebase (if needed)
        if (typeof firebase === 'undefined') {
            console.warn('Firebase not loaded - real-time features disabled');
            window.firebase = {
                initializeApp: function() {},
                database: function() {
                    return {
                        ref: function() {
                            return {
                                on: function() {},
                                off: function() {},
                                once: function() { return Promise.resolve(); }
                            };
                        }
                    };
                }
            };
        }

        // Check PDF.js
        if (typeof pdfjsLib === 'undefined') {
            console.warn('PDF.js not loaded - PDF features disabled');
            window.pdfjsLib = {
                getDocument: function() {
                    return {
                        promise: Promise.reject('PDF.js not available')
                    };
                }
            };
        }

        // Check jsPDF
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            console.warn('jsPDF not loaded - PDF generation disabled');
        }

        // Remove loading indicators if any CDN fails
        setTimeout(() => {
            const loadingElements = document.querySelectorAll('.loading, .spinner');
            loadingElements.forEach(el => {
                el.style.display = 'none';
            });
        }, 5000);
    });

    // Handle network errors gracefully
    window.addEventListener('error', function(e) {
        if (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') {
            console.warn('Failed to load external resource:', e.target.src || e.target.href);

            // Hide any dependent UI elements
            if (e.target.src && e.target.src.includes('chart.js')) {
                const charts = document.querySelectorAll('canvas');
                charts.forEach(chart => {
                    const parent = chart.parentElement;
                    if (parent) {
                        parent.innerHTML = '<p style="text-align: center; color: #999;">Chart unavailable</p>';
                    }
                });
            }
        }
    }, true);

    // Prevent console errors from breaking the page
    const originalError = console.error;
    console.error = function() {
        // Filter out known non-critical errors
        const args = Array.from(arguments);
        const errorString = args.join(' ');

        if (errorString.includes('ERR_NAME_NOT_RESOLVED') ||
            errorString.includes('net::') ||
            errorString.includes('Failed to load resource')) {
            console.warn('Network resource issue (non-critical):', args[0]);
            return;
        }

        originalError.apply(console, arguments);
    };
})();