// COI Upload Proxy - Bypasses CORS by forwarding requests server-side
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3002; // Using port 3002 for the proxy

// Enable CORS for all origins (since this is our own proxy)
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Large limit for PDF base64
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'COI Upload Proxy is running' });
});

// Proxy endpoint for COI upload
app.post('/api/proxy/coi/upload', async (req, res) => {
    console.log('📤 Proxying COI upload request...');
    console.log('Policy:', req.body.policy_number);
    console.log('PDF Size:', req.body.pdf_base64 ? req.body.pdf_base64.length : 0);

    try {
        // Forward the request to the ngrok backend
        const response = await axios.post(
            'https://frenzily-nonacculturated-collin.ngrok-free.dev/api/coi/upload',
            req.body,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                timeout: 30000 // 30 second timeout
            }
        );

        console.log('✅ Upload successful:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Proxy error:', error.message);

        if (error.response) {
            // The backend responded with an error
            res.status(error.response.status).json({
                success: false,
                error: error.response.data.error || 'Backend error',
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            res.status(502).json({
                success: false,
                error: 'Cannot connect to website backend',
                details: error.message
            });
        } else {
            // Something else went wrong
            res.status(500).json({
                success: false,
                error: 'Proxy error',
                details: error.message
            });
        }
    }
});

// Start the proxy server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 COI Upload Proxy running on port ${PORT}`);
    console.log(`📡 Proxying requests to: https://frenzily-nonacculturated-collin.ngrok-free.dev`);
    console.log(`✅ Ready to bypass CORS!`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down proxy server...');
    process.exit(0);
});