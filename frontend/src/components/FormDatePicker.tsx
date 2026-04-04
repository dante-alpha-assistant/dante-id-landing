/**
 * Form Date Picker Component
 * Custom date input with terminal styling
 */
import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../utils/cn';

interface FormDatePickerProps {
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

export const FormDatePicker = forwardRef<HTMLInputElement, FormDatePickerProps>(
  ({ label, value, onChange, error, helpText, disabled = false, min, max }, ref) => {
    const inputId = label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-xs font-medium uppercase tracking-wider text-[#33ff00]/70"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            min={min}
            max={max}
            className={cn(
              'w-full px-3 py-2 bg-[#0a0a0a] border font-mono text-sm transition-all duration-150 focus:outline-none focus:ring-1',
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                : 'border-[#33ff00]/30 focus:border-[#33ff00] focus:ring-[#33ff00]/30',
              disabled && 'opacity-50 cursor-not-allowed',
              '[&::-webkit-calendar-picker-indicator]:invert-[0.7] [&::-webkit-calendar-picker-indicator]:hover:invert'
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          />
          <Calendar
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#33ff00]/60 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400 mt-1">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${inputId}-help`} className="text-xs text-[#33ff00]/50 mt-1">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

FormDatePicker.displayName = 'FormDatePicker';
