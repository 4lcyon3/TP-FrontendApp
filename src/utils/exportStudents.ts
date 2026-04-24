import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Student } from "@/types/api";

// Función auxiliar para determinar el estado y color
const getStatusInfo = (student: Student) => {
  const count = student.cant_evaluaciones || 0;
  if (count === 0) return { text: "Sin datos", color: "CCCCCC", fontColor: "000000" };
  
  const avg = (student.score_total || 0) / count;
  
  if (avg >= 2.70) return { text: "Aprobado", color: "10B981", fontColor: "FFFFFF" }; // Verde
  if (avg >= 1.90) return { text: "En Riesgo", color: "F59E0B", fontColor: "FFFFFF" }; // Naranja
  return { text: "Desaprobado", color: "EF4444", fontColor: "FFFFFF" }; // Rojo
};

export const exportStudentsExcel = async (students: Student[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte de Estudiantes');

  // 1. CONFIGURACIÓN DE COLUMNAS Y ANCHOS
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Alumno', key: 'name', width: 25 },
    { header: 'Eval.', key: 'eval', width: 10 },
    { header: 'Total Pts', key: 'total', width: 12 },
    { header: 'C1 (Persistente)', key: 'c1', width: 18 },
    { header: 'C2 (Competente)', key: 'c2', width: 18 },
    { header: 'C3 (Observador)', key: 'c3', width: 18 },
    { header: 'Promedio', key: 'avg', width: 12 },
    { header: 'Estado', key: 'status', width: 15 },
  ];

  // 2. ESTILOS DEL ENCABEZADO (HEADER)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  
  // Estilo base para el header
  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const, wrapText: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }, // Color Índigo
    border: {
      top: { style: 'thin', color: { argb: 'FF4F46E5' } },
      left: { style: 'thin', color: { argb: 'FF4F46E5' } },
      bottom: { style: 'thin', color: { argb: 'FF4F46E5' } },
      right: { style: 'thin', color: { argb: 'FF4F46E5' } },
    }
  };

  headerRow.eachCell((cell) => {
    Object.assign(cell, { style: headerStyle });
  });

  // 3. LLENADO DE DATOS Y ESTILOS POR FILA
  students.forEach((student, index) => {
    const count = student.cant_evaluaciones || 0;
    const avg = count > 0 ? (student.score_total || 0) / count : 0;
    const statusInfo = getStatusInfo(student);

    const row = worksheet.addRow({
      id: index + 1,
      name: `${student.first_name} ${student.last_name}`,
      eval: count,
      total: student.score_total?.toFixed(2) || "0.00",
      c1: student.persistente_total?.toFixed(2) || "0.00",
      c2: student.competente_total?.toFixed(2) || "0.00",
      c3: student.observador_total?.toFixed(2) || "0.00",
      avg: avg.toFixed(2),
      status: statusInfo.text
    });

    // Altura de fila
    row.height = 25;

    // Aplicar estilos a cada celda de la fila
    row.eachCell((cell, colNumber) => {
      // Bordes generales
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      
      // Alineación
      cell.alignment = { vertical: 'middle' as const, horizontal: colNumber === 2 ? 'center' as const : 'left' as const };
      cell.font = { size: 11, color: { argb: 'FF1E293B' } };

      // Estilos específicos por columna
      if (colNumber === 2) { // Columna Eval (Centro)
        cell.alignment = { vertical: 'middle' as const, horizontal: 'center' as const };
        cell.font = { bold: true, size: 11 };
      }
      
      if (colNumber === 4) { // C1 Azul
        cell.font = { bold: true, color: { argb: 'FF2563EB' } };
      }
      if (colNumber === 5) { // C2 Morado
        cell.font = { bold: true, color: { argb: 'FF7C3AED' } };
      }
      if (colNumber === 6) { // C3 Naranja
        cell.font = { bold: true, color: { argb: 'FFEA580C' } };
      }
      if (colNumber === 7) { // Promedio Negrita
        cell.font = { bold: true, size: 12 };
      }

      // Estilo especial para la columna ESTADO (Coloreada)
      if (colNumber === 9) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: `FF${statusInfo.color}` }
        };
        cell.font = { bold: true, color: { argb: `FF${statusInfo.fontColor}` }, size: 11 };
        cell.alignment = { vertical: 'middle' as const, horizontal: 'center' as const };
      }
    });
  });

  // 4. GENERAR Y DESCARGAR EL ARCHIVO
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const date = new Date().toISOString().split('T')[0];
  saveAs(blob, `Reporte_Estudiantes_${date}.xlsx`);
};