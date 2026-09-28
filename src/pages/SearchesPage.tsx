import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Card,
  Typography,
  Select,
  Checkbox,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { analyticsApi } from '../api/analyticsApi';
import { SearchLogItem } from '../types';

const { Title, Text } = Typography;

export const SearchesPage: React.FC = () => {
  const [logs, setLogs] = useState<SearchLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<string>('all');
  const [onlySuccess, setOnlySuccess] = useState(false);
  const [onlyEmpty, setOnlyEmpty] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchLogs = async (currentPage = page, currentSize = pageSize) => {
    setLoading(true);
    try {
      const data = await analyticsApi.getAllSearches({
        limit: currentSize,
        offset: (currentPage - 1) * currentSize,
        search: search.trim() || undefined,
        platform: platform !== 'all' ? platform : undefined,
        only_success: onlySuccess ? true : undefined,
        only_empty: onlyEmpty ? true : undefined,
      });
      setLogs(data.searches || []);
      setTotal(data.total_count || 0);
    } catch {
      message.error('Не удалось загрузить логи поиска');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, pageSize);
  }, [page, pageSize, platform, onlySuccess, onlyEmpty]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs(1, pageSize);
  };

  const renderPlatformText = (platformName?: string) => {
    const p = (platformName || '').toLowerCase();
    if (p.includes('tg') || p.includes('tele')) {
      return 'Telegram';
    }
    if (p.includes('vk')) {
      return 'ВКонтакте';
    }
    return platformName || 'Web';
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
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (p: string) => renderPlatformText(p),
    },
    {
      title: 'Пользователь',
      key: 'user_info',
      width: 160,
      render: (_: any, record: SearchLogItem) => {
        const u = record.user;
        const name = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '';
        const isVk =
          (record.platform || '').toLowerCase().includes('vk') ||
          (u?.platform || '').toLowerCase().includes('vk');

        return (
          <div>
            {isVk ? (
              <a
                href={`https://vk.ru/id${record.user_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 600, color: '#1677ff' }}
              >
                #{record.user_id}
              </a>
            ) : (
              <Text code>#{record.user_id}</Text>
            )}
            {name && (
              <div style={{ fontSize: 12, fontWeight: 500 }}>
                {isVk ? (
                  <a
                    href={`https://vk.ru/id${record.user_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    {name}
                  </a>
                ) : (
                  name
                )}
              </div>
            )}
            {u?.username && (
              <div style={{ fontSize: 11, color: '#1677ff' }}>
                {isVk ? (
                  <a
                    href={`https://vk.ru/${u.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @{u.username}
                  </a>
                ) : (
                  `@${u.username}`
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Маршрут поиска',
      key: 'route',
      render: (_: any, record: SearchLogItem) => (
        <div>
          {record.from_city && record.to_city ? (
            <Text strong>
              {record.from_city} → {record.to_city}
            </Text>
          ) : (
            <span style={{ fontStyle: 'italic', color: '#8c8c8c' }}>
              {record.raw_query || 'Не указан'}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Желаемая дата',
      dataIndex: 'date_str',
      key: 'date_str',
      width: 140,
      render: (d: string | null) => d || <Text type="secondary">Любая</Text>,
    },
    {
      title: 'Результат',
      dataIndex: 'results_count',
      key: 'results_count',
      width: 150,
      render: (count: number) =>
        count > 0 ? (
          <Text strong>Найдено: {count}</Text>
        ) : (
          <Text type="secondary">0 поездок</Text>
        ),
    },
    {
      title: 'Время запроса',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (d: string) => dayjs(d).format('DD.MM.YYYY HH:mm:ss'),
    },
  ];

  return (
    <Card style={{ borderRadius: 16 }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <Space>
                <SearchOutlined style={{ color: '#1677ff' }} />
                <span>Логи поисков пассажиров</span>
              </Space>
            </Title>
            <Text type="secondary">
              История поисковых запросов в ботах и WebApp для оценки реального спроса
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => fetchLogs(page, pageSize)} loading={loading}>
            Обновить
          </Button>
        </div>

        {/* Filter Bar */}
        <Space wrap size="middle">
          <Input
            placeholder="Поиск по запросу или городам"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 280 }}
            allowClear
          />

          <Select
            value={platform}
            onChange={setPlatform}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: 'Все платформы' },
              { value: 'telegram', label: 'Telegram' },
              { value: 'vk', label: 'ВКонтакте' },
              { value: 'web', label: 'Web' },
            ]}
          />

          <Checkbox
            checked={onlySuccess}
            onChange={(e) => {
              setOnlySuccess(e.target.checked);
              if (e.target.checked) setOnlyEmpty(false);
            }}
          >
            Только успешные (&gt;0)
          </Checkbox>

          <Checkbox
            checked={onlyEmpty}
            onChange={(e) => {
              setOnlyEmpty(e.target.checked);
              if (e.target.checked) setOnlySuccess(false);
            }}
          >
            Только без результатов (0)
          </Checkbox>

          <Button type="primary" onClick={handleSearch}>
            Найти
          </Button>
        </Space>

        {/* Table */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
            showTotal: (t) => `Всего запросов: ${t}`,
          }}
          bordered
          size="middle"
        />
      </Space>
    </Card>
  );
};
