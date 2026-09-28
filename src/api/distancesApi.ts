import { apiClient } from './client';
import { DistancesResponse, DistanceCreate, DistanceUpdate, DistanceItem } from '../types';

export const distancesApi = {
  getDistances: async (): Promise<DistancesResponse> => {
    const res = await apiClient.get<DistancesResponse>('/admin/api/distances');
    return res.data;
  },

  createOrUpdateDistance: async (data: DistanceCreate): Promise<DistanceItem> => {
    const res = await apiClient.post<DistanceItem>('/admin/api/distances', data);
    return res.data;
  },

  updateDistanceDuration: async (id: number, data: DistanceUpdate): Promise<DistanceItem> => {
    const res = await apiClient.put<DistanceItem>(`/admin/api/distances/${id}`, data);
    return res.data;
  },

  deleteDistance: async (id: number): Promise<{ status: string; id: number }> => {
    const res = await apiClient.delete<{ status: string; id: number }>(`/admin/api/distances/${id}`);
    return res.data;
  },
};
