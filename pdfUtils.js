const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const pdfParse = require("pdf-parse");
const { extractSkusFromText } = require("./skuUtils");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const originalPdf = await PDFDocument.load(pdfBuffer);
  const helvetica = await originalPdf.embedFont(StandardFonts.Helvetica);
  const originalPages = originalPdf.getPages();

  const parsedText = await pdfParse(pdfBuffer);
  const skuData = extractSkusFromText(parsedText.text, mapping);
  const skuList = Object.entries(skuData).flatMap(([sku, data]) =>
    Array(data.qty).fill(sku)
  );

  const outputPdf = await PDFDocument.create();

  for (let i = 0; i < originalPages.length; i++) {
    const page = originalPages[i];
    const { width, height } = page.getSize();

    const flipkartSku = skuList[i] || "UNKNOWN";
    const customSku = mapping[flipkartSku] || flipkartSku;

    const embeddedPage = await outputPdf.embedPage(page);

    // ------ LABEL PAGE ------
    const labelPage = outputPdf.addPage([width, height]);
    labelPage.drawPage(embeddedPage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    // Mask the bottom half (invoice)
    labelPage.drawRectangle({
      x: 0,
      y: 0,
      width,
      height / 2,
      color: rgb(1, 1, 1), // white mask
    });

    // Draw SKU near bottom-right (adjust as per your layout)
    labelPage.drawText(`SKU: ${customSku}`, {
      x: width - 150,
      y: 45,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    // ------ INVOICE PAGE ------
    const invoicePage = outputPdf.addPage([width, height]);
    invoicePage.drawPage(embeddedPage, {
      x: 0,
      y: -height / 2, // shift the page down so only bottom half is visible
      width,
      height,
    });

    // Mask the top half (label)
    invoicePage.drawRectangle({
      x: 0,
      y: height / 2,
      width,
      height / 2,
      color: rgb(1, 1, 1), // white mask
    });
  }

  return await outputPdf.save();
}

module.exports = { appendSkuToPdf };
