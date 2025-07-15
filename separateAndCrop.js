const fs = require("fs").promises;
const { PDFDocument } = require("pdf-lib");
const pdfParse = require("pdf-parse");

/**
 * Detects whether a page is an invoice or label based on its text content
 */
function isInvoicePage(text) {
  return /tax invoice|invoice number|gst/i.test(text);
}

/**
 * Applies cropping to invoice or label page
 */
function cropPage(page, type) {
  const { width, height } = page.getSize();

  if (type === "invoice") {
    page.setCropBox(0, 120, width, height - 120); // Crop 120pt top
  } else if (type === "label") {
    page.setCropBox(0, 0, width, height - 20); // Optional crop for label
  }
}

/**
 * Splits and crops a mixed Flipkart label PDF into invoices and shipping labels
 */
async function separateAndCrop(inputPath, outInvoicePath, outLabelPath) {
  const originalPdf = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(originalPdf);
  const parsed = await pdfParse(originalPdf);

  const invoicePdf = await PDFDocument.create();
  const labelPdf = await PDFDocument.create();

  const pages = pdfDoc.getPages();
  const texts = parsed.text.split(/\f/); // Split by formfeed = page separator

  for (let i = 0; i < pages.length; i++) {
    const text = texts[i] || "";
    const isInvoice = isInvoicePage(text);
    const page = pages[i];

    const [copiedPage] = await (isInvoice ? invoicePdf : labelPdf).copyPages(pdfDoc, [i]);
    cropPage(copiedPage, isInvoice ? "invoice" : "label");

    (isInvoice ? invoicePdf : labelPdf).addPage(copiedPage);
  }

  await fs.writeFile(outInvoicePath, await invoicePdf.save());
  await fs.writeFile(outLabelPath, await labelPdf.save());

  console.log("✅ Cropping complete.");
}

(async () => {
  await separateAndCrop(
    "./uploads/Flipkart-Labels-14-Jul-2025-10-55.pdf",
    "./processed/cropped-invoices.pdf",
    "./processed/cropped-labels.pdf"
  );
})();
