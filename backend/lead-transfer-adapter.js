// Lead Transfer Integration Adapter
// Connects the Lead-Transfer Python system to our Node.js backend

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const LEAD_TRANSFER_PATH = path.join(__dirname, '../lead-transfer-integration/Lead Transfer');
const ENV_FILE = path.join(LEAD_TRANSFER_PATH, '.env');

class LeadTransferAdapter {
    constructor() {
        this.setupEnvironment();
    }

    setupEnvironment() {
        // Create .env file for Lead Transfer system
        const envContent = `
VICIBOX_USERNAME=${process.env.VICIDIAL_USER || '6666'}
VICIBOX_PASSWORD=${process.env.VICIDIAL_PASS || 'corp06'}
DEEPGRAM_API_KEY=${process.env.DEEPGRAM_API_KEY || ''}
OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}
SUREFIRE_API_URL=http://localhost:3001/api/leads
`.trim();

        fs.writeFileSync(ENV_FILE, envContent);
        console.log('✅ Lead Transfer environment configured');
    }

    async syncVicidialLeads() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Running Lead Transfer sync...');

            const python = spawn('python3', ['lead_scraper.py'], {
                cwd: LEAD_TRANSFER_PATH,
                env: { ...process.env, PYTHONPATH: LEAD_TRANSFER_PATH }
            });

            let outputData = '';
            let errorData = '';

            python.stdout.on('data', (data) => {
                outputData += data.toString();
                console.log('Lead Transfer:', data.toString());
            });

            python.stderr.on('data', (data) => {
                errorData += data.toString();
                console.error('Lead Transfer Error:', data.toString());
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Lead Transfer process exited with code ${code}: ${errorData}`));
                } else {
                    // Parse the output to get leads
                    const leads = this.parseLeadTransferOutput(outputData);
                    resolve(leads);
                }
            });

            python.on('error', (err) => {
                reject(new Error(`Failed to start Lead Transfer: ${err.message}`));
            });
        });
    }

    parseLeadTransferOutput(output) {
        const leads = [];

        try {
            // Look for JSON data in output
            const jsonMatches = output.match(/\{[^}]+\}/g) || [];

            jsonMatches.forEach(match => {
                try {
                    const leadData = JSON.parse(match);
                    leads.push(this.formatLead(leadData));
                } catch (e) {
                    // Skip invalid JSON
                }
            });

            // Also check for leads saved to file
            const leadsFile = path.join(LEAD_TRANSFER_PATH, 'scraped_leads.json');
            if (fs.existsSync(leadsFile)) {
                const fileData = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
                if (Array.isArray(fileData)) {
                    fileData.forEach(lead => leads.push(this.formatLead(lead)));
                }
            }

        } catch (error) {
            console.error('Error parsing Lead Transfer output:', error);
        }

        return leads;
    }

    formatLead(rawLead) {
        return {
            id: `vicidial_${rawLead.lead_id || Date.now()}`,
            name: rawLead.company_name || rawLead.name || 'Unknown',
            company: rawLead.company_name || rawLead.company || '',
            contact: rawLead.contact_name || rawLead.contact || '',
            phone: rawLead.phone_number || rawLead.phone || '',
            email: rawLead.email || '',
            status: rawLead.status || 'SALE',
            stage: rawLead.status === 'SALE' ? 'new' : 'qualified',
            source: 'Vicidial Lead Transfer',

            // Trucking specific fields
            dotNumber: rawLead.dot_number || rawLead.dotNumber || '',
            mcNumber: rawLead.mc_number || rawLead.mcNumber || '',
            fleetSize: rawLead.fleet_size || rawLead.fleetSize || 0,
            yearsInBusiness: rawLead.years_in_business || '',
            radiusOfOperation: rawLead.radius || '',
            commodityHauled: rawLead.commodity || '',
            operatingStates: rawLead.states || '',
            currentCarrier: rawLead.current_carrier || '',
            premium: parseFloat(rawLead.premium || rawLead.price || 0),

            // Additional data
            transcript: rawLead.transcript || rawLead.transcription || '',
            recordingUrl: rawLead.recording_url || rawLead.audio_url || '',
            leadId: rawLead.lead_id || '',
            listId: rawLead.list_id || '',
            callDate: rawLead.call_date || rawLead.last_call || '',
            agent: rawLead.agent || rawLead.user || '',
            notes: rawLead.comments || rawLead.notes || '',

            created: new Date().toISOString()
        };
    }

    async getTranscriptionForLead(leadId, audioUrl) {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', ['-c', `
import sys
sys.path.append('${LEAD_TRANSFER_PATH}')
from lead_scraper import LeadScraper
import asyncio

scraper = LeadScraper()
scraper.setup_deepgram()

async def transcribe():
    result = await scraper.transcribe_audio('${audioUrl}', '${leadId}')
    return result

result = asyncio.run(transcribe())
print(result if result else 'No transcription')
            `], {
                cwd: LEAD_TRANSFER_PATH
            });

            let transcript = '';

            python.stdout.on('data', (data) => {
                transcript += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    resolve(transcript);
                } else {
                    reject(new Error('Transcription failed'));
                }
            });
        });
    }

    async getLeadDetailsFromVicidial(leadId) {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', ['-c', `
import sys
sys.path.append('${LEAD_TRANSFER_PATH}')
from lead_scraper import LeadScraper

scraper = LeadScraper()
driver = scraper.setup_driver()

try:
    # Navigate to lead detail page
    lead_url = f"https://{scraper.AUTH_PREFIX}204.13.233.29/vicidial/admin_modify_lead.php?lead_id=${leadId}&archive_search=No&archive_log=0"
    driver.get(lead_url)

    # Extract lead details
    lead_data = scraper.extract_lead_details(driver)
    print(json.dumps(lead_data))
finally:
    driver.quit()
            `], {
                cwd: LEAD_TRANSFER_PATH
            });

            let output = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        const leadData = JSON.parse(output);
                        resolve(this.formatLead(leadData));
                    } catch (e) {
                        reject(new Error('Failed to parse lead data'));
                    }
                } else {
                    reject(new Error('Failed to get lead details'));
                }
            });
        });
    }
}

module.exports = LeadTransferAdapter;