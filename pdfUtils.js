const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function appendSkuToPdf(pdfBuffer, mapping = {}, fileName = "UNKNOWN.pdf") {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const flipkartSku = fileName.split(".")[0].trim();
  const customSku = mapping[flipkartSku] || "default";

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // ✅ Step 1: Create new larger page
    const newHeight = height + 60;
    const newPage = pdfDoc.addPage([width, newHeight]);

    // ✅ Step 2: Copy old page content onto the new page (shifted upward)
    const copiedPage = await pdfDoc.copyPages(pdfDoc, [i]);
    const [oldPage] = copiedPage;
    newPage.drawPage(oldPage, {
      x: 0,
      y: 60,
    });

    // ✅ Step 3: Draw SKU at bottom (new space)
    newPage.drawText(`SKU: ${customSku}`, {
      x: 40,
      y: 25, // inside new margin space
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    // ✅ Replace old page with new one
    pages[i] = newPage;
  }

  // Remove original pages after duplication
  while (pdfDoc.getPageCount() > pages.length) {
    pdfDoc.removePage(0);
  }

  return await pdfDoc.save();
}

module.exports = { appendSkuToPdf };
