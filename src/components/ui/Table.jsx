export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-indigo-100/50 -mx-2 lg:mx-0 px-2 lg:px-0 ${className}`}>
      <table className="min-w-full divide-y divide-indigo-100/50">
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
    <tbody className={`bg-gradient-to-b from-white/60 to-purple-50/30 backdrop-blur-sm divide-y divide-indigo-100/50 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '' }) {
  return (
    <tr className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 cursor-pointer ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 lg:px-6 py-3 lg:py-4 text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  );
}
