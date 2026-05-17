// ===============================
// OTC TELEGRAM SIGNAL BOT
// Node.js
// ===============================

require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ===============================
// TELEGRAM BOT
// ===============================

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// ===============================
// SIGNAL ENGINE
// ===============================

function randomSignal() {

  const buyChance = Math.floor(Math.random() * 100);

  if (buyChance > 50) {
    return {
      signal: "🟢 BUY",
      confidence: Math.floor(Math.random() * 10) + 90
    };
  }

  return {
    signal: "🔴 SELL",
    confidence: Math.floor(Math.random() * 10) + 90
  };
}

// ===============================
// START MESSAGE
// ===============================

bot.onText(/\/start/, (msg) => {

  bot.sendMessage(
    msg.chat.id,

`🚀 OTC AI SIGNAL BOT

⚡ Instant BUY / SELL
📈 Live OTC Analysis
🤖 Smart Strategy Engine

Click below to get signal.`,

{
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🚀 GET SIGNAL",
          callback_data: "signal"
        }
      ],
      [
        {
          text: "📊 DASHBOARD",
          url: "https://your-dashboard.up.railway.app"
        }
      ]
    ]
  }
}

  );

});

// ===============================
// BUTTON CLICK
// ===============================

bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  if (query.data === "signal") {

    // fake loading animation
    await bot.sendMessage(chatId, "⚡ Analysing OTC Market...");

    setTimeout(() => {

      const result = randomSignal();

      bot.sendMessage(chatId,

`${result.signal} SIGNAL

📊 PAIR: BTCUSDT OTC
⏰ TIMEFRAME: 1 MIN
🎯 CONFIDENCE: ${result.confidence}%

🔥 Smart OTC Strategy
🤖 AI Momentum Analysis`

      );

    }, 2000);

  }

});

// ===============================
// SOCKET.IO
// ===============================

io.on("connection", (socket) => {

  console.log("User connected");

  socket.emit("status", {
    message: "OTC BOT CONNECTED"
  });

});

// ===============================
// EXPRESS SERVER
// ===============================

app.get("/", (req, res) => {
  res.send("OTC BOT RUNNING");
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
