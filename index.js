const express = require('express');
const smartcar = require('smartcar');
require('dotenv').config();

const app = express();
const port = 8000;

let accessToken = null;

// Smartcar Auth Client
const authClient = new smartcar.AuthClient({
  clientId: process.env.SMARTCAR_CLIENT_ID,
  clientSecret: process.env.SMARTCAR_CLIENT_SECRET,
  redirectUri: process.env.SMARTCAR_REDIRECT_URI,
  mode: process.env.SMARTCAR_MODE, // 'test' or 'live'
  scope: ['read_vehicle_info', 'read_odometer'],
});

// Route to start OAuth flow
app.get('/login', (req, res) => {
  const link = authClient.getAuthUrl();
  res.redirect(link);
});

// OAuth callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const token = await authClient.exchangeCode(code);
  accessToken = token.accessToken;
  res.redirect('/vehicle');
});

// Get vehicle info
app.get('/vehicle', async (req, res) => {
  if (!accessToken) {
    return res.redirect('/login');
  }

  try {
    const vehicles = await smartcar.getVehicleIds(accessToken);
    const vehicle = new smartcar.Vehicle(vehicles.vehicles[0], accessToken);
    const info = await vehicle.info();
    res.json(info);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error getting vehicle info');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
