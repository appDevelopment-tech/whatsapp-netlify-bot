/**
 * Lightweight Status Check for UI Dashboard
 * Tests basic service connectivity for web interface
 */

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Test all services for the UI dashboard
    const services = await Promise.allSettled([
      testWhatsApp(),
      testAnthropic(),
      testGoogle()
    ]);

    const [whatsapp, anthropic, google] = services;

    const results = {
      timestamp: new Date().toISOString(),
      services: {
        whatsapp: normalizeStatus(whatsapp),
        anthropic: normalizeStatus(anthropic),
        google: normalizeStatus(google)
      },
      build_info: {
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results, null, 2)
    };

  } catch (error) {
    console.error('Status check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        error: 'Status check failed',
        message: error.message
      }, null, 2)
    };
  }
};

async function testWhatsApp() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!token || !phoneNumberId) {
    return {
      status: 'not_configured',
      message: `Missing credentials: ${!token ? 'token' : ''} ${!phoneNumberId ? 'phone ID' : ''}`.trim()
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: 'connected',
        message: `Connected: ${data.display_phone_number || phoneNumberId}`
      };
    } else {
      return {
        status: 'error',
        message: `HTTP ${response.status}: Invalid credentials or permissions`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `Connection failed: ${error.message}`
    };
  }
}

async function testAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      message: 'Missing ANTHROPIC_API_KEY environment variable'
    };
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Test' }]
    });

    if (response.content && response.content.length > 0) {
      return {
        status: 'connected',
        message: 'Claude AI API connected successfully'
      };
    } else {
      return {
        status: 'error',
        message: 'Invalid API response'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `API error: ${error.message}`
    };
  }
}

async function testGoogle() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (!clientEmail || !privateKey) {
    return {
      status: 'not_configured',
      message: `Missing Google credentials: ${!clientEmail ? 'email' : ''} ${!privateKey ? 'key' : ''}`.trim()
    };
  }

  try {
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/documents.readonly',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar'
      ]
    });

    await auth.getClient();
    
    return {
      status: 'connected',
      message: `Google APIs authenticated (${clientEmail})`
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Authentication failed: ${error.message}`
    };
  }
}

function normalizeStatus(service) {
  if (service.status === 'fulfilled') service = service.value;
  if (service.status === 'rejected') service = { status: 'error', message: service.reason?.message || 'Connection failed' };
  return {
    success: service.status === 'connected',
    error: service.status === 'error' ? service.message : null,
    details: service.message || null,
    ...service
  };
}
