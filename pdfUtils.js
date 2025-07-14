const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const flipkartSku = fileName.split(".")[0].trim();
  const customSku = mapping[flipkartSku] || "default";

  for (const page of pages) {
    const { width, height } = page.getSize();

    // ✅ More left & bottom margin
    const x = 150;    // shifted right from left edge
    const y = 450;   // moved up from bottom

    page.drawText(`SKU: ${customSku}`, {
      x,
      y,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
