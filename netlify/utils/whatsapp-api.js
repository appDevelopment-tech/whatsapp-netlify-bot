const fetch = require('node-fetch');

async function sendWhatsAppMessage(recipientPhone, message) {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);
    return result;

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

async function sendWhatsAppTemplate(recipientPhone, templateName, languageCode = 'en_US') {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    };

    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`WhatsApp Template API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('WhatsApp template sent successfully:', result);
    return result;

  } catch (error) {
    console.error('Error sending WhatsApp template:', error);
    throw error;
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplate
};
