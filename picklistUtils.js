const pdf = require("pdf-parse");
const { parse } = require("csv-parse/sync");

function extractSkusFromText(text, mapping = {}) {
  const lines = text.split("\n");
  const skuData = {};

  for (const line of lines) {
    // Match any SKU-like string before a pipe (|)
    const match = line.match(/^\s*\d*\s*([a-zA-Z0-9-]{3,})\s*\|/);
    if (match) {
      const flipkartSku = match[1].trim();
      const customSku = mapping[flipkartSku] || "default";

      if (!skuData[flipkartSku]) {
        skuData[flipkartSku] = { customSku, qty: 0 };
      }

      skuData[flipkartSku].qty += 1;
    }
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
