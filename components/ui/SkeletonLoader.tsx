/**
 * Skeleton Loader Component (Phase 3)
 * Provides loading placeholders for better UX
 */

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'circle' | 'image';
  count?: number;
  height?: string;
}

export default function SkeletonLoader({
  type = 'card',
  count = 1,
  height = 'h-32',
}: SkeletonLoaderProps) {
  const baseClasses = 'bg-gray-200 rounded animate-pulse';

  const typeClasses = {
    card: `${baseClasses} ${height} w-full`,
    text: `${baseClasses} h-4 w-3/4 mb-2`,
    circle: `${baseClasses} rounded-full w-16 h-16`,
    image: `${baseClasses} ${height} w-full`,
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {type === 'card' && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className={`${baseClasses} h-4 w-1/2`} />
              <div className={`${baseClasses} h-3 w-3/4`} />
              <div className={`${baseClasses} h-3 w-2/3`} />
            </div>
          )}
          {type === 'text' && <div className={typeClasses[type]} />}
          {type === 'circle' && <div className={typeClasses[type]} />}
          {type === 'image' && <div className={typeClasses[type]} />}
        </div>
      ))}
    </div>
  );
}
