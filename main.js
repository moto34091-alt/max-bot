require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const { smartSignal } = require("./signals");
const { generateMarkets, generateCloses } = require("./market");
const Signal = require("./models/Signal");

const userState = {};
const autoUsers = {};

// ===============================
console.log("🚀 BOT STARTING...");

// ===============================
if (!process.env.BOT_TOKEN || !process.env.MONGO_URL) {
  console.log("❌ Missing ENV variables");
  process.exit(1);
}

// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB CONNECTED"))
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
`🚀 MAX BOT READY`,
{
  reply_markup: {
    keyboard: [
      ["📊 SIGNAL", "⚡ QUICK BTC"],
      ["📈 AUTO MODE", "❓ HELP"]
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
`❓ MAX BOT HELP

📊 SIGNAL → full analysis
⚡ QUICK BTC → instant signal
📈 AUTO MODE → live signals
STOP AUTO → stop auto mode

🚀 AI Trading Bot`);
});

// ===============================
// QUICK BTC
// ===============================
bot.onText(/⚡ QUICK BTC/, async (msg) => {

  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "⚡ Analyzing BTC...");

  const closes = await generateCloses("BTC/USD", "1m");
  const result = smartSignal(closes);

  const price = closes?.[closes.length - 1] || "N/A";

  bot.sendMessage(chatId,
`📊 QUICK SIGNAL

📈 BTC/USD
💰 ${price}

${buildSignalUI(result)}

🎯 ${Math.round(result.confidence)}%`);
});

// ===============================
// AUTO MODE
// ===============================
bot.onText(/📈 AUTO MODE/, async (msg) => {

  const chatId = msg.chat.id;
  autoUsers[chatId] = true;

  bot.sendMessage(chatId, "🔥 AUTO MODE ON");

  const loop = async () => {

    if (!autoUsers[chatId]) return;

    const closes = await generateCloses("BTC/USD", "1m");
    const result = smartSignal(closes);

    const price = closes?.[closes.length - 1] || "N/A";

    bot.sendMessage(chatId,
`📊 AUTO SIGNAL

📈 BTC/USD
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
bot.onText(/STOP AUTO/, (msg) => {

  autoUsers[msg.chat.id] = false;
  bot.sendMessage(msg.chat.id, "⛔ AUTO STOPPED");
});

// ===============================
// INLINE FLOW
// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  try {

    await bot.answerCallbackQuery(query.id);

    if (query.data === "gen_market") {

      const markets = await generateMarkets();

      userState[chatId] = { markets };

      return bot.editMessageText(
`📊 SELECT MARKET`,
{
  chat_id: chatId,
  message_id: query.message.message_id,
  reply_markup: {
    inline_keyboard: markets.map(m => ([{
      text: m,
      callback_data: "m_" + m
    }]))
  }
});
    }

    if (query.data.startsWith("m_")) {

      const market = query.data.replace("m_", "");

      if (!userState[chatId]) userState[chatId] = {};
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

⚡ MAX BOT`,
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
