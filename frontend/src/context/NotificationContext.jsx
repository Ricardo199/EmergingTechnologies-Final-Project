import { createContext, useContext, useState, useCallback } from 'react';

/**
 * NotificationContext
 * Global context for managing toast notifications across the application
 * Provides methods to show, dismiss, and auto-clear notifications
 * 
 * Usage:
 * 1. Wrap app with <NotificationProvider>
 * 2. Use useNotification() hook in any component
 * 3. Call showNotification(message, type, duration)
 */
const NotificationContext = createContext();

/**
 * NotificationProvider Component
 * Manages notification state and provides context to all child components
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider wrapper
 * 
 * @example
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 */
export function NotificationProvider({ children }) {
  // Array of notification objects: { id, message, type }
  const [notifications, setNotifications] = useState([]);

  /**
   * Show a new notification toast
   * Automatically dismisses after specified duration
   * @param {string} message - Notification text to display
   * @param {('success'|'error'|'info'|'warning')} [type='info'] - Notification type (affects styling)
   * @param {number} [duration=3000] - Time before auto-dismiss in milliseconds (0 = never auto-dismiss)
   * @returns {number} Notification ID (can be used to manually dismiss)
   * 
   * @example
   * const { showNotification } = useNotification();
   * showNotification('Issue reported!', 'success', 3000);
   * showNotification('Error saving', 'error');
   */
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    // Generate unique ID based on timestamp
    const id = Date.now();
    // Add notification to state
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after duration (unless duration is 0)
    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  /**
   * Manually dismiss a notification by ID
   * Useful for "close" buttons in notification UI
   * @param {number} id - Notification ID to dismiss
   * 
   * @example
   * const { dismissNotification } = useNotification();
   * dismissNotification(notificationId);
   */
  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, dismissNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * useNotification Hook
 * Access notification context in any component
 * @returns {Object} Notification context object
 * @returns {Array} return.notifications - Current notifications
 * @returns {Function} return.showNotification - Function to show notification
 * @returns {Function} return.dismissNotification - Function to dismiss notification
 * @throws {Error} If used outside NotificationProvider
 * 
 * @example
 * const { showNotification, notifications } = useNotification();
 * showNotification('Success!', 'success');
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
