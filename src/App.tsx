import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TripsPage } from './pages/TripsPage';
import { SourcesPage } from './pages/SourcesPage';
import { DriversPage } from './pages/DriversPage';
import { DistancesPage } from './pages/DistancesPage';
import { UsersPage } from './pages/UsersPage';
import { SearchesPage } from './pages/SearchesPage';
import { SettingsPage } from './pages/SettingsPage';

dayjs.locale('ru');

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('group_parser_dark_mode');
    return saved ? JSON.parse(saved) : true;
  });

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('group_parser_dark_mode', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 14,
          borderRadiusLG: 16,
          borderRadiusSM: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        },
        components: {
          Card: {
            borderRadiusLG: 16,
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<AdminLayout darkMode={darkMode} onToggleTheme={toggleTheme} />}
          >
            <Route index element={<DashboardPage />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="distances" element={<DistancesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="searches" element={<SearchesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
