import { apiClient } from './client';
import { AnalyticsOverview, UsersListResponse, SearchLogsResponse } from '../types';

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const res = await apiClient.get<AnalyticsOverview>('/api/admin/analytics/overview');
    return res.data;
  },

  getUsersList: async (params?: { limit?: number; offset?: number; search?: string }): Promise<UsersListResponse> => {
    const res = await apiClient.get<UsersListResponse>('/api/admin/analytics/users-list', { params });
    return res.data;
  },

  getAllSearches: async (params?: {
    limit?: number;
    offset?: number;
    search?: string;
    platform?: string;
    only_success?: boolean;
    only_empty?: boolean;
  }): Promise<SearchLogsResponse> => {
    const res = await apiClient.get<SearchLogsResponse>('/api/admin/analytics/all-searches', { params });
    return res.data;
  },
};
