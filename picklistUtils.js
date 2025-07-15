const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const pdfParse = require("pdf-parse");

/**
 * Detects whether a page is an invoice or label based on its text content
 */
function isInvoicePage(text) {
  return /invoice number|gst|tax invoice/i.test(text);
}

/**
 * Crop box logic per page type
 */
function cropPage(page, type) {
  const { width, height } = page.getSize();

  if (type === "invoice") {
    page.setCropBox(0, 120, width, height - 120);
  } else if (type === "label") {
    page.setCropBox(0, 0, width, height - 20);
  }
}

/**
 * Splits the PDF into individual pages and annotates label pages with SKU
 */
async function separateAndCropUnified(pdfBuffer, mapping = {}) {
  const parsed = await pdfParse(pdfBuffer);
  const texts = parsed.text.split(/\f/);

  const originalPdf = await PDFDocument.load(pdfBuffer);
  const unifiedPdf = await PDFDocument.create();
  const font = await unifiedPdf.embedFont(StandardFonts.Helvetica);

  const skuLogic = require("./skuUtils");
  const skuData = skuLogic.extractSkusFromText(parsed.text, mapping);

  const skuList = Object.entries(skuData).flatMap(([sku, data]) =>
    Array(data.qty).fill(sku)
  );

  const originalPages = originalPdf.getPages();
  let labelIndex = 0;

  for (let i = 0; i < originalPages.length; i++) {
    const text = texts[i] || "";
    const type = isInvoicePage(text) ? "invoice" : "label";

    const [copiedPage] = await unifiedPdf.copyPages(originalPdf, [i]);
    cropPage(copiedPage, type);

    if (type === "label") {
      const sku = skuList[labelIndex] || "UNKNOWN";
      const custom = mapping[sku] || "default";
      copiedPage.drawText(`SKU: ${custom}`, {
        x: 195,
        y: 460,
        font,
        size: 11,
        color: rgb(0, 0, 0),
      });
      labelIndex++;
    }

    unifiedPdf.addPage(copiedPage);
  }

  return await unifiedPdf.save();
}

module.exports = {
  separateAndCropUnified,
};
