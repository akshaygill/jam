const express = require('express');
const smartcar = require('smartcar');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

let accessToken = null;

// Smartcar Auth Client
const authClient = new smartcar.AuthClient({
  clientId: process.env.SMARTCAR_CLIENT_ID,
  clientSecret: process.env.SMARTCAR_CLIENT_SECRET,
  redirectUri: process.env.SMARTCAR_REDIRECT_URI,
  mode: process.env.SMARTCAR_MODE, // 'test' or 'live'
  scope: ['read_vehicle_info', 'read_odometer'],
});

// 🏠 Home route
app.get('/', (req, res) => {
  res.send(`
    <h1>🚗 Welcome to Smartcar Tesla App</h1>
    <p><a href="/login">Click here to connect your Tesla</a></p>
  `);
});

// 🔐 OAuth login
app.get('/login', (req, res) => {
  const authUrl = authClient.getAuthUrl();
  res.redirect(authUrl);
});

// 🔁 OAuth callback
app.get('/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const token = await authClient.exchangeCode(code);
    accessToken = token.accessToken;
    res.redirect('/vehicle');
  } catch (err) {
    console.error('OAuth Error:', err);
    res.status(500).send('OAuth failed');
  }
});

// 🚘 Get vehicle info
app.get('/vehicle', async (req, res) => {
  if (!accessToken) {
    return res.redirect('/login');
  }

  try {
    const { vehicles } = await smartcar.getVehicleIds(accessToken);
    if (!vehicles.length) {
      return res.send('No vehicles found for this account.');
    }

    const vehicle = new smartcar.Vehicle(vehicles[0], accessToken);
    const info = await vehicle.info();
    res.json(info);
  } catch (err) {
    console.error('Vehicle Info Error:', err);
    res.status(500).send('Failed to fetch vehicle info');
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Smartcar app listening on port ${port}`);
});
