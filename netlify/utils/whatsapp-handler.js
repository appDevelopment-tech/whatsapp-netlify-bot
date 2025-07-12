const { getAIResponse } = require('./ai-agent');
const { sendWhatsAppMessage } = require('./whatsapp-api');
const { logChatToSheets } = require('./google-sheets');
const { getKnowledgeBase } = require('./google-docs');

// In-memory store for conversation context (in production, use Redis or database)
const conversationMemory = new Map();

async function handleWhatsAppMessage(message, contact) {
  try {
    console.log('Processing message:', message);
    
    const userPhone = contact.wa_id;
    const messageText = message.text?.body;
    const messageTimestamp = parseInt(message.timestamp) * 1000; // Convert to milliseconds
    
    if (!messageText) {
      console.log('No text message to process');
      return;
    }

    // Check 24-hour window
    const now = Date.now();
    const hoursSinceMessage = (now - messageTimestamp) / (1000 * 60 * 60);
    
    if (hoursSinceMessage > 24) {
      console.log('Message outside 24-hour window, sending template message');
      await sendTemplateMessage(userPhone);
      return;
    }

    // Get conversation context
    const conversationKey = userPhone;
    let conversation = conversationMemory.get(conversationKey) || {
      messages: [],
      lastActivity: now
    };

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: messageText,
      timestamp: messageTimestamp
    });
    conversation.lastActivity = now;

    // Keep only last 10 messages to manage memory
    if (conversation.messages.length > 10) {
      conversation.messages = conversation.messages.slice(-10);
    }

    // Get knowledge base
    const knowledgeBase = await getKnowledgeBase();
    
    // Get AI response
    const aiResponse = await getAIResponse(messageText, knowledgeBase, conversation.messages);
    
    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: now
    });

    // Update conversation memory
    conversationMemory.set(conversationKey, conversation);

    // Send response via WhatsApp
    await sendWhatsAppMessage(userPhone, aiResponse);

    // Log to Google Sheets
    await logChatToSheets({
      user: userPhone,
      message: messageText,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

    console.log('Message processed successfully');

  } catch (error) {
    console.error('Error handling WhatsApp message:', error);
    
    // Send error message to user
    try {
      await sendWhatsAppMessage(contact.wa_id, 'Sorry, I encountered an error. Please try again.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
}

async function sendTemplateMessage(userPhone) {
  try {
    const templatePayload = {
      messaging_product: 'whatsapp',
      to: userPhone,
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US'
        }
      }
    };

    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templatePayload)
    });

    if (!response.ok) {
      throw new Error(`Template message failed: ${response.status}`);
    }

    console.log('Template message sent successfully');
  } catch (error) {
    console.error('Error sending template message:', error);
  }
}

module.exports = { handleWhatsAppMessage };
