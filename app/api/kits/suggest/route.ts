import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateSuggestions } from "@/lib/anthropic/index";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      category?: string;
      checklist_data?: Record<string, unknown>;
    };

    const { category, checklist_data } = body;

    if (!category || !["game", "mobile", "web"].includes(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const questions = await generateSuggestions(
      category,
      checklist_data ?? {}
    );

    return NextResponse.json({ questions });

  } catch (error) {
    console.error("POST /api/kits/suggest error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions." },
      { status: 500 }
    );
  }
}