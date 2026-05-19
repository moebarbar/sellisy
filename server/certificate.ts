import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";

export interface CertificateParams {
  buyerName: string;
  courseTitle: string;
  storeName: string;
  issuedAtIso: string;       // ISO string — formatted server-side for consistency
  verificationCode: string;  // shown bottom-right + later lookupable at /verify/cert/:code
}

/**
 * Generates a clean A4-landscape certificate PDF. No external assets needed —
 * uses pdf-lib's standard Helvetica family. Designed to look respectable
 * printed on paper but also fine as a screen download.
 */
export async function generateCertificatePdf(params: CertificateParams): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PageSizes.A4[1], PageSizes.A4[0]]); // landscape

  const { width, height } = page.getSize();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Outer border
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: rgb(0.15, 0.15, 0.2),
    borderWidth: 2,
  });
  // Inner thin accent border
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.55, 0.55, 0.65),
    borderWidth: 0.5,
  });

  const drawCentered = (text: string, y: number, font: any, size: number, color = rgb(0.1, 0.1, 0.15)) => {
    const tw = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - tw) / 2, y, size, font, color });
  };

  // "CERTIFICATE OF COMPLETION"
  drawCentered("CERTIFICATE OF COMPLETION", height - 110, helvBold, 24, rgb(0.2, 0.2, 0.3));

  // Subtle "presented to" line
  drawCentered("This is to certify that", height - 170, helvOblique, 14, rgb(0.4, 0.4, 0.5));

  // Buyer name — large, prominent
  drawCentered(params.buyerName, height - 230, helvBold, 36, rgb(0.05, 0.05, 0.1));

  // Underline under name
  const nameWidth = helvBold.widthOfTextAtSize(params.buyerName, 36);
  page.drawLine({
    start: { x: (width - Math.max(nameWidth, 200)) / 2, y: height - 245 },
    end: { x: (width + Math.max(nameWidth, 200)) / 2, y: height - 245 },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.6),
  });

  // "has successfully completed the course"
  drawCentered("has successfully completed the course", height - 285, helv, 14, rgb(0.3, 0.3, 0.4));

  // Course title — large italic
  drawCentered(`"${params.courseTitle}"`, height - 340, helvOblique, 24, rgb(0.1, 0.1, 0.2));

  // Date row
  const issuedDate = new Date(params.issuedAtIso).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
  drawCentered(`Issued ${issuedDate}`, height - 400, helv, 12, rgb(0.4, 0.4, 0.5));

  // Footer left: store name
  page.drawText(`Awarded by ${params.storeName}`, {
    x: 56,
    y: 56,
    size: 10,
    font: helv,
    color: rgb(0.4, 0.4, 0.5),
  });

  // Footer right: verification code
  const code = `Verification: ${params.verificationCode}`;
  const codeWidth = helv.widthOfTextAtSize(code, 10);
  page.drawText(code, {
    x: width - 56 - codeWidth,
    y: 56,
    size: 10,
    font: helv,
    color: rgb(0.4, 0.4, 0.5),
  });

  return await doc.save();
}

export function generateVerificationCode(): string {
  // 12 alphanumeric chars, no ambiguous I/O/1/0 to keep it readable
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (i === 3 || i === 7) out += "-";
  }
  return out; // e.g. "ABCD-EFGH-JKLM"
}
