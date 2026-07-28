import Papa from "papaparse";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIsRomoqGA9MC22LYt7FNPVfJ7LbggPyNeyjAAGsL5tnAwpyNH34tDZxvtNVuA42_zkYfILrWlF2ws/pub?output=csv";

export async function getProducts() {
  return new Promise((resolve, reject) => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}