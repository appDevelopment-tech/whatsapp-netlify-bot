const { google } = require('googleapis');

let auth = null;

function getGoogleAuth() {
  if (!auth) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }
  return auth;
}

async function logChatToSheets(data) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [[
      data.timestamp,
      data.user,
      data.message,
      data.response
    ]];

    const request = {
      spreadsheetId: process.env.GOOGLE_SHEET_ID_LOGS,
      range: 'Sheet1!A:D',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values
      }
    };

    const response = await sheets.spreadsheets.values.append(request);
    console.log('Chat logged to sheets successfully:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error logging to Google Sheets:', error);
    throw error;
  }
}

async function logAppointmentToSheets(appointmentData) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [[
      appointmentData.fullName,
      appointmentData.phone,
      appointmentData.appointmentDateTime
    ]];

    const request = {
      spreadsheetId: process.env.GOOGLE_SHEET_ID_APPOINTMENTS,
      range: 'Sheet1!A:C',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values
      }
    };

    const response = await sheets.spreadsheets.values.append(request);
    console.log('Appointment logged to sheets successfully:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error logging appointment to Google Sheets:', error);
    throw error;
  }
}

async function getSheetData(spreadsheetId, range) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    return response.data.values || [];

  } catch (error) {
    console.error('Error getting sheet data:', error);
    throw error;
  }
}

module.exports = {
  logChatToSheets,
  logAppointmentToSheets,
  getSheetData
};
