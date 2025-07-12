#!/usr/bin/env node

// Test script to verify the setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking WhatsApp Netlify Bot Setup...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'netlify.toml',
  '.env.example',
  'netlify/functions/whatsapp-webhook.js',
  'netlify/utils/whatsapp-handler.js',
  'netlify/utils/ai-agent.js',
  'netlify/utils/whatsapp-api.js',
  'netlify/utils/google-sheets.js',
  'netlify/utils/google-docs.js',
  'netlify/utils/google-calendar.js',
  'public/index.html',
  'config/test-webhook.js',
  'README.md'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check if .env exists
if (fs.existsSync('.env')) {
  console.log('✅ .env file exists');
} else {
  console.log('⚠️  .env file not found - copy .env.example to .env and configure');
}

// Check node_modules
if (fs.existsSync('node_modules')) {
  console.log('✅ Dependencies installed');
} else {
  console.log('❌ Dependencies not installed - run npm install');
}

console.log('\n📋 Next Steps:');
console.log('1. Copy .env.example to .env and configure your credentials');
console.log('2. Set up Google Cloud Service Account and share resources');
console.log('3. Configure WhatsApp Business API');
console.log('4. Deploy to Netlify: npm run deploy');
console.log('5. Set up WhatsApp webhook URL in Meta Developer Console');

console.log('\n🔧 Available Commands:');
console.log('• npm run dev          - Start local development server');
console.log('• npm test             - Run tests');
console.log('• npm run deploy       - Deploy to Netlify');
console.log('• node config/test-webhook.js - Test webhook locally');

if (allFilesExist) {
  console.log('\n🎉 All required files are present!');
  console.log('Your WhatsApp Netlify Bot is ready to configure and deploy.');
} else {
  console.log('\n❌ Some files are missing. Please check the setup.');
}

// Test local environment
if (process.env.NODE_ENV !== 'production') {
  console.log('\n💡 Tips:');
  console.log('• Use ngrok to expose local webhook for testing');
  console.log('• Check Netlify dashboard for function logs');
  console.log('• Monitor Google Cloud Console for API usage');
}
