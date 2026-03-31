import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.argv[2] || process.env.OPENAI_MODEL || "gpt-3.5-turbo";

async function main() {
  console.log(`Testing model: ${model}`);
  try {
    const res = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Say hello in one word." }],
      max_tokens: 10,
    });
    console.log("OK:", res.choices[0]?.message?.content);
  } catch (e: any) {
    console.log("Error:", e.status, e.message);
  }
}

main();
