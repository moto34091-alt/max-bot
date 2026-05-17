require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const { smartSignal } = require("./signals");
const { generateMarkets, generateCloses } = require("./market");
const Signal = require("./models/Signal");

// ===============================
// USER STATE
// ===============================
const userState = {};

// ===============================
// ENV CHECK
// ===============================
console.log("🚀 BOT STARTING...");

if (!process.env.BOT_TOKEN || !process.env.MONGO_URL || !process.env.TWELVE_API_KEY) {
  console.log("❌ Missing ENV variables");
  process.exit(1);
}

// ===============================
// MONGO DB
// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.log("❌ Mongo Error:", err.message);
    process.exit(1);
  });

// ===============================
// EXPRESS (RAILWAY REQUIRED)
// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 OTC BOT RUNNING");
});

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
`🚀 OTC AI TRADING BOT

Start analysis 👇`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 GET SIGNAL", callback_data: "start" }]
    ]
  }
});
});

// ===============================
// CALLBACK FLOW
// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  try {

    // =========================
    // STEP 1: START
    // =========================
    if (query.data === "start") {

      return bot.sendMessage(chatId,
`⚡ MARKET SCANNER`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🔄 GENERATE REAL MARKETS", callback_data: "gen_market" }]
    ]
  }
});
    }

    // =========================
    // STEP 2: GENERATE REAL MARKETS (TWELVE DATA)
    // =========================
    if (query.data === "gen_market") {

      const loading = await bot.sendMessage(chatId,
`⚡ SCANNING REAL MARKETS...
📡 Twelve Data API`);

      const markets = await generateMarkets();

      userState[chatId] = { markets };

      return bot.editMessageText(
`📊 SELECT MARKET`,
{
  chat_id: chatId,
  message_id: loading.message_id,
  reply_markup: {
    inline_keyboard: markets.map(m => ([
      { text: m, callback_data: "m_" + m }
    ]))
  }
});
    }

    // =========================
    // STEP 3: MARKET SELECT
    // =========================
    if (query.data.startsWith("m_")) {

      const market = query.data.replace("m_", "");

      userState[chatId].market = market;

      return bot.sendMessage(chatId,
`📈 SELECT TIMEFRAME`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "1m candles", callback_data: "t_1m" }],
      [{ text: "5m candles", callback_data: "t_5m" }],
      [{ text: "15m candles", callback_data: "t_15m" }]
    ]
  }
});
    }

    // =========================
    // STEP 4: TIMEFRAME + ANALYSIS (REAL SIGNAL ENGINE)
    // =========================
    if (query.data.startsWith("t_")) {

      const timeframe = query.data.split("_")[1];
      const market = userState[chatId].market || "BTC/USD";

      const loading = await bot.sendMessage(chatId,
`⚡ ANALYSING REAL MARKET...

📊 Market: ${market}
📈 Timeframe: ${timeframe}
⏳ Processing 12s engine...`);

      setTimeout(async () => {

        const closes = await generateCloses(
          market,
          timeframe
        );

        const result = smartSignal(closes);

        await bot.editMessageText(
`📊 REAL MARKET SIGNAL

📈 Market: ${market}
📊 Timeframe: ${timeframe}

${result.signal}
🎯 Probability: ${result.confidence}%

⚡ Source: Twelve Data API
⏱ Engine: RSI + EMA + Momentum`,
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
