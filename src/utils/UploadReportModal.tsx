/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { previewCsv, bulkSaveReports } from "@/api/reports";
import { Upload, FileSpreadsheet, AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function UploadReportModal({ isOpen, onClose, onSaved }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!file) return alert("Selecciona un archivo CSV primero");
    setLoading(true);
    try {
      const data = await previewCsv(file);
      setPreview(data);
    } catch (err) {
      console.error(err);
      alert("Error al previsualizar CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    const items = preview.detected
      .filter((d: any) => d.student_id)
      .map((d: any) => ({
        student_id: d.student_id,
        persistente: d.persistente,
        competente: d.competente,
        observador: d.observador,
      }));

    if (items.length === 0) return alert("No hay estudiantes válidos para guardar.");

    setLoading(true);
    try {
      const res = await bulkSaveReports(items);
      alert(res.mensaje || "Reportes guardados");
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error guardando reportes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/40 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-2xl shadow-xl border dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold">Subir reporte CSV</h3>
        </div>

        <div className="mb-5">
          <button
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-5 h-5" />
            Seleccionar archivo CSV
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleSelect}
            className="hidden"
          />

          {file && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 max-w-full truncate">
              Archivo seleccionado: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
            onClick={handlePreview}
            disabled={!file || loading}
          >
            {loading ? "Procesando..." : "Procesar CSV"}
          </button>

          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
            onClick={() => {
              setFile(null);
              setPreview(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            Limpiar
          </button>
        </div>

        {preview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                Detectados ({preview.detected.length})
              </h4>

              <div className="max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                {preview.detected.map((d: any, i: number) => (
                  <div key={i} className="p-2 border-b last:border-b-0 dark:border-gray-700">
                    <div className="font-medium truncate">{d.full_name}</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      persistente: {d.persistente} — competente: {d.competente} — observador: {d.observador}
                      {d.student_id ? (
                        <span className="ml-2 text-green-700 text-xs font-semibold">vinculado</span>
                      ) : (
                        <span className="ml-2 text-yellow-700 text-xs font-semibold">sin id</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UNMATCHED */}
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                No vinculados ({preview.unmatched.length})
              </h4>

              <div className="max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                {preview.unmatched.map((d: any, i: number) => (
                  <div key={i} className="p-2 border-b last:border-b-0 text-sm text-red-700 dark:text-red-400 dark:border-gray-700">
                    <div className="font-medium truncate">{d.full_name}</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {d.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER BUTTONS */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            onClick={onClose}
          >
            Cerrar
          </button>

          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow disabled:opacity-50"
            onClick={handleSave}
            disabled={loading || !preview}
          >
            Guardar reportes válidos
          </button>
        </div>
      </div>
    </div>
  );
}