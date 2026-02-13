/**
 * Alert Card Component (Phase 3)
 * Displays alerts, warnings, and important messages
 */

interface AlertCardProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  icon?: string;
  className?: string;
}

export default function AlertCard({
  type = 'info',
  title,
  message,
  icon,
  className = '',
}: AlertCardProps) {
  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  const iconDefaults = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  return (
    <div
      className={`border-l-4 p-4 rounded-r-lg ${typeStyles[type]} transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">
          {icon || iconDefaults[type]}
        </span>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}
