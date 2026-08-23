# GESTOR-GASTOS DESIGN SYSTEM

## PROPÓSITO

Esta skill define la identidad visual oficial de `gestor-gastos`.

Todo nuevo diseño, página, componente o modificación visual debe respetar este sistema.

El objetivo es evitar que cada pantalla desarrolle su propio estilo.

---

# PRINCIPIO

`gestor-gastos` debe sentirse como un producto financiero moderno, preciso y profesional.

La interfaz debe transmitir:

* control
* claridad
* confianza
* precisión
* orden
* velocidad
* información financiera

No debe parecer:

* una plantilla administrativa genérica
* un ERP antiguo
* un dashboard corporativo genérico
* una copia de otro producto

---

# PALETA VISUAL

La paleta debe definirse mediante tokens globales.

Nunca utilizar colores arbitrarios directamente dentro de componentes.

Crear una jerarquía basada en:

## Foundation

* background
* surface
* surface-elevated
* surface-hover
* border
* border-subtle

## Typography

* text-primary
* text-secondary
* text-muted
* text-disabled

## Financial states

* positive
* negative
* warning
* info

## Brand

* accent
* accent-hover
* accent-soft

La paleta debe mantener contraste suficiente y funcionar tanto en superficies claras como oscuras si se decide soportar ambas.

---

# REGLA DE COLOR FINANCIERO

Los colores deben comunicar significado.

Ejemplo conceptual:

```text
Ingreso → positivo
Gasto → negativo
Advertencia → warning
Información → info
Balance → neutral/accent
```

No utilizar colores financieros solamente como decoración.

---

# TIPOGRAFÍA

Definir una jerarquía consistente:

```text
display
h1
h2
h3
body
label
caption
numeric
```

Los números financieros deben tener una presentación especialmente clara.

Los valores importantes deben ser fácilmente escaneables.

---

# ESPACIADO

Definir una escala global.

No permitir que cada componente invente valores arbitrarios.

El sistema debe sentirse espacioso sin desperdiciar espacio.

---

# SUPERFICIES

Utilizar una jerarquía clara:

```text
Background
↓
Surface
↓
Elevated Surface
↓
Interactive Surface
```

No llenar toda la interfaz de tarjetas.

Una tarjeta debe existir porque ayuda a agrupar información.

---

# BORDES Y RADIOS

Definir:

```text
sm
md
lg
xl
full
```

Mantener consistencia.

---

# SOMBRAS

Las sombras deben utilizarse con moderación.

Preferir:

* contraste
* separación
* bordes
* profundidad mediante superficies

antes que sombras excesivas.

---

# MOTION

Las animaciones deben ser:

* rápidas
* suaves
* previsibles
* funcionales

Usarlas para:

* navegación
* entrada de contenido
* feedback
* cambios de estado
* interacción

No utilizar animaciones simplemente porque pueden hacerse.

---

# ICONOGRAFÍA

Toda la aplicación debe utilizar una familia coherente de iconos.

No mezclar estilos visuales.

Los iconos deben complementar el contenido y nunca competir con él.

---

# REGLA FUNDAMENTAL

Antes de crear un nuevo estilo:

1. comprobar si ya existe un token
2. comprobar si ya existe un componente
3. reutilizarlo
4. solamente crear una variante cuando exista una necesidad real

El objetivo es un sistema visual coherente, no una colección de excepciones.
