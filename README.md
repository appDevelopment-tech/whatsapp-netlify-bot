# WhatsApp Netlify Bot

A serverless WhatsApp AI chatbot built with Netlify Functions that handles customer inquiries and appointment booking.

## Features

- 🤖 AI-powered responses using Claude API
- 📅 Google Calendar integration for appointment booking
- 📊 Google Sheets logging for chat history and appointments
- ⏰ 24-hour messaging window compliance
- 🔄 Conversation memory management
- 📱 WhatsApp Business API integration

## Quick Start

### 1. Prerequisites

- Node.js 18+
- WhatsApp Business API access
- Google Cloud Platform account
- Anthropic API key
- Netlify account

### 2. Setup

```bash
# Clone and install
git clone <your-repo>
cd whatsapp-netlify-bot
npm install

# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `WHATSAPP_ACCESS_TOKEN` - Your WhatsApp Business API token
- `WHATSAPP_PHONE_NUMBER_ID` - Your WhatsApp phone number ID
- `ANTHROPIC_API_KEY` - Your Claude API key
- `GOOGLE_CLIENT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Service account private key
- `GOOGLE_CALENDAR_ID` - Target calendar ID
- `GOOGLE_SHEET_ID_LOGS` - Chat logs spreadsheet ID
- `GOOGLE_SHEET_ID_APPOINTMENTS` - Appointments spreadsheet ID
- `GOOGLE_DOC_ID_KNOWLEDGE` - Knowledge base document ID

### 4. Google Cloud Setup

1. Create a Google Cloud Project
2. Enable APIs:
   - Google Calendar API
   - Google Sheets API
   - Google Docs API
3. Create a Service Account
4. Download the service account key
5. Share your Calendar, Sheets, and Doc with the service account email

### 5. WhatsApp Setup

1. Set up WhatsApp Business API
2. Configure webhook URL: `https://your-site.netlify.app/.netlify/functions/whatsapp-webhook`
3. Set webhook verification token

### 6. Deploy

```bash
# Deploy to Netlify
netlify init
netlify env:import .env
netlify deploy --prod
```

## Local Development

```bash
# Start local development server
npm run dev

# The webhook will be available at:
# http://localhost:8888/.netlify/functions/whatsapp-webhook
```

## Usage

### Webhook Endpoint

- **URL**: `/.netlify/functions/whatsapp-webhook`
- **Methods**: GET (verification), POST (messages)
- **Verification**: Uses `WEBHOOK_VERIFY_TOKEN`

### Message Flow

1. WhatsApp → Webhook → Message Processing
2. Check 24-hour window
3. Fetch knowledge base from Google Docs
4. Get AI response from Claude
5. Send response via WhatsApp
6. Log conversation to Google Sheets

### 24-Hour Window Logic

- Messages within 24 hours: Process normally
- Messages outside 24 hours: Send template message

## File Structure

```
whatsapp-netlify-bot/
├── netlify/
│   ├── functions/
│   │   └── whatsapp-webhook.js     # Main webhook handler
│   └── utils/
│       ├── whatsapp-handler.js     # Message processing logic
│       ├── ai-agent.js             # Claude AI integration
│       ├── whatsapp-api.js         # WhatsApp API calls
│       ├── google-sheets.js        # Sheets logging
│       ├── google-docs.js          # Knowledge base fetching
│       └── google-calendar.js      # Calendar integration
├── config/
├── public/
├── package.json
├── netlify.toml
└── README.md
```

## Configuration

### Netlify Functions

The `netlify.toml` configures:
- Functions directory
- External dependencies
- Redirects for API routes

### Memory Management

- Conversation history stored in memory (10 messages max)
- Knowledge base cached for 10 minutes
- For production, consider Redis or database

## Testing

```bash
# Run tests
npm test

# Test webhook locally with ngrok
npx ngrok http 8888
# Use the HTTPS URL for WhatsApp webhook
```

## Deployment

### Environment Variables in Netlify

Set all environment variables in Netlify dashboard or via CLI:

```bash
netlify env:set WHATSAPP_ACCESS_TOKEN your_token
netlify env:set ANTHROPIC_API_KEY your_key
# ... etc
```

### Production Considerations

1. **Rate Limiting**: Add rate limiting for webhook calls
2. **Error Handling**: Enhanced error reporting
3. **Monitoring**: Add logging and monitoring
4. **Database**: Replace in-memory storage with persistent storage
5. **Security**: Verify webhook signatures
6. **Scaling**: Consider function timeouts and memory limits

## Cost Estimation

For 10 appointments/week (~100 function calls/month):
- Netlify Functions: ~$0.02/month
- Google API calls: Free tier
- Anthropic API: ~$2-5/month
- **Total**: ~$2-5/month

## Troubleshooting

### Common Issues

1. **Functions not deploying**: Check `netlify.toml` configuration
2. **Google API errors**: Verify service account permissions
3. **WhatsApp webhook fails**: Check verification token
4. **AI responses failing**: Verify Anthropic API key

### Debugging

```bash
# View function logs
netlify functions:invoke whatsapp-webhook --payload='{"httpMethod":"GET"}'

# Check function logs in Netlify dashboard
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Netlify Functions docs
3. Check WhatsApp Business API docs
4. Verify Google Cloud API setup

## License

MIT License
