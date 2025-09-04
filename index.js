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
      res.json({ challenge: hmac });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ error: 'Internal server error during webhook verification' });
    }

  } else if (eventType === 'VEHICLE_STATE' || eventType === 'VEHICLE_ERROR') {
    console.log(`=== Webhook ${eventType.toLowerCase()} data received ===`);
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).send('Payload received');
  } else {
    res.status(400).send('Invalid eventType');
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
