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
    const page = originalPages[i];
    const { width, height } = page.getSize();
    const flipkartSku = skuList[i] || "UNKNOWN";
    const customSku = mapping[flipkartSku] || flipkartSku;

    const embeddedPage = await outputPdf.embedPage(page);

    // ----- LABEL PAGE -----
    const labelPage = outputPdf.addPage([width, height]);
    labelPage.drawPage(embeddedPage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    // ✅ Add SKU near "Not for Sale" area (bottom right-ish of label)
    labelPage.drawText(`SKU: ${customSku}`, {
      x: 400,       // Adjust if you want left side
      y: 50,        // Bottom area
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    // ----- INVOICE PAGE -----
    const invoicePage = outputPdf.addPage([width, height]);
    invoicePage.drawPage(embeddedPage, {
      x: 0,
      y: -height,   // Shift full page down so bottom half shows
      width,
      height,
    });
    // ❌ No SKU drawn on invoice as per your instruction
  }

  return await outputPdf.save();
}

module.exports = { appendSkuToPdf };
