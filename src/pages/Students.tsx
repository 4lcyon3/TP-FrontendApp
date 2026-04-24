import { useMemo, useState, type ChangeEvent } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/hooks/AuthContext";
import type { Student } from "@/types/api";
import { exportStudentsExcel } from "../utils/exportStudents";
import { 
  FileSpreadsheet, Edit, Trash2, Upload, Cpu, 
  Search, ChevronLeft, ChevronRight, Info, 
  BookOpen, Award, BrainCircuit, 
  ExternalLink, Gamepad2, ClipboardCheck,
  ChevronDown, ChevronUp, Filter, PieChart as PieChartIcon, TrendingDown, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditModal from "@/utils/EditModals";
import ConfirmModal from "@/utils/ConfirmModal";
import UploadReportModal from "@/utils/UploadReportModal";
import { useQueryClient } from "@tanstack/react-query";
import PredictModal from "@/utils/PredictModal";
import { Tooltip } from "@/utils/TooltipProps";
import {
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell,
  PieChart as RechartsPieChart, Pie
} from "recharts";

export default function StudentsPage() {
  const { data: allStudents = [], isLoading, isError, updateStudent, deleteStudent } = useStudents();
  const { user } = useAuth();
  
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Estados para colapsables
  const [showFlowDiagram, setShowFlowDiagram] = useState(false);
  const [flowCollapsed, setFlowCollapsed] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);

  // Nuevos estados para filtros
  const [statusFilter, setStatusFilter] = useState<"all" | "Aprobado" | "En Riesgo" | "Desaprobado">("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all"); // Nuevo filtro por sección
  const [top5Metric, setTop5Metric] = useState<"avg" | "c1" | "c2" | "c3">("avg");
  
  // Estado para el selector de alumno en el Card 3
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Modal states
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  // Lógica original de filtrado por profesor
  const studentsForTeacher = useMemo(() => {
    if (!user) return [];
    return allStudents.filter((s) => {
      if (typeof s.teacher === "number") return s.teacher === user.id;
      return s.teacher?.id === user.id;
    });
  }, [allStudents, user]);

  // Cálculo de estado individual para cada estudiante (para filtros y gráficos)
  const studentsWithStatus = useMemo(() => {
    return studentsForTeacher.map(s => {
      const count = s.cant_evaluaciones || 0;
      const avg = count > 0 ? (s.score_total || 0) / count : 0;
      let status = "Sin datos";
      if (count > 0) {
        if (avg >= 6.5) status = "Aprobado";
        else if (avg >= 3.45) status = "En Riesgo";
        else status = "Desaprobado";
      }
      return { ...s, calculatedStatus: status, average: avg };
    });
  }, [studentsForTeacher]);

  // Obtener secciones únicas disponibles
  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    studentsWithStatus.forEach(s => {
      if (s.section) {
        sections.add(s.section);
      }
    });
    return Array.from(sections).sort();
  }, [studentsWithStatus]);

  // Inicializar el selector del Card 3 con el primer alumno si no hay uno seleccionado
  useMemo(() => {
    if (!selectedStudentId && studentsWithStatus.length > 0) {
      setSelectedStudentId(studentsWithStatus[0].id);
    }
  }, [studentsWithStatus, selectedStudentId]);

  // Lógica original de búsqueda por nombre
  const filteredByName = useMemo(() => {
    if (!q) return studentsWithStatus;
    const term = q.toLowerCase();
    return studentsWithStatus.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term)
    );
  }, [q, studentsWithStatus]);

  // FILTRO COMBINADO: Nombre + Estado + Sección
  const filtered = useMemo(() => {
    let result = filteredByName;
    
    // Filtro por estado
    if (statusFilter !== "all") {
      result = result.filter(s => s.calculatedStatus === statusFilter);
    }
    
    // Filtro por sección
    if (sectionFilter !== "all") {
      result = result.filter(s => s.section === sectionFilter);
    }
    
    return result;
  }, [filteredByName, statusFilter, sectionFilter]);

  // --- DATOS PARA GRÁFICOS (Todos responden al filtro de sección) ---

  // 1. Gráfico de Pastel (Distribución por Estado) - Filtrado por sección
  const statsData = useMemo(() => {
    let approved = 0, risk = 0, failed = 0;
    filtered.forEach(s => {
      if (s.calculatedStatus === "Aprobado") approved++;
      else if (s.calculatedStatus === "En Riesgo") risk++;
      else if (s.calculatedStatus === "Desaprobado") failed++;
    });
    return [
      { name: 'Aprobados', value: approved, color: '#10b981' },
      { name: 'En Riesgo', value: risk, color: '#f59e0b' },
      { name: 'Desaprobados', value: failed, color: '#ef4444' },
    ];
  }, [filtered]);

  // 2. Top 5 Bajo Rendimiento (Dinámico según métrica seleccionada) - Filtrado por sección
  const top5LowPerformers = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      let valA = 0, valB = 0;
      const countA = a.cant_evaluaciones || 1;
      const countB = b.cant_evaluaciones || 1;

      if (top5Metric === 'avg') {
        valA = (a.score_total || 0) / countA;
        valB = (b.score_total || 0) / countB;
      } else if (top5Metric === 'c1') {
        valA = (a.persistente_total || 0) / countA;
        valB = (b.persistente_total || 0) / countB;
      } else if (top5Metric === 'c2') {
        valA = (a.competente_total || 0) / countA;
        valB = (b.competente_total || 0) / countB;
      } else if (top5Metric === 'c3') {
        valA = (a.observador_total || 0) / countA;
        valB = (b.observador_total || 0) / countB;
      }
      return valA - valB;
    });

    return sorted.slice(0, 5).map(s => {
      const count = s.cant_evaluaciones || 1;
      let value = 0;
      
      if (top5Metric === 'avg') value = (s.score_total || 0) / count;
      else if (top5Metric === 'c1') value = (s.persistente_total || 0) / count;
      else if (top5Metric === 'c2') value = (s.competente_total || 0) / count;
      else if (top5Metric === 'c3') value = (s.observador_total || 0) / count;

      return {
        name: `${s.first_name} ${s.last_name}`,
        value: Number(value.toFixed(2)),
        color: value < 3.45 ? '#ef4444' : value < 6.5 ? '#f59e0b' : '#10b981'
      };
    });
  }, [filtered, top5Metric]);

  // 3. Datos para el Card de Alumno Seleccionado - Solo muestra alumnos filtrados
  const selectedStudentData = useMemo(() => {
    if (!selectedStudentId) return null;
    return filtered.find(s => s.id === selectedStudentId);
  }, [selectedStudentId, filtered]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Handlers originales preservados
  const handleEditSave = async (payload: Partial<Student>) => {
    if (!editStudent) return;
    await updateStudent.mutateAsync({ id: editStudent.id, payload });
    setEditStudent(null);
  };

  const handleDeleteConfirm = async (id: number) => {
      try {
        await deleteStudent.mutateAsync(id);
        setConfirmDelete(null);
      } catch (err) {
        console.error(err);
        alert("No se pudo eliminar el alumno.");
      }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (isError) return <div className="text-red-600 p-4">Error cargando estudiantes</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Estudiantes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Lista de alumnos a tu cargo y análisis de comprensión lectora.
          </p>
        </div>
        <div className="flex gap-3">
          <a href="https://kahoot.it " target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium border border-purple-200 dark:border-purple-800">
            <Gamepad2 size={18} /> Abrir Kahoot! <ExternalLink size={14} />
          </a>
          <a href="https://classdojo.com " target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200 dark:border-green-800">
            <ClipboardCheck size={18} /> Abrir ClassDojo <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS (ARRIBA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Gráfico de Pastel */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 w-full text-left flex items-center gap-2">
            <PieChartIcon size={16} className="text-indigo-500" /> Distribución General
          </h3>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statsData}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Top 5 Bajo Rendimiento (Con Filtro) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-500" /> Top 5 Bajo Rendimiento
            </h3>
            <select
              value={top5Metric}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setTop5Metric(e.target.value as "avg" | "c1" | "c2" | "c3")}
              className="text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="avg">Promedio General</option>
              <option value="c1">Persistente (C1)</option>
              <option value="c2">Competente (C2)</option>
              <option value="c3">Observador (C3)</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
                  <th className="pb-2 font-medium">Alumno</th>
                  <th className="pb-2 text-right font-medium">Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {top5LowPerformers.map((student, idx) => (
                  <tr key={idx} className="border-b last:border-0 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-2 text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={student.name}>
                      {idx + 1}. {student.name}
                    </td>
                    <td className="py-2 text-right font-bold" style={{ color: student.color }}>
                      {student.value}
                    </td>
                  </tr>
                ))}
                {top5LowPerformers.length === 0 && (
                  <tr><td colSpan={2} className="text-center py-4 text-slate-400">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: PROMEDIO DE ALUMNO (REEMPLAZO) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
              <UserCheck size={16} className="text-indigo-500" /> Detalle de Alumno
            </h3>
            
            <select
              value={selectedStudentId || ""}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="w-full text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              {filtered.length === 0 && <option value="">Sin alumnos</option>}
              {filtered.map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>

            {selectedStudentData ? (
              <div className="flex flex-col items-center justify-center py-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide font-semibold mb-1">Promedio General</span>
                <div 
                  className="text-6xl font-extrabold tracking-tighter transition-colors duration-300"
                  style={{ color: selectedStudentData.average < 3.45 ? '#ef4444' : selectedStudentData.average < 6.5 ? '#f59e0b' : '#10b981' }}
                >
                  {selectedStudentData.average.toFixed(2)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
                    selectedStudentData.average < 3.45 ? 'bg-rose-500' : 
                    selectedStudentData.average < 6.5 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    {selectedStudentData.calculatedStatus}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({selectedStudentData.cant_evaluaciones} eval.)
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                Seleccione un alumno
              </div>
            )}
          </div>
          
          {/* Decoración de fondo sutil */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

      {/* SECCIÓN COLLAPSABLE: Flujo y Leyenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagrama de Flujo */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => { setShowFlowDiagram(!showFlowDiagram); setFlowCollapsed(false); }}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="text-indigo-500" size={24} />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Flujo de Evaluación</h3>
            </div>
            <ChevronDown className={`transform transition-transform ${showFlowDiagram ? 'rotate-180' : ''}`} size={20} />
          </button>

          {showFlowDiagram && !flowCollapsed && (
            <div className="p-5 pt-0 animate-slide-down">
              <div className="grid grid-cols-5 gap-3 text-center">
                {[
                  { icon: "🎮", title: "1. Kahoot!", desc: "Pregunta gamificada" },
                  { icon: "📝", title: "2. ClassDojo", desc: "Registrar C1, C2, C3" },
                  { icon: "➕", title: "3. Extras", desc: "Puntos adicionales" },
                  { icon: "📤", title: "4. Exportar", desc: "Bajar CSV" },
                  { icon: "📊", title: "5. App", desc: "Ver predicciones" }
                ].map((step, idx) => (
                  <div key={idx} className="relative p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl mb-1">{step.icon}</div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">{step.title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{step.desc}</div>
                    {idx < 4 && <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-300 dark:text-slate-600 font-bold text-lg">→</div>}
                  </div>
                ))}
              </div>
              <button onClick={() => setFlowCollapsed(true)} className="mt-3 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 mx-auto">
                <ChevronUp size={12} /> Colapsar
              </button>
            </div>
          )}
          {showFlowDiagram && flowCollapsed && (
            <div className="px-5 pb-4">
              <button onClick={() => setFlowCollapsed(false)} className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                <ChevronDown size={12} /> Expandir flujo
              </button>
            </div>
          )}
        </div>

        {/* Leyenda de Competencias */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setStatsCollapsed(!statsCollapsed)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="text-indigo-500" size={24} />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Leyenda de Competencias</h3>
            </div>
            <ChevronDown className={`transform transition-transform ${statsCollapsed ? '' : 'rotate-180'}`} size={20} />
          </button>

          {!statsCollapsed && (
            <div className="p-5 pt-0 space-y-4 animate-slide-down">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="text-blue-600 dark:text-blue-400" size={16} />
                    <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Persistente (C1)</h4>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 leading-snug">Obtiene información del texto.</p>
                  <div className="text-[10px] font-mono mt-2 text-slate-600 dark:text-slate-300">Máx: 3 pts</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1">
                    <BrainCircuit className="text-purple-600 dark:text-purple-400" size={16} />
                    <h4 className="font-bold text-purple-800 dark:text-purple-300 text-sm">Competente (C2)</h4>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-400 leading-snug">Infiere e interpreta información.</p>
                  <div className="text-[10px] font-mono mt-2 text-slate-600 dark:text-slate-300">Máx: 3 pts</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="text-orange-600 dark:text-orange-400" size={16} />
                    <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm">Observador (C3)</h4>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-400 leading-snug">Reflexiona y evalúa el texto.</p>
                  <div className="text-[10px] font-mono mt-2 text-slate-600 dark:text-slate-300">Máx: 3 pts</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs justify-center pt-2 border-t dark:border-slate-700">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded font-medium text-slate-600 dark:text-slate-300">Promedio</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-bold">≥ 6.5: Aprobado</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold">3.45-6.49: Riesgo</span>
                <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded font-bold">&lt; 3.45: Desaprobado</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles: Búsqueda, Filtro Estado, Filtro Sección y Botones */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        
        {/* Filtro por Estado */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value as "all" | "Aprobado" | "En Riesgo" | "Desaprobado"); setPage(1); }}
            className="py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="Aprobado">Aprobados</option>
            <option value="En Riesgo">En Riesgo</option>
            <option value="Desaprobado">Desaprobados</option>
          </select>
        </div>

        {/* Nuevo Filtro por Sección */}
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-slate-500" />
          <select
            value={sectionFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => { setSectionFilter(e.target.value); setPage(1); }}
            className="py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">Todas las secciones</option>
            {availableSections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setUploadOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow text-sm">
            <Upload className="w-4 h-4" /> Subir reporte
          </Button>
          <Button onClick={() => exportStudentsExcel(filtered)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition shadow text-sm">
            <FileSpreadsheet size={16} /> Exportar Excel
          </Button>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap flex items-center">
          {total} alumnos
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <table className="min-w-full">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Alumno</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Eval.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                Persistente (C1)
                <Tooltip text="Obtiene información del texto escrito." />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
                Competente (C2)
                <Tooltip text="Infiere e interpreta información." />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">
                Observador (C3)
                <Tooltip text="Reflexiona y evalúa el texto." />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginated.map((s, idx) => {
              const count = s.cant_evaluaciones || 0;
              const avg = count > 0 ? (s.score_total || 0) / count : 0;
              let statusColor = "bg-slate-100 text-slate-500";
              let statusText = "Sin datos";
              
              if (count > 0) {
                if (avg >= 6.5) { statusColor = "bg-emerald-100 text-emerald-700"; statusText = "Aprobado"; }
                else if (avg >= 3.45) { statusColor = "bg-amber-100 text-amber-700"; statusText = "En Riesgo"; }
                else { statusColor = "bg-rose-100 text-rose-700"; statusText = "Desaprobado"; }
              }

              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-500">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{s.first_name} {s.last_name}</td>
                  <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-300">{count}</td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-indigo-600 dark:text-indigo-400">{s.score_total?.toFixed(1) || "0.0"}</td>
                  <td className="px-4 py-3 text-sm text-center text-blue-600 dark:text-blue-300">{s.persistente_total?.toFixed(1) || "0.0"}</td>
                  <td className="px-4 py-3 text-sm text-center text-purple-600 dark:text-purple-300">{s.competente_total?.toFixed(1) || "0.0"}</td>
                  <td className="px-4 py-3 text-sm text-center text-orange-600 dark:text-orange-300">{s.observador_total?.toFixed(1) || "0.0"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button 
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1.5 transition shadow-sm" 
                        onClick={() => setEditStudent(s)} 
                        title="Editar"
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button 
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1.5 transition shadow-sm" 
                        onClick={() => setConfirmDelete(s)} 
                        title="Eliminar"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                      <button 
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1.5 transition shadow-sm" 
                        onClick={() => { setSelectedStudent(s.id); setPredictOpen(true); }} 
                        title="Predecir"
                      >
                        <Cpu size={14}/> Predecir
                      </button>
                      {count > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>{statusText}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">No hay estudiantes que coincidan con los filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">Página <span className="font-bold text-slate-900 dark:text-white">{page}</span> de <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span></div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft size={20} /></button>
            <button className="p-2 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={20} /></button>
          </div>
        </div>
      )}
      
      {editStudent && <EditModal student={editStudent} isOpen={!!editStudent} onClose={() => setEditStudent(null)} onSave={handleEditSave} />}
      {confirmDelete && <ConfirmModal studentId={confirmDelete.id} isOpen={!!confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={handleDeleteConfirm} title="Eliminar estudiante" description={`¿Seguro que quieres eliminar a ${confirmDelete.first_name} ${confirmDelete.last_name}?`} />}
      {uploadOpen && <UploadReportModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ["students"] })} />}
      {predictOpen && selectedStudent !== null && <PredictModal isOpen={predictOpen} onClose={() => { setPredictOpen(false); setSelectedStudent(null); }} studentId={selectedStudent} />}
    </div>
  );
}