/**
 * colors.js - Shared Color Constants
 * Tailwind CSS class maps for consistent status, priority, stat, and alert coloring
 * across all components. Import the relevant map and index by value.
 *
 * @example
 * import { STATUS_COLORS, PRIORITY_COLORS } from '../styles/colors';
 * <span className={STATUS_COLORS[issue.status]}>{issue.status}</span>
 */

// Status badge colors
export const STATUS_COLORS = {
  reported: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

// Priority text colors
export const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};

// Stat card colors
export const STAT_COLORS = {
  open: 'text-yellow-600',
  resolved: 'text-green-600',
  high: 'text-red-600',
};

// Alert/Notification colors
export const ALERT_COLORS = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
};
