import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Card,
  Typography,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  message,
  Alert,
  Segmented,
  Tooltip,
} from 'antd';
import {
  CompassOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { distancesApi } from '../api/distancesApi';
import { DistanceItem } from '../types';

const { Title, Text } = Typography;

export const DistancesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [distances, setDistances] = useState<DistanceItem[]>([]);
  const [unconfiguredCount, setUnconfiguredCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<DistanceItem | null>(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchDistances = async () => {
    setLoading(true);
    try {
      const data = await distancesApi.getDistances();
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setDistances(items);
      setUnconfiguredCount(
        typeof data?.unconfigured_count === 'number'
          ? data.unconfigured_count
          : items.filter((d) => (d.duration_minutes || 0) === 0).length
      );
    } catch (err) {
      console.error('[DistancesPage] Failed to fetch distances:', err);
      message.error('Не удалось загрузить расстояния');
      setDistances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistances();
  }, []);

  const handleAddSubmit = async (values: { city_a: string; city_b: string; duration_minutes: number }) => {
    setSubmitting(true);
    try {
      await distancesApi.createOrUpdateDistance({
        city_a: values.city_a.trim(),
        city_b: values.city_b.trim(),
        duration_minutes: values.duration_minutes || 0,
      });
      message.success('Пара городов сохранена');
      setAddModalOpen(false);
      addForm.resetFields();
      fetchDistances();
    } catch (err: any) {
      console.error('[DistancesPage] Failed to save distance:', err);
      message.error(err.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: { duration_minutes: number }) => {
    if (!currentEditItem) return;
    setSubmitting(true);
    try {
      await distancesApi.updateDistanceDuration(currentEditItem.id, {
        duration_minutes: values.duration_minutes,
      });
      message.success('Время в пути обновлено');
      setEditModalOpen(false);
      setCurrentEditItem(null);
      fetchDistances();
    } catch (err: any) {
      console.error(`[DistancesPage] Failed to update distance #${currentEditItem.id}:`, err);
      message.error(err.response?.data?.detail || 'Ошибка обновления времени');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await distancesApi.deleteDistance(id);
      message.success('Запись удалена');
      setDistances((prev) => (Array.isArray(prev) ? prev.filter((d) => d.id !== id) : []));
    } catch (err) {
      console.error(`[DistancesPage] Failed to delete distance #${id}:`, err);
      message.error('Ошибка при удалении записи');
    }
  };

  const openEdit = (item: DistanceItem) => {
    setCurrentEditItem(item);
    editForm.setFieldsValue({
      duration_minutes: item.duration_minutes,
    });
    setEditModalOpen(true);
  };

  const safeDistances = Array.isArray(distances) ? distances : [];
  const filteredDistances = safeDistances.filter((item) => {
    if (!item) return false;
    if (filterMode === 'unconfigured' && item.duration_minutes > 0) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!item.city_a.toLowerCase().includes(q) && !item.city_b.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const formatDuration = (mins: number) => {
    if (mins === 0) return <span style={{ color: '#ff4d4f' }}>Не задано (0 мин)</span>;
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours > 0 && m > 0) return `${hours} ч ${m} мин (${mins} мин)`;
    if (hours > 0) return `${hours} ч (${mins} мин)`;
    return `${mins} мин`;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Город A',
      dataIndex: 'city_a',
      key: 'city_a',
      render: (city: string) => <Text strong style={{ fontSize: 14 }}>{city}</Text>,
    },
    {
      title: 'Город B',
      dataIndex: 'city_b',
      key: 'city_b',
      render: (city: string) => <Text strong style={{ fontSize: 14 }}>{city}</Text>,
    },
    {
      title: 'Время в пути',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (mins: number) => (
        <Space size="middle">
          <ClockCircleOutlined style={{ color: mins > 0 ? '#1677ff' : '#ff4d4f' }} />
          <span>{formatDuration(mins)}</span>
        </Space>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: any, record: DistanceItem) => (
        <Space size="small">
          <Tooltip title="Изменить время">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Удалить пару городов?"
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
    <>
      <Card style={{ borderRadius: 16 }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <Space>
                <CompassOutlined style={{ color: '#1677ff' }} />
                <span>Расстояния между городами</span>
              </Space>
            </Title>
            <Text type="secondary">
              Матрица времени в пути между городами для расчета расчетного времени прибытия (ETA)
            </Text>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
              Добавить пару
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchDistances} loading={loading}>
              Обновить
            </Button>
          </Space>
        </div>

        {unconfiguredCount > 0 && (
          <Alert
            message={`Внимание: обнаружено ${unconfiguredCount} ненастроенных маршрутов (0 минут)`}
            description="Укажите приблизительное время в пути между городами для расчета времени промежуточных остановок."
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            style={{ borderRadius: 10 }}
          />
        )}

        {/* Filter Bar */}
        <Space wrap size="middle">
          <Input
            placeholder="Поиск по названию города"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Segmented
            value={filterMode}
            onChange={(val) => setFilterMode(val as string)}
            options={[
              { label: `Все маршруты (${distances.length})`, value: 'all' },
              { label: `Ненастроенные (${unconfiguredCount})`, value: 'unconfigured' },
            ]}
          />
        </Space>

        {/* Table */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredDistances}
          loading={loading}
          pagination={{
            pageSize: 25,
            showTotal: (total) => `Всего пар: ${total}`,
          }}
          bordered
          size="middle"
        />
      </Space>
    </Card>

      {/* Add Modal */}
      <Modal
        title={
          <span>
            <CompassOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            Добавление расстояния
          </span>
        }
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddSubmit} initialValues={{ duration_minutes: 60 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              label="Город A"
              name="city_a"
              rules={[{ required: true, message: 'Введите город A' }]}
            >
              <Input placeholder="Стерлитамак" />
            </Form.Item>

            <Form.Item
              label="Город B"
              name="city_b"
              rules={[{ required: true, message: 'Введите город B' }]}
            >
              <Input placeholder="Уфа" />
            </Form.Item>
          </div>

          <Form.Item
            label="Время в пути (в минутах)"
            name="duration_minutes"
            rules={[{ required: true, message: 'Укажите минуты' }]}
            extra="Например: 120 минут = 2 часа"
          >
            <InputNumber style={{ width: '100%' }} min={0} max={1440} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setAddModalOpen(false)}>Отмена</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Duration Modal */}
      <Modal
        title={
          currentEditItem
            ? `Время в пути: ${currentEditItem.city_a} ↔ ${currentEditItem.city_b}`
            : 'Изменение времени'
        }
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setCurrentEditItem(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            label="Время в пути (в минутах)"
            name="duration_minutes"
            rules={[{ required: true, message: 'Укажите минуты' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={1440} autoFocus />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              onClick={() => {
                setEditModalOpen(false);
                setCurrentEditItem(null);
              }}
            >
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};
