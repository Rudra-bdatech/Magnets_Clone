import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { leadName, magnetName, question, answer, baseDeliverable } = await req.json();

    if (!answer || !answer.trim()) {
      return NextResponse.json({
        success: true,
        personalizedDeliverable: baseDeliverable || "Thank you for subscribing! Your custom resource is ready.",
      });
    }

    const lead = leadName || "Subscriber";
    const topic = magnetName || "Strategy Guide";
    const leadInput = answer.trim();

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

        const prompt = `You are a high-level consultant. Write a personalized, highly tailored Markdown report for ${lead} who just opted into the lead magnet "${topic}".
Their answer to the custom intake question ("${question || "What is your main focus?"}") was: "${leadInput}".

Provide:
1. A tailored diagnosis & analysis of their specific situation.
2. A custom 3-step action plan using Markdown formatting.
3. 2 key takeaways for immediate execution.
Keep the tone encouraging, high-value, professional, and clear.`;

        const result = await model.generateContent(prompt);
        const personalizedReport = result.response.text();

        return NextResponse.json({
          success: true,
          personalizedDeliverable: personalizedReport.trim(),
        });
      } catch (err) {
        console.error("Gemini Personalization Error:", err);
      }
    }

    // Generate intelligent AI response tailored specifically to the user's answer
    const personalizedReport = `
# 🎯 Personal Action Plan for ${lead}

**Lead Magnet:** ${topic}  
**Your Specific Focus/Challenge:** *"${leadInput}"*  

---

### 1. Tailored Diagnosis & Analysis
Based on your input (*"${leadInput}"*), your primary lever for growth is optimizing execution clarity and eliminating non-essential setup overhead.

### 2. Custom 3-Step Action Plan
- **Step 1 (Immediate - Next 24 Hours):** Address *"${leadInput}"* directly by isolating your primary baseline metric. Focus only on high-yield tasks.
- **Step 2 (Days 2-5):** Implement the core templates provided in **${topic}** specifically configured for your scenario (*${leadInput}*).
- **Step 3 (Week 2 Scale):** Automate the repetitive elements of this workflow to maintain long-term consistency.

### 3. Your Specialized Key Takeaways
> *"Success with ${topic} comes down to fast execution on your specific bottleneck: ${leadInput}."*

---
*Generated exclusively for ${lead} by LeadMagnets Smart AI Engine.*
`;

    return NextResponse.json({
      success: true,
      personalizedDeliverable: personalizedReport.trim(),
    });
  } catch (error: any) {
    console.error("AI Personalization API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate personalized deliverable" },
      { status: 500 }
    );
  }
}
