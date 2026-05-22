export function EmptyState({ 
  icon, 
  title, 
  description, 
  action = null,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 lg:py-16 px-4 text-center ${className}`}>
      {icon && (
        <div className="text-purple-300 mb-4 lg:mb-6 p-3 lg:p-4 bg-purple-50 rounded-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 lg:mb-3">
        {title}
      </h3>
      <p className="text-sm lg:text-base text-slate-600 mb-4 lg:mb-6 max-w-sm leading-relaxed">
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
