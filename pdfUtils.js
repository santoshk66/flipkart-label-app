const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  const flipkartSku = fileName.split(".")[0]; // filename without .pdf
  const customSku = mapping[flipkartSku] || flipkartSku;

  for (let page of pages) {
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
