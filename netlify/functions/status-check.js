const { google } = require('googleapis');
const Anthropic = require('@anthropic-ai/sdk');

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

  const status = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Test WhatsApp API
  try {
    const requiredWhatsAppVars = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WEBHOOK_VERIFY_TOKEN'];
    const missingWhatsAppVars = requiredWhatsAppVars.filter(varName => !process.env[varName]);
    
    if (missingWhatsAppVars.length === 0) {
      // Test actual WhatsApp API connection
      const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      });
      
      if (response.ok) {
        status.services.whatsapp = {
          status: 'connected',
          message: 'WhatsApp Business API is properly configured'
        };
      } else {
        const errorData = await response.text();
        status.services.whatsapp = {
          status: 'error',
          message: `WhatsApp API error: ${response.status} - ${errorData}`
        };
      }
    } else {
      status.services.whatsapp = {
        status: 'not_configured',
        message: `Missing environment variables: ${missingWhatsAppVars.join(', ')}`
      };
    }
  } catch (error) {
    status.services.whatsapp = {
      status: 'error',
      message: `WhatsApp API test failed: ${error.message}`
    };
  }

  // Test Anthropic AI
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }]
      });
      
      if (response.content && response.content.length > 0) {
        status.services.anthropic = {
          status: 'connected',
          message: 'Anthropic Claude API is working'
        };
      } else {
        status.services.anthropic = {
          status: 'error',
          message: 'Anthropic API returned unexpected response'
        };
      }
    } else {
      status.services.anthropic = {
        status: 'not_configured',
        message: 'Missing ANTHROPIC_API_KEY environment variable'
      };
    }
  } catch (error) {
    status.services.anthropic = {
      status: 'error',
      message: `Anthropic API test failed: ${error.message}`
    };
  }

  // Test Google Services
  try {
    const requiredGoogleVars = ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'];
    const missingGoogleVars = requiredGoogleVars.filter(varName => !process.env[varName]);
    
    if (missingGoogleVars.length === 0) {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/documents.readonly', 'https://www.googleapis.com/auth/spreadsheets']
      });

      const authClient = await auth.getClient();
      
      status.services.google = {
        status: 'connected',
        message: 'Google API authentication successful'
      };

      // Test Google Docs specifically
      if (process.env.GOOGLE_DOC_ID_KNOWLEDGE) {
        try {
          const docs = google.docs({ version: 'v1', auth });
          const docResponse = await docs.documents.get({
            documentId: process.env.GOOGLE_DOC_ID_KNOWLEDGE
          });
          
          status.services.google_docs = {
            status: 'connected',
            message: `Knowledge base document accessible (${docResponse.data.title})`
          };
        } catch (docError) {
          status.services.google_docs = {
            status: 'error',
            message: `Cannot access knowledge base document: ${docError.message}`
          };
        }
      } else {
        status.services.google_docs = {
          status: 'not_configured',
          message: 'Missing GOOGLE_DOC_ID_KNOWLEDGE environment variable'
        };
      }

      // Test Google Sheets specifically
      if (process.env.GOOGLE_SHEETS_ID) {
        try {
          const sheets = google.sheets({ version: 'v4', auth });
          const sheetResponse = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_ID
          });
          
          status.services.google_sheets = {
            status: 'connected',
            message: `Chat logging spreadsheet accessible (${sheetResponse.data.properties.title})`
          };
        } catch (sheetError) {
          status.services.google_sheets = {
            status: 'error',
            message: `Cannot access logging spreadsheet: ${sheetError.message}`
          };
        }
      } else {
        status.services.google_sheets = {
          status: 'not_configured',
          message: 'Missing GOOGLE_SHEETS_ID environment variable'
        };
      }

    } else {
      status.services.google = {
        status: 'not_configured',
        message: `Missing Google credentials: ${missingGoogleVars.join(', ')}`
      };
    }
  } catch (error) {
    status.services.google = {
      status: 'error',
      message: `Google API test failed: ${error.message}`
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(status, null, 2)
  };
};
