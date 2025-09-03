const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <h1>Smartcar Tesla Webhook Listener</h1>
    <p>Waiting for webhook data...</p>
  `);
});

app.post('/webhook', (req, res) => {
  const managementToken = process.env.SMARTCAR_MANAGEMENT_TOKEN;
  const challenge = req.body.challenge;

  if (challenge) {
    // Respond to Smartcar webhook verification challenge
    const signature = crypto
      .createHmac('sha256', managementToken)
      .update(challenge)
      .digest('hex');
    
    console.log('Webhook verification challenge received. Responding with signature:', signature);
    return res.send(signature);
  }

  // Normal webhook event
  const payload = req.body;
  const data = payload.data || {};

  console.log('=== Webhook vehicle data received ===');
  console.log('Vehicle locked:', data.Closure?.IsLocked);
  console.log('Firmware version:', data.ConnectivitySoftware?.CurrentFirmwareVersion);
  console.log('Vehicle asleep:', data.ConnectivityStatus?.IsAsleep);
  console.log('Digital key paired:', data.ConnectivityStatus?.IsDigitalKeyPaired);
  console.log('Vehicle online:', data.ConnectivityStatus?.IsOnline);
  console.log('Odometer (km):', data.Odometer?.TraveledDistance);
  console.log('Battery SOC (%):', data.TractionBattery?.StateOfCharge);
  console.log('Vehicle nickname:', data.VehicleIdentification?.Nickname);
  console.log('User permissions:', data.VehicleUserAccount?.Permissions);
  console.log('User role:', data.VehicleUserAccount?.Role);
  console.log('=====================================');

  res.status(200).send('Webhook data received');
});

app.listen(port, () => {
  console.log(`Webhook listener running on port ${port}`);
});
