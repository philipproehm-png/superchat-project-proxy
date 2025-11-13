// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

// optional: falls du den Superchat-API-Key nutzen willst
const SUPERCHAT_API_KEY = process.env.SUPERCHAT_API_KEY || null;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Superchat proxy is running');
});

app.post('/superchat', async (req, res) => {
  try {
    console.log('Incoming body:', JSON.stringify(req.body));

    // 1. Payload aus Zapier lesen
    const {
      automationId,
      data,
      deals_json,
      contact_id,
      conversation_id,
    } = req.body;

    if (!automationId) {
      return res.status(400).json({ error: 'automationId is required' });
    }

    // 2. Input für Superchat bauen
    //    - Falls "data" schon ein Objekt ist → direkt verwenden
    //    - Sonst die flachen Felder aus Zapier nehmen
    let input;
    if (data && typeof data === 'object') {
      input = data;
    } else {
      input = {
        deals_json: deals_json ?? null,
        contact_id: contact_id ?? null,
        conversation_id: conversation_id ?? null,
      };
    }

    // 3. Superchat-Automation-Webhook-URL
    const superchatUrl = `https://webhooks.superchat.cloud/v1/automations/${automationId}`;

    // 4. Request an Superchat vorbereiten
    const headers = { 'Content-Type': 'application/json' };
    if (SUPERCHAT_API_KEY) {
      headers['x-api-key'] = SUPERCHAT_API_KEY;
    }

    const body = JSON.stringify({ input });

    console.log('Forwarding to Superchat:', superchatUrl, body);

    const scRes = await fetch(superchatUrl, {
      method: 'POST',
      headers,
      body,
    });

    const text = await scRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!scRes.ok) {
      console.error('Superchat error:', scRes.status, json);
      return res
        .status(scRes.status)
        .json({ error: 'superchat_error', details: json });
    }

    console.log('Superchat response:', json);
    return res.status(200).json(json);
  } catch (err) {
    console.error('Proxy error:', err);
    return res
      .status(500)
      .json({ error: 'proxy_error', details: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
