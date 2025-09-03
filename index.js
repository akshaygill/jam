'use strict';

const cors = require('cors');
const express = require('express');
const smartcar = require('smartcar');
const bodyParser = require('body-parser');

const app = express()
  .use(cors())
  .use(bodyParser.json());

const port = process.env.PORT || 8000;

app.post('/webhook', function(req, res) {
  const eventType = req.body.eventType;

  if (eventType === 'VERIFY') {
    const application_management_token = process.env.APPLICATION_MANAGEMENT_TOKEN;
    try {
      const challenge = req.body.data.challenge;

      const hmac = smartcar.hashChallenge(
        application_management_token,
        challenge
      );

      // Send raw HMAC string as plain text (required by Smartcar)
      res.set('Content-Type', 'text/plain');
      return res.send(hmac);
    } catch (error) {
      console.error('Webhook verification error:', error);
      return res.status(500).json({
        error: 'Internal server error during webhook verification'
      });
    }
  } else if (eventType === 'VEHICLE_STATE') {
    // Handle vehicle state payload
    console.log('Vehicle state payload received:', JSON.stringify(req.body, null, 2));
    return res.status(200).send('Payload received');
  } else if (eventType === 'VEHICLE_ERROR') {
    // Handle vehicle error payload
    console.log('Vehicle error payload received:', JSON.stringify(req.body, null, 2));
    return res.status(200).send('Payload received');
  } else {
    // Unknown eventType
    console.log('Unknown eventType received:', eventType);
    return res.status(400).send('Unknown eventType');
  }
});

app.listen(port, () => {
  console.log(`Webhook listener running on port ${port}`);
});
