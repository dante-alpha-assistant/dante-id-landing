import React, { useState, useEffect } from 'react';
// Placeholder: TouchableIcon (auto-inlined);
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

interface FilterOption {
  id: string;
  label: string;
  selected: boolean;
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    eventTypes: FilterOption[];
    priorities: FilterOption[];
  };
  onApplyFilters: (filters: any) => void;
}

export function MobileFilterSheet({ 
  isOpen, 
  onClose, 
  filters, 
  onApplyFilters 
}: MobileFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const { mediumImpact, lightImpact } = useHapticFeedback();

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleFilter = (category: 'eventTypes' | 'priorities', id: string) => {
    lightImpact();
    setLocalFilters(prev => ({
      ...prev,
      [category]: prev[category].map(filter => 
        filter.id === id ? { ...filter, selected: !filter.selected } : filter
      )
    }));
  };

  const handleApply = () => {
    mediumImpact();
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    lightImpact();
    const clearedFilters = {
      eventTypes: localFilters.eventTypes.map(f => ({ ...f, selected: false })),
      priorities: localFilters.priorities.map(f => ({ ...f, selected: false }))
    };
    setLocalFilters(clearedFilters);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-xl z-50 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Filter Activities</h3>
          <TouchableIcon
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            onClick={onClose}
            accessibilityLabel="Close filter"
          />
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Event Types */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Event Types</h4>
            <div className="space-y-2">
              {localFilters.eventTypes.map(filter => (
                <label 
                  key={filter.id}
                  className="flex items-center space-x-3 py-2 cursor-pointer"
                  style={{ minHeight: '44px' }} // Touch target
                >
                  <input
                    type="checkbox"
                    checked={filter.selected}
                    onChange={() => toggleFilter('eventTypes', filter.id)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{filter.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Priorities */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Priorities</h4>
            <div className="space-y-2">
              {localFilters.priorities.map(filter => (
                <label 
                  key={filter.id}
                  className="flex items-center space-x-3 py-2 cursor-pointer"
                  style={{ minHeight: '44px' }} // Touch target
                >
                  <input
                    type="checkbox"
                    checked={filter.selected}
                    onChange={() => toggleFilter('priorities', filter.id)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{filter.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleClear}
              className="flex-1 py-3 px-4 text-gray-700 bg-white border border-gray-300 
                rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ minHeight: '48px' }} // Touch target
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-3 px-4 text-white bg-blue-600 
                rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ minHeight: '48px' }} // Touch target
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
function TouchableIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[TouchableIcon]</div>; }
