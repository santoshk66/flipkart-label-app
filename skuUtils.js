const fs = require("fs").promises;
const { parse } = require("csv-parse/sync");

/**
 * Parses the SKU mapping CSV file into a JS object
 */
async function parseMappingCSV(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  });

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

/**
 * Extracts Flipkart SKUs from parsed PDF text using refined logic
 */
function extractSkusFromText(text, mapping = {}) {
  const lines = text.split("\n");
  const skuData = {};

  for (const line of lines) {
    const parts = line.split("|").map(p => p.trim());
    if (parts.length < 2) continue;

    let flipkartSku = parts[0];

    // Remove numeric prefix if present (like 1A-, 2Bulb-...)
    flipkartSku = flipkartSku.replace(/^\d+(?=[A-Za-z])/, "");

    // Reject purely numeric or too short values
    if (/^\d+$/.test(flipkartSku) || flipkartSku.length < 3) continue;

    // Must contain letters and a hyphen (common in SKUs)
    if (!/[A-Za-z]/.test(flipkartSku) || !flipkartSku.includes("-")) continue;

    const customSku = mapping[flipkartSku] || "default";

    if (!skuData[flipkartSku]) {
      skuData[flipkartSku] = { customSku, qty: 0 };
    }

    skuData[flipkartSku].qty += 1;
  }

  return skuData;
}

/**
 * Converts SKU data into CSV format for download
 */
function generatePicklistCSV(skuData) {
  const headers = "Flipkart SKU,Custom SKU,Total Qty\n";
  const rows = Object.entries(skuData).map(
    ([fk, data]) => `${fk},${data.customSku},${data.qty}`
  );
  return headers + rows.join("\n");
}

module.exports = {
  parseMappingCSV,
  extractSkusFromText,
  generatePicklistCSV,
};
