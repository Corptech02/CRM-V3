#!/usr/bin/env node

/**
 * Simple proxy server for port 8897 → 3001
 * Fixes nginx routing for ViciDial API without external dependencies
 */

const http = require('http');
const url = require('url');

console.log('🔄 Starting simple proxy server 8897 → 3001...');

const server = http.createServer((req, res) => {
    const targetUrl = `http://localhost:3001${req.url}`;

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
    console.log('🔄 All requests will be forwarded to port 3001');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('⚠️ Port 8897 already in use');
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
    }
});