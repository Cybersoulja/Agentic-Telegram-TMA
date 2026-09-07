const API_MODEL = "gemini-2.5-flash";

export async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini API Error (${response.status}): ${errorText || response.statusText}`);
  }
  const data: any = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "System Error";
}
