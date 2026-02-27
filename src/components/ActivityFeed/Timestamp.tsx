import { formatDistanceToNow } from 'date-fns';

interface TimestampProps {
  timestamp: string;
}

export function Timestamp({ timestamp }: TimestampProps) {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <span className="text-xs text-gray-500" title={new Date(timestamp).toLocaleString()}>
      {timeAgo}
    </span>
  );
}

// Fallback if date-fns is not available
function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return options?.addSuffix ? 'just now' : 'now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    const suffix = options?.addSuffix ? ' ago' : '';
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'}${suffix}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const suffix = options?.addSuffix ? ' ago' : '';
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'}${suffix}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  const suffix = options?.addSuffix ? ' ago' : '';
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'}${suffix}`;
}