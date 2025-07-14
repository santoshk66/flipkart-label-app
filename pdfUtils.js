const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const flipkartSku = fileName.split(".")[0].trim();
  const customSku = mapping[flipkartSku] || "default";

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Final safe coordinates: above barcode/footer
    const x = 20;
    const y = 330;

    page.drawText(`SKU: ${customSku}`, {
      x,
      y,
      size: 11,
      font: helvetica,
      color: rgb(0.05, 0.05, 0.05),
    });
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
