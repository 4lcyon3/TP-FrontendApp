import { useState } from "react";

interface ConfirmModalProps {
  studentId: number;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (id: number) => Promise<void>;
  title?: string;
  description?: string;
}

export default function ConfirmModal({
  studentId,
  isOpen,
  onCancel,
  onConfirm,
  title = "Dar de baja alumno",
  description = "¿Estás seguro que quieres eliminar a este alumno?",
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const handle = async () => {
    setLoading(true);
    try {
      await onConfirm(studentId);
      onCancel();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>

        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={handle} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}