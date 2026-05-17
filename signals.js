bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;

  if (query.data === "signal") {

    bot.sendMessage(chatId, "⚡ Analysing market...");

    try {

      const closes = generateCloses();

      if (!closes || closes.length === 0) {
        throw new Error("No market data");
      }

      const result = smartSignal(closes);

      if (!result || !result.signal) {
        throw new Error("Invalid signal");
      }

      await Signal.create({
        signal: result.signal,
        confidence: result.confidence || 0
      });

      bot.sendMessage(chatId,
`📊 SIGNAL

${result.signal}

🎯 Confidence: ${result.confidence}%`
      );

    } catch (error) {
      console.log("SIGNAL ERROR:", error.message);
      bot.sendMessage(chatId, "❌ Error generating signal");
    }
  }
});
