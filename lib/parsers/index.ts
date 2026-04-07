import { isAllowedDocumentType } from "@/lib/utils";

/**
 * Extract plain text from a PDF or DOCX buffer.
 * Routes to the correct parser based on MIME type.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!isAllowedDocumentType(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  if (mimeType === "application/pdf") {
    return extractFromPDF(buffer);
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractFromDOCX(buffer);
  }

  throw new Error(`No parser available for: ${mimeType}`);
}

/**
 * Extract text from a PDF buffer using pdf-parse.
 */
async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import — pdf-parse is a server-only module
    const pdfParse = await import("pdf-parse");
    const parse = pdfParse.default ?? pdfParse;
    const result = await parse(buffer);
    return result.text ?? "";
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF.");
  }
}

/**
 * Extract text from a DOCX buffer using mammoth.
 */
async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error("Failed to extract text from DOCX.");
  }
}