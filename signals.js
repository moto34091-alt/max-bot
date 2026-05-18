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

function MA(data, p) {
  return data.slice(-p).reduce((a,b)=>a+b,0)/p;
}

function SR(closes) {
  return {
    support: Math.min(...closes),
    resistance: Math.max(...closes)
  };
}

function breakout(closes, support, resistance) {

  const last = closes.at(-1);
  const prev = closes.at(-2);

  if (last > resistance && prev <= resistance) return "UP";
  if (last < support && prev >= support) return "DOWN";

  return "NONE";
}

function smartSignal(closes) {

  if (!closes || closes.length < 20) {
    return { signal: "⚪ WAIT", confidence: 50 };
  }

  const rsi = RSI(closes);

  const ma5 = MA(closes, 5);
  const ma10 = MA(closes, 10);

  const { support, resistance } = SR(closes);

  const brk = breakout(closes, support, resistance);

  let score = 0;

  if (ma5 > ma10) score += 20;
  if (ma5 < ma10) score -= 20;

  if (rsi < 40) score += 20;
  if (rsi > 60) score -= 20;

  if (brk === "UP") score += 40;
  if (brk === "DOWN") score -= 40;

  if (score >= 30) {
    return {
      signal: "🟢 BUY",
      confidence: score,
      support,
      resistance,
      breakout: brk
    };
  }

  if (score <= -30) {
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
