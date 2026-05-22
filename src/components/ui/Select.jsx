export function Select({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [], 
  required = false,
  disabled = false,
  className = '',
  error = '',
  placeholder = 'Seleccionar...',
  ...props 
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full px-4 py-3 lg:py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 text-base lg:text-base appearance-none cursor-pointer
            ${error 
              ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
              : 'border-indigo-200 bg-gradient-to-br from-white/80 to-purple-50/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-gradient-to-br from-white to-purple-50/80'
            }
            ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''}
            placeholder:text-slate-400
            touch-manipulation
            input-focus
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {!disabled && (
          <>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-xl pointer-events-none">
              <div className="absolute inset-0 rounded-xl border-2 border-indigo-400/0 focus-within:border-indigo-400/30 transition-all duration-200" />
            </div>
          </>
        )}
      </div>
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
