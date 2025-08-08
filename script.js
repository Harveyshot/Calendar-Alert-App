// Replace with your actual Client ID from the Google Cloud Console
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; 

// Your Render server URL (e.g., https://calendar-files.onrender.com)
const RENDER_SERVER_URL = 'https://calendar-files.onrender.com';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let gapiLoaded = false;
let gisLoaded = false;

function gapiOnLoad() {
    gapiLoaded = true;
    handleClientLoad();
}

function gisOnLoad() {
    gisLoaded = true;
    handleClientLoad();
}

function handleClientLoad() {
    if (gapiLoaded && gisLoaded) {
        gapi.client.init({
            'apiKey': null, // No API key needed for OAuth 2.0
            'discoveryDocs': DISCOVERY_DOCS,
        }).then(function () {
            gapi.auth2.init({
                'client_id': CLIENT_ID,
                'scope': SCOPES,
            }).then(function () {
                updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            });
        });
    }
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

                // Check if the event is a reminder event
                const timeUntilEvent = new Date(start).getTime() - new Date().getTime();

                // You can adjust this to set a different alert time (e.g., 15 minutes)
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
                to: 'USER_EMAIL_ADDRESS', // You'll need to dynamically get this from a form or an extended property
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

// Add listeners to the buttons after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('authorize_button').onclick = handleAuthClick;
    document.getElementById('signout_button').onclick = handleSignoutClick;
});
