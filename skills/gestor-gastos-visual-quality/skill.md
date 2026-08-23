# GESTOR-GASTOS VISUAL QUALITY

## PROPÓSITO

Esta skill funciona como una capa de control de calidad visual.

Antes de considerar terminado cualquier componente o pantalla, debe verificarse su calidad visual, UX y responsive.

---

# PRINCIPIO

Una pantalla funcional no significa que esté terminada.

Debe cumplir simultáneamente:

```text
FUNCTIONAL
+
VISUAL
+
RESPONSIVE
+
ACCESSIBLE
+
CONSISTENT
```

---

# JERARQUÍA VISUAL

Cada pantalla debe responder inmediatamente:

1. ¿Dónde estoy?
2. ¿Qué información estoy viendo?
3. ¿Cuál es el dato más importante?
4. ¿Qué puedo hacer?
5. ¿Qué ocurrió recientemente?

---

# ESPACIADO

Buscar:

* ritmo vertical consistente
* alineación
* espacios suficientes
* ausencia de elementos apretados
* ausencia de espacios desperdiciados

---

# ALINEACIÓN

Elementos relacionados deben compartir:

* líneas
* columnas
* márgenes
* anchuras

La interfaz no debe sentirse accidental.

---

# DENSIDAD

Evitar extremos.

No queremos:

```text
demasiado vacío
```

ni:

```text
todo apretado
```

La densidad debe variar según el contexto.

---

# CONTRASTE

Verificar:

* texto
* fondos
* borders
* estados
* valores positivos
* valores negativos
* disabled

---

# ESTADOS

Toda pantalla debe contemplar:

```text
loading
empty
error
success
normal
```

cuando corresponda.

---

# FEEDBACK

Toda acción importante debe tener respuesta visual.

Ejemplos:

```text
crear movimiento
editar movimiento
eliminar movimiento
guardar configuración
```

El usuario debe saber que su acción fue procesada.

---

# ANIMACIÓN

No utilizar animaciones por decoración.

Preguntar:

> ¿Esta animación mejora la comprensión o la interacción?

Si la respuesta es no, probablemente no sea necesaria.

---

# RESPONSIVE QA

Verificar siempre:

```text
mobile
tablet
desktop
large desktop
```

Comprobar especialmente:

* overflow horizontal
* texto cortado
* botones
* tablas
* modales
* navegación
* formularios
* cards
* gráficos

---

# CONSISTENCIA

Comparar cada nueva pantalla con el Design System.

No permitir:

```text
Button A
Button B
Button C
```

cuando todos representan la misma acción.

Lo mismo aplica a:

* cards
* inputs
* badges
* títulos
* modales
* spacing
* colores

---

# FINANCIAL UX

Los valores financieros deben ser extremadamente fáciles de interpretar.

Distinguir visualmente:

```text
Ingreso
Gasto
Balance
Diferencia
```

Nunca depender únicamente del color.

Utilizar también:

* signo
* iconografía
* etiqueta
* contexto

---

# FINAL CHECK

Antes de marcar una tarea visual como terminada:

### Visual

* [ ] jerarquía correcta
* [ ] spacing consistente
* [ ] colores correctos
* [ ] tipografía correcta
* [ ] iconografía consistente
* [ ] estados visuales

### UX

* [ ] acciones claras
* [ ] feedback
* [ ] loading
* [ ] empty state
* [ ] error state

### Responsive

* [ ] mobile
* [ ] tablet
* [ ] desktop
* [ ] sin overflow
* [ ] touch targets correctos

### Technical

* [ ] componentes reutilizados
* [ ] sin duplicación
* [ ] sin estilos arbitrarios
* [ ] lint
* [ ] build

---

# REGLA FINAL

No aceptar:

> "Funciona."

como criterio suficiente.

El criterio debe ser:

> **Funciona, se entiende, se siente bien y funciona igual de bien en teléfono y computadora.**
