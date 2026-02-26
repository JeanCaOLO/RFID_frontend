import * as XLSX from "xlsx";
import type { RFIDTagEvent } from "../types/rfid.types";
import { formatDateTime } from "../utils/formatters";

export const useExport = () => {
  const exportToExcel = (events: RFIDTagEvent[]) => {
    if (!events.length) {
      alert("No hay datos para exportar.");
      return;
    }

    const title = "Reporte de Lecturas RFID";
    const date = `Generado: ${new Date().toLocaleString()}`;

    const headerRow = ["EPC", "Antena", "RSSI", "Hora"];

    const dataRows = events.map((event) => [
      event.epc,
      event.antenna,
      event.rssi,
      formatDateTime(event.timestamp)
    ]);

    const wsData = [[title], [date], [], headerRow, ...dataRows];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
    ];

    const baseBorder = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    } as const;

    ws["A1"].s = {
      font: { bold: true, sz: 20, color: { rgb: "000000" } },
      alignment: { horizontal: "center" }
    };

    ws["A2"].s = {
      font: { bold: true, color: { rgb: "000000" } },
      alignment: { horizontal: "center" }
    };

    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "FFFFFF" } },
      border: baseBorder,
      alignment: { horizontal: "center" }
    };

    ["A4", "B4", "C4", "D4"].forEach((cell) => {
      if (ws[cell]) ws[cell].s = headerStyle;
    });

    const totalRows = events.length + 4;
    for (let r = 5; r <= totalRows; r += 1) {
      ["A", "B", "C", "D"].forEach((col) => {
        const cell = ws[`${col}${r}`];
        if (!cell) return;
        cell.s = {
          font: { bold: false, color: { rgb: "000000" }, sz: 12 },
          fill: { fgColor: { rgb: "FFFFFF" } },
          border: baseBorder
        };
      });
    }

    ws["!autofilter"] = { ref: `A4:D${totalRows}` };
    ws["!cols"] = [
      { wch: 35 },
      { wch: 12 },
      { wch: 10 },
      { wch: 22 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte RFID");
    XLSX.writeFile(wb, "Reporte_RFID.xlsx");
  };

  return { exportToExcel };
};
