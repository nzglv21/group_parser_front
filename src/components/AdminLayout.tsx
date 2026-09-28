import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Dropdown, theme, Tooltip, Typography } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  ApiOutlined,
  TeamOutlined,
  CompassOutlined,
  UserOutlined,
  SearchOutlined,
  SettingOutlined,
  LogoutOutlined,
  KeyOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LoginModal } from './LoginModal';
import { getStoredCredentials, clearStoredCredentials, onAuthError } from '../api/client';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ darkMode, onToggleTheme }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const creds = getStoredCredentials();

  useEffect(() => {
    const unbind = onAuthError(() => {
      setLoginModalOpen(true);
    });
    return () => {
      unbind();
    };
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Дашборд & Мониторинг',
    },
    {
      key: '/trips',
      icon: <CarOutlined />,
      label: 'Поездки',
    },
    {
      key: '/sources',
      icon: <ApiOutlined />,
      label: 'Источники парсинга',
    },
    {
      key: '/drivers',
      icon: <TeamOutlined />,
      label: 'Водители & Лидеры',
    },
    {
      key: '/distances',
      icon: <CompassOutlined />,
      label: 'Расстояния городов',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Пользователи',
    },
    {
      key: '/searches',
      icon: <SearchOutlined />,
      label: 'Логи поисков',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Настройки системы',
    },
  ];

  const handleMenuClick = (info: { key: string }) => {
    navigate(info.key);
  };

  const handleLogout = () => {
    clearStoredCredentials();
    setLoginModalOpen(true);
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Дашборд & Мониторинг';
      case '/trips':
        return 'Поездки водителей';
      case '/sources':
        return 'Источники парсинга';
      case '/drivers':
        return 'Водители & Лидеры';
      case '/distances':
        return 'Расстояния городов';
      case '/users':
        return 'Пользователи сервиса';
      case '/searches':
        return 'Логи поисков';
      case '/settings':
        return 'Настройки системы';
      default:
        return 'Панель управления';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        style={{
          background: darkMode ? '#141414' : '#001529',
          borderRight: darkMode ? '1px solid #303030' : 'none',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            🚗
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Попутчики Admin</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Group Parser Service</div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            borderRight: 'none',
            marginTop: 8,
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Page title on left */}
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {getPageTitle()}
            </Text>
          </div>

          {/* Right actions */}
          <Space size="middle">
            <Tooltip title={darkMode ? 'Светлая тема' : 'Темная тема'}>
              <Button
                type="text"
                shape="circle"
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={onToggleTheme}
              />
            </Tooltip>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'auth',
                    icon: <KeyOutlined />,
                    label: 'Учетные данные API',
                    onClick: () => setLoginModalOpen(true),
                  },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    danger: true,
                    label: 'Сбросить авторизацию',
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Button type="dashed" style={{ borderRadius: 8 }}>
                <UserOutlined />
                <span>{creds.username || 'Админ'}</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '20px 24px',
            minHeight: 'calc(100vh - 104px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {}}
      />
    </Layout>
  );
};
