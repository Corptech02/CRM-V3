// Create a sample AI campaign to show in the interface
(function() {
    // Check if AI campaigns already exist
    const existingCampaigns = JSON.parse(localStorage.getItem('aiCampaigns') || '[]');
    
    if (existingCampaigns.length === 0) {
        // Create a sample AI campaign
        const sampleAICampaign = {
            id: 'campaign_ai_sample',
            name: 'Q4 Insurance Outreach',
            description: 'AI-powered calling campaign for Q4 insurance leads',
            script: 'I\'m calling about your commercial auto insurance needs. We\'ve helped companies like yours save an average of 20% on their premiums. Would you be interested in a quick quote?',
            leadList: [],
            fromNumber: '+13307652039',
            voiceProfile: 'polly.Joanna',
            status: 'draft',
            created: new Date().toISOString(),
            stats: {
                totalCalls: 0,
                completed: 0,
                answered: 0,
                voicemail: 0,
                noAnswer: 0,
                interested: 0,
                notInterested: 0
            }
        };
        
        localStorage.setItem('aiCampaigns', JSON.stringify([sampleAICampaign]));
        console.log('Sample AI campaign created');
    }
})();