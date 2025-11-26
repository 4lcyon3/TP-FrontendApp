import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStudents, updateStudent, deleteStudent } from "@/api/students";
import type { Student } from "@/types/api";

export const STUDENTS_KEY = ["students"];

export function useStudents() {
  const qc = useQueryClient();

  const q = useQuery<Student[], Error>({
    queryKey: STUDENTS_KEY,
    queryFn: fetchStudents,
    staleTime: 1000 * 60 * 2,
  });

  const upd = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Student> }) =>
      updateStudent(id, payload),
    onSuccess: () => qc.invalidateQueries(STUDENTS_KEY),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteStudent(id),
    onSuccess: () => qc.invalidateQueries(STUDENTS_KEY),
  });

  return {
    ...q,
    updateStudent: upd,
    deleteStudent: remove,
  };
}