import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get("title") || "Free Digital Resource";
    const subtitle = searchParams.get("subtitle") || searchParams.get("description") || "Download your free guide and actionable framework.";
    const author = searchParams.get("author") || searchParams.get("name") || "Creator";
    const username = searchParams.get("username") || "creator";
    const badge = searchParams.get("badge") || "🎁 FREE RESOURCE";
    const theme = searchParams.get("theme") || "gradient";
    const url = searchParams.get("url") || `magnets.bdatech.in/${username}`;

    // Theme color palettes
    let bgStyle: any = {
      background: "linear-gradient(135deg, #0066B2 0%, #7C3AED 50%, #4F46E5 100%)",
      color: "#ffffff",
    };

    let boxBg = "rgba(255, 255, 255, 0.12)";
    let boxBorder = "rgba(255, 255, 255, 0.25)";
    let textColor = "#FFFFFF";
    let subTextColor = "rgba(255, 255, 255, 0.85)";
    let badgeBg = "rgba(255, 255, 255, 0.2)";

    if (theme === "dark") {
      bgStyle = { background: "#0F172A", color: "#ffffff" };
      boxBg = "rgba(255, 255, 255, 0.05)";
      boxBorder = "rgba(255, 255, 255, 0.15)";
    } else if (theme === "sunset") {
      bgStyle = {
        background: "linear-gradient(135deg, #F43F5E 0%, #F59E0B 100%)",
        color: "#ffffff",
      };
    } else if (theme === "emerald") {
      bgStyle = {
        background: "linear-gradient(135deg, #0D9488 0%, #059669 100%)",
        color: "#ffffff",
      };
    } else if (theme === "neon") {
      bgStyle = {
        background: "linear-gradient(135deg, #4338CA 0%, #DB2777 100%)",
        color: "#ffffff",
      };
    } else if (theme === "minimal") {
      bgStyle = { background: "#FFFFFF", color: "#0F172A" };
      boxBg = "rgba(15, 23, 42, 0.04)";
      boxBorder = "rgba(15, 23, 42, 0.1)";
      textColor = "#0F172A";
      subTextColor = "#475569";
      badgeBg = "rgba(0, 102, 178, 0.1)";
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 70px",
            fontFamily: "sans-serif",
            ...bgStyle,
          }}
        >
          {/* Top Row: Badge & Branding */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 18px",
                borderRadius: "9999px",
                backgroundColor: badgeBg,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: theme === "minimal" ? "#0066B2" : "#FFFFFF",
              }}
            >
              {badge}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 20,
                fontWeight: 600,
                opacity: 0.8,
              }}
            >
              ⚡ LeadMagnets
            </div>
          </div>

          {/* Center Main Copy Box */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: boxBg,
              border: `2px solid ${boxBorder}`,
              borderRadius: "24px",
              padding: "40px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: title.length > 50 ? 46 : 54,
                fontWeight: 800,
                lineHeight: 1.15,
                color: textColor,
                marginBottom: "16px",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: subTextColor,
                }}
              >
                {subtitle.length > 130 ? subtitle.slice(0, 130) + "..." : subtitle}
              </div>
            )}
          </div>

          {/* Footer Bar: Creator Details & URL Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1.5px solid ${theme === "minimal" ? "#E2E8F0" : "rgba(255,255,255,0.2)"}`,
              paddingTop: "24px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: textColor }}>
                By {author}
              </div>
              <div style={{ fontSize: 20, fontWeight: 500, opacity: 0.75, color: textColor }}>
                @{username}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                padding: "12px 24px",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                color: "#0066B2",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {url.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    return new Response(`Failed to generate dynamic OG card: ${error?.message || "Unknown error"}`, {
      status: 500,
    });
  }
}
