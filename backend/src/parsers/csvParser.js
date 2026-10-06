const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function parseCsvFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
}

function normalizeProducts(records) {
  return records
    .map((row) => {
      if (!row || typeof row !== 'object') return null;

      const productId = String(row.ProductID || row.product_id || row.productId || '').trim();
      const productName = String(row.ProductName || row.product_name || row.productName || '').trim();
      const category = String(row.Category || row.category || '').trim();

      if (!productId) return null;

      return {
        product_id: productId,
        product_name: productName,
        category,
      };
    })
    .filter(Boolean);
}

module.exports = { parseCsvFile, normalizeProducts };
