const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Place at bottom-center with clear size
    page.drawText("SKU: default", {
      x: width / 2 - 60,
      y: 40, // moved up for visibility
      size: 18,
      font: helvetica,
      color: rgb(1, 0, 0),
    });
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
