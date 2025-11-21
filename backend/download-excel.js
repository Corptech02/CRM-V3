// Excel download endpoint
const express = require('express');
const path = require('path');
const fs = require('fs');

module.exports = function(app) {
    // Serve CSV files for download
    app.get('/download/:filename', (req, res) => {
        const filename = req.params.filename;

        // Validate filename (prevent directory traversal)
        if (filename.includes('..') || filename.includes('/')) {
            return res.status(400).send('Invalid filename');
        }

        const filepath = path.join('/var/www/vanguard', filename);

        // Check if file exists
        if (!fs.existsSync(filepath)) {
            return res.status(404).send('File not found');
        }

        // Set headers for Excel download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Stream the file
        const filestream = fs.createReadStream(filepath);
        filestream.pipe(res);
    });

    console.log('✅ Excel download endpoint ready at /download/:filename');
};