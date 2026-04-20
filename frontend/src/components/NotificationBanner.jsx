import { useNotification } from '../context/NotificationContext';

/**
 * Type-to-style mappings for notification appearance
 * Each type has distinct background, text, and border colors
 */
const typeStyles = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
};

/**
 * Type-to-icon mappings
 * Unicode symbols that match each notification type visually
 */
const typeIcons = {
  success: '✓', // Checkmark
  error: '✕',   // X mark
  info: 'ℹ',    // Information symbol
  warning: '⚠', // Warning symbol
};

/**
 * NotificationBanner Component
 * Displays toast notifications in fixed top-right corner
 * Auto-dismisses after duration specified by showNotification()
 * Users can manually close with X button
 * 
 * Features:
 * - Multiple notification types (success, error, info, warning)
 * - Slide-in animation on entry
 * - Auto-dismiss with configurable duration
 * - Manual close button
 * - Accessible with ARIA attributes
 * - Fixed positioning (stays visible while scrolling)
 * 
 * @component
 * @returns {JSX.Element} Toast notification container
 * 
 * @example
 * // Place once in App layout, typically in main wrapper
 * <NotificationBanner />
 * 
 * // Then use hook to trigger anywhere:
 * const { showNotification } = useNotification();
 * showNotification('Saved successfully!', 'success');
 */
export default function NotificationBanner() {
  const { notifications, dismissNotification } = useNotification();

  return (
    <div
      // Accessibility: announce new notifications to screen readers
      role="region"
      aria-live="polite"
      aria-atomic="true"
      // Fixed positioning: top-right corner stays visible
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          // Style changes based on notification type
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-md animate-slide-in ${typeStyles[notification.type]}`}
          role="alert"
        >
          {/* Icon and message */}
          <div className="flex items-center gap-2">
            {/* Type-specific icon */}
            <span className="font-bold text-lg" aria-hidden="true">
              {typeIcons[notification.type]}
            </span>
            {/* Notification message */}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          
          {/* Close button */}
          <button
            onClick={() => dismissNotification(notification.id)}
            aria-label={`Close ${notification.type} notification`}
            className="text-lg hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
