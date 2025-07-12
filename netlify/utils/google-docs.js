const { google } = require('googleapis');

let auth = null;
let cachedKnowledgeBase = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function getGoogleAuth() {
  if (!auth) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/documents.readonly']
    });
  }
  return auth;
}

async function getKnowledgeBase() {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedKnowledgeBase && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedKnowledgeBase;
    }

    const auth = getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });

    const response = await docs.documents.get({
      documentId: process.env.GOOGLE_DOC_ID_KNOWLEDGE
    });

    const document = response.data;
    let content = '';

    // Extract text from document
    if (document.body && document.body.content) {
      content = extractTextFromDocument(document.body.content);
    }

    // Cache the result
    cachedKnowledgeBase = content;
    lastFetchTime = now;

    console.log('Knowledge base fetched and cached');
    return content;

  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    
    // Return cached version if available, otherwise empty string
    return cachedKnowledgeBase || 'Knowledge base temporarily unavailable.';
  }
}

function extractTextFromDocument(content) {
  let text = '';
  
  for (const element of content) {
    if (element.paragraph) {
      for (const textElement of element.paragraph.elements || []) {
        if (textElement.textRun) {
          text += textElement.textRun.content;
        }
      }
    } else if (element.table) {
      // Handle tables if needed
      for (const row of element.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          text += extractTextFromDocument(cell.content || []);
        }
      }
    }
  }
  
  return text.trim();
}

module.exports = {
  getKnowledgeBase
};
