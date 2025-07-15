const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const { parseMappingCSV } = require("./skuUtils");
const { appendSkuToPdf } = require("./pdfUtils");
const { extractSkusFromText, generatePicklistCSV } = require("./picklistUtils");
const { separateAndCrop } = require("./separateAndCrop");
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
    console.log("🔍 PDF Text Preview:\n", parsed.text.slice(0, 1000));
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

app.post("/crop-combined", upload.single("labelPdf"), async (req, res) => {
  try {
    const pdfFile = req.file;
    if (!pdfFile) return res.status(400).send("PDF file missing");

    const inputPath = pdfFile.path;
    const combinedPath = path.join("processed", `combined-cropped-${Date.now()}.pdf`);

    await separateAndCrop(inputPath, combinedPath);

    res.download(combinedPath, "cropped-combined.pdf", () => {
      fs.unlink(inputPath).catch(() => {});
      fs.unlink(combinedPath).catch(() => {});
    });
  } catch (err) {
    console.error("Cropping Error:", err);
    res.status(500).send("Failed to crop pages");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
