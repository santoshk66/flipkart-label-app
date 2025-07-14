const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  for (let page of pages) {
    const text = await page.getTextContent();
    const skuMatch = text.items.find((item) =>
      /SKU\s*:\s*([A-Z0-9\-]+)/i.test(item.str)
    );

    let flipkartSku = skuMatch ? skuMatch.str.split(":")[1].trim() : "UNKNOWN";
    let customSku = mapping[flipkartSku] || flipkartSku;

    page.drawText(`Custom SKU: ${customSku}`, {
      x: 50,
      y: 30,
      size: 12,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
