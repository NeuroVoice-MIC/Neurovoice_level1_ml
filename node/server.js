const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const path = require("path");

const app = express();
app.use(require("cors")());

const upload = multer({ dest: "../temp_audio/" });
app.get("/", (req, res) => {
  res.send("Server alive");
});
app.post("/predict", upload.single("audio"), (req, res) => {
  console.log("📥 Request received");

  if (!req.file) {
    console.log("❌ No file received");
    return res.status(400).json({ error: "No audio file" });
  }

  const audioPath = path.resolve(req.file.path);
  console.log("🎧 Audio path:", audioPath);

  execFile(
    "python3",
    ["../python/inference.py", audioPath],
    { timeout: 20000 },
    (error, stdout, stderr) => {
      console.log("🐍 Python finished");

      if (stderr) {
        console.error("⚠️ Python stderr:", stderr);
      }

      if (error) {
        console.error("❌ Python error:", error);
        return res.status(500).json({ error: "Inference failed" });
      }

      console.log("📤 Python output:", stdout);
      res.json(JSON.parse(stdout));
    }
  );
});

app.listen(5050, () => {
  console.log("🚀 NeuroVoice backend running on port 5000");
});