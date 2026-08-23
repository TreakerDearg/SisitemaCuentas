# GESTOR-GASTOS UI COMPONENTS

## PROPÓSITO

Esta skill establece cómo deben diseñarse y construirse los componentes visuales de `gestor-gastos`.

Los componentes actuales serán considerados una base temporal.

El objetivo es crear una nueva generación de componentes que puedan reemplazar progresivamente los componentes antiguos.

---

# REGLA PRINCIPAL

No modificar un componente viejo simplemente agregándole estilos encima si su arquitectura ya no es adecuada.

Cuando un componente esté obsoleto:

```text
OLD COMPONENT
↓
ANALYZE
↓
NEW COMPONENT
↓
MIGRATE
↓
REMOVE OLD COMPONENT
```

No mantener indefinidamente dos sistemas visuales paralelos.

---

# CAPAS

Los componentes deben dividirse en:

## UI PRIMITIVES

Componentes completamente genéricos:

```text
Button
Input
Select
Dialog
Dropdown
Badge
Tooltip
Tabs
Skeleton
Avatar
Separator
```

No deben conocer conceptos financieros.

---

## SHARED COMPONENTS

Componentes reutilizables a nivel aplicación:

```text
PageHeader
SectionHeader
StatCard
MoneyDisplay
DateDisplay
SearchField
FilterBar
EmptyState
LoadingState
ConfirmDialog
```

---

## DOMAIN COMPONENTS

Componentes específicos:

```text
TransactionCard
TransactionRow
TransactionTypeBadge
ExpenseSummary
IncomeSummary
BalanceOverview
CashSummary
```

---

# COMPONENTES FINANCIEROS

Los componentes financieros deben priorizar:

1. cantidad
2. significado
3. contexto
4. fecha
5. categoría
6. acción

Nunca esconder el valor financiero principal detrás de decoración.

---

# MONEY DISPLAY

Debe existir un componente centralizado para valores monetarios.

Debe soportar conceptualmente:

```text
positive
negative
neutral
large
medium
small
compact
```

Ejemplos:

```text
+$125.000
-$18.500
$106.500
```

La lógica de formato no debe duplicarse en cada página.

---

# COMPONENTES INTERACTIVOS

Todo componente interactivo debe contemplar:

```text
default
hover
active
focus
disabled
loading
error
success
```

Cuando corresponda.

---

# FORMULARIOS

Los formularios deben:

* ser claros
* tener labels visibles
* mostrar errores cerca del campo
* indicar estados de loading
* evitar movimientos bruscos del layout
* funcionar correctamente con teclado
* ser cómodos en móvil

---

# MODALES

Los modales deben utilizarse solamente cuando realmente sean necesarios.

En móvil deben adaptarse.

Un modal de desktop no debe simplemente reducirse.

Cuando corresponda, utilizar una experiencia tipo bottom sheet.

---

# TABLAS

Las tablas deben tener estrategia responsive.

Nunca asumir:

```text
desktop table = mobile table
```

En móvil se puede transformar una fila en:

```text
TransactionCard
```

si mejora la lectura.

---

# EMPTY STATES

Los estados vacíos deben comunicar:

* qué está vacío
* por qué
* qué puede hacer el usuario

No utilizar simplemente:

```text
"No hay datos"
```

---

# LOADING

Crear estados de loading específicos.

Preferir:

```text
Skeleton
```

cuando se conozca la estructura final.

Evitar spinners gigantes como única estrategia.

---

# REEMPLAZO DE COMPONENTES ANTIGUOS

Antes de eliminar un componente:

1. buscar todas sus referencias
2. identificar variantes utilizadas
3. crear equivalente moderno
4. migrar consumidores
5. verificar build
6. eliminar componente antiguo si ya no tiene referencias

---

# REUTILIZACIÓN

No crear componentes duplicados.

Si dos páginas necesitan el mismo comportamiento visual:

```text
CREATE SHARED COMPONENT
```

No copiar y pegar JSX.

---

# COMPONENT API

Los componentes deben tener APIs simples.

Evitar props excesivas.

Si un componente necesita demasiadas props:

```text
detenerse
↓
analizar
↓
dividir responsabilidades
```

---

# PRINCIPIO FINAL

Los componentes deben ser:

**consistentes + reutilizables + accesibles + responsive + fáciles de mantener.**
