require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const { smartSignal } = require("./signals");
const { generateCloses } = require("./market");
const Signal = require("./models/Signal");

// ===============================
// CHECK ENV
// ===============================
console.log("🚀 BOT STARTING...");

if (!process.env.BOT_TOKEN || !process.env.MONGO_URL) {
  console.log("❌ Missing ENV variables");
  process.exit(1);
}

// ===============================
// MONGO CONNECT
// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err.message));

// ===============================
// EXPRESS SERVER (RAILWAY NEEDS THIS)
// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 OTC BOT RUNNING");
});

app.get("/status", (req, res) => {
  res.json({
    status: "ONLINE",
    bot: "OTC AI BOT"
  });
});

app.get("/signal", (req, res) => {
  try {
    const closes = generateCloses();
    const result = smartSignal(closes);

    res.json({
      success: true,
      signal: result.signal,
      confidence: result.confidence
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌐 Server running on port " + PORT);
});

// ===============================
// TELEGRAM BOT
// ===============================
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// START COMMAND
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🚀 OTC AI BOT

Clique pour recevoir un signal.`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 GET SIGNAL", callback_data: "signal" }]
    ]
  }
});
});

// SIGNAL BUTTON
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  if (query.data === "signal") {

    bot.sendMessage(chatId, "⚡ Analysing market...");

    try {

      const closes = generateCloses();
      const result = smartSignal(closes);

      await Signal.create({
        signal: result.signal,
        confidence: result.confidence
      });

      bot.sendMessage(chatId,
`📊 SIGNAL

${result.signal}

🎯 Confidence: ${result.confidence}%`
      );

    } catch (error) {
      console.log("ERROR:", error.message);
      bot.sendMessage(chatId, "❌ Error generating signal");
    }
  }
});
