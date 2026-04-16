/** @type {import('next').NextConfig} */
  const nextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "mammoth",
  ],

  turbopack: {
    root: __dirname,
  },

  async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://*.supabase.co https://fonts.gstatic.com https://game-icons.net",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.lemonsqueezy.com https://api.resend.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com https://game-icons.net data: blob:",
            "frame-src 'self' https://uxlora.app https://www.uxlora.app",
            "frame-ancestors 'self' https://uxlora.app https://www.uxlora.app",
            "object-src 'none'",
            "base-uri 'self'",
          ].join("; "),
        },
      ],
    },
  ];
  },
};

module.exports = nextConfig;