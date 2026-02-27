import React, { useState } from 'react';
import { MobileOptimizedActivity } from '../../types/mobile';
// Placeholder: TouchableIcon (auto-inlined);
// Placeholder: CollapsibleContent (auto-inlined);
// Placeholder: HorizontalScrollContainer (auto-inlined);
import { EventIcon } from '../ActivityFeed/EventIcon';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

interface MobileActivityItemProps {
  activity: MobileOptimizedActivity;
  className?: string;
}

export function MobileActivityItem({ activity, className = '' }: MobileActivityItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { lightImpact } = useHapticFeedback();

  const handleToggle = () => {
    lightImpact();
    setIsExpanded(!isExpanded);
  };

  const priorityColors = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-green-500 bg-green-50'
  };

  return (
    <div 
      className={`border-l-4 ${priorityColors[activity.priority]} 
        bg-white rounded-lg shadow-sm mb-3 overflow-hidden 
        touch-manipulation select-none ${className}`}
    >
      <div 
        className="p-4 cursor-pointer active:bg-gray-50"
        onClick={handleToggle}
        style={{ minHeight: '64px' }} // Minimum touch target height
      >
        <div className="flex items-center space-x-3">
          <TouchableIcon
            icon={<EventIcon type={activity.event_type} className="w-5 h-5" />}
            size="md"
            accessibilityLabel={`${activity.event_type} event`}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <HorizontalScrollContainer className="flex-1 mr-2">
                <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  {activity.project.name}
                </span>
              </HorizontalScrollContainer>
              
              <span className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2">
              {activity.compressed_description || activity.description}
            </p>
          </div>
          
          <div className="ml-2">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      <CollapsibleContent isExpanded={isExpanded}>
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-3 space-y-2">
            <div className="text-xs text-gray-500">
              <strong>Event Type:</strong> {activity.event_type}
            </div>
            <div className="text-xs text-gray-500">
              <strong>Project ID:</strong> {activity.project.id}
            </div>
            <div className="text-xs text-gray-500">
              <strong>Priority:</strong> {activity.priority}
            </div>
            {activity.description !== activity.compressed_description && (
              <div className="text-sm text-gray-700 mt-2">
                <strong>Full Description:</strong><br />
                {activity.description}
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </div>
  );
}
function TouchableIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[TouchableIcon]</div>; }

function CollapsibleContent(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[CollapsibleContent]</div>; }

function HorizontalScrollContainer(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[HorizontalScrollContainer]</div>; }
