import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Alert, Typography } from 'antd';
import { LockOutlined, UserOutlined, ApiOutlined } from '@ant-design/icons';
import { getStoredCredentials, setStoredCredentials, getStoredBaseUrl, updateApiBaseUrl } from '../api/client';
import { healthApi } from '../api/healthApi';

const { Text } = Typography;

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const creds = getStoredCredentials();
  const currentBaseUrl = getStoredBaseUrl();

  const handleFinish = async (values: { username: string; password: string; baseUrl?: string }) => {
    setLoading(true);
    try {
      setStoredCredentials(values.username.trim(), values.password.trim());
      if (values.baseUrl !== undefined) {
        updateApiBaseUrl(values.baseUrl.trim());
      }

      await healthApi.checkHealth();
      message.success('Успешная авторизация в системе');
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        message.error('Неверный логин или пароль администратора');
      } else {
        message.warning('Учетные данные сохранены');
        onSuccess();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <LockOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          Авторизация администратора
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Alert
        message="HTTP Basic Auth"
        description="Для работы с защищенным API введите данные администратора (по умолчанию: nzglv / nzglv)."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          username: creds.username || 'nzglv',
          password: creds.password || 'nzglv',
          baseUrl: currentBaseUrl,
        }}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Имя пользователя"
          name="username"
          rules={[{ required: true, message: 'Введите логин' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="nzglv" />
        </Form.Item>

        <Form.Item
          label="Пароль"
          name="password"
          rules={[{ required: true, message: 'Введите пароль' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
        </Form.Item>

        <Form.Item
          label="API Base URL"
          name="baseUrl"
          extra="Оставьте пустым для проксирования через Vite или укажите: http://5.129.238.27:8000"
        >
          <Input prefix={<ApiOutlined />} placeholder="http://5.129.238.27:8000" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Войти и проверить
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
