export interface OracleResult {
  rolls: number[];
  hand: string;
  tier: number;
}

/** Five-die poker-hand oracle: maps a roll to a narrative outcome tier (0 = bust, 5 = best). */
export function runOracleDice(): OracleResult {
  const rolls = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => a - b);
  const counts = rolls.reduce((acc: Record<number, number>, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  const freq = Object.values(counts).sort((a, b) => b - a);

  let hand = "Bust (High Card)";
  let tier = 0;
  if (freq[0] === 5) { hand = "Five of a Kind"; tier = 5; }
  else if (freq[0] === 4) { hand = "Four of a Kind"; tier = 5; }
  else if (freq[0] === 3 && freq[1] === 2) { hand = "Full House"; tier = 4; }
  else if (freq[0] === 3) { hand = "Three of a Kind"; tier = 3; }
  else if (freq[0] === 2 && freq[1] === 2) { hand = "Two Pair"; tier = 2; }
  else if (freq[0] === 2) { hand = "Pair"; tier = 1; }

  return { rolls, hand, tier };
}
