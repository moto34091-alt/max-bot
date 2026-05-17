function calculateRSI(closes) {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];

    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  const rs = gains / (losses || 1);
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

function smartSignal(closes) {

  if (!closes || closes.length < 5) {
    return {
      signal: "WAIT",
      confidence: 50
    };
  }

  const rsi = calculateRSI(closes);

  if (rsi < 35) {
    return {
      signal: "BUY",
      confidence: Math.floor(80 + Math.random() * 15)
    };
  }

  if (rsi > 65) {
    return {
      signal: "SELL",
      confidence: Math.floor(80 + Math.random() * 15)
    };
  }

  return {
    signal: "WAIT",
    confidence: 55
  };
}

module.exports = { smartSignal };
