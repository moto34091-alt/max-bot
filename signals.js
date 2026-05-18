function RSI(closes, period = 14) {

  let gain = 0;
  let loss = 0;

  const start = closes.length - period;

  for (let i = start; i < closes.length; i++) {

    const diff = closes[i] - closes[i - 1];

    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  const rs = gain / (loss || 1);

  return 100 - (100 / (1 + rs));
}

function MA(data, p) {

  let sum = 0;

  const start = data.length - p;

  for (let i = start; i < data.length; i++) {
    sum += data[i];
  }

  return sum / p;
}

// ===============================
// TREND FAST
// ===============================
function trend(closes) {

  const l = closes.length;

  if (
    closes[l - 1] > closes[l - 2] &&
    closes[l - 2] > closes[l - 3]
  ) return "UP";

  if (
    closes[l - 1] < closes[l - 2] &&
    closes[l - 2] < closes[l - 3]
  ) return "DOWN";

  return "SIDE";
}

// ===============================
// RANGE FILTER (ANTI FAKE)
// ===============================
function isRange(closes) {

  const max = Math.max(...closes.slice(-10));
  const min = Math.min(...closes.slice(-10));

  return (max - min) < (closes.at(-1) * 0.001);
}

// ===============================
// DISAGREEMENT FILTER
// ===============================
function noClearDirection(buy, sell) {

  return Math.abs(buy - sell) < 20;
}

// ===============================
// MOMENTUM
// ===============================
function momentum(closes) {

  return closes.at(-1) - closes.at(-4);
}

// ===============================
// EXTRA PRO FILTER (NEW)
// ===============================
function weakMarket(closes) {

  let vol = 0;

  for (let i = 1; i < closes.length; i++) {
    vol += Math.abs(closes[i] - closes[i - 1]);
  }

  return vol / closes.length < closes.at(-1) * 0.0005;
}

// ===============================
// SMART SIGNAL PRO FINAL + ANTI FAKE
// ===============================
function smartSignal(closes) {

  if (!closes || closes.length < 20) {
    return {
      signal: "⚪ WAIT",
      confidence: 50,
      reason: "NOT ENOUGH DATA"
    };
  }

  const rsi = RSI(closes);
  const ma5 = MA(closes, 5);
  const ma10 = MA(closes, 10);

  const tr = trend(closes);
  const mom = momentum(closes);

  let buy = 0;
  let sell = 0;

  // ===============================
  // TREND
  // ===============================
  if (ma5 > ma10) buy += 35;
  else sell += 35;

  // ===============================
  // RSI
  // ===============================
  if (rsi < 45) buy += 25;
  if (rsi > 55) sell += 25;

  // ===============================
  // MOMENTUM
  // ===============================
  if (mom > 0) buy += 15;
  if (mom < 0) sell += 15;

  // ===============================
  // TREND CONFIRM
  // ===============================
  if (tr === "UP") buy += 20;
  if (tr === "DOWN") sell += 20;

  // ===============================
  // 🚨 ANTI FAKE FILTERS
  // ===============================

  if (isRange(closes)) {
    return {
      signal: "⚪ WAIT",
      confidence: 40,
      reason: "RANGE MARKET",
      trend: tr,
      rsi: Number(rsi.toFixed(2))
    };
  }

  if (weakMarket(closes)) {
    return {
      signal: "⚪ WAIT",
      confidence: 45,
      reason: "WEAK VOLATILITY",
      trend: tr,
      rsi: Number(rsi.toFixed(2))
    };
  }

  if (rsi >= 48 && rsi <= 52) {
    return {
      signal: "⚪ WAIT",
      confidence: 45,
      reason: "RSI NEUTRAL",
      trend: tr,
      rsi: Number(rsi.toFixed(2))
    };
  }

  if (noClearDirection(buy, sell)) {
    return {
      signal: "⚪ WAIT",
      confidence: 45,
      reason: "NO CLEAR DIRECTION",
      trend: tr,
      rsi: Number(rsi.toFixed(2))
    };
  }

  // ===============================
  // FINAL SIGNAL
  // ===============================
  if (buy > sell && buy >= 60) {
    return {
      signal: "🟢 BUY",
      confidence: Math.min(95, buy),
      trend: tr,
      rsi: Number(rsi.toFixed(2))
    };
  }

  if (sell > buy && sell >= 60) {
    return {
      signal: "🔴 SELL",
      confidence: Math.min(95, sell),
      trend: tr,
      rsi: Number(rsi.toFixed(2))
    };
  }

  return {
    signal: "⚪ WAIT",
    confidence: 50,
    trend: tr,
    rsi: Number(rsi.toFixed(2)),
    reason: "NO CONFIRMATION"
  };
}

module.exports = { smartSignal };
