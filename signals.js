// ===============================
// RSI
// ===============================
function calculateRSI(closes, period = 14) {

  if (!closes || closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];

    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  const rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

// ===============================
// MOVING AVERAGE
// ===============================
function MA(data, period) {
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// ===============================
// SUPPORT & RESISTANCE
// ===============================
function supportResistance(closes, period = 20) {

  const slice = closes.slice(-period);

  const support = Math.min(...slice);
  const resistance = Math.max(...slice);

  return { support, resistance };
}

// ===============================
// BREAKOUT DETECTION
// ===============================
function breakout(closes, support, resistance) {

  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];

  // Breakout UP
  if (last > resistance && prev <= resistance) {
    return "BREAKOUT_UP";
  }

  // Breakout DOWN
  if (last < support && prev >= support) {
    return "BREAKOUT_DOWN";
  }

  return "NONE";
}

// ===============================
// SMART SIGNAL PRO
// ===============================
function smartSignal(closes) {

  if (!closes || closes.length < 20) {
    return { signal: "⚪ WAIT", confidence: 50 };
  }

  const rsi = calculateRSI(closes, 14);

  const maShort = MA(closes, 5);
  const maLong = MA(closes, 10);

  const { support, resistance } = supportResistance(closes);

  const brk = breakout(closes, support, resistance);

  let score = 0;

  // ===============================
  // TREND LOGIC
  // ===============================
  if (maShort > maLong) score += 20;
  if (maShort < maLong) score -= 20;

  // ===============================
  // RSI LOGIC
  // ===============================
  if (rsi < 40) score += 20;
  if (rsi > 60) score -= 20;

  // ===============================
  // BREAKOUT LOGIC (IMPORTANT)
  // ===============================
  if (brk === "BREAKOUT_UP") score += 40;
  if (brk === "BREAKOUT_DOWN") score -= 40;

  // ===============================
  // FINAL DECISION
  // ===============================
  if (score >= 50) {
    return {
      signal: "🟢 BUY",
      confidence: score,
      support,
      resistance,
      breakout: brk
    };
  }

  if (score <= -50) {
    return {
      signal: "🔴 SELL",
      confidence: Math.abs(score),
      support,
      resistance,
      breakout: brk
    };
  }

  return {
    signal: "⚪ WAIT",
    confidence: 50,
    support,
    resistance,
    breakout: brk
  };
}

module.exports = { smartSignal };
