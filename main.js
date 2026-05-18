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
  res.send("🚀 MAX BOT RUNNING");
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
// START
// ===============================
bot.onText(/\/start/, (msg) => {

  bot.sendMessage(msg.chat.id,
`🚀 MAX BOT`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 GET SIGNAL", callback_data: "start" }]
    ]
  }
});
});

// ===============================
// HELP
// ===============================
bot.onText(/\/help/, (msg) => {

  bot.sendMessage(msg.chat.id,
`❓ MAX BOT HELP

/start → menu
/signal → quick signal
/signal BTC/USD → custom signal

Flow:
Market → Timeframe → Signal (10–15s)

🚀 AI TRADING BOT`);
});

// ===============================
// SIGNAL COMMAND
// ===============================
bot.onText(/\/signal(?: (.+))?/, async (msg, match) => {

  const chatId = msg.chat.id;
  let market = match?.[1] || "BTC/USD";

  bot.sendMessage(chatId, `⚡ Analysing ${market}...`);

  try {

    const closes = await generateCloses(market, "1m");
    const result = smartSignal(closes);

    const price = closes?.[closes.length - 1] || "N/A";

    const signalUI = buildSignalUI(result);

    bot.sendMessage(chatId,
`📊 QUICK SIGNAL

📈 Market: ${market}
💰 Price: ${price}

${signalUI}

🎯 Confidence: ${Math.round(result.confidence)}%`
    );

  } catch (err) {
    console.log(err.message);
    bot.sendMessage(chatId, "❌ Error generating signal");
  }
});

// ===============================
// CALLBACK FLOW
// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  try {

    await bot.answerCallbackQuery(query.id);

    // START
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

    // GENERATE MARKETS
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

    // MARKET
    if (query.data.startsWith("m_")) {

      const market = query.data.replace("m_", "");

      if (!userState[chatId]) userState[chatId] = {};
      userState[chatId].market = market;

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

      if (!userState[chatId] || !userState[chatId].market) {
        return bot.sendMessage(chatId, "❌ Select market first");
      }

      const market = userState[chatId].market;

      const loading = await bot.sendMessage(chatId,
`⚡ ANALYSING...

📊 ${market}
📈 ${timeframe}`);

      setTimeout(async () => {

        let closes;

        try {
          closes = await generateCloses(market, timeframe);
        } catch {
          closes = [100, 101, 102, 101, 103];
        }

        const result = smartSignal(closes);
        const price = closes?.[closes.length - 1] || "N/A";

        const signalUI = buildSignalUI(result);

        await bot.editMessageText(
`📊 SIGNAL READY

📈 ${market}
💰 Price: ${price}
📊 Timeframe: ${timeframe}

${signalUI}

🎯 Confidence: ${Math.round(result.confidence)}%

⚡ MAX AI BOT`,
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
