const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const pdfParse = require("pdf-parse");
const { extractSkusFromText } = require("./skuUtils");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  // ✅ Use pdf-parse to extract all text from the PDF
  const parsedText = await pdfParse(pdfBuffer);
  const skuData = extractSkusFromText(parsedText.text, mapping);

  // Flatten to match each page with one SKU based on frequency
  const skuList = Object.entries(skuData).flatMap(([sku, data]) =>
    Array(data.qty).fill(sku)
  );

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    const flipkartSku = skuList[i] || "UNKNOWN";
    const customSku = mapping[flipkartSku] || "default";

    page.drawText(`SKU: ${customSku}`, {
      x: 195,  // Adjusted margin
      y: 460,  // Adjusted margin
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
