require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const { smartSignal } = require("./signals");
const { generateCloses, generateMarkets } = require("./market");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const userState = {};
const autoUsers = {};

// ===============================
const app = express();
app.get("/", (req,res)=>res.send("MAX BOT OK"));
app.listen(process.env.PORT || 3000);

// ===============================
// UI
// ===============================
function UI(result){

  if(result.signal.includes("BUY")){
    return `████████\n🟢 BUY ⬆️\n████████`;
  }

  if(result.signal.includes("SELL")){
    return `████████\n🔴 SELL ⬇️\n████████`;
  }

  return `████████\n⚪ WAIT\n████████`;
}

// ===============================
// START
// ===============================
bot.onText(/\/start/, (msg)=>{

  bot.sendMessage(msg.chat.id,
`🚀 MAX BOT`,
{
  reply_markup:{
    keyboard:[
      ["📊 SIGNAL"],
      ["⚡ QUICK SIGNAL"],
      ["📈 AUTO SIGNAL","⛔ STOP AUTO"],
      ["👤 AIDE @Mr_dflam"]
    ],
    resize_keyboard:true
  }
});
});

// ===============================
// AIDE
// ===============================
bot.onText(/👤 AIDE @Mr_dflam/, (msg)=>{
  bot.sendMessage(msg.chat.id,"👤 @Mr_dflam support");
});

// ===============================
// SIGNAL
// ===============================
bot.onText(/📊 SIGNAL/, (msg)=>{

  const markets = generateMarkets();

  bot.sendMessage(msg.chat.id,"📊 CHOOSE MARKET",{
    reply_markup:{
      inline_keyboard: markets.map(m=>[{
        text:m,
        callback_data:"m_"+m
      }])
    }
  });
});

// ===============================
// QUICK
// ===============================
bot.onText(/⚡ QUICK SIGNAL/, async (msg)=>{

  const markets = generateMarkets();
  const market = markets[Math.floor(Math.random()*markets.length)];

  const closes = generateCloses(market);
  const result = smartSignal(closes);

  bot.sendMessage(msg.chat.id,
`📊 QUICK

📈 ${market}

${UI(result)}

🎯 ${result.confidence}%`);
});

// ===============================
// AUTO
// ===============================
bot.onText(/📈 AUTO SIGNAL/, (msg)=>{

  autoUsers[msg.chat.id] = true;

  const loop = async ()=>{

    if(!autoUsers[msg.chat.id]) return;

    const markets = generateMarkets();
    const market = markets[Math.floor(Math.random()*markets.length)];

    const closes = generateCloses(market);
    const result = smartSignal(closes);

    if(result.signal !== "⚪ WAIT"){
      bot.sendMessage(msg.chat.id,
`📊 AUTO

📈 ${market}

${UI(result)}

🎯 ${result.confidence}%`);
    }

    setTimeout(loop,15000);
  };

  loop();
});

// ===============================
// STOP
// ===============================
bot.onText(/⛔ STOP AUTO/, (msg)=>{
  autoUsers[msg.chat.id]=false;
  bot.sendMessage(msg.chat.id,"STOPPED");
});

// ===============================
// CALLBACK
// ===============================
bot.on("callback_query", async (q)=>{

  const chatId = q.message.chat.id;

  if(q.data.startsWith("m_")){

    const market = q.data.replace("m_","");

    userState[chatId]={market};

    bot.editMessageText("📈 TIMEFRAME",{
      chat_id:chatId,
      message_id:q.message.message_id,
      reply_markup:{
        inline_keyboard:[
          [{text:"1m",callback_data:"t_1m"}],
          [{text:"5m",callback_data:"t_5m"}]
        ]
      }
    });
  }

  if(q.data.startsWith("t_")){

    const tf = q.data.split("_")[1];
    const market = userState[chatId].market;

    const msg = await bot.sendMessage(chatId,"⚡ ANALYSING...");

    setTimeout(()=>{

      const closes = generateCloses(market);
      const result = smartSignal(closes);

      bot.editMessageText(
`📊 RESULT

📈 ${market}
📊 ${tf}

${UI(result)}

🎯 ${result.confidence}%`,
{
  chat_id:chatId,
  message_id:msg.message_id
});

    },12000);
  }
});
