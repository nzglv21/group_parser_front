import React, { useState } from 'react';
import { Card, Typography, Form, Input, Button, message, Space, Descriptions, Tag, Alert } from 'antd';
import {
  SaveOutlined,
  ApiOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  getStoredCredentials,
  setStoredCredentials,
  getStoredBaseUrl,
  updateApiBaseUrl,
} from '../api/client';
import { healthApi } from '../api/healthApi';
import { HealthCheckResponse } from '../types';

const { Title, Text, Paragraph } = Typography;

export const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [testingHealth, setTestingHealth] = useState(false);
  const [testResult, setTestResult] = useState<HealthCheckResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const creds = getStoredCredentials();
  const currentBaseUrl = getStoredBaseUrl();

  const handleSave = (values: { username: string; password: string; baseUrl?: string }) => {
    setStoredCredentials(values.username.trim(), values.password.trim());
    updateApiBaseUrl(values.baseUrl ? values.baseUrl.trim() : '');
    message.success('Настройки успешно сохранены');
  };

  const runDiagnostics = async () => {
    setTestingHealth(true);
    setTestError(null);
    try {
      const res = await healthApi.checkHealth();
      setTestResult(res);
      message.success('Диагностика успешно выполнена');
    } catch (err: any) {
      setTestResult(null);
      setTestError(err.message || 'Ошибка подключения к серверу');
      message.error('Сбой проверки подключения');
    } finally {
      setTestingHealth(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {/* Title */}
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Настройки системы & Подключение
        </Title>
        <Text type="secondary">
          Конфигурация параметров авторизации FastAPI и адреса сервера API
        </Text>
      </div>

      {/* Auth Card */}
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
            <span>Учетные данные и Сервер API</span>
          </Space>
        }
        style={{ borderRadius: 16 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: creds.username || 'nzglv',
            password: creds.password || 'nzglv',
            baseUrl: currentBaseUrl || '',
          }}
          onFinish={handleSave}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              label="Логин администратора (ADMIN_USERNAME)"
              name="username"
              rules={[{ required: true, message: 'Укажите логин' }]}
            >
              <Input placeholder="nzglv" />
            </Form.Item>

            <Form.Item
              label="Пароль администратора (ADMIN_PASSWORD)"
              name="password"
              rules={[{ required: true, message: 'Укажите пароль' }]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>
          </div>

          <Form.Item
            label="API Base URL (Адрес бэкенда)"
            name="baseUrl"
            extra="Оставьте пустым для локальной разработки через Vite Proxy. Если админка на другом домене, укажите, например: http://5.129.238.27:8000"
          >
            <Input prefix={<ApiOutlined />} placeholder="http://5.129.238.27:8000" />
          </Form.Item>

          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            Сохранить настройки
          </Button>
        </Form>
      </Card>

      {/* Diagnostics Card */}
      <Card
        title={
          <Space>
            <ApiOutlined style={{ color: '#52c41a' }} />
            <span>Диагностика подключения и сервисов</span>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={runDiagnostics} loading={testingHealth}>
            Проверить сервер
          </Button>
        }
        style={{ borderRadius: 16 }}
      >
        <Paragraph type="secondary">
          Проверка эндпоинта <code>/health</code> для тестирования отклика базы данных PostgreSQL,
          клиента Telethon Telegram и токенов VK.
        </Paragraph>

        {testError && (
          <Alert
            message="Ошибка подключения"
            description={testError}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {testResult && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Общий статус системы">
              <Tag color={testResult.status === 'ok' || testResult.status === 'healthy' ? 'success' : 'warning'}>
                {testResult.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="База данных PostgreSQL">
              <Space>
                <Tag color={testResult.services?.database?.status === 'online' ? 'green' : 'red'}>
                  {testResult.services?.database?.status || 'unknown'}
                </Tag>
                {testResult.services?.database?.latency_ms !== undefined && (
                  <span>Задержка: {testResult.services.database.latency_ms} ms</span>
                )}
                {testResult.services?.database?.total_trips !== undefined && (
                  <span>Всего поездок: {testResult.services.database.total_trips}</span>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Парсер Telegram">
              <Tag color={testResult.services?.telegram_parser?.status === 'online' ? 'green' : 'orange'}>
                {testResult.services?.telegram_parser?.status || 'disconnected'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Парсер ВКонтакте">
              <Tag color={testResult.services?.vk_parser?.status === 'online' ? 'green' : 'orange'}>
                {testResult.services?.vk_parser?.status || 'unknown'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Бот ВКонтакте">
              <Tag color={testResult.services?.vk_bot?.status === 'online' ? 'green' : 'orange'}>
                {testResult.services?.vk_bot?.status || 'unknown'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Серверное время">
              {testResult.server_time || '-'} ({testResult.server_timezone || '-'})
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
};
