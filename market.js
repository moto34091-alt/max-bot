function generateCloses(market = "BTC/USD", timeframe = "1m") {

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
    "TRX/USD": 0.12
  };

  let price = base[market] || 100;

  const closes = [];

  for (let i = 0; i < 30; i++) {

    const change = (Math.random() - 0.5) * (price * 0.01);

    price = price + change;

    closes.push(Number(price.toFixed(4)));
  }

  return closes;
}

module.exports = { generateCloses };
