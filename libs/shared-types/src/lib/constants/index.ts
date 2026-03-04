// Shared constants
export * from './permissions';
export const API_BASE_URL = '/api';
export const API_VERSION = 'v1';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

export const USER_ROLES = [
  'owner',
  'manager',
  'accountant',
  'chef',
  'baker',
  'barista',
  'cashier',
  'warehouse',
  'marketing',
];

export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
