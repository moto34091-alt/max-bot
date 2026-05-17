require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const { smartSignal } = require("./signals");
const { generateCloses } = require("./market");
const Signal = require("./models/Signal");

// ===============================
// CHECK ENV
// ===============================
console.log("BOT_TOKEN =", process.env.BOT_TOKEN ? "OK" : "MISSING");
console.log("MONGO_URL =", process.env.MONGO_URL ? "OK" : "MISSING");

if (!process.env.BOT_TOKEN || !process.env.MONGO_URL) {
  console.log("❌ Missing environment variables");
  process.exit(1);
}

// ===============================
// MONGO CONNECT
// ===============================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.log("❌ MongoDB Error:", err.message);
  });

// ===============================
// TELEGRAM BOT
// ===============================
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// ===============================
// START COMMAND
// ===============================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🚀 OTC AI SIGNAL BOT

⚡ Instant BUY / SELL signals
📊 Smart analysis engine
🤖 RSI strategy active`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 GET SIGNAL", callback_data: "signal" }]
    ]
  }
});
});

// ===============================
// SIGNAL BUTTON
// ===============================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  if (query.data === "signal") {

    bot.sendMessage(chatId, "⚡ Analysing market...");

    setTimeout(async () => {

      try {

        const closes = generateCloses();
        const result = smartSignal(closes);

        // save to DB
        await Signal.create({
          signal: result.signal,
          confidence: result.confidence
        });

        bot.sendMessage(chatId,
`📊 SIGNAL RESULT

${result.signal}

🎯 Confidence: ${result.confidence}%
💱 Pair: BTCUSDT OTC
⏰ Timeframe: 1m`
        );

      } catch (error) {
        console.log("ERROR:", error.message);
        bot.sendMessage(chatId, "❌ Error generating signal");
      }

    }, 2000);
  }
});
