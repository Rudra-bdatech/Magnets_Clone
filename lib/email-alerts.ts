import { sendMail } from "@/lib/email";

export interface LeadAlertPayload {
  ownerEmail: string;
  leadEmail: string;
  leadName?: string;
  pageTitle: string;
  signedUpAt: string;
  customAnswer?: string;
}

export async function sendInstantLeadAlert(payload: LeadAlertPayload): Promise<{ success: boolean; error?: string }> {
  const { ownerEmail, leadEmail, leadName, pageTitle, signedUpAt, customAnswer } = payload;

  if (!ownerEmail || !ownerEmail.includes("@")) {
    return { success: false, error: "Invalid target owner email address" };
  }

  // Use the public production URL by default so image assets load reliably across all email clients
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in").replace(/\/$/, "");
  const logoUrl = `${appUrl}/brand/custom-logo-light.png`;
  const leadDisplayName = leadName?.trim() || "New Subscriber";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Captured</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #0f172a;">
  <div style="background-color: #f8fafc; padding: 48px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; width: 100%; margin: 0 auto;">
      
      <!-- Brand Logo Header -->
      <tr>
        <td style="padding-bottom: 28px; text-align: center;">
          <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoUrl}" 
              alt="LeadMagnets" 
              height="30" 
              style="height: 30px; width: auto; max-height: 34px; display: inline-block; border: 0; outline: none; vertical-align: middle;" 
            />
          </a>
        </td>
      </tr>

      <!-- Main Clean Card -->
      <tr>
        <td>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);">
            
            <!-- Minimal Status Tag -->
            <div style="margin-bottom: 16px;">
              <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.04em; text-transform: uppercase;">
                New Lead Captured
              </span>
            </div>

            <!-- Heading -->
            <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.3; letter-spacing: -0.02em;">
              ${leadDisplayName} just signed up
            </h1>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 28px 0; line-height: 1.5;">
              A new subscriber opted in through <strong style="color: #0f172a; font-weight: 600;">${pageTitle || "your lead magnet"}</strong>.
            </p>

            <!-- Clean Key-Value Data Table (No nested cards) -->
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 28px; border-top: 1px solid #f1f5f9;">
              ${leadName ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 32%; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">
                  Name
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #0f172a;">
                  ${leadName}
                </td>
              </tr>
              ` : ""}

              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 32%; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">
                  Email
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 500; color: #0066B2;">
                  <a href="mailto:${leadEmail}" style="color: #0066B2; text-decoration: none;">${leadEmail}</a>
                </td>
              </tr>

              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 32%; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">
                  Magnet
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155;">
                  ${pageTitle || "Lead Magnet"}
                </td>
              </tr>

              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 32%; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">
                  Captured At
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">
                  ${signedUpAt}
                </td>
              </tr>

              ${customAnswer ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 32%; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; vertical-align: top;">
                  Response
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; line-height: 1.5;">
                  <div style="background-color: #f8fafc; border-left: 2px solid #0066B2; padding: 8px 12px; border-radius: 4px;">
                    ${customAnswer}
                  </div>
                </td>
              </tr>
              ` : ""}
            </table>

            <!-- Primary Action CTA Button -->
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px;">
              <tr>
                <td style="text-align: center;">
                  <a href="${appUrl}/dashboard/leads" style="background-color: #0066B2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; letter-spacing: -0.01em;">
                    View Lead in Dashboard →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Secondary Action Link -->
            <div style="text-align: center; margin-bottom: 8px;">
              <a href="mailto:${leadEmail}?subject=Thank%20you%20for%20accessing%20${encodeURIComponent(pageTitle || 'our resources')}" style="color: #64748b; font-size: 13px; text-decoration: none;">
                Or <span style="text-decoration: underline; color: #0066B2;">reply directly to ${leadEmail}</span>
              </a>
            </div>

          </div>
        </td>
      </tr>

      <!-- Sleek Minimal Footer -->
      <tr>
        <td style="padding-top: 24px; text-align: center;">
          <div style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
            Lead notification sent by <strong style="color: #64748b; font-weight: 600;">LeadMagnets</strong><br />
            <a href="${appUrl}/dashboard/settings" style="color: #94a3b8; text-decoration: underline;">Notification Settings</a> · <a href="${appUrl}/dashboard" style="color: #94a3b8; text-decoration: underline;">Dashboard</a>
          </div>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
  `;

  return sendMail({
    to: ownerEmail.trim(),
    subject: `New Lead: ${leadDisplayName} on "${pageTitle || "LeadMagnet"}"`,
    html: htmlContent,
  });
}
