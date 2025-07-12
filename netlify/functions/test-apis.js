exports.handler = async (event, context) => {
  // Enable CORS
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
    // Parse query parameters to determine which API to test
    const { queryStringParameters } = event;
    const apiToTest = queryStringParameters?.api;

    let result;

    switch (apiToTest) {
      case 'whatsapp':
        result = await testWhatsAppAPI();
        break;
      case 'openai':
        result = await testOpenAI();
        break;
      case 'googleSheets':
        result = await testGoogleSheets();
        break;
      case 'googleDocs':
        result = await testGoogleDocs();
        break;
      case 'googleCalendar':
        result = await testGoogleCalendar();
        break;
      case 'all':
      default:
        // Test all APIs if no specific API is requested
        result = {
          whatsapp: await testWhatsAppAPI(),
          openai: await testOpenAI(),
          googleSheets: await testGoogleSheets(),
          googleDocs: await testGoogleDocs(),
          googleCalendar: await testGoogleCalendar()
        };
        break;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Test error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Internal server error occurred during API testing'
      })
    };
  }
};

async function testWhatsAppAPI() {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!token || !phoneNumberId) {
      return {
        success: false,
        error: 'Missing WhatsApp credentials',
        details: `Token: ${token ? 'Set' : 'Missing'}, Phone Number ID: ${phoneNumberId ? 'Set' : 'Missing'}`,
        phoneNumberId: phoneNumberId || 'Not configured'
      };
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        phoneNumberId,
        details: `Phone number: ${data.display_phone_number || 'N/A'} - Connection successful`,
        displayPhoneNumber: data.display_phone_number
      };
    } else {
      const errorData = await response.json();
      let errorMessage = 'Unknown error';
      
      if (response.status === 400) {
        errorMessage = 'Invalid phone number ID or access token';
      } else if (response.status === 401) {
        errorMessage = 'Access token is invalid or expired';
      } else if (response.status === 403) {
        errorMessage = 'Phone number is not registered or permission denied';
      } else if (response.status === 404) {
        errorMessage = 'Phone number ID not found';
      }
      
      return {
        success: false,
        error: `HTTP ${response.status} - ${errorMessage}`,
        details: errorData.error?.message || errorMessage,
        phoneNumberId: phoneNumberId || 'Not configured'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Connection failed',
      details: `Network error: ${error.message}`,
      phoneNumberId: phoneNumberId || 'Not configured'
    };
  }
}

async function testOpenAI() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Missing OpenAI API key',
        details: 'OPENAI_API_KEY environment variable is not set',
        keyStatus: 'Not configured'
      };
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const modelCount = data.data ? data.data.length : 0;
      return {
        success: true,
        details: `OpenAI API connection successful - ${modelCount} models available`,
        keyStatus: `Valid (${apiKey.substring(0, 7)}...)`
      };
    } else {
      const errorData = await response.json();
      let errorMessage = 'Unknown error';
      
      if (response.status === 401) {
        errorMessage = 'Invalid API key or unauthorized access';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded or quota exhausted';
      } else if (response.status === 403) {
        errorMessage = 'Forbidden - check API key permissions';
      }
      
      return {
        success: false,
        error: `HTTP ${response.status} - ${errorMessage}`,
        details: errorData.error?.message || errorMessage,
        keyStatus: `Invalid (${apiKey.substring(0, 7)}...)`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Connection failed',
      details: `Network error: ${error.message}`,
      keyStatus: apiKey ? `Set (${apiKey.substring(0, 7)}...)` : 'Not configured'
    };
  }
}

async function testGoogleSheets() {
  try {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!credentials) {
      return {
        success: false,
        error: 'Missing Google Service Account credentials',
        details: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set',
        credentialStatus: 'Not configured'
      };
    }

    // Try to parse the credentials
    const parsedCredentials = JSON.parse(credentials);
    
    // Check if required fields are present
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !parsedCredentials[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: 'Incomplete service account credentials',
        details: `Missing fields: ${missingFields.join(', ')}`,
        credentialStatus: 'Invalid format'
      };
    }
    
    return {
      success: true,
      details: `Google Sheets credentials valid - Project: ${parsedCredentials.project_id}`,
      credentialStatus: `Valid (${parsedCredentials.client_email})`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid credentials format',
      details: `JSON parsing error: ${error.message}`,
      credentialStatus: 'Invalid JSON'
    };
  }
}

async function testGoogleDocs() {
  try {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!credentials) {
      return {
        success: false,
        error: 'Missing Google Service Account credentials',
        details: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set',
        credentialStatus: 'Not configured'
      };
    }

    // Try to parse the credentials
    const parsedCredentials = JSON.parse(credentials);
    
    // Check if required fields are present
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !parsedCredentials[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: 'Incomplete service account credentials',
        details: `Missing fields: ${missingFields.join(', ')}`,
        credentialStatus: 'Invalid format'
      };
    }
    
    return {
      success: true,
      details: `Google Docs credentials valid - Project: ${parsedCredentials.project_id}`,
      credentialStatus: `Valid (${parsedCredentials.client_email})`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid credentials format',
      details: `JSON parsing error: ${error.message}`,
      credentialStatus: 'Invalid JSON'
    };
  }
}

async function testGoogleCalendar() {
  try {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!credentials) {
      return {
        success: false,
        error: 'Missing Google Service Account credentials',
        details: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set',
        credentialStatus: 'Not configured'
      };
    }

    // Try to parse the credentials
    const parsedCredentials = JSON.parse(credentials);
    
    // Check if required fields are present
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !parsedCredentials[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: 'Incomplete service account credentials',
        details: `Missing fields: ${missingFields.join(', ')}`,
        credentialStatus: 'Invalid format'
      };
    }
    
    return {
      success: true,
      details: `Google Calendar credentials valid - Project: ${parsedCredentials.project_id}`,
      credentialStatus: `Valid (${parsedCredentials.client_email})`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid credentials format',
      details: `JSON parsing error: ${error.message}`,
      credentialStatus: 'Invalid JSON'
    };
  }
}
