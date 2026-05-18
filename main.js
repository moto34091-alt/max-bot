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
if (!process.env.BOT_TOKEN || !process.env.MONGO_URL || !process.env.TWELVE_API_KEY) {
  console.log("❌ Missing ENV variables");
  process.exit(1);
}

// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB CONNECTED"))
  .catch(err => {
    console.log("❌ Mongo ERROR:", err.message);
    process.exit(1);
  });

// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 OTC BOT RUNNING");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 SERVER OK:", PORT);
});

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
// UI BUILDER
// ===============================
function buildSignalUI(result) {

  if (result.signal.includes("BUY")) {
    return `
████████████████

      🟢 BUY
        ⬆️⬆️⬆️

████████████████
`;
  }

  if (result.signal.includes("SELL")) {
    return `
████████████████

      🔴 SELL
        ⬇️⬇️⬇️

████████████████
`;
  }

  return `
████████████████

      ⚪ WAIT

████████████████
`;
}

// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  try {

    // 🔥 IMPORTANT: remove loading animation
    await bot.answerCallbackQuery(query.id);

    // =========================
    // START (REMOVE BUTTONS)
    // =========================
    if (query.data === "start") {

      return bot.editMessageText(
`⚡ MARKET SCANNER`,
{
  chat_id: chatId,
  message_id: query.message.message_id,
  reply_markup: {
    inline_keyboard: [
      [{ text: "🔄 GENERATE MARKETS", callback_data: "gen_market" }]
    ]
  }
});
    }

    // =========================
    // GENERATE MARKETS
    // =========================
    if (query.data === "gen_market") {

      const markets = await generateMarkets();

      userState[chatId] = { markets };

      return bot.editMessageText(
`📊 SELECT MARKET`,
{
  chat_id: chatId,
  message_id: query.message.message_id,
  reply_markup: {
    inline_keyboard: markets.map(m => ([
      { text: m, callback_data: "m_" + m }
    ]))
  }
});
    }

    // =========================
    // MARKET SELECT
    // =========================
    if (query.data.startsWith("m_")) {

      const market = query.data.replace("m_", "");
      userState[chatId].market = market;

      return bot.editMessageText(
`📈 SELECT TIMEFRAME`,
{
  chat_id: chatId,
  message_id: query.message.message_id,
  reply_markup: {
    inline_keyboard: [
      [{ text: "1m", callback_data: "t_1m" }],
      [{ text: "5m", callback_data: "t_5m" }],
      [{ text: "15m", callback_data: "t_15m" }]
    ]
  }
});
    }

    // =========================
    // ANALYSIS (REAL SIGNAL)
    // =========================
    if (query.data.startsWith("t_")) {

      const timeframe = query.data.split("_")[1];
      const market = userState[chatId].market || "BTC/USD";

      const loading = await bot.sendMessage(chatId,
`⚡ ANALYSING MARKET...

📊 ${market}
📈 ${timeframe}`);

      setTimeout(async () => {

        const closes = await generateCloses(market, timeframe);
        const result = smartSignal(closes);

        const price = closes?.[closes.length - 1] || "N/A";

        const signalUI = buildSignalUI(result);

        await bot.editMessageText(
`📊 SIGNAL READY

📈 Market: ${market}
💰 Price: ${price}
📊 Timeframe: ${timeframe}

${signalUI}

🎯 Confidence: ${Math.round(result.confidence)}%

⚡ OTC AI ENGINE`,
{
  chat_id: chatId,
  message_id: loading.message_id
});

      }, 12000);

    }

  } catch (err) {
    console.log("BOT ERROR:", err.message);
    bot.sendMessage(chatId, "❌ ERROR");
  }
});
