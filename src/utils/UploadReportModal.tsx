/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, useEffect } from "react";
import { previewCsv, bulkSaveReports } from "@/api/reports";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle, Loader2, Award } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function UploadReportModal({ isOpen, onClose, onSaved }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null); // Para mostrar errores en UI
  
  // Estado para el éxito visual
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Efecto para cerrar automáticamente tras el éxito
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        onSaved?.();
        handleClose(); // Cierra el modal completamente
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, onSaved]);

  if (!isOpen) return null;

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!file) {
      setError("Selecciona un archivo CSV primero");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await previewCsv(file);
      setPreview(data);
    } catch (err) {
      console.error(err);
      setError("Error al previsualizar CSV. Verifica el formato.");
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

    if (items.length === 0) {
      setError("No hay estudiantes válidos para guardar.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await bulkSaveReports(items);
      // En lugar de alert, activamos el modo éxito
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Error guardando reportes. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setShowSuccess(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  // --- VISTA DE ÉXITO (Full Screen Overlay dentro del modal) ---
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            ¡Importación Exitosa!
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Los reportes se han guardado correctamente en la base de datos.
          </p>
          
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-[progress_5s_linear_forwards]" style={{ width: '100%' }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Cerrando automáticamente en 5s...</p>
          
          <button onClick={handleClose} className="mt-6 text-sm text-emerald-600 hover:text-emerald-700 font-medium underline">
            Cerrar ahora
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA NORMAL DEL MODAL ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Subir Reporte CSV</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Importa las evaluaciones de Kahoot! y ClassDojo</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
            <XCircle size={24} />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Mensaje de Error General (Reemplaza alert de error) */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 animate-slide-down">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm">Atención</h4>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* Area de Carga */}
          <div 
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              file 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className={`p-3 rounded-full ${file ? 'bg-green-100 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <Upload className="w-8 h-8" />
              </div>
              {file ? (
                <>
                  <p className="text-green-700 dark:text-green-400 font-semibold text-lg break-all">{file.name}</p>
                  <p className="text-green-600/80 dark:text-green-500/70 text-sm">Archivo listo para procesar</p>
                </>
              ) : (
                <>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">Arrastra tu archivo CSV aquí o haz clic para buscar</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Solo se permiten archivos .csv</p>
                </>
              )}
            </div>
          </div>

          {/* Botones de Acción Intermedia */}
          {!preview && (
            <div className="flex justify-center gap-3">
              <button
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handlePreview}
                disabled={!file || loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
                {loading ? "Procesando..." : "Previsualizar Datos"}
              </button>
              <button
                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                onClick={resetForm}
                disabled={!file}
              >
                Limpiar
              </button>
            </div>
          )}

          {/* Previsualización de Resultados */}
          {preview && (
            <div className="animate-slide-up space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Resumen de Importación</h4>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                    <CheckCircle2 size={16} />
                    {preview.detected.length} Detectados
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full">
                    <AlertTriangle size={16} />
                    {preview.unmatched.length} No vinculados
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Columna Detectados */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-64">
                  <div className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30 font-semibold text-emerald-800 dark:text-emerald-400 text-sm sticky top-0">
                    Estudiantes Vinculados
                  </div>
                  <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {preview.detected.map((d: any, i: number) => (
                      <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">{d.full_name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            C1: <span className="text-blue-600 font-bold">{d.persistente}</span> • 
                            C2: <span className="text-purple-600 font-bold">{d.competente}</span> • 
                            C3: <span className="text-orange-600 font-bold">{d.observador}</span>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded">
                          OK
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna No Vinculados */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-64">
                  <div className="px-4 py-2 bg-rose-50/50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/30 font-semibold text-rose-800 dark:text-rose-400 text-sm sticky top-0">
                    Errores / No Encontrados
                  </div>
                  <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {preview.unmatched.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <Award size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">¡Excelente! Todos los estudiantes fueron reconocidos.</p>
                      </div>
                    ) : (
                      preview.unmatched.map((d: any, i: number) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30 shadow-sm flex justify-between items-center">
                          <div>
                            <div className="font-medium text-rose-700 dark:text-rose-400 text-sm">{d.full_name}</div>
                            <div className="text-xs text-rose-600/80 dark:text-rose-500/70 mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              {d.reason}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded">
                            Error
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            onClick={handleClose}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleSave}
            disabled={loading || !preview}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Confirmar Importación
          </button>
        </div>

      </div>
    </div>
  );
}