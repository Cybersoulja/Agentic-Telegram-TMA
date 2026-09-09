/**
 * Oracle Engine - Story Decision Oracle
 * Rolls 5 poker dice, calculates a tier, and generates a narrative outcome
 * for whatever situation the player describes.
 */

export interface DiceResult {
  dice: number[];
  hand: string;
  tier: number;
}

export interface OracleResult {
  situation: string;
  diceResult: DiceResult;
  narrative: string;
  timestamp: Date;
}

// --- Dice Engine ---

export function rollDice(): DiceResult {
  const dice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1).sort(
    (a, b) => a - b
  );

  const counts = dice.reduce<Record<number, number>>((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  const freq = Object.values(counts).sort((a, b) => b - a);

  let hand = 'Bust';
  let tier = 0;

  if (freq[0] === 5) {
    hand = 'Five of a Kind';
    tier = 5;
  } else if (freq[0] === 4) {
    hand = 'Four of a Kind';
    tier = 5;
  } else if (freq[0] === 3 && freq[1] === 2) {
    hand = 'Full House';
    tier = 4;
  } else if (freq[0] === 3) {
    hand = 'Three of a Kind';
    tier = 3;
  } else if (freq[0] === 2 && freq[1] === 2) {
    hand = 'Two Pair';
    tier = 2;
  } else if (freq[0] === 2) {
    hand = 'Pair';
    tier = 1;
  }

  return { dice, hand, tier };
}

// --- Narrative Generator ---

const TIER_PREFIXES: Record<number, string[]> = {
  0: [
    'The fates conspire against you.',
    'Darkness closes in.',
    'Fortune turns its back.',
    'The odds collapse entirely.',
    'Misfortune strikes without warning.',
  ],
  1: [
    'A glimmer of hope amid uncertainty.',
    'You manage, barely.',
    'The situation yields — grudgingly.',
    'Fate offers the smallest of handholds.',
    'A minor stroke of luck steadies your footing.',
  ],
  2: [
    'The scales tip in your favour.',
    'Progress, though not without cost.',
    'You push through the resistance.',
    'The path forward reveals itself.',
    'Momentum builds from small wins.',
  ],
  3: [
    'Your instincts prove sound.',
    'The Aether answers your call.',
    'Fortune rewards the bold.',
    'Precision and timing align.',
    'Opportunity seizes itself.',
  ],
  4: [
    'The world bends to your will.',
    'A decisive strike against uncertainty.',
    'Near perfection — and it shows.',
    'Forces beyond chance guide your hand.',
    'The Oracle speaks clearly: prevail.',
  ],
  5: [
    'CRITICAL SUCCESS — the impossible yields.',
    'The universe conspires in your favour.',
    'Legend is written in this moment.',
    'Every element aligns in perfect harmony.',
    'Even the gods pause to watch.',
  ],
};

const TIER_OUTCOMES: Record<number, string[]> = {
  0: [
    'Your attempt backfires. Something valuable is lost or broken, and the situation worsens.',
    'You fail and attract unwanted attention in the process.',
    'The action collapses. A new complication has been introduced.',
    'You stumble badly — retreat and reassess.',
    'Nothing goes as planned. Spend resources or face consequences.',
  ],
  1: [
    'You partially succeed, but there is a catch — a trade-off you must accept.',
    'The goal is achieved in a limited way. Expect complications down the line.',
    'You scrape through with the bare minimum. It cost more than it should.',
    'A shaky success. The cracks will show eventually.',
    'You succeed, but luck alone carried you — it cannot last.',
  ],
  2: [
    'Success with minor complications. You achieve your goal but leave a loose thread.',
    'You accomplish what you set out to do, though imperfectly.',
    'The task is done. Small consequences may follow, but nothing insurmountable.',
    'You get what you needed, at a manageable cost.',
    'Progress confirmed. A secondary challenge remains.',
  ],
  3: [
    'Clean success. You accomplish your goal exactly as intended.',
    'Solid result. No unexpected drawbacks — well executed.',
    'The action lands perfectly. Move forward with confidence.',
    'Success without complication. The path ahead is clear.',
    'Your skill speaks for itself. The outcome is exactly what you sought.',
  ],
  4: [
    'Exceptional success — beyond what you hoped for. An unexpected bonus emerges.',
    'Your actions exceed expectations. A hidden advantage is revealed.',
    'Near-critical result. Something extra is gained alongside your goal.',
    'Brilliant execution. The scene shifts decisively in your favour.',
    'You don\'t just succeed — you excel. Others take notice.',
  ],
  5: [
    'LEGENDARY outcome. You not only succeed but fundamentally change what was possible. Something extraordinary is unlocked.',
    'Critical success beyond the ordinary. Reality itself seems to bend. Gain a rare or permanent advantage.',
    'The Oracle has never seen this: perfect execution at the perfect moment. The consequences ripple outward.',
    'Every factor converges. Not only do you achieve your goal — you discover something no one expected.',
    'Maximum result. The Aether flows through you. Whatever you sought is yours, and then some.',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateNarrative(situation: string, diceResult: DiceResult): string {
  const prefix = pick(TIER_PREFIXES[diceResult.tier]);
  const outcome = pick(TIER_OUTCOMES[diceResult.tier]);

  // Weave the situation into the narrative when it is short enough to embed naturally
  const trimmed = situation.trim();
  const situationClause =
    trimmed.length > 0 && trimmed.length < 80 ? ` As you attempt to ${trimmed.toLowerCase().replace(/[.!?]+$/, '')},` : '';

  return `${prefix}${situationClause} ${outcome} [${diceResult.hand} — Tier ${diceResult.tier}]`;
}
