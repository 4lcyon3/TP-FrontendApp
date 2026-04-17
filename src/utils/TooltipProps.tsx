import React from "react";
import { Info } from "lucide-react";

export interface TooltipProps {
  text: string;
  cScore?: number;       // Puntaje acumulado de la competencia
  evalCount?: number;    // Cantidad de evaluaciones
  type?: "c1" | "c2" | "c3"; // Tipo de competencia para personalizar la recomendación
}

export const Tooltip: React.FC<TooltipProps> = ({ text, cScore, evalCount, type }) => {
  // Calcular promedio solo si tenemos datos
  const average = evalCount && evalCount > 0 ? cScore! / evalCount : 0;
  
  // Generar recomendación basada en el promedio y el tipo de competencia
  const getRecommendation = () => {
    if (!evalCount || evalCount === 0) return "Sin datos suficientes.";
    
    if (average >= 2.75) {
      // Nivel Alto - Recomendación de ampliación
      switch (type) {
        case "c1": return "Nivel Óptimo. Sugerencia: Proponer textos con información implícita más compleja.";
        case "c2": return "Nivel Óptimo. Sugerencia: Fomentar la inferencia de temas transversales y valores.";
        case "c3": return "Nivel Óptimo. Sugerencia: Invitar a debatir posturas críticas sobre el contexto.";
        default: return "Excelente desempeño.";
      }
    } else if (average >= 1.90) {
      // Nivel Medio/Riesgo - Recomendación de refuerzo
      switch (type) {
        case "c1": return "Nivel Medio. Sugerencia: Reforzar la identificación de datos explícitos en párrafos cortos.";
        case "c2": return "Nivel Medio. Sugerencia: Practicar preguntas de 'por qué' y 'para qué' en lecturas guiadas.";
        case "c3": return "Nivel Medio. Sugerencia: Trabajar en la opinión personal justificada con ejemplos del texto.";
        default: return "Requiere práctica constante.";
      }
    } else {
      // Nivel Bajo - Recomendación prioritaria
      switch (type) {
        case "c1": return "Nivel Bajo. Prioridad: Ejercicios de lectura en voz alta y subrayado de ideas principales.";
        case "c2": return "Nivel Bajo. Prioridad: Uso de organizadores visuales para conectar causas y consecuencias.";
        case "c3": return "Nivel Bajo. Prioridad: Actividades de comparación entre el texto y la experiencia cotidiana.";
        default: return "Requiere intervención inmediata.";
      }
    }
  };

  const hasData = evalCount && evalCount > 0;

  return (
    <div className="group relative inline-block ml-1 align-middle">
      <Info 
        size={14} 
        className="text-gray-400 hover:text-blue-500 cursor-help transition-colors" 
      />
      
      {/* Tooltip Content */}
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 w-64 p-3 mt-2 text-xs text-left bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 -left-24 md:-left-32 pointer-events-none">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{text}</p>
        
        {hasData ? (
          <div className="space-y-1">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Promedio:</span>
              <span className={`font-bold ${
                average >= 2.75 ? 'text-green-600' : 
                average >= 1.90 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {average.toFixed(2)}
              </span>
            </div>
            <div className="pt-1 border-t border-gray-100 dark:border-slate-700 mt-1">
              <p className="text-gray-600 dark:text-gray-300 italic">
                💡 {getRecommendation()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic mt-1">
            Sin evaluaciones registradas aún.
          </p>
        )}
        
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-slate-800 rotate-45 border-l border-t border-gray-100 dark:border-slate-700"></div>
      </div>
    </div>
  );
};