import { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Info, 
  TrendingUp,
  Users,
  AlertCircle
} from "lucide-react";
import type { Student } from "@/types/api";

interface GroupPredictModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  filterDescription: string; // Ej: "Aprobados de 3ro A"
}

// Tipos para la respuesta de la API (Mismos que PredictModal)
interface PredictionData {
  level_id: number;
  level_label: string;
  confidence: number;
  probabilities: {
    inicio: number;
    proceso: number;
    logro: number;
  };
  recommendation: string;
}

interface ApiResponse {
  status: string;
  prediction: PredictionData;
  error?: string;
}

// Tipo para el resultado individual procesado
interface StudentResult {
  student: Student;
  prediction: PredictionData | null;
  error?: string;
  status: 'pending' | 'success' | 'error';
}

export default function GroupPredictModal({ isOpen, onClose, students, filterDescription }: GroupPredictModalProps) {
  const [step, setStep] = useState<'confirm' | 'processing' | 'results'>('confirm');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentProcessing, setCurrentProcessing] = useState<string>("");

  // Resetear estado al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setResults([]);
      setProgress(0);
      setCurrentProcessing("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartPrediction = async () => {
    setStep('processing');
    const initialResults: StudentResult[] = students.map(s => ({
      student: s,
      prediction: null,
      status: 'pending'
    }));
    setResults(initialResults);

    let successCount = 0;

    // Procesar uno por uno para no saturar la API
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const studentName = `${student.first_name} ${student.last_name}`;
      setCurrentProcessing(`Procesando a ${studentName}...`);

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/ml/predict/${student.id}/`);
        const data: ApiResponse = await res.json();

        if (!res.ok || data.status !== "success") {
          throw new Error(data.error || "Error en la respuesta del servidor");
        }

        // Actualizar resultado exitoso
        setResults(prev => prev.map(r => 
          r.student.id === student.id 
            ? { ...r, prediction: data.prediction, status: 'success' }
            : r
        ));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        successCount++;

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error de conexión";
        // Actualizar resultado fallido
        setResults(prev => prev.map(r => 
          r.student.id === student.id 
            ? { ...r, error: errorMsg, status: 'error' }
            : r
        ));
      }

      // Actualizar barra de progreso
      const currentProgress = Math.round(((i + 1) / students.length) * 100);
      setProgress(currentProgress);
      
      // Pequeña pausa para no bloquear la UI (opcional, pero recomendado)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setCurrentProcessing("Finalizado");
    setTimeout(() => setStep('results'), 500);
  };

  // Configuración visual según el nivel (Misma lógica que PredictModal)
  const getVisualConfig = (levelLabel: string) => {
    switch (levelLabel) {
      case "En Inicio":
        return { color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", icon: <XCircle size={16} /> };
      case "En Proceso":
        return { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", icon: <AlertCircle size={16} /> };
      case "Logro Esperado":
        return { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", icon: <CheckCircle size={16} /> };
      default:
        return { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: <Info size={16} /> };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Predicción Grupal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filtrado: {filterDescription} ({students.length} alumnos)
            </p>
          </div>
        </div>

        {/* Body Scrollable */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* PASO 1: CONFIRMACIÓN */}
          {step === 'confirm' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                ¿Predecir rendimiento de {students.length} alumnos?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                El modelo analizará las competencias de cada estudiante seleccionado. Este proceso puede tomar unos segundos dependiendo de la cantidad de alumnos.
              </p>
              {students.length > 20 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm p-3 rounded-lg inline-flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>Se detectaron más de 20 alumnos. La operación podría tardar un poco.</span>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: PROCESAMIENTO */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-slate-800 dark:text-slate-200 font-medium text-lg">{currentProcessing}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Por favor no cierres esta ventana.</p>
              </div>
              
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span>Progreso</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-3 rounded-full bg-indigo-600 transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Mini resumen en tiempo real */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-md pt-4">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{results.filter(r => r.status === 'success').length}</div>
                  <div className="text-xs text-slate-500">Exitosos</div>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{results.filter(r => r.status === 'error').length}</div>
                  <div className="text-xs text-slate-500">Errores</div>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{results.filter(r => r.status === 'pending').length}</div>
                  <div className="text-xs text-slate-500">Pendientes</div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: RESULTADOS */}
          {step === 'results' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={20} />
                  Resultados Obtenidos
                </h3>
                <div className="text-sm text-slate-500">
                  {results.filter(r => r.status === 'success').length} / {results.length} procesados correctamente
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result, idx) => {
                  const config = result.prediction ? getVisualConfig(result.prediction.level_label) : null;
                  
                  return (
                    <div key={idx} className={`border rounded-lg p-4 flex flex-col gap-3 h-auto ${config ? `${config.bg} ${config.border}` : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate" title={`${result.student.first_name} ${result.student.last_name}`}>
                            {result.student.first_name} {result.student.last_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{result.student.section || 'Sin sección'}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {config ? config.icon : <XCircle className="text-red-500" size={16} />}
                        </div>
                      </div>

                      {result.status === 'success' && result.prediction ? (
                        <>
                          <div className="flex-1">
                            <p className={`text-xs font-bold uppercase mb-1 ${config!.color}`}>
                              {result.prediction.level_label}
                            </p>
                            {/* Texto completo sin line-clamp, con scroll interno solo si es excesivamente largo */}
                            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                              {result.prediction.recommendation}
                            </div>
                          </div>
                          <div className="mt-auto pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Confianza</span>
                              <span className="font-medium">{(result.prediction.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-2 text-red-500 text-xs">
                          <p>Error: {result.error || "Fallido"}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          {step === 'confirm' && (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStartPrediction}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <TrendingUp size={18} />
                Iniciar Predicción Masiva
              </button>
            </>
          )}

          {step === 'processing' && (
            <button
              disabled
              className="px-6 py-2.5 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed font-medium flex items-center gap-2"
            >
              <Loader2 size={18} className="animate-spin" />
              Procesando...
            </button>
          )}

          {step === 'results' && (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-md flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Finalizar
            </button>
          )}
        </div>

      </div>
    </div>
  );
}