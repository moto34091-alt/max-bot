const express = require("express");
const { generateCloses } = require("./market");
const { smartSignal } = require("./signals");

const app = express();

// ===============================
// HOME
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 OTC BOT API RUNNING");
});

// ===============================
// GET SIGNAL API
// ===============================
app.get("/signal", (req, res) => {
  try {
    const closes = generateCloses();
    const result = smartSignal(closes);

    res.json({
      success: true,
      pair: "BTCUSDT OTC",
      signal: result.signal,
      confidence: result.confidence
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
});

// ===============================
// STATUS
// ===============================
app.get("/status", (req, res) => {
  res.json({
    status: "ONLINE",
    bot: "OTC AI BOT",
    time: new Date()
  });
});

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 API running on port " + PORT);
});
