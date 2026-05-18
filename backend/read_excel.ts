import * as XLSX from 'xlsx';
import * as fs from 'fs';

const workbook = XLSX.readFile('../STQA_Task_Database.xlsx');
const sheetNames = workbook.SheetNames;

for (const sheetName of sheetNames) {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  fs.writeFileSync(`./data_${sheetName.replace(/\s+/g, '_')}.json`, JSON.stringify(data, null, 2));
  console.log(`Saved ${sheetName} to JSON.`);
}
