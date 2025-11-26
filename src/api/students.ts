import axiosClient from "@/api/axiosClient";
import type { Student } from "@/types/api";

export async function getStudents() {
  const res = await axiosClient.get("api/students/");
  return res.data;
}

export const fetchStudents = async (): Promise<Student[]> => {
  const res = await axiosClient.get<Student[]>("students/");
  return res.data;
};

export const updateStudent = async (id: number, payload: Partial<Student>): Promise<Student> => {
  const res = await axiosClient.patch<Student>(`students/${id}/`, payload);
  return res.data;
};

export const deleteStudent = async (id: number): Promise<void> => {
  await axiosClient.delete(`students/${id}/`);
};