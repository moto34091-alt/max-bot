require("dotenv").config();

const express = require("express");

console.log("🚀 STARTING BOT...");

// ===============================
// SAFE IMPORTS (avoid crash)
// ===============================
let smartSignal, generateCloses, Signal;

try {
  ({ smartSignal } = require("./signals"));
  ({ generateCloses } = require("./market"));
  Signal = require("./models/Signal");
} catch (e) {
  console.log("⚠️ MODULE LOAD ERROR:", e.message);
}

// ===============================
// CHECK ENV SAFE
// ===============================
if (!process.env.BOT_TOKEN) {
  console.log("❌ BOT_TOKEN missing");
}

if (!process.env.MONGO_URL) {
  console.log("⚠️ MONGO_URL missing (bot will run without DB)");
}

// ===============================
// EXPRESS SERVER (MANDATORY RAILWAY)
// ===============================
const app = express();

app.get("/", (req, res) => {
  res.send("🚀 OTC BOT RUNNING");
});

app.get("/status", (req, res) => {
  res.json({ status: "ONLINE" });
});

app.get("/signal", (req, res) => {
  try {

    if (!generateCloses || !smartSignal) {
      return res.json({
        success: false,
        error: "Modules not loaded"
      });
    }

    const closes = generateCloses();
    const result = smartSignal(closes);

    res.json({
      success: true,
      signal: result.signal,
      confidence: result.confidence
    });

  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Server running on port " + PORT);
});

// ===============================
// TELEGRAM BOT (SAFE START)
// ===============================
let bot;

try {
  const TelegramBot = require("node-telegram-bot-api");

  if (process.env.BOT_TOKEN) {

    bot = new TelegramBot(process.env.BOT_TOKEN, {
      polling: true
    });

    bot.onText(/\/start/, (msg) => {
      bot.sendMessage(msg.chat.id,
`🚀 OTC BOT READY`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "GET SIGNAL", callback_data: "signal" }]
          ]
        }
      });
    });

    bot.on("callback_query", async (query) => {

      try {

        const chatId = query.message.chat.id;

        if (query.data === "signal") {

          bot.sendMessage(chatId, "⚡ Analysing market...");

          if (!generateCloses || !smartSignal) {
            return bot.sendMessage(chatId, "❌ Strategy not loaded");
          }

          const closes = generateCloses();
          const result = smartSignal(closes);

          bot.sendMessage(chatId,
`📊 SIGNAL

${result.signal || "WAIT"}

🎯 Confidence: ${result.confidence || 50}%`
          );
        }

      } catch (e) {
        console.log("BOT ERROR:", e.message);
      }
    });

    console.log("🤖 Telegram bot started");

  } else {
    console.log("⚠️ Bot not started (no token)");
  }

} catch (e) {
  console.log("❌ Telegram init error:", e.message);
}
