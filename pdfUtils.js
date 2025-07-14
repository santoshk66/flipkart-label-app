const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const flipkartSku = fileName.split(".")[0].trim();
  const customSku = mapping[flipkartSku] || "default";

  for (let page of pages) {
    const { width, height } = page.getSize();

    // Use different Y based on label height
    const isShippingLabel = height < 500;
    const yPos = isShippingLabel ? 350 : 85;

    page.drawText(`SKU: ${customSku}`, {
      x: 5,
      y: yPos,
      size: 14,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    console.log(`Appended SKU "${customSku}" at y=${yPos} (height=${height})`);
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
