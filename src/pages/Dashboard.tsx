import React, { useMemo } from "react";
import { useStudents } from "@/hooks/useStudents";
import { FaUsers, FaChartLine, FaFileAlt } from "react-icons/fa";

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center gap-4">
      <div className="p-3 rounded-md bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-300">{title}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: students = [], isLoading } = useStudents();
  const totalStudents = students.length;
  const avgScore = useMemo(() => {
    if (!students.length) return 0;
    const sum = students.reduce((s, x) => s + (Number(x.score_total) || 0), 0);
    return (sum / students.length).toFixed(1);
  }, [students]);

  const top5 = useMemo(() => {
    return [...students]
      .sort((a, b) => Number(b.score_total || 0) - Number(a.score_total || 0))
      .slice(0, 5);
  }, [students]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Resumen de progreso de tus estudiantes</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Estudiantes asignados" value={totalStudents} icon={<FaUsers />} />
        <StatCard title="Promedio (score_total)" value={avgScore} icon={<FaChartLine />} />
        <StatCard title="Reportes (esta semana)" value="—" icon={<FaFileAlt />} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Evolución (placeholder)</h2>
          <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-400 border-dashed border-2 border-gray-200 dark:border-gray-700 rounded">
            Aquí irá el gráfico grande
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">TOP 5 Alumnos</h2>
          {isLoading ? (
            <div> Cargando...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-300">
                  <th className="py-2">#</th>
                  <th>Alumno</th>
                  <th>Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((s, i) => (
                  <tr key={s.id} className="border-t dark:border-gray-700">
                    <td className="py-2">{i + 1}</td>
                    <td>{`${s.first_name} ${s.last_name}`}</td>
                    <td>{s.score_total ?? 0}</td>
                  </tr>
                ))}
                {top5.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500">No hay datos</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}