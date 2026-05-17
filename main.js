require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { smartSignal } = require("./signals");
const { generateCloses } = require("./market");

const mongoose = require("mongoose");
const Signal = require("./models/Signal");

mongoose.connect(process.env.MONGO_URL);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🚀 OTC BOT READY", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "GET SIGNAL", callback_data: "signal" }]
      ]
    }
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "signal") {
    bot.sendMessage(chatId, "Analyzing market...");

    setTimeout(async () => {
      const closes = generateCloses();
      const result = smartSignal(closes);

      await Signal.create(result);

      bot.sendMessage(chatId,
`${result.signal}
Confidence: ${result.confidence}%`
      );

    }, 2000);
  }
});
