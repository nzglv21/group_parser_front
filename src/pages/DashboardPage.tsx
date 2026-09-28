import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Tag, Spin, Button, Space, Alert, Progress, Table, Divider } from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  CarOutlined,
  NotificationOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  SendOutlined,
  MessageOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { analyticsApi } from '../api/analyticsApi';
import { healthApi } from '../api/healthApi';
import { AnalyticsOverview, HealthCheckResponse, TopRouteItem, TimelineDayItem } from '../types';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [overviewData, healthData] = await Promise.allSettled([
        analyticsApi.getOverview(),
        healthApi.checkHealth(),
      ]);

      if (overviewData.status === 'fulfilled') {
        setOverview(overviewData.value);
      } else {
        setErrorMsg('Не удалось загрузить аналитику. Проверьте Basic Auth (nzglv / nzglv).');
      }

      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка загрузки дашборда');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderServiceBadge = (status?: string) => {
    switch (status) {
      case 'online':
      case 'ok':
      case 'healthy':
        return <Tag icon={<CheckCircleOutlined />} color="success">Работает (Online)</Tag>;
      case 'degraded':
      case 'missing_token':
        return <Tag icon={<ExclamationCircleOutlined />} color="warning">Внимание</Tag>;
      case 'offline':
      case 'error':
      case 'disconnected':
      case 'invalid_token':
        return <Tag icon={<CloseCircleOutlined />} color="error">Отключен</Tag>;
      default:
        return <Tag color="default">{status || 'Неизвестно'}</Tag>;
    }
  };

  const tripsTimeline: TimelineDayItem[] = overview?.trips_status_timeline?.timeline || [];
  const topSearchRoutes: TopRouteItem[] = overview?.searches?.top_search_routes || [];
  const topDriverRoutes: TopRouteItem[] = overview?.trips?.top_driver_routes || [];

  const activeTripsCount = overview?.trips?.trips_by_status?.active ?? 0;
  const totalTripsCount = overview?.trips?.total_trips ?? 0;
  const completedTripsCount = overview?.trips?.trips_by_status?.completed ?? 0;
  const tgTripsCount = overview?.trips?.trips_by_platform?.telegram ?? 0;
  const vkTripsCount = overview?.trips?.trips_by_platform?.vk ?? 0;

  const conversionRate = Math.round(overview?.searches?.conversion_rate ?? 0);
  const hourlyActivity = overview?.demand_supply?.hourly_activity || {};
  const maxHourlyCount = Math.max(...Object.values(hourlyActivity), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner Card */}
      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Мониторинг & Аналитика
            </Title>
            <Text type="secondary">
              Обзор состояния сервиса, воркеров и динамики поездок
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Обновить данные
          </Button>
        </div>

        {errorMsg && (
          <Alert message="Внимание" description={errorMsg} type="warning" showIcon closable style={{ marginTop: 16 }} />
        )}
      </Card>

      {/* Unified Services Health Status Card */}
      <Card
        title={
          <Space>
            <DashboardOutlined style={{ color: '#1677ff' }} />
            <span>Состояние модулей и сервисов</span>
          </Space>
        }
        style={{ borderRadius: 16 }}
      >
        <Row gutter={[24, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: '4px 0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>БАЗА ДАННЫХ</Text>
              <div style={{ fontWeight: 600, fontSize: 15, margin: '4px 0' }}>PostgreSQL</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                {renderServiceBadge(health?.services?.database?.status)}
                {health?.services?.database?.latency_ms !== undefined && (
                  <Text strong style={{ color: '#1677ff' }}>{health.services.database.latency_ms} ms</Text>
                )}
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: '4px 0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>ПАРСЕР TELEGRAM</Text>
              <div style={{ fontWeight: 600, fontSize: 15, margin: '4px 0' }}>Telethon Клиент</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                {renderServiceBadge(health?.services?.telegram_parser?.status)}
                <SendOutlined style={{ fontSize: 18, color: '#1677ff' }} />
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: '4px 0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>ПАРСЕР VK</Text>
              <div style={{ fontWeight: 600, fontSize: 15, margin: '4px 0' }}>User Token Воркер</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                {renderServiceBadge(health?.services?.vk_parser?.status)}
                <MessageOutlined style={{ fontSize: 18, color: '#13c2c2' }} />
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: '4px 0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>БОТ ВКОНТАКТЕ</Text>
              <div style={{ fontWeight: 600, fontSize: 15, margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {health?.services?.vk_bot?.group_name || 'VK Group'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                {renderServiceBadge(health?.services?.vk_bot?.status)}
                <ThunderboltOutlined style={{ fontSize: 18, color: '#722ed1' }} />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Unified Key Metrics Card */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#52c41a' }} />
            <span>Ключевые показатели сервиса</span>
          </Space>
        }
        style={{ borderRadius: 16 }}
      >
        <Spin spinning={loading}>
          <Row gutter={[24, 20]}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Всего пользователей"
                value={overview?.users?.total_users ?? 0}
                prefix={<UserOutlined style={{ color: '#1677ff' }} />}
                suffix={
                  <span style={{ fontSize: 13, color: '#52c41a', marginLeft: 8 }}>
                    +{overview?.users?.new_today ?? 0} сег.
                  </span>
                }
              />
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Tag color="blue">TG: {overview?.users?.tg_users ?? 0}</Tag>
                <Tag color="cyan">VK: {overview?.users?.vk_users ?? 0}</Tag>
                <Tag color="purple">DAU: {overview?.users?.active_24h ?? 0}</Tag>
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Поисковых запросов"
                value={overview?.searches?.total_searches ?? 0}
                prefix={<SearchOutlined style={{ color: '#52c41a' }} />}
                suffix={
                  <span style={{ fontSize: 13, color: '#1677ff', marginLeft: 8 }}>
                    +{overview?.searches?.searches_24h ?? 0} за 24ч
                  </span>
                }
              />
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <Text type="secondary">Успешность выдачи:</Text>
                  <Text strong>{conversionRate}%</Text>
                </div>
                <Progress percent={conversionRate} size="small" status="active" />
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Активных поездок водителей"
                value={activeTripsCount}
                prefix={<CarOutlined style={{ color: '#fa8c16' }} />}
                suffix={
                  <span style={{ fontSize: 13, color: '#8c8c8c', marginLeft: 8 }}>
                    / {totalTripsCount} всего
                  </span>
                }
              />
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Tag color="blue">TG: {tgTripsCount}</Tag>
                <Tag color="cyan">VK: {vkTripsCount}</Tag>
                <Tag color="default">Завершено: {completedTripsCount}</Tag>
              </div>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Активных подписок"
                value={overview?.subscriptions?.total_subscriptions ?? 0}
                prefix={<NotificationOutlined style={{ color: '#722ed1' }} />}
              />
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Tag color="blue">TG: {overview?.subscriptions?.tg_subscriptions ?? 0}</Tag>
                <Tag color="cyan">VK: {overview?.subscriptions?.vk_subscriptions ?? 0}</Tag>
              </div>
            </Col>
          </Row>
        </Spin>
      </Card>

      {/* Row: Dynamic Timeline Table & Hourly Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Динамика выездов по дням (последние 14 дней)"
            style={{ borderRadius: 16 }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              size="small"
              rowKey="date"
              dataSource={tripsTimeline}
              pagination={{ pageSize: 7, size: 'small' }}
              columns={[
                {
                  title: 'Дата',
                  dataIndex: 'date',
                  key: 'date',
                  render: (d: string) => <Text strong>{d}</Text>,
                },
                {
                  title: 'Активные',
                  dataIndex: 'active',
                  key: 'active',
                  render: (val: number) => val,
                },
                {
                  title: 'Завершенные',
                  dataIndex: 'completed',
                  key: 'completed',
                  render: (val: number) => <span style={{ color: '#8c8c8c' }}>{val}</span>,
                },
                {
                  title: 'Соотношение',
                  key: 'ratio',
                  render: (_: any, record: TimelineDayItem) => {
                    const total = (record.active || 0) + (record.completed || 0);
                    const pct = total > 0 ? Math.round(((record.active || 0) / total) * 100) : 0;
                    return <Progress percent={pct} size="small" showInfo={false} />;
                  },
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Почасовая активность поисков пассажиров (0-23 ч)"
            style={{ borderRadius: 16 }}
          >
            <div style={{ maxHeight: 310, overflowY: 'auto', paddingRight: 8 }}>
              {Array.from({ length: 24 }, (_, hour) => {
                const count = hourlyActivity[String(hour)] ?? hourlyActivity[hour] ?? 0;
                const percent = Math.round((count / maxHourlyCount) * 100);
                return (
                  <div
                    key={hour}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 6,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ width: 45, color: '#8c8c8c', fontFamily: 'monospace' }}>
                      {hour < 10 ? `0${hour}` : hour}:00
                    </span>
                    <div style={{ flex: 1 }}>
                      <Progress
                        percent={percent}
                        size="small"
                        strokeColor="#722ed1"
                        format={() => `${count}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Unified Top 10 Routes Card */}
      <Card
        title="Топ-10 направлений: Спрос пассажиров vs Поездки водителей"
        style={{ borderRadius: 16 }}
      >
        <Row gutter={[24, 20]}>
          <Col xs={24} lg={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <SearchOutlined style={{ color: '#1677ff' }} />
              <Text strong>Поиски пассажиров</Text>
            </div>
            <Table
              size="small"
              rowKey={(r) => `${r.from_city}-${r.to_city}`}
              dataSource={topSearchRoutes}
              pagination={false}
              columns={[
                {
                  title: '№',
                  key: 'idx',
                  width: 40,
                  render: (_: any, __: any, index: number) => <Text type="secondary">{index + 1}</Text>,
                },
                {
                  title: 'Маршрут',
                  key: 'route',
                  render: (_: any, record: TopRouteItem) => (
                    <Text strong>
                      {record.from_city} → {record.to_city}
                    </Text>
                  ),
                },
                {
                  title: 'Поисков',
                  dataIndex: 'count',
                  key: 'count',
                  width: 90,
                  render: (count: number) => count,
                },
                {
                  title: 'Успешность',
                  dataIndex: 'success_rate',
                  key: 'success_rate',
                  width: 110,
                  render: (rate: number | undefined) =>
                    rate !== undefined ? <Progress percent={Math.round(rate)} size="small" /> : '—',
                },
              ]}
            />
          </Col>

          <Col xs={24} lg={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CarOutlined style={{ color: '#52c41a' }} />
              <Text strong>Маршруты водителей</Text>
            </div>
            <Table
              size="small"
              rowKey={(r) => `${r.from_city}-${r.to_city}`}
              dataSource={topDriverRoutes}
              pagination={false}
              columns={[
                {
                  title: '№',
                  key: 'idx',
                  width: 40,
                  render: (_: any, __: any, index: number) => <Text type="secondary">{index + 1}</Text>,
                },
                {
                  title: 'Маршрут',
                  key: 'route',
                  render: (_: any, record: TopRouteItem) => (
                    <Text strong>
                      {record.from_city} → {record.to_city}
                    </Text>
                  ),
                },
                {
                  title: 'Поездок',
                  dataIndex: 'count',
                  key: 'count',
                  width: 90,
                  render: (count: number) => count,
                },
                {
                  title: 'Доля',
                  dataIndex: 'percentage',
                  key: 'percentage',
                  width: 110,
                  render: (pct: number | undefined) =>
                    pct !== undefined ? (
                      <Progress percent={Math.round(pct)} size="small" strokeColor="#52c41a" />
                    ) : (
                      '—'
                    ),
                },
              ]}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};
