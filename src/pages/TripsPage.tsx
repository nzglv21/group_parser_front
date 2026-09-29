import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  DatePicker,
  Switch,
  Card,
  Typography,
  Modal,
  Popconfirm,
  message,
  Descriptions,
  Timeline,
  Row,
  Col,
  Select,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  LinkOutlined,
  CarOutlined,
  EnvironmentOutlined,
  ClearOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { tripsApi } from '../api/tripsApi';
import { Trip, TripStop } from '../types';
import { renderContacts } from '../utils/contactUtils';

const { Title, Text } = Typography;

export const TripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeCompleted, setIncludeCompleted] = useState(true);

  // Filters
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      let data: Trip[] = [];
      if (fromCity.trim() || toCity.trim() || selectedDate) {
        data = await tripsApi.searchTrips({
          from_city: fromCity.trim() || undefined,
          to_city: toCity.trim() || undefined,
          date: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
          include_completed: includeCompleted,
        });
      } else {
        data = await tripsApi.getTrips(includeCompleted);
      }
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[TripsPage] Failed to fetch trips:', err);
      message.error('Не удалось загрузить поездки');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [includeCompleted]);

  const handleDeleteTrip = async (id: number) => {
    try {
      await tripsApi.deleteTrip(id);
      message.success(`Поездка #${id} удалена`);
      setTrips((prev) => (Array.isArray(prev) ? prev.filter((t) => t.id !== id) : []));
      if (currentTrip?.id === id) {
        setDetailModalOpen(false);
      }
    } catch (err) {
      console.error(`[TripsPage] Failed to delete trip #${id}:`, err);
      message.error('Ошибка при удалении поездки');
    }
  };

  const resetFilters = () => {
    setFromCity('');
    setToCity('');
    setSelectedDate(null);
    setPlatformFilter('all');
    setStatusFilter('all');
    fetchTrips();
  };

  const safeTrips = Array.isArray(trips) ? trips : [];
  const filteredTrips = safeTrips.filter((trip) => {
    if (!trip) return false;
    if (platformFilter !== 'all') {
      const p = (trip.platform_name || '').toLowerCase();
      if (platformFilter === 'telegram' && !p.includes('tg') && !p.includes('tele')) return false;
      if (platformFilter === 'vk' && !p.includes('vk')) return false;
    }
    if (statusFilter !== 'all') {
      if ((trip.status || 'active').toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    return true;
  });

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

  const renderStatusText = (status?: string) => {
    const s = (status || 'active').toLowerCase();
    if (s === 'active') return 'Активна';
    if (s === 'full') return 'Заполнена';
    if (s === 'completed') return 'Завершена';
    if (s === 'cancelled' || s === 'canceled') return 'Отменена';
    return status;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 75,
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
      title: 'Маршрут и Остановки',
      key: 'route',
      render: (_: any, record: Trip) => {
        const stops = record.stops || [];
        if (stops.length === 0) {
          return <Text type="secondary">Остановки не распознаны</Text>;
        }
        return (
          <span>
            {stops.map((stop: TripStop, index: number) => {
              const timeStr = stop.arrival_time ? ` (${dayjs(stop.arrival_time).format('HH:mm')})` : '';
              return (
                <span key={index}>
                  <Text strong={index === 0 || index === stops.length - 1}>{stop.city_name}{timeStr}</Text>
                  {index < stops.length - 1 && <span style={{ margin: '0 6px', color: '#8c8c8c' }}>→</span>}
                </span>
              );
            })}
          </span>
        );
      },
    },
    {
      title: 'Выезд',
      dataIndex: 'departure_time',
      key: 'departure_time',
      width: 140,
      render: (time: string) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dayjs(time).format('DD.MM.YYYY')}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{dayjs(time).format('HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Водитель / Авто',
      key: 'driver',
      width: 180,
      render: (_: any, record: Trip) => (
        <div>
          <div>
            Водитель:{' '}
            {record.platform_name?.toLowerCase().includes('vk') ? (
              <a
                href={`https://vk.ru/id${record.driver_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 600, color: '#1677ff' }}
              >
                #{record.driver_id}
              </a>
            ) : (
              <Text strong>#{record.driver_id}</Text>
            )}
          </div>
          {record.car && (
            <div style={{ fontSize: 12, color: '#1677ff' }}>
              <CarOutlined /> {record.car}
            </div>
          )}
          {record.contacts && record.contacts.length > 0 && (
            <div style={{ fontSize: 12, marginTop: 2 }}>
              {renderContacts(record.contacts, 1)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => renderStatusText(status),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 110,
      render: (_: any, record: Trip) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setCurrentTrip(record);
              setDetailModalOpen(true);
            }}
          />
          <Popconfirm
            title="Удалить поездку?"
            onConfirm={() => handleDeleteTrip(record.id)}
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
      {/* Unified Card containing Header, Filters and Table */}
      <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
        {/* Header inside Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Поездки водителей
            </Title>
            <Text type="secondary">
              Управление спарсенными поездками, остановками и контактами
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchTrips} loading={loading}>
            Обновить
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={5}>
            <Input
              placeholder="Город выезда (напр. Стерлитамак)"
              prefix={<EnvironmentOutlined style={{ color: '#1677ff' }} />}
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              allowClear
              onPressEnter={fetchTrips}
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Input
              placeholder="Город прибытия (напр. Уфа)"
              prefix={<EnvironmentOutlined style={{ color: '#52c41a' }} />}
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              allowClear
              onPressEnter={fetchTrips}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Дата выезда"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              format="DD.MM.YYYY"
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: '100%' }}
              value={platformFilter}
              onChange={setPlatformFilter}
              options={[
                { value: 'all', label: 'Все платформы' },
                { value: 'telegram', label: 'Telegram' },
                { value: 'vk', label: 'ВКонтакте' },
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Все статусы' },
                { value: 'active', label: 'Активные' },
                { value: 'full', label: 'Заполненные' },
                { value: 'completed', label: 'Завершенные' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={fetchTrips} loading={loading}>
                Найти
              </Button>
              <Button icon={<ClearOutlined />} onClick={resetFilters}>
                Сброс
              </Button>
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Space>
            <Switch
              checked={includeCompleted}
              onChange={setIncludeCompleted}
              size="small"
            />
            <Text type="secondary" style={{ fontSize: 13 }}>
              Включать завершенные поездки
            </Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Найдено записей: <Text strong>{filteredTrips.length}</Text>
          </Text>
        </div>

        <Divider style={{ margin: '12px 0 16px 0' }} />

        {/* Trips Table */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredTrips}
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ['15', '30', '50', '100'],
            showTotal: (total) => `Всего поездок: ${total}`,
          }}
        />
      </Card>

      {/* Trip Details Modal */}
      <Modal
        title={
          <span>
            <CarOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            Детали поездки #{currentTrip?.id}
          </span>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Popconfirm
            key="delete"
            title="Удалить поездку навсегда?"
            onConfirm={() => currentTrip && handleDeleteTrip(currentTrip.id)}
            okText="Да"
            cancelText="Нет"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>,
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
            Закрыть
          </Button>,
        ]}
        width={700}
      >
        {currentTrip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Платформа">
                {renderPlatformText(currentTrip.platform_name)}
              </Descriptions.Item>
              <Descriptions.Item label="Водитель ID">
                {currentTrip.platform_name?.toLowerCase().includes('vk') ? (
                  <a
                    href={`https://vk.ru/id${currentTrip.driver_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 600, color: '#1677ff' }}
                  >
                    #{currentTrip.driver_id}
                  </a>
                ) : (
                  <Text strong>#{currentTrip.driver_id}</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Автомобиль">
                {currentTrip.car || <Text type="secondary">Не указан</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Выезд">
                {dayjs(currentTrip.departure_time).format('DD.MM.YYYY в HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                {renderStatusText(currentTrip.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Контакты">
                {currentTrip.contacts && currentTrip.contacts.length > 0 ? (
                  renderContacts(currentTrip.contacts)
                ) : (
                  <Text type="secondary">Нет контактов</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* Links */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Ссылки:</Text>
              <Space wrap>
                {currentTrip.tg_link && (
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    href={currentTrip.tg_link}
                    target="_blank"
                  >
                    Открыть в Telegram
                  </Button>
                )}
                {currentTrip.vk_link && (
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    href={currentTrip.vk_link}
                    target="_blank"
                  >
                    Открыть в VK
                  </Button>
                )}
                {currentTrip.message_link && !currentTrip.tg_link && !currentTrip.vk_link && (
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    href={currentTrip.message_link}
                    target="_blank"
                  >
                    Оригинальное сообщение
                  </Button>
                )}
              </Space>
            </div>

            {/* Stops Timeline */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>Остановки маршрута:</Text>
              {currentTrip.stops && currentTrip.stops.length > 0 ? (
                <Timeline
                  items={currentTrip.stops.map((stop, idx) => ({
                    color: idx === 0 ? 'blue' : idx === currentTrip.stops!.length - 1 ? 'green' : 'gray',
                    children: (
                      <div>
                        <Text strong>{stop.city_name}</Text>
                        {stop.arrival_time && (
                          <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 12 }}>
                            {dayjs(stop.arrival_time).format('HH:mm')}
                          </span>
                        )}
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#bfbfbf' }}>
                          (остановка #{stop.stop_order})
                        </span>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Text type="secondary">Остановки отсутствуют</Text>
              )}
            </div>

            {/* Raw parsed text */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Оригинальный текст:</Text>
              <div
                style={{
                  background: 'rgba(128,128,128,0.08)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 12,
                  maxHeight: 160,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                }}
              >
                {currentTrip.raw_text || 'Текст отсутствует'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
