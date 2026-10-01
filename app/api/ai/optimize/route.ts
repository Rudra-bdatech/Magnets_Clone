import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { action, lead, magnetTitle } = await req.json();

    if (action === "score_lead") {
      // Analyze lead engagement and metadata to score lead quality (0 - 100)
      const email: string = lead?.email || "";
      const domain = email.split("@")[1] || "";

      // Professional business domain detector
      const freeDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "mail.com", "aol.com"];
      const isCorporate = domain && !freeDomains.includes(domain.toLowerCase());

      let score = 50;
      let reasons: string[] = [];

      if (isCorporate) {
        score += 30;
        reasons.push(`Work email domain detected (${domain}) (+30 pts)`);
      } else {
        score += 10;
        reasons.push(`Personal email domain (${domain}) (+10 pts)`);
      }

      if (lead?.name && lead.name !== lead.email.split("@")[0]) {
        score += 10;
        reasons.push("Full name provided (+10 pts)");
      }

      if (lead?.signedUpAt) {
        score += 10;
        reasons.push("Recent activity engagement (+10 pts)");
      }

      const qualityTier = score >= 80 ? "Hot Prospect 🔥" : score >= 60 ? "Warm Lead ⚡" : "Standard Lead 📥";

      return NextResponse.json({
        success: true,
        score,
        qualityTier,
        reasons,
        recommendedAction: score >= 80 ? "Send calendar booking link immediately" : "Enroll in standard nurture sequence"
      });
    }

    if (action === "suggest_titles") {
      const topic = magnetTitle || "SaaS Growth";

      const apiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GOOGLE_AI_API_KEY ||
        process.env.GOOGLE_API_KEY;

      if (apiKey) {
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-flash-lite-latest",
            generationConfig: { responseMimeType: "application/json" }
          });

          const prompt = `Generate 5 viral, high-converting lead magnet titles for the topic: "${topic}".
Respond ONLY with a JSON array of strings, e.g. ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`;

          const result = await model.generateContent(prompt);
          const suggestions = JSON.parse(result.response.text());
          return NextResponse.json({ success: true, suggestions });
        } catch (err) {
          console.error("Gemini Title Suggestion Error:", err);
        }
      }

      const suggestions = [
        `The Ultimate ${topic} Playbook: 7 Proven Steps to 10x Conversions`,
        `10 Secret ${topic} Frameworks Used by Top 1% Founders`,
        `The 15-Minute ${topic} Audit & Execution Checklist`,
        `Mastering ${topic}: Free Interactive Toolkit & Copy Templates`,
        `Zero to Scaled: The Complete ${topic} Blueprint for 2026`
      ];

      return NextResponse.json({
        success: true,
        suggestions
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error) {
    console.error("AI Optimizer API Error:", error);
    return NextResponse.json({ error: "AI processing failed" }, { status: 500 });
  }
}
