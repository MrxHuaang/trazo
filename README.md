# Sostén

App móvil de consulta psicológica con programa solidario post-sismo (Pereira, 2026).
Proyecto de la asignatura Desarrollo Móvil, Universidad Visión de las Américas.

- **Stack:** React Native 0.88 · Expo SDK 58 · Expo Router · TypeScript estricto
- **Diseño:** sistema visual *Trazo suave* (bloques pastel + línea de sismógrafo, solo modo claro)
- **Destino:** iPhone (Expo Go) · **Pruebas:** emulador Pixel 8 (Android)

## Empezar

```bash
npm install
npx expo start          # tecla "a" abre el emulador Pixel 8 con Expo Go
npx expo start --web    # vista previa en el navegador
```

## Calidad

```bash
npm run typecheck
npm run lint
```

## Estructura

```
src/
  app/          rutas de Expo Router (solo composición)
  features/     un módulo por funcionalidad (pantallas, reglas, datos)
  navigation/   pestañas nativas (iOS/Android) y versión web
  theme/        tokens de color, tipografía, forma y fuentes
  ui/           componentes reutilizables del sistema Trazo suave
assets/images/  ícono y splash (Trazo sobre lavanda)
docs/           documento maestro (fuente HTML y build a PDF)
```

Todos los datos de la app son ficticios.
