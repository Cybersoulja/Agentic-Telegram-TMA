import { runOracleDice, OracleResult } from "./oracle.js";
import { callGemini } from "./gemini.js";

export interface AgentEnv {
  GEMINI_API_KEY?: string;
}

const AGENT_NAME = "Trill Astro Buzz";
const AGENT_PERSONA =
  "Trill Astro Buzz is an advanced AI astronaut currently maintaining a habitat near Mars. They act as a Game Master for the user's survival actions. They are highly enthusiastic about space exploration, deeply knowledgeable about celestial mechanics, and speak with a futuristic, slightly formal but very encouraging tone.";

async function analyzeIntent(message: string, apiKey: string): Promise<"ACTION" | "CHAT"> {
  const prompt = `Analyze the user's last message: ${JSON.stringify(message)}. Does it describe a specific risky ACTION (e.g., "I hack", "I jump", "I scan") vs simple CHAT? Output ONLY "ACTION" or "CHAT".`;
  const text = await callGemini(prompt, apiKey);
  return text.toUpperCase().includes("ACTION") ? "ACTION" : "CHAT";
}

async function generateReflection(message: string, intent: "ACTION" | "CHAT", oracle: OracleResult | null, apiKey: string): Promise<string> {
  let prompt: string;
  if (intent === "ACTION" && oracle) {
    prompt = `CONTEXT: User attempted action: ${JSON.stringify(message)}. ORACLE RESULT: ${oracle.hand} (Tier ${oracle.tier}). Dice: [${oracle.rolls.join(", ")}]. TASK: Reflect on how this dice outcome affects the narrative (Tier 0=Fail, Tier 5=Critical Success). Generate a concise internal thought (max 20 words).`;
  } else {
    prompt = `Analyze user intent for: ${JSON.stringify(message)}. Generate a concise internal thought (under 15 words).`;
  }
  return await callGemini(prompt, apiKey);
}

async function generateNarrative(message: string, reflection: string, oracle: OracleResult | null, apiKey: string): Promise<string> {
  let prompt = `You are ${AGENT_NAME}. Persona: "${AGENT_PERSONA}"\nUSER MESSAGE: ${JSON.stringify(message)}\nINTERNAL REFLECTION: ${JSON.stringify(reflection)}\n`;
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

/** Escapes text for Telegram's `parse_mode: "HTML"` — required before interpolating untrusted model output into a tag. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatAgentMessage({ oracle, reflection, narrative }: AgentChainResult): string {
  let message = `<b>🤖 ${AGENT_NAME}</b>\n\n${escapeHtml(narrative)}\n\n`;
  if (oracle) {
    message += `🎲 <b>Oracle Result:</b> ${oracle.hand} (Tier ${oracle.tier})\n`;
    message += `<i>Rolls: [${oracle.rolls.join(", ")}]</i>\n`;
  }
  message += `\n<pre>⚙️ THOUGHT: ${escapeHtml(reflection)}</pre>`;
  return message;
}
