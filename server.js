const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());

const store = {};

app.get("/", (req, res) => {
  res.send("Superchat Project Proxy is running");
});

app.post("/projects", (req, res) => {
  const { conversation_id, contact_id, deals } = req.body;

  if (!conversation_id) {
    return res.status(400).json({ error: "conversation_id is required" });
  }

  if (!Array.isArray(deals)) {
    return res.status(400).json({ error: "deals must be an array" });
  }

  store[conversation_id] = {
    conversation_id,
    contact_id: contact_id || null,
    deals,
    updated_at: new Date().toISOString()
  };

  console.log(
    `[STORE] Saved ${deals.length} deals for conversation ${conversation_id}`
  );

  res.json({
    status: "ok",
    conversation_id,
    deals_count: deals.length
  });
});

app.get("/projects/:conversation_id", (req, res) => {
  const conversation_id = req.params.conversation_id;
  const entry = store[conversation_id];

  if (!entry) {
    return res.status(404).json({
      conversation_id,
      deals: []
    });
  }

  res.json(entry);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
