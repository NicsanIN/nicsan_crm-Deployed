import React from 'react';

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  info?: string;
  hint?: string;
  disabled?: boolean;
}

export const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  info,
  hint,
  disabled = false
}) => {
  return (
    <div className="space-y-0.5">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border-2 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {error && <div className="text-xs text-red-500">{error}</div>}
      {info && <div className="text-xs text-blue-600">{info}</div>}
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
    </div>
  );
};

export default LabeledInput;
