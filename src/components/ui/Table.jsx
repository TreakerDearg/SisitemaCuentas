export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-purple-100 ${className}`}>
      <table className="min-w-full divide-y divide-purple-100">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-gradient-to-r from-indigo-50 to-purple-50 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`bg-white/60 backdrop-blur-lg divide-y divide-purple-100 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '' }) {
  return (
    <tr className={`hover:bg-purple-50/50 transition-colors duration-200 ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 text-sm text-slate-700 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}
