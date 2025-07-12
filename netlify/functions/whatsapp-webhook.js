const { handleWhatsAppMessage } = require('../utils/whatsapp-handler');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Handle GET request for webhook verification
    if (event.httpMethod === 'GET') {
      const mode = event.queryStringParameters?.['hub.mode'];
      const token = event.queryStringParameters?.['hub.verify_token'];
      const challenge = event.queryStringParameters?.['hub.challenge'];

      // Get verify token from environment variable, fallback to 'test' for development
      const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'test';
      
      console.log('Full event:', JSON.stringify(event, null, 2));
      console.log('Query params:', event.queryStringParameters);
      console.log('Verification attempt:', { mode, token, expectedToken, challenge });

      // Handle case where no query parameters are provided
      if (!event.queryStringParameters) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing query parameters' })
        };
      }

      if (mode === 'subscribe' && token === expectedToken) {
        console.log('Webhook verified successfully');
        return {
          statusCode: 200,
          headers,
          body: challenge
        };
      } else {
        console.log('Webhook verification failed - token mismatch');
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Forbidden', details: { receivedMode: mode, receivedToken: token, expectedToken } })
        };
      }
    }

    // Handle POST request for incoming messages
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      // Verify webhook signature if needed
      // const signature = event.headers['x-hub-signature-256'];
      
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      // Check if it's a message event
      if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value?.messages) {
        const message = body.entry[0].changes[0].value.messages[0];
        const contact = body.entry[0].changes[0].value.contacts[0];
        
        // Process the message asynchronously
        await handleWhatsAppMessage(message, contact);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
