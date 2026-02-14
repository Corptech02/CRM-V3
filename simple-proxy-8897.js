#!/usr/bin/env node

/**
 * Simple proxy server for port 8897 → 8898
 * Proxies frontend requests to the Python Vanguard API server
 */

const http = require('http');
const url = require('url');

console.log('🔄 Starting simple proxy server 8897 → 8898...');

const server = http.createServer((req, res) => {
    // Route carrier profile and search endpoints to port 3001 (vanguard-backend)
    let targetUrl;
    if (req.url.includes('/api/carrier/profile/') || req.url.includes('/api/search')) {
        targetUrl = `http://localhost:3001${req.url}`;
        console.log(`🔄 ROUTING TO VANGUARD BACKEND: ${req.method} ${req.url} → ${targetUrl}`);
    } else {
        targetUrl = `http://localhost:8898${req.url}`;
    }

    // Log to file for COI requests
    if (req.url.includes('/api/coi/send-request')) {
        const fs = require('fs');
        const debugLog = `🚨🚨🚨 SIMPLE PROXY COI REQUEST ${new Date().toISOString()} 🚨🚨🚨\n` +
                         `Method: ${req.method}\n` +
                         `URL: ${req.url}\n` +
                         `Target: ${targetUrl}\n` +
                         `Headers: ${JSON.stringify(req.headers, null, 2)}\n\n`;
        fs.appendFileSync('/var/www/vanguard/coi-debug-final.log', debugLog);
    }

    console.log(`🚨 SIMPLE PROXY HANDLING REQUEST: ${req.method} ${req.url}`);
    console.log(`📡 Proxying: ${req.method} ${req.url} → ${targetUrl}`);

    // Parse target URL
    const target = url.parse(targetUrl);

    // Create proxy request options
    const proxyOptions = {
        hostname: target.hostname,
        port: target.port,
        path: target.path,
        method: req.method,
        headers: {
            ...req.headers,
            host: target.host
        }
    };

    // Create proxy request
    const proxyReq = http.request(proxyOptions, (proxyRes) => {
        // Copy headers from target response
        res.writeHead(proxyRes.statusCode, proxyRes.headers);

        // Pipe response data
        proxyRes.pipe(res);
    });

    // Handle proxy request errors
    proxyReq.on('error', (err) => {
        console.error('❌ Proxy request error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    });

    // Pipe request data to proxy
    req.pipe(proxyReq);
});

server.listen(8897, () => {
    console.log('✅ Simple proxy server running on port 8897');
    console.log('🔄 All requests will be forwarded to port 8898');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('⚠️ Port 8897 already in use');
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
    }
});
