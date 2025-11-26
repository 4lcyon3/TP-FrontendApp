import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import type { Report } from '../types/api';

const fetchReports = async () => {
  const { data } = await axiosClient.get<Report[]>('reports/');
  return data;
};

export const useReports = () => {
  const qc = useQueryClient();
  return {
    ...useQuery<Report[], Error>({
      queryKey: ['reports'] as const,
      queryFn: fetchReports
    }),
    createReport: useMutation<unknown, Error, FormData | object>({
      mutationFn: async (payload: FormData | object) => {
        const { data } = await axiosClient.post('reports/', payload);
        return data;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] })
    }),
    deleteReport: useMutation<unknown, Error, number>({
      mutationFn: async (id: number) => {
        const { data } = await axiosClient.delete(`reports/${id}/`);
        return data;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] })
    })
  };
};
