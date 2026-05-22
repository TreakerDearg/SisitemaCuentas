'use client';

export function Input({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  placeholder = "",
  required = false,
  disabled = false,
  className = '',
  error = '',
  min,
  max,
  step,
  maxLength,
  autoComplete,
  ...props 
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-2 text-sm font-semibold text-slate-800">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={`w-full px-4 py-3 lg:py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 text-base lg:text-base text-slate-900
          ${error 
            ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
            : 'border-indigo-200 bg-gradient-to-br from-white/90 to-purple-50/70 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-gradient-to-br from-white to-purple-50/90'
          }
          ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''}
          placeholder:text-slate-400
          touch-manipulation
          input-focus
        `}
        {...props}
      />
      {error && (
        <span className="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

export function NumberInput({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder = "",
  required = false,
  disabled = false,
  className = '',
  error = '',
  min = 0,
  max,
  step = "0.01",
  ...props 
}) {
  return (
    <Input 
      label={label}
      name={name}
      type="number"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      error={error}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
}

export function DateInput({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false,
  disabled = false,
  className = '',
  error = '',
  min,
  max,
  ...props 
}) {
  return (
    <Input 
      label={label}
      name={name}
      type="date"
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={className}
      error={error}
      min={min}
      max={max}
      {...props}
    />
  );
}
