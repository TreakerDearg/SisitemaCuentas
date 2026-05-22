export function Input({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  disabled = false,
  className = '',
  error = '',
  ...props 
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-2 text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
        className={`px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200
          ${error ? 'border-red-400 bg-red-50' : 'border-purple-200 bg-white/80 backdrop-blur-lg focus:bg-white'}
          ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}
          placeholder-slate-400
        `}
        {...props}
      />
      {error && (
        <span className="mt-2 text-xs font-medium text-red-600">{error}</span>
      )}
    </div>
  );
}

export function NumberInput({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  min = 0,
  step = '0.01',
  disabled = false,
  className = '',
  error = '',
  ...props 
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-2 text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="number"
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        className={`px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200
          ${error ? 'border-red-400 bg-red-50' : 'border-purple-200 bg-white/80 backdrop-blur-lg focus:bg-white'}
          ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}
          placeholder-slate-400
        `}
        {...props}
      />
      {error && (
        <span className="mt-2 text-xs font-medium text-red-600">{error}</span>
      )}
    </div>
  );
}

export function DateInput({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  disabled = false,
  className = '',
  error = '',
  ...props 
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-2 text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="date"
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200
          ${error ? 'border-red-400 bg-red-50' : 'border-purple-200 bg-white/80 backdrop-blur-lg focus:bg-white'}
          ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}
          placeholder-slate-400
        `}
        {...props}
      />
      {error && (
        <span className="mt-2 text-xs font-medium text-red-600">{error}</span>
      )}
    </div>
  );
}
