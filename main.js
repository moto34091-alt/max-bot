require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

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
bot.onText(/\/start/, (msg) => {

  bot.sendMessage(
    msg.chat.id,
`🚀 MAX BOT`,
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
bot.onText(/👤 AIDE @Mr_dflam/, (msg) => {

  bot.sendMessage(
    msg.chat.id,
`👤 SUPPORT

📩 @Mr_dflam`
  );
});

// ===============================
// SIGNAL
// ===============================
bot.onText(/📊 SIGNAL/, (msg) => {

  const markets = generateMarkets();

  bot.sendMessage(
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

  const price = closes[closes.length - 1];

  bot.sendMessage(
    msg.chat.id,
`📊 QUICK SIGNAL

📈 ${market}
💰 ${price}

${UI(result)}

🎯 ${Math.round(result.confidence)}%`
  );
});

// ===============================
// AUTO SIGNAL
// ===============================
bot.onText(/📈 AUTO SIGNAL/, (msg) => {

  const chatId = msg.chat.id;

  autoUsers[chatId] = true;

  bot.sendMessage(chatId, "🔥 AUTO SIGNAL ON");

  const loop = async () => {

    if (!autoUsers[chatId]) return;

    const markets = generateMarkets();

    const market =
      markets[Math.floor(Math.random() * markets.length)];

    const closes = generateCloses(market);

    const result = smartSignal(closes);

    const price = closes[closes.length - 1];

    if (result.signal !== "⚪ WAIT") {

      bot.sendMessage(
        chatId,
`📊 AUTO SIGNAL

📈 ${market}
💰 ${price}

${UI(result)}

🎯 ${Math.round(result.confidence)}%`
      );
    }

    setTimeout(loop, 15000);
  };

  loop();
});

// ===============================
// STOP AUTO
// ===============================
bot.onText(/⛔ STOP AUTO/, (msg) => {

  autoUsers[msg.chat.id] = false;

  bot.sendMessage(
    msg.chat.id,
"⛔ AUTO SIGNAL STOPPED"
  );
});

// ===============================
// CALLBACK
// ===============================
bot.on("callback_query", async (q) => {

  const chatId = q.message.chat.id;

  // ===============================
  // MARKET
  // ===============================
  if (q.data.startsWith("m_")) {

    const market = q.data.replace("m_", "");

    userState[chatId] = { market };

    return bot.editMessageText(
`📈 SELECT TIMEFRAME

📊 ${market}`,
{
  chat_id: chatId,
  message_id: q.message.message_id,
  reply_markup: {
    inline_keyboard: [
      [
        { text: "1m", callback_data: "t_1m" }
      ],
      [
        { text: "5m", callback_data: "t_5m" }
      ]
    ]
  }
});
  }

  // ===============================
  // TIMEFRAME
  // ===============================
  if (q.data.startsWith("t_")) {

    const tf = q.data.split("_")[1];

    const market =
      userState[chatId]?.market || "BTC/USD";

    const loading =
      await bot.sendMessage(
        chatId,
`⚡ ANALYSING MARKET...

📊 ${market}
📈 ${tf}`
      );

    setTimeout(() => {

      const closes = generateCloses(market);

      const result = smartSignal(closes);

      const price = closes[closes.length - 1];

      bot.editMessageText(
`📊 SIGNAL READY

📈 ${market}
💰 ${price}
📊 ${tf}

${UI(result)}

🎯 ${Math.round(result.confidence)}%

🚀 MAX BOT`,
{
  chat_id: chatId,
  message_id: loading.message_id
});

    }, 12000);
  }
});
