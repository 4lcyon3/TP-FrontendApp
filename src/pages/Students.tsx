import { useMemo, useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/hooks/AuthContext";
import type { Student } from "@/types/api";
import { exportStudentsExcel } from "../utils/exportStudents";
import { FileSpreadsheet, Edit, Trash2, Upload, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditModal  from "@/utils/EditModals";
import ConfirmModal from "@/utils/ConfirmModal";
import UploadReportModal from "@/utils/UploadReportModal";
import { useQueryClient } from "@tanstack/react-query";
import PredictModal from "@/utils/PredictModal";
import Tooltip from "@/utils/TooltipProps";


export default function StudentsPage() {
  const { data: allStudents = [], isLoading, isError, updateStudent, deleteStudent } = useStudents();
  const { user } = useAuth();
  
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const studentsForTeacher = useMemo(() => {
    if (!user) return [];
    return allStudents.filter((s) => {
      if (typeof s.teacher === "number") return s.teacher === user.id;
      return s.teacher?.id === user.id;
    });
  }, [allStudents, user]);

  const filtered = useMemo(() => {
    if (!q) return studentsForTeacher;
    const term = q.toLowerCase();
    return studentsForTeacher.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term)
    );
  }, [q, studentsForTeacher]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

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

  if (isLoading) return <div>Cargando estudiantes...</div>;
  if (isError) return <div>Error cargando estudiantes</div>;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Estudiantes</h1>
        <p className="text-sm text-gray-600">Lista de alumnos a tu cargo</p>
      </header>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="p-2 border rounded"
          />
        </div>
        <Button onClick={() => setUploadOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow">
          <Upload className="w-5 h-5" />
          Subir reporte
        </Button>
        <Button
          onClick={() => exportStudentsExcel(studentsForTeacher)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <FileSpreadsheet size={18} />
          Exportar Excel
        </Button>
        <div className="text-sm text-gray-600">{total} alumnos encontrados</div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-sm">#</th>
              <th className="px-4 py-3 text-left text-sm">Alumno</th>
              <th className="px-4 py-3 text-left text-sm">Cant. eval.</th>
              <th className="px-4 py-3 text-left text-sm">Puntaje Total</th>
              <th className="px-4 py-3 text-left text-sm">Persistente <Tooltip text="Obtiene información del texto escrito (C1)" /></th>
              <th className="px-4 py-3 text-left text-sm">Competente <Tooltip text="Infiere e interpreta información del texto (C2)" /></th>
              <th className="px-4 py-3 text-left text-sm">Observador <Tooltip text="Reflexiona y evalúa la forma, el contenido y el contexto del texto escrito (C3)" /></th>
              <th className="px-4 py-3 text-left text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s, idx) => (
              <tr key={s.id} className="border-t dark:border-gray-700">
                <td className="px-4 py-3 text-sm">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-4 py-3 text-sm">{s.first_name} {s.last_name}</td>
                <td className="px-4 py-3 text-sm">{s.cant_evaluaciones ?? 0}</td>
                <td className="px-4 py-3 text-sm">{s.score_total ?? 0}</td>
                <td className="px-4 py-3 text-sm">{s.persistente_total ?? 0}</td>
                <td className="px-4 py-3 text-sm">{s.competente_total ?? 0}</td>
                <td className="px-4 py-3 text-sm">{s.observador_total ?? 0}</td>
                <td className="px-4 py-3 text-sm flex gap-2">
                  <button
                    className="px-2 py-1 text-sm bg-indigo-600 text-white rounded flex items-center gap-1"
                    onClick={() => setEditStudent(s)}
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-red-600 text-white rounded flex items-center gap-1"
                    onClick={() => setConfirmDelete(s)}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-green-600 text-white rounded flex items-center gap-1"
                      onClick={() => {
                      setSelectedStudent(s.id);
                      setPredictOpen(true);
                    }}
                  >
                    <Cpu size={14}/>
                    Predecir
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  No hay estudiantes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>Página {page} de {totalPages}</div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >Anterior</button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >Siguiente</button>
        </div>
      </div>

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
          onClose={() => setPredictOpen(false)}
          studentId={selectedStudent}
        />
      )}
    </div>
  );
}