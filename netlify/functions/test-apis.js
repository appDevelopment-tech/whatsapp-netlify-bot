/**
 * Simplified API Testing Endpoint
 * Lightweight wrapper for individual API testing
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

  try {
    const { queryStringParameters } = event;
    const apiToTest = queryStringParameters?.api || 'all';

    let result;

    switch (apiToTest) {
      case 'whatsapp':
        result = { whatsapp: await wrapTest(testWhatsApp) };
        break;
      case 'anthropic':
      case 'openai': // Legacy support
        result = { anthropic: await wrapTest(testAnthropic) };
        break;
      case 'google':
      case 'googleSheets':
      case 'googleDocs':
      case 'googleCalendar':
        result = { google: await wrapTest(testGoogle) };
        break;
      case 'all':
      default:
        result = {
          whatsapp: await wrapTest(testWhatsApp),
          anthropic: await wrapTest(testAnthropic),
          google: await wrapTest(testGoogle)
        };
        break;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        requested_api: apiToTest,
        results: result
      }, null, 2)
    };
  } catch (error) {
    console.error('API test error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Simplified test functions focused on basic connectivity
async function testWhatsApp() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!token || !phoneNumberId) {
    return {
      success: false,
      error: 'Missing WhatsApp credentials',
      details: `Token: ${token ? 'Set' : 'Missing'}, Phone ID: ${phoneNumberId ? 'Set' : 'Missing'}`
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        phoneNumberId,
        details: `Phone: ${data.display_phone_number || 'N/A'} - Connected`
      };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        details: 'Invalid credentials or permissions'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Connection failed',
      details: error.message
    };
  }
}

async function testAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: 'Missing Anthropic API key',
      details: 'ANTHROPIC_API_KEY not configured'
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

    return {
      success: !!(response.content && response.content.length > 0),
      details: 'Claude AI API connection successful'
    };
  } catch (error) {
    return {
      success: false,
      error: 'API connection failed',
      details: error.message
    };
  }
}

async function testGoogle() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (!clientEmail || !privateKey) {
    return {
      success: false,
      error: 'Missing Google credentials',
      details: `Email: ${clientEmail ? 'Set' : 'Missing'}, Key: ${privateKey ? 'Set' : 'Missing'}`
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
      success: true,
      details: `Google APIs authenticated (${clientEmail})`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed',
      details: error.message
    };
  }
}

async function wrapTest(fn) {
  try {
    const res = await fn();
    if (typeof res === 'object' && res !== null) {
      return {
        success: res.success !== undefined ? res.success : res.status === 'connected',
        error: res.error || null,
        details: res.details || res.message || null,
        ...res
      };
    }
    return { success: false, error: 'Unknown error', details: res };
  } catch (e) {
    return { success: false, error: e.message, details: null };
  }
}
