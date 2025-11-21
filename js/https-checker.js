// HTTPS to HTTP fallback checker
console.log('HTTPS Checker loaded');

(function() {
    // Check if we're on HTTPS trying to access HTTP API
    if (window.location.protocol === 'https:' && window.location.hostname.includes('github.io')) {
        // Check if API is accessible
        const testUrl = 'http://162.220.14.239:8897/health';

        fetch(testUrl)
            .then(response => {
                console.log('API accessible via HTTP');
            })
            .catch(error => {
                console.warn('Cannot access HTTP API from HTTPS site');

                // Show warning message
                const warningDiv = document.createElement('div');
                warningDiv.id = 'https-warning';
                warningDiv.style.cssText = `
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ff9800;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 5px;
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    max-width: 600px;
                    text-align: center;
                `;

                warningDiv.innerHTML = `
                    <strong>⚠️ Database Connection Issue</strong><br>
                    <small>To access the 2.2M carrier database, please use the local HTTP version:</small><br>
                    <a href="http://162.220.14.239:8080" style="color: white; font-weight: bold;">
                        http://162.220.14.239:8080
                    </a><br>
                    <small>(Browser security blocks HTTPS→HTTP connections)</small>
                    <button onclick="this.parentElement.style.display='none'" style="
                        position: absolute;
                        top: 5px;
                        right: 10px;
                        background: none;
                        border: none;
                        color: white;
                        font-size: 20px;
                        cursor: pointer;
                    ">×</button>
                `;

                document.body.appendChild(warningDiv);
            });
    }
})();