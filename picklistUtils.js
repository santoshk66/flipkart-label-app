const pdf = require("pdf-parse");
const { parse } = require("csv-parse/sync");

function extractSkusFromText(text, mapping = {}) {
  const lines = text.split("\n");
  const skuData = {};

  for (const line of lines) {
    // Split by pipe and ensure there are at least 2 fields
    const parts = line.split("|").map(p => p.trim());
    if (parts.length < 2) continue;

    // Likely SKU is in 2nd column
    let flipkartSku = parts[0];

    // Remove leading digits if stuck to SKU (e.g., 1A-SKU → A-SKU)
    flipkartSku = flipkartSku.replace(/^\d+(?=[A-Za-z])/, "");

    // Skip if purely numeric or too short
    if (/^\d+$/.test(flipkartSku) || flipkartSku.length < 3) continue;

    // Optional: Require dash in SKU for stricter validation
    if (!/[A-Za-z]/.test(flipkartSku) || !flipkartSku.includes("-")) continue;

    const customSku = mapping[flipkartSku] || "default";

    if (!skuData[flipkartSku]) {
      skuData[flipkartSku] = { customSku, qty: 0 };
    }

    skuData[flipkartSku].qty += 1;
  }

  return skuData;
}

function generatePicklistCSV(skuData) {
  const headers = "Flipkart SKU,Custom SKU,Total Qty\n";
  const rows = Object.entries(skuData).map(
    ([fk, data]) => `${fk},${data.customSku},${data.qty}`
  );
  return headers + rows.join("\n");
}

function parseMappingCSV(buffer) {
  const records = parse(buffer, { columns: true, skip_empty_lines: true });
  const mapping = {};
  for (const record of records) {
    const flipkart = record["Flipkart SKU"]?.trim();
    const custom = record["Custom SKU"]?.trim();
    if (flipkart && custom) {
      mapping[flipkart] = custom;
    }
  }
  return mapping;
}

module.exports = { extractSkusFromText, generatePicklistCSV, parseMappingCSV };
