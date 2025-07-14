const fs = require("fs");
const csv = require("csv-parser");

async function parseMappingCSV(path) {
  return new Promise((resolve) => {
    const mapping = {};
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (row) => {
        const flipkartSku = row["flipkart_sku"]?.trim();
        const customSku = row["custom_sku"]?.trim();
        if (flipkartSku && customSku) {
          mapping[flipkartSku] = customSku;
        }
      })
      .on("end", () => resolve(mapping));
  });
}

module.exports = { parseMappingCSV };
