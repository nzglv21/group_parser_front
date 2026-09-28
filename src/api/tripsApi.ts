import { apiClient } from './client';
import { Trip, SearchTripsParams } from '../types';

export const tripsApi = {
  getTrips: async (includeCompleted = true): Promise<Trip[]> => {
    const res = await apiClient.get<Trip[]>('/trips/', {
      params: { include_completed: includeCompleted },
    });
    return res.data;
  },

  searchTrips: async (params: SearchTripsParams): Promise<Trip[]> => {
    const res = await apiClient.get<Trip[]>('/trips/search', {
      params,
    });
    return res.data;
  },

  deleteTrip: async (tripId: number): Promise<{ status: string; deleted_id: number }> => {
    const res = await apiClient.delete<{ status: string; deleted_id: number }>(`/trips/${tripId}`);
    return res.data;
  },
};
