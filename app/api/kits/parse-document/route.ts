import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractText } from "@/lib/parsers";
import { isAllowedDocumentType } from "@/lib/utils";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check email verification — SEC-06
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please verify your email before uploading documents." },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!category || !["game", "mobile", "web"].includes(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate MIME type — SEC-04
    if (!isAllowedDocumentType(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    // Extract text from document
    const buffer = Buffer.from(await file.arrayBuffer());
    const documentText = await extractText(buffer, file.type);

    if (!documentText || documentText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from the document. Please try a different file." },
        { status: 422 }
      );
    }

    // Use Claude to parse the document into checklist data
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

const { getPromptTemplate, resolvTemplate } = await import("@/lib/anthropic/index");
    const template = await getPromptTemplate("parser", category);

    const variables = {
      category,
      document_text: documentText.slice(0, 8000),
    };


    const systemPrompt = template
      ? resolvTemplate(template.system_prompt, variables)
      : `You are an expert at extracting structured information from design documents.
Extract UI kit information from the provided document.
Return ONLY a valid JSON object with no explanation or markdown.
Only extract information that is explicitly stated in the document.
Do not invent or assume details not present in the document.`;

    const userPrompt = template
      ? resolvTemplate(template.user_template, variables)
      : `Extract UI kit information from this ${category} design document.

Document content:
${documentText.slice(0, 8000)}

Return a JSON object with these fields (set to null if not found):
{
  "product_name": "string or null",
  "product_description": "string or null",
  "target_audience": "string or null",
  "visual_style": "string or null",
  "color_preferences": "string or null",
  "typography_preferences": "string or null",
  "key_screens": ["array of screen names or empty array"],
  "special_requirements": "string or null",
  "platform": "string or null",
  "genre_or_category": "string or null"
}`;


    const model = template?.model ?? "claude-sonnet-4-6";
    const maxTokens = template?.max_tokens ?? 1024;

    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Parse JSON response and extract GDD summary
    let checklistData: Record<string, unknown> = {};
    let gddSummary = "";

    try {
      // Extract GDD_SUMMARY before parsing JSON
      const gddMatch = responseText.match(/GDD_SUMMARY:([\s\S]+)$/m);
      if (gddMatch) {
        gddSummary = gddMatch[1].trim();
      }

      // Clean and parse JSON — remove GDD_SUMMARY line before parsing
      const jsonText = responseText.replace(/GDD_SUMMARY:[\s\S]+$/m, "").trim();
      const cleaned = jsonText.replace(/```json|```/g, "").trim();
      checklistData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Parse error:", parseError);
      console.error("Raw response:", responseText.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse document information. Please try again." },
        { status: 422 }
      );
    }

    // Log parser call to generation_logs
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const adminSupabase = await createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminSupabase as any).from("generation_logs").insert({
        step: "parser",
        model_used: model,
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        duration_ms: 0,
        status: "success",
        error_message: null,
        prompt_template_id: template?.id ?? null,
      });
    } catch (logError) {
      console.error("Failed to log parser call:", logError);
    }

    return NextResponse.json({
      success: true,
      checklist_data: checklistData,
      gdd_summary: gddSummary,
      document_length: documentText.length,
    });

  } catch (error) {
    console.error("parse-document error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}