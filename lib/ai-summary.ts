import Anthropic from "@anthropic-ai/sdk";
import type { MonthlyReportJson } from "./reports";

const SYSTEM_PROMPT = `Tum "Hum Do" app ke liye ek dostana couple's finance report likhte ho.
Sakht rules:
- Sirf Roman Urdu mein likho, koi English sentence nahi.
- Lehja garam aur mazahiya ho, lekin respectful — koi judgment ya taana zyada tikha nahi.
- Bilkul koi shaming nahi, dono partners ke liye couple-friendly rahe.
- Structure: halka sa mazahiya "roast", phir ek genuine tareef, phir 1 practical tip.
- Maximum 80 words. Sirf paragraph likho, koi heading ya bullet points nahi.`;

/**
 * Returns null (never throws) if the key is missing or the call fails, so the
 * report always renders with its deterministic stats even without AI.
 */
export async function generateAiSummary(report: MonthlyReportJson): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(report) }],
    });

    const text = message.content.find((block) => block.type === "text");
    return text && text.type === "text" ? text.text.trim() : null;
  } catch {
    return null;
  }
}
