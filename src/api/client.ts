import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL_KEY = 'group_parser_api_base_url';
const ADMIN_USERNAME_KEY = 'group_parser_admin_username';
const ADMIN_PASSWORD_KEY = 'group_parser_admin_password';

export const BACKEND_URL = 'http://5.129.238.27:8000';

export const getStoredBaseUrl = (): string => {
  const stored = localStorage.getItem(API_BASE_URL_KEY);
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, '');
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return BACKEND_URL;
};

export const setStoredBaseUrl = (url: string) => {
  if (url) {
    localStorage.setItem(API_BASE_URL_KEY, url);
  } else {
    localStorage.removeItem(API_BASE_URL_KEY);
  }
};

export const getStoredCredentials = () => {
  const username = localStorage.getItem(ADMIN_USERNAME_KEY) || 'nzglv';
  const password = localStorage.getItem(ADMIN_PASSWORD_KEY) || 'nzglv';
  return { username, password };
};

export const setStoredCredentials = (username: string, pass: string) => {
  localStorage.setItem(ADMIN_USERNAME_KEY, username);
  localStorage.setItem(ADMIN_PASSWORD_KEY, pass);
};

export const clearStoredCredentials = () => {
  localStorage.removeItem(ADMIN_USERNAME_KEY);
  localStorage.removeItem(ADMIN_PASSWORD_KEY);
};

export const apiClient = axios.create({
  baseURL: getStoredBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

export const updateApiBaseUrl = (newUrl: string) => {
  setStoredBaseUrl(newUrl);
  apiClient.defaults.baseURL = newUrl || '';
};

// Request interceptor: add Basic Auth header
apiClient.interceptors.request.use(
  (config) => {
    const { username, password } = getStoredCredentials();
    if (username && password) {
      const encoded = btoa(`${username}:${password}`);
      config.headers.Authorization = `Basic ${encoded}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Setup Error]', error);
    return Promise.reject(error);
  }
);

// Event listener for 401 Unauthorized
type AuthErrorListener = () => void;
const authErrorListeners: AuthErrorListener[] = [];

export const onAuthError = (fn: AuthErrorListener) => {
  authErrorListeners.push(fn);
  return () => {
    const idx = authErrorListeners.indexOf(fn);
    if (idx !== -1) authErrorListeners.splice(idx, 1);
  };
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    const status = error.response?.status;
    const responseData = error.response?.data;

    // Detailed console output for debugging request errors
    console.error(`[API Request Error] ${method} ${url}`, {
      status,
      statusText: error.response?.statusText,
      message: error.message,
      data: responseData,
      headers: error.response?.headers,
      config: error.config,
    });

    if (status === 401) {
      authErrorListeners.forEach((listener) => listener());
    } else if (status === 404) {
      // Handled in callers
    } else if (responseData?.detail) {
      const detail = responseData.detail;
      const errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      message.error(errorMsg);
    } else if (error.message) {
      message.error(`Ошибка сети или сервера: ${error.message}`);
    }

    return Promise.reject(error);
  }
);
