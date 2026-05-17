require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const { smartSignal } = require("./signals");
const { generateCloses } = require("./market");
const Signal = require("./models/Signal");

// ===============================
// STATE USER (MENU FLOW)
// ===============================
const userState = {};

// ===============================
// CHECK ENV
// ===============================
console.log("🚀 BOT STARTING...");

if (!process.env.BOT_TOKEN || !process.env.MONGO_URL) {
  console.log("❌ Missing ENV variables");
  process.exit(1);
}

// ===============================
// MONGO
// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.log("❌ Mongo Error:", err.message);
    process.exit(1);
  });

// ===============================
// EXPRESS SERVER (RAILWAY)
// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 OTC BOT RUNNING");
});

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Server running on " + PORT);
});

// ===============================
// TELEGRAM BOT
// ===============================
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// ===============================
// START
// ===============================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🚀 OTC AI BOT

Click to start signal analysis 👇`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 GET SIGNAL", callback_data: "signal" }]
    ]
  }
});
});

// ===============================
// CALLBACK FLOW SYSTEM
// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  try {

    // =========================
    // STEP 1: GET SIGNAL
    // =========================
    if (query.data === "signal") {

      userState[chatId] = {};

      return bot.sendMessage(chatId,
`📊 CHOOSE MARKET`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "BTC/USDT OTC", callback_data: "market_btc" }],
      [{ text: "ETH/USDT OTC", callback_data: "market_eth" }]
    ]
  }
});
    }

    // =========================
    // STEP 2: MARKET
    // =========================
    if (query.data.startsWith("market_")) {

      const market = query.data.split("_")[1];

      userState[chatId].market = market;

      return bot.sendMessage(chatId,
`⏱ SELECT TIMEFRAME`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "1 MIN", callback_data: "time_1" }],
      [{ text: "5 MIN", callback_data: "time_5" }],
      [{ text: "15 MIN", callback_data: "time_15" }]
    ]
  }
});
    }

    // =========================
    // STEP 3: TIME + ANALYSIS
    // =========================
    if (query.data.startsWith("time_")) {

      const time = query.data.split("_")[1];
      const market = userState[chatId].market || "BTC";

      const loading = await bot.sendMessage(chatId,
`⚡ ANALYSING MARKET...
📊 Market: ${market.toUpperCase()}
⏱ Timeframe: ${time}m`);

      setTimeout(async () => {

        const closes = generateCloses();
        const result = smartSignal(closes);

        // SAVE DB (SAFE)
        try {
          await Signal.create({
            signal: result.signal,
            confidence: result.confidence
          });
        } catch (e) {
          console.log("DB ERROR:", e.message);
        }

        await bot.editMessageText(
`📊 SIGNAL RESULT

📈 Market: ${market.toUpperCase()}
⏱ Timeframe: ${time}m

${result.signal}
🎯 Probability: ${result.confidence}%`,
          {
            chat_id: chatId,
            message_id: loading.message_id
          }
        );

        userState[chatId] = {};

      }, 12000);
    }

  } catch (error) {
    console.log("BOT ERROR:", error.message);
    bot.sendMessage(chatId, "❌ Error processing request");
  }
});
