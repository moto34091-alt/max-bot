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
console.log("🚀 OTC BOT STARTING...");

if (!process.env.BOT_TOKEN || !process.env.MONGO_URL) {
  console.log("❌ Missing ENV variables");
  process.exit(1);
}

// ===============================
// MONGO CONNECT
// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.log("❌ Mongo Error:", err.message);
    process.exit(1);
  });

// ===============================
// EXPRESS SERVER (RAILWAY FIX)
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
    res.json({
      success: false,
      error: err.message
    });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Server running on port " + PORT);
});

// ===============================
// TELEGRAM BOT
// ===============================
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// ===============================
// START COMMAND
// ===============================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🚀 OTC AI BOT

Click below to get signal 👇`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 GET SIGNAL", callback_data: "signal" }]
    ]
  }
});
});

// ===============================
// CALLBACK SIGNAL SYSTEM
// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  if (query.data === "signal") {

    try {

      const loading = await bot.sendMessage(chatId,
`⚡ ANALYSING OTC MARKET...
⏳ Scanning trend & liquidity...`);

      setTimeout(async () => {

        const closes = generateCloses();
        const result = smartSignal(closes);

        // SAVE TO DB
        try {
          await Signal.create({
            signal: result.signal,
            confidence: result.confidence
          });
        } catch (dbErr) {
          console.log("DB ERROR:", dbErr.message);
        }

        await bot.editMessageText(
`📊 OTC SIGNAL RESULT

${result.signal}

🎯 Probability: ${result.confidence}%

📡 Strategy: RSI + EMA
⏱ Analysis: 12s engine`,
          {
            chat_id: chatId,
            message_id: loading.message_id
          }
        );

      }, 12000);

    } catch (error) {
      console.log("CALLBACK ERROR:", error.message);

      bot.sendMessage(chatId,
`❌ ERROR GENERATING SIGNAL`);
    }
  }
});
