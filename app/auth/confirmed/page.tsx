"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmailConfirmedPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{
        textAlign: "center",
        padding: "48px",
        backgroundColor: "#13131a",
        border: "1px solid #1f1f2e",
        borderRadius: "16px",
        maxWidth: "420px",
        width: "100%"
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          backgroundColor: "#1a1a2e",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px auto",
          fontSize: "28px"
        }}>✓</div>
        <h1 style={{
          margin: "0 0 12px 0",
          fontSize: "22px",
          fontWeight: 600,
          color: "#ffffff"
        }}>Email confirmed</h1>
        <p style={{
          margin: "0 0 8px 0",
          fontSize: "15px",
          color: "#b8b8c5",
          lineHeight: 1.6
        }}>Your UXLora account is ready.</p>
        <p style={{
          margin: "0",
          fontSize: "13px",
          color: "#7a7a85"
        }}>Taking you to your dashboard…</p>
      </div>
    </div>
  );
}