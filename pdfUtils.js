const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  // Extract Flipkart SKU from filename (e.g., ABC123.pdf => ABC123)
  const flipkartSku = fileName.split(".")[0].trim();
  const customSku = mapping[flipkartSku] || "default"; // fallback to 'default'

  console.log("Flipkart SKU:", flipkartSku);
  console.log("Custom SKU to draw:", customSku);

  for (let page of pages) {
    page.drawText(`SKU: ${customSku}`, {
      x: 50,
      y: 100,
      size: 16,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    console.log(`Custom SKU appended to page`);
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
