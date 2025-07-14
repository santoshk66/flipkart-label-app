const fs = require("fs").promises;
const { parse } = require("csv-parse/sync");

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

module.exports = { parseMappingCSV };
