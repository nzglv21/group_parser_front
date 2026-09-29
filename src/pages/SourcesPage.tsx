import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Switch,
  Card,
  Typography,
  Modal,
  Form,
  Popconfirm,
  message,
  Select,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  LinkOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { sourcesApi } from '../api/sourcesApi';
import { Source, SourceCreate, SourceUpdate, SourceByUrlRequest } from '../types';

const { Title, Text } = Typography;

export const SourcesPage: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Modals
  const [byUrlModalOpen, setByUrlModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);

  const [byUrlForm] = Form.useForm();
  const [manualForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const data = await sourcesApi.getSources({
        platform: platformFilter !== 'all' ? platformFilter : undefined,
        is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
        search: search.trim() || undefined,
      });
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.items) ? (data as any).items : []);
      setSources(list);
    } catch (err) {
      console.error('[SourcesPage] Failed to fetch sources:', err);
      message.error('Не удалось загрузить источники');
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [platformFilter, activeFilter]);

  const handleToggle = async (source: Source) => {
    try {
      const updated = await sourcesApi.toggleSource(source.id);
      message.success(`Источник "${source.name}" ${updated.is_active ? 'включен' : 'отключен'}`);
      setSources((prev) =>
        (Array.isArray(prev) ? prev : []).map((s) => (s.id === source.id ? { ...s, is_active: updated.is_active } : s))
      );
    } catch (err) {
      console.error(`[SourcesPage] Failed to toggle source #${source.id}:`, err);
      message.error('Ошибка изменения статуса источника');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await sourcesApi.deleteSource(id);
      message.success('Источник удален');
      setSources((prev) => (Array.isArray(prev) ? prev.filter((s) => s.id !== id) : []));
    } catch (err) {
      console.error(`[SourcesPage] Failed to delete source #${id}:`, err);
      message.error('Ошибка при удалении источника');
    }
  };

  const handleByUrlSubmit = async (values: SourceByUrlRequest) => {
    setSubmitting(true);
    try {
      const created = await sourcesApi.createSourceByUrl(values);
      message.success(`Источник "${created.name}" успешно добавлен!`);
      setByUrlModalOpen(false);
      byUrlForm.resetFields();
      fetchSources();
    } catch (err: any) {
      console.error('[SourcesPage] Failed to create source by URL:', err);
      message.error(err.response?.data?.detail || 'Не удалось распознать группу по ссылке');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingSource) {
        const payload: SourceUpdate = {
          ...values,
          platform_id: values.platform_id ? Number(values.platform_id) : undefined,
        };
        await sourcesApi.updateSource(editingSource.id, payload);
        message.success('Источник обновлен');
      } else {
        const payload: SourceCreate = {
          ...values,
          platform_id: Number(values.platform_id),
        };
        await sourcesApi.createSource(payload);
        message.success('Источник создан');
      }
      setManualModalOpen(false);
      setEditingSource(null);
      manualForm.resetFields();
      fetchSources();
    } catch (err: any) {
      console.error('[SourcesPage] Failed to save source manually:', err);
      message.error(err.response?.data?.detail || 'Ошибка сохранения источника');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (source: Source) => {
    setEditingSource(source);
    manualForm.setFieldsValue({
      name: source.name,
      platform_name: source.platform_name,
      platform_id: source.platform_id,
      timezone: source.timezone,
      city_default: source.city_default,
      url: source.url,
      notes: source.notes,
      is_active: source.is_active,
    });
    setManualModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingSource(null);
    manualForm.resetFields();
    manualForm.setFieldsValue({
      platform_name: 'telegram',
      timezone: 'Asia/Yekaterinburg',
      is_active: true,
    });
    setManualModalOpen(true);
  };

  const renderPlatformText = (platformName?: string) => {
    const p = (platformName || '').toLowerCase();
    if (p.includes('tg') || p.includes('tele')) {
      return 'Telegram';
    }
    if (p.includes('vk')) {
      return 'ВКонтакте';
    }
    return platformName || 'Источник';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Платформа',
      dataIndex: 'platform_name',
      key: 'platform_name',
      width: 120,
      render: (p: string) => renderPlatformText(p),
    },
    {
      title: 'Название группы / чата',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Source) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {record.url && (
            <a
              href={record.url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: '#1677ff' }}
            >
              <LinkOutlined /> {record.url}
            </a>
          )}
        </div>
      ),
    },
    {
      title: 'Platform ID',
      dataIndex: 'platform_id',
      key: 'platform_id',
      width: 140,
      render: (pid: number) => <span style={{ fontFamily: 'monospace' }}>{pid}</span>,
    },
    {
      title: 'Город по умолчанию',
      dataIndex: 'city_default',
      key: 'city_default',
      width: 160,
      render: (city: string | null) => city || <Text type="secondary">—</Text>,
    },
    {
      title: 'Часовой пояс',
      dataIndex: 'timezone',
      key: 'timezone',
      width: 160,
      render: (tz: string) => <Text type="secondary" style={{ fontSize: 12 }}>{tz}</Text>,
    },
    {
      title: 'Активность',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (active: boolean, record: Source) => (
        <Switch
          checked={active}
          onChange={() => handleToggle(record)}
          size="small"
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 110,
      render: (_: any, record: Source) => (
        <Space size="small">
          <Tooltip title="Редактировать">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить источник?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Unified Card for Sources */}
      <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Источники парсинга
            </Title>
            <Text type="secondary">
              Управление группами Telegram и ВКонтакте, из которых собираются поездки
            </Text>
          </div>
          <Space wrap>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setByUrlModalOpen(true)}
              style={{ background: '#722ed1' }}
            >
              Быстро по ссылке
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Добавить вручную
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchSources} loading={loading}>
              Обновить
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <Input
            placeholder="Поиск по названию, ID, городу"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={fetchSources}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            value={platformFilter}
            onChange={setPlatformFilter}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: 'Все платформы' },
              { value: 'telegram', label: 'Telegram' },
              { value: 'vk', label: 'ВКонтакте' },
            ]}
          />
          <Select
            value={activeFilter}
            onChange={setActiveFilter}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'Все статусы' },
              { value: 'active', label: 'Только активные' },
              { value: 'inactive', label: 'Неактивные' },
            ]}
          />
          <Button type="primary" onClick={fetchSources}>
            Найти
          </Button>
        </Space>

        <Divider style={{ margin: '8px 0 16px 0' }} />

        {/* Sources Table */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={sources}
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Всего источников: ${total}`,
          }}
        />
      </Card>

      {/* Quick Add by URL Modal */}
      <Modal
        title={
          <span>
            <ThunderboltOutlined style={{ color: '#722ed1', marginRight: 8 }} />
            Быстрое добавление источника по ссылке
          </span>
        }
        open={byUrlModalOpen}
        onCancel={() => setByUrlModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={byUrlForm}
          layout="vertical"
          onFinish={handleByUrlSubmit}
          initialValues={{ timezone: 'Asia/Yekaterinburg' }}
        >
          <Form.Item
            label="Ссылка на группу или чат"
            name="url"
            rules={[
              { required: true, message: 'Вставьте ссылку на группу' },
              { type: 'url', message: 'Введите корректный URL' },
            ]}
            extra="Поддерживаются публичные ссылки VK (vk.com/...) и Telegram (t.me/...)."
          >
            <Input prefix={<LinkOutlined />} placeholder="https://vk.com/poputchiki_ufa или https://t.me/..." />
          </Form.Item>

          <Form.Item label="Дефолтный город (опционально)" name="city_default">
            <Input placeholder="Например: Стерлитамак" />
          </Form.Item>

          <Form.Item label="Часовой пояс" name="timezone">
            <Select
              options={[
                { value: 'Asia/Yekaterinburg', label: 'Asia/Yekaterinburg (UTC+5, Уфа, Урал)' },
                { value: 'Europe/Moscow', label: 'Europe/Moscow (UTC+3, Москва)' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Примечания" name="notes">
            <Input.TextArea rows={2} placeholder="Заметки по группе" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setByUrlModalOpen(false)}>Отмена</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#722ed1' }}>
              Распознать и добавить
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Manual Add / Edit Modal */}
      <Modal
        title={
          <span>
            <ApiOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            {editingSource ? `Редактирование источника #${editingSource.id}` : 'Создание источника вручную'}
          </span>
        }
        open={manualModalOpen}
        onCancel={() => {
          setManualModalOpen(false);
          setEditingSource(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={manualForm} layout="vertical" onFinish={handleManualSubmit}>
          <Form.Item
            label="Название группы / чата"
            name="name"
            rules={[{ required: true, message: 'Укажите название' }]}
          >
            <Input placeholder="Попутчики Уфа - Стерлитамак" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              label="Платформа"
              name="platform_name"
              rules={[{ required: true, message: 'Выберите платформу' }]}
            >
              <Select
                options={[
                  { value: 'telegram', label: 'Telegram' },
                  { value: 'vk', label: 'ВКонтакте' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Platform ID группы"
              name="platform_id"
              rules={[{ required: true, message: 'Укажите числовой ID' }]}
            >
              <Input placeholder="224041681" />
            </Form.Item>
          </div>

          <Form.Item label="Ссылка на группу" name="url">
            <Input placeholder="https://vk.com/..." />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Дефолтный город" name="city_default">
              <Input placeholder="Уфа" />
            </Form.Item>

            <Form.Item label="Часовой пояс" name="timezone">
              <Input placeholder="Asia/Yekaterinburg" />
            </Form.Item>
          </div>

          <Form.Item label="Заметки" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setManualModalOpen(false)}>Отмена</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingSource ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
