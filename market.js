function generateCloses(market = "BTC/USD") {

  const base = {
    "BTC/USD": 65000,
    "ETH/USD": 3200,
    "XRP/USD": 0.6,
    "SOL/USD": 140,
    "BNB/USD": 580,
    "DOGE/USD": 0.15,
    "ADA/USD": 0.5,
    "LTC/USD": 80,
    "AVAX/USD": 35,
    "TRX/USD": 0.12,
    "USD/CAD": 1.36,
    "GBP/CHF": 1.12,
    "GBP/JPY": 190,
    "EUR/USD": 1.08,
    "GBP/CAD": 1.72,
    "EUR/GBP": 0.86,
    "EUR/JPY": 160,
    "AUD/USD": 0.66,
    "AUD/CHF": 0.60,
    "CHF/JPY": 170,
    "GBP/AUD": 1.95,
    "CAD/JPY": 110,
    "EUR/CAD": 1.48,
    "AUD/CAD": 0.90,
    "GBP/USD": 1.27,
    "USD/CHF": 0.88,
    "USD/JPY": 155,
    "EUR/AUD": 1.62,
    "CAD/CHF": 0.65,
    "AUD/JPY": 100,
    "NZD/USD": 0.61,
    "EUR/CHF": 0.95,
    "NZD/JPY": 92
  };

  let price = base[market] || 100;

  const closes = [];

  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.5) * (price * 0.01);
    price += change;
    closes.push(Number(price.toFixed(4)));
  }

  return closes;
}

function generateMarkets() {
  return Object.keys({
    "BTC/USD":1,"ETH/USD":1,"XRP/USD":1,"SOL/USD":1,"BNB/USD":1,
    "DOGE/USD":1,"ADA/USD":1,"LTC/USD":1,"AVAX/USD":1,"TRX/USD":1,
    "USD/CAD":1,"GBP/CHF":1,"GBP/JPY":1,"EUR/USD":1,"GBP/CAD":1,
    "EUR/GBP":1,"EUR/JPY":1,"AUD/USD":1,"AUD/CHF":1,"CHF/JPY":1,
    "GBP/AUD":1,"CAD/JPY":1,"EUR/CAD":1,"AUD/CAD":1,"GBP/USD":1,
    "USD/CHF":1,"USD/JPY":1,"EUR/AUD":1,"CAD/CHF":1,"AUD/JPY":1,
    "NZD/USD":1,"EUR/CHF":1,"NZD/JPY":1
  });
}

module.exports = { generateCloses, generateMarkets };
