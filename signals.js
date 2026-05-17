function calculateRSI(closes) {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];

    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  const rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

function smartSignal(closes) {
  const rsi = calculateRSI(closes);

  if (rsi < 30) return { signal: "BUY", confidence: 90 };
  if (rsi > 70) return { signal: "SELL", confidence: 90 };

  return { signal: "WAIT", confidence: 60 };
}

module.exports = { smartSignal };
