// Debug script to check agent field saving
console.log('🔍 Debug Agent Save Script Loaded');

// Override the savePolicy function to debug
const originalSavePolicy = window.savePolicy;
if (originalSavePolicy) {
    window.savePolicy = async function() {
        console.log('🔍 DEBUG: savePolicy called');

        // Check if agent dropdown exists
        const agentDropdown = document.getElementById('overview-agent');
        console.log('🔍 Agent dropdown element:', agentDropdown);
        console.log('🔍 Agent dropdown value:', agentDropdown ? agentDropdown.value : 'NOT FOUND');

        // Check all form elements
        const formElements = document.querySelectorAll('input, textarea, select');
        console.log('🔍 All form elements found:', formElements.length);

        // Find overview tab elements
        const overviewElements = Array.from(formElements).filter(el => el.id && el.id.startsWith('overview-'));
        console.log('🔍 Overview elements:', overviewElements.map(el => ({id: el.id, value: el.value, type: el.type || el.tagName})));

        // Find agent specific element
        const agentElement = Array.from(formElements).find(el => el.id === 'overview-agent');
        console.log('🔍 Agent element in form collection:', agentElement);
        console.log('🔍 Agent element value:', agentElement ? agentElement.value : 'NOT FOUND');

        // Call original function
        return await originalSavePolicy.apply(this, arguments);
    };
}

console.log('🔍 Debug script ready - save a policy to see debug output');