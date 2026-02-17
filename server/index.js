const express = require("express");
const cors = require("cors");
const { generateDeliverables } = require("./generate");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/generate", (req, res) => {
  const { project_id } = req.body;
  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  // Fire and forget
  generateDeliverables(project_id).catch((err) => {
    console.error("Generation error:", err);
  });

  res.status(202).json({ message: "Generation started", project_id });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
