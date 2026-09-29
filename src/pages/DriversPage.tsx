import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Card,
  Typography,
  Row,
  Col,
  Select,
  Statistic,
  Drawer,
  Spin,
  Timeline,
  message,
  Divider,
} from 'antd';
import {
  TeamOutlined,
  TrophyOutlined,
  ReloadOutlined,
  CarOutlined,
  SearchOutlined,
  HistoryOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { driversApi } from '../api/driversApi';
import { DriverItem, DriversStats, DriverTripItem, ContactItem } from '../types';
import { renderContacts } from '../utils/contactUtils';

const { Title, Text } = Typography;

export const DriversPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [stats, setStats] = useState<DriversStats | null>(null);
  const [topDrivers, setTopDrivers] = useState<DriverItem[]>([]);

  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverItem | null>(null);
  const [driverTrips, setDriverTrips] = useState<DriverTripItem[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await driversApi.getDrivers({
        platform: platformFilter !== 'all' ? platformFilter : undefined,
        search: search.trim() || undefined,
      });
      setDrivers(Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []));
      setStats(data?.stats || null);
      setTopDrivers(Array.isArray(data?.top_drivers) ? data.top_drivers : []);
    } catch (err) {
      console.error('[DriversPage] Failed to fetch drivers:', err);
      message.error('Не удалось загрузить данные водителей');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [platformFilter]);

  const openDriverTrips = async (driver: DriverItem) => {
    setSelectedDriver(driver);
    setDrawerOpen(true);
    setTripsLoading(true);
    try {
      const res = await driversApi.getDriverTrips(driver.driver_id, driver.platform);
      setDriverTrips(Array.isArray(res?.trips) ? res.trips : (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error(`[DriversPage] Failed to fetch driver trips for #${driver.driver_id}:`, err);
      message.error('Ошибка загрузки поездок водителя');
      setDriverTrips([]);
    } finally {
      setTripsLoading(false);
    }
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
      title: 'ID Водителя',
      dataIndex: 'driver_id',
      key: 'driver_id',
      width: 110,
      render: (id: number, record: DriverItem) => {
        const isVk = (record.platform || '').toLowerCase().includes('vk');
        if (isVk) {
          return (
            <a
              href={`https://vk.ru/id${id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600, color: '#1677ff' }}
            >
              #{id}
            </a>
          );
        }
        return <Text strong>#{id}</Text>;
      },
    },
    {
      title: 'Имя / Профиль',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (name: string) => <div style={{ fontWeight: 600 }}>{name}</div>,
    },
    {
      title: 'Платформа',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (p: string) => renderPlatformText(p),
    },
    {
      title: 'Автомобиль',
      dataIndex: 'car',
      key: 'car',
      width: 160,
      render: (car: string | null) =>
        car ? (
          <span style={{ color: '#1677ff', fontSize: 13 }}>
            <CarOutlined /> {car}
          </span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Всего поездок',
      dataIndex: 'total_trips',
      key: 'total_trips',
      width: 120,
      sorter: (a: DriverItem, b: DriverItem) => a.total_trips - b.total_trips,
      render: (count: number) => <Text strong>{count}</Text>,
    },
    {
      title: 'Активных сейчас',
      dataIndex: 'active_trips',
      key: 'active_trips',
      width: 130,
      render: (count: number) =>
        count > 0 ? (
          <Text strong>{count} активных</Text>
        ) : (
          <Text type="secondary">0</Text>
        ),
    },
    {
      title: 'Последний выезд',
      dataIndex: 'last_trip_date',
      key: 'last_trip_date',
      width: 150,
      render: (d: string | null) =>
        d ? (
          <span style={{ fontSize: 12 }}>{dayjs(d).format('DD.MM.YYYY HH:mm')}</span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Контакты',
      dataIndex: 'contacts',
      key: 'contacts',
      width: 190,
      render: (contacts: (ContactItem | string)[] | null) => renderContacts(contacts),
    },
    {
      title: 'История',
      key: 'actions',
      width: 120,
      render: (_: any, record: DriverItem) => (
        <Button
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => openDriverTrips(record)}
        >
          Поездки ({record.total_trips})
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Card 1: Combined Stats & Top 5 Leaders */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space>
              <TeamOutlined style={{ color: '#1677ff' }} />
              <span>Водители: Статистика & Лидеры</span>
            </Space>
            <Button icon={<ReloadOutlined />} onClick={fetchDrivers} loading={loading}>
              Обновить
            </Button>
          </div>
        }
        style={{ borderRadius: 16 }}
      >
        <Row gutter={[24, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Всего водителей в базе"
              value={stats?.total_drivers ?? 0}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
            />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Активных за 30 дней"
              value={stats?.active_drivers_30d ?? 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Всего поездок водителей"
              value={stats?.total_trips ?? 0}
              prefix={<CarOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Лидирующая платформа"
              value={stats?.top_platform || 'ВКонтакте'}
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
        </Row>

        {topDrivers.length > 0 && (
          <>
            <Divider style={{ margin: '20px 0 16px 0' }} />
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              🏆 Топ-5 лидеров по числу выездов:
            </Text>
            <Row gutter={[12, 12]}>
              {topDrivers.map((driver, index) => (
                <Col xs={24} sm={12} md={4} lg={4} key={index} style={{ flex: 1 }}>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: 'rgba(128,128,128,0.06)',
                      border: index === 0 ? '1px solid #faad14' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: index === 0 ? '#faad14' : '#8c8c8c' }}>
                        #{index + 1}
                      </span>
                      <Text type="secondary" style={{ fontSize: 12 }}>{renderPlatformText(driver.platform)}</Text>
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {driver.display_name}
                    </div>
                    <div style={{ fontSize: 13, color: '#1677ff', marginTop: 4, fontWeight: 700 }}>
                      {driver.total_trips} поездок
                    </div>
                    {driver.car && (
                      <div style={{ fontSize: 11, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {driver.car}
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>

      {/* Card 2: Combined Filters & Drivers Table */}
      <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            Реестр водителей
          </Title>
          <Space wrap>
            <Input
              placeholder="Поиск по ID, имени, авто, контактам"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={fetchDrivers}
              style={{ width: 320 }}
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
            <Button type="primary" onClick={fetchDrivers}>
              Найти
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '8px 0 16px 0' }} />

        <Table
          rowKey={(r) => `${r.driver_id}-${r.platform}`}
          columns={columns}
          dataSource={drivers}
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Всего водителей: ${total}`,
          }}
        />
      </Card>

      {/* Driver Trips Drawer */}
      <Drawer
        title={
          selectedDriver ? (
            <span>
              <CarOutlined style={{ color: '#1677ff', marginRight: 8 }} />
              Поездки: {selectedDriver.display_name}
            </span>
          ) : (
            'История поездок'
          )
        }
        width={550}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Spin spinning={tripsLoading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {driverTrips.map((trip) => (
              <Card key={trip.id} size="small" style={{ borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong>Поездка #{trip.id}</Text>
                  <Text strong>{trip.status === 'active' ? 'Активна' : trip.status}</Text>
                </div>

                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  🕒 Выезд: <Text strong>{trip.departure_time ? dayjs(trip.departure_time).format('DD.MM.YYYY в HH:mm') : '-'}</Text>
                </div>

                {trip.car && (
                  <div style={{ fontSize: 12, color: '#1677ff', marginBottom: 8 }}>
                    <CarOutlined /> {trip.car}
                  </div>
                )}

                {/* Stops */}
                {trip.stops && trip.stops.length > 0 && (
                  <div style={{ margin: '8px 0' }}>
                    <Timeline
                      items={trip.stops.map((s, idx) => ({
                        color: idx === 0 ? 'blue' : idx === trip.stops!.length - 1 ? 'green' : 'gray',
                        children: (
                          <span style={{ fontSize: 12 }}>
                            {s.city_name} {s.arrival_time && `(${dayjs(s.arrival_time).format('HH:mm')})`}
                          </span>
                        ),
                      }))}
                    />
                  </div>
                )}

                {/* Raw Text */}
                {trip.raw_text && (
                  <div
                    style={{
                      background: 'rgba(128,128,128,0.06)',
                      padding: 8,
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 90,
                      overflowY: 'auto',
                    }}
                  >
                    {trip.raw_text}
                  </div>
                )}

                {/* Message Links */}
                <div style={{ marginTop: 8 }}>
                  {trip.tg_link && (
                    <Button type="link" size="small" icon={<LinkOutlined />} href={trip.tg_link} target="_blank">
                      Открыть в TG
                    </Button>
                  )}
                  {trip.vk_link && (
                    <Button type="link" size="small" icon={<LinkOutlined />} href={trip.vk_link} target="_blank">
                      Открыть в VK
                    </Button>
                  )}
                </div>
              </Card>
            ))}

            {driverTrips.length === 0 && !tripsLoading && (
              <div style={{ textAlign: 'center', padding: 30, color: '#8c8c8c' }}>
                Поездок не найдено
              </div>
            )}
          </div>
        </Spin>
      </Drawer>
    </div>
  );
};
