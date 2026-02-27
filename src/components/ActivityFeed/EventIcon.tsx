interface EventIconProps {
  eventType: string;
}

export function EventIcon({ eventType }: EventIconProps) {
  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'pipeline_run':
        return { icon: '🚀', color: 'bg-blue-100 text-blue-600' };
      case 'pull_request':
        return { icon: '🔄', color: 'bg-green-100 text-green-600' };
      case 'deployment':
        return { icon: '🚀', color: 'bg-purple-100 text-purple-600' };
      case 'build_completed':
        return { icon: '✅', color: 'bg-green-100 text-green-600' };
      case 'build_failed':
        return { icon: '❌', color: 'bg-red-100 text-red-600' };
      case 'test_passed':
        return { icon: '✅', color: 'bg-green-100 text-green-600' };
      case 'test_failed':
        return { icon: '❌', color: 'bg-red-100 text-red-600' };
      default:
        return { icon: '📝', color: 'bg-gray-100 text-gray-600' };
    }
  };

  const { icon, color } = getIconAndColor(eventType);

  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-sm`}>
      {icon}
    </div>
  );
}