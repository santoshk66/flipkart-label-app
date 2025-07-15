const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const pdfParse = require("pdf-parse");
const { extractSkusFromText } = require("./skuUtils");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const originalPdf = await PDFDocument.load(pdfBuffer);
  const helvetica = await originalPdf.embedFont(StandardFonts.Helvetica);
  const originalPages = originalPdf.getPages();

  // Extract SKU data
  const parsedText = await pdfParse(pdfBuffer);
  const skuData = extractSkusFromText(parsedText.text, mapping);
  const skuList = Object.entries(skuData).flatMap(([sku, data]) =>
    Array(data.qty).fill(sku)
  );

  const outputPdf = await PDFDocument.create();

  for (let i = 0; i < originalPages.length; i++) {
    const page = originalPages[i];
    const { width, height } = page.getSize();

    const flipkartSku = skuList[i] || "UNKNOWN";
    const customSku = mapping[flipkartSku] || "default";

    // --- Label Page (Top Half) ---
    const [labelCopy] = await outputPdf.copyPages(originalPdf, [i]);
    const labelPage = outputPdf.addPage([width, height / 2]);
    labelPage.drawPage(labelCopy, {
      x: 0,
      y: -height / 2,
      width,
      height,
    });
    // ✅ Use original Y = 460 coordinate (adjusted for half-height page)
    labelPage.drawText(`SKU: ${customSku}`, {
      x: 195,
      y: 460 / 2,  // Scaled to match the cropped size
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    // --- Invoice Page (Bottom Half) ---
    const [invoiceCopy] = await outputPdf.copyPages(originalPdf, [i]);
    const invoicePage = outputPdf.addPage([width, height / 2]);
    invoicePage.drawPage(invoiceCopy, {
      x: 0,
      y: -height,
      width,
      height,
    });
    // 🟡 Optional: Draw SKU here too (or remove this block if not needed)
    invoicePage.drawText(`SKU: ${customSku}`, {
      x: 195,
      y: 215, // Adjusted midpoint of bottom half
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }

  return await outputPdf.save();
}

module.exports = { appendSkuToPdf };
