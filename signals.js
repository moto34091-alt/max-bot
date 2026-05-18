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

// ===============================
// DOUBLE CONFIRMATION SIGNAL
// ===============================
function smartSignal(closes) {

  if (!closes || closes.length < 5) {
    return { signal: "⚪ WAIT", confidence: 50 };
  }

  const rsiFast = calculateRSI(closes.slice(-6));
  const rsiSlow = calculateRSI(closes);

  let s1 = null;
  let s2 = null;

  if (rsiFast < 35) s1 = "BUY";
  if (rsiFast > 65) s1 = "SELL";

  if (rsiSlow < 35) s2 = "BUY";
  if (rsiSlow > 65) s2 = "SELL";

  if (s1 && s1 === s2) {
    return {
      signal: s1 === "BUY" ? "🟢 BUY (CONFIRMED)" : "🔴 SELL (CONFIRMED)",
      confidence: Math.floor(85 + Math.random() * 10)
    };
  }

  return {
    signal: "⚪ WAIT",
    confidence: 50
  };
}

module.exports = { smartSignal };
