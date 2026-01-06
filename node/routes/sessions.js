const express = require("express");
const router = express.Router();
const { container } = require("../db/cosmos");

// Save a session
router.post("/session", async (req, res) => {
  try {
    const data = req.body;

    const item = {
      id: `session_${Date.now()}`,
      userId: data.userId,
      inputs: data.inputs,
      voice_ml: data.voice_ml,
      motion_ml: data.motion_ml,
      created_at: new Date().toISOString(),
    };

    await container.items.create(item);
    res.status(201).json({ success: true, id: item.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save session" });
  }
});

// Get all sessions of a user (for graphs)
router.get("/session/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const query = {
      query: "SELECT * FROM c WHERE c.userId = @uid ORDER BY c.created_at ASC",
      parameters: [{ name: "@uid", value: userId }],
    };

    const { resources } = await container.items
      .query(query)
      .fetchAll();

    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

module.exports = router;
