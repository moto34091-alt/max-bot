const axios = require("axios");

const API_KEY = process.env.TWELVE_API_KEY;

// 🔥 Universe (pas affiché, juste pour scan)
const BASE_ASSETS = [
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "XRP/USD",
  "BNB/USD",
  "DOGE/USD",
  "ADA/USD",
  "AVAX/USD",
  "LTC/USD",
  "TRX/USD"
];

// ===============================
// CHECK IF MARKET IS VALID
// ===============================
async function checkMarket(symbol) {
  try {
    const res = await axios.get("https://api.twelvedata.com/time_series", {
      params: {
        symbol,
        interval: "1min",
        outputsize: 5,
        apikey: API_KEY
      }
    });

    return res.data && res.data.values ? symbol : null;

  } catch {
    return null;
  }
}

// ===============================
// GENERATE REAL MARKETS (DYNAMIC)
// ===============================
async function generateMarkets() {

  const validMarkets = [];

  for (let i = 0; i < BASE_ASSETS.length; i++) {

    const symbol = BASE_ASSETS[i];

    const ok = await checkMarket(symbol);

    if (ok) validMarkets.push(ok);
  }

  // fallback si API limite
  if (validMarkets.length === 0) {
    return ["BTC/USD", "ETH/USD"];
  }

  return validMarkets;
}

// ===============================
// GET REAL CANDLES
// ===============================
async function generateCloses(symbol = "BTC/USD", interval = "1min") {

  try {

    const res = await axios.get("https://api.twelvedata.com/time_series", {
      params: {
        symbol,
        interval,
        outputsize: 20,
        apikey: API_KEY
      }
    });

    const closes = res.data.values
      .reverse()
      .map(c => parseFloat(c.close));

    return closes;

  } catch (error) {
    console.log("❌ MARKET ERROR:", error.message);

    return Array.from({ length: 20 }, () => 100 + Math.random() * 2);
  }
}

module.exports = { generateMarkets, generateCloses };
