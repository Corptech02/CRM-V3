// Twilio Voice Bridge - Connects incoming calls to agent
// This TwiML endpoint creates a call bridge between the prospect and agent

module.exports = (req, res) => {
    console.log('🌉 Voice bridge request:', req.body);

    // Your agent phone number (the phone you want to receive calls on)
    // TODO: Change this to YOUR personal phone number where you want to receive calls
    const agentNumber = '+13306369079'; // CHANGE THIS to your actual phone number!

    // Create TwiML that dials the agent
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Connecting you to Vanguard Insurance. Please hold.</Say>
    <Dial timeout="30" record="record-from-answer" recordingStatusCallback="/api/twilio/recording-status">
        <Number>${agentNumber}</Number>
    </Dial>
    <Say voice="Polly.Joanna">I'm sorry, our agent is unavailable. Please leave a message after the tone.</Say>
    <Record maxLength="120" transcribe="true" transcribeCallback="/api/twilio/voicemail-transcription" />
</Response>`;

    console.log('📞 Bridging call to agent:', agentNumber);

    res.type('text/xml');
    res.send(twiml);
};