const axios = require("axios");

const API_KEY = process.env.TWELVE_API_KEY;

// ===============================
// GENERATE FAKE LIST (SAFE)
// ===============================
async function generateMarkets() {
  // simple safe list (tu peux améliorer plus tard)
  return [
    "BTC/USD",
    "ETH/USD",
    "SOL/USD",
    "XRP/USD",
    "BNB/USD"
  ];
}

// ===============================
// GET REAL CANDLES (TWELVE DATA)
// ===============================
async function generateCloses(symbol = "BTC/USD", interval = "1min") {

  try {

    const res = await axios.get("https://api.twelvedata.com/time_series", {
      params: {
        symbol: symbol,
        interval: interval,
        outputsize: 20,
        apikey: API_KEY
      }
    });

    if (!res.data || !res.data.values) {
      throw new Error("No data from API");
    }

    return res.data.values
      .reverse()
      .map(c => parseFloat(c.close));

  } catch (error) {

    console.log("❌ MARKET ERROR:", error.message);

    // fallback SAFE DATA (never crash bot)
    return [100, 101, 102, 101, 103, 104, 103, 105];
  }
}

module.exports = { generateMarkets, generateCloses };
