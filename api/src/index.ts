import express from 'express';
import cors from 'cors';

import { getCurrentItems, getArchivedItems, getPricesForItem, insertAlert, alertExists } from './db';
import { API_VERSION, PATH_PREFIX, PORT } from './constants';

const app = express();
app.use(cors());
app.use(express.json());

app.get(`/${PATH_PREFIX}/${API_VERSION}/items/current`, async (req, res) => {
  const items = await getCurrentItems();
  res.json(items);
});

app.get(`/${PATH_PREFIX}/${API_VERSION}/items/archived`, async (req, res) => {
  const items = await getArchivedItems();
  res.json(items);
});

app.get(`/${PATH_PREFIX}/${API_VERSION}/prices/:itemId`, async (req, res) => {
  if (!req.params.itemId) {
    res.status(400).send(JSON.stringify({ message: 'Item ID is required' }));
    return;
  }

  const priceData = await getPricesForItem(req.params.itemId);
  res.json(priceData);
});

app.post(`/${PATH_PREFIX}/${API_VERSION}/alerts`, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});
