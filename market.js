function generateCloses(market = "EUR/USD") {

  const base = {
    "EUR/USD": 1.08,
    "GBP/USD": 1.27,
    "USD/JPY": 155,
    "USD/CHF": 0.88,
    "USD/CAD": 1.36,
    "AUD/USD": 0.66,
    "NZD/USD": 0.61,

    "EUR/JPY": 160,
    "GBP/JPY": 190,
    "AUD/JPY": 100,
    "CAD/JPY": 110,
    "CHF/JPY": 170,
    "NZD/JPY": 92,

    "EUR/GBP": 0.86,
    "EUR/CHF": 0.95,
    "EUR/CAD": 1.48,
    "EUR/AUD": 1.62,

    "GBP/CHF": 1.12,
    "GBP/CAD": 1.72,
    "GBP/AUD": 1.95,

    "AUD/CHF": 0.60,
    "CAD/CHF": 0.65,
    "AUD/CAD": 0.90
  };

  let price = base[market] || 1;

  const closes = [];

  for (let i = 0; i < 30; i++) {

    const change =
      (Math.random() - 0.5) * (price * 0.0025);

    price += change;

    closes.push(Number(price.toFixed(5)));
  }

  return closes;
}

// ===============================
// MARKETS LIST (PRO FOREX CLEAN)
// ===============================
function generateMarkets() {

  return [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "USD/CHF",
    "USD/CAD",
    "AUD/USD",
    "NZD/USD",

    "EUR/JPY",
    "GBP/JPY",
    "AUD/JPY",
    "CAD/JPY",
    "CHF/JPY",
    "NZD/JPY",

    "EUR/GBP",
    "EUR/CHF",
    "EUR/CAD",
    "EUR/AUD",

    "GBP/CHF",
    "GBP/CAD",
    "GBP/AUD",

    "AUD/CHF",
    "CAD/CHF",
    "AUD/CAD"
  ];
}

module.exports = {
  generateCloses,
  generateMarkets
};
