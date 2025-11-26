/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import type { Student } from "@/types/api";

interface EditModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Partial<Student>) => Promise<void>;
}

export default function EditModal({ student, isOpen, onClose, onSave }: EditModalProps) {
  // Inicializa con los campos reales que tu backend maneja.
  const [form, setForm] = useState<Partial<Student>>({
    first_name: "",
    last_name: "",
    // campos acumulados que ya tienes en api_student
    score_total: 0,
    cant_evaluaciones: 0,
    persistente_total: 0,
    competente_total: 0,
    observador_total: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!student) return;
    setForm({
      first_name: student.first_name,
      last_name: student.last_name,
      // si tu Student no tiene alguno de estos, quita la línea correspondiente
      score_total: student.score_total ?? 0,
      cant_evaluaciones: student.cant_evaluaciones ?? 0,
      persistente_total: (student as any).persistente_total ?? 0,
      competente_total: (student as any).competente_total ?? 0,
      observador_total: (student as any).observador_total ?? 0,
    });
  }, [student]);

  if (!isOpen) return null;

  const handleChange = (key: keyof Partial<Student>, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // envía SOLO los campos que quieras actualizar
      const payload: Partial<Student> = {
        first_name: form.first_name,
        last_name: form.last_name,
        score_total: form.score_total,
        cant_evaluaciones: form.cant_evaluaciones,
        // si quieres permitir editar los acumulados:
        persistente_total: (form as any).persistente_total,
        competente_total: (form as any).competente_total,
        observador_total: (form as any).observador_total,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error guardando cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg transform transition-all scale-100">
        <h3 className="text-lg font-semibold mb-3">Editar estudiante</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nombres</label>
            <input
              className="w-full p-2 border rounded"
              value={form.first_name ?? ""}
              onChange={(e) => handleChange("first_name", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Apellidos</label>
            <input
              className="w-full p-2 border rounded"
              value={form.last_name ?? ""}
              onChange={(e) => handleChange("last_name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Puntaje total</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={form.score_total ?? 0}
                onChange={(e) => handleChange("score_total", Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Cant. eval.</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={form.cant_evaluaciones ?? 0}
                onChange={(e) => handleChange("cant_evaluaciones", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Campos acumulados (opcional de mostrar/editar) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm font-medium">Persistente</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={(form as any).persistente_total ?? 0}
                onChange={(e) => handleChange("persistente_total" as any, Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Competente</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={(form as any).competente_total ?? 0}
                onChange={(e) => handleChange("competente_total" as any, Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Observador</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={(form as any).observador_total ?? 0}
                onChange={(e) => handleChange("observador_total" as any, Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 rounded border" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className="px-3 py-1 rounded bg-indigo-600 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}