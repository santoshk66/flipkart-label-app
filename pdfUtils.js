const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const pdfParse = require("pdf-parse");
const { extractSkusFromText } = require("./skuUtils");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const originalPdf = await PDFDocument.load(pdfBuffer);
  const helvetica = await originalPdf.embedFont(StandardFonts.Helvetica);
  const originalPages = originalPdf.getPages();

  const parsedText = await pdfParse(pdfBuffer);
  const skuData = extractSkusFromText(parsedText.text, mapping);
  const skuList = Object.entries(skuData).flatMap(([sku, data]) =>
    Array(data.qty).fill(sku)
  );

  const outputPdf = await PDFDocument.create();

  for (let i = 0; i < originalPages.length; i++) {
    const origPage = originalPages[i];
    const { width, height } = origPage.getSize();
    const flipkartSku = skuList[i] || "UNKNOWN";
    const customSku = mapping[flipkartSku] || "default";

    // Embed page once, reuse for both crops
    const embeddedPage = await outputPdf.embedPage(origPage);

    // --- Label Page (Top Half) ---
    const labelPage = outputPdf.addPage([width, height / 2]);
    labelPage.drawPage(embeddedPage, {
      x: 0,
      y: -height / 2,
      width,
      height,
    });
    labelPage.drawText(`SKU: ${customSku}`, {
      x: 195,
      y: 460 / 2, // Adjusted for half-page height
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    // --- Invoice Page (Bottom Half) ---
    const invoicePage = outputPdf.addPage([width, height / 2]);
    invoicePage.drawPage(embeddedPage, {
      x: 0,
      y: -height,
      width,
      height,
    });
    invoicePage.drawText(`SKU: ${customSku}`, {
      x: 195,
      y: 215,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }

  return await outputPdf.save();
}

module.exports = { appendSkuToPdf };
