const fs = require('fs');

const sqlPath = 'D:\\spimi\\spmi-main\\spmi-main\\db_spmi.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

const matches = [...sql.matchAll(/\((\d+),\s*'([^']*)',\s*(\d+)\)/g)];

const indicators = [];
for (const match of matches) {
  if (match[2].includes('<p>')) {
    let text = match[2].replace(/<[^>]*>?/gm, ' ').replace(/\\r\\n/g, ' ').replace(/\s+/g, ' ').trim();
    indicators.push(text);
  }
}

const uniqueIndicators = [...new Set(indicators)];
console.log(`Extracted ${uniqueIndicators.length} unique indicators.`);
fs.writeFileSync('C:\\spmi-utama\\scratch\\indicators.json', JSON.stringify(uniqueIndicators.slice(0, 10), null, 2));
