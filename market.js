const axios = require("axios");

const API_KEY = process.env.TWELVE_API_KEY;

async function generateMarkets() {

  const base = [
    "BTC/USD",
    "ETH/USD",
    "SOL/USD",
    "XRP/USD",
    "BNB/USD"
  ];

  const valid = [];

  for (let i = 0; i < base.length; i++) {
    try {
      const res = await axios.get("https://api.twelvedata.com/time_series", {
        params: {
          symbol: base[i],
          interval: "1min",
          outputsize: 1,
          apikey: API_KEY
        }
      });

      if (res.data && res.data.values) {
        valid.push(base[i]);
      }

    } catch {}
  }

  return valid.length ? valid : ["BTC/USD", "ETH/USD"];
}

async function generateCloses(symbol, interval = "1min") {

  try {
    const res = await axios.get("https://api.twelvedata.com/time_series", {
      params: {
        symbol,
        interval,
        outputsize: 20,
        apikey: API_KEY
      }
    });

    return res.data.values.reverse().map(c => parseFloat(c.close));

  } catch {
    return Array.from({ length: 20 }, () => 100 + Math.random());
  }
}

module.exports = { generateMarkets, generateCloses };
