const fs = require("fs").promises;
const { PDFDocument } = require("pdf-lib");
const pdfParse = require("pdf-parse");

function isInvoicePage(text) {
  return /tax invoice|invoice number|gst/i.test(text);
}

function cropPage(page, type) {
  const { width, height } = page.getSize();
  if (type === "invoice") {
    page.setCropBox(0, 120, width, height - 120); // Crop top for invoice
  } else {
    page.setCropBox(0, 0, width, height - 20); // Optional bottom crop for label
  }
}

async function separateAndCrop(inputPath, outputPath) {
  const inputBuffer = await fs.readFile(inputPath);
  const originalDoc = await PDFDocument.load(inputBuffer);
  const parsedText = await pdfParse(inputBuffer);

  const newDoc = await PDFDocument.create();
  const pages = originalDoc.getPages();
  const texts = parsedText.text.split(/\f/); // One text block per page

  for (let i = 0; i < pages.length; i++) {
    const text = texts[i] || "";
    const pageType = isInvoicePage(text) ? "invoice" : "label";

    const [copiedPage] = await newDoc.copyPages(originalDoc, [i]);
    cropPage(copiedPage, pageType);
    newDoc.addPage(copiedPage);
  }

  const finalPdf = await newDoc.save();
  await fs.writeFile(outputPath, finalPdf);
  console.log("✅ Cropped pages combined into one file.");
}

module.exports = { separateAndCrop };
