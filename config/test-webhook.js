const fetch = require('node-fetch');

// Test webhook locally
async function testWebhook() {
  const baseUrl = 'http://localhost:8888/.netlify/functions/whatsapp-webhook';
  
  console.log('Testing webhook...');
  
  // Test GET request (verification)
  try {
    const verifyResponse = await fetch(`${baseUrl}?hub.mode=subscribe&hub.verify_token=test&hub.challenge=12345`);
    console.log('Verification test:', verifyResponse.status, await verifyResponse.text());
  } catch (error) {
    console.error('Verification test failed:', error.message);
  }
  
  // Test POST request (message)
  try {
    const messagePayload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '1234567890',
              id: 'msg123',
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: {
                body: 'Hello, I need help!'
              },
              type: 'text'
            }],
            contacts: [{
              profile: {
                name: 'Test User'
              },
              wa_id: '1234567890'
            }]
          }
        }]
      }]
    };

    const messageResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });
    
    console.log('Message test:', messageResponse.status, await messageResponse.text());
  } catch (error) {
    console.error('Message test failed:', error.message);
  }
}

if (require.main === module) {
  testWebhook();
}

module.exports = { testWebhook };
