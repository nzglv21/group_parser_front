import { apiClient } from './client';
import { Trip, SearchTripsParams } from '../types';

const ensureTripList = (data: any): Trip[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.trips)) return data.trips;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
  }
  return [];
};

export const tripsApi = {
  getTrips: async (includeCompleted = true): Promise<Trip[]> => {
    const res = await apiClient.get<Trip[]>('/trips/', {
      params: { include_completed: includeCompleted },
    });
    return ensureTripList(res.data);
  },

  searchTrips: async (params: SearchTripsParams): Promise<Trip[]> => {
    const res = await apiClient.get<Trip[]>('/trips/search', {
      params,
    });
    return ensureTripList(res.data);
  },

  deleteTrip: async (tripId: number): Promise<{ status: string; deleted_id: number }> => {
    const res = await apiClient.delete<{ status: string; deleted_id: number }>(`/trips/${tripId}`);
    return res.data;
  },
};
