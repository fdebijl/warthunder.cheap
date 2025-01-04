import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Clog, LOGLEVEL } from '@fdebijl/clog';
import { ObjectId } from 'mongodb';
import {
  listCurrentItems,
  listArchivedItems,
  getPricesForItem,
  insertAlert,
  alertExists,
  queryAlerts,
  deleteAlert,
  findAlert
} from 'wtcheap.shared';

import { API_VERSION, PATH_PREFIX, PORT, JWT_SECRET } from './constants.js';
import { triggerTokenEmail } from './alerting/triggerTokenEmail.js';
import { authenticateToken } from './util/authenticateToken.js';

const clog = new Clog();

const app = express();
app.use(cors());
app.use(express.json());

app.get(`/${PATH_PREFIX}/${API_VERSION}/status`, async (req, res) => {
  res.status(200).send(JSON.stringify({ status: 'OK' }));
});

app.get(`/${PATH_PREFIX}/${API_VERSION}/items/current`, async (req, res) => {
  const items = await listCurrentItems();
  res.json(items);
});

app.get(`/${PATH_PREFIX}/${API_VERSION}/items/archived`, async (req, res) => {
  const items = await listArchivedItems();
  res.json(items);
});

app.get(`/${PATH_PREFIX}/${API_VERSION}/prices/:itemId`, async (req, res) => {
  if (!req.params.itemId) {
    res.status(400).send(JSON.stringify({ message: 'Item ID is required' }));
    return;
  }

  const priceData = await getPricesForItem(req.params.itemId);

  if (!priceData.length) {
    res.status(404).send(JSON.stringify({ message: 'No prices found for item' }));
    return;
  }

  res.status(200).json(priceData);
});

app.post(`/${PATH_PREFIX}/${API_VERSION}/alerts`, async (req, res) => {
  const user = authenticateToken(req);

  if (user) {
    req.body.recipient = user.sub;
  } else if (req.body.eventType === 'newItem') {
    res.status(401).send(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }

  if (!req.body.recipient) {
    res.status(400).send(JSON.stringify({ message: 'Email address is required' }));
    return;
  }

  if (!req.body.eventType) {
    res.status(400).send(JSON.stringify({ message: 'Event type is required' }));
    return;
  }

  if (!['newItem', 'priceChange', 'itemAvailable'].includes(req.body.eventType)) {
    res.status(400).send(JSON.stringify({ message: 'Invalid event type' }));
    return;
  }

  if (!req.body.itemId && req.body.eventType !== 'newItem') {
    res.status(400).send(JSON.stringify({ message: 'Item ID is required' }));
    return;
  }

  const alert = {
    recipient: req.body.recipient,
    eventType: req.body.eventType,
    itemId: req.body.itemId
  };

  const alertAlreadyExists = await alertExists(alert.recipient, alert.eventType, alert.itemId);

  if (alertAlreadyExists) {
    // We don't send a 409 here since that would allow email enumeration.
    res.status(201).send();
    return;
  }

  await insertAlert(alert);

  res.status(201).send(JSON.stringify({ message: 'Alert created' }));
});

app.get(`/${PATH_PREFIX}/${API_VERSION}/alerts`, async (req, res) => {
  const user = authenticateToken(req);

  if (!user) {
    res.status(401).send(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }

  const alerts = await queryAlerts({ recipient: user.sub as string });
  res.json(alerts);
});

app.delete(`/${PATH_PREFIX}/${API_VERSION}/alerts/:alertId`, async (req, res) => {
  const user = authenticateToken(req);

  if (!user) {
    res.status(401).send(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }

  const alertId = req.params.alertId;
  const alert = await findAlert(new ObjectId(alertId));

  if (!alert || alert.recipient !== user.sub) {
    res.status(404).send(JSON.stringify({ message: 'Alert not found or unauthorized' }));
    return;
  }

  await deleteAlert(alertId);
  res.status(200).send(JSON.stringify({ message: 'Alert deleted' }));
});

app.post(`/${PATH_PREFIX}/${API_VERSION}/tokens/request`, async (req, res) => {
  const email = req.body.email;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).send(JSON.stringify({ message: 'Invalid email address' }));
    return;
  }

  const token = jwt.sign({ sub: email }, JWT_SECRET, { expiresIn: '24h' });

  try {
    await triggerTokenEmail(email, token);
    res.status(200).send(JSON.stringify({ message: 'Token sent' }));
  } catch (error) {
    clog.log(`Error sending token email: ${error}`, LOGLEVEL.ERROR);
    res.status(500).send(JSON.stringify({ message: 'Failed to send token email' }));
  }
});

app.get(`/${PATH_PREFIX}/${API_VERSION}/tokens/whoami`, async (req, res) => {
  const user = authenticateToken(req);

  if (!user) {
    res.status(401).send(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }

  res.status(200).send(JSON.stringify({ email: user.sub }));
});

app.listen(PORT, () => {
  if (JWT_SECRET.includes('unsafe')) {
    clog.log('JWT_SECRET is unsafe, make sure to set a proper secret if this is not a development environment', LOGLEVEL.WARN);
  }

  clog.log(`Server running at ${PORT}`);
});
