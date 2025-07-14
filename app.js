const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const { parseMappingCSV } = require("./skuUtils");
const { appendSkuToPdf } = require("./pdfUtils");
const { extractSkusFromText, generatePicklistCSV } = require("./picklistUtils");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = process.env.PORT || 3000;

["uploads", "processed"].forEach(dir => {
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
});

app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

app.post("/process", upload.fields([
  { name: "labelPdf", maxCount: 1 },
  { name: "skuMapping", maxCount: 1 },
]), async (req, res) => {
  try {
    const pdfFile = req.files["labelPdf"]?.[0];
    const mappingFile = req.files["skuMapping"]?.[0];

    if (!pdfFile) return res.status(400).send("PDF file missing");

    let mapping = {};
    if (mappingFile) {
      mapping = await parseMappingCSV(mappingFile.path);
    }

    const pdfBuffer = await fs.readFile(pdfFile.path);
    const modifiedPdf = await appendSkuToPdf(pdfBuffer, mapping, pdfFile.originalname);

    const outputPath = path.join("processed", `output-${Date.now()}.pdf`);
    await fs.writeFile(outputPath, modifiedPdf);

    res.download(outputPath, "updated-label.pdf", () => {
      fs.unlink(pdfFile.path).catch(() => {});
      if (mappingFile) fs.unlink(mappingFile.path).catch(() => {});
      fs.unlink(outputPath).catch(() => {});
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Failed to process the PDF");
  }
});

app.post("/generate-picklist", upload.fields([
  { name: "labelPdf", maxCount: 1 },
  { name: "skuMapping", maxCount: 1 },
]), async (req, res) => {
  try {
    const pdfFile = req.files["labelPdf"]?.[0];
    const mappingFile = req.files["skuMapping"]?.[0];

    if (!pdfFile) return res.status(400).send("Label PDF missing");

    const pdfBuffer = await fs.readFile(pdfFile.path);
    let mapping = {};
    if (mappingFile) {
      mapping = await parseMappingCSV(mappingFile.path);
    }

    const parsed = await pdfParse(pdfBuffer);
    const skuData = extractSkusFromText(parsed.text, mapping);
    const csvContent = generatePicklistCSV(skuData);

    fs.unlink(pdfFile.path).catch(() => {});
    if (mappingFile) fs.unlink(mappingFile.path).catch(() => {});

    res.setHeader("Content-Disposition", `attachment; filename=picklist.csv`);
    res.setHeader("Content-Type", "text/csv");
    res.send(csvContent);
  } catch (err) {
    console.error("Picklist Error:", err);
    res.status(500).send("Failed to generate picklist");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
