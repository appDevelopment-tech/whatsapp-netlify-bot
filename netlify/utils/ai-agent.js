const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getAIResponse(userMessage, knowledgeBase, conversationHistory = []) {
  try {
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Build conversation context
    const messages = [];
    
    // Add conversation history (limit to prevent token overflow)
    const recentHistory = conversationHistory.slice(-6); // Last 6 messages
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current user message if not already in history
    if (!messages.length || messages[messages.length - 1].content !== userMessage) {
      messages.push({
        role: 'user',
        content: userMessage
      });
    }

    const systemPrompt = `You are the best closing salesman, you are expert at helping people set appointments.

CRITICAL: ONLY use calendar tools when customers explicitly want to book appointments or ask about specific availability. For general questions about services, pricing, or policies, answer directly from the provided document.

- Do NOT include any preamble such as "Based on the document you provided" or "Okay, [Name]." Just jump straight to the answer.
- Don't ever start your response with "based on the document you provided" or "According to the document"
- Don't mention any documents at all, also don't mention today's date unless asked
- Before using calendar tools, confirm: customer wants to book AND their zip code is in service areas AND they have a serviceable appliance

Today's date is: ${currentDate}

${knowledgeBase}

User's question:
${userMessage}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: messages,
      system: systemPrompt
    });

    let aiResponse = response.content[0].text;

    // Clean up the response
    aiResponse = cleanResponse(aiResponse);

    return aiResponse;

  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.';
  }
}

function cleanResponse(text) {
  // Remove bold/italic/strike markers
  text = text.replace(/[*_~]+/g, '');
  
  // Convert [Text](https://url) → Text https://url
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 $2');
  
  // Collapse 3+ blank lines
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  
  // Remove unwanted source-reference preamble
  text = text.replace(/^.*?based on the document you provided[,:]?\s*/i, '');
  
  return text;
}

module.exports = { getAIResponse };
