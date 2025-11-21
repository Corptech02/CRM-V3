const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const sqlite3 = require('sqlite3').verbose();

class GmailIMAPService {
    constructor() {
        this.config = null;
        this.imap = null;
    }

    async initialize() {
        try {
            // Load Gmail configuration from database
            const db = new sqlite3.Database('./vanguard.db');

            return new Promise((resolve, reject) => {
                db.get('SELECT value FROM settings WHERE key = ?', ['gmail_config'], (err, row) => {
                    if (err) {
                        console.error('Error loading Gmail config:', err);
                        reject(err);
                        return;
                    }

                    if (!row) {
                        console.error('Gmail configuration not found. Run gmail-app-password-setup.js first.');
                        reject(new Error('Gmail not configured'));
                        return;
                    }

                    try {
                        this.config = JSON.parse(row.value);

                        if (this.config.type !== 'app_password') {
                            reject(new Error('Gmail not configured with App Password'));
                            return;
                        }

                        console.log('✅ Gmail IMAP service initialized with App Password');
                        console.log('📧 Email:', this.config.email);
                        resolve(true);
                    } catch (parseErr) {
                        console.error('Error parsing Gmail config:', parseErr);
                        reject(parseErr);
                    }

                    db.close();
                });
            });
        } catch (error) {
            console.error('Error initializing Gmail IMAP service:', error);
            throw error;
        }
    }

    async getMessages(maxResults = 20) {
        if (!this.config) {
            throw new Error('Gmail IMAP service not initialized');
        }

        return new Promise((resolve, reject) => {
            const imap = new Imap({
                user: this.config.email,
                password: this.config.password,
                host: this.config.imap_host,
                port: this.config.imap_port,
                tls: true,
                authTimeout: 10000,
                connTimeout: 15000
            });

            const messages = [];

            imap.once('ready', () => {
                console.log('📥 Connected to Gmail IMAP');

                imap.openBox('INBOX', true, (err, box) => {
                    if (err) {
                        console.error('Error opening INBOX:', err);
                        reject(err);
                        return;
                    }

                    // Search for recent emails
                    imap.search(['ALL'], (err, results) => {
                        if (err) {
                            console.error('Error searching emails:', err);
                            reject(err);
                            return;
                        }

                        if (!results || results.length === 0) {
                            console.log('No emails found');
                            resolve([]);
                            return;
                        }

                        // Get the most recent emails
                        const recentResults = results.slice(-maxResults).reverse();

                        const fetch = imap.fetch(recentResults, {
                            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)',
                            struct: true
                        });

                        fetch.on('message', (msg, seqno) => {
                            let headers = {};

                            msg.on('body', (stream, info) => {
                                let buffer = '';
                                stream.on('data', (chunk) => {
                                    buffer += chunk.toString('utf8');
                                });

                                stream.once('end', () => {
                                    headers = Imap.parseHeader(buffer);
                                });
                            });

                            msg.once('end', () => {
                                const message = {
                                    id: headers['message-id'] ? headers['message-id'][0] : `msg_${seqno}`,
                                    threadId: headers['message-id'] ? headers['message-id'][0] : `thread_${seqno}`,
                                    snippet: this.extractSnippet(headers.subject ? headers.subject[0] : ''),
                                    payload: {
                                        headers: [
                                            {
                                                name: 'From',
                                                value: headers.from ? headers.from[0] : ''
                                            },
                                            {
                                                name: 'To',
                                                value: headers.to ? headers.to[0] : ''
                                            },
                                            {
                                                name: 'Subject',
                                                value: headers.subject ? headers.subject[0] : ''
                                            },
                                            {
                                                name: 'Date',
                                                value: headers.date ? headers.date[0] : ''
                                            }
                                        ]
                                    },
                                    internalDate: headers.date ? new Date(headers.date[0]).getTime() : Date.now()
                                };

                                messages.push(message);
                            });
                        });

                        fetch.once('error', (err) => {
                            console.error('Fetch error:', err);
                            reject(err);
                        });

                        fetch.once('end', () => {
                            console.log(`📧 Retrieved ${messages.length} emails via IMAP`);
                            imap.end();
                            resolve(messages);
                        });
                    });
                });
            });

            imap.once('error', (err) => {
                console.error('IMAP connection error:', err);
                reject(err);
            });

            imap.once('end', () => {
                console.log('📪 IMAP connection ended');
            });

            imap.connect();
        });
    }

    extractSnippet(subject) {
        // Create a snippet from the subject line
        return subject.substring(0, 100) + (subject.length > 100 ? '...' : '');
    }

    async getAuthStatus() {
        try {
            await this.initialize();
            return {
                authenticated: true,
                email: this.config.email,
                type: 'app_password',
                message: 'Gmail configured with App Password'
            };
        } catch (error) {
            return {
                authenticated: false,
                error: error.message,
                type: 'app_password_required',
                message: 'Gmail App Password required'
            };
        }
    }
}

module.exports = GmailIMAPService;