# Gestor de Gastos

Aplicación personal para registrar gastos, ingresos y controlar una caja diaria. Desarrollada con Next.js (App Router), React, TailwindCSS, pnpm y MongoDB.

## ✨ Características

- 📊 **Dashboard** - Vista general con resumen diario de ingresos, gastos y balance
- 💰 **Gestor de Gastos** - CRUD completo para gestionar gastos diarios
- 📈 **Gestor de Ingresos** - CRUD completo para gestionar ingresos
- 🏦 **Caja Diaria** - Control de caja con navegación por fechas
- 📜 **Historial** - Búsqueda y filtrado avanzado de transacciones
- ⚙️ **Configuración** - Información del sistema y categorías
- 🎨 **Diseño Moderno** - UI contemporánea con gradientes y glassmorphism
- 📱 **100% Responsive** - Optimizado para móviles y tablets
- 🔐 **CORS Configurado** - Ready para integraciones externas

## 🎨 Diseño y UX

### Paleta de Colores
- **Primario**: Gradiente indigo a purple (`#6366f1` → `#a855f7`)
- **Ingresos**: Verde esmeralda (`#10b981`)
- **Gastos**: Rojo coral (`#ef4444`)
- **Fondo**: Gradiente sutil de slate a purple
- **Componentes**: Efecto glassmorphism con backdrop blur

### Características de UI
- ✨ Glassmorphism en componentes
- 🎯 Animaciones suaves y transiciones
- 📱 Optimizado para touch en móviles
- 🎨 Categorías con colores distintivos
- 🌙 Scrollbar personalizado
- 🔔 Notificaciones toast con iconos

### Responsive
- Sidebar colapsable en móvil
- Tablas con scroll horizontal
- Grid adaptativo para tarjetas
- Tamaños de fuente ajustados
- Botones táctiles optimizados

## 🛠 Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19 + JSX (No TypeScript)
- **Estilos**: TailwindCSS 4
- **Base de datos**: MongoDB con Mongoose
- **Package Manager**: pnpm
- **Despliegue**: Preparado para Vercel

## 📁 Estructura del Proyecto

```
src/
├── app/                      # App Router
│   ├── page.jsx              # Página principal (redirige al dashboard)
│   ├── dashboard/            # Dashboard con resumen
│   ├── gastos/               # Gestión de gastos
│   ├── ingresos/             # Gestión de ingresos
│   ├── caja/                 # Control de caja diaria
│   ├── historial/            # Historial con filtros
│   ├── settings/             # Configuración
│   ├── layout.js             # Layout principal
│   ├── globals.css           # Estilos globales
│   └── api/                  # API Routes
│       ├── transactions/     # Endpoints de transacciones
│       └── transactions/[id]/ # Endpoints individuales
├── components/               # Componentes React
│   ├── layout/               # Layout y Sidebar
│   └── ui/                   # Componentes UI reutilizables
│       ├── Card.jsx
│       ├── Button.jsx
│       ├── Modal.jsx
│       ├── Input.jsx
│       ├── Select.jsx
│       ├── Table.jsx
│       ├── EmptyState.jsx
│       ├── Loading.jsx
│       └── Logo.jsx          # Componente de logo
├── lib/                      # Utilidades y configuraciones
│   └── mongodb.js            # Conexión a MongoDB
├── models/                   # Modelos Mongoose
│   └── Transaction.js        # Modelo de transacción
├── services/                 # Lógica de negocio
│   └── transactionService.js # Servicio de transacciones
└── utils/                    # Utilidades
    ├── format.js             # Formato de moneda y fechas
    └── toast.js              # Sistema de notificaciones
```

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
cd gestor-gastos
pnpm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tu cadena de conexión de MongoDB:

```env
MONGODB_URI=mongodb://localhost:27017/gestor-gastos
```

**Para MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/gestor-gastos
```

**Para MongoDB local:**
```env
MONGODB_URI=mongodb://localhost:27017/gestor-gastos
```

### 3. Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 4. Build para producción

```bash
pnpm build
pnpm start
```

## 🎯 Integración de Logo Personalizado

Para integrar tu propio logo, consulta el archivo [INTEGRACION_LOGO.md](INTEGRACION_LOGO.md) con instrucciones detalladas.

**Resumen rápido:**
1. Coloca tu logo en `public/logo.png`
2. Actualiza `src/components/layout/Sidebar.jsx`:
   ```jsx
   import { LogoWithImage } from '../ui/Logo';
   <LogoWithImage src="/logo.png" size="md" alt="Mi Logo" />
   ```

## 📊 Categorías

### Gastos
- Combustible (gradiente rojo)
- Mantenimiento (gradiente naranja)
- Peajes (gradiente amarillo)
- Compras (gradiente rosa)
- Otros (gradiente gris)

### Ingresos
- Efectivo (gradiente verde)
- Transferencia (gradiente azul)
- Alquiler (gradiente purple)
- Otros (gradiente gris)

## 🔌 API Endpoints

### Transacciones

- `GET /api/transactions` - Obtener todas las transacciones (soporta filtros)
- `POST /api/transactions` - Crear nueva transacción
- `PUT /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción

### CORS Configurado

Todos los endpoints incluyen headers CORS:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Filtros disponibles

- `type` - Filtrar por tipo (income/expense)
- `startDate` - Fecha inicial
- `endDate` - Fecha final
- `search` - Búsqueda por descripción o categoría

## 🌐 Despliegue en Vercel

1. Conecta tu repositorio de GitHub a Vercel
2. Configura la variable de entorno `MONGODB_URI`
3. Haz deploy automáticamente

Vercel detectará automáticamente que es un proyecto Next.js y lo configurará correctamente.

## 🎨 Métodos de Pago

- Efectivo
- Transferencia
- Tarjeta
- Mercado Pago
- Otros

## 📱 Responsive Design

### Optimizaciones Móviles
- Sidebar con menú hamburguesa
- Tablas con scroll horizontal
- Grid de tarjetas adaptativo
- Tamaños de toque optimizados
- Sin zoom en inputs (iOS)
- Scrollbar personalizado

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🧪 Desarrollo

### Linting

```bash
pnpm lint
```

### Estructura de componentes

Los componentes UI están en `src/components/ui/` y son completamente reutilizables:
- Card - Con glassmorphism
- Button - Con gradientes y hover effects
- Modal - Con backdrop blur
- Input - Con focus states animados
- Select - Con estados personalizados
- Table - Con filas hoverables
- EmptyState - Con iconos y acciones
- Loading - Con skeletons animados
- Logo - Placeholder y personalizable

## 🗄️ Base de Datos

El modelo `Transaction` tiene los siguientes campos:

```javascript
{
  type: "income" | "expense",
  category: String,
  amount: Number,
  description: String,
  paymentMethod: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Características de la Interfaz

- ✅ Diseño responsive (mobile-first)
- ✅ Paleta de colores moderna y visible
- ✅ Loading states y skeletons
- ✅ Sistema de notificaciones (toasts)
- ✅ Estados vacíos con acciones sugeridas
- ✅ Confirmación de eliminación
- ✅ Formateo de moneda ARS
- ✅ Manejo de fechas localizado
- ✅ Sidebar colapsable en móvil
- ✅ Modal reutilizables
- ✅ Validación de formularios
- ✅ Animaciones suaves
- ✅ Glassmorphism en componentes
- ✅ CORS configurado en API
- ✅ Scrollbar personalizado

## 🔧 Configuración de CORS

La API tiene CORS completamente configurado para permitir integraciones externas. Todos los endpoints incluyen los headers necesarios para cross-origin requests.

## 📄 License

MIT
