import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

// Max PDF size we'll attempt to watermark. Larger files are passed through
// untouched to avoid OOM-ing the server (pdf-lib loads the full doc into
// memory). 30 MB is generous for most ebooks/guides.
const MAX_BYTES = 30 * 1024 * 1024;

export interface WatermarkParams {
  buyerEmail: string;
  orderId: string;
  storeName?: string;
}

/**
 * Stamps each page with a footer line: "Licensed to <email> · Order <id>"
 * plus a faint diagonal "PERSONAL COPY" watermark in the middle so the
 * file is visibly tied to the buyer if they share it.
 *
 * Returns the watermarked PDF bytes, or the original bytes unchanged if:
 *   - the file is too large
 *   - pdf-lib fails to parse it (corrupt / non-standard PDF / encrypted)
 *
 * Errors do not propagate — the buyer always gets *some* file. Worst case
 * is the unstamped original, which is no worse than not having the feature.
 */
export async function watermarkPdf(
  bytes: Uint8Array | ArrayBuffer | Buffer,
  params: WatermarkParams,
): Promise<Uint8Array> {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);

  if (input.byteLength > MAX_BYTES) {
    console.warn(`[pdf-watermark] skipped — file is ${input.byteLength} bytes (>${MAX_BYTES})`);
    return input;
  }

  try {
    const doc = await PDFDocument.load(input, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const footer = `Licensed to ${params.buyerEmail} · Order ${params.orderId.slice(0, 8)}`;
    const watermarkText = "PERSONAL COPY";

    const pages = doc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();

      // Diagonal faint center watermark
      page.drawText(watermarkText, {
        x: width / 2 - 140,
        y: height / 2,
        size: 48,
        font: boldFont,
        color: rgb(0.85, 0.85, 0.85),
        opacity: 0.18,
        rotate: degrees(-30),
      });

      // Footer: subtle dark gray, 8pt, centered horizontally near bottom
      const footerWidth = font.widthOfTextAtSize(footer, 8);
      page.drawText(footer, {
        x: (width - footerWidth) / 2,
        y: 16,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
        opacity: 0.7,
      });
    }

    return await doc.save();
  } catch (err: any) {
    console.error("[pdf-watermark] failed:", err?.message || err);
    // Fail open — return original bytes so the buyer still gets their file.
    return input;
  }
}

export function isPdfFilename(name: string): boolean {
  return /\.pdf(\?|$)/i.test(name);
}

export function isPdfContentType(ct: string | undefined | null): boolean {
  if (!ct) return false;
  return /application\/pdf/i.test(ct);
}
