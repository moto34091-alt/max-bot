function calculateRSI(closes) {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];

    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  const rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

function calculateEMA(closes, period = 5) {
  const k = 2 / (period + 1);
  let ema = closes[0];

  for (let i = 1; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }

  return ema;
}

function smartSignal(closes) {

  const rsi = calculateRSI(closes);
  const ema = calculateEMA(closes);
  const lastPrice = closes[closes.length - 1];

  let signal;
  let confidence = 70;

  // 🔥 LOGIQUE FORCE (NO WAIT)
  if (rsi < 50 && lastPrice > ema) {
    signal = "🟢 BUY 📈";
    confidence = Math.floor(75 + Math.random() * 20);
  } else {
    signal = "🔴 SELL 📉";
    confidence = Math.floor(75 + Math.random() * 20);
  }

  return {
    signal,
    confidence
  };
}

module.exports = { smartSignal };
