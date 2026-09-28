import React from 'react';
import { Space, Typography } from 'antd';
import { ContactItem } from '../types';

const { Text } = Typography;

/**
 * Extracts plain text representation of a single contact item.
 * Safely handles strings, { type, value } objects, or null/undefined.
 */
export const formatContactText = (c: ContactItem | string | null | undefined): string => {
  if (!c) return '';
  if (typeof c === 'string') return c;
  if (typeof c === 'object') {
    if (c.value) {
      if (c.type === 'telegram') {
        return c.value.startsWith('@') ? c.value : `@${c.value}`;
      }
      if (c.type === 'vk') {
        return c.value.startsWith('id') ? c.value : `vk: ${c.value}`;
      }
      return c.value;
    }
    return '';
  }
  return String(c);
};

/**
 * Formats an array of contacts into a plain comma-separated text string.
 */
export const formatContactsText = (contacts?: (ContactItem | string)[] | null, max = 3): string => {
  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return '—';
  }
  const formatted = contacts
    .map(formatContactText)
    .filter((s) => s.trim().length > 0);

  if (formatted.length === 0) return '—';
  return formatted.slice(0, max).join(', ');
};

/**
 * Renders a single contact as clean clickable text without any badge/tag wrapper.
 */
export const renderContactNode = (c: ContactItem | string, key?: number | string): React.ReactNode => {
  if (typeof c === 'string') {
    return <span key={key}>{c}</span>;
  }
  if (!c || !c.value) return null;
  const { type, value } = c;

  if (type === 'phone') {
    return (
      <a
        key={key}
        href={`tel:${value}`}
        style={{ color: 'inherit' }}
        title={`Позвонить ${value}`}
      >
        {value}
      </a>
    );
  }

  if (type === 'telegram') {
    const handle = value.replace(/^@/, '');
    return (
      <a
        key={key}
        href={`https://t.me/${handle}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1677ff' }}
      >
        @{handle}
      </a>
    );
  }

  if (type === 'vk') {
    const href = value.startsWith('http') ? value : `https://vk.com/${value}`;
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1677ff' }}
      >
        {value.startsWith('id') ? value : `vk: ${value}`}
      </a>
    );
  }

  return <span key={key}>{value}</span>;
};

/**
 * Renders multiple contacts as inline text nodes separated by commas.
 */
export const renderContacts = (contacts?: (ContactItem | string)[] | null, max = 3): React.ReactNode => {
  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return <Text type="secondary">—</Text>;
  }

  const validContacts = contacts.filter((c) => {
    if (typeof c === 'string') return c.trim().length > 0;
    return c && c.value;
  });

  if (validContacts.length === 0) {
    return <Text type="secondary">—</Text>;
  }

  return (
    <Space split={<span style={{ color: '#bfbfbf' }}>, </span>} wrap size={2}>
      {validContacts.slice(0, max).map((c, i) => renderContactNode(c, i))}
    </Space>
  );
};
