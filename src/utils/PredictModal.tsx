import { useState } from "react";
import { 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Info, 
  TrendingUp, 
  BookOpen 
} from "lucide-react";

interface PredictModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
}

// Tipos para la respuesta de la API
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

export default function PredictModal({ isOpen, onClose, studentId }: PredictModalProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    setErrorMsg("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/ml/predict/${studentId}/`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: ApiResponse | any = await res.json();

      if (!res.ok || data.status !== "success") {
        throw new Error(data.error || "Error al obtener predicción");
      }

      setPrediction(data.prediction);
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err instanceof Error) {
        setErrorMsg(err.message || "No se pudo conectar con el servicio de IA.");
      } else {
        setErrorMsg("Error desconocido al obtener predicción.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Configuración visual según el nivel
  const getVisualConfig = (levelLabel: string) => {
    switch (levelLabel) {
      case "En Inicio":
        return {
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          icon: <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />,
          title: "Rendimiento En Inicio",
          desc: "Se requiere intervención inmediata y reforzamiento.",
          progressColor: "bg-red-500"
        };
      case "En Proceso":
        return {
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          border: "border-amber-200 dark:border-amber-800",
          icon: <AlertTriangle className="w-12 h-12 text-amber-600 dark:text-amber-400" />,
          title: "Rendimiento En Proceso",
          desc: "El estudiante está en riesgo, necesita consolidar competencias.",
          progressColor: "bg-amber-500"
        };
      case "Logro Esperado":
        return {
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          border: "border-emerald-200 dark:border-emerald-800",
          icon: <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />,
          title: "Logro Esperado",
          desc: "Buen desempeño. Se sugiere mantener el ritmo y desafiar.",
          progressColor: "bg-emerald-500"
        };
      default:
        return {
          color: "text-slate-600 dark:text-slate-400",
          bg: "bg-slate-50 dark:bg-slate-800/50",
          border: "border-slate-200 dark:border-slate-700",
          icon: <Info className="w-12 h-12 text-slate-600 dark:text-slate-400" />,
          title: "Nivel No Determinado",
          desc: "Datos insuficientes.",
          progressColor: "bg-slate-500"
        };
    }
  };

  const config = prediction ? getVisualConfig(prediction.level_label) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Predicción de Rendimiento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modelo IA Educativa v2.0
            </p>
          </div>
        </div>

        {/* Body Scrollable */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar">
          
          {!prediction && !loading && !errorMsg && (
            <div className="text-center py-8">
              <Info className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-2 font-medium">
                ¿Listo para analizar?
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                El modelo evaluará las competencias C1, C2 y C3 para predecir el nivel de logro del estudiante.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Procesando datos...</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center max-w-xs">
                Calculando promedios ponderados y comparando con patrones históricos.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-red-700 dark:text-red-300 font-bold mb-2">Error en la predicción</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
            </div>
          )}

          {prediction && config && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Tarjeta Principal de Estado */}
              <div className={`rounded-xl border ${config.border} ${config.bg} p-6`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{config.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${config.color} mb-1`}>
                      {config.title}
                    </h3>
                    <p className={`text-sm ${config.color} opacity-90 mb-3`}>
                      {config.desc}
                    </p>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        <span>Confianza del modelo</span>
                        <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full ${config.progressColor} transition-all duration-1000 ease-out`} 
                          style={{ width: `${prediction.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendación Pedagógica */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm uppercase tracking-wide">
                    Recomendación Docente
                  </h4>
                </div>
                <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                  {prediction.recommendation}
                </p>
              </div>

              {/* Detalle de Probabilidades (Opcional, tipo Debug visual) */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-center text-slate-400 dark:text-slate-500 mb-2">
                  Distribución de probabilidades estimada:
                </p>
                <div className="flex justify-center gap-4 text-xs font-medium">
                  <span className="text-red-500">Inicio: {(prediction.probabilities.inicio * 100).toFixed(0)}%</span>
                  <span className="text-amber-500">Proceso: {(prediction.probabilities.proceso * 100).toFixed(0)}%</span>
                  <span className="text-emerald-500">Logro: {(prediction.probabilities.logro * 100).toFixed(0)}%</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          {!prediction && !loading && !errorMsg && (
             <button
               onClick={handlePredict}
               disabled={loading}
               className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
               {loading ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Analizando...
                 </>
               ) : (
                 <>
                   <TrendingUp className="w-4 h-4" />
                   Generar Predicción
                 </>
               )}
             </button>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            {prediction || errorMsg ? 'Cerrar' : 'Cancelar'}
          </button>
        </div>

      </div>
    </div>
  );
}