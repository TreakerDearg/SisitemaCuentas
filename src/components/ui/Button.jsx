export function Button({ 
  children, 
  onClick, 
  type = 'button',
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = '',
  ...props 
}) {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation relative overflow-hidden';
  
  const variantStyles = {
    primary: 'gradient-primary text-white shadow-glow-sm button-hover focus:ring-indigo-500/50',
    secondary: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 shadow-md button-hover focus:ring-slate-500/50 border border-slate-300',
    danger: 'gradient-danger text-white shadow-glow-sm button-hover focus:ring-rose-500/50',
    success: 'gradient-success text-white shadow-glow-sm button-hover focus:ring-emerald-500/50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100/50 button-hover focus:ring-slate-500/50 border border-transparent',
    outline: 'bg-transparent text-indigo-600 border-2 border-indigo-500 button-hover hover:bg-indigo-50 focus:ring-indigo-500/50',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed transform-none shadow-none' : ''} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 transition-opacity duration-200 hover:opacity-100" />
      )}
    </button>
  );
}
