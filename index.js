'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 8000;
const APPLICATION_MANAGEMENT_TOKEN = process.env.APPLICATION_MANAGEMENT_TOKEN;

app.use(bodyParser.json());

let latestVehicleData = {}; // Stores the most recent vehicle data

// Helper to hash the Smartcar challenge
function hashChallenge(token, challenge) {
  return crypto.createHmac('sha256', token).update(challenge).digest('hex');
}

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const { eventType, data } = req.body;

  if (eventType === 'VERIFY') {
    if (!APPLICATION_MANAGEMENT_TOKEN) {
      return res.status(500).json({ error: 'Missing token' });
    }
    try {
      const challenge = data.challenge;
      const response = hashChallenge(APPLICATION_MANAGEMENT_TOKEN, challenge);
      return res.json({ challenge: response });
    } catch (err) {
      console.error('Verification error:', err);
      return res.status(500).json({ error: 'Error verifying webhook' });
    }
  }

  if (eventType === 'VEHICLE_STATE') {
    latestVehicleData = data;
    console.log('Vehicle state received.');
    return res.status(200).send('OK');
  }

  if (eventType === 'VEHICLE_ERROR') {
    console.error('Vehicle error:', JSON.stringify(data, null, 2));
    return res.status(200).send('Error logged');
  }

  return res.status(400).send('Unknown event type');
});

// User-facing dashboard
app.get('/', (req, res) => {
  if (!Object.keys(latestVehicleData).length) {
    return res.send('<h2>No vehicle data received yet.</h2>');
  }

  const d = latestVehicleData;
  const row = (label, key) =>
    `<div><strong>${label}:</strong> ${d[key] ?? 'N/A'}</div>`;

  res.send(`
    <html>
      <head>
        <title>Smartcar Dashboard</title>
        <style>
          body { font-family: sans-serif; padding: 2em; background: #f4f4f4; }
          .card { background: white; padding: 1.5em; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); max-width: 600px; margin: auto; }
          h1 { text-align: center; color: #007bff; }
        </style>
      </head>
      <body>
        <h1>Vehicle Status</h1>
        <div class="card">
          ${row('Battery %', 'tractionBattery.stateOfCharge')}
          ${row('Odometer (km)', 'odometer.traveledDistance')}
          ${row('Locked', 'closure.isLocked')}
          ${row('Firmware', 'connectivitySoftware.currentFirmwareVersion')}
          ${row('Online', 'connectivityStatus.isOnline')}
          ${row('Asleep', 'connectivityStatus.isAsleep')}
          ${row('Digital Key', 'connectivityStatus.isDigitalKeyPaired')}
          ${row('Nickname', 'vehicleIdentification.nickname')}
          ${row('User Role', 'vehicleUserAccount.role')}
          ${row('Permissions', 'vehicleUserAccount.permissions')}
        </div>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
