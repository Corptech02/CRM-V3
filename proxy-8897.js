#!/usr/bin/env node

/**
 * Simple proxy server for port 8897 → 3001
 * Fixes nginx routing for ViciDial API
 */

const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();

console.log('🔄 Starting proxy server 8897 → 3001...');

// Create proxy middleware
const proxyMiddleware = httpProxy.createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`📡 Proxying: ${req.method} ${req.url} → http://localhost:3001${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
        res.status(500).json({ error: 'Proxy error', message: err.message });
    }
});

// Use proxy for all requests
app.use('/', proxyMiddleware);

const server = app.listen(8897, () => {
    console.log('✅ Proxy server running on port 8897');
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