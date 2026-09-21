# Operación offline y pruebas de resiliencia

## Estados esperados

- **Online**: las lecturas consultan el servidor y actualizan IndexedDB.
- **Offline**: las lecturas usan IndexedDB; las mutaciones se guardan en la cola.
- **Sincronizando**: el selector muestra `Sincronizando…`.
- **Pendiente**: el selector muestra la cantidad de operaciones pendientes.
- **Fallida**: la operación queda visible en diagnóstico y no se reintenta infinitamente.
- **Conflicto**: se conserva la operación local y el valor del servidor en IndexedDB.

## Checklist manual

1. Abrir la aplicación con conexión y cargar vehículos, categorías y una jornada.
2. Activar modo offline desde las herramientas del navegador.
3. Registrar un ingreso y un gasto.
4. Recargar la página y verificar que la jornada y los movimientos siguen visibles.
5. Tocar `Toque para iniciar la sincronizacion` cuando vuelva la red.
6. Confirmar que las operaciones desaparecen de pendientes.
7. Editar el mismo movimiento en dos pestañas para provocar un conflicto de revisión.
8. Verificar que el conflicto aparece sin sobrescribir silenciosamente el valor del servidor.
9. Cerrar la jornada offline y volver a sincronizar.
10. Repetir con MongoDB no disponible y confirmar que la jornada activa local no desaparece.

## Comandos de validación

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

El build y el lint deben ejecutarse con las variables de entorno de servidor configuradas cuando se evalúen las rutas que usan MongoDB.
