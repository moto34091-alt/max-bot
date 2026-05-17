function generateCloses() {
  let price = 100;
  const closes = [];

  for (let i = 0; i < 14; i++) {
    price += (Math.random() - 0.5) * 2;
    closes.push(price);
  }

  return closes;
}

module.exports = { generateCloses };
