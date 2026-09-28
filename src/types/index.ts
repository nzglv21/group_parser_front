// ==========================================
// Health & System
// ==========================================
export interface ServiceStatus {
  status?: string;
  latency_ms?: number;
  total_trips?: number;
  active_sources?: number;
  connected?: boolean;
  token_active?: boolean;
  group_name?: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: number;
  server_time: string;
  server_timezone: string;
  services: {
    database?: ServiceStatus;
    telegram_parser?: ServiceStatus;
    vk_parser?: ServiceStatus;
    vk_bot?: ServiceStatus;
    [key: string]: ServiceStatus | undefined;
  };
}

// ==========================================
// Trips
// ==========================================
export interface TripStop {
  id?: number;
  city_name: string;
  stop_order: number;
  arrival_time?: string | null;
}

export interface ContactItem {
  type?: 'phone' | 'telegram' | 'vk' | string;
  value?: string;
}

export interface Trip {
  id: number;
  platform_name: string;
  platform_id?: number | null;
  driver_id: number;
  departure_time: string;
  created_at?: string;
  status: string;
  car?: string | null;
  raw_text?: string | null;
  message_link?: string | null;
  tg_link?: string | null;
  vk_link?: string | null;
  contacts?: (ContactItem | string)[] | null;
  stops?: TripStop[];
}

export interface SearchTripsParams {
  from_city?: string;
  to_city?: string;
  date?: string;
  include_completed?: boolean;
}

// ==========================================
// Sources
// ==========================================
export interface Source {
  id: number;
  name: string;
  platform_name: string;
  platform_id: number;
  timezone: string;
  is_active: boolean;
  city_default?: string | null;
  url?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SourceCreate {
  name: string;
  platform_name: string;
  platform_id: number;
  timezone?: string;
  is_active?: boolean;
  city_default?: string | null;
  url?: string | null;
  notes?: string | null;
}

export interface SourceUpdate {
  name?: string;
  platform_name?: string;
  platform_id?: number;
  timezone?: string;
  is_active?: boolean;
  city_default?: string | null;
  url?: string | null;
  notes?: string | null;
}

export interface SourceByUrlRequest {
  url: string;
  city_default?: string | null;
  timezone?: string;
  notes?: string | null;
}

// ==========================================
// Distances
// ==========================================
export interface DistanceItem {
  id: number;
  city_a: string;
  city_b: string;
  duration_minutes: number;
}

export interface DistancesResponse {
  items: DistanceItem[];
  unconfigured_count: number;
  total_count: number;
}

export interface DistanceCreate {
  city_a: string;
  city_b: string;
  duration_minutes: number;
}

export interface DistanceUpdate {
  duration_minutes: number;
}

// ==========================================
// Drivers
// ==========================================
export interface DriverItem {
  driver_id: number;
  platform: string;
  total_trips: number;
  active_trips: number;
  last_trip_date?: string | null;
  car?: string | null;
  contacts?: (ContactItem | string)[] | null;
  display_name: string;
}

export interface DriversStats {
  total_drivers: number;
  active_drivers_30d: number;
  total_trips: number;
  top_platform: string;
}

export interface DriversResponse {
  items: DriverItem[];
  stats: DriversStats;
  top_drivers: DriverItem[];
}

export interface DriverTripItem {
  id: number;
  car?: string | null;
  status: string;
  departure_time?: string | null;
  created_at?: string | null;
  raw_text?: string | null;
  message_link?: string | null;
  tg_link?: string | null;
  vk_link?: string | null;
  stops?: TripStop[];
}

export interface DriverTripsResponse {
  driver_id: number;
  total: number;
  trips: DriverTripItem[];
}

// ==========================================
// Analytics & Users
// ==========================================
export interface UserItem {
  id: number;
  platform?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  created_at?: string | null;
  last_activity?: string | null;
  search_count?: number;
  sub_count?: number;
}

export interface UsersListResponse {
  users: UserItem[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface SearchLogItem {
  id: number;
  user_id: number;
  user?: {
    id?: number;
    platform?: string | null;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  platform: string;
  raw_query?: string | null;
  from_city?: string | null;
  to_city?: string | null;
  date_str?: string | null;
  results_count: number;
  created_at: string;
}

export interface SearchLogsResponse {
  searches: SearchLogItem[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface TopRouteItem {
  from_city: string;
  to_city: string;
  count: number;
  percentage?: number;
  success_rate?: number;
}

export interface TimelineDayItem {
  date: string;
  active: number;
  full: number;
  completed: number;
}

export interface AnalyticsOverview {
  status: string;
  timestamp: string;
  users: {
    total_users: number;
    tg_users: number;
    vk_users: number;
    active_24h: number;
    active_7d: number;
    new_today: number;
    new_24h: number;
    new_7d: number;
  };
  searches: {
    total_searches: number;
    searches_24h: number;
    tg_searches: number;
    vk_searches: number;
    successful_searches: number;
    empty_searches: number;
    conversion_rate: number;
    top_search_routes: TopRouteItem[];
  };
  trips: {
    total_trips: number;
    trips_24h: number;
    trips_7d: number;
    trips_by_platform: Record<string, number>;
    trips_by_status: Record<string, number>;
    top_driver_routes: TopRouteItem[];
    peak_driver_hours?: Record<string, number>;
  };
  subscriptions: {
    total_subscriptions: number;
    tg_subscriptions: number;
    vk_subscriptions: number;
    top_subscribed_routes: TopRouteItem[];
  };
  demand_supply: {
    registration_timeline: Array<{ date: string; count: number }>;
    hourly_activity: Record<string, number>;
  };
  trips_status_timeline: {
    timeline: TimelineDayItem[];
    days: number;
  };
}
