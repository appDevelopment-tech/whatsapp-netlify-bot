# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Local development
npm run dev                    # Start Netlify dev server on port 8888

# Build and deployment
npm run build                 # Install dependencies (build step)
npm run deploy               # Deploy to production

# Testing and validation
npm test                     # Run Jest tests
npm run validate-env         # Validate environment variables and project setup
node validate-env.js         # Alternative validation command
```

## Architecture Overview

This is a serverless WhatsApp AI chatbot built with Netlify Functions. The bot integrates with:
- **Claude AI** (Anthropic) for intelligent responses
- **WhatsApp Business API** for messaging
- **Google Services** (Calendar, Sheets, Docs) for data storage and knowledge base

### Core Components

**Netlify Functions** (in `netlify/functions/`):
- `whatsapp-webhook.js` - Main webhook handler for WhatsApp messages
- `status-check.js` - Health check and service status monitoring
- `test-apis.js` - API testing and validation endpoints

**Utilities** (in `netlify/utils/`):
- `whatsapp-handler.js` - Message processing and 24-hour window logic
- `ai-agent.js` - Claude AI integration and response generation
- `whatsapp-api.js` - WhatsApp Business API interface
- `google-*.js` - Google services integration (Sheets, Docs, Calendar)

### Key Architectural Patterns

1. **24-Hour Window Compliance**: Messages outside WhatsApp's 24-hour window trigger template messages
2. **In-Memory Conversation Storage**: Uses Map for conversation context (10 messages max)
3. **Knowledge Base Caching**: Google Docs content cached for 10 minutes
4. **Environment Variable Validation**: Cached checks for required API keys and tokens

### Data Flow

1. WhatsApp → `whatsapp-webhook.js` → `whatsapp-handler.js`
2. Check 24-hour window and fetch knowledge base from Google Docs
3. Generate AI response via Claude API with conversation context
4. Send response through WhatsApp API
5. Log conversation to Google Sheets

## Environment Setup

The project requires multiple API integrations. Use `npm run validate-env` to check configuration:

**Required Variables**:
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp Business API token
- `WHATSAPP_PHONE_NUMBER_ID` - Phone number ID
- `WEBHOOK_VERIFY_TOKEN` - Webhook verification
- `ANTHROPIC_API_KEY` - Claude AI API key
- `GOOGLE_CLIENT_EMAIL` / `GOOGLE_PRIVATE_KEY` - Service account credentials

**Optional Variables**:
- `GOOGLE_DOC_ID_KNOWLEDGE` - Knowledge base document
- `GOOGLE_SHEET_ID_LOGS` - Chat logging sheet
- `GOOGLE_CALENDAR_ID` - Appointment booking calendar

## Production Considerations

- Conversation memory is in-memory only (consider Redis/database for scaling)
- Google API permissions must be shared with service account email
- Webhook URL: `https://your-domain/.netlify/functions/whatsapp-webhook`
- Functions use esbuild bundler (configured in `netlify.toml`)