// Asterisk SIP Configuration for Vanguard CRM
// This configuration connects your website softphone to the local Asterisk server

window.VanguardAsteriskConfig = {
    // Asterisk Server Details
    server: {
        ws_servers: ['ws://162.220.14.239:8088/ws'],
        uri: 'sip:162.220.14.239:8088',
        domain: '162.220.14.239'
    },

    // Website SIP Account (for SaraPhone/WebRTC)
    website: {
        username: 'vanguard-web',
        password: 'VanguardWeb2025!',
        realm: '162.220.14.239',
        extension: '1000',
        display_name: 'Vanguard CRM Website'
    },

    // Zoiper Account Details (for your desktop)
    zoiper: {
        username: 'zoiper-vanguard',
        password: 'ZoiperVanguard2025!',
        realm: '162.220.14.239',
        extension: '2000',
        server_address: '162.220.14.239:5060',
        display_name: 'Vanguard Zoiper'
    },

    // Conference Settings
    conference: {
        room_number: '1001',
        admin_room: '3000',
        quick_conference: '3000'
    },

    // Calling Instructions
    how_to_call: {
        'Website to Zoiper': 'Dial 2000',
        'Zoiper to Website': 'Dial 1000',
        'Join Conference': 'Dial 1001',
        'Create 3-Way Conference': 'Dial 3000',
        'Echo Test': 'Dial 9999',
        'Connection Test': 'Dial 8888'
    },

    // Configuration Helper Functions
    getSaraPhoneConfig: function() {
        return {
            wsServers: this.server.ws_servers,
            uri: `sip:${this.website.username}@${this.server.domain}`,
            password: this.website.password,
            displayName: this.website.display_name,
            realm: this.website.realm
        };
    },

    getZoiperConfig: function() {
        return {
            'Account Name': 'Vanguard CRM',
            'Username': this.zoiper.username,
            'Password': this.zoiper.password,
            'Domain/Realm': this.zoiper.realm,
            'Proxy Host': this.zoiper.server_address,
            'Transport': 'UDP'
        };
    },

    // Test Connection Function
    testConnection: async function() {
        console.log('🧪 Testing Asterisk Connection...');

        try {
            // Test WebSocket connection
            const ws = new WebSocket(this.server.ws_servers[0]);

            ws.onopen = () => {
                console.log('✅ WebSocket connection successful');
                ws.close();
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket connection failed:', error);
            };

            return true;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }
};

// Auto-configure SaraPhone if present
if (window.saraPhone || document.querySelector('script[src*="saraphone"]')) {
    console.log('🎯 SaraPhone detected - applying Asterisk configuration...');

    // Configuration will be applied when SaraPhone initializes
    setTimeout(() => {
        const config = window.VanguardAsteriskConfig.getSaraPhoneConfig();
        console.log('📞 SaraPhone Asterisk Config:', config);

        // If SaraPhone has a configuration method, apply it
        if (window.saraPhone && window.saraPhone.configure) {
            window.saraPhone.configure(config);
        }
    }, 1000);
}

console.log('🎉 Vanguard Asterisk Configuration Loaded!');
console.log('📋 Configuration Details:', window.VanguardAsteriskConfig);
console.log('');
console.log('🔧 ZOIPER SETUP INSTRUCTIONS:');
console.log('1. Open Zoiper');
console.log('2. Add New Account');
console.log('3. Use these settings:');
const zoiperConfig = window.VanguardAsteriskConfig.getZoiperConfig();
Object.entries(zoiperConfig).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
});
console.log('');
console.log('📞 CALLING INSTRUCTIONS:');
Object.entries(window.VanguardAsteriskConfig.how_to_call).forEach(([action, instruction]) => {
    console.log(`   ${action}: ${instruction}`);
});
console.log('');
console.log('🧪 To test connection: VanguardAsteriskConfig.testConnection()');

export default window.VanguardAsteriskConfig;