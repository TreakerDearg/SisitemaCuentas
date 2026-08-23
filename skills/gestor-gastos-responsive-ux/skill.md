# GESTOR-GASTOS RESPONSIVE UX

## PROPÓSITO

`gestor-gastos` debe ofrecer una experiencia excelente tanto en teléfonos como en computadoras.

Responsive no significa simplemente:

> "hacer que el desktop entre en una pantalla pequeña".

Cada breakpoint debe tener una experiencia diseñada conscientemente.

---

# PRINCIPIO

Diseñar primero la experiencia y después el breakpoint.

La interfaz debe sentirse natural en:

```text
mobile
tablet
laptop
desktop
large desktop
```

---

# MOBILE

El teléfono debe ser considerado una plataforma principal.

Priorizar:

* información importante
* acciones frecuentes
* navegación sencilla
* botones cómodos
* formularios fáciles de completar
* lectura rápida
* interacción con una mano cuando sea posible

---

# DESKTOP

Desktop debe aprovechar el espacio disponible.

No centrar todo artificialmente dentro de una pequeña columna.

Permitir:

* dashboards amplios
* múltiples columnas
* tablas
* paneles secundarios
* filtros horizontales
* navegación persistente

---

# LAYOUT

El layout debe adaptarse.

Conceptualmente:

```text
MOBILE
Header
Content
Bottom Navigation / Navigation Drawer

DESKTOP
Sidebar
Main Content
Optional Secondary Panel
```

No utilizar el mismo layout rígido en todos los dispositivos.

---

# NAVEGACIÓN

Mobile:

* navegación accesible
* pocas opciones visibles simultáneamente
* acciones principales fácilmente alcanzables

Desktop:

* sidebar persistente cuando corresponda
* jerarquía clara
* posibilidad de navegación rápida

---

# FORMULARIOS

En mobile:

* campos grandes
* spacing cómodo
* inputs apropiados
* botones accesibles
* evitar formularios excesivamente horizontales

En desktop:

* aprovechar columnas
* agrupar campos relacionados
* evitar formularios innecesariamente largos

---

# TABLAS

Desktop puede utilizar tablas.

Mobile debe transformar la información cuando sea necesario.

Ejemplo:

```text
Desktop:
| Fecha | Concepto | Categoría | Método | Monto |

Mobile:

Compra de combustible
Hoy · Combustible
Efectivo
-$25.000
```

El objetivo es conservar la información, no conservar literalmente el componente.

---

# CARDS

No utilizar cards indiscriminadamente.

En desktop pueden organizar información.

En mobile pueden convertirse en bloques compactos.

---

# MODALES

Desktop:

```text
Centered Dialog
```

Mobile:

```text
Bottom Sheet / Full-height Dialog
```

cuando corresponda.

---

# TOUCH

Los elementos táctiles deben tener dimensiones cómodas.

Evitar:

* botones diminutos
* iconos sin área táctil suficiente
* elementos demasiado juntos

---

# PERFORMANCE

Evitar:

* animaciones pesadas
* imágenes innecesarias
* efectos excesivos
* renders innecesarios

La experiencia debe sentirse rápida también en dispositivos modestos.

---

# ORIENTACIÓN

Comprobar:

```text
portrait
landscape
```

cuando afecte la experiencia.

---

# BREAKPOINTS

No diseñar únicamente pensando en:

```text
mobile < 768
desktop > 768
```

Analizar el contenido.

Los breakpoints deben responder a cuándo el layout deja de funcionar.

---

# PRINCIPIO DE CONTENIDO

Nunca ocultar información importante simplemente porque el viewport es pequeño.

En su lugar:

```text
reorganizar
priorizar
colapsar
transformar
```

---

# VALIDACIÓN

Cada nueva pantalla debe probarse al menos conceptualmente en:

```text
360px
390px
430px
768px
1024px
1280px
1440px
1920px
```

No es obligatorio crear layouts específicos para cada tamaño.

Es obligatorio comprobar que el diseño no se rompe.

---

# OBJETIVO FINAL

El usuario debe sentir que:

> "Esta aplicación fue diseñada para mi dispositivo."

No:

> "Esta página de escritorio fue comprimida para entrar en mi teléfono."
