import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportStudentsExcel(students: any[]) {

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Estudiantes");

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const header = [
    "ID",
    "Nombre Completo",
    "Evaluaciones",
    "Puntaje Total",
  ];

  sheet.addRow(header);

  header.forEach((_, i) => {
    const cell = sheet.getCell(1, i + 1);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F6CBD" },
    };
    cell.alignment = { horizontal: "center" };
  });

  students.forEach((s) => {
    sheet.addRow([
      s.id,
      `${s.first_name} ${s.last_name}`,
      s.cant_evaluaciones,
      s.score_total,
    ]);
  });

  sheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value?.toString().length ?? 10;
      if (columnLength > maxLength) maxLength = columnLength;
    });
    column.width = maxLength + 2;
  });

  sheet.addTable({
    name: "EstudiantesTable",
    ref: "A1",
    headerRow: true,
    style: {
      theme: "TableStyleMedium9",
      showRowStripes: true,
    },
    columns: header.map((h) => ({ name: h })),
    rows: students.map((s) => [
      s.id,
      `${s.first_name} ${s.last_name}`,
      s.cant_evaluaciones,
      s.score_total,
      s.promedio,
    ]),
  });

  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const fileName = `reporte_estudiantes_${yyyy}-${mm}-${dd}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
}