#!/usr/bin/env node

/**
 * Simple Environment Validator
 * Checks required environment variables and shows status
 */

console.log('🔍 Validating WhatsApp Bot Environment...\n');

// Required environment variables
const requiredVars = {
  'WHATSAPP_ACCESS_TOKEN': 'WhatsApp Business API Access Token',
  'WHATSAPP_PHONE_NUMBER_ID': 'WhatsApp Business Phone Number ID', 
  'WEBHOOK_VERIFY_TOKEN': 'Webhook verification token',
  'ANTHROPIC_API_KEY': 'Anthropic Claude API Key',
  'GOOGLE_CLIENT_EMAIL': 'Google Service Account Email',
  'GOOGLE_PRIVATE_KEY': 'Google Service Account Private Key'
};

// Optional environment variables
const optionalVars = {
  'GOOGLE_DOC_ID_KNOWLEDGE': 'Google Document ID for knowledge base',
  'GOOGLE_SHEET_ID_LOGS': 'Google Sheet ID for chat logs',
  'GOOGLE_CALENDAR_ID': 'Google Calendar ID'
};

let allValid = true;
let warnings = [];

console.log('📋 Required Variables:');
for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  if (value) {
    // Basic validation
    let isValid = true;
    if (varName === 'WHATSAPP_ACCESS_TOKEN' && !value.startsWith('EAA')) {
      isValid = false;
    }
    if (varName === 'WHATSAPP_PHONE_NUMBER_ID' && !/^\d+$/.test(value)) {
      isValid = false;
    }
    if (varName === 'ANTHROPIC_API_KEY' && !value.startsWith('sk-ant-')) {
      isValid = false;
    }
    if (varName === 'GOOGLE_CLIENT_EMAIL' && !value.includes('@')) {
      isValid = false;
    }
    if (varName === 'GOOGLE_PRIVATE_KEY' && !value.includes('-----BEGIN PRIVATE KEY-----')) {
      isValid = false;
    }

    const icon = isValid ? '✅' : '⚠️ ';
    const status = isValid ? 'Valid' : 'Invalid format';
    console.log(`${icon} ${varName}: ${status}`);
    
    if (!isValid) {
      allValid = false;
    }
  } else {
    console.log(`❌ ${varName}: Missing`);
    allValid = false;
  }
}

console.log('\n📋 Optional Variables:');
for (const [varName, description] of Object.entries(optionalVars)) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`⚠️  ${varName}: Not set (${description})`);
    warnings.push(`Consider setting ${varName} for ${description}`);
  }
}

console.log('\n🏗️  Project Files:');
const fs = require('fs');
const requiredFiles = [
  'package.json',
  'netlify.toml', 
  'netlify/functions/whatsapp-webhook.js',
  'netlify/functions/status-check.js',
  'netlify/functions/test-apis.js',
  'public/index.html'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const icon = exists ? '✅' : '❌';
  const status = exists ? '' : ' - MISSING';
  console.log(`${icon} ${file}${status}`);
  if (!exists) allValid = false;
});

console.log('\n📊 Summary:');
if (allValid) {
  console.log('🎉 Environment is properly configured!');
  console.log('✅ All required variables are set with valid formats');
  console.log('✅ All required files are present');
  console.log('\n🚀 Ready to deploy! Your UI dashboard will show service status.');
} else {
  console.log('❌ Configuration issues found - please fix the missing/invalid items above');
}

if (warnings.length > 0) {
  console.log('\n💡 Optional Recommendations:');
  warnings.forEach(warning => console.log(`• ${warning}`));
}

console.log('\n🌐 Next Steps:');
console.log('• Deploy to Netlify: netlify deploy --prod');
console.log('• Check status dashboard: https://your-domain/');
console.log('• Test webhook: /.netlify/functions/whatsapp-webhook');
console.log('• Monitor logs in Netlify dashboard');

process.exit(allValid ? 0 : 1);
