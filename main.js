require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

// ⚠️ SAFE IMPORTS (évite crash MODULE_NOT_FOUND)
let smartSignal, generateMarkets, generateCloses, Signal;

try {
  ({ smartSignal } = require("./signals"));
  ({ generateMarkets, generateCloses } = require("./market"));
  Signal = require("./models/Signal");
} catch (e) {
  console.log("❌ IMPORT ERROR:", e.message);
  process.exit(1);
}

// ===============================
const userState = {};

// ===============================
console.log("🚀 BOT STARTING...");

// ===============================
// ENV CHECK
// ===============================
if (!process.env.BOT_TOKEN || !process.env.MONGO_URL || !process.env.TWELVE_API_KEY) {
  console.log("❌ Missing ENV variables");
  process.exit(1);
}

// ===============================
// MONGO
// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB CONNECTED"))
  .catch(err => {
    console.log("❌ Mongo ERROR:", err.message);
    process.exit(1);
  });

// ===============================
// EXPRESS (RAILWAY FIX)
// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 BOT RUNNING");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 SERVER OK:", PORT);
});

// ===============================
// TELEGRAM BOT
// ===============================
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// ===============================
bot.onText(/\/start/, (msg) => {

  bot.sendMessage(msg.chat.id,
`🚀 OTC AI BOT

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

    // STEP 1
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

    // STEP 2
    if (query.data === "gen_market") {

      const markets = await generateMarkets();

      userState[chatId] = { markets };

      return bot.sendMessage(chatId,
`📊 SELECT MARKET`,
{
  reply_markup: {
    inline_keyboard: markets.map(m => ([
      { text: m, callback_data: "m_" + m }
    ]))
  }
});
    }

    // STEP 3
    if (query.data.startsWith("m_")) {

      const market = query.data.replace("m_", "");
      userState[chatId].market = market;

      return bot.sendMessage(chatId,
`📈 SELECT TIMEFRAME`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "1m", callback_data: "t_1m" }],
      [{ text: "5m", callback_data: "t_5m" }],
      [{ text: "15m", callback_data: "t_15m" }]
    ]
  }
});
    }

    // STEP 4
    if (query.data.startsWith("t_")) {

      const timeframe = query.data.split("_")[1];
      const market = userState[chatId].market || "BTC/USD";

      const loading = await bot.sendMessage(chatId,
`⚡ ANALYSING...

📊 ${market}
📈 ${timeframe}`);

      setTimeout(async () => {

        const closes = await generateCloses(market, timeframe);
        const result = smartSignal(closes);

        // SAVE SAFE
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

📈 ${market}
📊 ${timeframe}

${result.signal}
🎯 ${result.confidence}%`,
          {
            chat_id: chatId,
            message_id: loading.message_id
          }
        );

      }, 12000);

    }

  } catch (err) {
    console.log("BOT ERROR:", err.message);
    bot.sendMessage(chatId, "❌ ERROR");
  }
});
