const { google } = require('googleapis');

let auth = null;

function getGoogleAuth() {
  if (!auth) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
  }
  return auth;
}

async function checkAvailability(startTime, endTime) {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime,
        timeMax: endTime,
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }]
      }
    });

    const busy = response.data.calendars[process.env.GOOGLE_CALENDAR_ID]?.busy || [];
    return busy.length === 0; // Available if no busy periods

  } catch (error) {
    console.error('Error checking calendar availability:', error);
    throw error;
  }
}

async function createEvent(eventData) {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventData.summary || 'Appointment',
      description: eventData.description || '',
      start: {
        dateTime: eventData.startTime,
        timeZone: 'America/New_York', // Adjust as needed
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'America/New_York', // Adjust as needed
      },
      attendees: eventData.attendees || [],
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
    });

    console.log('Calendar event created:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

async function listEvents(timeMin, timeMax, maxResults = 50) {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];

  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw error;
  }
}

module.exports = {
  checkAvailability,
  createEvent,
  listEvents
};
