import { apiClient } from './client';
import { Source, SourceCreate, SourceUpdate, SourceByUrlRequest } from '../types';

export const sourcesApi = {
  getSources: async (params?: { platform?: string; is_active?: boolean; search?: string }): Promise<Source[]> => {
    const res = await apiClient.get<Source[]>('/sources/', { params });
    return res.data;
  },

  getSourceById: async (id: number): Promise<Source> => {
    const res = await apiClient.get<Source>(`/sources/${id}`);
    return res.data;
  },

  createSource: async (data: SourceCreate): Promise<Source> => {
    const res = await apiClient.post<Source>('/sources/', data);
    return res.data;
  },

  createSourceByUrl: async (data: SourceByUrlRequest): Promise<Source> => {
    const res = await apiClient.post<Source>('/sources/by-url', data);
    return res.data;
  },

  updateSource: async (id: number, data: SourceUpdate): Promise<Source> => {
    const res = await apiClient.put<Source>(`/sources/${id}`, data);
    return res.data;
  },

  toggleSource: async (id: number): Promise<Source> => {
    const res = await apiClient.patch<Source>(`/sources/${id}/toggle`);
    return res.data;
  },

  deleteSource: async (id: number): Promise<void> => {
    await apiClient.delete(`/sources/${id}`);
  },
};
