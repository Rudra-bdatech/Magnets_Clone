import { sendMail } from "@/lib/email";

export interface LeadAlertPayload {
  ownerEmail: string;
  leadEmail: string;
  leadName?: string;
  pageTitle: string;
  signedUpAt: string;
  customAnswer?: string;
  hasSequence?: boolean;
  sequenceName?: string;
}

export async function sendInstantLeadAlert(payload: LeadAlertPayload): Promise<{ success: boolean; error?: string }> {
  const { ownerEmail, leadEmail, leadName, pageTitle, signedUpAt, customAnswer, hasSequence, sequenceName } = payload;

  if (!ownerEmail || !ownerEmail.includes("@")) {
    return { success: false, error: "Invalid target owner email address" };
  }

  // Use the public production URL by default so image assets load reliably across all email clients
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in").replace(/\/$/, "");
  const logoUrl = `${appUrl}/brand/custom-logo-light.png`;
  const leadDisplayName = leadName?.trim() || "New Subscriber";

  const isSequenceActive = Boolean(hasSequence || sequenceName);
  const automationStatusHtml = isSequenceActive
    ? `
            <tr><td class="content-pad" style="text-align:left;padding:20px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f0f7ff;border-radius:4px;">
                <tr>
                  <td width="4" style="text-align:left;width:4px;background-color:#0066cc;font-size:0;">&nbsp;</td>
                  <td style="text-align:left;padding:14px 16px;">
                    <p style="margin:0 0 3px;font-size:12px;line-height:18px;font-weight:bold;color:#1e40af;">Automation status</p>
                    <p style="margin:0;font-size:12px;line-height:19px;color:#3b6998;">Lead saved successfully. Automated follow-up sequence is active and Step 1 is scheduled.</p>
                  </td>
                </tr>
              </table>
            </td></tr>`
    : "";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
  <title>LeadMagnets — New lead received</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    table { border-collapse:collapse; }
    a { text-decoration:none; }
    @media screen and (max-width:620px) {
      .outer-pad { padding:24px 12px !important; }
      .content-pad { padding-left:24px !important; padding-right:24px !important; }
      .headline { font-size:26px !important; line-height:34px !important; }
      .detail-label { width:100px !important; }
      .cta { display:block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#f4f5f6;font-family:Arial,Helvetica,sans-serif;color:#17212f;">
  <!-- Inbox preview text -->
  <div style="display:none;font-size:1px;line-height:1px;color:#f4f5f6;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">A new subscriber just joined through your lead magnet. View their details and follow up.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f4f5f6;">
    <tr><td align="center" class="outer-pad" style="text-align:center;padding:40px 20px;">
      <!--[if mso]><table role="presentation" width="600" align="center" style="margin-left:auto;margin-right:auto;"><tr><td style="text-align:left;"><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;margin-left:auto;margin-right:auto;">
        <tr><td style="text-align:center;padding:0 0 24px;">
          <a href="${appUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
            <img 
              src="${logoUrl}" 
              alt="LeadMagnets" 
              height="28" 
              style="height:28px;width:auto;max-height:32px;display:block;margin:0 auto;border:0;outline:none;" 
            />
          </a>
        </td></tr>
        <tr><td style="text-align:left;background-color:#ffffff;border:1px solid #e2e7ee;border-radius:4px;overflow:hidden;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
            <tr><td height="4" style="text-align:left;height:3px;background-color:#0066cc;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td class="content-pad" style="text-align:left;padding:32px 40px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="text-align:left;padding:5px 10px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;color:#1d4ed8;font-size:10px;line-height:16px;font-weight:bold;letter-spacing:1px;">LEAD NOTIFICATION</td></tr>
              </table>
              <h1 class="headline" style="margin:18px 0 12px;font-size:28px;line-height:36px;font-weight:bold;color:#17212f;">New lead received</h1>
              <p style="margin:0;font-size:15px;line-height:24px;color:#647185;">${leadDisplayName} signed up through lead magnet <strong style="color:#17212f;">${pageTitle || "01"}</strong>. Review the contact details below.</p>
            </td></tr>
            <tr><td class="content-pad" style="text-align:left;padding:26px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#ffffff;border:1px solid #e2e7ee;border-radius:4px;">
                <tr><td style="text-align:left;padding:22px 20px 18px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                    <tr>
                      <td width="44" valign="top" style="text-align:left;width:44px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="44" height="44" align="center" style="text-align:center;width:44px;height:44px;background-color:#eff6ff;border-radius:22px;color:#0066cc;font-size:19px;line-height:44px;font-weight:bold;">${(leadDisplayName || "L").charAt(0).toUpperCase()}</td></tr></table>
                      </td>
                      <td style="text-align:left;padding-left:12px;word-break:break-word;">
                        <p style="margin:0 0 3px;font-size:16px;line-height:22px;font-weight:bold;color:#17212f;">${leadDisplayName}</p>
                        <a href="mailto:${leadEmail}" style="font-size:13px;line-height:20px;color:#0066cc;text-decoration:none;word-break:break-all;">${leadEmail}</a>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="text-align:left;padding:0 20px;"><table role="presentation" width="100%" style="width:100%;"><tr><td height="1" style="text-align:left;height:1px;background-color:#e2e7ee;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
                <tr><td style="text-align:left;padding:16px 20px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;table-layout:fixed;">
                    <tr>
                      <td class="detail-label" width="128" valign="top" style="text-align:left;width:128px;padding:5px 10px 5px 0;font-size:12px;line-height:19px;color:#647185;">Email address</td>
                      <td valign="top" style="text-align:left;padding:5px 0;font-size:12px;line-height:19px;color:#17212f;word-break:break-all;">${leadEmail}</td>
                    </tr>
                    <tr>
                      <td class="detail-label" width="128" valign="top" style="text-align:left;width:128px;padding:5px 10px 5px 0;font-size:12px;line-height:19px;color:#647185;">Full name</td>
                      <td style="text-align:left;padding:5px 0;font-size:12px;line-height:19px;color:#17212f;">${leadDisplayName}</td>
                    </tr>
                    <tr>
                      <td class="detail-label" width="128" valign="top" style="text-align:left;width:128px;padding:5px 10px 5px 0;font-size:12px;line-height:19px;color:#647185;">Lead magnet</td>
                      <td style="text-align:left;padding:5px 0;font-size:12px;line-height:19px;color:#17212f;">${pageTitle || "Lead Magnet"}</td>
                    </tr>
                    <tr>
                      <td class="detail-label" width="128" valign="top" style="text-align:left;width:128px;padding:5px 10px 5px 0;font-size:12px;line-height:19px;color:#647185;">Signed up</td>
                      <td style="text-align:left;padding:5px 0;font-size:12px;line-height:19px;color:#17212f;">${signedUpAt}</td>
                    </tr>
                    ${customAnswer ? `
                    <tr>
                      <td class="detail-label" width="128" valign="top" style="text-align:left;width:128px;padding:5px 10px 5px 0;font-size:12px;line-height:19px;color:#647185;">Custom answer</td>
                      <td style="text-align:left;padding:5px 0;font-size:12px;line-height:19px;color:#17212f;">${customAnswer}</td>
                    </tr>` : ""}
                  </table>
                </td></tr>
              </table>
            </td></tr>
            ${automationStatusHtml}
            <tr><td class="content-pad" style="text-align:left;padding:28px 40px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                <tr><td style="text-align:left;border-top:1px solid #e2e7ee;padding-top:20px;font-size:11px;line-height:18px;color:#7c8798;text-align:center;">You’re receiving this email because new lead notifications<br>are enabled for your LeadMagnets account.<br><a href="${appUrl}/dashboard/settings" style="display:inline-block;margin-top:8px;color:#647185;text-decoration:underline;">Manage notifications</a><span style="color:#b3bdca;"> &nbsp;&middot;&nbsp; </span><a href="${appUrl}/dashboard/settings" style="color:#647185;text-decoration:underline;">Unsubscribe</a></td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="text-align:center;padding-top:22px;font-size:11px;line-height:18px;color:#7c8798;">LeadMagnets<span style="color:#b3bdca;"> &nbsp;/&nbsp; </span> Account notifications</td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>
  `;

  return sendMail(
    {
      to: ownerEmail.trim(),
      subject: `New Lead: ${leadDisplayName} on "${pageTitle || "LeadMagnet"}"`,
      html: htmlContent,
    },
    ownerEmail.trim()
  );
}
