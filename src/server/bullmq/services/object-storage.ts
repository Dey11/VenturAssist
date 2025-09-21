import { getSignedUrlForViewing } from "@/lib/object-storage";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import pptx2json from "pptx2json";

// Get presigned URL for viewing a file
// This is a wrapper around the existing object storage service
export async function getPresignedFileUrl(sourceUrl: string): Promise<string> {
  try {
    return await getSignedUrlForViewing(sourceUrl);
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    throw new Error(`Failed to get presigned URL for file: ${sourceUrl}`);
  }
}

// Get file type from URL or filename
function getFileType(url: string): string {
  const extension = url.split(".").pop()?.toLowerCase();
  return extension || "txt";
}

// Download file content from presigned URL and extract text based on file type
export async function downloadFileContent(
  presignedUrl: string,
  fileName?: string,
): Promise<string> {
  try {
    const response = await fetch(presignedUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`,
      );
    }

    const fileType = getFileType(fileName || presignedUrl);
    console.log(
      `Processing file: ${fileName || "unknown"} (type: ${fileType})`,
    );

    let extractedText: string;

    switch (fileType) {
      case "pdf":
        extractedText = await extractPdfContent(response);
        break;
      case "docx":
      case "doc":
        extractedText = await extractDocxContent(response);
        break;
      case "pptx":
      case "ppt":
        extractedText = await extractPptxContent(response);
        break;
      case "txt":
      case "md":
      default:
        extractedText = await response.text();
        break;
    }

    console.log(
      `Extracted ${extractedText.length} characters from ${fileType} file`,
    );
    return extractedText;
  } catch (error) {
    console.error("Error downloading file content:", error);
    throw new Error(
      `Failed to download file content from URL: ${presignedUrl}`,
    );
  }
}

// Extract text content from PDF
async function extractPdfContent(response: Response): Promise<string> {
  try {
    const buffer = await response.arrayBuffer();
    const data = await pdf(Buffer.from(buffer));
    return data.text;
  } catch (error) {
    console.error("Error extracting PDF content:", error);
    throw new Error("Failed to extract text from PDF file");
  }
}

// Extract text content from DOCX/DOC files
async function extractDocxContent(response: Response): Promise<string> {
  try {
    const buffer = await response.arrayBuffer();
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    return result.value;
  } catch (error) {
    console.error("Error extracting DOCX content:", error);
    throw new Error("Failed to extract text from DOCX file");
  }
}

// Extract text content from PPTX/PPT files
async function extractPptxContent(response: Response): Promise<string> {
  try {
    const buffer = await response.arrayBuffer();

    // Try using pptx2json for better PPTX parsing
    try {
      const pptxData = await pptx2json(Buffer.from(buffer));
      const textContent: string[] = [];

      // Extract text from slides
      if (pptxData.slides && Array.isArray(pptxData.slides)) {
        pptxData.slides.forEach((slide: any, index: number) => {
          if (slide.text && Array.isArray(slide.text)) {
            slide.text.forEach((textItem: any) => {
              if (textItem.text) {
                textContent.push(`Slide ${index + 1}: ${textItem.text}`);
              }
            });
          }
        });
      }

      if (textContent.length > 0) {
        return textContent.join("\n\n");
      }
    } catch (pptxError) {
      console.log("pptx2json failed, trying mammoth as fallback:", pptxError);
    }

    // Fallback to mammoth
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    return (
      result.value ||
      "PowerPoint file detected but text extraction failed. Please provide a text summary of the presentation content."
    );
  } catch (error) {
    console.error("Error extracting PPTX content:", error);
    // Final fallback: return a message indicating the file type
    return "PowerPoint file detected but text extraction failed. Please provide a text summary of the presentation content.";
  }
}

// Get file content from a data source
// Handles different data source types appropriately
export async function getDataSourceContent(
  type: "FILE_UPLOAD" | "TEXT_INPUT" | "URL",
  sourceUrl?: string | null,
  content?: string | null,
  fileName?: string | null,
): Promise<string> {
  switch (type) {
    case "TEXT_INPUT":
      if (!content) {
        throw new Error("No content provided for TEXT_INPUT data source");
      }
      return content;

    case "FILE_UPLOAD":
      if (!sourceUrl) {
        throw new Error("No source URL provided for FILE_UPLOAD data source");
      }
      const presignedUrl = await getPresignedFileUrl(sourceUrl);
      return await downloadFileContent(presignedUrl, fileName || undefined);

    case "URL":
      // TODO
      throw new Error("URL data source type not yet implemented");

    default:
      throw new Error(`Unsupported data source type: ${type}`);
  }
}
