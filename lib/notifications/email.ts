import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@uxlora.app";

export interface KitReadyEmailData {
  to: string;
  kitName: string;
  kitId: string;
  screenCount: number;
  category: string;
}

export async function sendKitReadyEmail(data: KitReadyEmailData): Promise<boolean> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://uxlora.app";
    const kitUrl = `${appUrl}/kit/${data.kitId}`;
    const categoryLabel = data.category === "game"
      ? "Game UI"
      : data.category === "mobile"
      ? "Mobile App UI"
      : "Web/SaaS UI";

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Your ${data.kitName} is ready ✨`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your UI Kit is Ready</title>
        </head>
        <body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            
            <!-- Logo -->
            <div style="margin-bottom:32px;">
              <span style="font-size:24px;font-weight:800;color:#fff;">
                UX<span style="color:#7c3aed;">Lora</span>
              </span>
            </div>

            <!-- Card -->
            <div style="background:#13131f;border:1px solid #2a2a3d;border-radius:16px;padding:32px;">
              
              <div style="font-size:40px;margin-bottom:16px;">✨</div>
              
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">
                Your UI kit is ready
              </h1>
              
              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">
                <strong style="color:#fff;">${data.kitName}</strong> has been generated 
                with ${data.screenCount} ${categoryLabel} screen${data.screenCount === 1 ? "" : "s"}.
              </p>

              <!-- Stats -->
              <div style="display:flex;gap:12px;margin-bottom:28px;">
                <div style="flex:1;background:#1a1a2e;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:700;color:#fff;">${data.screenCount}</div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px;">Screens</div>
                </div>
                <div style="flex:1;background:#1a1a2e;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:700;color:#fff;">${categoryLabel.split(" ")[0]}</div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px;">Category</div>
                </div>
              </div>

              <!-- CTA -->
              <a href="${kitUrl}" 
                style="display:block;background:#7c3aed;color:#fff;text-decoration:none;
                       text-align:center;padding:14px 24px;border-radius:10px;
                       font-weight:600;font-size:15px;">
                View your UI kit →
              </a>
            </div>

            <!-- Footer -->
            <div style="margin-top:24px;text-align:center;">
              <p style="font-size:12px;color:rgba(255,255,255,0.2);margin:0;">
                UXLora by Ard Studio · 
                <a href="${appUrl}" style="color:rgba(255,255,255,0.3);text-decoration:none;">uxlora.app</a>
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}