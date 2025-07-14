const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  // Determine custom SKU or fallback
  const flipkartSku = fileName.split(".")[0].trim(); // fallback strategy
  const customSku = mapping[flipkartSku] || "default";

  for (let page of pages) {
    const { width } = page.getSize();

    // Bottom left: Above barcode (approx Y=85), left aligned
    page.drawText(`SKU: ${customSku}`, {
      x: 50,
      y: 85,
      size: 14,
      font: helvetica,
      color: rgb(0.8, 0, 0), // red text for visibility
    });
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
