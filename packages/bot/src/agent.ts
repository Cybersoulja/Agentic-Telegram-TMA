export interface AgentEnv {
  GEMINI_API_KEY?: string;
}

const AGENT_NAME = "Trill Astro Buzz";
const AGENT_PERSONA =
  "Trill Astro Buzz is an advanced AI astronaut currently maintaining a habitat near Mars. They act as a Game Master for the user's survival actions. They are highly enthusiastic about space exploration, deeply knowledgeable about celestial mechanics, and speak with a futuristic, slightly formal but very encouraging tone.";
const API_MODEL = "gemini-2.5-flash";

export interface OracleResult {
  rolls: number[];
  hand: string;
  tier: number;
}

function runOracleDice(): OracleResult {
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

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
  const data: any = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "System Error";
}

async function analyzeIntent(message: string, apiKey: string): Promise<"ACTION" | "CHAT"> {
  const prompt = `Analyze the user's last message: "${message}". Does it describe a specific risky ACTION (e.g., "I hack", "I jump", "I scan") vs simple CHAT? Output ONLY "ACTION" or "CHAT".`;
  const text = await callGemini(prompt, apiKey);
  return text.toUpperCase().includes("ACTION") ? "ACTION" : "CHAT";
}

async function generateReflection(message: string, intent: "ACTION" | "CHAT", oracle: OracleResult | null, apiKey: string): Promise<string> {
  let prompt: string;
  if (intent === "ACTION" && oracle) {
    prompt = `CONTEXT: User attempted action: "${message}". ORACLE RESULT: ${oracle.hand} (Tier ${oracle.tier}). Dice: [${oracle.rolls.join(", ")}]. TASK: Reflect on how this dice outcome affects the narrative (Tier 0=Fail, Tier 5=Critical Success). Generate a concise internal thought (max 20 words).`;
  } else {
    prompt = `Analyze user intent for: "${message}". Generate a concise internal thought (under 15 words).`;
  }
  return await callGemini(prompt, apiKey);
}

async function generateNarrative(message: string, reflection: string, oracle: OracleResult | null, apiKey: string): Promise<string> {
  let prompt = `You are ${AGENT_NAME}. Persona: "${AGENT_PERSONA}"\nUSER MESSAGE: "${message}"\nINTERNAL REFLECTION: "${reflection}"\n`;
  if (oracle) {
    prompt += `EVENT: User performed an action. DICE OUTCOME: ${oracle.hand} (Tier ${oracle.tier}). INSTRUCTION: Narrate the outcome based heavily on the Tier. Keep it under 3 sentences. Be dramatic.`;
  } else {
    prompt += `TASK: Generate a warm, concise response. (Max 3 sentences.)`;
  }
  return await callGemini(prompt, apiKey);
}

export interface AgentChainResult {
  intent: "ACTION" | "CHAT";
  oracle: OracleResult | null;
  reflection: string;
  narrative: string;
}

/** Runs the Oneseco Agentic Chain: Intent -> Oracle -> Reflection -> Narrative. */
export async function runAgentChain(message: string, apiKey: string): Promise<AgentChainResult> {
  const intent = await analyzeIntent(message, apiKey);
  const oracle = intent === "ACTION" ? runOracleDice() : null;
  const reflection = await generateReflection(message, intent, oracle, apiKey);
  const narrative = await generateNarrative(message, reflection, oracle, apiKey);
  return { intent, oracle, reflection, narrative };
}

export function formatAgentMessage({ oracle, reflection, narrative }: AgentChainResult): string {
  let message = `<b>🤖 ${AGENT_NAME}</b>\n\n${narrative}\n\n`;
  if (oracle) {
    message += `🎲 <b>Oracle Result:</b> ${oracle.hand} (Tier ${oracle.tier})\n`;
    message += `<i>Rolls: [${oracle.rolls.join(", ")}]</i>\n`;
  }
  message += `\n<pre>⚙️ THOUGHT: ${reflection}</pre>`;
  return message;
}
