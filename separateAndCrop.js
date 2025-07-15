const fs = require("fs").promises;
const { PDFDocument } = require("pdf-lib");
const pdfParse = require("pdf-parse");

/**
 * Detect if it's an invoice page based on text content
 */
function isInvoicePage(text) {
  return /tax invoice|invoice number|gst/i.test(text);
}

/**
 * Crop based on type
 */
function cropPage(page, type) {
  const { width, height } = page.getSize();
  if (type === "invoice") {
    page.setCropBox(0, 120, width, height - 120); // remove top
  } else {
    page.setCropBox(0, 0, width, height - 20); // optional bottom trim
  }
}

/**
 * Create a single output PDF with cropped invoice and label pages
 */
async function separateAndCrop(inputPath, outputPath) {
  const inputBuffer = await fs.readFile(inputPath);
  const originalDoc = await PDFDocument.load(inputBuffer);
  const parsedText = await pdfParse(inputBuffer);

  const newDoc = await PDFDocument.create();
  const originalPages = originalDoc.getPages();
  const texts = parsedText.text.split(/\f/); // form feed = page break

  for (let i = 0; i < originalPages.length; i++) {
    const page = originalPages[i];
    const text = texts[i] || "";

    const type = isInvoicePage(text) ? "invoice" : "label";

    const [copiedPage] = await newDoc.copyPages(originalDoc, [i]);
    cropPage(copiedPage, type);
    newDoc.addPage(copiedPage);
  }

  const finalPdf = await newDoc.save();
  await fs.writeFile(outputPath, finalPdf);
  console.log("✅ Combined PDF with cropped pages created.");
}

module.exports = { separateAndCrop };
