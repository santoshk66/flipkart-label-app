const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const flipkartSku = fileName.split(".")[0].trim();
  const customSku = mapping[flipkartSku] || "default";

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Place SKU just above the "Not for resale" line
    page.drawText(`SKU: ${customSku}`, {
      x: 10,              // left side alignment
      y: 360,             // near bottom of the label
      size: 12,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
