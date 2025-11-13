import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

// Mittelware
app.use(cors());
app.use(bodyParser.json());

// Health-Check
app.get("/", (req, res) => {
  res.send("Superchat proxy is running ✅");
});

/**
 * POST /superchat
 *
 * Erwartet Body von Zapier (Payload Type: Raw, JSON):
 * {
 *   "deals_json": "...",
 *   "contact_id": "232323",
 *   "conversation_id": "424242",
 *   "automationId": "M2VwIU51Vj5PtERZxHa8N"
 * }
 */
app.post("/superchat", async (req, res) => {
  try {
    const { deals_json, contact_id, conversation_id, automationId } = req.body || {};

    console.log("Incoming payload from Zapier:", req.body);

    if (!automationId) {
      return res.status(400).json({ error: "automationId is missing" });
    }

    // Payload, das an Superchat-Automation übergeben wird
    const superchatPayload = {
      input: {
        deals_json,
        contact_id,
        conversation_id
      }
    };

    const superchatUrl = `https://webhooks.superchat.cloud/v1/automations/${automationId}`;

    console.log("Calling Superchat automation:", superchatUrl);
    console.log("Payload:", JSON.stringify(superchatPayload, null, 2));

    const scResponse = await fetch(superchatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // Falls Superchat hier irgendwann Auth erwartet:
        // "Authorization": `Bearer ${process.env.SUPERCHAT_API_KEY}`
      },
      body: JSON.stringify(superchatPayload)
    });

    const text = await scResponse.text();

    console.log("Superchat response status:", scResponse.status);
    console.log("Superchat response body:", text);

    if (!scResponse.ok) {
      return res.status(scResponse.status).send(text);
    }

    // Erfolgreich → Ergebnis an Zapier zurückgeben
    res.status(200).send(text);
  } catch (err) {
    console.error("Error in /superchat:", err);
    res.status(500).json({ error: "Proxy error", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
