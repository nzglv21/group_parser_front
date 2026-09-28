import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Card,
  Typography,
  message,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  CarOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { analyticsApi } from '../api/analyticsApi';
import { UserItem } from '../types';

const { Title, Text } = Typography;

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchUsers = async (currentPage = page, currentSize = pageSize) => {
    setLoading(true);
    try {
      const data = await analyticsApi.getUsersList({
        limit: currentSize,
        offset: (currentPage - 1) * currentSize,
        search: search.trim() || undefined,
      });
      setUsers(data.users || []);
      setTotal(data.total_count || 0);
    } catch {
      message.error('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, pageSize);
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1, pageSize);
  };

  const renderPlatformText = (platformName?: string | null) => {
    const p = (platformName || '').toLowerCase();
    if (p.includes('tg') || p.includes('tele')) {
      return 'Telegram';
    }
    if (p.includes('vk')) {
      return 'ВКонтакте';
    }
    return platformName || 'Telegram';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number, record: UserItem) => {
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
      title: 'Платформа',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (p: string | null) => renderPlatformText(p),
    },
    {
      title: 'Пользователь / Имя',
      key: 'name',
      render: (_: any, record: UserItem) => {
        const isVk = (record.platform || '').toLowerCase().includes('vk');
        const fullName = `${record.first_name || ''} ${record.last_name || ''}`.trim();
        return (
          <div>
            <div style={{ fontWeight: 600 }}>
              {isVk && !fullName ? (
                <a
                  href={`https://vk.ru/id${record.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1677ff' }}
                >
                  Пользователь #{record.id}
                </a>
              ) : (
                fullName || `Пользователь #${record.id}`
              )}
            </div>
            {record.username && (
              <span style={{ fontSize: 12, color: '#1677ff' }}>
                {isVk ? (
                  <a
                    href={`https://vk.ru/${record.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @{record.username}
                  </a>
                ) : (
                  `@${record.username}`
                )}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string | null) => role === 'driver' ? 'Водитель' : 'Пассажир',
    },
    {
      title: 'Поисков',
      dataIndex: 'search_count',
      key: 'search_count',
      width: 110,
      render: (count: number | undefined) => count || 0,
    },
    {
      title: 'Подписок',
      dataIndex: 'sub_count',
      key: 'sub_count',
      width: 110,
      render: (count: number | undefined) => count || 0,
    },
    {
      title: 'Регистрация',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (d: string | null) =>
        d ? dayjs(d).format('DD.MM.YYYY HH:mm') : <Text type="secondary">—</Text>,
    },
    {
      title: 'Активность',
      dataIndex: 'last_activity',
      key: 'last_activity',
      width: 160,
      render: (d: string | null) =>
        d ? dayjs(d).format('DD.MM.YYYY HH:mm') : <Text type="secondary">—</Text>,
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
                <UserOutlined style={{ color: '#1677ff' }} />
                <span>Пользователи сервиса</span>
              </Space>
            </Title>
            <Text type="secondary">
              Реестр зарегистрированных пользователей ботов и веб-приложения
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => fetchUsers(page, pageSize)} loading={loading}>
            Обновить
          </Button>
        </div>

        {/* Search Bar */}
        <Space wrap>
          <Input
            placeholder="Поиск по имени, username или ID"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 320 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearch}>
            Найти
          </Button>
        </Space>

        {/* Table */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
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
            showTotal: (t) => `Всего пользователей: ${t}`,
          }}
          bordered
          size="middle"
        />
      </Space>
    </Card>
  );
};
