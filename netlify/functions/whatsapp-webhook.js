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
      
      // console.log('Full event:', JSON.stringify(event, null, 2));
      // console.log('Query params:', event.queryStringParameters);
      // console.log('Verification attempt:', { mode, token, expectedToken, challenge });

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
          headers
        };
      }
    }

    // Handle POST request for incoming messages
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      // Verify webhook signature if needed
      // const signature = event.headers['x-hub-signature-256'];
      
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      // Handle different webhook events
      if (body.entry && body.entry[0]?.changes) {
        const change = body.entry[0].changes[0];
        const value = change.value;

        // Handle message events
        if (value.messages) {
          const message = value.messages[0];
          const contact = value.contacts?.[0];
          console.log('Processing message event:', message.id);
          await handleWhatsAppMessage(message, contact);
        }

        // Handle message status updates (delivered, read, failed)
        if (value.statuses) {
          const status = value.statuses[0];
          console.log('Message status update:', status.id, status.status);
          // Log status changes for tracking
        }

        // Handle account review updates
        if (change.field === 'account_review_update') {
          console.log('Account review update:', value);
        }

        // Handle account alerts
        if (change.field === 'account_alerts') {
          console.log('Account alert:', value);
        }

        // Handle business capability updates
        if (change.field === 'business_capability_update') {
          console.log('Business capability update:', value);
        }

        // Handle phone number name updates
        if (change.field === 'phone_number_name_update') {
          console.log('Phone number name update:', value);
        }

        // Handle phone number quality updates
        if (change.field === 'phone_number_quality_update') {
          console.log('Phone number quality update:', value);
        }

        // Handle template category updates
        if (change.field === 'template_category_update') {
          console.log('Template category update:', value);
        }

        // Handle template security updates
        if (change.field === 'template_security_update') {
          console.log('Template security update:', value);
        }
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
