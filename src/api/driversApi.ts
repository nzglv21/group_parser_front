import { apiClient } from './client';
import { DriversResponse, DriverTripsResponse } from '../types';

export const driversApi = {
  getDrivers: async (params?: { platform?: string; search?: string }): Promise<DriversResponse> => {
    const res = await apiClient.get<DriversResponse>('/admin/api/drivers', { params });
    return res.data;
  },

  getDriverTrips: async (driverId: number, platform?: string): Promise<DriverTripsResponse> => {
    const res = await apiClient.get<DriverTripsResponse>(`/admin/api/drivers/${driverId}/trips`, {
      params: { platform },
    });
    return res.data;
  },
};
