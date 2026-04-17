/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";

interface PredictModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
}

export default function PredictModal({ isOpen, onClose, studentId }: PredictModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

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

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/ml/predict/${studentId}/`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error generando predicción");
      } else {
        setResult(data.prediction);
        setMessage(interpretScore(data.prediction));
      }
    } catch (err) {
      alert("No se pudo conectar al backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl w-full max-w-lg p-8 animate-scaleIn">

        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800 dark:text-gray-100">
          Predicción de Rendimiento
        </h2>

        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          Obtén una predicción basada en el modelo de aprendizaje automático.
        </p>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="px-4 py-3 w-full rounded-lg bg-gray-800 dark:bg-gray-700 text-white
          font-medium hover:bg-gray-900 dark:hover:bg-gray-600 transition disabled:bg-gray-400"
        >
          {loading ? "Calculando..." : "Generar predicción"}
        </button>

        {result !== null && (
          <div className="mt-6 p-5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="mt-1">
              <p className="text-5x1 text-white font-bold">
                Se predice que el alumno:
              </p>
              <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 
            dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}