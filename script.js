// Replace with your actual Client ID from the Google Cloud Console
const CLIENT_ID = '749336460541-2bj8kqis66ksjob3h4v4ouhfudlcrur3.apps.googleusercontent.com';

// Your Render server URL (e.g., https://calendar-files.onrender.com)
const RENDER_SERVER_URL = 'https://calendar-files.onrender.com';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        'apiKey': null, // No API key needed for OAuth 2.0
        'discoveryDocs': DISCOVERY_DOCS,
        'client_id': CLIENT_ID,
        'scope': SCOPES,
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
        // Handle the initial sign-in state.
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

function updateSignInStatus(isSignedIn) {
    const authStatus = document.getElementById('auth_status');
    const authorizeButton = document.getElementById('authorize_button');
    const signoutButton = document.getElementById('signout_button');

    if (isSignedIn) {
        authStatus.innerText = 'Signed in.';
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        listUpcomingEvents();
    } else {
        authStatus.innerText = 'Please sign in to view calendar events.';
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
}

async function listUpcomingEvents() {
    const authStatus = document.getElementById('auth_status');
    const calendarEventsDiv = document.getElementById('calendar_events');

    try {
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime',
        });

        const events = response.result.items;
        calendarEventsDiv.innerHTML = '';

        if (events.length > 0) {
            events.forEach(async (event) => {
                const start = event.start.dateTime || event.start.date;
                const eventElement = document.createElement('div');
                eventElement.classList.add('event');
                eventElement.innerText = `${start} - ${event.summary}`;
                calendarEventsDiv.appendChild(eventElement);

                const timeUntilEvent = new Date(start).getTime() - new Date().getTime();
                const reminderTime = 60 * 1000; // 1 minute for testing purposes

                if (timeUntilEvent > 0 && timeUntilEvent <= reminderTime) {
                    await sendEmailAlert(event);
                }
            });
        } else {
            calendarEventsDiv.innerText = 'No upcoming events found.';
        }
    } catch (error) {
        authStatus.innerText = 'Error: ' + error.message;
    }
}

async function sendEmailAlert(event) {
    try {
        const response = await fetch(`${RENDER_SERVER_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: 'USER_EMAIL_ADDRESS',
                subject: `Calendar Alert: ${event.summary}`,
                body: `This is a reminder for your event: ${event.summary} starting at ${event.start.dateTime || event.start.date}.`
            })
        });

        const result = await response.json();
        console.log('Email sent:', result);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('authorize_button').onclick = handleAuthClick;
    document.getElementById('signout_button').onclick = handleSignoutClick;
});
What was changed?
Consolidated Loading: I removed the gisLoaded and gapiLoaded boolean flags. Instead, the handleClientLoad function now directly loads the gapi library with gapi.load('client:auth2', initClient);. This is the standard, reliable way to load gapi and its authentication module.

Combined Initialization: The initClient function now handles the entire initialization process for the older gapi.client and gapi.auth2 libraries in a single, clean block. This eliminates the race condition that was causing the TypeError.

Removed gis logic: All references to the newer gis library have been removed to prevent conflicts.

You will also need to update your index.html file to reflect these changes.

Corrected index.html
HTML

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar Alerts</title>
    <link rel="stylesheet" href="./style.css">
    <script async defer src="https://apis.google.com/js/api.js" onload="handleClientLoad()"></script>
</head>
<body>
    <h1>Calendar Alerts</h1>
    <button id="authorize_button" style="display: none;">Authorize</button>
    <button id="signout_button" style="display: none;">Sign Out</button>
    <p id="auth_status"></p>
    <div id="calendar_events"></div>

    <script src="./script.js"></script>
</body>
</html>
