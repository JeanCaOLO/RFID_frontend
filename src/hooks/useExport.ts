import * as XLSX from "xlsx";
import type { RFIDTagEvent } from "../types/rfid.types";
import { formatDateTime } from "../utils/formatters";

export const useExport = () => {
  const exportToExcel = (events: RFIDTagEvent[], timeZone?: string) => {
    if (!events.length) {
      alert("No hay datos para exportar.");
      return;
    }

    const title = "Reporte de Lecturas RFID";
    const date = `Generado: ${new Date().toLocaleString()}`;

    const headerRow = [
      "EPC",
      "Lector",
      "Antena",
      "Puerta",
      "Puerta Esperada",
      "Estado",
      "RSSI",
      "Hora"
    ];

    const dataRows = events.map((event) => [
      event.epc,
      event.readerName,
      event.antenna,
      event.dockDoor ?? "",
      event.expectedDockDoor ?? "",
      event.isValid ? "OK" : "ERROR",
      event.rssi,
      formatDateTime(event.timestamp, timeZone)
    ]);

    const wsData = [[title], [date], [], headerRow, ...dataRows];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
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

    const COLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
    COLS.map((c) => `${c}4`).forEach((cell) => {
      if (ws[cell]) ws[cell].s = headerStyle;
    });

    const totalRows = events.length + 4;
    for (let r = 5; r <= totalRows; r += 1) {
      COLS.forEach((col) => {
        const cell = ws[`${col}${r}`];
        if (!cell) return;
        cell.s = {
          font: { bold: false, color: { rgb: "000000" }, sz: 12 },
          fill: { fgColor: { rgb: "FFFFFF" } },
          border: baseBorder
        };
      });
    }

    ws["!autofilter"] = { ref: `A4:H${totalRows}` };
    ws["!cols"] = [
      { wch: 35 },
      { wch: 12 },
      { wch: 8 },
      { wch: 16 },
      { wch: 16 },
      { wch: 10 },
      { wch: 10 },
      { wch: 22 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte RFID");
    XLSX.writeFile(wb, "Reporte_RFID.xlsx");
  };

  /**
   * Exporta un reporte de errores de despacho con múltiples hojas:
   * detalle de errores, resumen por puerta y rendimiento por punto de control.
   */
  const exportErrorReport = (
    errors: RFIDTagEvent[],
    doorSummary: {
      door: string;
      total: number;
      errors: number;
      errorRate: number;
    }[],
    timeZone?: string
  ) => {
    if (!errors.length && !doorSummary.length) {
      alert("No hay datos para exportar.");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Hoja 1: detalle de tags con error
    const detailRows = errors.map((e) => ({
      EPC: e.epc,
      Lector: e.readerName,
      Antena: e.antenna,
      "Puerta Leída": e.dockDoor ?? "",
      "Puerta Esperada": e.expectedDockDoor ?? "",
      RSSI: e.rssi,
      Motivo: e.reason ?? "",
      Fecha: formatDateTime(e.timestamp, timeZone)
    }));
    const detailSheet = XLSX.utils.json_to_sheet(
      detailRows.length ? detailRows : [{ Info: "Sin errores en el rango" }]
    );
    detailSheet["!cols"] = [
      { wch: 30 },
      { wch: 12 },
      { wch: 8 },
      { wch: 16 },
      { wch: 16 },
      { wch: 8 },
      { wch: 40 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, detailSheet, "Errores");

    // Hoja 2: resumen por puerta
    const summaryRows = doorSummary.map((d) => ({
      Puerta: d.door,
      "Total Lecturas": d.total,
      Errores: d.errors,
      "Tasa de Error (%)": Number(d.errorRate.toFixed(1))
    }));
    const summarySheet = XLSX.utils.json_to_sheet(
      summaryRows.length ? summaryRows : [{ Info: "Sin datos" }]
    );
    summarySheet["!cols"] = [
      { wch: 20 },
      { wch: 16 },
      { wch: 12 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen por Puerta");

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Reporte_Errores_Despacho_${stamp}.xlsx`);
  };

  return { exportToExcel, exportErrorReport };
};
