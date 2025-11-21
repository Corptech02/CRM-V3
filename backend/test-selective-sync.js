#!/usr/bin/env node

/**
 * Test endpoint for selective ViciDial sync
 * Simulates ViciDial data endpoint with realistic SALE leads
 */

const express = require('express');
const app = express();
const port = 8899;

// Simulate realistic ViciDial SALE leads
const mockSaleLeads = [
    {
        name: 'DAVID FRISINGA RIGHT NOW LLP',
        phone: '(951) 205-9771',
        contact: 'David Frisinga',
        email: 'david@rightnowllp.com',
        state: 'CA',
        dotNumber: 'DOT3456789',
        mcNumber: 'MC876543',
        listId: '1001',
        listName: 'California Commercial Auto',
        status: 'SALE',
        lastCallDate: '2025-10-25',
        callResult: 'SALE - Interested in quote'
    },
    {
        name: 'LORI MANGE FAITH SHIPPING LLC',
        phone: '(567) 855-5308',
        contact: 'Lori Mange',
        email: 'lori@faithshipping.com',
        state: 'OH',
        dotNumber: 'DOT4567890',
        mcNumber: 'MC765432',
        listId: '1002',
        listName: 'Ohio Transportation',
        status: 'SALE',
        lastCallDate: '2025-10-24',
        callResult: 'SALE - Wants quote ASAP'
    },
    {
        name: 'CHARLES HORSLEY TRUCKING',
        phone: '(937) 217-4804',
        contact: 'Charles Horsley',
        email: 'charles@horsleytrucking.com',
        state: 'OH',
        dotNumber: 'DOT5678901',
        mcNumber: 'MC654321',
        listId: '1002',
        listName: 'Ohio Transportation',
        status: 'SALE',
        lastCallDate: '2025-10-26',
        callResult: 'SALE - Current policy expires next month'
    },
    {
        name: 'HOGGIN DA LANES LLC',
        phone: '(216) 633-9985',
        contact: 'Damien Roberts',
        email: 'damien@hoggindlanes.com',
        state: 'OH',
        dotNumber: 'DOT6789012',
        mcNumber: 'MC543210',
        listId: '1003',
        listName: 'Midwest Freight',
        status: 'SALE',
        lastCallDate: '2025-10-25',
        callResult: 'SALE - Looking for better rates'
    },
    {
        name: 'EMN EXPRESS LLC',
        phone: '(469) 974-4101',
        contact: 'Feven Debesay',
        email: 'feven@emnexpress.com',
        state: 'TX',
        dotNumber: 'DOT7890123',
        mcNumber: 'MC432109',
        listId: '1004',
        listName: 'Texas Commercial',
        status: 'SALE',
        lastCallDate: '2025-10-27',
        callResult: 'SALE - Ready to switch carriers'
    },
    {
        name: 'SUNSHINE TRANSPORT INC',
        phone: '(305) 892-4756',
        contact: 'Maria Rodriguez',
        email: 'maria@sunshinetransport.com',
        state: 'FL',
        dotNumber: 'DOT8901234',
        mcNumber: 'MC321098',
        listId: '1005',
        listName: 'Florida Logistics',
        status: 'SALE',
        lastCallDate: '2025-10-26',
        callResult: 'SALE - Needs competitive quote'
    },
    {
        name: 'MOUNTAIN VIEW HAULING',
        phone: '(303) 555-7821',
        contact: 'Jake Thompson',
        email: 'jake@mountainviewhauling.com',
        state: 'CO',
        dotNumber: 'DOT9012345',
        mcNumber: 'MC210987',
        listId: '1006',
        listName: 'Colorado Mountain Region',
        status: 'SALE',
        lastCallDate: '2025-10-25',
        callResult: 'SALE - Expansion coverage needed'
    },
    {
        name: 'ATLANTIC COAST SHIPPING',
        phone: '(843) 422-8901',
        contact: 'Sarah Williams',
        email: 'sarah@atlanticcoastshipping.com',
        state: 'SC',
        dotNumber: 'DOT0123456',
        mcNumber: 'MC109876',
        listId: '1007',
        listName: 'Southeast Coastal',
        status: 'SALE',
        lastCallDate: '2025-10-24',
        callResult: 'SALE - Policy renewal due soon'
    }
];

const mockVicidialLists = [
    {
        id: '1001',
        name: 'California Commercial Auto',
        description: 'Commercial Auto Leads - California',
        totalLeads: 150,
        saleLeads: 23,
        lastUpdated: '2025-10-27'
    },
    {
        id: '1002',
        name: 'Ohio Transportation',
        description: 'Commercial Auto Leads - Ohio',
        totalLeads: 200,
        saleLeads: 31,
        lastUpdated: '2025-10-27'
    },
    {
        id: '1003',
        name: 'Midwest Freight',
        description: 'Commercial Auto Leads - Midwest',
        totalLeads: 180,
        saleLeads: 28,
        lastUpdated: '2025-10-26'
    },
    {
        id: '1004',
        name: 'Texas Commercial',
        description: 'Commercial Auto Leads - Texas',
        totalLeads: 300,
        saleLeads: 45,
        lastUpdated: '2025-10-27'
    },
    {
        id: '1005',
        name: 'Florida Logistics',
        description: 'Commercial Auto Leads - Florida',
        totalLeads: 120,
        saleLeads: 19,
        lastUpdated: '2025-10-26'
    },
    {
        id: '1006',
        name: 'Colorado Mountain Region',
        description: 'Commercial Auto Leads - Colorado',
        totalLeads: 90,
        saleLeads: 14,
        lastUpdated: '2025-10-25'
    },
    {
        id: '1007',
        name: 'Southeast Coastal',
        description: 'Commercial Auto Leads - Southeast',
        totalLeads: 160,
        saleLeads: 22,
        lastUpdated: '2025-10-24'
    }
];

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// ViciDial data endpoint
app.get('/api/vicidial/data', (req, res) => {
    console.log('📞 Mock ViciDial data requested');

    // Simulate a slight delay like real ViciDial
    setTimeout(() => {
        res.json({
            success: true,
            connection: 'ViciDial Server 204.13.233.29',
            timestamp: new Date().toISOString(),
            lists: mockVicidialLists,
            saleLeads: mockSaleLeads,
            totalSaleLeads: mockSaleLeads.length,
            message: `Found ${mockSaleLeads.length} SALE leads across ${mockVicidialLists.length} active lists`
        });
    }, 800); // Simulate network delay
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Mock ViciDial Data Server',
        saleLeads: mockSaleLeads.length
    });
});

app.listen(port, () => {
    console.log('🧪 Mock ViciDial Data Server started');
    console.log(`📞 Serving ${mockSaleLeads.length} SALE leads on port ${port}`);
    console.log(`🔗 Endpoint: http://localhost:${port}/api/vicidial/data`);
    console.log('');
    console.log('This simulates the ViciDial connection for testing the selective sync.');
    console.log('The selective sync popup should show these leads for selection.');
});