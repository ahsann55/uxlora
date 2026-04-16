import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const author = searchParams.get("author");
  const name = searchParams.get("name");
  const color = searchParams.get("color") ?? "ffffff";

  if (!author || !name) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const url = `https://game-icons.net/icons/${color}/transparent/1x1/${author}/${name}.svg`;

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Icon not found" }, { status: 404 });

    const svg = await res.text();
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch icon" }, { status: 500 });
  }
}