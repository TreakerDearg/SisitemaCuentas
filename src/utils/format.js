export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatInputDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function parseCurrency(value) {
  if (!value) return 0;
  
  const cleaned = value.toString()
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  
  return parseFloat(cleaned) || 0;
}

export function getCategoryColor(category) {
  const colors = {
    'efectivo': 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md',
    'transferencia': 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md',
    'alquiler': 'bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow-md',
    'combustible': 'bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md',
    'mantenimiento': 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md',
    'peajes': 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-md',
    'compras': 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md',
    'otros': 'bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-md'
  };
  
  return colors[category] || 'bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-md';
}
