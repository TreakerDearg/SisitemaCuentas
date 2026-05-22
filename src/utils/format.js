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
  
  // Remove currency symbols and non-numeric characters except decimal point
  const cleaned = value.toString()
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  
  return parseFloat(cleaned) || 0;
}

export function getCategoryColor(category) {
  const colors = {
    'efectivo': 'bg-gradient-to-r from-emerald-400 to-green-500 text-white',
    'transferencia': 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white',
    'alquiler': 'bg-gradient-to-r from-purple-400 to-violet-500 text-white',
    'combustible': 'bg-gradient-to-r from-red-400 to-rose-500 text-white',
    'mantenimiento': 'bg-gradient-to-r from-orange-400 to-amber-500 text-white',
    'peajes': 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white',
    'compras': 'bg-gradient-to-r from-pink-400 to-rose-500 text-white',
    'otros': 'bg-gradient-to-r from-slate-400 to-gray-500 text-white'
  };
  
  return colors[category] || 'bg-gradient-to-r from-slate-400 to-gray-500 text-white';
}
