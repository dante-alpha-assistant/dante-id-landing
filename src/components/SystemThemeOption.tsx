import React from 'react';
import { useSystemThemeDetector } from '../hooks/useSystemThemeDetector';

interface SystemThemeOptionProps {
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function SystemThemeOption({ isSelected, onSelect, disabled = false }: SystemThemeOptionProps) {
  const { systemTheme, supportsSystemTheme, isDetecting } = useSystemThemeDetector();

  if (!supportsSystemTheme) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-400 dark:text-gray-500">System</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">Not supported in this browser</p>
          </div>
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled || isDetecting}
      className={`w-full p-4 border rounded-lg transition-colors text-left ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">System</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isDetecting ? (
              'Detecting...'
            ) : (
              `Currently ${systemTheme || 'unknown'}`
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-white border border-gray-300 rounded-full" />
            <div className="w-3 h-3 bg-gray-900 rounded-full" />
          </div>
          <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
            isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {isSelected && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
          </div>
        </div>
      </div>
    </button>
  );
}