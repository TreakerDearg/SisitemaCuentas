export function EmptyState({ 
  icon, 
  title, 
  description, 
  action = null,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {icon && (
        <div className="text-purple-300 mb-6 p-4 bg-purple-50 rounded-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-800 mb-3">
        {title}
      </h3>
      <p className="text-sm text-slate-600 mb-6 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
