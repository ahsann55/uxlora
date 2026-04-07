// Email template utilities and additional templates

export function getKitCategoryLabel(category: string): string {
  switch (category) {
    case "game": return "Game UI";
    case "mobile": return "Mobile App UI";
    case "web": return "Web/SaaS UI";
    default: return "UI Kit";
  }
}

export function getKitCategoryEmoji(category: string): string {
  switch (category) {
    case "game": return "🎮";
    case "mobile": return "📱";
    case "web": return "🌐";
    default: return "✨";
  }
}

// Welcome email for new signups
export interface WelcomeEmailData {
  to: string;
  displayName: string | null;
}

export function buildWelcomeEmailHtml(data: WelcomeEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://uxlora.app";
  const name = data.displayName ?? "there";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
        
        <div style="margin-bottom:32px;">
          <span style="font-size:24px;font-weight:800;color:#fff;">
            UX<span style="color:#7c3aed;">Lora</span>
          </span>
        </div>

        <div style="background:#13131f;border:1px solid #2a2a3d;border-radius:16px;padding:32px;">
          
          <div style="font-size:40px;margin-bottom:16px;">👋</div>
          
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">
            Welcome to UXLora, ${name}!
          </h1>
          
          <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">
            You're in. Start generating production-ready UI kits for your games, 
            mobile apps, and web products in minutes.
          </p>

          <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">
            Your free account includes <strong style="color:#fff;">1 demo kit</strong> — 
            enough to see exactly what UXLora can do.
          </p>

          <a href="${appUrl}/dashboard" 
            style="display:block;background:#7c3aed;color:#fff;text-decoration:none;
                   text-align:center;padding:14px 24px;border-radius:10px;
                   font-weight:600;font-size:15px;">
            Generate your first UI kit →
          </a>
        </div>

        <div style="margin-top:24px;text-align:center;">
          <p style="font-size:12px;color:rgba(255,255,255,0.2);margin:0;">
            UXLora by Ard Studio · 
            <a href="${appUrl}" style="color:rgba(255,255,255,0.3);text-decoration:none;">uxlora.app</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}