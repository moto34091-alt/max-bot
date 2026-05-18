function RSI(closes, period = 14) {

  let gain = 0;
  let loss = 0;

  for (let i = closes.length - period; i < closes.length; i++) {

    const diff = closes[i] - closes[i - 1];

    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  const rs = gain / (loss || 1);

  return 100 - (100 / (1 + rs));
}

// ===============================
// MOVING AVERAGE
// ===============================
function MA(data, p) {
  return data.slice(-p).reduce((a, b) => a + b, 0) / p;
}

// ===============================
// SUPPORT / RESISTANCE
// ===============================
function SR(closes) {

  return {
    support: Math.min(...closes),
    resistance: Math.max(...closes)
  };
}

// ===============================
// BREAKOUT
// ===============================
function breakout(closes, support, resistance) {

  const last = closes.at(-1);
  const prev = closes.at(-2);

  if (last > resistance * 0.998 && prev <= resistance) {
    return "UP";
  }

  if (last < support * 1.002 && prev >= support) {
    return "DOWN";
  }

  return "NONE";
}

// ===============================
// SMART SIGNAL PRO
// ===============================
function smartSignal(closes) {

  if (!closes || closes.length < 20) {
    return {
      signal: "⚪ WAIT",
      confidence: 50
    };
  }

  const rsi = RSI(closes);

  const ma5 = MA(closes, 5);
  const ma10 = MA(closes, 10);

  const { support, resistance } = SR(closes);

  const brk = breakout(
    closes,
    support,
    resistance
  );

  let score = 0;

  // ===============================
  // TREND
  // ===============================
  if (ma5 > ma10) score += 30;
  if (ma5 < ma10) score -= 30;

  // ===============================
  // RSI
  // ===============================
  if (rsi < 45) score += 30;
  if (rsi > 55) score -= 30;

  // ===============================
  // BREAKOUT
  // ===============================
  if (brk === "UP") score += 40;
  if (brk === "DOWN") score -= 40;

  // ===============================
  // BUY
  // ===============================
  if (score >= 20) {

    return {
      signal: "🟢 BUY",
      confidence: Math.min(
        95,
        Math.abs(score) + 55
      ),
      support,
      resistance,
      breakout: brk
    };
  }

  // ===============================
  // SELL
  // ===============================
  if (score <= -20) {

    return {
      signal: "🔴 SELL",
      confidence: Math.min(
        95,
        Math.abs(score) + 55
      ),
      support,
      resistance,
      breakout: brk
    };
  }

  // ===============================
  // WAIT
  // ===============================
  return {
    signal: "⚪ WAIT",
    confidence: 50,
    support,
    resistance,
    breakout: brk
  };
}

module.exports = { smartSignal };
