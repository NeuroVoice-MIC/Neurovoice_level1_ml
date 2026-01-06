// =====================
// EXISTING IMPORTS
// =====================
const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

// =====================
// 🔹 NEW: ENV + COSMOS
// =====================
require("dotenv").config(); // NEW
const { container } = require("./db/cosmos"); // NEW

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// PATHS (ABSOLUTE)
// =====================
const TEMP_DIR = path.join(__dirname, "..", "temp_audio");
const PYTHON_SCRIPT = path.join(__dirname, "..", "python", "inference.py");

// =====================
// ENSURE TEMP DIR EXISTS
// =====================
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// =====================
// MULTER SETUP
// =====================
const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.send("Server alive");
});

// =====================
// PREDICT ENDPOINT
// =====================
app.post("/predict", upload.single("audio"), async (req, res) => {
  console.log("📥 Request received");

  if (!req.file) {
    console.error("❌ No audio file received");
    return res.status(400).json({ error: "No audio file" });
  }

  const audioPath = path.resolve(req.file.path);
  console.log("🎧 Audio path:", audioPath);

  execFile(
      "python3",
    [PYTHON_SCRIPT, audioPath],
    { timeout: 20000 },
    async (error, stdout, stderr) => {
      // cleanup temp audio
      fs.unlink(audioPath, () => {});

      if (stderr) {
        console.warn("⚠️ Python stderr:", stderr);
      }

      if (error) {
        console.error("❌ Python execution error:", error);
        return res.status(500).json({ error: "Inference failed" });
      }

      let result;
      try {
        result = JSON.parse(stdout.trim());
      } catch (e) {
        console.error("❌ Invalid JSON from Python:", stdout);
        return res.status(500).json({
          error: "Invalid inference output",
          raw: stdout,
        });
      }

      console.log("📤 Python output:", result);

      // =====================
      // 🔹 NEW: SAVE TO COSMOS DB
      // =====================
      const sessionItem = {
        id: `session_${Date.now()}`,
        userId: req.body?.userId || "anonymous_user",

        inputs: {
          age_binary: req.body?.age_binary ?? null,
          neurological_history: req.body?.neurological_history ?? null,
          hypertension: req.body?.hypertension ?? null,
          updrs: req.body?.updrs ?? null,
        },

        voice_ml: {
          tremor_probability: result.tremor_probability,
          severity: result.severity,
        },

        motion_ml: {
          tremor_detected: result.tremor_detected,
          frequency_hz: result.frequency_hz,
        },

        created_at: new Date().toISOString(),
      };

      try {
        await container.items.create(sessionItem);
        console.log("✅ Session saved to Cosmos DB");
      } catch (dbError) {
        console.error("❌ Cosmos DB save failed:", dbError);
      }

      // =====================
      // RETURN RESPONSE
      // =====================
      res.json({
        ...result,
        session_id: sessionItem.id,
      });
    }
  );
});

// =====================
// START SERVER (RENDER SAFE)
// =====================
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 NeuroVoice backend running on port ${PORT}`);
});
