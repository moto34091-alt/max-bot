require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const { smartSignal } = require("./signals");
const { generateCloses, generateMarkets } = require("./market");

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

const userState = {};
const autoUsers = {};

// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 MAX BOT OK");
});

app.listen(process.env.PORT || 3000);

// ===============================
// UI
// ===============================
function UI(result) {

  if (result.signal.includes("BUY")) {
    return `
████████████

🟢 BUY ⬆️

████████████
`;
  }

  if (result.signal.includes("SELL")) {
    return `
████████████

🔴 SELL ⬇️

████████████
`;
  }

  return `
████████████

⚪ WAIT

████████████
`;
}

// ===============================
// START
// ===============================
bot.onText(/\/start/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
`🚀 MAX BOT PRO

📊 SMART FOREX SIGNAL
🕯 PATTERN DETECTION
📈 TREND ANALYSIS
⚡ FAST ENGINE`,
{
  reply_markup: {
    keyboard: [
      ["📊 SIGNAL"],
      ["⚡ QUICK SIGNAL"],
      ["📈 AUTO SIGNAL", "⛔ STOP AUTO"],
      ["👤 AIDE @Mr_dflam"]
    ],
    resize_keyboard: true
  }
});
});

// ===============================
// AIDE
// ===============================
bot.onText(/👤 AIDE @Mr_dflam/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
`👤 SUPPORT

📩 @Mr_dflam`
  );
});

// ===============================
// SIGNAL MENU
// ===============================
bot.onText(/📊 SIGNAL/, async (msg) => {

  const markets = generateMarkets();

  await bot.sendMessage(
    msg.chat.id,
`📊 CHOOSE MARKET`,
{
  reply_markup: {
    inline_keyboard: markets.map(m => [{
      text: m,
      callback_data: "m_" + m
    }])
  }
});
});

// ===============================
// QUICK SIGNAL
// ===============================
bot.onText(/⚡ QUICK SIGNAL/, async (msg) => {

  const markets = generateMarkets();

  const market =
    markets[Math.floor(Math.random() * markets.length)];

  const closes = generateCloses(market);

  const result = smartSignal(closes);

  const price = closes.at(-1);

  await bot.sendMessage(
    msg.chat.id,
`⚡ QUICK SIGNAL

📈 MARKET: ${market}
💰 PRICE: ${price}

${UI(result)}

🎯 CONFIDENCE: ${Math.round(result.confidence)}%

📈 TREND: ${result.trend || "SIDE"}
📊 RSI: ${result.rsi || "--"}

🚀 MAX BOT`
  );
});

// ===============================
// AUTO SIGNAL
// ===============================
bot.onText(/📈 AUTO SIGNAL/, async (msg) => {

  const chatId = msg.chat.id;

  autoUsers[chatId] = true;

  await bot.sendMessage(chatId, "🔥 AUTO SIGNAL ON");

  const loop = async () => {

    if (!autoUsers[chatId]) return;

    const markets = generateMarkets();

    const market =
      markets[Math.floor(Math.random() * markets.length)];

    const closes = generateCloses(market);

    const result = smartSignal(closes);

    const price = closes.at(-1);

    if (result.signal !== "⚪ WAIT") {

      await bot.sendMessage(
        chatId,
`📊 AUTO SIGNAL

📈 MARKET: ${market}
💰 PRICE: ${price}

${UI(result)}

🎯 CONFIDENCE: ${Math.round(result.confidence)}%

📈 TREND: ${result.trend || "SIDE"}
📊 RSI: ${result.rsi || "--"}

🚀 MAX BOT`
      );
    }

    setTimeout(loop, 15000);
  };

  loop();
});

// ===============================
// STOP AUTO
// ===============================
bot.onText(/⛔ STOP AUTO/, async (msg) => {

  autoUsers[msg.chat.id] = false;

  await bot.sendMessage(
    msg.chat.id,
"⛔ AUTO SIGNAL STOPPED"
  );
});

// ===============================
// CALLBACK HANDLER
// ===============================
bot.on("callback_query", async (q) => {

  const chatId = q.message.chat.id;

  // ===============================
  // MARKET SELECT
  // ===============================
  if (q.data.startsWith("m_")) {

    const market = q.data.replace("m_", "");

    userState[chatId] = { market };

    await bot.deleteMessage(chatId, q.message.message_id);

    await bot.sendMessage(
      chatId,
`📈 MARKET SELECTED

${market}

⏳ Choose timeframe`,
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

  // ===============================
  // TIMEFRAME SELECT
  // ===============================
  if (q.data.startsWith("t_")) {

    const tf = q.data.split("_")[1];

    const market =
      userState[chatId]?.market || "EUR/USD";

    await bot.deleteMessage(chatId, q.message.message_id);

    const loading = await bot.sendMessage(
      chatId,
`⚡ ANALYSING MARKET...

📊 ${market}
📈 ${tf}

🕯 Scanning candles...
📊 Detecting trend...
🔥 AI processing...`
    );

    setTimeout(async () => {

      const closes = generateCloses(market);

      const result = smartSignal(closes);

      const price = closes.at(-1);

      await bot.editMessageText(
`📊 SIGNAL READY

📈 MARKET: ${market}
💰 PRICE: ${price}
📊 TIMEFRAME: ${tf}

${UI(result)}

🎯 CONFIDENCE: ${Math.round(result.confidence)}%

📈 TREND: ${result.trend || "SIDE"}
📊 RSI: ${result.rsi || "--"}

🚀 MAX BOT`,
{
  chat_id: chatId,
  message_id: loading.message_id
});

    }, 12000);
  }
});
