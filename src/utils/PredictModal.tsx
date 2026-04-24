import { useState } from "react";
import { BrainCircuit, AlertTriangle, CheckCircle, XCircle, Loader2, Info } from "lucide-react";

interface PredictModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
}

export default function PredictModal({ isOpen, onClose, studentId }: PredictModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);

  if (!isOpen) return null;

  const interpretScore = (score: number) => {
    if (score > 2.70) return "❌ Tiene un BAJO RENDIMIENTO. Se predice que DESAPROBARÁ sin intervención inmediata.";
    if (score <= 2.70 && score > 1.75 ) return "⚠️ Tiene un rendimiento MEDIO. Se predice que está EN RIESGO de desaprobar si no mejora.";
    return "✅ Tiene un ALTO RENDIMIENTO. Se predice que APROBARÁ satisfactoriamente.";
  };

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    setMessage("");
    setScore(0);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/ml/predict/${studentId}/`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error generando predicción");
      } else {
        const predictionValue = parseFloat(data.prediction.toFixed(2));
        setResult(predictionValue);
        setScore(predictionValue);
        setMessage(interpretScore(predictionValue));
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("No se pudo conectar al backend");
    } finally {
      setLoading(false);
    }
  };

  // Determinar el estilo visual basado en el puntaje
  const getVisualStatus = (s: number) => {
    if (s > 2.70) {
      return {
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        icon: <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />,
        title: "Bajo Rendimiento",
        subColor: "text-red-700 dark:text-red-300"
      };
    } else if (s <= 2.70 && s > 1.75) {
      return {
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
        icon: <AlertTriangle className="w-12 h-12 text-amber-600 dark:text-amber-400" />,
        title: "En Riesgo",
        subColor: "text-amber-700 dark:text-amber-300"
      };
    } else {
      return {
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        icon: <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />,
        title: "Alto Rendimiento",
        subColor: "text-emerald-700 dark:text-emerald-300"
      };
    }
  };

  const visualStatus = result !== null ? getVisualStatus(score) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Predicción de Rendimiento
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Análisis basado en IA para el estudiante seleccionado
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {!result && !loading && (
            <div className="text-center py-8">
              <Info className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Haz clic en el botón de abajo para generar una predicción sobre el rendimiento futuro del alumno basándose en sus datos actuales.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Analizando datos...</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Nuestro modelo está calculando las probabilidades</p>
            </div>
          )}

          {result !== null && visualStatus && (
            <div className={`rounded-xl border ${visualStatus.border} ${visualStatus.bg} p-6 animate-in slide-in-from-bottom-4 duration-300`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {visualStatus.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${visualStatus.color} mb-1`}>
                    {visualStatus.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${visualStatus.subColor} mb-4`}>
                    {message.replace(/❌|⚠️|✅/g, '').trim()}
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-black/5 dark:border-white/10">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Puntaje Predicho:
                    </span>
                    <span className={`text-2xl font-bold ${visualStatus.color}`}>
                      {score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          {!result && !loading && (
             <button
             onClick={handlePredict}
             disabled={loading}
             className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             {loading ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin" />
                 Calculando...
               </>
             ) : (
               <>
                 <BrainCircuit className="w-4 h-4" />
                 Generar Predicción
               </>
             )}
           </button>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
        </div>

      </div>
    </div>
  );
}