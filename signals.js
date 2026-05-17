function smartSignal(closes) {

  if (!closes || closes.length < 5) {
    return { signal: "WAIT", confidence: 50 };
  }

  let gain = 0;
  let loss = 0;

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];

    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  const rs = gain / (loss || 1);
  const rsi = 100 - (100 / (1 + rs));

  if (rsi < 40) {
    return {
      signal: "🟢 BUY",
      confidence: 80 + Math.random() * 10
    };
  }

  if (rsi > 60) {
    return {
      signal: "🔴 SELL",
      confidence: 80 + Math.random() * 10
    };
  }

  return {
    signal: "⚪ WAIT",
    confidence: 55
  };
}

module.exports = { smartSignal };
