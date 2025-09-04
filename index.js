'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 8000;
const APPLICATION_MANAGEMENT_TOKEN = process.env.APPLICATION_MANAGEMENT_TOKEN;

app.use(cors());
app.use(bodyParser.json());

function hashChallenge(token, challenge) {
  return crypto.createHmac('sha256', token).update(challenge).digest('hex');
}

app.post('/webhook', (req, res) => {
  const eventType = req.body.eventType;

  if (eventType === 'VERIFY') {
    try {
      const challenge = req.body.data.challenge;
      const hmac = hashChallenge(APPLICATION_MANAGEMENT_TOKEN, challenge);
      console.log("Webhook verification successful.");
      return res.json({ challenge: hmac });
    } catch (error) {
      console.error('Verification error:', error);
      return res.status(500).json({ error: 'Internal server error during webhook verification' });
    }
  }

  if (eventType === 'VEHICLE_STATE') {
    const data = req.body.data || {};
    const signals = data.signals || {};

    const batterySoc = signals['tractionbattery-stateofcharge']?.value ?? 'Not Available';
    const odometer = signals['odometer-traveleddistance']?.value ?? 'Not Available';

    console.log(`Battery State of Charge: ${batterySoc}`);
    console.log(`Odometer: ${odometer}`);

    return res.status(200).send('Vehicle state payload received');
  }

  if (eventType === 'VEHICLE_ERROR') {
    console.log('Vehicle error payload received');
    return res.status(200).send('Vehicle error payload received');
  }

  res.status(400).send('Invalid eventType');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
