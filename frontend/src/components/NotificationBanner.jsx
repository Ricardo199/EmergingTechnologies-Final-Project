import { useNotification } from '../context/NotificationContext';

const typeStyles = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export default function NotificationBanner() {
  const { notifications, dismissNotification } = useNotification();

  return (
    <div
      role="region"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-md animate-slide-in ${typeStyles[notification.type]}`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" aria-hidden="true">
              {typeIcons[notification.type]}
            </span>
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
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
