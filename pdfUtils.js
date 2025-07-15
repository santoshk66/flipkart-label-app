const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const pdfParse = require("pdf-parse");
const { extractSkusFromText } = require("./skuUtils");

/**
 * Detects whether a page is an invoice or label based on text
 */
function isInvoicePage(text) {
  return /invoice\s*number|gst|tax invoice/i.test(text);
}

/**
 * Crop logic for invoices/labels
 */
function cropPage(page, type) {
  const { width, height } = page.getSize();
  if (type === "invoice") {
    page.setCropBox(0, 100, width, height - 100); // Remove top 100pt
  } else {
    page.setCropBox(0, 0, width, height - 20); // Crop slightly from bottom
  }
}

/**
 * Appends SKUs and crops invoice/label pages.
 */
async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const originalPdf = await PDFDocument.load(pdfBuffer);
  const helvetica = await originalPdf.embedFont(StandardFonts.Helvetica);
  const pages = originalPdf.getPages();
  const parsed = await pdfParse(pdfBuffer);
  const texts = parsed.text.split(/\f/); // Split by page

  const skuData = extractSkusFromText(parsed.text, mapping);
  const skuList = Object.entries(skuData).flatMap(([sku, data]) =>
    Array(data.qty).fill(sku)
  );

  for (let i = 0; i < pages.length; i++) {
    const text = texts[i] || "";
    const isInvoice = isInvoicePage(text);
    const page = pages[i];
    cropPage(page, isInvoice ? "invoice" : "label");

    // Only label pages get SKU stamped
    if (!isInvoice) {
      const flipkartSku = skuList[i] || "UNKNOWN";
      const customSku = mapping[flipkartSku] || flipkartSku;
      page.drawText(`SKU: ${customSku}`, {
        x: 195,
        y: 460,
        size: 11,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
    }
  }

  return await originalPdf.save();
}

module.exports = {
  appendSkuToPdf
};
