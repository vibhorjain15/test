
/// <reference lib="webworker" />
import * as XLSX from 'xlsx';

addEventListener('message', ({ data }) => {
  const fileReader = new FileReader();

  fileReader.onload = (e: any) => {
    const arrayBuffer = e.target.result;
    const fileData = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(fileData, { type: 'array' });

    const sheets = [];

    workbook.SheetNames.forEach((sheetName, sheetId) => {
      const columnHeaders = [];
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      });

      const countArraysWithItems = (arrayOfArrays: any[]): number => {
        let count = 0;
        for (const childArray of arrayOfArrays) {
          if (childArray.length > 0) {
            count++;
          }
        }
        return count;
      };

      const rowCount = sheetData ? countArraysWithItems(sheetData) : 0;
      const headerRow: string[] = sheetData && (sheetData[0] as string[]);

      if (headerRow) {
        for (const header of headerRow) {
          if (header && header.toString().trim().length > 0) {
            columnHeaders.push(header);
          }
        }

        sheets.push({
          sheetName: sheetName,
          sheetId: sheetId,
          columnHeaders: columnHeaders,
          rowCount: rowCount,
          disabled: false,
        });
      }
    });

    postMessage(sheets);
  };

  fileReader.readAsArrayBuffer(data);
});
