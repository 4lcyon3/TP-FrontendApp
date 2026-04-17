import { useMemo, useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/hooks/AuthContext";
import type { Student } from "@/types/api";
import { exportStudentsExcel } from "../utils/exportStudents";
import { 
  FileSpreadsheet, Edit, Trash2, Upload, Cpu, 
  Search, ChevronLeft, ChevronRight, Info, 
  TrendingUp, BookOpen, Award, BrainCircuit, 
  ExternalLink, Gamepad2, ClipboardCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditModal from "@/utils/EditModals";
import ConfirmModal from "@/utils/ConfirmModal";
import UploadReportModal from "@/utils/UploadReportModal";
import { useQueryClient } from "@tanstack/react-query";
import PredictModal from "@/utils/PredictModal";
import { Tooltip } from "@/utils/TooltipProps";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";

export default function StudentsPage() {
  const { data: allStudents = [], isLoading, isError, updateStudent, deleteStudent } = useStudents();
  const { user } = useAuth();
  
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showFlowDiagram, setShowFlowDiagram] = useState(false);

  // Modal states (Lógica original preservada)
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

  // Lógica original de búsqueda
  const filtered = useMemo(() => {
    if (!q) return studentsForTeacher;
    const term = q.toLowerCase();
    return studentsForTeacher.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term)
    );
  }, [q, studentsForTeacher]);

  // Estadísticas para la gráfica
  const statsData = useMemo(() => {
    let approved = 0, risk = 0, failed = 0;
    studentsForTeacher.forEach(s => {
      const count = s.cant_evaluaciones || 0;
      if (count === 0) return;
      const avg = (s.score_total || 0) / count;
      if (avg >= 2.75) approved++;
      else if (avg >= 1.90) risk++;
      else failed++;
    });
    return [
      { name: 'Aprobados', value: approved, color: '#10b981' },
      { name: 'En Riesgo', value: risk, color: '#f59e0b' },
      { name: 'Desaprobados', value: failed, color: '#ef4444' },
    ];
  }, [studentsForTeacher]);

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
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header con Título y Enlaces a Herramientas Externas */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Estudiantes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Lista de alumnos a tu cargo y análisis de comprensión lectora.
          </p>
        </div>
        <div className="flex gap-3">
          <a 
            href="https://kahoot.it" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium border border-purple-200 dark:border-purple-800"
          >
            <Gamepad2 size={18} />
            Abrir Kahoot!
            <ExternalLink size={14} />
          </a>
          <a 
            href="https://classdojo.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200 dark:border-green-800"
          >
            <ClipboardCheck size={18} />
            Abrir ClassDojo
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Diagrama de Flujo (Condicional) */}
      {showFlowDiagram && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-indigo-100 dark:border-slate-700 animate-slide-down">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="text-indigo-500" />
            Flujo de Evaluación Sugerido
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            {[
              { icon: "🎮", title: "1. Kahoot!", desc: "Realizar pregunta gamificada" },
              { icon: "📝", title: "2. ClassDojo", desc: "Registrar puntajes C1, C2, C3" },
              { icon: "➕", title: "3. Extras", desc: "Sumar puntos adicionales" },
              { icon: "📤", title: "4. Exportar", desc: "Bajar CSV desde ClassDojo" },
              { icon: "📊", title: "5. Esta App", desc: "Subir CSV y ver predicciones" }
            ].map((step, idx) => (
              <div key={idx} className="relative p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{step.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{step.desc}</div>
                {idx < 4 && <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-300 dark:text-slate-600 font-bold">→</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas de Información de Competencias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-blue-600 dark:text-blue-400" size={20} />
            <h4 className="font-bold text-blue-800 dark:text-blue-300">Persistente (C1)</h4>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
            Obtiene información del texto escrito. Muestra constancia.
          </p>
          <div className="text-xs font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded inline-block text-slate-600 dark:text-slate-300">
            Máx: 3 pts/prueba
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="text-purple-600 dark:text-purple-400" size={20} />
            <h4 className="font-bold text-purple-800 dark:text-purple-300">Competente (C2)</h4>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">
            Infiere e interpreta información del texto.
          </p>
          <div className="text-xs font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded inline-block text-slate-600 dark:text-slate-300">
            Máx: 3 pts/prueba
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <Info className="text-orange-600 dark:text-orange-400" size={20} />
            <h4 className="font-bold text-orange-800 dark:text-orange-300">Observador (C3)</h4>
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-400 mb-2">
            Reflexiona y evalúa la forma y contenido del texto.
          </p>
          <div className="text-xs font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded inline-block text-slate-600 dark:text-slate-300">
            Máx: 3 pts/prueba
          </div>
        </div>
      </div>

      {/* Escala de Puntaje */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-sm">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Info size={16} />
          <span className="font-semibold">Escala de Evaluación:</span>
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">Total Máx: 12 pts (Acumulado)</span>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">≥ 2.75 prom: Aprobado</span>
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">1.90 - 2.74 prom: Riesgo</span>
          <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-medium">&lt; 1.90 prom: Desaprobado</span>
        </div>
      </div>

      {/* Controles: Búsqueda y Botones de Acción (Movidos abajo visualmente o mantenidos arriba según preferencia, aquí integrados) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setUploadOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow text-sm">
            <Upload className="w-4 h-4" />
            Subir reporte CSV
          </Button>
          <Button
            onClick={() => exportStudentsExcel(studentsForTeacher)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition shadow text-sm"
          >
            <FileSpreadsheet size={16} />
            Exportar Excel
          </Button>
          <button 
            onClick={() => setShowFlowDiagram(!showFlowDiagram)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <BookOpen size={16} />
            {showFlowDiagram ? 'Ocultar Flujo' : 'Ver Flujo'}
          </button>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
          {total} alumnos encontrados
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
                <Tooltip
                  text="Obtiene información del texto escrito. Rec: Si el promedio es bajo, practicar identificación de datos explícitos."
                />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
                Competente (C2)
                <Tooltip text="Infiere e interpreta información. Rec: Si el promedio es bajo, trabajar en inferencias simples y causas-efectos." />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">
                Observador (C3)
                <Tooltip text="Reflexiona y evalúa. Rec: Si el promedio es bajo, fomentar opiniones críticas y comparaciones." />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginated.map((s, idx) => {
              // Cálculo de estado para color de fila o badge
              const count = s.cant_evaluaciones || 0;
              const avg = count > 0 ? (s.score_total || 0) / count : 0;
              let statusColor = "bg-slate-100 text-slate-500";
              let statusText = "Sin datos";
              
              if (count > 0) {
                if (avg >= 2.75) { statusColor = "bg-emerald-100 text-emerald-700"; statusText = "Aprobado"; }
                else if (avg >= 1.90) { statusColor = "bg-amber-100 text-amber-700"; statusText = "En Riesgo"; }
                else { statusColor = "bg-rose-100 text-rose-700"; statusText = "Desaprobado"; }
              }

              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-500">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{s.first_name} {s.last_name}</td>
                  <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-300">{count}</td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-indigo-600 dark:text-indigo-400">{s.score_total?.toFixed(2) || "0.00"}</td>
                  <td className="px-4 py-3 text-sm text-center text-blue-600 dark:text-blue-300">{s.persistente_total?.toFixed(2) || "0.00"}</td>
                  <td className="px-4 py-3 text-sm text-center text-purple-600 dark:text-purple-300">{s.competente_total?.toFixed(2) || "0.00"}</td>
                  <td className="px-4 py-3 text-sm text-center text-orange-600 dark:text-orange-300">{s.observador_total?.toFixed(2) || "0.00"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1 transition"
                        onClick={() => setEditStudent(s)}
                        title="Editar datos"
                      >
                        <Edit size={12} /> 
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1 transition"
                        onClick={() => setConfirmDelete(s)}
                        title="Eliminar estudiante"
                      >
                        <Trash2 size={12} /> 
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 transition shadow-sm"
                        onClick={() => {
                          setSelectedStudent(s.id);
                          setPredictOpen(true);
                        }}
                        title="Ver predicción y recomendaciones"
                      >
                        <Cpu size={12}/> Predecir
                      </button>
                      {count > 0 && (
                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                           {statusText}
                         </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay estudiantes que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación Simplificada (Solo Flechas) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Página <span className="font-bold text-slate-900 dark:text-white">{page}</span> de <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="p-2 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Gráfica de Barras (Debajo de la tabla y paginación) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="text-indigo-500" />
          Resumen de Rendimiento del Aula
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                {statsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modales (Lógica original preservada intacta) */}
      {editStudent && (
        <EditModal
          student={editStudent}
          isOpen={!!editStudent}
          onClose={() => setEditStudent(null)}
          onSave={handleEditSave}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          studentId={confirmDelete.id}
          isOpen={!!confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Eliminar estudiante"
          description={`¿Seguro que quieres eliminar a ${confirmDelete.first_name} ${confirmDelete.last_name}?`}
        />
      )}

      {uploadOpen && (
        <UploadReportModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
          }}
        />
      )}
      
      {predictOpen && selectedStudent !== null && (
        <PredictModal
          isOpen={predictOpen}
          onClose={() => {
            setPredictOpen(false);
            setSelectedStudent(null);
          }}
          studentId={selectedStudent}
        />
      )}
    </div>
  );
}