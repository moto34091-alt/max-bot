require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const { smartSignal } = require("./signals");
const { generateMarkets, generateCloses } = require("./market");
const Signal = require("./models/Signal");

const userState = {};

// ===============================
console.log("🚀 BOT STARTING...");

// ===============================
// CHECK ENV
// ===============================
if (!process.env.BOT_TOKEN || !process.env.MONGO_URL || !process.env.TWELVE_API_KEY) {
  console.log("❌ Missing ENV");
  process.exit(1);
}

// ===============================
// MONGO
// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB OK"))
  .catch(err => {
    console.log("❌ Mongo ERROR:", err.message);
    process.exit(1);
  });

// ===============================
// EXPRESS (RAILWAY)
// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 OTC BOT RUNNING");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Server OK " + PORT);
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
`🚀 OTC AI BOT`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 GET SIGNAL", callback_data: "start" }]
    ]
  }
});
});

// ===============================
// FLOW
// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  try {

    // START
    if (query.data === "start") {

      return bot.sendMessage(chatId,
`⚡ SCANNER`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🔄 GENERATE MARKETS", callback_data: "gen_market" }]
    ]
  }
});
    }

    // GENERATE MARKETS
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

    // SELECT MARKET
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

    // ANALYSIS
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

        await bot.editMessageText(
`📊 SIGNAL

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
    console.log("ERROR:", err.message);
    bot.sendMessage(chatId, "❌ Error bot");
  }
});
