const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3005;

// Serve saved COI templates
app.get('/coi-template/:policy_number', async (req, res) => {
    try {
        const { policy_number } = req.params;
        const templatePath = path.join('/var/www/vanguard/coi-templates', `${policy_number}_template.pdf`);

        console.log(`📄 Serving COI template for policy: ${policy_number}`);
        console.log(`   Path: ${templatePath}`);

        // Check if file exists
        try {
            await fs.access(templatePath);
        } catch {
            return res.status(404).json({
                error: `No saved COI template for policy ${policy_number}`
            });
        }

        const pdfBuffer = await fs.readFile(templatePath);

        // Set headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${policy_number}_template.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error serving template:', error);
        res.status(500).json({ error: error.message });
    }
});

// List all saved templates
app.get('/coi-templates', async (req, res) => {
    try {
        const files = await fs.readdir('/var/www/vanguard/coi-templates');
        const templates = files.filter(f => f.endsWith('_template.pdf'));

        const templateInfo = [];
        for (const template of templates) {
            const policyNum = template.replace('_template.pdf', '');
            const filePath = path.join('/var/www/vanguard/coi-templates', template);
            const stats = await fs.stat(filePath);

            templateInfo.push({
                policy_number: policyNum,
                filename: template,
                size: stats.size,
                modified: stats.mtime,
                url: `http://162.220.14.239:${PORT}/coi-template/${policyNum}`
            });
        }

        res.json({
            count: templateInfo.length,
            templates: templateInfo
        });

    } catch (error) {
        console.error('Error listing templates:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 COI Template Server running on port ${PORT}`);
    console.log(`📁 Serving templates from: /var/www/vanguard/coi-templates/`);
    console.log();
    console.log('📌 Available endpoints:');
    console.log(`   http://162.220.14.239:${PORT}/coi-templates - List all templates`);
    console.log(`   http://162.220.14.239:${PORT}/coi-template/864709702 - View saved COI for policy 864709702`);
});