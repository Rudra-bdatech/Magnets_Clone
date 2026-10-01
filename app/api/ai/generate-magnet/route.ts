import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuthenticatedUserEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sessionEmail = await getAuthenticatedUserEmail();
    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { topic, targetAudience, format, tone } = await req.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const cleanTopic = topic.trim();
    const audience = targetAudience?.trim() || "ideal target audience";
    const selectedFormat = format || "Interactive Checklist";

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (apiKey) {
      const candidateModels = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = `You are a world-class copywriter and conversion rate optimization expert. 
Create a high-converting, professional lead magnet based on the following input:
- Topic/Outcome: "${cleanTopic}"
- Target Audience: "${audience}"
- Format: "${selectedFormat}"
- Tone: "${tone || "persuasive & professional"}"

Respond ONLY with a valid JSON object with the following fields:
{
  "name": "Catchy page & lead magnet title (e.g. 'The 5-Minute Content Engine')",
  "headline": "A magnetic 8-12 word main headline targeting ${audience}",
  "subheadline": "A clear 15-25 word value proposition explaining what they get and how it solves their pain",
  "cta": "Action-oriented button text (e.g. 'Claim Your Free Checklist')",
  "deliverable": "A detailed Markdown document outline for the lead magnet (use headings, bullet points, and actionable steps)",
  "pitch": "A 2-sentence persuasive hook about why this resource is a must-have",
  "bullets": ["Benefit 1 (10-15 words)", "Benefit 2 (10-15 words)", "Benefit 3 (10-15 words)"],
  "accent": "Hex color code fitting the topic (e.g. '#FE6F34', '#6366F1', or '#10B981')",
  "template": "${selectedFormat.toLowerCase().includes("video") ? "video" : "classic"}",
  "emails": [
    {
      "id": "em_1",
      "subject": "Catchy email subject line delivering the lead magnet",
      "delayLabel": "Immediate",
      "delayMinutes": 0,
      "status": "live",
      "sent": 1,
      "opened": 1
    },
    {
      "id": "em_2",
      "subject": "Email 2 subject addressing the #1 objection or mistake",
      "delayLabel": "1 day after signup",
      "delayMinutes": 1440,
      "status": "live",
      "sent": 0,
      "opened": 0
    },
    {
      "id": "em_3",
      "subject": "Email 3 subject offering quick win / bonus resource",
      "delayLabel": "3 days after signup",
      "delayMinutes": 4320,
      "status": "draft",
      "sent": 0,
      "opened": 0
    }
  ]
}`;

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
          });

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const aiData = JSON.parse(text);

          return NextResponse.json({
            success: true,
            provider: `Google AI Studio (${modelName})`,
            data: {
              ...aiData,
              template: selectedFormat.toLowerCase().includes("video") ? "video" : "classic"
            }
          });
        } catch (geminiErr: any) {
          console.error(`Google AI Studio Gemini API Error (${modelName}):`, geminiErr?.message || geminiErr);
          // Try next model in loop...
        }
      }
    }

    // Contextual Fallback Generator when API Key is not configured yet
    const title = `${cleanTopic.replace(/^(the|a|an)\s+/i, "")} Strategy Blueprint`;
    const headline = `Master ${cleanTopic} in Under 10 Minutes (Step-by-Step ${selectedFormat})`;
    const subheadline = `Get the exact ${selectedFormat.toLowerCase()} engineered specifically for ${audience} to cut setup time in half and drive measurable results today.`;
    const cta = `Claim Your Free ${selectedFormat.split(" ")[0]} Now`;

    const deliverable = `### 🚀 What's Inside:
- **Phase 1: Foundation Setup**: Core principles & mistake elimination framework.
- **Phase 2: Execution Checklist**: 7 actionable steps tailored for ${audience}.
- **Phase 3: High-ROI Automation**: Bonus copy templates and automation triggers.
- **Bonus Resource**: Pre-formatted Google Sheet / Notion workspace download.`;

    const pitch = `Stop wasting hours guessing how to scale ${cleanTopic}. This battle-tested resource breaks down the exact workflow used by top 1% ${audience}.`;

    const bullets = [
      `100% actionable framework built specifically for ${audience}`,
      `Includes pre-built copy-paste templates and workflow checklists`,
      `Zero fluff: designed to give you implementation results within 24 hours`
    ];

    const emails = [
      {
        id: `em_${Date.now()}_1`,
        subject: `[Access Granted] Here is your ${cleanTopic} ${selectedFormat}`,
        delayLabel: "Immediate",
        delayMinutes: 0,
        status: "live" as const,
        sent: 1,
        opened: 1
      },
      {
        id: `em_${Date.now()}_2`,
        subject: `The #1 mistake ${audience} make with ${cleanTopic}`,
        delayLabel: "1 day after signup",
        delayMinutes: 1440,
        status: "live" as const,
        sent: 0,
        opened: 0
      },
      {
        id: `em_${Date.now()}_3`,
        subject: `Quick check-in + bonus workflow tool`,
        delayLabel: "3 days after signup",
        delayMinutes: 4320,
        status: "draft" as const,
        sent: 0,
        opened: 0
      }
    ];

    return NextResponse.json({
      success: true,
      provider: "Template Fallback (Set GEMINI_API_KEY in .env.local to activate live Google AI Studio)",
      data: {
        name: title,
        headline,
        subheadline,
        cta,
        deliverable,
        pitch,
        bullets,
        accent: "#FE6F34",
        template: selectedFormat.toLowerCase().includes("video") ? "video" : "classic",
        emails
      }
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate AI lead magnet" }, { status: 500 });
  }
}

