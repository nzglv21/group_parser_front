import { apiClient } from './client';
import { HealthCheckResponse } from '../types';

export const healthApi = {
  checkHealth: async (): Promise<HealthCheckResponse> => {
    const res = await apiClient.get<HealthCheckResponse>('/health');
    return res.data;
  },
};
