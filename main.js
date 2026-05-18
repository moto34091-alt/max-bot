require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const { smartSignal } = require("./signals");
const { generateCloses } = require("./market");

const userState = {};
const autoUsers = {};

// ===============================
console.log("🚀 MAX BOT STARTING");

// ===============================
if (!process.env.BOT_TOKEN || !process.env.MONGO_URL) {
  console.log("❌ Missing ENV");
  process.exit(1);
}

// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB OK"))
  .catch(err => console.log("❌ Mongo ERROR:", err.message));

// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 MAX BOT RUNNING");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 SERVER OK:", PORT);
});

// ===============================
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// ===============================
// 10 CRYPTO MARKET
// ===============================
function generateMarkets() {
  return [
    "BTC/USD",
    "ETH/USD",
    "SOL/USD",
    "XRP/USD",
    "BNB/USD",
    "DOGE/USD",
    "ADA/USD",
    "LTC/USD",
    "AVAX/USD",
    "TRX/USD"
  ];
}

// ===============================
// UI SIGNAL
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
// START MENU
// ===============================
bot.onText(/\/start/, (msg) => {

  bot.sendMessage(msg.chat.id,
`🚀 MAX BOT`,
{
  reply_markup: {
    keyboard: [
      ["📊 SIGNAL"],
      ["⚡ QUICK SIGNAL"],
      ["📈 AUTO SIGNAL", "⛔ STOP AUTO"],
      ["❓ HELP", "👤 AIDE @Mr_dflam"]
    ],
    resize_keyboard: true
  }
});
});

// ===============================
// HELP
// ===============================
bot.onText(/❓ HELP/, (msg) => {

  bot.sendMessage(msg.chat.id,
`❓ MAX BOT GUIDE

📊 SIGNAL → choose market + timeframe
⚡ QUICK SIGNAL → random crypto
📈 AUTO SIGNAL → live signals
⛔ STOP AUTO → stop bot

🚀 Trading AI Bot`);
});

// ===============================
// AIDE ADMIN
// ===============================
bot.onText(/👤 AIDE @Mr_dflam/, (msg) => {

  bot.sendMessage(msg.chat.id,
`👤 SUPPORT ADMIN

📩 Contact: @Mr_dflam

📌 Help:
- bot bug
- signal issue
- setup help

🚀 MAX BOT SUPPORT`);
});

// ===============================
// SIGNAL FLOW
// ===============================
bot.onText(/📊 SIGNAL/, (msg) => {

  const markets = generateMarkets();

  bot.sendMessage(msg.chat.id,
`📊 CHOOSE MARKET`,
{
  reply_markup: {
    inline_keyboard: markets.map(m => ([{
      text: m,
      callback_data: "m_" + m
    }]))
  }
});
});

// ===============================
// QUICK SIGNAL
// ===============================
bot.onText(/⚡ QUICK SIGNAL/, async (msg) => {

  const chatId = msg.chat.id;

  const markets = generateMarkets();
  const market = markets[Math.floor(Math.random() * markets.length)];

  bot.sendMessage(chatId, `⚡ ANALYSING ${market}...`);

  const closes = await generateCloses(market, "1m");
  const result = smartSignal(closes);

  const price = closes?.[closes.length - 1] || "N/A";

  bot.sendMessage(chatId,
`📊 QUICK SIGNAL

📈 ${market}
💰 ${price}

${buildSignalUI(result)}

🎯 ${Math.round(result.confidence)}%`);
});

// ===============================
// AUTO SIGNAL
// ===============================
bot.onText(/📈 AUTO SIGNAL/, async (msg) => {

  const chatId = msg.chat.id;

  autoUsers[chatId] = true;

  bot.sendMessage(chatId, "🔥 AUTO SIGNAL ON");

  const loop = async () => {

    if (!autoUsers[chatId]) return;

    const markets = generateMarkets();
    const market = markets[Math.floor(Math.random() * markets.length)];

    const closes = await generateCloses(market, "1m");
    const result = smartSignal(closes);

    const price = closes?.[closes.length - 1] || "N/A";

    bot.sendMessage(chatId,
`📊 AUTO SIGNAL

📈 ${market}
💰 ${price}

${buildSignalUI(result)}

🎯 ${Math.round(result.confidence)}%`);

    setTimeout(loop, 15000);
  };

  loop();
});

// ===============================
// STOP AUTO
// ===============================
bot.onText(/⛔ STOP AUTO/, (msg) => {

  autoUsers[msg.chat.id] = false;

  bot.sendMessage(msg.chat.id, "⛔ AUTO STOPPED");
});

// ===============================
// CALLBACK FLOW (MARKET + TIMEFRAME)
// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  try {

    await bot.answerCallbackQuery(query.id);

    // MARKET SELECT
    if (query.data.startsWith("m_")) {

      const market = query.data.replace("m_", "");

      userState[chatId] = { market };

      return bot.editMessageText(
`📈 SELECT TIMEFRAME

📊 ${market}`,
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

    // TIMEFRAME + ANALYSIS
    if (query.data.startsWith("t_")) {

      const timeframe = query.data.split("_")[1];
      const market = userState[chatId]?.market || "BTC/USD";

      const loading = await bot.sendMessage(chatId,
`⚡ ANALYSING...

📊 ${market}
📈 ${timeframe}`);

      setTimeout(async () => {

        const closes = await generateCloses(market, timeframe);
        const result = smartSignal(closes);

        const price = closes?.[closes.length - 1] || "N/A";

        await bot.editMessageText(
`📊 SIGNAL READY

📈 ${market}
💰 ${price}
📊 ${timeframe}

${buildSignalUI(result)}

🎯 ${Math.round(result.confidence)}%

🚀 MAX BOT`,
{
  chat_id: chatId,
  message_id: loading.message_id
});

      }, 12000);
    }

  } catch (err) {
    console.log("ERROR:", err.message);
    bot.sendMessage(chatId, "❌ ERROR");
  }
});
