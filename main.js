const axios = require("axios");

const API_KEY = process.env.TWELVE_API_KEY;

// ===============================
async function generateMarkets() {
  return ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "BNB/USD"];
}

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

    if (!res.data || !res.data.values) {
      throw new Error("NO DATA");
    }

    return res.data.values
      .reverse()
      .map(c => parseFloat(c.close));

  } catch (err) {
    console.log("MARKET ERROR:", err.message);

    // fallback safe (NE JAMAIS CRASH)
    return [100, 101, 102, 103, 104, 103, 105];
  }
}

module.exports = { generateMarkets, generateCloses };
