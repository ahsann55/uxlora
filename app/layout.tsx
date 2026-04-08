import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UXLora — AI UI Kit Generator",
    template: "%s | UXLora",
  },
  description:
    "Generate production-ready UI kits from a text description. Every screen, consistent design system, exportable in 3 formats.",
  keywords: [
    "UI kit generator",
    "AI design",
    "game UI",
    "mobile UI",
    "SaaS UI",
    "Figma export",
    "Unity UXML",
  ],
  authors: [{ name: "Ard Studio" }],
  creator: "Ard Studio",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://uxlora.app"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://uxlora.app",
    title: "UXLora — AI UI Kit Generator",
    description:
      "Generate production-ready UI kits from a text description. Every screen, consistent design system, exportable in 3 formats.",
    siteName: "UXLora",
  },
  twitter: {
    card: "summary_large_image",
    title: "UXLora — AI UI Kit Generator",
    description:
      "Generate production-ready UI kits from a text description.",
    creator: "@uxlora",
  },
  robots: {
      index: true,
      follow: true,
    },
  };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/favicon-512.png" />
      </head>
      <body
       className={`${plusJakartaSans.className} bg-surface text-white antialiased min-h-screen`}
       suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}