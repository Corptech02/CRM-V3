#!/usr/bin/env node

/**
 * Quickfire proxy server for port 8896 → 8899
 * Proxies requests to the Quickfire Blazor application
 */

const http = require('http');
const url = require('url');

console.log('🔄 Starting Quickfire proxy server 8896 → 8899...');

const server = http.createServer((req, res) => {
    const targetUrl = `http://localhost:8899${req.url}`;

    console.log(`🔥 QUICKFIRE PROXY: ${req.method} ${req.url} → 8899`);

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
        console.error('❌ Quickfire proxy error:', err.message);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Quickfire Proxy Error</h1><p>Service temporarily unavailable</p>');
    });

    // Pipe request data to proxy
    req.pipe(proxyReq);
});

server.listen(8896, '0.0.0.0', () => {
    console.log('✅ Quickfire proxy server running on port 8896');
    console.log('🔥 All requests forwarded to Quickfire on port 8899');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('⚠️ Port 8896 already in use');
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
    }
});